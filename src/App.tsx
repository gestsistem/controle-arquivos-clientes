import React, { useState, useEffect } from 'react'
import { Plus, RefreshCw, Search, Users, Star, Eye, Download, Upload, BarChart3, TrendingUp, X, Ban, CheckCircle, Edit, Settings, Filter, AlertTriangle, Clock } from 'lucide-react'
import { projectId, publicAnonKey } from './utils/supabase/info'
import * as XLSX from 'xlsx'

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
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [analistas, setAnalistas] = useState<Analista[]>([])
  const [sistemas, setSistemas] = useState<Sistema[]>([])
  const [motivosBackup, setMotivosBackup] = useState<MotivoBackup[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [abaSelecionada, setAbaSelecionada] = useState<AbaType>('pendentes')
  const [pesquisa, setPesquisa] = useState('')
  const [ultimoReset, setUltimoReset] = useState<string | null>(null)
  
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
  const [clienteEdicao, setClienteEdicao] = useState<Cliente | null>(null)
  const [novoAnalista, setNovoAnalista] = useState({ nome: '' })
  const [novoSistema, setNovoSistema] = useState({ nome: '' })
  const [motivoBackup, setMotivoBackup] = useState('')
  const [senhaDigitada, setSenhaDigitada] = useState('')
  const [statusForm, setStatusForm] = useState({
    statusEnvio: 'Pendente' as StatusEnvio,
    statusBackup: 'Pendente' as 'Feito' | 'Pendente',
    analista: ''
  })

  // Relatórios com filtro de data
  const [dataInicioRelatorio, setDataInicioRelatorio] = useState('')
  const [dataFimRelatorio, setDataFimRelatorio] = useState('')

  const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c70d4af9`

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setLoading(true)
    try {
      const [clientesRes, analistasRes, sistemasRes, resetRes, motivosRes] = await Promise.all([
        fetch(`${API_URL}/clientes`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`${API_URL}/analistas`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`${API_URL}/sistemas`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`${API_URL}/ultimo-reset`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`${API_URL}/motivos-backup`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        })
      ])

      if (clientesRes.ok) {
        const data = await clientesRes.json()
        // Atualizar clientes existentes sem perder dados
        const clientesAtualizados = (data.clientes || []).map((c: any) => ({
          ...c,
          emails: c.emails || (c.email ? [c.email] : [c.emailPrimario || '']),
          emailPrimario: c.emailPrimario || c.email || (c.emails && c.emails[0]) || '',
          telefone: c.telefone || '',
          ativo: c.ativo !== undefined ? c.ativo : true,
          atencao: c.atencao || false,
          atrasado: c.atrasado || false
        }))
        setClientes(clientesAtualizados)
      }

      if (analistasRes.ok) {
        const data = await analistasRes.json()
        setAnalistas(data.analistas || [])
      }

      if (sistemasRes.ok) {
        const data = await sistemasRes.json()
        setSistemas(data.sistemas || [])
      }

      if (resetRes.ok) {
        const data = await resetRes.json()
        setUltimoReset(data.ultimoReset)
      }

      if (motivosRes.ok) {
        const data = await motivosRes.json()
        setMotivosBackup(data.motivos || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
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
      alert('Senha incorreta!')
      return
    }

    setShowModalSenha(false)
    setSenhaDigitada('')

    switch (acaoProtegida) {
      case 'reset':
        executarResetMensal()
        break
      case 'exportar':
        exportarParaExcel()
        break
      case 'importar':
        setShowModalImportar(true)
        break
      case 'analista':
        setShowModalAnalista(true)
        break
      case 'sistema':
        setShowModalSistema(true)
        break
    }

    setAcaoProtegida('')
  }

  const adicionarCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const emailsValidos = novoCliente.emails.filter(e => e.trim() !== '')
      
      const res = await fetch(`${API_URL}/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          nome: novoCliente.nome,
          sistema: novoCliente.sistema,
          email: emailsValidos[0] || '',
          telefone: novoCliente.telefone
        })
      })

      if (res.ok) {
        const data = await res.json()
        // Atualizar com múltiplos emails
        if (emailsValidos.length > 0) {
          await fetch(`${API_URL}/clientes/${data.cliente.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`
            },
            body: JSON.stringify({
              emails: emailsValidos,
              emailPrimario: emailsValidos[0]
            })
          })
        }

        setNovoCliente({ nome: '', sistema: '', emails: [''], telefone: '' })
        setShowModalCliente(false)
        await carregarDados()
      }
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error)
      alert('Erro ao adicionar cliente.')
    }
  }

  const salvarEdicaoCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clienteEdicao) return

    try {
      // Atualizar TODOS os campos do cliente
      const clienteAtualizado = {
        ...clienteEdicao,
        emails: clienteEdicao.emails.filter(e => e.trim() !== ''),
        emailPrimario: clienteEdicao.emails[0] || clienteEdicao.emailPrimario
      }

      const res = await fetch(`${API_URL}/clientes/${clienteEdicao.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(clienteAtualizado)
      })

      if (res.ok) {
        setShowModalEditarCliente(false)
        setClienteEdicao(null)
        await carregarDados()
        alert('Cliente atualizado com sucesso!')
      } else {
        const errorData = await res.json()
        console.error('Erro na resposta:', errorData)
        alert('Erro ao atualizar cliente: ' + (errorData.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error)
      alert('Erro ao atualizar cliente: ' + error)
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

  const salvarStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clienteSelecionado) return

    // Verificar se envio está concluído mas backup pendente
    if (statusForm.statusEnvio === 'Enviado' && statusForm.statusBackup === 'Pendente') {
      setShowModalStatus(false)
      setShowModalMotivo(true)
      return
    }

    await atualizarStatusCliente()
  }

  const atualizarStatusCliente = async () => {
    if (!clienteSelecionado || salvando) return

    try {
      setSalvando(true)
      console.log('🔄 Atualizando cliente:', clienteSelecionado.id)
      console.log('📝 Novo status:', statusForm)
      
      const res = await fetch(`${API_URL}/clientes/${clienteSelecionado.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(statusForm)
      })

      if (res.ok) {
        const data = await res.json()
        console.log('✅ Cliente atualizado:', data.cliente)
        
        // Atualizar cliente na lista local (mais rápido)
        setClientes(prev => prev.map(c => c.id === data.cliente.id ? data.cliente : c))
        
        setShowModalStatus(false)
        setClienteSelecionado(null)
        alert('✅ Status atualizado com sucesso!')
      } else {
        const error = await res.json()
        console.error('❌ Erro ao atualizar:', error)
        alert('❌ Erro ao atualizar: ' + error.error)
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error)
      alert('❌ Erro ao atualizar status: ' + error)
    } finally {
      setSalvando(false)
    }
  }

  const salvarMotivoBackup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clienteSelecionado || !motivoBackup.trim()) {
      alert('❌ Digite um motivo válido')
      return
    }

    try {
      console.log('💾 Salvando motivo de backup...')
      
      // Salvar motivo no banco
      const motivoRes = await fetch(`${API_URL}/motivos-backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          clienteId: clienteSelecionado.id,
          clienteNome: clienteSelecionado.nome,
          analista: statusForm.analista || 'Não informado',
          motivo: motivoBackup.trim()
        })
      })

      if (!motivoRes.ok) {
        const error = await motivoRes.json()
        throw new Error(error.error || 'Erro ao salvar motivo')
      }

      // Atualizar cliente com motivo e status
      const clienteRes = await fetch(`${API_URL}/clientes/${clienteSelecionado.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          ...statusForm,
          motivoSemBackup: motivoBackup.trim()
        })
      })

      if (!clienteRes.ok) {
        const error = await clienteRes.json()
        throw new Error(error.error || 'Erro ao atualizar cliente')
      }

      console.log('✅ Motivo salvo com sucesso!')
      setShowModalMotivo(false)
      setMotivoBackup('')
      setClienteSelecionado(null)
      await carregarDados()
      alert('✅ Status atualizado e motivo registrado!')
    } catch (error) {
      console.error('❌ Erro ao salvar motivo:', error)
      alert('❌ Erro ao salvar motivo: ' + error)
    }
  }

  const togglePrioridade = async (id: string, prioritarioAtual: boolean) => {
    if (salvando) return
    
    try {
      setSalvando(true)
      const res = await fetch(`${API_URL}/clientes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ prioritario: !prioritarioAtual })
      })
      
      if (res.ok) {
        const data = await res.json()
        // Atualizar localmente
        setClientes(prev => prev.map(c => c.id === data.cliente.id ? data.cliente : c))
      }
    } catch (error) {
      console.error('Erro ao atualizar prioridade:', error)
    } finally {
      setSalvando(false)
    }
  }

  const toggleAtivo = async (id: string, ativoAtual: boolean) => {
    if (salvando) return
    
    try {
      setSalvando(true)
      const novoStatus = !ativoAtual
      console.log('🔄 Alterando status ativo:', id, 'Novo:', novoStatus)
      
      const res = await fetch(`${API_URL}/clientes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ ativo: novoStatus })
      })
      
      if (res.ok) {
        const data = await res.json()
        console.log('✅ Cliente atualizado:', data.cliente)
        
        // Atualizar localmente
        setClientes(prev => prev.map(c => c.id === data.cliente.id ? data.cliente : c))
        
        alert(novoStatus ? '✅ Cliente reativado!' : '✅ Cliente desativado!')
      } else {
        const error = await res.json()
        console.error('❌ Erro:', error)
        alert('❌ Erro ao alterar status: ' + error.error)
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar status ativo:', error)
      alert('❌ Erro ao atualizar status ativo: ' + error)
    } finally {
      setSalvando(false)
    }
  }

  const executarResetMensal = async () => {
    if (!confirm('Isso irá resetar todos os status para Pendente e marcar atrasos. Deseja continuar?')) return

    try {
      const res = await fetch(`${API_URL}/reset-mensal`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      })

      if (res.ok) {
        await carregarDados()
        alert('Reset mensal executado com sucesso! Clientes pendentes foram marcados como atrasados.')
      } else {
        alert('Erro ao executar reset mensal.')
      }
    } catch (error) {
      console.error('Erro ao executar reset mensal:', error)
      alert('Erro ao executar reset mensal.')
    }
  }

  const exportarParaExcel = () => {
    const dados = clientes.filter(c => c.ativo).map(c => ({
      'Cliente': c.nome,
      'Sistema': c.sistema,
      'E-mail Principal': c.emailPrimario,
      'Todos os E-mails': c.emails.join(', '),
      'Telefone': c.telefone,
      'Status Envio': c.statusEnvio,
      'Status Backup': c.statusBackup,
      'Analista': c.analista || 'Não atribuído',
      'Urgente': c.prioritario ? 'Sim' : 'Não',
      'Concluído': c.concluido ? 'Sim' : 'Não',
      'Atenção': c.atencao ? 'Sim' : 'Não',
      'Atrasado': c.atrasado ? 'Sim' : 'Não'
    }))

    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes')
    
    const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    XLSX.writeFile(wb, `CONTROL_Gestao_Sistemas_${mesAtual}.xlsx`)
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

          if (clienteData.nome && clienteData.sistema) {
            try {
              const res = await fetch(`${API_URL}/clientes`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${publicAnonKey}`
                },
                body: JSON.stringify(clienteData)
              })
              
              if (res.ok) sucessos++
              else erros++
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
        alert('Erro ao processar arquivo.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // Filtros e ordenação
  const aplicarFiltros = (lista: Cliente[]) => {
    let resultado = [...lista]

    // Filtro de pesquisa
    if (pesquisa) {
      resultado = resultado.filter(c => 
        c.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
        c.sistema.toLowerCase().includes(pesquisa.toLowerCase()) ||
        c.analista.toLowerCase().includes(pesquisa.toLowerCase()) ||
        c.emailPrimario.toLowerCase().includes(pesquisa.toLowerCase())
      )
    }

    // Filtro urgente
    if (filtroUrgente) {
      resultado = resultado.filter(c => c.prioritario)
    }

    // Filtro sistema
    if (filtroSistema) {
      resultado = resultado.filter(c => c.sistema === filtroSistema)
    }

    // Filtro status envio
    if (filtroStatusEnvio) {
      resultado = resultado.filter(c => c.statusEnvio === filtroStatusEnvio)
    }

    // Ordenar: urgentes primeiro, depois alfabético
    resultado.sort((a, b) => {
      if (a.prioritario && !b.prioritario) return -1
      if (!a.prioritario && b.prioritario) return 1
      return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
    })

    return resultado
  }

  // Agrupar por letra - CORRIGIDO
  const agruparPorLetra = (lista: Cliente[]) => {
    const grupos: { [key: string]: Cliente[] } = {}
    
    lista.forEach(cliente => {
      const nomeCliente = cliente.nome.trim()
      if (!nomeCliente) return
      
      const primeiroCaracter = nomeCliente[0]
      // Normalizar caractere para remover acentos e pegar letra base
      const letra = primeiroCaracter.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
      // Verificar se é letra A-Z, senão coloca em "#"
      const letraFinal = /[A-Z]/.test(letra) ? letra : '#'
      
      if (!grupos[letraFinal]) grupos[letraFinal] = []
      grupos[letraFinal].push(cliente)
    })

    return grupos
  }

  const clientesAtivos = clientes.filter(c => c.ativo)
  const clientesPendentes = aplicarFiltros(clientesAtivos.filter(c => !c.concluido && !c.atencao && !c.atrasado))
  const clientesConcluidos = aplicarFiltros(clientesAtivos.filter(c => c.concluido && !c.atencao))
  const clientesAtencao = aplicarFiltros(clientesAtivos.filter(c => c.atencao))
  const clientesAtrasados = aplicarFiltros(clientesAtivos.filter(c => c.atrasado))
  const clientesDesativados = aplicarFiltros(clientes.filter(c => !c.ativo))

  // Lista ativa atual
  let clientesFiltrados: Cliente[] = []
  switch (abaSelecionada) {
    case 'pendentes': clientesFiltrados = clientesPendentes; break
    case 'concluidos': clientesFiltrados = clientesConcluidos; break
    case 'atencao': clientesFiltrados = clientesAtencao; break
    case 'atrasados': clientesFiltrados = clientesAtrasados; break
    case 'desativados': clientesFiltrados = clientesDesativados; break
    default: clientesFiltrados = []
  }

  const gruposAlfabeticos = agruparPorLetra(clientesFiltrados)

  // Sistemas únicos dos clientes
  const sistemasUnicos = [...new Set(clientesAtivos.map(c => c.sistema))].sort()

  // Relatórios
  const mesAtual = new Date().toISOString().slice(0, 7)
  const anoAtual = new Date().getFullYear().toString()

  // Relatório com filtro de data - USA dataConclusaoEnvio ao invés de dataAtualizacao
  const getClientesEnviadosPorPeriodo = () => {
    let lista = clientes.filter(c => c.statusEnvio === 'Enviado' && c.ativo && c.dataConclusaoEnvio)
    
    if (dataInicioRelatorio) {
      lista = lista.filter(c => c.dataConclusaoEnvio && c.dataConclusaoEnvio >= dataInicioRelatorio)
    }
    if (dataFimRelatorio) {
      lista = lista.filter(c => c.dataConclusaoEnvio && c.dataConclusaoEnvio <= dataFimRelatorio + 'T23:59:59')
    }
    
    return lista
  }

  const clientesEnviadosMes = getClientesEnviadosPorPeriodo()

  // Ranking de analistas - USA dataConclusaoEnvio
  const rankingAnalistas = analistas.map(analista => {
    const enviosMes = clientes.filter(c => 
      c.analista === analista.nome && 
      c.statusEnvio === 'Enviado' &&
      c.dataConclusaoEnvio &&
      c.dataConclusaoEnvio.startsWith(mesAtual) &&
      c.ativo
    ).length

    const enviosAno = clientes.filter(c => 
      c.analista === analista.nome && 
      c.statusEnvio === 'Enviado' &&
      c.dataConclusaoEnvio &&
      c.dataConclusaoEnvio.startsWith(anoAtual) &&
      c.ativo
    ).length

    return { nome: analista.nome, enviosMes, enviosAno }
  }).sort((a, b) => b.enviosMes - a.enviosMes)

  // Relatório por sistema
  const relatorioSistemas = sistemasUnicos.map(sistema => {
    const total = clientesAtivos.filter(c => c.sistema === sistema).length
    const enviados = clientesAtivos.filter(c => c.sistema === sistema && c.statusEnvio === 'Enviado').length
    const pendentes = clientesAtivos.filter(c => c.sistema === sistema && c.statusEnvio === 'Pendente').length
    
    return { sistema, total, enviados, pendentes, percentual: total > 0 ? ((enviados / total) * 100).toFixed(1) : '0' }
  }).sort((a, b) => b.total - a.total)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-green-700 text-xl">Carregando sistema...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-2 px-2">
      <div className="max-w-[98vw] mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg p-6 mb-4 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-white mb-1 text-2xl">📊 CONTROL GESTÃO SISTEMAS</h1>
              <p className="text-green-100">
                Gerenciamento de Arquivos Fiscal e Backup Mensal
              </p>
              {ultimoReset && (
                <p className="text-green-200 mt-1 text-sm">
                  Último reset: {new Date(ultimoReset + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => validarSenha('analista')}
                className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 rounded-xl hover:bg-green-50 transition-all shadow-md hover:shadow-lg text-sm"
              >
                <Users className="w-4 h-4" />
                Analistas
              </button>
              <button
                onClick={() => validarSenha('sistema')}
                className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 rounded-xl hover:bg-green-50 transition-all shadow-md hover:shadow-lg text-sm"
              >
                <Settings className="w-4 h-4" />
                Sistemas
              </button>
              <button
                onClick={() => validarSenha('importar')}
                className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 rounded-xl hover:bg-green-50 transition-all shadow-md hover:shadow-lg text-sm"
              >
                <Upload className="w-4 h-4" />
                Importar
              </button>
              <button
                onClick={() => validarSenha('exportar')}
                className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 rounded-xl hover:bg-green-50 transition-all shadow-md hover:shadow-lg text-sm"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
              <button
                onClick={() => validarSenha('reset')}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-md hover:shadow-lg text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Mensal
              </button>
              <button
                onClick={() => setShowModalEditarCliente(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all shadow-md hover:shadow-lg text-sm"
              >
                <Edit className="w-4 h-4" />
                Editar Cliente
              </button>
              <button
                onClick={() => setShowModalCliente(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-md hover:shadow-lg text-sm"
              >
                <Plus className="w-4 h-4" />
                Novo Cliente
              </button>
            </div>
          </div>

          {/* Pesquisa e Filtros */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-600 w-5 h-5" />
              <input
                type="text"
                placeholder="Pesquisar por cliente, sistema, analista ou email..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-white/30 rounded-xl focus:ring-2 focus:ring-white focus:border-white bg-white/90 text-green-900 placeholder-green-600"
              />
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              <button
                onClick={() => setShowFiltros(!showFiltros)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  showFiltros ? 'bg-white text-green-700' : 'bg-white/20 text-white'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtros
              </button>

              {showFiltros && (
                <>
                  <button
                    onClick={() => setFiltroUrgente(!filtroUrgente)}
                    className={`px-4 py-2 rounded-xl transition-all ${
                      filtroUrgente ? 'bg-red-500 text-white' : 'bg-white/20 text-white'
                    }`}
                  >
                    ⭐ Apenas Urgentes
                  </button>

                  <select
                    value={filtroSistema}
                    onChange={(e) => setFiltroSistema(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-white text-green-900 border-2 border-white/30"
                  >
                    <option value="">Todos os Sistemas</option>
                    {sistemasUnicos.map(sistema => (
                      <option key={sistema} value={sistema}>{sistema}</option>
                    ))}
                  </select>

                  <select
                    value={filtroStatusEnvio}
                    onChange={(e) => setFiltroStatusEnvio(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-white text-green-900 border-2 border-white/30"
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

                  <button
                    onClick={() => {
                      setFiltroUrgente(false)
                      setFiltroSistema('')
                      setFiltroStatusEnvio('')
                    }}
                    className="px-4 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all"
                  >
                    Limpar Filtros
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
            <div className="text-green-600 mb-1 text-sm">Total Ativos</div>
            <div className="text-green-900 text-2xl">{clientesAtivos.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
            <div className="text-yellow-600 mb-1 text-sm">Pendentes</div>
            <div className="text-yellow-900 text-2xl">{clientesPendentes.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-600 hover:shadow-lg transition-shadow">
            <div className="text-green-700 mb-1 text-sm">Concluídos</div>
            <div className="text-green-900 text-2xl">{clientesConcluidos.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
            <div className="text-orange-600 mb-1 text-sm">Atenção</div>
            <div className="text-orange-900 text-2xl">{clientesAtencao.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-red-600 hover:shadow-lg transition-shadow">
            <div className="text-red-700 mb-1 text-sm">Atrasados</div>
            <div className="text-red-900 text-2xl">{clientesAtrasados.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-gray-500 hover:shadow-lg transition-shadow">
            <div className="text-gray-600 mb-1 text-sm">Desativados</div>
            <div className="text-gray-900 text-2xl">{clientesDesativados.length}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-green-100">
          <div className="flex border-b border-green-100 bg-green-50 overflow-x-auto">
            <button
              onClick={() => setAbaSelecionada('pendentes')}
              className={`px-5 py-3 font-medium transition-all whitespace-nowrap ${
                abaSelecionada === 'pendentes'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-transparent text-green-700 hover:bg-green-100'
              }`}
            >
              🕐 Pendentes ({clientesPendentes.length})
            </button>
            <button
              onClick={() => setAbaSelecionada('concluidos')}
              className={`px-5 py-3 font-medium transition-all whitespace-nowrap ${
                abaSelecionada === 'concluidos'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-transparent text-green-700 hover:bg-green-100'
              }`}
            >
              ✅ Concluídos ({clientesConcluidos.length})
            </button>
            <button
              onClick={() => setAbaSelecionada('atencao')}
              className={`px-5 py-3 font-medium transition-all whitespace-nowrap ${
                abaSelecionada === 'atencao'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-transparent text-green-700 hover:bg-green-100'
              }`}
            >
              ⚠️ Necessita Atenção ({clientesAtencao.length})
            </button>
            <button
              onClick={() => setAbaSelecionada('atrasados')}
              className={`px-5 py-3 font-medium transition-all whitespace-nowrap ${
                abaSelecionada === 'atrasados'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-transparent text-green-700 hover:bg-green-100'
              }`}
            >
              🚨 Atrasos Envio ({clientesAtrasados.length})
            </button>
            <button
              onClick={() => setAbaSelecionada('desativados')}
              className={`px-5 py-3 font-medium transition-all whitespace-nowrap ${
                abaSelecionada === 'desativados'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-transparent text-green-700 hover:bg-green-100'
              }`}
            >
              🔒 Desativados ({clientesDesativados.length})
            </button>
            <button
              onClick={() => setAbaSelecionada('relatorios')}
              className={`px-5 py-3 font-medium transition-all whitespace-nowrap ${
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
            <div className="p-6">
              <h2 className="text-green-900 mb-6 text-xl">Relatórios e Estatísticas</h2>
              
              {/* Filtro de Data */}
              <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-200">
                <h3 className="text-blue-900 mb-4">Enviados por Período</h3>
                <div className="flex gap-4 mb-4 flex-wrap">
                  <div>
                    <label className="block text-blue-700 mb-2 text-sm">Data Início</label>
                    <input
                      type="date"
                      value={dataInicioRelatorio}
                      onChange={(e) => setDataInicioRelatorio(e.target.value)}
                      className="px-4 py-2 border-2 border-blue-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-blue-700 mb-2 text-sm">Data Fim</label>
                    <input
                      type="date"
                      value={dataFimRelatorio}
                      onChange={(e) => setDataFimRelatorio(e.target.value)}
                      className="px-4 py-2 border-2 border-blue-300 rounded-lg"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setDataInicioRelatorio('')
                        setDataFimRelatorio('')
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                <div className="text-4xl text-blue-700 mb-2">{clientesEnviadosMes.length}</div>
                <p className="text-blue-600">
                  {dataInicioRelatorio || dataFimRelatorio 
                    ? 'Total de envios no período selecionado'
                    : 'Total de envios realizados'}
                </p>
              </div>

              {/* Ranking Analistas */}
              <div className="bg-white rounded-xl p-6 mb-6 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                  <h3 className="text-green-900">Ranking de Analistas</h3>
                </div>
                <div className="space-y-3">
                  {rankingAnalistas.length === 0 ? (
                    <p className="text-green-600 text-center py-4">Nenhum envio registrado</p>
                  ) : (
                    rankingAnalistas.map((analista, index) => (
                      <div key={analista.nome} className="flex items-center gap-4 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-500' : 'bg-green-500'
                        }`}>
                          {index + 1}º
                        </div>
                        <div className="flex-1">
                          <div className="text-green-900">{analista.nome}</div>
                          <div className="text-green-600 text-sm">
                            {analista.enviosMes} envios este mês | {analista.enviosAno} no ano
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Relatório por Sistema */}
              <div className="bg-white rounded-xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                  <h3 className="text-purple-900">Status de Envio por Sistema</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-purple-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-purple-800">Sistema</th>
                        <th className="px-4 py-3 text-left text-purple-800">Total</th>
                        <th className="px-4 py-3 text-left text-purple-800">Enviados</th>
                        <th className="px-4 py-3 text-left text-purple-800">Pendentes</th>
                        <th className="px-4 py-3 text-left text-purple-800">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100">
                      {relatorioSistemas.map(rel => (
                        <tr key={rel.sistema} className="hover:bg-purple-50">
                          <td className="px-4 py-3 text-purple-900">{rel.sistema}</td>
                          <td className="px-4 py-3 text-purple-700">{rel.total}</td>
                          <td className="px-4 py-3 text-green-700">{rel.enviados}</td>
                          <td className="px-4 py-3 text-yellow-700">{rel.pendentes}</td>
                          <td className="px-4 py-3 text-purple-700">{rel.percentual}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Relatório de Motivos de Backup Pendente */}
              {motivosBackup.length > 0 && (
                <div className="bg-orange-50 rounded-xl p-6 mt-6 border border-orange-200">
                  <h3 className="text-orange-900 mb-4">Justificativas de Backup Pendente</h3>
                  <div className="space-y-3">
                    {motivosBackup.slice(0, 10).map(motivo => (
                      <div key={motivo.id} className="bg-white p-4 rounded-lg border border-orange-200">
                        <div className="flex justify-between mb-2">
                          <span className="text-orange-900">{motivo.clienteNome}</span>
                          <span className="text-orange-600 text-sm">
                            {new Date(motivo.data).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="text-orange-700 text-sm mb-1">Analista: {motivo.analista}</div>
                        <div className="text-orange-900 bg-orange-50 p-2 rounded">{motivo.motivo}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Tabela de Clientes com Agrupamento Alfabético */
            <div className="overflow-x-auto p-4">
              {Object.keys(gruposAlfabeticos).length === 0 ? (
                <div className="text-center py-12 text-green-600">
                  {pesquisa ? '🔍 Nenhum cliente encontrado.' : 
                   abaSelecionada === 'pendentes' ? '📋 Nenhum cliente pendente.' :
                   abaSelecionada === 'concluidos' ? '✅ Nenhum cliente concluído.' :
                   abaSelecionada === 'atencao' ? '⚠️ Nenhum cliente necessitando atenção.' :
                   abaSelecionada === 'atrasados' ? '🚨 Nenhum cliente atrasado.' :
                   '🔒 Nenhum cliente desativado.'}
                </div>
              ) : (
                Object.keys(gruposAlfabeticos).sort().map(letra => (
                  <div key={letra} className="mb-6">
                    <div className="bg-green-600 text-white px-4 py-2 rounded-lg mb-2 text-lg sticky top-0 z-10">
                      {letra}
                    </div>
                    <table className="w-full">
                      <thead className="bg-green-50 border-b-2 border-green-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-green-800 text-sm">Cliente</th>
                          <th className="px-4 py-3 text-left text-green-800 text-sm">Sistema</th>
                          <th className="px-4 py-3 text-left text-green-800 text-sm">Status Envio</th>
                          <th className="px-4 py-3 text-left text-green-800 text-sm">Status Backup</th>
                          <th className="px-4 py-3 text-left text-green-800 text-sm">Analista</th>
                          <th className="px-4 py-3 text-left text-green-800 text-sm">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-green-100">
                        {gruposAlfabeticos[letra].map((cliente) => (
                          <tr 
                            key={cliente.id} 
                            className={`transition-all hover:shadow-md ${
                              cliente.prioritario 
                                ? 'bg-red-100 hover:bg-red-200 border-l-4 border-red-700' 
                                : 'hover:bg-green-50'
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {cliente.prioritario && (
                                  <Star className="w-5 h-5 text-red-700 fill-red-700 animate-pulse" />
                                )}
                                <span className={`${cliente.prioritario ? 'text-red-900 font-bold' : 'text-green-900'}`}>
                                  {cliente.nome}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-green-700 text-sm">{cliente.sistema}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
                                cliente.statusEnvio === 'Enviado'
                                  ? 'bg-green-100 text-green-800 border border-green-300'
                                  : cliente.statusEnvio === 'Pendente'
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                  : 'bg-blue-100 text-blue-800 border border-blue-300'
                              }`}>
                                {cliente.statusEnvio}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
                                cliente.statusBackup === 'Feito'
                                  ? 'bg-green-100 text-green-800 border border-green-300'
                                  : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                              }`}>
                                {cliente.statusBackup}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-green-700 text-sm">
                              {cliente.analista || <span className="text-green-400">Não atribuído</span>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setClienteSelecionado(cliente)
                                    setShowModalDetalhes(true)
                                  }}
                                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all"
                                  title="Ver detalhes"
                                >
                                  <Eye className="w-4 h-4" />
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
                                  <Star className={`w-4 h-4 ${cliente.prioritario ? 'fill-red-600' : ''}`} />
                                </button>
                                <button
                                  onClick={() => abrirModalStatus(cliente)}
                                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm hover:shadow-md text-xs"
                                >
                                  Atualizar
                                </button>
                                <button
                                  onClick={() => toggleAtivo(cliente.id, cliente.ativo)}
                                  className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-all"
                                  title="Desativar cliente"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAIS - Continua nos próximos comentários devido ao tamanho */}
      {/* Modal: Senha */}
      {showModalSenha && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-green-900 text-2xl">🔒 Senha Administrativa</h2>
              <button onClick={() => {
                setShowModalSenha(false)
                setSenhaDigitada('')
              }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-green-700 mb-4">
              Digite a senha para continuar
            </p>
            <input
              type="password"
              value={senhaDigitada}
              onChange={(e) => setSenhaDigitada(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && executarAcaoProtegida()}
              className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-4"
              placeholder="Digite a senha"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModalSenha(false)
                  setSenhaDigitada('')
                }}
                className="flex-1 px-4 py-3 border-2 border-green-300 text-green-700 rounded-xl hover:bg-green-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={executarAcaoProtegida}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Novo Cliente */}
      {showModalCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 my-8">
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
                <select
                  required
                  value={novoCliente.sistema}
                  onChange={(e) => setNovoCliente({ ...novoCliente, sistema: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Selecione um sistema</option>
                  {sistemas.map(sistema => (
                    <option key={sistema.id} value={sistema.nome}>{sistema.nome}</option>
                  ))}
                  <option value="__NOVO__">➕ Digitar novo sistema</option>
                </select>
                {novoCliente.sistema === '__NOVO__' && (
                  <input
                    type="text"
                    required
                    placeholder="Digite o nome do novo sistema"
                    onChange={(e) => setNovoCliente({ ...novoCliente, sistema: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-2"
                    autoFocus
                  />
                )}
              </div>
              <div>
                <label className="block text-green-800 mb-2">E-mails (separados)</label>
                {novoCliente.emails.map((email, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        const novosEmails = [...novoCliente.emails]
                        novosEmails[index] = e.target.value
                        setNovoCliente({ ...novoCliente, emails: novosEmails })
                      }}
                      className="flex-1 px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder={index === 0 ? "Email principal" : "Email adicional"}
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const novosEmails = novoCliente.emails.filter((_, i) => i !== index)
                          setNovoCliente({ ...novoCliente, emails: novosEmails })
                        }}
                        className="px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setNovoCliente({ ...novoCliente, emails: [...novoCliente.emails, ''] })}
                  className="text-green-600 hover:text-green-800 text-sm"
                >
                  + Adicionar outro email
                </button>
              </div>
              <div>
                <label className="block text-green-800 mb-2">Telefone</label>
                <input
                  type="tel"
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
                    setNovoCliente({ nome: '', sistema: '', emails: [''], telefone: '' })
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

      {/* Modal: Editar Cliente */}
      {showModalEditarCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-green-900 text-2xl">Editar Cliente</h2>
              <button onClick={() => {
                setShowModalEditarCliente(false)
                setClienteEdicao(null)
              }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {!clienteEdicao ? (
              <div>
                <label className="block text-green-800 mb-2">Selecione o Cliente</label>
                <select
                  onChange={(e) => {
                    const cliente = clientes.find(c => c.id === e.target.value)
                    if (cliente) setClienteEdicao(cliente)
                  }}
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-4"
                >
                  <option value="">Escolha um cliente...</option>
                  {clientesAtivos.sort((a, b) => a.nome.localeCompare(b.nome)).map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome} - {cliente.sistema}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <form onSubmit={salvarEdicaoCliente} className="space-y-4">
                <div>
                  <label className="block text-green-800 mb-2">Nome do Cliente *</label>
                  <input
                    type="text"
                    required
                    value={clienteEdicao.nome}
                    onChange={(e) => setClienteEdicao({ ...clienteEdicao, nome: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-green-800 mb-2">Sistema *</label>
                  <select
                    required
                    value={clienteEdicao.sistema}
                    onChange={(e) => {
                      if (e.target.value === '__NOVO__') {
                        setClienteEdicao({ ...clienteEdicao, sistema: '' })
                      } else {
                        setClienteEdicao({ ...clienteEdicao, sistema: e.target.value })
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Selecione um sistema</option>
                    {sistemas.map(sistema => (
                      <option key={sistema.id} value={sistema.nome}>{sistema.nome}</option>
                    ))}
                    <option value="__NOVO__">➕ Digitar novo sistema</option>
                  </select>
                  {(!clienteEdicao.sistema || !sistemas.find(s => s.nome === clienteEdicao.sistema)) && (
                    <input
                      type="text"
                      required
                      value={clienteEdicao.sistema === '__NOVO__' ? '' : clienteEdicao.sistema}
                      onChange={(e) => setClienteEdicao({ ...clienteEdicao, sistema: e.target.value })}
                      placeholder="Digite o nome do sistema"
                      className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-2"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-green-800 mb-2">E-mails</label>
                  {clienteEdicao.emails.map((email, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          const novosEmails = [...clienteEdicao.emails]
                          novosEmails[index] = e.target.value
                          setClienteEdicao({ 
                            ...clienteEdicao, 
                            emails: novosEmails,
                            emailPrimario: index === 0 ? e.target.value : clienteEdicao.emailPrimario
                          })
                        }}
                        className="flex-1 px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder={index === 0 ? "Email principal" : "Email adicional"}
                      />
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const novosEmails = clienteEdicao.emails.filter((_, i) => i !== index)
                            setClienteEdicao({ ...clienteEdicao, emails: novosEmails })
                          }}
                          className="px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setClienteEdicao({ ...clienteEdicao, emails: [...clienteEdicao.emails, ''] })}
                    className="text-green-600 hover:text-green-800 text-sm"
                  >
                    + Adicionar outro email
                  </button>
                </div>
                <div>
                  <label className="block text-green-800 mb-2">Telefone</label>
                  <input
                    type="tel"
                    value={clienteEdicao.telefone}
                    onChange={(e) => setClienteEdicao({ ...clienteEdicao, telefone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setClienteEdicao(null)}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            )}
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
                  onChange={(e) => setStatusForm({ ...statusForm, statusEnvio: e.target.value as StatusEnvio })}
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Enviado">Enviado</option>
                  <option value="Recém Implantado">Recém Implantado</option>
                  <option value="Gerencial">Gerencial</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Não Teve Vendas">Não Teve Vendas</option>
                  <option value="Bloqueio SEFAZ">Bloqueio SEFAZ</option>
                  <option value="Bloqueio Financeiro">Bloqueio Financeiro</option>
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

      {/* Modal: Motivo Backup Pendente */}
      {showModalMotivo && clienteSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-orange-900 text-2xl flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" />
                  Backup Pendente
                </h2>
                <p className="text-orange-600 mt-2">
                  O envio foi marcado como concluído, mas o backup está pendente.
                </p>
              </div>
            </div>
            
            <form onSubmit={salvarMotivoBackup} className="space-y-4">
              <div>
                <label className="block text-orange-800 mb-2">
                  Por que o backup não foi realizado? *
                </label>
                <textarea
                  required
                  value={motivoBackup}
                  onChange={(e) => setMotivoBackup(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-orange-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-32"
                  placeholder="Descreva o motivo..."
                />
              </div>

              <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                <p className="text-orange-900 text-sm">
                  <strong>Cliente:</strong> {clienteSelecionado.nome}
                  <br />
                  <strong>Analista:</strong> {statusForm.analista || 'Não informado'}
                  <br />
                  <strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModalMotivo(false)
                    setMotivoBackup('')
                    setShowModalStatus(true)
                  }}
                  className="flex-1 px-4 py-3 border-2 border-orange-300 text-orange-700 rounded-xl hover:bg-orange-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Salvar e Continuar
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
                <div className="text-blue-600 mb-1">E-mail Principal</div>
                <div className="text-blue-900">{clienteSelecionado.emailPrimario}</div>
                {clienteSelecionado.emails.length > 1 && (
                  <div className="mt-2 text-blue-700 text-sm">
                    <strong>Outros e-mails:</strong>
                    <br />
                    {clienteSelecionado.emails.slice(1).join(', ')}
                  </div>
                )}
              </div>
              
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div className="text-blue-600 mb-1">Telefone</div>
                <div className="text-blue-900">{clienteSelecionado.telefone || 'Não informado'}</div>
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

              {clienteSelecionado.motivoSemBackup && (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                  <div className="text-orange-600 mb-1">Motivo Backup Pendente</div>
                  <div className="text-orange-900">{clienteSelecionado.motivoSemBackup}</div>
                </div>
              )}
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
            
            <form onSubmit={async (e) => {
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
                  await carregarDados()
                }
              } catch (error) {
                console.error('Erro ao adicionar analista:', error)
              }
            }} className="mb-6">
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
                        onClick={async () => {
                          if (!confirm('Tem certeza que deseja remover este analista?')) return
                          try {
                            const res = await fetch(`${API_URL}/analistas/${analista.id}`, {
                              method: 'DELETE',
                              headers: { 'Authorization': `Bearer ${publicAnonKey}` }
                            })
                            if (res.ok) await carregarDados()
                          } catch (error) {
                            console.error('Erro ao deletar analista:', error)
                          }
                        }}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <X className="w-5 h-5" />
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

      {/* Modal: Gerenciar Sistemas */}
      {showModalSistema && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-green-900 text-2xl">Gerenciar Sistemas</h2>
              <button onClick={() => setShowModalSistema(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault()
              try {
                const res = await fetch(`${API_URL}/sistemas`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${publicAnonKey}`
                  },
                  body: JSON.stringify(novoSistema)
                })

                if (res.ok) {
                  setNovoSistema({ nome: '' })
                  await carregarDados()
                }
              } catch (error) {
                console.error('Erro ao adicionar sistema:', error)
              }
            }} className="mb-6">
              <label className="block text-green-800 mb-2">Adicionar Novo Sistema</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={novoSistema.nome}
                  onChange={(e) => setNovoSistema({ nome: e.target.value })}
                  className="flex-1 px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Nome do sistema"
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
              <div className="text-green-800 mb-3">Sistemas Cadastrados</div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sistemas.length === 0 ? (
                  <p className="text-green-600 text-center py-4">Nenhum sistema cadastrado</p>
                ) : (
                  sistemas.map((sistema) => (
                    <div key={sistema.id} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition-colors">
                      <span className="text-green-900">{sistema.nome}</span>
                      <button
                        onClick={async () => {
                          if (!confirm('Tem certeza que deseja remover este sistema?')) return
                          try {
                            const res = await fetch(`${API_URL}/sistemas/${sistema.id}`, {
                              method: 'DELETE',
                              headers: { 'Authorization': `Bearer ${publicAnonKey}` }
                            })
                            if (res.ok) await carregarDados()
                          } catch (error) {
                            console.error('Erro ao deletar sistema:', error)
                          }
                        }}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setShowModalSistema(false)}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
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
                  <li>• <strong>CLIENTE</strong> - Nome do cliente (obrigatório)</li>
                  <li>• <strong>SISTEMA</strong> - Sistema utilizado (obrigatório)</li>
                  <li>• <strong>E-MAIL</strong> - Email de contato (opcional)</li>
                  <li>• <strong>NUMERO</strong> - Telefone (opcional)</li>
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
    </div>
  )
}
