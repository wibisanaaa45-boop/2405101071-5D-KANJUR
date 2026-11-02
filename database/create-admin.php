<?php
declare(strict_types=1);
// Membuat / mengganti password admin lewat terminal (bukan lewat web).
//   php database/create-admin.php admin@kantinjujur.com "Nama Admin"
// Password diminta secara interaktif (tidak tampil), atau lewat env KJ_ADMIN_PASSWORD.

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__ . '/../api/bootstrap.php';

$email = strtolower(trim($argv[1] ?? ''));
$name  = trim($argv[2] ?? 'Admin');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Pemakaian: php database/create-admin.php <email> [\"Nama\"]\n"); exit(1);
}

$pass = getenv('KJ_ADMIN_PASSWORD') ?: '';
if ($pass === '') {
    $tty = DIRECTORY_SEPARATOR === '/' && function_exists('posix_isatty') && posix_isatty(STDIN);
    echo 'Password baru (min. 10 karakter): ';
    if ($tty) system('stty -echo');
    $pass = rtrim((string) fgets(STDIN), "\r\n");
    if ($tty) { system('stty echo'); echo "\n"; }
}
if (strlen($pass) < 10 || strlen($pass) > 72) {
    fwrite(STDERR, "Password harus 10–72 karakter.\n"); exit(1);
}

$hash = password_hash($pass, PASSWORD_DEFAULT);
$pdo  = db();
$st = $pdo->prepare('SELECT id FROM admins WHERE email = ?');
$st->execute([$email]);
if ($id = $st->fetchColumn()) {
    $pdo->prepare('UPDATE admins SET password_hash = ?, name = ?, is_active = 1 WHERE id = ?')->execute([$hash, $name, $id]);
    echo "Admin $email diperbarui.\n";
} else {
    $pdo->prepare('INSERT INTO admins (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)')->execute([$name, $email, $hash, date('Y-m-d H:i:s')]);
    echo "Admin $email dibuat.\n";
}
