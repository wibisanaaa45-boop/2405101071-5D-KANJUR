import { base, toast, storage } from './storage.js';
import { cartService } from './cart.js';
import { productService } from './products.js';
import './navigation.js';
import './product-detail.js';
import './checkout.js';
import './payment.js';
import './history.js';

const B = base(), here = location.pathname.split('/').pop() || 'index.html';
const links = [
  ['index.html', 'Home'],
  ['pages/catalog.html', 'Katalog'],
  ['pages/history.html', 'Riwayat Transaksi'],
  ['pages/admin/login.html', 'Admin']
];
const header = document.getElementById('site-header');
header.className = 'site-header';
header.innerHTML = `<div class="container nav">
  <a class="logo" href="${B}index.html"><i data-lucide="leaf"></i>Kantin Jujur</a>
  <nav class="nav-links" aria-label="Navigasi utama">${links.map(([h, t]) => `<a href="${B}${h}" class="${h.endsWith(here) ? 'active' : ''}">${t}</a>`).join('')}</nav>
  <a class="cart-link" href="${B}pages/cart.html" aria-label="Keranjang"><i data-lucide="shopping-cart"></i><span class="cart-badge" id="cart-badge"></span></a>
  <a class="btn nav-cta" href="${B}pages/catalog.html">Mulai Belanja</a>
  <button id="nav-toggle" aria-label="Menu"><i data-lucide="menu"></i></button></div>`;
const S = storage.get('settings', {}), esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const footer = document.getElementById('site-footer');
footer.className = 'site-footer';
footer.innerHTML = `<div class="container footer-grid">
  <div><strong>${esc(S.name || 'Kantin Jujur')}</strong><p>Belanja Mudah, Bayar Jujur.</p></div>
  <div><strong>Lokasi</strong><p>${esc(S.location || 'Area kantin kampus, lantai dasar gedung utama.')}</p>${S.hours ? `<p>${esc(S.hours)}</p>` : ''}</div>
  <div><strong>Kontak</strong><p>${esc(S.contact || 'halo@kantinjujur.com')}</p></div>
  <p class="muted" style="grid-column:1/-1">© ${new Date().getFullYear()} Kantin Jujur · Proyek UTS (simulasi frontend)</p></div>`;

const badge = () => { document.getElementById('cart-badge').textContent = cartService.count() || ''; };
document.addEventListener('cart:change', badge); badge();

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-add]'); if (!b) return;
  const p = await productService.getById(b.dataset.add);
  const r = cartService.add(p.id, 1, p.stock);
  toast(r.ok ? `${p.name} masuk keranjang` : r.msg, r.ok ? 'success' : 'warning');
});
window.lucide?.createIcons();
