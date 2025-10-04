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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Users, Plus, Edit3, Trash2, User, AlertCircle, Search, Save, X, MapPin, Calendar, Euro } from "lucide-react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const EMPLOYEE_STATES = {
  active: {
    label: "Ativo",
    color: "bg-green-100 text-green-800",
    description: "Disponível para trabalhar normalmente",
  },
  if_needed: {
    label: "Só se necessário",
    color: "bg-yellow-100 text-yellow-800",
    description: "Chamar apenas em caso de necessidade",
  },
  do_not_call: {
    label: "Não chamar mais",
    color: "bg-red-100 text-red-800",
    description: "Não deve ser chamado para trabalhar",
  },
  prefer_not_call: {
    label: "Preferível não chamar",
    color: "bg-orange-100 text-orange-800",
    description: "Evitar chamar, mas pode ser contactado se necessário",
  },
  inactive: {
    label: "Inativo",
    color: "bg-gray-100 text-gray-800",
    description: "Temporariamente inativo",
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

export default function EmployeesPage({
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
  const [filterState, setFilterState] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [selectedDayForHours, setSelectedDayForHours] = useState<string>("monday")

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
    const matchesState = filterState === "all" || employee.state === filterState
    const matchesType = filterType === "all" || employee.type === filterType
    return matchesSearch && matchesState && matchesType
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

  return (
    <div className="space-y-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="md:col-span-2">
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
                  Documentos e Fotografia
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="photo">Fotografia do Colaborador</Label>
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
                      <p className="text-sm text-green-600 mt-1">✓ Fotografia carregada</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="citizenCardNumber">Número do Cartão de Cidadão</Label>
                    <Input
                      id="citizenCardNumber"
                      value={formData.citizenCardNumber || ""}
                      onChange={(e) => setFormData({ ...formData, citizenCardNumber: e.target.value })}
                      placeholder="00000000 0 ZZ0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="citizenCardFile">Upload do Cartão de Cidadão</Label>
                    <Input
                      id="citizenCardFile"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            setFormData({ 
                              ...formData, 
                              citizenCardFile: event.target?.result as string 
                            })
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                    {formData.citizenCardFile && (
                      <p className="text-sm text-green-600 mt-1">✓ Documento carregado</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="drivingLicenseNumber">Número da Carta de Condução</Label>
                    <Input
                      id="drivingLicenseNumber"
                      value={formData.drivingLicenseNumber || ""}
                      onChange={(e) => setFormData({ ...formData, drivingLicenseNumber: e.target.value })}
                      placeholder="Número da carta de condução"
                    />
                  </div>
                  <div>
                    <Label htmlFor="drivingLicenseExpiry">Validade da Carta de Condução</Label>
                    <Input
                      id="drivingLicenseExpiry"
                      type="date"
                      value={formData.drivingLicenseExpiry || ""}
                      onChange={(e) => setFormData({ ...formData, drivingLicenseExpiry: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="drivingLicenseFile">Upload da Carta de Condução</Label>
                    <Input
                      id="drivingLicenseFile"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            setFormData({ 
                              ...formData, 
                              drivingLicenseFile: event.target?.result as string 
                            })
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                    {formData.drivingLicenseFile && (
                      <p className="text-sm text-green-600 mt-1">✓ Documento carregado</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="contractFile">Upload do Contrato de Trabalho</Label>
                    <Input
                      id="contractFile"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            setFormData({ 
                              ...formData, 
                              contractFile: event.target?.result as string 
                            })
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                    {formData.contractFile && (
                      <p className="text-sm text-green-600 mt-1">✓ Contrato carregado</p>
                    )}
                  </div>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <h3 className="text-lg font-semibold">Disponibilidade de Horário por Dia</h3>
                <p className="text-sm text-gray-600">
                  Configure o horário de disponibilidade para cada dia da semana individualmente
                </p>

                <Tabs value={selectedDayForHours} onValueChange={setSelectedDayForHours}>
                  <TabsList className="grid grid-cols-7 w-full">
                    {WEEKDAYS.map((day) => (
                      <TabsTrigger key={day.key} value={day.key} className="text-xs">
                        {day.short}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {WEEKDAYS.map((day) => (
                    <TabsContent key={day.key} value={day.key} className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{day.label}</h4>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`${day.key}-flexible`}
                              checked={formData.hourAvailability?.[day.key]?.flexible || false}
                              onCheckedChange={(checked) => updateHourAvailability(day.key, "flexible", checked)}
                            />
                            <Label htmlFor={`${day.key}-flexible`} className="text-sm">
                              Disponibilidade total (24h)
                            </Label>
                          </div>
                        </div>

                        {!formData.hourAvailability?.[day.key]?.flexible && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`${day.key}-start`}>Hora de Início</Label>
                              <Select
                                value={formData.hourAvailability?.[day.key]?.startHour?.toString() || "3"}
                                onValueChange={(value) =>
                                  updateHourAvailability(day.key, "startHour", Number.parseInt(value))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {hourOptions.map((hour) => (
                                    <SelectItem key={hour.value} value={hour.value.toString()}>
                                      {hour.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor={`${day.key}-end`}>Hora de Fim</Label>
                              <Select
                                value={formData.hourAvailability?.[day.key]?.endHour?.toString() || "2"}
                                onValueChange={(value) =>
                                  updateHourAvailability(day.key, "endHour", Number.parseInt(value))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {hourOptions.map((hour) => (
                                    <SelectItem key={hour.value} value={hour.value.toString()}>
                                      {hour.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
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

      <div className="flex flex-wrap gap-4 items-center p-4 bg-white rounded-lg border">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-600" />
          <Label className="text-sm font-medium">Data:</Label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-64 justify-start text-left font-normal bg-transparent">
                {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: pt })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    handleDateChange(date)
                    setIsCalendarOpen(false)
                  }
                }}
                locale={pt}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Pesquisar colaboradores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {Object.entries(EMPLOYEE_STATES).map(([key, state]) => (
                    <SelectItem key={key} value={key}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {Object.entries(EMPLOYEE_TYPES).map(([key, type]) => (
                    <SelectItem key={key} value={key}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">{employees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {employees.filter((emp) => emp.state === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Só se necessário</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {employees.filter((emp) => emp.state === "if_needed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <X className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Inativos</p>
                <p className="text-2xl font-bold text-red-600">
                  {employees.filter((emp) => emp.state === "inactive").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Colaboradores de {CITIES[currentCity].name} ({filteredEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {employees.length === 0 ? "Nenhum colaborador cadastrado" : "Nenhum colaborador encontrado"}
              </h3>
              <p className="text-gray-600 mb-6">
                {employees.length === 0
                  ? `Comece adicionando colaboradores para ${CITIES[currentCity].name}`
                  : "Tente ajustar os filtros de pesquisa"}
              </p>
              {employees.length === 0 && (
                <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Primeiro Colaborador
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEmployees.map((employee) => {
                const employeeType = EMPLOYEE_TYPES[employee.type]
                const employeeState = EMPLOYEE_STATES[employee.state]
                const hourlyRate = getEmployeeHourlyRate(employee)

                return (
                  <div key={employee.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-bold">{employee.name}</h3>
                          <Badge className={employeeState.color}>{employeeState.label}</Badge>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${employeeType.color}`}></div>
                            <span className="text-sm text-gray-600">{employeeType.label}</span>
                          </div>
                          <Badge variant="secondary" className="bg-green-50 text-green-800">
                            €{hourlyRate.toFixed(2)}/h
                            {employee.customHourlyRate && " (personalizado)"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 mb-1">Contacto</p>
                            {employee.phone && <p>📞 {employee.phone}</p>}
                            {employee.email && <p>✉️ {employee.email}</p>}
                            {!employee.phone && !employee.email && <p className="text-gray-400">Sem contacto</p>}
                          </div>

                          <div>
                            <p className="text-gray-600 mb-1">Disponibilidade Semanal</p>
                            <div className="flex flex-wrap gap-1">
                              {WEEKDAYS.map((day) => (
                                <span
                                  key={day.key}
                                  className={`px-2 py-1 rounded text-xs ${
                                    employee.weekAvailability[day.key]
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-500"
                                  }`}
                                >
                                  {day.short}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-gray-600 mb-1">Horários por Dia</p>
                            <div className="text-xs space-y-1">
                              {WEEKDAYS.filter((day) => employee.weekAvailability[day.key]).map((day) => {
                                const dayAvailability = employee.hourAvailability?.[day.key]
                                if (!dayAvailability) return null
                                return (
                                  <div key={day.key} className="flex justify-between">
                                    <span className="font-medium">{day.short}:</span>
                                    <span className={dayAvailability.flexible ? "text-green-600" : ""}>
                                      {dayAvailability.flexible
                                        ? "24h"
                                        : `${(dayAvailability.startHour || 0).toString().padStart(2, "0")}:00-${(dayAvailability.endHour || 0).toString().padStart(2, "0")}:00`}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        {employee.notes && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                            <p className="text-gray-600 mb-1">Observações:</p>
                            <p>{employee.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(employee)}
                          className="bg-transparent"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja remover ${employee.name}?`)) {
                              removeEmployee(employee.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {editingEmployee && (
        <Dialog open={!!editingEmployee} onOpenChange={() => cancelEdit()}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Colaborador - {CITIES[currentCity].name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações Básicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="md:col-span-2">
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
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Documentos e Fotografia
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="photo">Fotografia do Colaborador</Label>
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
                      <p className="text-sm text-green-600 mt-1">✓ Fotografia carregada</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="citizenCardNumber">Número do Cartão de Cidadão</Label>
                    <Input
                      id="citizenCardNumber"
                      value={formData.citizenCardNumber || ""}
                      onChange={(e) => setFormData({ ...formData, citizenCardNumber: e.target.value })}
                      placeholder="00000000 0 ZZ0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="citizenCardFile">Upload do Cartão de Cidadão</Label>
                    <Input
                      id="citizenCardFile"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            setFormData({ 
                              ...formData, 
                              citizenCardFile: event.target?.result as string 
                            })
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                    {formData.citizenCardFile && (
                      <p className="text-sm text-green-600 mt-1">✓ Documento carregado</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="drivingLicenseNumber">Número da Carta de Condução</Label>
                    <Input
                      id="drivingLicenseNumber"
                      value={formData.drivingLicenseNumber || ""}
                      onChange={(e) => setFormData({ ...formData, drivingLicenseNumber: e.target.value })}
                      placeholder="Número da carta de condução"
                    />
                  </div>
                  <div>
                    <Label htmlFor="drivingLicenseExpiry">Validade da Carta de Condução</Label>
                    <Input
                      id="drivingLicenseExpiry"
                      type="date"
                      value={formData.drivingLicenseExpiry || ""}
                      onChange={(e) => setFormData({ ...formData, drivingLicenseExpiry: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="drivingLicenseFile">Upload da Carta de Condução</Label>
                    <Input
                      id="drivingLicenseFile"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            setFormData({ 
                              ...formData, 
                              drivingLicenseFile: event.target?.result as string 
                            })
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                    {formData.drivingLicenseFile && (
                      <p className="text-sm text-green-600 mt-1">✓ Documento carregado</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="contractFile">Upload do Contrato de Trabalho</Label>
                    <Input
                      id="contractFile"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            setFormData({ 
                              ...formData, 
                              contractFile: event.target?.result as string 
                            })
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                    {formData.contractFile && (
                      <p className="text-sm text-green-600 mt-1">✓ Contrato carregado</p>
                    )}
                  </div>
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
                    categoria.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor="edit-customRate">Valor Personalizado (€/hora)</Label>
                      <Input
                        id="edit-customRate"
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {WEEKDAYS.map((day) => (
                    <div key={day.key} className="flex items-center space-x-2">
                      <Switch
                        id={`edit-${day.key}`}
                        checked={formData.weekAvailability?.[day.key] || false}
                        onCheckedChange={(checked) => updateWeekAvailability(day.key, checked)}
                      />
                      <Label htmlFor={`edit-${day.key}`} className="text-sm">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Disponibilidade de Horário por Dia</h3>

                <Tabs value={selectedDayForHours} onValueChange={setSelectedDayForHours}>
                  <TabsList className="grid grid-cols-7 w-full">
                    {WEEKDAYS.map((day) => (
                      <TabsTrigger key={day.key} value={day.key} className="text-xs">
                        {day.short}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {WEEKDAYS.map((day) => (
                    <TabsContent key={day.key} value={day.key} className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{day.label}</h4>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`edit-${day.key}-flexible`}
                              checked={formData.hourAvailability?.[day.key]?.flexible || false}
                              onCheckedChange={(checked) => updateHourAvailability(day.key, "flexible", checked)}
                            />
                            <Label htmlFor={`edit-${day.key}-flexible`} className="text-sm">
                              Disponibilidade total (24h)
                            </Label>
                          </div>
                        </div>

                        {!formData.hourAvailability?.[day.key]?.flexible && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Hora de Início</Label>
                              <Select
                                value={formData.hourAvailability?.[day.key]?.startHour?.toString() || "3"}
                                onValueChange={(value) =>
                                  updateHourAvailability(day.key, "startHour", Number.parseInt(value))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {hourOptions.map((hour) => (
                                    <SelectItem key={hour.value} value={hour.value.toString()}>
                                      {hour.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Hora de Fim</Label>
                              <Select
                                value={formData.hourAvailability?.[day.key]?.endHour?.toString() || "2"}
                                onValueChange={(value) =>
                                  updateHourAvailability(day.key, "endHour", Number.parseInt(value))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {hourOptions.map((hour) => (
                                    <SelectItem key={hour.value} value={hour.value.toString()}>
                                      {hour.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
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
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
