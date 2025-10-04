import React, { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  Plus, 
  Users, 
  Upload, 
  FileText, 
  Camera, 
  Calendar as CalendarIcon,
  Edit3,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"

interface Employee {
  id: string
  name: string
  type: string
  state: string
  city: string
  phone?: string
  email?: string
  notes?: string
  weekAvailability: Record<string, boolean>
  hourAvailability: Record<string, string[]>
  customHourlyRate?: number
  photo?: string
  drivingLicense?: {
    file: string
    expiryDate: Date
    number: string
  }
  contract?: {
    file: string
    signedDate: Date
    type: string
  }
  documents?: Array<{
    id: string
    name: string
    file: string
    uploadDate: Date
    type: string
  }>
}

interface EnhancedEmployeesPageProps {
  employees: Employee[]
  setEmployees: (employees: Employee[]) => void
  EMPLOYEE_TYPES: any
  EMPLOYEE_STATES: any
  currentCity: string
  selectedDate: Date
  CITIES: any
}

export default function EnhancedEmployeesPage({
  employees,
  setEmployees,
  EMPLOYEE_TYPES,
  EMPLOYEE_STATES,
  currentCity,
  selectedDate,
  CITIES
}: EnhancedEmployeesPageProps) {
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterState, setFilterState] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: "",
    type: "novice",
    state: "active",
    city: currentCity,
    phone: "",
    email: "",
    notes: "",
    weekAvailability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    },
    hourAvailability: {}
  })

  const photoInputRef = useRef<HTMLInputElement>(null)
  const licenseInputRef = useRef<HTMLInputElement>(null)
  const contractInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setNewEmployee(prev => ({
          ...prev,
          photo: e.target?.result as string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLicenseUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setNewEmployee(prev => ({
          ...prev,
          drivingLicense: {
            ...prev.drivingLicense,
            file: e.target?.result as string
          }
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleContractUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setNewEmployee(prev => ({
          ...prev,
          contract: {
            ...prev.contract,
            file: e.target?.result as string,
            signedDate: new Date()
          }
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const addEmployee = () => {
    if (!newEmployee.name?.trim()) return

    const employee: Employee = {
      id: Date.now().toString(),
      name: newEmployee.name,
      type: newEmployee.type || "novice",
      state: newEmployee.state || "active",
      city: newEmployee.city || currentCity,
      phone: newEmployee.phone || "",
      email: newEmployee.email || "",
      notes: newEmployee.notes || "",
      weekAvailability: newEmployee.weekAvailability || {},
      hourAvailability: newEmployee.hourAvailability || {},
      customHourlyRate: newEmployee.customHourlyRate,
      photo: newEmployee.photo,
      drivingLicense: newEmployee.drivingLicense,
      contract: newEmployee.contract,
      documents: []
    }

    setEmployees([...employees, employee])
    setNewEmployee({
      name: "",
      type: "novice",
      state: "active",
      city: currentCity,
      phone: "",
      email: "",
      notes: "",
      weekAvailability: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true
      },
      hourAvailability: {}
    })
    setIsAddEmployeeOpen(false)
  }

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesState = filterState === "all" || employee.state === filterState
    const matchesType = filterType === "all" || employee.type === filterType
    const matchesCity = employee.city === currentCity
    
    return matchesSearch && matchesState && matchesType && matchesCity
  })

  const getDocumentStatus = (employee: Employee) => {
    const hasPhoto = !!employee.photo
    const hasLicense = !!employee.drivingLicense?.file
    const hasContract = !!employee.contract?.file
    
    const licenseExpired = employee.drivingLicense?.expiryDate && 
      new Date(employee.drivingLicense.expiryDate) < new Date()
    
    if (hasPhoto && hasLicense && hasContract && !licenseExpired) {
      return { status: 'complete', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    } else if (licenseExpired) {
      return { status: 'expired', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    } else {
      return { status: 'incomplete', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{filteredEmployees.length}</p>
                <p className="text-xs text-gray-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {filteredEmployees.filter(emp => emp.state === 'active').length}
                </p>
                <p className="text-xs text-gray-600">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredEmployees.filter(emp => emp.state === 'if_needed').length}
                </p>
                <p className="text-xs text-gray-600">Só se necessário</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {filteredEmployees.filter(emp => {
                    const docStatus = getDocumentStatus(emp)
                    return docStatus.status === 'expired' || docStatus.status === 'incomplete'
                  }).length}
                </p>
                <p className="text-xs text-gray-600">Documentos pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles e filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 items-center">
              <Input
                placeholder="Pesquisar colaboradores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {Object.entries(EMPLOYEE_STATES).map(([key, state]: [string, any]) => (
                    <SelectItem key={key} value={key}>{state.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {Object.entries(EMPLOYEE_TYPES).map(([key, type]: [string, any]) => (
                    <SelectItem key={key} value={key}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Colaborador
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Colaborador - {CITIES[currentCity].name}</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Foto do colaborador */}
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      {newEmployee.photo ? (
                        <img src={newEmployee.photo} alt="Foto" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => photoInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Adicionar Foto
                    </Button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Informações básicas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome *</Label>
                      <Input
                        value={newEmployee.name || ""}
                        onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nome completo"
                      />
                    </div>
                    
                    <div>
                      <Label>Telefone</Label>
                      <Input
                        value={newEmployee.phone || ""}
                        onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Número de telefone"
                      />
                    </div>

                    <div>
                      <Label>Email</Label>
                      <Input
                        value={newEmployee.email || ""}
                        onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Endereço de email"
                      />
                    </div>

                    <div>
                      <Label>Categoria</Label>
                      <Select value={newEmployee.type} onValueChange={(value) => setNewEmployee(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(EMPLOYEE_TYPES).map(([key, type]: [string, any]) => (
                            <SelectItem key={key} value={key}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Estado</Label>
                      <Select value={newEmployee.state} onValueChange={(value) => setNewEmployee(prev => ({ ...prev, state: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(EMPLOYEE_STATES).map(([key, state]: [string, any]) => (
                            <SelectItem key={key} value={key}>{state.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Valor Personalizado (€/hora)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newEmployee.customHourlyRate || ""}
                        onChange={(e) => setNewEmployee(prev => ({ ...prev, customHourlyRate: parseFloat(e.target.value) || undefined }))}
                        placeholder="Defeito: €4.50"
                      />
                    </div>
                  </div>

                  {/* Upload de documentos */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Documentos</h3>
                    
                    {/* Carta de condução */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Carta de Condução
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => licenseInputRef.current?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                      
                      {newEmployee.drivingLicense?.file && (
                        <div className="text-sm text-green-600 mb-2">✓ Documento carregado</div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Número da Carta</Label>
                          <Input
                            size="sm"
                            value={newEmployee.drivingLicense?.number || ""}
                            onChange={(e) => setNewEmployee(prev => ({
                              ...prev,
                              drivingLicense: { ...prev.drivingLicense, number: e.target.value }
                            }))}
                            placeholder="Número"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Data de Validade</Label>
                          <Input
                            type="date"
                            size="sm"
                            value={newEmployee.drivingLicense?.expiryDate ? format(new Date(newEmployee.drivingLicense.expiryDate), 'yyyy-MM-dd') : ""}
                            onChange={(e) => setNewEmployee(prev => ({
                              ...prev,
                              drivingLicense: { ...prev.drivingLicense, expiryDate: new Date(e.target.value) }
                            }))}
                          />
                        </div>
                      </div>
                      
                      <input
                        ref={licenseInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleLicenseUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Contrato */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Contrato de Trabalho
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => contractInputRef.current?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                      
                      {newEmployee.contract?.file && (
                        <div className="text-sm text-green-600">✓ Contrato carregado</div>
                      )}
                      
                      <input
                        ref={contractInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleContractUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Notas */}
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={newEmployee.notes || ""}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Informações adicionais sobre o colaborador..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddEmployeeOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={addEmployee} disabled={!newEmployee.name?.trim()}>
                      Adicionar Colaborador
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Lista de colaboradores em grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredEmployees.map((employee) => {
          const employeeType = EMPLOYEE_TYPES[employee.type]
          const employeeState = EMPLOYEE_STATES[employee.state]
          const docStatus = getDocumentStatus(employee)
          const StatusIcon = docStatus.icon

          return (
            <Card key={employee.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    {employee.photo ? (
                      <img src={employee.photo} alt={employee.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <h3 className="font-semibold text-lg truncate" title={employee.name}>
                    {employee.name}
                  </h3>
                  <div className="flex justify-center gap-1 mt-2">
                    <Badge className={employeeType.color + " " + employeeType.textColor} variant="secondary">
                      {employeeType.label}
                    </Badge>
                  </div>
                  <Badge className={employeeState.color} variant="secondary">
                    {employeeState.label}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  {employee.phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">📞</span>
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  
                  {employee.email && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">✉️</span>
                      <span className="truncate">{employee.email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <StatusIcon className="w-4 h-4" />
                    <Badge className={docStatus.color} variant="secondary">
                      {docStatus.status === 'complete' && 'Documentos OK'}
                      {docStatus.status === 'expired' && 'Documentos expirados'}
                      {docStatus.status === 'incomplete' && 'Documentos pendentes'}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit3 className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <Card>
          <CardContent className="text-center py-16">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum colaborador encontrado</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? "Tente ajustar os filtros de pesquisa" : "Comece adicionando colaboradores"}
            </p>
            <Button onClick={() => setIsAddEmployeeOpen(true)} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Colaborador
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
