-- Arcana Cloud - Seed Admin
-- Crea el usuario admin en Supabase Auth y sus datos en las tablas públicas
-- NOTA: Primero hay que crear el auth user manualmente desde Settings > Authentication > Users > Invite
-- o mediante el Sign Up desde el panel frontend.
-- Este script solo crea los datos asociados una vez que el auth user existe.

-- 1. Organización (plataforma)
INSERT INTO organizacion (nombre) VALUES ('Arcana Cloud')
ON CONFLICT DO NOTHING;

-- 2. Tarotista admin
INSERT INTO tarotista (nombre, email, plan, suscripcion_activa)
VALUES ('Admin Arcana', 'admin@arcanacloud.com', 'L', true)
ON CONFLICT (email) DO NOTHING;

-- 3. Usuario admin
INSERT INTO usuario (tarotista_id, email, nombre, rol)
SELECT id, 'admin@arcanacloud.com', 'Admin Arcana', 'admin'
FROM tarotista WHERE email = 'admin@arcanacloud.com'
ON CONFLICT (email) DO NOTHING;

-- 4. Perfil persona por defecto para el admin
INSERT INTO perfil_persona (tarotista_id, version, nombre_persona, tono, frases_caracteristicas, estilo_cierre, activa)
SELECT id, 1, 'Adriana', 'cálido y empático', 'Confía en el proceso, el tarot te guía', 'Con amor y luz, que el universo te acompañe', true
FROM tarotista WHERE email = 'admin@arcanacloud.com'
ON CONFLICT DO NOTHING;
