<?php

declare(strict_types=1);

$frontendOriginsEnv = getenv('FRONTEND_ORIGINS');
$frontendOriginSingle = getenv('FRONTEND_ORIGIN');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowedOrigins = [];
if (is_string($frontendOriginsEnv) && trim($frontendOriginsEnv) !== '') {
    $allowedOrigins = array_values(array_filter(array_map('trim', explode(',', $frontendOriginsEnv))));
} elseif (is_string($frontendOriginSingle) && trim($frontendOriginSingle) !== '') {
    $allowedOrigins = [trim($frontendOriginSingle)];
}

$isOriginAllowed = false;
if ($origin !== '') {
    if ($allowedOrigins !== []) {
        $isOriginAllowed = in_array($origin, $allowedOrigins, true);
    } else {
        $originParts = parse_url($origin);
        $originHost = strtolower((string) ($originParts['host'] ?? ''));
        $originScheme = strtolower((string) ($originParts['scheme'] ?? ''));
        $isLocalHost = in_array($originHost, ['localhost', '127.0.0.1', '::1'], true);
        $isOriginAllowed = $isLocalHost && in_array($originScheme, ['http', 'https'], true);
    }
}

if ($origin !== '' && $isOriginAllowed) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'httponly' => true,
    'secure' => false,
    'samesite' => 'Lax',
]);

$sessionPath = __DIR__ . '/.sessions';
if (!is_dir($sessionPath)) {
    mkdir($sessionPath, 0777, true);
}
if (is_dir($sessionPath) && is_writable($sessionPath)) {
    session_save_path($sessionPath);
}

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

function env_value(string $name, string $default = ''): string
{
    $value = getenv($name);
    if ($value === false || $value === '') {
        return $default;
    }

    return $value;
}

function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = env_value('MYSQL_HOST', '127.0.0.1');
    $port = env_value('MYSQL_PORT', '3306');
    $database = env_value('MYSQL_DATABASE', 'ansormalaysia_app');
    $username = env_value('MYSQL_USER', 'root');
    $password = env_value('MYSQL_PASSWORD', '');

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $database);

    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}

function json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        respond(['error' => 'Invalid JSON body'], 400);
    }

    return $decoded;
}

function respond(mixed $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function normalize_bool(mixed $value, bool $default = false): bool
{
    if (is_bool($value)) {
        return $value;
    }

    if (is_string($value)) {
        $normalized = strtolower(trim($value));
        if ($normalized === 'true' || $normalized === '1') {
            return true;
        }
        if ($normalized === 'false' || $normalized === '0') {
            return false;
        }
    }

    if (is_int($value)) {
        return $value === 1;
    }

    return $default;
}

function current_user(): ?array
{
    $userId = $_SESSION['user_id'] ?? null;
    if ($userId) {
        $stmt = db()->prepare('SELECT id, username, email, full_name, avatar_url, role, created_at FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch();

        if ($user) {
            return $user;
        }
    }

    $bearerToken = current_bearer_token();
    if ($bearerToken === null) {
        return null;
    }

    $user = find_user_by_auth_token($bearerToken);
    if (!$user) {
        return null;
    }

    $_SESSION['user_id'] = (int) $user['id'];

    return $user;
}

function ensure_auth_tokens_table(): void
{
    static $ensured = false;
    if ($ensured) {
        return;
    }

    db()->exec("CREATE TABLE IF NOT EXISTS auth_tokens (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        token_hash CHAR(64) NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        revoked_at TIMESTAMP NULL DEFAULT NULL,
        INDEX idx_auth_tokens_user_id (user_id),
        INDEX idx_auth_tokens_revoked_at (revoked_at),
        CONSTRAINT fk_auth_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB");

    $ensured = true;
}

function current_bearer_token(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;

    if (!is_string($header) || trim($header) === '') {
        return null;
    }

    if (!preg_match('/^Bearer\s+(.+)$/i', trim($header), $matches)) {
        return null;
    }

    $token = trim((string) ($matches[1] ?? ''));
    if ($token === '') {
        return null;
    }

    return $token;
}

function issue_auth_token(int $userId): string
{
    ensure_auth_tokens_table();

    $token = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);

    $stmt = db()->prepare('INSERT INTO auth_tokens (user_id, token_hash) VALUES (:user_id, :token_hash)');
    $stmt->execute([
        'user_id' => $userId,
        'token_hash' => $tokenHash,
    ]);

    return $token;
}

function find_user_by_auth_token(string $token): ?array
{
    ensure_auth_tokens_table();

    $tokenHash = hash('sha256', $token);
    $stmt = db()->prepare('SELECT u.id, u.username, u.email, u.full_name, u.avatar_url, u.role, u.created_at
        FROM auth_tokens t
        INNER JOIN users u ON u.id = t.user_id
        WHERE t.token_hash = :token_hash AND t.revoked_at IS NULL
        LIMIT 1');
    $stmt->execute(['token_hash' => $tokenHash]);

    $user = $stmt->fetch();

    return $user ?: null;
}

function revoke_auth_token(?string $token): void
{
    if (!is_string($token) || trim($token) === '') {
        return;
    }

    ensure_auth_tokens_table();

    $stmt = db()->prepare('UPDATE auth_tokens SET revoked_at = NOW() WHERE token_hash = :token_hash AND revoked_at IS NULL');
    $stmt->execute([
        'token_hash' => hash('sha256', $token),
    ]);
}

function require_auth(): array
{
    $user = current_user();
    if (!$user) {
        respond(['error' => 'Unauthorized'], 401);
    }

    return $user;
}

function require_admin(): array
{
    $user = require_auth();
    if (($user['role'] ?? 'user') !== 'admin') {
        respond(['error' => 'Forbidden'], 403);
    }

    return $user;
}

function profile_from_user(array $user): array
{
    return [
        'id' => (string) $user['id'],
        'email' => $user['email'],
        'full_name' => $user['full_name'],
        'avatar_url' => $user['avatar_url'],
        'role' => $user['role'],
        'created_at' => $user['created_at'],
    ];
}

function ensure_audit_logs_table(): void
{
    static $ensured = false;
    if ($ensured) {
        return;
    }

    db()->exec("CREATE TABLE IF NOT EXISTS audit_logs (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NULL,
        username VARCHAR(100) NULL,
        action VARCHAR(120) NOT NULL,
        target_type VARCHAR(80) NOT NULL,
        target_id VARCHAR(120) NULL,
        description TEXT NULL,
        ip_address VARCHAR(64) NULL,
        user_agent VARCHAR(255) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_logs_created_at (created_at),
        INDEX idx_audit_logs_action (action),
        INDEX idx_audit_logs_target (target_type, target_id)
    ) ENGINE=InnoDB");

    $ensured = true;
}

function write_audit_log(array $actor, string $action, string $targetType, ?string $targetId = null, ?string $description = null): void
{
    ensure_audit_logs_table();

    $ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? null;
    if (is_string($ipAddress) && str_contains($ipAddress, ',')) {
        $ipAddress = trim(explode(',', $ipAddress)[0]);
    }

    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;

    $stmt = db()->prepare('INSERT INTO audit_logs (user_id, username, action, target_type, target_id, description, ip_address, user_agent) VALUES (:user_id, :username, :action, :target_type, :target_id, :description, :ip_address, :user_agent)');
    $stmt->execute([
        'user_id' => isset($actor['id']) ? (int) $actor['id'] : null,
        'username' => $actor['username'] ?? null,
        'action' => $action,
        'target_type' => $targetType,
        'target_id' => $targetId,
        'description' => $description,
        'ip_address' => is_string($ipAddress) ? substr($ipAddress, 0, 64) : null,
        'user_agent' => is_string($userAgent) ? substr($userAgent, 0, 255) : null,
    ]);
}

function ensure_complaints_schema(): void
{
    static $ensured = false;
    if ($ensured) {
        return;
    }

    $columns = [
        'id_number' => 'ALTER TABLE complaints ADD COLUMN id_number VARCHAR(120) NULL AFTER issue',
        'birth_date' => 'ALTER TABLE complaints ADD COLUMN birth_date DATE NULL AFTER id_number',
        'malaysia_address' => 'ALTER TABLE complaints ADD COLUMN malaysia_address TEXT NULL AFTER birth_date',
        'phone_whatsapp' => 'ALTER TABLE complaints ADD COLUMN phone_whatsapp VARCHAR(50) NULL AFTER malaysia_address',
        'email' => 'ALTER TABLE complaints ADD COLUMN email VARCHAR(190) NULL AFTER phone_whatsapp',
        'employer_name' => 'ALTER TABLE complaints ADD COLUMN employer_name VARCHAR(190) NULL AFTER email',
        'employer_address' => 'ALTER TABLE complaints ADD COLUMN employer_address TEXT NULL AFTER employer_name',
        'job_type' => 'ALTER TABLE complaints ADD COLUMN job_type VARCHAR(190) NULL AFTER employer_address',
        'work_duration' => 'ALTER TABLE complaints ADD COLUMN work_duration VARCHAR(120) NULL AFTER job_type',
        'complaint_types' => 'ALTER TABLE complaints ADD COLUMN complaint_types LONGTEXT NULL AFTER work_duration',
        'complaint_other' => 'ALTER TABLE complaints ADD COLUMN complaint_other TEXT NULL AFTER complaint_types',
        'chronology' => 'ALTER TABLE complaints ADD COLUMN chronology LONGTEXT NULL AFTER complaint_other',
        'evidence_url' => 'ALTER TABLE complaints ADD COLUMN evidence_url VARCHAR(500) NULL AFTER chronology',
        'requested_action' => 'ALTER TABLE complaints ADD COLUMN requested_action LONGTEXT NULL AFTER evidence_url',
        'declaration_name' => 'ALTER TABLE complaints ADD COLUMN declaration_name VARCHAR(190) NULL AFTER requested_action',
        'declaration_date' => 'ALTER TABLE complaints ADD COLUMN declaration_date DATE NULL AFTER declaration_name',
        'declaration_signature' => 'ALTER TABLE complaints ADD COLUMN declaration_signature VARCHAR(190) NULL AFTER declaration_date',
        'declaration_agreed' => 'ALTER TABLE complaints ADD COLUMN declaration_agreed TINYINT(1) NOT NULL DEFAULT 0 AFTER declaration_signature',
    ];

    foreach ($columns as $columnName => $alterSql) {
        $quotedColumn = db()->quote($columnName);
        $exists = db()->query('SHOW COLUMNS FROM complaints LIKE ' . $quotedColumn)->fetch();

        if (!$exists) {
            db()->exec($alterSql);
        }
    }

    $ensured = true;
}

function as_non_empty_string(mixed $value): ?string
{
    if (!is_string($value)) {
        if (is_numeric($value)) {
            $value = (string) $value;
        } else {
            return null;
        }
    }

    $trimmed = trim($value);
    return $trimmed === '' ? null : $trimmed;
}

function as_nullable_float(mixed $value): ?float
{
    if ($value === null || $value === '') {
        return null;
    }

    if (!is_numeric($value)) {
        return null;
    }

    return (float) $value;
}

function as_nullable_int(mixed $value): ?int
{
    if ($value === null || $value === '') {
        return null;
    }

    if (!is_numeric($value)) {
        return null;
    }

    return (int) round((float) $value);
}

function pick_first_value(array $row, array $keys): mixed
{
    foreach ($keys as $key) {
        if (array_key_exists($key, $row) && $row[$key] !== null && $row[$key] !== '') {
            return $row[$key];
        }
    }

    return null;
}

function is_malaysia_value(mixed $value): bool
{
    if (!is_string($value) && !is_numeric($value)) {
        return false;
    }

    $normalized = strtoupper(trim((string) $value));
    if ($normalized === '') {
        return false;
    }

    return in_array($normalized, ['MY', 'MYS', 'MALAYSIA', 'MALAYSIA, MY'], true);
}

function http_get_json(string $url, int $timeoutSeconds = 12): ?array
{
    $url = trim($url);
    if ($url === '') {
        return null;
    }

    $body = null;

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        if ($ch === false) {
            return null;
        }

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => $timeoutSeconds,
            CURLOPT_TIMEOUT => $timeoutSeconds,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
        ]);

        $response = curl_exec($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $hasError = curl_errno($ch) !== 0;
        curl_close($ch);

        if ($hasError || !is_string($response) || $httpCode < 200 || $httpCode >= 300) {
            return null;
        }

        $body = $response;
    } else {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => $timeoutSeconds,
                'header' => "Accept: application/json\r\n",
            ],
        ]);

        $response = @file_get_contents($url, false, $context);
        if ($response === false || !is_string($response)) {
            return null;
        }

        $body = $response;
    }

    $decoded = json_decode($body, true);
    return is_array($decoded) ? $decoded : null;
}

function extract_external_rows(array $payload): array
{
    if (array_is_list($payload)) {
        return $payload;
    }

    foreach (['data', 'items', 'results', 'rows'] as $key) {
        if (isset($payload[$key]) && is_array($payload[$key])) {
            return $payload[$key];
        }
    }

    return [];
}

function split_env_list(string $value): array
{
    if (trim($value) === '') {
        return [];
    }

    return array_values(array_filter(array_map(static fn (string $part): string => trim($part), explode(',', $value)), static fn (string $part): bool => $part !== ''));
}

function get_nested_value(array $row, string $path): mixed
{
    $current = $row;
    foreach (explode('.', $path) as $segment) {
        $segment = trim($segment);
        if ($segment === '') {
            return null;
        }

        if (is_array($current) && array_key_exists($segment, $current)) {
            $current = $current[$segment];
            continue;
        }

        return null;
    }

    return $current;
}

function pick_first_value_by_paths(array $row, array $paths): mixed
{
    foreach ($paths as $path) {
        if (!is_string($path) || trim($path) === '') {
            continue;
        }

        $value = str_contains($path, '.') ? get_nested_value($row, $path) : ($row[$path] ?? null);
        if ($value !== null && $value !== '') {
            return $value;
        }
    }

    return null;
}

function get_kp2mi_field_map(): array
{
    $map = [
        'title' => split_env_list(env_value('KP2MI_FIELD_TITLE', 'title,judul,name,nama')),
        'image_url' => split_env_list(env_value('KP2MI_FIELD_IMAGE_URL', 'image_url,image,gambar,thumbnail,img_url')),
        'description' => split_env_list(env_value('KP2MI_FIELD_DESCRIPTION', 'description,deskripsi,desc,ringkasan')),
        'location_name' => split_env_list(env_value('KP2MI_FIELD_LOCATION', 'location_name,lokasi,wilayah,state,province,kota,city')),
        'data_type' => split_env_list(env_value('KP2MI_FIELD_DATA_TYPE', 'data_type,type,kategori,metric')),
        'latitude' => split_env_list(env_value('KP2MI_FIELD_LATITUDE', 'latitude,lat,coordinate.lat')),
        'longitude' => split_env_list(env_value('KP2MI_FIELD_LONGITUDE', 'longitude,lng,lon,coordinate.lng')),
        'data_value' => split_env_list(env_value('KP2MI_FIELD_DATA_VALUE', 'data_value,value,jumlah,total,count')),
        'created_at' => split_env_list(env_value('KP2MI_FIELD_CREATED_AT', 'created_at,updated_at,tanggal,date')),
        'country' => split_env_list(env_value('KP2MI_FIELD_COUNTRY', 'country,country_name,negara,kode_negara,countryCode,negara.kode')),
        'country_code' => split_env_list(env_value('KP2MI_FIELD_COUNTRY_CODE', 'country_code,countryCode,kode_negara,negara.kode')),
    ];

    return $map;
}

function resolve_rows_by_path(array $payload, string $path): array
{
    $path = trim($path);
    if ($path === '') {
        return extract_external_rows($payload);
    }

    $value = get_nested_value($payload, $path);
    if (is_array($value) && array_is_list($value)) {
        return $value;
    }

    if (is_array($value)) {
        foreach (['data', 'items', 'rows', 'results'] as $childKey) {
            if (isset($value[$childKey]) && is_array($value[$childKey]) && array_is_list($value[$childKey])) {
                return $value[$childKey];
            }
        }
    }

    return [];
}

function normalize_external_infographic_item(array $row, int $index, array $fieldMap): ?array
{
    $country = pick_first_value_by_paths($row, $fieldMap['country'] ?? []);
    $countryCode = pick_first_value_by_paths($row, $fieldMap['country_code'] ?? []);
    $hasCountryInfo = $country !== null || $countryCode !== null;
    if ($hasCountryInfo && !is_malaysia_value($country ?? $countryCode)) {
        return null;
    }

    $title = as_non_empty_string(pick_first_value_by_paths($row, $fieldMap['title'] ?? []));
    if ($title === null) {
        $title = 'Data Malaysia #' . ($index + 1);
    }

    $imageUrl = as_non_empty_string(pick_first_value_by_paths($row, $fieldMap['image_url'] ?? []));
    $description = as_non_empty_string(pick_first_value_by_paths($row, $fieldMap['description'] ?? []));
    $locationName = as_non_empty_string(pick_first_value_by_paths($row, $fieldMap['location_name'] ?? []));
    $dataType = as_non_empty_string(pick_first_value_by_paths($row, $fieldMap['data_type'] ?? []));

    $latitude = as_nullable_float(pick_first_value_by_paths($row, $fieldMap['latitude'] ?? []));
    $longitude = as_nullable_float(pick_first_value_by_paths($row, $fieldMap['longitude'] ?? []));
    $dataValue = as_nullable_int(pick_first_value_by_paths($row, $fieldMap['data_value'] ?? []));
    $createdAt = as_non_empty_string(pick_first_value_by_paths($row, $fieldMap['created_at'] ?? [])) ?? gmdate('Y-m-d H:i:s');

    return [
        'id' => 'ext-' . substr(hash('sha1', $title . '|' . ($locationName ?? '') . '|' . ($dataType ?? '') . '|' . (string) ($dataValue ?? '')), 0, 16),
        'title' => $title,
        'image_url' => $imageUrl ?? '',
        'description' => $description,
        'location_name' => $locationName,
        'latitude' => $latitude,
        'longitude' => $longitude,
        'data_value' => $dataValue,
        'data_type' => $dataType,
        'created_at' => $createdAt,
        'source' => 'kp2mi',
    ];
}

function load_kp2mi_malaysia_infographics(bool $forceRefresh = false): array
{
    $url = env_value('KP2MI_MALAYSIA_DATA_URL', '');
    $ttl = (int) env_value('KP2MI_CACHE_TTL_SECONDS', '1800');
    if ($ttl < 60) {
        $ttl = 60;
    }

    $cacheDir = __DIR__ . '/.cache';
    $cacheFile = $cacheDir . '/kp2mi-malaysia-infographics.json';

    if (!$forceRefresh && is_file($cacheFile)) {
        $rawCache = @file_get_contents($cacheFile);
        if (is_string($rawCache) && $rawCache !== '') {
            $parsedCache = json_decode($rawCache, true);
            if (is_array($parsedCache)) {
                $cachedAt = isset($parsedCache['cached_at']) ? (int) $parsedCache['cached_at'] : 0;
                $cachedItems = isset($parsedCache['items']) && is_array($parsedCache['items']) ? $parsedCache['items'] : [];

                if ($cachedAt > 0 && (time() - $cachedAt) <= $ttl && $cachedItems !== []) {
                    return [
                        'ok' => true,
                        'items' => $cachedItems,
                        'source' => 'cache',
                        'updated_at' => gmdate('c', $cachedAt),
                    ];
                }
            }
        }
    }

    if ($url === '') {
        return [
            'ok' => false,
            'items' => [],
            'source' => 'none',
            'updated_at' => null,
            'error' => 'KP2MI_MALAYSIA_DATA_URL belum diatur',
        ];
    }

    $payload = http_get_json($url);
    if (!is_array($payload)) {
        if (is_file($cacheFile)) {
            $rawCache = @file_get_contents($cacheFile);
            $parsedCache = is_string($rawCache) ? json_decode($rawCache, true) : null;
            if (is_array($parsedCache) && isset($parsedCache['items']) && is_array($parsedCache['items']) && $parsedCache['items'] !== []) {
                return [
                    'ok' => true,
                    'items' => $parsedCache['items'],
                    'source' => 'cache-fallback',
                    'updated_at' => isset($parsedCache['cached_at']) ? gmdate('c', (int) $parsedCache['cached_at']) : null,
                ];
            }
        }

        return [
            'ok' => false,
            'items' => [],
            'source' => 'none',
            'updated_at' => null,
            'error' => 'Gagal mengambil data eksternal KP2MI',
        ];
    }

    $responsePath = env_value('KP2MI_RESPONSE_PATH', '');
    $fieldMap = get_kp2mi_field_map();

    $rows = resolve_rows_by_path($payload, $responsePath);
    if ($rows === []) {
        $rows = extract_external_rows($payload);
    }

    $normalized = [];
    foreach ($rows as $index => $row) {
        if (!is_array($row)) {
            continue;
        }

        $item = normalize_external_infographic_item($row, $index, $fieldMap);
        if ($item !== null) {
            $normalized[] = $item;
        }
    }

    if ($normalized === []) {
        return [
            'ok' => false,
            'items' => [],
            'source' => 'none',
            'updated_at' => null,
            'error' => 'Data eksternal tersedia tetapi tidak ada item Malaysia yang valid',
        ];
    }

    if (!is_dir($cacheDir)) {
        @mkdir($cacheDir, 0777, true);
    }

    @file_put_contents($cacheFile, json_encode([
        'cached_at' => time(),
        'response_path' => $responsePath,
        'items' => $normalized,
    ], JSON_UNESCAPED_UNICODE));

    return [
        'ok' => true,
        'items' => $normalized,
        'source' => 'live',
        'updated_at' => gmdate('c'),
    ];
}
