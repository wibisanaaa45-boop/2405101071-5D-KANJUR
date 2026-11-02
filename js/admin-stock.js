import { productService } from './products.js';
import { stockService } from './stock.js';
import { storage, toast } from './storage.js';
import { fmtDate } from './orders.js';

const T = { masuk: 'Stok masuk', keluar: 'Stok keluar', penyesuaian: 'Penyesuaian' };
async function init() {
  const body = document.getElementById('stock-body'); if (!body) return;
  const dlg = document.getElementById('stock-dialog'), form = document.getElementById('stock-form'), err = document.getElementById('stock-err');
  const render = async () => {
    const products = await productService.getAll(), log = stockService.getLog(), min = storage.get('settings', { minStock: 5 }).minStock;
    const sum = (id, t) => log.filter(l => l.productId === id && l.type === t).reduce((s, l) => s + l.qty, 0);
    body.innerHTML = products.map(p => `<tr><td><strong>${p.name}</strong></td><td>${p.stock}</td>
      <td><span class="badge ${p.stock <= 0 ? 'danger' : p.stock <= min ? 'warning' : 'success'}">${p.stock <= 0 ? 'Habis' : p.stock <= min ? 'Rendah' : 'Aman'}</span></td>
      <td>${sum(p.id, 'masuk')}</td><td>${sum(p.id, 'keluar')}</td>
      <td><div class="row-actions">${['masuk', 'keluar', 'penyesuaian'].map(t => `<button class="btn outline" data-act="${t}" data-id="${p.id}">${T[t]}</button>`).join('')}</div></td></tr>`).join('');
    document.getElementById('min-info').textContent = `Batas stok rendah: ${min} (ubah di Pengaturan).`;
    document.getElementById('log-body').innerHTML = log.length ? log.slice(0, 15).map(l => `<tr><td>${fmtDate(l.at)}</td><td>${l.name}</td><td>${T[l.type]}</td><td>${l.before} → ${l.after}</td><td>${l.note || '-'}</td></tr>`).join('')
      : '<tr><td colspan="5" class="muted" style="text-align:center;padding:24px">Belum ada perubahan stok.</td></tr>';
  };
  let cur = null;
  body.onclick = async e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    cur = { id: b.dataset.id, type: b.dataset.act }; const p = await productService.getById(cur.id);
    document.getElementById('stock-title').textContent = `${T[cur.type]}: ${p.name}`;
    document.getElementById('qty-label').textContent = cur.type === 'penyesuaian' ? `Stok baru (sekarang ${p.stock})` : `Jumlah (stok sekarang ${p.stock})`;
    form.reset(); err.textContent = ''; dlg.showModal();
  };
  document.getElementById('stock-cancel').onclick = () => dlg.close();
  form.onsubmit = async e => {
    e.preventDefault(); const qty = Number(form.qty.value), p = await productService.getById(cur.id);
    if (!Number.isInteger(qty) || qty < (cur.type === 'penyesuaian' ? 0 : 1)) return (err.textContent = 'Masukkan bilangan bulat yang valid.');
    if (cur.type === 'keluar' && qty > p.stock) return (err.textContent = `Stok keluar melebihi stok saat ini (${p.stock}).`);
    await stockService.change(cur.id, cur.type, qty, form.note.value.trim());
    dlg.close(); toast('Stok diperbarui'); render();
  };
  render();
}
init();
