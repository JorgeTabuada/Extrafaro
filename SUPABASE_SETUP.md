# Configuração do Supabase para Extrafaro

## 📊 **Projeto Configurado**

### **Detalhes do Projeto:**
- **Nome**: ExtrasControl
- **ID**: `srwbtxvcyvdbcfgrdxen`
- **URL**: https://srwbtxvcyvdbcfgrdxen.supabase.co
- **Região**: us-east-1
- **Status**: ACTIVE_HEALTHY ✅
- **PostgreSQL**: Versão 17.6.1

## 🗄️ **Estrutura da Base de Dados**

### **1. Tabela `employees`**

Armazena informações completas dos colaboradores incluindo documentos.

```sql
CREATE TABLE employees (
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
  
  -- Campos de documentos
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
```

#### **Campos Principais:**
- **id**: Identificador único (UUID)
- **name**: Nome do colaborador
- **type**: Tipo de funcionário (novice, terminal, etc.)
- **state**: Estado (active, inactive, if_needed)
- **city**: Cidade (lisboa, porto, faro)

#### **Disponibilidade:**
- **week_availability**: JSON com dias da semana disponíveis
- **hour_availability**: JSON com horários por dia

#### **Documentos:**
- **photo_url**: URL da fotografia
- **citizen_card_number**: Número do cartão de cidadão
- **citizen_card_file_url**: URL do ficheiro do cartão
- **driving_license_number**: Número da carta de condução
- **driving_license_expiry**: Data de validade da carta
- **driving_license_file_url**: URL do ficheiro da carta
- **contract_file_url**: URL do contrato de trabalho

### **2. Tabela `schedules`**

Armazena as escalas/horários dos colaboradores por data e cidade.

```sql
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  schedule_date DATE NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  employee_type TEXT NOT NULL,
  employee_order INTEGER NOT NULL DEFAULT 0,
  time_slots JSONB NOT NULL DEFAULT '[]',
  total_hours DECIMAL(4, 2) NOT NULL DEFAULT 0,
  hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Campos Principais:**
- **city**: Cidade da escala
- **schedule_date**: Data da escala
- **employee_id**: Referência ao colaborador
- **time_slots**: JSON com horários marcados (array de boolean)
- **total_hours**: Total de horas trabalhadas
- **total_cost**: Custo total calculado

## 🔐 **Segurança**

### **Row Level Security (RLS):**
- ✅ Habilitado em ambas as tabelas
- ✅ Política de acesso público configurada
- ✅ Pronto para ajustes de segurança conforme necessário

### **Índices Criados:**
```sql
-- Tabela employees
CREATE INDEX idx_employees_city ON employees(city);
CREATE INDEX idx_employees_state ON employees(state);
CREATE INDEX idx_employees_type ON employees(type);

-- Tabela schedules
CREATE INDEX idx_schedules_city_date ON schedules(city, schedule_date);
CREATE INDEX idx_schedules_employee ON schedules(employee_id);
CREATE INDEX idx_schedules_date ON schedules(schedule_date);
CREATE UNIQUE INDEX idx_schedules_unique ON schedules(city, schedule_date, employee_id);
```

## 🔑 **Configuração da Aplicação**

### **Variáveis de Ambiente (.env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://srwbtxvcyvdbcfgrdxen.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2J0eHZjeXZkYmNmZ3JkeGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTI3NjQsImV4cCI6MjA3NTEyODc2NH0.1xOWUthSP_eBWAvOpQcXkFmFgOh0ZqqqngC1rebW2N8
```

## 📝 **Exemplos de Uso**

### **Inserir Colaborador:**
```sql
INSERT INTO employees (name, type, state, city, week_availability, hour_availability)
VALUES (
  'João Silva',
  'novice',
  'active',
  'lisboa',
  '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": true, "sunday": true}',
  '{"monday": {"startHour": 3, "endHour": 2, "flexible": true}}'
);
```

### **Inserir Escala:**
```sql
INSERT INTO schedules (city, schedule_date, employee_id, employee_name, employee_type, time_slots, total_hours, hourly_rate, total_cost)
VALUES (
  'lisboa',
  '2025-10-04',
  'uuid-do-colaborador',
  'João Silva',
  'novice',
  '[false, false, true, true, false]',
  1.0,
  4.50,
  4.50
);
```

## 🚀 **Status**

- ✅ **Base de dados criada** e configurada
- ✅ **Tabelas criadas** com todos os campos necessários
- ✅ **Índices aplicados** para performance
- ✅ **RLS configurado** para segurança
- ✅ **Variáveis de ambiente** configuradas
- ✅ **Pronto para integração** com a aplicação

## 🔗 **Links Úteis**

- **Dashboard do Projeto**: https://supabase.com/dashboard/project/srwbtxvcyvdbcfgrdxen
- **Editor SQL**: https://supabase.com/dashboard/project/srwbtxvcyvdbcfgrdxen/sql
- **Tabela employees**: https://supabase.com/dashboard/project/srwbtxvcyvdbcfgrdxen/editor/employees
- **Tabela schedules**: https://supabase.com/dashboard/project/srwbtxvcyvdbcfgrdxen/editor/schedules
