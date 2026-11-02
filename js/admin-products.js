import { productService, categoryService, stockBadge } from './products.js';
import { rupiah, toast } from './storage.js';
import { confirmDialog } from './admin-ui.js';

async function init() {
  const body = document.getElementById('prod-body'); if (!body) return;
  const dlg = document.getElementById('prod-dialog'), form = document.getElementById('prod-form');
  let products = await productService.getAll(); const cats = await categoryService.getAll(); const cn = Object.fromEntries(cats.map(c => [c.id, c.name]));
  let q = '', cat = 'all', image = '';
  document.getElementById('f-cat').innerHTML = '<option value="all">Semua kategori</option>' + cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  form.categoryId.innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  const render = () => {
    const rows = products.filter(p => p.name.toLowerCase().includes(q) && (cat === 'all' || p.categoryId === cat));
    body.innerHTML = rows.length ? rows.map(p => `<tr data-id="${p.id}">
      <td><div class="cell-prod"><span class="thumb">${p.image ? `<img src="${p.image}" alt="">` : p.emoji}</span><strong>${p.name}</strong></div></td>
      <td>${cn[p.categoryId] || '-'}</td><td>${rupiah(p.price)}</td><td>${stockBadge(p.stock)}</td>
      <td><input type="checkbox" class="switch" data-toggle ${p.active ? 'checked' : ''} aria-label="Aktif"></td>
      <td><div class="row-actions"><button class="icon-btn" data-edit aria-label="Edit"><i data-lucide="pencil"></i></button><button class="icon-btn" data-del aria-label="Hapus"><i data-lucide="trash-2"></i></button></div></td></tr>`).join('')
      : '<tr><td colspan="6" class="muted" style="text-align:center;padding:32px">Produk tidak ditemukan.</td></tr>';
    window.lucide?.createIcons();
  };
  const reload = async () => { products = await productService.getAll(); render(); };
  const open = p => {
    form.reset(); image = p?.image || ''; document.getElementById('dlg-title').textContent = p ? 'Edit produk' : 'Tambah produk';
    form.id.value = p?.id || ''; form.pname.value = p?.name || ''; form.categoryId.value = p?.categoryId || cats[0].id;
    form.price.value = p?.price ?? ''; form.stock.value = p?.stock ?? ''; form.description.value = p?.description || ''; form.emoji.value = p?.emoji || '🍽️'; form.active.checked = p?.active ?? true;
    document.getElementById('preview').src = image || 'data:,'; document.getElementById('preview').hidden = !image; document.getElementById('form-err').textContent = ''; dlg.showModal();
  };
  document.getElementById('add-prod').onclick = () => open(null);
  document.getElementById('f-q').oninput = e => { q = e.target.value.trim().toLowerCase(); render(); };
  document.getElementById('f-cat').onchange = e => { cat = e.target.value; render(); };
  body.addEventListener('click', async e => {
    const tr = e.target.closest('tr[data-id]'); if (!tr) return; const p = products.find(x => x.id === tr.dataset.id);
    if (e.target.closest('[data-edit]')) open(p);
    if (e.target.closest('[data-del]') && await confirmDialog(`Hapus produk “${p.name}”? Riwayat transaksi lama tetap aman karena harga sudah disimpan.`)) { await productService.delete(p.id); toast('Produk dihapus'); reload(); }
  });
  body.addEventListener('change', async e => { if (!e.target.matches('[data-toggle]')) return; const id = e.target.closest('tr').dataset.id; await productService.update(id, { active: e.target.checked }); toast(e.target.checked ? 'Produk diaktifkan' : 'Produk dinonaktifkan'); reload(); });
  form.image.onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 200 * 1024) { document.getElementById('form-err').textContent = 'Ukuran gambar maksimal 200 KB.'; e.target.value = ''; return; }
    const r = new FileReader(); r.onload = () => { image = r.result; const pv = document.getElementById('preview'); pv.src = image; pv.hidden = false; }; r.readAsDataURL(f);
  };
  document.getElementById('cancel').onclick = () => dlg.close();
  form.addEventListener('submit', async e => {
    e.preventDefault(); const err = document.getElementById('form-err');
    const data = { name: form.pname.value.trim(), categoryId: form.categoryId.value, price: Number(form.price.value), stock: Number(form.stock.value), description: form.description.value.trim(), emoji: form.emoji.value.trim() || '🍽️', image, active: form.active.checked };
    if (data.name.length < 2) return (err.textContent = 'Nama produk minimal 2 karakter.');
    if (!(data.price > 0)) return (err.textContent = 'Harga harus lebih dari 0.');
    if (!Number.isInteger(data.stock) || data.stock < 0) return (err.textContent = 'Stok harus bilangan bulat ≥ 0.');
    if (form.id.value) await productService.update(form.id.value, data); else await productService.add({ ...data, popular: false });
    dlg.close(); toast(form.id.value ? 'Produk diperbarui' : 'Produk ditambahkan'); reload();
  });
  const edit = new URLSearchParams(location.search).get('edit');
  if (edit) open(edit === 'new' ? null : products.find(p => p.id === edit));
  render();
}
init();
