// Dá nomes aos elementos para poder referenciá-los depois

const loginForm = document.getElementById('loginForm');         // O formulário completo
const messageElement = document.getElementById('message');      // Parágrafo para mensagens de feedback
const container = document.querySelector('.container');         // Container principal (para efeitos visuais)

// Este código é executado quando o aluno clica no botão "Entrar como Aluno"
// addEventListener() "escuta" eventos que acontecem na página
// 'submit' é o evento disparado quando um formulário é enviado

loginForm.addEventListener('submit', async (event) => {
    // Por padrão, quando um formulário é enviado, a página recarrega
    // preventDefault() impede isso, permitindo controlar o que acontece
    event.preventDefault();

    // Adiciona classe CSS que pode mostrar um spinner ou escurecer a tela
    // Isso indica ao usuário que algo está acontecendo
    container.classList.add('loading');

    // Pega os valores que o usuário digitou nos campos
    // event.target é o formulário que foi enviado
    const email = event.target.email.value;    // Valor do campo com name="email"
    const senha = event.target.senha.value;    // Valor do campo com name="senha"

    // Remove mensagens de tentativas anteriores para manter a interface limpa
    messageElement.textContent = '';    // Remove o texto
    messageElement.className = '';      // Remove classes CSS (cores)

    try {
        // Esta parte envia os dados para o servidor e aguarda a resposta
        // 'await' pausa a execução até o servidor responder
        // 'fetch' é a função moderna para fazer requisições HTTP

        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',                                     // POST é usado para enviar dados
            headers: { 'Content-Type': 'application/json' },    // Informa que estamos enviando JSON
            body: JSON.stringify({ email, senha })              // Converte dados para formato JSON
        });

        // Converte a resposta do servidor de JSON para objeto JavaScript
        const data = await response.json();

        // Remove o efeito de carregamento assim que a resposta chega
        container.classList.remove('loading');

        if (response.ok) {
            // response.ok é true quando o status HTTP indica sucesso (200, 201, etc.)

            messageElement.textContent = 'Login realizado com sucesso!';
            messageElement.classList.add('success');   // Classe CSS para cor verde

            // localStorage salva dados no navegador que persistem entre sessões
            // É como uma "memória" que lembra que o usuário está logado
            localStorage.setItem('authToken', data.token);          // Token de autenticação (chave de acesso)
            localStorage.setItem('userType', data.usuario.tipo);    // Tipo de usuário (aluno, professor, etc.)

            // Após meio segundo, leva o usuário para o portal do aluno
            setTimeout(() => {
                window.location.href = 'portal-aluno.html';
            }, 500);

        } else {

            // Mostra a mensagem de erro específica que veio do servidor
            messageElement.textContent = data.error || 'Credenciais inválidas.';
            messageElement.classList.add('error');     // Classe CSS para cor vermelha
        }

    } catch (error) {
        // Este bloco é executado quando há problemas de rede

        container.classList.remove('loading');
        messageElement.textContent = 'Não foi possível conectar ao servidor. Tente novamente mais tarde.';
        messageElement.classList.add('error');
        console.error('Erro de conexão:', error);
    }
});