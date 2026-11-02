import { storage, rupiah } from './storage.js';
import { productService, productVisual } from './products.js';

// cartService menyimpan [{productId, qty}]; UAS: ganti dengan tabel cart / session
const read = () => storage.get('cart', []);
const write = items => { storage.set('cart', items); document.dispatchEvent(new CustomEvent('cart:change')); };
export const cartService = {
  getItems: read,
  count: () => read().reduce((s, i) => s + i.qty, 0),
  add(productId, qty, stock) {
    const items = read(), it = items.find(i => i.productId === productId), next = (it?.qty || 0) + qty;
    if (next > stock) return { ok: false, msg: `Stok hanya tersisa ${stock}.` };
    if (it) it.qty = next; else items.push({ productId, qty });
    write(items); return { ok: true };
  },
  setQty(productId, qty) { write(read().map(i => i.productId === productId ? { ...i, qty } : i)); },
  remove(productId) { write(read().filter(i => i.productId !== productId)); },
  clear() { write([]); },
};

async function initCartPage() {
  const list = document.getElementById('cart-list'); if (!list) return;
  const sum = document.getElementById('cart-summary'), products = await productService.getAll();
  const render = () => {
    const rows = cartService.getItems().map(i => ({ ...i, p: products.find(p => p.id === i.productId) })).filter(r => r.p);
    if (!rows.length) {
      list.innerHTML = '<div class="empty card"><i data-lucide="shopping-cart"></i><h3>Keranjang masih kosong</h3><p>Pilih makanan dan minuman favoritmu dulu.</p><a class="btn" href="catalog.html">Ke katalog</a></div>';
      sum.hidden = true; window.lucide?.createIcons(); return;
    }
    sum.hidden = false;
    list.innerHTML = rows.map(({ p, qty }) => `<article class="card cart-item" data-id="${p.id}">
      <div class="p-img">${productVisual(p)}</div>
      <div><h3>${p.name}</h3><span class="muted">${rupiah(p.price)} / item</span>
        <div class="ci-meta"><div class="qty"><button data-act="dec" aria-label="Kurangi">−</button><span>${qty}</span><button data-act="inc" aria-label="Tambah">+</button></div>
        <strong>${rupiah(p.price * qty)}</strong><button class="ci-remove" data-act="del">Hapus</button></div></div></article>`).join('');
    document.getElementById('sum-items').textContent = rows.reduce((s, r) => s + r.qty, 0) + ' item';
    document.getElementById('sum-total').textContent = rupiah(rows.reduce((s, r) => s + r.p.price * r.qty, 0));
  };
  list.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const id = b.closest('.cart-item').dataset.id, it = cartService.getItems().find(i => i.productId === id), p = products.find(x => x.id === id);
    if (b.dataset.act === 'del' || (b.dataset.act === 'dec' && it.qty <= 1)) cartService.remove(id);
    else if (b.dataset.act === 'dec') cartService.setQty(id, it.qty - 1);
    else if (it.qty < p.stock) cartService.setQty(id, it.qty + 1);
    render();
  });
  render();
}
initCartPage();
