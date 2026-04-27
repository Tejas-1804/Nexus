import { configureStore, createSlice } from 'https://cdn.jsdelivr.net/npm/@reduxjs/toolkit/+esm';
import { initialBlogs } from './data.js';

// --- REDUX SLICE ---
const nexusSlice = createSlice({
    name: 'nexus',
    initialState: {
        articles: initialBlogs,
        selectedCategory: 'All',
        selectedArticleId: null,
        searchQuery: ''
    },
    reducers: {
        setCategory: (state, action) => { 
            state.selectedCategory = action.payload; 
            state.searchQuery = ''; 
        },
        openArticle: (state, action) => { state.selectedArticleId = action.payload; },
        closeArticle: (state) => { state.selectedArticleId = null; },
        setSearch: (state, action) => { 
            state.searchQuery = action.payload; 
            state.selectedCategory = 'All'; 
        }
    }
});

const { setCategory, openArticle, closeArticle, setSearch } = nexusSlice.actions;
const store = configureStore({ reducer: { nexus: nexusSlice.reducer } });

// --- UI ELEMENTS ---
const elements = {
    hero: document.getElementById('hero-spotlight'),
    grid: document.getElementById('news-grid'),
    tabs: document.getElementById('category-tabs'),
    categoryLinks: document.querySelectorAll('[data-category]'),
    searchInput: document.getElementById('search-input'),
    modal: document.getElementById('article-modal'),
    modalContent: document.getElementById('modal-content'),
    closeModal: document.getElementById('close-modal'),
    feedTitle: document.getElementById('feed-title')
};

// --- RENDER LOGIC ---
function render() {
    const state = store.getState().nexus;
    const { articles, selectedCategory, selectedArticleId, searchQuery } = state;

    // Filter Logic
    let filtered = articles;
    if (searchQuery) {
        filtered = articles.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
        elements.feedTitle.textContent = `Results for "${searchQuery}"`;
    } else {
        filtered = selectedCategory === 'All' ? articles : articles.filter(a => a.category === selectedCategory);
        elements.feedTitle.textContent = selectedCategory === 'All' ? 'Latest Updates' : `${selectedCategory} Spotlight`;
    }

    // Render Hero
    if (filtered.length > 0 && !searchQuery) {
        const h = filtered[0];
        elements.hero.innerHTML = `
            <div class="hero-card" id="hero-card-${h.id}">
                <img src="${h.image}" class="hero-img">
                <div class="hero-overlay">
                    <span class="badge">${h.category}</span>
                    <h1 class="hero-title">${h.title}</h1>
                </div>
            </div>`;
        elements.hero.style.display = 'block';
        document.getElementById(`hero-card-${h.id}`).onclick = () => store.dispatch(openArticle(h.id));
    } else {
        elements.hero.style.display = 'none';
    }

    // Render Grid
    const gridItems = (filtered.length > 0 && !searchQuery) ? filtered.slice(1) : filtered;
    elements.grid.innerHTML = gridItems.map(item => `
        <article class="news-card" id="card-${item.id}">
            <div class="card-img-wrap"><img src="${item.image}" class="card-img"></div>
            <div class="card-content">
                <span class="card-cat">${item.category}</span>
                <h3 class="card-title">${item.title}</h3>
                <p class="card-excerpt">${item.excerpt}</p>
            </div>
        </article>`).join('');
    
    gridItems.forEach(item => {
        const el = document.getElementById(`card-${item.id}`);
        if (el) el.onclick = () => store.dispatch(openArticle(item.id));
    });

    // Update Tabs
    elements.categoryLinks.forEach(btn => btn.classList.toggle('active', btn.dataset.category === selectedCategory));

    // Modal
    if (selectedArticleId) {
        const article = articles.find(a => a.id === selectedArticleId);
        elements.modalContent.innerHTML = `
            <img src="${article.image}" class="modal-hero-img">
            <div class="modal-body">
                <span class="badge">${article.category}</span>
                <h1>${article.title}</h1>
                <p class="modal-text">${article.content}</p>
            </div>`;
        elements.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } else {
        elements.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// --- INITIALIZE & QUERY PARAMS ---
const params = new URLSearchParams(window.location.search);
if (params.get('search')) store.dispatch(setSearch(params.get('search')));
if (params.get('cat')) store.dispatch(setCategory(params.get('cat')));

// Listeners
elements.categoryLinks.forEach(link => {
    link.onclick = (e) => {
        e.preventDefault();
        store.dispatch(setCategory(link.dataset.category));
    };
});
elements.searchInput.onkeypress = (e) => {
    if (e.key === 'Enter') store.dispatch(setSearch(e.target.value));
};
elements.closeModal.onclick = () => store.dispatch(closeArticle());
elements.modal.onclick = (e) => e.target === elements.modal && store.dispatch(closeArticle());

store.subscribe(render);
render();
console.log("Nexus Home Engine Active");
