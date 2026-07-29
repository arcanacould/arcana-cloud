-- Arcana Cloud - Migration 005: Marketplace profile fields
ALTER TABLE tarotista ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE tarotista ADD COLUMN IF NOT EXISTS descripcion_breve TEXT;
ALTER TABLE tarotista ADD COLUMN IF NOT EXISTS puntuacion DECIMAL(2,1) DEFAULT 0 CHECK (puntuacion >= 0 AND puntuacion <= 5);
