-- Promover usuário contato@codenode.com.br a super administrador
UPDATE users 
SET role = 'super_admin', updated_at = now() 
WHERE user_id = '66393984-54dc-46e4-8d57-ab3e9b0f3524';

-- Registrar a ação administrativa
SELECT log_admin_action(
  'promote_user_to_super_admin',
  '66393984-54dc-46e4-8d57-ab3e9b0f3524'::uuid,
  '{"previous_role": "user", "new_role": "super_admin", "email": "contato@codenode.com.br"}'::jsonb
);