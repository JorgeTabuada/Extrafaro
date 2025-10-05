-- Criar tabela de escalas/horários no Supabase
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

-- Índices para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_schedules_city ON schedules(city);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_schedules_employee ON schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_schedules_city_date ON schedules(city, schedule_date);

-- Índice composto para queries comuns (buscar escalas por cidade e data)
CREATE INDEX IF NOT EXISTS idx_schedules_lookup ON schedules(city, schedule_date, employee_order);

-- RLS (Row Level Security) - permite acesso público
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Política que permite acesso público (ajuste conforme necessário)
CREATE POLICY "Allow public access to schedules" ON schedules
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE schedules IS 'Armazena as escalas de trabalho dos colaboradores por cidade e data';
COMMENT ON COLUMN schedules.id IS 'Identificador único no formato: {city}-{date}-{employee_id}';
COMMENT ON COLUMN schedules.time_slots IS 'Array de booleanos representando slots de 30 minutos';
COMMENT ON COLUMN schedules.total_hours IS 'Total de horas trabalhadas calculadas';
COMMENT ON COLUMN schedules.employee_order IS 'Ordem de exibição do colaborador na escala';
