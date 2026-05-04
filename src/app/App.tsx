import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Plus, RefreshCw, Check, X, Clock, AlertTriangle, Download, Upload, BarChart3, Settings, Users, Home, Zap, Lock, AlertCircle, Bell, RotateCcw, Eye, List, Edit, Trash2, Copy, Database, Wifi, WifiOff, TrendingUp, Shield, Activity } from 'lucide-react'
import * as XLSX from 'xlsx'
import * as supabase from './utils/supabaseClient'
import logoGestao from 'figma:asset/a321a7617817ca81ff7148355ebf7ba1e1aa7b03.png'
import { InstrucoesSQL } from './components/InstrucoesSQL'
import { Notificacao } from './components/Notificacao'
import { ConfirmacaoExclusao } from './components/ConfirmacaoExclusao'
import { DashboardGraficos } from './components/DashboardGraficos'

const SENHA_ADMIN = 'Gestao2042**'

type StatusEnvio = 'Enviado' | 'Pendente' | 'Recém Implantado' | 'Gerencial' | 'Inativo' | 'Não Teve Vendas' | 'Bloqueio SEFAZ' | 'Bloqueio Financeiro'
type AbaType = 'dashboard' | 'pendentes' | 'concluidos' | 'backupCritico' | 'atencao' | 'listagem' | 'configuracoes'
type AbaCliente = 'pendentes' | 'concluidos' | 'backupCritico' | 'atencao'

interface Cliente {
  id: string
  nome: string
  sistema: string
  emails: string[]
  telefone: string
  cnpj?: string
  statusEnvio: StatusEnvio
  statusBackup: 'Feito' | 'Pendente'
  analista: string
  analistaBackup?: string
  urgente?: boolean
  ativo: boolean
  motivoSemBackup?: string
  atrasado?: boolean
  mesAtrasado?: string
  abaAtual?: AbaCliente
  mesReferencia?: string
}

interface Sistema { id: string; nome: string }
interface Analista { id: string; nome: string }

// ─────────────────────────────────────────────
// Sidebar nav item component
// ─────────────────────────────────────────────
function NavItem({ icon: Icon, label, active, onClick, badge, badgeColor = 'bg-yellow-500', pulse = false }: {
  icon: any, label: string, active: boolean, onClick: () => void,
  badge?: number | string, badgeColor?: string, pulse?: boolean
}) {
  return (
    <motion.button
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1.5 transition-all duration-200 relative group ${
        active
          ? 'bg-gradient-to-r from-[#7FB069] to-[#6A9A56] text-white shadow-lg shadow-[#7FB069]/25'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <span className={`${active ? 'text-white' : 'text-gray-400 group-hover:text-[#7FB069]'} transition-colors`}>
        <Icon className="w-5 h-5" />
      </span>
      <span className="font-medium text-sm">{label}</span>
      {badge !== undefined && badge !== 0 && (
        <span className={`ml-auto ${badgeColor} text-white text-xs px-2 py-0.5 rounded-full font-bold min-w-[20px] text-center ${pulse ? 'animate-pulse' : ''}`}>
          {badge}
        </span>
      )}
    </motion.button>
  )
}

// ─────────────────────────────────────────────
// Status badge component
// ─────────────────────────────────────────────
function StatusBadge({ status, type }: { status: string, type: 'envio' | 'backup' }) {
  const colors = {
    'Enviado': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    'Feito': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    'Pendente': 'bg-gray-500/20 text-gray-400 border-gray-500/40',
    'Recém Implantado': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    'Gerencial': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    'Inativo': 'bg-gray-600/20 text-gray-400 border-gray-600/40',
    'Não Teve Vendas': 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    'Bloqueio SEFAZ': 'bg-red-500/20 text-red-300 border-red-500/40',
    'Bloqueio Financeiro': 'bg-pink-500/20 text-pink-300 border-pink-500/40',
  } as Record<string, string>
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs border font-medium ${colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/40'}`}>
      {status}
    </span>
  )
}

export default function App() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [sistemas, setSistemas] = useState<Sistema[]>([])
  const [analistas, setAnalistas] = useState<Analista[]>([])
  const [loading, setLoading] = useState(true)
  const [sincronizando, setSincronizando] = useState(false)
  const [abaSelecionada, setAbaSelecionada] = useState<AbaType>('pendentes')
  const [dbStatus, setDbStatus] = useState<{clientes: number, analistas: number, sistemas: number, ok: boolean} | null>(null)
  const [checkingDb, setCheckingDb] = useState(false)

  const [pesquisa, setPesquisa] = useState('')
  const [filtroSistema, setFiltroSistema] = useState('')
  const [filtroUrgente, setFiltroUrgente] = useState(false)
  const [filtroInativos, setFiltroInativos] = useState(false)
  const [letraSelecionada, setLetraSelecionada] = useState('')
  const [filtroMes, setFiltroMes] = useState('')

  const [showModalCliente, setShowModalCliente] = useState(false)
  const [showModalSistema, setShowModalSistema] = useState(false)
  const [showModalAnalista, setShowModalAnalista] = useState(false)
  const [showModalSenha, setShowModalSenha] = useState(false)
  const [showModalMotivo, setShowModalMotivo] = useState(false)
  const [showModalReset, setShowModalReset] = useState(false)
  const [showModalDetalhes, setShowModalDetalhes] = useState(false)
  const [showModalEnvio, setShowModalEnvio] = useState(false)
  const [showModalAnalistaBackup, setShowModalAnalistaBackup] = useState(false)
  const [showModalEmail, setShowModalEmail] = useState(false)
  const [clienteMotivo, setClienteMotivo] = useState<Cliente | null>(null)
  const [clienteDetalhes, setClienteDetalhes] = useState<Cliente | null>(null)
  const [clienteEnvio, setClienteEnvio] = useState<Cliente | null>(null)
  const [clienteBackup, setClienteBackup] = useState<Cliente | null>(null)
  const [clienteEmail, setClienteEmail] = useState<Cliente | null>(null)
  const [analistaEmailNome, setAnalistaEmailNome] = useState('')
  const [motivoBackup, setMotivoBackup] = useState('')
  const [analistaEnvio, setAnalistaEnvio] = useState('')
  const [analistaBackup, setAnalistaBackup] = useState('')
  const [senhaDigitada, setSenhaDigitada] = useState('')

  const [notificacao, setNotificacao] = useState<{tipo: 'sucesso' | 'erro' | 'aviso' | 'info', titulo: string, mensagem: string} | null>(null)
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState<{tipo: 'sistema' | 'analista', item: any} | null>(null)

  const [colunaAbaAtualExiste, setColunaAbaAtualExiste] = useState(true)

  const [novoCliente, setNovoCliente] = useState({ nome: '', sistema: '', emails: [''], telefone: '', cnpj: '', analista: '' })
  const [novoSistema, setNovoSistema] = useState({ nome: '' })
  const [novoAnalista, setNovoAnalista] = useState({ nome: '' })

  const statusEspeciais: StatusEnvio[] = ['Recém Implantado', 'Gerencial', 'Inativo', 'Não Teve Vendas', 'Bloqueio SEFAZ', 'Bloqueio Financeiro']

  useEffect(() => { carregarDados() }, [])

  const carregarDados = async () => {
    setLoading(true)
    try {
      const [clientesData, sistemasData, analistasData] = await Promise.all([
        supabase.getClientes(),
        supabase.getSistemas(),
        supabase.getAnalistas()
      ])

      if (clientesData.length > 0 && clientesData[0].abaAtual !== undefined) {
        setColunaAbaAtualExiste(true)
      } else if (clientesData.length > 0) {
        setColunaAbaAtualExiste(false)
      }

      const clientesComAba = clientesData.map((c: Cliente) => {
        const mesAtual = new Date().toISOString().slice(0, 7)

        // Se INATIVO, manter sem processar abaAtual para fins de display
        if (c.ativo === false) {
          return {
            ...c,
            abaAtual: c.abaAtual || 'pendentes',
            mesReferencia: c.mesReferencia || mesAtual
          }
        }

        if (c.abaAtual && c.abaAtual !== 'pendentes') {
          return {
            ...c,
            mesReferencia: c.mesReferencia || mesAtual,
            mesAtrasado: (c.atrasado && !c.mesAtrasado) ? mesAtual : c.mesAtrasado
          }
        }

        let abaCalculada: AbaCliente = 'pendentes'

        if (c.atrasado) {
          return {
            ...c,
            abaAtual: 'pendentes',
            mesReferencia: c.mesReferencia || mesAtual,
            mesAtrasado: (c.atrasado && !c.mesAtrasado) ? mesAtual : c.mesAtrasado
          }
        }

        if (statusEspeciais.includes(c.statusEnvio)) {
          abaCalculada = 'atencao'
        } else if (c.statusEnvio === 'Enviado' && c.statusBackup === 'Pendente') {
          abaCalculada = 'backupCritico'
        }

        return {
          ...c,
          abaAtual: abaCalculada,
          mesReferencia: c.mesReferencia || mesAtual,
          mesAtrasado: (c.atrasado && !c.mesAtrasado) ? mesAtual : c.mesAtrasado
        }
      })

      setClientes(clientesComAba)
      setSistemas(sistemasData)
      setAnalistas(analistasData)
      await sincronizarSistemas(clientesComAba, sistemasData)
    } catch (error) {
      // Erro ao carregar dados
    } finally {
      setLoading(false)
    }
  }

  const sincronizarSistemas = async (clientes: Cliente[], sistemasAtuais: Sistema[], mostrarMensagem = false) => {
    try {
      setSincronizando(true)
      const sistemasNosClientes = [...new Set(clientes.map(c => c.sistema).filter(s => s && s.trim()))]
      const sistemasExistentes = sistemasAtuais.map(s => s.nome.toLowerCase())
      const sistemasNovos = sistemasNosClientes.filter(s => !sistemasExistentes.includes(s.toLowerCase()))

      if (sistemasNovos.length > 0) {
        const novosSistemasAdicionados: Sistema[] = []
        for (const nomeSistema of sistemasNovos) {
          const novoSistema: Sistema = { id: `sistema-${Date.now()}-${Math.random()}`, nome: nomeSistema.trim() }
          await supabase.addSistema(novoSistema)
          novosSistemasAdicionados.push(novoSistema)
        }
        setSistemas(prev => [...prev, ...novosSistemasAdicionados])
        if (mostrarMensagem) setNotificacao({ tipo: 'sucesso', titulo: 'Sistemas Sincronizados!', mensagem: `${sistemasNovos.length} sistema(s) adicionado(s)` })
      } else {
        if (mostrarMensagem) setNotificacao({ tipo: 'info', titulo: 'Sistemas Atualizados', mensagem: 'Todos os sistemas já estão sincronizados!' })
      }
    } catch (error) {
      if (mostrarMensagem) setNotificacao({ tipo: 'erro', titulo: 'Erro na Sincronização', mensagem: 'Não foi possível sincronizar os sistemas.' })
    } finally {
      setSincronizando(false)
    }
  }

  const verificarBancoDados = async () => {
    setCheckingDb(true)
    try {
      const resultado = await supabase.testarConexao()
      if (resultado.sucesso) {
        setDbStatus({ ...resultado.dados!, ok: true })
        setNotificacao({ tipo: 'sucesso', titulo: '✅ Banco Conectado!', mensagem: `Clientes: ${resultado.dados!.clientes} | Analistas: ${resultado.dados!.analistas} | Sistemas: ${resultado.dados!.sistemas}` })
      } else {
        setDbStatus({ clientes: 0, analistas: 0, sistemas: 0, ok: false })
        setNotificacao({ tipo: 'erro', titulo: '❌ Erro de Conexão', mensagem: resultado.erro || 'Não foi possível conectar ao banco.' })
      }
    } catch (e) {
      setDbStatus({ clientes: 0, analistas: 0, sistemas: 0, ok: false })
    } finally {
      setCheckingDb(false)
    }
  }

  const gerarMesAnterior = () => {
    const hoje = new Date()
    const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    return {
      nome: meses[mesAnterior.getMonth()],
      ano: mesAnterior.getFullYear(),
      primeiroDia: `01/${String(mesAnterior.getMonth() + 1).padStart(2, '0')}/${mesAnterior.getFullYear()}`,
      ultimoDia: new Date(mesAnterior.getFullYear(), mesAnterior.getMonth() + 1, 0).getDate() + `/${String(mesAnterior.getMonth() + 1).padStart(2, '0')}/${mesAnterior.getFullYear()}`
    }
  }

  const gerarAssuntoEmail = (cliente: Cliente) => {
    const mes = gerarMesAnterior()
    return `Encaminhamento de Arquivos Fiscais – ${mes.nome}/${mes.ano} – ${cliente.nome}`
  }

  const gerarCorpoEmail = (cliente: Cliente, analistaNome: string) => {
    const mes = gerarMesAnterior()
    return `Prezados,\n \nBoa tarde!\nEspero que estejam bem.\n \nSou ${analistaNome}, da Gestão Sistemas, e encaminho em anexo os arquivos fiscais referentes ao período de ${mes.primeiroDia} a ${mes.ultimoDia}.\n \nDados da empresa:\nCNPJ: ${cliente.cnpj || 'Não informado'}\nRazão Social: ${cliente.nome}\n \nInformamos que este e-mail é utilizado apenas para o envio automático de arquivos fiscais, portanto as respostas a esta mensagem não são monitoradas.\nEm caso de dúvidas, pendências ou necessidade de suporte, solicitamos que entrem em contato com nossa equipe através do WhatsApp: (77) 9 9861-9990.\n \nAgradecemos pela atenção e permanecemos à disposição.\n \nAtenciosamente,\n${analistaNome}\nGestão Sistemas\n📞 (77) 9 9861-9990\n📧 suporte@gestaosistemas.com.br`
  }

  const copiarParaClipboard = (texto: string, tipo: 'assunto' | 'corpo') => {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = texto
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setNotificacao({ tipo: 'sucesso', titulo: 'Copiado!', mensagem: tipo === 'assunto' ? 'Assunto copiado! ✓' : 'Corpo copiado! ✓' })
    } catch (error) {
      setNotificacao({ tipo: 'erro', titulo: 'Erro ao Copiar', mensagem: 'Selecione o texto e use Ctrl+C.' })
    }
  }

  const finalizarCliente = async () => {
    if (!clienteEmail || !analistaEmailNome || !analistaBackup) return
    try {
      const mesAtual = new Date().toISOString().slice(0, 7)
      try {
        await supabase.updateCliente(clienteEmail.id, { statusEnvio: 'Enviado', statusBackup: 'Feito', analista: analistaEmailNome, analistaBackup, mesReferencia: mesAtual, abaAtual: 'concluidos' })
      } catch (err) {
        await supabase.updateCliente(clienteEmail.id, { statusEnvio: 'Enviado', statusBackup: 'Feito', analista: analistaEmailNome, analistaBackup, abaAtual: 'concluidos' })
      }
      setClientes(prev => prev.map(c => c.id === clienteEmail.id ? { ...c, statusEnvio: 'Enviado' as StatusEnvio, statusBackup: 'Feito' as const, abaAtual: 'concluidos' as AbaCliente, analista: analistaEmailNome, analistaBackup, mesReferencia: mesAtual } : c))
      setShowModalEmail(false); setClienteEmail(null); setAnalistaEmailNome(''); setAnalistaBackup(''); setClienteEnvio(null); setAnalistaEnvio('')
      setNotificacao({ tipo: 'sucesso', titulo: '✅ Cliente Concluído!', mensagem: `Envio: ${analistaEmailNome}\nBackup: ${analistaBackup}\n\nCliente movido para Concluídos!` })
    } catch (error) {
      setNotificacao({ tipo: 'erro', titulo: 'Erro ao Finalizar', mensagem: 'Não foi possível finalizar o cliente.' })
    }
  }

  const atualizarStatusRapido = async (clienteId: string, campo: 'statusEnvio' | 'statusBackup', novoValor: string) => {
    const cliente = clientes.find(c => c.id === clienteId)
    if (!cliente || cliente[campo] === novoValor) return
    if (campo === 'statusBackup' && novoValor === 'Feito') {
      setClienteBackup(cliente); setAnalistaBackup(''); setShowModalAnalistaBackup(true); return
    }
    try {
      const mesAtual = new Date().toISOString().slice(0, 7)
      const novaAba: AbaCliente = cliente.abaAtual || 'pendentes'
      await supabase.updateCliente(clienteId, { [campo]: novoValor, abaAtual: novaAba, mesReferencia: mesAtual })
      setClientes(prev => prev.map(c => c.id === clienteId ? { ...c, [campo]: novoValor, abaAtual: novaAba, mesReferencia: mesAtual } : c))
    } catch (error: any) {
      if (error.message && error.message.includes('aba_atual')) {
        setNotificacao({ tipo: 'erro', titulo: '⚠️ Banco Desatualizado', mensagem: 'Execute o script SQL para criar a coluna aba_atual.' })
      } else {
        setNotificacao({ tipo: 'erro', titulo: 'Erro ao Atualizar', mensagem: error.message || 'Não foi possível atualizar.' })
      }
    }
  }

  const marcarComoConcluido = async (clienteId: string) => {
    try {
      const cliente = clientes.find(c => c.id === clienteId)
      if (!cliente) return
      if (statusEspeciais.includes(cliente.statusEnvio)) {
        await supabase.updateCliente(clienteId, { statusEnvio: cliente.statusEnvio, statusBackup: cliente.statusBackup, abaAtual: 'atencao' })
        setClientes(prev => prev.map(c => c.id === clienteId ? { ...c, abaAtual: 'atencao' as AbaCliente } : c))
        setTimeout(() => { setAbaSelecionada('atencao'); setNotificacao({ tipo: 'aviso', titulo: 'Atenção Necessária!', mensagem: 'Cliente movido para a aba Atenção.' }) }, 300)
        return
      }
      setClienteEmail(cliente); setAnalistaEmailNome(cliente.analista || ''); setAnalistaBackup(cliente.analistaBackup || ''); setShowModalEmail(true)
    } catch (error) {
      setNotificacao({ tipo: 'erro', titulo: 'Erro ao Concluir', mensagem: 'Não foi possível concluir o cliente.' })
    }
  }

  const confirmarEnvio = async () => {
    if (!clienteEnvio) return
    try {
      if (clienteEnvio.statusBackup === 'Pendente') {
        setClienteMotivo({ ...clienteEnvio, statusEnvio: 'Enviado', statusBackup: 'Pendente', analista: analistaEnvio })
        setShowModalEnvio(false); setShowModalMotivo(true); return
      }
      if (clienteEnvio.statusBackup === 'Feito' && !clienteEnvio.analistaBackup) {
        setClienteBackup(clienteEnvio); setAnalistaBackup(''); setShowModalEnvio(false); setShowModalAnalistaBackup(true); return
      }
      if (clienteEnvio.statusBackup === 'Feito' && clienteEnvio.analistaBackup) {
        setClienteEmail(clienteEnvio); setAnalistaEmailNome(analistaEnvio); setShowModalEnvio(false); setShowModalEmail(true); return
      }
    } catch (error) {
      setNotificacao({ tipo: 'erro', titulo: 'Erro ao Concluir', mensagem: 'Não foi possível concluir.' })
    }
  }

  const salvarMotivoBackup = async () => {
    if (!clienteMotivo || !motivoBackup.trim()) { setNotificacao({ tipo: 'aviso', titulo: 'Campo Obrigatório', mensagem: 'Por favor, digite o motivo da justificativa.' }); return }
    try {
      const mesAtual = new Date().toISOString().slice(0, 7)
      try {
        await supabase.updateCliente(clienteMotivo.id, { statusEnvio: clienteMotivo.statusEnvio, statusBackup: clienteMotivo.statusBackup, analista: clienteMotivo.analista, motivoSemBackup: motivoBackup, abaAtual: 'backupCritico', mesReferencia: mesAtual })
      } catch (err) {
        await supabase.updateCliente(clienteMotivo.id, { statusEnvio: clienteMotivo.statusEnvio, statusBackup: clienteMotivo.statusBackup, analista: clienteMotivo.analista, motivoSemBackup: motivoBackup, abaAtual: 'backupCritico' })
      }
      setClientes(prev => prev.map(c => c.id === clienteMotivo.id ? { ...c, statusEnvio: clienteMotivo.statusEnvio, statusBackup: clienteMotivo.statusBackup, motivoSemBackup: motivoBackup, abaAtual: 'backupCritico' as AbaCliente, analista: clienteMotivo.analista, mesReferencia: mesAtual } : c))
      setShowModalMotivo(false); setMotivoBackup(''); setClienteMotivo(null); setAbaSelecionada('backupCritico')
      setNotificacao({ tipo: 'sucesso', titulo: 'Status Atualizado!', mensagem: 'Cliente movido para Backup Crítico com justificativa registrada.' })
    } catch (error) {
      setNotificacao({ tipo: 'erro', titulo: 'Erro ao Salvar', mensagem: 'Não foi possível salvar a justificativa.' })
    }
  }

  const confirmarAnalistaBackup = async () => {
    if (!clienteBackup || !analistaBackup.trim()) return
    try {
      const mesAtual = new Date().toISOString().slice(0, 7)
      try {
        await supabase.updateCliente(clienteBackup.id, { statusBackup: 'Feito', analistaBackup, mesReferencia: mesAtual })
      } catch (err) {
        await supabase.updateCliente(clienteBackup.id, { statusBackup: 'Feito', analistaBackup })
      }
      setClientes(prev => prev.map(c => c.id === clienteBackup.id ? { ...c, statusBackup: 'Feito', analistaBackup, mesReferencia: mesAtual } : c))
      setShowModalAnalistaBackup(false); setClienteBackup(null); setAnalistaBackup('')
      setNotificacao({ tipo: 'sucesso', titulo: '💾 Backup Registrado!', mensagem: `Backup feito por ${analistaBackup}.\n\nAgora clique em Concluir para finalizar.` })
    } catch (error) {
      setNotificacao({ tipo: 'erro', titulo: 'Erro ao Confirmar', mensagem: 'Não foi possível registrar o analista do backup.' })
    }
  }

  const gerarRelatorioExcelReset = (clientesDoMes: Cliente[], mesReferencia: string) => {
    const mesFormatado = formatarMes(mesReferencia)
    const resumoGeral = [{ 'MÊS': mesFormatado, 'TOTAL CLIENTES': clientesDoMes.length, 'ENVIADOS ✅': clientesDoMes.filter(c => c.statusEnvio === 'Enviado').length, 'PENDENTES ⏳': clientesDoMes.filter(c => c.statusEnvio !== 'Enviado').length, 'BACKUP FEITO 💾': clientesDoMes.filter(c => c.statusBackup === 'Feito').length, 'BACKUP PENDENTE': clientesDoMes.filter(c => c.statusBackup === 'Pendente').length, 'TAXA CONCLUSÃO': `${clientesDoMes.length > 0 ? Math.round((clientesDoMes.filter(c => c.statusEnvio === 'Enviado').length / clientesDoMes.length) * 100) : 0}%` }]
    const clientesEnviados = clientesDoMes.filter(c => c.statusEnvio === 'Enviado').map(c => ({ 'NOME': c.nome, 'SISTEMA': c.sistema, 'ANALISTA': c.analista || '-', 'STATUS ENVIO': c.statusEnvio, 'STATUS BACKUP': c.statusBackup, 'BACKUP POR': c.analistaBackup || '-', 'TELEFONE': c.telefone || '-', 'URGENTE': c.urgente ? 'SIM' : 'NÃO' }))
    const clientesPendentes = clientesDoMes.filter(c => c.statusEnvio !== 'Enviado').map(c => ({ 'NOME': c.nome, 'SISTEMA': c.sistema, 'ANALISTA': c.analista || '-', 'STATUS ENVIO': c.statusEnvio, 'STATUS BACKUP': c.statusBackup, 'TELEFONE': c.telefone || '-', 'URGENTE': c.urgente ? 'SIM' : 'NÃO', 'ATRASADO': c.atrasado ? 'SIM' : 'NÃO' }))
    const desempenhoPorAnalista = analistas.map(analista => {
      const ca = clientesDoMes.filter(c => c.analista === analista.nome)
      const env = ca.filter(c => c.statusEnvio === 'Enviado').length
      const bk = ca.filter(c => c.statusBackup === 'Feito').length
      return { 'ANALISTA': analista.nome, 'TOTAL CLIENTES': ca.length, 'ENVIADOS': env, 'PENDENTES': ca.length - env, 'TAXA ENVIO': ca.length > 0 ? `${Math.round((env / ca.length) * 100)}%` : '0%', 'BACKUPS FEITOS': bk, 'BACKUPS PENDENTES': ca.length - bk, 'TAXA BACKUP': ca.length > 0 ? `${Math.round((bk / ca.length) * 100)}%` : '0%' }
    })
    const desempenhoPorSistema = sistemas.map(sistema => {
      const cs = clientesDoMes.filter(c => c.sistema?.toUpperCase() === sistema.nome.toUpperCase())
      const env = cs.filter(c => c.statusEnvio === 'Enviado').length
      return { 'SISTEMA': sistema.nome, 'TOTAL CLIENTES': cs.length, 'ENVIADOS': env, 'PENDENTES': cs.length - env, 'TAXA CONCLUSÃO': cs.length > 0 ? `${Math.round((env / cs.length) * 100)}%` : '0%' }
    }).filter(s => s['TOTAL CLIENTES'] > 0)
    const backupCritico = clientesDoMes.filter(c => c.motivoSemBackup).map(c => ({ 'NOME': c.nome, 'SISTEMA': c.sistema, 'ANALISTA': c.analista || '-', 'STATUS BACKUP': c.statusBackup, 'JUSTIFICATIVA': c.motivoSemBackup || '', 'RESOLVIDO POR': c.analistaBackup || '-' }))
    const clientesAtrasados = clientesDoMes.filter(c => c.atrasado).map(c => ({ 'NOME': c.nome, 'SISTEMA': c.sistema, 'ANALISTA': c.analista || '-', 'STATUS ENVIO': c.statusEnvio, 'MÊS ATRASO': c.mesAtrasado ? formatarMes(c.mesAtrasado) : '-', 'TELEFONE': c.telefone || '-' }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumoGeral), '📊 RESUMO GERAL')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientesEnviados.length > 0 ? clientesEnviados : [{ 'INFO': 'Nenhum cliente enviado' }]), '✅ ENVIADOS')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientesPendentes.length > 0 ? clientesPendentes : [{ 'INFO': 'Nenhum cliente pendente' }]), '⏳ PENDENTES')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(desempenhoPorAnalista), '👥 POR ANALISTA')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(desempenhoPorSistema), '💼 POR SISTEMA')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(backupCritico.length > 0 ? backupCritico : [{ 'INFO': 'Nenhuma justificativa' }]), '📝 BACKUP CRÍTICO')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientesAtrasados.length > 0 ? clientesAtrasados : [{ 'INFO': 'Nenhum cliente atrasado' }]), '⚠️ ATRASADOS')
    XLSX.writeFile(wb, `Relatorio_Mensal_${mesReferencia}.xlsx`)
    return `Relatorio_Mensal_${mesReferencia}.xlsx`
  }

  const resetarMensal = async () => {
    try {
      const mesAtual = new Date().toISOString().slice(0, 7)
      const clientesDoMes = clientes.filter(c => c.ativo !== false && (!c.mesReferencia || c.mesReferencia === mesAtual))
      gerarRelatorioExcelReset(clientesDoMes, mesAtual)
      const todosClientes = await supabase.getClientes()
      let resetadosNormais = 0, marcadosAtrasados = 0, mantidos = 0
      const updates = todosClientes.map(async (cliente: any) => {
        if (!cliente.ativo) return
        if (cliente.atrasado) {
          try { await supabase.updateCliente(cliente.id, { statusEnvio: 'Pendente', statusBackup: 'Pendente', atrasado: true, mesReferencia: mesAtual, abaAtual: 'pendentes' }) } catch { await supabase.updateCliente(cliente.id, { statusEnvio: 'Pendente', statusBackup: 'Pendente', atrasado: true }) }
          mantidos++; return
        }
        if (cliente.motivoSemBackup && cliente.statusEnvio === 'Enviado' && cliente.statusBackup === 'Pendente') {
          try { await supabase.updateCliente(cliente.id, { statusEnvio: 'Pendente', statusBackup: 'Pendente', atrasado: false, mesReferencia: mesAtual, abaAtual: 'pendentes' }) } catch { await supabase.updateCliente(cliente.id, { statusEnvio: 'Pendente', statusBackup: 'Pendente', atrasado: false }) }
          mantidos++; return
        }
        if ((cliente.statusEnvio === 'Pendente' || cliente.statusBackup === 'Pendente') && cliente.statusEnvio !== 'Enviado') {
          try { await supabase.updateCliente(cliente.id, { statusEnvio: 'Pendente', statusBackup: 'Pendente', atrasado: true, mesAtrasado: mesAtual, mesReferencia: mesAtual, abaAtual: 'pendentes' }) } catch { await supabase.updateCliente(cliente.id, { statusEnvio: 'Pendente', statusBackup: 'Pendente', atrasado: true }) }
          marcadosAtrasados++; return
        }
        try { await supabase.updateCliente(cliente.id, { statusEnvio: 'Pendente', statusBackup: 'Pendente', atrasado: false, motivoSemBackup: null, mesReferencia: mesAtual, abaAtual: 'pendentes' }) } catch { await supabase.updateCliente(cliente.id, { statusEnvio: 'Pendente', statusBackup: 'Pendente', atrasado: false }) }
        resetadosNormais++
      })
      await Promise.all(updates)
      await carregarDados()
      setShowModalReset(false); setAbaSelecionada('pendentes')
      setNotificacao({ tipo: 'sucesso', titulo: '🔄 Reset Mensal Concluído!', mensagem: `✅ ${resetadosNormais} concluídos → Pendente\n⚠️ ${marcadosAtrasados} pendentes → ATRASADOS\n📌 ${mantidos} atrasados mantidos\n\nTodos na aba Pendentes!` })
    } catch (error) {
      setNotificacao({ tipo: 'erro', titulo: 'Erro no Reset', mensagem: 'Não foi possível realizar o reset mensal.' })
    }
  }

  const adicionarCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const nomeNovo = novoCliente.nome.trim()
      const nomeDuplicado = clientes.some(c => c.nome.toLowerCase() === nomeNovo.toLowerCase())
      if (nomeDuplicado) { setNotificacao({ tipo: 'erro', titulo: 'Nome Duplicado!', mensagem: `Já existe um cliente com o nome "${nomeNovo}".` }); return }
      const cliente: any = { id: crypto.randomUUID ? crypto.randomUUID() : `cliente-${Date.now()}`, nome: nomeNovo, cnpj: novoCliente.cnpj?.trim() || undefined, sistema: novoCliente.sistema, emails: novoCliente.emails.filter(e => e.trim()), telefone: novoCliente.telefone, statusEnvio: 'Pendente', statusBackup: 'Pendente', analista: '', ativo: true, urgente: false, atrasado: false, abaAtual: 'pendentes' }
      await supabase.addCliente(cliente)
      const novosClientes = [...clientes, cliente]
      setClientes(novosClientes); setNovoCliente({ nome: '', sistema: '', emails: [''], telefone: '', cnpj: '', analista: '' }); setShowModalCliente(false)
      await sincronizarSistemas(novosClientes, sistemas)
      setNotificacao({ tipo: 'sucesso', titulo: '✅ Cliente Adicionado!', mensagem: `"${cliente.nome}" foi cadastrado com sucesso.` })
    } catch (error) {
      setNotificacao({ tipo: 'erro', titulo: 'Erro ao Adicionar', mensagem: 'Não foi possível adicionar o cliente.' })
    }
  }

  const adicionarSistema = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const sistema: Sistema = { id: `sistema-${Date.now()}`, nome: novoSistema.nome.trim() }
      await supabase.addSistema(sistema); setSistemas(prev => [...prev, sistema]); setNovoSistema({ nome: '' }); setShowModalSistema(false)
      setNotificacao({ tipo: 'sucesso', titulo: 'Sistema Adicionado!', mensagem: `"${sistema.nome}" foi cadastrado.` })
    } catch (error) {
      setNotificacao({ tipo: 'erro', titulo: 'Erro ao Adicionar', mensagem: 'Não foi possível adicionar o sistema.' })
    }
  }

  const adicionarAnalista = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const analista: Analista = { id: `analista-${Date.now()}`, nome: novoAnalista.nome.trim() }
      await supabase.addAnalista(analista); setAnalistas(prev => [...prev, analista]); setNovoAnalista({ nome: '' }); setShowModalAnalista(false)
      setNotificacao({ tipo: 'sucesso', titulo: 'Analista Adicionado!', mensagem: `"${analista.nome}" foi cadastrado.` })
    } catch (error) {
      setNotificacao({ tipo: 'erro', titulo: 'Erro ao Adicionar', mensagem: 'Não foi possível adicionar o analista.' })
    }
  }

  const confirmarExclusao = async () => {
    if (!confirmacaoExclusao) return
    try {
      if (confirmacaoExclusao.tipo === 'sistema') { await supabase.deleteSistema(confirmacaoExclusao.item.id); await carregarDados(); setNotificacao({ tipo: 'sucesso', titulo: 'Sistema Excluído!', mensagem: `"${confirmacaoExclusao.item.nome}" foi removido.` }) }
      else { await supabase.deleteAnalista(confirmacaoExclusao.item.id); await carregarDados(); setNotificacao({ tipo: 'sucesso', titulo: 'Analista Excluído!', mensagem: `"${confirmacaoExclusao.item.nome}" foi removido.` }) }
    } catch (error) {
      setNotificacao({ tipo: 'erro', titulo: 'Erro ao Excluir', mensagem: 'Não foi possível excluir.' })
    } finally { setConfirmacaoExclusao(null) }
  }

  const abrirConfiguracoes = () => setShowModalSenha(true)

  const verificarSenha = () => {
    if (senhaDigitada === SENHA_ADMIN) { setShowModalSenha(false); setSenhaDigitada(''); setAbaSelecionada('configuracoes') }
    else { setNotificacao({ tipo: 'erro', titulo: 'Senha Incorreta!', mensagem: 'A senha digitada está incorreta.' }); setSenhaDigitada('') }
  }

  const getClientesPorAba = () => {
    // Se filtro de INATIVOS ativado, mostrar APENAS inativos
    if (filtroInativos) return clientes.filter(c => !c.ativo)

    // ABA LISTAGEM: Mostrar TODOS (ativos e inativos)
    if (abaSelecionada === 'listagem') return clientes

    // Outras abas: Filtrar por abaAtual E apenas ATIVOS (inativos NUNCA aparecem nas abas de trabalho)
    return clientes.filter(c => c.abaAtual === abaSelecionada && c.ativo !== false)
  }

  const clientesFiltrados = getClientesPorAba().filter(c => {
    const matchPesquisa = c.nome.toLowerCase().includes(pesquisa.toLowerCase()) || c.sistema.toLowerCase().includes(pesquisa.toLowerCase())
    const matchLetra = letraSelecionada ? c.nome.toUpperCase().startsWith(letraSelecionada) : true
    const matchSistema = filtroSistema ? c.sistema === filtroSistema : true
    const matchUrgente = filtroUrgente ? c.urgente : true
    const matchMes = filtroMes ? c.mesReferencia === filtroMes : true
    return matchPesquisa && matchLetra && matchSistema && matchUrgente && matchMes
  })

  // ── STATS: somente clientes ATIVOS contam ──
  const stats = {
    total: clientes.filter(c => c.ativo !== false).length,
    inativos: clientes.filter(c => c.ativo === false).length,
    pendentes: clientes.filter(c => c.abaAtual === 'pendentes' && c.ativo !== false).length,
    concluidos: clientes.filter(c => c.abaAtual === 'concluidos' && c.ativo !== false).length,
    urgentes: clientes.filter(c => c.urgente && c.ativo !== false).length,
    backupCritico: clientes.filter(c => c.abaAtual === 'backupCritico' && c.ativo !== false).length,
    atencao: clientes.filter(c => c.abaAtual === 'atencao' && c.ativo !== false).length,
    atrasados: clientes.filter(c => c.atrasado && c.ativo !== false).length,
    taxaConclusao: 0
  }
  stats.taxaConclusao = stats.total > 0 ? Math.round((stats.concluidos / stats.total) * 100) : 0

  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  const gerarMeses = () => {
    const meses = []
    const hoje = new Date()
    for (let i = 0; i < 12; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      meses.push(data.toISOString().slice(0, 7))
    }
    return meses
  }
  const todosOsMeses = gerarMeses()

  const relatoriosPorSistema = sistemas.map(sistema => {
    const cs = clientes.filter(c => c.sistema?.toUpperCase() === sistema.nome.toUpperCase() && c.ativo !== false && (!filtroMes || c.mesReferencia === filtroMes))
    const concluidos = cs.filter(c => c.statusEnvio === 'Enviado').length
    return { sistema: sistema.nome, total: cs.length, concluidos, pendentes: cs.length - concluidos, percentual: cs.length > 0 ? Math.round((concluidos / cs.length) * 100) : 0 }
  })

  const relatoriosPorAnalista = analistas.map(analista => {
    const ca = clientes.filter(c => c.analista === analista.nome && c.ativo !== false && (!filtroMes || c.mesReferencia === filtroMes))
    const concluidos = ca.filter(c => c.statusEnvio === 'Enviado').length
    return { analista: analista.nome, total: ca.length, concluidos, pendentes: ca.length - concluidos, percentual: ca.length > 0 ? Math.round((concluidos / ca.length) * 100) : 0 }
  })

  const formatarMes = (mesAno: string) => {
    const [ano, mes] = mesAno.split('-')
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    return `${meses[parseInt(mes) - 1]} ${ano}`
  }

  const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  // ──────────── LOADING ────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050F0F] via-[#0A2020] to-[#050F0F] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-[#7FB069]/20 border-t-[#7FB069] rounded-full mx-auto mb-6"
          />
          <motion.img
            src={logoGestao}
            alt="Gestão Sistemas"
            className="h-10 mx-auto mb-4 opacity-60"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <p className="text-[#7FB069] text-sm tracking-widest uppercase">Carregando sistema...</p>
        </div>
      </div>
    )
  }

  // ──────────── RENDER ────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060E0E] via-[#0A1F1F] to-[#060E0E] flex" style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside className="w-64 flex flex-col" style={{ background: 'linear-gradient(180deg, #080F0F 0%, #0A1818 50%, #080F0F 100%)', borderRight: '1px solid rgba(127,176,105,0.15)' }}>

        {/* Logo */}
        <div className="p-5 border-b border-[#7FB069]/10">
          <div className="flex items-center gap-3 mb-1">
            <img src={logoGestao} alt="Gestão Sistemas" className="h-9" />
          </div>
          <h1 className="text-white text-xs tracking-widest uppercase mt-2 mb-0.5" style={{ letterSpacing: '0.15em' }}>CONTROL GESTÃO</h1>
          <p className="text-[#7FB069]/60 text-xs">Arquivos Fiscais & Backups</p>
          <div className="mt-3 p-2 rounded-lg bg-[#7FB069]/5 border border-[#7FB069]/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500 text-xs">Progresso mensal</span>
              <span className="text-[#7FB069] text-xs font-bold">{stats.taxaConclusao}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5">
              <motion.div
                className="h-1.5 rounded-full bg-gradient-to-r from-[#7FB069] to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${stats.taxaConclusao}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <p className="text-gray-600 text-xs uppercase tracking-widest px-2 mb-2 mt-1">Visão Geral</p>
          <NavItem icon={Home} label="Dashboard" active={abaSelecionada === 'dashboard'} onClick={() => setAbaSelecionada('dashboard')} />

          <p className="text-gray-600 text-xs uppercase tracking-widest px-2 mb-2 mt-3">Clientes</p>
          <NavItem icon={Clock} label="Pendentes" active={abaSelecionada === 'pendentes'} onClick={() => setAbaSelecionada('pendentes')} badge={stats.pendentes > 0 ? stats.pendentes : undefined} badgeColor="bg-amber-500" pulse={stats.urgentes > 0} />
          <NavItem icon={Check} label="Concluídos" active={abaSelecionada === 'concluidos'} onClick={() => setAbaSelecionada('concluidos')} badge={stats.concluidos > 0 ? stats.concluidos : undefined} badgeColor="bg-emerald-500" />
          <NavItem icon={AlertCircle} label="Backup Crítico" active={abaSelecionada === 'backupCritico'} onClick={() => setAbaSelecionada('backupCritico')} badge={stats.backupCritico > 0 ? stats.backupCritico : undefined} badgeColor="bg-orange-500" pulse={stats.backupCritico > 0} />
          <NavItem icon={Bell} label="Atenção" active={abaSelecionada === 'atencao'} onClick={() => setAbaSelecionada('atencao')} badge={stats.atencao > 0 ? stats.atencao : undefined} badgeColor="bg-purple-500" />
          <NavItem icon={List} label="Todos os Clientes" active={abaSelecionada === 'listagem'} onClick={() => setAbaSelecionada('listagem')} badge={clientes.length} badgeColor="bg-blue-600" />

          <p className="text-gray-600 text-xs uppercase tracking-widest px-2 mb-2 mt-3">Sistema</p>
          <NavItem icon={Settings} label="Configurações" active={abaSelecionada === 'configuracoes'} onClick={abrirConfiguracoes} />
        </nav>

        {/* Footer stats */}
        <div className="p-4 border-t border-[#7FB069]/10">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/3 rounded-lg p-2 text-center">
              <p className="text-white text-sm font-bold">{stats.total}</p>
              <p className="text-gray-500 text-xs">Ativos</p>
            </div>
            <div className="bg-white/3 rounded-lg p-2 text-center">
              <p className="text-amber-400 text-sm font-bold">{stats.pendentes}</p>
              <p className="text-gray-500 text-xs">Pendentes</p>
            </div>
            <div className="bg-white/3 rounded-lg p-2 text-center">
              <p className="text-emerald-400 text-sm font-bold">{stats.concluidos}</p>
              <p className="text-gray-500 text-xs">Concluídos</p>
            </div>
            <div className="bg-white/3 rounded-lg p-2 text-center">
              <p className="text-red-400 text-sm font-bold">{stats.urgentes}</p>
              <p className="text-gray-500 text-xs">Urgentes</p>
            </div>
          </div>
          {stats.inativos > 0 && (
            <div className="mt-2 text-center">
              <p className="text-gray-600 text-xs">{stats.inativos} cliente(s) inativo(s) oculto(s)</p>
            </div>
          )}
        </div>
      </aside>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="px-8 py-4 border-b border-white/5 flex items-center justify-between" style={{ background: 'rgba(8,15,15,0.8)', backdropFilter: 'blur(20px)' }}>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-white text-xl font-bold">
                {abaSelecionada === 'dashboard' && '📊 Dashboard'}
                {abaSelecionada === 'pendentes' && '⏳ Clientes Pendentes'}
                {abaSelecionada === 'concluidos' && '✅ Clientes Concluídos'}
                {abaSelecionada === 'backupCritico' && '⚠️ Backup Crítico'}
                {abaSelecionada === 'atencao' && '🔔 Clientes com Atenção'}
                {abaSelecionada === 'listagem' && '📋 Todos os Clientes'}
                {abaSelecionada === 'configuracoes' && '⚙️ Configurações'}
              </h2>
              {(abaSelecionada === 'pendentes' || abaSelecionada === 'concluidos' || abaSelecionada === 'backupCritico' || abaSelecionada === 'atencao' || abaSelecionada === 'listagem') && (
                <span className="bg-white/10 text-gray-300 text-xs px-2 py-1 rounded-full">{clientesFiltrados.length} clientes</span>
              )}
            </div>
            <p className="text-gray-600 text-xs mt-0.5 capitalize">{dataHoje}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Alertas rápidos */}
            {stats.urgentes > 0 && (
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-xs font-medium">
                <Zap className="w-3.5 h-3.5" />{stats.urgentes} urgente(s)
              </motion.div>
            )}
            {stats.backupCritico > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 px-3 py-1.5 rounded-lg text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5" />{stats.backupCritico} backup crítico
              </div>
            )}
            <button onClick={carregarDados} className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="Recarregar">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Banner DB desatualizado */}
        <AnimatePresence>
          {!colunaAbaAtualExiste && clientes.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="bg-red-900/20 border-b border-red-500/30 px-8 py-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-sm flex-1">⚠️ Coluna <code className="bg-red-950/50 px-1 rounded font-mono">aba_atual</code> não existe. Execute: <code className="bg-red-950/50 px-1 rounded font-mono text-red-200">ALTER TABLE clientes ADD COLUMN IF NOT EXISTS aba_atual TEXT;</code></p>
                <button onClick={() => setColunaAbaAtualExiste(true)} className="text-red-500 hover:text-red-300 transition-colors"><X className="w-4 h-4" /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── DASHBOARD ── */}
        {abaSelecionada === 'dashboard' && (
          <DashboardGraficos clientes={clientes} sistemas={sistemas} analistas={analistas} stats={stats} />
        )}

        {/* ── LISTA DE CLIENTES (Pendentes / Concluídos / Backup Crítico / Atenção) ── */}
        {(abaSelecionada === 'pendentes' || abaSelecionada === 'concluidos' || abaSelecionada === 'backupCritico' || abaSelecionada === 'atencao') && (
          <main className="flex-1 p-6 overflow-auto">
            {/* Filtros */}
            <div className="rounded-xl p-4 mb-5 border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} placeholder="Pesquisar cliente ou sistema..." className="w-full pl-10 pr-4 py-2.5 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#7FB069]/50 transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                {abaSelecionada === 'pendentes' && (
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModalCliente(true)} className="flex items-center gap-2 bg-gradient-to-r from-[#7FB069] to-[#6A9A56] text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-lg shadow-[#7FB069]/20">
                    <Plus className="w-4 h-4" />Novo Cliente
                  </motion.button>
                )}
                <button onClick={carregarDados} className="p-2.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"><RefreshCw className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <select value={filtroSistema} onChange={(e) => setFiltroSistema(e.target.value)} className="px-3 py-2 rounded-lg text-white text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <option value="">Todos Sistemas</option>
                  {sistemas.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                </select>
                <input type="month" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} className="px-3 py-2 rounded-lg text-white text-sm focus:outline-none cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                <button onClick={() => setFiltroUrgente(!filtroUrgente)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${filtroUrgente ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'text-gray-400 border border-white/8 hover:text-white'}`} style={!filtroUrgente ? { background: 'rgba(255,255,255,0.05)' } : {}}>
                  <Zap className="w-3.5 h-3.5" />Urgentes
                </button>
                <button onClick={() => setFiltroInativos(!filtroInativos)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${filtroInativos ? 'bg-gray-500/20 text-gray-300 border border-gray-500/40' : 'text-gray-400 border border-white/8 hover:text-white'}`} style={!filtroInativos ? { background: 'rgba(255,255,255,0.05)' } : {}}>
                  <X className="w-3.5 h-3.5" />Ver Inativos
                </button>
                {(filtroSistema || letraSelecionada || pesquisa || filtroUrgente || filtroMes || filtroInativos) && (
                  <button onClick={() => { setFiltroSistema(''); setLetraSelecionada(''); setPesquisa(''); setFiltroUrgente(false); setFiltroMes(''); setFiltroInativos(false) }} className="px-3 py-2 text-gray-500 hover:text-white text-sm rounded-lg hover:bg-white/5 transition-all">✕ Limpar</button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {alfabeto.map(letra => (
                  <button key={letra} onClick={() => setLetraSelecionada(letraSelecionada === letra ? '' : letra)} className={`w-7 h-7 rounded text-xs font-medium transition-all ${letraSelecionada === letra ? 'bg-[#7FB069] text-white shadow-sm' : 'text-gray-600 hover:text-white hover:bg-white/10'}`}>{letra}</button>
                ))}
              </div>
            </div>

            {/* Cards de clientes */}
            <div className="space-y-2.5">
              <AnimatePresence>
                {clientesFiltrados.map((cliente, index) => (
                  <motion.div
                    key={cliente.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.15, delay: Math.min(index * 0.03, 0.3) }}
                    className={`rounded-xl p-4 border transition-all group relative overflow-hidden ${
                      cliente.urgente
                        ? 'border-red-500/40 shadow-lg shadow-red-500/10'
                        : cliente.atrasado
                        ? 'border-amber-500/30 shadow-sm shadow-amber-500/10'
                        : 'border-white/5 hover:border-[#7FB069]/30'
                    }`}
                    style={{ background: cliente.urgente ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)' }}
                  >
                    {/* Urgente glow left bar */}
                    {cliente.urgente && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-xl" />}
                    {cliente.atrasado && !cliente.urgente && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-xl" />}

                    <div className="flex items-center gap-4 pl-1">
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-white font-semibold">{cliente.nome}</h3>
                          {!cliente.ativo && <span className="bg-gray-600/30 text-gray-400 border border-gray-600/40 px-2 py-0.5 rounded text-xs font-medium">INATIVO</span>}
                          {cliente.urgente && (
                            <motion.span animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity }}
                              className="flex items-center gap-1 bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded text-xs font-bold">
                              <Zap className="w-3 h-3" />URGENTE
                            </motion.span>
                          )}
                          {cliente.atrasado && (
                            <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-xs font-medium">
                              ⚠️ ATRASADO {cliente.mesAtrasado ? `(${formatarMes(cliente.mesAtrasado)})` : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-[#7FB069]/80 text-xs font-medium">{cliente.sistema}</p>
                        {cliente.analista && (abaSelecionada === 'concluidos' || abaSelecionada === 'backupCritico') && (
                          <p className="text-gray-500 text-xs mt-0.5">Analista: {cliente.analista}</p>
                        )}
                        {cliente.motivoSemBackup && abaSelecionada === 'backupCritico' && (
                          <p className="text-orange-400/80 text-xs mt-0.5 italic">Motivo: {cliente.motivoSemBackup}</p>
                        )}
                      </div>

                      {/* Status Envio select */}
                      <div className="w-52 shrink-0">
                        <label className="text-gray-600 text-xs block mb-1">Status Envio</label>
                        <select
                          value={cliente.statusEnvio || 'Pendente'}
                          onChange={(e) => atualizarStatusRapido(cliente.id, 'statusEnvio', e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border text-sm font-medium cursor-pointer text-white focus:outline-none transition-all ${
                            cliente.statusEnvio === 'Enviado' ? 'border-emerald-500/40 bg-emerald-500/10'
                            : statusEspeciais.includes(cliente.statusEnvio) ? 'border-purple-500/40 bg-purple-500/10'
                            : 'border-white/10 bg-white/5'
                          }`}
                        >
                          <option>Pendente</option>
                          <option>Enviado</option>
                          <option>Recém Implantado</option>
                          <option>Gerencial</option>
                          <option>Inativo</option>
                          <option>Não Teve Vendas</option>
                          <option>Bloqueio SEFAZ</option>
                          <option>Bloqueio Financeiro</option>
                        </select>
                      </div>

                      {/* Status Backup select */}
                      <div className="w-36 shrink-0">
                        <label className="text-gray-600 text-xs block mb-1">Backup</label>
                        <select
                          value={cliente.statusBackup || 'Pendente'}
                          onChange={(e) => atualizarStatusRapido(cliente.id, 'statusBackup', e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border text-sm font-medium cursor-pointer text-white focus:outline-none transition-all ${
                            cliente.statusBackup === 'Feito' ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/10 bg-white/5'
                          }`}
                        >
                          <option>Pendente</option>
                          <option>Feito</option>
                        </select>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => { setClienteDetalhes(cliente); setShowModalDetalhes(true) }}
                          className="w-9 h-9 bg-blue-500/10 hover:bg-blue-500/25 border border-blue-500/20 rounded-lg flex items-center justify-center transition-all hover:scale-105" title="Ver detalhes">
                          <Eye className="w-4 h-4 text-blue-400" />
                        </button>
                        <button onClick={async () => { await supabase.updateCliente(cliente.id, { urgente: !cliente.urgente }); setClientes(prev => prev.map(c => c.id === cliente.id ? { ...c, urgente: !c.urgente } : c)) }}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105 border ${cliente.urgente ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-white/5 border-white/10 text-gray-500 hover:text-red-300 hover:border-red-500/20'}`}
                          title={cliente.urgente ? 'Remover urgência' : 'Marcar urgente'}>
                          <Zap className="w-4 h-4" />
                        </button>
                        <motion.button whileTap={{ scale: 0.92 }} onClick={() => marcarComoConcluido(cliente.id)}
                          className="w-9 h-9 bg-[#7FB069]/15 hover:bg-[#7FB069]/30 border border-[#7FB069]/30 rounded-lg flex items-center justify-center transition-all hover:scale-105" title="Concluir">
                          <Check className="w-4 h-4 text-[#7FB069]" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {clientesFiltrados.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.01)' }}>
                <AlertTriangle className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum cliente encontrado</p>
                <p className="text-gray-700 text-sm mt-1">Tente ajustar os filtros</p>
              </motion.div>
            )}
          </main>
        )}

        {/* ── LISTAGEM COMPLETA ── */}
        {abaSelecionada === 'listagem' && (
          <main className="flex-1 p-6 overflow-auto">
            <div className="rounded-xl p-4 mb-5 border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} placeholder="Pesquisar..." className="w-full pl-10 pr-4 py-2.5 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModalCliente(true)} className="flex items-center gap-2 bg-gradient-to-r from-[#7FB069] to-[#6A9A56] text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-lg shadow-[#7FB069]/20">
                  <Plus className="w-4 h-4" />Novo Cliente
                </motion.button>
                <button onClick={carregarDados} className="p-2.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"><RefreshCw className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <select value={filtroSistema} onChange={(e) => setFiltroSistema(e.target.value)} className="px-3 py-2 rounded-lg text-white text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <option value="">Todos Sistemas</option>
                  {sistemas.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                </select>
                <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} className="px-3 py-2 rounded-lg text-white text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <option value="">Todos os Meses</option>
                  {todosOsMeses.map(mes => <option key={mes} value={mes}>{formatarMes(mes)}</option>)}
                </select>
                <button onClick={() => setFiltroUrgente(!filtroUrgente)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${filtroUrgente ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'text-gray-400 border border-white/8 hover:text-white'}`} style={!filtroUrgente ? { background: 'rgba(255,255,255,0.05)' } : {}}>
                  <Zap className="w-3.5 h-3.5" />Urgentes
                </button>
                <button onClick={() => setFiltroInativos(!filtroInativos)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${filtroInativos ? 'bg-gray-500/20 text-gray-300 border border-gray-500/40' : 'text-gray-400 border border-white/8 hover:text-white'}`} style={!filtroInativos ? { background: 'rgba(255,255,255,0.05)' } : {}}>
                  <X className="w-3.5 h-3.5" />Inativos
                </button>
                {(filtroSistema || letraSelecionada || pesquisa || filtroUrgente || filtroMes || filtroInativos) && (
                  <button onClick={() => { setFiltroSistema(''); setLetraSelecionada(''); setPesquisa(''); setFiltroUrgente(false); setFiltroMes(''); setFiltroInativos(false) }} className="px-3 py-2 text-gray-500 hover:text-white text-sm rounded-lg hover:bg-white/5 transition-all">✕ Limpar</button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {alfabeto.map(letra => (
                  <button key={letra} onClick={() => setLetraSelecionada(letraSelecionada === letra ? '' : letra)} className={`w-7 h-7 rounded text-xs font-medium transition-all ${letraSelecionada === letra ? 'bg-[#7FB069] text-white' : 'text-gray-600 hover:text-white hover:bg-white/10'}`}>{letra}</button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <AnimatePresence>
                {clientes.filter(c => {
                  const matchPesquisa = c.nome.toLowerCase().includes(pesquisa.toLowerCase()) || c.sistema.toLowerCase().includes(pesquisa.toLowerCase())
                  const matchLetra = letraSelecionada ? c.nome.toUpperCase().startsWith(letraSelecionada) : true
                  const matchSistema = filtroSistema ? c.sistema === filtroSistema : true
                  const matchUrgente = filtroUrgente ? c.urgente : true
                  const matchMes = filtroMes ? c.mesReferencia === filtroMes : true
                  const matchInativos = filtroInativos ? !c.ativo : true
                  return matchPesquisa && matchLetra && matchSistema && matchUrgente && matchMes && matchInativos
                }).map((cliente, index) => (
                  <motion.div key={cliente.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.025, 0.3) }}
                    className={`rounded-xl p-4 border transition-all ${!cliente.ativo ? 'border-white/5 opacity-60' : cliente.urgente ? 'border-red-500/30' : 'border-white/5 hover:border-[#7FB069]/20'}`}
                    style={{ background: cliente.urgente ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-white font-semibold">{cliente.nome}</h3>
                          {cliente.urgente && <span className="flex items-center gap-1 bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded text-xs font-bold"><Zap className="w-3 h-3" />URGENTE</span>}
                          {cliente.atrasado && <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-xs">⚠️ ATRASADO</span>}
                          {!cliente.ativo && <span className="bg-gray-600/20 text-gray-500 border border-gray-600/30 px-2 py-0.5 rounded text-xs">INATIVO</span>}
                        </div>
                        <p className="text-[#7FB069]/70 text-xs font-medium">{cliente.sistema}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <StatusBadge status={cliente.statusEnvio} type="envio" />
                          <StatusBadge status={cliente.statusBackup} type="backup" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setClienteDetalhes(cliente); setShowModalDetalhes(true) }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg text-sm transition-all">
                          <Eye className="w-3.5 h-3.5" />Detalhes
                        </button>
                        <button onClick={async () => {
                          if (confirm(`${cliente.ativo ? 'DESATIVAR' : 'ATIVAR'} o cliente ${cliente.nome}?`)) {
                            await supabase.updateCliente(cliente.id, { ativo: !cliente.ativo })
                            setClientes(prev => prev.map(c => c.id === cliente.id ? { ...c, ativo: !c.ativo } : c))
                            setNotificacao({ tipo: cliente.ativo ? 'aviso' : 'sucesso', titulo: cliente.ativo ? 'Cliente Desativado!' : 'Cliente Ativado!', mensagem: `${cliente.nome} foi ${cliente.ativo ? 'desativado' : 'ativado'} com sucesso.` })
                          }
                        }}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all border ${cliente.ativo ? 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'}`}>
                          {cliente.ativo ? <><X className="w-3.5 h-3.5" />Desativar</> : <><Check className="w-3.5 h-3.5" />Ativar</>}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {clientes.length === 0 && (
              <div className="text-center py-16 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.01)' }}>
                <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum cliente cadastrado</p>
              </div>
            )}
          </main>
        )}

        {/* ── CONFIGURAÇÕES ── */}
        {abaSelecionada === 'configuracoes' && (
          <main className="flex-1 p-6 overflow-auto">
            <InstrucoesSQL />

            {/* DB Checkup */}
            <div className="rounded-xl p-5 border border-white/8 mb-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                Checkup do Banco de Dados
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-lg p-3 text-center border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-2xl font-bold text-white">{dbStatus?.clientes ?? clientes.length}</p>
                  <p className="text-gray-500 text-xs mt-1">Clientes</p>
                </div>
                <div className="rounded-lg p-3 text-center border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-2xl font-bold text-white">{dbStatus?.analistas ?? analistas.length}</p>
                  <p className="text-gray-500 text-xs mt-1">Analistas</p>
                </div>
                <div className="rounded-lg p-3 text-center border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-2xl font-bold text-white">{dbStatus?.sistemas ?? sistemas.length}</p>
                  <p className="text-gray-500 text-xs mt-1">Sistemas</p>
                </div>
              </div>
              {dbStatus && (
                <div className={`flex items-center gap-2 p-3 rounded-lg mb-3 ${dbStatus.ok ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  {dbStatus.ok ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
                  <span className={`text-sm font-medium ${dbStatus.ok ? 'text-emerald-300' : 'text-red-300'}`}>{dbStatus.ok ? '✅ Conexão com Supabase OK' : '❌ Erro de conexão com Supabase'}</span>
                </div>
              )}
              {/* Status de colunas */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                {[
                  { col: 'aba_atual', ok: colunaAbaAtualExiste, label: 'Coluna aba_atual' },
                  { col: 'analista_backup', ok: clientes.some(c => c.analistaBackup !== undefined), label: 'Coluna analista_backup' },
                  { col: 'urgente', ok: clientes.some(c => c.urgente !== undefined), label: 'Coluna urgente' },
                  { col: 'atrasado', ok: true, label: 'Coluna atrasado' },
                ].map(item => (
                  <div key={item.col} className={`flex items-center gap-2 p-2 rounded-lg ${item.ok ? 'bg-emerald-500/5 border border-emerald-500/15' : 'bg-red-500/5 border border-red-500/15'}`}>
                    {item.ok ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <X className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                    <span className={item.ok ? 'text-emerald-400' : 'text-red-400'}>{item.label}</span>
                  </div>
                ))}
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={verificarBancoDados} disabled={checkingDb}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20">
                <Activity className={`w-4 h-4 ${checkingDb ? 'animate-pulse' : ''}`} />
                {checkingDb ? 'Verificando...' : 'Verificar Conexão com Supabase'}
              </motion.button>
            </div>

            {/* Sistemas e Analistas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div className="rounded-xl p-5 border border-white/8" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <h3 className="text-white font-bold mb-4">Sistemas</h3>
                <div className="flex gap-2 mb-4">
                  <button onClick={() => setShowModalSistema(true)} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#7FB069] to-[#6A9A56] text-white px-4 py-2.5 rounded-lg text-sm font-medium">
                    <Plus className="w-4 h-4" />Adicionar
                  </button>
                  <button onClick={async () => await sincronizarSistemas(clientes, sistemas, true)} disabled={sincronizando} className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/20 disabled:opacity-50 transition-all">
                    <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-auto">
                  {sistemas.length > 0 ? sistemas.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg group" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span className="text-white text-sm">{s.nome}</span>
                      <button onClick={() => setConfirmacaoExclusao({ tipo: 'sistema', item: s })} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/10 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  )) : <p className="text-gray-600 text-center py-4 text-sm">Nenhum sistema cadastrado</p>}
                </div>
              </div>

              <div className="rounded-xl p-5 border border-white/8" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <h3 className="text-white font-bold mb-4">Analistas</h3>
                <button onClick={() => setShowModalAnalista(true)} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7FB069] to-[#6A9A56] text-white px-4 py-2.5 rounded-lg text-sm font-medium mb-4">
                  <Plus className="w-4 h-4" />Adicionar Analista
                </button>
                <div className="space-y-1.5 max-h-56 overflow-auto">
                  {analistas.length > 0 ? analistas.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg group" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span className="text-white text-sm">{a.nome}</span>
                      <button onClick={() => setConfirmacaoExclusao({ tipo: 'analista', item: a })} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/10 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  )) : <p className="text-gray-600 text-center py-4 text-sm">Nenhum analista cadastrado</p>}
                </div>
              </div>
            </div>

            {/* Reset Mensal */}
            <div className="rounded-xl p-5 border border-red-500/20 mb-5" style={{ background: 'rgba(239,68,68,0.03)' }}>
              <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2"><RotateCcw className="w-5 h-5" />Reset Mensal</h3>
              <p className="text-gray-400 text-sm mb-4">Clientes pendentes → marcados como ATRASADOS. Demais clientes → resetados para Pendente. Um relatório Excel é gerado automaticamente.</p>
              <button onClick={() => setShowModalReset(true)} className="w-full flex items-center justify-center gap-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 px-4 py-2.5 rounded-lg font-medium transition-all">
                <RotateCcw className="w-4 h-4" />Realizar Reset Mensal
              </button>
            </div>

            {/* Limpar Atrasados */}
            <div className="rounded-xl p-5 border border-blue-500/20" style={{ background: 'rgba(59,130,246,0.03)' }}>
              <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2"><Shield className="w-5 h-5" />Limpar Atrasados (Produção)</h3>
              <p className="text-gray-400 text-sm mb-4">Remove a flag "atrasado" de todos os clientes. Use apenas para preparar o sistema para produção. <span className="text-red-400 font-medium">Não pode ser desfeito!</span></p>
              <button onClick={async () => {
                const conf = prompt('⚠️ Digite "LIMPAR" para confirmar a limpeza de todos os atrasados:')
                if (conf === 'LIMPAR') {
                  try {
                    const todos = await supabase.getClientes()
                    const atrasados = todos.filter((c: any) => c.atrasado)
                    let ok = 0, err = 0
                    for (const c of atrasados) {
                      try { await supabase.updateCliente(c.id, { atrasado: false, abaAtual: 'pendentes' }); ok++ } catch { err++ }
                    }
                    await carregarDados()
                    setNotificacao({ tipo: err === 0 ? 'sucesso' : 'aviso', titulo: 'Limpeza concluída!', mensagem: `✅ ${ok} limpos${err > 0 ? ` | ❌ ${err} com erro` : ''}` })
                  } catch { setNotificacao({ tipo: 'erro', titulo: 'Erro', mensagem: 'Não foi possível limpar.' }) }
                }
              }} className="w-full flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-300 px-4 py-2.5 rounded-lg font-medium transition-all">
                <AlertCircle className="w-4 h-4" />Limpar TODOS os Atrasados
              </button>
            </div>
          </main>
        )}
      </div>

      {/* ═══════════ MODAIS ═══════════ */}

      {/* Modal Reset */}
      <AnimatePresence>
        {showModalReset && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="rounded-xl max-w-md w-full p-6 border border-red-500/30" style={{ background: '#0D1A1A' }}>
              <h2 className="text-xl font-bold text-red-400 mb-4">⚠️ Confirmar Reset Mensal</h2>
              <div className="mb-5 p-4 bg-red-500/8 border border-red-500/20 rounded-lg">
                <p className="text-white text-sm mb-2">Esta ação irá:</p>
                <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
                  <li>Gerar relatório Excel do mês atual</li>
                  <li>Marcar pendentes como ATRASADOS</li>
                  <li>Resetar status dos demais clientes</li>
                </ul>
                <p className="text-red-400 text-sm mt-3 font-medium">⚠️ Não pode ser desfeito!</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowModalReset(false)} className="flex-1 px-4 py-3 border border-white/10 text-gray-400 rounded-lg hover:bg-white/5 transition-all text-sm">Cancelar</button>
                <button onClick={resetarMensal} className="flex-1 px-4 py-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg hover:bg-red-500/30 font-bold transition-all text-sm">Confirmar Reset</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Senha */}
      <AnimatePresence>
        {showModalSenha && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="rounded-xl max-w-sm w-full p-6 border border-white/10" style={{ background: '#0D1A1A' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center"><Lock className="w-5 h-5 text-amber-400" /></div>
                <div><h2 className="text-white font-bold">Acesso Restrito</h2><p className="text-gray-500 text-xs">Digite a senha de administrador</p></div>
              </div>
              <input type="password" value={senhaDigitada} onChange={(e) => setSenhaDigitada(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && verificarSenha()} className="w-full px-4 py-3 rounded-lg text-white mb-4 focus:outline-none focus:border-[#7FB069]/50 transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} placeholder="Senha" autoFocus />
              <div className="flex gap-3">
                <button onClick={() => { setShowModalSenha(false); setSenhaDigitada('') }} className="flex-1 px-4 py-3 border border-white/10 text-gray-400 rounded-lg hover:bg-white/5 transition-all text-sm">Cancelar</button>
                <button onClick={verificarSenha} className="flex-1 px-4 py-3 bg-gradient-to-r from-[#7FB069] to-[#6A9A56] text-white rounded-lg font-medium transition-all text-sm">Entrar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Analista Backup */}
      <AnimatePresence>
        {showModalAnalistaBackup && clienteBackup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="rounded-xl max-w-sm w-full p-6 border border-blue-500/30" style={{ background: '#0D1A1A' }}>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Check className="w-5 h-5 text-blue-400" />Backup Realizado</h2>
              <div className="mb-5 p-4 bg-blue-500/8 border border-blue-500/20 rounded-lg">
                <p className="text-white font-bold mb-0.5">{clienteBackup.nome}</p>
                <p className="text-gray-500 text-sm">{clienteBackup.sistema}</p>
                <p className="text-blue-400 text-sm mt-2">Qual analista fez o backup?</p>
              </div>
              <select value={analistaBackup} onChange={(e) => setAnalistaBackup(e.target.value)} className="w-full px-4 py-3 rounded-lg text-white mb-5 focus:outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} autoFocus>
                <option value="">Selecione o analista...</option>
                {analistas.map(a => <option key={a.id} value={a.nome}>{a.nome}</option>)}
              </select>
              <div className="flex gap-3">
                <button onClick={() => { setShowModalAnalistaBackup(false); setClienteBackup(null); setAnalistaBackup('') }} className="flex-1 px-4 py-3 border border-white/10 text-gray-400 rounded-lg hover:bg-white/5 transition-all text-sm">Cancelar</button>
                <button onClick={confirmarAnalistaBackup} disabled={!analistaBackup} className="flex-1 px-4 py-3 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg hover:bg-blue-500/30 disabled:opacity-50 transition-all font-medium text-sm">✓ Confirmar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Email/Finalizar */}
      <AnimatePresence>
        {showModalEmail && clienteEmail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="rounded-xl max-w-3xl w-full p-6 border border-[#7FB069]/20 my-8" style={{ background: '#0D1A1A' }}>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Check className="w-6 h-6 text-[#7FB069]" />Finalizar Cliente – Email de Envio</h2>
              <div className="mb-4 p-4 bg-[#7FB069]/8 border border-[#7FB069]/20 rounded-lg">
                <p className="text-white font-bold mb-0.5">{clienteEmail.nome}</p>
                <p className="text-gray-500 text-sm">CNPJ: {clienteEmail.cnpj || 'Não informado'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Analista do Envio *</label>
                  <select value={analistaEmailNome} onChange={(e) => setAnalistaEmailNome(e.target.value)} className="w-full px-4 py-3 rounded-lg text-white focus:outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} autoFocus>
                    <option value="">Selecione...</option>
                    {analistas.map(a => <option key={a.id} value={a.nome}>{a.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Analista do Backup *</label>
                  <select value={analistaBackup} onChange={(e) => setAnalistaBackup(e.target.value)} className="w-full px-4 py-3 rounded-lg text-white focus:outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <option value="">Selecione...</option>
                    {analistas.map(a => <option key={a.id} value={a.nome}>{a.nome}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-400 text-sm font-medium">ASSUNTO DO EMAIL</label>
                  <button onClick={() => copiarParaClipboard(gerarAssuntoEmail(clienteEmail), 'assunto')} className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs hover:bg-blue-500/20 transition-all"><Copy className="w-3.5 h-3.5" />Copiar</button>
                </div>
                <textarea value={gerarAssuntoEmail(clienteEmail)} readOnly onClick={(e) => e.currentTarget.select()} className="w-full px-4 py-3 rounded-lg text-white resize-none focus:outline-none cursor-pointer text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} rows={2} />
              </div>
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-400 text-sm font-medium">CORPO DO EMAIL</label>
                  <button onClick={() => copiarParaClipboard(gerarCorpoEmail(clienteEmail, analistaEmailNome), 'corpo')} className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs hover:bg-blue-500/20 transition-all"><Copy className="w-3.5 h-3.5" />Copiar</button>
                </div>
                <textarea value={gerarCorpoEmail(clienteEmail, analistaEmailNome)} readOnly onClick={(e) => e.currentTarget.select()} className="w-full px-4 py-3 rounded-lg text-white font-mono text-xs resize-none focus:outline-none cursor-pointer" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} rows={18} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowModalEmail(false); setClienteEmail(null); setAnalistaEmailNome(''); setAnalistaBackup('') }} className="flex-1 px-4 py-3 border border-white/10 text-gray-400 rounded-lg hover:bg-white/5 transition-all text-sm">Cancelar</button>
                <button onClick={finalizarCliente} disabled={!analistaEmailNome || !analistaBackup} className="flex-1 px-4 py-3 bg-gradient-to-r from-[#7FB069] to-[#6A9A56] text-white rounded-lg font-semibold disabled:opacity-50 transition-all text-sm">✓ Finalizar e Concluir</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Motivo Backup */}
      <AnimatePresence>
        {showModalMotivo && clienteMotivo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="rounded-xl max-w-md w-full p-6 border border-orange-500/30" style={{ background: '#0D1A1A' }}>
              <h2 className="text-xl font-bold text-orange-400 mb-4">⚠️ Backup Crítico</h2>
              <div className="mb-4 p-4 bg-orange-500/8 border border-orange-500/20 rounded-lg">
                <p className="text-white font-bold mb-0.5">{clienteMotivo.nome}</p>
                <p className="text-gray-500 text-sm">Envio ENVIADO mas Backup PENDENTE. Justifique:</p>
              </div>
              <textarea value={motivoBackup} onChange={(e) => setMotivoBackup(e.target.value)} className="w-full px-4 py-3 rounded-lg text-white h-28 mb-4 focus:outline-none resize-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} placeholder="Descreva o motivo..." autoFocus />
              <div className="flex gap-3">
                <button onClick={() => { setShowModalMotivo(false); setMotivoBackup(''); setClienteMotivo(null) }} className="flex-1 px-4 py-3 border border-white/10 text-gray-400 rounded-lg hover:bg-white/5 transition-all text-sm">Cancelar</button>
                <button onClick={salvarMotivoBackup} className="flex-1 px-4 py-3 bg-orange-500/20 border border-orange-500/30 text-orange-300 rounded-lg hover:bg-orange-500/30 transition-all font-medium text-sm">Salvar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Novo Cliente */}
      <AnimatePresence>
        {showModalCliente && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="rounded-xl max-w-md w-full p-6 border border-white/10" style={{ background: '#0D1A1A' }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-bold text-lg">Novo Cliente</h2>
                <button onClick={() => setShowModalCliente(false)} className="text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={adicionarCliente} className="space-y-3">
                {[
                  { label: 'Nome *', key: 'nome', type: 'text', required: true, placeholder: '' },
                  { label: 'CNPJ', key: 'cnpj', type: 'text', required: false, placeholder: '00.000.000/0000-00' },
                  { label: 'Email', key: 'emails', type: 'email', required: false, placeholder: '' },
                  { label: 'Telefone', key: 'telefone', type: 'text', required: false, placeholder: '' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-gray-400 text-sm mb-1.5">{field.label}</label>
                    {field.key === 'emails' ? (
                      <input required={field.required} value={novoCliente.emails[0]} onChange={(e) => setNovoCliente(p => ({ ...p, emails: [e.target.value] }))} type={field.type} className="w-full px-4 py-2.5 rounded-lg text-white focus:outline-none text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} placeholder={field.placeholder} />
                    ) : (
                      <input required={field.required} value={novoCliente[field.key as keyof typeof novoCliente] as string} onChange={(e) => setNovoCliente(p => ({ ...p, [field.key]: e.target.value }))} type={field.type} className="w-full px-4 py-2.5 rounded-lg text-white focus:outline-none text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} placeholder={field.placeholder} />
                    )}
                  </div>
                ))}
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5">Sistema *</label>
                  <select required value={novoCliente.sistema} onChange={(e) => setNovoCliente(p => ({ ...p, sistema: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg text-white focus:outline-none text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <option value="">Selecione...</option>{sistemas.map(s => <option key={s.id}>{s.nome}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModalCliente(false)} className="flex-1 px-4 py-2.5 border border-white/10 text-gray-400 rounded-lg hover:bg-white/5 transition-all text-sm">Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#7FB069] to-[#6A9A56] text-white rounded-lg font-medium text-sm">Adicionar</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Novo Sistema */}
      <AnimatePresence>
        {showModalSistema && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="rounded-xl max-w-sm w-full p-6 border border-white/10" style={{ background: '#0D1A1A' }}>
              <h2 className="text-white font-bold text-lg mb-5">Novo Sistema</h2>
              <form onSubmit={adicionarSistema} className="space-y-4">
                <div><label className="block text-gray-400 text-sm mb-1.5">Nome do Sistema *</label><input required value={novoSistema.nome} onChange={(e) => setNovoSistema({ nome: e.target.value })} className="w-full px-4 py-2.5 rounded-lg text-white focus:outline-none text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} autoFocus /></div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowModalSistema(false)} className="flex-1 px-4 py-2.5 border border-white/10 text-gray-400 rounded-lg text-sm hover:bg-white/5 transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#7FB069] to-[#6A9A56] text-white rounded-lg text-sm font-medium">Adicionar</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Novo Analista */}
      <AnimatePresence>
        {showModalAnalista && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="rounded-xl max-w-sm w-full p-6 border border-white/10" style={{ background: '#0D1A1A' }}>
              <h2 className="text-white font-bold text-lg mb-5">Novo Analista</h2>
              <form onSubmit={adicionarAnalista} className="space-y-4">
                <div><label className="block text-gray-400 text-sm mb-1.5">Nome do Analista *</label><input required value={novoAnalista.nome} onChange={(e) => setNovoAnalista({ nome: e.target.value })} className="w-full px-4 py-2.5 rounded-lg text-white focus:outline-none text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} autoFocus /></div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowModalAnalista(false)} className="flex-1 px-4 py-2.5 border border-white/10 text-gray-400 rounded-lg text-sm hover:bg-white/5 transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#7FB069] to-[#6A9A56] text-white rounded-lg text-sm font-medium">Adicionar</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Detalhes do Cliente */}
      <AnimatePresence>
        {showModalDetalhes && clienteDetalhes && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="rounded-xl max-w-2xl w-full p-6 border border-white/10 my-8 max-h-[90vh] overflow-y-auto" style={{ background: '#0D1A1A' }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Eye className="w-5 h-5 text-[#7FB069]" />Detalhes do Cliente</h2>
                <button onClick={() => { setShowModalDetalhes(false); setClienteDetalhes(null) }} className="text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <h3 className="text-2xl font-bold text-white mb-2">{clienteDetalhes.nome}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {clienteDetalhes.urgente && <span className="flex items-center gap-1 bg-red-500/20 text-red-300 border border-red-500/40 px-3 py-1 rounded-full text-sm font-bold"><Zap className="w-3.5 h-3.5" />URGENTE</span>}
                    {clienteDetalhes.atrasado && <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-sm font-bold">⚠️ ATRASADO</span>}
                    {!clienteDetalhes.ativo && <span className="bg-gray-600/20 text-gray-400 border border-gray-600/30 px-3 py-1 rounded-full text-sm font-bold">INATIVO</span>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-gray-500 text-xs mb-1">Sistema</p>
                    <p className="text-[#7FB069] font-bold">{clienteDetalhes.sistema}</p>
                  </div>
                  {clienteDetalhes.cnpj && (
                    <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p className="text-gray-500 text-xs mb-1">CNPJ</p>
                      <p className="text-white font-medium">{clienteDetalhes.cnpj}</p>
                    </div>
                  )}
                  {clienteDetalhes.analista && (
                    <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p className="text-gray-500 text-xs mb-1">Analista Responsável</p>
                      <p className="text-white">{clienteDetalhes.analista}</p>
                    </div>
                  )}
                  {clienteDetalhes.analistaBackup && (
                    <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p className="text-gray-500 text-xs mb-1">Analista Backup</p>
                      <p className="text-white">{clienteDetalhes.analistaBackup}</p>
                    </div>
                  )}
                </div>
                <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <h4 className="text-white font-bold mb-3 text-sm">📞 Contatos</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">EMAIL(S)</p>
                      {clienteDetalhes.emails?.filter(e => e?.trim()).length > 0 ? (
                        <div className="space-y-1">{clienteDetalhes.emails.filter(e => e?.trim()).map((email, i) => <p key={i} className="text-[#7FB069] text-sm">{email}</p>)}</div>
                      ) : (
                        <p className="text-gray-600 text-sm italic">Nenhum email cadastrado</p>
                      )}
                      <button onClick={() => {
                        const novoEmail = prompt('Digite o email:')
                        if (novoEmail?.trim()) {
                          const novos = [...(clienteDetalhes.emails || []), novoEmail.trim()]
                          supabase.updateCliente(clienteDetalhes.id, { emails: novos }).then(() => { setNotificacao({ tipo: 'sucesso', titulo: 'Email Adicionado!', mensagem: `"${novoEmail}" adicionado.` }); carregarDados(); setShowModalDetalhes(false) })
                        }
                      }} className="mt-2 px-3 py-1.5 bg-blue-500/8 hover:bg-blue-500/15 border border-blue-500/20 text-blue-400 rounded-lg text-xs transition-all">+ Adicionar Email</button>
                    </div>
                    {clienteDetalhes.telefone && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">TELEFONE</p>
                        <p className="text-white text-sm">{clienteDetalhes.telefone}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-gray-500 text-xs mb-2">Status de Envio</p>
                    <StatusBadge status={clienteDetalhes.statusEnvio} type="envio" />
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-gray-500 text-xs mb-2">Status de Backup</p>
                    <StatusBadge status={clienteDetalhes.statusBackup} type="backup" />
                  </div>
                </div>
                {clienteDetalhes.motivoSemBackup && (
                  <div className="p-4 rounded-lg bg-orange-500/8 border border-orange-500/20">
                    <p className="text-orange-400 font-bold text-sm mb-1">📝 Justificativa de Backup Pendente</p>
                    <p className="text-white text-sm italic">"{clienteDetalhes.motivoSemBackup}"</p>
                  </div>
                )}
              </div>
              <div className="mt-5">
                <button onClick={() => { setShowModalDetalhes(false); setClienteDetalhes(null) }} className="w-full px-4 py-2.5 bg-gradient-to-r from-[#7FB069] to-[#6A9A56] text-white rounded-lg font-medium transition-all text-sm">Fechar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notificação */}
      {notificacao && (
        <Notificacao tipo={notificacao.tipo} titulo={notificacao.titulo} mensagem={notificacao.mensagem} onFechar={() => setNotificacao(null)} />
      )}

      {/* Confirmação de Exclusão */}
      {confirmacaoExclusao && (
        <ConfirmacaoExclusao
          titulo={confirmacaoExclusao.tipo === 'sistema' ? 'Excluir Sistema?' : 'Excluir Analista?'}
          mensagem={confirmacaoExclusao.tipo === 'sistema' ? 'Tem certeza que deseja excluir este sistema?' : 'Tem certeza que deseja excluir este analista?'}
          itemNome={confirmacaoExclusao.item.nome}
          onConfirmar={confirmarExclusao}
          onCancelar={() => setConfirmacaoExclusao(null)}
        />
      )}
    </div>
  )
}
