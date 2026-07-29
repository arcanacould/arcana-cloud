-- Agregar columnas de configuración IA a perfil_persona
ALTER TABLE perfil_persona ADD COLUMN IF NOT EXISTS prompt_personalizado TEXT;
ALTER TABLE perfil_persona ADD COLUMN IF NOT EXISTS motor_ia TEXT NOT NULL DEFAULT 'gemini' CHECK (motor_ia IN ('gemini', 'openai', 'deepseek'));

-- Agregar tipo 'respuesta_ia' al CHECK constraint de memoria
ALTER TABLE memoria DROP CONSTRAINT IF EXISTS memoria_tipo_check;
ALTER TABLE memoria ADD CONSTRAINT memoria_tipo_check CHECK (tipo IN ('creencia', 'situacion', 'hipotesis', 'rasgo', 'evento', 'respuesta_ia'));
