-- Verificar usuários existentes
SELECT id, name, registration, email, role, status, created_at
FROM public.users
ORDER BY created_at DESC; 