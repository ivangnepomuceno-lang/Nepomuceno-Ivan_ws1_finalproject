<?php
require __DIR__ . '/_helpers.php';
require_method('POST');
$user = require_login();

$d    = read_json();
$club = isset($d['club']) ? $d['club'] : '';
if (!valid_club_id($club)) {
    fail('Invalid club.', 422);
}

db()->prepare('DELETE FROM memberships WHERE user_id = ? AND club_id = ?')->execute([$user['id'], $club]);

json_out(['ok' => true]);
