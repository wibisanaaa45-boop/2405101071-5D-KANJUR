-- Jalankan sekali di MySQL/MariaDB (phpMyAdmin > Import, atau: mysql -u root < database/schema.sql)
CREATE DATABASE IF NOT EXISTS kantin_jujur CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kantin_jujur;

CREATE TABLE IF NOT EXISTS admins (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  last_login_at DATETIME     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS login_attempts (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(190) NOT NULL,
  ip           VARCHAR(45)  NOT NULL,
  attempted_at INT UNSIGNED NOT NULL,
  INDEX idx_ip_time (ip, attempted_at),
  INDEX idx_email_ip_time (email, ip, attempted_at)
) ENGINE=InnoDB;
