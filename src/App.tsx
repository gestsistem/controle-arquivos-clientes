import React, { useState, useEffect } from 'react'
import { Plus, RefreshCw, Search, Users, Star, Eye, Download, Upload, BarChart3, TrendingUp, X, Ban, CheckCircle, Edit, Settings, Filter, AlertTriangle, Clock } from 'lucide-react'
import * as XLSX from 'xlsx'
import * as storage from './utils/storage'

const SENHA_ADMIN = '301603'

type StatusEnvio = 'Enviado' | 'Pendente' | 'Recém Implantado' | 'Gerencial' | 'Inativo' | 'Não Teve Vendas' | 'Bloqueio SEFAZ' | 'Bloqueio Financeiro'

interface Cliente {
  id: string
  nome: string
  sistema: string
  emails: string[]
  emailPrimario: string
  telefone: string
  statusEnvio: StatusEnvio
  statusBackup: 'Feito' | 'Pendente'
  analista: string
  dataAtualizacao: string
  dataConclusaoEnvio?: string
  dataConclusaoBackup?: string
  concluido: boolean
  prioritario: boolean
  ativo: boolean
  atencao: boolean
  atrasado: boolean
  motivoSemBackup?: string
}

interface Analista {
  id: string
  nome: string
  dataCriacao: string
}

interface Sistema {
  id: string
  nome: string
  dataCriacao: string
}

interface MotivoBackup {
  id: string
  clienteId: string
  clienteNome: string
  analista: string
  motivo: string
  data: string
}

type AbaType = 'pendentes' | 'concluidos' | 'atencao' | 'atrasados' | 'desativados' | 'relatorios'

export default function App() {
  const [clientes, setClientesState] = useState<Cliente[]>([])
  const [analistas, setAnalistasState] = useState<Analista[]>([])
  const [sistemas, setSistemasState] = useState<Sistema[]>([])
  const [motivosBackup, setMotivosBackupState] = useState<MotivoBackup[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [abaSelecionada, setAbaSelecionada] = useState<AbaType>('pendentes')
  const [pesquisa, setPesquisa] = useState('')
  const [ultimoReset, setUltimoResetState] = useState<string | null>(null)
  
  // Filtros
  const [filtroUrgente, setFiltroUrgente] = useState(false)
  const [filtroSistema, setFiltroSistema] = useState('')
  const [filtroStatusEnvio, setFiltroStatusEnvio] = useState('')
  const [showFiltros, setShowFiltros] = useState(false)
  
  // Modais
  const [showModalCliente, setShowModalCliente] = useState(false)
  const [showModalEditarCliente, setShowModalEditarCliente] = useState(false)
  const [showModalAnalista, setShowModalAnalista] = useState(false)
  const [showModalSistema, setShowModalSistema] = useState(false)
  const [showModalStatus, setShowModalStatus] = useState(false)
  const [showModalDetalhes, setShowModalDetalhes] = useState(false)
  const [showModalImportar, setShowModalImportar] = useState(false)
  const [showModalMotivo, setShowModalMotivo] = useState(false)
  const [showModalSenha, setShowModalSenha] = useState(false)
  const [acaoProtegida, setAcaoProtegida] = useState<string>('')
  
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  
  // Forms
  const [novoCliente, setNovoCliente] = useState({ 
    nome: '', 
    sistema: '', 
    emails: [''], 
    telefone: '' 
  })
  const [statusForm, setStatusForm] = useState<{
    statusEnvio: StatusEnvio
    statusBackup: 'Feito' | 'Pendente'
    analista: string
  }>({ statusEnvio: 'Pendente', statusBackup: 'Pendente', analista: '' })
  const [novoAnalista, setNovoAnalista] = useState('')
  const [novoSistema, setNovoSistema] = useState('')
  const [motivoBackup, setMotivoBackup] = useState('')
  const [senhaDigitada, setSenhaDigitada] = useState('')

  // Relatórios
  const [periodoRelatorio, setPeriodoRelatorio] = useState({ inicio: '', fim: '' })

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = () => {
    setLoading(true)
    try {
      const clientesLoad = storage.getClientes()
      const analistasLoad = storage.getAnalistas()
      const sistemasLoad = storage.getSistemas()
      const motivosLoad = storage.getMotivos()
      const resetLoad = storage.getUltimoReset()

      setClientesState(clientesLoad)
      setAnalistasState(analistasLoad)
      setSistemasState(sistemasLoad)
      setMotivosBackupState(motivosLoad)
      setUltimoResetState(resetLoad)

      console.log('✅ Dados carregados:', {
        clientes: clientesLoad.length,
        analistas: analistasLoad.length,
        sistemas: sistemasLoad.length
      })
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const validarSenha = (acao: string) => {
    setAcaoProtegida(acao)
    setShowModalSenha(true)
  }

  const executarAcaoProtegida = () => {
    if (senhaDigitada !== SENHA_ADMIN) {
      alert('❌ Senha incorreta!')
      return
    }

    switch (acaoProtegida) {
      case 'analistas':
        setShowModalAnalista(true)
        break
      case 'sistemas':
        setShowModalSistema(true)
        break
      case 'reset':
        executarResetMensal()
        break
    }

    setShowModalSenha(false)
    setSenhaDigitada('')
  }

  // ===== CLIENTES =====

  const adicionarCliente = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!novoCliente.nome.trim() || !novoCliente.sistema.trim()) {
      alert('❌ Nome e sistema são obrigatórios')
      return
    }

    const cliente: Cliente = {
      id: `cliente:${Date.now()}`,
      nome: novoCliente.nome.trim(),
      sistema: novoCliente.sistema.trim(),
      emails: novoCliente.emails.filter(e => e.trim()),
      emailPrimario: novoCliente.emails[0] || '',
      telefone: novoCliente.telefone || '',
      statusEnvio: 'Pendente',
      statusBackup: 'Pendente',
      analista: '',
      dataAtualizacao: new Date().toISOString(),
      concluido: false,
      prioritario: false,
      ativo: true,
      atencao: false,
      atrasado: false
    }

    storage.addCliente(cliente)
    setClientesState(prev => [...prev, cliente])
    
    setNovoCliente({ nome: '', sistema: '', emails: [''], telefone: '' })
    setShowModalCliente(false)
    alert('✅ Cliente adicionado com sucesso!')
  }

  const atualizarCliente = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!clienteSelecionado) return

    const clienteAtualizado = {
      ...clienteSelecionado,
      nome: novoCliente.nome.trim(),
      sistema: novoCliente.sistema.trim(),
      emails: novoCliente.emails.filter(e => e.trim()),
      emailPrimario: novoCliente.emails[0] || '',
      telefone: novoCliente.telefone || '',
      dataAtualizacao: new Date().toISOString()
    }

    storage.updateCliente(clienteSelecionado.id, clienteAtualizado)
    setClientesState(prev => prev.map(c => c.id === clienteSelecionado.id ? clienteAtualizado : c))
    
    setShowModalEditarCliente(false)
    setClienteSelecionado(null)
    alert('✅ Cliente atualizado com sucesso!')
  }

  const abrirModalStatus = (cliente: Cliente) => {
    setClienteSelecionado(cliente)
    setStatusForm({
      statusEnvio: cliente.statusEnvio,
      statusBackup: cliente.statusBackup,
      analista: cliente.analista
    })
    setShowModalStatus(true)
  }

  const salvarStatus = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clienteSelecionado) return

    // Verificar se envio está concluído mas backup pendente
    if (statusForm.statusEnvio === 'Enviado' && statusForm.statusBackup === 'Pendente') {
      setShowModalStatus(false)
      setShowModalMotivo(true)
      return
    }

    atualizarStatusCliente()
  }

  const atualizarStatusCliente = () => {
    if (!clienteSelecionado || salvando) return

    try {
      setSalvando(true)
      console.log('🔄 Atualizando cliente:', clienteSelecionado.id)
      
      const dataAtual = new Date().toISOString()
      const clienteAtualizado = {
        ...clienteSelecionado,
        ...statusForm,
        dataAtualizacao: dataAtual,
        concluido: statusForm.statusEnvio === 'Enviado' && statusForm.statusBackup === 'Feito',
        atencao: statusForm.statusEnvio === 'Enviado' && statusForm.statusBackup === 'Pendente'
      }

      // Registrar datas de conclusão
      if (statusForm.statusEnvio === 'Enviado' && clienteSelecionado.statusEnvio !== 'Enviado') {
        clienteAtualizado.dataConclusaoEnvio = dataAtual
      }
      if (statusForm.statusBackup === 'Feito' && clienteSelecionado.statusBackup !== 'Feito') {
        clienteAtualizado.dataConclusaoBackup = dataAtual
      }

      storage.updateCliente(clienteSelecionado.id, clienteAtualizado)
      setClientesState(prev => prev.map(c => c.id === clienteSelecionado.id ? clienteAtualizado : c))
      
      setShowModalStatus(false)
      setClienteSelecionado(null)
      alert('✅ Status atualizado com sucesso!')
    } catch (error) {
      console.error('❌ Erro:', error)
      alert('❌ Erro ao atualizar status')
    } finally {
      setSalvando(false)
    }
  }

  const salvarMotivoBackup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clienteSelecionado || !motivoBackup.trim()) {
      alert('❌ Digite um motivo válido')
      return
    }

    try {
      setSalvando(true)
      
      // Salvar motivo
      const motivo: MotivoBackup = {
        id: `motivo:${Date.now()}`,
        clienteId: clienteSelecionado.id,
        clienteNome: clienteSelecionado.nome,
        analista: statusForm.analista || 'Não informado',
        motivo: motivoBackup.trim(),
        data: new Date().toISOString()
      }
      
      storage.addMotivo(motivo)
      setMotivosBackupState(prev => [...prev, motivo])

      // Atualizar cliente
      const clienteAtualizado = {
        ...clienteSelecionado,
        ...statusForm,
        motivoSemBackup: motivoBackup.trim(),
        dataAtualizacao: new Date().toISOString(),
        atencao: true
      }

      storage.updateCliente(clienteSelecionado.id, clienteAtualizado)
      setClientesState(prev => prev.map(c => c.id === clienteSelecionado.id ? clienteAtualizado : c))

      setShowModalMotivo(false)
      setMotivoBackup('')
      setClienteSelecionado(null)
      alert('✅ Status atualizado e motivo registrado!')
    } catch (error) {
      console.error('❌ Erro:', error)
      alert('❌ Erro ao salvar motivo')
    } finally {
      setSalvando(false)
    }
  }

  const togglePrioridade = (id: string, prioritarioAtual: boolean) => {
    if (salvando) return
    
    try {
      setSalvando(true)
      const updates = { prioritario: !prioritarioAtual }
      storage.updateCliente(id, updates)
      setClientesState(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
    } catch (error) {
      console.error('❌ Erro:', error)
    } finally {
      setSalvando(false)
    }
  }

  const toggleAtivo = (id: string, ativoAtual: boolean) => {
    if (salvando) return
    
    try {
      setSalvando(true)
      const novoStatus = !ativoAtual
      const updates = { ativo: novoStatus }
      
      storage.updateCliente(id, updates)
      setClientesState(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
      
      alert(novoStatus ? '✅ Cliente reativado!' : '✅ Cliente desativado!')
    } catch (error) {
      console.error('❌ Erro:', error)
      alert('❌ Erro ao alterar status')
    } finally {
      setSalvando(false)
    }
  }

  const abrirDetalhes = (cliente: Cliente) => {
    setClienteSelecionado(cliente)
    setShowModalDetalhes(true)
  }

  const abrirEdicao = (cliente: Cliente) => {
    setClienteSelecionado(cliente)
    setNovoCliente({
      nome: cliente.nome,
      sistema: cliente.sistema,
      emails: cliente.emails.length > 0 ? cliente.emails : [''],
      telefone: cliente.telefone
    })
    setShowModalEditarCliente(true)
  }

  // ===== ANALISTAS =====

  const adicionarAnalista = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!novoAnalista.trim()) {
      alert('❌ Digite um nome válido')
      return
    }

    const analista: Analista = {
      id: `analista:${Date.now()}`,
      nome: novoAnalista.trim(),
      dataCriacao: new Date().toISOString()
    }

    storage.addAnalista(analista)
    setAnalistasState(prev => [...prev, analista])
    setNovoAnalista('')
    alert('✅ Analista adicionado!')
  }

  const removerAnalista = (id: string) => {
    if (confirm('❓ Tem certeza que deseja remover este analista?')) {
      storage.deleteAnalista(id)
      setAnalistasState(prev => prev.filter(a => a.id !== id))
      alert('✅ Analista removido!')
    }
  }

  // ===== SISTEMAS =====

  const adicionarSistema = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!novoSistema.trim()) {
      alert('❌ Digite um nome válido')
      return
    }

    const sistema: Sistema = {
      id: `sistema:${Date.now()}`,
      nome: novoSistema.trim(),
      dataCriacao: new Date().toISOString()
    }

    storage.addSistema(sistema)
    setSistemasState(prev => [...prev, sistema])
    setNovoSistema('')
    alert('✅ Sistema adicionado!')
  }

  const removerSistema = (id: string) => {
    if (confirm('❓ Tem certeza que deseja remover este sistema?')) {
      storage.deleteSistema(id)
      setSistemasState(prev => prev.filter(s => s.id !== id))
      alert('✅ Sistema removido!')
    }
  }

  // ===== RESET MENSAL =====

  const executarResetMensal = () => {
    if (!confirm('⚠️ Tem certeza que deseja executar o reset mensal? Esta ação vai marcar todos os clientes pendentes como atrasados.')) {
      setShowModalSenha(false)
      setSenhaDigitada('')
      return
    }

    try {
      const dataAtual = new Date().toISOString()
      const mesAno = dataAtual.slice(0, 7)

      // Salvar histórico
      const historico = {
        id: `historico:${mesAno}`,
        mesAno,
        dataReset: dataAtual,
        totalClientes: clientes.length,
        clientesSnapshot: clientes
      }
      storage.addHistorico(historico)

      // Resetar clientes
      const clientesAtualizados = clientes.map(cliente => ({
        ...cliente,
        statusEnvio: 'Pendente' as StatusEnvio,
        statusBackup: 'Pendente' as const,
        analista: '',
        concluido: false,
        atencao: false,
        atrasado: cliente.ativo && cliente.statusEnvio === 'Pendente',
        dataAtualizacao: dataAtual
      }))

      storage.setClientes(clientesAtualizados)
      setClientesState(clientesAtualizados)
      
      storage.setUltimoReset(mesAno)
      setUltimoResetState(mesAno)

      alert(`✅ Reset mensal executado! ${clientesAtualizados.filter(c => c.atrasado).length} clientes marcados como atrasados.`)
    } catch (error) {
      console.error('❌ Erro:', error)
      alert('❌ Erro ao executar reset')
    }
  }

  // ===== IMPORTAR/EXPORTAR =====

  const exportarExcel = () => {
    const dados = clientes.map(c => ({
      Nome: c.nome,
      Sistema: c.sistema,
      'Email Primário': c.emailPrimario,
      Telefone: c.telefone,
      'Status Envio': c.statusEnvio,
      'Status Backup': c.statusBackup,
      Analista: c.analista,
      Prioritário: c.prioritario ? 'Sim' : 'Não',
      Ativo: c.ativo ? 'Sim' : 'Não',
      'Data Atualização': new Date(c.dataAtualizacao).toLocaleString('pt-BR')
    }))

    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes')
    XLSX.writeFile(wb, `control-gestao-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const importarExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        // Processar dados importados
        const novosClientes = jsonData.map((row: any) => ({
          id: `cliente:${Date.now()}-${Math.random()}`,
          nome: row.Nome || '',
          sistema: row.Sistema || '',
          emails: row['Email Primário'] ? [row['Email Primário']] : [],
          emailPrimario: row['Email Primário'] || '',
          telefone: row.Telefone || '',
          statusEnvio: (row['Status Envio'] || 'Pendente') as StatusEnvio,
          statusBackup: (row['Status Backup'] || 'Pendente') as 'Feito' | 'Pendente',
          analista: row.Analista || '',
          dataAtualizacao: new Date().toISOString(),
          concluido: false,
          prioritario: row.Prioritário === 'Sim',
          ativo: row.Ativo !== 'Não',
          atencao: false,
          atrasado: false
        }))

        storage.setClientes([...clientes, ...novosClientes])
        setClientesState(prev => [...prev, ...novosClientes])
        setShowModalImportar(false)
        alert(`✅ ${novosClientes.length} clientes importados!`)
      } catch (error) {
        console.error('❌ Erro ao importar:', error)
        alert('❌ Erro ao importar arquivo')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // ===== FILTROS =====

  const clientesFiltrados = clientes.filter(cliente => {
    // Filtro por aba
    switch (abaSelecionada) {
      case 'pendentes':
        if (cliente.concluido || !cliente.ativo || cliente.atencao) return false
        break
      case 'concluidos':
        if (!cliente.concluido || !cliente.ativo) return false
        break
      case 'atencao':
        if (!cliente.atencao || !cliente.ativo) return false
        break
      case 'atrasados':
        if (!cliente.atrasado || !cliente.ativo) return false
        break
      case 'desativados':
        if (cliente.ativo) return false
        break
      case 'relatorios':
        return true
    }

    // Filtro de busca
    if (pesquisa) {
      const termo = pesquisa.toLowerCase()
      if (
        !cliente.nome.toLowerCase().includes(termo) &&
        !cliente.sistema.toLowerCase().includes(termo) &&
        !cliente.emailPrimario.toLowerCase().includes(termo)
      ) {
        return false
      }
    }

    // Filtro de urgência
    if (filtroUrgente && !cliente.prioritario) return false

    // Filtro de sistema
    if (filtroSistema && cliente.sistema !== filtroSistema) return false

    // Filtro de status
    if (filtroStatusEnvio && cliente.statusEnvio !== filtroStatusEnvio) return false

    return true
  })

  // Ordenar alfabeticamente
  const clientesOrdenados = [...clientesFiltrados].sort((a, b) => {
    // Prioritários primeiro
    if (a.prioritario && !b.prioritario) return -1
    if (!a.prioritario && b.prioritario) return 1
    // Depois alfabético
    return a.nome.localeCompare(b.nome)
  })

  // ===== RELATÓRIOS =====

  const clientesEnviados = clientes.filter(c => 
    c.dataConclusaoEnvio && 
    (!periodoRelatorio.inicio || c.dataConclusaoEnvio >= periodoRelatorio.inicio) &&
    (!periodoRelatorio.fim || c.dataConclusaoEnvio <= periodoRelatorio.fim)
  )

  const clientesBackup = clientes.filter(c => 
    c.dataConclusaoBackup &&
    (!periodoRelatorio.inicio || c.dataConclusaoBackup >= periodoRelatorio.inicio) &&
    (!periodoRelatorio.fim || c.dataConclusaoBackup <= periodoRelatorio.fim)
  )

  const enviadosPorAnalista = analistas.map(analista => ({
    analista: analista.nome,
    total: clientesEnviados.filter(c => c.analista === analista.nome).length
  })).filter(r => r.total > 0)

  const enviadosPorSistema = sistemas.map(sistema => ({
    sistema: sistema.nome,
    total: clientesEnviados.filter(c => c.sistema === sistema.nome).length
  })).filter(r => r.total > 0)

  // ===== RENDER =====

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-[1800px] mx-auto mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-white text-3xl md:text-4xl mb-2">
                📊 CONTROL GESTÃO SISTEMAS
              </h1>
              <p className="text-blue-100">
                Sistema de Gerenciamento de Arquivos Fiscais e Backup Mensal
              </p>
              {ultimoReset && (
                <p className="text-blue-200 text-sm mt-1">
                  Último reset: {new Date(ultimoReset).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowModalCliente(true)}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Novo Cliente
              </button>
              <button
                onClick={() => validarSenha('analistas')}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-400 transition-colors"
              >
                <Users className="w-5 h-5" />
                Analistas
              </button>
              <button
                onClick={() => validarSenha('sistemas')}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-400 transition-colors"
              >
                <Settings className="w-5 h-5" />
                Sistemas
              </button>
              <button
                onClick={exportarExcel}
                className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-400 transition-colors"
              >
                <Download className="w-5 h-5" />
                Exportar
              </button>
              <button
                onClick={() => setShowModalImportar(true)}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-400 transition-colors"
              >
                <Upload className="w-5 h-5" />
                Importar
              </button>
              <button
                onClick={() => validarSenha('reset')}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-400 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Reset Mensal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="max-w-[1800px] mx-auto mb-6">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome, sistema ou email..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filtros
            </button>
          </div>

          {showFiltros && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filtroUrgente}
                    onChange={(e) => setFiltroUrgente(e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>Apenas Urgentes</span>
                </label>
              </div>
              <div>
                <select
                  value={filtroSistema}
                  onChange={(e) => setFiltroSistema(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os Sistemas</option>
                  {sistemas.map(s => (
                    <option key={s.id} value={s.nome}>{s.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={filtroStatusEnvio}
                  onChange={(e) => setFiltroStatusEnvio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os Status</option>
                  <option value="Enviado">Enviado</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Recém Implantado">Recém Implantado</option>
                  <option value="Gerencial">Gerencial</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Não Teve Vendas">Não Teve Vendas</option>
                  <option value="Bloqueio SEFAZ">Bloqueio SEFAZ</option>
                  <option value="Bloqueio Financeiro">Bloqueio Financeiro</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Abas */}
      <div className="max-w-[1800px] mx-auto mb-6">
        <div className="bg-white rounded-xl shadow-lg p-2">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'pendentes' as AbaType, label: 'Pendentes', count: clientes.filter(c => !c.concluido && c.ativo && !c.atencao).length },
              { id: 'concluidos' as AbaType, label: 'Concluídos', count: clientes.filter(c => c.concluido && c.ativo).length },
              { id: 'atencao' as AbaType, label: 'Necessita Atenção', count: clientes.filter(c => c.atencao && c.ativo).length },
              { id: 'atrasados' as AbaType, label: 'Atrasos Envio', count: clientes.filter(c => c.atrasado && c.ativo).length },
              { id: 'relatorios' as AbaType, label: 'Relatórios', count: null },
              { id: 'desativados' as AbaType, label: 'Desativados', count: clientes.filter(c => !c.ativo).length },
            ].map(aba => (
              <button
                key={aba.id}
                onClick={() => setAbaSelecionada(aba.id)}
                className={`flex-1 min-w-[140px] px-4 py-3 rounded-lg transition-all ${
                  abaSelecionada === aba.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {aba.label}
                {aba.count !== null && (
                  <span className="ml-2 px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs">
                    {aba.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-[1800px] mx-auto">
        {abaSelecionada === 'relatorios' ? (
          // Relatórios
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Relatórios
            </h2>

            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2">Data Início</label>
                <input
                  type="date"
                  value={periodoRelatorio.inicio}
                  onChange={(e) => setPeriodoRelatorio(prev => ({ ...prev, inicio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Data Fim</label>
                <input
                  type="date"
                  value={periodoRelatorio.fim}
                  onChange={(e) => setPeriodoRelatorio(prev => ({ ...prev, fim: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Total Enviados</div>
                <div className="text-3xl">{clientesEnviados.length}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Total Backups</div>
                <div className="text-3xl">{clientesBackup.length}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Taxa Conclusão</div>
                <div className="text-3xl">
                  {clientes.length > 0 ? Math.round((clientes.filter(c => c.concluido).length / clientes.length) * 100) : 0}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg mb-4">Por Analista</h3>
                <div className="space-y-2">
                  {enviadosPorAnalista.map(r => (
                    <div key={r.analista} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <span>{r.analista}</span>
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">{r.total}</span>
                    </div>
                  ))}
                  {enviadosPorAnalista.length === 0 && (
                    <div className="text-center text-gray-500 py-4">Nenhum dado no período</div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg mb-4">Por Sistema</h3>
                <div className="space-y-2">
                  {enviadosPorSistema.map(r => (
                    <div key={r.sistema} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <span>{r.sistema}</span>
                      <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">{r.total}</span>
                    </div>
                  ))}
                  {enviadosPorSistema.length === 0 && (
                    <div className="text-center text-gray-500 py-4">Nenhum dado no período</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Lista de Clientes
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-600">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-600">Sistema</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-600">Envio</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-600">Backup</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-600">Analista</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clientesOrdenados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Nenhum cliente encontrado
                      </td>
                    </tr>
                  ) : (
                    clientesOrdenados.map(cliente => (
                      <tr
                        key={cliente.id}
                        className={`hover:bg-gray-50 ${cliente.prioritario ? 'bg-red-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {cliente.prioritario && <Star className="w-4 h-4 text-red-500 fill-red-500" />}
                            <div>
                              <div>{cliente.nome}</div>
                              <div className="text-sm text-gray-500">{cliente.emailPrimario}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">{cliente.sistema}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            cliente.statusEnvio === 'Enviado' ? 'bg-green-100 text-green-800' :
                            cliente.statusEnvio === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {cliente.statusEnvio}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            cliente.statusBackup === 'Feito' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {cliente.statusBackup}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{cliente.analista || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => abrirModalStatus(cliente)}
                              className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Atualizar Status"
                            >
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => abrirDetalhes(cliente)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Ver Detalhes"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => abrirEdicao(cliente)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => togglePrioridade(cliente.id, cliente.prioritario)}
                              className="p-2 hover:bg-yellow-100 rounded-lg transition-colors"
                              title={cliente.prioritario ? "Remover Urgência" : "Marcar Urgente"}
                            >
                              <Star className={`w-4 h-4 ${cliente.prioritario ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                            </button>
                            <button
                              onClick={() => toggleAtivo(cliente.id, cliente.ativo)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                              title={cliente.ativo ? "Desativar" : "Reativar"}
                            >
                              <Ban className={`w-4 h-4 ${!cliente.ativo ? 'text-red-500' : 'text-gray-400'}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAIS - Simplificando... vou continuar no próximo bloco */}
      
      {/* Modal Novo Cliente */}
      {showModalCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl">Novo Cliente</h3>
              <button onClick={() => setShowModalCliente(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={adicionarCliente} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Nome *</label>
                <input
                  type="text"
                  value={novoCliente.nome}
                  onChange={(e) => setNovoCliente(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Sistema *</label>
                <select
                  value={novoCliente.sistema}
                  onChange={(e) => setNovoCliente(prev => ({ ...prev, sistema: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Selecione...</option>
                  {sistemas.map(s => (
                    <option key={s.id} value={s.nome}>{s.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                  type="email"
                  value={novoCliente.emails[0]}
                  onChange={(e) => setNovoCliente(prev => ({ ...prev, emails: [e.target.value] }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Telefone</label>
                <input
                  type="tel"
                  value={novoCliente.telefone}
                  onChange={(e) => setNovoCliente(prev => ({ ...prev, telefone: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModalCliente(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Status */}
      {showModalStatus && clienteSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl">Atualizar Status</h3>
              <button onClick={() => setShowModalStatus(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={salvarStatus} className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-2">Cliente: {clienteSelecionado.nome}</div>
              </div>
              <div>
                <label className="block text-sm mb-1">Status Envio</label>
                <select
                  value={statusForm.statusEnvio}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, statusEnvio: e.target.value as StatusEnvio }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="Enviado">Enviado</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Recém Implantado">Recém Implantado</option>
                  <option value="Gerencial">Gerencial</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Não Teve Vendas">Não Teve Vendas</option>
                  <option value="Bloqueio SEFAZ">Bloqueio SEFAZ</option>
                  <option value="Bloqueio Financeiro">Bloqueio Financeiro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Status Backup</label>
                <select
                  value={statusForm.statusBackup}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, statusBackup: e.target.value as 'Feito' | 'Pendente' }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="Feito">Feito</option>
                  <option value="Pendente">Pendente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Analista</label>
                <select
                  value={statusForm.analista}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, analista: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Selecione...</option>
                  {analistas.map(a => (
                    <option key={a.id} value={a.nome}>{a.nome}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModalStatus(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Motivo Backup */}
      {showModalMotivo && clienteSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-2 mb-4 text-orange-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-xl">Backup Pendente</h3>
            </div>
            <form onSubmit={salvarMotivoBackup} className="space-y-4">
              <div>
                <p className="text-gray-600 mb-4">
                  O envio foi marcado como concluído, mas o backup está pendente.
                </p>
                <label className="block text-sm mb-1">Por que o backup não foi realizado? *</label>
                <textarea
                  value={motivoBackup}
                  onChange={(e) => setMotivoBackup(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Digite o motivo..."
                  required
                />
              </div>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <div>Cliente: {clienteSelecionado.nome}</div>
                <div>Analista: {statusForm.analista || 'Não informado'}</div>
                <div>Data: {new Date().toLocaleDateString('pt-BR')}</div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModalMotivo(false)
                    setShowModalStatus(true)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar e Continuar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Senha */}
      {showModalSenha && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-xl mb-4">Digite a Senha</h3>
            <input
              type="password"
              value={senhaDigitada}
              onChange={(e) => setSenhaDigitada(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg mb-4"
              placeholder="Senha"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowModalSenha(false)
                  setSenhaDigitada('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={executarAcaoProtegida}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sistemas */}
      {showModalSistema && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl">Gerenciar Sistemas</h3>
              <button onClick={() => setShowModalSistema(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={adicionarSistema} className="mb-4">
              <label className="block text-sm mb-2">Adicionar Novo Sistema</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={novoSistema}
                  onChange={(e) => setNovoSistema(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg"
                  placeholder="Nome do sistema"
                />
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </form>

            <div className="space-y-2">
              <div className="text-sm text-gray-600 mb-2">Sistemas Cadastrados</div>
              {sistemas.length === 0 ? (
                <div className="text-center text-gray-500 py-4">Nenhum sistema cadastrado</div>
              ) : (
                sistemas.map(sistema => (
                  <div key={sistema.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span>{sistema.nome}</span>
                    <button
                      onClick={() => removerSistema(sistema.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowModalSistema(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal Analistas */}
      {showModalAnalista && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl">Gerenciar Analistas</h3>
              <button onClick={() => setShowModalAnalista(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={adicionarAnalista} className="mb-4">
              <label className="block text-sm mb-2">Adicionar Novo Analista</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={novoAnalista}
                  onChange={(e) => setNovoAnalista(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg"
                  placeholder="Nome do analista"
                />
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </form>

            <div className="space-y-2">
              <div className="text-sm text-gray-600 mb-2">Analistas Cadastrados</div>
              {analistas.length === 0 ? (
                <div className="text-center text-gray-500 py-4">Nenhum analista cadastrado</div>
              ) : (
                analistas.map(analista => (
                  <div key={analista.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span>{analista.nome}</span>
                    <button
                      onClick={() => removerAnalista(analista.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowModalAnalista(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal Importar */}
      {showModalImportar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl">Importar Excel</h3>
              <button onClick={() => setShowModalImportar(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={importarExcel}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <button
              onClick={() => setShowModalImportar(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal Editar Cliente */}
      {showModalEditarCliente && clienteSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl">Editar Cliente</h3>
              <button onClick={() => setShowModalEditarCliente(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={atualizarCliente} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Nome *</label>
                <input
                  type="text"
                  value={novoCliente.nome}
                  onChange={(e) => setNovoCliente(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Sistema *</label>
                <select
                  value={novoCliente.sistema}
                  onChange={(e) => setNovoCliente(prev => ({ ...prev, sistema: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Selecione...</option>
                  {sistemas.map(s => (
                    <option key={s.id} value={s.nome}>{s.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                  type="email"
                  value={novoCliente.emails[0]}
                  onChange={(e) => setNovoCliente(prev => ({ ...prev, emails: [e.target.value] }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Telefone</label>
                <input
                  type="tel"
                  value={novoCliente.telefone}
                  onChange={(e) => setNovoCliente(prev => ({ ...prev, telefone: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModalEditarCliente(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes */}
      {showModalDetalhes && clienteSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl">Detalhes do Cliente</h3>
              <button onClick={() => setShowModalDetalhes(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Nome</div>
                <div>{clienteSelecionado.nome}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Sistema</div>
                <div>{clienteSelecionado.sistema}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Email</div>
                <div>{clienteSelecionado.emailPrimario || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Telefone</div>
                <div>{clienteSelecionado.telefone || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Status Envio</div>
                <div>{clienteSelecionado.statusEnvio}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Status Backup</div>
                <div>{clienteSelecionado.statusBackup}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Analista</div>
                <div>{clienteSelecionado.analista || '-'}</div>
              </div>
              {clienteSelecionado.motivoSemBackup && (
                <div>
                  <div className="text-sm text-gray-600">Motivo Backup Pendente</div>
                  <div className="bg-yellow-50 p-2 rounded">{clienteSelecionado.motivoSemBackup}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-600">Última Atualização</div>
                <div>{new Date(clienteSelecionado.dataAtualizacao).toLocaleString('pt-BR')}</div>
              </div>
            </div>
            <button
              onClick={() => setShowModalDetalhes(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
