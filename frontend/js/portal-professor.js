// PAGINAÇÃO DE ALUNOS MOCKADOS
// PAGINAÇÃO DE ALUNOS

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializa o portal, esperando um 'professor'
    const portal = inicializarPortal('professor', '/login-professor.html');
    if (!portal) return;

    // Seleciona elementos EXCLUSIVOS do portal do professor
    const elements = {
        homeUserName: document.getElementById('homeUserName'),
        homeUserEmail: document.getElementById('homeUserEmail'),
        homeUserType: document.getElementById('homeUserType'),
        homeUserCPF: document.getElementById('homeUserCPF'),
        turmasTableBody: document.querySelector('#turmas-table tbody'),
        todosAlunosTableBody: document.querySelector('#todos-alunos-table tbody'),
        formCadastroAluno: document.getElementById('formCadastroAluno'),
        cadastroMessage: document.getElementById('cadastroMessage'),
        listaAlunosContainer: document.getElementById('listaAlunosContainer'),
        alunosList: document.getElementById('alunosList'),
        boletimAlunoDetalhes: document.getElementById('boletimAlunoDetalhes'),
        boletimAlunoNome: document.getElementById('boletimAlunoNome'),
        boletimAlunoMatricula: document.getElementById('boletimAlunoMatricula'),
        boletimTableBody: document.getElementById('boletimTableBody'),
        btnVoltarLista: document.getElementById('btnVoltarLista'),
        alunosTurmaModal: document.getElementById('alunosTurmaModal'),
        modalTurmaTitle: document.getElementById('modalTurmaTitle'),
        modalAlunosList: document.getElementById('modalAlunosList'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        confirmRemovalModal: document.getElementById('confirmRemovalModal'),
        closeRemovalModalBtn: document.getElementById('closeRemovalModalBtn'),
        studentNameToConfirm: document.getElementById('studentNameToConfirm'),
        studentNameInput: document.getElementById('studentNameInput'),
        confirmRemovalBtn: document.getElementById('confirmRemovalBtn'),
    };

    // --- PAGINAÇÃO DE ALUNOS ---
    let alunosPaginaAtual = 1;
    let alunosTotalPaginas = 1;
    const alunosPorPagina = 50;
    let tempoProcessamento = 0;

    const verMaisBtn = document.createElement('button');
    verMaisBtn.textContent = 'Ver mais';
    verMaisBtn.style.margin = '1em auto';
    verMaisBtn.style.display = 'block';
    verMaisBtn.style.padding = '10px 20px';
    verMaisBtn.style.fontSize = '1em';
    verMaisBtn.style.backgroundColor = '#2d6a4f';
    verMaisBtn.style.color = '#fff';
    verMaisBtn.style.border = 'none';
    verMaisBtn.style.borderRadius = '5px';
    verMaisBtn.style.cursor = 'pointer';

    const tempoSpan = document.createElement('span');
    tempoSpan.style.display = 'block';
    tempoSpan.style.margin = '1em 0';
    tempoSpan.style.fontWeight = 'bold';

    async function carregarAlunos(pagina = 1) {
        elements.todosAlunosTableBody.innerHTML = '<tr><td colspan="4">Carregando alunos...</td></tr>';
        try {
            const response = await fetch(`http://localhost:3000/alunos?page=${pagina}&limit=${alunosPorPagina}`, {
                headers: { 'Authorization': `Bearer ${portal.authToken}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar a lista de alunos.');
            const data = await response.json();
            const alunos = data.alunos || [];
            alunosPaginaAtual = data.page;
            alunosTotalPaginas = data.totalPages;
            tempoProcessamento = data.tempo_ms;
            tempoSpan.textContent = `Tempo de processamento: ${tempoProcessamento} ms`;
            if (pagina === 1) elements.todosAlunosTableBody.innerHTML = '';
            if (alunos.length > 0) {
                alunos.forEach(aluno => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${aluno.nome_completo}</td>
                        <td>${aluno.email || 'undefined'}</td>
                        <td>${aluno.matricula || 'N/A'}</td>
                        <td>
                            <button class="action-button btn-remover-aluno" data-aluno-id="${aluno.aluno_id || aluno.usuario_id}" data-aluno-nome="${aluno.nome_completo}" style="background-color: var(--cor-erro); padding: 5px 10px; font-size: 0.8em;">
                                Remover
                            </button>
                        </td>
                    `;
                    elements.todosAlunosTableBody.appendChild(row);
                });
                document.querySelectorAll('.btn-remover-aluno').forEach(button => {
                    button.addEventListener('click', handleRemoveAlunoClick);
                });
            }
            if (alunosPaginaAtual < alunosTotalPaginas) {
                verMaisBtn.disabled = false;
                verMaisBtn.style.display = 'block';
            } else {
                verMaisBtn.style.display = 'none';
            }
        } catch (e) {
            elements.todosAlunosTableBody.innerHTML = `<tr><td colspan="4">Erro ao carregar alunos: ${e.message}</td></tr>`;
        }
    }

    verMaisBtn.onclick = () => {
        verMaisBtn.disabled = true;
        carregarAlunos(alunosPaginaAtual + 1);
    };

    elements.todosAlunosTableBody.parentElement.appendChild(tempoSpan);
    elements.todosAlunosTableBody.parentElement.appendChild(verMaisBtn);

    // --- MODAIS ---
    const openModal = () => elements.alunosTurmaModal.style.display = 'flex';
    const closeModal = () => elements.alunosTurmaModal.style.display = 'none';
    const closeRemovalModal = () => {
        elements.confirmRemovalModal.style.display = 'none';
        elements.studentNameInput.value = '';
        elements.confirmRemovalBtn.disabled = true;
        elements.confirmRemovalBtn.style.backgroundColor = '#ccc';
        elements.confirmRemovalBtn.style.cursor = 'not-allowed';
    };

    // --- FUNÇÕES DE TURMAS E BOLETIM ---
    async function loadProfessorTurmas() {
        elements.turmasTableBody.innerHTML = '<tr><td colspan="5">Carregando turmas...</td></tr>';
        try {
            const response = await fetch('http://localhost:3000/professores/turmas', {
                headers: { 'Authorization': `Bearer ${portal.authToken}` }
            });
            if (!response.ok) throw new Error('Falha na requisição.');
            const turmas = await response.json();
            elements.turmasTableBody.innerHTML = '';
            if (turmas.length > 0) {
                turmas.forEach(turma => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${turma.disciplina_codigo}-${turma.ano}.${turma.semestre}</td>
                        <td>${turma.disciplina_nome}</td>
                        <td>${turma.ano}/${turma.semestre}</td>
                        <td>${turma.horario || 'N/A'}</td>
                        <td><button class="action-button btn-ver-alunos" data-turma-id="${turma.id}" data-turma-nome="${turma.disciplina_nome}" style="padding: 5px 10px; font-size: 0.8em;">Ver Alunos</button></td>
                    `;
                    elements.turmasTableBody.appendChild(row);
                });
                document.querySelectorAll('.btn-ver-alunos').forEach(button => button.addEventListener('click', handleVerAlunosClick));
            } else {
                elements.turmasTableBody.innerHTML = '<tr><td colspan="5">Nenhuma turma encontrada.</td></tr>';
            }
        } catch (e) {
            elements.turmasTableBody.innerHTML = '<tr><td colspan="5">Erro ao carregar turmas.</td></tr>';
        }
    }

    async function handleVerAlunosClick(event) {
        const turmaId = event.target.dataset.turmaId;
        const turmaNome = event.target.dataset.turmaNome;
        elements.modalTurmaTitle.textContent = `Alunos da Turma: ${turmaNome}`;
        elements.modalAlunosList.innerHTML = '<li>Carregando...</li>';
        openModal();
        try {
            const response = await fetch(`http://localhost:3000/turmas/${turmaId}/alunos`, {
                headers: { 'Authorization': `Bearer ${portal.authToken}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar alunos.');
            const alunos = await response.json();
            elements.modalAlunosList.innerHTML = '';
            if (alunos.length > 0) {
                alunos.forEach(aluno => {
                    const li = document.createElement('li');
                    li.textContent = `${aluno.nome_completo} (Matrícula: ${aluno.matricula})`;
                    elements.modalAlunosList.appendChild(li);
                });
            } else {
                elements.modalAlunosList.innerHTML = '<li>Nenhum aluno matriculado nesta turma.</li>';
            }
        } catch (e) {
            elements.modalAlunosList.innerHTML = '<li>Erro ao carregar alunos.</li>';
        }
    }

    async function loadAlunosForBoletim() {
        elements.listaAlunosContainer.style.display = 'block';
        elements.boletimAlunoDetalhes.style.display = 'none';
        elements.alunosList.innerHTML = '<li>Carregando alunos...</li>';
        try {
            const response = await fetch('http://localhost:3000/alunos', {
                headers: { 'Authorization': `Bearer ${portal.authToken}` }
            });
            if (!response.ok) throw new Error('Erro ao carregar.');
            const alunos = await response.json();
            elements.alunosList.innerHTML = '';
            if (alunos.length > 0) {
                alunos.forEach(aluno => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span>${aluno.nome_completo} (${aluno.matricula})</span><button>Ver Boletim</button>`;
                    li.querySelector('button').addEventListener('click', () => viewBoletimAluno(aluno.aluno_id));
                    elements.alunosList.appendChild(li);
                });
            } else {
                elements.alunosList.innerHTML = '<li>Nenhum aluno cadastrado.</li>';
            }
        } catch (e) {
            elements.alunosList.innerHTML = '<li>Erro de conexão.</li>';
        }
    }

    async function viewBoletimAluno(alunoId) {
        elements.listaAlunosContainer.style.display = 'none';
        elements.boletimAlunoDetalhes.style.display = 'block';
        elements.boletimTableBody.innerHTML = '<tr><td colspan="7">Carregando...</td></tr>';
        try {
            const response = await fetch(`http://localhost:3000/boletins/aluno/${alunoId}`, {
                headers: { 'Authorization': `Bearer ${portal.authToken}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar boletim');
            const data = await response.json();
            elements.boletimAlunoNome.textContent = `Boletim de: ${data.aluno.nome_completo}`;
            elements.boletimAlunoMatricula.textContent = data.aluno.matricula || 'N/A';
            elements.boletimTableBody.innerHTML = '';
            if (data.boletim.length > 0) {
                data.boletim.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${item.disciplina_nome}</td>
                        <td>${item.nota1 ?? 'N/A'}</td>
                        <td>${item.nota2 ?? 'N/A'}</td>
                        <td>${item.media_final ?? 'N/A'}</td>
                        <td>${item.frequencia ?? 'N/A'}%</td>
                        <td class="${item.status}">${item.status.charAt(0).toUpperCase() + item.status.slice(1)}</td>
                        <td>${item.ano}/${item.semestre}</td>
                    `;
                    elements.boletimTableBody.appendChild(row);
                });
            } else {
                elements.boletimTableBody.innerHTML = '<tr><td colspan="7">Nenhuma matrícula encontrada.</td></tr>';
            }
        } catch (e) {
            elements.boletimTableBody.innerHTML = '<tr><td colspan="7">Erro ao buscar boletim.</td></tr>';
        }
    }

    // --- REMOÇÃO DE ALUNO ---
    async function handleRemoveAlunoClick(event) {
        const alunoId = event.target.dataset.alunoId;
        const alunoNome = event.target.dataset.alunoNome;
        elements.studentNameToConfirm.textContent = alunoNome;
        elements.confirmRemovalModal.style.display = 'flex';
        elements.studentNameInput.oninput = null;
        elements.confirmRemovalBtn.onclick = null;
        elements.studentNameInput.oninput = () => {
            if (elements.studentNameInput.value === alunoNome) {
                elements.confirmRemovalBtn.disabled = false;
                elements.confirmRemovalBtn.style.backgroundColor = 'var(--cor-erro)';
                elements.confirmRemovalBtn.style.cursor = 'pointer';
            } else {
                elements.confirmRemovalBtn.disabled = true;
                elements.confirmRemovalBtn.style.backgroundColor = '#ccc';
                elements.confirmRemovalBtn.style.cursor = 'not-allowed';
            }
        };
        elements.confirmRemovalBtn.onclick = () => executeRemoval(alunoId);
    }

    async function executeRemoval(alunoId) {
        try {
            const response = await fetch(`http://localhost:3000/alunos/${alunoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${portal.authToken}` }
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                closeRemovalModal();
                carregarAlunos(1);
            } else {
                throw new Error(data.error || 'Não foi possível remover o aluno.');
            }
        } catch (err) {
            alert(`Erro: ${err.message}`);
        }
    }

    // --- EVENTOS E INICIALIZAÇÃO ---
    window.onSectionChange = (sectionId) => {
        if (sectionId === 'boletim-alunos') loadAlunosForBoletim();
        if (sectionId === 'gerenciar-turmas') loadProfessorTurmas();
        if (sectionId === 'gerenciar-alunos') carregarAlunos(1);
    };

    elements.formCadastroAluno.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgEl = elements.cadastroMessage;
        msgEl.style.display = 'none';
        const payload = {
            nome_completo: document.getElementById('alunoNomeCompleto').value,
            email: document.getElementById('alunoEmail').value,
            senha: document.getElementById('alunoSenha').value,
            tipo: 'aluno',
            matricula: document.getElementById('alunoMatricula').value || null,
            curso: document.getElementById('alunoCurso').value || null,
            periodo: document.getElementById('alunoPeriodo').value ? parseInt(document.getElementById('alunoPeriodo').value) : null
        };
        try {
            const response = await fetch('http://localhost:3000/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${portal.authToken}` },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            msgEl.textContent = response.ok ? `Aluno ${data.nome_completo} cadastrado!` : (data.error || 'Erro.');
            msgEl.className = `form-message ${response.ok ? 'success' : 'error'}`;
            if (response.ok) {
                e.target.reset();
                carregarAlunos(1);
            }
        } catch (err) {
            msgEl.textContent = 'Erro de conexão.';
            msgEl.className = 'form-message error';
        }
        msgEl.style.display = 'block';
    });

    elements.btnVoltarLista.addEventListener('click', loadAlunosForBoletim);
    elements.closeModalBtn.addEventListener('click', closeModal);
    elements.closeRemovalModalBtn.addEventListener('click', closeRemovalModal);
    window.addEventListener('click', (event) => {
        if (event.target == elements.alunosTurmaModal) closeModal();
        if (event.target == elements.confirmRemovalModal) closeRemovalModal();
    });

    // Carrega dados iniciais do portal
    const userData = await portal.loadUserData();
    if (userData) {
        elements.homeUserName.textContent = userData.nome_completo;
        elements.homeUserEmail.textContent = userData.email;
        elements.homeUserType.textContent = userData.tipo.charAt(0).toUpperCase() + userData.tipo.slice(1);
        elements.homeUserCPF.textContent = userData.professor_info?.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") || 'N/A';
    }
    loadProfessorTurmas();
    carregarAlunos(1);
});