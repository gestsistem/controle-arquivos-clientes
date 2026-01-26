import React from 'react'
import { Check, AlertTriangle, Info, X } from 'lucide-react'

interface NotificacaoProps {
  tipo: 'sucesso' | 'erro' | 'aviso' | 'info'
  titulo: string
  mensagem: string
  onFechar: () => void
}

export function Notificacao({ tipo, titulo, mensagem, onFechar }: NotificacaoProps) {
  const configs = {
    sucesso: {
      icone: Check,
      cor: 'green',
      bordaCor: 'border-green-500',
      bgCor: 'bg-green-500/10',
      iconeCor: 'text-green-400',
      tituloCor: 'text-green-400'
    },
    erro: {
      icone: X,
      cor: 'red',
      bordaCor: 'border-red-500',
      bgCor: 'bg-red-500/10',
      iconeCor: 'text-red-400',
      tituloCor: 'text-red-400'
    },
    aviso: {
      icone: AlertTriangle,
      cor: 'yellow',
      bordaCor: 'border-yellow-500',
      bgCor: 'bg-yellow-500/10',
      iconeCor: 'text-yellow-400',
      tituloCor: 'text-yellow-400'
    },
    info: {
      icone: Info,
      cor: 'blue',
      bordaCor: 'border-blue-500',
      bgCor: 'bg-blue-500/10',
      iconeCor: 'text-blue-400',
      tituloCor: 'text-blue-400'
    }
  }

  const config = configs[tipo]
  const Icone = config.icone

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className={`bg-[#0A2F2F] rounded-xl max-w-md w-full p-6 border-2 ${config.bordaCor} shadow-2xl my-8 animate-in fade-in zoom-in duration-200`}>
          <div className={`w-16 h-16 rounded-full ${config.bgCor} flex items-center justify-center mx-auto mb-4`}>
            <Icone className={`w-8 h-8 ${config.iconeCor}`} />
          </div>
          
          <h2 className={`text-2xl font-bold text-center mb-3 ${config.tituloCor}`}>
            {titulo}
          </h2>
          
          <p className="text-gray-300 text-center mb-6 whitespace-pre-line">
            {mensagem}
          </p>
          
          <button
            onClick={onFechar}
            className={`w-full py-3 px-4 bg-${config.cor}-500 hover:bg-${config.cor}-600 text-white rounded-lg font-bold text-lg transition-all`}
            autoFocus
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}