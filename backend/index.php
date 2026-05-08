<?php

declare(strict_types=1);

require __DIR__ . '/db.php';

$config = require __DIR__ . '/config.php';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin !== '' && $origin !== $config['allowed_origin']) {
    http_response_code(403);
    echo json_encode(['message' => 'CORS origin reddedildi.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($origin === $config['allowed_origin']) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET,POST,OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_start();

function jsonResponse(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function body(): array
{
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function currentUser(PDO $pdo): ?array
{
    if (!isset($_SESSION['user_id'])) {
        return null;
    }

    $stmt = $pdo->prepare(
        'SELECT u.id, u.full_name, u.email, u.role, t.id AS teacher_id
         FROM users u
         LEFT JOIN teachers t ON t.user_id = u.id
         WHERE u.id = :id'
    );
    $stmt->execute(['id' => $_SESSION['user_id']]);
    $user = $stmt->fetch();

    return $user ?: null;
}

function requireAuth(PDO $pdo): array
{
    $user = currentUser($pdo);
    if (!$user) {
        jsonResponse(['message' => 'Giriş gerekli.'], 401);
    }

    return $user;
}

function requireAdmin(array $user): void
{
    if (($user['role'] ?? '') !== 'admin') {
        jsonResponse(['message' => 'Bu işlem için admin yetkisi gerekli.'], 403);
    }
}

function routePath(): string
{
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
    if (str_starts_with($path, '/api/')) {
        return substr($path, 4);
    }
    if ($path === '/api') {
        return '/';
    }
    return $path;
}

$pdo = db();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = routePath();

if ($method === 'POST' && $path === '/login') {
    $payload = body();
    $email = trim((string)($payload['email'] ?? ''));
    $password = (string)($payload['password'] ?? '');

    $stmt = $pdo->prepare('SELECT id, full_name, email, role, password_hash FROM users WHERE email = :email');
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        jsonResponse(['message' => 'E-posta veya şifre hatalı.'], 401);
    }

    $_SESSION['user_id'] = (int)$user['id'];

    $me = currentUser($pdo);
    jsonResponse(['user' => $me]);
}

if ($method === 'POST' && $path === '/logout') {
    session_destroy();
    jsonResponse(['message' => 'Çıkış yapıldı.']);
}

if ($method === 'GET' && $path === '/me') {
    $user = requireAuth($pdo);
    jsonResponse(['user' => $user]);
}

if ($method === 'GET' && $path === '/courses') {
    requireAuth($pdo);

    $courses = $pdo->query('SELECT id, name FROM courses ORDER BY name')->fetchAll();
    $subStmt = $pdo->prepare('SELECT id, name FROM subcourses WHERE course_id = :course_id ORDER BY name');

    foreach ($courses as &$course) {
        $subStmt->execute(['course_id' => $course['id']]);
        $course['subcourses'] = $subStmt->fetchAll();
    }

    jsonResponse(['courses' => $courses]);
}

if ($method === 'POST' && $path === '/subcourses') {
    $user = requireAuth($pdo);
    requireAdmin($user);

    $payload = body();
    $stmt = $pdo->prepare('INSERT INTO subcourses (course_id, name) VALUES (:course_id, :name)');
    $stmt->execute([
        'course_id' => (int)($payload['course_id'] ?? 0),
        'name' => trim((string)($payload['name'] ?? '')),
    ]);

    jsonResponse(['message' => 'Alt ders eklendi.'], 201);
}

if ($method === 'GET' && $path === '/teachers') {
    requireAuth($pdo);

    $teachers = $pdo->query(
        'SELECT t.id, u.full_name, u.email, t.phone
         FROM teachers t
         JOIN users u ON u.id = t.user_id
         ORDER BY u.full_name'
    )->fetchAll();

    jsonResponse(['teachers' => $teachers]);
}

if ($method === 'POST' && $path === '/teachers') {
    $user = requireAuth($pdo);
    requireAdmin($user);

    $payload = body();
    $fullName = trim((string)($payload['full_name'] ?? ''));
    $email = trim((string)($payload['email'] ?? ''));
    $password = (string)($payload['password'] ?? '');
    $phone = trim((string)($payload['phone'] ?? ''));

    if ($fullName === '' || $email === '' || $password === '') {
        jsonResponse(['message' => 'Ad soyad, e-posta ve şifre zorunludur.'], 422);
    }

    $pdo->beginTransaction();
    try {
        $userStmt = $pdo->prepare(
            'INSERT INTO users (full_name, email, password_hash, role)
             VALUES (:full_name, :email, :password_hash, :role)'
        );
        $userStmt->execute([
            'full_name' => $fullName,
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'role' => 'teacher',
        ]);

        $teacherStmt = $pdo->prepare('INSERT INTO teachers (user_id, phone) VALUES (:user_id, :phone)');
        $teacherStmt->execute([
            'user_id' => (int)$pdo->lastInsertId(),
            'phone' => $phone,
        ]);

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        jsonResponse(['message' => 'Öğretmen eklenemedi: ' . $e->getMessage()], 400);
    }

    jsonResponse(['message' => 'Öğretmen eklendi.'], 201);
}

if ($method === 'GET' && $path === '/students') {
    requireAuth($pdo);

    $students = $pdo->query(
        "SELECT s.id, s.full_name, s.school, s.class_name, s.phone, s.parent_name, s.parent_phone,
                s.lesson_hour, c.name AS course_name, sc.name AS subcourse_name,
                GROUP_CONCAT(u.full_name ORDER BY u.full_name SEPARATOR ', ') AS teachers
         FROM students s
         JOIN courses c ON c.id = s.course_id
         LEFT JOIN subcourses sc ON sc.id = s.subcourse_id
         LEFT JOIN teacher_students ts ON ts.student_id = s.id
         LEFT JOIN teachers t ON t.id = ts.teacher_id
         LEFT JOIN users u ON u.id = t.user_id
         GROUP BY s.id
         ORDER BY s.full_name"
    )->fetchAll();

    jsonResponse(['students' => $students]);
}

if ($method === 'POST' && $path === '/students') {
    requireAuth($pdo);

    $payload = body();
    $fullName = trim((string)($payload['full_name'] ?? ''));
    $courseId = (int)($payload['course_id'] ?? 0);

    if ($fullName === '' || $courseId <= 0) {
        jsonResponse(['message' => 'Öğrenci adı ve ders zorunludur.'], 422);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO students (full_name, school, class_name, phone, parent_name, parent_phone, course_id, subcourse_id, lesson_hour)
         VALUES (:full_name, :school, :class_name, :phone, :parent_name, :parent_phone, :course_id, :subcourse_id, :lesson_hour)'
    );
    $stmt->execute([
        'full_name' => $fullName,
        'school' => trim((string)($payload['school'] ?? '')),
        'class_name' => trim((string)($payload['class_name'] ?? '')),
        'phone' => trim((string)($payload['phone'] ?? '')),
        'parent_name' => trim((string)($payload['parent_name'] ?? '')),
        'parent_phone' => trim((string)($payload['parent_phone'] ?? '')),
        'course_id' => $courseId,
        'subcourse_id' => ($payload['subcourse_id'] ?? '') !== '' ? (int)$payload['subcourse_id'] : null,
        'lesson_hour' => trim((string)($payload['lesson_hour'] ?? '')),
    ]);

    jsonResponse(['message' => 'Öğrenci eklendi.'], 201);
}

if ($method === 'POST' && $path === '/teacher-assignments') {
    $user = requireAuth($pdo);
    requireAdmin($user);

    $payload = body();
    $stmt = $pdo->prepare('INSERT IGNORE INTO teacher_students (teacher_id, student_id) VALUES (:teacher_id, :student_id)');
    $stmt->execute([
        'teacher_id' => (int)($payload['teacher_id'] ?? 0),
        'student_id' => (int)($payload['student_id'] ?? 0),
    ]);

    jsonResponse(['message' => 'Öğretmen ataması yapıldı.'], 201);
}

if ($method === 'POST' && $path === '/attendance') {
    $user = requireAuth($pdo);

    $payload = body();
    $stmt = $pdo->prepare(
        'INSERT INTO attendance (student_id, teacher_id, attended_on, status, notes)
         VALUES (:student_id, :teacher_id, :attended_on, :status, :notes)'
    );
    $stmt->execute([
        'student_id' => (int)($payload['student_id'] ?? 0),
        'teacher_id' => $user['teacher_id'] ?: null,
        'attended_on' => (string)($payload['attended_on'] ?? date('Y-m-d')),
        'status' => !empty($payload['status']) ? 1 : 0,
        'notes' => trim((string)($payload['notes'] ?? '')),
    ]);

    jsonResponse(['message' => 'Yoklama kaydedildi.'], 201);
}

if ($method === 'GET' && $path === '/attendance') {
    requireAuth($pdo);

    $studentId = isset($_GET['student_id']) ? (int)$_GET['student_id'] : 0;
    $query =
        'SELECT a.id, a.student_id, s.full_name AS student_name, a.attended_on, a.status, a.notes,
                u.full_name AS teacher_name
         FROM attendance a
         JOIN students s ON s.id = a.student_id
         LEFT JOIN teachers t ON t.id = a.teacher_id
         LEFT JOIN users u ON u.id = t.user_id';

    if ($studentId > 0) {
        $stmt = $pdo->prepare($query . ' WHERE a.student_id = :student_id ORDER BY a.attended_on DESC LIMIT 100');
        $stmt->execute(['student_id' => $studentId]);
        $rows = $stmt->fetchAll();
    } else {
        $rows = $pdo->query($query . ' ORDER BY a.attended_on DESC LIMIT 100')->fetchAll();
    }

    jsonResponse(['attendance' => $rows]);
}

if ($method === 'POST' && $path === '/homeworks') {
    $user = requireAuth($pdo);

    $payload = body();
    $title = trim((string)($payload['title'] ?? ''));
    if ($title === '') {
        jsonResponse(['message' => 'Ödev başlığı zorunludur.'], 422);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO homeworks (student_id, teacher_id, title, description, due_date)
         VALUES (:student_id, :teacher_id, :title, :description, :due_date)'
    );
    $stmt->execute([
        'student_id' => (int)($payload['student_id'] ?? 0),
        'teacher_id' => $user['teacher_id'] ?: null,
        'title' => $title,
        'description' => trim((string)($payload['description'] ?? '')),
        'due_date' => (string)($payload['due_date'] ?? null),
    ]);

    jsonResponse(['message' => 'Ödev eklendi.'], 201);
}

if ($method === 'GET' && $path === '/homeworks') {
    requireAuth($pdo);

    $studentId = isset($_GET['student_id']) ? (int)$_GET['student_id'] : 0;
    $query =
        'SELECT h.id, h.student_id, s.full_name AS student_name, h.title, h.description, h.due_date, h.status,
                u.full_name AS teacher_name, h.created_at
         FROM homeworks h
         JOIN students s ON s.id = h.student_id
         LEFT JOIN teachers t ON t.id = h.teacher_id
         LEFT JOIN users u ON u.id = t.user_id';

    if ($studentId > 0) {
        $stmt = $pdo->prepare($query . ' WHERE h.student_id = :student_id ORDER BY h.created_at DESC LIMIT 100');
        $stmt->execute(['student_id' => $studentId]);
        $rows = $stmt->fetchAll();
    } else {
        $rows = $pdo->query($query . ' ORDER BY h.created_at DESC LIMIT 100')->fetchAll();
    }

    jsonResponse(['homeworks' => $rows]);
}

if ($method === 'POST' && $path === '/comments') {
    $user = requireAuth($pdo);

    $payload = body();
    $comment = trim((string)($payload['comment'] ?? ''));
    if ($comment === '') {
        jsonResponse(['message' => 'Yorum alanı boş olamaz.'], 422);
    }

    $stmt = $pdo->prepare('INSERT INTO comments (student_id, teacher_id, comment) VALUES (:student_id, :teacher_id, :comment)');
    $stmt->execute([
        'student_id' => (int)($payload['student_id'] ?? 0),
        'teacher_id' => $user['teacher_id'] ?: null,
        'comment' => $comment,
    ]);

    jsonResponse(['message' => 'Yorum eklendi.'], 201);
}

if ($method === 'GET' && $path === '/comments') {
    requireAuth($pdo);

    $studentId = isset($_GET['student_id']) ? (int)$_GET['student_id'] : 0;
    $query =
        'SELECT c.id, c.student_id, s.full_name AS student_name, c.comment, c.created_at,
                u.full_name AS teacher_name
         FROM comments c
         JOIN students s ON s.id = c.student_id
         LEFT JOIN teachers t ON t.id = c.teacher_id
         LEFT JOIN users u ON u.id = t.user_id';

    if ($studentId > 0) {
        $stmt = $pdo->prepare($query . ' WHERE c.student_id = :student_id ORDER BY c.created_at DESC LIMIT 100');
        $stmt->execute(['student_id' => $studentId]);
        $rows = $stmt->fetchAll();
    } else {
        $rows = $pdo->query($query . ' ORDER BY c.created_at DESC LIMIT 100')->fetchAll();
    }

    jsonResponse(['comments' => $rows]);
}

jsonResponse(['message' => 'API endpoint bulunamadı.'], 404);
