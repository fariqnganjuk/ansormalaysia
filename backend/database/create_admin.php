<?php

declare(strict_types=1);

require __DIR__ . '/../config.php';

if (PHP_SAPI !== 'cli') {
    echo "This script must be run from CLI." . PHP_EOL;
    exit(1);
}

$username = $argv[1] ?? null;
$password = $argv[2] ?? null;

if (!$username || !$password) {
    echo "Usage: php backend/database/create_admin.php <username> <password>" . PHP_EOL;
    exit(1);
}

$username = trim($username);
$password = (string) $password;

if ($username === '' || strlen($password) < 6) {
    echo "Username wajib diisi dan password minimal 6 karakter." . PHP_EOL;
    exit(1);
}

$email = $username . '@miaoda.com';
$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = db()->prepare('SELECT id FROM users WHERE username = :username LIMIT 1');
$stmt->execute(['username' => $username]);
$existing = $stmt->fetch();

if ($existing) {
    $update = db()->prepare('UPDATE users SET password_hash = :password_hash, role = :role WHERE id = :id');
    $update->execute([
        'password_hash' => $hash,
        'role' => 'admin',
        'id' => (int) $existing['id'],
    ]);

    echo "Admin updated: {$username}" . PHP_EOL;
    exit(0);
}

$insert = db()->prepare('INSERT INTO users (username, email, password_hash, role) VALUES (:username, :email, :password_hash, :role)');
$insert->execute([
    'username' => $username,
    'email' => $email,
    'password_hash' => $hash,
    'role' => 'admin',
]);

echo "Admin created: {$username}" . PHP_EOL;
