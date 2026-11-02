<?php
require __DIR__ . '/_helpers.php';
require_method('POST');

$d     = read_json();
$first = str_field($d, 'firstname', 60);
$email = strtolower(str_field($d, 'email', 120));
$pass  = isset($d['password']) && is_string($d['password']) ? $d['password'] : '';

$fields = [];
if ($first === '') {
    $fields['firstname'] = 'Firstname is required';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $fields['email'] = 'Enter a valid email';
}
if (strlen($pass) < 8) {
    $fields['password'] = 'Password must have at least 8 characters';
} elseif (strlen($pass) > 200) {
    $fields['password'] = 'Password is too long';
}
if ($fields) {
    fail(implode('. ', $fields), 422, $fields);
}

$st = db()->prepare('SELECT id FROM users WHERE email = ?');
$st->execute([$email]);
if ($st->fetch()) {
    fail('This email is already registered', 409, ['email' => 'taken']);
}

db()->prepare('INSERT INTO users (firstname, email, password_hash) VALUES (?, ?, ?)')
    ->execute([$first, $email, password_hash($pass, PASSWORD_DEFAULT)]);

json_out(['ok' => true]);
