import { apiService } from './apiService.js'; // Importa a nossa nova camada de serviço!

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
            // DEPOIS: Chamada simplificada para o apiService
            const data = await apiService.getAlunosPaginado(pagina, alunosPorPagina);
            
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
            // DEPOIS: Chamada simplificada
            const turmas = await apiService.getProfessorTurmas();
            
            elements.turmasTableBody.innerHTML = '';
            if (turmas.length > 0) {
                turmas.forEach(turma => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${turma.disciplina_codigo || 'N/A'}-${turma.ano}.${turma.semestre}</td>
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
            elements.turmasTableBody.innerHTML = `<tr><td colspan="5">Erro ao carregar turmas: ${e.message}</td></tr>`;
        }
    }

    async function handleVerAlunosClick(event) {
        const turmaId = event.target.dataset.turmaId;
        const turmaNome = event.target.dataset.turmaNome;
        elements.modalTurmaTitle.textContent = `Alunos da Turma: ${turmaNome}`;
        elements.modalAlunosList.innerHTML = '<li>Carregando...</li>';
        openModal();
        try {
            // DEPOIS: Chamada simplificada
            const alunos = await apiService.getAlunosDaTurma(turmaId);
            
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
            elements.modalAlunosList.innerHTML = `<li>Erro ao carregar alunos: ${e.message}</li>`;
        }
    }

    // --- REMOÇÃO DE ALUNO ---
    async function executeRemoval(alunoId) {
        try {
            // DEPOIS: Chamada simplificada
            await apiService.removerAluno(alunoId);

            alert('Aluno removido com sucesso.');
            closeRemovalModal();
            carregarAlunos(1); // Recarrega a lista de alunos
        } catch (err) {
            alert(`Erro: ${err.message}`);
        }
    }
    
    // --- LÓGICA DE CADASTRO DE ALUNO ---
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
            // DEPOIS: Chamada simplificada
            const data = await apiService.cadastrarAluno(payload);
            
            msgEl.textContent = `Aluno ${data.nome_completo} cadastrado!`;
            msgEl.className = 'form-message success';
            e.target.reset();
            carregarAlunos(1);
        } catch (err) {
            msgEl.textContent = `Erro: ${err.message}`;
            msgEl.className = 'form-message error';
        }
        msgEl.style.display = 'block';
    });

    // --- LÓGICA DE PUBLICAR NOTÍCIA ---
    const formPublicarNoticia = document.getElementById('formPublicarNoticia');
    const noticiaMessage = document.getElementById('noticiaMessage');

    if(formPublicarNoticia) {
        formPublicarNoticia.addEventListener('submit', async (e) => {
            e.preventDefault();
            noticiaMessage.style.display = 'none';
    
            const payload = {
                titulo: document.getElementById('noticiaTitulo').value,
                conteudo: document.getElementById('noticiaConteudo').value,
                categoria: document.getElementById('noticiaCategoria').value || 'Geral'
            };
    
            try {
                // DEPOIS: Chamada simplificada
                await apiService.postNoticia(payload);
    
                noticiaMessage.textContent = 'Notícia publicada com sucesso!';
                noticiaMessage.className = 'form-message success';
                e.target.reset();
            } catch (err) {
                noticiaMessage.textContent = `Erro: ${err.message}`;
                noticiaMessage.className = 'form-message error';
            }
            noticiaMessage.style.display = 'block';
        });
    }

    // --- Funções e Event Listeners que não usam fetch direto ---
    // (Não precisam de alteração, apenas listados para completude)
    function handleRemoveAlunoClick(event) { /* ...código original... */ }
    async function loadAlunosForBoletim() { /* ...código original... */ }
    async function viewBoletimAluno(alunoId) { /* ...código original... */ }
    window.onSectionChange = (sectionId) => { /* ...código original... */ };
    elements.btnVoltarLista.addEventListener('click', loadAlunosForBoletim);
    elements.closeModalBtn.addEventListener('click', closeModal);
    elements.closeRemovalModalBtn.addEventListener('click', closeRemovalModal);
    window.addEventListener('click', (event) => { /* ...código original... */ });
    
    // --- Carregamento Inicial ---
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