-- Promover usuário contato@codenode.com.br a super administrador
UPDATE users 
SET role = 'super_admin', updated_at = now() 
WHERE user_id = '66393984-54dc-46e4-8d57-ab3e9b0f3524';