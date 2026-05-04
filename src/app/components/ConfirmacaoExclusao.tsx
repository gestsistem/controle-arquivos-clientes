import React from 'react'
import { motion } from 'motion/react'
import { AlertTriangle, Trash2, X } from 'lucide-react'

interface ConfirmacaoExclusaoProps {
  titulo: string
  mensagem: string
  itemNome: string
  onConfirmar: () => void
  onCancelar: () => void
}

export function ConfirmacaoExclusao({ titulo, mensagem, itemNome, onConfirmar, onCancelar }: ConfirmacaoExclusaoProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="rounded-2xl max-w-sm w-full border shadow-2xl overflow-hidden"
        style={{ background: '#0A1212', borderColor: 'rgba(239,68,68,0.3)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}
      >
        <div className="h-1 bg-red-500" />
        <div className="p-6">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <motion.div animate={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 0.4, delay: 0.2 }}>
              <Trash2 className="w-7 h-7 text-red-400" />
            </motion.div>
          </div>
          <h2 className="text-lg font-bold text-center text-red-300 mb-3">{titulo}</h2>
          <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3 mb-4 text-center">
            <p className="text-white font-bold mb-1">"{itemNome}"</p>
            <p className="text-gray-400 text-sm">{mensagem}</p>
          </div>
          <p className="text-amber-400/70 text-xs text-center mb-5">⚠️ Esta ação não pode ser desfeita!</p>
          <div className="flex gap-3">
            <button onClick={onCancelar} className="flex-1 py-2.5 px-4 border border-white/10 text-gray-400 rounded-xl hover:bg-white/5 transition-all text-sm font-medium">Cancelar</button>
            <button onClick={onConfirmar} className="flex-1 py-2.5 px-4 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl hover:bg-red-500/30 transition-all font-bold text-sm flex items-center justify-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />Excluir
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
