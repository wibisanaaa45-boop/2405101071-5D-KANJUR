<?php
declare(strict_types=1);

// Dimuat oleh setiap endpoint. Berisi koneksi DB, sesi aman, dan helper autentikasi.

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');

set_exception_handler(function (Throwable $e): void {
    error_log('[kantin-jujur] ' . $e);
    json_out(['ok' => false, 'error' => 'Terjadi kesalahan pada server.'], 500);
});

function kj_config(): array
{
    static $cfg = null;
    return $cfg ??= require __DIR__ . '/config.php';
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $c = kj_config()['db'];
        $pdo = new PDO($c['dsn'], $c['user'], $c['pass'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

function json_out(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function require_method(string $method): void
{
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        header('Allow: ' . $method);
        json_out(['ok' => false, 'error' => 'Metode tidak diizinkan.'], 405);
    }
}

// Hanya menerima JSON. Content-Type application/json tidak bisa dikirim lintas-situs
// tanpa preflight CORS, sehingga ikut menahan CSRF pada endpoint login.
function json_input(): array
{
    $type = strtolower($_SERVER['CONTENT_TYPE'] ?? '');
    if (!str_starts_with($type, 'application/json')) {
        json_out(['ok' => false, 'error' => 'Permintaan tidak valid.'], 415);
    }
    $raw = file_get_contents('php://input', false, null, 0, 8192);
    $data = json_decode($raw === false ? '' : $raw, true);
    if (!is_array($data)) {
        json_out(['ok' => false, 'error' => 'Permintaan tidak valid.'], 400);
    }
    return $data;
}

// Sengaja hanya REMOTE_ADDR: header X-Forwarded-For bisa dipalsukan oleh klien.
// Jika di belakang reverse proxy tepercaya, sesuaikan di sini.
function client_ip(): string
{
    return substr($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0', 0, 45);
}

function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_name(kj_config()['session']['name']);
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => $https,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function destroy_session(): void
{
    start_session();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires'  => time() - 3600,
            'path'     => $p['path'],
            'secure'   => $p['secure'],
            'httponly' => $p['httponly'],
            'samesite' => $p['samesite'] ?: 'Lax',
        ]);
    }
    session_destroy();
}

// Mengembalikan admin yang sedang login, atau null. Akun yang dinonaktifkan
// atau dihapus langsung kehilangan akses karena dicek ke DB di setiap permintaan.
function current_admin(): ?array
{
    start_session();
    $id = $_SESSION['admin_id'] ?? null;
    if (!$id) {
        return null;
    }
    $cfg = kj_config()['session'];
    $now = time();
    if ($now - (int) ($_SESSION['last_seen'] ?? 0) > $cfg['idle']
        || $now - (int) ($_SESSION['login_at'] ?? 0) > $cfg['absolute']) {
        destroy_session();
        return null;
    }
    $st = db()->prepare('SELECT id, name, email FROM admins WHERE id = ? AND is_active = 1');
    $st->execute([$id]);
    $admin = $st->fetch();
    if (!$admin) {
        destroy_session();
        return null;
    }
    $_SESSION['last_seen'] = $now;
    return $admin;
}

function require_csrf(): void
{
    $token = $_SESSION['csrf'] ?? '';
    $sent  = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if ($token === '' || !hash_equals($token, $sent)) {
        json_out(['ok' => false, 'error' => 'Token keamanan tidak valid. Muat ulang halaman.'], 403);
    }
}

// Pasang di awal setiap endpoint admin. Untuk POST/PUT/DELETE gunakan require_admin(true).
function require_admin(bool $checkCsrf = false): array
{
    $admin = current_admin();
    if (!$admin) {
        json_out(['ok' => false, 'error' => 'Sesi berakhir. Silakan login kembali.'], 401);
    }
    if ($checkCsrf) {
        require_csrf();
    }
    return $admin;
}
