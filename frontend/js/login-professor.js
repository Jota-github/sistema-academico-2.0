// Esta função é chamada automaticamente toda vez que o usuário digita no campo CPF
function formatCPF(input) {
    // 'input' é o campo de texto que o usuário está digitando
    // 'input.value' é o texto atual dentro do campo

    // A expressão regular /\D/g encontra qualquer coisa que não seja dígito (0-9)
    // .replace() substitui essas coisas por nada (remove)
    let value = input.value.replace(/\D/g, '');

    // Cada .replace() adiciona um ponto ou traço na posição correta

    // Adiciona o primeiro ponto após os 3 primeiros dígitos
    // (\d{3})(\d) captura 3 dígitos + 1 dígito
    // '$1.$2' substitui por: primeiro grupo + ponto + segundo grupo
    value = value.replace(/(\d{3})(\d)/, '$1.$2');

    // Adiciona o segundo ponto após mais 3 dígitos
    value = value.replace(/(\d{3})(\d)/, '$1.$2');

    // Adiciona o traço antes dos 2 últimos dígitos
    // (\d{3})(\d{1,2})$ captura 3 dígitos + 1 ou 2 dígitos no final
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

    input.value = value;
}

// Guardamos essas referências em variáveis para usar depois

const loginForm = document.getElementById('loginForm');         // O formulário completo
const messageElement = document.getElementById('message');      // O parágrafo para mensagens
const container = document.querySelector('.container');         // O container principal (para efeitos visuais)

// Este código é executado quando o usuário clica no botão "Entrar"

loginForm.addEventListener('submit', async (event) => {
    // Por padrão, quando um formulário é enviado, a página recarrega
    // preventDefault() impede isso, permitindo que controlemos o que acontece
    event.preventDefault();

    // Adiciona uma classe CSS que pode escurecer a tela ou mostrar um spinner
    container.classList.add('loading');

    // event.target é o formulário que foi enviado
    // .cpf.value pega o valor do campo com name="cpf"
    const cpf = event.target.cpf.value;
    const senha = event.target.senha.value;

    // Isso garante que a interface esteja limpa para a nova tentativa
    messageElement.textContent = '';    // Remove o texto
    messageElement.className = '';      // Remove classes CSS (cores de erro/sucesso)

    try {
        // Esta parte envia os dados para o servidor e espera uma resposta
        // 'await' faz o código esperar até o servidor responder
        // 'fetch' é a função moderna do JavaScript para fazer requisições HTTP

        const response = await fetch('http://localhost:3000/login/professor', {
            method: 'POST',                                     // POST é usado para enviar dados
            headers: { 'Content-Type': 'application/json' },    // Informa que estamos enviando JSON
            body: JSON.stringify({ cpf, senha })              // Converte os dados para formato JSON
        });

        // Converte a resposta do servidor de JSON para objeto JavaScript
        const data = await response.json();

        // Remove o efeito de carregamento assim que a resposta chega
        container.classList.remove('loading');

        // Verifica se o login foi bem-sucedido ou se houve erro

        if (response.ok) {
            // response.ok é true quando o status HTTP é 200 (sucesso)

            messageElement.textContent = 'Login realizado com sucesso!';
            messageElement.className = 'success';   // Classe CSS para cor verde

            // localStorage salva dados no navegador que persistem mesmo após fechar a aba
            // Isso mantém o usuário logado enquanto navega pelo sistema
            localStorage.setItem('authToken', data.token);          // Token de autenticação (como uma "chave")
            localStorage.setItem('userType', data.usuario.tipo);    // Tipo de usuário (professor, aluno, etc.)

            // Após 500 milissegundos (meio segundo), leva o usuário para o portal
            setTimeout(() => {
                window.location.href = 'portal-professor.html';
            }, 500);

        } else {
            // Quando o servidor retorna erro (ex: CPF ou senha incorretos)

            // Mostra a mensagem de erro específica que veio do servidor
            // Se não houver mensagem específica, usa uma mensagem padrão
            messageElement.textContent = data.error || 'Credenciais inválidas.';
            messageElement.className = 'error';     // Classe CSS para cor vermelha
        }

    } catch (error) {
        // Este bloco é executado quando há problemas de rede

        container.classList.remove('loading');
        messageElement.textContent = 'Não foi possível conectar ao servidor.';
        messageElement.className = 'error';

        console.error('Erro de conexão:', error);
    }
});