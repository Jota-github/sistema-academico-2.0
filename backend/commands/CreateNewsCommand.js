// backend/commands/CreateNewsCommand.js
const { queryWithRetry } = require('../db/database');

class CreateNewsCommand {
    constructor(notificationService) {
        // O comando recebe o serviço de notificação (Observer) para usar depois
        this.notificationService = notificationService;
    }

    async execute(data, userId) {
        const { titulo, conteudo, categoria } = data;

        // 1. Validação (Regra de Negócio)
        if (!titulo || !conteudo) {
            throw new Error('Título e conteúdo são obrigatórios.');
        }

        // 2. Persistência (Usando nossa função resiliente)
        const query = `INSERT INTO Noticias (titulo, conteudo, categoria, autor_id) VALUES ($1, $2, $3, $4) RETURNING *;`;
        const result = await queryWithRetry(query, [titulo, conteudo, categoria || 'Geral', userId]);
        
        const novaNoticia = result.rows[0];

        // 3. Notificação (Dispara o Observer)
        if (this.notificationService) {
            this.notificationService.notify(novaNoticia);
        }

        return novaNoticia;
    }
}

module.exports = CreateNewsCommand;