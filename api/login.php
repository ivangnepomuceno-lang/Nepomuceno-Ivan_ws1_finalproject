<?php
require __DIR__ . '/_helpers.php';
require_method('POST');

$d     = read_json();
$email = strtolower(str_field($d, 'email', 120));
$pass  = isset($d['password']) && is_string($d['password']) ? $d['password'] : '';

if ($email === '' || $pass === '') {
    fail('Email and password are required', 422);
}

$st = db()->prepare('SELECT id, firstname, email, password_hash FROM users WHERE email = ?');
$st->execute([$email]);
$user = $st->fetch();

if (!$user || !password_verify($pass, $user['password_hash'])) {
    fail('Incorrect email or password', 401);
}

session_regenerate_id(true);
$_SESSION['uid'] = (int)$user['id'];

json_out(session_payload($user));
