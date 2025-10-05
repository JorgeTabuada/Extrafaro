"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, CalendarDays, Users, DollarSign, Clock, Settings, Home, FileText, BarChart3, Cloud, CloudOff, RefreshCw, Download, Loader2 } from "lucide-react"
import EmployeesPage from "@/components/EmployeesPage"
import PaymentsPage from "@/components/PaymentsPage"
import { syncScheduleToSupabase, loadScheduleFromSupabase, testSupabaseConnection } from "@/lib/supabase-sync"
import { toast } from "sonner"
import Image from "next/image"

// Tipos e constantes
type Employee = {
  id: string
  name: string
  type: string
  order: number
}

type ExtendedEmployee = {
  id: string
  name: string
  type: string
  state: string
  city: string
  phone?: string
  email?: string
  notes?: string
  weekAvailability: Record<string, boolean>
  hourAvailability: Record<string, any>
  customHourlyRate?: number
  photoUrl?: string
  citizenCardNumber?: string
  citizenCardFileUrl?: string
  drivingLicenseNumber?: string
  drivingLicenseExpiry?: string
  drivingLicenseFileUrl?: string
  contractFileUrl?: string
}

type CityData = {
  employees: Employee[]
  schedule: Record<string, boolean[]>
  totalHalfHours: number
}

const EMPLOYEE_TYPES = {
  novice: { name: "Novato / Primeira vez", label: "Novato / Primeira vez", color: "bg-yellow-500", rate: 4.5 },
  no_pickup: { name: "Não faz recolhas/entregas", label: "Não faz recolhas/entregas", color: "bg-orange-500", rate: 5.0 },
  pickup: { name: "Faz recolhas", label: "Faz recolhas", color: "bg-green-500", rate: 5.5 },
  pickup_delivery: { name: "Faz recolhas e entregas", label: "Faz recolhas e entregas", color: "bg-blue-500", rate: 6.0 },
  terminal: { name: "Faz terminal", label: "Faz terminal", color: "bg-purple-500", rate: 6.5 },
  team_leader: { name: "Team Leader", label: "Team Leader", color: "bg-black", rate: 7.0 },
  second: { name: "Segundo", label: "Segundo", color: "bg-gray-600", rate: 5.5 },
} as const

const CITIES = {
  lisboa: {
    name: "Lisboa",
    rates: {
      novice: 4.5,
      no_pickup: 5.0,
      pickup: 5.5,
      pickup_delivery: 6.0,
      terminal: 6.5,
      team_leader: 7.0,
      second: 5.5,
    }
  },
  porto: {
    name: "Porto",
    rates: {
      novice: 4.5,
      no_pickup: 5.0,
      pickup: 5.5,
      pickup_delivery: 6.0,
      terminal: 6.5,
      team_leader: 7.0,
      second: 5.5,
    }
  },
  faro: {
    name: "Faro",
    rates: {
      novice: 4.5,
      no_pickup: 5.0,
      pickup: 5.5,
      pickup_delivery: 6.0,
      terminal: 6.5,
      team_leader: 7.0,
      second: 5.5,
    }
  },
} as const

const DEFAULT_HALF_HOURS = 48
const MAX_EMPLOYEES = 25

export default function ExtendedScheduleManager() {
  // Estados principais
  const [currentTab, setCurrentTab] = useState<"schedule" | "employees" | "payments">("schedule")
  const [currentCity, setCurrentCity] = useState<keyof typeof CITIES>("lisboa")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [employees, setEmployees] = useState<Employee[]>([])
  const [globalEmployees, setGlobalEmployees] = useState<ExtendedEmployee[]>([])
  const [schedule, setSchedule] = useState<Record<string, boolean[]>>({})
  const [totalHalfHours, setTotalHalfHours] = useState(DEFAULT_HALF_HOURS)
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragValue, setDragValue] = useState<boolean | null>(null)

  // Refs para controle
  const previousCityRef = useRef<keyof typeof CITIES>("lisboa")
  const previousDateRef = useRef<Date>(new Date())

  // Funções utilitárias
  const getCityDateKey = (city: string, date: Date) => {
    return `${city}-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  }

  const getDayOfWeek = (date: Date) => {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    return days[date.getDay()]
  }

  // Função para salvar dados
  const saveCityData = useCallback((city: string, date: Date, empList: Employee[], sched: Record<string, boolean[]>, totalHours: number) => {
    try {
      setIsSaving(true)
      const cityDateKey = getCityDateKey(city, date)
      const cityData: CityData = {
        employees: empList,
        schedule: sched,
        totalHalfHours: totalHours,
      }
      localStorage.setItem(`city-data-${cityDateKey}`, JSON.stringify(cityData))

      // Feedback visual sutil
      setTimeout(() => setIsSaving(false), 500)
    } catch (error) {
      console.error("Erro ao salvar dados:", error)
      toast.error("Erro ao salvar dados localmente")
      setIsSaving(false)
    }
  }, [])

  // Função para carregar dados
  const loadCityData = useCallback((city: string, date: Date) => {
    try {
      const cityDateKey = getCityDateKey(city, date)
      const savedData = localStorage.getItem(`city-data-${cityDateKey}`)
      
      if (savedData) {
        const cityData: CityData = JSON.parse(savedData)
        return {
          employees: cityData.employees || [],
          schedule: cityData.schedule || {},
          totalHalfHours: cityData.totalHalfHours || DEFAULT_HALF_HOURS,
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    }

    return {
      employees: [],
      schedule: {},
      totalHalfHours: DEFAULT_HALF_HOURS,
    }
  }, [])

  // Inicialização
  useEffect(() => {
    const initialCity = (localStorage.getItem("current-city") as keyof typeof CITIES) || "lisboa"
    const initialDateStr = localStorage.getItem("current-date")
    const initialDate = initialDateStr ? new Date(initialDateStr) : new Date()

    setCurrentCity(initialCity)
    setSelectedDate(initialDate)

    const initialData = loadCityData(initialCity, initialDate)
    setEmployees(initialData.employees)
    setSchedule(initialData.schedule)
    setTotalHalfHours(initialData.totalHalfHours)

    previousCityRef.current = initialCity
    previousDateRef.current = initialDate
    setIsInitialized(true)
  }, [loadCityData])

  // Carregar colaboradores globais
  useEffect(() => {
    const loadGlobalEmployees = () => {
      const savedEmployees = localStorage.getItem(`city-employees-${currentCity}`)
      if (savedEmployees) {
        try {
          setGlobalEmployees(JSON.parse(savedEmployees))
        } catch (error) {
          console.error("Erro ao carregar colaboradores globais:", error)
        }
      }
    }

    loadGlobalEmployees()
    const interval = setInterval(loadGlobalEmployees, 1000)
    return () => clearInterval(interval)
  }, [currentCity])

  // Função para adicionar colaborador à escala
  const addEmployeeToSchedule = (globalEmployeeId: string) => {
    const globalEmployee = globalEmployees.find((emp) => emp.id === globalEmployeeId)
    if (!globalEmployee) return
    if (employees.length >= MAX_EMPLOYEES) return

    const newEmployee: Employee = {
      id: globalEmployee.id,
      name: globalEmployee.name,
      type: globalEmployee.type,
      order: employees.length,
    }

    const newEmployees = [...employees, newEmployee]
    const newSchedule = {
      ...schedule,
      [newEmployee.id]: new Array(totalHalfHours).fill(false),
    }

    setEmployees(newEmployees)
    setSchedule(newSchedule)
    setIsAddEmployeeOpen(false)

    // Salvar imediatamente
    setTimeout(() => {
      saveCityData(currentCity, selectedDate, newEmployees, newSchedule, totalHalfHours)
    }, 100)
  }

  // Função para obter colaboradores disponíveis
  const getAvailableEmployeesForDay = () => {
    const dayOfWeek = getDayOfWeek(selectedDate)
    return globalEmployees.filter((emp) => {
      // Verificar se está ativo ou "só se necessário"
      if (emp.state !== "active" && emp.state !== "if_needed") return false
      // Verificar se já está na escala
      if (employees.some((scheduleEmp) => scheduleEmp.id === emp.id)) return false
      // Verificar disponibilidade semanal
      return emp.weekAvailability && emp.weekAvailability[dayOfWeek] === true
    })
  }

  // Função para alternar célula do horário
  const toggleScheduleCell = (employeeId: string, slot: number) => {
    setSchedule((prev) => {
      const newSchedule = { ...prev }
      if (!newSchedule[employeeId]) {
        newSchedule[employeeId] = new Array(totalHalfHours).fill(false)
      }
      newSchedule[employeeId][slot] = !newSchedule[employeeId][slot]
      return newSchedule
    })
  }

  // Funções para drag & drop
  const handleMouseDown = (employeeId: string, slot: number) => {
    setIsDragging(true)
    const currentValue = schedule[employeeId]?.[slot] || false
    setDragValue(!currentValue)
    toggleScheduleCell(employeeId, slot)
  }

  const handleMouseEnter = (employeeId: string, slot: number) => {
    if (isDragging && dragValue !== null) {
      setSchedule((prev) => {
        const newSchedule = { ...prev }
        if (!newSchedule[employeeId]) {
          newSchedule[employeeId] = new Array(totalHalfHours).fill(false)
        }
        newSchedule[employeeId][slot] = dragValue
        return newSchedule
      })
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
      setDragValue(null)
      // Salvar quando terminar de arrastar
      saveCityData(currentCity, selectedDate, employees, schedule, totalHalfHours)
    }
  }

  // Event listener global para mouseup
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp)
      return () => window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, schedule])

  // Calcular totais
  const calculateTotals = () => {
    let totalHours = 0
    let totalCost = 0

    employees.forEach((emp) => {
      const empSchedule = schedule[emp.id] || []
      const empHours = empSchedule.filter(Boolean).length * 0.5
      const empRate = EMPLOYEE_TYPES[emp.type as keyof typeof EMPLOYEE_TYPES]?.rate || 4.5
      
      totalHours += empHours
      totalCost += empHours * empRate
    })

    return { totalHours, totalCost }
  }

  const { totalHours, totalCost } = calculateTotals()

  // Funções de exportação
  const exportToPNG = async () => {
    setIsExporting(true)
    toast.loading('Gerando imagem PNG...', { id: 'export-png' })

    try {
      const html2canvas = (await import('html2canvas')).default
      const element = document.querySelector('.schedule-table') as HTMLElement
      if (!element) {
        toast.error('Tabela de horários não encontrada', { id: 'export-png' })
        return
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true
      })

      const link = document.createElement('a')
      link.download = `escala-${currentCity}-${selectedDate.toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()

      toast.success('Imagem PNG exportada com sucesso!', { id: 'export-png' })
    } catch (error) {
      console.error('Erro ao exportar PNG:', error)
      toast.error('Erro ao exportar para PNG', { id: 'export-png' })
    } finally {
      setIsExporting(false)
    }
  }

  const exportToJPEG = async () => {
    setIsExporting(true)
    toast.loading('Gerando imagem JPEG...', { id: 'export-jpeg' })

    try {
      const html2canvas = (await import('html2canvas')).default
      const element = document.querySelector('.schedule-table') as HTMLElement
      if (!element) {
        toast.error('Tabela de horários não encontrada', { id: 'export-jpeg' })
        return
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true
      })

      const link = document.createElement('a')
      link.download = `escala-${currentCity}-${selectedDate.toISOString().split('T')[0]}.jpg`
      link.href = canvas.toDataURL('image/jpeg', 0.9)
      link.click()

      toast.success('Imagem JPEG exportada com sucesso!', { id: 'export-jpeg' })
    } catch (error) {
      console.error('Erro ao exportar JPEG:', error)
      toast.error('Erro ao exportar para JPEG', { id: 'export-jpeg' })
    } finally {
      setIsExporting(false)
    }
  }

  const exportToExcel = async () => {
    setIsExporting(true)
    toast.loading('Gerando arquivo Excel...', { id: 'export-excel' })

    try {
      // Importação dinâmica do xlsx
      const XLSX = await import('xlsx').then(mod => mod.default || mod)

      // Preparar dados para Excel
      const data: any[] = []

      // Cabeçalho com horários
      const timeHeaders = ['Colaborador', 'Tipo']
      for (let i = 0; i < totalHalfHours; i++) {
        const hour = Math.floor((i + 6) / 2) % 24
        const minute = (i % 2) * 30
        const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
        timeHeaders.push(timeStr)
      }
      data.push(timeHeaders)

      // Dados dos colaboradores
      employees.forEach((emp) => {
        const empSchedule = schedule[emp.id] || new Array(totalHalfHours).fill(false)
        const empType = EMPLOYEE_TYPES[emp.type as keyof typeof EMPLOYEE_TYPES]
        const row: any[] = [emp.name, empType?.name || emp.type]

        empSchedule.forEach((isSelected) => {
          row.push(isSelected ? 'X' : '')
        })

        data.push(row)
      })

      // Adicionar linha de resumo
      data.push([])
      data.push(['Resumo'])
      data.push(['Total de Horas:', totalHours.toFixed(1)])
      data.push(['Total de Colaboradores:', employees.length])
      data.push(['Custo Estimado:', `€${totalCost.toFixed(2)}`])

      // Verificar se XLSX foi carregado corretamente
      if (!XLSX || !XLSX.utils) {
        throw new Error('Biblioteca XLSX não carregou corretamente')
      }

      const ws = XLSX.utils.aoa_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Escala')

      XLSX.writeFile(wb, `escala-${currentCity}-${selectedDate.toISOString().split('T')[0]}.xlsx`)

      toast.success('Arquivo Excel exportado com sucesso!', { id: 'export-excel' })
    } catch (error) {
      console.error('Erro ao exportar Excel:', error)
      toast.error(`Erro ao exportar Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, { id: 'export-excel' })
    } finally {
      setIsExporting(false)
    }
  }

  // Funções de reset
  const resetSchedule = () => {
    if (confirm('Tem certeza que deseja limpar todos os horários? Esta ação não pode ser desfeita.')) {
      const newSchedule: Record<string, boolean[]> = {}
      employees.forEach((emp) => {
        newSchedule[emp.id] = new Array(totalHalfHours).fill(false)
      })
      setSchedule(newSchedule)
      
      // Salvar imediatamente
      setTimeout(() => {
        saveCityData(currentCity, selectedDate, employees, newSchedule, totalHalfHours)
      }, 100)
    }
  }

  const resetEmployees = () => {
    if (confirm('Tem certeza que deseja remover todos os colaboradores da escala? Esta ação não pode ser desfeita.')) {
      setEmployees([])
      setSchedule({})
      
      // Salvar imediatamente
      setTimeout(() => {
        saveCityData(currentCity, selectedDate, [], {}, totalHalfHours)
      }, 100)
    }
  }

  // Funções de sincronização Supabase
  const checkSupabaseConnection = async () => {
    const result = await testSupabaseConnection()
    setIsSupabaseConnected(result.success)
    return result
  }

  const syncToSupabase = async () => {
    setIsSyncing(true)
    toast.loading('Sincronizando com Supabase...', { id: 'sync-supabase' })

    try {
      const result = await syncScheduleToSupabase(
        currentCity,
        selectedDate,
        employees,
        schedule,
        totalHalfHours,
        CITIES,
        EMPLOYEE_TYPES
      )

      if (result.success) {
        toast.success(result.message, { id: 'sync-supabase' })
      } else {
        toast.error(result.message, { id: 'sync-supabase' })
      }
    } catch (error) {
      toast.error("Erro ao sincronizar com Supabase", { id: 'sync-supabase' })
    } finally {
      setIsSyncing(false)
    }
  }

  const loadFromSupabase = async () => {
    setIsSyncing(true)
    toast.loading('Carregando do Supabase...', { id: 'load-supabase' })

    try {
      const result = await loadScheduleFromSupabase(currentCity, selectedDate)

      if (result.success && result.data) {
        setEmployees(result.data.employees || [])
        setSchedule(result.data.schedule || {})
        setTotalHalfHours(DEFAULT_HALF_HOURS)

        // Salvar também no localStorage
        setTimeout(() => {
          saveCityData(
            currentCity,
            selectedDate,
            result.data!.employees || [],
            result.data!.schedule || {},
            DEFAULT_HALF_HOURS
          )
        }, 100)

        toast.success(result.message, { id: 'load-supabase' })
      } else {
        toast.error(result.message, { id: 'load-supabase' })
      }
    } catch (error) {
      toast.error("Erro ao carregar do Supabase", { id: 'load-supabase' })
    } finally {
      setIsSyncing(false)
    }
  }

  // Verificar conexão Supabase na inicialização
  useEffect(() => {
    checkSupabaseConnection()
  }, [])

  // Renderizar horários
  const renderTimeSlots = () => {
    const slots = []
    for (let i = 0; i < totalHalfHours; i++) {
      const hour = Math.floor((i + 6) / 2) % 24
      const minute = (i % 2) * 30
      const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      const isHourStart = minute === 0

      slots.push(
        <div
          key={i}
          className={`text-xs p-2 border-r ${
            isHourStart
              ? 'bg-blue-100 border-blue-300 font-bold text-blue-900'
              : 'bg-blue-50 border-gray-200 font-medium text-gray-700'
          } sticky top-0 z-10 text-center`}
        >
          {timeStr}
        </div>
      )
    }
    return slots
  }

  // Renderizar colaboradores na tabela
  const renderEmployeeRows = () => {
    return employees.map((emp) => {
      const empSchedule = schedule[emp.id] || new Array(totalHalfHours).fill(false)
      const empType = EMPLOYEE_TYPES[emp.type as keyof typeof EMPLOYEE_TYPES]
      
      return (
        <div key={emp.id} className="contents">
          {/* Nome do colaborador */}
          <div className="p-3 border-r border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 font-medium text-sm sticky left-0 z-5">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${empType?.color}`}></div>
              <div>
                <div className="font-semibold text-gray-900">{emp.name}</div>
                <div className="text-xs text-gray-500">{empType?.name}</div>
              </div>
            </div>
          </div>
          
          {/* Células de horário */}
          {empSchedule.map((isSelected, slotIndex) => {
            const hour = Math.floor((slotIndex + 6) / 2) % 24
            const minute = (slotIndex % 2) * 30
            const isHourStart = minute === 0

            return (
              <div
                key={slotIndex}
                className={`p-1 border-r ${isHourStart ? 'border-r-2 border-gray-300' : 'border-gray-200'} border-b border-gray-100 cursor-pointer select-none transition-all duration-150 ${
                  isSelected
                    ? empType?.color + " text-white shadow-inner"
                    : "bg-white hover:bg-blue-50 hover:shadow-sm"
                } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={() => handleMouseDown(emp.id, slotIndex)}
                onMouseEnter={() => handleMouseEnter(emp.id, slotIndex)}
                onMouseUp={handleMouseUp}
              >
                <div className="w-full h-7 flex items-center justify-center text-sm font-bold">
                  {isSelected ? "✓" : ""}
                </div>
              </div>
            )
          })}
        </div>
      )
    })
  }

  if (currentTab === "employees") {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg border-r border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Multipark</h1>
              <p className="text-xs text-gray-500 text-center">Gestão de Escalas</p>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            <button
              onClick={() => setCurrentTab("schedule")}
              className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Gestão de Escalas</div>
                <div className="text-sm text-gray-500">Planeamento de horários</div>
              </div>
            </button>

            <button
              onClick={() => setCurrentTab("employees")}
              className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg bg-blue-50 border-l-4 border-blue-600"
            >
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">Colaboradores</div>
                <div className="text-sm text-blue-600">Gestão de recursos humanos</div>
              </div>
            </button>

            <button
              onClick={() => setCurrentTab("payments")}
              className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 transition-colors"
            >
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-gray-900">Pagamentos</div>
                <div className="text-sm text-gray-500">Cálculos e relatórios</div>
              </div>
            </button>
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <div className="text-sm font-medium text-gray-700">{CITIES[currentCity].name}</div>
              <div className="text-xs text-gray-500">Cidade atual</div>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 overflow-auto">
          <EmployeesPage
            EMPLOYEE_TYPES={EMPLOYEE_TYPES}
            CITIES={CITIES}
            currentCity={currentCity}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>
      </div>
    )
  }

  if (currentTab === "payments") {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg border-r border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Multipark</h1>
              <p className="text-xs text-gray-500 text-center">Gestão de Escalas</p>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            <button
              onClick={() => setCurrentTab("schedule")}
              className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Gestão de Escalas</div>
                <div className="text-sm text-gray-500">Planeamento de horários</div>
              </div>
            </button>

            <button
              onClick={() => setCurrentTab("employees")}
              className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Colaboradores</div>
                <div className="text-sm text-gray-500">Gestão de recursos humanos</div>
              </div>
            </button>

            <button
              onClick={() => setCurrentTab("payments")}
              className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg bg-green-50 border-l-4 border-green-600"
            >
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-green-900">Pagamentos</div>
                <div className="text-sm text-green-600">Cálculos e relatórios</div>
              </div>
            </button>
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <div className="text-sm font-medium text-gray-700">{CITIES[currentCity].name}</div>
              <div className="text-xs text-gray-500">Cidade atual</div>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 overflow-auto">
          <PaymentsPage
            employees={employees}
            schedule={schedule}
            totalHours={totalHours}
            EMPLOYEE_TYPES={EMPLOYEE_TYPES}
            getTotalHours={(employeeId: string) => {
              const empSchedule = schedule[employeeId] || []
              return empSchedule.filter(Boolean).length * 0.5
            }}
            currentCity={currentCity}
            selectedDate={selectedDate}
            CITIES={CITIES}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Multipark</h1>
            <p className="text-xs text-gray-500 text-center">Gestão de Escalas</p>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => setCurrentTab("schedule")}
            className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg bg-blue-50 border-l-4 border-blue-600"
          >
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-medium text-blue-900">Gestão de Escalas</div>
              <div className="text-sm text-blue-600">Planeamento de horários</div>
            </div>
          </button>

          <button
            onClick={() => setCurrentTab("employees")}
            className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-medium text-gray-900">Colaboradores</div>
              <div className="text-sm text-gray-500">Gestão de recursos humanos</div>
            </div>
          </button>

          <button
            onClick={() => setCurrentTab("payments")}
            className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 transition-colors"
          >
            <DollarSign className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-medium text-gray-900">Pagamentos</div>
              <div className="text-sm text-gray-500">Cálculos e relatórios</div>
            </div>
          </button>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-3 bg-gray-100 rounded-lg">
            <div className="text-sm font-medium text-gray-700">{CITIES[currentCity].name}</div>
            <div className="text-xs text-gray-500">Cidade atual</div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Logo centralizado */}
          <div className="flex justify-center mb-6">
            <Image
              src="/multipark-logo.png"
              alt="Multipark Logo"
              width={250}
              height={80}
              className="object-contain"
              priority
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão Avançada de Escalas de Turnos</h1>
                <p className="text-gray-600">Sistema completo com intervalos de 30 minutos (24 horas - expansível)</p>
              </div>
              {isSaving && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>A guardar...</span>
                </div>
              )}
            </div>
          </div>

          {/* Controles */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Label>Configurações:</Label>
              <Select value={currentCity} onValueChange={(value: keyof typeof CITIES) => setCurrentCity(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CITIES).map(([key, city]) => (
                    <SelectItem key={key} value={key}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Calendar className="w-5 h-5 text-blue-600" />
              <Label className="font-medium text-blue-900">Data:</Label>
              <Input
                type="date"
                value={selectedDate.toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="w-56 h-10 text-base font-medium border-blue-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-blue-700 font-medium">
                {selectedDate.toLocaleDateString("pt-PT", { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </span>
            </div>
          </div>

          {/* Informações da cidade */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              {currentCity} - {selectedDate.toLocaleDateString("pt-PT")} - {employees.length} colaboradores
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Adicionar Colaborador ({employees.length}/{MAX_EMPLOYEES})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Colaborador à Escala</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>Selecione um colaborador disponível para adicionar à escala de turnos</p>
                  
                  {getAvailableEmployeesForDay().length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum colaborador disponível</h3>
                      <p className="text-gray-500 mb-4">
                        Não há colaboradores disponíveis para {getDayOfWeek(selectedDate)} ({selectedDate.toLocaleDateString("pt-PT")})
                      </p>
                      <p className="text-sm text-gray-400">
                        Verifique a aba "Colaboradores" e configure a disponibilidade semanal
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getAvailableEmployeesForDay().map((emp) => (
                        <div
                          key={emp.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => addEmployeeToSchedule(emp.id)}
                        >
                          <div>
                            <div className="font-medium">{emp.name}</div>
                            <div className="text-sm text-gray-500">
                              {EMPLOYEE_TYPES[emp.type as keyof typeof EMPLOYEE_TYPES]?.name}
                            </div>
                          </div>
                          <Button size="sm">Adicionar</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Botões de Sincronização Supabase */}
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
              {isSupabaseConnected ? (
                <Cloud className="w-4 h-4 text-blue-600" />
              ) : (
                <CloudOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-xs text-gray-600">
                {isSupabaseConnected ? "Conectado" : "Desconectado"}
              </span>
            </div>
            
            <Button 
              variant="outline" 
              onClick={syncToSupabase}
              disabled={isSyncing || !isSupabaseConnected}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Cloud className="w-4 h-4 mr-2" />}
              Sincronizar
            </Button>
            
            <Button 
              variant="outline" 
              onClick={loadFromSupabase}
              disabled={isSyncing || !isSupabaseConnected}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Carregar
            </Button>

            <Button variant="outline" onClick={exportToPNG} disabled={isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              PNG
            </Button>
            <Button variant="outline" onClick={exportToJPEG} disabled={isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              JPEG
            </Button>
            <Button variant="outline" onClick={exportToExcel} disabled={isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Excel
            </Button>
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={resetSchedule}>
              Reset (24h)
            </Button>
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={resetEmployees}>
              Reset Colaboradores
            </Button>
            <div className="ml-auto text-sm text-gray-600">
              24h ({totalHalfHours} blocos)
            </div>
          </div>


          {/* Categorias */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Categorias de Colaboradores
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(EMPLOYEE_TYPES).map(([key, type]) => (
                <div key={key} className="flex items-center gap-2 p-2 bg-white rounded border">
                  <div className={`w-4 h-4 rounded ${type.color}`}></div>
                  <span className="text-sm">{type.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Instruções */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <strong>Horário:</strong> Intervalos de 30 minutos das 03:00 às 02:59 (24 horas). 
              <strong> Como usar:</strong> Clique e arraste para marcar. Cada 2 blocos = 1 hora.
            </p>
          </div>

          {/* Tabela de horários */}
          <div className="bg-white rounded-lg border shadow-lg overflow-hidden schedule-table">
            <div className="overflow-x-auto max-w-full" style={{ maxHeight: '600px' }}>
              <div className="grid grid-cols-[minmax(200px,220px)_repeat(48,minmax(28px,1fr))] min-w-max" style={{ minWidth: '1600px' }}>
                {/* Cabeçalho */}
                <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 border-r border-blue-800 font-semibold text-white sticky top-0 z-10">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <div>
                      Horário
                      <div className="text-xs text-blue-100">24h (30min)</div>
                    </div>
                  </div>
                </div>
                {renderTimeSlots()}

                {/* Linhas dos colaboradores */}
                {employees.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum colaborador adicionado à escala</p>
                    <p className="text-sm">Clique em "Adicionar Colaborador" para começar</p>
                  </div>
                ) : (
                  renderEmployeeRows()
                )}
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div className="mt-6 p-4 bg-white rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Resumo Detalhado de Horas (24h total)
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}h</div>
                <div className="text-sm text-gray-500">Total Geral</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{employees.length}</div>
                <div className="text-sm text-gray-500">Colaboradores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">24h</div>
                <div className="text-sm text-gray-500">Período</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
