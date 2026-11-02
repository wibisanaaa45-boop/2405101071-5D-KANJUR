import { seedProducts, seedCategories } from './seed-data.js';
import { storage, rupiah, base } from './storage.js';

// Service async agar mudah diganti fetch('/api/...') di UAS
const load = () => { const d = storage.get('products', null); if (d) return d; storage.set('products', seedProducts); return seedProducts; };
export const productService = {
  async getAll() { return load(); },
  async getById(id) { return load().find(p => p.id === id) || null; },
  async add(data) { const item = { ...data, id: 'prd-' + Date.now().toString(36) }; storage.set('products', [...load(), item]); return item; },
  async update(id, data) { storage.set('products', load().map(p => p.id === id ? { ...p, ...data } : p)); return this.getById(id); },
  async delete(id) { storage.set('products', load().filter(p => p.id !== id)); return true; },
};
export const categoryService = {
  async getAll() { const d = storage.get('categories', null); if (d) return d; storage.set('categories', seedCategories); return seedCategories; },
  async add(name) { const c = { id: 'cat-' + Date.now().toString(36), name }; storage.set('categories', [...await this.getAll(), c]); return c; },
  async update(id, name) { storage.set('categories', (await this.getAll()).map(c => c.id === id ? { ...c, name } : c)); },
  async delete(id) { storage.set('categories', (await this.getAll()).filter(c => c.id !== id)); },
};

export const productVisual = p => p.image ? `<img src="${p.image}" alt="${p.name}">` : p.emoji;
export function stockBadge(s) {
  if (s <= 0) return '<span class="badge danger">Habis</span>';
  return s <= 5 ? `<span class="badge warning">Sisa ${s}</span>` : `<span class="badge success">Stok ${s}</span>`;
}
export function productCard(p, catName) {
  return `<article class="card product-card">
    <a class="p-img" href="${base()}pages/product-detail.html?id=${p.id}" aria-label="${p.name}">${productVisual(p)}</a>
    <span class="cat">${catName}</span><h3>${p.name}</h3>
    <div class="row"><span class="price">${rupiah(p.price)}</span>${stockBadge(p.stock)}</div>
    <button class="btn sm" data-add="${p.id}" ${p.stock <= 0 ? 'disabled' : ''}><i data-lucide="shopping-bag"></i>${p.stock <= 0 ? 'Habis' : 'Tambah'}</button>
  </article>`;
}

async function initCatalog() {
  const grid = document.getElementById('catalog-grid'); if (!grid) return;
  const [products, cats] = await Promise.all([productService.getAll(), categoryService.getAll()]);
  const names = Object.fromEntries(cats.map(c => [c.id, c.name]));
  const st = { q: '', cat: 'all', price: 'all', sort: 'default' };
  const ranges = { low: [0, 8000], mid: [8001, 15000], high: [15001, Infinity] };
  document.getElementById('cat-chips').innerHTML = [{ id: 'all', name: 'Semua' }, ...cats].map(c => `<button class="chip ${c.id === 'all' ? 'active' : ''}" data-cat="${c.id}">${c.name}</button>`).join('');
  const render = () => {
    const list = products.filter(p => p.active && p.name.toLowerCase().includes(st.q) && (st.cat === 'all' || p.categoryId === st.cat) && (st.price === 'all' || (p.price >= ranges[st.price][0] && p.price <= ranges[st.price][1])));
    if (st.sort === 'asc') list.sort((a, b) => a.price - b.price);
    if (st.sort === 'desc') list.sort((a, b) => b.price - a.price);
    grid.className = list.length ? 'product-grid' : '';
    grid.innerHTML = list.length ? list.map(p => productCard(p, names[p.categoryId])).join('') : '<div class="empty"><i data-lucide="search-x"></i><h3>Produk tidak ditemukan</h3><p>Coba kata kunci atau filter lain.</p></div>';
    window.lucide?.createIcons();
  };
  document.getElementById('q').addEventListener('input', e => { st.q = e.target.value.trim().toLowerCase(); render(); });
  document.getElementById('price').addEventListener('change', e => { st.price = e.target.value; render(); });
  document.getElementById('sort').addEventListener('change', e => { st.sort = e.target.value; render(); });
  document.getElementById('cat-chips').addEventListener('click', e => {
    const b = e.target.closest('[data-cat]'); if (!b) return; st.cat = b.dataset.cat;
    document.querySelectorAll('#cat-chips .chip').forEach(c => c.classList.toggle('active', c === b)); render();
  });
  render();
}
async function initFeatured() {
  const el = document.getElementById('featured-grid'); if (!el) return;
  const [products, cats] = await Promise.all([productService.getAll(), categoryService.getAll()]);
  const names = Object.fromEntries(cats.map(c => [c.id, c.name]));
  el.innerHTML = products.filter(p => p.active && p.popular).slice(0, 4).map(p => productCard(p, names[p.categoryId])).join('');
  window.lucide?.createIcons();
}
initCatalog(); initFeatured();
