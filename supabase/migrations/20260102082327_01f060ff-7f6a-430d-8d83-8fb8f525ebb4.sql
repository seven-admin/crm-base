-- Add gestor_id to contratos table
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS gestor_id uuid REFERENCES profiles(id);

-- Add tipo_vinculo to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tipo_vinculo text DEFAULT 'terceiro'
  CHECK (tipo_vinculo IN ('funcionario_seven', 'terceiro'));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_contratos_gestor_id ON contratos(gestor_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tipo_vinculo ON profiles(tipo_vinculo);