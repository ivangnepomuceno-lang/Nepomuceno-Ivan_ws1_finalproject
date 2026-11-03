<?php

require __DIR__ . '/_helpers.php';
require_method('POST');
$user = require_login();

$d    = read_json();
$club = isset($d['club']) ? $d['club'] : '';
if (!valid_club_id($club)) {
    fail('Invalid club.', 422);
}

// member will back to home
$st = db()->prepare('SELECT * FROM memberships WHERE user_id = ? AND club_id = ?');
$st->execute([$user['id'], $club]);
$existing = $st->fetch();
if ($existing) {
    json_out(['ok' => true, 'membership' => membership_row_to_array($existing)]);
}

$fullname  = str_field($d, 'fullname', 120);
$studentId = str_field($d, 'studentId', 40);
$email     = strtolower(str_field($d, 'email', 120));
$contact   = preg_replace('/[\s-]/', '', str_field($d, 'contact', 25));
$course    = str_field($d, 'course', 120);
$year      = str_field($d, 'year', 20);
$section   = str_field($d, 'section', 40);
$team      = str_field($d, 'team', 60);

$extra = [];
if (isset($d['extra']) && is_array($d['extra'])) {
    foreach ($d['extra'] as $label => $value) {
        if (is_scalar($value)) {
            $extra[mb_substr((string)$label, 0, 80)] = mb_substr(trim((string)$value), 0, 200);
        }
    }
}

$fields = [];
if ($fullname === '')  { $fields['fullname']  = 'Full name is required'; }
if ($studentId === '') { $fields['studentId'] = 'Student ID number is required'; }
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { $fields['email'] = 'Enter a valid email'; }
if (!preg_match('/^(\+?63|0)9\d{9}$/', $contact)) { $fields['contact'] = 'Enter a valid mobile number (e.g. 09123456789)'; }
if ($course === '')    { $fields['course']    = 'Course / program is required'; }
if (!in_array($year, ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Other'], true)) { $fields['year'] = 'Select your year level'; }
if ($section === '')   { $fields['section']   = 'Section is required'; }
if ($fields) {
    fail(implode('. ', $fields), 422, $fields);
}

db()->prepare(
    'INSERT INTO memberships (user_id, club_id, fullname, student_id, email, contact, course, year_level, section, team, extra)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
)->execute([
    $user['id'], $club, $fullname, $studentId, $email, $contact, $course, $year, $section, $team,
    $extra ? json_encode($extra, JSON_UNESCAPED_UNICODE) : null,
]);

$st = db()->prepare('SELECT * FROM memberships WHERE user_id = ? AND club_id = ?');
$st->execute([$user['id'], $club]);

json_out(['ok' => true, 'membership' => membership_row_to_array($st->fetch())]);
