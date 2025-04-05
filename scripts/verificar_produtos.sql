-- Verificar se existem produtos na tabela
SELECT id, name, code, capacity, created_at
FROM public.products
ORDER BY created_at DESC;

-- 2. Verificar todas as políticas existentes
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM 
    pg_policies
WHERE 
    schemaname = 'public' 
    AND tablename = 'products';

-- 3. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM 
    pg_tables
WHERE 
    schemaname = 'public' 
    AND tablename = 'products';

-- 4. Verificar usuário atual e suas permissões
DO $$
DECLARE
    current_user_id UUID;
    user_role TEXT;
BEGIN
    -- Obter ID do usuário atual
    SELECT auth.uid() INTO current_user_id;
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE 'Você não está autenticado. Faça login e tente novamente.';
        RETURN;
    END IF;
    
    -- Verificar papel do usuário
    SELECT role INTO user_role 
    FROM public.users 
    WHERE id = current_user_id;
    
    RAISE NOTICE 'Usuário atual: ID=%, Role=%', current_user_id, user_role;
END $$; 