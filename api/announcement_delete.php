<?php
require __DIR__ . '/_helpers.php';
require_method('POST');
$user = require_login();

$d  = read_json();
$id = isset($d['id']) ? (int)$d['id'] : 0;

$st = db()->prepare('SELECT club_id, image_path FROM announcements WHERE id = ?');
$st->execute([$id]);
$row = $st->fetch();
if (!$row) {
    fail('Announcement not found.', 404);
}
if (!can_manage($user, $row['club_id'])) {
    fail('You are not allowed to delete this announcement.', 403);
}

// burahin din ang picture sa uploads folder
if ($row['image_path'] !== '' && strpos($row['image_path'], 'uploads/announcements/') === 0) {
    $file = dirname(__DIR__) . '/uploads/announcements/' . basename($row['image_path']);
    if (is_file($file)) {
        @unlink($file);
    }
}

db()->prepare('DELETE FROM announcements WHERE id = ?')->execute([$id]);

json_out(['ok' => true]);
