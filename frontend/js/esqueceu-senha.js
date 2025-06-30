// ==================== SELEÇÃO DOS ELEMENTOS HTML ====================
// Encontra e guarda referências aos elementos que serão manipulados
const recoveryForm = document.getElementById('recoveryForm');           // Formulário de recuperação
const messageElement = document.getElementById('message');              // Div para mensagens
const container = document.querySelector('.container');                 // Container principal
const formContainer = document.querySelector('.form-container');       // Container do formulário

// ==================== PROCESSAMENTO DA RECUPERAÇÃO ====================
// Código executado quando o usuário clica em "Enviar Instruções"
recoveryForm.addEventListener('submit', async (event) => {
    // ==================== PASSO 1: PREVENIR COMPORTAMENTO PADRÃO ====================
    event.preventDefault(); // Impede que a página recarregue

    // ==================== PASSO 2: ATIVAR FEEDBACK VISUAL ====================
    container.classList.add('loading'); // Mostra indicador de carregamento

    // ==================== PASSO 3: COLETAR DADOS DO FORMULÁRIO ====================
    const email = event.target.email.value; // Pega o email digitado

    // ==================== PASSO 4: LIMPAR MENSAGENS ANTERIORES ====================
    messageElement.textContent = '';           // Remove texto anterior
    messageElement.className = '';             // Remove classes CSS anteriores
    messageElement.style.display = 'none';    // Esconde a div de mensagem

    try {
        // ==================== COMUNICAÇÃO COM O SERVIDOR ====================
        // Envia requisição para o servidor solicitando recuperação de senha
        const response = await fetch('http://localhost:3000/recuperar-senha', {
            method: 'POST',                                     // POST para enviar dados
            headers: { 'Content-Type': 'application/json' },    // Formato JSON
            body: JSON.stringify({ email })                     // Email em formato JSON
        });

        // Remove indicador de carregamento
        container.classList.remove('loading');

        if (response.ok) {
            // ✅ SUCESSO: Email encontrado e instruções enviadas
            showSuccessState(email);

        } else {
            // ❌ ERRO: Email não encontrado ou outro problema
            let errorMessage = 'Não encontramos nenhuma conta com este email. Verifique o que foi digitado.';

            try {
                // Tenta extrair mensagem de erro específica do servidor
                const data = await response.json();
                if (data.error) errorMessage = data.error;
            } catch (e) {
                // Se não conseguir ler a resposta, mantém mensagem padrão
                console.log('Resposta do servidor não é JSON válido');
            }

            // Mostra mensagem de erro
            messageElement.textContent = errorMessage;
            messageElement.classList.add('error');
            messageElement.style.display = 'block';
        }

    } catch (error) {
        // ==================== TRATAMENTO DE ERRO DE CONEXÃO ====================
        container.classList.remove('loading');
        messageElement.textContent = 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
        messageElement.classList.add('error');
        messageElement.style.display = 'block';

        // Log do erro para debug (apenas em desenvolvimento)
        console.error('Erro de conexão:', error);
    }
});

// ==================== TELA DE SUCESSO ====================
// Função que substitui o formulário por uma tela de confirmação
function showSuccessState(email) {
    // Substitui todo o conteúdo do container do formulário
    // Template literal (``) permite criar HTML multi-linha com variáveis
    formContainer.innerHTML = `
        <div class="form-header">
            <div class="success-icon">✓</div>
            <h2>Email Enviado!</h2>
            <p class="form-subtitle">Instruções de recuperação foram enviadas para:</p>
            <p style="font-weight: 600; color: #228B22; margin-bottom: 2rem;">${email}</p>
        </div>

        <div id="message" class="info">
            <strong>Próximos passos:</strong><br>
            1. Verifique sua caixa de entrada (e spam).<br>
            2. Clique no link de recuperação.<br>
            3. Defina sua nova senha.<br><br>
            <em>O link expira em 1 hora por segurança.</em>
        </div>

        <div class="back-to-login" style="margin-top: 2rem;">
            <a href="login-aluno.html">← Voltar ao login</a>
        </div>

        <div style="text-align: center; margin-top: 1rem;">
            <button onclick="location.reload()"
                    style="background: none; border: none; color: #228B22; text-decoration: underline; cursor: pointer; font-size: 0.9rem;"
                    title="Recarregar a página para tentar enviar novamente">
                Não recebeu o email? Tentar novamente
            </button>
        </div>
    `;
}