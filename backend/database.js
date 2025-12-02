// backend/db/database.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

// Função auxiliar para esperar
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Estado do Circuit Breaker
const circuitBreaker = {
    state: 'CLOSED',
    failures: 0,
    successes: 0,
    lastFailureTime: 0,
    failureThreshold: 5,
    successThreshold: 2,
    openTimeout: 10000,
    retryDelay: 1500,
    maxRetries: 3
};

// Função wrapper exportada para executar consultas
async function queryWithRetry(queryText, params) {
    if (circuitBreaker.state === 'OPEN') {
        const timeSinceFailure = Date.now() - circuitBreaker.lastFailureTime;
        if (timeSinceFailure < circuitBreaker.openTimeout) {
            throw new Error('Database unavailable (Circuit Breaker OPEN)');
        } else {
            console.log('[Circuit Breaker] Timeout expirado - Mudando para HALF_OPEN.');
            circuitBreaker.state = 'HALF_OPEN';
            circuitBreaker.successes = 0;
        }
    }

    for (let attempt = 1; attempt <= circuitBreaker.maxRetries; attempt++) {
        try {
            // console.log(`[Query Attempt ${attempt}] Executando...`); // Descomente se quiser logs detalhados
            const result = await pool.query(queryText, params);

            if (circuitBreaker.state === 'HALF_OPEN') {
                circuitBreaker.successes++;
                if (circuitBreaker.successes >= circuitBreaker.successThreshold) {
                    console.log('[Circuit Breaker] Fechando o circuito.');
                    circuitBreaker.state = 'CLOSED';
                    circuitBreaker.failures = 0;
                }
            } else {
                circuitBreaker.failures = 0;
            }
            return result;

        } catch (error) {
            console.error(`[Query Attempt ${attempt}] Falha:`, error.message);
            const isRetryableError = ['ECONNREFUSED', 'ETIMEOUT', 'ENOTFOUND', 'EAI_AGAIN', '57P03'].includes(error.code) || error.message.includes('timeout');

            if (isRetryableError) {
                circuitBreaker.failures++;
                circuitBreaker.lastFailureTime = Date.now();

                if (circuitBreaker.state === 'HALF_OPEN') {
                    circuitBreaker.state = 'OPEN';
                    throw new Error(`Falha em HALF_OPEN: ${error.message}`);
                }

                if (circuitBreaker.failures >= circuitBreaker.failureThreshold) {
                    circuitBreaker.state = 'OPEN';
                    throw new Error(`Circuit Breaker ABERTO: ${error.message}`);
                }

                if (attempt < circuitBreaker.maxRetries) {
                    await wait(circuitBreaker.retryDelay);
                } else {
                    throw error;
                }
            } else {
                throw error;
            }
        }
    }
}

// Exporta a função e o pool
module.exports = { queryWithRetry, pool };