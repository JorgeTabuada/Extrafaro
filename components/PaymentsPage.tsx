"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Euro, TrendingUp, Users, Calculator, MapPin, Calendar, Cloud, CloudOff, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { testSupabaseConnection } from "@/lib/supabase-sync"

interface Employee {
  id: string
  name: string
  type: string
  order: number
}

interface Schedule {
  [employeeId: string]: boolean[]
}

interface CityData {
  employees: Employee[]
  schedule: Schedule
  totalHalfHours: number
  date: string
}

interface PaymentsPageProps {
  employees: Employee[]
  schedule: Schedule
  totalHours: number
  EMPLOYEE_TYPES: any
  getTotalHours: (employeeId: string) => number
  currentCity: string
  selectedDate: Date
  CITIES: any
}

export default function PaymentsPage({
  employees,
  schedule,
  totalHours,
  EMPLOYEE_TYPES,
  getTotalHours,
  currentCity,
  selectedDate,
  CITIES,
}: PaymentsPageProps) {
  const [allCitiesData, setAllCitiesData] = useState<{ [key: string]: CityData }>({})
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false)

  useEffect(() => {
    const loadAllCitiesData = () => {
      const citiesData: { [key: string]: CityData } = {}

      Object.keys(CITIES).forEach((cityKey) => {
        const cityDateKey = `${cityKey}-${format(selectedDate, "yyyy-MM-dd")}`
        const savedData = localStorage.getItem(`city-data-${cityDateKey}`)

        if (savedData) {
          try {
            citiesData[cityKey] = JSON.parse(savedData)
          } catch (error) {
            console.error(`Erro ao carregar dados da cidade ${cityKey}:`, error)
            // Dados padrão em caso de erro
            citiesData[cityKey] = {
              employees: [],
              schedule: {},
              totalHalfHours: 48,
              date: format(selectedDate, "yyyy-MM-dd")
            }
          }
        } else {
          // Dados padrão se não houver dados salvos
          citiesData[cityKey] = {
            employees: [],
            schedule: {},
            totalHalfHours: 48,
            date: format(selectedDate, "yyyy-MM-dd")
          }
        }
      })

      // Incluir dados da cidade atual se não estiver já incluída
      if (currentCity && !citiesData[currentCity]) {
        citiesData[currentCity] = {
          employees: employees,
          schedule: schedule,
          totalHalfHours: 48,
          date: format(selectedDate, "yyyy-MM-dd")
        }
      } else if (currentCity && citiesData[currentCity]) {
        // Atualizar com dados atuais se a cidade atual tem dados mais recentes
        citiesData[currentCity] = {
          employees: employees,
          schedule: schedule,
          totalHalfHours: 48,
          date: format(selectedDate, "yyyy-MM-dd")
        }
      }

      setAllCitiesData(citiesData)
    }

    loadAllCitiesData()
  }, [selectedDate, CITIES, currentCity, employees, schedule])

  // Verificar conexão Supabase na inicialização
  useEffect(() => {
    const checkConnection = async () => {
      const result = await testSupabaseConnection()
      setIsSupabaseConnected(result.success)
    }
    checkConnection()
  }, [])

  const currentCityRates = CITIES[currentCity].rates

  const calculatePayment = (employeeId: string, employeeType: string, cityKey: string) => {
    const cityData = allCitiesData[cityKey]
    if (!cityData || !cityData.schedule) {
      console.log(`Sem dados para cidade ${cityKey}`)
      return 0
    }

    const employeeSchedule = cityData.schedule[employeeId] || []
    if (!Array.isArray(employeeSchedule)) {
      console.log(`Schedule inválido para colaborador ${employeeId} na cidade ${cityKey}`)
      return 0
    }

    const halfHoursWorked = employeeSchedule.filter(Boolean).length
    const hoursWorked = halfHoursWorked / 2 // Converte meias horas em horas
    
    const cityRates = CITIES[cityKey]?.rates
    if (!cityRates || !cityRates[employeeType]) {
      console.log(`Taxa não encontrada para tipo ${employeeType} na cidade ${cityKey}`)
      return 0
    }
    
    const rate = cityRates[employeeType]

    // Calcular pagamento com horas completas e meias horas
    const fullHours = Math.floor(hoursWorked)
    const hasHalfHour = hoursWorked % 1 !== 0

    let payment = fullHours * rate
    if (hasHalfHour) {
      payment += rate / 2 // Adiciona meia hora
    }

    console.log(`Pagamento calculado: ${employeeId} (${employeeType}) em ${cityKey}: ${hoursWorked}h × €${rate} = €${payment}`)
    return payment
  }

  const getTotalAllCitiesPayments = () => {
    let total = 0

    Object.keys(allCitiesData).forEach((cityKey) => {
      const cityData = allCitiesData[cityKey]
      cityData.employees.forEach((emp) => {
        total += calculatePayment(emp.id, emp.type, cityKey)
      })
    })

    return total
  }

  const getTotalPayments = () => {
    return employees.reduce((total, emp) => {
      const hours = getTotalHours(emp.id)
      const rate = currentCityRates[emp.type]

      // Calcular pagamento com horas completas e meias horas
      const fullHours = Math.floor(hours)
      const hasHalfHour = hours % 1 !== 0

      let payment = fullHours * rate
      if (hasHalfHour) {
        payment += rate / 2
      }

      return total + payment
    }, 0)
  }

  const getCategoryStats = () => {
    const stats: { [key: string]: { count: number; totalHours: number; totalPayment: number } } = {}

    employees.forEach((emp) => {
      const category = emp.type
      if (!stats[category]) {
        stats[category] = { count: 0, totalHours: 0, totalPayment: 0 }
      }
      stats[category].count++
      const hours = getTotalHours(emp.id)
      const rate = currentCityRates[emp.type]
      stats[category].totalHours += hours

      // Calcular pagamento com horas completas e meias horas
      const fullHours = Math.floor(hours)
      const hasHalfHour = hours % 1 !== 0

      let payment = fullHours * rate
      if (hasHalfHour) {
        payment += rate / 2
      }

      stats[category].totalPayment += payment
    })

    return stats
  }

  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-16">
          <Euro className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum colaborador para calcular</h3>
          <p className="text-gray-600">
            Adicione colaboradores na aba "Gestão de Escalas" para ver os cálculos de pagamento
          </p>
        </CardContent>
      </Card>
    )
  }

  const categoryStats = getCategoryStats()

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cálculo de Pagamentos</h2>
            <p className="text-gray-600">Relatório detalhado de pagamentos por colaborador (incluindo meias horas)</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{CITIES[currentCity].name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: pt })}</span>
              </div>
            </div>
          </div>
          
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
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="w-5 h-5" />
            Resumo Geral - Todas as Cidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(allCitiesData).map(([cityKey, cityData]) => {
              if (cityData.employees.length === 0) return null

              const cityTotal = cityData.employees.reduce((total, emp) => {
                return total + calculatePayment(emp.id, emp.type, cityKey)
              }, 0)

              return (
                <div key={cityKey} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="text-lg font-bold text-gray-900">{CITIES[cityKey].name}</div>
                  <div className="text-2xl font-bold text-green-600">€{cityTotal.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">{cityData.employees.length} colaboradores</div>
                </div>
              )
            })}
            <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="text-lg font-bold text-blue-900">Total Geral</div>
              <div className="text-3xl font-bold text-blue-600">€{getTotalAllCitiesPayments().toFixed(2)}</div>
              <div className="text-sm text-blue-600">Todas as cidades</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Euro className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total a Pagar ({CITIES[currentCity].name})</p>
                <p className="text-2xl font-bold text-green-600">€{getTotalPayments().toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Colaboradores</p>
                <p className="text-2xl font-bold text-blue-600">{employees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Horas</p>
                <p className="text-2xl font-bold text-purple-600">
                  {employees.reduce((total, emp) => total + getTotalHours(emp.id), 0).toFixed(1)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calculator className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Média/Hora</p>
                <p className="text-2xl font-bold text-orange-600">
                  €
                  {(
                    getTotalPayments() / employees.reduce((total, emp) => total + getTotalHours(emp.id), 0) || 0
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="w-5 h-5" />
            Tabela de Salários por Categoria - {CITIES[currentCity].name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(EMPLOYEE_TYPES).map(([key, type]) => (
              <div key={key} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${type.color}`}></div>
                  <span className="font-medium">{type.label}</span>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="font-bold">
                    €{currentCityRates[key as keyof typeof currentCityRates].toFixed(2)}/h
                  </Badge>
                  <div className="text-xs text-gray-600 mt-1">
                    €{(currentCityRates[key as keyof typeof currentCityRates] / 2).toFixed(2)}/30min
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estatísticas por Categoria - {CITIES[currentCity].name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categoryStats).map(([category, stats]) => {
              const employeeType = EMPLOYEE_TYPES[category]
              return (
                <div
                  key={category}
                  className={`p-4 rounded-lg border-l-4 ${employeeType.borderColor} ${employeeType.headerBg}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${employeeType.color}`}></div>
                      <span className="font-bold text-sm">{employeeType.label}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Pessoas</p>
                        <p className="font-bold">{stats.count}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Horas</p>
                        <p className="font-bold">{stats.totalHours.toFixed(1)}h</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total</p>
                        <p className="font-bold text-green-600">€{stats.totalPayment.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento Individual - {CITIES[currentCity].name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employees.map((employee) => {
              const hours = getTotalHours(employee.id)
              const rate = currentCityRates[employee.type]
              const employeeType = EMPLOYEE_TYPES[employee.type]

              // Calcular pagamento com horas completas e meias horas
              const fullHours = Math.floor(hours)
              const hasHalfHour = hours % 1 !== 0

              let payment = fullHours * rate
              if (hasHalfHour) {
                payment += rate / 2
              }

              return (
                <div key={employee.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded ${employeeType.color}`}></div>
                    <div>
                      <p className="font-bold">{employee.name}</p>
                      <p className="text-sm text-gray-600">{employeeType.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-gray-600">Horas</p>
                      <p className="font-bold">{hours.toFixed(1)}h</p>
                      {hasHalfHour && <p className="text-xs text-orange-600">+30min</p>}
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Valor/Hora</p>
                      <p className="font-bold">€{rate.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Total</p>
                      <p className="font-bold text-green-600 text-lg">€{payment.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Separator className="my-6" />

          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-lg text-gray-600">Total da Cidade ({CITIES[currentCity].name})</p>
              <p className="text-3xl font-bold text-green-600">€{getTotalPayments().toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo Detalhado - Todas as Cidades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(allCitiesData).map(([cityKey, cityData]) => {
              if (cityData.employees.length === 0) return null

              const cityTotal = cityData.employees.reduce((total, emp) => {
                return total + calculatePayment(emp.id, emp.type, cityKey)
              }, 0)

              return (
                <div key={cityKey} className="border rounded-lg p-4">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {CITIES[cityKey].name}
                  </h3>
                  <div className="space-y-2">
                    {cityData.employees.map((employee) => {
                      const employeeSchedule = cityData.schedule[employee.id] || []
                      const halfHoursWorked = employeeSchedule.filter(Boolean).length
                      const hours = halfHoursWorked / 2
                      const rate = CITIES[cityKey].rates[employee.type]
                      const employeeType = EMPLOYEE_TYPES[employee.type]

                      // Calcular pagamento com horas completas e meias horas
                      const fullHours = Math.floor(hours)
                      const hasHalfHour = hours % 1 !== 0

                      let payment = fullHours * rate
                      if (hasHalfHour) {
                        payment += rate / 2
                      }

                      return (
                        <div key={employee.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded ${employeeType.color}`}></div>
                            <span className="font-medium">{employee.name}</span>
                            <span className="text-sm text-gray-600">({employeeType.label})</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span>
                              {hours.toFixed(1)}h {hasHalfHour && <span className="text-orange-600">+30min</span>}
                            </span>
                            <span>€{rate.toFixed(2)}/h</span>
                            <span className="font-bold text-green-600">€{payment.toFixed(2)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-end">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Subtotal {CITIES[cityKey].name}</p>
                      <p className="text-xl font-bold text-green-600">€{cityTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Separator className="my-6" />

          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-xl text-gray-600">Total Geral de Todas as Cidades</p>
              <p className="text-4xl font-bold text-green-600">€{getTotalAllCitiesPayments().toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
