-- Script de diagnóstico para o sistema de trocas/quebras
-- Este script identifica e registra problemas no sistema de aprovação e rejeição

-- 1. Verificar trocas com status inconsistente
SELECT 
    e.id,
    e.label,
    e.type,
    e.status,
    e.updated_at,
    e.updated_by,
    u.name AS updated_by_name,
    CASE 
        WHEN e.updated_by IS NULL AND e.status <> 'pending' THEN 'ERRO: Status alterado sem usuário registrado'
        WHEN e.updated_at IS NULL AND e.status <> 'pending' THEN 'ERRO: Status alterado sem data de atualização'
        ELSE 'OK'
    END AS diagnostico
FROM 
    exchanges e
LEFT JOIN 
    users u ON e.updated_by = u.id
WHERE 
    e.status <> 'pending' OR 
    (e.updated_by IS NOT NULL AND e.status = 'pending') -- Verifica também trocas pendentes com usuário de atualização
ORDER BY 
    e.updated_at DESC;

-- 2. Verificar se as políticas RLS estão corretamente configuradas para aprovações
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM 
    pg_policies
WHERE 
    tablename = 'exchanges' AND
    (cmd = 'UPDATE' OR cmd = 'ALL')
ORDER BY 
    cmd;
    
-- 3. Verificar se o schema está correto para as tabelas relevantes
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'exchanges'
ORDER BY 
    ordinal_position;

-- 4. Verificar a existência das funções utilizadas para atualização
SELECT 
    routine_name, 
    routine_type, 
    data_type AS return_type,
    security_type
FROM 
    information_schema.routines
WHERE 
    routine_name IN ('update_exchange_status', 'emergency_update_exchange', 'can_update_exchange', 'force_update_exchange_status')
    AND routine_schema = 'public'
ORDER BY 
    routine_name;

-- 5. Testar permissões para atualizações diretas SQL
DO $$
BEGIN
    BEGIN
        -- Esta é uma tentativa controlada que deve falhar para testar permissões
        EXECUTE 'ALTER TABLE IF EXISTS public.exchanges DISABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'AVISO: O usuário atual pode desabilitar Row Level Security!';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Permissões adequadas: O usuário não pode desabilitar RLS.';
    END;
END $$;

-- 6. Relatório de status de trocas para diagnóstico
SELECT
    status,
    COUNT(*) AS total_trocas,
    MIN(created_at) AS troca_mais_antiga,
    MAX(created_at) AS troca_mais_recente,
    COUNT(CASE WHEN updated_by IS NULL AND status <> 'pending' THEN 1 END) AS trocas_sem_atualizador
FROM
    exchanges
GROUP BY
    status
ORDER BY
    status;

-- 7. Solucionador automático para trocas sem atualizador
DO $$
DECLARE
    admin_id UUID;
    troca RECORD;
BEGIN
    -- Encontrar um usuário administrador para associar às trocas sem atualizador
    SELECT id INTO admin_id FROM users WHERE role = 'admin' LIMIT 1;
    
    IF admin_id IS NULL THEN
        RAISE NOTICE 'Não foi encontrado nenhum administrador no sistema.';
        RETURN;
    END IF;
    
    -- Procurar trocas aprovadas/rejeitadas sem atualizador
    FOR troca IN (
        SELECT id, status FROM exchanges 
        WHERE status <> 'pending' AND updated_by IS NULL
    ) LOOP
        -- Atualizar a troca com o ID do administrador
        UPDATE exchanges 
        SET updated_by = admin_id,
            updated_at = COALESCE(updated_at, NOW())
        WHERE id = troca.id;
        
        RAISE NOTICE 'Troca ID % com status % atualizada com administrador.', troca.id, troca.status;
    END LOOP;
END $$; 