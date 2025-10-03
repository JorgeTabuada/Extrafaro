import { supabase, isSupabaseConfigured } from './supabase'

export async function testSupabaseConnection() {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase não está configurado. Por favor, adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY ao arquivo .env.local'
    }
  }

  try {
    const { data, error } = await supabase!.from('employees').select('count', { count: 'exact', head: true })

    if (error) {
      if (error.message.includes('relation "public.employees" does not exist')) {
        return {
          success: false,
          error: 'Tabela "employees" não existe. Execute o script SQL em scripts/create-employees-table.sql no Supabase.'
        }
      }
      return {
        success: false,
        error: `Erro na conexão: ${error.message}`
      }
    }

    return {
      success: true,
      message: 'Conexão com Supabase estabelecida com sucesso!'
    }
  } catch (error) {
    return {
      success: false,
      error: `Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }
  }
}

export async function syncEmployeesToSupabase(employees: any[]) {
  if (!isSupabaseConfigured()) {
    console.log('Supabase não configurado - salvando apenas localmente')
    return { success: true, local: true }
  }

  try {
    const { data, error } = await supabase!
      .from('employees')
      .upsert(employees, { onConflict: 'id' })

    if (error) {
      console.error('Erro ao sincronizar com Supabase:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao sincronizar:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

export async function loadEmployeesFromSupabase(city: string) {
  if (!isSupabaseConfigured()) {
    return { success: false, local: true, data: [] }
  }

  try {
    const { data, error } = await supabase!
      .from('employees')
      .select('*')
      .eq('city', city)
      .order('name')

    if (error) {
      console.error('Erro ao carregar colaboradores:', error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao carregar:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido', data: [] }
  }
}