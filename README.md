- Nama: Muhammad Rafli Wibisana Yuan
- NIM: 2405101071
- Kelas: 2405101071
- Program Studi: Teknik Informatika
- Mata Kuliah: Pemrograman Web Dasar
- Tahun Akademik: 2024
# KANTIN JUJUR — Digital Self-Service Canteen (Frontend UTS)

Website kantin kejujuran kampus. "Belanja Mudah, Bayar Jujur." Tahap ini **hanya frontend** (HTML5, CSS3, Vanilla JavaScript). Data disimpan di `localStorage`; **backend PHP + MySQL belum dibuat** (tahap UAS).

## Cara menjalankan
1. Buka folder `kantin-jujur/` di VS Code, pasang ekstensi **Live Server**.
2. Klik kanan `index.html` → *Open with Live Server* (ES Modules tidak jalan lewat `file://`).
3. Butuh internet untuk Lucide Icons, Chart.js, dan Google Fonts (font sistem sebagai cadangan).

## Login admin (PHP + MySQL)
Login admin memakai backend PHP: password disimpan sebagai hash (`password_hash`), sesi memakai cookie `HttpOnly`, ada token CSRF, pembatasan percobaan login (5x gagal → kunci 15 menit), dan logout otomatis setelah 30 menit tidak aktif.

**Setup (sekali):**
1. Pasang PHP 8.1+ dan MySQL/MariaDB (mis. XAMPP). Aktifkan ekstensi `pdo_mysql`.
2. Impor `database/schema.sql` (phpMyAdmin → Import, atau `mysql -u root < database/schema.sql`).
3. Jika user/password MySQL bukan `root` / kosong, buat `api/config.local.php`:
   ```php
   <?php return ['db' => ['user' => 'kantin', 'pass' => 'rahasia']];
   ```
4. Buat akun admin lewat terminal (password diminta tersembunyi, min. 10 karakter):
   ```
   php database/create-admin.php admin@kantinjujur.com "Nama Admin"
   ```
5. Jalankan dari folder proyek: `php -S localhost:8000`, lalu buka `http://localhost:8000/pages/admin/login.html`.
   Live Server **tidak bisa** menjalankan PHP, jadi login admin butuh server PHP. Halaman pembeli tetap bisa lewat Live Server.

**Endpoint:** `api/auth/login.php`, `api/auth/me.php`, `api/auth/logout.php`. Untuk endpoint admin berikutnya (UAS), panggil `require_admin()` di baris awal (`require_admin(true)` untuk POST/PUT/DELETE agar token CSRF ikut dicek). Di sisi JS gunakan `apiFetch()` dari `js/admin-auth.js`.

**Catatan keamanan:** pasang HTTPS saat dipublikasikan (cookie otomatis ditandai `Secure`). Halaman HTML admin hanya disembunyikan di sisi klien sampai sesi valid; perlindungan data yang sebenarnya ada di endpoint PHP yang memakai `require_admin()`. Jika di belakang reverse proxy, sesuaikan `client_ip()` di `api/bootstrap.php`.

## Struktur folder
```
index.html
pages/        catalog, product-detail, cart, checkout, payment, order-success, history
api/auth/    login.php, me.php, logout.php
database/    schema.sql, create-admin.php
pages/admin/  login, dashboard, products, product-form, categories, stock, transactions, transaction-detail, reports, settings
css/          variables, global, components, navbar, footer, home, catalog, product-detail, cart, checkout, payment, history, admin, dashboard
js/           main, navigation, storage, seed-data, products, cart, orders, stock, product-detail, checkout, payment, history, admin-*.js
assets/       images (products, banners, qris, logo), icons, fonts
```

## Arsitektur data (siap UAS)
- `storage.js` membungkus localStorage; `seed-data.js` adalah satu-satunya sumber data awal.
- `productService`, `categoryService`, `cartService`, `orderService`, `stockService` berisi fungsi `async` yang nanti diganti `fetch()` ke API PHP.
- Order menyimpan **snapshot harga** per item, serta `paymentStatus` dan `orderStatus` yang dipisah. ID unik berformat string; struktur bisa dipetakan ke tabel `products`, `categories`, `orders`, `order_items`, `stock_movements`, `settings`.

## Fitur
- **Pembeli:** beranda, katalog (cari, kategori, harga, urut), detail produk, keranjang, checkout (2 model pembelian, QRIS), pembayaran simulasi dengan hitung mundur, status sukses, riwayat dengan filter.
- **Admin:** login admin (sesi PHP), dashboard + grafik, CRUD produk (pratinjau gambar), CRUD kategori, manajemen stok + riwayat, transaksi (verifikasi/tolak/selesai), laporan + filter + export CSV, pengaturan (nama, lokasi, kontak, QRIS, batas stok).
- Toast, modal konfirmasi, empty state, navigasi responsif (drawer admin di mobile).

## Catatan penting
- Semua pembayaran adalah **simulasi**; tidak ada payment gateway dan QRIS bawaan hanya gambar contoh.
- Transaksi contoh (nama bertanda "(contoh)") dibuat otomatis agar dashboard tidak kosong.
- Gambar yang diunggah disimpan sebagai data URL di localStorage (maks. 200 KB per gambar); jangan dipakai sebagai penyimpanan produksi.
- Reset data: hapus localStorage situs (DevTools → Application → Local Storage).
