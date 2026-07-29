-- Arcana Cloud - Migration 006: Subscriptions & Ratings

-- Add next billing date to tarotista
ALTER TABLE tarotista ADD COLUMN IF NOT EXISTS proxima_facturacion DATE;

-- Create ratings table
CREATE TABLE IF NOT EXISTS valoracion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarotista_id UUID NOT NULL REFERENCES tarotista(id) ON DELETE CASCADE,
  consultante_id UUID REFERENCES consultante(id) ON DELETE SET NULL,
  puntuacion DECIMAL(2,1) NOT NULL CHECK (puntuacion >= 0 AND puntuacion <= 5),
  comentario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_valoracion_tarotista ON valoracion(tarotista_id);

-- Remove self-assignable puntuacion from tarotista (use valoracion instead)
ALTER TABLE tarotista DROP COLUMN IF EXISTS puntuacion;

-- Create storage bucket for tarotista photos
INSERT INTO storage.buckets (id, name, public) VALUES ('tarotista-photos', 'tarotista-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to the bucket (drop existing first to avoid duplicate)
DROP POLICY IF EXISTS "Public Read" ON storage.objects;
CREATE POLICY "Public Read" ON storage.objects FOR SELECT USING (bucket_id = 'tarotista-photos');
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tarotista-photos' AND auth.role() = 'authenticated');
