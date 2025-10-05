-- ============================================
-- SCRIPT DE CORREÇÃO - Alterar tipo de ID
-- Resolve erro: invalid input syntax for type uuid
-- ============================================

-- IMPORTANTE: Este script deve ser executado se você criou as tabelas
-- com o script antigo que usava UUID ao invés de TEXT

-- ============================
-- 1. RECRIAR TABELA EMPLOYEES
-- ============================

-- Deletar tabela antiga (cuidado: remove dados!)
DROP TABLE IF EXISTS employees CASCADE;

-- Recriar com tipo TEXT
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
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
  photo_url TEXT,
  citizen_card_number TEXT,
  citizen_card_file_url TEXT,
  driving_license_number TEXT,
  driving_license_expiry DATE,
  driving_license_file_url TEXT,
  contract_file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_employees_city ON employees(city);
CREATE INDEX idx_employees_state ON employees(state);
CREATE INDEX idx_employees_type ON employees(type);
CREATE INDEX idx_employees_name ON employees(name);

-- ============================
-- 2. TABELA SCHEDULES (já está TEXT)
-- ============================

-- Verificar se schedules existe e recriar se necessário
DROP TABLE IF EXISTS schedules CASCADE;

CREATE TABLE schedules (
  id TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  schedule_date DATE NOT NULL,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  employee_type TEXT NOT NULL,
  employee_order INTEGER NOT NULL DEFAULT 0,
  time_slots JSONB NOT NULL DEFAULT '[]',
  total_hours DECIMAL(10, 2) NOT NULL DEFAULT 0,
  hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_schedules_city ON schedules(city);
CREATE INDEX idx_schedules_date ON schedules(schedule_date);
CREATE INDEX idx_schedules_employee ON schedules(employee_id);
CREATE INDEX idx_schedules_city_date ON schedules(city, schedule_date);
CREATE INDEX idx_schedules_lookup ON schedules(city, schedule_date, employee_order);

-- ============================
-- 3. RLS E POLÍTICAS
-- ============================

-- Ativar RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Allow public access" ON employees;
DROP POLICY IF EXISTS "Allow public access to employees" ON employees;
DROP POLICY IF EXISTS "Allow public access to schedules" ON schedules;

-- Criar novas políticas
CREATE POLICY "Allow public access to employees" ON employees
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public access to schedules" ON schedules
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================
-- 4. TRIGGERS
-- ============================

-- Função para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_schedules_updated_at ON schedules;
CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================
-- FIM DO SCRIPT
-- ============================

-- Verificar
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('employees', 'schedules')
AND column_name = 'id';
