import React from 'react'
import { Search, Plus, RefreshCw, Download, Upload, Filter, Settings, User } from 'lucide-react'

interface HeaderProps {
  titulo: string
  pesquisa: string
  onPesquisaChange: (value: string) => void
  supabaseStatus: {
    conectado: boolean
    mensagem: string
    ultimaVerificacao: string | null
  }
  onNovoCliente?: () => void
  onAtualizar?: () => void
  onImportar?: () => void
  onExportar?: () => void
  onFiltros?: () => void
  onConfiguracao?: () => void
  loading?: boolean
  showActions?: boolean
}

export function Header({ 
  titulo, 
  pesquisa, 
  onPesquisaChange,
  supabaseStatus,
  onNovoCliente,
  onAtualizar,
  onImportar,
  onExportar,
  onFiltros,
  onConfiguracao,
  loading = false,
  showActions = true
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="px-8 py-4">
        {/* Linha Superior */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{titulo}</h1>
            <p className="text-sm text-slate-500 mt-1">Gerencie seus clientes e operações</p>
          </div>
          
          {/* Status e User */}
          <div className="flex items-center gap-4">
            {/* Status Supabase */}
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <div className={`w-2.5 h-2.5 rounded-full ${supabaseStatus.conectado ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-xs font-medium text-slate-700">
                {supabaseStatus.conectado ? 'Online' : 'Offline'}
              </span>
              {supabaseStatus.ultimaVerificacao && (
                <span className="text-xs text-slate-500">• {supabaseStatus.ultimaVerificacao}</span>
              )}
            </div>
            
            {/* User Avatar */}
            <button className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
              <User className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Linha Inferior - Pesquisa e Ações */}
        {showActions && (
          <div className="flex items-center gap-3">
            {/* Barra de Pesquisa */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={pesquisa}
                onChange={(e) => onPesquisaChange(e.target.value)}
                placeholder="Buscar clientes por nome, sistema, analista..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center gap-2">
              {onFiltros && (
                <button
                  onClick={onFiltros}
                  className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2 font-medium text-sm shadow-sm"
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                </button>
              )}

              {onAtualizar && (
                <button
                  onClick={onAtualizar}
                  disabled={loading}
                  className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium text-sm shadow-md disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              )}

              {onImportar && (
                <button
                  onClick={onImportar}
                  className="px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors flex items-center gap-2 font-medium text-sm shadow-md"
                >
                  <Upload className="w-4 h-4" />
                  Importar
                </button>
              )}

              {onExportar && (
                <button
                  onClick={onExportar}
                  className="px-4 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors flex items-center gap-2 font-medium text-sm shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
              )}

              {onNovoCliente && (
                <button
                  onClick={onNovoCliente}
                  className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center gap-2 font-semibold text-sm shadow-lg shadow-emerald-500/30"
                >
                  <Plus className="w-4 h-4" />
                  Novo Cliente
                </button>
              )}

              {onConfiguracao && (
                <button
                  onClick={onConfiguracao}
                  className="px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 font-medium text-sm shadow-md"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
