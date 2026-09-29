-- Migración: Mecanismo de eliminación de cuenta y datos
-- Fecha: 2026-04-25
-- Descripción: Función RPC para que un usuario solicite la eliminación de sus datos.
--              Anonimiza datos personales y elimina datos de clientes asociados.

-- 1. Función para solicitar eliminación de cuenta
CREATE OR REPLACE FUNCTION request_account_deletion()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _clients_count INT;
  _interactions_count INT;
BEGIN
  -- Verificar que hay un usuario autenticado
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No autenticado'
    );
  END IF;

  -- Contar datos que se eliminarán
  SELECT COUNT(*) INTO _clients_count FROM clients WHERE assigned_to = _user_id;
  SELECT COUNT(*) INTO _interactions_count FROM interactions WHERE user_id = _user_id;

  -- 1. Anonimizar perfil (no eliminar para mantener integridad referencial)
  UPDATE profiles
  SET
    full_name = 'Usuario eliminado',
    avatar_url = NULL,
    updated_at = now()
  WHERE user_id = _user_id;

  -- 2. Eliminar interacciones del usuario
  -- (las interaction_lines se eliminan en CASCADE)
  DELETE FROM interactions WHERE user_id = _user_id;

  -- 3. Eliminar clientes asignados al usuario
  -- (las interacciones de esos clientes ya se eliminaron arriba)
  DELETE FROM clients WHERE assigned_to = _user_id;

  -- 4. Eliminar roles del usuario
  DELETE FROM user_roles WHERE user_id = _user_id;

  -- 5. Registrar en audit_log
  INSERT INTO audit_log (table_name, record_id, action, old_data, changed_by)
  VALUES (
    'account_deletion',
    _user_id,
    'DELETE',
    jsonb_build_object(
      'clients_deleted', _clients_count,
      'interactions_deleted', _interactions_count
    ),
    _user_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'clients_deleted', _clients_count,
    'interactions_deleted', _interactions_count,
    'message', 'Datos eliminados correctamente. El perfil fue anonimizado.'
  );
END;
$$;

-- 2. Permisos
GRANT EXECUTE ON FUNCTION request_account_deletion() TO authenticated;

-- 3. Comentario
COMMENT ON FUNCTION request_account_deletion() IS 'Elimina todos los datos del usuario autenticado y anonimiza su perfil. Irreversible.';
