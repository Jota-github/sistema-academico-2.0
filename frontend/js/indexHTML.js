// ==================== VARIÁVEIS GLOBAIS ====================
// Variáveis que podem ser usadas em qualquer parte do código JavaScript
// 'let' permite que o valor seja alterado depois
let currentImageIndex = 0;  // Controla qual imagem está sendo mostrada no modal

// 'const' cria uma variável que não pode ser alterada
// querySelectorAll() encontra TODOS os elementos com a classe especificada
const galleryItems = document.querySelectorAll('.gallery-item');

// ==================== CONTROLE DA TELA DE CARREGAMENTO ====================
// Este código é executado quando a página termina de carregar completamente
// 'load' é diferente de 'DOMContentLoaded' - espera imagens, CSS, etc.
window.addEventListener('load', () => {
    // Encontra o elemento da tela de carregamento
    const loading = document.getElementById('loading');

    // setTimeout() executa uma função após um tempo determinado (em milissegundos)
    // 500ms = meio segundo - dá tempo para uma transição suave
    setTimeout(() => {
        // Adiciona a classe 'hidden' que no CSS faz o elemento desaparecer
        loading.classList.add('hidden');
    }, 500);
});

// ==================== EFEITO DE SCROLL NO CABEÇALHO ====================
// Muda a aparência do cabeçalho quando o usuário rola a página
window.addEventListener('scroll', () => {
    const header = document.getElementById('header');

    // window.scrollY retorna quantos pixels o usuário rolou para baixo
    // Se rolou mais de 50 pixels, adiciona a classe 'scrolled'
    // toggle() adiciona a classe se não existir, remove se existir
    header.classList.toggle('scrolled', window.scrollY > 50);
});

// ==================== SISTEMA DE ABAS (NOTÍCIAS/EVENTOS) ====================
// Função que é chamada quando o usuário clica nos botões "Notícias" ou "Eventos"
function showTab(tabName) {
    // PASSO 1: Esconde todos os conteúdos das abas
    document.getElementById('noticias-content').style.display = 'none';
    document.getElementById('eventos-content').style.display = 'none';

    // PASSO 2: Remove a classe 'active' de todos os botões
    // forEach() executa uma função para cada elemento encontrado
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    // PASSO 3: Mostra apenas o conteúdo da aba selecionada
    // 'grid' é o tipo de display usado no CSS para organizar os cards
    document.getElementById(tabName + '-content').style.display = 'grid';

    // PASSO 4: Destaca o botão da aba ativa
    // Template literal (``) permite inserir variáveis dentro de strings
    document.querySelector(`.tab-btn[onclick="showTab('${tabName}')"]`).classList.add('active');
}

// ==================== MENUS EXPANSÍVEIS (ACORDEÃO) ====================
// Função que abre/fecha os menus da sidebar quando clicados
function toggleExpand(element) {
    // 'element' é o cabeçalho que foi clicado
    // nextElementSibling é o próximo elemento irmão (o conteúdo do menu)
    const content = element.nextElementSibling;

    // querySelector() encontra o primeiro elemento que corresponde ao seletor
    // 'span:last-child' encontra o último <span> dentro do elemento (a seta)
    const arrow = element.querySelector('span:last-child');

    // Verifica se o menu já está aberto (tem a classe 'active')
    if (content.classList.contains('active')) {
        // Se está aberto, fecha
        content.classList.remove('active');
        arrow.textContent = '▼';  // Seta para baixo
    } else {
        // Se está fechado, abre
        content.classList.add('active');
        arrow.textContent = '▲';  // Seta para cima
    }
}

// ==================== SISTEMA DE MODAL DA GALERIA ====================
// Funções que controlam a janela de visualização ampliada das imagens

// Função para abrir o modal com uma imagem específica
function openModal(index) {
    // Salva qual imagem está sendo mostrada
    currentImageIndex = index;

    // Encontra os elementos necessários
    const modal = document.getElementById('galleryModal');
    const item = galleryItems[index];  // O item da galeria que foi clicado
    const img = item.querySelector('img');  // A imagem dentro do item
    const overlay = item.querySelector('.gallery-overlay');  // As informações sobre a imagem

    // Atualiza o conteúdo do modal com os dados da imagem clicada
    document.getElementById('modalImage').src = img.getAttribute('data-full') || img.src;
    document.getElementById('modalImage').alt = img.alt;
    document.getElementById('modalTitle').textContent = overlay.querySelector('h4').textContent;
    document.getElementById('modalDescription').textContent = overlay.querySelector('p').textContent;

    // Torna o modal visível
    modal.classList.add('active');

    // Impede que a página de fundo role enquanto o modal está aberto
    document.body.style.overflow = 'hidden';
}

// Função para fechar o modal
function closeModal() {
    document.getElementById('galleryModal').classList.remove('active');
    document.body.style.overflow = 'auto';  // Permite rolar a página novamente
}

// Função para ir para a próxima imagem
function nextImage() {
    // Operador % (módulo) faz o índice voltar ao início quando chega ao fim
    // Se há 6 imagens (0-5), quando chega em 5+1=6, 6%6=0 (volta ao início)
    currentImageIndex = (currentImageIndex + 1) % galleryItems.length;
    openModal(currentImageIndex);
}

// Função para ir para a imagem anterior
function prevImage() {
    // Lógica para voltar, garantindo que não fique negativo
    // Se está em 0 e subtrai 1, fica -1. -1 + 6 = 5 (última imagem)
    currentImageIndex = (currentImageIndex - 1 + galleryItems.length) % galleryItems.length;
    openModal(currentImageIndex);
}

// ==================== FECHAR MODAL CLICANDO NO FUNDO ====================
// Permite fechar o modal clicando na área escura ao redor da imagem
document.getElementById('galleryModal').addEventListener('click', function(e) {
    // e.target é o elemento que foi clicado
    // this é o próprio modal
    // Se clicou no fundo (não na imagem), fecha o modal
    if (e.target === this) closeModal();
});

// ==================== ROLAGEM SUAVE PARA LINKS INTERNOS ====================
// Quando o usuário clica em links que começam com # (como #sobre, #galeria)
// Em vez de "pular" para a seção, rola suavemente
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();  // Impede o comportamento padrão de "pular"

        // Encontra o elemento de destino
        const targetElement = document.querySelector(this.getAttribute('href'));

        if (targetElement) {
            // Calcula a posição considerando a altura do cabeçalho fixo
            // Isso evita que o conteúdo fique escondido atrás do cabeçalho
            const headerHeight = 150;
            const targetPosition = targetElement.offsetTop - headerHeight;

            // Executa a rolagem suave
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'  // Faz a rolagem ser animada
            });
        }
    });
});