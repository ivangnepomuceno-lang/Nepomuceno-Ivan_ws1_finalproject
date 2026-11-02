<?php
// Mag-post ng announcement (admin / officer lang). Tumatanggap ng form na may optional na picture.
require __DIR__ . '/_helpers.php';
require_method('POST');
$user = require_login();

// Kapag masyadong malaki ang upload, walang laman ang $_POST
if (empty($_POST) && !empty($_SERVER['CONTENT_LENGTH'])) {
    fail('The upload is too large. Use a smaller picture.', 413);
}

$club = isset($_POST['club']) ? $_POST['club'] : '';
if (!valid_club_id($club)) {
    fail('Invalid club.', 422);
}
if (!can_manage($user, $club)) {
    fail('You are not allowed to post for this club.', 403);
}

$title = mb_substr(trim((string)($_POST['title'] ?? '')), 0, 80);
$text  = mb_substr(trim((string)($_POST['text'] ?? '')), 0, 800);
$date  = trim((string)($_POST['date'] ?? ''));

if ($text === '') {
    fail('Please write the announcement', 422, ['text' => 'required']);
}
if ($date !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    fail('Invalid date', 422);
}

// ---------- Picture (optional) ----------
$imagePath = '';
if (!empty($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE) {
    $f = $_FILES['image'];
    if ($f['error'] !== UPLOAD_ERR_OK) {
        fail('Upload failed (code ' . $f['error'] . '). The picture may be too big.', 422);
    }
    if ($f['size'] > 3 * 1024 * 1024) {
        fail('The picture is too big (max 3 MB).', 422);
    }
    $info = @getimagesize($f['tmp_name']);
    if (!$info) {
        fail('That file is not a valid picture.', 422);
    }
    $types = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'];
    if (!isset($types[$info[2]])) {
        fail('Only JPG, PNG, or WEBP pictures are allowed.', 422);
    }

    $dir = dirname(__DIR__) . '/uploads/announcements';
    if (!is_dir($dir) && !mkdir($dir, 0775, true)) {
        fail('Could not create the uploads folder.', 500);
    }
    $name = bin2hex(random_bytes(12)) . '.' . $types[$info[2]];
    if (!move_uploaded_file($f['tmp_name'], $dir . '/' . $name)) {
        fail('Could not save the picture. Check the folder permissions of uploads/announcements.', 500);
    }
    $imagePath = 'uploads/announcements/' . $name;
}

db()->prepare(
    'INSERT INTO announcements (club_id, title, body, post_date, image_path, author_id) VALUES (?, ?, ?, ?, ?, ?)'
)->execute([$club, $title, $text, $date !== '' ? $date : null, $imagePath, $user['id']]);

json_out(['ok' => true, 'id' => (int)db()->lastInsertId()]);
