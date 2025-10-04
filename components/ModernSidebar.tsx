"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Euro, 
  BarChart3, 
  User,
  MapPin
} from "lucide-react"

interface ModernSidebarProps {
  currentTab: string
  onTabChange: (tab: string) => void
  currentCity: string
  cities: any
}

const ModernSidebar: React.FC<ModernSidebarProps> = ({
  currentTab,
  onTabChange,
  currentCity,
  cities
}) => {
  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Visão geral do sistema"
    },
    {
      id: "schedule",
      label: "Gestão de Escalas",
      icon: Calendar,
      description: "Planeamento de horários"
    },
    {
      id: "employees",
      label: "Colaboradores",
      icon: Users,
      description: "Gestão de recursos humanos"
    },
    {
      id: "payments",
      label: "Pagamentos",
      icon: Euro,
      description: "Cálculos e relatórios"
    },
    {
      id: "reports",
      label: "Relatórios",
      icon: BarChart3,
      description: "Análises e métricas"
    }
  ]

  return (
    <div className="bg-white border-r border-gray-200 w-64 flex flex-col shadow-sm">
      {/* Logo e Título */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col items-center space-y-3">
          <img 
            src="/multipark-logo.png" 
            alt="Grupo Multipark" 
            className="w-32 h-auto object-contain"
          />
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">Grupo Multipark</h1>
            <p className="text-sm text-gray-500">Gestão de Escalas</p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = currentTab === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-5 h-5" />
              <div className="flex-1">
                <div className="text-sm font-medium">{item.label}</div>
                {isActive && (
                  <div className="text-xs text-blue-600 mt-0.5">{item.description}</div>
                )}
              </div>
            </button>
          )
        })}
      </nav>

      {/* Informações da Sessão */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <MapPin className="w-4 h-4 text-gray-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {cities[currentCity]?.name || currentCity}
            </p>
            <p className="text-xs text-gray-500">Cidade atual</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Utilizador</p>
            <p className="text-xs text-gray-500">Administrador</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModernSidebar
