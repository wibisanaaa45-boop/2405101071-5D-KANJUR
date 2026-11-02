import { orderService, PAY, ORDER, MODEL, payBadge, fmtDate } from './orders.js';
import { stockService } from './stock.js';
import { rupiah, toast } from './storage.js';
import { confirmDialog } from './admin-ui.js';

async function initList() {
  const body = document.getElementById('tx-body'); if (!body) return;
  const orders = await orderService.getAll(); let q = '', st = 'all';
  document.getElementById('tx-status').innerHTML = '<option value="all">Semua status</option>' + Object.entries(PAY).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('');
  const render = () => {
    const rows = orders.filter(o => (st === 'all' || o.paymentStatus === st) && (o.code + o.buyerName).toLowerCase().includes(q));
    body.innerHTML = rows.length ? rows.map(o => `<tr><td><strong>${o.code}</strong></td><td>${fmtDate(o.createdAt)}</td><td>${o.buyerName}</td><td>${o.purchaseModel === 'langsung' ? 'Langsung' : 'Via website'}</td><td>${rupiah(o.total)}</td><td>${payBadge(o.paymentStatus)}</td><td>${ORDER[o.orderStatus]}</td><td><a class="btn outline" href="transaction-detail.html?id=${o.id}">Detail</a></td></tr>`).join('')
      : '<tr><td colspan="8" class="muted" style="text-align:center;padding:32px">Transaksi tidak ditemukan.</td></tr>';
  };
  document.getElementById('tx-q').oninput = e => { q = e.target.value.trim().toLowerCase(); render(); };
  document.getElementById('tx-status').onchange = e => { st = e.target.value; render(); };
  render();
}

async function initDetail() {
  const el = document.getElementById('tx-detail'); if (!el) return;
  const id = new URLSearchParams(location.search).get('id');
  const draw = async () => {
    const o = await orderService.getById(id);
    if (!o) { el.innerHTML = '<div class="card panel"><h2>Transaksi tidak ditemukan</h2><a class="btn" href="transactions.html">Kembali</a></div>'; return; }
    const acts = o.paymentStatus === 'menunggu_verifikasi' ? '<button class="btn" id="verify">Verifikasi pembayaran</button><button class="btn danger" id="reject">Tolak pembayaran</button>'
      : o.paymentStatus === 'terverifikasi' && o.orderStatus !== 'selesai' ? '<button class="btn" id="done">Tandai pesanan selesai</button>'
      : o.paymentStatus === 'belum_bayar' ? '<p class="muted">Menunggu pembeli menyelesaikan pembayaran.</p>' : '';
    el.innerHTML = `<div class="detail-grid"><div class="card panel"><h2>${o.code}</h2>
      ${o.items.map(i => `<div class="line"><span>${i.qty}× ${i.name} <span class="muted">@ ${rupiah(i.price)}</span></span><span>${rupiah(i.price * i.qty)}</span></div>`).join('')}
      <div class="line total"><span>Total</span><span>${rupiah(o.total)}</span></div></div>
      <div class="card panel"><h2>Info transaksi</h2><dl class="kv"><dt>Pembeli</dt><dd>${o.buyerName}</dd><dt>Kontak</dt><dd>${o.buyerContact || '-'}</dd><dt>Tanggal</dt><dd>${fmtDate(o.createdAt)}</dd><dt>Model</dt><dd>${MODEL[o.purchaseModel]}</dd>
      <dt>Pembayaran</dt><dd>${payBadge(o.paymentStatus)}</dd><dt>Pesanan</dt><dd>${ORDER[o.orderStatus]}</dd><dt>No. referensi</dt><dd>${o.paymentRef || '-'}</dd><dt>Bukti</dt><dd>${o.proofName || '-'}</dd></dl>
      <div class="actions">${acts}</div><p class="muted" style="font-size:.8rem;margin-top:12px">Verifikasi di sini hanya simulasi dan tidak terhubung ke bank atau QRIS.</p></div></div>
      <a href="transactions.html" class="muted">← Kembali ke daftar</a>`;
    document.getElementById('verify')?.addEventListener('click', async () => {
      if (!await confirmDialog('Verifikasi pembayaran ini? Stok produk dalam pesanan akan dikurangi.', 'Verifikasi', false)) return;
      for (const i of o.items) await stockService.change(i.productId, 'keluar', i.qty, `Transaksi ${o.code}`);
      await orderService.update(o.id, { paymentStatus: 'terverifikasi', orderStatus: 'diproses' }); toast('Pembayaran diverifikasi'); draw();
    });
    document.getElementById('reject')?.addEventListener('click', async () => {
      if (!await confirmDialog('Tolak pembayaran ini? Pesanan akan dibatalkan.', 'Tolak')) return;
      await orderService.update(o.id, { paymentStatus: 'ditolak', orderStatus: 'dibatalkan' }); toast('Pembayaran ditolak', 'warning'); draw();
    });
    document.getElementById('done')?.addEventListener('click', async () => { await orderService.update(o.id, { orderStatus: 'selesai' }); toast('Pesanan selesai'); draw(); });
  };
  draw();
}
initList(); initDetail();
