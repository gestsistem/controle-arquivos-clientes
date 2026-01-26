import React from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'

interface ConfirmacaoExclusaoProps {
  titulo: string
  mensagem: string
  itemNome: string
  onConfirmar: () => void
  onCancelar: () => void
}

export function ConfirmacaoExclusao({ titulo, mensagem, itemNome, onConfirmar, onCancelar }: ConfirmacaoExclusaoProps) {
  return (
    <div className="fixed inset-0 bg-black/70 z-[100] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-[#0A2F2F] rounded-xl max-w-md w-full p-6 border-2 border-red-500 shadow-2xl my-8 animate-in fade-in zoom-in duration-200">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-center mb-3 text-red-400">
            {titulo}
          </h2>
          
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
            <p className="text-white font-bold text-center mb-2">"{itemNome}"</p>
            <p className="text-gray-300 text-sm text-center">{mensagem}</p>
          </div>
          
          <p className="text-yellow-300 text-sm text-center mb-6 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Esta ação não pode ser desfeita!
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onCancelar}
              className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-bold text-lg transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmar}
              className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
