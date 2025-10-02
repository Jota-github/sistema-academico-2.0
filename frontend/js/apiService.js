// frontend/js/apiService.js

const API_BASE_URL = 'http://localhost:3000'; // URL base centralizada!

/**
 * Função genérica e reutilizável para fazer requisições à API.
 * Ela cuida automaticamente do token de autenticação e do tratamento de erros.
 * @param {string} endpoint - O endpoint da API a ser chamado (ex: '/noticias').
 * @param {object} options - Opções extras para o fetch (method, body, etc.).
 * @returns {Promise<any>} - A resposta da API em formato JSON.
 */
async function request(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    // Adiciona o token de autorização se ele existir
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro na API: ${response.statusText}`);
        }
        
        // Retorna a resposta JSON se houver conteúdo
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json();
        } else {
            // Retorna um sucesso genérico se não houver corpo na resposta (ex: DELETE)
            return { success: true };
        }

    } catch (error) {
        console.error('Erro na requisição da API:', error);
        throw error; // Re-lança o erro para que a função que chamou possa tratá-lo
    }
}

// Exportamos um objeto com todas as funções que nosso aplicativo usará para falar com a API.
// Esta é a nossa camada de serviço!
export const apiService = {
    // Busca todas as notícias
    getNoticias: () => {
        return request('/noticias');
    },
    // Publica uma nova notícia
    postNoticia: (dadosNoticia) => {
        return request('/noticias', {
            method: 'POST',
            body: JSON.stringify(dadosNoticia),
        });
    },
    // Adicione aqui as outras chamadas de API que seu sistema já faz:
    getProfessorTurmas: () => {
        return request('/professores/turmas');
    },
    getAlunosDaTurma: (turmaId) => {
        return request(`/turmas/${turmaId}/alunos`);
    },
    getAlunosPaginado: (pagina = 1, limite = 50) => {
        return request(`/alunos?page=${pagina}&limit=${limite}`);
    },
    cadastrarAluno: (dadosAluno) => {
        return request('/usuarios', {
            method: 'POST',
            body: JSON.stringify(dadosAluno)
        });
    },
    removerAluno: (alunoId) => {
        return request(`/alunos/${alunoId}`, {
            method: 'DELETE'
        });
    }
};