<?php

require __DIR__ . '/_helpers.php';
require_method('GET');
json_out(session_payload(current_user()));
