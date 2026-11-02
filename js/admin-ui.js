// Komponen UI admin: modal konfirmasi
export function confirmDialog(message, okText = 'Hapus', danger = true) {
  return new Promise(res => {
    const d = document.createElement('dialog');
    d.innerHTML = `<h2>Konfirmasi</h2><p>${message}</p><div class="dlg-actions"><button class="btn outline" value="no">Batal</button><button class="btn ${danger ? 'danger' : ''}" value="ok">${okText}</button></div>`;
    d.addEventListener('click', e => { const b = e.target.closest('button'); if (b) d.close(b.value); });
    d.addEventListener('close', () => { res(d.returnValue === 'ok'); d.remove(); });
    document.body.append(d); d.showModal();
  });
}
