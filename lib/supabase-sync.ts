import { supabase, isSupabaseConfigured } from './supabase'

export interface ScheduleData {
  id?: string
  city: string
  schedule_date: string
  employee_id: string
  employee_name: string
  employee_type: string
  employee_order: number
  time_slots: boolean[]
  total_hours: number
  hourly_rate: number
  total_cost: number
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
  totalHalfHours: number,
  CITIES: any,
  EMPLOYEE_TYPES: any
): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, message: 'Supabase não configurado' }
  }

  try {
    const dateStr = date.toISOString().split('T')[0]
    
    // Criar registros individuais para cada colaborador
    const scheduleRecords: ScheduleData[] = []
    
    employees.forEach((employee, index) => {
      const employeeSchedule = schedule[employee.id] || []
      const totalHours = employeeSchedule.filter(Boolean).length / 2
      const hourlyRate = CITIES[city]?.rates?.[employee.type] || 0
      const totalCost = totalHours * hourlyRate

      scheduleRecords.push({
        id: `${city}-${dateStr}-${employee.id}`,
        city,
        schedule_date: dateStr,
        employee_id: employee.id,
        employee_name: employee.name,
        employee_type: employee.type,
        employee_order: employee.order || index,
        time_slots: employeeSchedule,
        total_hours: totalHours,
        hourly_rate: hourlyRate,
        total_cost: totalCost,
        updated_at: new Date().toISOString()
      })
    })

    if (scheduleRecords.length === 0) {
      return { success: true, message: 'Nenhuma escala para sincronizar' }
    }

    const { data, error } = await supabase
      .from('schedules')
      .upsert(scheduleRecords, { onConflict: 'id' })

    if (error) {
      console.error('Erro ao sincronizar escala:', error)
      return { success: false, message: `Erro: ${error.message}` }
    }

    return { success: true, message: `${scheduleRecords.length} escalas sincronizadas com sucesso!` }
  } catch (error) {
    console.error('Erro ao sincronizar escala:', error)
    return { success: false, message: 'Erro interno ao sincronizar' }
  }
}

// Função para carregar dados de escala do Supabase
export const loadScheduleFromSupabase = async (
  city: string,
  date: Date
): Promise<{ success: boolean; data?: { employees: any[], schedule: Record<string, boolean[]> }; message: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, message: 'Supabase não configurado' }
  }

  try {
    const dateStr = date.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('city', city)
      .eq('schedule_date', dateStr)

    if (error) {
      console.error('Erro ao carregar escala:', error)
      return { success: false, message: `Erro: ${error.message}` }
    }

    if (!data || data.length === 0) {
      return { success: false, message: 'Nenhuma escala encontrada para esta data' }
    }

    // Converter dados do Supabase para formato da aplicação
    const employees: any[] = []
    const schedule: Record<string, boolean[]> = {}

    data.forEach((record: any) => {
      employees.push({
        id: record.employee_id,
        name: record.employee_name,
        type: record.employee_type,
        order: record.employee_order
      })
      schedule[record.employee_id] = record.time_slots || []
    })

    return { success: true, data: { employees, schedule }, message: `${data.length} escalas carregadas com sucesso!` }
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
