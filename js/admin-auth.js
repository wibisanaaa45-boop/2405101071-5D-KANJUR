// Autentikasi admin via backend PHP (sesi cookie HttpOnly + password_hash). Lihat api/auth/*.php.
// Halaman admin disembunyikan sampai sesi diverifikasi ke server.
const API = new URL('../api/auth/', import.meta.url);
let csrf = '';

async function call(name, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(new URL(name, API), {
    method, credentials: 'same-origin',
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* respons bukan JSON: server PHP tidak aktif */ }
  return { status: res.status, data };
}

// Dipakai fetch() ke API admin berikutnya (UAS): otomatis kirim token CSRF & arahkan ke login bila sesi habis.
export async function apiFetch(url, opts = {}) {
  const res = await fetch(url, { credentials: 'same-origin', ...opts, headers: { 'X-CSRF-Token': csrf, ...(opts.headers || {}) } });
  if (res.status === 401) location.replace('login.html');
  return res;
}

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const loginForm = document.getElementById('login-form');

async function me() {
  try { const r = await call('me.php'); return r.status === 200 && r.data?.ok ? r.data : null; } catch { return null; }
}

if (loginForm) {
  initLogin();
} else {
  initGuard();
}

async function initLogin() {
  if (await me()) return location.replace('dashboard.html');
  const pw = document.getElementById('password'), err = document.getElementById('login-err'), btn = loginForm.querySelector('button.btn');
  document.getElementById('toggle-pw').onclick = e => {
    const show = pw.type === 'password'; pw.type = show ? 'text' : 'password';
    e.currentTarget.innerHTML = `<i data-lucide="${show ? 'eye-off' : 'eye'}"></i>`; window.lucide?.createIcons();
  };
  loginForm.addEventListener('submit', async e => {
    e.preventDefault(); err.textContent = '';
    const email = document.getElementById('email').value.trim(), pass = pw.value;
    if (!/^\S+@\S+\.\S+$/.test(email)) return (err.textContent = 'Masukkan email yang valid.');
    if (!pass) return (err.textContent = 'Password wajib diisi.');
    btn.disabled = true; btn.textContent = 'Memproses…';
    try {
      const { status, data } = await call('login.php', { method: 'POST', body: { email, password: pass } });
      if (status === 200 && data?.ok) return location.replace('dashboard.html');
      err.textContent = data?.error || 'Server login tidak ditemukan. Jalankan situs lewat server PHP (lihat README).';
      pw.value = '';
    } catch { err.textContent = 'Tidak dapat menghubungi server. Periksa koneksi dan server PHP.'; }
    btn.disabled = false; btn.textContent = 'Login';
  });
}

async function initGuard() {
  const s = await me();
  if (!s) return location.replace('login.html');
  csrf = s.csrf;
  const cur = document.body.dataset.page, title = document.body.dataset.title;
  const items = [['dashboard', 'Dashboard', 'layout-dashboard'], ['products', 'Produk', 'package'], ['categories', 'Kategori', 'tags'], ['stock', 'Stok', 'boxes'], ['transactions', 'Transaksi', 'receipt'], ['reports', 'Laporan', 'chart-column'], ['settings', 'Pengaturan', 'settings']];
  document.getElementById('admin-sidebar').innerHTML = `<div class="side-brand"><i data-lucide="leaf"></i>Kantin Jujur</div>
    ${items.map(([k, t, i]) => `<a class="side-link ${k === cur ? 'active' : ''}" href="${k}.html"><i data-lucide="${i}"></i>${t}</a>`).join('')}
    <button class="side-link out" id="logout"><i data-lucide="log-out"></i>Logout</button>`;
  document.getElementById('admin-topbar').innerHTML = `<button class="icon-btn" id="admin-menu" aria-label="Menu"><i data-lucide="menu"></i></button><h1>${esc(title)}</h1><span class="muted">${esc(s.admin.email)}</span>`;
  document.getElementById('admin-menu').onclick = () => document.body.classList.toggle('side-open');
  document.getElementById('admin-scrim').onclick = () => document.body.classList.remove('side-open');
  document.getElementById('logout').onclick = async () => {
    try { await call('logout.php', { method: 'POST', headers: { 'X-CSRF-Token': csrf } }); } catch { /* tetap keluar */ }
    location.replace('login.html');
  };
  window.lucide?.createIcons();
  document.documentElement.style.visibility = '';
  // Tombol "Kembali" setelah logout: jangan tampilkan halaman dari cache browser.
  window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });
}
