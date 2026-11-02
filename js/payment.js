import { orderService, payBadge, MODEL, fmtDate } from './orders.js';
import { rupiah, toast, storage } from './storage.js';

const id = () => new URLSearchParams(location.search).get('id');
const notFound = el => { el.innerHTML = '<div class="empty card"><i data-lucide="file-x"></i><h3>Pesanan tidak ditemukan</h3><a class="btn" href="history.html">Lihat riwayat</a></div>'; window.lucide?.createIcons(); };

function qrSvg(seed) { // QR contoh (dekoratif, BUKAN QRIS asli)
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const n = 25; let r = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let on;
    if ((x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9)) {
      const fx = x < 8 ? x : x - (n - 8), fy = y < 8 ? y : y - (n - 8);
      on = fx < 7 && fy < 7 && (fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx > 1 && fx < 5 && fy > 1 && fy < 5));
    } else { h = (h * 1664525 + 1013904223) >>> 0; on = h >>> 28 > 6; }
    if (on) r += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  return `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" role="img" aria-label="QRIS contoh simulasi"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/>${r}</svg>`;
}

async function initPayment() {
  const el = document.getElementById('payment'); if (!el) return;
  let o = await orderService.getById(id()); if (!o) return notFound(el);
  let timer;
  const draw = () => {
    clearInterval(timer);
    if (o.paymentStatus !== 'belum_bayar') {
      el.innerHTML = `<div class="card pay-card"><h2>${o.code}</h2><p>${payBadge(o.paymentStatus)}</p><p class="muted">Pembayaran untuk pesanan ini sudah tidak bisa dilakukan lagi dari halaman ini.</p><a class="btn" href="order-success.html?id=${o.id}">Lihat status pesanan</a></div>`; return;
    }
    el.innerHTML = `<div class="card pay-card">
      <p class="sim-note"><i data-lucide="info"></i>Simulasi: QRIS di bawah hanya contoh dan tidak menerima pembayaran sungguhan.</p>
      <p class="muted">Kode transaksi</p><h2>${o.code}</h2>
      <p class="muted">Total pembayaran</p><p class="pay-total">${rupiah(o.total)}</p>
      <div class="qris">${storage.get('settings', {}).qris ? `<img src="${storage.get('settings', {}).qris}" alt="QRIS kantin">` : qrSvg(o.code)}</div>
      <p class="countdown">Bayar dalam <strong id="cd">--:--</strong></p>
      <ol class="muted pay-steps"><li>Buka aplikasi pembayaran yang mendukung QRIS.</li><li>Scan kode, pastikan nominal sesuai total.</li><li>Simpan nomor referensi, lalu tekan tombol di bawah.</li></ol>
      <button class="btn" id="paid">Saya Sudah Membayar</button><a class="btn outline" href="history.html">Kembali ke pesanan</a>
      <form id="confirm" class="confirm" hidden novalidate>
        <div class="field"><label for="ref">Nomor referensi pembayaran</label><input id="ref" placeholder="mis. QR8841230" autocomplete="off"></div>
        <div class="field"><label for="proof">atau unggah bukti pembayaran</label><input id="proof" type="file" accept="image/*"></div>
        <p class="err" id="err" role="alert"></p><button class="btn">Kirim konfirmasi</button></form></div>`;
    window.lucide?.createIcons();
    const tick = async () => {
      const left = new Date(o.expiresAt) - Date.now();
      if (left <= 0) { o = await orderService.update(o.id, { paymentStatus: 'kedaluwarsa', orderStatus: 'dibatalkan' }); return draw(); }
      document.getElementById('cd').textContent = `${String(Math.floor(left / 60000)).padStart(2, '0')}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`;
    };
    tick(); timer = setInterval(tick, 1000);
    document.getElementById('paid').onclick = () => { document.getElementById('confirm').hidden = false; document.getElementById('ref').focus(); };
    document.getElementById('confirm').onsubmit = async e => {
      e.preventDefault();
      const ref = document.getElementById('ref').value.trim(), file = document.getElementById('proof').files[0];
      if (!file && !/^[A-Za-z0-9-]{6,}$/.test(ref)) { document.getElementById('err').textContent = 'Isi nomor referensi (min. 6 huruf/angka) atau unggah bukti pembayaran.'; return; }
      await orderService.update(o.id, { paymentStatus: 'menunggu_verifikasi', paymentRef: ref, proofName: file?.name || '' });
      toast('Konfirmasi terkirim, menunggu verifikasi admin.'); location.href = `order-success.html?id=${o.id}`;
    };
  };
  draw();
}

async function initSuccess() {
  const el = document.getElementById('success'); if (!el) return;
  const o = await orderService.getById(id()); if (!o) return notFound(el);
  el.innerHTML = `<div class="card pay-card"><div class="ok-ico"><i data-lucide="send"></i></div>
    <h1>Pesanan terkirim</h1><p class="muted">Pesananmu sudah tercatat di sistem. Ini belum berarti pembayaran terkonfirmasi.</p>
    <dl class="kv"><dt>Kode pesanan</dt><dd>${o.code}</dd><dt>Total</dt><dd>${rupiah(o.total)}</dd><dt>Status pembayaran</dt><dd>${payBadge(o.paymentStatus)}</dd><dt>Model</dt><dd>${MODEL[o.purchaseModel]}</dd><dt>Waktu</dt><dd>${fmtDate(o.createdAt)}</dd></dl>
    <p class="sim-note"><i data-lucide="map-pin"></i>Ambil produk langsung di kantin dan tunjukkan kode pesanan. Admin akan memverifikasi pembayaranmu.</p>
    ${o.paymentStatus === 'belum_bayar' ? `<a class="btn" href="payment.html?id=${o.id}">Lanjut bayar</a>` : ''}
    <a class="btn outline" href="history.html">Lihat riwayat transaksi</a><a class="btn outline" href="../index.html">Kembali ke beranda</a></div>`;
  window.lucide?.createIcons();
}
initPayment(); initSuccess();
