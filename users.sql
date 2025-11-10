-- ClickHouse INSERT Statements for Users and Roles
-- Database: moi
-- Password for all test users: password123

-- Insert Users
-- Note: In production, password hashes should be generated using bcrypt with proper salt
INSERT INTO moi.users (id, username, password_hash, full_name, entity_id, entity_name, created_at, created_by) VALUES
(1, 'admin', '$2b$10$N9qo8uLOickgx2ZMRZoMye7FRNpZKp7GVhWvTVqHkJvYhUpQPfeHu', 'مدير النظام', '550e8400-e29b-41d4-a716-446655440001', 'وزارة الداخلية', now(), NULL),
(2, 'ahmad.khalil', '$2b$10$N9qo8uLOickgx2ZMRZoMye7FRNpZKp7GVhWvTVqHkJvYhUpQPfeHu', 'أحمد خليل', '550e8400-e29b-41d4-a716-446655440001', 'وزارة الداخلية', now(), 1),
(3, 'fatima.salem', '$2b$10$N9qo8uLOickgx2ZMRZoMye7FRNpZKp7GVhWvTVqHkJvYhUpQPfeHu', 'فاطمة سالم', '550e8400-e29b-41d4-a716-446655440002', 'وزارة المالية', now(), 1),
(4, 'mohammed.hassan', '$2b$10$N9qo8uLOickgx2ZMRZoMye7FRNpZKp7GVhWvTVqHkJvYhUpQPfeHu', 'محمد حسن', '550e8400-e29b-41d4-a716-446655440003', 'وزارة التخطيط', now(), 1),
(5, 'sara.ali', '$2b$10$N9qo8uLOickgx2ZMRZoMye7FRNpZKp7GVhWvTVqHkJvYhUpQPfeHu', 'سارة علي', '550e8400-e29b-41d4-a716-446655440004', 'ديوان الخدمة المدنية', now(), 1),
(6, 'khaled.omar', '$2b$10$N9qo8uLOickgx2ZMRZoMye7FRNpZKp7GVhWvTVqHkJvYhUpQPfeHu', 'خالد عمر', '550e8400-e29b-41d4-a716-446655440005', 'الأمانة العامة', now(), 1),
(7, 'layla.mansour', '$2b$10$N9qo8uLOickgx2ZMRZoMye7FRNpZKp7GVhWvTVqHkJvYhUpQPfeHu', 'ليلى منصور', '550e8400-e29b-41d4-a716-446655440006', 'إدارة الموارد البشرية', now(), 1),
(8, 'youssef.ibrahim', '$2b$10$N9qo8uLOickgx2ZMRZoMye7FRNpZKp7GVhWvTVqHkJvYhUpQPfeHu', 'يوسف إبراهيم', '550e8400-e29b-41d4-a716-446655440007', 'إدارة المشتريات', now(), 1),
(9, 'noor.abdullah', '$2b$10$N9qo8uLOickgx2ZMRZoMye7FRNpZKp7GVhWvTVqHkJvYhUpQPfeHu', 'نور عبدالله', '550e8400-e29b-41d4-a716-446655440008', 'إدارة تقنية المعلومات', now(), 1),
(10, 'omar.Said', '$2b$10$N9qo8uLOickgx2ZMRZoMye7FRNpZKp7GVhWvTVqHkJvYhUpQPfeHu', 'عمر سعيد', '550e8400-e29b-41d4-a716-446655440001', 'وزارة الداخلية', now(), 1);

-- Insert User Roles
INSERT INTO moi.user_roles (id, user_id, role, created_at) VALUES
('850e8400-e29b-41d4-a716-446655440001', 1, 'admin', now()),
('850e8400-e29b-41d4-a716-446655440002', 2, 'admin', now()),
('850e8400-e29b-41d4-a716-446655440003', 3, 'user', now()),
('850e8400-e29b-41d4-a716-446655440004', 4, 'user', now()),
('850e8400-e29b-41d4-a716-446655440005', 5, 'moderator', now()),
('850e8400-e29b-41d4-a716-446655440006', 6, 'user', now()),
('850e8400-e29b-41d4-a716-446655440007', 7, 'user', now()),
('850e8400-e29b-41d4-a716-446655440008', 8, 'moderator', now()),
('850e8400-e29b-41d4-a716-446655440009', 9, 'admin', now()),
('850e8400-e29b-41d4-a716-446655440010', 10, 'user', now());

-- Insert Sample Sessions (optional - for testing active sessions)
INSERT INTO moi.sessions (id, user_id, token, expires_at, created_at) VALUES
('950e8400-e29b-41d4-a716-446655440001', 1, 'test_token_admin_001', toDateTime('2025-12-31 23:59:59'), now()),
('950e8400-e29b-41d4-a716-446655440002', 2, 'test_token_user_002', toDateTime('2025-12-31 23:59:59'), now());
