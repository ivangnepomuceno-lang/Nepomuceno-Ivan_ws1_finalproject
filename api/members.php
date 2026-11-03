<?php
// List of member in club
require __DIR__ . '/_helpers.php';
require_method('GET');
$user = require_login();

$club = isset($_GET['club']) ? $_GET['club'] : '';
if (!valid_club_id($club)) {
    fail('Invalid club.', 422);
}
if (!can_manage($user, $club)) {
    fail('You are not allowed to view the members of this club.', 403);
}

$st = db()->prepare('SELECT * FROM memberships WHERE club_id = ? ORDER BY joined_at DESC, id DESC');
$st->execute([$club]);

$members = [];
foreach ($st->fetchAll() as $row) {
    $members[] = membership_row_to_array($row);
}

json_out(['ok' => true, 'members' => $members]);
