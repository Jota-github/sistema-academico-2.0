/**
 * ================================================================================
 * SERVIDOR BACKEND - PORTAL EDUCACIONAL (ALUNO/PROFESSOR)
 * ================================================================================
 * * Este arquivo contém toda a lógica do servidor backend para o sistema de portal
 * educacional, incluindo autenticação, gestão de usuários, notícias e boletins.
 * * Tecnologias utilizadas:
 * - Node.js + Express.js (servidor web)
 * - PostgreSQL (banco de dados)
 * - JWT (autenticação por tokens)
 * - CORS (controle de acesso entre origens)
 * * Autor: Sistema Portal Educacional
 * Data: 2024
 * ================================================================================
 */

// ================================================================================
// CONFIGURAÇÃO INICIAL E IMPORTAÇÃO DE DEPENDÊNCIAS
// ================================================================================

// Carrega as variáveis de ambiente do arquivo .env para configurações sensíveis
require('dotenv').config();

// Importa as bibliotecas necessárias para o funcionamento do servidor
const express = require('express');        // Framework web para Node.js
const { Pool } = require('pg');           // Cliente PostgreSQL para conexão com BD
const jwt = require('jsonwebtoken');      // Biblioteca para geração e validação de tokens JWT
const cors = require('cors');             // Middleware para controle de CORS

// ================================================================================
// CONFIGURAÇÃO DO SERVIDOR EXPRESS
// ================================================================================

// Cria a instância do servidor Express
const app = express();
const PORTA = 3000; // Porta onde o servidor irá executar

// ================================================================================
// CONFIGURAÇÃO DE MIDDLEWARES
// ================================================================================

/**
 * CORS (Cross-Origin Resource Sharing)
 * Permite que o frontend acesse o backend mesmo estando em domínios diferentes
 */
app.use(cors());

/**
 * Parser JSON
 * Permite que o servidor entenda requisições com corpo em formato JSON
 */
app.use(express.json());

/**
 * SERVIR ARQUIVOS ESTÁTICOS
 * Configura o Express para servir arquivos HTML, CSS, JS da pasta 'public'
 * IMPORTANTE: No container Docker, os arquivos frontend ficam em '/public/'
 */
app.use(express.static(__dirname + '/public')); 

/**
 * ROTA RAIZ - PÁGINA INICIAL
 * Serve o arquivo index.html quando alguém acessa a URL raiz do servidor
 */
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ================================================================================
// CONFIGURAÇÃO DO BANCO DE DADOS POSTGRESQL
// ================================================================================

/**
 * Pool de Conexões PostgreSQL
 * Cria um pool de conexões reutilizáveis para otimizar performance
 * As configurações vêm das variáveis de ambiente (.env)
 */
const pool = new Pool({
    host: process.env.DB_HOST,           // Endereço do servidor de banco
    port: Number(process.env.DB_PORT),   // Porta do PostgreSQL (geralmente 5432)
    user: process.env.DB_USER,           // Usuário do banco
    password: process.env.DB_PASSWORD,   // Senha do banco
    database: process.env.DB_DATABASE,   // Nome da base de dados
});

// ================================================================================
// MIDDLEWARE DE AUTENTICAÇÃO E AUTORIZAÇÃO JWT
// ================================================================================

/**
 * MIDDLEWARE DE VERIFICAÇÃO DE TOKEN
 * * Esta função verifica se o usuário possui um token JWT válido antes de
 * permitir acesso às rotas protegidas do sistema.
 * * Fluxo de verificação:
 * 1. Extrai o token do cabeçalho Authorization
 * 2. Valida o formato "Bearer TOKEN"
 * 3. Verifica a assinatura e validade do token
 * 4. Decodifica os dados do usuário e adiciona ao objeto req
 * * @param {Object} req - Objeto de requisição HTTP
 * @param {Object} res - Objeto de resposta HTTP  
 * @param {Function} next - Função para continuar para próximo middleware
 */
function verificarTokenEAutorizacao(req, res, next) {
    // Extrai o cabeçalho de autorização
    const authHeader = req.headers['authorization'];
    
    // Verifica se o cabeçalho foi fornecido
    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido. Acesso negado.' });
    }
    
    // Extrai o token do formato "Bearer TOKEN"
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Formato de token inválido. Acesso negado.' });
    }
    
    try {
        // Verifica e decodifica o token usando a chave secreta
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Adiciona os dados do usuário ao objeto de requisição
        req.usuario = decoded;
        
        // Continua para o próximo middleware/rota
        next();
    } catch (error) {
        console.error('Erro na verificação do token:', error);
        
        // Trata diferentes tipos de erro de token
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({ error: 'Token expirado. Faça login novamente.' });
        }
        return res.status(403).json({ error: 'Token inválido. Acesso negado.' });
    }
}

// ================================================================================
// ROTAS DE CADASTRO E AUTENTICAÇÃO
// ================================================================================

/**
 * ROTA: CADASTRO DE NOVOS USUÁRIOS
 * POST /usuarios
 * * Permite que professores cadastrem novos usuários (alunos ou professores).
 * Utiliza transações para garantir consistência dos dados.
 * * IMPORTANTE: Apenas professores podem cadastrar novos usuários
 * ATENÇÃO: Senhas são armazenadas em texto puro (não recomendado para produção)
 */
app.post('/usuarios', verificarTokenEAutorizacao, async (req, res) => {
    // Verifica se o usuário logado é um professor
    if (req.usuario.tipo !== 'professor') {
        return res.status(403).json({ error: 'Apenas professores podem cadastrar novos usuários.' });
    }
    
    // Extrai os dados do corpo da requisição
    const { nome_completo, email, senha, tipo, cpf, matricula, curso, periodo } = req.body;
    
    // Validação dos campos obrigatórios
    if (!nome_completo || !email || !senha || !tipo) {
        return res.status(400).json({ error: 'Campos obrigatórios (nome, email, senha, tipo) faltando.' });
    }
    
    // Inicia uma conexão com transação para garantir consistência
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Inicia transação
        
        // Insere o usuário na tabela principal
        const usuarioQuery = `INSERT INTO Usuarios (nome_completo, email, senha, tipo) VALUES ($1, $2, $3, $4) RETURNING id, nome_completo, email, tipo;`;
        const novoUsuarioResult = await client.query(usuarioQuery, [nome_completo, email, senha, tipo]);
        const novoUsuario = novoUsuarioResult.rows[0];

        // Insere dados específicos baseado no tipo de usuário
        if (tipo === 'professor') {
            if (!cpf) return res.status(400).json({ error: 'CPF é obrigatório para professor.' });
            // Remove caracteres não numéricos do CPF
            await client.query('INSERT INTO Professores (usuario_id, cpf) VALUES ($1, $2)', [novoUsuario.id, cpf.replace(/\D/g, '')]);
        } else if (tipo === 'aluno') {
            // Define valores padrão se não fornecidos
            const matriculaFinal = matricula || `AUTO-${Date.now()}`;
            const cursoFinal = curso || 'Engenharia de Software';
            const periodoFinal = periodo || 1;
            await client.query('INSERT INTO Alunos (usuario_id, matricula, curso, periodo) VALUES ($1, $2, $3, $4)', [novoUsuario.id, matriculaFinal, cursoFinal, periodoFinal]);
        }

        await client.query('COMMIT'); // Confirma a transação
        res.status(201).json(novoUsuario);
    } catch (error) {
        await client.query('ROLLBACK'); // Desfaz a transação em caso de erro
        
        // Trata erro de duplicação (email ou CPF já existente)
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Email ou CPF já cadastrado.' });
        }
        console.error('Erro ao cadastrar usuário:', error);
        res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
    } finally {
        client.release(); // Libera a conexão
    }
});

/**
 * ROTA: LOGIN DE ALUNO
 * POST /login
 * * Autentica alunos usando email e senha.
 * Retorna um token JWT para acesso às rotas protegidas.
 */
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    
    // Validação dos campos obrigatórios
    if (!email || !senha) { 
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' }); 
    }
    
    try {
        // Busca o usuário pelo email
        const result = await pool.query('SELECT * FROM Usuarios WHERE email = $1', [email]);
        const usuario = result.rows[0];
        
        if (!usuario) { 
            return res.status(404).json({ error: 'Usuário não encontrado.' }); 
        }
        
        // Verifica se é um aluno
        if (usuario.tipo !== 'aluno') { 
            return res.status(403).json({ error: 'Acesso negado. Utilize o portal do professor.' }); 
        }
        
        // ATENÇÃO: Comparação de senha em texto puro (inseguro para produção)
        const senhaCorreta = (senha === usuario.senha); 
        
        if (!senhaCorreta) { 
            return res.status(401).json({ error: 'Senha inválida.' }); 
        }
        
        // Gera o token JWT com dados do usuário
        const tokenPayload = { id: usuario.id, email: usuario.email, tipo: usuario.tipo };
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        // Remove a senha da resposta por segurança
        delete usuario.senha;
        res.status(200).json({ message: 'Login realizado com sucesso!', usuario, token });
    } catch (error) {
        console.error('Erro ao fazer login de aluno:', error);
        res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
    }
});

/**
 * ROTA: LOGIN DE PROFESSOR
 * POST /login/professor
 * * Autentica professores usando CPF e senha.
 * Diferente do login de aluno, utiliza CPF como identificador.
 */
app.post('/login/professor', async (req, res) => {
    const { cpf, senha } = req.body;
    
    if (!cpf || !senha) {
        return res.status(400).json({ error: 'CPF e senha são obrigatórios.' });
    }
    
    try {
        // Query complexa para buscar professor pelo CPF
        const query = `
            SELECT u.* FROM Usuarios u 
            JOIN Professores p ON u.id = p.usuario_id 
            WHERE p.cpf = $1 AND u.tipo = 'professor';
        `;
        const result = await pool.query(query, [cpf.replace(/\D/g, '')]); // Remove formatação do CPF
        const usuario = result.rows[0];
        
        if (!usuario) {
            return res.status(404).json({ error: 'Professor não encontrado com o CPF informado.' });
        }
        
        // Verificação de senha em texto puro
        if (senha !== usuario.senha) {
            return res.status(401).json({ error: 'Senha inválida.' });
        }

        // Gera token JWT para o professor
        const tokenPayload = { id: usuario.id, email: usuario.email, tipo: usuario.tipo };
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        delete usuario.senha;
        res.status(200).json({ message: 'Login de professor realizado com sucesso!', usuario, token });

    } catch (error) {
        console.error('Erro ao fazer login de professor:', error);
        res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
    }
});

// ================================================================================
// ROTAS DE GESTÃO DE USUÁRIOS
// ================================================================================

/**
 * ROTA: BUSCAR DETALHES DE USUÁRIO
 * GET /usuarios/:id
 * * Retorna informações detalhadas de um usuário específico.
 * Inclui dados específicos de aluno ou professor conforme o tipo.
 * * Controle de acesso: Usuário só pode ver seus próprios dados, exceto professores
 */
app.get('/usuarios/:id', verificarTokenEAutorizacao, async (req, res) => {
    const { id } = req.params;
    
    // Verifica se o usuário pode acessar estes dados
    if (req.usuario.id !== parseInt(id) && req.usuario.tipo !== 'professor') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    
    const client = await pool.connect();
    try {
        // Busca dados básicos do usuário
        const queryUsuario = `SELECT id, nome_completo, email, tipo FROM Usuarios WHERE id = $1;`;
        const resultUsuario = await client.query(queryUsuario, [id]);
        const usuario = resultUsuario.rows[0];

        if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });

        let usuarioDetalhes = { ...usuario };
        
        // Adiciona informações específicas baseado no tipo
        if (usuario.tipo === 'aluno') {
            const resultAluno = await client.query(`SELECT matricula, curso, periodo FROM Alunos WHERE usuario_id = $1;`, [id]);
            if (resultAluno.rows.length > 0) usuarioDetalhes.aluno_info = resultAluno.rows[0];
        } else if (usuario.tipo === 'professor') {
            const resultProfessor = await client.query(`SELECT cpf FROM Professores WHERE usuario_id = $1;`, [id]);
            if (resultProfessor.rows.length > 0) usuarioDetalhes.professor_info = resultProfessor.rows[0];
        }
        
        res.status(200).json(usuarioDetalhes);
    } catch (error) {
        console.error('Erro ao buscar detalhes do usuário:', error);
        res.status(500).json({ error: 'Ocorreu um erro interno.' });
    } finally {
        client.release();
    }
});

/**
 * ROTA: ALTERAÇÃO DE SENHA
 * POST /alterar-senha
 * * Permite que usuários autenticados alterem suas senhas.
 * Requer a senha atual para confirmação de segurança.
 */
app.post('/alterar-senha', verificarTokenEAutorizacao, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.usuario.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
    }
    
    const client = await pool.connect();
    try {
        // Busca a senha atual do usuário
        const result = await client.query('SELECT senha FROM Usuarios WHERE id = $1', [userId]);
        const usuario = result.rows[0];
        if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });

        // Verifica se a senha atual está correta
        if (currentPassword !== usuario.senha) {
            return res.status(401).json({ error: 'Senha atual incorreta.' });
        }

        // Atualiza para a nova senha (em texto puro - inseguro)
        await client.query('UPDATE Usuarios SET senha = $1 WHERE id = $2;', [newPassword, userId]);
        res.status(200).json({ message: 'Senha alterada com sucesso!' });
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ error: 'Ocorreu um erro interno.' });
    } finally {
        client.release();
    }
});

// ================================================================================
// SISTEMA DE NOTÍCIAS (CRUD)
// ================================================================================

/**
 * ROTA: CRIAR NOTÍCIA
 * POST /noticias
 * * Permite que professores publiquem notícias no sistema.
 * As notícias são exibidas no portal dos alunos.
 */
app.post('/noticias', verificarTokenEAutorizacao, async (req, res) => {
    // Apenas professores podem publicar notícias
    if (req.usuario.tipo !== 'professor') {
        return res.status(403).json({ error: 'Apenas professores podem publicar notícias.' });
    }
    
    const { titulo, conteudo, categoria } = req.body;
    if (!titulo || !conteudo) {
        return res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });
    }
    
    // Insere a notícia com o ID do professor como autor
    const query = `INSERT INTO Noticias (titulo, conteudo, categoria, autor_id) VALUES ($1, $2, $3, $4) RETURNING *;`;
    const result = await pool.query(query, [titulo, conteudo, categoria || 'Geral', req.usuario.id]);
    res.status(201).json(result.rows[0]);
});

/**
 * ROTA: LISTAR NOTÍCIAS
 * GET /noticias
 * * Retorna todas as notícias publicadas, ordenadas por data.
 * Inclui o nome do autor (professor) de cada notícia.
 */
app.get('/noticias', async (req, res) => {
    const query = `
        SELECT n.id, n.titulo, n.conteudo, n.categoria, n.data_publicacao, u.nome_completo as autor_nome
        FROM Noticias n
        JOIN Usuarios u ON n.autor_id = u.id
        ORDER BY n.data_publicacao DESC;
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
});

// ================================================================================
// SISTEMA DE BOLETINS ESCOLARES
// ================================================================================

/**
 * ROTA: BOLETIM DE ALUNO ESPECÍFICO (PARA PROFESSOR)
 * GET /boletins/aluno/:alunoId
 * * Permite que professores consultem o boletim de qualquer aluno.
 * Retorna todas as disciplinas, notas e frequência do aluno.
 */
app.get('/boletins/aluno/:alunoId', verificarTokenEAutorizacao, async (req, res) => {
    if (req.usuario.tipo !== 'professor') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    
    const { alunoId } = req.params;
    const client = await pool.connect();
    try {
        // Busca informações básicas do aluno
        const alunoQuery = 'SELECT u.nome_completo, a.matricula FROM Usuarios u JOIN Alunos a ON u.id = a.usuario_id WHERE a.id = $1';
        const alunoResult = await client.query(alunoQuery, [alunoId]);
        if (alunoResult.rows.length === 0) return res.status(404).json({ error: 'Aluno não encontrado.' });
        
        // Busca o boletim completo do aluno
        const boletimQuery = `
            SELECT d.nome as disciplina_nome, m.*, t.ano, t.semestre
            FROM Matriculas m
            JOIN Turmas t ON m.turma_id = t.id
            JOIN Disciplinas d ON t.disciplina_id = d.id
            WHERE m.aluno_id = $1 ORDER BY t.ano DESC, t.semestre DESC, d.nome ASC;
        `;
        const boletimResult = await client.query(boletimQuery, [alunoId]);
        res.status(200).json({ aluno: alunoResult.rows[0], boletim: boletimResult.rows });
    } catch (error) {
        console.error('Erro ao buscar boletim do aluno:', error);
        res.status(500).json({ error: 'Ocorreu um erro interno.' });
    } finally {
        client.release();
    }
});

/**
 * ROTA: BOLETIM DO ALUNO LOGADO
 * GET /alunos/boletim
 * * Permite que alunos consultem seu próprio boletim.
 * Retorna apenas as informações do aluno autenticado.
 */
app.get('/alunos/boletim', verificarTokenEAutorizacao, async (req, res) => {
    if (req.usuario.tipo !== 'aluno') {
        return res.status(403).json({ error: 'Apenas alunos podem acessar seu próprio boletim.' });
    }
    
    const client = await pool.connect();
    try {
        // Busca o ID do aluno baseado no usuário logado
        const alunoResult = await client.query('SELECT id FROM Alunos WHERE usuario_id = $1', [req.usuario.id]);
        if (alunoResult.rows.length === 0) return res.status(404).json({ error: 'Dados de aluno não encontrados.' });
        
        const alunoId = alunoResult.rows[0].id;
        
        // Busca o boletim do aluno
        const boletimQuery = `
            SELECT d.nome as disciplina_nome, m.nota1, m.nota2, m.media_final, m.frequencia, m.status
            FROM Matriculas m
            JOIN Turmas t ON m.turma_id = t.id
            JOIN Disciplinas d ON t.disciplina_id = d.id
            WHERE m.aluno_id = $1 ORDER BY d.nome ASC;
        `;
        const boletimResult = await pool.query(boletimQuery, [alunoId]);
        res.status(200).json(boletimResult.rows);
    } catch (error) {
        console.error('Erro ao buscar boletim do aluno:', error);
        res.status(500).json({ error: 'Ocorreu um erro interno.' });
    } finally {
        client.release();
    }
});

// ================================================================================
// ROTAS ADMINISTRATIVAS PARA PROFESSORES
// ================================================================================

/**
 * ROTA: LISTAR TODOS OS ALUNOS
 * GET /alunos
 * * Retorna lista completa de alunos para uso administrativo pelos professores.
 * Necessária para funcionalidades como consulta de boletins.
 */
app.get('/alunos', verificarTokenEAutorizacao, async (req, res) => {
    if (req.usuario.tipo !== 'professor') {
        return res.status(403).json({ error: 'Apenas professores podem acessar esta lista.' });
    }
    
    const query = `
        SELECT u.id as usuario_id, u.nome_completo, u.email, a.id as aluno_id, a.matricula 
        FROM Usuarios u JOIN Alunos a ON u.id = a.usuario_id 
        WHERE u.tipo = 'aluno' ORDER BY u.nome_completo;
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
});

/**
 * ROTA: REMOVER ALUNO (APENAS PROFESSORES)
 * DELETE /alunos/:id
 * * Permite que um professor remova um aluno do sistema.
 * A exclusão na tabela 'Usuarios' aciona o ON DELETE CASCADE para limpar
 * os registros relacionados nas tabelas 'Alunos' e 'Matriculas'.
 */
app.delete('/alunos/:id', verificarTokenEAutorizacao, async (req, res) => {
    // Apenas professores podem remover alunos
    if (req.usuario.tipo !== 'professor') {
        return res.status(403).json({ error: 'Apenas professores podem remover alunos.' });
    }

    const { id } = req.params; // Este é o aluno_id

    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Inicia a transação

        // 1. Encontrar o usuario_id a partir do aluno_id
        const alunoResult = await client.query('SELECT usuario_id FROM Alunos WHERE id = $1', [id]);
        if (alunoResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Aluno não encontrado.' });
        }
        const usuarioId = alunoResult.rows[0].usuario_id;

        // 2. Deletar o registro da tabela Usuarios. O CASCADE cuidará do resto.
        const deleteResult = await client.query('DELETE FROM Usuarios WHERE id = $1', [usuarioId]);

        if (deleteResult.rowCount === 0) {
            // Isso não deve acontecer se o passo 1 funcionou, mas é uma segurança
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Falha ao encontrar o usuário para remover.' });
        }

        await client.query('COMMIT'); // Confirma a transação
        res.status(200).json({ message: 'Aluno removido com sucesso.' });

    } catch (error) {
        await client.query('ROLLBACK'); // Desfaz em caso de erro
        console.error('Erro ao remover aluno:', error);
        res.status(500).json({ error: 'Ocorreu um erro interno ao remover o aluno.' });
    } finally {
        client.release();
    }
});

/**
 * ROTA: TURMAS DO PROFESSOR
 * GET /professores/turmas
 * * Retorna as turmas que o professor logado leciona.
 * Inclui informações da disciplina, ano e semestre.
 */
app.get('/professores/turmas', verificarTokenEAutorizacao, async (req, res) => {
    if (req.usuario.tipo !== 'professor') return res.status(403).json({ error: 'Acesso negado.' });
    
    const professorUsuarioId = req.usuario.id;
    const query = `
        SELECT t.id, d.nome as disciplina_nome, d.codigo as disciplina_codigo, t.ano, t.semestre, t.horario
        FROM Turmas t
        JOIN Disciplinas d ON t.disciplina_id = d.id
        JOIN Professores p ON t.professor_id = p.id
        WHERE p.usuario_id = $1 ORDER BY d.nome;
    `;
    const result = await pool.query(query, [professorUsuarioId]);
    res.status(200).json(result.rows);
});

/**
 * ROTA: ALUNOS DE UMA TURMA
 * GET /turmas/:turmaId/alunos
 * * Retorna os alunos matriculados em uma turma específica.
 * Útil para professores visualizarem suas turmas.
 */
app.get('/turmas/:turmaId/alunos', verificarTokenEAutorizacao, async (req, res) => {
    if (req.usuario.tipo !== 'professor') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    const { turmaId } = req.params;

    try {
        const query = `
            SELECT u.nome_completo, a.matricula
            FROM Usuarios u
            JOIN Alunos a ON u.id = a.usuario_id
            JOIN Matriculas m ON a.id = m.aluno_id
            WHERE m.turma_id = $1
            ORDER BY u.nome_completo;
        `;
        const result = await pool.query(query, [turmaId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar alunos da turma:', error);
        res.status(500).json({ error: 'Erro interno ao buscar alunos.' });
    }
});

// ================================================================================
// SISTEMA DE RECUPERAÇÃO DE SENHA
// ================================================================================

/**
 * ROTA: RECUPERAÇÃO DE SENHA
 * POST /recuperar-senha
 * * Simula o envio de email para recuperação de senha.
 * Em produção, deveria gerar um token temporário e enviar por email real.
 * * NOTA: Por segurança, sempre retorna sucesso, mesmo se o email não existir
 */
app.post('/recuperar-senha', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'O campo email é obrigatório.' });
    
    try {
        // Verifica se o email existe no sistema
        const result = await pool.query('SELECT * FROM Usuarios WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            // Mesmo que não encontre, respondemos com sucesso para não revelar quais emails existem
            return res.status(200).json({ message: 'Se o email estiver cadastrado, um link de recuperação foi enviado.' });
        }
        
        // Simula o envio do email (em produção, usar serviço real de email)
        console.log(`SIMULAÇÃO: Enviando email de recuperação para ${email}`);
        res.status(200).json({ message: 'Se o email estiver cadastrado, um link de recuperação foi enviado.' });

    } catch(error) {
        console.error('Erro na recuperação de senha:', error);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// ================================================================================
// INICIALIZAÇÃO DO SERVIDOR
// ================================================================================

/**
 * INICIALIZAÇÃO DO SERVIDOR
 * * Inicia o servidor Express na porta especificada e exibe mensagem de confirmação.
 * O servidor ficará escutando requisições HTTP nesta porta.
 */
app.listen(PORTA, () => {
    console.log(`🚀 Servidor Portal Educacional rodando na porta ${PORTA}`);
    console.log(`📱 Acesse: http://localhost:${PORTA}`);
    console.log(`📊 Banco de dados: PostgreSQL`);
    console.log(`🔐 Autenticação: JWT`);
});