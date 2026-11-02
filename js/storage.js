// Utilitas umum: penyimpanan, ID, format rupiah, toast. (UAS: storage diganti fetch API)
export const storage = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem('kj_' + key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { localStorage.setItem('kj_' + key, JSON.stringify(value)); },
};
export const uid = prefix => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const rupiah = n => 'Rp ' + Number(n).toLocaleString('id-ID');
export const base = () => document.body.dataset.base || '';
export function toast(msg, type = 'success') {
  let root = document.getElementById('toast-root');
  if (!root) { root = document.createElement('div'); root.id = 'toast-root'; root.setAttribute('aria-live', 'polite'); document.body.append(root); }
  const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg; root.append(t);
  setTimeout(() => t.remove(), 2600);
}
