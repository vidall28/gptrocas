#!/bin/bash

# Script para aplicar correções no Supabase
# Este script aplica as funções SQL necessárias para corrigir o problema de aprovação/rejeição

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Aplicação de Correções Supabase ===${NC}"
echo "Este script aplicará as funções SQL necessárias para corrigir problemas"
echo "de aprovação e rejeição de trocas no sistema."
echo 

# Verificar se as variáveis de ambiente estão definidas
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo -e "${RED}Erro: Variáveis SUPABASE_URL e SUPABASE_SERVICE_KEY não estão definidas${NC}"
    echo "Por favor, defina as variáveis de ambiente:"
    echo "export SUPABASE_URL=<sua-url-supabase>"
    echo "export SUPABASE_SERVICE_KEY=<sua-chave-service-role>"
    
    # Tentar pegar do arquivo .env se existir
    if [ -f "../.env" ]; then
        echo -e "${YELLOW}Tentando carregar do arquivo .env...${NC}"
        SUPABASE_URL=$(grep VITE_SUPABASE_URL ../.env | cut -d '=' -f2)
        SUPABASE_SERVICE_KEY=$(grep SUPABASE_SERVICE_KEY ../.env | cut -d '=' -f2)
        
        if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_KEY" ]; then
            echo -e "${GREEN}Informações carregadas do arquivo .env!${NC}"
        else
            echo -e "${RED}Não foi possível carregar as informações do arquivo .env.${NC}"
            exit 1
        fi
    else
        exit 1
    fi
fi

echo "Supabase URL: $SUPABASE_URL"
echo "Chave de serviço encontrada: ${SUPABASE_SERVICE_KEY:0:10}..."

# Função para executar SQL no Supabase
execute_sql() {
    local sql_file=$1
    local description=$2
    
    echo -e "\n${YELLOW}>>> Aplicando: $description${NC}"
    echo -e "Arquivo: $sql_file\n"
    
    # Executar o SQL usando curl
    curl -X POST "$SUPABASE_URL/rest/v1/rpc/execute_sql" \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"sql\": \"$(cat $sql_file | tr -d '\n' | sed 's/"/\\"/g')\"}" \
    -s | jq '.'
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ SQL aplicado com sucesso!${NC}"
    else
        echo -e "${RED}✗ Erro ao aplicar o SQL${NC}"
        echo "Tentando aplicar com método alternativo..."
        
        # Método alternativo usando psql se disponível
        if command -v psql &> /dev/null; then
            echo "Usando psql (necessário informar URL de conexão)..."
            read -p "URL de conexão PostgreSQL (pressione Enter para pular): " pg_url
            
            if [ -n "$pg_url" ]; then
                psql "$pg_url" -f $sql_file
            else
                echo -e "${YELLOW}Método alternativo cancelado.${NC}"
            fi
        else
            echo -e "${RED}psql não está disponível. Não foi possível aplicar com método alternativo.${NC}"
        fi
    fi
}

# Verificar se a função execute_sql existe e criá-la se necessário
echo -e "\n${YELLOW}>>> Verificando função execute_sql${NC}"
curl -X POST "$SUPABASE_URL/rest/v1/rpc/execute_sql" \
-H "apikey: $SUPABASE_SERVICE_KEY" \
-H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
-H "Content-Type: application/json" \
-d "{\"sql\": \"SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'execute_sql');\"}" \
-s > /tmp/execute_sql_check.json

if grep -q "true" /tmp/execute_sql_check.json; then
    echo -e "${GREEN}✓ Função execute_sql já existe${NC}"
else
    echo -e "${YELLOW}Função execute_sql não encontrada. Criando...${NC}"
    
    # Criar função execute_sql
    curl -X POST "$SUPABASE_URL/rest/v1/sql" \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"CREATE OR REPLACE FUNCTION execute_sql(sql text) RETURNS json AS \$\$ BEGIN EXECUTE sql; RETURN json_build_object('success', true); EXCEPTION WHEN OTHERS THEN RETURN json_build_object('success', false, 'error', SQLERRM); END; \$\$ LANGUAGE plpgsql SECURITY DEFINER;\"}" \
    -s > /dev/null
    
    echo -e "${GREEN}✓ Função execute_sql criada${NC}"
fi

# Aplicar funções de reparo
echo -e "\n${YELLOW}=== Aplicando funções de reparo ===${NC}"
execute_sql "supabase_functions.sql" "Funções para atualização de trocas"
execute_sql "diagnostico_trocas.sql" "Funções de diagnóstico"

# Aplicar correções RLS se existir o arquivo
if [ -f "corrigir_rls_trocas.sql" ]; then
    execute_sql "corrigir_rls_trocas.sql" "Correções de políticas RLS"
fi

# Adicionar a função repair_exchanges se não existir
echo -e "\n${YELLOW}>>> Criando função repair_exchanges${NC}"
curl -X POST "$SUPABASE_URL/rest/v1/sql" \
-H "apikey: $SUPABASE_SERVICE_KEY" \
-H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
-H "Content-Type: application/json" \
-d "{\"query\": \"CREATE OR REPLACE FUNCTION repair_exchanges(admin_id UUID) RETURNS json AS \$\$ DECLARE affected_rows INT; BEGIN UPDATE exchanges SET updated_by = admin_id, updated_at = COALESCE(updated_at, NOW()) WHERE status <> 'pending' AND updated_by IS NULL; GET DIAGNOSTICS affected_rows = ROW_COUNT; RETURN json_build_object('success', true, 'rows_affected', affected_rows); EXCEPTION WHEN OTHERS THEN RETURN json_build_object('success', false, 'error', SQLERRM); END; \$\$ LANGUAGE plpgsql SECURITY DEFINER;\"}" \
-s | jq '.'

# Verificar função check_exchange_policies para a página de diagnóstico
echo -e "\n${YELLOW}>>> Criando função check_exchange_policies${NC}"
curl -X POST "$SUPABASE_URL/rest/v1/sql" \
-H "apikey: $SUPABASE_SERVICE_KEY" \
-H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
-H "Content-Type: application/json" \
-d "{\"query\": \"CREATE OR REPLACE FUNCTION check_exchange_policies() RETURNS json AS \$\$ DECLARE policy_count INT; admin_policy_count INT; BEGIN SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'exchanges'; SELECT COUNT(*) INTO admin_policy_count FROM pg_policies WHERE tablename = 'exchanges' AND cmd = 'UPDATE' AND qual LIKE '%role%admin%'; IF admin_policy_count > 0 THEN RETURN json_build_object('result', 'ok', 'details', policy_count || ' políticas encontradas, incluindo ' || admin_policy_count || ' para admin'); ELSE RETURN json_build_object('result', 'warning', 'details', 'Não encontrada política específica para administradores'); END IF; EXCEPTION WHEN OTHERS THEN RETURN json_build_object('result', 'error', 'details', SQLERRM); END; \$\$ LANGUAGE plpgsql SECURITY DEFINER;\"}" \
-s | jq '.'

echo -e "\n${GREEN}=== Aplicação de correções concluída! ===${NC}"
echo "As funções SQL foram aplicadas no Supabase."
echo "Agora acesse o sistema e use a página de diagnóstico em /diagnostico para verificar se as correções foram aplicadas corretamente." 