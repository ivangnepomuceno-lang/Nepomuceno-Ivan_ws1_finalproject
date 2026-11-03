<?php

require __DIR__ . '/_helpers.php';
require_method('GET');
$user = require_login();

$club = isset($_GET['club']) ? $_GET['club'] : '';
if (!valid_club_id($club)) {
    fail('Invalid club.', 422);
}

if (!can_manage($user, $club)) {
    $st = db()->prepare('SELECT 1 FROM memberships WHERE user_id = ? AND club_id = ?');
    $st->execute([$user['id'], $club]);
    if (!$st->fetch()) {
        fail('Join this club first.', 403);
    }
}

$st = db()->prepare(
    'SELECT id, title, body, post_date, image_path, created_at
       FROM announcements WHERE club_id = ? ORDER BY created_at DESC, id DESC'
);
$st->execute([$club]);

$list = [];
foreach ($st->fetchAll() as $r) {
    $list[] = [
        'id'        => (int)$r['id'],
        'title'     => $r['title'],
        'text'      => $r['body'],
        'date'      => $r['post_date'] ?: '',
        'image'     => $r['image_path'],
        'createdAt' => date('c', strtotime($r['created_at'])),
    ];
}

json_out(['ok' => true, 'announcements' => $list]);
