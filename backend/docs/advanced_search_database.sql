-- =====================================================
-- SISTEMA DE BÚSQUEDA AVANZADA - OFICIOS MZ
-- =====================================================

-- Tabla de trabajadores (si no existe)
CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    oficio TEXT NOT NULL,
    custom_oficio TEXT, -- Para oficios personalizados
    description TEXT,
    hourly_rate DECIMAL(10,2),
    service_rate DECIMAL(10,2),
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_ratings INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    availability_schedule JSONB DEFAULT '{}', -- Horarios de disponibilidad
    location_city TEXT,
    location_province TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_address TEXT,
    profile_picture_url TEXT,
    verification_status TEXT DEFAULT 'pending', -- pending, verified, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de búsquedas guardadas
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    search_name TEXT NOT NULL,
    search_filters JSONB NOT NULL, -- Filtros de búsqueda guardados
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de búsquedas frecuentes (para analytics)
CREATE TABLE IF NOT EXISTS search_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_query TEXT NOT NULL,
    filters JSONB,
    result_count INTEGER DEFAULT 0,
    search_count INTEGER DEFAULT 1,
    last_searched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA BÚSQUEDA AVANZADA
-- =====================================================

-- Índice GIN para búsqueda de texto completo en oficio
CREATE INDEX IF NOT EXISTS idx_workers_oficio_gin 
ON workers USING gin(to_tsvector('spanish', oficio || ' ' || COALESCE(custom_oficio, '') || ' ' || COALESCE(description, '')));

-- Índice GIN para búsqueda de texto completo en ubicación
CREATE INDEX IF NOT EXISTS idx_workers_location_gin 
ON workers USING gin(to_tsvector('spanish', location_city || ' ' || COALESCE(location_province, '') || ' ' || COALESCE(location_address, '')));

-- Índice SP-GiST para búsqueda geográfica
CREATE INDEX IF NOT EXISTS idx_workers_location_spgist 
ON workers USING spgist(ll_to_earth(location_lat, location_lng));

-- Índices B-tree para filtros comunes
CREATE INDEX IF NOT EXISTS idx_workers_rating ON workers(rating DESC);
CREATE INDEX IF NOT EXISTS idx_workers_hourly_rate ON workers(hourly_rate);
CREATE INDEX IF NOT EXISTS idx_workers_service_rate ON workers(service_rate);
CREATE INDEX IF NOT EXISTS idx_workers_is_available ON workers(is_available);
CREATE INDEX IF NOT EXISTS idx_workers_verification_status ON workers(verification_status);
CREATE INDEX IF NOT EXISTS idx_workers_created_at ON workers(created_at DESC);

-- Índices compuestos para consultas complejas
CREATE INDEX IF NOT EXISTS idx_workers_oficio_rating ON workers(oficio, rating DESC);
CREATE INDEX IF NOT EXISTS idx_workers_location_rating ON workers(location_city, rating DESC);
CREATE INDEX IF NOT EXISTS idx_workers_available_rating ON workers(is_available, rating DESC) WHERE is_available = TRUE;

-- Índices para analytics
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(search_query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_count ON search_analytics(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id, is_active);

-- =====================================================
-- FUNCIONES DE BÚSQUEDA AVANZADA
-- =====================================================

-- Función para búsqueda de texto completo con ranking
CREATE OR REPLACE FUNCTION search_workers_fts(
    search_text TEXT DEFAULT '',
    oficio_filter TEXT DEFAULT '',
    location_filter TEXT DEFAULT '',
    min_rating DECIMAL DEFAULT 0,
    max_hourly_rate DECIMAL DEFAULT NULL,
    min_hourly_rate DECIMAL DEFAULT NULL,
    max_service_rate DECIMAL DEFAULT NULL,
    min_service_rate DECIMAL DEFAULT NULL,
    is_available_filter BOOLEAN DEFAULT NULL,
    user_lat DECIMAL DEFAULT NULL,
    user_lng DECIMAL DEFAULT NULL,
    radius_km INTEGER DEFAULT 50,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    oficio TEXT,
    custom_oficio TEXT,
    description TEXT,
    hourly_rate DECIMAL,
    service_rate DECIMAL,
    rating DECIMAL,
    total_ratings INTEGER,
    is_available BOOLEAN,
    location_city TEXT,
    location_province TEXT,
    location_lat DECIMAL,
    location_lng DECIMAL,
    location_address TEXT,
    profile_picture_url TEXT,
    verification_status TEXT,
    distance_km DECIMAL,
    relevance_score REAL,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.user_id,
        w.oficio,
        w.custom_oficio,
        w.description,
        w.hourly_rate,
        w.service_rate,
        w.rating,
        w.total_ratings,
        w.is_available,
        w.location_city,
        w.location_province,
        w.location_lat,
        w.location_lng,
        w.location_address,
        w.profile_picture_url,
        w.verification_status,
        CASE 
            WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL AND w.location_lat IS NOT NULL AND w.location_lng IS NOT NULL
            THEN earth_distance(
                ll_to_earth(user_lat, user_lng),
                ll_to_earth(w.location_lat, w.location_lng)
            ) / 1000
            ELSE NULL
        END as distance_km,
        CASE 
            WHEN search_text != '' THEN
                ts_rank(
                    to_tsvector('spanish', w.oficio || ' ' || COALESCE(w.custom_oficio, '') || ' ' || COALESCE(w.description, '')),
                    plainto_tsquery('spanish', search_text)
                )
            ELSE 0.0
        END as relevance_score,
        w.created_at
    FROM workers w
    WHERE 
        -- Filtro de texto (búsqueda full-text)
        (search_text = '' OR to_tsvector('spanish', w.oficio || ' ' || COALESCE(w.custom_oficio, '') || ' ' || COALESCE(w.description, '')) @@ plainto_tsquery('spanish', search_text))
        
        -- Filtro de oficio
        AND (oficio_filter = '' OR w.oficio ILIKE '%' || oficio_filter || '%' OR w.custom_oficio ILIKE '%' || oficio_filter || '%')
        
        -- Filtro de ubicación
        AND (location_filter = '' OR w.location_city ILIKE '%' || location_filter || '%' OR w.location_province ILIKE '%' || location_filter || '%')
        
        -- Filtro de rating mínimo
        AND w.rating >= min_rating
        
        -- Filtros de precio por hora
        AND (min_hourly_rate IS NULL OR w.hourly_rate >= min_hourly_rate)
        AND (max_hourly_rate IS NULL OR w.hourly_rate <= max_hourly_rate)
        
        -- Filtros de precio por servicio
        AND (min_service_rate IS NULL OR w.service_rate >= min_service_rate)
        AND (max_service_rate IS NULL OR w.service_rate <= max_service_rate)
        
        -- Filtro de disponibilidad
        AND (is_available_filter IS NULL OR w.is_available = is_available_filter)
        
        -- Filtro de verificación
        AND w.verification_status = 'verified'
        
        -- Filtro de distancia (si se proporciona ubicación del usuario)
        AND (
            user_lat IS NULL OR user_lng IS NULL OR w.location_lat IS NULL OR w.location_lng IS NULL OR
            earth_distance(
                ll_to_earth(user_lat, user_lng),
                ll_to_earth(w.location_lat, w.location_lng)
            ) / 1000 <= radius_km
        )
    ORDER BY 
        CASE 
            WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL AND w.location_lat IS NOT NULL AND w.location_lng IS NOT NULL
            THEN earth_distance(
                ll_to_earth(user_lat, user_lng),
                ll_to_earth(w.location_lat, w.location_lng)
            ) / 1000
            ELSE 999999
        END ASC,
        relevance_score DESC,
        w.rating DESC,
        w.total_ratings DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener sugerencias de autocompletado
CREATE OR REPLACE FUNCTION get_search_suggestions(
    query_text TEXT,
    suggestion_type TEXT DEFAULT 'oficio', -- 'oficio', 'location', 'all'
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    suggestion TEXT,
    suggestion_type TEXT,
    frequency INTEGER,
    relevance_score REAL
) AS $$
BEGIN
    IF suggestion_type = 'oficio' OR suggestion_type = 'all' THEN
        RETURN QUERY
        SELECT 
            w.oficio as suggestion,
            'oficio'::TEXT as suggestion_type,
            COUNT(*)::INTEGER as frequency,
            ts_rank(
                to_tsvector('spanish', w.oficio),
                plainto_tsquery('spanish', query_text)
            ) as relevance_score
        FROM workers w
        WHERE w.oficio ILIKE '%' || query_text || '%'
        GROUP BY w.oficio
        ORDER BY relevance_score DESC, frequency DESC
        LIMIT limit_count;
    END IF;
    
    IF suggestion_type = 'location' OR suggestion_type = 'all' THEN
        RETURN QUERY
        SELECT 
            w.location_city as suggestion,
            'location'::TEXT as suggestion_type,
            COUNT(*)::INTEGER as frequency,
            ts_rank(
                to_tsvector('spanish', w.location_city),
                plainto_tsquery('spanish', query_text)
            ) as relevance_score
        FROM workers w
        WHERE w.location_city ILIKE '%' || query_text || '%'
        GROUP BY w.location_city
        ORDER BY relevance_score DESC, frequency DESC
        LIMIT limit_count;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar búsquedas en analytics
CREATE OR REPLACE FUNCTION log_search_analytics(
    search_query TEXT,
    filters JSONB DEFAULT '{}',
    result_count INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO search_analytics (search_query, filters, result_count, search_count, last_searched)
    VALUES (search_query, filters, result_count, 1, NOW())
    ON CONFLICT (search_query) 
    DO UPDATE SET 
        search_count = search_analytics.search_count + 1,
        result_count = EXCLUDED.result_count,
        last_searched = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Trigger para workers
CREATE OR REPLACE FUNCTION update_workers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_workers_updated_at
    BEFORE UPDATE ON workers
    FOR EACH ROW
    EXECUTE FUNCTION update_workers_updated_at();

-- Trigger para saved_searches
CREATE OR REPLACE FUNCTION update_saved_searches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_saved_searches_updated_at
    BEFORE UPDATE ON saved_searches
    FOR EACH ROW
    EXECUTE FUNCTION update_saved_searches_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Políticas para workers
CREATE POLICY "Workers are viewable by everyone" ON workers
    FOR SELECT
    USING (true);

CREATE POLICY "Workers can update their own profile" ON workers
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Workers can insert their own profile" ON workers
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Políticas para saved_searches
CREATE POLICY "Users can view their own saved searches" ON saved_searches
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved searches" ON saved_searches
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches" ON saved_searches
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches" ON saved_searches
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para trabajadores con información completa
CREATE OR REPLACE VIEW workers_search_view AS
SELECT 
    w.*,
    u.email,
    u.phone,
    u.full_name,
    u.created_at as user_created_at
FROM workers w
JOIN auth.users u ON w.user_id = u.id
WHERE w.verification_status = 'verified';

-- Vista para estadísticas de búsqueda
CREATE OR REPLACE VIEW search_stats_view AS
SELECT 
    search_query,
    COUNT(*) as total_searches,
    AVG(result_count) as avg_results,
    MAX(last_searched) as last_searched,
    MIN(created_at) as first_searched
FROM search_analytics
GROUP BY search_query
ORDER BY total_searches DESC;

-- =====================================================
-- DATOS DE PRUEBA (OPCIONAL)
-- =====================================================

-- Insertar algunos trabajadores de prueba
INSERT INTO workers (user_id, oficio, description, hourly_rate, service_rate, rating, total_ratings, is_available, location_city, location_province, location_lat, location_lng, location_address, verification_status) VALUES
-- Plomeros
('00000000-0000-0000-0000-000000000001', 'Plomero', 'Especialista en instalaciones y reparaciones de plomería', 2500.00, 5000.00, 4.8, 25, true, 'Mendoza', 'Mendoza', -32.8908, -68.8272, 'Centro, Mendoza', 'verified'),
('00000000-0000-0000-0000-000000000002', 'Plomero', 'Reparaciones de emergencia 24/7', 3000.00, 6000.00, 4.9, 18, true, 'Godoy Cruz', 'Mendoza', -32.9283, -68.8391, 'Godoy Cruz, Mendoza', 'verified'),

-- Electricistas
('00000000-0000-0000-0000-000000000003', 'Electricista', 'Instalaciones eléctricas residenciales y comerciales', 2800.00, 5500.00, 4.7, 32, true, 'Las Heras', 'Mendoza', -32.8257, -68.8019, 'Las Heras, Mendoza', 'verified'),
('00000000-0000-0000-0000-000000000004', 'Electricista', 'Especialista en sistemas de iluminación', 3200.00, 6500.00, 4.9, 15, true, 'Mendoza', 'Mendoza', -32.8908, -68.8272, 'Centro, Mendoza', 'verified'),

-- Carpinteros
('00000000-0000-0000-0000-000000000005', 'Carpintero', 'Muebles a medida y reparaciones', 2200.00, 4500.00, 4.6, 28, true, 'Maipú', 'Mendoza', -33.0000, -68.7500, 'Maipú, Mendoza', 'verified'),
('00000000-0000-0000-0000-000000000006', 'Carpintero', 'Construcción y restauración de muebles', 2500.00, 5000.00, 4.8, 22, true, 'Luján de Cuyo', 'Mendoza', -33.0333, -68.8833, 'Luján de Cuyo, Mendoza', 'verified'),

-- Pintores
('00000000-0000-0000-0000-000000000007', 'Pintor', 'Pintura interior y exterior', 2000.00, 4000.00, 4.5, 35, true, 'San Martín', 'Mendoza', -33.0833, -68.4667, 'San Martín, Mendoza', 'verified'),
('00000000-0000-0000-0000-000000000008', 'Pintor', 'Especialista en pintura decorativa', 2300.00, 4800.00, 4.7, 20, true, 'Mendoza', 'Mendoza', -32.8908, -68.8272, 'Centro, Mendoza', 'verified'),

-- Jardineros
('00000000-0000-0000-0000-000000000009', 'Jardinería', 'Mantenimiento de jardines y paisajismo', 1800.00, 3500.00, 4.4, 30, true, 'Tunuyán', 'Mendoza', -33.5667, -69.0167, 'Tunuyán, Mendoza', 'verified'),
('00000000-0000-0000-0000-000000000010', 'Jardinería', 'Diseño y mantenimiento de espacios verdes', 2100.00, 4200.00, 4.6, 24, true, 'Mendoza', 'Mendoza', -32.8908, -68.8272, 'Centro, Mendoza', 'verified');

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE workers IS 'Tabla de trabajadores con información completa para búsqueda avanzada';
COMMENT ON TABLE saved_searches IS 'Búsquedas guardadas por usuarios';
COMMENT ON TABLE search_analytics IS 'Analytics de búsquedas para mejorar sugerencias';

COMMENT ON FUNCTION search_workers_fts IS 'Función principal de búsqueda con filtros avanzados y ranking';
COMMENT ON FUNCTION get_search_suggestions IS 'Función para obtener sugerencias de autocompletado';
COMMENT ON FUNCTION log_search_analytics IS 'Función para registrar búsquedas en analytics';

COMMENT ON INDEX idx_workers_oficio_gin IS 'Índice GIN para búsqueda de texto completo en oficios';
COMMENT ON INDEX idx_workers_location_spgist IS 'Índice SP-GiST para búsqueda geográfica eficiente';
