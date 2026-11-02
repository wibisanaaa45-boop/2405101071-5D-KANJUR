import { cartService } from './cart.js';
import { productService } from './products.js';
import { orderService, MODEL } from './orders.js';
import { rupiah, toast } from './storage.js';

async function init() {
  const form = document.getElementById('checkout-form'); if (!form) return;
  const all = await productService.getAll();
  const rows = cartService.getItems().map(i => ({ ...i, p: all.find(p => p.id === i.productId) })).filter(r => r.p);
  const wrap = document.getElementById('checkout-wrap');
  if (!rows.length) { wrap.innerHTML = '<div class="empty card"><i data-lucide="shopping-cart"></i><h3>Keranjang masih kosong</h3><a class="btn" href="catalog.html">Ke katalog</a></div>'; window.lucide?.createIcons(); return; }
  const total = rows.reduce((s, r) => s + r.p.price * r.qty, 0);
  document.getElementById('co-items').innerHTML = rows.map(r => `<div class="line"><span>${r.qty}× ${r.p.name}</span><span>${rupiah(r.p.price * r.qty)}</span></div>`).join('');
  document.getElementById('co-total').textContent = rupiah(total);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(form), name = f.get('name').trim(), contact = f.get('contact').trim();
    document.getElementById('err-name').textContent = name.length < 3 ? 'Nama minimal 3 karakter.' : '';
    if (name.length < 3) return;
    const over = rows.find(r => r.qty > r.p.stock);
    if (over) return toast(`Stok ${over.p.name} tinggal ${over.p.stock}. Ubah jumlah di keranjang.`, 'warning');
    const order = await orderService.create({ buyerName: name, buyerContact: contact, purchaseModel: f.get('model'),
      items: rows.map(r => ({ productId: r.p.id, name: r.p.name, price: r.p.price, qty: r.qty })) });
    cartService.clear(); location.href = `payment.html?id=${order.id}`;
  });
}
init();
