import React, { useState, useEffect } from 'react'
import { Search, Plus, RefreshCw, Check, X, Clock, AlertTriangle, Download, Upload, BarChart3, Settings, Users, Home, Zap, Lock, AlertCircle, Bell, RotateCcw, Eye, List, Edit, Trash2, Copy } from 'lucide-react'
import * as supabase from './utils/supabaseClient'
import logoGestao from 'figma:asset/a321a7617817ca81ff7148355ebf7ba1e1aa7b03.png'
import { InstrucoesSQL } from './components/InstrucoesSQL'
import { Notificacao } from './components/Notificacao'
import { ConfirmacaoExclusao } from './components/ConfirmacaoExclusao'
import { DashboardGraficos } from './components/DashboardGraficos'
const SENHA_ADMIN = 'Gestao2042**'

type StatusEnvio = 'Enviado' | 'Pendente' | 'Recém Implantado' | 'Gerencial' | 'Inativo' | 'Não Teve Vendas' | 'Bloqueio SEFAZ' | 'Bloqueio Financeiro'
type AbaType = 'dashboard' | 'pendentes' | 'concluidos' | 'backupCritico' | 'atencao' | 'atrasados' | 'listagem' | 'relatorios' | 'configuracoes'
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
  analistaBackup?: string // Quem fez o backup
  urgente?: boolean
  ativo: boolean
  motivoSemBackup?: string
  atrasado?: boolean
  mesAtrasado?: string // Ex: "2025-01" para Janeiro 2025
  abaAtual?: AbaCliente
  mesReferencia?: string // Mês atual de trabalho "2025-01"
}

interface Sistema { id: string; nome: string }
interface Analista { id: string; nome: string }

export default function App() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [sistemas, setSistemas] = useState<Sistema[]>([])
  const [analistas, setAnalistas] = useState<Analista[]>([])
  const [loading, setLoading] = useState(true)
  const [sincronizando, setSincronizando] = useState(false)
  const [abaSelecionada, setAbaSelecionada] = useState<AbaType>('pendentes')
  
  const [pesquisa, setPesquisa] = useState('')
  const [filtroSistema, setFiltroSistema] = useState('')
  const [filtroUrgente, setFiltroUrgente] = useState(false)
  const [filtroInativos, setFiltroInativos] = useState(false)
  const [letraSelecionada, setLetraSelecionada] = useState('')
  const [filtroMes, setFiltroMes] = useState('') // Filtro de mês para atrasados
  
  const [showModalCliente, setShowModalCliente] = useState(false)
  const [showModalSistema, setShowModalSistema] = useState(false)
  const [showModalAnalista, setShowModalAnalista] = useState(false)
  const [showModalSenha, setShowModalSenha] = useState(false)
  const [showModalMotivo, setShowModalMotivo] = useState(false)
  const [showModalReset, setShowModalReset] = useState(false)
  const [showModalDetalhes, setShowModalDetalhes] = useState(false)
  const [showModalEnvio, setShowModalEnvio] = useState(false)
  const [showModalEditar, setShowModalEditar] = useState(false)
  const [showModalAnalistaBackup, setShowModalAnalistaBackup] = useState(false)
  const [showModalEmail, setShowModalEmail] = useState(false)
  const [clienteMotivo, setClienteMotivo] = useState<Cliente | null>(null)
  const [clienteDetalhes, setClienteDetalhes] = useState<Cliente | null>(null)
  const [clienteEnvio, setClienteEnvio] = useState<Cliente | null>(null)
  const [clienteEditar, setClienteEditar] = useState<Cliente | null>(null)
  const [clienteBackup, setClienteBackup] = useState<Cliente | null>(null)
  const [clienteEmail, setClienteEmail] = useState<Cliente | null>(null)
  const [analistaEmailNome, setAnalistaEmailNome] = useState('')
  const [motivoBackup, setMotivoBackup] = useState('')
  const [analistaEnvio, setAnalistaEnvio] = useState('')
  const [analistaBackup, setAnalistaBackup] = useState('')
  const [senhaDigitada, setSenhaDigitada] = useState('')
  
  const [notificacao, setNotificacao] = useState<{tipo: 'sucesso' | 'erro' | 'aviso' | 'info', titulo: string, mensagem: string} | null>(null)
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState<{tipo: 'sistema' | 'analista', item: any} | null>(null)
  
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
      
      // DEBUG: Ver quantos inativos
      const totalInativos = clientesData.filter((c: Cliente) => c.ativo === false).length
      console.log('🔍 Total clientes:', clientesData.length, '| Inativos:', totalInativos)
      
      // Calcular abaAtual automaticamente baseado nos status (MANTER TODOS, inclusive inativos)
      const clientesComAba = clientesData.map((c: Cliente) => {
        // Se INATIVO, manter como está sem processar abaAtual
        if (c.ativo === false) {
          return {
            ...c,
            abaAtual: c.abaAtual || 'pendentes',
            mesReferencia: c.mesReferencia || new Date().toISOString().slice(0, 7)
          }
        }
        
        // APENAS PROCESSAR abaAtual para clientes ATIVOS
        let abaCalculada: AbaCliente = 'pendentes'
        
        // Regra 0: ATRASADOS sempre vão para aba Atrasados (PRIORIDADE MÁXIMA)
        if (c.atrasado) {
          return {
            ...c,
            abaAtual: 'pendentes', // Atrasados não têm aba própria no tipo AbaCliente
            mesReferencia: c.mesReferencia || new Date().toISOString().slice(0, 7),
            mesAtrasado: (c.atrasado && !c.mesAtrasado) ? new Date().toISOString().slice(0, 7) : c.mesAtrasado
          }
        }
        
        // Regra 1: Status especiais → Atenção
        if (statusEspeciais.includes(c.statusEnvio)) {
          abaCalculada = 'atencao'
        }
        // Regra 2: Enviado + Feito → Concluídos
        else if (c.statusEnvio === 'Enviado' && c.statusBackup === 'Feito') {
          abaCalculada = 'concluidos'
        }
        // Regra 3: Enviado + Pendente → Backup Crítico (SEMPRE)
        else if (c.statusEnvio === 'Enviado' && c.statusBackup === 'Pendente') {
          abaCalculada = 'backupCritico'
        }
        // Regra 4: Resto → Pendentes (DEFAULT)
        
        // Definir mês atual para campos vazios
        const mesAtual = new Date().toISOString().slice(0, 7)
        
        return {
          ...c,
          abaAtual: abaCalculada,
          mesReferencia: c.mesReferencia || mesAtual,
          mesAtrasado: (c.atrasado && !c.mesAtrasado) ? mesAtual : c.mesAtrasado
        }
      })
      
      // DEBUG: Ver se analistaBackup está vindo do banco
      const comBackup = clientesComAba.filter((c: any) => c.analistaBackup)
      console.log('📊 Clientes carregados:', clientesComAba.length, '| Com analistaBackup:', comBackup.length)
      if (comBackup.length > 0) {
        console.log('🟢 Tem analistaBackup:', comBackup.map((c: any) => `${c.nome} → ${c.analistaBackup}`))
      }
      
      setClientes(clientesComAba)
      setSistemas(sistemasData)
      setAnalistas(analistasData)
      
      // Sincronizar sistemas automaticamente
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
      
      // Pegar todos os sistemas únicos dos clientes (remover vazios e duplicatas)
      const sistemasNosClientes = [...new Set(clientes.map(c => c.sistema).filter(s => s && s.trim()))]
      
      // Verificar quais sistemas não existem na tabela (case insensitive)
      const sistemasExistentes = sistemasAtuais.map(s => s.nome.toLowerCase())
      const sistemasNovos = sistemasNosClientes.filter(s => !sistemasExistentes.includes(s.toLowerCase()))
      
      // Adicionar sistemas novos
      if (sistemasNovos.length > 0) {
        const novosSistemasAdicionados: Sistema[] = []
        
        for (const nomeSistema of sistemasNovos) {
          const novoSistema: Sistema = {
            id: `sistema-${Date.now()}-${Math.random()}`,
            nome: nomeSistema.trim()
          }
          await supabase.addSistema(novoSistema)
          novosSistemasAdicionados.push(novoSistema)
        }
        
        setSistemas(prev => [...prev, ...novosSistemasAdicionados])
        
        if (mostrarMensagem) {
          setNotificacao({
            tipo: 'sucesso',
            titulo: 'Sistemas Sincronizados!',
            mensagem: `${sistemasNovos.length} sistema(s) adicionado(s):\n\n${sistemasNovos.join(', ')}`
          })
        }
      } else {
        if (mostrarMensagem) {
          setNotificacao({
            tipo: 'info',
            titulo: 'Sistemas Atualizados',
            mensagem: 'Todos os sistemas já estão sincronizados!'
          })
        }
      }
    } catch (error) {
      if (mostrarMensagem) {
        setNotificacao({
          tipo: 'erro',
          titulo: 'Erro na Sincronização',
          mensagem: 'Não foi possível sincronizar os sistemas. Tente novamente.'
        })
      }
    } finally {
      setSincronizando(false)
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
    return `Prezados,
 
Boa tarde!
Espero que estejam bem.
 
Sou ${analistaNome}, da Gestão Sistemas, e encaminho em anexo os arquivos fiscais referentes ao período de ${mes.primeiroDia} a ${mes.ultimoDia}.
 
Dados da empresa:
CNPJ: ${cliente.cnpj || 'Não informado'}
Razão Social: ${cliente.nome}
 
Informamos que este e-mail é utilizado apenas para o envio automático de arquivos fiscais, portanto as respostas a esta mensagem não são monitoradas.
Em caso de dúvidas, pendências ou necessidade de suporte, solicitamos que entrem em contato com nossa equipe através do WhatsApp: (77) 9 9861-9990.
 
Agradecemos pela atenção e permanecemos à disposição.
 
Atenciosamente,
${analistaNome}
Gestão Sistemas
📞 (77) 9 9861-9990
📧 suporte@gestaosistemas.com.br`
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
      
      setNotificacao({
        tipo: 'sucesso',
        titulo: 'Copiado!',
        mensagem: tipo === 'assunto' ? 'Assunto copiado com sucesso! ✓' : 'Corpo do email copiado com sucesso! ✓'
      })
    } catch (error) {
      setNotificacao({
        tipo: 'erro',
        titulo: 'Erro ao Copiar',
        mensagem: 'Não foi possível copiar. Selecione o texto e use Ctrl+C.'
      })
    }
  }

  const finalizarCliente = async () => {
    if (!clienteEmail || !analistaEmailNome) return
    
    try {
      const mesAtual = new Date().toISOString().slice(0, 7)
      
      try {
        await supabase.updateCliente(clienteEmail.id, { 
          statusEnvio: 'Enviado',
          statusBackup: 'Feito',
          analista: analistaEmailNome,
          analistaBackup: clienteEmail.analistaBackup,
          mesReferencia: mesAtual,
          abaAtual: 'concluidos'
        })
      } catch (err) {
        await supabase.updateCliente(clienteEmail.id, { 
          statusEnvio: 'Enviado',
          statusBackup: 'Feito',
          analista: analistaEmailNome,
          analistaBackup: clienteEmail.analistaBackup,
          abaAtual: 'concluidos'
        })
      }
      
      setClientes(prev => prev.map(c => 
        c.id === clienteEmail.id 
          ? { ...c, statusEnvio: 'Enviado' as StatusEnvio, statusBackup: 'Feito' as const, abaAtual: 'concluidos' as AbaCliente, analista: analistaEmailNome, analistaBackup: clienteEmail.analistaBackup, mesReferencia: mesAtual } 
          : c
      ))
      
      setShowModalEmail(false)
      setClienteEmail(null)
      setAnalistaEmailNome('')
      setClienteEnvio(null)
      setAnalistaEnvio('')
      
      setTimeout(() => {
        setAbaSelecionada('concluidos')
        setNotificacao({
          tipo: 'sucesso',
          titulo: 'Cliente Concluído!',
          mensagem: 'Envio: ' + analistaEmailNome + '\nBackup: ' + clienteEmail.analistaBackup + '\n\nCliente movido para Concluídos!'
        })
      }, 300)
    } catch (error) {
      console.error('Erro ao finalizar:', error)
      setNotificacao({
        tipo: 'erro',
        titulo: 'Erro ao Finalizar',
        mensagem: 'Não foi possível finalizar o cliente.'
      })
    }
  }

  const atualizarStatusRapido = async (clienteId: string, campo: 'statusEnvio' | 'statusBackup', novoValor: string) => {
    const cliente = clientes.find(c => c.id === clienteId)
    if (!cliente) return

    console.log('🔷 Mudando:', campo, '→', novoValor, '| Atual:', cliente[campo])
    
    // Se já é o mesmo valor, não fazer nada
    if (cliente[campo] === novoValor) {
      console.log('⚠️ Valor já é esse, ignorando')
      return
    }
    
    // Se está marcando backup como Feito, ABRIR MODAL (NÃO atualizar state)
    if (campo === 'statusBackup' && novoValor === 'Feito') {
      console.log('🟦 ABRINDO MODAL - não atualiza state!')
      setClienteBackup(cliente)
      setAnalistaBackup('')
      setShowModalAnalistaBackup(true)
      return
    }
    
    // Outros casos: atualizar state
    console.log('➡️ Atualizando:', campo, '=', novoValor)
    setClientes(prev => prev.map(c => c.id === clienteId ? { ...c, [campo]: novoValor } : c))
  }

  const marcarComoConcluido = async (clienteId: string) => {
    try {
      const cliente = clientes.find(c => c.id === clienteId)
      if (!cliente) return

      // Verificar se é status especial → Atenção
      if (statusEspeciais.includes(cliente.statusEnvio)) {
        await supabase.updateCliente(clienteId, { 
          statusEnvio: cliente.statusEnvio,
          statusBackup: cliente.statusBackup
        })
        setClientes(prev => prev.map(c => 
          c.id === clienteId ? { ...c, abaAtual: 'atencao' as AbaCliente } : c
        ))
        setTimeout(() => {
          setAbaSelecionada('atencao')
          setNotificacao({
            tipo: 'aviso',
            titulo: 'Atenção Necessária!',
            mensagem: 'Cliente movido para a aba Atenção.'
          })
        }, 300)
        return
      }

      // Abrir modal para perguntar qual analista está enviando
      setClienteEnvio(cliente)
      setAnalistaEnvio(cliente.analista || '')
      setShowModalEnvio(true)
    } catch (error) {
      setNotificacao({
        tipo: 'erro',
        titulo: 'Erro ao Concluir',
        mensagem: 'Não foi possível concluir o cliente. Tente novamente.'
      })
    }
  }

  const confirmarEnvio = async () => {
    if (!clienteEnvio) return
    
    try {
      // Se o backup estiver pendente, pedir motivo antes
      if (clienteEnvio.statusBackup === 'Pendente') {
        setClienteMotivo({ 
          ...clienteEnvio, 
          statusEnvio: 'Enviado', 
          statusBackup: 'Pendente',
          analista: analistaEnvio
        })
        setShowModalEnvio(false)
        setShowModalMotivo(true)
        return
      }

      // Se backup está Feito MAS não tem analista, perguntar
      if (clienteEnvio.statusBackup === 'Feito' && !clienteEnvio.analistaBackup) {
        console.log('🟦 Backup sem analista - abrindo modal')
        setClienteBackup(clienteEnvio)
        setAnalistaBackup('')
        setShowModalEnvio(false)
        setShowModalAnalistaBackup(true)
        return
      }
      
      // Se backup está Feito E já tem analista, abrir modal de email
      if (clienteEnvio.statusBackup === 'Feito' && clienteEnvio.analistaBackup) {
        console.log('✅ Backup completo - abrindo modal de email')
        setClienteEmail(clienteEnvio)
        setAnalistaEmailNome(analistaEnvio)
        setShowModalEnvio(false)
        setShowModalEmail(true)
        return
      }
    } catch (error) {
      setNotificacao({
        tipo: 'erro',
        titulo: 'Erro ao Concluir',
        mensagem: 'Não foi possível concluir o cliente. Tente novamente.'
      })
    }
  }

  const salvarMotivoBackup = async () => {
    if (!clienteMotivo || !motivoBackup.trim()) { 
      setNotificacao({
        tipo: 'aviso',
        titulo: 'Campo Obrigatório',
        mensagem: 'Por favor, digite o motivo da justificativa.'
      })
      return 
    }
    try {
      const mesAtual = new Date().toISOString().slice(0, 7)
      
      // Salvar status, analista, justificativa e mesReferencia
      try {
        await supabase.updateCliente(clienteMotivo.id, { 
          statusEnvio: clienteMotivo.statusEnvio,
          statusBackup: clienteMotivo.statusBackup,
          analista: clienteMotivo.analista,
          motivoSemBackup: motivoBackup,
          mesReferencia: mesAtual
        })
      } catch (err) {
        await supabase.updateCliente(clienteMotivo.id, { 
          statusEnvio: clienteMotivo.statusEnvio,
          statusBackup: clienteMotivo.statusBackup,
          analista: clienteMotivo.analista,
          motivoSemBackup: motivoBackup
        })
      }
      
      setClientes(prev => prev.map(c => 
        c.id === clienteMotivo.id 
          ? { ...c, statusEnvio: clienteMotivo.statusEnvio, statusBackup: clienteMotivo.statusBackup, motivoSemBackup: motivoBackup, abaAtual: 'backupCritico' as AbaCliente, analista: clienteMotivo.analista, mesReferencia: mesAtual } 
          : c
      ))
      setShowModalMotivo(false)
      setMotivoBackup('')
      setClienteMotivo(null)
      setAbaSelecionada('backupCritico')
      setNotificacao({
        tipo: 'sucesso',
        titulo: 'Status Atualizado!',
        mensagem: 'Cliente movido para Backup Crítico com justificativa registrada.'
      })
    } catch (error) {
      setNotificacao({
        tipo: 'erro',
        titulo: 'Erro ao Salvar',
        mensagem: 'Não foi possível salvar a justificativa. Tente novamente.'
      })
    }
  }

  const confirmarAnalistaBackup = async () => {
    console.log('⚠️⚠️⚠️ CONFIRMAR BACKUP CHAMADO!')
    console.log('   Cliente:', clienteBackup?.nome)
    console.log('   Analista:', analistaBackup)
    
    if (!clienteBackup || !analistaBackup.trim()) {
      console.log('❌ Cancelado - dados vazios')
      return
    }
    
    try {
      const mesAtual = new Date().toISOString().slice(0, 7)
      
      console.log('🔵 Salvando APENAS backup - NÃO move para concluídos')
      
      // APENAS salvar statusBackup + analistaBackup
      // NÃO alterar abaAtual, statusEnvio, etc
      try {
        await supabase.updateCliente(clienteBackup.id, { 
          statusBackup: 'Feito', 
          analistaBackup: analistaBackup,
          mesReferencia: mesAtual
        })
        console.log('✅ Backup salvo')
      } catch (err) {
        await supabase.updateCliente(clienteBackup.id, { 
          statusBackup: 'Feito', 
          analistaBackup: analistaBackup
        })
      }
      
      // Atualizar state - mantém na mesma aba
      setClientes(prev => prev.map(c => c.id === clienteBackup.id ? { 
        ...c, 
        statusBackup: 'Feito', 
        analistaBackup: analistaBackup,
        mesReferencia: mesAtual
      } : c))
      
      setShowModalAnalistaBackup(false)
      setClienteBackup(null)
      setAnalistaBackup('')
      
      setNotificacao({
        tipo: 'sucesso',
        titulo: 'Backup Registrado!',
        mensagem: 'Backup marcado como feito por ' + analistaBackup + '.\n\nAgora clique em Concluir para finalizar.'
      })
    } catch (error) {
      console.error('❌ Erro:', error)
      setNotificacao({
        tipo: 'erro',
        titulo: 'Erro ao Confirmar',
        mensagem: 'Não foi possível registrar o analista do backup.'
      })
    }
  }

  const resetarMensal = async () => {
    try {
      const mesAtual = new Date().toISOString().slice(0, 7)
      
      // Buscar TODOS os clientes direto do banco
      const todosClientes = await supabase.getClientes()
      
      let resetadosNormais = 0
      let marcadosAtrasados = 0
      let mantidos = 0
      
      const updates = todosClientes.map(async (cliente) => {
        // PULAR CLIENTES INATIVOS - não resetar
        if (!cliente.ativo) {
          return
        }
        
        // REGRA 1: JÁ ATRASADOS - Resetar status mas MANTER flag atrasado
        if (cliente.atrasado) {
          try {
            await supabase.updateCliente(cliente.id, {
              statusEnvio: 'Pendente',
              statusBackup: 'Pendente',
              atrasado: true,
              mesReferencia: mesAtual
            })
            mantidos++
          } catch (err) {
            await supabase.updateCliente(cliente.id, {
              statusEnvio: 'Pendente',
              statusBackup: 'Pendente',
              atrasado: true
            })
            mantidos++
          }
          return
        }
        
        // REGRA 2: BACKUP CRÍTICO COM JUSTIFICATIVA - MANTER
        if (cliente.motivoSemBackup && cliente.statusEnvio === 'Enviado' && cliente.statusBackup === 'Pendente') {
          mantidos++
          return // Mantém backup crítico histórico
        }
        
        // REGRA 3: PENDENTES → MARCAR ATRASADO + VOLTAR PARA PENDENTE
        if ((cliente.statusEnvio === 'Pendente' || cliente.statusBackup === 'Pendente') && cliente.statusEnvio !== 'Enviado') {
          try {
            await supabase.updateCliente(cliente.id, {
              statusEnvio: 'Pendente',
              statusBackup: 'Pendente',
              atrasado: true,
              mesAtrasado: mesAtual,
              mesReferencia: mesAtual
            })
            marcadosAtrasados++
          } catch (err) {
            await supabase.updateCliente(cliente.id, {
              statusEnvio: 'Pendente',
              statusBackup: 'Pendente',
              atrasado: true
            })
            marcadosAtrasados++
          }
          return
        }
        
        // REGRA 4: CONCLUÍDOS → RESETAR PARA PENDENTE
        try {
          await supabase.updateCliente(cliente.id, {
            statusEnvio: 'Pendente',
            statusBackup: 'Pendente',
            atrasado: false,
            motivoSemBackup: null,
            mesReferencia: mesAtual
          })
          resetadosNormais++
        } catch (err) {
          await supabase.updateCliente(cliente.id, {
            statusEnvio: 'Pendente',
            statusBackup: 'Pendente',
            atrasado: false
          })
          resetadosNormais++
        }
      })

      await Promise.all(updates)
      
      // Recarregar dados do banco
      await carregarDados()
      
      setShowModalReset(false)
      
      // Ir para aba Pendentes
      setAbaSelecionada('pendentes')
      
      // Notificação profissional
      setNotificacao({
        tipo: 'sucesso',
        titulo: 'Reset Mensal Concluído!',
        mensagem: `✅ ${resetadosNormais} clientes concluídos → Pendente\n⚠️ ${marcadosAtrasados} pendentes → ATRASADOS (voltam para Pendente)\n📌 ${mantidos} atrasados antigos → Pendente\n\n🔄 TODOS na aba Pendentes!`
      })
    } catch (error) {
      setNotificacao({
        tipo: 'erro',
        titulo: 'Erro no Reset',
        mensagem: 'Não foi possível realizar o reset mensal. Tente novamente.'
      })
    }
  }

  const adicionarCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const nomeNovo = novoCliente.nome.trim()
      
      // Validar nome duplicado
      const nomeDuplicado = clientes.some(c => c.nome.toLowerCase() === nomeNovo.toLowerCase())
      if (nomeDuplicado) {
        setNotificacao({
          tipo: 'erro',
          titulo: 'Nome Duplicado!',
          mensagem: `Já existe um cliente com o nome "${nomeNovo}".\n\nEscolha outro nome para evitar duplicidade.`
        })
        return
      }
      
      const cliente: any = {
        id: crypto.randomUUID ? crypto.randomUUID() : `cliente-${Date.now()}`,
        nome: nomeNovo,
        cnpj: novoCliente.cnpj?.trim() || undefined,
        sistema: novoCliente.sistema,
        emails: novoCliente.emails.filter(e => e.trim()),
        telefone: novoCliente.telefone,
        statusEnvio: 'Pendente',
        statusBackup: 'Pendente',
        analista: '',
        ativo: true,
        urgente: false,
        atrasado: false,
        abaAtual: 'pendentes'
      }
      await supabase.addCliente(cliente)
      const novosClientes = [...clientes, cliente]
      setClientes(novosClientes)
      setNovoCliente({ nome: '', sistema: '', emails: [''], telefone: '', cnpj: '', analista: '' })
      setShowModalCliente(false)
      
      // Sincronizar sistemas automaticamente após adicionar cliente
      await sincronizarSistemas(novosClientes, sistemas)
      
      setNotificacao({
        tipo: 'sucesso',
        titulo: 'Cliente Adicionado!',
        mensagem: `O cliente "${cliente.nome}" foi cadastrado com sucesso.`
      })
    } catch (error) {
      setNotificacao({
        tipo: 'erro',
        titulo: 'Erro ao Adicionar',
        mensagem: 'Não foi possível adicionar o cliente. Tente novamente.'
      })
    }
  }

  const adicionarSistema = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const sistema: Sistema = { id: `sistema-${Date.now()}`, nome: novoSistema.nome.trim() }
      await supabase.addSistema(sistema)
      setSistemas(prev => [...prev, sistema])
      setNovoSistema({ nome: '' })
      setShowModalSistema(false)
      setNotificacao({
        tipo: 'sucesso',
        titulo: 'Sistema Adicionado!',
        mensagem: `O sistema "${sistema.nome}" foi cadastrado com sucesso.`
      })
    } catch (error) {
      setNotificacao({
        tipo: 'erro',
        titulo: 'Erro ao Adicionar',
        mensagem: 'Não foi possível adicionar o sistema. Tente novamente.'
      })
    }
  }

  const adicionarAnalista = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const analista: Analista = { id: `analista-${Date.now()}`, nome: novoAnalista.nome.trim() }
      await supabase.addAnalista(analista)
      setAnalistas(prev => [...prev, analista])
      setNovoAnalista({ nome: '' })
      setShowModalAnalista(false)
      setNotificacao({
        tipo: 'sucesso',
        titulo: 'Analista Adicionado!',
        mensagem: `O analista "${analista.nome}" foi cadastrado com sucesso.`
      })
    } catch (error) {
      setNotificacao({
        tipo: 'erro',
        titulo: 'Erro ao Adicionar',
        mensagem: 'Não foi possível adicionar o analista. Tente novamente.'
      })
    }
  }

  const confirmarExclusao = async () => {
    if (!confirmacaoExclusao) return

    try {
      if (confirmacaoExclusao.tipo === 'sistema') {
        await supabase.deleteSistema(confirmacaoExclusao.item.id)
        await carregarDados()
        setNotificacao({
          tipo: 'sucesso',
          titulo: 'Sistema Excluído!',
          mensagem: `O sistema "${confirmacaoExclusao.item.nome}" foi removido com sucesso.`
        })
      } else if (confirmacaoExclusao.tipo === 'analista') {
        await supabase.deleteAnalista(confirmacaoExclusao.item.id)
        await carregarDados()
        setNotificacao({
          tipo: 'sucesso',
          titulo: 'Analista Excluído!',
          mensagem: `O analista "${confirmacaoExclusao.item.nome}" foi removido com sucesso.`
        })
      }
    } catch (error) {
      setNotificacao({
        tipo: 'erro',
        titulo: 'Erro ao Excluir',
        mensagem: 'Não foi possível excluir. Tente novamente.'
      })
    } finally {
      setConfirmacaoExclusao(null)
    }
  }

  const abrirConfiguracoes = () => setShowModalSenha(true)

  const verificarSenha = () => {
    if (senhaDigitada === SENHA_ADMIN) {
      setShowModalSenha(false)
      setSenhaDigitada('')
      setAbaSelecionada('configuracoes')
    } else {
      setNotificacao({
        tipo: 'erro',
        titulo: 'Senha Incorreta!',
        mensagem: 'A senha digitada está incorreta. Tente novamente.'
      })
      setSenhaDigitada('')
    }
  }

  const getClientesPorAba = () => {
    // Se filtro de INATIVOS ativado, mostrar APENAS inativos
    if (filtroInativos) {
      return clientes.filter(c => !c.ativo)
    }
    
    // ABA LISTAGEM: Mostrar TODOS (ativos e inativos)
    if (abaSelecionada === 'listagem') {
      return clientes
    }
    
    if (abaSelecionada === 'atrasados') {
      const atrasados = clientes.filter(c => c.atrasado && c.ativo)
      if (filtroMes) {
        return atrasados.filter(c => c.mesAtrasado === filtroMes)
      }
      return atrasados
    }
    
    // Outras abas: Filtrar por abaAtual E apenas ATIVOS
    return clientes.filter(c => c.abaAtual === abaSelecionada && c.ativo)
  }

  const clientesFiltrados = getClientesPorAba().filter(c => {
    const matchPesquisa = c.nome.toLowerCase().includes(pesquisa.toLowerCase()) || c.sistema.toLowerCase().includes(pesquisa.toLowerCase())
    const matchLetra = letraSelecionada ? c.nome.toUpperCase().startsWith(letraSelecionada) : true
    const matchSistema = filtroSistema ? c.sistema === filtroSistema : true
    const matchUrgente = filtroUrgente ? c.urgente : true
    
    // NOVO: Filtrar por mês APENAS nas abas que não são atrasados (atrasados já filtram)
    const matchMes = (abaSelecionada === 'atrasados') ? true : (filtroMes ? c.mesReferencia === filtroMes : true)
    
    return matchPesquisa && matchLetra && matchSistema && matchUrgente && matchMes
  })

  const stats = {
    total: clientes.length,
    pendentes: clientes.filter(c => c.abaAtual === 'pendentes').length, // INCLUI ATRASADOS
    concluidos: clientes.filter(c => c.abaAtual === 'concluidos').length,
    urgentes: clientes.filter(c => c.urgente).length,
    backupCritico: clientes.filter(c => c.abaAtual === 'backupCritico').length,
    atencao: clientes.filter(c => c.abaAtual === 'atencao').length,
    atrasados: clientes.filter(c => c.atrasado).length // TODOS OS ATRASADOS
  }

  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  // Gerar lista de todos os meses (últimos 12 meses)
  const gerarMeses = () => {
    const meses = []
    const hoje = new Date()
    for (let i = 0; i < 12; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const mesAno = data.toISOString().slice(0, 7)
      meses.push(mesAno)
    }
    return meses
  }

  const todosOsMeses = gerarMeses()

  const relatoriosPorSistema = sistemas.map(sistema => {
    const clientesSistema = clientes.filter(c => c.sistema === sistema.nome)
    const concluidos = clientesSistema.filter(c => c.abaAtual === 'concluidos').length
    return {
      sistema: sistema.nome,
      total: clientesSistema.length,
      concluidos,
      pendentes: clientesSistema.length - concluidos,
      percentual: clientesSistema.length > 0 ? Math.round((concluidos / clientesSistema.length) * 100) : 0
    }
  })

  const relatoriosPorAnalista = analistas.map(analista => {
    const clientesAnalista = clientes.filter(c => c.analista === analista.nome)
    const concluidos = clientesAnalista.filter(c => c.abaAtual === 'concluidos').length
    return {
      analista: analista.nome,
      total: clientesAnalista.length,
      concluidos,
      pendentes: clientesAnalista.length - concluidos,
      percentual: clientesAnalista.length > 0 ? Math.round((concluidos / clientesAnalista.length) * 100) : 0
    }
  })

  const formatarMes = (mesAno: string) => {
    const [ano, mes] = mesAno.split('-')
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    return `${meses[parseInt(mes) - 1]} ${ano}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D3B3B] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-[#7FB069] animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Carregando sistema...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D3B3B] via-[#0F4747] to-[#0D3B3B] flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0A2F2F] border-r border-[#7FB069]/20 flex flex-col">
        <div className="p-6 border-b border-[#7FB069]/20">
          <img src={logoGestao} alt="Gestão Sistemas" className="h-12 mb-2" />
          <h1 className="text-white font-bold text-sm">CONTROL GESTÃO</h1>
          <p className="text-[#7FB069] text-xs">Arquivos Fiscais e Backups</p>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <button onClick={() => setAbaSelecionada('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${abaSelecionada === 'dashboard' ? 'bg-[#7FB069] text-white' : 'text-gray-300 hover:bg-[#0D3B3B]'}`}>
            <Home className="w-5 h-5" /><span className="font-medium">Dashboard</span>
          </button>
          
          <button onClick={() => setAbaSelecionada('pendentes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${abaSelecionada === 'pendentes' ? 'bg-[#7FB069] text-white' : 'text-gray-300 hover:bg-[#0D3B3B]'}`}>
            <Clock className="w-5 h-5" /><span className="font-medium">Pendentes</span>
            {stats.pendentes > 0 && <span className="ml-auto bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.pendentes}</span>}
          </button>
          
          <button onClick={() => setAbaSelecionada('concluidos')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${abaSelecionada === 'concluidos' ? 'bg-[#7FB069] text-white' : 'text-gray-300 hover:bg-[#0D3B3B]'}`}>
            <Check className="w-5 h-5" /><span className="font-medium">Concluídos</span>
            {stats.concluidos > 0 && <span className="ml-auto bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.concluidos}</span>}
          </button>
          
          <button onClick={() => setAbaSelecionada('backupCritico')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${abaSelecionada === 'backupCritico' ? 'bg-[#7FB069] text-white' : 'text-gray-300 hover:bg-[#0D3B3B]'}`}>
            <AlertCircle className="w-5 h-5" /><span className="font-medium">Backup Crítico</span>
            {stats.backupCritico > 0 && <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.backupCritico}</span>}
          </button>

          <button onClick={() => setAbaSelecionada('atencao')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${abaSelecionada === 'atencao' ? 'bg-[#7FB069] text-white' : 'text-gray-300 hover:bg-[#0D3B3B]'}`}>
            <Bell className="w-5 h-5" /><span className="font-medium">Atenção</span>
            {stats.atencao > 0 && <span className="ml-auto bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.atencao}</span>}
          </button>
          
          <button onClick={() => setAbaSelecionada('atrasados')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${abaSelecionada === 'atrasados' ? 'bg-[#7FB069] text-white' : 'text-gray-300 hover:bg-[#0D3B3B]'}`}>
            <AlertTriangle className="w-5 h-5" /><span className="font-medium">Atrasados</span>
          </button>
          
          <button onClick={() => setAbaSelecionada('listagem')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${abaSelecionada === 'listagem' ? 'bg-[#7FB069] text-white' : 'text-gray-300 hover:bg-[#0D3B3B]'}`}>
            <List className="w-5 h-5" /><span className="font-medium">Clientes</span>
            <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.total}</span>
          </button>
          
          <button onClick={() => setAbaSelecionada('relatorios')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${abaSelecionada === 'relatorios' ? 'bg-[#7FB069] text-white' : 'text-gray-300 hover:bg-[#0D3B3B]'}`}>
            <BarChart3 className="w-5 h-5" /><span className="font-medium">Relatórios</span>
          </button>
          
          <button onClick={abrirConfiguracoes} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${abaSelecionada === 'configuracoes' ? 'bg-[#7FB069] text-white' : 'text-gray-300 hover:bg-[#0D3B3B]'}`}>
            <Settings className="w-5 h-5" /><span className="font-medium">Configurações</span><Lock className="w-4 h-4 ml-auto" />
          </button>
        </nav>

        <div className="p-4 border-t border-[#7FB069]/20 space-y-2">
          <div className="flex items-center justify-between text-sm"><span className="text-gray-400">Total:</span><span className="font-bold text-white">{stats.total}</span></div>
          <div className="flex items-center justify-between text-sm"><span className="text-gray-400">Pendentes:</span><span className="font-bold text-yellow-400">{stats.pendentes}</span></div>
          <div className="flex items-center justify-between text-sm"><span className="text-gray-400">Concluídos:</span><span className="font-bold text-green-400">{stats.concluidos}</span></div>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <div className="flex-1 flex flex-col">
        <header className="bg-[#0A2F2F] border-b border-[#7FB069]/20 px-8 py-4">
          <h2 className="text-2xl font-bold text-white">
            {abaSelecionada === 'dashboard' && 'Dashboard'}
            {abaSelecionada === 'pendentes' && 'Clientes Pendentes'}
            {abaSelecionada === 'concluidos' && 'Clientes Concluídos'}
            {abaSelecionada === 'backupCritico' && 'Backup Crítico'}
            {abaSelecionada === 'atencao' && 'Clientes que Precisam Atenção'}
            {abaSelecionada === 'atrasados' && 'Clientes Atrasados'}
            {abaSelecionada === 'listagem' && 'Clientes'}
            {abaSelecionada === 'relatorios' && 'Relatórios Gerenciais'}
            {abaSelecionada === 'configuracoes' && 'Configurações'}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {(abaSelecionada === 'pendentes' || abaSelecionada === 'concluidos' || abaSelecionada === 'backupCritico' || abaSelecionada === 'atencao' || abaSelecionada === 'atrasados' || abaSelecionada === 'listagem') && `${clientesFiltrados.length} clientes`}
          </p>
        </header>

        {/* DASHBOARD */}
        {abaSelecionada === 'dashboard' && (
          <DashboardGraficos 
            clientes={clientes}
            sistemas={sistemas}
            analistas={analistas}
            stats={stats}
          />
        )}

        {/* LISTA DE CLIENTES */}
        {(abaSelecionada === 'pendentes' || abaSelecionada === 'concluidos' || abaSelecionada === 'backupCritico' || abaSelecionada === 'atencao' || abaSelecionada === 'atrasados') && (
          <main className="flex-1 p-8 overflow-auto">
            <div className="bg-[#0A2F2F] p-4 rounded-xl border border-[#7FB069]/20 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} placeholder="Pesquisar cliente..." className="w-full pl-11 pr-4 py-3 bg-[#0D3B3B] border border-[#7FB069]/20 rounded-lg text-white placeholder-gray-400 focus:border-[#7FB069]" />
                </div>
                {abaSelecionada === 'pendentes' && (
                  <button onClick={() => setShowModalCliente(true)} className="flex items-center gap-2 bg-[#7FB069] text-white px-6 py-3 rounded-lg hover:bg-[#6A9A56] font-medium">
                    <Plus className="w-5 h-5" />Novo Cliente
                  </button>
                )}
                <button onClick={carregarDados} className="p-3 text-gray-400 hover:text-white hover:bg-[#0D3B3B] rounded-lg">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <select value={filtroSistema} onChange={(e) => setFiltroSistema(e.target.value)} className="px-4 py-2 bg-[#0D3B3B] border border-[#7FB069]/20 rounded-lg text-white">
                  <option value="">Todos Sistemas</option>
                  {sistemas.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                </select>
                
                {/* Calendário de Mês em TODAS as abas */}
                <input 
                  type="month" 
                  value={filtroMes} 
                  onChange={(e) => setFiltroMes(e.target.value)} 
                  className="px-4 py-2 bg-[#0D3B3B] border border-[#7FB069]/20 rounded-lg text-white cursor-pointer"
                  placeholder="Filtrar por mês"
                />
                
                <button onClick={() => setFiltroUrgente(!filtroUrgente)} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${filtroUrgente ? 'bg-red-500 text-white' : 'bg-[#0D3B3B] text-gray-300 border border-[#7FB069]/20'}`}>
                  <Zap className="w-4 h-4" />Urgentes
                </button>
                <button onClick={() => setFiltroInativos(!filtroInativos)} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${filtroInativos ? 'bg-gray-500 text-white' : 'bg-[#0D3B3B] text-gray-300 border border-[#7FB069]/20'}`}>
                  <X className="w-4 h-4" />Inativos
                </button>
                {(filtroSistema || letraSelecionada || pesquisa || filtroUrgente || filtroMes || filtroInativos) && (
                  <button onClick={() => { setFiltroSistema(''); setLetraSelecionada(''); setPesquisa(''); setFiltroUrgente(false); setFiltroMes(''); setFiltroInativos(false) }} className="px-4 py-2 text-gray-300 hover:bg-[#0D3B3B] rounded-lg">Limpar</button>
                )}
              </div>

              <div className="flex flex-wrap gap-1">
                {alfabeto.map(letra => (
                  <button key={letra} onClick={() => setLetraSelecionada(letraSelecionada === letra ? '' : letra)} className={`w-8 h-8 rounded text-sm font-medium ${letraSelecionada === letra ? 'bg-[#7FB069] text-white' : 'bg-[#0D3B3B] text-gray-400 hover:bg-[#0F4747]'}`}>{letra}</button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {clientesFiltrados.map((cliente) => (
                <div key={cliente.id} className={`bg-[#0A2F2F] border rounded-xl p-4 transition-all ${cliente.urgente ? 'border-red-500 shadow-lg shadow-red-500/20' : 'border-[#7FB069]/20 hover:border-[#7FB069]'}`}>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-bold text-lg">{cliente.nome}</h3>
                        {cliente.urgente && <span className="flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold"><Zap className="w-3 h-3" />URGENTE</span>}
                        {cliente.atrasado && abaSelecionada === 'atrasados' && <span className="bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold">ATRASADO - {cliente.mesAtrasado && formatarMes(cliente.mesAtrasado)}</span>}
                      </div>
                      <p className="text-[#7FB069] text-sm font-medium mt-1">{cliente.sistema}</p>
                      {cliente.analista && <p className="text-gray-400 text-xs mt-1">Analista: {cliente.analista}</p>}
                      {cliente.motivoSemBackup && <p className="text-orange-400 text-xs mt-1 italic">Motivo: {cliente.motivoSemBackup}</p>}
                    </div>

                    <div className="w-56">
                      <label className="text-gray-400 text-xs block mb-1.5">Status Envio</label>
                      <select value={cliente.statusEnvio || 'Pendente'} onChange={(e) => atualizarStatusRapido(cliente.id, 'statusEnvio', e.target.value)} className={`w-full px-3 py-2.5 rounded-lg border-2 font-medium cursor-pointer text-white ${cliente.statusEnvio === 'Enviado' ? 'bg-green-700/40 border-green-500' : statusEspeciais.includes(cliente.statusEnvio) ? 'bg-purple-700/40 border-purple-500' : 'bg-gray-700/40 border-gray-500'}`}>
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

                    <div className="w-44">
                      <label className="text-gray-400 text-xs block mb-1.5">Status Backup</label>
                      <select 
                        value={cliente.statusBackup || 'Pendente'} 
                        onChange={(e) => {
                          atualizarStatusRapido(cliente.id, 'statusBackup', e.target.value)
                        }} 
                        className={`w-full px-3 py-2.5 rounded-lg border-2 font-medium cursor-pointer text-white ${cliente.statusBackup === 'Feito' ? 'bg-green-700/40 border-green-500' : 'bg-gray-700/40 border-gray-500'}`}
                      >
                        <option>Pendente</option>
                        <option>Feito</option>
                      </select>
                    </div>

                    <div className="flex items-end gap-2">
                      <button 
                        onClick={() => {
                          setClienteDetalhes(cliente)
                          setShowModalDetalhes(true)
                        }}
                        className="w-10 h-10 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center transition-all hover:scale-110"
                        title="Ver detalhes"
                      >
                        <Eye className="w-5 h-5 text-white" />
                      </button>
                      
                      <button 
                        onClick={async () => {
                          await supabase.updateCliente(cliente.id, { urgente: !cliente.urgente })
                          setClientes(prev => prev.map(c => c.id === cliente.id ? { ...c, urgente: !c.urgente } : c))
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 ${cliente.urgente ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                        title={cliente.urgente ? "Remover urgência" : "Marcar como urgente"}
                      >
                        <Zap className="w-5 h-5 text-white" />
                      </button>
                      
                      <button 
                        onClick={() => marcarComoConcluido(cliente.id)}
                        className="w-10 h-10 bg-[#7FB069] hover:bg-green-500 rounded-full flex items-center justify-center transition-all hover:scale-110"
                        title="Concluir"
                      >
                        <Check className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {clientesFiltrados.length === 0 && (
              <div className="text-center py-12 bg-[#0A2F2F] rounded-xl border border-[#7FB069]/20">
                <AlertTriangle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Nenhum cliente encontrado</p>
              </div>
            )}
          </main>
        )}

        {/* LISTAGEM DE CLIENTES */}
        {abaSelecionada === 'listagem' && (
          <main className="flex-1 p-8 overflow-auto">
            <div className="bg-[#0A2F2F] p-4 rounded-xl border border-[#7FB069]/20 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} placeholder="Pesquisar cliente..." className="w-full pl-11 pr-4 py-3 bg-[#0D3B3B] border border-[#7FB069]/20 rounded-lg text-white placeholder-gray-400 focus:border-[#7FB069]" />
                </div>
                <button onClick={() => setShowModalCliente(true)} className="flex items-center gap-2 bg-[#7FB069] text-white px-6 py-3 rounded-lg hover:bg-[#6A9A56] font-medium">
                  <Plus className="w-5 h-5" />Novo Cliente
                </button>
                <button onClick={carregarDados} className="p-3 text-gray-400 hover:text-white hover:bg-[#0D3B3B] rounded-lg">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <select value={filtroSistema} onChange={(e) => setFiltroSistema(e.target.value)} className="px-4 py-2 bg-[#0D3B3B] border border-[#7FB069]/20 rounded-lg text-white">
                  <option value="">Todos Sistemas</option>
                  {sistemas.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                </select>
                
                <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} className="px-4 py-2 bg-[#0D3B3B] border border-[#7FB069]/20 rounded-lg text-white">
                  <option value="">Todos os Meses</option>
                  {todosOsMeses.map(mes => <option key={mes} value={mes}>{formatarMes(mes)}</option>)}
                </select>
                
                <button onClick={() => setFiltroUrgente(!filtroUrgente)} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${filtroUrgente ? 'bg-red-500 text-white' : 'bg-[#0D3B3B] text-gray-300 border border-[#7FB069]/20'}`}>
                  <Zap className="w-4 h-4" />Urgentes
                </button>
                <button onClick={() => setFiltroInativos(!filtroInativos)} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${filtroInativos ? 'bg-gray-500 text-white' : 'bg-[#0D3B3B] text-gray-300 border border-[#7FB069]/20'}`}>
                  <X className="w-4 h-4" />Inativos
                </button>
                {(filtroSistema || letraSelecionada || pesquisa || filtroUrgente || filtroMes || filtroInativos) && (
                  <button onClick={() => { setFiltroSistema(''); setLetraSelecionada(''); setPesquisa(''); setFiltroUrgente(false); setFiltroMes(''); setFiltroInativos(false) }} className="px-4 py-2 text-gray-300 hover:bg-[#0D3B3B] rounded-lg">Limpar</button>
                )}
              </div>

              <div className="flex flex-wrap gap-1">
                {alfabeto.map(letra => (
                  <button key={letra} onClick={() => setLetraSelecionada(letraSelecionada === letra ? '' : letra)} className={`w-8 h-8 rounded text-sm font-medium ${letraSelecionada === letra ? 'bg-[#7FB069] text-white' : 'bg-[#0D3B3B] text-gray-400 hover:bg-[#0F4747]'}`}>{letra}</button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {clientes.filter(c => {
                const matchPesquisa = c.nome.toLowerCase().includes(pesquisa.toLowerCase()) || c.sistema.toLowerCase().includes(pesquisa.toLowerCase())
                const matchLetra = letraSelecionada ? c.nome.toUpperCase().startsWith(letraSelecionada) : true
                const matchSistema = filtroSistema ? c.sistema === filtroSistema : true
                const matchUrgente = filtroUrgente ? c.urgente : true
                const matchMes = filtroMes ? c.mesReferencia === filtroMes : true
                return matchPesquisa && matchLetra && matchSistema && matchUrgente && matchMes
              }).map((cliente) => (
                <div key={cliente.id} className={`bg-[#0A2F2F] border rounded-xl p-4 transition-all ${cliente.urgente ? 'border-red-500 shadow-lg shadow-red-500/20' : 'border-[#7FB069]/20 hover:border-[#7FB069]'}`}>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-bold text-lg">{cliente.nome}</h3>
                        {cliente.urgente && <span className="flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold"><Zap className="w-3 h-3" />URGENTE</span>}
                        {cliente.atrasado && abaSelecionada === 'atrasados' && <span className="bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold">ATRASADO</span>}
                        {!cliente.ativo && <span className="bg-gray-600 text-white px-2 py-0.5 rounded text-xs font-bold">INATIVO</span>}
                      </div>
                      <p className="text-[#7FB069] text-sm font-medium mt-1">{cliente.sistema}</p>
                      {cliente.analista && <p className="text-gray-400 text-xs mt-1">Analista: {cliente.analista}</p>}
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${cliente.statusEnvio === 'Enviado' ? 'bg-green-700/40 text-green-300' : 'bg-gray-700/40 text-gray-300'}`}>
                          Envio: {cliente.statusEnvio}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${cliente.statusBackup === 'Feito' ? 'bg-green-700/40 text-green-300' : 'bg-gray-700/40 text-gray-300'}`}>
                          Backup: {cliente.statusBackup}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setClienteDetalhes(cliente)
                          setShowModalDetalhes(true)
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalhes
                      </button>
                      
                      <button 
                        onClick={async () => {
                          if (confirm(`${cliente.ativo ? 'DESATIVAR' : 'ATIVAR'} o cliente ${cliente.nome}?\n\n${cliente.ativo ? 'Cliente não aparecerá mais nas abas de trabalho.' : 'Cliente voltará a aparecer nas abas.'}`)) {
                            await supabase.updateCliente(cliente.id, { ativo: !cliente.ativo })
                            setClientes(prev => prev.map(c => c.id === cliente.id ? { ...c, ativo: !c.ativo } : c))
                            setNotificacao({
                              tipo: cliente.ativo ? 'aviso' : 'sucesso',
                              titulo: cliente.ativo ? 'Cliente Desativado!' : 'Cliente Ativado!',
                              mensagem: `${cliente.nome} foi ${cliente.ativo ? 'desativado' : 'ativado'} com sucesso.`
                            })
                          }
                        }}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${cliente.ativo ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}
                      >
                        {cliente.ativo ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        {cliente.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {clientes.length === 0 && (
              <div className="text-center py-12 bg-[#0A2F2F] rounded-xl border border-[#7FB069]/20">
                <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Nenhum cliente cadastrado</p>
              </div>
            )}
          </main>
        )}

        {/* RELATÓRIOS */}
        {abaSelecionada === 'relatorios' && (
          <main className="flex-1 p-8 overflow-auto">
            {/* Filtro de Mês */}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-gray-300 text-sm">Filtrar por Mês:</label>
                <input 
                  type="month" 
                  value={filtroMes} 
                  onChange={(e) => setFiltroMes(e.target.value)} 
                  className="px-4 py-2.5 bg-[#0A2F2F] border border-[#7FB069]/20 rounded-lg text-white cursor-pointer"
                />
              </div>
              {filtroMes && <button onClick={() => setFiltroMes('')} className="px-4 py-2 text-gray-300 hover:bg-[#0D3B3B] rounded-lg">Limpar Filtro</button>}
            </div>

            {/* Aviso sobre atualização mensal */}
            {!filtroMes && (
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-sm">
                  📊 <strong>Relatório Geral:</strong> Mostrando dados de todos os períodos. Use o filtro de mês acima para ver dados específicos de um mês.
                </p>
              </div>
            )}
            {filtroMes && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-300 text-sm">
                  📅 <strong>Filtrado:</strong> Mostrando apenas dados de {formatarMes(filtroMes)}
                </p>
              </div>
            )}

            {/* Cards de Totais por Aba */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-[#0A2F2F] p-6 rounded-xl border border-[#7FB069]/20">
                <div className="flex items-center justify-between">
                  <div><p className="text-gray-400 text-sm">Pendentes</p><p className="text-3xl font-bold text-yellow-400 mt-2">{clientes.filter(c => c.ativo !== false && !c.atrasado && c.abaAtual === 'pendentes' && (filtroMes ? c.mesReferencia === filtroMes : true)).length}</p></div>
                  <Clock className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
              <div className="bg-[#0A2F2F] p-6 rounded-xl border border-[#7FB069]/20">
                <div className="flex items-center justify-between">
                  <div><p className="text-gray-400 text-sm">Concluídos</p><p className="text-3xl font-bold text-green-400 mt-2">{clientes.filter(c => c.ativo !== false && !c.atrasado && c.statusEnvio === 'Enviado' && (filtroMes ? c.mesReferencia === filtroMes : true)).length}</p></div>
                  <Check className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <div className="bg-[#0A2F2F] p-6 rounded-xl border border-[#7FB069]/20">
                <div className="flex items-center justify-between">
                  <div><p className="text-gray-400 text-sm">Backup Crítico</p><p className="text-3xl font-bold text-orange-400 mt-2">{clientes.filter(c => c.ativo !== false && !c.atrasado && c.abaAtual === 'backupCritico' && (filtroMes ? c.mesReferencia === filtroMes : true)).length}</p></div>
                  <AlertCircle className="w-8 h-8 text-orange-400" />
                </div>
              </div>
              <div className="bg-[#0A2F2F] p-6 rounded-xl border border-[#7FB069]/20">
                <div className="flex items-center justify-between">
                  <div><p className="text-gray-400 text-sm">Atenção</p><p className="text-3xl font-bold text-purple-400 mt-2">{clientes.filter(c => c.ativo !== false && !c.atrasado && c.abaAtual === 'atencao' && (filtroMes ? c.mesReferencia === filtroMes : true)).length}</p></div>
                  <Bell className="w-8 h-8 text-purple-400" />
                </div>
              </div>
            </div>

            {/* Envio e Backup por Analista */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-[#0A2F2F] p-6 rounded-xl border border-[#7FB069]/20">
                <h3 className="text-xl font-bold text-white mb-4">📤 Envio por Analista {filtroMes ? `(${formatarMes(filtroMes)})` : '(Mês Atual)'}</h3>
                <div className="space-y-3 max-h-96 overflow-auto">
                  {analistas.map(analista => {
                    const mesReferencia = filtroMes || new Date().toISOString().slice(0, 7)
                    const clientesAnalista = clientes.filter(c => c.analista === analista.nome && c.ativo !== false && !c.atrasado && c.mesReferencia === mesReferencia)
                    const enviados = clientesAnalista.filter(c => c.statusEnvio === 'Enviado').length
                    const percentual = clientesAnalista.length > 0 ? Math.round((enviados / clientesAnalista.length) * 100) : 0
                    return (
                      <div key={analista.id} className="p-4 bg-[#0D3B3B] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-bold">{analista.nome}</span>
                          <span className="text-[#7FB069] font-bold text-lg">{enviados}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-400">Total: {clientesAnalista.length}</span>
                          <span className="text-green-400">Enviados: {enviados}</span>
                        </div>
                        <div className="h-2 bg-[#0F4747] rounded-full overflow-hidden">
                          <div className="h-full bg-[#7FB069]" style={{ width: `${percentual}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-[#0A2F2F] p-6 rounded-xl border border-[#7FB069]/20">
                <h3 className="text-xl font-bold text-white mb-4">💾 Backup por Analista {filtroMes ? `(${formatarMes(filtroMes)})` : '(Mês Atual)'}</h3>
                <div className="space-y-3 max-h-96 overflow-auto">
                  {analistas.map(analista => {
                    const mesReferencia = filtroMes || new Date().toISOString().slice(0, 7)
                    const clientesAnalista = clientes.filter(c => c.analista === analista.nome && c.ativo !== false && !c.atrasado && c.mesReferencia === mesReferencia)
                    const backups = clientesAnalista.filter(c => c.statusBackup === 'Feito').length
                    const percentual = clientesAnalista.length > 0 ? Math.round((backups / clientesAnalista.length) * 100) : 0
                    return (
                      <div key={analista.id} className="p-4 bg-[#0D3B3B] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-bold">{analista.nome}</span>
                          <span className="text-[#7FB069] font-bold text-lg">{backups}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-400">Total: {clientesAnalista.length}</span>
                          <span className="text-green-400">Feitos: {backups}</span>
                        </div>
                        <div className="h-2 bg-[#0F4747] rounded-full overflow-hidden">
                          <div className="h-full bg-[#7FB069]" style={{ width: `${percentual}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Clientes Enviados e Enviados por Sistema */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-[#0A2F2F] p-6 rounded-xl border border-[#7FB069]/20">
                <h3 className="text-xl font-bold text-white mb-4">🏆 Ranking Anual de Envios</h3>
                <p className="text-gray-400 text-xs mb-4">Total de envios por analista (ano completo)</p>
                <div className="space-y-3 max-h-96 overflow-auto">
                  {analistas
                    .map(analista => {
                      const todosClientesAnalista = clientes.filter(c => c.analista === analista.nome && c.ativo !== false)
                      const totalEnviados = todosClientesAnalista.filter(c => c.statusEnvio === 'Enviado').length
                      return { ...analista, totalEnviados, totalClientes: todosClientesAnalista.length }
                    })
                    .sort((a, b) => b.totalEnviados - a.totalEnviados)
                    .map((analista, index) => {
                      const percentual = analista.totalClientes > 0 ? Math.round((analista.totalEnviados / analista.totalClientes) * 100) : 0
                      const medalha = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`
                      
                      return (
                        <div key={analista.id} className={`p-4 rounded-lg ${index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : index === 1 ? 'bg-gray-400/10 border border-gray-400/30' : index === 2 ? 'bg-orange-600/10 border border-orange-600/30' : 'bg-[#0D3B3B]'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{medalha}</span>
                              <span className={`font-bold ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-white'}`}>
                                {analista.nome}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[#7FB069] font-bold text-xl">{analista.totalEnviados}</span>
                              <span className="text-gray-400 text-sm ml-1">envios</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-400">Total: {analista.totalClientes} clientes</span>
                            <span className="text-green-400 font-bold">{percentual}%</span>
                          </div>
                          <div className="h-2 bg-[#0F4747] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#7FB069] to-green-400" style={{ width: `${percentual}%` }} />
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>

              <div className="bg-[#0A2F2F] p-6 rounded-xl border border-[#7FB069]/20">
                <h3 className="text-xl font-bold text-white mb-4">📊 Enviados por Sistema</h3>
                <div className="space-y-3 max-h-96 overflow-auto">
                  {sistemas.filter(s => s.nome && s.nome.trim()).map(sistema => {
                    // Filtrar apenas clientes ativos e não atrasados
                    const clientesSistema = clientes.filter(c => c.sistema === sistema.nome && c.ativo !== false && !c.atrasado && (!filtroMes || c.mesReferencia === filtroMes))
                    const enviados = clientesSistema.filter(c => c.statusEnvio === 'Enviado').length
                    const percentual = clientesSistema.length > 0 ? Math.round((enviados / clientesSistema.length) * 100) : 0
                    
                    // Só mostrar se tiver pelo menos 1 cliente
                    if (clientesSistema.length === 0) return null
                    
                    return (
                      <div key={sistema.id} className="p-4 bg-[#0D3B3B] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-bold">{sistema.nome}</span>
                          <span className="text-[#7FB069] font-bold">{enviados}/{clientesSistema.length}</span>
                        </div>
                        <div className="h-2 bg-[#0F4747] rounded-full overflow-hidden">
                          <div className="h-full bg-[#7FB069]" style={{ width: `${percentual}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Clientes com Justificativa */}
            <div className="bg-[#0A2F2F] p-6 rounded-xl border border-[#7FB069]/20 mb-6">
              <h3 className="text-xl font-bold text-white mb-4">📝 Clientes com Justificativa de Backup</h3>
              <div className="space-y-3 max-h-96 overflow-auto">
                {clientes.filter(c => c.motivoSemBackup && c.ativo !== false && (!filtroMes || c.mesReferencia === filtroMes)).map(cliente => (
                  <div key={cliente.id} className={`p-4 bg-[#0D3B3B] rounded-lg border-l-4 ${cliente.statusBackup === 'Feito' ? 'border-green-500' : 'border-orange-500'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{cliente.nome}</p>
                          {cliente.statusBackup === 'Feito' && <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded font-bold">RESOLVIDO</span>}
                        </div>
                        <p className="text-[#7FB069] text-sm">{cliente.sistema}</p>
                        <p className={`text-sm mt-2 italic ${cliente.statusBackup === 'Feito' ? 'text-gray-400 line-through' : 'text-orange-400'}`}>"{cliente.motivoSemBackup}"</p>
                        {cliente.analista && <p className="text-gray-500 text-xs mt-1">Responsável: {cliente.analista}</p>}
                        {cliente.statusBackup === 'Feito' && cliente.analistaBackup && (
                          <p className="text-green-400 text-xs mt-2 font-bold">✅ Backup feito por: {cliente.analistaBackup}</p>
                        )}
                      </div>
                      {cliente.statusBackup === 'Feito' ? (
                        <Check className="w-6 h-6 text-green-400 ml-4" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-orange-400 ml-4" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {clientes.filter(c => c.motivoSemBackup && c.ativo !== false && (!filtroMes || c.mesReferencia === filtroMes)).length === 0 && (
                <p className="text-gray-500 text-center py-8">Nenhum cliente com justificativa</p>
              )}
            </div>

            {/* Resumo Geral */}
            <div className="bg-[#0A2F2F] p-6 rounded-xl border border-[#7FB069]/20">
              <h3 className="text-xl font-bold text-white mb-4">📈 Resumo Geral</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#0D3B3B] rounded-lg">
                  <div className="text-gray-400 text-sm">Taxa de Conclusão</div>
                  <div className="text-3xl font-bold text-[#7FB069] mt-2">{(() => {
                    const clientesRelatorio = clientes.filter(c => c.ativo !== false && !c.atrasado && (!filtroMes || c.mesReferencia === filtroMes))
                    const concluidos = clientesRelatorio.filter(c => c.statusEnvio === 'Enviado').length
                    return clientesRelatorio.length > 0 ? Math.round((concluidos / clientesRelatorio.length) * 100) : 0
                  })()}%</div>
                </div>
                <div className="p-4 bg-[#0D3B3B] rounded-lg">
                  <div className="text-gray-400 text-sm">Média por Sistema</div>
                  <div className="text-3xl font-bold text-white mt-2">{(() => {
                    const clientesRelatorio = clientes.filter(c => c.ativo !== false && !c.atrasado && (!filtroMes || c.mesReferencia === filtroMes))
                    return sistemas.length > 0 ? Math.round(clientesRelatorio.length / sistemas.length) : 0
                  })()}</div>
                </div>
                <div className="p-4 bg-[#0D3B3B] rounded-lg">
                  <div className="text-gray-400 text-sm">Média por Analista</div>
                  <div className="text-3xl font-bold text-white mt-2">{(() => {
                    const clientesRelatorio = clientes.filter(c => c.ativo !== false && !c.atrasado && (!filtroMes || c.mesReferencia === filtroMes))
                    return analistas.length > 0 ? Math.round(clientesRelatorio.length / analistas.length) : 0
                  })()}</div>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* CONFIGURAÇÕES */}
        {abaSelecionada === 'configuracoes' && (
          <main className="flex-1 p-8 overflow-auto">
            {/* Instruções SQL para adicionar colunas */}
            <InstrucoesSQL />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-[#0A2F2F] p-6 rounded-xl border border-[#7FB069]/20">
                <h3 className="text-lg font-bold text-white mb-4">Sistemas</h3>
                <div className="flex gap-2 mb-4">
                  <button onClick={() => setShowModalSistema(true)} className="flex-1 flex items-center justify-center gap-2 bg-[#7FB069] text-white px-4 py-3 rounded-lg hover:bg-[#6A9A56]">
                    <Plus className="w-5 h-5" />Adicionar Sistema
                  </button>
                  <button 
                    onClick={async () => {
                      await sincronizarSistemas(clientes, sistemas, true)
                    }} 
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-500 disabled:opacity-50"
                    title="Sincronizar sistemas dos clientes"
                    disabled={sincronizando}
                  >
                    <RefreshCw className={`w-5 h-5 ${sincronizando ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-xs font-medium mb-1">
                    💡 Sincronização Automática
                  </p>
                  <p className="text-blue-200 text-xs">
                    {sistemas.length} sistema(s) cadastrado(s). Novos sistemas dos clientes são adicionados automaticamente.
                  </p>
                </div>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {sistemas.length > 0 ? (
                    sistemas.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 bg-[#0D3B3B] rounded-lg text-white group">
                        <span>{s.nome}</span>
                        <button
                          onClick={() => setConfirmacaoExclusao({ tipo: 'sistema', item: s })}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/20 rounded-lg"
                          title="Excluir sistema"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">Nenhum sistema cadastrado</p>
                  )}
                </div>
              </div>

              <div className="bg-[#0A2F2F] p-6 rounded-xl border border-[#7FB069]/20">
                <h3 className="text-lg font-bold text-white mb-4">Analistas</h3>
                <button onClick={() => setShowModalAnalista(true)} className="w-full flex items-center justify-center gap-2 bg-[#7FB069] text-white px-4 py-3 rounded-lg hover:bg-[#6A9A56] mb-4">
                  <Plus className="w-5 h-5" />Adicionar Analista
                </button>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {analistas.length > 0 ? (
                    analistas.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 bg-[#0D3B3B] rounded-lg text-white group">
                        <span>{a.nome}</span>
                        <button
                          onClick={() => setConfirmacaoExclusao({ tipo: 'analista', item: a })}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/20 rounded-lg"
                          title="Excluir analista"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">Nenhum analista cadastrado</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#0A2F2F] p-6 rounded-xl border border-red-500/50">
              <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Reset Mensal
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                O reset mensal irá:
                <br />• Clientes pendentes vão para "Atrasados" com o mês atual
                <br />• Demais clientes voltam para "Pendentes" com status resetado
              </p>
              <button 
                onClick={() => setShowModalReset(true)}
                className="w-full flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 font-medium"
              >
                <RotateCcw className="w-5 h-5" />
                Realizar Reset Mensal
              </button>
            </div>

            {/* LIMPAR ATRASADOS - PREPARAR PARA PRODUÇÃO */}
            <div className="bg-[#0A2F2F] p-6 rounded-xl border border-blue-500/50 mt-6">
              <h3 className="text-lg font-bold text-blue-400 mb-4">🧹 Limpar Atrasados (Produção)</h3>
              <p className="text-gray-300 text-sm mb-4">
                <strong className="text-yellow-400">⚠️ Use apenas para preparar o sistema para produção!</strong>
                <br /><br />
                Esta ação irá:
                <br />• Remover a flag "atrasado" de TODOS os clientes
                <br />• Limpar todos os meses de atraso registrados
                <br />• Deixar todos os clientes como "normais"
                <br /><br />
                <span className="text-red-400 font-bold">⚠️ Esta ação NÃO PODE ser desfeita!</span>
              </p>
              <button 
                onClick={async () => {
                  const confirmacao = prompt('⚠️ ATENÇÃO!\n\nEsta ação vai LIMPAR TODOS OS ATRASADOS.\n\nDigite "LIMPAR" (em maiúsculas) para confirmar:')
                  if (confirmacao === 'LIMPAR') {
                    try {
                      const todosClientes = await supabase.getClientes()
                      const atrasados = todosClientes.filter(c => c.atrasado)
                      
                      for (const cliente of atrasados) {
                        await supabase.updateCliente(cliente.id, {
                          atrasado: false,
                          mesAtrasado: null
                        })
                      }
                      
                      await carregarDados()
                      
                      setNotificacao({
                        tipo: 'sucesso',
                        titulo: 'Atrasados Limpos!',
                        mensagem: `✅ ${atrasados.length} clientes foram limpos\n\n🎉 Sistema pronto para produção!`
                      })
                    } catch (error) {
                      setNotificacao({
                        tipo: 'erro',
                        titulo: 'Erro ao Limpar',
                        mensagem: 'Não foi possível limpar os atrasados. Tente novamente.'
                      })
                    }
                  } else if (confirmacao !== null) {
                    setNotificacao({
                      tipo: 'aviso',
                      titulo: 'Cancelado',
                      mensagem: 'Operação cancelada. Nenhum cliente foi alterado.'
                    })
                  }
                }}
                className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 font-bold"
              >
                <AlertCircle className="w-5 h-5" />
                Limpar TODOS os Atrasados
              </button>
            </div>


          </main>
        )}
      </div>

      {/* MODAIS */}
      {showModalReset && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A2F2F] rounded-xl max-w-md w-full p-6 border border-red-500/50">
            <h2 className="text-xl font-bold text-red-400 mb-4">⚠️ Confirmar Reset Mensal</h2>
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-white text-sm mb-2">Esta ação irá:</p>
              <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                <li>Marcar clientes pendentes como ATRASADOS</li>
                <li>Resetar status dos demais clientes</li>
                <li>Mover clientes para aba Pendentes</li>
              </ul>
              <p className="text-red-400 text-sm mt-3 font-bold">⚠️ Esta ação não pode ser desfeita!</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModalReset(false)} className="flex-1 px-4 py-3 border border-[#7FB069]/30 text-gray-300 rounded-lg hover:bg-[#0D3B3B]">Cancelar</button>
              <button onClick={resetarMensal} className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold">Confirmar Reset</button>
            </div>
          </div>
        </div>
      )}

      {showModalSenha && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A2F2F] rounded-xl max-w-md w-full p-6 border border-[#7FB069]/20">
            <h2 className="text-xl font-bold text-white mb-4">Acesso Restrito</h2>
            <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"><p className="text-yellow-400 text-sm flex items-center gap-2"><Lock className="w-4 h-4" />Digite a senha para acessar</p></div>
            <input type="password" value={senhaDigitada} onChange={(e) => setSenhaDigitada(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && verificarSenha()} className="w-full px-4 py-3 bg-[#0D3B3B] border border-[#7FB069]/20 rounded-lg text-white mb-4" placeholder="Senha" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => { setShowModalSenha(false); setSenhaDigitada('') }} className="flex-1 px-4 py-3 border border-[#7FB069]/30 text-gray-300 rounded-lg hover:bg-[#0D3B3B]">Cancelar</button>
              <button onClick={verificarSenha} className="flex-1 px-4 py-3 bg-[#7FB069] text-white rounded-lg hover:bg-[#6A9A56]">Entrar</button>
            </div>
          </div>
        </div>
      )}

      {showModalEnvio && clienteEnvio && (
        <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-[#0A2F2F] rounded-xl max-w-md w-full p-6 border border-[#7FB069]/20 my-8">
            <h2 className="text-xl font-bold text-white mb-4">📤 Confirmar Envio</h2>
            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-white font-bold mb-1">{clienteEnvio.nome}</p>
              <p className="text-gray-400 text-sm">Qual analista está realizando este envio?</p>
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">Analista *</label>
              <select 
                value={analistaEnvio} 
                onChange={(e) => setAnalistaEnvio(e.target.value)} 
                className="w-full px-4 py-3 bg-[#0D3B3B] border border-[#7FB069]/20 rounded-lg text-white"
                autoFocus
              >
                <option value="">Selecione...</option>
                {analistas.map(a => <option key={a.id} value={a.nome}>{a.nome}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { 
                  setShowModalEnvio(false)
                  setClienteEnvio(null)
                  setAnalistaEnvio('')
                }} 
                className="flex-1 px-4 py-3 border border-[#7FB069]/30 text-gray-300 rounded-lg hover:bg-[#0D3B3B]"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarEnvio} 
                disabled={!analistaEnvio}
                className="flex-1 px-4 py-3 bg-[#7FB069] text-white rounded-lg hover:bg-[#6A9A56] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {(() => {
        if (showModalAnalistaBackup) {
          console.log('🟩 MODAL STATE:', { showModalAnalistaBackup, temClienteBackup: !!clienteBackup })
        }
        return null
      })()}

      {showModalAnalistaBackup && clienteBackup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A2F2F] rounded-xl max-w-md w-full p-6 border border-blue-500/50 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Check className="w-6 h-6 text-blue-400" />
              Backup Realizado
            </h2>
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-white font-bold mb-1">{clienteBackup.nome}</p>
              <p className="text-gray-400 text-sm">{clienteBackup.sistema}</p>
              <p className="text-blue-400 text-sm mt-2">Qual analista fez o backup?</p>
            </div>
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Analista Responsável *
              </label>
              <select 
                value={analistaBackup} 
                onChange={(e) => setAnalistaBackup(e.target.value)} 
                className="w-full px-4 py-3 bg-[#0D3B3B] border border-blue-500/30 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                autoFocus
              >
                <option value="">Selecione o analista...</option>
                {analistas.map(a => (
                  <option key={a.id} value={a.nome}>{a.nome}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { 
                  setShowModalAnalistaBackup(false)
                  setClienteBackup(null)
                  setAnalistaBackup('')
                }} 
                className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-[#0D3B3B] transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarAnalistaBackup} 
                disabled={!analistaBackup}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                ✓ Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {showModalEmail && clienteEmail && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A2F2F] rounded-xl max-w-3xl w-full p-6 border border-[#7FB069]/50 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Check className="w-7 h-7 text-[#7FB069]" />
              Email para Envio de Arquivos Fiscais
            </h2>
            
            <div className="mb-4 p-4 bg-[#7FB069]/10 border border-[#7FB069]/30 rounded-lg">
              <p className="text-white font-bold text-lg mb-1">{clienteEmail.nome}</p>
              <p className="text-gray-400 text-sm">CNPJ: {clienteEmail.cnpj || 'Não informado'}</p>
              <p className="text-[#7FB069] text-sm mt-1">Analista: {analistaEmailNome}</p>
            </div>

            {/* ASSUNTO */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-300 font-semibold">ASSUNTO DO EMAIL <span className="text-gray-500 text-xs font-normal">(clique no texto para selecionar)</span></label>
                <button
                  onClick={() => copiarParaClipboard(gerarAssuntoEmail(clienteEmail), 'assunto')}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-1"
                >
                  <Copy className="w-4 h-4" />
                  Copiar Assunto
                </button>
              </div>
              <textarea
                value={gerarAssuntoEmail(clienteEmail)}
                readOnly
                onClick={(e) => e.currentTarget.select()}
                className="w-full px-4 py-3 bg-[#0D3B3B] border border-[#7FB069]/30 rounded-lg text-white resize-none focus:outline-none focus:border-[#7FB069] cursor-pointer"
                rows={2}
              />
            </div>

            {/* CORPO */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-300 font-semibold">CORPO DO EMAIL <span className="text-gray-500 text-xs font-normal">(clique no texto para selecionar)</span></label>
                <button
                  onClick={() => copiarParaClipboard(gerarCorpoEmail(clienteEmail, analistaEmailNome), 'corpo')}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-1"
                >
                  <Copy className="w-4 h-4" />
                  Copiar Corpo
                </button>
              </div>
              <textarea
                value={gerarCorpoEmail(clienteEmail, analistaEmailNome)}
                readOnly
                onClick={(e) => e.currentTarget.select()}
                className="w-full px-4 py-3 bg-[#0D3B3B] border border-[#7FB069]/30 rounded-lg text-white font-mono text-sm resize-none focus:outline-none focus:border-[#7FB069] cursor-pointer"
                rows={18}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModalEmail(false)
                  setClienteEmail(null)
                  setAnalistaEmailNome('')
                }}
                className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-[#0D3B3B] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={finalizarCliente}
                className="flex-1 px-4 py-3 bg-[#7FB069] text-white rounded-lg hover:bg-[#6A9A56] transition-colors font-semibold"
              >
                ✓ Finalizar e Concluir Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {showModalMotivo && clienteMotivo && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A2F2F] rounded-xl max-w-md w-full p-6 border border-orange-500/50">
            <h2 className="text-xl font-bold text-orange-400 mb-4">⚠️ Backup Crítico</h2>
            <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <p className="text-white font-bold mb-1">{clienteMotivo.nome}</p>
              <p className="text-gray-400 text-sm">Envio ENVIADO mas Backup PENDENTE. Justifique o motivo:</p>
            </div>
            <textarea value={motivoBackup} onChange={(e) => setMotivoBackup(e.target.value)} className="w-full px-4 py-3 bg-[#0D3B3B] border border-orange-500/30 rounded-lg text-white h-32 mb-4 focus:border-orange-500" placeholder="Descreva o motivo..." autoFocus />
            <div className="flex gap-3">
              <button onClick={() => { setShowModalMotivo(false); setMotivoBackup(''); setClienteMotivo(null) }} className="flex-1 px-4 py-3 border border-[#7FB069]/30 text-gray-300 rounded-lg hover:bg-[#0D3B3B]">Cancelar</button>
              <button onClick={salvarMotivoBackup} className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {showModalCliente && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A2F2F] rounded-xl max-w-md w-full p-6 border border-[#7FB069]/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Novo Cliente</h2>
              <button onClick={() => setShowModalCliente(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={adicionarCliente} className="space-y-4">
              <div><label className="block text-gray-300 text-sm font-medium mb-2">Nome *</label><input required value={novoCliente.nome} onChange={(e) => setNovoCliente(p => ({ ...p, nome: e.target.value }))} className="w-full px-4 py-3 bg-[#0D3B3B] border border-[#7FB069]/20 rounded-lg text-white" /></div>
              <div><label className="block text-gray-300 text-sm font-medium mb-2">CNPJ</label><input value={novoCliente.cnpj} onChange={(e) => setNovoCliente(p => ({ ...p, cnpj: e.target.value }))} className="w-full px-4 py-3 bg-[#0D3B3B] border border-[#7FB069]/20 rounded-lg text-white" placeholder="00.000.000/0000-00" /></div>
              <div><label className="block text-gray-300 text-sm font-medium mb-2">Sistema *</label><select required value={novoCliente.sistema} onChange={(e) => setNovoCliente(p => ({ ...p, sistema: e.target.value }))} className="w-full px-4 py-3 bg-[#0D3B3B] border border-[#7FB069]/20 rounded-lg text-white"><option value="">Selecione...</option>{sistemas.map(s => <option key={s.id}>{s.nome}</option>)}</select></div>
              <div><label className="block text-gray-300 text-sm font-medium mb-2">Email</label><input value={novoCliente.emails[0]} onChange={(e) => setNovoCliente(p => ({ ...p, emails: [e.target.value] }))} className="w-full px-4 py-3 bg-[#0D3B3B] border border-[#7FB069]/20 rounded-lg text-white" type="email" /></div>
              <div><label className="block text-gray-300 text-sm font-medium mb-2">Telefone</label><input value={novoCliente.telefone} onChange={(e) => setNovoCliente(p => ({ ...p, telefone: e.target.value }))} className="w-full px-4 py-3 bg-[#0D3B3B] border border-[#7FB069]/20 rounded-lg text-white" /></div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModalCliente(false)} className="flex-1 px-4 py-3 border border-[#7FB069]/30 text-gray-300 rounded-lg hover:bg-[#0D3B3B]">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-[#7FB069] text-white rounded-lg hover:bg-[#6A9A56]">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModalSistema && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A2F2F] rounded-xl max-w-md w-full p-6 border border-[#7FB069]/20">
            <h2 className="text-xl font-bold text-white mb-6">Novo Sistema</h2>
            <form onSubmit={adicionarSistema} className="space-y-4">
              <div><label className="block text-gray-300 text-sm mb-2">Nome do Sistema *</label><input required value={novoSistema.nome} onChange={(e) => setNovoSistema({ nome: e.target.value })} className="w-full px-4 py-3 bg-[#0D3B3B] border border-[#7FB069]/20 rounded-lg text-white" /></div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModalSistema(false)} className="flex-1 px-4 py-3 border border-[#7FB069]/30 text-gray-300 rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-[#7FB069] text-white rounded-lg hover:bg-[#6A9A56]">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModalAnalista && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A2F2F] rounded-xl max-w-md w-full p-6 border border-[#7FB069]/20">
            <h2 className="text-xl font-bold text-white mb-6">Novo Analista</h2>
            <form onSubmit={adicionarAnalista} className="space-y-4">
              <div><label className="block text-gray-300 text-sm mb-2">Nome do Analista *</label><input required value={novoAnalista.nome} onChange={(e) => setNovoAnalista({ nome: e.target.value })} className="w-full px-4 py-3 bg-[#0D3B3B] border border-[#7FB069]/20 rounded-lg text-white" /></div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModalAnalista(false)} className="flex-1 px-4 py-3 border border-[#7FB069]/30 text-gray-300 rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-[#7FB069] text-white rounded-lg hover:bg-[#6A9A56]">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALHES DO CLIENTE */}
      {showModalDetalhes && clienteDetalhes && (
        <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-[#0A2F2F] rounded-xl max-w-2xl w-full p-6 border border-[#7FB069]/20 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Eye className="w-6 h-6 text-[#7FB069]" />
                Detalhes do Cliente
              </h2>
              <button onClick={() => { setShowModalDetalhes(false); setClienteDetalhes(null) }} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nome e Status */}
              <div className="bg-[#0D3B3B] p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">{clienteDetalhes.nome}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {clienteDetalhes.urgente && (
                        <span className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          <Zap className="w-4 h-4" />URGENTE
                        </span>
                      )}
                      {clienteDetalhes.atrasado && (
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">ATRASADO</span>
                      )}
                      {!clienteDetalhes.ativo && (
                        <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-bold">INATIVO</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0D3B3B] p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Sistema</p>
                  <p className="text-[#7FB069] text-lg font-bold">{clienteDetalhes.sistema}</p>
                </div>
                
                {clienteDetalhes.cnpj && (
                  <div className="bg-[#0D3B3B] p-4 rounded-lg">
                    <p className="text-gray-400 text-sm mb-1">CNPJ</p>
                    <p className="text-white text-lg font-medium">{clienteDetalhes.cnpj}</p>
                  </div>
                )}
                
                {clienteDetalhes.analista && (
                  <div className="bg-[#0D3B3B] p-4 rounded-lg">
                    <p className="text-gray-400 text-sm mb-1">Analista Responsável</p>
                    <p className="text-white text-lg font-medium">{clienteDetalhes.analista}</p>
                  </div>
                )}
              </div>

              {/* Contatos */}
              <div className="bg-[#0D3B3B] p-4 rounded-lg">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  📞 Contatos
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-[#0A2F2F] rounded-lg">
                    <p className="text-gray-400 text-xs mb-2 font-semibold">EMAIL(S)</p>
                    {clienteDetalhes.emails && clienteDetalhes.emails.filter(e => e && e.trim()).length > 0 ? (
                      <div className="space-y-1">
                        {clienteDetalhes.emails.filter(e => e && e.trim()).map((email, i) => (
                          <p key={i} className="text-[#7FB069] font-medium">{email}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic text-sm">Nenhum email cadastrado</p>
                    )}
                    
                    {/* Botão para adicionar email rapidamente */}
                    <button
                      onClick={() => {
                        const novoEmail = prompt('Digite o email para adicionar:')
                        if (novoEmail && novoEmail.trim()) {
                          const emailsAtuais = clienteDetalhes.emails || []
                          const novosEmails = [...emailsAtuais, novoEmail.trim()]
                          
                          supabase.updateCliente(clienteDetalhes.id, { emails: novosEmails })
                            .then(() => {
                              setNotificacao({
                                tipo: 'sucesso',
                                titulo: 'Email Adicionado!',
                                mensagem: `Email "${novoEmail}" adicionado com sucesso.`
                              })
                              carregarDados()
                              setShowModalDetalhes(false)
                            })
                            .catch(() => {
                              setNotificacao({
                                tipo: 'erro',
                                titulo: 'Erro ao Adicionar',
                                mensagem: 'Não foi possível adicionar o email.'
                              })
                            })
                        }
                      }}
                      className="mt-3 w-full px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 rounded-lg text-sm font-medium transition-all"
                    >
                      + Adicionar Email
                    </button>
                  </div>
                  <div className="p-3 bg-[#0A2F2F] rounded-lg">
                    <p className="text-gray-400 text-xs mb-2 font-semibold">TELEFONE</p>
                    {clienteDetalhes.telefone && clienteDetalhes.telefone.trim() ? (
                      <p className="text-white font-medium">{clienteDetalhes.telefone}</p>
                    ) : (
                      <p className="text-gray-500 italic text-sm">Nenhum telefone cadastrado</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status de Envio e Backup */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0D3B3B] p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">Status de Envio</p>
                  <span className={`inline-block px-3 py-1.5 rounded-lg font-bold ${clienteDetalhes.statusEnvio === 'Enviado' ? 'bg-green-500/20 text-green-400 border border-green-500' : 'bg-gray-500/20 text-gray-300 border border-gray-500'}`}>
                    {clienteDetalhes.statusEnvio}
                  </span>
                </div>
                <div className="bg-[#0D3B3B] p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">Status de Backup</p>
                  <span className={`inline-block px-3 py-1.5 rounded-lg font-bold ${clienteDetalhes.statusBackup === 'Feito' ? 'bg-green-500/20 text-green-400 border border-green-500' : 'bg-gray-500/20 text-gray-300 border border-gray-500'}`}>
                    {clienteDetalhes.statusBackup}
                  </span>
                </div>
              </div>

              {/* Justificativa */}
              {clienteDetalhes.motivoSemBackup && (
                <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-lg">
                  <p className="text-orange-400 font-bold text-sm mb-2">📝 Justificativa de Backup Pendente</p>
                  <p className="text-white italic">"{clienteDetalhes.motivoSemBackup}"</p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <button 
                onClick={() => { setShowModalDetalhes(false); setClienteDetalhes(null) }}
                className="w-full px-4 py-3 bg-[#7FB069] text-white rounded-lg hover:bg-[#6A9A56] font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* NOTIFICAÇÃO PROFISSIONAL */}
      {notificacao && (
        <Notificacao
          tipo={notificacao.tipo}
          titulo={notificacao.titulo}
          mensagem={notificacao.mensagem}
          onFechar={() => setNotificacao(null)}
        />
      )}

      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
      {confirmacaoExclusao && (
        <ConfirmacaoExclusao
          titulo={confirmacaoExclusao.tipo === 'sistema' ? 'Excluir Sistema?' : 'Excluir Analista?'}
          mensagem={confirmacaoExclusao.tipo === 'sistema' 
            ? 'Tem certeza que deseja excluir este sistema?' 
            : 'Tem certeza que deseja excluir este analista?'}
          itemNome={confirmacaoExclusao.item.nome}
          onConfirmar={confirmarExclusao}
          onCancelar={() => setConfirmacaoExclusao(null)}
        />
      )}
    </div>
  )
}