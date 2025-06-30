// Função que inicializa tudo que é comum aos portais de aluno e professor
function inicializarPortal(userTypeEsperado, redirectUrl) {
    // VERIFICAÇÃO DE AUTENTICAÇÃO
    const authToken = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');

    if (!authToken || userType !== userTypeEsperado) {
        alert('Acesso negado. Por favor, faça o login apropriado.');
        window.location.href = redirectUrl;
        return null; // Para a execução se o acesso for negado
    }

    // SELEÇÃO DE ELEMENTOS COMUNS DO DOM
    const elements = {
        userNameDisplay: document.getElementById('userName'),
        sidebarUserName: document.getElementById('sidebarUserName'),
        sidebarUserEmail: document.getElementById('sidebarUserEmail'),
        sidebarUserType: document.getElementById('sidebarUserType'),
        logoutBtn: document.getElementById('logoutBtn'),
        sidebarLinks: document.querySelectorAll('.sidebar-menu a'),
        contentSections: document.querySelectorAll('.content-section'),
    };

    // FUNCIONALIDADE DE LOGOUT
    elements.logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        alert('Você foi desconectado.');
        window.location.href = '/index.html';
    });

    // SISTEMA DE NAVEGAÇÃO SPA
    function activateSection(sectionId, callback) {
        elements.sidebarLinks.forEach(item => item.classList.remove('active'));
        const link = document.querySelector(`a[data-section="${sectionId}"]`);
        if (link) link.classList.add('active');

        elements.contentSections.forEach(section => section.classList.remove('active'));
        const sectionElement = document.getElementById(sectionId);
        if(sectionElement) sectionElement.classList.add('active');

        // Se uma função de callback for fornecida, execute-a
        if (callback) {
            callback(sectionId);
        }
    }
    
    elements.sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            // A função de callback será definida nos scripts específicos (aluno/professor)
            activateSection(sectionId, window.onSectionChange); 
        });
    });

    // CARREGAMENTO DOS DADOS DO USUÁRIO
    async function loadUserData() {
        try {
            const payload = JSON.parse(atob(authToken.split('.')[1]));
            const response = await fetch(`http://localhost:3000/usuarios/${payload.id}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar dados.');

            const apiUserData = await response.json();

            // Atualiza o cabeçalho e a barra lateral
            const primeiroNome = apiUserData.nome_completo.split(' ')[0];
            const tipoCapitalizado = apiUserData.tipo.charAt(0).toUpperCase() + apiUserData.tipo.slice(1);

            elements.userNameDisplay.textContent = `Olá, ${apiUserData.tipo === 'professor' ? 'Prof. ' : ''}${primeiroNome}!`;
            elements.sidebarUserName.textContent = apiUserData.nome_completo;
            elements.sidebarUserEmail.textContent = apiUserData.email;
            elements.sidebarUserType.textContent = tipoCapitalizado;
            
            return apiUserData; // Retorna os dados para o script específico usar

        } catch (e) {
            alert('Sua sessão é inválida ou expirou.');
            localStorage.clear();
            window.location.href = redirectUrl;
            return null;
        }
    }

    // Retorna as funções e dados que os scripts específicos (aluno/professor) precisarão
    return {
        authToken,
        loadUserData,
        activateSection
    };
}