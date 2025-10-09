document.addEventListener('DOMContentLoaded', async () => {
    // Inicializa o portal, esperando um 'aluno' e definindo a página de redirecionamento
    const portal = inicializarPortal('aluno', '/login-aluno.html');
    if (!portal) return; // Para a execução se a inicialização falhar

    // Seleciona os elementos que são EXCLUSIVOS da página do aluno
    const homeUserName = document.getElementById('homeUserName');
    const homeUserEmail = document.getElementById('homeUserEmail');
    const homeUserType = document.getElementById('homeUserType');
    const homeUserMatricula = document.getElementById('homeUserMatricula');
    const homeUserCurso = document.getElementById('homeUserCurso');
    const homeUserPeriodo = document.getElementById('homeUserPeriodo');
    const boletimTableBody = document.querySelector('#boletim .boletim-table tbody');
    
    // Carrega os dados comuns do usuário e preenche os campos específicos desta página
    const userData = await portal.loadUserData();
    if (userData) {
        homeUserName.textContent = userData.nome_completo;
        homeUserEmail.textContent = userData.email;
        homeUserType.textContent = userData.tipo.charAt(0).toUpperCase() + userData.tipo.slice(1);
        homeUserMatricula.textContent = userData.aluno_info?.matricula || 'N/A';
        homeUserCurso.textContent = userData.aluno_info?.curso || 'N/A';
        homeUserPeriodo.textContent = userData.aluno_info?.periodo ?? 'N/A';
        document.getElementById('matriculaNum').textContent = userData.aluno_info?.matricula || 'N/A';
        document.getElementById('matriculaCurso').textContent = userData.aluno_info?.curso || 'N/A';
        document.getElementById('matriculaPeriodo').textContent = userData.aluno_info?.periodo ?? 'N/A';
    }

    // Função para carregar o boletim (lógica específica do aluno)
    async function loadBoletim() {
        boletimTableBody.innerHTML = `<tr><td colspan="6">Carregando notas...</td></tr>`;
        try {
            const response = await fetch('http://localhost:3000/alunos/boletim', {
                headers: { 'Authorization': `Bearer ${portal.authToken}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar boletim');
            const notas = await response.json();
            boletimTableBody.innerHTML = '';
            if (notas.length > 0) {
                notas.forEach(item => {
                    const row = document.createElement('tr');
                    const statusClass = `status-${item.status}`;
                    row.innerHTML = `
                        <td>${item.disciplina_nome}</td>
                        <td>${item.nota1 ?? 'N/A'}</td>
                        <td>${item.nota2 ?? 'N/A'}</td>
                        <td>${item.media_final ?? 'N/A'}</td>
                        <td>${item.frequencia ?? 'N/A'}%</td>
                        <td class="${statusClass}">${item.status.charAt(0).toUpperCase() + item.status.slice(1)}</td>
                    `;
                    boletimTableBody.appendChild(row);
                });
            } else {
                boletimTableBody.innerHTML = `<tr><td colspan="6">Nenhuma disciplina encontrada.</td></tr>`;
            }
        } catch(e) {
            boletimTableBody.innerHTML = `<tr><td colspan="6">Erro ao carregar suas notas.</td></tr>`;
        }
    }

    // Define o que fazer quando uma seção é trocada
    window.onSectionChange = (sectionId) => {
        if (sectionId === 'boletim') {
            loadBoletim();
        }
    };

    // Lógica para Alterar Senha
    const formAlterarSenha = document.getElementById('formAlterarSenha');
    const senhaMessage = document.getElementById('senhaMessage');
    formAlterarSenha.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        
        senhaMessage.style.display = 'none';
        if (newPassword !== confirmNewPassword) {
            senhaMessage.textContent = 'A nova senha e a confirmação não coincidem.';
            senhaMessage.className = 'error';
            senhaMessage.style.display = 'block';
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/alterar-senha', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${portal.authToken}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await response.json();
            senhaMessage.className = response.ok ? 'success' : 'error';
            senhaMessage.textContent = data.message || data.error;
            if (response.ok) formAlterarSenha.reset();
        } catch (err) {
            senhaMessage.className = 'error';
            senhaMessage.textContent = 'Erro de conexão ao alterar a senha.';
        }
        senhaMessage.style.display = 'block';
    });

    // Carrega o boletim na primeira vez que a página é aberta
    loadBoletim();

    // =======================================================================
    // FUNÇÃO PARA MOSTRAR NOTIFICAÇÃO (PARTE DO OBSERVER - CLIENT SIDE)
    // =======================================================================
    function showNotification(noticia) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = 'notification-toast';
        notification.innerHTML = `
            <h4>Nova Notícia Publicada!</h4>
            <p><strong>${noticia.titulo}</strong></p>
        `;
        
        container.appendChild(notification);
        
        // Adiciona a classe 'show' após um pequeno delay para a animação funcionar
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Remove a notificação após 7 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            // Remove o elemento do DOM após a animação de saída
            setTimeout(() => {
                if(container.contains(notification)) {
                    container.removeChild(notification);
                }
            }, 500);
        }, 7000);
    }


    // =======================================================================
    // LÓGICA DO WEBSOCKET (CLIENTE-SIDE OBSERVER)
    // =======================================================================
    function connectWebSocket() {
        const socket = new WebSocket('ws://localhost:3000/notifications');

        socket.onopen = () => {
            console.log('Conectado ao servidor de notificações (WebSocket).');
        };

        socket.onmessage = (event) => {
            try {
                const novaNoticia = JSON.parse(event.data);
                console.log('Nova notícia recebida:', novaNoticia);
                showNotification(novaNoticia);
            } catch (error) {
                console.error('Erro ao processar a mensagem do WebSocket:', error);
            }
        };

        socket.onclose = () => {
            console.log('Desconectado do servidor de notificações. Tentando reconectar em 5 segundos...');
            setTimeout(connectWebSocket, 5000);
        };

        socket.onerror = (error) => {
            console.error('Erro no WebSocket:', error);
            socket.close();
        };
    }

    // Inicia a conexão WebSocket
    connectWebSocket();
});