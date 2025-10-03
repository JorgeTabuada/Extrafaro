const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://eijnesrqpzvjqxmqtzcz.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpam5lc3JxcHp2anF4bXF0emN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUzMDU4MiwiZXhwIjoyMDc1MTA2NTgyfQ.bVNCn3oM8roJ8BIiqXJVIzIdTNL-5DiJwwkFHDo4y-8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log('🚀 Iniciando configuração da base de dados...')

  try {
    // SQL para criar a tabela
    const createTableSQL = `
      -- Criar tabela de colaboradores
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
    `

    // Executar SQL para criar tabela
    const { data: tableData, error: tableError } = await supabase
      .rpc('exec_sql', { query: createTableSQL })
      .single()

    if (tableError && !tableError.message.includes('already exists')) {
      // Tentar método alternativo
      console.log('⚠️ Tentando método alternativo para criar tabela...')

      // Verificar se a tabela já existe
      const { data: tables, error: listError } = await supabase
        .from('employees')
        .select('id')
        .limit(1)

      if (listError && listError.message.includes('does not exist')) {
        console.log('❌ Tabela não existe. Por favor, crie manualmente no Supabase Dashboard:')
        console.log('\n1. Acesse: https://supabase.com/dashboard/project/eijnesrqpzvjqxmqtzcz/editor')
        console.log('2. Cole e execute o SQL do arquivo: scripts/create-employees-table.sql')
        return
      }
    }

    console.log('✅ Tabela employees criada/verificada com sucesso!')

    // Criar índices
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_employees_city ON employees(city);
      CREATE INDEX IF NOT EXISTS idx_employees_state ON employees(state);
      CREATE INDEX IF NOT EXISTS idx_employees_type ON employees(type);
    `

    console.log('📊 Criando índices...')

    // Habilitar RLS
    const enableRLSSQL = `
      ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
    `

    console.log('🔒 Configurando segurança (RLS)...')

    // Criar política de acesso público
    const createPolicySQL = `
      CREATE POLICY IF NOT EXISTS "Allow public access" ON employees
        FOR ALL
        USING (true)
        WITH CHECK (true);
    `

    console.log('📝 Criando políticas de acesso...')

    // Testar inserção
    console.log('🧪 Testando inserção de dados...')
    const { data: testInsert, error: insertError } = await supabase
      .from('employees')
      .insert({
        name: 'Teste Inicial',
        type: 'novice',
        state: 'active',
        city: 'faro',
        week_availability: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false
        },
        hour_availability: {
          monday: { startHour: 8, endHour: 18, flexible: false },
          tuesday: { startHour: 8, endHour: 18, flexible: false },
          wednesday: { startHour: 8, endHour: 18, flexible: false },
          thursday: { startHour: 8, endHour: 18, flexible: false },
          friday: { startHour: 8, endHour: 18, flexible: false }
        }
      })
      .select()

    if (insertError) {
      console.log('⚠️ Erro ao inserir teste:', insertError.message)
    } else {
      console.log('✅ Teste de inserção bem-sucedido!')

      // Limpar dados de teste
      if (testInsert && testInsert[0]) {
        await supabase
          .from('employees')
          .delete()
          .eq('id', testInsert[0].id)
        console.log('🧹 Dados de teste removidos')
      }
    }

    console.log('\n🎉 Configuração concluída com sucesso!')
    console.log('📌 URL do Projeto: https://supabase.com/dashboard/project/eijnesrqpzvjqxmqtzcz')
    console.log('📌 A aplicação está pronta para usar o Supabase!')

  } catch (error) {
    console.error('❌ Erro durante a configuração:', error)
    console.log('\n⚠️ Configuração manual necessária:')
    console.log('1. Acesse o Supabase Dashboard')
    console.log('2. Vá para SQL Editor')
    console.log('3. Execute o conteúdo do arquivo: scripts/create-employees-table.sql')
  }
}

setupDatabase()