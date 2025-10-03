"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Euro, FileSpreadsheet, TrendingUp, Users, Calculator } from "lucide-react"
import * as XLSX from "xlsx"

// Configuração de salários por categoria
const HOURLY_RATES = {
  novice: 4.5,
  no_delivery: 4.5,
  pickup: 4.5,
  pickup_delivery: 4.5,
  terminal: 5.0,
  team_leader: 6.0,
  segundo: 6.0,
}

interface Employee {
  id: string
  name: string
  type: keyof typeof HOURLY_RATES
  order: number
}

interface Schedule {
  [employeeId: string]: boolean[]
}

interface PaymentsPageProps {
  employees: Employee[]
  schedule: Schedule
  totalHours: number
  EMPLOYEE_TYPES: any
  getTotalHours: (employeeId: string) => number
}

export default function PaymentsPage({
  employees,
  schedule,
  totalHours,
  EMPLOYEE_TYPES,
  getTotalHours,
}: PaymentsPageProps) {
  // Calcular pagamento individual
  const calculatePayment = (employeeId: string, employeeType: keyof typeof HOURLY_RATES) => {
    const hours = getTotalHours(employeeId)
    const rate = HOURLY_RATES[employeeType]
    return hours * rate
  }

  // Calcular total geral de pagamentos
  const getTotalPayments = () => {
    return employees.reduce((total, emp) => {
      return total + calculatePayment(emp.id, emp.type)
    }, 0)
  }

  // Calcular estatísticas por categoria
  const getCategoryStats = () => {
    const stats: { [key: string]: { count: number; totalHours: number; totalPayment: number } } = {}

    employees.forEach((emp) => {
      const category = emp.type
      if (!stats[category]) {
        stats[category] = { count: 0, totalHours: 0, totalPayment: 0 }
      }
      stats[category].count++
      stats[category].totalHours += getTotalHours(emp.id)
      stats[category].totalPayment += calculatePayment(emp.id, emp.type)
    })

    return stats
  }

  // Exportar relatório de pagamentos para Excel
  const exportPaymentsToExcel = () => {
    try {
      const data = []

      // Cabeçalho
      data.push(["RELATÓRIO DE PAGAMENTOS"])
      data.push(["Data:", new Date().toLocaleDateString("pt-PT")])
      data.push(["Período:", `${totalHours} horas`])
      data.push([])

      // Tabela de salários por categoria
      data.push(["TABELA DE SALÁRIOS POR CATEGORIA"])
      data.push(["Categoria", "Valor por Hora"])
      Object.entries(EMPLOYEE_TYPES).forEach(([key, type]) => {
        data.push([type.label, `€${HOURLY_RATES[key as keyof typeof HOURLY_RATES].toFixed(2)}`])
      })
      data.push([])

      // Detalhamento individual
      data.push(["DETALHAMENTO INDIVIDUAL"])
      data.push(["Nome", "Categoria", "Horas Trabalhadas", "Valor/Hora", "Total a Receber"])

      employees.forEach((emp) => {
        const hours = getTotalHours(emp.id)
        const rate = HOURLY_RATES[emp.type]
        const payment = calculatePayment(emp.id, emp.type)

        data.push([
          emp.name,
          EMPLOYEE_TYPES[emp.type].label,
          `${hours}h`,
          `€${rate.toFixed(2)}`,
          `€${payment.toFixed(2)}`,
        ])
      })

      data.push([])
      data.push(["TOTAL GERAL", "", "", "", `€${getTotalPayments().toFixed(2)}`])

      // Estatísticas por categoria
      data.push([])
      data.push(["ESTATÍSTICAS POR CATEGORIA"])
      data.push(["Categoria", "Colaboradores", "Total Horas", "Total Pagamento"])

      const categoryStats = getCategoryStats()
      Object.entries(categoryStats).forEach(([category, stats]) => {
        data.push([
          EMPLOYEE_TYPES[category].label,
          stats.count,
          `${stats.totalHours}h`,
          `€${stats.totalPayment.toFixed(2)}`,
        ])
      })

      const ws = XLSX.utils.aoa_to_sheet(data)

      // Definir larguras das colunas
      ws["!cols"] = [
        { wch: 25 }, // Nome/Categoria
        { wch: 30 }, // Categoria/Descrição
        { wch: 15 }, // Horas
        { wch: 12 }, // Valor/Hora
        { wch: 15 }, // Total
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Relatório de Pagamentos")

      XLSX.writeFile(wb, `relatorio-pagamentos-${new Date().toISOString().split("T")[0]}.xlsx`)
    } catch (error) {
      console.error("Erro ao exportar relatório:", error)
    }
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
      {/* Cabeçalho da página de pagamentos */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cálculo de Pagamentos</h2>
          <p className="text-gray-600">Relatório detalhado de pagamentos por colaborador</p>
        </div>
        <Button onClick={exportPaymentsToExcel} className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Resumo geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Euro className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total a Pagar</p>
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
                  {employees.reduce((total, emp) => total + getTotalHours(emp.id), 0)}h
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

      {/* Tabela de valores por categoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="w-5 h-5" />
            Tabela de Salários por Categoria
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
                <Badge variant="secondary" className="font-bold">
                  €{HOURLY_RATES[key as keyof typeof HOURLY_RATES].toFixed(2)}/h
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas por categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas por Categoria</CardTitle>
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
                        <p className="font-bold">{stats.totalHours}h</p>
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

      {/* Detalhamento individual */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento Individual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employees.map((employee) => {
              const hours = getTotalHours(employee.id)
              const rate = HOURLY_RATES[employee.type]
              const payment = calculatePayment(employee.id, employee.type)
              const employeeType = EMPLOYEE_TYPES[employee.type]

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
                      <p className="font-bold">{hours}h</p>
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
              <p className="text-lg text-gray-600">Total Geral a Pagar</p>
              <p className="text-3xl font-bold text-green-600">€{getTotalPayments().toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
