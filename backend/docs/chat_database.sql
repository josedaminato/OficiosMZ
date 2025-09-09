-- =====================================================
-- SISTEMA DE CHAT EN TIEMPO REAL - OFICIOS MZ
-- =====================================================

-- Tabla de mensajes de chat
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 2000),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_messages_request_id ON messages(request_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, read) WHERE read = FALSE;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_messages_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver mensajes donde son sender o receiver
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT
    USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id
    );

-- Política: Los usuarios solo pueden insertar mensajes donde son el sender
CREATE POLICY "Users can send messages as sender" ON messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
    );

-- Política: Los usuarios pueden actualizar solo sus propios mensajes (para marcar como leído)
CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE
    USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id
    );

-- =====================================================
-- FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para obtener mensajes de una solicitud
CREATE OR REPLACE FUNCTION get_messages_by_request(p_request_id UUID)
RETURNS TABLE (
    id UUID,
    request_id UUID,
    sender_id UUID,
    receiver_id UUID,
    content TEXT,
    read BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    sender_name TEXT,
    receiver_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.request_id,
        m.sender_id,
        m.receiver_id,
        m.content,
        m.read,
        m.created_at,
        COALESCE(sender_profile.full_name, 'Usuario') as sender_name,
        COALESCE(receiver_profile.full_name, 'Usuario') as receiver_name
    FROM messages m
    LEFT JOIN profiles sender_profile ON m.sender_id = sender_profile.id
    LEFT JOIN profiles receiver_profile ON m.receiver_id = receiver_profile.id
    WHERE m.request_id = p_request_id
    ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para marcar mensajes como leídos
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_request_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE messages 
    SET read = TRUE, updated_at = NOW()
    WHERE request_id = p_request_id 
    AND receiver_id = p_user_id 
    AND read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de chat
CREATE OR REPLACE FUNCTION get_chat_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_messages_sent', COUNT(CASE WHEN sender_id = p_user_id THEN 1 END),
        'total_messages_received', COUNT(CASE WHEN receiver_id = p_user_id THEN 1 END),
        'unread_messages', COUNT(CASE WHEN receiver_id = p_user_id AND read = FALSE THEN 1 END),
        'active_conversations', COUNT(DISTINCT request_id),
        'last_message_date', MAX(created_at)
    ) INTO result
    FROM messages 
    WHERE sender_id = p_user_id OR receiver_id = p_user_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HABILITAR REALTIME
-- =====================================================

-- Habilitar replicación en tiempo real para la tabla messages
-- (Esto se debe hacer desde el dashboard de Supabase)
-- Database > Replication > Enable for 'messages' table

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE messages IS 'Tabla de mensajes de chat entre clientes y trabajadores';
COMMENT ON COLUMN messages.request_id IS 'ID de la solicitud de trabajo asociada';
COMMENT ON COLUMN messages.sender_id IS 'ID del usuario que envía el mensaje';
COMMENT ON COLUMN messages.receiver_id IS 'ID del usuario que recibe el mensaje';
COMMENT ON COLUMN messages.content IS 'Contenido del mensaje (máximo 2000 caracteres)';
COMMENT ON COLUMN messages.read IS 'Indica si el mensaje ha sido leído';
COMMENT ON COLUMN messages.created_at IS 'Fecha y hora de creación del mensaje';

COMMENT ON FUNCTION get_messages_by_request(UUID) IS 'Obtiene todos los mensajes de una solicitud con nombres de usuarios';
COMMENT ON FUNCTION mark_messages_as_read(UUID, UUID) IS 'Marca como leídos todos los mensajes no leídos de una solicitud para un usuario';
COMMENT ON FUNCTION get_chat_stats(UUID) IS 'Obtiene estadísticas de chat para un usuario';

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Insertar algunos mensajes de ejemplo (descomenta si necesitas datos de prueba)
/*
INSERT INTO messages (request_id, sender_id, receiver_id, content) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'Hola, ¿cuándo podrías empezar el trabajo?'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Buenos días, puedo empezar mañana a las 9 AM'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'Perfecto, te espero entonces');
*/

-- =====================================================
-- INSTRUCCIONES DE EJECUCIÓN
-- =====================================================

/*
Para ejecutar este script en Supabase:

1. Ve al SQL Editor en tu dashboard de Supabase
2. Copia y pega todo este script
3. Ejecuta el script completo
4. Verifica que la tabla se creó correctamente

Para verificar la instalación:
- SELECT * FROM messages LIMIT 5;
- SELECT * FROM get_messages_by_request('tu-request-id');
- SELECT * FROM get_chat_stats('tu-user-id');

Para habilitar Realtime:
- Ve a Database > Replication
- Habilita la replicación para la tabla 'messages'
*/
