-- ClickHouse INSERT Statements for MOI Database
-- Database: moi

-- Insert Entities
INSERT INTO moi.entities (id, name, type, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'وزارة الداخلية', 'ministry', now()),
('550e8400-e29b-41d4-a716-446655440002', 'وزارة المالية', 'ministry', now()),
('550e8400-e29b-41d4-a716-446655440003', 'وزارة التخطيط', 'ministry', now()),
('550e8400-e29b-41d4-a716-446655440004', 'ديوان الخدمة المدنية', 'government', now()),
('550e8400-e29b-41d4-a716-446655440005', 'الأمانة العامة', 'government', now()),
('550e8400-e29b-41d4-a716-446655440006', 'إدارة الموارد البشرية', 'department', now()),
('550e8400-e29b-41d4-a716-446655440007', 'إدارة المشتريات', 'department', now()),
('550e8400-e29b-41d4-a716-446655440008', 'إدارة تقنية المعلومات', 'department', now());

-- Insert Sample Correspondences
INSERT INTO moi.correspondences (
    id, number, type, subject, content, from_entity, received_by_entity, date, 
    created_at, updated_at, archived, display_type, greeting, responsible_person, 
    signature_url, attachments, notes, received_by, received_at, created_by, 
    pdf_url, external_doc_id, external_connection_id
) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'IN-2024-001', 'incoming', 
 'طلب موافقة على المشروع السنوي', 
 'نرجو الموافقة على خطة المشروع السنوي المرفقة والرد خلال أسبوع',
 'وزارة التخطيط', 'وزارة الداخلية',
 toDateTime('2024-01-15 00:00:00'), 
 now(), now(), 0, 'content', 'السيد/', '', '', [], NULL, NULL, NULL, 1, NULL, NULL, NULL),

('650e8400-e29b-41d4-a716-446655440002', 'OUT-2024-001', 'outgoing',
 'رد على الاستفسارات الإدارية',
 'بناءً على استفساركم المؤرخ في 10/1/2024، نفيدكم بالتالي...',
 'إدارة الموارد البشرية', 'وزارة المالية',
 toDateTime('2024-01-14 00:00:00'),
 now(), now(), 0, 'content', 'السيد/', '', '', [], NULL, NULL, NULL, 1, NULL, NULL, NULL),

('650e8400-e29b-41d4-a716-446655440003', 'IN-2024-002', 'incoming',
 'تعميم بشأن الإجازات السنوية',
 'يرجى الاطلاع على التعليمات الجديدة بخصوص الإجازات السنوية',
 'ديوان الخدمة المدنية', 'وزارة الداخلية',
 toDateTime('2024-01-13 00:00:00'),
 now(), now(), 0, 'content', 'السيد/', '', '', [], NULL, NULL, NULL, 1, NULL, NULL, NULL),

('650e8400-e29b-41d4-a716-446655440004', 'OUT-2024-002', 'outgoing',
 'طلب اعتماد ميزانية إضافية',
 'نتقدم بطلب اعتماد ميزانية إضافية للمشاريع الطارئة',
 'إدارة المشتريات', 'وزارة المالية',
 toDateTime('2024-01-12 00:00:00'),
 now(), now(), 0, 'content', 'السيد/', '', '', [], NULL, NULL, NULL, 1, NULL, NULL, NULL),

('650e8400-e29b-41d4-a716-446655440005', 'IN-2024-003', 'incoming',
 'دعوة لحضور اجتماع تنسيقي',
 'يسرنا دعوتكم لحضور الاجتماع التنسيقي يوم الأحد القادم',
 'الأمانة العامة', 'وزارة الداخلية',
 toDateTime('2024-01-11 00:00:00'),
 now(), now(), 0, 'content', 'السيد/', '', '', [], NULL, NULL, NULL, 1, NULL, NULL, NULL);

-- Insert Sample Templates
INSERT INTO moi.correspondence_templates (
    id, name, subject_template, content_template, greeting, 
    category, type, is_active, is_public, created_at, updated_at, 
    entity_id, variables, usage_count, created_by, updated_by
) VALUES
('750e8400-e29b-41d4-a716-446655440001', 
 'طلب موافقة عام',
 'طلب موافقة على {{الموضوع}}',
 'تحية طيبة وبعد،

نتقدم إليكم بطلب الموافقة على {{التفاصيل}}.

وتفضلوا بقبول فائق الاحترام والتقدير',
 'السيد/',
 'request', 'outgoing', 1, 1, now(), now(), NULL, '[]', 0, NULL, NULL),

('750e8400-e29b-41d4-a716-446655440002',
 'رد رسمي',
 'رد على {{الموضوع}}',
 'تحية طيبة وبعد،

بناءً على كتابكم المؤرخ {{التاريخ}}، نفيدكم بما يلي:

{{المحتوى}}

وتفضلوا بقبول فائق الاحترام والتقدير',
 'السيد/',
 'response', 'outgoing', 1, 1, now(), now(), NULL, '[]', 0, NULL, NULL),

('750e8400-e29b-41d4-a716-446655440003',
 'تعميم إداري',
 'تعميم بشأن {{الموضوع}}',
 'تحية طيبة وبعد،

نحيطكم علماً بـ {{التفاصيل}}.

يرجى الاطلاع والعمل بموجبه.

وتفضلوا بقبول فائق الاحترام والتقدير',
 'السادة/',
 'circular', 'outgoing', 1, 1, now(), now(), NULL, '[]', 0, NULL, NULL);
