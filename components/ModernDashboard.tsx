"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Clock, 
  Euro, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  BarChart3
} from "lucide-react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"

interface ModernDashboardProps {
  employees: any[]
  schedule: any
  selectedDate: Date
  currentCity: string
  cities: any
  EMPLOYEE_TYPES: any
  getTotalHours: (employeeId: string) => number
  getTotalAllHours: () => number
}

const ModernDashboard: React.FC<ModernDashboardProps> = ({
  employees,
  schedule,
  selectedDate,
  currentCity,
  cities,
  EMPLOYEE_TYPES,
  getTotalHours,
  getTotalAllHours
}) => {
  // Calcular métricas
  const activeEmployees = employees.length
  const totalHours = getTotalAllHours()
  const estimatedCost = employees.reduce((total, emp) => {
    const hours = getTotalHours(emp.id)
    const rate = cities[currentCity]?.rates[emp.type] || 0
    return total + (hours * rate)
  }, 0)

  // Simular alertas (conflitos de horário, etc.)
  const alerts = Math.floor(Math.random() * 5)

  // Dados para gráfico de distribuição
  const typeDistribution = employees.reduce((acc, emp) => {
    const type = EMPLOYEE_TYPES[emp.type]?.label || emp.type
    const hours = getTotalHours(emp.id)
    acc[type] = (acc[type] || 0) + hours
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-6 space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Colaboradores Ativos */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Colaboradores Ativos</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{activeEmployees}</p>
                <p className="text-sm text-green-600 mt-1">
                  {activeEmployees > 0 ? "Escala ativa" : "Sem escalas"}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Horas Agendadas */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Horas Agendadas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalHours.toFixed(1)}</p>
                <p className="text-sm text-blue-600 mt-1">
                  {format(selectedDate, "dd 'de' MMM", { locale: pt })}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custo Estimado */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Custo Estimado</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">€{estimatedCost.toFixed(0)}</p>
                <p className="text-sm text-orange-600 mt-1">
                  {format(selectedDate, "dd 'de' MMM", { locale: pt })}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Euro className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{alerts}</p>
                <p className="text-sm text-red-600 mt-1">
                  {alerts > 0 ? "Requer atenção" : "Tudo OK"}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuição de Horas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Distribuição de Horas por Tipo</CardTitle>
              <Button variant="ghost" size="sm" className="text-blue-600">
                Ver detalhes
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 font-medium">Gráfico de Distribuição</p>
                <p className="text-sm text-gray-400 mt-1">
                  {Object.entries(typeDistribution).map(([type, hours]) => (
                    <span key={type} className="block">
                      {type}: {hours}h
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendário e Eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Mini Calendário */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {format(selectedDate, "dd", { locale: pt })}
                  </div>
                  <div className="text-sm text-gray-600">
                    {format(selectedDate, "MMMM yyyy", { locale: pt })}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {format(selectedDate, "EEEE", { locale: pt })}
                  </div>
                </div>
              </div>

              {/* Próximos Eventos */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Próximos Eventos</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Escala completa - Amanhã</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-600">Revisão semanal - 6 Out</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">Relatório mensal - 15 Out</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Colaboradores Ativos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Colaboradores Ativos Hoje</CardTitle>
            <Button variant="ghost" size="sm" className="text-blue-600">
              Ver todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Custo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.slice(0, 5).map((emp) => {
                  const hours = getTotalHours(emp.id)
                  const rate = cities[currentCity]?.rates[emp.type] || 0
                  const cost = hours * rate
                  const typeInfo = EMPLOYEE_TYPES[emp.type]
                  
                  return (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${typeInfo?.color} ${typeInfo?.textColor}`}>
                            {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeInfo?.color} ${typeInfo?.textColor}`}>
                          {typeInfo?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {hours.toFixed(1)}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Button variant="ghost" size="sm" className="text-blue-600">
                          Editar
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ModernDashboard
