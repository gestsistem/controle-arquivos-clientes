import React from 'react'
import { Database, Copy, Check } from 'lucide-react'

export function InstrucoesSQL() {
  const [copiado, setCopiado] = React.useState(false)
  const [selecionado, setSelecionado] = React.useState(false)
  const codeRef = React.useRef<HTMLPreElement>(null)

  const sqlScript = `-- Adicionar colunas mes_referencia, mes_atrasado, cnpj, motivo_sem_backup e aba_atual na tabela clientes

ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS mes_referencia TEXT,
ADD COLUMN IF NOT EXISTS mes_atrasado TEXT,
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS motivo_sem_backup TEXT,
ADD COLUMN IF NOT EXISTS aba_atual TEXT;

-- Atualizar valores padrão para mês atual nos clientes existentes
UPDATE clientes
SET mes_referencia = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
WHERE mes_referencia IS NULL;

-- Definir aba_atual padrão baseada nos status existentes
UPDATE clientes
SET aba_atual = CASE
  WHEN status_envio = 'Enviado' AND status_backup = 'Feito' THEN 'concluidos'
  WHEN status_envio = 'Enviado' AND status_backup = 'Pendente' AND motivo_sem_backup IS NOT NULL THEN 'atencao'
  WHEN status_envio = 'Enviado' AND status_backup = 'Pendente' AND motivo_sem_backup IS NULL THEN 'backupCritico'
  WHEN status_envio != 'Enviado' AND status_backup = 'Feito' THEN 'atencao'
  ELSE 'pendentes'
END
WHERE aba_atual IS NULL;

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_clientes_mes_referencia ON clientes(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_clientes_mes_atrasado ON clientes(mes_atrasado);
CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON clientes(cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_aba_atual ON clientes(aba_atual);`

  const copiarSQL = async () => {
    let copiouComSucesso = false
    
    // Método 1: Tentar Clipboard API moderna
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(sqlScript)
        copiouComSucesso = true
      }
    } catch (err) {
      console.log('Clipboard API falhou, tentando fallback...', err)
      // Não fazer nada, vai tentar o fallback
    }
    
    // Método 2: Fallback usando textarea (se Método 1 falhou)
    if (!copiouComSucesso) {
      try {
        const textarea = document.createElement('textarea')
        textarea.value = sqlScript
        textarea.style.position = 'fixed'
        textarea.style.left = '-999999px'
        textarea.style.top = '-999999px'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        
        const successful = document.execCommand('copy')
        document.body.removeChild(textarea)
        
        if (successful) {
          copiouComSucesso = true
        }
      } catch (err) {
        console.error('Fallback também falhou:', err)
      }
    }
    
    // Mostrar resultado
    if (copiouComSucesso) {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } else {
      alert('❌ Não foi possível copiar automaticamente.\n\nPor favor, SELECIONE o texto SQL abaixo e copie manualmente (Ctrl+C ou Cmd+C).')
    }
  }

  const selecionarSQL = () => {
    if (codeRef.current) {
      const range = document.createRange()
      range.selectNodeContents(codeRef.current)
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
      }
      setSelecionado(true)
      setTimeout(() => setSelecionado(false), 2000)
    }
  }

  return (
    <div className="bg-yellow-500/10 border-2 border-yellow-500 rounded-xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <Database className="w-8 h-8 text-yellow-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-xl font-bold text-yellow-400 mb-2">⚠️ Atualização de Banco de Dados Necessária</h3>
          <p className="text-white mb-4">
            Para usar os novos recursos (filtro de mês, CNPJ, justificativas e abas automáticas), você precisa adicionar as colunas <code className="bg-black/30 px-2 py-1 rounded text-yellow-300">mes_referencia</code>, <code className="bg-black/30 px-2 py-1 rounded text-yellow-300">mes_atrasado</code>, <code className="bg-black/30 px-2 py-1 rounded text-yellow-300">cnpj</code>, <code className="bg-black/30 px-2 py-1 rounded text-yellow-300">motivo_sem_backup</code> e <code className="bg-black/30 px-2 py-1 rounded text-yellow-300">aba_atual</code> no Supabase.
          </p>
          
          <div className="bg-black/30 rounded-lg p-4 mb-4 relative">
            <div className="flex gap-2 absolute top-3 left-3 right-3 z-10">
              <button
                onClick={selecionarSQL}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm font-medium"
              >
                {selecionado ? (
                  <>
                    <Check className="w-4 h-4" />
                    Selecionado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Selecionar SQL
                  </>
                )}
              </button>
              <button
                onClick={copiarSQL}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#7FB069] text-white rounded-lg hover:bg-[#6A9A56] text-sm font-medium"
              >
                {copiado ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar SQL
                  </>
                )}
              </button>
            </div>
            <pre className="text-green-300 text-sm overflow-x-auto pt-12 select-all cursor-text" ref={codeRef}>
              <code>{sqlScript}</code>
            </pre>
          </div>

          <div className="space-y-2 text-gray-300 text-sm">
            <p className="font-bold text-white">📋 Como executar:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Clique em <strong className="text-yellow-400">"Copiar SQL"</strong> acima (ou selecione o texto manualmente)</li>
              <li>Abra seu projeto no Supabase Dashboard</li>
              <li>Vá em <strong className="text-yellow-400">SQL Editor</strong> (menu lateral)</li>
              <li>Cole o código SQL e clique em <strong className="text-yellow-400">RUN</strong></li>
              <li>Aguarde a confirmação "Success"</li>
              <li>Recarregue esta página (F5)</li>
            </ol>
          </div>

          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-green-400 text-sm">
              ✅ <strong>Seguro:</strong> Este script não apaga nenhum dado existente, apenas adiciona novas colunas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}