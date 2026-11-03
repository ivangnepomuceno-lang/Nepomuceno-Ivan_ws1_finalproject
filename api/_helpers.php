<?php

require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function json_out(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $code = 400, array $fields = []): void
{
    json_out(['ok' => false, 'error' => $message, 'fields' => (object)$fields], $code);
}


set_exception_handler(function (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server error: ' . $e->getMessage(), 'fields' => new stdClass()]);
    exit;
});

function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }
    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
    } catch (PDOException $e) {
        fail('Cannot connect to the database. Make sure MySQL is running in XAMPP, the database "' . DB_NAME . '" was imported (database/schema.sql), and api/config.php is correct.', 500);
    }
    return $pdo;
}

function require_method(string $method): void
{
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        fail('Method not allowed', 405);
    }
}

function read_json(): array
{
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw !== false && $raw !== '' ? $raw : '[]', true);
    return is_array($data) ? $data : [];
}

function str_field(array $data, string $key, int $max = 255): string
{
    $value = isset($data[$key]) && is_scalar($data[$key]) ? trim((string)$data[$key]) : '';
    return mb_substr($value, 0, $max);
}

function valid_club_id($id): bool
{
    return is_string($id) && preg_match('/^[a-z0-9-]{1,40}$/', $id) === 1;
}

// ---------- Session / user ----------
function current_user(): ?array
{
    if (empty($_SESSION['uid'])) {
        return null;
    }
    $st = db()->prepare('SELECT id, firstname, email FROM users WHERE id = ?');
    $st->execute([$_SESSION['uid']]);
    $user = $st->fetch();
    return $user ?: null;
}

function require_login(): array
{
    $user = current_user();
    if (!$user) {
        fail('Please log in first.', 401);
    }
    return $user;
}

function is_admin_email(string $email): bool
{
    return in_array(strtolower($email), array_map('strtolower', ADMIN_EMAILS), true);
}

function officer_clubs(string $email): array
{
    $clubs = [];
    foreach (CLUB_OFFICERS as $club => $emails) {
        if (in_array(strtolower($email), array_map('strtolower', $emails), true)) {
            $clubs[] = (string)$club;
        }
    }
    return $clubs;
}

function can_manage(array $user, string $club): bool
{
    return is_admin_email($user['email']) || in_array($club, officer_clubs($user['email']), true);
}

// ---------- Memberships ----------
function membership_row_to_array(array $r): array
{
    $extra = json_decode((string)($r['extra'] ?? ''), true);
    return [
        'fullname'  => $r['fullname'],
        'studentId' => $r['student_id'],
        'email'     => $r['email'],
        'contact'   => $r['contact'],
        'course'    => $r['course'],
        'year'      => $r['year_level'],
        'section'   => $r['section'],
        'team'      => $r['team'],
        'extra'     => is_array($extra) ? $extra : new stdClass(),
        'joinedAt'  => date('c', strtotime($r['joined_at'])),
    ];
}

function memberships_for(int $userId): array
{
    $st = db()->prepare('SELECT * FROM memberships WHERE user_id = ?');
    $st->execute([$userId]);
    $out = [];
    foreach ($st->fetchAll() as $row) {
        $out[$row['club_id']] = membership_row_to_array($row);
    }
    return $out;
}

function session_payload(?array $user): array
{
    if (!$user) {
        return ['ok' => true, 'user' => null, 'isAdmin' => false, 'officerClubs' => [], 'memberships' => new stdClass()];
    }
    $memberships = memberships_for((int)$user['id']);
    return [
        'ok'           => true,
        'user'         => ['id' => (int)$user['id'], 'firstname' => $user['firstname'], 'email' => $user['email']],
        'isAdmin'      => is_admin_email($user['email']),
        'officerClubs' => officer_clubs($user['email']),
        'memberships'  => $memberships ?: new stdClass(),
    ];
}
