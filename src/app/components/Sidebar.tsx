import React from 'react'
import { LayoutDashboard, Users, CheckCircle, AlertTriangle, Clock, Ban, BarChart3, Settings } from 'lucide-react'

type AbaType = 'dashboard' | 'pendentes' | 'concluidos' | 'atencao' | 'atrasados' | 'desativados' | 'relatorios'

interface SidebarProps {
  abaSelecionada: AbaType
  onChangeAba: (aba: AbaType) => void
  contadores: {
    pendentes: number
    concluidos: number
    atencao: number
    atrasados: number
    desativados: number
  }
}

export function Sidebar({ abaSelecionada, onChangeAba, contadores }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as AbaType, nome: 'Dashboard', icon: LayoutDashboard, cor: 'blue' },
    { id: 'pendentes' as AbaType, nome: 'Pendentes', icon: Clock, cor: 'orange', badge: contadores.pendentes },
    { id: 'concluidos' as AbaType, nome: 'Concluídos', icon: CheckCircle, cor: 'green', badge: contadores.concluidos },
    { id: 'atencao' as AbaType, nome: 'Atenção', icon: AlertTriangle, cor: 'yellow', badge: contadores.atencao },
    { id: 'atrasados' as AbaType, nome: 'Atrasados', icon: Clock, cor: 'red', badge: contadores.atrasados },
    { id: 'desativados' as AbaType, nome: 'Desativados', icon: Ban, cor: 'gray', badge: contadores.desativados },
    { id: 'relatorios' as AbaType, nome: 'Relatórios', icon: BarChart3, cor: 'purple' },
  ]

  const getCor = (cor: string, ativo: boolean) => {
    if (!ativo) return 'text-gray-600 bg-transparent'
    
    const cores = {
      blue: 'text-blue-600 bg-blue-50',
      orange: 'text-orange-600 bg-orange-50',
      green: 'text-green-600 bg-green-50',
      yellow: 'text-yellow-600 bg-yellow-50',
      red: 'text-red-600 bg-red-50',
      gray: 'text-gray-600 bg-gray-50',
      purple: 'text-purple-600 bg-purple-50'
    }
    return cores[cor as keyof typeof cores] || cores.blue
  }

  return (
    <aside className="w-72 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">CONTROL GESTÃO</h1>
            <p className="text-xs text-slate-400">Sistema de Gerenciamento</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const ativo = abaSelecionada === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onChangeAba(item.id)}
              className={`
                w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl
                transition-all duration-200 font-medium text-sm group
                ${ativo 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${ativo ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                <span>{item.nome}</span>
              </div>
              
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`
                  px-2.5 py-0.5 rounded-full text-xs font-bold
                  ${ativo 
                    ? 'bg-white text-emerald-600' 
                    : 'bg-slate-700 text-slate-200 group-hover:bg-slate-600'
                  }
                `}>
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-slate-400 text-center">
          <p>Versão 2.0.0</p>
          <p className="mt-1">© 2025 Control Gestão</p>
        </div>
      </div>
    </aside>
  )
}
