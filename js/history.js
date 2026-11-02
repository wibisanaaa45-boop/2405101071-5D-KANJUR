import { orderService, PAY, MODEL, ORDER, payBadge, fmtDate } from './orders.js';
import { rupiah } from './storage.js';

async function init() {
  const list = document.getElementById('history-list'); if (!list) return;
  const orders = await orderService.getAll(); let filter = 'all';
  const chips = document.getElementById('status-chips');
  chips.innerHTML = [['all', 'Semua'], ...Object.entries(PAY).map(([k, v]) => [k, v[0]])].map(([k, t]) => `<button class="chip ${k === 'all' ? 'active' : ''}" data-s="${k}">${t}</button>`).join('');
  const render = () => {
    const rows = orders.filter(o => filter === 'all' || o.paymentStatus === filter);
    list.innerHTML = rows.length ? rows.map(o => `<article class="card h-item"><div><h3>${o.code}</h3><span class="muted">${fmtDate(o.createdAt)} · ${MODEL[o.purchaseModel]}</span></div>
      <div class="h-right"><strong>${rupiah(o.total)}</strong>${payBadge(o.paymentStatus)}<button class="btn outline" data-detail="${o.id}">Detail</button></div></article>`).join('')
      : '<div class="empty card"><i data-lucide="receipt"></i><h3>Belum ada transaksi</h3><p>Transaksi yang kamu buat akan muncul di sini.</p><a class="btn" href="catalog.html">Mulai belanja</a></div>';
    window.lucide?.createIcons();
  };
  chips.onclick = e => { const b = e.target.closest('[data-s]'); if (!b) return; filter = b.dataset.s; chips.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c === b)); render(); };
  const dlg = document.getElementById('detail-dialog');
  list.onclick = e => {
    const b = e.target.closest('[data-detail]'); if (!b) return;
    const o = orders.find(x => x.id === b.dataset.detail);
    dlg.querySelector('.dlg-body').innerHTML = `<h2>${o.code}</h2><p class="muted">${fmtDate(o.createdAt)} · ${o.buyerName}</p>
      ${o.items.map(i => `<div class="line"><span>${i.qty}× ${i.name}</span><span>${rupiah(i.price * i.qty)}</span></div>`).join('')}
      <div class="line total"><span>Total</span><span>${rupiah(o.total)}</span></div>
      <p>Pembayaran: ${payBadge(o.paymentStatus)} · Pesanan: ${ORDER[o.orderStatus]}</p>
      ${o.paymentStatus === 'belum_bayar' ? `<a class="btn" href="payment.html?id=${o.id}">Lanjut bayar</a>` : ''}`;
    dlg.showModal();
  };
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
  render();
}
init();
