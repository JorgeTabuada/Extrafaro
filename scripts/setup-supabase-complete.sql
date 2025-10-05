-- ============================================
-- SCRIPT COMPLETO DE CONFIGURAÇÃO DO SUPABASE
-- Sistema de Gestão de Escalas - Extrafaro
-- ============================================

-- ============================
-- 1. TABELA DE COLABORADORES
-- ============================

CREATE TABLE IF NOT EXISTS employees (
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

-- Índices para employees
CREATE INDEX IF NOT EXISTS idx_employees_city ON employees(city);
CREATE INDEX IF NOT EXISTS idx_employees_state ON employees(state);
CREATE INDEX IF NOT EXISTS idx_employees_type ON employees(type);
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);

-- ============================
-- 2. TABELA DE ESCALAS
-- ============================

CREATE TABLE IF NOT EXISTS schedules (
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

-- Índices para schedules
CREATE INDEX IF NOT EXISTS idx_schedules_city ON schedules(city);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_schedules_employee ON schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_schedules_city_date ON schedules(city, schedule_date);
CREATE INDEX IF NOT EXISTS idx_schedules_lookup ON schedules(city, schedule_date, employee_order);

-- ============================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================

-- Ativar RLS nas tabelas
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (IMPORTANTE: Ajuste conforme necessário para produção)
-- Remover políticas existentes se houver
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
-- 4. FUNÇÕES E TRIGGERS
-- ============================

-- Função para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para employees
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para schedules
DROP TRIGGER IF EXISTS update_schedules_updated_at ON schedules;
CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================
-- 5. VIEWS ÚTEIS
-- ============================

-- View para estatísticas de escalas por cidade
CREATE OR REPLACE VIEW schedule_stats_by_city AS
SELECT
  city,
  schedule_date,
  COUNT(DISTINCT employee_id) as total_employees,
  SUM(total_hours) as total_hours,
  SUM(total_cost) as total_cost,
  AVG(hourly_rate) as avg_hourly_rate
FROM schedules
GROUP BY city, schedule_date
ORDER BY schedule_date DESC, city;

-- View para colaboradores ativos por cidade
CREATE OR REPLACE VIEW active_employees_by_city AS
SELECT
  city,
  state,
  COUNT(*) as total_employees
FROM employees
WHERE state IN ('active', 'if_needed')
GROUP BY city, state
ORDER BY city, state;

-- ============================
-- 6. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================

COMMENT ON TABLE employees IS 'Armazena informações dos colaboradores do sistema';
COMMENT ON TABLE schedules IS 'Armazena as escalas de trabalho dos colaboradores por cidade e data';

COMMENT ON COLUMN employees.id IS 'Identificador único do colaborador (UUID ou string)';
COMMENT ON COLUMN employees.week_availability IS 'Disponibilidade semanal em formato JSON';
COMMENT ON COLUMN employees.hour_availability IS 'Disponibilidade horária por dia em formato JSON';

COMMENT ON COLUMN schedules.id IS 'Identificador único no formato: {city}-{date}-{employee_id}';
COMMENT ON COLUMN schedules.time_slots IS 'Array de booleanos representando slots de 30 minutos (48 slots = 24h)';
COMMENT ON COLUMN schedules.total_hours IS 'Total de horas trabalhadas calculadas automaticamente';
COMMENT ON COLUMN schedules.employee_order IS 'Ordem de exibição do colaborador na escala';

-- ============================
-- 7. DADOS DE EXEMPLO (OPCIONAL)
-- ============================

-- Descomentar as linhas abaixo para inserir dados de exemplo

/*
-- Exemplo de colaborador
INSERT INTO employees (id, name, type, state, city, week_availability, hour_availability)
VALUES (
  'emp-001',
  'João Silva',
  'pickup_delivery',
  'active',
  'lisboa',
  '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": false, "sunday": false}'::jsonb,
  '{}'::jsonb
) ON CONFLICT (id) DO NOTHING;
*/

-- ============================
-- FIM DO SCRIPT
-- ============================

-- Para verificar se tudo foi criado corretamente:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
