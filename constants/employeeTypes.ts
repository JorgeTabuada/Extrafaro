export const EMPLOYEE_TYPES = {
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

export const EMPLOYEE_STATES = {
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
