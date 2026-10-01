CREATE DATABASE IF NOT EXISTS our_language_attendance
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE our_language_attendance;

-- ==========================================
-- USERS
-- ==========================================

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    cluster ENUM(
        'MAINTENANCE',
        'NETWORK',
        'SOFTWARE',
        'DATA SCIENCE'
    ) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    profile_picture VARCHAR(500) NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    status ENUM('ACTIVE', 'SUSPENDED', 'DISABLED')
        NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_cluster (cluster),
    INDEX idx_users_status (status),
    INDEX idx_users_created (created_at)
);

-- ==========================================
-- ADMINS
-- ==========================================

CREATE TABLE IF NOT EXISTS admins (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(30) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_picture VARCHAR(500) NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    status ENUM('ACTIVE', 'SUSPENDED', 'DISABLED')
        NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_admin_status (status)
);

-- ==========================================
-- ATTENDANCE
-- ==========================================

CREATE TABLE IF NOT EXISTS attendance (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    attendance_date DATE NOT NULL,
    login_time DATETIME NULL,
    logout_time DATETIME NULL,
    duration_seconds INT UNSIGNED NULL,
    status ENUM('PRESENT', 'ABSENT') NOT NULL DEFAULT 'PRESENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_attendance_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE KEY unique_user_attendance_date
        (user_id, attendance_date),

    INDEX idx_attendance_date (attendance_date),
    INDEX idx_attendance_status (status)
);

-- ==========================================
-- STUDY REPORTS
-- ==========================================

CREATE TABLE IF NOT EXISTS study_reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    report_date DATE NOT NULL,
    cluster ENUM(
        'MAINTENANCE',
        'NETWORK',
        'SOFTWARE',
        'DATA SCIENCE'
    ) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    description TEXT NULL,
    has_challenge BOOLEAN NOT NULL DEFAULT FALSE,
    challenge_description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_study_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_study_user (user_id),
    INDEX idx_study_date (report_date),
    INDEX idx_study_cluster (cluster)
);

-- ==========================================
-- MESSAGES
-- ==========================================

CREATE TABLE IF NOT EXISTS messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    sender_type ENUM('USER', 'ADMIN') NOT NULL,
    sender_id INT UNSIGNED NOT NULL,

    receiver_type ENUM('USER', 'ADMIN') NOT NULL,
    receiver_id INT UNSIGNED NOT NULL,

    message TEXT NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_sender (
        sender_type,
        sender_id
    ),

    INDEX idx_receiver (
        receiver_type,
        receiver_id
    ),

    INDEX idx_message_created (
        created_at
    )
);

-- ==========================================
-- MATERIALS
-- ==========================================

CREATE TABLE IF NOT EXISTS materials (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(255) NOT NULL,
    description TEXT NULL,

    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,

    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT UNSIGNED NOT NULL,

    uploaded_by INT UNSIGNED NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_material_admin
        FOREIGN KEY (uploaded_by)
        REFERENCES admins(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    INDEX idx_material_created (created_at),
    INDEX idx_material_type (file_type)
);

-- ==========================================
-- NOTIFICATIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    recipient_type ENUM('USER', 'ADMIN') NOT NULL,
    recipient_id INT UNSIGNED NOT NULL,

    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_notification_recipient (
        recipient_type,
        recipient_id
    ),

    INDEX idx_notification_read (
        is_read
    ),

    INDEX idx_notification_created (
        created_at
    )
);

-- ==========================================
-- EMAIL VERIFICATION
-- ==========================================

CREATE TABLE IF NOT EXISTS email_verifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    account_type ENUM('USER', 'ADMIN') NOT NULL,
    account_id INT UNSIGNED NOT NULL,

    verification_code_hash VARCHAR(255) NOT NULL,

    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_email_verification_account (
        account_type,
        account_id
    ),

    INDEX idx_email_verification_expiry (
        expires_at
    )
);

-- ==========================================
-- PASSWORD RESET
-- ==========================================

CREATE TABLE IF NOT EXISTS password_resets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    account_type ENUM('USER', 'ADMIN') NOT NULL,
    account_id INT UNSIGNED NOT NULL,

    reset_code_hash VARCHAR(255) NOT NULL,

    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_password_reset_account (
        account_type,
        account_id
    ),

    INDEX idx_password_reset_expiry (
        expires_at
    )
);

-- ==========================================
-- USER SESSIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    token_id VARCHAR(255) NOT NULL UNIQUE,

    login_time DATETIME NOT NULL,
    logout_time DATETIME NULL,

    ip_address VARCHAR(100) NULL,
    user_agent TEXT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_session_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_session_user (user_id),
    INDEX idx_session_active (is_active)
);

-- ==========================================
-- ACTIVITY LOGS
-- ==========================================

CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    admin_id INT UNSIGNED NULL,

    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100) NULL,
    target_id INT UNSIGNED NULL,

    description TEXT NULL,

    ip_address VARCHAR(100) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_admin
        FOREIGN KEY (admin_id)
        REFERENCES admins(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_activity_admin (admin_id),
    INDEX idx_activity_action (action),
    INDEX idx_activity_created (created_at)
);