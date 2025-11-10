import { clickhouse } from './client';

export async function createTables() {
  const queries = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id Int64,
      username String,
      password_hash String,
      full_name String,
      entity_id String,
      entity_name String,
      created_at DateTime DEFAULT now(),
      created_by Nullable(Int64)
    ) ENGINE = MergeTree()
    ORDER BY id`,

    // User roles table
    `CREATE TABLE IF NOT EXISTS user_roles (
      id String,
      user_id Int64,
      role String,
      created_at DateTime DEFAULT now()
    ) ENGINE = MergeTree()
    ORDER BY (user_id, role)`,

    // Sessions table
    `CREATE TABLE IF NOT EXISTS sessions (
      id String,
      user_id Int64,
      token String,
      expires_at DateTime,
      created_at DateTime DEFAULT now()
    ) ENGINE = MergeTree()
    ORDER BY token`,

    // Entities table
    `CREATE TABLE IF NOT EXISTS entities (
      id String,
      name String,
      type String,
      created_at DateTime DEFAULT now()
    ) ENGINE = MergeTree()
    ORDER BY id`,

    // Correspondences table
    `CREATE TABLE IF NOT EXISTS correspondences (
      id String,
      number String,
      type String,
      subject String,
      from_entity String,
      received_by_entity String,
      date DateTime,
      content String,
      greeting String,
      responsible_person String,
      signature_url String,
      display_type String,
      attachments Array(String),
      notes Nullable(String),
      received_by Nullable(Int64),
      received_at Nullable(DateTime),
      created_by Nullable(Int64),
      created_at DateTime DEFAULT now(),
      updated_at DateTime DEFAULT now(),
      archived UInt8 DEFAULT 0,
      pdf_url Nullable(String),
      external_doc_id Nullable(String),
      external_connection_id Nullable(String)
    ) ENGINE = MergeTree()
    ORDER BY (date, id)`,

    // Comments table
    `CREATE TABLE IF NOT EXISTS correspondence_comments (
      id String,
      correspondence_id String,
      user_id Nullable(Int64),
      comment String,
      is_internal UInt8 DEFAULT 1,
      parent_comment_id Nullable(String),
      mentioned_users Array(Int64),
      attachments Array(String),
      is_edited UInt8 DEFAULT 0,
      created_at DateTime DEFAULT now(),
      updated_at DateTime DEFAULT now()
    ) ENGINE = MergeTree()
    ORDER BY (correspondence_id, created_at)`,

    // Notifications table
    `CREATE TABLE IF NOT EXISTS notifications (
      id String,
      user_id Int64,
      type String,
      title String,
      message String,
      correspondence_id Nullable(String),
      related_entity_type Nullable(String),
      related_entity_id Nullable(String),
      priority String DEFAULT 'normal',
      action_url Nullable(String),
      read UInt8 DEFAULT 0,
      read_at Nullable(DateTime),
      created_at DateTime DEFAULT now()
    ) ENGINE = MergeTree()
    ORDER BY (user_id, created_at)`,

    // Templates table
    `CREATE TABLE IF NOT EXISTS correspondence_templates (
      id String,
      name String,
      content_template String,
      subject_template Nullable(String),
      greeting String DEFAULT 'السيد/',
      category String DEFAULT 'general',
      type String DEFAULT 'all',
      entity_id Nullable(String),
      variables String DEFAULT '[]',
      is_active UInt8 DEFAULT 1,
      is_public UInt8 DEFAULT 0,
      usage_count Int32 DEFAULT 0,
      created_by Nullable(Int64),
      updated_by Nullable(Int64),
      created_at DateTime DEFAULT now(),
      updated_at DateTime DEFAULT now()
    ) ENGINE = MergeTree()
    ORDER BY (is_active, created_at)`,
  ];

  for (const query of queries) {
    try {
      await clickhouse.command({ query });
      console.log('Table created successfully');
    } catch (error) {
      console.error('Failed to create table:', error);
      throw error;
    }
  }

  console.log('All tables created successfully');
}
