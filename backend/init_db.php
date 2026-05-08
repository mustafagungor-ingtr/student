<?php

declare(strict_types=1);

require __DIR__ . '/db.php';

$pdo = db();
$pdo->exec(file_get_contents(__DIR__ . '/init.sql'));

$courses = ['risale', 'vecize', 'kuran'];
$courseStmt = $pdo->prepare('INSERT IGNORE INTO courses (name) VALUES (:name)');
foreach ($courses as $course) {
    $courseStmt->execute(['name' => $course]);
}

$adminEmail = getenv('ADMIN_EMAIL') ?: 'admin@example.com';
$adminPassword = getenv('ADMIN_PASSWORD') ?: 'admin123';

$checkAdmin = $pdo->prepare('SELECT id FROM users WHERE email = :email');
$checkAdmin->execute(['email' => $adminEmail]);

if (!$checkAdmin->fetchColumn()) {
    $insertAdmin = $pdo->prepare(
        'INSERT INTO users (full_name, email, password_hash, role) VALUES (:full_name, :email, :password_hash, :role)'
    );
    $insertAdmin->execute([
        'full_name' => 'Sistem Yöneticisi',
        'email' => $adminEmail,
        'password_hash' => password_hash($adminPassword, PASSWORD_DEFAULT),
        'role' => 'admin',
    ]);
}

echo "Veritabanı hazır. Admin: {$adminEmail} / {$adminPassword}" . PHP_EOL;
