-- ClickHouse Database Setup for Correspondence Management System
-- Database: moi

-- Create Entities Table
CREATE TABLE IF NOT EXISTS moi.entities (
    id String DEFAULT generateUUIDv4(),
    name String NOT NULL,
    type String NOT NULL,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (created_at, id);

-- Create Users Table
CREATE TABLE IF NOT EXISTS moi.users (
    id UInt64,
    username String NOT NULL,
    password_hash String NOT NULL,
    full_name String NOT NULL,
    entity_id Nullable(String),
    entity_name Nullable(String),
    created_at DateTime DEFAULT now(),
    created_by Nullable(UInt64)
) ENGINE = MergeTree()
ORDER BY (id);

-- Create User Roles Table
CREATE TABLE IF NOT EXISTS moi.user_roles (
    id String DEFAULT generateUUIDv4(),
    user_id UInt64 NOT NULL,
    role Enum8('admin' = 1, 'moderator' = 2, 'user' = 3) DEFAULT 'user',
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (user_id, role);

-- Create Sessions Table
CREATE TABLE IF NOT EXISTS moi.sessions (
    id String DEFAULT generateUUIDv4(),
    user_id UInt64 NOT NULL,
    token String NOT NULL,
    expires_at DateTime NOT NULL,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (expires_at, user_id);

-- Create Correspondences Table
CREATE TABLE IF NOT EXISTS moi.correspondences (
    id String DEFAULT generateUUIDv4(),
    number String NOT NULL,
    type String NOT NULL,
    subject String NOT NULL,
    content String NOT NULL,
    from_entity String NOT NULL,
    received_by_entity Nullable(String),
    date DateTime DEFAULT now(),
    received_at Nullable(DateTime),
    received_by Nullable(UInt64),
    created_by Nullable(UInt64),
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now(),
    archived UInt8 DEFAULT 0,
    display_type String DEFAULT 'content',
    greeting String DEFAULT 'السيد/',
    responsible_person Nullable(String),
    signature_url Nullable(String),
    pdf_url Nullable(String),
    notes Nullable(String),
    attachments Array(String) DEFAULT [],
    external_connection_id Nullable(String),
    external_doc_id Nullable(String)
) ENGINE = MergeTree()
ORDER BY (date, id);

-- Create Correspondence Comments Table
CREATE TABLE IF NOT EXISTS moi.correspondence_comments (
    id String DEFAULT generateUUIDv4(),
    correspondence_id Nullable(String),
    user_id Nullable(UInt64),
    comment String NOT NULL,
    is_internal UInt8 DEFAULT 1,
    parent_comment_id Nullable(String),
    mentioned_users Array(UInt64) DEFAULT [],
    attachments Array(String) DEFAULT [],
    is_edited UInt8 DEFAULT 0,
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (correspondence_id, created_at);

-- Create Notifications Table
CREATE TABLE IF NOT EXISTS moi.notifications (
    id String DEFAULT generateUUIDv4(),
    user_id Nullable(UInt64),
    type String NOT NULL,
    title String NOT NULL,
    message String NOT NULL,
    correspondence_id Nullable(String),
    related_entity_type Nullable(String),
    related_entity_id Nullable(String),
    priority String DEFAULT 'normal',
    action_url Nullable(String),
    read UInt8 DEFAULT 0,
    read_at Nullable(DateTime),
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (user_id, created_at);

-- Create Correspondence Templates Table
CREATE TABLE IF NOT EXISTS moi.correspondence_templates (
    id String DEFAULT generateUUIDv4(),
    name String NOT NULL,
    subject_template Nullable(String),
    content_template String NOT NULL,
    greeting String DEFAULT 'السيد/',
    category String DEFAULT 'general',
    type String DEFAULT 'all',
    entity_id Nullable(String),
    is_active UInt8 DEFAULT 1,
    is_public UInt8 DEFAULT 0,
    variables String DEFAULT '[]',
    usage_count UInt32 DEFAULT 0,
    created_by Nullable(UInt64),
    updated_by Nullable(UInt64),
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (created_at, id);

-- Create External Connections Table
CREATE TABLE IF NOT EXISTS moi.external_connections (
    id String DEFAULT generateUUIDv4(),
    name String NOT NULL,
    base_url String NOT NULL,
    username String NOT NULL,
    password_encrypted String NOT NULL,
    api_token Nullable(String),
    session_token Nullable(String),
    session_expires_at Nullable(DateTime),
    token_expires_at Nullable(DateTime),
    is_active UInt8 DEFAULT 1,
    sync_status String DEFAULT 'idle',
    last_sync_at Nullable(DateTime),
    sync_error Nullable(String),
    created_by Nullable(UInt64),
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (created_at, id);

-- Create Sync Log Table
CREATE TABLE IF NOT EXISTS moi.sync_log (
    id String DEFAULT generateUUIDv4(),
    correspondence_id Nullable(String),
    connection_id Nullable(String),
    operation String NOT NULL,
    status String NOT NULL,
    external_doc_id Nullable(String),
    request_payload Nullable(String),
    response_payload Nullable(String),
    error_message Nullable(String),
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (created_at, id);

-- Create Audit Log Table
CREATE TABLE IF NOT EXISTS moi.audit_log (
    id String DEFAULT generateUUIDv4(),
    user_id Nullable(UInt64),
    action String NOT NULL,
    entity_type String NOT NULL,
    entity_id String NOT NULL,
    old_data Nullable(String),
    new_data Nullable(String),
    description Nullable(String),
    ip_address Nullable(String),
    user_agent Nullable(String),
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (created_at, id);

-- Create Rate Limits Table
CREATE TABLE IF NOT EXISTS moi.rate_limits (
    id String DEFAULT generateUUIDv4(),
    identifier String NOT NULL,
    endpoint String NOT NULL,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (created_at);

-- Create Password History Table
CREATE TABLE IF NOT EXISTS moi.password_history (
    id String DEFAULT generateUUIDv4(),
    user_id Nullable(UInt64),
    password_hash String NOT NULL,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (user_id, created_at);

-- Insert Initial Entities Data
INSERT INTO moi.entities (id, name, type, created_at) VALUES
(generateUUIDv4(), 'وزارة الداخلية', 'ministry', now()),
(generateUUIDv4(), 'وزارة المالية', 'ministry', now()),
(generateUUIDv4(), 'وزارة التخطيط', 'ministry', now()),
(generateUUIDv4(), 'ديوان الخدمة المدنية', 'government', now()),
(generateUUIDv4(), 'الأمانة العامة', 'government', now()),
(generateUUIDv4(), 'إدارة الموارد البشرية', 'department', now()),
(generateUUIDv4(), 'إدارة المشتريات', 'department', now()),
(generateUUIDv4(), 'إدارة تقنية المعلومات', 'department', now());
