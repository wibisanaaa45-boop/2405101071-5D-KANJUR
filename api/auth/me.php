<?php
declare(strict_types=1);
require __DIR__ . '/../bootstrap.php';

require_method('GET');
$admin = require_admin();

json_out([
    'ok'    => true,
    'admin' => ['name' => $admin['name'], 'email' => $admin['email']],
    'csrf'  => $_SESSION['csrf'],
]);
