import { categoryService, productService } from './products.js';
import { toast } from './storage.js';
import { confirmDialog } from './admin-ui.js';

async function init() {
  const body = document.getElementById('cat-body'); if (!body) return;
  const dlg = document.getElementById('cat-dialog'), form = document.getElementById('cat-form'), err = document.getElementById('cat-err');
  let cats = [], prods = [];
  const render = async () => {
    [cats, prods] = await Promise.all([categoryService.getAll(), productService.getAll()]);
    body.innerHTML = cats.length ? cats.map(c => `<tr data-id="${c.id}"><td><strong>${c.name}</strong></td><td>${prods.filter(p => p.categoryId === c.id).length} produk</td>
      <td><div class="row-actions"><button class="icon-btn" data-edit aria-label="Edit"><i data-lucide="pencil"></i></button><button class="icon-btn" data-del aria-label="Hapus"><i data-lucide="trash-2"></i></button></div></td></tr>`).join('')
      : '<tr><td colspan="3" class="muted" style="text-align:center;padding:32px">Belum ada kategori.</td></tr>';
    window.lucide?.createIcons();
  };
  const open = c => { form.reset(); form.cid.value = c?.id || ''; form.cname.value = c?.name || ''; err.textContent = ''; document.getElementById('cat-title').textContent = c ? 'Edit kategori' : 'Tambah kategori'; dlg.showModal(); };
  document.getElementById('add-cat').onclick = () => open(null);
  document.getElementById('cat-cancel').onclick = () => dlg.close();
  body.onclick = async e => {
    const tr = e.target.closest('tr[data-id]'); if (!tr) return; const c = cats.find(x => x.id === tr.dataset.id);
    if (e.target.closest('[data-edit]')) open(c);
    if (e.target.closest('[data-del]')) {
      const n = prods.filter(p => p.categoryId === c.id).length;
      if (n) return toast(`Kategori masih dipakai ${n} produk. Pindahkan produknya dulu.`, 'warning');
      if (await confirmDialog(`Hapus kategori “${c.name}”?`)) { await categoryService.delete(c.id); toast('Kategori dihapus'); render(); }
    }
  };
  form.onsubmit = async e => {
    e.preventDefault(); const name = form.cname.value.trim(), id = form.cid.value;
    if (name.length < 2 || name.length > 30) return (err.textContent = 'Nama kategori 2–30 karakter.');
    if (cats.some(c => c.id !== id && c.name.toLowerCase() === name.toLowerCase())) return (err.textContent = 'Nama kategori sudah ada.');
    if (id) await categoryService.update(id, name); else await categoryService.add(name);
    dlg.close(); toast(id ? 'Kategori diperbarui' : 'Kategori ditambahkan'); render();
  };
  render();
}
init();
