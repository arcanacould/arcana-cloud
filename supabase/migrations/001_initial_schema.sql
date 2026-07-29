-- Arcana Cloud - Schema Inicial (Fase 0)
-- Roadmap Consolidado Julio 2026
-- Aislamiento por tarotista_id en todas las tablas de datos

-- ============================================================
-- 1. ORGANIZACION (plataforma, una sola fila)
-- ============================================================
CREATE TABLE organizacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. TAROTISTA (tenant principal - unidad de suscripcion)
-- ============================================================
CREATE TABLE tarotista (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id UUID REFERENCES organizacion(id),
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefono TEXT,
  plan TEXT NOT NULL DEFAULT 'S' CHECK (plan IN ('S', 'M', 'L')),
  suscripcion_activa BOOLEAN NOT NULL DEFAULT false,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. CONSULTANTE (clientes del tarotista)
-- ============================================================
CREATE TABLE consultante (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarotista_id UUID NOT NULL REFERENCES tarotista(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consultante_tarotista ON consultante(tarotista_id);

-- ============================================================
-- 4. SESION
-- ============================================================
CREATE TABLE sesion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarotista_id UUID NOT NULL REFERENCES tarotista(id) ON DELETE CASCADE,
  consultante_id UUID NOT NULL REFERENCES consultante(id) ON DELETE CASCADE,
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_fin TIMESTAMPTZ,
  estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'completada', 'cancelada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sesion_tarotista ON sesion(tarotista_id);
CREATE INDEX idx_sesion_consultante ON sesion(consultante_id);

-- ============================================================
-- 5. TIRADA (tirada de cartas dentro de una sesion)
-- ============================================================
CREATE TABLE tirada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id UUID NOT NULL REFERENCES sesion(id) ON DELETE CASCADE,
  tarotista_id UUID NOT NULL REFERENCES tarotista(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  pregunta TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tirada_sesion ON tirada(sesion_id);
CREATE INDEX idx_tirada_tarotista ON tirada(tarotista_id);

-- ============================================================
-- 6. CARTA (carta individual en una tirada)
-- ============================================================
CREATE TABLE carta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tirada_id UUID NOT NULL REFERENCES tirada(id) ON DELETE CASCADE,
  tarotista_id UUID NOT NULL REFERENCES tarotista(id) ON DELETE CASCADE,
  posicion INT NOT NULL,
  nombre_carta TEXT NOT NULL,
  es_invertida BOOLEAN NOT NULL DEFAULT false,
  significado_general TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_carta_tirada ON carta(tirada_id);
CREATE INDEX idx_carta_tarotista ON carta(tarotista_id);

-- ============================================================
-- 7. INTERPRETACION (interpretacion IA de cada carta)
-- ============================================================
CREATE TABLE interpretacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carta_id UUID NOT NULL REFERENCES carta(id) ON DELETE CASCADE,
  tarotista_id UUID NOT NULL REFERENCES tarotista(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  creado_por TEXT NOT NULL DEFAULT 'sistema' CHECK (creado_por IN ('sistema', 'tarotista')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_interpretacion_carta ON interpretacion(carta_id);
CREATE INDEX idx_interpretacion_tarotista ON interpretacion(tarotista_id);

-- ============================================================
-- 8. MEMORIA (memoria estructurada del consultante)
-- ============================================================
CREATE TABLE memoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultante_id UUID NOT NULL REFERENCES consultante(id) ON DELETE CASCADE,
  tarotista_id UUID NOT NULL REFERENCES tarotista(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('creencia', 'situacion', 'hipotesis', 'rasgo', 'evento')),
  contenido TEXT NOT NULL,
  sesion_origen_id UUID REFERENCES sesion(id) ON DELETE SET NULL,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_memoria_consultante ON memoria(consultante_id);
CREATE INDEX idx_memoria_tarotista ON memoria(tarotista_id);

-- ============================================================
-- 9. RESUMEN (resumen de sesion)
-- ============================================================
CREATE TABLE resumen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id UUID NOT NULL REFERENCES sesion(id) ON DELETE CASCADE,
  tarotista_id UUID NOT NULL REFERENCES tarotista(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_resumen_sesion ON resumen(sesion_id);
CREATE INDEX idx_resumen_tarotista ON resumen(tarotista_id);

-- ============================================================
-- 10. PERFIL_PERSONA (personalizacion de IA con versionado)
-- ============================================================
CREATE TABLE perfil_persona (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarotista_id UUID NOT NULL REFERENCES tarotista(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  nombre_persona TEXT NOT NULL,
  tono TEXT NOT NULL,
  frases_caracteristicas TEXT,
  estilo_cierre TEXT,
  activa BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tarotista_id, version)
);

CREATE INDEX idx_perfil_tarotista ON perfil_persona(tarotista_id);

-- ============================================================
-- 11. AKE (Arcana Knowledge Encyclopedia - las 78 cartas)
-- ============================================================
CREATE TABLE ake_carta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  numero INT,
  arcano TEXT NOT NULL CHECK (arcano IN ('mayor', 'menor')),
  palo TEXT CHECK (palo IN ('copas', 'espadas', 'bastos', 'oros')),
  significado_general TEXT NOT NULL,
  significado_amor TEXT,
  significado_trabajo TEXT,
  significado_salud TEXT,
  significado_invertido TEXT,
  keywords TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. USUARIO (para auth interna del equipo)
-- ============================================================
CREATE TABLE usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarotista_id UUID REFERENCES tarotista(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'tarotista' CHECK (rol IN ('admin', 'tarotista', 'soporte')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- FUNCION: actualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas con updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizacion FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tarotista FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON consultante FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sesion FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON interpretacion FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON memoria FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON perfil_persona FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ake_carta FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON usuario FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
