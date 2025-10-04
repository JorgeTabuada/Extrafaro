"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Users, Plus, Edit3, Trash2, User, Search, MapPin, Calendar, Euro, Cloud, CloudOff, RefreshCw, Phone, Mail, FileText } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { syncEmployeesToSupabase, loadEmployeesFromSupabase, testSupabaseConnection } from "@/lib/supabase-sync"

const EMPLOYEE_STATES = {
  active: {
    label: "Ativo",
    color: "bg-green-100 text-green-800 border-green-200",
    description: "Disponível para trabalhar normalmente",
    kanbanColor: "bg-green-50 border-green-200"
  },
  if_needed: {
    label: "Só se necessário",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    description: "Chamar apenas em caso de necessidade",
    kanbanColor: "bg-yellow-50 border-yellow-200"
  },
  do_not_call: {
    label: "Não chamar mais",
    color: "bg-red-100 text-red-800 border-red-200",
    description: "Não deve ser chamado para trabalhar",
    kanbanColor: "bg-red-50 border-red-200"
  },
  prefer_not_call: {
    label: "Preferível não chamar",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    description: "Evitar chamar, mas pode ser contactado se necessário",
    kanbanColor: "bg-orange-50 border-orange-200"
  },
  inactive: {
    label: "Inativo",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    description: "Temporariamente inativo",
    kanbanColor: "bg-gray-50 border-gray-200"
  },
}

const WEEKDAYS = [
  { key: "monday", label: "Segunda", short: "Seg" },
  { key: "tuesday", label: "Terça", short: "Ter" },
  { key: "wednesday", label: "Quarta", short: "Qua" },
  { key: "thursday", label: "Quinta", short: "Qui" },
  { key: "friday", label: "Sexta", short: "Sex" },
  { key: "saturday", label: "Sábado", short: "Sáb" },
  { key: "sunday", label: "Domingo", short: "Dom" },
]

interface ExtendedEmployee {
  id: string
  name: string
  type: string
  state: keyof typeof EMPLOYEE_STATES
  city: string
  phone?: string
  email?: string
  notes?: string
  photo?: string
  citizenCardNumber?: string
  citizenCardFile?: string
  drivingLicenseNumber?: string
  drivingLicenseExpiry?: string
  drivingLicenseFile?: string
  contractFile?: string
  weekAvailability: {
    [key: string]: boolean
  }
  hourAvailability: {
    [key: string]: {
      startHour: number
      endHour: number
      flexible: boolean
    }
  }
  customHourlyRate?: number
  createdAt: string
  updatedAt: string
}

interface EmployeesPageProps {
  EMPLOYEE_TYPES: any
  CITIES: any
  currentCity: string
  selectedDate?: Date
  onDateChange?: (date: Date) => void
}

export default function EmployeesPageKanban({
  EMPLOYEE_TYPES,
  CITIES,
  currentCity,
  selectedDate: propSelectedDate,
  onDateChange: propOnDateChange,
}: EmployeesPageProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(propSelectedDate || new Date())
  const [employees, setEmployees] = useState<ExtendedEmployee[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<ExtendedEmployee | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [selectedDayForHours, setSelectedDayForHours] = useState<string>("monday")
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState("")
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false)

  useEffect(() => {
    if (propSelectedDate) {
      setSelectedDate(propSelectedDate)
    }
  }, [propSelectedDate])

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
    if (propOnDateChange) {
      propOnDateChange(date)
    }
  }

  const [formData, setFormData] = useState<Partial<ExtendedEmployee>>({
    name: "",
    type: "novice",
    state: "active",
    city: currentCity,
    phone: "",
    email: "",
    notes: "",
    customHourlyRate: undefined,
    photo: "",
    citizenCardNumber: "",
    citizenCardFile: "",
    drivingLicenseNumber: "",
    drivingLicenseExpiry: "",
    drivingLicenseFile: "",
    contractFile: "",
    weekAvailability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
    },
    hourAvailability: {
      monday: { startHour: 3, endHour: 2, flexible: true },
      tuesday: { startHour: 3, endHour: 2, flexible: true },
      wednesday: { startHour: 3, endHour: 2, flexible: true },
      thursday: { startHour: 3, endHour: 2, flexible: true },
      friday: { startHour: 3, endHour: 2, flexible: true },
      saturday: { startHour: 3, endHour: 2, flexible: true },
      sunday: { startHour: 3, endHour: 2, flexible: true },
    },
  })

  useEffect(() => {
    loadEmployeesFromLocalStorage()
  }, [currentCity])

  const loadEmployeesFromLocalStorage = () => {
    const savedEmployees = localStorage.getItem(`city-employees-${currentCity}`)
    if (savedEmployees) {
      try {
        setEmployees(JSON.parse(savedEmployees))
      } catch (error) {
        console.error("Erro ao carregar colaboradores:", error)
      }
    } else {
      setEmployees([])
    }
  }

  useEffect(() => {
    setFormData((prev) => ({ ...prev, city: currentCity }))
  }, [currentCity])

  const saveEmployees = (employeesList: ExtendedEmployee[]) => {
    localStorage.setItem(`city-employees-${currentCity}`, JSON.stringify(employeesList))
    setEmployees(employeesList)

    const allEmployees: { [city: string]: ExtendedEmployee[] } = {}

    Object.keys(CITIES).forEach((cityKey) => {
      const cityEmployees = localStorage.getItem(`city-employees-${cityKey}`)
      if (cityEmployees) {
        try {
          allEmployees[cityKey] = JSON.parse(cityEmployees)
        } catch (error) {
          allEmployees[cityKey] = []
        }
      } else {
        allEmployees[cityKey] = []
      }
    })

    allEmployees[currentCity] = employeesList
    const globalEmployees = Object.values(allEmployees).flat()
    localStorage.setItem("global-employees", JSON.stringify(globalEmployees))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      type: "novice",
      state: "active",
      city: currentCity,
      phone: "",
      email: "",
      notes: "",
      customHourlyRate: undefined,
      weekAvailability: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true,
      },
      hourAvailability: {
        monday: { startHour: 3, endHour: 2, flexible: true },
        tuesday: { startHour: 3, endHour: 2, flexible: true },
        wednesday: { startHour: 3, endHour: 2, flexible: true },
        thursday: { startHour: 3, endHour: 2, flexible: true },
        friday: { startHour: 3, endHour: 2, flexible: true },
        saturday: { startHour: 3, endHour: 2, flexible: true },
        sunday: { startHour: 3, endHour: 2, flexible: true },
      },
    })
    setSelectedDayForHours("monday")
  }

  const addEmployee = () => {
    if (!formData.name?.trim()) return

    const newEmployee: ExtendedEmployee = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      type: formData.type || "novice",
      state: formData.state || "active",
      city: currentCity,
      phone: formData.phone || "",
      email: formData.email || "",
      notes: formData.notes || "",
      photo: formData.photo || "",
      citizenCardNumber: formData.citizenCardNumber || "",
      citizenCardFile: formData.citizenCardFile || "",
      drivingLicenseNumber: formData.drivingLicenseNumber || "",
      drivingLicenseExpiry: formData.drivingLicenseExpiry || "",
      drivingLicenseFile: formData.drivingLicenseFile || "",
      contractFile: formData.contractFile || "",
      weekAvailability: formData.weekAvailability || {},
      hourAvailability: formData.hourAvailability || {},
      customHourlyRate: formData.customHourlyRate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updatedEmployees = [...employees, newEmployee]
    saveEmployees(updatedEmployees)

    resetForm()
    setIsAddDialogOpen(false)
  }

  const startEdit = (employee: ExtendedEmployee) => {
    setEditingEmployee(employee)
    setFormData({ ...employee })
  }

  const saveEdit = () => {
    if (!editingEmployee || !formData.name?.trim()) return

    const updatedEmployee = {
      ...editingEmployee,
      ...formData,
      name: formData.name!.trim(),
      city: currentCity,
      updatedAt: new Date().toISOString(),
    }

    const updatedEmployees = employees.map((emp) => (emp.id === editingEmployee.id ? updatedEmployee : emp))
    saveEmployees(updatedEmployees)

    setEditingEmployee(null)
    resetForm()
  }

  const cancelEdit = () => {
    setEditingEmployee(null)
    resetForm()
  }

  const removeEmployee = (employeeId: string) => {
    const updatedEmployees = employees.filter((emp) => emp.id !== employeeId)
    saveEmployees(updatedEmployees)
  }

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || employee.type === filterType
    return matchesSearch && matchesType
  })

  const updateWeekAvailability = (day: string, available: boolean) => {
    setFormData((prev) => ({
      ...prev,
      weekAvailability: {
        ...prev.weekAvailability,
        [day]: available,
      },
    }))
  }

  const updateHourAvailability = (day: string, field: string, value: number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      hourAvailability: {
        ...prev.hourAvailability,
        [day]: {
          ...prev.hourAvailability?.[day],
          [field]: value,
        },
      },
    }))
  }

  const generateHourOptions = () => {
    const hours = []
    for (let i = 0; i < 24; i++) {
      hours.push({
        value: i,
        label: `${i.toString().padStart(2, "0")}:00`,
      })
    }
    return hours
  }

  const hourOptions = generateHourOptions()

  const getEmployeeHourlyRate = (employee: ExtendedEmployee) => {
    if (employee.customHourlyRate !== undefined && employee.customHourlyRate !== null) {
      return employee.customHourlyRate
    }
    return CITIES[currentCity].rates[employee.type]
  }

  // Funções de sincronização Supabase
  const checkSupabaseConnection = async () => {
    const result = await testSupabaseConnection()
    setIsSupabaseConnected(result.success)
    return result
  }

  const syncToSupabase = async () => {
    setIsSyncing(true)
    setSyncMessage("")
    
    try {
      const result = await syncEmployeesToSupabase(employees)
      setSyncMessage(result.message)
      
      if (result.success) {
        setTimeout(() => setSyncMessage(""), 3000)
      }
    } catch (error) {
      setSyncMessage("Erro ao sincronizar colaboradores")
    } finally {
      setIsSyncing(false)
    }
  }

  const loadFromSupabase = async () => {
    setIsSyncing(true)
    setSyncMessage("")
    
    try {
      const result = await loadEmployeesFromSupabase(currentCity)
      
      if (result.success && result.data) {
        setEmployees(result.data)
        
        // Salvar também no localStorage
        localStorage.setItem(`city-employees-${currentCity}`, JSON.stringify(result.data))
      }
      
      setSyncMessage(result.message)
      
      if (result.success) {
        setTimeout(() => setSyncMessage(""), 3000)
      }
    } catch (error) {
      setSyncMessage("Erro ao carregar colaboradores do Supabase")
    } finally {
      setIsSyncing(false)
    }
  }

  // Verificar conexão Supabase na inicialização
  useEffect(() => {
    checkSupabaseConnection()
  }, [])

  // Agrupar funcionários por estado para o layout Kanban
  const employeesByState = Object.keys(EMPLOYEE_STATES).reduce((acc, state) => {
    acc[state] = filteredEmployees.filter(emp => emp.state === state)
    return acc
  }, {} as Record<string, ExtendedEmployee[]>)

  // Componente do cartão de funcionário
  const EmployeeCard = ({ employee }: { employee: ExtendedEmployee }) => {
    const employeeType = EMPLOYEE_TYPES[employee.type]
    const employeeState = EMPLOYEE_STATES[employee.state]
    const hourlyRate = getEmployeeHourlyRate(employee)

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 mb-3">
        <div className="flex items-start gap-3">
          {/* Foto do funcionário */}
          <div className="flex-shrink-0">
            {employee.photo ? (
              <img 
                src={employee.photo} 
                alt={employee.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Informações do funcionário */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 truncate">{employee.name}</h3>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(employee)}
                  className="h-8 w-8 p-0 hover:bg-blue-50"
                >
                  <Edit3 className="w-4 h-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Tem certeza que deseja remover ${employee.name}?`)) {
                      removeEmployee(employee.id)
                    }
                  }}
                  className="h-8 w-8 p-0 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>

            {/* Categoria e valor por hora */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${employeeType.color}`}></div>
                <span className="text-xs text-gray-600">{employeeType.label}</span>
              </div>
              <Badge variant="secondary" className="bg-green-50 text-green-800 text-xs">
                €{hourlyRate.toFixed(2)}/h
              </Badge>
            </div>

            {/* Contactos */}
            <div className="space-y-1 mb-2">
              {employee.phone && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Phone className="w-3 h-3" />
                  <span>{employee.phone}</span>
                </div>
              )}
              {employee.email && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{employee.email}</span>
                </div>
              )}
            </div>

            {/* Disponibilidade semanal */}
            <div className="flex flex-wrap gap-1 mb-2">
              {WEEKDAYS.map((day) => (
                <span
                  key={day.key}
                  className={`px-1.5 py-0.5 rounded text-xs ${
                    employee.weekAvailability[day.key]
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {day.short}
                </span>
              ))}
            </div>

            {/* Notas */}
            {employee.notes && (
              <div className="flex items-start gap-1 text-xs text-gray-600">
                <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{employee.notes}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Colaboradores</h2>
          <div className="flex items-center gap-4 text-gray-600 mt-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Colaboradores de {CITIES[currentCity].name}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Status de conexão Supabase */}
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
          
          {/* Botões de sincronização */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={syncToSupabase}
            disabled={isSyncing || !isSupabaseConnected}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Cloud className="w-4 h-4 mr-2" />}
            Sincronizar
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadFromSupabase}
            disabled={isSyncing || !isSupabaseConnected}
            className="text-green-600 border-green-200 hover:bg-green-50"
          >
            {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Carregar
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Colaborador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Colaborador - {CITIES[currentCity].name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informações Básicas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nome completo"
                        maxLength={50}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Número de telefone"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Endereço de email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Categoria</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(EMPLOYEE_TYPES).map(([key, type]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded ${type.color}`}></div>
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="state">Estado</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value) =>
                          setFormData({ ...formData, state: value as keyof typeof EMPLOYEE_STATES })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(EMPLOYEE_STATES).map(([key, state]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <Badge className={state.color}>{state.label}</Badge>
                                <span className="text-sm text-gray-600">{state.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Fotografia do Colaborador
                  </h3>
                  <div>
                    <Label htmlFor="photo">Fotografia</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            setFormData({ 
                              ...formData, 
                              photo: event.target?.result as string 
                            })
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                    {formData.photo && (
                      <div className="mt-2 flex items-center gap-2">
                        <img 
                          src={formData.photo} 
                          alt="Preview" 
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                        />
                        <p className="text-sm text-green-600">✓ Fotografia carregada</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Euro className="w-5 h-5" />
                    Pagamento por Hora (Opcional)
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 mb-3">
                      Por defeito, o valor será{" "}
                      <strong>€{CITIES[currentCity].rates[formData.type || "novice"].toFixed(2)}/h</strong> conforme a
                      categoria selecionada. Se inserir um valor personalizado, este substituirá o valor da categoria.
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label htmlFor="customRate">Valor Personalizado (€/hora)</Label>
                        <Input
                          id="customRate"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.customHourlyRate || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customHourlyRate: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                            })
                          }
                          placeholder={`Defeito: €${CITIES[currentCity].rates[formData.type || "novice"].toFixed(2)}`}
                        />
                      </div>
                      {formData.customHourlyRate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, customHourlyRate: undefined })}
                          className="mt-6 bg-transparent"
                        >
                          Limpar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Disponibilidade Semanal</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {WEEKDAYS.map((day) => (
                      <div key={day.key} className="flex items-center space-x-2">
                        <Switch
                          id={day.key}
                          checked={formData.weekAvailability?.[day.key] || false}
                          onCheckedChange={(checked) => updateWeekAvailability(day.key, checked)}
                        />
                        <Label htmlFor={day.key} className="text-sm">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Observações</h3>
                  <div>
                    <Label htmlFor="notes">Notas adicionais</Label>
                    <textarea
                      id="notes"
                      value={formData.notes || ""}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Informações adicionais sobre o colaborador..."
                      className="w-full p-3 border border-gray-300 rounded-md resize-none h-20"
                      maxLength={500}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={addEmployee} disabled={!formData.name?.trim()}>
                    Adicionar Colaborador
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Mensagem de sincronização */}
      {syncMessage && (
        <div className={`p-3 rounded-lg text-sm ${
          syncMessage.includes("sucesso") || syncMessage.includes("carregados") 
            ? "bg-green-50 text-green-800 border border-green-200" 
            : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {syncMessage}
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filtros e Pesquisa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Pesquisar por nome</Label>
              <Input
                id="search"
                placeholder="Digite o nome do colaborador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-64">
              <Label htmlFor="filterType">Filtrar por categoria</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {Object.entries(EMPLOYEE_TYPES).map(([key, type]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${type.color}`}></div>
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout Kanban */}
      <div className="grid grid-cols-5 gap-4">
        {Object.entries(EMPLOYEE_STATES).map(([stateKey, stateInfo]) => {
          const stateEmployees = employeesByState[stateKey] || []
          
          return (
            <div key={stateKey} className={`rounded-lg border-2 ${stateInfo.kanbanColor} min-h-[600px]`}>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{stateInfo.label}</h3>
                  <Badge variant="secondary" className="bg-white">
                    {stateEmployees.length}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mt-1">{stateInfo.description}</p>
              </div>
              
              <div className="p-4">
                {stateEmployees.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Nenhum colaborador</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stateEmployees.map((employee) => (
                      <EmployeeCard key={employee.id} employee={employee} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Dialog de edição (simplificado) */}
      {editingEmployee && (
        <Dialog open={!!editingEmployee} onOpenChange={() => cancelEdit()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Colaborador - {editingEmployee.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações Básicas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Nome *</Label>
                    <Input
                      id="edit-name"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome completo"
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-phone">Telefone</Label>
                    <Input
                      id="edit-phone"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Número de telefone"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Endereço de email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-type">Categoria</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EMPLOYEE_TYPES).map(([key, type]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded ${type.color}`}></div>
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="edit-state">Estado</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) =>
                        setFormData({ ...formData, state: value as keyof typeof EMPLOYEE_STATES })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EMPLOYEE_STATES).map(([key, state]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Badge className={state.color}>{state.label}</Badge>
                              <span className="text-sm text-gray-600">{state.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Fotografia</h3>
                <div>
                  <Label htmlFor="edit-photo">Fotografia</Label>
                  <Input
                    id="edit-photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          setFormData({ 
                            ...formData, 
                            photo: event.target?.result as string 
                          })
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                  {formData.photo && (
                    <div className="mt-2 flex items-center gap-2">
                      <img 
                        src={formData.photo} 
                        alt="Preview" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                      <p className="text-sm text-green-600">✓ Fotografia carregada</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Observações</h3>
                <div>
                  <Label htmlFor="edit-notes">Notas adicionais</Label>
                  <textarea
                    id="edit-notes"
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Informações adicionais sobre o colaborador..."
                    className="w-full p-3 border border-gray-300 rounded-md resize-none h-20"
                    maxLength={500}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={cancelEdit}>
                  Cancelar
                </Button>
                <Button onClick={saveEdit} disabled={!formData.name?.trim()}>
                  Guardar Alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
