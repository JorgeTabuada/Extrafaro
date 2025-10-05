"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { 
  MapPin, 
  Calendar, 
  Plus,
  Download,
  Settings
} from "lucide-react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"

interface ModernHeaderProps {
  currentTab: string
  currentCity: string
  cities: any
  selectedDate: Date
  onCityChange: (city: string) => void
  onDateChange: (date: Date) => void
  isCalendarOpen: boolean
  setIsCalendarOpen: (open: boolean) => void
}

const ModernHeader: React.FC<ModernHeaderProps> = ({
  currentTab,
  currentCity,
  cities,
  selectedDate,
  onCityChange,
  onDateChange,
  isCalendarOpen,
  setIsCalendarOpen
}) => {
  const getTabInfo = () => {
    switch (currentTab) {
      case "dashboard":
        return {
          title: "Dashboard",
          description: "Visão geral do sistema de escalas"
        }
      case "schedule":
        return {
          title: "Gestão de Escalas",
          description: "Planeamento de horários e turnos"
        }
      case "employees":
        return {
          title: "Colaboradores",
          description: "Gestão de recursos humanos"
        }
      case "payments":
        return {
          title: "Pagamentos",
          description: "Cálculos e relatórios financeiros"
        }
      case "reports":
        return {
          title: "Relatórios",
          description: "Análises e métricas do sistema"
        }
      default:
        return {
          title: "Extrafaro",
          description: "Sistema de gestão de escalas"
        }
    }
  }

  const tabInfo = getTabInfo()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{tabInfo.title}</h2>
          <p className="text-gray-600">{tabInfo.description}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Seletor de Cidade */}
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <Select value={currentCity} onValueChange={onCityChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(cities).map(([key, city]: [string, any]) => (
                  <SelectItem key={key} value={key}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seletor de Data - apenas para schedule */}
          {currentTab === "schedule" && (
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-48 justify-start text-left font-normal bg-transparent"
                  >
                    {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: pt })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        onDateChange(date)
                        setIsCalendarOpen(false)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex space-x-2">
            {currentTab === "schedule" && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar</span>
                </Button>
                <Button 
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar</span>
                </Button>
              </>
            )}
            
            {currentTab === "employees" && (
              <Button 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Colaborador</span>
              </Button>
            )}

            {currentTab === "reports" && (
              <Button 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Gerar Relatório</span>
              </Button>
            )}

            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default ModernHeader
