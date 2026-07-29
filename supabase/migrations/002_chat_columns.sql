-- Arcana Cloud - Migration 002: Agregar columnas para chat
ALTER TABLE consultante ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;
ALTER TABLE consultante ADD COLUMN IF NOT EXISTS motivo TEXT;
