

CREATE DATABASE IF NOT EXISTS icct_clubs
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE icct_clubs;

-- account
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  firstname     VARCHAR(60)  NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Mga sumali sa club (laman ng join form)
CREATE TABLE IF NOT EXISTS memberships (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  club_id     VARCHAR(40)  NOT NULL,
  fullname    VARCHAR(120) NOT NULL,
  student_id  VARCHAR(40)  NOT NULL,
  email       VARCHAR(120) NOT NULL,
  contact     VARCHAR(25)  NOT NULL,
  course      VARCHAR(120) NOT NULL,
  year_level  VARCHAR(20)  NOT NULL,
  section     VARCHAR(40)  NOT NULL,
  team        VARCHAR(60)  NOT NULL DEFAULT '',
  extra       TEXT NULL,
  joined_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_club (user_id, club_id),
  KEY idx_club (club_id),
  CONSTRAINT fk_membership_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Mga announcement ng bawat club
CREATE TABLE IF NOT EXISTS announcements (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  club_id     VARCHAR(40)  NOT NULL,
  title       VARCHAR(80)  NOT NULL DEFAULT '',
  body        TEXT         NOT NULL,
  post_date   DATE NULL,
  image_path  VARCHAR(255) NOT NULL DEFAULT '',
  author_id   INT UNSIGNED NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_club (club_id),
  CONSTRAINT fk_announcement_user FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
