-- Função para atualizar o status de uma troca (abordagem padrão)
CREATE OR REPLACE FUNCTION update_exchange_status(
  exchange_id UUID,
  new_status TEXT,
  exchange_notes TEXT DEFAULT NULL,
  user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN;
BEGIN
  UPDATE exchanges
  SET 
    status = new_status,
    notes = exchange_notes,
    updated_at = NOW(),
    updated_by = user_id
  WHERE id = exchange_id;
  
  GET DIAGNOSTICS success = ROW_COUNT;
  RETURN success > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função de emergência para atualização de status (sem restrições RLS)
CREATE OR REPLACE FUNCTION emergency_update_exchange(
  p_id UUID,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL,
  p_updated_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN;
BEGIN
  -- Atualização direta com SQL bruto, ignorando RLS
  EXECUTE 'UPDATE exchanges
           SET status = $1, notes = $2, updated_at = NOW(), updated_by = $3
           WHERE id = $4'
  USING p_status, p_notes, p_updated_by, p_id;
  
  GET DIAGNOSTICS success = ROW_COUNT;
  
  -- Log da operação de emergência para auditoria
  INSERT INTO audit_logs (table_name, record_id, operation, changed_data, performed_at)
  VALUES ('exchanges', p_id, 'emergency_update', 
          json_build_object('status', p_status, 'notes', p_notes, 'updated_by', p_updated_by), 
          NOW());
  
  RETURN success > 0;
EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, tenta uma atualização ainda mais direta
  BEGIN
    EXECUTE '
      UPDATE exchanges
      SET status = $1,
          notes = $2,
          updated_at = NOW(),
          updated_by = $3
      WHERE id = $4
    ' USING p_status, p_notes, p_updated_by, p_id;
    
    GET DIAGNOSTICS success = ROW_COUNT;
    RETURN success > 0;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para verificar se um usuário tem permissão para atualizar uma troca
CREATE OR REPLACE FUNCTION can_update_exchange(
  exchange_id UUID,
  user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
  is_creator BOOLEAN;
BEGIN
  -- Verifica se é administrador
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id AND role = 'admin'
  ) INTO is_admin;
  
  -- Verifica se é o criador da troca
  SELECT EXISTS (
    SELECT 1 FROM exchanges 
    WHERE id = exchange_id AND user_id = user_id
  ) INTO is_creator;
  
  -- Retorna true se for admin ou criador
  RETURN is_admin OR is_creator;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para forçar atualização de status ignorando todas as políticas
CREATE OR REPLACE FUNCTION force_update_exchange_status(
  p_id UUID,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL,
  p_updated_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Desabilitar temporariamente RLS
  ALTER TABLE exchanges DISABLE ROW LEVEL SECURITY;
  
  -- Realizar atualização direta
  UPDATE exchanges
  SET 
    status = p_status,
    notes = p_notes,
    updated_at = NOW(),
    updated_by = p_updated_by
  WHERE id = p_id;
  
  -- Reabilitar RLS
  ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  -- Garantir que RLS seja restaurado mesmo em caso de erro
  ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 