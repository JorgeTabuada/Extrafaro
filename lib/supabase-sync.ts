import { supabase, isSupabaseConfigured } from './supabase'

export interface ScheduleData {
  id?: string
  city: string
  date: string
  employees: any[]
  schedule: Record<string, boolean[]>
  total_half_hours: number
  created_at?: string
  updated_at?: string
}

export interface EmployeeData {
  id: string
  name: string
  type: string
  state: string
  city: string
  phone?: string
  email?: string
  notes?: string
  week_availability: Record<string, boolean>
  hour_availability: Record<string, any>
  custom_hourly_rate?: number
}

// Função para sincronizar dados de escala com Supabase
export const syncScheduleToSupabase = async (
  city: string,
  date: Date,
  employees: any[],
  schedule: Record<string, boolean[]>,
  totalHalfHours: number
): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, message: 'Supabase não configurado' }
  }

  try {
    const dateStr = date.toISOString().split('T')[0]
    const scheduleId = `${city}-${dateStr}`

    const scheduleData: ScheduleData = {
      id: scheduleId,
      city,
      date: dateStr,
      employees,
      schedule,
      total_half_hours: totalHalfHours,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('schedules')
      .upsert(scheduleData, { onConflict: 'id' })

    if (error) {
      console.error('Erro ao sincronizar escala:', error)
      return { success: false, message: `Erro: ${error.message}` }
    }

    return { success: true, message: 'Escala sincronizada com sucesso!' }
  } catch (error) {
    console.error('Erro ao sincronizar escala:', error)
    return { success: false, message: 'Erro interno ao sincronizar' }
  }
}

// Função para carregar dados de escala do Supabase
export const loadScheduleFromSupabase = async (
  city: string,
  date: Date
): Promise<{ success: boolean; data?: ScheduleData; message: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, message: 'Supabase não configurado' }
  }

  try {
    const dateStr = date.toISOString().split('T')[0]
    const scheduleId = `${city}-${dateStr}`

    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', scheduleId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, message: 'Nenhuma escala encontrada para esta data' }
      }
      console.error('Erro ao carregar escala:', error)
      return { success: false, message: `Erro: ${error.message}` }
    }

    return { success: true, data, message: 'Escala carregada com sucesso!' }
  } catch (error) {
    console.error('Erro ao carregar escala:', error)
    return { success: false, message: 'Erro interno ao carregar' }
  }
}

// Função para sincronizar colaboradores com Supabase
export const syncEmployeesToSupabase = async (
  employees: EmployeeData[]
): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, message: 'Supabase não configurado' }
  }

  try {
    const { data, error } = await supabase
      .from('employees')
      .upsert(employees, { onConflict: 'id' })

    if (error) {
      console.error('Erro ao sincronizar colaboradores:', error)
      return { success: false, message: `Erro: ${error.message}` }
    }

    return { success: true, message: `${employees.length} colaboradores sincronizados!` }
  } catch (error) {
    console.error('Erro ao sincronizar colaboradores:', error)
    return { success: false, message: 'Erro interno ao sincronizar' }
  }
}

// Função para carregar colaboradores do Supabase
export const loadEmployeesFromSupabase = async (
  city?: string
): Promise<{ success: boolean; data?: EmployeeData[]; message: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, message: 'Supabase não configurado' }
  }

  try {
    let query = supabase.from('employees').select('*')
    
    if (city) {
      query = query.eq('city', city)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao carregar colaboradores:', error)
      return { success: false, message: `Erro: ${error.message}` }
    }

    return { success: true, data: data || [], message: `${data?.length || 0} colaboradores carregados!` }
  } catch (error) {
    console.error('Erro ao carregar colaboradores:', error)
    return { success: false, message: 'Erro interno ao carregar' }
  }
}

// Função para verificar conexão com Supabase
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, message: 'Supabase não configurado' }
  }

  try {
    const { data, error } = await supabase
      .from('employees')
      .select('count', { count: 'exact', head: true })

    if (error) {
      console.error('Erro ao testar conexão:', error)
      return { success: false, message: `Erro de conexão: ${error.message}` }
    }

    return { success: true, message: 'Conexão com Supabase funcionando!' }
  } catch (error) {
    console.error('Erro ao testar conexão:', error)
    return { success: false, message: 'Erro interno de conexão' }
  }
}
