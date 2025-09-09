-- =============================================
-- Sistema de Notificaciones - Oficios MZ
-- Base de datos: Supabase (PostgreSQL)
-- =============================================

-- 1. Crear enum para tipos de notificaciones
CREATE TYPE notification_type AS ENUM (
    'rating',
    'payment', 
    'system',
    'chat',
    'job_request',
    'job_accepted',
    'job_completed',
    'job_cancelled'
);

-- 2. Crear tabla notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}', -- Para datos adicionales (job_id, rating_id, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 4. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para actualizar updated_at
CREATE TRIGGER trigger_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- 6. Vista para notificaciones con información del usuario
CREATE OR REPLACE VIEW user_notifications_view AS
SELECT 
    n.id,
    n.user_id,
    n.title,
    n.message,
    n.type,
    n.is_read,
    n.metadata,
    n.created_at,
    n.updated_at,
    u.full_name as user_name,
    u.email as user_email
FROM notifications n
JOIN users u ON n.user_id = u.id;

-- 7. Función para obtener estadísticas de notificaciones por usuario
CREATE OR REPLACE FUNCTION get_user_notification_stats(user_uuid UUID)
RETURNS TABLE (
    total_notifications BIGINT,
    unread_notifications BIGINT,
    last_notification_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_notifications,
        COUNT(*) FILTER (WHERE is_read = FALSE) as unread_notifications,
        MAX(created_at) as last_notification_date
    FROM notifications 
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- 8. Función para crear notificación automática
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type notification_type DEFAULT 'system',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, metadata)
    VALUES (p_user_id, p_title, p_message, p_type, p_metadata)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Función para marcar notificación como leída
CREATE OR REPLACE FUNCTION mark_notification_read(notification_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    updated_rows INTEGER;
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, updated_at = NOW()
    WHERE id = notification_uuid AND user_id = user_uuid;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- 10. Función para marcar todas las notificaciones como leídas
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    updated_rows INTEGER;
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, updated_at = NOW()
    WHERE user_id = user_uuid AND is_read = FALSE;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    RETURN updated_rows;
END;
$$ LANGUAGE plpgsql;

-- 11. Políticas de seguridad RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias notificaciones
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propias notificaciones
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: Solo el sistema puede insertar notificaciones (via service role)
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- 12. Datos de ejemplo para testing
INSERT INTO notifications (user_id, title, message, type, metadata) VALUES
(
    (SELECT id FROM users LIMIT 1),
    'Nueva Calificación',
    'Has recibido una calificación de 5 estrellas por tu trabajo de plomería',
    'rating',
    '{"rating_id": "123e4567-e89b-12d3-a456-426614174000", "score": 5, "job_id": "456e7890-e89b-12d3-a456-426614174001"}'
),
(
    (SELECT id FROM users LIMIT 1),
    'Pago Recibido',
    'Se ha procesado tu pago de $2,500 por el trabajo completado',
    'payment',
    '{"payment_id": "789e0123-e89b-12d3-a456-426614174002", "amount": 2500, "job_id": "456e7890-e89b-12d3-a456-426614174001"}'
),
(
    (SELECT id FROM users LIMIT 1),
    'Nueva Solicitud de Trabajo',
    'Tienes una nueva solicitud de trabajo en tu área',
    'job_request',
    '{"job_id": "456e7890-e89b-12d3-a456-426614174001", "client_name": "María González"}'
);

-- 13. Comentarios en la tabla
COMMENT ON TABLE notifications IS 'Tabla para almacenar notificaciones del sistema';
COMMENT ON COLUMN notifications.id IS 'Identificador único de la notificación';
COMMENT ON COLUMN notifications.user_id IS 'ID del usuario destinatario';
COMMENT ON COLUMN notifications.title IS 'Título de la notificación';
COMMENT ON COLUMN notifications.message IS 'Mensaje detallado de la notificación';
COMMENT ON COLUMN notifications.type IS 'Tipo de notificación (rating, payment, system, etc.)';
COMMENT ON COLUMN notifications.is_read IS 'Indica si la notificación ha sido leída';
COMMENT ON COLUMN notifications.metadata IS 'Datos adicionales en formato JSON';
COMMENT ON COLUMN notifications.created_at IS 'Fecha y hora de creación';
COMMENT ON COLUMN notifications.updated_at IS 'Fecha y hora de última actualización';

-- =============================================
-- INSTRUCCIONES DE EJECUCIÓN
-- =============================================

/*
Para ejecutar este script en Supabase:

1. Ve al SQL Editor en tu dashboard de Supabase
2. Copia y pega todo este script
3. Ejecuta el script completo
4. Verifica que las tablas se crearon correctamente

Para verificar la instalación:
- SELECT * FROM notifications LIMIT 5;
- SELECT * FROM user_notifications_view LIMIT 5;
- SELECT * FROM get_user_notification_stats('tu-user-id');

Para habilitar Realtime:
- Ve a Database > Replication
- Habilita la replicación para la tabla 'notifications'
*/




