-- =====================================================
-- SISTEMA DE PAGOS Y DISPUTAS - OFICIOS MZ
-- =====================================================

-- Tabla de pagos
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status payment_status NOT NULL DEFAULT 'pending',
    mercado_pago_preference_id TEXT,
    mercado_pago_payment_id TEXT,
    mercado_pago_status TEXT,
    held_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,
    disputed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enum para estados de pago
CREATE TYPE payment_status AS ENUM (
    'pending',      -- Pago pendiente de confirmación
    'held',         -- Pago retenido por la plataforma
    'released',     -- Pago liberado al trabajador
    'disputed',     -- Pago en disputa
    'refunded'      -- Pago reembolsado
);

-- Tabla de disputas
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    initiator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT,
    status dispute_status NOT NULL DEFAULT 'open',
    evidence_urls TEXT[], -- Array de URLs de evidencia (fotos, documentos)
    admin_notes TEXT,
    resolution TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enum para estados de disputa
CREATE TYPE dispute_status AS ENUM (
    'open',         -- Disputa abierta
    'reviewing',    -- En revisión por admin
    'resolved',     -- Resuelta
    'escalated'     -- Escalada a nivel superior
);

-- Tabla de evidencia de disputas (para múltiples archivos)
CREATE TABLE dispute_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'image', 'document', 'video'
    description TEXT,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para pagos
CREATE INDEX idx_payments_job_id ON payments(job_id);
CREATE INDEX idx_payments_employer_id ON payments(employer_id);
CREATE INDEX idx_payments_worker_id ON payments(worker_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_payments_mercado_pago_preference_id ON payments(mercado_pago_preference_id);

-- Índices para disputas
CREATE INDEX idx_disputes_payment_id ON disputes(payment_id);
CREATE INDEX idx_disputes_initiator_id ON disputes(initiator_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_created_at ON disputes(created_at);

-- Índices para evidencia
CREATE INDEX idx_dispute_evidence_dispute_id ON dispute_evidence(dispute_id);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Trigger para payments
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_updated_at();

-- Trigger para disputes
CREATE OR REPLACE FUNCTION update_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_disputes_updated_at
    BEFORE UPDATE ON disputes
    FOR EACH ROW
    EXECUTE FUNCTION update_disputes_updated_at();

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de resumen de pagos por usuario
CREATE VIEW user_payments_summary AS
SELECT 
    p.employer_id as user_id,
    COUNT(*) as total_payments,
    SUM(CASE WHEN p.status = 'released' THEN p.amount ELSE 0 END) as total_released,
    SUM(CASE WHEN p.status = 'held' THEN p.amount ELSE 0 END) as total_held,
    SUM(CASE WHEN p.status = 'disputed' THEN p.amount ELSE 0 END) as total_disputed,
    AVG(CASE WHEN p.status = 'released' THEN p.amount END) as avg_payment_amount
FROM payments p
GROUP BY p.employer_id

UNION ALL

SELECT 
    p.worker_id as user_id,
    COUNT(*) as total_payments,
    SUM(CASE WHEN p.status = 'released' THEN p.amount ELSE 0 END) as total_received,
    SUM(CASE WHEN p.status = 'held' THEN p.amount ELSE 0 END) as total_pending,
    SUM(CASE WHEN p.status = 'disputed' THEN p.amount ELSE 0 END) as total_disputed,
    AVG(CASE WHEN p.status = 'released' THEN p.amount END) as avg_payment_amount
FROM payments p
GROUP BY p.worker_id;

-- Vista de disputas con información del pago
CREATE VIEW disputes_with_payment_info AS
SELECT 
    d.*,
    p.job_id,
    p.employer_id,
    p.worker_id,
    p.amount,
    p.status as payment_status,
    j.title as job_title,
    initiator.full_name as initiator_name,
    resolver.full_name as resolver_name
FROM disputes d
JOIN payments p ON d.payment_id = p.id
JOIN jobs j ON p.job_id = j.id
JOIN auth.users initiator ON d.initiator_id = initiator.id
LEFT JOIN auth.users resolver ON d.resolved_by = resolver.id;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_evidence ENABLE ROW LEVEL SECURITY;

-- Políticas para payments
CREATE POLICY "Users can view their own payments"
    ON payments FOR SELECT
    USING (auth.uid() = employer_id OR auth.uid() = worker_id);

CREATE POLICY "Employers can create payments for their jobs"
    ON payments FOR INSERT
    WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "System can update payment status"
    ON payments FOR UPDATE
    USING (true); -- Solo el sistema puede actualizar estados

-- Políticas para disputes
CREATE POLICY "Users can view disputes for their payments"
    ON disputes FOR SELECT
    USING (
        auth.uid() = initiator_id OR 
        auth.uid() IN (
            SELECT employer_id FROM payments WHERE id = dispute_id
            UNION
            SELECT worker_id FROM payments WHERE id = dispute_id
        )
    );

CREATE POLICY "Users can create disputes for their payments"
    ON disputes FOR INSERT
    WITH CHECK (
        auth.uid() = initiator_id AND
        auth.uid() IN (
            SELECT employer_id FROM payments WHERE id = payment_id
            UNION
            SELECT worker_id FROM payments WHERE id = payment_id
        )
    );

CREATE POLICY "System can update dispute status"
    ON disputes FOR UPDATE
    USING (true); -- Solo el sistema puede actualizar estados

-- Políticas para dispute_evidence
CREATE POLICY "Users can view evidence for their disputes"
    ON dispute_evidence FOR SELECT
    USING (
        auth.uid() IN (
            SELECT initiator_id FROM disputes WHERE id = dispute_id
            UNION
            SELECT employer_id FROM payments p 
            JOIN disputes d ON p.id = d.payment_id 
            WHERE d.id = dispute_id
            UNION
            SELECT worker_id FROM payments p 
            JOIN disputes d ON p.id = d.payment_id 
            WHERE d.id = dispute_id
        )
    );

CREATE POLICY "Users can upload evidence for their disputes"
    ON dispute_evidence FOR INSERT
    WITH CHECK (
        auth.uid() = uploaded_by AND
        auth.uid() IN (
            SELECT initiator_id FROM disputes WHERE id = dispute_id
            UNION
            SELECT employer_id FROM payments p 
            JOIN disputes d ON p.id = d.payment_id 
            WHERE d.id = dispute_id
            UNION
            SELECT worker_id FROM payments p 
            JOIN disputes d ON p.id = d.payment_id 
            WHERE d.id = dispute_id
        )
    );

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para liberar pagos automáticamente después de X días
CREATE OR REPLACE FUNCTION auto_release_payments()
RETURNS INTEGER AS $$
DECLARE
    released_count INTEGER := 0;
BEGIN
    -- Liberar pagos que han estado retenidos por más de 7 días
    UPDATE payments 
    SET 
        status = 'released',
        released_at = NOW(),
        updated_at = NOW()
    WHERE 
        status = 'held' 
        AND held_at < NOW() - INTERVAL '7 days'
        AND disputed_at IS NULL;
    
    GET DIAGNOSTICS released_count = ROW_COUNT;
    
    RETURN released_count;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de pagos
CREATE OR REPLACE FUNCTION get_payment_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_payments', COUNT(*),
        'total_amount', COALESCE(SUM(amount), 0),
        'released_amount', COALESCE(SUM(CASE WHEN status = 'released' THEN amount ELSE 0 END), 0),
        'held_amount', COALESCE(SUM(CASE WHEN status = 'held' THEN amount ELSE 0 END), 0),
        'disputed_amount', COALESCE(SUM(CASE WHEN status = 'disputed' THEN amount ELSE 0 END), 0),
        'avg_payment', COALESCE(AVG(amount), 0),
        'last_payment_date', MAX(created_at)
    ) INTO result
    FROM payments 
    WHERE employer_id = user_id OR worker_id = user_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Insertar algunos pagos de ejemplo (descomenta si necesitas datos de prueba)
/*
INSERT INTO payments (job_id, employer_id, worker_id, amount, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 5000.00, 'held'),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', 7500.00, 'released');
*/

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE payments IS 'Tabla principal de pagos de la plataforma';
COMMENT ON TABLE disputes IS 'Tabla de disputas relacionadas con pagos';
COMMENT ON TABLE dispute_evidence IS 'Evidencia multimedia para disputas';

COMMENT ON COLUMN payments.status IS 'Estado del pago: pending, held, released, disputed, refunded';
COMMENT ON COLUMN disputes.status IS 'Estado de la disputa: open, reviewing, resolved, escalated';

COMMENT ON FUNCTION auto_release_payments() IS 'Libera automáticamente pagos retenidos por más de 7 días';
COMMENT ON FUNCTION get_payment_stats(UUID) IS 'Obtiene estadísticas de pagos para un usuario específico';
