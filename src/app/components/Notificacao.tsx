import React, { useEffect } from 'react'
import { motion } from 'motion/react'
import { Check, AlertTriangle, Info, X } from 'lucide-react'

interface NotificacaoProps {
  tipo: 'sucesso' | 'erro' | 'aviso' | 'info'
  titulo: string
  mensagem: string
  onFechar: () => void
}

export function Notificacao({ tipo, titulo, mensagem, onFechar }: NotificacaoProps) {
  useEffect(() => {
    const timer = setTimeout(onFechar, 6000)
    return () => clearTimeout(timer)
  }, [onFechar])

  const configs = {
    sucesso: { icone: Check, iconBg: 'bg-emerald-500/15', border: 'border-emerald-500/40', iconColor: 'text-emerald-400', titleColor: 'text-emerald-300', btnBg: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30', barColor: 'bg-emerald-500' },
    erro: { icone: X, iconBg: 'bg-red-500/15', border: 'border-red-500/40', iconColor: 'text-red-400', titleColor: 'text-red-300', btnBg: 'bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30', barColor: 'bg-red-500' },
    aviso: { icone: AlertTriangle, iconBg: 'bg-amber-500/15', border: 'border-amber-500/40', iconColor: 'text-amber-400', titleColor: 'text-amber-300', btnBg: 'bg-amber-500/20 border-amber-500/30 text-amber-300 hover:bg-amber-500/30', barColor: 'bg-amber-500' },
    info: { icone: Info, iconBg: 'bg-blue-500/15', border: 'border-blue-500/40', iconColor: 'text-blue-400', titleColor: 'text-blue-300', btnBg: 'bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30', barColor: 'bg-blue-500' },
  }

  const config = configs[tipo]
  const Icone = config.icone

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}>
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: -10 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="rounded-2xl max-w-sm w-full border shadow-2xl overflow-hidden"
        style={{ background: '#091212', borderColor: 'rgba(127,176,105,0.1)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}
      >
        {/* Barra de progresso (auto-fechar em 6s) */}
        <div className="h-1 w-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <motion.div
            className={`h-full ${config.barColor}`}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 6, ease: 'linear' }}
          />
        </div>

        <div className="p-6">
          <div className={`w-14 h-14 ${config.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4 border ${config.border}`}>
            <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 0.4, delay: 0.15 }}>
              <Icone className={`w-7 h-7 ${config.iconColor}`} />
            </motion.div>
          </div>
          <h2 className={`text-lg font-bold text-center mb-2 ${config.titleColor}`}>{titulo}</h2>
          <p className="text-gray-400 text-sm text-center whitespace-pre-line leading-relaxed mb-5">{mensagem}</p>
          <button
            onClick={onFechar}
            autoFocus
            className={`w-full py-2.5 px-4 rounded-xl border font-medium text-sm transition-all ${config.btnBg}`}
          >
            OK
          </button>
        </div>
      </motion.div>
    </div>
  )
}
