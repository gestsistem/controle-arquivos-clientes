import React, { useState, useEffect } from 'react'
import { Plus, RefreshCw, Trash2, Search, Users, Star, Eye, Download, Upload, BarChart3, TrendingUp, X, Ban, CheckCircle } from 'lucide-react'
import { projectId, publicAnonKey } from './utils/supabase/info'
import * as XLSX from 'xlsx'

interface Cliente {
  id: string
  nome: string
  sistema: string
  email: string
  telefone: string
  statusEnvio: 'Enviado' | 'Pendente'
  statusBackup: 'Feito' | 'Pendente'
  analista: string
  dataAtualizacao: string
  concluido: boolean
  prioritario: boolean
  ativo: boolean
}

interface Analista {
  id: string
  nome: string
  dataCriacao: string
}

type AbaType = 'pendentes' | 'concluidos' | 'desativados' | 'relatorios'

export default function App() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [analistas, setAnalistas] = useState<Analista[]>([])
  const [loading, setLoading] = useState(true)
  const [abaSelecionada, setAbaSelecionada] = useState<AbaType>('pendentes')
  const [pesquisa, setPesquisa] = useState('')
  const [ultimoReset, setUltimoReset] = useState<string | null>(null)
  
  // Modais
  const [showModalCliente, setShowModalCliente] = useState(false)
  const [showModalAnalista, setShowModalAnalista] = useState(false)
  const [showModalStatus, setShowModalStatus] = useState(false)
  const [showModalDetalhes, setShowModalDetalhes] = useState(false)
  const [showModalImportar, setShowModalImportar] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  
  // Forms
  const [novoCliente, setNovoCliente] = useState({ nome: '', sistema: '', email: '', telefone: '' })
  const [novoAnalista, setNovoAnalista] = useState({ nome: '' })
  const [statusForm, setStatusForm] = useState({
    statusEnvio: 'Pendente' as 'Enviado' | 'Pendente',
    statusBackup: 'Pendente' as 'Feito' | 'Pendente',
    analista: ''
  })

  const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c70d4af9`

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setLoading(true)
    try {
      const [clientesRes, analistasRes, resetRes] = await Promise.all([
        fetch(`${API_URL}/clientes`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`${API_URL}/analistas`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`${API_URL}/ultimo-reset`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        })
      ])

      if (clientesRes.ok) {
        const data = await clientesRes.json()
        setClientes(data.clientes)
      }

      if (analistasRes.ok) {
        const data = await analistasRes.json()
        setAnalistas(data.analistas)
      }

      if (resetRes.ok) {
        const data = await resetRes.json()
        setUltimoReset(data.ultimoReset)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const adicionarCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(novoCliente)
      })

      if (res.ok) {
        setNovoCliente({ nome: '', sistema: '', email: '', telefone: '' })
        setShowModalCliente(false)
        await carregarDados()
      } else {
        alert('Erro ao adicionar cliente. Verifique os dados.')
      }
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error)
      alert('Erro ao adicionar cliente.')
    }
  }

  const adicionarAnalista = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/analistas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(novoAnalista)
      })

      if (res.ok) {
        setNovoAnalista({ nome: '' })
        setShowModalAnalista(false)
        await carregarDados()
      }
    } catch (error) {
      console.error('Erro ao adicionar analista:', error)
    }
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

  const abrirModalDetalhes = (cliente: Cliente) => {
    setClienteSelecionado(cliente)
    setShowModalDetalhes(true)
  }

  const salvarStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clienteSelecionado) return

    try {
      const res = await fetch(`${API_URL}/clientes/${clienteSelecionado.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(statusForm)
      })

      if (res.ok) {
        setShowModalStatus(false)
        setClienteSelecionado(null)
        await carregarDados()
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const deletarCliente = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este cliente?')) return

    try {
      const res = await fetch(`${API_URL}/clientes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      })

      if (res.ok) {
        await carregarDados()
      }
    } catch (error) {
      console.error('Erro ao deletar cliente:', error)
    }
  }

  const deletarAnalista = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este analista?')) return

    try {
      const res = await fetch(`${API_URL}/analistas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      })

      if (res.ok) {
        await carregarDados()
      }
    } catch (error) {
      console.error('Erro ao deletar analista:', error)
    }
  }

  const executarResetMensal = async () => {
    if (!confirm('Isso irá resetar todos os status para Pendente e salvar um histórico. Deseja continuar?')) return

    try {
      const res = await fetch(`${API_URL}/reset-mensal`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      })

      if (res.ok) {
        // Exportar antes de resetar
        exportarParaExcel()
        await carregarDados()
        alert('Reset mensal executado com sucesso! Histórico exportado para Excel.')
      }
    } catch (error) {
      console.error('Erro ao executar reset mensal:', error)
    }
  }

  const togglePrioridade = async (id: string, prioritarioAtual: boolean) => {
    try {
      const res = await fetch(`${API_URL}/clientes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ prioritario: !prioritarioAtual })
      })

      if (res.ok) {
        await carregarDados()
      }
    } catch (error) {
      console.error('Erro ao atualizar prioridade:', error)
    }
  }

  const exportarParaExcel = () => {
    const dados = clientes.map(c => ({
      'Cliente': c.nome,
      'Sistema': c.sistema,
      'E-mail': c.email,
      'Telefone': c.telefone,
      'Status Envio': c.statusEnvio,
      'Status Backup': c.statusBackup,
      'Analista': c.analista || 'Não atribuído',
      'Prioritário': c.prioritario ? 'Sim' : 'Não',
      'Concluído': c.concluido ? 'Sim' : 'Não'
    }))

    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes')
    
    const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    XLSX.writeFile(wb, `Controle_Clientes_${mesAtual}.xlsx`)
  }

  const importarExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

        let sucessos = 0
        let erros = 0

        for (const row of jsonData) {
          const clienteData = {
            nome: row['CLIENTE'] || row['Cliente'] || '',
            sistema: row['SISTEMA'] || row['Sistema'] || '',
            email: row['E-MAIL'] || row['EMAIL'] || row['Email'] || '',
            telefone: row['NUMERO'] || row['TELEFONE'] || row['Telefone'] || ''
          }

          if (clienteData.nome && clienteData.sistema && clienteData.email && clienteData.telefone) {
            try {
              const res = await fetch(`${API_URL}/clientes`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${publicAnonKey}`
                },
                body: JSON.stringify(clienteData)
              })
              
              if (res.ok) {
                sucessos++
              } else {
                erros++
              }
            } catch {
              erros++
            }
          } else {
            erros++
          }
        }

        alert(`Importação concluída!\nSucessos: ${sucessos}\nErros: ${erros}`)
        setShowModalImportar(false)
        await carregarDados()
      } catch (error) {
        console.error('Erro ao importar:', error)
        alert('Erro ao processar arquivo. Verifique o formato.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const clientesFiltrados = clientes
    .filter(c => abaSelecionada === 'pendentes' ? !c.concluido : c.concluido)
    .filter(c => 
      c.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
      c.sistema.toLowerCase().includes(pesquisa.toLowerCase()) ||
      c.analista.toLowerCase().includes(pesquisa.toLowerCase()) ||
      c.email.toLowerCase().includes(pesquisa.toLowerCase())
    )
    .sort((a, b) => {
      if (a.prioritario && !b.prioritario) return -1
      if (!a.prioritario && b.prioritario) return 1
      return 0
    })

  const clientesPendentes = clientes.filter(c => !c.concluido)
  const clientesConcluidos = clientes.filter(c => c.concluido)
  const clientesPrioritarios = clientes.filter(c => c.prioritario && !c.concluido)

  // Relatórios
  const mesAtual = new Date().toISOString().slice(0, 7)
  const anoAtual = new Date().getFullYear().toString()
  
  const enviadosMes = clientes.filter(c => 
    c.statusEnvio === 'Enviado' && 
    c.dataAtualizacao.startsWith(mesAtual)
  ).length

  const rankingAnalistas = analistas.map(analista => {
    const enviosMes = clientes.filter(c => 
      c.analista === analista.nome && 
      c.statusEnvio === 'Enviado' &&
      c.dataAtualizacao.startsWith(mesAtual)
    ).length

    const enviosAno = clientes.filter(c => 
      c.analista === analista.nome && 
      c.statusEnvio === 'Enviado' &&
      c.dataAtualizacao.startsWith(anoAtual)
    ).length

    return { nome: analista.nome, enviosMes, enviosAno }
  }).sort((a, b) => b.enviosMes - a.enviosMes)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-green-700 text-xl">Carregando sistema...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Melhorado */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg p-8 mb-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-white mb-2 text-3xl">📊 Controle de Arquivos</h1>
              <p className="text-green-100">
                Sistema de Gestão de Clientes e Backups
              </p>
              {ultimoReset && (
                <p className="text-green-200 mt-2">
                  Último reset: {new Date(ultimoReset + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowModalAnalista(true)}
                className="flex items-center gap-2 px-5 py-3 bg-white text-green-700 rounded-xl hover:bg-green-50 transition-all shadow-md hover:shadow-lg"
              >
                <Users className="w-5 h-5" />
                Analistas
              </button>
              <button
                onClick={() => setShowModalImportar(true)}
                className="flex items-center gap-2 px-5 py-3 bg-white text-green-700 rounded-xl hover:bg-green-50 transition-all shadow-md hover:shadow-lg"
              >
                <Upload className="w-5 h-5" />
                Importar
              </button>
              <button
                onClick={exportarParaExcel}
                className="flex items-center gap-2 px-5 py-3 bg-white text-green-700 rounded-xl hover:bg-green-50 transition-all shadow-md hover:shadow-lg"
              >
                <Download className="w-5 h-5" />
                Exportar
              </button>
              <button
                onClick={executarResetMensal}
                className="flex items-center gap-2 px-5 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-md hover:shadow-lg"
              >
                <RefreshCw className="w-5 h-5" />
                Reset Mensal
              </button>
              <button
                onClick={() => setShowModalCliente(true)}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Novo Cliente
              </button>
            </div>
          </div>

          {/* Campo de Pesquisa */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-600 w-5 h-5" />
            <input
              type="text"
              placeholder="Pesquisar por cliente, sistema, analista ou email..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-white/30 rounded-xl focus:ring-2 focus:ring-white focus:border-white bg-white/90 text-green-900 placeholder-green-600"
            />
          </div>
        </div>

        {/* Estatísticas Destacadas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
            <div className="text-green-600 mb-1">Total</div>
            <div className="text-green-900 text-2xl">{clientes.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
            <div className="text-yellow-600 mb-1">Pendentes</div>
            <div className="text-yellow-900 text-2xl">{clientesPendentes.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-600 hover:shadow-lg transition-shadow">
            <div className="text-green-700 mb-1">Concluídos</div>
            <div className="text-green-900 text-2xl">{clientesConcluidos.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
            <div className="text-red-600 mb-1">Urgentes</div>
            <div className="text-red-900 text-2xl">{clientesPrioritarios.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
            <div className="text-blue-600 mb-1">Analistas</div>
            <div className="text-blue-900 text-2xl">{analistas.length}</div>
          </div>
        </div>

        {/* Tabs Melhoradas */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-green-100">
          <div className="flex border-b border-green-100 bg-green-50">
            <button
              onClick={() => setAbaSelecionada('pendentes')}
              className={`flex-1 px-6 py-4 font-medium transition-all ${
                abaSelecionada === 'pendentes'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-transparent text-green-700 hover:bg-green-100'
              }`}
            >
              🕐 Pendentes ({clientesPendentes.length})
            </button>
            <button
              onClick={() => setAbaSelecionada('concluidos')}
              className={`flex-1 px-6 py-4 font-medium transition-all ${
                abaSelecionada === 'concluidos'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-transparent text-green-700 hover:bg-green-100'
              }`}
            >
              ✅ Concluídos ({clientesConcluidos.length})
            </button>
            <button
              onClick={() => setAbaSelecionada('relatorios')}
              className={`flex-1 px-6 py-4 font-medium transition-all ${
                abaSelecionada === 'relatorios'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-transparent text-green-700 hover:bg-green-100'
              }`}
            >
              📈 Relatórios
            </button>
          </div>

          {/* Conteúdo das Abas */}
          {abaSelecionada === 'relatorios' ? (
            <div className="p-8">
              <h2 className="text-green-900 mb-6">Relatórios e Estatísticas</h2>
              
              {/* Enviados do Mês */}
              <div className="bg-green-50 rounded-xl p-6 mb-6 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  <h3 className="text-green-900">Enviados do Mês</h3>
                </div>
                <div className="text-4xl text-green-700 mb-2">{enviadosMes}</div>
                <p className="text-green-600">
                  Total de envios concluídos em {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Ranking de Analistas */}
              <div className="bg-white rounded-xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                  <h3 className="text-green-900">Ranking de Analistas</h3>
                </div>
                
                <div className="space-y-4">
                  {rankingAnalistas.length === 0 ? (
                    <p className="text-green-600 text-center py-4">Nenhum envio registrado ainda</p>
                  ) : (
                    rankingAnalistas.map((analista, index) => (
                      <div key={analista.nome} className="flex items-center gap-4 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-500' : 'bg-green-500'
                        }`}>
                          {index + 1}º
                        </div>
                        <div className="flex-1">
                          <div className="text-green-900">{analista.nome}</div>
                          <div className="text-green-600">
                            {analista.enviosMes} envios este mês | {analista.enviosAno} no ano
                          </div>
                        </div>
                        <div className="text-green-700 text-xl">
                          {analista.enviosMes > 0 && '🏆'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Tabela de Clientes */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-50 border-b-2 border-green-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-green-800">Cliente</th>
                    <th className="px-6 py-4 text-left text-green-800">Sistema</th>
                    <th className="px-6 py-4 text-left text-green-800">Status Envio</th>
                    <th className="px-6 py-4 text-left text-green-800">Status Backup</th>
                    <th className="px-6 py-4 text-left text-green-800">Analista</th>
                    <th className="px-6 py-4 text-left text-green-800">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-100">
                  {clientesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-green-600">
                        {pesquisa ? '🔍 Nenhum cliente encontrado.' : 
                         abaSelecionada === 'pendentes' 
                           ? '📋 Nenhum cliente pendente.' 
                           : '✅ Nenhum cliente concluído.'}
                      </td>
                    </tr>
                  ) : (
                    clientesFiltrados.map((cliente) => (
                      <tr 
                        key={cliente.id} 
                        className={`transition-all hover:shadow-md ${
                          cliente.prioritario 
                            ? 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500' 
                            : 'hover:bg-green-50'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {cliente.prioritario && (
                              <Star className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" />
                            )}
                            <span className={cliente.prioritario ? 'text-red-900' : 'text-green-900'}>
                              {cliente.nome}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-green-700">{cliente.sistema}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                            cliente.statusEnvio === 'Enviado'
                              ? 'bg-green-100 text-green-800 border border-green-300'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                          }`}>
                            {cliente.statusEnvio === 'Enviado' ? '✓' : '○'} {cliente.statusEnvio}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                            cliente.statusBackup === 'Feito'
                              ? 'bg-green-100 text-green-800 border border-green-300'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                          }`}>
                            {cliente.statusBackup === 'Feito' ? '✓' : '○'} {cliente.statusBackup}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-green-700">
                          {cliente.analista || <span className="text-green-400">Não atribuído</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => abrirModalDetalhes(cliente)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all"
                              title="Ver detalhes"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => togglePrioridade(cliente.id, cliente.prioritario)}
                              className={`p-2 transition-all rounded-lg ${
                                cliente.prioritario 
                                  ? 'text-red-600 hover:text-red-800 hover:bg-red-50' 
                                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title={cliente.prioritario ? 'Remover urgência' : 'Marcar como urgente'}
                            >
                              <Star className={`w-5 h-5 ${cliente.prioritario ? 'fill-red-600' : ''}`} />
                            </button>
                            <button
                              onClick={() => abrirModalStatus(cliente)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm hover:shadow-md"
                            >
                              Atualizar
                            </button>
                            <button
                              onClick={() => deletarCliente(cliente.id)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Novo Cliente */}
      {showModalCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-green-900 text-2xl">Novo Cliente</h2>
              <button onClick={() => setShowModalCliente(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={adicionarCliente} className="space-y-4">
              <div>
                <label className="block text-green-800 mb-2">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  value={novoCliente.nome}
                  onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ex: Empresa ABC"
                />
              </div>
              <div>
                <label className="block text-green-800 mb-2">Sistema *</label>
                <input
                  type="text"
                  required
                  value={novoCliente.sistema}
                  onChange={(e) => setNovoCliente({ ...novoCliente, sistema: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ex: ERP, CRM"
                />
              </div>
              <div>
                <label className="block text-green-800 mb-2">E-mail *</label>
                <input
                  type="email"
                  required
                  value={novoCliente.email}
                  onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="contato@empresa.com"
                />
              </div>
              <div>
                <label className="block text-green-800 mb-2">Telefone *</label>
                <input
                  type="tel"
                  required
                  value={novoCliente.telefone}
                  onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModalCliente(false)
                    setNovoCliente({ nome: '', sistema: '', email: '', telefone: '' })
                  }}
                  className="flex-1 px-4 py-3 border-2 border-green-300 text-green-700 rounded-xl hover:bg-green-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalhes do Cliente */}
      {showModalDetalhes && clienteSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-green-900 text-2xl">Detalhes do Cliente</h2>
              <button onClick={() => setShowModalDetalhes(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <div className="text-green-600 mb-1">Cliente</div>
                <div className="text-green-900 text-xl">{clienteSelecionado.nome}</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <div className="text-green-600 mb-1">Sistema</div>
                <div className="text-green-900">{clienteSelecionado.sistema}</div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div className="text-blue-600 mb-1">E-mail</div>
                <div className="text-blue-900">{clienteSelecionado.email}</div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div className="text-blue-600 mb-1">Telefone</div>
                <div className="text-blue-900">{clienteSelecionado.telefone}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <div className="text-yellow-600 mb-1">Status Envio</div>
                  <div className="text-yellow-900">{clienteSelecionado.statusEnvio}</div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <div className="text-yellow-600 mb-1">Status Backup</div>
                  <div className="text-yellow-900">{clienteSelecionado.statusBackup}</div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                <div className="text-purple-600 mb-1">Analista Responsável</div>
                <div className="text-purple-900">
                  {clienteSelecionado.analista || 'Não atribuído'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowModalDetalhes(false)}
              className="w-full mt-6 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Importar Excel */}
      {showModalImportar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-green-900 text-2xl">Importar Clientes</h2>
              <button onClick={() => setShowModalImportar(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-green-700 mb-4">
                O arquivo Excel deve conter as seguintes colunas:
              </p>
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <ul className="space-y-2 text-green-900">
                  <li>• <strong>CLIENTE</strong> - Nome do cliente</li>
                  <li>• <strong>SISTEMA</strong> - Sistema utilizado</li>
                  <li>• <strong>E-MAIL</strong> - Email de contato</li>
                  <li>• <strong>NUMERO</strong> - Telefone</li>
                </ul>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-green-300 border-dashed rounded-xl cursor-pointer bg-green-50 hover:bg-green-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-green-600" />
                  <p className="text-green-700">Clique para selecionar arquivo Excel</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".xlsx,.xls"
                  onChange={importarExcel}
                />
              </label>
            </div>

            <button
              onClick={() => setShowModalImportar(false)}
              className="w-full px-4 py-3 border-2 border-green-300 text-green-700 rounded-xl hover:bg-green-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Gerenciar Analistas */}
      {showModalAnalista && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-green-900 text-2xl">Gerenciar Analistas</h2>
              <button onClick={() => setShowModalAnalista(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={adicionarAnalista} className="mb-6">
              <label className="block text-green-800 mb-2">Adicionar Novo Analista</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={novoAnalista.nome}
                  onChange={(e) => setNovoAnalista({ nome: e.target.value })}
                  className="flex-1 px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Nome do analista"
                />
                <button
                  type="submit"
                  className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </form>

            <div className="mb-6">
              <div className="text-green-800 mb-3">Analistas Cadastrados</div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {analistas.length === 0 ? (
                  <p className="text-green-600 text-center py-4">Nenhum analista cadastrado</p>
                ) : (
                  analistas.map((analista) => (
                    <div key={analista.id} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition-colors">
                      <span className="text-green-900">{analista.nome}</span>
                      <button
                        onClick={() => deletarAnalista(analista.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setShowModalAnalista(false)}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Atualizar Status */}
      {showModalStatus && clienteSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-green-900 text-2xl">Atualizar Status</h2>
                <p className="text-green-600">{clienteSelecionado.nome}</p>
              </div>
              <button onClick={() => setShowModalStatus(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={salvarStatus} className="space-y-4">
              <div>
                <label className="block text-green-800 mb-2">Status de Envio</label>
                <select
                  value={statusForm.statusEnvio}
                  onChange={(e) => setStatusForm({ ...statusForm, statusEnvio: e.target.value as 'Enviado' | 'Pendente' })}
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Enviado">Enviado</option>
                </select>
              </div>

              <div>
                <label className="block text-green-800 mb-2">Status de Backup</label>
                <select
                  value={statusForm.statusBackup}
                  onChange={(e) => setStatusForm({ ...statusForm, statusBackup: e.target.value as 'Feito' | 'Pendente' })}
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Feito">Feito</option>
                </select>
              </div>

              <div>
                <label className="block text-green-800 mb-2">Analista Responsável</label>
                <select
                  value={statusForm.analista}
                  onChange={(e) => setStatusForm({ ...statusForm, analista: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Selecione um analista</option>
                  {analistas.map((analista) => (
                    <option key={analista.id} value={analista.nome}>
                      {analista.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModalStatus(false)
                    setClienteSelecionado(null)
                  }}
                  className="flex-1 px-4 py-3 border-2 border-green-300 text-green-700 rounded-xl hover:bg-green-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}