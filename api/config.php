<?php
// Konfigurasi backend. Salin nilai yang ingin diubah ke api/config.local.php (tidak di-commit).
$config = [
    'db' => [
        'dsn'  => getenv('KJ_DB_DSN') ?: 'mysql:host=127.0.0.1;dbname=kantin_jujur;charset=utf8mb4',
        'user' => getenv('KJ_DB_USER') ?: 'root',
        'pass' => getenv('KJ_DB_PASS') ?: '',
    ],
    'session' => [
        'name'     => 'KJSESSID',
        'idle'     => 30 * 60,      // logout otomatis jika tidak aktif 30 menit
        'absolute' => 8 * 60 * 60,  // masa berlaku maksimum sesi 8 jam
    ],
    'login' => [
        'max_attempts'    => 5,        // gagal per kombinasi email + IP
        'max_attempts_ip' => 20,       // gagal per IP (semua email)
        'window'          => 15 * 60,  // jendela penghitungan & lama penguncian (detik)
    ],
];

$local = __DIR__ . '/config.local.php';
if (is_file($local)) {
    $config = array_replace_recursive($config, require $local);
}
return $config;
