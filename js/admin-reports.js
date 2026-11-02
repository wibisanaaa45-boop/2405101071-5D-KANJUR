import { orderService, PAY, ORDER, MODEL, fmtDate } from './orders.js';
import { rupiah } from './storage.js';

async function init() {
  const body = document.getElementById('rp-body'); if (!body) return;
  const all = await orderService.getAll(); let chart;
  const iso = d => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
  const from = document.getElementById('rp-from'), to = document.getElementById('rp-to'), model = document.getElementById('rp-model');
  const d0 = new Date(); d0.setDate(d0.getDate() - 6); from.value = iso(d0); to.value = iso(new Date());
  let rows = [];
  const render = () => {
    rows = all.filter(o => iso(o.createdAt) >= from.value && iso(o.createdAt) <= to.value && (model.value === 'all' || o.purchaseModel === model.value));
    const paid = rows.filter(o => o.paymentStatus === 'terverifikasi');
    document.getElementById('rp-rev').textContent = rupiah(paid.reduce((s, o) => s + o.total, 0));
    document.getElementById('rp-count').textContent = rows.length;
    document.getElementById('rp-paid').textContent = paid.length;
    const byDay = {}; paid.forEach(o => { const k = iso(o.createdAt); byDay[k] = (byDay[k] || 0) + o.total; });
    const labels = Object.keys(byDay).sort();
    chart?.destroy();
    chart = new Chart(document.getElementById('rp-chart'), { type: 'line', data: { labels: labels.map(l => l.slice(5)), datasets: [{ data: labels.map(l => byDay[l]), borderColor: '#166534', backgroundColor: 'rgba(22,101,52,.1)', fill: true, tension: .3 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' ' + rupiah(c.parsed.y) } } }, scales: { y: { border: { display: false }, ticks: { callback: v => v / 1000 + ' rb' } }, x: { grid: { display: false } } } } });
    const qty = {}; paid.forEach(o => o.items.forEach(i => { qty[i.name] = (qty[i.name] || 0) + i.qty; }));
    document.getElementById('rp-top').innerHTML = Object.entries(qty).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, q]) => `<li><span>${n}</span><strong>${q} terjual</strong></li>`).join('') || '<li class="muted">Tidak ada penjualan terverifikasi.</li>';
    body.innerHTML = rows.length ? rows.map(o => `<tr><td>${o.code}</td><td>${fmtDate(o.createdAt)}</td><td>${o.purchaseModel === 'langsung' ? 'Langsung' : 'Via website'}</td><td>${rupiah(o.total)}</td><td>${PAY[o.paymentStatus][0]}</td></tr>`).join('') : '<tr><td colspan="5" class="muted" style="text-align:center;padding:24px">Tidak ada transaksi pada filter ini.</td></tr>';
  };
  [from, to, model].forEach(e => e.addEventListener('change', render));
  document.getElementById('rp-csv').onclick = () => {
    const esc = v => `"${String(v).replaceAll('"', '""')}"`;
    const csv = [['Kode', 'Tanggal', 'Pembeli', 'Model', 'Total', 'Status Pembayaran', 'Status Pesanan'], ...rows.map(o => [o.code, o.createdAt, o.buyerName, MODEL[o.purchaseModel], o.total, PAY[o.paymentStatus][0], ORDER[o.orderStatus]])].map(r => r.map(esc).join(',')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })); a.download = `laporan-${from.value}_${to.value}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };
  render();
}
init();
