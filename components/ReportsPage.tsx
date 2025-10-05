"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Users, Clock, Euro, TrendingUp, BarChart3, Download, Database } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns"
import { pt } from "date-fns/locale"
import Image from "next/image"
import { loadHistoricalDataFromSupabase } from "@/lib/supabase-sync"

interface ReportsPageProps {
  CITIES: any
  EMPLOYEE_TYPES: any
}

interface DayData {
  date: Date
  city: string
  employees: number
  hours: number
  cost: number
}

export default function ReportsPage({ CITIES, EMPLOYEE_TYPES }: ReportsPageProps) {
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()))
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()))
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false)
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false)
  const [aggregatedData, setAggregatedData] = useState<DayData[]>([])
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    loadAggregatedData()
  }, [startDate, endDate])

  const importHistoricalData = async () => {
    setIsImporting(true)
    try {
      console.log('🔄 Carregando dados históricos do Supabase...')

      const days = eachDayOfInterval({ start: startDate, end: endDate })
      const allData: DayData[] = []

      for (const cityKey of Object.keys(CITIES)) {
        for (const date of days) {
          const dateStr = format(date, "yyyy-MM-dd")
          const result = await loadHistoricalDataFromSupabase(cityKey, dateStr)

          if (result.success && result.data) {
            const { employees, schedule } = result.data

            // Calcular agregados diretamente sem guardar no localStorage
            let totalHours = 0
            let totalCost = 0
            const uniqueEmployees = new Set<string>()

            employees.forEach((emp: any) => {
              const empSchedule = schedule[emp.id] || []
              const empHours = empSchedule.filter(Boolean).length * 0.5

              if (empHours > 0) {
                uniqueEmployees.add(emp.id)
                totalHours += empHours

                const hourlyRate = CITIES[cityKey]?.rates?.[emp.type] || 0
                totalCost += empHours * hourlyRate
              }
            })

            if (uniqueEmployees.size > 0) {
              allData.push({
                date,
                city: CITIES[cityKey].name,
                employees: uniqueEmployees.size,
                hours: totalHours,
                cost: totalCost
              })
            }
          }
        }
      }

      setAggregatedData(allData)
      alert('✅ Dados carregados do Supabase com sucesso!')
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      alert('❌ Erro ao carregar dados do Supabase')
    } finally {
      setIsImporting(false)
    }
  }

  const loadAggregatedData = () => {
    const data: DayData[] = []

    // Iterar por todas as datas do intervalo
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    days.forEach(date => {
      // Para cada cidade
      Object.keys(CITIES).forEach(cityKey => {
        const dateStr = format(date, "yyyy-MM-dd")
        const cityDateKey = `${cityKey}-${dateStr}`

        // Carregar dados do localStorage
        const savedData = localStorage.getItem(`city-data-${cityDateKey}`)

        if (savedData) {
          try {
            const cityData = JSON.parse(savedData)
            const employees = cityData.employees || []
            const schedule = cityData.schedule || {}

            // Calcular total de horas e custo para este dia
            let totalHours = 0
            let totalCost = 0
            const uniqueEmployees = new Set<string>()

            employees.forEach((emp: any) => {
              const empSchedule = schedule[emp.id] || []
              const empHours = empSchedule.filter(Boolean).length * 0.5

              if (empHours > 0) {
                uniqueEmployees.add(emp.id)
                totalHours += empHours

                // Calcular custo
                const hourlyRate = CITIES[cityKey]?.rates?.[emp.type] || 0
                totalCost += empHours * hourlyRate
              }
            })

            if (uniqueEmployees.size > 0) {
              data.push({
                date,
                city: CITIES[cityKey].name,
                employees: uniqueEmployees.size,
                hours: totalHours,
                cost: totalCost
              })
            }
          } catch (error) {
            console.error('Erro ao carregar dados:', error)
          }
        }
      })
    })

    setAggregatedData(data)
  }

  // Calcular totais gerais
  const totalEmployees = new Set(aggregatedData.map(d => `${d.city}-${d.employees}`)).size
  const totalHours = aggregatedData.reduce((sum, d) => sum + d.hours, 0)
  const totalCost = aggregatedData.reduce((sum, d) => sum + d.cost, 0)

  // Calcular totais por cidade
  const citySummary = Object.keys(CITIES).map(cityKey => {
    const cityName = CITIES[cityKey].name
    const cityData = aggregatedData.filter(d => d.city === cityName)

    return {
      city: cityName,
      employees: cityData.length > 0 ? Math.max(...cityData.map(d => d.employees)) : 0,
      hours: cityData.reduce((sum, d) => sum + d.hours, 0),
      cost: cityData.reduce((sum, d) => sum + d.cost, 0),
      days: cityData.length
    }
  })

  // Agrupar por dia (agregando todas as cidades)
  const daysSummary = aggregatedData.reduce((acc, d) => {
    const dateKey = format(d.date, "yyyy-MM-dd")

    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: d.date,
        employees: 0,
        hours: 0,
        cost: 0,
        cities: new Set<string>()
      }
    }

    acc[dateKey].employees += d.employees
    acc[dateKey].hours += d.hours
    acc[dateKey].cost += d.cost
    acc[dateKey].cities.add(d.city)

    return acc
  }, {} as Record<string, any>)

  const dailyData = Object.values(daysSummary).sort((a: any, b: any) =>
    a.date.getTime() - b.date.getTime()
  )

  const exportToExcel = () => {
    // Preparar dados para exportação
    const exportData = dailyData.map((day: any) => ({
      'Data': format(day.date, "dd/MM/yyyy", { locale: pt }),
      'Colaboradores': day.employees,
      'Horas': day.hours.toFixed(1),
      'Custo (€)': day.cost.toFixed(2),
      'Cidades': Array.from(day.cities).join(', ')
    }))

    // Converter para CSV
    const headers = Object.keys(exportData[0]).join(',')
    const rows = exportData.map(row => Object.values(row).join(',')).join('\n')
    const csv = `${headers}\n${rows}`

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.csv`
    link.click()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Logo */}
      <div className="flex justify-center">
        <Image
          src="/multipark-logo.png"
          alt="Multipark Logo"
          width={250}
          height={80}
          className="object-contain"
          priority
        />
      </div>

      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatórios e Dashboard</h1>
        <p className="text-gray-600">Análise agregada de colaboradores, horas e custos</p>
      </div>

      {/* Filtros de Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Filtros de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">De:</span>
              <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-96 justify-start text-left font-normal bg-transparent text-base px-6 py-6">
                    {format(startDate, "dd 'de' MMMM 'de' yyyy", { locale: pt })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date)
                        setIsStartCalendarOpen(false)
                      }
                    }}
                    locale={pt}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Até:</span>
              <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-96 justify-start text-left font-normal bg-transparent text-base px-6 py-6">
                    {format(endDate, "dd 'de' MMMM 'de' yyyy", { locale: pt })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      if (date) {
                        setEndDate(date)
                        setIsEndCalendarOpen(false)
                      }
                    }}
                    locale={pt}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button
              onClick={importHistoricalData}
              variant="outline"
              disabled={isImporting}
              className="ml-auto"
            >
              <Database className="w-4 h-4 mr-2" />
              {isImporting ? 'Importando...' : 'Importar do Supabase'}
            </Button>

            <Button onClick={exportToExcel} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Totais Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de Colaboradores</p>
                <p className="text-2xl font-bold text-gray-900">{aggregatedData.length > 0 ? Math.max(...aggregatedData.map(d => d.employees)) : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de Horas</p>
                <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Euro className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Custo Total</p>
                <p className="text-2xl font-bold text-gray-900">€{totalCost.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo por Cidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Resumo por Cidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {citySummary.map(city => (
              <div key={city.city} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{city.city}</h3>
                  <span className="text-sm text-gray-500">{city.days} dias com dados</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Colaboradores</p>
                    <p className="text-xl font-bold text-blue-600">{city.employees}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Horas</p>
                    <p className="text-xl font-bold text-green-600">{city.hours.toFixed(1)}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Custo</p>
                    <p className="text-xl font-bold text-purple-600">€{city.cost.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dados por Dia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Dados por Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Data</th>
                  <th className="text-center p-3 font-semibold">Colaboradores</th>
                  <th className="text-center p-3 font-semibold">Horas</th>
                  <th className="text-right p-3 font-semibold">Custo</th>
                  <th className="text-left p-3 font-semibold">Cidades</th>
                </tr>
              </thead>
              <tbody>
                {dailyData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-6 text-gray-500">
                      Nenhum dado encontrado para o período selecionado
                    </td>
                  </tr>
                ) : (
                  dailyData.map((day: any, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        {format(day.date, "EEEE, dd 'de' MMMM", { locale: pt })}
                      </td>
                      <td className="text-center p-3 font-semibold text-blue-600">
                        {day.employees}
                      </td>
                      <td className="text-center p-3 font-semibold text-green-600">
                        {day.hours.toFixed(1)}h
                      </td>
                      <td className="text-right p-3 font-semibold text-purple-600">
                        €{day.cost.toFixed(2)}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {Array.from(day.cities).join(', ')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {dailyData.length > 0 && (
                <tfoot className="bg-gray-100 font-bold">
                  <tr>
                    <td className="p-3">TOTAL</td>
                    <td className="text-center p-3 text-blue-600">
                      {Math.max(...dailyData.map((d: any) => d.employees))}
                    </td>
                    <td className="text-center p-3 text-green-600">
                      {totalHours.toFixed(1)}h
                    </td>
                    <td className="text-right p-3 text-purple-600">
                      €{totalCost.toFixed(2)}
                    </td>
                    <td className="p-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
