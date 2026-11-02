import { storage, toast } from './storage.js';

// Pengaturan dipakai: footer toko, gambar QRIS di halaman pembayaran, batas stok rendah
const DEFAULTS = { name: 'Kantin Jujur', location: 'Area kantin kampus, lantai dasar gedung utama.', contact: 'halo@kantinjujur.com', hours: 'Senin–Jumat, 07.00–16.00', minStock: 5, logo: '', qris: '' };
function init() {
  const form = document.getElementById('settings-form'); if (!form) return;
  const s = { ...DEFAULTS, ...storage.get('settings', {}) }; const err = document.getElementById('set-err');
  ['name', 'location', 'contact', 'hours', 'minStock'].forEach(k => (form[k].value = s[k]));
  const prev = k => { const img = document.getElementById('prev-' + k); img.src = s[k] || 'data:,'; img.hidden = !s[k]; };
  prev('logo'); prev('qris');
  ['logo', 'qris'].forEach(k => form[k].addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 200 * 1024) { err.textContent = 'Ukuran gambar maksimal 200 KB.'; e.target.value = ''; return; }
    const r = new FileReader(); r.onload = () => { s[k] = r.result; prev(k); err.textContent = ''; }; r.readAsDataURL(f);
  }));
  form.addEventListener('submit', e => {
    e.preventDefault(); const min = Number(form.minStock.value);
    if (!form.name.value.trim()) return (err.textContent = 'Nama kantin wajib diisi.');
    if (!Number.isInteger(min) || min < 0) return (err.textContent = 'Batas stok minimum harus bilangan bulat ≥ 0.');
    storage.set('settings', { ...s, name: form.name.value.trim(), location: form.location.value.trim(), contact: form.contact.value.trim(), hours: form.hours.value.trim(), minStock: min });
    err.textContent = ''; toast('Pengaturan disimpan');
  });
}
init();
