// Data dummy awal (satu-satunya sumber data produk). Struktur mengikuti kolom tabel MySQL UAS.
export const seedCategories = [
  { id: 'cat-makanan', name: 'Makanan' }, { id: 'cat-minuman', name: 'Minuman' },
  { id: 'cat-snack', name: 'Snack' }, { id: 'cat-roti', name: 'Roti' }, { id: 'cat-instan', name: 'Makanan Instan' },
];
const p = (id, categoryId, name, price, stock, emoji, popular, description) => ({ id: 'prd-' + id, categoryId, name, price, stock, emoji, popular, active: true, image: '', description });
export const seedProducts = [
  p(1, 'cat-makanan', 'Nasi Ayam Geprek', 17000, 12, '🍗', true, 'Ayam crispy dengan sambal geprek dan nasi hangat.'),
  p(2, 'cat-makanan', 'Nasi Kuning', 12000, 8, '🍚', true, 'Nasi kuning dengan telur dadar, tempe orek, dan bihun.'),
  p(3, 'cat-minuman', 'Es Teh Manis', 5000, 30, '🧋', true, 'Teh segar dengan gula secukupnya.'),
  p(4, 'cat-minuman', 'Air Mineral 600 ml', 4000, 40, '💧', false, 'Air mineral dalam kemasan botol.'),
  p(5, 'cat-minuman', 'Kopi Susu Botol', 12000, 3, '☕', true, 'Kopi susu dingin siap minum.'),
  p(6, 'cat-snack', 'Keripik Singkong', 8000, 15, '🥔', false, 'Keripik singkong renyah rasa balado.'),
  p(7, 'cat-snack', 'Kacang Atom', 6000, 0, '🥜', false, 'Kacang berlapis tepung gurih.'),
  p(8, 'cat-snack', 'Biskuit Cokelat', 7000, 20, '🍪', false, 'Biskuit renyah dengan krim cokelat.'),
  p(9, 'cat-roti', 'Roti Cokelat', 8000, 10, '🍞', true, 'Roti lembut isi selai cokelat.'),
  p(10, 'cat-roti', 'Roti Sobek Keju', 14000, 6, '🧀', false, 'Roti sobek dengan taburan keju.'),
  p(11, 'cat-instan', 'Mi Instan Cup', 9000, 18, '🍜', false, 'Mi cup siap seduh, tersedia air panas.'),
  p(12, 'cat-instan', 'Bubur Instan', 7000, 11, '🥣', false, 'Bubur instan hangat untuk sarapan cepat.'),
];

// Transaksi contoh (7 hari terakhir) agar dashboard admin tidak kosong. Semuanya data contoh.
export function seedOrders() {
  const names = ['Rina', 'Dimas', 'Sari', 'Budi', 'Nadia', 'Fajar', 'Lestari', 'Agus']; const out = []; let n = 0;
  for (let d = 6; d >= 0; d--) for (let k = 0; k < 2 + (d % 2); k++) {
    const t = new Date(); t.setDate(t.getDate() - d); t.setHours(9 + k * 3, 15, 0, 0);
    const a = seedProducts[(n * 3) % 12], b = seedProducts[(n * 5 + 2) % 12], pending = d === 0 && k > 0;
    const items = [{ productId: a.id, name: a.name, price: a.price, qty: 1 + (n % 2) }, { productId: b.id, name: b.name, price: b.price, qty: 1 }];
    out.push({ id: 'ord-seed' + n, code: `KJ-${t.toISOString().slice(2, 10).replaceAll('-', '')}-S${n}`, createdAt: t.toISOString(), expiresAt: t.toISOString(),
      buyerName: names[n % 8] + ' (contoh)', buyerContact: '', purchaseModel: n % 3 ? 'langsung' : 'online', items, total: items.reduce((s, i) => s + i.price * i.qty, 0),
      paymentStatus: pending ? 'menunggu_verifikasi' : 'terverifikasi', orderStatus: pending ? 'baru' : d === 0 ? 'diproses' : 'selesai', paymentRef: pending ? 'QR' + (100000 + n) : '', proofName: '' });
    n++;
  }
  return out;
}
