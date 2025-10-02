// frontend/js/indexHTML.js (VERSÃO FINAL REFATORADA)

import { apiService } from './apiService.js';

// --- VARIÁVEIS GLOBAIS DO MÓDULO ---
let currentImageIndex = 0;
const galleryItems = document.querySelectorAll('.gallery-item');

// --- DEFINIÇÃO DAS FUNÇÕES ---        

async function carregarUltimaNoticia() {
    const noticiasGrid = document.getElementById('noticias-content');
    if (!noticiasGrid) return; 

    try {
        const noticias = await apiService.getNoticias();    
        if (noticias.length === 0) return;

        const ultimaNoticia = noticias[0];
        const noticiaDinamicaExistente = document.getElementById('noticia-dinamica');
        if (noticiaDinamicaExistente) {
            noticiaDinamicaExistente.remove();
        }

        const article = document.createElement('article');
        article.className = 'news-card';
        article.id = 'noticia-dinamica';

        const dataFormatada = new Date(ultimaNoticia.data_publicacao).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'long', year: 'numeric'
        });

        article.innerHTML = `
            <img src="imagens/noticias-img-04.png" alt="Imagem da notícia publicada">
            <div class="news-content">
                <div class="news-category">${ultimaNoticia.categoria || 'Geral'}</div>
                <div class="news-date">${dataFormatada}</div>
                <h3>${ultimaNoticia.titulo}</h3>
                <p>${ultimaNoticia.conteudo}</p>
            </div>
        `;
        noticiasGrid.appendChild(article);

    } catch (error) {
        console.error('Erro ao buscar notícia:', error);
    }
}

function showTab(tabName) {
    document.getElementById('noticias-content').style.display = 'none';
    document.getElementById('eventos-content').style.display = 'none';
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    const activeTab = document.getElementById(tabName + '-content');
    if (activeTab) activeTab.style.display = 'grid';

    const activeButton = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if(activeButton) activeButton.classList.add('active');
}

function toggleExpand(headerElement) {
    const content = headerElement.nextElementSibling;
    const arrow = headerElement.querySelector('span:last-child');

    if (content.classList.contains('active')) {
        content.classList.remove('active');
        if (arrow) arrow.textContent = '▼';
    } else {
        content.classList.add('active');
        if (arrow) arrow.textContent = '▲';
    }
}

function openModal(index) {
    currentImageIndex = parseInt(index);
    const modal = document.getElementById('galleryModal');
    const item = galleryItems[currentImageIndex];
    if (!modal || !item) return;

    const img = item.querySelector('img');
    const overlay = item.querySelector('.gallery-overlay');

    document.getElementById('modalImage').src = img.getAttribute('data-full') || img.src;
    document.getElementById('modalImage').alt = img.alt;
    document.getElementById('modalTitle').textContent = overlay.querySelector('h4').textContent;
    document.getElementById('modalDescription').textContent = overlay.querySelector('p').textContent;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('galleryModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function nextImage() {
    currentImageIndex = (currentImageIndex + 1) % galleryItems.length;
    openModal(currentImageIndex);
}

function prevImage() {
    currentImageIndex = (currentImageIndex - 1 + galleryItems.length) % galleryItems.length;
    openModal(currentImageIndex);
}

// --- INICIALIZAÇÃO E EVENT LISTENERS ---

// Executa quando o DOM está pronto
document.addEventListener('DOMContentLoaded', () => {
    // Carregamento inicial da página
    const loading = document.getElementById('loading');
    if (loading) {
        setTimeout(() => {
            loading.classList.add('hidden');
        }, 500);
    }
    carregarUltimaNoticia();

    // Efeito de scroll no header
    window.addEventListener('scroll', () => {
        const header = document.getElementById('header');
        if (header) {
            header.classList.toggle('scrolled', window.scrollY > 50);
        }
    });

    // Adiciona eventos de clique para as abas de Notícias/Eventos
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            showTab(button.dataset.tab);
        });
    });

    // Adiciona eventos de clique para os menus expansíveis
    document.querySelectorAll('.expandable-header').forEach(header => {
        header.addEventListener('click', () => {
            toggleExpand(header);
        });
    });

    // Adiciona eventos de clique para os itens da galeria
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            openModal(item.dataset.index);
        });
    });

    // Adiciona eventos de clique para os controles do modal
    document.querySelector('.modal-close')?.addEventListener('click', closeModal);
    document.querySelector('.modal-prev')?.addEventListener('click', prevImage);
    document.querySelector('.modal-next')?.addEventListener('click', nextImage);
    const galleryModal = document.getElementById('galleryModal');
    if (galleryModal) {
        galleryModal.addEventListener('click', (e) => {
            if (e.target === galleryModal) closeModal();
        });
    }

    // Scroll suave para âncoras
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) { 
            e.preventDefault();
            const targetElement = document.querySelector(this.getAttribute('href'));
            if (targetElement) {
                const headerHeight = 150;
                const targetPosition = targetElement.offsetTop - headerHeight;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });
});