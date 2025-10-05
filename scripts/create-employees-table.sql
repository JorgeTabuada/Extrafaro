-- Criar tabela de colaboradores no Supabase
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  week_availability JSONB NOT NULL DEFAULT '{}',
  hour_availability JSONB NOT NULL DEFAULT '{}',
  custom_hourly_rate DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_employees_city ON employees(city);
CREATE INDEX IF NOT EXISTS idx_employees_state ON employees(state);
CREATE INDEX IF NOT EXISTS idx_employees_type ON employees(type);

-- RLS (Row Level Security) - ajuste conforme suas necessidades de segurança
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Política que permite acesso público (ajuste conforme necessário)
CREATE POLICY "Allow public access" ON employees
  FOR ALL
  USING (true)
  WITH CHECK (true);
