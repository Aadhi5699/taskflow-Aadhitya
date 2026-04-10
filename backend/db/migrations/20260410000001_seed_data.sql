-- migrate:up
-- Password is 'password123' bcrypt hashed (cost 12)
INSERT INTO users (id, name, email, password) VALUES 
('11111111-1111-1111-1111-111111111111', 'General Kenobi', 'test@example.com', '$2a$12$NqL1n0T10X1Nn8R6K/4w.e2OaBxwO3Ie5nN.f4rQz5n.C.vTqwV8K');

INSERT INTO projects (id, name, description, owner_id) VALUES
('22222222-2222-2222-2222-222222222222', 'Website Redesign', 'Q2 project for the new marketing site', '11111111-1111-1111-1111-111111111111');

INSERT INTO tasks (id, title, status, priority, project_id, assignee_id) VALUES
('33333333-3333-3333-3333-333333333331', 'Design homepage mockups', 'todo', 'high', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111'),
('33333333-3333-3333-3333-333333333332', 'Setup Next.js repository', 'in_progress', 'medium', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111'),
('33333333-3333-3333-3333-333333333333', 'Finalize brand guidelines', 'done', 'low', '22222222-2222-2222-2222-222222222222', NULL);

-- migrate:down
DELETE FROM tasks WHERE project_id = '22222222-2222-2222-2222-222222222222';
DELETE FROM projects WHERE id = '22222222-2222-2222-2222-222222222222';
DELETE FROM users WHERE email = 'test@example.com';
