-- Verificar todas as políticas RLS
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
    schemaname = 'public';

-- Verificar os produtos usando o user_id atual
DO $$
DECLARE
    user_id UUID;
    product_row RECORD;
BEGIN
    SELECT auth.uid() INTO user_id;
    RAISE NOTICE 'User ID atual: %', user_id;
    
    -- Verificar se o usuário está autenticado
    IF user_id IS NULL THEN
        RAISE NOTICE 'Usuário não autenticado!';
    ELSE
        RAISE NOTICE 'Usuário autenticado, tentando acessar produtos...';
        
        -- Verificar se o usuário tem permissão para ver produtos
        -- Esta query funcionará apenas se o usuário tiver permissão
        CREATE TEMP TABLE temp_products AS
        SELECT * FROM products LIMIT 10;
        
        RAISE NOTICE 'Consulta bem-sucedida! O usuário tem acesso aos produtos.';
        
        -- Exibir os primeiros 5 produtos para verificação
        RAISE NOTICE 'Amostra de produtos:';
        FOR product_row IN SELECT id, name, code, capacity FROM temp_products LIMIT 5
        LOOP
            RAISE NOTICE 'Produto: %, Código: %, Capacidade: %', 
                  product_row.name, product_row.code, product_row.capacity;
        END LOOP;
        
        -- Limpar tabela temporária
        DROP TABLE IF EXISTS temp_products;
    END IF;
END $$; 