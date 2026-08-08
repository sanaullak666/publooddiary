-- ====================================================================
-- PU Blood Diary - MySQL Database Schema
-- An initiative by NSS Pondicherry University
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `pu_blood_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pu_blood_db`;

-- --------------------------------------------------------------------
-- 1. Admins Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `role` VARCHAR(20) DEFAULT 'administrator',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_admin_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 2. Donors Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `donors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `blood_group` VARCHAR(25) NOT NULL,
  `last_donated_date` DATE NULL,
  `department` VARCHAR(150) NOT NULL,
  `register_number` VARCHAR(50) NOT NULL UNIQUE,
  `contact_number` VARCHAR(15) NOT NULL,
  `alt_contact_number` VARCHAR(15) NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `state_ut` VARCHAR(100) NOT NULL,
  `languages` TEXT NOT NULL,
  `has_health_problem` TINYINT(1) NOT NULL DEFAULT 0,
  `health_problem_details` TEXT NULL,
  `has_regular_medicine` TINYINT(1) NOT NULL DEFAULT 0,
  `medicine_details` TEXT NULL,
  `consumes_alcohol_substance` TINYINT(1) NOT NULL DEFAULT 0,
  `declaration_agreed` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_donor_blood_group` (`blood_group`),
  INDEX `idx_donor_department` (`department`),
  INDEX `idx_donor_state` (`state_ut`),
  INDEX `idx_donor_reg_no` (`register_number`),
  INDEX `idx_donor_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 3. Activity Logs Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_username` VARCHAR(50) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_log_admin` (`admin_username`),
  INDEX `idx_log_action` (`action`),
  INDEX `idx_log_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Seed Initial Admin User
-- Default Credentials: Username: admin | Password: Password@123
-- (Hash generated via bcrypt for 'Password@123')
-- --------------------------------------------------------------------
INSERT INTO `admins` (`username`, `password`, `email`, `name`, `role`)
VALUES (
  'admin',
  '$2a$10$7vN3mF6Gz/jS1vJ8F2qSce5/BvW4L5D9aN8L9u.z7M1x1j.o7s5yO', 
  'nss@pondiuni.edu.in',
  'NSS Administrator',
  'administrator'
)
ON DUPLICATE KEY UPDATE `username`=`username`;
