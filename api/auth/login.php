<?php
declare(strict_types=1);
require __DIR__ . '/../bootstrap.php';

require_method('POST');
$in = json_input();

$email = strtolower(trim((string) ($in['email'] ?? '')));
$pass  = (string) ($in['password'] ?? '');

if ($email === '' || strlen($email) > 190 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_out(['ok' => false, 'error' => 'Masukkan email yang valid.'], 422);
}
if ($pass === '' || strlen($pass) > 256) {
    json_out(['ok' => false, 'error' => 'Password wajib diisi.'], 422);
}

$cfg = kj_config()['login'];
$ip  = client_ip();
$now = time();
$since = $now - $cfg['window'];
$pdo = db();

// 1) Batasi percobaan login (anti brute force).
$st = $pdo->prepare('SELECT COUNT(*) AS n, MIN(attempted_at) AS first_at FROM login_attempts WHERE email = ? AND ip = ? AND attempted_at > ?');
$st->execute([$email, $ip, $since]);
$pair = $st->fetch();
$st = $pdo->prepare('SELECT COUNT(*) AS n, MIN(attempted_at) AS first_at FROM login_attempts WHERE ip = ? AND attempted_at > ?');
$st->execute([$ip, $since]);
$byIp = $st->fetch();

if ((int) $pair['n'] >= $cfg['max_attempts'] || (int) $byIp['n'] >= $cfg['max_attempts_ip']) {
    $first = (int) ((int) $pair['n'] >= $cfg['max_attempts'] ? $pair['first_at'] : $byIp['first_at']);
    $retry = max(1, $first + $cfg['window'] - $now);
    header('Retry-After: ' . $retry);
    json_out([
        'ok' => false,
        'error' => 'Terlalu banyak percobaan login. Coba lagi dalam ' . (int) ceil($retry / 60) . ' menit.',
        'retry_after' => $retry,
    ], 429);
}

// 2) Verifikasi kredensial. Hash palsu dipakai agar waktu respons tidak membocorkan
// apakah email terdaftar atau tidak.
const DUMMY_HASH = '$2y$10$xkHhwphIOCAmzTfeX6gEnO6Pck3ajvBS4JKe4d1Mfy6MQkJtn.yZy';

$st = $pdo->prepare('SELECT id, name, email, password_hash FROM admins WHERE email = ? AND is_active = 1');
$st->execute([$email]);
$admin = $st->fetch();

$valid = password_verify($pass, $admin['password_hash'] ?? DUMMY_HASH) && $admin;

if (!$valid) {
    $pdo->prepare('INSERT INTO login_attempts (email, ip, attempted_at) VALUES (?, ?, ?)')->execute([$email, $ip, $now]);
    $pdo->prepare('DELETE FROM login_attempts WHERE attempted_at < ?')->execute([$now - $cfg['window'] * 4]);
    json_out(['ok' => false, 'error' => 'Email atau password salah.'], 401);
}

// 3) Berhasil: bersihkan hitungan gagal, buat sesi baru (cegah session fixation).
$pdo->prepare('DELETE FROM login_attempts WHERE email = ? AND ip = ?')->execute([$email, $ip]);

if (password_needs_rehash($admin['password_hash'], PASSWORD_DEFAULT)) {
    $pdo->prepare('UPDATE admins SET password_hash = ? WHERE id = ?')->execute([password_hash($pass, PASSWORD_DEFAULT), $admin['id']]);
}
$pdo->prepare('UPDATE admins SET last_login_at = ? WHERE id = ?')->execute([date('Y-m-d H:i:s'), $admin['id']]);

start_session();
session_regenerate_id(true);
$_SESSION = [
    'admin_id'  => (int) $admin['id'],
    'login_at'  => $now,
    'last_seen' => $now,
    'csrf'      => bin2hex(random_bytes(32)),
];

json_out([
    'ok'    => true,
    'admin' => ['name' => $admin['name'], 'email' => $admin['email']],
    'csrf'  => $_SESSION['csrf'],
]);
