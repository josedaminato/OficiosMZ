-- =====================================================
-- SISTEMA DE ANALYTICS & REPORTES - OFICIOS MZ
-- =====================================================

-- 1. Tabla de eventos para tracking
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    type TEXT NOT NULL,
    payload JSONB DEFAULT '{}',
    device TEXT,
    browser TEXT,
    os TEXT,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de sesiones de usuario
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT UNIQUE NOT NULL,
    device_info JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    page_views INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. Tabla de métricas diarias (snapshot)
CREATE TABLE IF NOT EXISTS daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,4),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, metric_name)
);

-- 4. Tabla de KPIs por usuario
CREATE TABLE IF NOT EXISTS user_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    kpi_type TEXT NOT NULL,
    kpi_value DECIMAL(15,4),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date, kpi_type)
);

-- 5. Tabla de consentimiento de tracking
CREATE TABLE IF NOT EXISTS tracking_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_given BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consent_version TEXT DEFAULT '1.0',
    ip_address INET,
    user_agent TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para events
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_payload_gin ON events USING gin(payload);

-- Índices para user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- Índices para daily_metrics
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_name ON daily_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date_name ON daily_metrics(date, metric_name);

-- Índices para user_kpis
CREATE INDEX IF NOT EXISTS idx_user_kpis_user_id ON user_kpis(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kpis_date ON user_kpis(date DESC);
CREATE INDEX IF NOT EXISTS idx_user_kpis_type ON user_kpis(kpi_type);
CREATE INDEX IF NOT EXISTS idx_user_kpis_user_date ON user_kpis(user_id, date);

-- Índices para tracking_consent
CREATE INDEX IF NOT EXISTS idx_tracking_consent_user_id ON tracking_consent(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_consent_consent_given ON tracking_consent(consent_given);

-- =====================================================
-- MATERIALIZED VIEWS PARA MÉTRICAS
-- =====================================================

-- Vista materializada para KPIs diarios
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_kpis_daily AS
SELECT 
    DATE(created_at) as date,
    COUNT(DISTINCT user_id) as dau,
    COUNT(DISTINCT session_id) as sessions,
    COUNT(*) as total_events,
    COUNT(DISTINCT CASE WHEN type = 'search_performed' THEN user_id END) as users_searched,
    COUNT(CASE WHEN type = 'search_performed' THEN 1 END) as total_searches,
    COUNT(CASE WHEN type = 'request_created' THEN 1 END) as total_requests,
    COUNT(CASE WHEN type = 'payment_held' THEN 1 END) as payments_held,
    COUNT(CASE WHEN type = 'payment_released' THEN 1 END) as payments_released,
    COUNT(CASE WHEN type = 'rating_submitted' THEN 1 END) as ratings_submitted,
    COUNT(CASE WHEN type = 'dispute_opened' THEN 1 END) as disputes_opened,
    COUNT(CASE WHEN type = 'pwa_installed' THEN 1 END) as pwa_installations,
    COUNT(CASE WHEN type = 'push_enabled' THEN 1 END) as push_enabled
FROM events
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Vista materializada para funnel de conversión
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_funnel_daily AS
SELECT 
    DATE(created_at) as date,
    COUNT(DISTINCT CASE WHEN type = 'search_performed' THEN user_id END) as searches,
    COUNT(DISTINCT CASE WHEN type = 'search_result_click' THEN user_id END) as clicks,
    COUNT(DISTINCT CASE WHEN type = 'request_created' THEN user_id END) as requests,
    COUNT(DISTINCT CASE WHEN type = 'payment_held' THEN user_id END) as payments_held,
    COUNT(DISTINCT CASE WHEN type = 'payment_released' THEN user_id END) as payments_released,
    ROUND(
        COUNT(DISTINCT CASE WHEN type = 'search_result_click' THEN user_id END)::DECIMAL / 
        NULLIF(COUNT(DISTINCT CASE WHEN type = 'search_performed' THEN user_id END), 0) * 100, 2
    ) as search_to_click_rate,
    ROUND(
        COUNT(DISTINCT CASE WHEN type = 'request_created' THEN user_id END)::DECIMAL / 
        NULLIF(COUNT(DISTINCT CASE WHEN type = 'search_result_click' THEN user_id END), 0) * 100, 2
    ) as click_to_request_rate,
    ROUND(
        COUNT(DISTINCT CASE WHEN type = 'payment_held' THEN user_id END)::DECIMAL / 
        NULLIF(COUNT(DISTINCT CASE WHEN type = 'request_created' THEN user_id END), 0) * 100, 2
    ) as request_to_payment_rate,
    ROUND(
        COUNT(DISTINCT CASE WHEN type = 'payment_released' THEN user_id END)::DECIMAL / 
        NULLIF(COUNT(DISTINCT CASE WHEN type = 'payment_held' THEN user_id END), 0) * 100, 2
    ) as payment_success_rate
FROM events
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Vista materializada para métricas de calidad
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_quality_daily AS
SELECT 
    DATE(created_at) as date,
    AVG(CASE WHEN type = 'rating_submitted' THEN (payload->>'score')::DECIMAL END) as avg_rating,
    COUNT(CASE WHEN type = 'rating_submitted' THEN 1 END) as total_ratings,
    COUNT(CASE WHEN type = 'dispute_opened' THEN 1 END) as disputes_opened,
    COUNT(CASE WHEN type = 'dispute_resolved' THEN 1 END) as disputes_resolved,
    ROUND(
        COUNT(CASE WHEN type = 'dispute_opened' THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(CASE WHEN type = 'payment_released' THEN 1 END), 0) * 100, 2
    ) as dispute_rate,
    AVG(CASE WHEN type = 'dispute_resolved' THEN 
        EXTRACT(EPOCH FROM (payload->>'resolved_at')::TIMESTAMP - (payload->>'opened_at')::TIMESTAMP) / 3600
    END) as avg_dispute_resolution_hours
FROM events
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Vista materializada para métricas operacionales
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_ops_daily AS
SELECT 
    DATE(created_at) as date,
    COUNT(CASE WHEN type = 'chat_message_sent' THEN 1 END) as chat_messages,
    COUNT(CASE WHEN type = 'notification_delivered' THEN 1 END) as notifications_delivered,
    COUNT(CASE WHEN type = 'notification_read' THEN 1 END) as notifications_read,
    ROUND(
        COUNT(CASE WHEN type = 'notification_read' THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(CASE WHEN type = 'notification_delivered' THEN 1 END), 0) * 100, 2
    ) as notification_read_rate,
    AVG(CASE WHEN type = 'chat_message_sent' THEN 
        EXTRACT(EPOCH FROM (payload->>'response_time')::INTERVAL) / 60
    END) as avg_chat_response_minutes,
    COUNT(CASE WHEN type = 'page_view' THEN 1 END) as page_views,
    COUNT(DISTINCT CASE WHEN type = 'page_view' THEN session_id END) as unique_sessions
FROM events
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- =====================================================
-- FUNCIONES PARA CÁLCULO DE MÉTRICAS
-- =====================================================

-- Función para calcular DAU/WAU/MAU
CREATE OR REPLACE FUNCTION calculate_user_metrics(
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    period TEXT,
    unique_users BIGINT,
    total_events BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH daily_users AS (
        SELECT 
            DATE(created_at) as date,
            COUNT(DISTINCT user_id) as daily_users
        FROM events
        WHERE created_at >= start_date AND created_at <= end_date
        GROUP BY DATE(created_at)
    ),
    weekly_users AS (
        SELECT 
            DATE_TRUNC('week', created_at) as week,
            COUNT(DISTINCT user_id) as weekly_users
        FROM events
        WHERE created_at >= start_date AND created_at <= end_date
        GROUP BY DATE_TRUNC('week', created_at)
    ),
    monthly_users AS (
        SELECT 
            DATE_TRUNC('month', created_at) as month,
            COUNT(DISTINCT user_id) as monthly_users
        FROM events
        WHERE created_at >= start_date AND created_at <= end_date
        GROUP BY DATE_TRUNC('month', created_at)
    )
    SELECT 'DAU'::TEXT, AVG(daily_users)::BIGINT, SUM(daily_users)::BIGINT FROM daily_users
    UNION ALL
    SELECT 'WAU'::TEXT, AVG(weekly_users)::BIGINT, SUM(weekly_users)::BIGINT FROM weekly_users
    UNION ALL
    SELECT 'MAU'::TEXT, AVG(monthly_users)::BIGINT, SUM(monthly_users)::BIGINT FROM monthly_users;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular retención
CREATE OR REPLACE FUNCTION calculate_retention(
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    cohort_date DATE,
    d1_retention DECIMAL(5,2),
    d7_retention DECIMAL(5,2),
    d30_retention DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH cohorts AS (
        SELECT 
            DATE(created_at) as cohort_date,
            user_id
        FROM events
        WHERE created_at >= start_date AND created_at <= end_date
        AND type = 'page_view'
        GROUP BY DATE(created_at), user_id
    ),
    retention_data AS (
        SELECT 
            c.cohort_date,
            COUNT(DISTINCT c.user_id) as cohort_size,
            COUNT(DISTINCT CASE WHEN e.created_at >= c.cohort_date + INTERVAL '1 day' 
                                 AND e.created_at < c.cohort_date + INTERVAL '2 days' 
                                 THEN e.user_id END) as d1_returned,
            COUNT(DISTINCT CASE WHEN e.created_at >= c.cohort_date + INTERVAL '7 days' 
                                 AND e.created_at < c.cohort_date + INTERVAL '8 days' 
                                 THEN e.user_id END) as d7_returned,
            COUNT(DISTINCT CASE WHEN e.created_at >= c.cohort_date + INTERVAL '30 days' 
                                 AND e.created_at < c.cohort_date + INTERVAL '31 days' 
                                 THEN e.user_id END) as d30_returned
        FROM cohorts c
        LEFT JOIN events e ON c.user_id = e.user_id
        GROUP BY c.cohort_date
    )
    SELECT 
        cohort_date,
        ROUND(d1_returned::DECIMAL / NULLIF(cohort_size, 0) * 100, 2) as d1_retention,
        ROUND(d7_returned::DECIMAL / NULLIF(cohort_size, 0) * 100, 2) as d7_retention,
        ROUND(d30_returned::DECIMAL / NULLIF(cohort_size, 0) * 100, 2) as d30_retention
    FROM retention_data
    ORDER BY cohort_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular métricas de geolocalización
CREATE OR REPLACE FUNCTION calculate_geo_metrics(
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    city TEXT,
    province TEXT,
    total_workers BIGINT,
    total_requests BIGINT,
    avg_distance_km DECIMAL(10,2),
    conversion_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH geo_events AS (
        SELECT 
            e.payload->>'city' as city,
            e.payload->>'province' as province,
            e.payload->>'distance_km' as distance_km,
            e.type
        FROM events e
        WHERE e.created_at >= start_date AND e.created_at <= end_date
        AND e.type IN ('search_performed', 'request_created')
        AND e.payload ? 'city'
    ),
    geo_stats AS (
        SELECT 
            city,
            province,
            COUNT(CASE WHEN type = 'search_performed' THEN 1 END) as searches,
            COUNT(CASE WHEN type = 'request_created' THEN 1 END) as requests,
            AVG((distance_km)::DECIMAL) as avg_distance
        FROM geo_events
        GROUP BY city, province
    )
    SELECT 
        gs.city,
        gs.province,
        COALESCE(w.worker_count, 0)::BIGINT as total_workers,
        gs.requests::BIGINT as total_requests,
        ROUND(gs.avg_distance, 2) as avg_distance_km,
        ROUND(gs.requests::DECIMAL / NULLIF(gs.searches, 0) * 100, 2) as conversion_rate
    FROM geo_stats gs
    LEFT JOIN (
        SELECT 
            location_city,
            COUNT(*) as worker_count
        FROM workers
        WHERE verification_status = 'verified'
        GROUP BY location_city
    ) w ON gs.city = w.location_city
    ORDER BY gs.requests DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS Y FUNCIONES DE MANTENIMIENTO
-- =====================================================

-- Función para actualizar sesiones
CREATE OR REPLACE FUNCTION update_user_session()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar o crear sesión
    INSERT INTO user_sessions (user_id, session_id, device_info, page_views)
    VALUES (
        NEW.user_id,
        NEW.session_id,
        jsonb_build_object(
            'device', NEW.device,
            'browser', NEW.browser,
            'os', NEW.os,
            'user_agent', NEW.user_agent
        ),
        1
    )
    ON CONFLICT (session_id) 
    DO UPDATE SET 
        page_views = user_sessions.page_views + 1,
        ended_at = NEW.created_at;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar sesiones
CREATE TRIGGER trigger_update_user_session
    AFTER INSERT ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_user_session();

-- Función para refrescar materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW mv_kpis_daily;
    REFRESH MATERIALIZED VIEW mv_funnel_daily;
    REFRESH MATERIALIZED VIEW mv_quality_daily;
    REFRESH MATERIALIZED VIEW mv_ops_daily;
    
    -- Log de actualización
    INSERT INTO daily_metrics (date, metric_name, metric_value, metadata)
    VALUES (
        CURRENT_DATE,
        'views_refreshed',
        1,
        jsonb_build_object('refreshed_at', NOW())
    )
    ON CONFLICT (date, metric_name) 
    DO UPDATE SET 
        metric_value = EXCLUDED.metric_value,
        metadata = EXCLUDED.metadata;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_consent ENABLE ROW LEVEL SECURITY;

-- Políticas para events
CREATE POLICY "Users can insert their own events" ON events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all events" ON events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Políticas para user_sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON user_sessions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Políticas para daily_metrics (solo admin)
CREATE POLICY "Only admins can view daily metrics" ON daily_metrics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Políticas para user_kpis
CREATE POLICY "Users can view their own KPIs" ON user_kpis
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user KPIs" ON user_kpis
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Políticas para tracking_consent
CREATE POLICY "Users can manage their own consent" ON tracking_consent
    FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- DATOS DE PRUEBA (OPCIONAL)
-- =====================================================

-- Insertar algunos eventos de prueba
INSERT INTO events (user_id, session_id, type, payload, device, browser, os) VALUES
-- Eventos de búsqueda
('00000000-0000-0000-0000-000000000001', 'session-001', 'search_performed', '{"query": "plomero", "filters": {"location": "mendoza"}}', 'mobile', 'Chrome', 'Android'),
('00000000-0000-0000-0000-000000000001', 'session-001', 'search_result_click', '{"worker_id": "worker-001", "position": 1}', 'mobile', 'Chrome', 'Android'),
('00000000-0000-0000-0000-000000000001', 'session-001', 'request_created', '{"request_id": "req-001", "worker_id": "worker-001", "amount": 5000}', 'mobile', 'Chrome', 'Android'),
('00000000-0000-0000-0000-000000000001', 'session-001', 'payment_held', '{"payment_id": "pay-001", "amount": 5000}', 'mobile', 'Chrome', 'Android'),
('00000000-0000-0000-0000-000000000001', 'session-001', 'payment_released', '{"payment_id": "pay-001", "amount": 5000}', 'mobile', 'Chrome', 'Android'),
('00000000-0000-0000-0000-000000000001', 'session-001', 'rating_submitted', '{"rating_id": "rating-001", "score": 5, "comment": "Excelente trabajo"}', 'mobile', 'Chrome', 'Android'),

-- Eventos de PWA
('00000000-0000-0000-0000-000000000002', 'session-002', 'pwa_installed', '{"platform": "android", "version": "1.0.0"}', 'mobile', 'Chrome', 'Android'),
('00000000-0000-0000-0000-000000000002', 'session-002', 'push_enabled', '{"permission": "granted"}', 'mobile', 'Chrome', 'Android'),

-- Eventos de chat
('00000000-0000-0000-0000-000000000003', 'session-003', 'chat_message_sent', '{"message_id": "msg-001", "response_time": "00:02:30"}', 'desktop', 'Chrome', 'Windows'),
('00000000-0000-0000-0000-000000000003', 'session-003', 'notification_delivered', '{"notification_id": "notif-001", "type": "chat"}', 'desktop', 'Chrome', 'Windows'),
('00000000-0000-0000-0000-000000000003', 'session-003', 'notification_read', '{"notification_id": "notif-001"}', 'desktop', 'Chrome', 'Windows');

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE events IS 'Tabla principal de eventos para analytics y tracking';
COMMENT ON TABLE user_sessions IS 'Sesiones de usuario para métricas de engagement';
COMMENT ON TABLE daily_metrics IS 'Snapshot diario de métricas agregadas';
COMMENT ON TABLE user_kpis IS 'KPIs individuales por usuario';
COMMENT ON TABLE tracking_consent IS 'Consentimiento de tracking por usuario';

COMMENT ON FUNCTION calculate_user_metrics IS 'Calcula DAU/WAU/MAU para un período';
COMMENT ON FUNCTION calculate_retention IS 'Calcula métricas de retención D1/D7/D30';
COMMENT ON FUNCTION calculate_geo_metrics IS 'Calcula métricas de geolocalización';
COMMENT ON FUNCTION refresh_analytics_views IS 'Refresca todas las vistas materializadas';

-- =====================================================
-- INSTRUCCIONES DE EJECUCIÓN
-- =====================================================

/*
Para ejecutar este script en Supabase:

1. Ve al SQL Editor en tu dashboard de Supabase
2. Copia y pega todo este script
3. Ejecuta el script completo
4. Verifica que las tablas se crearon correctamente

Para verificar la instalación:
- SELECT * FROM events LIMIT 5;
- SELECT * FROM mv_kpis_daily LIMIT 5;
- SELECT * FROM calculate_user_metrics(CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE);

Para habilitar Realtime:
- Ve a Database > Replication
- Habilita la replicación para la tabla 'events'

Para configurar cron job (opcional):
- Configura pg_cron para ejecutar refresh_analytics_views() diariamente
- O usa Supabase Edge Functions para el mismo propósito
*/
