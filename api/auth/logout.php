<?php
declare(strict_types=1);
require __DIR__ . '/../bootstrap.php';

require_method('POST');
start_session();
if (!empty($_SESSION['admin_id'])) {
    require_csrf();
}
destroy_session();
json_out(['ok' => true]);
