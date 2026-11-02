import { orderService } from './orders.js';
import { productService } from './products.js';
import { storage, rupiah } from './storage.js';
import { fmtDate, payBadge } from './orders.js';

async function init() {
  if (!document.getElementById('kpi-sales')) return;
  const [orders, products] = await Promise.all([orderService.getAll(), productService.getAll()]);
  const min = storage.get('settings', { minStock: 5 }).minStock, paid = orders.filter(o => o.paymentStatus === 'terverifikasi');
  const isToday = o => new Date(o.createdAt).toDateString() === new Date().toDateString();
  const low = products.filter(p => p.active && p.stock <= min);
  document.getElementById('kpi-sales').textContent = rupiah(paid.filter(isToday).reduce((s, o) => s + o.total, 0));
  document.getElementById('kpi-orders').textContent = orders.filter(isToday).length;
  document.getElementById('kpi-products').textContent = products.length;
  document.getElementById('kpi-low').textContent = low.length;
  // grafik 7 hari
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
  const sums = days.map(d => paid.filter(o => new Date(o.createdAt).toDateString() === d.toDateString()).reduce((s, o) => s + o.total, 0));
  new Chart(document.getElementById('sales-chart'), { type: 'bar',
    data: { labels: days.map(d => d.toLocaleDateString('id-ID', { weekday: 'short' })), datasets: [{ data: sums, backgroundColor: '#166534', borderRadius: 8 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' ' + rupiah(c.parsed.y) } } },
      scales: { x: { grid: { display: false } }, y: { border: { display: false }, grid: { color: '#E2E8F0' }, ticks: { callback: v => v / 1000 + ' rb' } } } } });
  document.getElementById('recent').innerHTML = orders.slice(0, 5).map(o => `<li><div>${o.code}<small>${o.buyerName} · ${fmtDate(o.createdAt)}</small></div><div style="text-align:right"><strong>${rupiah(o.total)}</strong><br>${payBadge(o.paymentStatus)}</div></li>`).join('');
  const qty = {}; paid.forEach(o => o.items.forEach(i => (qty[i.name] = (qty[i.name] || 0) + i.qty)));
  const top = Object.entries(qty).sort((a, b) => b[1] - a[1]).slice(0, 5);
  document.getElementById('top').innerHTML = top.length ? top.map(([n, q]) => `<li><span>${n}</span><strong>${q} terjual</strong></li>`).join('') : '<li class="muted">Belum ada penjualan terverifikasi.</li>';
  const out = products.filter(p => p.stock <= 0).length;
  document.getElementById('stock-sum').innerHTML = `<li><span>Total produk</span><strong>${products.length}</strong></li><li><span>Stok rendah (≤ ${min})</span><strong>${low.length}</strong></li><li><span>Stok habis</span><strong>${out}</strong></li>` +
    low.slice(0, 4).map(p => `<li><small>${p.name}</small><span class="badge ${p.stock <= 0 ? 'danger' : 'warning'}">${p.stock}</span></li>`).join('');
}
init();
