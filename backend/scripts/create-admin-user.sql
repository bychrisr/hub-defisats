-- Script para criar um usuário administrador de teste
INSERT INTO users (id, username, email, password_hash, plan_type, created_at, updated_at) 
VALUES (
  'admin-test-user-id', 
  'admin', 
  'admin@axisor.com', 
  '$2b$10$dummy.hash.for.testing', 
  'lifetime', 
  NOW(), 
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO admin_users (id, user_id, role, permissions, created_at, updated_at)
VALUES (
  'admin-test-admin-id',
  'admin-test-user-id',
  'super_admin',
  '["*"]',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO NOTHING;