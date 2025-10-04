"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  Users,
  Clock,
  Trash2,
  AlertCircle,
  Edit3,
  Save,
  RotateCcw,
  FileSpreadsheet,
  ImageIcon,
  Camera,
  Calendar,
  MapPin,
} from "lucide-react"
import * as XLSX from "xlsx"
import html2canvas from "html2canvas"
import PaymentsPage from "@/components/PaymentsPage"
import EmployeesPage from "@/components/EmployeesPage"
import EnhancedEmployeesPage from "@/components/EnhancedEmployeesPage"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"

const EMPLOYEE_TYPES = {
  novice: {
    label: "Novato / Primeira vez",
    color: "bg-yellow-400",
    textColor: "text-yellow-900",
    borderColor: "border-yellow-500",
    headerBg: "bg-yellow-100",
  },
  no_delivery: {
    label: "Não faz recolhas/entregas",
    color: "bg-orange-400",
    textColor: "text-orange-900",
    borderColor: "border-orange-500",
    headerBg: "bg-orange-100",
  },
  pickup: {
    label: "Faz recolhas",
    color: "bg-green-400",
    textColor: "text-green-900",
    borderColor: "border-green-500",
    headerBg: "bg-green-100",
  },
  pickup_delivery: {
    label: "Faz recolhas e entregas",
    color: "bg-blue-400",
    textColor: "text-blue-900",
    borderColor: "border-blue-500",
    headerBg: "bg-blue-100",
  },
  terminal: {
    label: "Faz terminal",
    color: "bg-purple-400",
    textColor: "text-purple-900",
    borderColor: "border-purple-500",
    headerBg: "bg-purple-100",
  },
  team_leader: {
    label: "Team Leader",
    color: "bg-black",
    textColor: "text-white",
    borderColor: "border-black",
    headerBg: "bg-gray-200",
  },
  segundo: {
    label: "Segundo",
    color: "bg-gray-700",
    textColor: "text-white",
    borderColor: "border-gray-800",
    headerBg: "bg-gray-150",
  },
}

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

const CITIES = {
  lisboa: {
    name: "Lisboa",
    rates: {
      novice: 4.5,
      no_delivery: 4.5,
      pickup: 4.5,
      pickup_delivery: 4.5,
      terminal: 5.0,
      team_leader: 6.0,
      segundo: 6.0,
    },
  },
  porto: {
    name: "Porto",
    rates: {
      novice: 4.5,
      no_delivery: 4.5,
      pickup: 4.5,
      pickup_delivery: 4.5,
      terminal: 5.0,
      team_leader: 6.0,
      segundo: 6.0,
    },
  },
  faro: {
    name: "Faro",
    rates: {
      novice: 5.0,
      no_delivery: 5.0,
      pickup: 5.0,
      pickup_delivery: 5.0,
      terminal: 5.5,
      team_leader: 6.5,
      segundo: 6.5,
    },
  },
}

const MAX_EMPLOYEES = 25
const DEFAULT_HALF_HOURS = 48 // 24 horas * 2 = 48 meias horas

interface Employee {
  id: string
  name: string
  type: keyof typeof EMPLOYEE_TYPES
  order: number
}

interface ExtendedEmployee {
  id: string
  name: string
  type: keyof typeof EMPLOYEE_TYPES
  state: keyof typeof EMPLOYEE_STATES
  phone?: string
  email?: string
  notes?: string
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
  createdAt: string
  updatedAt: string
}

interface Schedule {
  [employeeId: string]: boolean[]
}

interface TimeSlot {
  slot: number
  displayHour: number
  displayMinute: number
  start: string
  end: string
}

interface CityData {
  employees: Employee[]
  schedule: Schedule
  totalHalfHours: number
  date: string
}

export default function AdvancedShiftSchedule() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [schedule, setSchedule] = useState<Schedule>({})
  const [totalHalfHours, setTotalHalfHours] = useState(DEFAULT_HALF_HOURS)
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState<"mark" | "unmark">("mark")
  const [dragStart, setDragStart] = useState<{ employeeId: string; slot: number } | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const scheduleRef = useRef<HTMLDivElement>(null)
  const paymentsRef = useRef<HTMLDivElement>(null)
  const employeesRef = useRef<HTMLDivElement>(null)
  const [currentTab, setCurrentTab] = useState<"schedule" | "employees" | "payments">("schedule")
  const [currentCity, setCurrentCity] = useState<keyof typeof CITIES>("lisboa")
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedDate = localStorage.getItem("current-date")
        if (savedDate) {
          const date = new Date(savedDate)
          if (!isNaN(date.getTime())) {
            return date
          }
        }
      }
    } catch (error) {
      console.error("Error loading saved date:", error)
    }
    return new Date()
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const [globalEmployees, setGlobalEmployees] = useState<ExtendedEmployee[]>([])
  const [availabilityWarning, setAvailabilityWarning] = useState<string>("")

  const previousCityRef = useRef<keyof typeof CITIES>("lisboa")
  const previousDateRef = useRef<Date>(new Date())

  const getCityDateKey = (city: string, date: Date) => {
    try {
      return `${city}-${format(date, "yyyy-MM-dd")}`
    } catch (error) {
      console.error("Error formatting date:", error)
      return `${city}-${new Date().toISOString().split("T")[0]}`
    }
  }

  // Gerar slots de tempo com meias horas começando às 03:00
  const timeSlots: TimeSlot[] = Array.from({ length: totalHalfHours }, (_, i) => {
    const totalMinutes = i * 30 + 3 * 60 // Começa às 03:00
    const displayHour = Math.floor(totalMinutes / 60) % 24
    const displayMinute = totalMinutes % 60

    return {
      slot: i,
      displayHour,
      displayMinute,
      start: `${displayHour.toString().padStart(2, "0")}:${displayMinute.toString().padStart(2, "0")}`,
      end: `${displayHour.toString().padStart(2, "0")}:${((displayMinute + 29) % 60).toString().padStart(2, "0")}`,
    }
  })

  const saveCityData = useCallback(
    (city: string, date: Date, employeesData: Employee[], scheduleData: Schedule, halfHoursData: number) => {
      try {
        if (!date || isNaN(date.getTime())) {
          console.warn("Invalid date provided to saveCityData")
          return
        }

        const cityDateKey = getCityDateKey(city, date)
        const cityData: CityData = {
          employees: employeesData,
          schedule: scheduleData,
          totalHalfHours: halfHoursData,
          date: date.toISOString(),
        }
        localStorage.setItem(`city-data-${cityDateKey}`, JSON.stringify(cityData))
      } catch (error) {
        console.error("Error saving city data:", error)
      }
    },
    [],
  )

  const loadCityData = useCallback((city: string, date: Date) => {
    try {
      if (!date || isNaN(date.getTime())) {
        console.warn("Invalid date provided to loadCityData")
        return {
          employees: [],
          schedule: {},
          totalHalfHours: DEFAULT_HALF_HOURS,
        }
      }

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

  const changeCityDate = useCallback(
    (newCity: keyof typeof CITIES, newDate: Date) => {
      try {
        if (!newDate || isNaN(newDate.getTime())) {
          console.warn("Invalid date provided to changeCityDate")
          return
        }

        if (isInitialized && (employees.length > 0 || Object.keys(schedule).length > 0)) {
          saveCityData(previousCityRef.current, previousDateRef.current, employees, schedule, totalHalfHours)
        }

        const newData = loadCityData(newCity, newDate)
        setEmployees(newData.employees)
        setSchedule(newData.schedule)
        setTotalHalfHours(newData.totalHalfHours)

        previousCityRef.current = newCity
        previousDateRef.current = newDate
      } catch (error) {
        console.error("Error changing city/date:", error)
      }
    },
    [employees, schedule, totalHalfHours, isInitialized, saveCityData, loadCityData],
  )

  useEffect(() => {
    const savedCity = localStorage.getItem("current-city")
    const savedDate = localStorage.getItem("current-date")

    let initialCity: keyof typeof CITIES = "lisboa"
    let initialDate = new Date()

    if (savedCity && Object.keys(CITIES).includes(savedCity)) {
      initialCity = savedCity as keyof typeof CITIES
    }

    if (savedDate) {
      try {
        const parsedDate = new Date(savedDate)
        if (!isNaN(parsedDate.getTime())) {
          initialDate = parsedDate
        }
      } catch (error) {
        console.error("Error parsing saved date:", error)
        initialDate = new Date()
      }
    }

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

    const handleStorageChange = () => {
      loadGlobalEmployees()
    }

    window.addEventListener("storage", handleStorageChange)
    const interval = setInterval(loadGlobalEmployees, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [currentCity])

  useEffect(() => {
    if (!isInitialized) return

    if (currentCity !== previousCityRef.current) {
      changeCityDate(currentCity, selectedDate)
      localStorage.setItem("current-city", currentCity)
    }
  }, [currentCity, selectedDate, isInitialized, changeCityDate])

  useEffect(() => {
    if (!isInitialized) return

    if (selectedDate.getTime() !== previousDateRef.current.getTime()) {
      changeCityDate(currentCity, selectedDate)
      localStorage.setItem("current-date", selectedDate.toISOString())
    }
  }, [selectedDate, currentCity, isInitialized, changeCityDate])

  useEffect(() => {
    if (!isInitialized) return

    if (employees.length > 0 || Object.keys(schedule).length > 0) {
      saveCityData(currentCity, selectedDate, employees, schedule, totalHalfHours)
    }
  }, [employees, schedule, totalHalfHours, currentCity, selectedDate, isInitialized, saveCityData])

  const addExtraHalfHour = () => {
    const newTotalHalfHours = totalHalfHours + 2 // Adiciona 2 meias horas = 1 hora
    setTotalHalfHours(newTotalHalfHours)

    setSchedule((prev) => {
      const newSchedule = { ...prev }
      employees.forEach((emp) => {
        if (newSchedule[emp.id]) {
          newSchedule[emp.id] = [...newSchedule[emp.id], false, false]
        }
      })
      return newSchedule
    })
  }

  const resetToDefaultHours = () => {
    setTotalHalfHours(DEFAULT_HALF_HOURS)

    setSchedule((prev) => {
      const newSchedule = { ...prev }
      employees.forEach((emp) => {
        if (newSchedule[emp.id]) {
          newSchedule[emp.id] = newSchedule[emp.id].slice(0, DEFAULT_HALF_HOURS)
        }
      })
      return newSchedule
    })
  }

  const resetCurrentCityEmployees = () => {
    setEmployees([])
    setSchedule({})
    setTotalHalfHours(DEFAULT_HALF_HOURS)
    const cityDateKey = getCityDateKey(currentCity, selectedDate)
    localStorage.removeItem(`city-data-${cityDateKey}`)
  }

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

    setEmployees([...employees, newEmployee])
    setSchedule((prev) => ({
      ...prev,
      [newEmployee.id]: new Array(totalHalfHours).fill(false),
    }))

    setIsAddEmployeeOpen(false)
  }

  const removeEmployee = (employeeId: string) => {
    const newEmployees = employees.filter((emp) => emp.id !== employeeId)
    const newSchedule = { ...schedule }
    delete newSchedule[employeeId]

    setEmployees(newEmployees)
    setSchedule(newSchedule)

    setTimeout(() => {
      saveCityData(currentCity, selectedDate, newEmployees, newSchedule, totalHalfHours)
    }, 100)
  }

  const startEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee.id)
    setEditName(employee.name)
  }

  const saveEmployeeName = (employeeId: string) => {
    if (!editName.trim()) return

    setEmployees(employees.map((emp) => (emp.id === employeeId ? { ...emp, name: editName.trim() } : emp)))
    setEditingEmployee(null)
    setEditName("")
  }

  const cancelEdit = () => {
    setEditingEmployee(null)
    setEditName("")
  }

  const clearEmployeeSchedule = (employeeId: string) => {
    setSchedule((prev) => ({
      ...prev,
      [employeeId]: new Array(totalHalfHours).fill(false),
    }))
  }

  const getDayOfWeek = (date: Date) => {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    return days[date.getDay()]
  }

  const getAvailableEmployeesForDay = () => {
    const dayOfWeek = getDayOfWeek(selectedDate)

    return globalEmployees.filter((emp) => {
      if (emp.state !== "active" && emp.state !== "if_needed") return false
      if (employees.some((scheduleEmp) => scheduleEmp.id === emp.id)) return false
      return emp.weekAvailability[dayOfWeek] === true
    })
  }

  const checkHourAvailability = (employeeId: string, slot: number) => {
    const employee = globalEmployees.find((emp) => emp.id === employeeId)
    if (!employee || !employee.hourAvailability) return { available: true, message: "" }

    const dayOfWeek = getDayOfWeek(selectedDate)
    const dayAvailability = employee.hourAvailability[dayOfWeek]

    if (!dayAvailability) return { available: true, message: "" }

    if (dayAvailability.flexible) {
      return { available: true, message: "" }
    }

    const startHour = dayAvailability.startHour ?? 0
    const endHour = dayAvailability.endHour ?? 23

    // Calcular hora atual do slot (em horas decimais)
    const totalMinutes = slot * 30 + 3 * 60
    const currentHour = (totalMinutes / 60) % 24

    let available = false
    let message = ""

    if (startHour <= endHour) {
      available = currentHour >= startHour && currentHour <= endHour
      if (!available) {
        message = `${employee.name} só pode trabalhar das ${startHour.toString().padStart(2, "0")}:00 às ${endHour.toString().padStart(2, "0")}:00`
      }
    } else {
      available = currentHour >= startHour || currentHour <= endHour
      if (!available) {
        message = `${employee.name} só pode trabalhar das ${startHour.toString().padStart(2, "0")}:00 às ${endHour.toString().padStart(2, "0")}:00`
      }
    }

    return { available, message }
  }

  const validateScheduleChange = (employeeId: string, slot: number, isMarking: boolean) => {
    if (!isMarking) return { valid: true, message: "" }

    const validation = checkHourAvailability(employeeId, slot)
    if (!validation.available) {
      setAvailabilityWarning(validation.message)
      setTimeout(() => setAvailabilityWarning(""), 5000)
      return { valid: false, message: validation.message }
    }

    return { valid: true, message: "" }
  }

  const handleCellMouseDown = useCallback(
    (employeeId: string, slot: number) => {
      const currentState = schedule[employeeId]?.[slot] || false
      const mode = currentState ? "unmark" : "mark"

      if (mode === "mark") {
        const validation = validateScheduleChange(employeeId, slot, true)
        if (!validation.valid) {
          return
        }
      }

      setIsDragging(true)
      setDragMode(mode)
      setDragStart({ employeeId, slot })

      setSchedule((prev) => {
        const employeeSchedule = prev[employeeId] || new Array(totalHalfHours).fill(false)
        const newSchedule = [...employeeSchedule]
        newSchedule[slot] = mode === "mark"

        return {
          ...prev,
          [employeeId]: newSchedule,
        }
      })
    },
    [schedule, totalHalfHours, globalEmployees, selectedDate],
  )

  const handleCellMouseEnter = useCallback(
    (employeeId: string, slot: number) => {
      if (isDragging && dragStart && dragStart.employeeId === employeeId) {
        const startSlot = Math.min(dragStart.slot, slot)
        const endSlot = Math.max(dragStart.slot, slot)

        setSchedule((prev) => {
          const employeeSchedule = prev[employeeId] || new Array(totalHalfHours).fill(false)
          const newSchedule = [...employeeSchedule]

          for (let i = startSlot; i <= endSlot; i++) {
            if (dragMode === "mark") {
              const validation = validateScheduleChange(employeeId, i, true)
              if (validation.valid) {
                newSchedule[i] = true
              }
            } else {
              newSchedule[i] = false
            }
          }

          return {
            ...prev,
            [employeeId]: newSchedule,
          }
        })
      }
    },
    [isDragging, dragStart, dragMode, totalHalfHours, globalEmployees, selectedDate],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragStart(null)
  }, [])

  // Calcular total de horas por colaborador (incluindo meias horas)
  const getTotalHours = (employeeId: string) => {
    const employeeSchedule = schedule[employeeId] || []
    const halfHoursWorked = employeeSchedule.filter(Boolean).length
    return halfHoursWorked / 2 // Converte meias horas em horas
  }

  const getTotalAllHours = () => {
    return employees.reduce((total, emp) => total + getTotalHours(emp.id), 0)
  }

  const prepareForExport = (elementRef: React.RefObject<HTMLDivElement>) => {
    if (!elementRef.current) return null

    const clone = elementRef.current.cloneNode(true) as HTMLElement

    clone.style.padding = "40px"
    clone.style.backgroundColor = "#ffffff"
    clone.style.minWidth = "auto"
    clone.style.width = "auto"
    clone.style.fontSize = "16px" // Aumentar de 14px para 16px

    const infoDiv = document.createElement("div")
    infoDiv.style.marginBottom = "20px"
    infoDiv.style.padding = "15px"
    infoDiv.style.backgroundColor = "#f8f9fa"
    infoDiv.style.borderRadius = "8px"
    infoDiv.style.border = "1px solid #e9ecef"
    infoDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2 style="margin: 0; font-size: 18px; font-weight: bold; color: #333;">
            ${currentTab === "schedule" ? "Escala de Turnos" : currentTab === "payments" ? "Relatório de Pagamentos" : "Colaboradores"}
          </h2>
        </div>
        <div style="text-align: right; font-size: 14px; color: #666;">
          <div><strong>Cidade:</strong> ${CITIES[currentCity].name}</div>
          <div><strong>Data:</strong> ${format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: pt })}</div>
        </div>
      </div>
    `
    clone.insertBefore(infoDiv, clone.firstChild)

    const headers = clone.querySelectorAll("[data-employee-header]")
    headers.forEach((header) => {
      const headerEl = header as HTMLElement
      headerEl.style.minHeight = "200px" // Aumentar de 180px
      headerEl.style.fontSize = "16px" // Adicionar tamanho de fonte específico
      headerEl.style.height = "auto"
      headerEl.style.padding = "20px 16px"
      headerEl.style.wordWrap = "break-word"
      headerEl.style.overflowWrap = "break-word"
      headerEl.style.whiteSpace = "normal"
      headerEl.style.lineHeight = "1.4"
      headerEl.style.display = "flex"
      headerEl.style.flexDirection = "column"
      headerEl.style.justifyContent = "center"
      headerEl.style.alignItems = "flex-start"
      headerEl.style.textAlign = "left"
    })

    const names = clone.querySelectorAll("[data-employee-name]")
    names.forEach((name) => {
      const nameEl = name as HTMLElement
      nameEl.style.fontSize = "18px" // Aumentar de 16px para 18px
      // ... resto dos estilos
    })

    const badges = clone.querySelectorAll("[data-employee-badge]")
    badges.forEach((badge) => {
      const badgeEl = badge as HTMLElement
      badgeEl.style.fontSize = "14px" // Aumentar de 12px para 14px
      // ... resto dos estilos
    })

    return clone
  }

  const exportAsPNG = async (elementRef: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!elementRef.current) return

    try {
      const exportElement = prepareForExport(elementRef)
      if (!exportElement) return

      document.body.appendChild(exportElement)
      exportElement.style.position = "absolute"
      exportElement.style.left = "-9999px"
      exportElement.style.top = "0"
      exportElement.style.zIndex = "-1"

      const canvas = await html2canvas(exportElement, {
        backgroundColor: "#ffffff",
        scale: 3, // Aumentar de 2 para 3
        useCORS: true,
        allowTaint: true,
        width: exportElement.scrollWidth,
        height: exportElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        logging: false,
        windowWidth: exportElement.scrollWidth * 2,
        windowHeight: exportElement.scrollHeight * 2,
      })

      document.body.removeChild(exportElement)

      const link = document.createElement("a")
      link.download = `${filename}-${CITIES[currentCity].name}-${format(selectedDate, "yyyy-MM-dd")}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (error) {
      console.error("Erro ao exportar PNG:", error)
    }
  }

  const exportAsJPEG = async (elementRef: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!elementRef.current) return

    try {
      const exportElement = prepareForExport(elementRef)
      if (!exportElement) return

      document.body.appendChild(exportElement)
      exportElement.style.position = "absolute"
      exportElement.style.left = "-9999px"
      exportElement.style.top = "0"
      exportElement.style.zIndex = "-1"

      const canvas = await html2canvas(exportElement, {
        backgroundColor: "#ffffff",
        scale: 3, // Aumentar de 2 para 3
        useCORS: true,
        allowTaint: true,
        width: exportElement.scrollWidth,
        height: exportElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        logging: false,
        windowWidth: exportElement.scrollWidth * 2,
        windowHeight: exportElement.scrollHeight * 2,
      })

      document.body.removeChild(exportElement)

      const link = document.createElement("a")
      link.download = `${filename}-${CITIES[currentCity].name}-${format(selectedDate, "yyyy-MM-dd")}.jpg`
      link.href = canvas.toDataURL("image/jpeg", 1.0) // Aumentar de 0.98 para 1.0 (qualidade máxima)
      link.click()
    } catch (error) {
      console.error("Erro ao exportar JPEG:", error)
    }
  }

  const exportAsExcel = () => {
    try {
      const data = []

      data.push([
        currentTab === "schedule"
          ? "ESCALA DE TURNOS"
          : currentTab === "payments"
            ? "RELATÓRIO DE PAGAMENTOS"
            : "COLABORADORES",
      ])
      data.push(["Cidade:", CITIES[currentCity].name])
      data.push(["Data:", format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: pt })])
      data.push(["Período:", `${totalHalfHours / 2} horas (${totalHalfHours} blocos de 30min)`])
      data.push([])

      if (currentTab === "schedule") {
        const header = ["Horário", ...employees.map((emp) => emp.name)]
        data.push(header)

        const categories = ["Categoria", ...employees.map((emp) => EMPLOYEE_TYPES[emp.type].label)]
        data.push(categories)

        const totals = ["Total Horas", ...employees.map((emp) => `${getTotalHours(emp.id)}h`)]
        data.push(totals)

        data.push([])

        timeSlots.forEach((slot) => {
          const row = [
            `${slot.start} - ${slot.end}`,
            ...employees.map((emp) => {
              const isWorking = schedule[emp.id]?.[slot.slot] || false
              return isWorking ? "●" : ""
            }),
          ]
          data.push(row)
        })

        data.push([])
        data.push(["Total Geral", `${getTotalAllHours()} horas`])
      }

      const ws = XLSX.utils.aoa_to_sheet(data)

      const colWidths = [
        { wch: 15 },
        ...employees.map((emp) => ({
          wch: Math.max(emp.name.length + 5, EMPLOYEE_TYPES[emp.type].label.length + 2, 18),
        })),
      ]
      ws["!cols"] = colWidths

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(
        wb,
        ws,
        currentTab === "schedule"
          ? "Escala de Turnos"
          : currentTab === "payments"
            ? "Relatório de Pagamentos"
            : "Colaboradores",
      )

      const filename =
        currentTab === "schedule"
          ? "escala-turnos"
          : currentTab === "payments"
            ? "relatorio-pagamentos"
            : "colaboradores"
      XLSX.writeFile(wb, `${filename}-${CITIES[currentCity].name}-${format(selectedDate, "yyyy-MM-dd")}.xlsx`)
    } catch (error) {
      console.error("Erro ao exportar Excel:", error)
    }
  }

  const sortedEmployees = [...employees].sort((a, b) => a.order - b.order)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0">
          <div className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Extrafaro</h1>
                <p className="text-sm text-gray-600">Gestão de Escalas</p>
              </div>
            </div>
          </div>

          <nav className="px-4 space-y-2">
            <button
              onClick={() => setCurrentTab("schedule")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                currentTab === "schedule"
                  ? "bg-blue-100 text-blue-700 border-l-4 border-blue-500"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Clock className="h-5 w-5" />
              <div>
                <div className="font-medium">Gestão de Escalas</div>
                <div className="text-xs text-gray-500">Planeamento de horários</div>
              </div>
            </button>

            <button
              onClick={() => setCurrentTab("employees")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                currentTab === "employees"
                  ? "bg-orange-100 text-orange-700 border-l-4 border-orange-500"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Users className="h-5 w-5" />
              <div>
                <div className="font-medium">Colaboradores</div>
                <div className="text-xs text-gray-500">Gestão de recursos humanos</div>
              </div>
            </button>

            <button
              onClick={() => setCurrentTab("payments")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                currentTab === "payments"
                  ? "bg-purple-100 text-purple-700 border-l-4 border-purple-500"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FileSpreadsheet className="h-5 w-5" />
              <div>
                <div className="font-medium">Pagamentos</div>
                <div className="text-xs text-gray-500">Cálculos e relatórios</div>
              </div>
            </button>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{CITIES[currentCity].name}</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Cidade atual
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-64">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {currentTab === "schedule" && "Gestão Avançada de Escalas de Turnos"}
                {currentTab === "employees" && "Gestão de Colaboradores"}
                {currentTab === "payments" && "Cálculo de Pagamentos"}
              </h1>
              <p className="text-gray-600">
                Sistema completo com intervalos de 30 minutos ({totalHalfHours / 2} horas - expansível)
              </p>
            </div>

        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-lg border">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Configurações:</Label>
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

          {currentTab === "schedule" && (
            <>
              <Separator orientation="vertical" className="h-8" />

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <Label className="text-sm font-medium">Data:</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-48 justify-start text-left font-normal bg-transparent">
                      {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: pt })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date)
                          setIsCalendarOpen(false)
                        }
                      }}
                      locale={pt}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}

          <div className="text-xs text-gray-500 ml-auto">
            {currentCity} - {format(selectedDate, "dd/MM")} - {employees.length} colaboradores
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          {currentTab === "schedule" && (
            <>
              <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2" disabled={employees.length >= MAX_EMPLOYEES}>
                    <Plus className="w-4 h-4" />
                    Adicionar Colaborador ({employees.length}/{MAX_EMPLOYEES})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Colaborador à Escala</DialogTitle>
                    <DialogDescription>
                      Selecione um colaborador disponível para adicionar à escala de turnos
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {getAvailableEmployeesForDay().length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum colaborador disponível</h3>
                        <p className="text-gray-600 mb-2">
                          Não há colaboradores disponíveis para {getDayOfWeek(selectedDate)} (
                          {format(selectedDate, "EEEE", { locale: pt })})
                        </p>
                        <p className="text-sm text-gray-500">
                          Verifique a aba "Colaboradores" e configure a disponibilidade semanal
                        </p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <Label>Selecionar Colaborador</Label>
                          <p className="text-sm text-gray-600 mb-3">
                            Colaboradores disponíveis para {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: pt })}
                          </p>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {getAvailableEmployeesForDay().map((employee) => {
                            const employeeType = EMPLOYEE_TYPES[employee.type]
                            const employeeState = EMPLOYEE_STATES[employee.state]
                            return (
                              <div
                                key={employee.id}
                                onClick={() => addEmployeeToSchedule(employee.id)}
                                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded ${employeeType.color}`}></div>
                                    <div>
                                      <div className="font-medium">{employee.name}</div>
                                      <div className="text-sm text-gray-600">{employeeType.label}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={employeeState.color} variant="secondary">
                                      {employeeState.label}
                                    </Badge>
                                    {employee.hourAvailability?.[getDayOfWeek(selectedDate)]?.flexible ? (
                                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                        24h disponível
                                      </span>
                                    ) : employee.hourAvailability?.[getDayOfWeek(selectedDate)] ? (
                                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                        {(employee.hourAvailability[getDayOfWeek(selectedDate)].startHour ?? 0)
                                          .toString()
                                          .padStart(2, "0")}
                                        :00 -{" "}
                                        {(employee.hourAvailability[getDayOfWeek(selectedDate)].endHour ?? 23)
                                          .toString()
                                          .padStart(2, "0")}
                                        :00
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Separator orientation="vertical" className="h-10" />
            </>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                exportAsPNG(
                  currentTab === "schedule" ? scheduleRef : currentTab === "payments" ? paymentsRef : employeesRef,
                  currentTab === "schedule"
                    ? "escala-turnos"
                    : currentTab === "payments"
                      ? "relatorio-pagamentos"
                      : "colaboradores",
                )
              }
              className="flex items-center gap-2 bg-transparent"
              disabled={employees.length === 0}
            >
              <Camera className="w-4 h-4" />
              PNG
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                exportAsJPEG(
                  currentTab === "schedule" ? scheduleRef : currentTab === "payments" ? paymentsRef : employeesRef,
                  currentTab === "schedule"
                    ? "escala-turnos"
                    : currentTab === "payments"
                      ? "relatorio-pagamentos"
                      : "colaboradores",
                )
              }
              className="flex items-center gap-2 bg-transparent"
              disabled={employees.length === 0}
            >
              <ImageIcon className="w-4 h-4" />
              JPEG
            </Button>
            <Button
              variant="outline"
              onClick={exportAsExcel}
              className="flex items-center gap-2 bg-transparent"
              disabled={employees.length === 0}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </Button>
          </div>

          {currentTab === "schedule" && (
            <>
              <Separator orientation="vertical" className="h-10" />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={resetToDefaultHours}
                  disabled={totalHalfHours === DEFAULT_HALF_HOURS}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset (24h)
                </Button>
                <Button
                  variant="outline"
                  onClick={resetCurrentCityEmployees}
                  disabled={employees.length === 0}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset Colaboradores
                </Button>
                <Badge variant="secondary" className="flex items-center gap-1 px-3 py-2">
                  <Clock className="w-4 h-4" />
                  {totalHalfHours / 2}h ({totalHalfHours} blocos)
                </Badge>
              </div>
            </>
          )}
        </div>

        {currentTab === "schedule" && employees.length >= MAX_EMPLOYEES && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Limite máximo de {MAX_EMPLOYEES} colaboradores atingido. Remova um colaborador para adicionar outro.
            </AlertDescription>
          </Alert>
        )}

        {availabilityWarning && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">{availabilityWarning}</AlertDescription>
          </Alert>
        )}

        {currentTab === "schedule" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Categorias de Colaboradores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(EMPLOYEE_TYPES).map(([key, type]) => (
                  <div key={key} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className={`w-6 h-6 rounded ${type.color} border-2 ${type.borderColor}`}></div>
                    <span className="text-sm font-medium">{type.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Horário:</strong> Intervalos de 30 minutos das 03:00 às 02:59 ({totalHalfHours / 2} horas).{" "}
                  <strong>Como usar:</strong> Clique e arraste para marcar. Cada 2 blocos = 1 hora.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {currentTab === "schedule" && employees.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-0">
              <div ref={scheduleRef} className="overflow-x-auto">
                <div
                  className="schedule-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: `120px repeat(${employees.length}, minmax(180px, 1fr))`,
                    gap: "0",
                    minWidth: `${120 + employees.length * 180}px`,
                  }}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <div className="p-4 font-bold border-b-2 border-r-2 bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm">Horário</div>
                      <div className="text-xs text-gray-600 mt-1">{totalHalfHours / 2}h</div>
                    </div>
                  </div>

                  {sortedEmployees.map((employee) => {
                    const employeeType = EMPLOYEE_TYPES[employee.type]
                    const nameLength = employee.name.length
                    const fontSize = nameLength > 25 ? "text-xs" : nameLength > 20 ? "text-sm" : "text-sm"
                    const minHeight =
                      nameLength > 30 ? "200px" : nameLength > 25 ? "180px" : nameLength > 20 ? "160px" : "140px"

                    return (
                      <div
                        key={employee.id}
                        data-employee-header="true"
                        className={`p-4 border-b-2 border-r-2 ${employeeType.headerBg} relative group flex flex-col justify-center`}
                        style={{
                          minHeight,
                          wordWrap: "break-word",
                          overflowWrap: "break-word",
                        }}
                      >
                        <div className="flex items-start justify-between h-full">
                          <div className="flex-1 min-w-0 pr-2">
                            {editingEmployee === employee.id ? (
                              <div className="space-y-2">
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="text-sm h-8"
                                  maxLength={40}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEmployeeName(employee.id)
                                    if (e.key === "Escape") cancelEdit()
                                  }}
                                  autoFocus
                                />
                                <div className="flex gap-1">
                                  <Button size="sm" onClick={() => saveEmployeeName(employee.id)} className="h-6 px-2">
                                    <Save className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEdit}
                                    className="h-6 px-2 bg-transparent"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col h-full justify-center">
                                <div
                                  data-employee-name="true"
                                  className={`font-bold ${fontSize} cursor-pointer hover:text-blue-600 leading-tight mb-3`}
                                  style={{
                                    wordBreak: "break-word",
                                    hyphens: "auto",
                                    lineHeight: "1.3",
                                  }}
                                  title={`${employee.name} - Clique para editar`}
                                  onClick={() => startEditEmployee(employee)}
                                >
                                  {employee.name}
                                </div>
                                <Badge
                                  data-employee-badge="true"
                                  className={`text-xs ${employeeType.color} ${employeeType.textColor} w-fit leading-tight mb-3`}
                                  style={{ fontSize: "10px", lineHeight: "1.2", padding: "4px 8px" }}
                                >
                                  {employeeType.label}
                                </Badge>
                                <div data-employee-total="true" className="text-xs text-gray-600 font-medium">
                                  Total: {getTotalHours(employee.id)}h
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 ml-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditEmployee(employee)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                              title="Editar nome"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => clearEmployeeSchedule(employee.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                              title="Limpar horários"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEmployee(employee.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              title="Remover colaborador"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {timeSlots.map((slot) => (
                    <>
                      <div
                        key={`time-${slot.slot}`}
                        data-time-cell="true"
                        className="p-3 border-b border-r-2 bg-gray-50 flex flex-col items-center justify-center"
                      >
                        <div className="font-mono text-sm font-bold">{slot.start}</div>
                        <div className="font-mono text-xs text-gray-600">{slot.end}</div>
                      </div>

                      {sortedEmployees.map((employee) => {
                        const isScheduled = schedule[employee.id]?.[slot.slot] || false
                        const employeeType = EMPLOYEE_TYPES[employee.type]

                        return (
                          <div
                            key={`${employee.id}-${slot.slot}`}
                            className={`h-16 border-b border-r cursor-pointer transition-all duration-150 flex items-center justify-center relative ${
                              isScheduled
                                ? `${employeeType.color} ${employeeType.textColor} border-l-4 ${employeeType.borderColor}`
                                : "hover:bg-gray-100 border-gray-200"
                            }`}
                            onMouseDown={() => handleCellMouseDown(employee.id, slot.slot)}
                            onMouseEnter={() => handleCellMouseEnter(employee.id, slot.slot)}
                            title={
                              isScheduled
                                ? `${employee.name} - ${slot.start} às ${slot.end} (Clique para desmarcar)`
                                : `${employee.name} - ${slot.start} às ${slot.end} (Clique para marcar)`
                            }
                          >
                            {isScheduled && (
                              <div className="flex items-center justify-center">
                                <Clock className="w-5 h-5" />
                              </div>
                            )}
                            {isDragging && dragStart?.employeeId === employee.id && (
                              <div className="absolute inset-0 bg-blue-200 bg-opacity-30 border-2 border-blue-400 border-dashed"></div>
                            )}
                          </div>
                        )
                      })}
                    </>
                  ))}

                  <div className="p-4 border-b border-r-2 bg-green-50 flex items-center justify-center">
                    <Button
                      onClick={addExtraHalfHour}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      title="Adicionar mais uma hora (2 blocos de 30min)"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {sortedEmployees.map((employee) => (
                    <div
                      key={`add-${employee.id}`}
                      className="h-16 border-b border-r bg-green-50 flex items-center justify-center"
                    >
                      <span className="text-xs text-green-600 font-medium">+1h</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentTab === "schedule" && employees.length === 0 && (
          <Card>
            <CardContent className="text-center py-16">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum colaborador adicionado</h3>
              <p className="text-gray-600 mb-6">Comece adicionando colaboradores para criar a escala de turnos</p>
              <Button onClick={() => setIsAddEmployeeOpen(true)} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Primeiro Colaborador
              </Button>
            </CardContent>
          </Card>
        )}

        {currentTab === "schedule" && employees.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Resumo Detalhado de Horas ({totalHalfHours / 2}h total)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {sortedEmployees.map((employee) => {
                  const totalEmployeeHours = getTotalHours(employee.id)
                  const employeeType = EMPLOYEE_TYPES[employee.type]

                  return (
                    <div
                      key={employee.id}
                      className={`p-4 rounded-lg border-l-4 ${employeeType.borderColor} ${employeeType.headerBg}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold truncate" title={employee.name}>
                            {employee.name}
                          </div>
                          <div className="text-sm text-gray-600 truncate">{employeeType.label}</div>
                        </div>
                        <div className="text-2xl font-bold text-blue-600 ml-3">{totalEmployeeHours}h</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-900">Total Geral</div>
                  <div className="text-3xl font-bold text-blue-600">{getTotalAllHours()}h</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-900">Colaboradores</div>
                  <div className="text-3xl font-bold text-green-600">{employees.length}</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-900">Período</div>
                  <div className="text-3xl font-bold text-purple-600">{totalHalfHours / 2}h</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentTab === "employees" && (
          <div ref={employeesRef}>
            <EnhancedEmployeesPage
              employees={employees}
              setEmployees={setEmployees}
              EMPLOYEE_TYPES={EMPLOYEE_TYPES}
              EMPLOYEE_STATES={EMPLOYEE_STATES}
              currentCity={currentCity}
              selectedDate={selectedDate}
              CITIES={CITIES}
            />
          </div>
        )}

        {currentTab === "payments" && (
          <div ref={paymentsRef}>
            <PaymentsPage
              employees={employees}
              schedule={schedule}
              totalHours={totalHalfHours / 2}
              EMPLOYEE_TYPES={EMPLOYEE_TYPES}
              getTotalHours={getTotalHours}
              currentCity={currentCity}
              selectedDate={selectedDate}
              CITIES={CITIES}
            />
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  )
}
