import React from 'react'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  titulo: string
  valor: string | number
  subtitulo?: string
  icon: LucideIcon
  cor: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'yellow' | 'emerald'
  tendencia?: {
    valor: string
    positivo: boolean
  }
}

export function StatsCard({ titulo, valor, subtitulo, icon: Icon, cor, tendencia }: StatsCardProps) {
  const cores = {
    blue: {
      bg: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-500/20',
      badge: 'bg-blue-100 text-blue-700'
    },
    green: {
      bg: 'from-green-500 to-green-600',
      shadow: 'shadow-green-500/20',
      badge: 'bg-green-100 text-green-700'
    },
    orange: {
      bg: 'from-orange-500 to-orange-600',
      shadow: 'shadow-orange-500/20',
      badge: 'bg-orange-100 text-orange-700'
    },
    red: {
      bg: 'from-red-500 to-red-600',
      shadow: 'shadow-red-500/20',
      badge: 'bg-red-100 text-red-700'
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      shadow: 'shadow-purple-500/20',
      badge: 'bg-purple-100 text-purple-700'
    },
    yellow: {
      bg: 'from-yellow-500 to-yellow-600',
      shadow: 'shadow-yellow-500/20',
      badge: 'bg-yellow-100 text-yellow-700'
    },
    emerald: {
      bg: 'from-emerald-500 to-emerald-600',
      shadow: 'shadow-emerald-500/20',
      badge: 'bg-emerald-100 text-emerald-700'
    }
  }

  const estilo = cores[cor]

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-2">{titulo}</p>
            <h3 className="text-3xl font-bold text-slate-900 mb-1">{valor}</h3>
            {subtitulo && (
              <p className="text-sm text-slate-500">{subtitulo}</p>
            )}
            {tendencia && (
              <div className={`inline-flex items-center gap-1 mt-3 px-2 py-1 rounded-lg text-xs font-semibold ${estilo.badge}`}>
                <span>{tendencia.positivo ? '↑' : '↓'}</span>
                <span>{tendencia.valor}</span>
              </div>
            )}
          </div>
          
          <div className={`w-14 h-14 bg-gradient-to-br ${estilo.bg} rounded-xl flex items-center justify-center shadow-lg ${estilo.shadow}`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>
      
      {/* Barra decorativa inferior */}
      <div className={`h-1 bg-gradient-to-r ${estilo.bg}`}></div>
    </div>
  )
}
