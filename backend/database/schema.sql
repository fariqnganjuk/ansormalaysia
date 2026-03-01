CREATE DATABASE IF NOT EXISTS ansormalaysia_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ansormalaysia_app;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(190) NULL,
  avatar_url VARCHAR(500) NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS auth_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_auth_tokens_user_id (user_id),
  INDEX idx_auth_tokens_revoked_at (revoked_at),
  CONSTRAINT fk_auth_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS posts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content LONGTEXT NULL,
  excerpt TEXT NULL,
  type ENUM('pmi_news', 'activity', 'inspiration', 'opinion', 'organization') NOT NULL,
  category VARCHAR(120) NULL,
  image_url VARCHAR(500) NULL,
  author_id BIGINT UNSIGNED NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 0,
  published_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS complaints (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  contact VARCHAR(190) NOT NULL,
  issue TEXT NOT NULL,
  id_number VARCHAR(120) NULL,
  birth_date DATE NULL,
  malaysia_address TEXT NULL,
  phone_whatsapp VARCHAR(50) NULL,
  email VARCHAR(190) NULL,
  employer_name VARCHAR(190) NULL,
  employer_address TEXT NULL,
  job_type VARCHAR(190) NULL,
  work_duration VARCHAR(120) NULL,
  complaint_types LONGTEXT NULL,
  complaint_other TEXT NULL,
  chronology LONGTEXT NULL,
  evidence_url VARCHAR(500) NULL,
  requested_action LONGTEXT NULL,
  declaration_name VARCHAR(190) NULL,
  declaration_date DATE NULL,
  declaration_signature VARCHAR(190) NULL,
  declaration_agreed TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('pending', 'in_progress', 'resolved') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS organizations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL UNIQUE,
  description TEXT NULL,
  logo_url VARCHAR(500) NULL,
  type ENUM('PCINU', 'Banom') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS infographics (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL UNIQUE,
  image_url VARCHAR(500) NOT NULL,
  description TEXT NULL,
  location_name VARCHAR(190) NULL,
  latitude DECIMAL(10,8) NULL,
  longitude DECIMAL(11,8) NULL,
  data_value INT NULL,
  data_type VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_infographics_location (location_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS external_news (
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
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
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
) ENGINE=InnoDB;
