-- Arcana Cloud - Migration 004: CRM - Pagos y Notificaciones

-- ============================================================
-- 1. NOTIFICACION (notificaciones in-app para el tarotista)
-- ============================================================
CREATE TABLE IF NOT EXISTS notificacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarotista_id UUID NOT NULL REFERENCES tarotista(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'info' CHECK (tipo IN ('info', 'exito', 'alerta', 'pago', 'sesion')),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notificacion_tarotista ON notificacion(tarotista_id);
CREATE INDEX IF NOT EXISTS idx_notificacion_leida ON notificacion(tarotista_id, leida);

-- ============================================================
-- 2. PAGO (registro de pagos por sesión)
-- ============================================================
CREATE TABLE IF NOT EXISTS pago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarotista_id UUID NOT NULL REFERENCES tarotista(id) ON DELETE CASCADE,
  consultante_id UUID NOT NULL REFERENCES consultante(id) ON DELETE CASCADE,
  sesion_id UUID REFERENCES sesion(id) ON DELETE SET NULL,
  monto DECIMAL(10,2) NOT NULL CHECK (monto >= 0),
  moneda TEXT NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD', 'EUR')),
  concepto TEXT NOT NULL,
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  metodo_pago TEXT DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta', 'mercado_pago', 'otro')),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pago_tarotista ON pago(tarotista_id);
CREATE INDEX IF NOT EXISTS idx_pago_consultante ON pago(consultante_id);
CREATE INDEX IF NOT EXISTS idx_pago_sesion ON pago(sesion_id);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON pago FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- 3. Agregar etiquetas a consultante
-- ============================================================
ALTER TABLE consultante ADD COLUMN IF NOT EXISTS etiquetas TEXT[] DEFAULT '{}';
