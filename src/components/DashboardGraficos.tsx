import { Check, Clock, AlertCircle, Users, BarChart3, AlertTriangle } from 'lucide-react'

interface DashboardProps {
  clientes: any[]
  sistemas: any[]
  analistas: any[]
  stats: {
    total: number
    pendentes: number
    concluidos: number
    urgentes: number
    backupCritico: number
    atencao: number
    atrasados: number
  }
}

export function DashboardGraficos({ clientes, sistemas, analistas, stats }: DashboardProps) {
  return (
    <main className="flex-1 p-8 overflow-auto bg-gradient-to-br from-[#0A2F2F] to-[#051818]">
      {/* Cards Principais - Estilo "Hoje" */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 p-6 rounded-xl border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-400 text-sm font-medium">Enviados</p>
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className="text-4xl font-bold text-white">{clientes.filter(c => c.statusEnvio === 'Enviado' && c.ativo !== false).length}</p>
          <p className="text-gray-400 text-xs mt-1">Total no mês</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 p-6 rounded-xl border border-yellow-500/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-yellow-400 text-sm font-medium">Pendentes</p>
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
          <p className="text-4xl font-bold text-white">{stats.pendentes}</p>
          <p className="text-gray-400 text-xs mt-1">Aguardando envio</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 p-6 rounded-xl border border-orange-500/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-orange-400 text-sm font-medium">Backup Crítico</p>
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-400" />
            </div>
          </div>
          <p className="text-4xl font-bold text-white">{stats.backupCritico}</p>
          <p className="text-gray-400 text-xs mt-1">Sem backup</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-6 rounded-xl border border-blue-500/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-400 text-sm font-medium">Total</p>
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-4xl font-bold text-white">{stats.total}</p>
          <p className="text-gray-400 text-xs mt-1">Clientes ativos</p>
        </div>

        <div className="bg-gradient-to-br from-[#7FB069]/20 to-[#7FB069]/5 p-6 rounded-xl border-2 border-[#7FB069]/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[#7FB069] text-sm font-medium">SLA</p>
            <div className="w-10 h-10 bg-[#7FB069]/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#7FB069]" />
            </div>
          </div>
          <p className="text-4xl font-bold text-[#7FB069]">
            {stats.total > 0 ? ((stats.concluidos / stats.total) * 100).toFixed(2) : '0.00'}%
          </p>
          <p className="text-gray-400 text-xs mt-1">Taxa de conclusão</p>
        </div>
      </div>

      {/* Ranking de Analistas e Métricas Mensais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Ranking de Analistas */}
        <div className="bg-[#0A2F2F] p-6 rounded-xl border border-[#7FB069]/20">
          <h3 className="text-xl font-bold text-white mb-4">📊 Desempenho por Analista</h3>
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 pb-2 border-b border-gray-700">
              <span className="text-gray-400 text-xs font-bold">Analista</span>
              <span className="text-gray-400 text-xs font-bold text-center">Enviados</span>
              <span className="text-gray-400 text-xs font-bold text-center">Backups</span>
            </div>
            {analistas.slice(0, 7).map((analista: any) => {
              const clientesAnalista = clientes.filter(c => c.analista === analista.nome && c.ativo !== false)
              const enviados = clientesAnalista.filter(c => c.statusEnvio === 'Enviado').length
              const backups = clientesAnalista.filter(c => c.statusBackup === 'Feito').length
              const total = clientesAnalista.length
              const percentual = total > 0 ? Math.round((enviados / total) * 100) : 0
              
              return (
                <div key={analista.id} className="grid grid-cols-3 gap-2 py-2 rounded-lg hover:bg-[#0D3B3B] transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-full h-2 rounded-full overflow-hidden bg-gray-700">
                      <div className={`h-full ${percentual >= 80 ? 'bg-green-500' : percentual >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${percentual}%` }} />
                    </div>
                    <span className="text-white text-sm font-medium whitespace-nowrap">{analista.nome}</span>
                  </div>
                  <div className={`text-center px-3 py-1 rounded-lg ${enviados > 0 ? 'bg-green-500/20' : 'bg-gray-700/20'}`}>
                    <span className={`text-sm font-bold ${enviados > 0 ? 'text-green-400' : 'text-gray-500'}`}>{enviados}</span>
                  </div>
                  <div className={`text-center px-3 py-1 rounded-lg ${backups > 0 ? 'bg-blue-500/20' : 'bg-gray-700/20'}`}>
                    <span className={`text-sm font-bold ${backups > 0 ? 'text-blue-400' : 'text-gray-500'}`}>{backups}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Métricas Mensais */}
        <div className="bg-[#0A2F2F] p-6 rounded-xl border border-[#7FB069]/20">
          <h3 className="text-xl font-bold text-white mb-4">📅 Métricas do Mês</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-500/10 to-transparent p-4 rounded-lg border border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Enviados</span>
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{clientes.filter(c => c.statusEnvio === 'Enviado' && c.ativo !== false).length}</p>
              <p className="text-green-400 text-xs mt-1 font-medium">Meta: {stats.total}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-transparent p-4 rounded-lg border border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Enviados Hoje</span>
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{clientes.filter(c => c.statusEnvio === 'Enviado' && c.ativo !== false && c.mesReferencia === new Date().toISOString().slice(0, 7)).length}</p>
              <p className="text-blue-400 text-xs mt-1 font-medium">Este mês</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-transparent p-4 rounded-lg border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Tempo Médio</span>
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{Math.round(stats.pendentes / Math.max(analistas.length, 1))}</p>
              <p className="text-purple-400 text-xs mt-1 font-medium">Por analista</p>
            </div>

            <div className="bg-gradient-to-br from-red-500/10 to-transparent p-4 rounded-lg border border-red-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Críticos Hoje</span>
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{stats.backupCritico + stats.atrasados}</p>
              <p className="text-red-400 text-xs mt-1 font-medium">Requerem atenção</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Barras */}
      <div className="bg-[#0A2F2F] p-6 rounded-xl border border-[#7FB069]/20">
        <h3 className="text-xl font-bold text-white mb-4">📈 Evolução Mensal - Pendentes vs Concluídos</h3>
        <div className="h-80">
          <div className="flex items-end justify-between h-full gap-2 px-4">
            {(() => {
              const meses = []
              const hoje = new Date()
              for (let i = 5; i >= 0; i--) {
                const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
                const mesStr = data.toISOString().slice(0, 7)
                const mesNome = data.toLocaleDateString('pt-BR', { month: 'short' })
                
                const pendentes = clientes.filter(c => c.mesReferencia === mesStr && c.statusEnvio !== 'Enviado' && c.ativo !== false).length
                const concluidos = clientes.filter(c => c.mesReferencia === mesStr && c.statusEnvio === 'Enviado' && c.ativo !== false).length
                const maxValor = Math.max(pendentes, concluidos, 1)
                
                meses.push(
                  <div key={mesStr} className="flex-1 flex flex-col items-center gap-2 h-full">
                    <div className="flex-1 w-full flex items-end justify-center gap-1">
                      <div className="flex-1 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg relative group hover:from-yellow-400 hover:to-yellow-300 transition-all" style={{ height: `${(pendentes / maxValor) * 100}%`, minHeight: pendentes > 0 ? '20px' : '0' }}>
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">{pendentes}</span>
                      </div>
                      <div className="flex-1 bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg relative group hover:from-green-400 hover:to-green-300 transition-all" style={{ height: `${(concluidos / maxValor) * 100}%`, minHeight: concluidos > 0 ? '20px' : '0' }}>
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-green-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">{concluidos}</span>
                      </div>
                    </div>
                    <span className="text-gray-400 text-xs font-medium">{mesNome}</span>
                  </div>
                )
              }
              return meses
            })()}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-gray-400 text-sm">Pendentes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-400 text-sm">Concluídos</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}