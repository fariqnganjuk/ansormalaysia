<?php

declare(strict_types=1);

require __DIR__ . '/config.php';

$route = trim((string) ($_GET['route'] ?? ''), '/');
$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$segments = $route === '' ? [] : explode('/', $route);

function ensure_external_news_table(): void
{
    db()->exec("CREATE TABLE IF NOT EXISTS external_news (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        source_name VARCHAR(120) NOT NULL,
        source_link VARCHAR(700) NOT NULL,
        title VARCHAR(300) NOT NULL,
        excerpt TEXT NULL,
        image_url VARCHAR(700) NULL,
        published_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_external_news_source_link (source_link),
        INDEX idx_external_news_published_at (published_at),
        INDEX idx_external_news_source_name (source_name)
    ) ENGINE=InnoDB");
}

function external_news_default_feeds(): array
{
    return [
        ['name' => 'Kompas', 'url' => 'https://rss.kompas.com/rss/news'],
        ['name' => 'NU Online', 'url' => 'https://www.nu.or.id/rss'],
        ['name' => 'Detik', 'url' => 'https://rss.detik.com/index.php/detikcom'],
    ];
}

function external_news_feeds(): array
{
    $raw = trim(env_value('RSS_FEEDS', ''));
    if ($raw === '') {
        return external_news_default_feeds();
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return external_news_default_feeds();
    }

    $feeds = [];
    foreach ($decoded as $item) {
        if (!is_array($item)) {
            continue;
        }

        $name = trim((string) ($item['name'] ?? ''));
        $url = trim((string) ($item['url'] ?? ''));
        if ($name === '' || $url === '') {
            continue;
        }

        $feeds[] = ['name' => $name, 'url' => $url];
    }

    return $feeds !== [] ? $feeds : external_news_default_feeds();
}

function fetch_text_url(string $url): string
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_USERAGENT => 'ANSOR Malaysia RSS Fetcher/1.0',
        ]);
        $result = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if (is_string($result) && $result !== '' && $code >= 200 && $code < 400) {
            return $result;
        }
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 12,
            'header' => "User-Agent: ANSOR Malaysia RSS Fetcher/1.0\r\n",
        ],
    ]);
    $data = @file_get_contents($url, false, $context);
    return is_string($data) ? $data : '';
}

function normalize_external_news_date(?string $input): ?string
{
    if (!is_string($input) || trim($input) === '') {
        return null;
    }

    $timestamp = strtotime($input);
    if ($timestamp === false) {
        return null;
    }

    return gmdate('Y-m-d H:i:s', $timestamp);
}

function clean_external_news_text(?string $text, int $maxLen = 260): ?string
{
    if (!is_string($text) || trim($text) === '') {
        return null;
    }

    $plain = trim(preg_replace('/\s+/', ' ', strip_tags($text)) ?? '');
    if ($plain === '') {
        return null;
    }

    if (mb_strlen($plain) <= $maxLen) {
        return $plain;
    }

    return rtrim(mb_substr($plain, 0, $maxLen - 1)) . '…';
}

function parse_external_news_items(string $sourceName, string $xmlText): array
{
    if (trim($xmlText) === '') {
        return [];
    }

    libxml_use_internal_errors(true);
    $xml = simplexml_load_string($xmlText, 'SimpleXMLElement', LIBXML_NOCDATA);
    if (!$xml instanceof SimpleXMLElement) {
        libxml_clear_errors();
        return [];
    }

    $items = [];
    $nodeList = [];

    if (isset($xml->channel->item)) {
        foreach ($xml->channel->item as $item) {
            $nodeList[] = $item;
        }
    } elseif (isset($xml->entry)) {
        foreach ($xml->entry as $entry) {
            $nodeList[] = $entry;
        }
    }

    foreach ($nodeList as $node) {
        $title = trim((string) ($node->title ?? ''));
        if ($title === '') {
            continue;
        }

        $link = trim((string) ($node->link ?? ''));
        if ($link === '' && isset($node->link)) {
            foreach ($node->link->attributes() as $key => $value) {
                if ((string) $key === 'href') {
                    $link = trim((string) $value);
                    break;
                }
            }
        }

        if ($link === '') {
            continue;
        }

        $description = clean_external_news_text((string) ($node->description ?? $node->summary ?? $node->content ?? ''), 280);

        $publishedAt = normalize_external_news_date((string) ($node->pubDate ?? $node->published ?? $node->updated ?? null));

        $imageUrl = null;
        if (isset($node->enclosure)) {
            foreach ($node->enclosure->attributes() as $key => $value) {
                if ((string) $key === 'url') {
                    $imageUrl = trim((string) $value);
                    break;
                }
            }
        }

        if (!$imageUrl && isset($node->children('media', true)->content)) {
            foreach ($node->children('media', true)->content as $mediaContent) {
                foreach ($mediaContent->attributes() as $key => $value) {
                    if ((string) $key === 'url') {
                        $imageUrl = trim((string) $value);
                        break 2;
                    }
                }
            }
        }

        $items[] = [
            'source_name' => $sourceName,
            'source_link' => $link,
            'title' => $title,
            'excerpt' => $description,
            'image_url' => $imageUrl !== '' ? $imageUrl : null,
            'published_at' => $publishedAt,
        ];
    }

    return $items;
}

function refresh_external_news_feed(): array
{
    ensure_external_news_table();

    $feeds = external_news_feeds();
    $pdo = db();

    $upsert = $pdo->prepare('INSERT INTO external_news (source_name, source_link, title, excerpt, image_url, published_at) VALUES (:source_name, :source_link, :title, :excerpt, :image_url, :published_at)
        ON DUPLICATE KEY UPDATE source_name = VALUES(source_name), title = VALUES(title), excerpt = VALUES(excerpt), image_url = VALUES(image_url), published_at = VALUES(published_at), updated_at = CURRENT_TIMESTAMP');

    $inserted = 0;
    foreach ($feeds as $feed) {
        $xml = fetch_text_url((string) $feed['url']);
        $items = parse_external_news_items((string) $feed['name'], $xml);
        foreach ($items as $item) {
            $upsert->execute([
                'source_name' => $item['source_name'],
                'source_link' => $item['source_link'],
                'title' => $item['title'],
                'excerpt' => $item['excerpt'],
                'image_url' => $item['image_url'],
                'published_at' => $item['published_at'],
            ]);
            $inserted++;
        }
    }

    return [
        'ok' => true,
        'processed' => $inserted,
        'updated_at' => gmdate('Y-m-d H:i:s'),
    ];
}

function list_external_news_public(int $limit): array
{
    ensure_external_news_table();
    $stmt = db()->prepare('SELECT id, source_name, source_link, title, excerpt, image_url, published_at, created_at FROM external_news ORDER BY COALESCE(published_at, created_at) DESC LIMIT :limit');
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll();

    return array_map(static function (array $row): array {
        return [
            'id' => (string) $row['id'],
            'source_name' => $row['source_name'],
            'source_link' => $row['source_link'],
            'title' => $row['title'],
            'excerpt' => $row['excerpt'],
            'image_url' => $row['image_url'],
            'published_at' => $row['published_at'],
            'created_at' => $row['created_at'],
        ];
    }, $rows);
}

try {
    if ($route === '') {
        respond(['name' => 'ANSOR Malaysia PHP API', 'ok' => true]);
    }

    if ($segments[0] === 'auth') {
        if ($method === 'POST' && ($segments[1] ?? '') === 'login') {
            $body = json_body();
            $username = trim((string) ($body['username'] ?? ''));
            $password = (string) ($body['password'] ?? '');

            if ($username === '' || $password === '') {
                respond(['error' => 'Username dan password wajib diisi'], 422);
            }

            $stmt = db()->prepare('SELECT id, username, email, full_name, avatar_url, role, created_at, password_hash FROM users WHERE username = :username LIMIT 1');
            $stmt->execute(['username' => $username]);
            $user = $stmt->fetch();

            if (!$user || !password_verify($password, (string) $user['password_hash'])) {
                respond(['error' => 'Username atau password salah'], 401);
            }

            $_SESSION['user_id'] = (int) $user['id'];
            $token = issue_auth_token((int) $user['id']);
            unset($user['password_hash']);

            respond([
                'user' => [
                    'id' => (string) $user['id'],
                    'email' => $user['email'],
                    'username' => $user['username'],
                ],
                'profile' => profile_from_user($user),
                'token' => $token,
            ]);
        }

        if ($method === 'POST' && ($segments[1] ?? '') === 'register') {
            $body = json_body();
            $username = trim((string) ($body['username'] ?? ''));
            $password = (string) ($body['password'] ?? '');

            if ($username === '' || strlen($password) < 6) {
                respond(['error' => 'Username wajib dan password minimal 6 karakter'], 422);
            }

            $email = $username . '@miaoda.com';
            $pdo = db();
            $pdo->beginTransaction();

            $count = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
            $role = $count === 0 ? 'admin' : 'user';
            $hash = password_hash($password, PASSWORD_DEFAULT);

            try {
                $stmt = $pdo->prepare('INSERT INTO users (username, email, password_hash, role) VALUES (:username, :email, :password_hash, :role)');
                $stmt->execute([
                    'username' => $username,
                    'email' => $email,
                    'password_hash' => $hash,
                    'role' => $role,
                ]);
                $userId = (int) $pdo->lastInsertId();
                $pdo->commit();
            } catch (PDOException $exception) {
                $pdo->rollBack();
                if ((int) $exception->getCode() === 23000) {
                    respond(['error' => 'Username sudah terdaftar'], 409);
                }

                throw $exception;
            }

            $_SESSION['user_id'] = $userId;
            $token = issue_auth_token($userId);
            $stmt = $pdo->prepare('SELECT id, username, email, full_name, avatar_url, role, created_at FROM users WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $userId]);
            $user = $stmt->fetch();

            respond([
                'user' => [
                    'id' => (string) $user['id'],
                    'email' => $user['email'],
                    'username' => $user['username'],
                ],
                'profile' => profile_from_user($user),
                'token' => $token,
            ], 201);
        }

        if ($method === 'POST' && ($segments[1] ?? '') === 'logout') {
            revoke_auth_token(current_bearer_token());
            $_SESSION = [];
            if (ini_get('session.use_cookies')) {
                $params = session_get_cookie_params();
                setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', (bool) $params['secure'], (bool) $params['httponly']);
            }
            session_destroy();
            respond(['ok' => true]);
        }

        if ($method === 'GET' && ($segments[1] ?? '') === 'session') {
            $user = current_user();
            if (!$user) {
                respond(['user' => null, 'profile' => null]);
            }

            respond([
                'user' => [
                    'id' => (string) $user['id'],
                    'email' => $user['email'],
                    'username' => $user['username'],
                ],
                'profile' => profile_from_user($user),
            ]);
        }
    }

    if ($segments[0] === 'profiles' && $method === 'GET' && isset($segments[1])) {
        $requestingUser = require_auth();
        $requestedId = (int) $segments[1];
        if ((int) $requestingUser['id'] !== $requestedId && ($requestingUser['role'] ?? 'user') !== 'admin') {
            respond(['error' => 'Forbidden'], 403);
        }

        $stmt = db()->prepare('SELECT id, email, full_name, avatar_url, role, created_at FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $requestedId]);
        $profile = $stmt->fetch();

        respond($profile ?: null);
    }

    if ($segments[0] === 'users') {
        if ($method === 'GET' && count($segments) === 1) {
            require_admin();
            $stmt = db()->query('SELECT id, username, email, full_name, avatar_url, role, created_at FROM users ORDER BY created_at DESC');
            $rows = $stmt->fetchAll();
            $result = array_map(static function (array $row): array {
                return [
                    'id' => (string) $row['id'],
                    'username' => $row['username'],
                    'email' => $row['email'],
                    'full_name' => $row['full_name'],
                    'avatar_url' => $row['avatar_url'],
                    'role' => $row['role'],
                    'created_at' => $row['created_at'],
                ];
            }, $rows);
            respond($result);
        }

        if ($method === 'POST' && count($segments) === 1) {
            $admin = require_admin();
            $body = json_body();

            $username = trim((string) ($body['username'] ?? ''));
            $password = (string) ($body['password'] ?? '');

            if ($username === '' || strlen($password) < 6) {
                respond(['error' => 'Username wajib dan password minimal 6 karakter'], 422);
            }

            $stmt = db()->prepare('INSERT INTO users (username, email, password_hash, full_name, avatar_url, role) VALUES (:username, :email, :password_hash, :full_name, :avatar_url, :role)');
            $stmt->execute([
                'username' => $username,
                'email' => trim((string) ($body['email'] ?? ($username . '@miaoda.com'))),
                'password_hash' => password_hash($password, PASSWORD_DEFAULT),
                'full_name' => $body['full_name'] ?? null,
                'avatar_url' => $body['avatar_url'] ?? null,
                'role' => in_array(($body['role'] ?? 'user'), ['admin', 'user'], true) ? $body['role'] : 'user',
            ]);

            $id = (int) db()->lastInsertId();
            $stmt = db()->prepare('SELECT id, username, email, full_name, avatar_url, role, created_at FROM users WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $id]);
            $created = $stmt->fetch();

            write_audit_log(
                $admin,
                'create_user',
                'user',
                (string) $id,
                'Membuat user ' . $created['username'] . ' dengan role ' . $created['role']
            );

            respond([
                'id' => (string) $created['id'],
                'username' => $created['username'],
                'email' => $created['email'],
                'full_name' => $created['full_name'],
                'avatar_url' => $created['avatar_url'],
                'role' => $created['role'],
                'created_at' => $created['created_at'],
            ], 201);
        }

        if ($method === 'PUT' && count($segments) === 2) {
            $admin = require_admin();
            $id = (int) $segments[1];
            $body = json_body();

            $stmt = db()->prepare('SELECT id, role FROM users WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $id]);
            $existing = $stmt->fetch();

            if (!$existing) {
                respond(['error' => 'User tidak ditemukan'], 404);
            }

            $newRole = in_array(($body['role'] ?? $existing['role']), ['admin', 'user'], true) ? $body['role'] : $existing['role'];
            if ((int) $admin['id'] === $id && $newRole !== 'admin') {
                respond(['error' => 'Role akun Anda sendiri tidak bisa diturunkan'], 422);
            }

            $stmt = db()->prepare('UPDATE users SET username = :username, email = :email, full_name = :full_name, avatar_url = :avatar_url, role = :role WHERE id = :id');
            $stmt->execute([
                'id' => $id,
                'username' => trim((string) ($body['username'] ?? '')),
                'email' => trim((string) ($body['email'] ?? '')),
                'full_name' => $body['full_name'] ?? null,
                'avatar_url' => $body['avatar_url'] ?? null,
                'role' => $newRole,
            ]);

            if (isset($body['password']) && is_string($body['password']) && $body['password'] !== '') {
                if (strlen($body['password']) < 6) {
                    respond(['error' => 'Password minimal 6 karakter'], 422);
                }

                $stmt = db()->prepare('UPDATE users SET password_hash = :password_hash WHERE id = :id');
                $stmt->execute([
                    'id' => $id,
                    'password_hash' => password_hash($body['password'], PASSWORD_DEFAULT),
                ]);
            }

            $stmt = db()->prepare('SELECT id, username, email, full_name, avatar_url, role, created_at FROM users WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $id]);
            $updated = $stmt->fetch();

            write_audit_log(
                $admin,
                'update_user',
                'user',
                (string) $id,
                'Memperbarui user ' . $updated['username'] . ' dengan role ' . $updated['role']
            );

            respond([
                'id' => (string) $updated['id'],
                'username' => $updated['username'],
                'email' => $updated['email'],
                'full_name' => $updated['full_name'],
                'avatar_url' => $updated['avatar_url'],
                'role' => $updated['role'],
                'created_at' => $updated['created_at'],
            ]);
        }

        if ($method === 'DELETE' && count($segments) === 2) {
            $admin = require_admin();
            $id = (int) $segments[1];

            if ((int) $admin['id'] === $id) {
                respond(['error' => 'Akun Anda sendiri tidak bisa dihapus'], 422);
            }

            $stmt = db()->prepare('DELETE FROM users WHERE id = :id');
            $stmt->execute(['id' => $id]);

            write_audit_log(
                $admin,
                'delete_user',
                'user',
                (string) $id,
                'Menghapus user dengan id ' . $id
            );

            respond(['ok' => true]);
        }
    }

    if ($segments[0] === 'audit-logs' && $method === 'GET' && count($segments) === 1) {
        require_admin();
        ensure_audit_logs_table();

        $limit = (int) ($_GET['limit'] ?? 100);
        $offset = (int) ($_GET['offset'] ?? 0);

        $limit = max(1, min(300, $limit));
        $offset = max(0, $offset);

        $stmt = db()->prepare('SELECT id, user_id, username, action, target_type, target_id, description, ip_address, user_agent, created_at FROM audit_logs ORDER BY created_at DESC, id DESC LIMIT :limit OFFSET :offset');
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        $result = array_map(static function (array $row): array {
            return [
                'id' => (string) $row['id'],
                'user_id' => $row['user_id'] !== null ? (string) $row['user_id'] : null,
                'username' => $row['username'],
                'action' => $row['action'],
                'target_type' => $row['target_type'],
                'target_id' => $row['target_id'],
                'description' => $row['description'],
                'ip_address' => $row['ip_address'],
                'user_agent' => $row['user_agent'],
                'created_at' => $row['created_at'],
            ];
        }, $rows);

        respond($result);
    }

    if ($segments[0] === 'posts') {
        if ($method === 'GET' && count($segments) === 1) {
            $type = trim((string) ($_GET['type'] ?? ''));
            $limit = (int) ($_GET['limit'] ?? 10);
            $offset = (int) ($_GET['offset'] ?? 0);
            $publishedOnly = normalize_bool($_GET['publishedOnly'] ?? 'true', true);

            $limit = max(1, min(100, $limit));
            $offset = max(0, $offset);

            $where = [];
            $params = [];

            if ($type !== '') {
                $where[] = 'p.type = :type';
                $params['type'] = $type;
            }
            if ($publishedOnly) {
                $where[] = 'p.is_published = 1';
            }

            $sql = 'SELECT p.id, p.title, p.slug, p.content, p.excerpt, p.type, p.category, p.image_url, p.author_id, p.is_published, p.published_at, p.created_at, u.id AS profile_id, u.email AS profile_email, u.full_name AS profile_full_name, u.avatar_url AS profile_avatar_url, u.role AS profile_role, u.created_at AS profile_created_at FROM posts p LEFT JOIN users u ON u.id = p.author_id';

            if ($where !== []) {
                $sql .= ' WHERE ' . implode(' AND ', $where);
            }

            $sql .= ' ORDER BY p.created_at DESC LIMIT :limit OFFSET :offset';

            $stmt = db()->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue(':' . $key, $value);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            $rows = $stmt->fetchAll();

            $result = array_map(static function (array $row): array {
                return [
                    'id' => (string) $row['id'],
                    'title' => $row['title'],
                    'slug' => $row['slug'],
                    'content' => $row['content'],
                    'excerpt' => $row['excerpt'],
                    'type' => $row['type'],
                    'category' => $row['category'],
                    'image_url' => $row['image_url'],
                    'author_id' => $row['author_id'] !== null ? (string) $row['author_id'] : null,
                    'is_published' => (bool) $row['is_published'],
                    'published_at' => $row['published_at'],
                    'created_at' => $row['created_at'],
                    'profiles' => $row['profile_id'] ? [
                        'id' => (string) $row['profile_id'],
                        'email' => $row['profile_email'],
                        'full_name' => $row['profile_full_name'],
                        'avatar_url' => $row['profile_avatar_url'],
                        'role' => $row['profile_role'],
                        'created_at' => $row['profile_created_at'],
                    ] : null,
                ];
            }, $rows);

            respond($result);
        }

        if ($method === 'GET' && ($segments[1] ?? '') === 'slug' && isset($segments[2])) {
            $slug = urldecode($segments[2]);
            $stmt = db()->prepare('SELECT p.id, p.title, p.slug, p.content, p.excerpt, p.type, p.category, p.image_url, p.author_id, p.is_published, p.published_at, p.created_at, u.id AS profile_id, u.email AS profile_email, u.full_name AS profile_full_name, u.avatar_url AS profile_avatar_url, u.role AS profile_role, u.created_at AS profile_created_at FROM posts p LEFT JOIN users u ON u.id = p.author_id WHERE p.slug = :slug LIMIT 1');
            $stmt->execute(['slug' => $slug]);
            $row = $stmt->fetch();

            if (!$row) {
                respond(null);
            }

            respond([
                'id' => (string) $row['id'],
                'title' => $row['title'],
                'slug' => $row['slug'],
                'content' => $row['content'],
                'excerpt' => $row['excerpt'],
                'type' => $row['type'],
                'category' => $row['category'],
                'image_url' => $row['image_url'],
                'author_id' => $row['author_id'] !== null ? (string) $row['author_id'] : null,
                'is_published' => (bool) $row['is_published'],
                'published_at' => $row['published_at'],
                'created_at' => $row['created_at'],
                'profiles' => $row['profile_id'] ? [
                    'id' => (string) $row['profile_id'],
                    'email' => $row['profile_email'],
                    'full_name' => $row['profile_full_name'],
                    'avatar_url' => $row['profile_avatar_url'],
                    'role' => $row['profile_role'],
                    'created_at' => $row['profile_created_at'],
                ] : null,
            ]);
        }

        if ($method === 'POST' && count($segments) === 1) {
            $admin = require_auth();
            $body = json_body();

            $stmt = db()->prepare('INSERT INTO posts (title, slug, content, excerpt, type, category, image_url, author_id, is_published, published_at) VALUES (:title, :slug, :content, :excerpt, :type, :category, :image_url, :author_id, :is_published, :published_at)');
            $stmt->execute([
                'title' => trim((string) ($body['title'] ?? '')),
                'slug' => trim((string) ($body['slug'] ?? '')),
                'content' => $body['content'] ?? null,
                'excerpt' => $body['excerpt'] ?? null,
                'type' => (string) ($body['type'] ?? ''),
                'category' => $body['category'] ?? null,
                'image_url' => $body['image_url'] ?? null,
                'author_id' => (int) ($body['author_id'] ?? $admin['id']),
                'is_published' => normalize_bool($body['is_published'] ?? false, false) ? 1 : 0,
                'published_at' => $body['published_at'] ?? null,
            ]);

            $id = (int) db()->lastInsertId();
            $stmt = db()->prepare('SELECT id, title, slug, content, excerpt, type, category, image_url, author_id, is_published, published_at, created_at FROM posts WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $id]);
            $created = $stmt->fetch();

            $created['id'] = (string) $created['id'];
            $created['author_id'] = $created['author_id'] !== null ? (string) $created['author_id'] : null;
            $created['is_published'] = (bool) $created['is_published'];

            write_audit_log(
                $admin,
                'create_post',
                'post',
                (string) $id,
                'Membuat konten: ' . $created['title']
            );

            respond($created, 201);
        }

        if ($method === 'PUT' && count($segments) === 2) {
            $admin = require_auth();
            $id = (int) $segments[1];
            $body = json_body();

            $stmt = db()->prepare('UPDATE posts SET title = :title, slug = :slug, content = :content, excerpt = :excerpt, type = :type, category = :category, image_url = :image_url, author_id = :author_id, is_published = :is_published, published_at = :published_at WHERE id = :id');
            $stmt->execute([
                'id' => $id,
                'title' => trim((string) ($body['title'] ?? '')),
                'slug' => trim((string) ($body['slug'] ?? '')),
                'content' => $body['content'] ?? null,
                'excerpt' => $body['excerpt'] ?? null,
                'type' => (string) ($body['type'] ?? ''),
                'category' => $body['category'] ?? null,
                'image_url' => $body['image_url'] ?? null,
                'author_id' => isset($body['author_id']) ? (int) $body['author_id'] : null,
                'is_published' => normalize_bool($body['is_published'] ?? false, false) ? 1 : 0,
                'published_at' => $body['published_at'] ?? null,
            ]);

            $stmt = db()->prepare('SELECT id, title, slug, content, excerpt, type, category, image_url, author_id, is_published, published_at, created_at FROM posts WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $id]);
            $updated = $stmt->fetch();

            if (!$updated) {
                respond(['error' => 'Post tidak ditemukan'], 404);
            }

            $updated['id'] = (string) $updated['id'];
            $updated['author_id'] = $updated['author_id'] !== null ? (string) $updated['author_id'] : null;
            $updated['is_published'] = (bool) $updated['is_published'];

            write_audit_log(
                $admin,
                'update_post',
                'post',
                (string) $id,
                'Memperbarui konten: ' . $updated['title']
            );

            respond($updated);
        }

        if ($method === 'DELETE' && count($segments) === 2) {
            $admin = require_auth();
            $id = (int) $segments[1];
            $stmt = db()->prepare('DELETE FROM posts WHERE id = :id');
            $stmt->execute(['id' => $id]);

            write_audit_log(
                $admin,
                'delete_post',
                'post',
                (string) $id,
                'Menghapus konten dengan id ' . $id
            );

            respond(['ok' => true]);
        }
    }

    if ($segments[0] === 'external-news') {
        if ($method === 'GET' && count($segments) === 2 && $segments[1] === 'public') {
            $limit = (int) ($_GET['limit'] ?? 20);
            $limit = max(1, min(100, $limit));

            $items = list_external_news_public($limit);

            respond([
                'items' => $items,
                'meta' => [
                    'count' => count($items),
                ],
            ]);
        }

        if ($method === 'POST' && count($segments) === 2 && $segments[1] === 'refresh') {
            $admin = require_auth();
            $result = refresh_external_news_feed();

            write_audit_log(
                $admin,
                'refresh_external_news',
                'external_news',
                null,
                'Refresh RSS external news'
            );

            respond($result);
        }
    }

    if ($segments[0] === 'complaints') {
        ensure_complaints_schema();

        if ($method === 'GET' && count($segments) === 1) {
            require_auth();
            $stmt = db()->query('SELECT id, name, contact, issue, id_number, birth_date, malaysia_address, phone_whatsapp, email, employer_name, employer_address, job_type, work_duration, complaint_types, complaint_other, chronology, evidence_url, requested_action, declaration_name, declaration_date, declaration_signature, declaration_agreed, status, created_at FROM complaints ORDER BY created_at DESC');
            $rows = $stmt->fetchAll();
            $result = array_map(static function (array $row): array {
                return [
                    'id' => (string) $row['id'],
                    'name' => $row['name'],
                    'contact' => $row['contact'],
                    'issue' => $row['issue'],
                    'id_number' => $row['id_number'],
                    'birth_date' => $row['birth_date'],
                    'malaysia_address' => $row['malaysia_address'],
                    'phone_whatsapp' => $row['phone_whatsapp'],
                    'email' => $row['email'],
                    'employer_name' => $row['employer_name'],
                    'employer_address' => $row['employer_address'],
                    'job_type' => $row['job_type'],
                    'work_duration' => $row['work_duration'],
                    'complaint_types' => is_string($row['complaint_types']) && $row['complaint_types'] !== ''
                        ? json_decode($row['complaint_types'], true)
                        : [],
                    'complaint_other' => $row['complaint_other'],
                    'chronology' => $row['chronology'],
                    'evidence_url' => $row['evidence_url'],
                    'requested_action' => $row['requested_action'],
                    'declaration_name' => $row['declaration_name'],
                    'declaration_date' => $row['declaration_date'],
                    'declaration_signature' => $row['declaration_signature'],
                    'declaration_agreed' => (bool) $row['declaration_agreed'],
                    'status' => $row['status'],
                    'created_at' => $row['created_at'],
                ];
            }, $rows);
            respond($result);
        }

        if ($method === 'POST' && count($segments) === 1) {
            $body = json_body();

            $fullName = trim((string) ($body['full_name'] ?? $body['name'] ?? ''));
            $phoneWhatsapp = trim((string) ($body['phone_whatsapp'] ?? $body['contact'] ?? ''));
            $email = trim((string) ($body['email'] ?? ''));
            $chronology = trim((string) ($body['chronology'] ?? $body['issue'] ?? ''));

            if ($fullName === '' || $chronology === '') {
                respond(['error' => 'Nama lengkap dan kronologi wajib diisi'], 422);
            }

            if ($phoneWhatsapp === '' && $email === '') {
                respond(['error' => 'Nomor WhatsApp atau email wajib diisi'], 422);
            }

            $contact = $phoneWhatsapp !== '' ? $phoneWhatsapp : $email;
            $complaintTypes = is_array($body['complaint_types'] ?? null) ? $body['complaint_types'] : [];

            $stmt = db()->prepare('INSERT INTO complaints (name, contact, issue, id_number, birth_date, malaysia_address, phone_whatsapp, email, employer_name, employer_address, job_type, work_duration, complaint_types, complaint_other, chronology, evidence_url, requested_action, declaration_name, declaration_date, declaration_signature, declaration_agreed, status) VALUES (:name, :contact, :issue, :id_number, :birth_date, :malaysia_address, :phone_whatsapp, :email, :employer_name, :employer_address, :job_type, :work_duration, :complaint_types, :complaint_other, :chronology, :evidence_url, :requested_action, :declaration_name, :declaration_date, :declaration_signature, :declaration_agreed, :status)');
            $stmt->execute([
                'name' => $fullName,
                'contact' => $contact,
                'issue' => $chronology,
                'id_number' => trim((string) ($body['id_number'] ?? '')) ?: null,
                'birth_date' => trim((string) ($body['birth_date'] ?? '')) ?: null,
                'malaysia_address' => trim((string) ($body['malaysia_address'] ?? '')) ?: null,
                'phone_whatsapp' => $phoneWhatsapp !== '' ? $phoneWhatsapp : null,
                'email' => $email !== '' ? $email : null,
                'employer_name' => trim((string) ($body['employer_name'] ?? '')) ?: null,
                'employer_address' => trim((string) ($body['employer_address'] ?? '')) ?: null,
                'job_type' => trim((string) ($body['job_type'] ?? '')) ?: null,
                'work_duration' => trim((string) ($body['work_duration'] ?? '')) ?: null,
                'complaint_types' => json_encode(array_values(array_filter(array_map(static fn($item): string => trim((string) $item), $complaintTypes), static fn(string $item): bool => $item !== '')), JSON_UNESCAPED_UNICODE),
                'complaint_other' => trim((string) ($body['complaint_other'] ?? '')) ?: null,
                'chronology' => $chronology,
                'evidence_url' => trim((string) ($body['evidence_url'] ?? '')) ?: null,
                'requested_action' => trim((string) ($body['requested_action'] ?? '')) ?: null,
                'declaration_name' => trim((string) ($body['declaration_name'] ?? '')) ?: null,
                'declaration_date' => trim((string) ($body['declaration_date'] ?? '')) ?: null,
                'declaration_signature' => trim((string) ($body['declaration_signature'] ?? '')) ?: null,
                'declaration_agreed' => normalize_bool($body['declaration_agreed'] ?? false, false) ? 1 : 0,
                'status' => 'pending',
            ]);

            $id = (int) db()->lastInsertId();
            $stmt = db()->prepare('SELECT id, name, contact, issue, id_number, birth_date, malaysia_address, phone_whatsapp, email, employer_name, employer_address, job_type, work_duration, complaint_types, complaint_other, chronology, evidence_url, requested_action, declaration_name, declaration_date, declaration_signature, declaration_agreed, status, created_at FROM complaints WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $id]);
            $complaint = $stmt->fetch();

            respond([
                'id' => (string) $complaint['id'],
                'name' => $complaint['name'],
                'contact' => $complaint['contact'],
                'issue' => $complaint['issue'],
                'id_number' => $complaint['id_number'],
                'birth_date' => $complaint['birth_date'],
                'malaysia_address' => $complaint['malaysia_address'],
                'phone_whatsapp' => $complaint['phone_whatsapp'],
                'email' => $complaint['email'],
                'employer_name' => $complaint['employer_name'],
                'employer_address' => $complaint['employer_address'],
                'job_type' => $complaint['job_type'],
                'work_duration' => $complaint['work_duration'],
                'complaint_types' => is_string($complaint['complaint_types']) && $complaint['complaint_types'] !== ''
                    ? json_decode($complaint['complaint_types'], true)
                    : [],
                'complaint_other' => $complaint['complaint_other'],
                'chronology' => $complaint['chronology'],
                'evidence_url' => $complaint['evidence_url'],
                'requested_action' => $complaint['requested_action'],
                'declaration_name' => $complaint['declaration_name'],
                'declaration_date' => $complaint['declaration_date'],
                'declaration_signature' => $complaint['declaration_signature'],
                'declaration_agreed' => (bool) $complaint['declaration_agreed'],
                'status' => $complaint['status'],
                'created_at' => $complaint['created_at'],
            ], 201);
        }

        if ($method === 'PATCH' && count($segments) === 3 && $segments[2] === 'status') {
            $admin = require_auth();
            $id = (int) $segments[1];
            $body = json_body();
            $status = (string) ($body['status'] ?? 'pending');

            if (!in_array($status, ['pending', 'in_progress', 'resolved'], true)) {
                respond(['error' => 'Status tidak valid'], 422);
            }

            $stmt = db()->prepare('UPDATE complaints SET status = :status WHERE id = :id');
            $stmt->execute([
                'status' => $status,
                'id' => $id,
            ]);

            $stmt = db()->prepare('SELECT id, name, contact, issue, status, created_at FROM complaints WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $id]);
            $complaint = $stmt->fetch();

            if (!$complaint) {
                respond(['error' => 'Pengaduan tidak ditemukan'], 404);
            }

            $complaint['id'] = (string) $complaint['id'];

            write_audit_log(
                $admin,
                'update_complaint_status',
                'complaint',
                (string) $id,
                'Mengubah status pengaduan menjadi ' . $status
            );

            respond($complaint);
        }
    }

    if ($segments[0] === 'upload' && ($segments[1] ?? '') === 'public-attachment' && $method === 'POST') {
        if (!isset($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
            respond(['error' => 'File tidak ditemukan'], 422);
        }

        $file = $_FILES['file'];
        $maxBytes = 5 * 1024 * 1024;

        if ((int) $file['size'] > $maxBytes) {
            respond(['error' => 'Ukuran file maksimal 5MB'], 422);
        }

        $mime = mime_content_type($file['tmp_name']) ?: '';
        $allowed = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'audio/mpeg',
            'audio/wav',
            'audio/mp4',
            'video/mp4',
        ];

        if (!in_array($mime, $allowed, true)) {
            respond(['error' => 'Tipe file tidak didukung'], 422);
        }

        $ext = strtolower(pathinfo((string) $file['name'], PATHINFO_EXTENSION));
        if ($ext === '') {
            $ext = match ($mime) {
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
                'image/gif' => 'gif',
                'application/pdf' => 'pdf',
                'application/msword' => 'doc',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
                'audio/mpeg' => 'mp3',
                'audio/wav' => 'wav',
                'audio/mp4' => 'm4a',
                'video/mp4' => 'mp4',
                default => 'bin'
            };
        }

        $uploadDir = dirname(__DIR__) . '/public/uploads/attachments';
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0777, true) && !is_dir($uploadDir)) {
            respond(['error' => 'Gagal menyiapkan direktori upload'], 500);
        }

        $filename = time() . '-' . bin2hex(random_bytes(6)) . '.' . $ext;
        $target = $uploadDir . DIRECTORY_SEPARATOR . $filename;

        if (!move_uploaded_file($file['tmp_name'], $target)) {
            respond(['error' => 'Gagal mengunggah file'], 500);
        }

        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $basePath = rtrim(str_replace('\\', '/', dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/'))), '/');
        $publicUrl = $scheme . '://' . $host . ($basePath === '' ? '' : $basePath) . '/public/uploads/attachments/' . $filename;

        respond(['url' => $publicUrl], 201);
    }

    if ($segments[0] === 'organizations') {
        if ($method === 'GET' && count($segments) === 1) {
            $stmt = db()->query('SELECT id, name, description, logo_url, type, created_at FROM organizations ORDER BY name ASC');
            $rows = $stmt->fetchAll();
            $result = array_map(static function (array $row): array {
                $row['id'] = (string) $row['id'];
                return $row;
            }, $rows);
            respond($result);
        }

        if ($method === 'POST' && count($segments) === 1) {
            $admin = require_auth();
            $body = json_body();

            $stmt = db()->prepare('INSERT INTO organizations (name, description, logo_url, type) VALUES (:name, :description, :logo_url, :type)');
            $stmt->execute([
                'name' => trim((string) ($body['name'] ?? '')),
                'description' => $body['description'] ?? null,
                'logo_url' => $body['logo_url'] ?? null,
                'type' => (string) ($body['type'] ?? 'Banom'),
            ]);

            $id = (int) db()->lastInsertId();
            $stmt = db()->prepare('SELECT id, name, description, logo_url, type, created_at FROM organizations WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $id]);
            $created = $stmt->fetch();
            $created['id'] = (string) $created['id'];

            write_audit_log(
                $admin,
                'create_organization',
                'organization',
                (string) $id,
                'Membuat organisasi: ' . $created['name']
            );

            respond($created, 201);
        }

        if ($method === 'PUT' && count($segments) === 2) {
            $admin = require_auth();
            $id = (int) $segments[1];
            $body = json_body();

            $stmt = db()->prepare('UPDATE organizations SET name = :name, description = :description, logo_url = :logo_url, type = :type WHERE id = :id');
            $stmt->execute([
                'id' => $id,
                'name' => trim((string) ($body['name'] ?? '')),
                'description' => $body['description'] ?? null,
                'logo_url' => $body['logo_url'] ?? null,
                'type' => (string) ($body['type'] ?? 'Banom'),
            ]);

            $stmt = db()->prepare('SELECT id, name, description, logo_url, type, created_at FROM organizations WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $id]);
            $updated = $stmt->fetch();

            if (!$updated) {
                respond(['error' => 'Organisasi tidak ditemukan'], 404);
            }

            $updated['id'] = (string) $updated['id'];

            write_audit_log(
                $admin,
                'update_organization',
                'organization',
                (string) $id,
                'Memperbarui organisasi: ' . $updated['name']
            );

            respond($updated);
        }

        if ($method === 'DELETE' && count($segments) === 2) {
            $admin = require_auth();
            $id = (int) $segments[1];
            $stmt = db()->prepare('DELETE FROM organizations WHERE id = :id');
            $stmt->execute(['id' => $id]);

            write_audit_log(
                $admin,
                'delete_organization',
                'organization',
                (string) $id,
                'Menghapus organisasi dengan id ' . $id
            );

            respond(['ok' => true]);
        }
    }

    if ($segments[0] === 'infographics') {
        $mapInfographicRow = static function (array $row): array {
            return [
                'id' => (string) $row['id'],
                'title' => $row['title'],
                'image_url' => $row['image_url'],
                'description' => $row['description'],
                'location_name' => $row['location_name'],
                'latitude' => $row['latitude'] !== null ? (float) $row['latitude'] : null,
                'longitude' => $row['longitude'] !== null ? (float) $row['longitude'] : null,
                'data_value' => $row['data_value'] !== null ? (int) $row['data_value'] : null,
                'data_type' => $row['data_type'],
                'created_at' => $row['created_at'],
            ];
        };

        $fetchInternalInfographics = static function () use ($mapInfographicRow): array {
            $stmt = db()->query('SELECT id, title, image_url, description, location_name, latitude, longitude, data_value, data_type, created_at FROM infographics ORDER BY created_at DESC');
            $rows = $stmt->fetchAll();
            return array_map($mapInfographicRow, $rows);
        };

        if ($method === 'GET' && count($segments) === 2 && $segments[1] === 'public') {
            $forceRefresh = normalize_bool($_GET['refresh'] ?? false, false);
            $internalItems = $fetchInternalInfographics();
            $external = load_kp2mi_malaysia_infographics($forceRefresh);

            $externalItems = [];
            if (($external['ok'] ?? false) && isset($external['items']) && is_array($external['items'])) {
                $externalItems = array_map(static function (array $item): array {
                    return [
                        'id' => (string) ($item['id'] ?? ''),
                        'title' => (string) ($item['title'] ?? ''),
                        'image_url' => (string) ($item['image_url'] ?? ''),
                        'description' => $item['description'] ?? null,
                        'location_name' => $item['location_name'] ?? null,
                        'latitude' => $item['latitude'] !== null ? (float) $item['latitude'] : null,
                        'longitude' => $item['longitude'] !== null ? (float) $item['longitude'] : null,
                        'data_value' => $item['data_value'] !== null ? (int) $item['data_value'] : null,
                        'data_type' => $item['data_type'] ?? null,
                        'created_at' => (string) ($item['created_at'] ?? gmdate('Y-m-d H:i:s')),
                    ];
                }, $external['items']);
            }

            $items = $externalItems !== [] ? $externalItems : $internalItems;

            respond([
                'items' => $items,
                'meta' => [
                    'source' => $externalItems !== [] ? ($external['source'] ?? 'live') : 'internal-fallback',
                    'external_available' => $externalItems !== [],
                    'external_error' => $externalItems === [] ? ($external['error'] ?? null) : null,
                    'updated_at' => $externalItems !== [] ? ($external['updated_at'] ?? null) : null,
                    'refresh' => $forceRefresh,
                ],
            ]);
        }

        if ($method === 'GET' && count($segments) === 1) {
            respond($fetchInternalInfographics());
        }

        if ($method === 'POST' && count($segments) === 1) {
            $admin = require_auth();
            $body = json_body();

            $stmt = db()->prepare('INSERT INTO infographics (title, image_url, description, location_name, latitude, longitude, data_value, data_type) VALUES (:title, :image_url, :description, :location_name, :latitude, :longitude, :data_value, :data_type)');
            $stmt->execute([
                'title' => trim((string) ($body['title'] ?? '')),
                'image_url' => trim((string) ($body['image_url'] ?? '')),
                'description' => $body['description'] ?? null,
                'location_name' => $body['location_name'] ?? null,
                'latitude' => isset($body['latitude']) && $body['latitude'] !== '' ? (float) $body['latitude'] : null,
                'longitude' => isset($body['longitude']) && $body['longitude'] !== '' ? (float) $body['longitude'] : null,
                'data_value' => isset($body['data_value']) && $body['data_value'] !== '' ? (int) $body['data_value'] : null,
                'data_type' => $body['data_type'] ?? null,
            ]);

            $id = (int) db()->lastInsertId();
            $stmt = db()->prepare('SELECT id, title, image_url, description, location_name, latitude, longitude, data_value, data_type, created_at FROM infographics WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $id]);
            $created = $stmt->fetch();

            respond([
                'id' => (string) $created['id'],
                'title' => $created['title'],
                'image_url' => $created['image_url'],
                'description' => $created['description'],
                'location_name' => $created['location_name'],
                'latitude' => $created['latitude'] !== null ? (float) $created['latitude'] : null,
                'longitude' => $created['longitude'] !== null ? (float) $created['longitude'] : null,
                'data_value' => $created['data_value'] !== null ? (int) $created['data_value'] : null,
                'data_type' => $created['data_type'],
                'created_at' => $created['created_at'],
            ], 201);

            write_audit_log(
                $admin,
                'create_infographic',
                'infographic',
                (string) $id,
                'Membuat infografis: ' . $created['title']
            );
        }

        if ($method === 'PUT' && count($segments) === 2) {
            $admin = require_auth();
            $id = (int) $segments[1];
            $body = json_body();

            $stmt = db()->prepare('UPDATE infographics SET title = :title, image_url = :image_url, description = :description, location_name = :location_name, latitude = :latitude, longitude = :longitude, data_value = :data_value, data_type = :data_type WHERE id = :id');
            $stmt->execute([
                'id' => $id,
                'title' => trim((string) ($body['title'] ?? '')),
                'image_url' => trim((string) ($body['image_url'] ?? '')),
                'description' => $body['description'] ?? null,
                'location_name' => $body['location_name'] ?? null,
                'latitude' => isset($body['latitude']) && $body['latitude'] !== '' ? (float) $body['latitude'] : null,
                'longitude' => isset($body['longitude']) && $body['longitude'] !== '' ? (float) $body['longitude'] : null,
                'data_value' => isset($body['data_value']) && $body['data_value'] !== '' ? (int) $body['data_value'] : null,
                'data_type' => $body['data_type'] ?? null,
            ]);

            $stmt = db()->prepare('SELECT id, title, image_url, description, location_name, latitude, longitude, data_value, data_type, created_at FROM infographics WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $id]);
            $updated = $stmt->fetch();

            if (!$updated) {
                respond(['error' => 'Infografis tidak ditemukan'], 404);
            }

            $response = [
                'id' => (string) $updated['id'],
                'title' => $updated['title'],
                'image_url' => $updated['image_url'],
                'description' => $updated['description'],
                'location_name' => $updated['location_name'],
                'latitude' => $updated['latitude'] !== null ? (float) $updated['latitude'] : null,
                'longitude' => $updated['longitude'] !== null ? (float) $updated['longitude'] : null,
                'data_value' => $updated['data_value'] !== null ? (int) $updated['data_value'] : null,
                'data_type' => $updated['data_type'],
                'created_at' => $updated['created_at'],
            ];

            write_audit_log(
                $admin,
                'update_infographic',
                'infographic',
                (string) $id,
                'Memperbarui infografis: ' . $updated['title']
            );

            respond($response);
        }

        if ($method === 'DELETE' && count($segments) === 2) {
            $admin = require_auth();
            $id = (int) $segments[1];
            $stmt = db()->prepare('DELETE FROM infographics WHERE id = :id');
            $stmt->execute(['id' => $id]);

            write_audit_log(
                $admin,
                'delete_infographic',
                'infographic',
                (string) $id,
                'Menghapus infografis dengan id ' . $id
            );

            respond(['ok' => true]);
        }
    }

    if ($segments[0] === 'upload' && ($segments[1] ?? '') === 'image' && $method === 'POST') {
        require_auth();

        if (!isset($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
            respond(['error' => 'File tidak ditemukan'], 422);
        }

        $file = $_FILES['file'];
        $maxBytes = 1024 * 1024;

        if ((int) $file['size'] > $maxBytes) {
            respond(['error' => 'Ukuran file maksimal 1MB'], 422);
        }

        $mime = mime_content_type($file['tmp_name']) ?: '';
        $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

        if (!in_array($mime, $allowed, true)) {
            respond(['error' => 'Tipe file tidak valid'], 422);
        }

        $ext = strtolower(pathinfo((string) $file['name'], PATHINFO_EXTENSION));
        if ($ext === '') {
            $ext = match ($mime) {
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
                'image/gif' => 'gif',
                default => 'bin'
            };
        }

        $uploadDir = dirname(__DIR__) . '/public/uploads';
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0777, true) && !is_dir($uploadDir)) {
            respond(['error' => 'Gagal menyiapkan direktori upload'], 500);
        }

        $filename = time() . '-' . bin2hex(random_bytes(6)) . '.' . $ext;
        $target = $uploadDir . DIRECTORY_SEPARATOR . $filename;

        if (!move_uploaded_file($file['tmp_name'], $target)) {
            respond(['error' => 'Gagal mengunggah file'], 500);
        }

        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $basePath = rtrim(str_replace('\\', '/', dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/'))), '/');
        $publicUrl = $scheme . '://' . $host . ($basePath === '' ? '' : $basePath) . '/public/uploads/' . $filename;

        respond(['url' => $publicUrl], 201);
    }

    respond(['error' => 'Endpoint tidak ditemukan'], 404);
} catch (PDOException $exception) {
    respond([
        'error' => 'Database error',
        'detail' => $exception->getMessage(),
    ], 500);
} catch (Throwable $exception) {
    respond([
        'error' => 'Server error',
        'detail' => $exception->getMessage(),
    ], 500);
}
