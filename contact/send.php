<?php
header('Content-Type: application/json; charset=UTF-8');

const SMTP_HOST = 'smtp.hostinger.com';
const SMTP_PORT = 465;
const SMTP_USERNAME = 'hello@sysera.tech';
const SMTP_FROM = 'hello@sysera.tech';
const SMTP_RECIPIENT = '9xdonx@gmail.com';

function respond_json($statusCode, $success, $message)
{
    http_response_code($statusCode);
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

function sanitize_value($value)
{
    $value = trim((string) $value);
    $value = stripslashes($value);
    $value = strip_tags($value);

    return preg_replace('/\s+/', ' ', $value);
}

function contains_header_injection($value)
{
    if (preg_match('/[\r\n]/', (string) $value) === 1) {
        return true;
    }

    return preg_match('/^(to|cc|bcc|content-type|mime-version|content-transfer-encoding)\s*:/i', (string) $value) === 1;
}

function smtp_write($socket, $data)
{
    $length = strlen($data);
    $written = 0;

    while ($written < $length) {
        $result = fwrite($socket, substr($data, $written));
        if ($result === false || $result === 0) {
            throw new RuntimeException('Unable to write to the SMTP server.');
        }

        $written += $result;
    }
}

function smtp_read_response($socket)
{
    $response = '';

    while (!feof($socket)) {
        $line = fgets($socket, 515);
        if ($line === false) {
            break;
        }

        $response .= $line;
        if (preg_match('/^\d{3} /', $line) === 1) {
            break;
        }
    }

    if (!preg_match('/^(\d{3})[ -]/', $response, $matches)) {
        throw new RuntimeException('Invalid SMTP response.');
    }

    return (int) $matches[1];
}

function smtp_expect($socket, array $expectedCodes, $stage)
{
    $code = smtp_read_response($socket);
    if (!in_array($code, $expectedCodes, true)) {
        throw new RuntimeException('SMTP failure during ' . $stage . ' (' . $code . ').');
    }
}

function smtp_command($socket, $command, array $expectedCodes, $stage)
{
    smtp_write($socket, $command . "\r\n");
    smtp_expect($socket, $expectedCodes, $stage);
}

function encode_header($value)
{
    return '=?UTF-8?B?' . base64_encode($value) . '?=';
}

function send_smtp_message($password, $subject, $body, $replyToName, $replyToEmail)
{
    $context = stream_context_create(['ssl' => [
        'verify_peer' => true,
        'verify_peer_name' => true,
        'peer_name' => SMTP_HOST,
    ]]);

    $socket = @stream_socket_client(
        'ssl://' . SMTP_HOST . ':' . SMTP_PORT,
        $errorNumber,
        $errorMessage,
        15,
        STREAM_CLIENT_CONNECT,
        $context
    );

    if ($socket === false) {
        throw new RuntimeException('Unable to connect to the SMTP server.');
    }

    try {
        stream_set_timeout($socket, 15);
        smtp_expect($socket, [220], 'connection');
        smtp_command($socket, 'EHLO sysera.tech', [250], 'EHLO');
        smtp_command($socket, 'AUTH LOGIN', [334], 'authentication');
        smtp_command($socket, base64_encode(SMTP_USERNAME), [334], 'username authentication');
        smtp_command($socket, base64_encode($password), [235], 'password authentication');
        smtp_command($socket, 'MAIL FROM:<' . SMTP_FROM . '>', [250], 'sender acceptance');
        smtp_command($socket, 'RCPT TO:<' . SMTP_RECIPIENT . '>', [250, 251], 'recipient acceptance');
        smtp_command($socket, 'DATA', [354], 'message data');

        $headers = [
            'From: SysEra Website <' . SMTP_FROM . '>',
            'Reply-To: ' . encode_header($replyToName) . ' <' . $replyToEmail . '>',
            'To: ' . SMTP_RECIPIENT,
            'Subject: ' . encode_header($subject),
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
            'X-Mailer: SysEra Website',
        ];

        $normalizedBody = str_replace("\r\n", "\n", $body);
        $normalizedBody = str_replace("\n.", "\n..", $normalizedBody);
        $message = implode("\r\n", $headers) . "\r\n\r\n" . str_replace("\n", "\r\n", $normalizedBody);
        smtp_write($socket, $message . "\r\n.\r\n");
        smtp_expect($socket, [250], 'message acceptance');
        smtp_command($socket, 'QUIT', [221], 'connection close');
    } finally {
        fclose($socket);
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond_json(405, false, 'Only POST requests are allowed.');
}

$rawValues = [$_POST['name'] ?? '', $_POST['email'] ?? ''];
foreach ($rawValues as $rawValue) {
    if (contains_header_injection($rawValue)) {
        respond_json(400, false, 'Invalid input detected.');
    }
}

$name = sanitize_value($_POST['name'] ?? '');
$email = sanitize_value(strtolower($_POST['email'] ?? ''));
$company = sanitize_value($_POST['company'] ?? '');
$projectType = sanitize_value($_POST['project_type'] ?? '');
$messageText = sanitize_value($_POST['message'] ?? '');
$phone = sanitize_value($_POST['phone'] ?? '');
$errors = [];

if ($name === '' || strlen($name) < 2) {
    $errors[] = 'Please enter your name.';
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address.';
}
if ($phone === '' || !preg_match('/^[+\d][\d\s().-]{7,}$/', $phone)) {
    $errors[] = 'Please enter a valid phone or WhatsApp number.';
}
if ($messageText === '' || strlen($messageText) < 10) {
    $errors[] = 'Please write a message with at least 10 characters.';
}
if (!empty($errors)) {
    respond_json(400, false, implode(' ', $errors));
}

$configPath = __DIR__ . '/smtp-config.php';
if (!is_file($configPath)) {
    error_log('SysEra contact form: SMTP configuration is missing.');
    respond_json(500, false, 'The message could not be sent. Please try again later.');
}

$config = require $configPath;
$password = is_array($config) && isset($config['password']) ? trim((string) $config['password']) : '';
if ($password === '') {
    error_log('SysEra contact form: SMTP password is missing.');
    respond_json(500, false, 'The message could not be sent. Please try again later.');
}

$subject = 'New SysEra inquiry from ' . $name;
$body = "Name: {$name}\n";
$body .= "Email: {$email}\n";
$body .= "Phone / WhatsApp: {$phone}\n";
$body .= 'Company: ' . ($company !== '' ? $company : 'Not provided') . "\n";
$body .= 'Project Type: ' . ($projectType !== '' ? $projectType : 'Not provided') . "\n\n";
$body .= "Message:\n{$messageText}\n";

try {
    send_smtp_message($password, $subject, $body, $name, $email);
} catch (RuntimeException $exception) {
    error_log('SysEra contact form: ' . $exception->getMessage());
    respond_json(500, false, 'The message could not be sent. Please try again later.');
}

respond_json(200, true, 'Your message has been sent successfully. We will be in touch soon.');
