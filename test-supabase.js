const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://eijnesrqpzvjqxmqtzcz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpam5lc3JxcHp2anF4bXF0emN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MzA1ODIsImV4cCI6MjA3NTEwNjU4Mn0.pUA87maQw5w8Qtt40npx-SqQ_Jj9naLtURwJggwUZrg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...')
  console.log('URL:', supabaseUrl)

  try {
    // Testar listagem de colaboradores
    const { data, error, count } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('\n⚠️ A tabela "employees" ainda não existe!')
        console.log('\n📋 Por favor, acesse o Supabase e execute este SQL:')
        console.log('---------------------------------------------------')
        console.log(`
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_employees_city ON employees(city);
CREATE INDEX IF NOT EXISTS idx_employees_state ON employees(state);
CREATE INDEX IF NOT EXISTS idx_employees_type ON employees(type);

-- RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Política de acesso
CREATE POLICY "Allow public access" ON employees
  FOR ALL
  USING (true)
  WITH CHECK (true);
        `)
        console.log('---------------------------------------------------')
        console.log('\n🔗 Link direto para o SQL Editor:')
        console.log(`https://supabase.com/dashboard/project/eijnesrqpzvjqxmqtzcz/sql/new`)
      } else {
        console.log('❌ Erro:', error.message)
      }
      return
    }

    console.log('✅ Conexão estabelecida com sucesso!')
    console.log(`📊 Tabela "employees" existe com ${count || 0} registos`)

    // Testar inserção
    console.log('\n🧪 Testando inserção...')
    const { data: newEmployee, error: insertError } = await supabase
      .from('employees')
      .insert({
        name: 'Teste de Conexão',
        type: 'novice',
        state: 'active',
        city: 'faro'
      })
      .select()
      .single()

    if (insertError) {
      console.log('❌ Erro na inserção:', insertError.message)
    } else {
      console.log('✅ Inserção bem-sucedida!')
      console.log('Colaborador criado:', newEmployee.name, '(ID:', newEmployee.id, ')')

      // Limpar teste
      await supabase
        .from('employees')
        .delete()
        .eq('id', newEmployee.id)
      console.log('🧹 Dados de teste removidos')
    }

    console.log('\n🎉 Tudo está funcionando corretamente!')
    console.log('📱 A aplicação pode agora sincronizar com o Supabase!')

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message)
  }
}

testConnection()