-- Verificar usuário atual
SELECT 
    auth.uid() as current_user_id,
    (SELECT role FROM public.users WHERE id = auth.uid()) as user_role; 