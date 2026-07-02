-- ============================================================
-- SCRIPT DE CONFIGURACIÓN INICIAL DE SUPABASE
-- ============================================================
-- Ejecutar en orden:
-- 1. Ejecutar las migraciones: supabase/migrations/0000_initial_schema.sql
-- 2. Ejecutar las vistas: supabase/migrations/0001_views_and_functions.sql
-- 3. (Opcional) Ejecutar seed: supabase/seed.sql
-- 4. Configurar autenticación
-- ============================================================

-- CONFIGURACIÓN DE AUTENTICACIÓN
-- Crear un trigger que cree automáticamente el perfil al registrarse

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_restaurante_id UUID;
BEGIN
  -- Si el usuario se registra con un código de invitación,
  -- buscar el restaurante asociado
  -- Por defecto, se crea un perfil sin restaurante (el admin lo asignará después)
  INSERT INTO perfiles (usuario_id, nombre, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'cajero')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- CONFIGURACIÓN DE ALMACENAMIENTO (STORAGE)
-- Bucket para imágenes de productos

INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurantes', 'restaurantes', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
CREATE POLICY "Imágenes públicas de productos"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('productos', 'restaurantes'));

CREATE POLICY "Admin puede subir imágenes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('productos', 'restaurantes')
    AND auth.role() = 'authenticated'
    AND (
      SELECT rol FROM perfiles WHERE usuario_id = auth.uid()
    ) = 'admin'
  );
