<?php
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Only POST requests are allowed.'
    ]);
    exit;
}

function sanitize_value($value)
{
    $value = trim((string) $value);
    $value = stripslashes($value);
    $value = strip_tags($value);
    $value = preg_replace('/\s+/', ' ', $value);

    return $value;
}

function contains_header_injection($value)
{
    if (preg_match('/[\r\n]/', $value) === 1) {
        return true;
    }

    return preg_match('/^(to|cc|bcc|content-type|mime-version|content-transfer-encoding)\s*:/i', $value) === 1;
}

$name = sanitize_value($_POST['name'] ?? '');
$email = sanitize_value(strtolower($_POST['email'] ?? ''));
$company = sanitize_value($_POST['company'] ?? '');
$projectType = sanitize_value($_POST['project_type'] ?? '');
$messageText = sanitize_value($_POST['message'] ?? '');

$errors = [];

if ($name === '' || strlen($name) < 2) {
    $errors[] = 'Please enter your name.';
}

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address.';
}

if ($messageText === '' || strlen($messageText) < 10) {
    $errors[] = 'Please write a message with at least 10 characters.';
}

if (
    contains_header_injection($name) ||
    contains_header_injection($email) ||
    contains_header_injection($company) ||
    contains_header_injection($projectType) ||
    contains_header_injection($messageText)
) {
    $errors[] = 'Invalid input detected.';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => implode(' ', $errors)
    ]);
    exit;
}

$recipient = 'YOUR_EMAIL_HERE';

if ($recipient === 'YOUR_EMAIL_HERE') {
    http_response_code(503);
    echo json_encode([
        'success' => false,
        'message' => 'The contact email is not configured yet. Update $recipient in contact/send.php.'
    ]);
    exit;
}

$subject = 'New SysEra inquiry from ' . $name;
$body = "Name: {$name}\n";
$body .= "Email: {$email}\n";
$body .= "Company: " . ($company !== '' ? $company : 'Not provided') . "\n";
$body .= "Project Type: " . ($projectType !== '' ? $projectType : 'Not provided') . "\n\n";
$body .= "Message:\n{$messageText}\n";

$headers = [
    'From: SysEra Website <noreply@sysera.tech>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: SysEra Website'
];

if (!mail($recipient, $subject, $body, implode("\r\n", $headers))) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'The message could not be sent. Please try again later.'
    ]);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Your message has been sent successfully. We will be in touch soon.'
]);
