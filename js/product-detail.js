import { productService, categoryService, productCard, productVisual, stockBadge } from './products.js';
import { cartService } from './cart.js';
import { rupiah, toast } from './storage.js';

async function init() {
  const el = document.getElementById('detail'); if (!el) return;
  const [all, cats] = await Promise.all([productService.getAll(), categoryService.getAll()]);
  const p = all.find(x => x.id === new URLSearchParams(location.search).get('id'));
  if (!p) { el.innerHTML = '<div class="empty card"><i data-lucide="package-x"></i><h3>Produk tidak ditemukan</h3><a class="btn" href="catalog.html">Ke katalog</a></div>'; window.lucide?.createIcons(); return; }
  const names = Object.fromEntries(cats.map(c => [c.id, c.name]));
  let qty = 1; document.title = p.name + ' — Kantin Jujur';
  el.innerHTML = `<div class="detail-img">${productVisual(p)}</div><div class="detail-info">
    <span class="muted">${names[p.categoryId]}</span><h1>${p.name}</h1><p class="detail-price">${rupiah(p.price)}</p>
    ${stockBadge(p.stock)}<p class="muted">${p.description}</p>
    <div class="detail-actions"><div class="qty"><button id="dec" aria-label="Kurangi">−</button><span id="qv">1</span><button id="inc" aria-label="Tambah">+</button></div>
    <button class="btn" id="add" ${p.stock <= 0 ? 'disabled' : ''}><i data-lucide="shopping-bag"></i>Tambah ke keranjang</button></div></div>`;
  const set = n => { qty = Math.max(1, Math.min(p.stock || 1, n)); document.getElementById('qv').textContent = qty; };
  document.getElementById('dec').onclick = () => set(qty - 1);
  document.getElementById('inc').onclick = () => set(qty + 1);
  document.getElementById('add').onclick = () => { const r = cartService.add(p.id, qty, p.stock); toast(r.ok ? `${qty}× ${p.name} masuk keranjang` : r.msg, r.ok ? 'success' : 'warning'); };
  const rec = all.filter(x => x.active && x.id !== p.id).sort((a, b) => (b.categoryId === p.categoryId) - (a.categoryId === p.categoryId)).slice(0, 4);
  document.getElementById('rec-grid').innerHTML = rec.map(x => productCard(x, names[x.categoryId])).join('');
  window.lucide?.createIcons();
}
init();
