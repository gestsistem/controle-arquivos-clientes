import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors())
app.use('*', logger(console.log))

// Estrutura de dados do cliente
interface Cliente {
  id: string
  nome: string
  sistema: string
  emails: string[] // Múltiplos emails
  emailPrimario: string
  telefone: string
  statusEnvio: 'Enviado' | 'Pendente' | 'Recém Implantado' | 'Gerencial' | 'Inativo' | 'Não Teve Vendas' | 'Bloqueio SEFAZ' | 'Bloqueio Financeiro'
  statusBackup: 'Feito' | 'Pendente'
  analista: string
  dataAtualizacao: string
  dataConclusaoEnvio?: string // Data quando status envio foi marcado como "Enviado"
  dataConclusaoBackup?: string // Data quando backup foi marcado como "Feito"
  concluido: boolean
  prioritario: boolean
  ativo: boolean
  atencao: boolean // Necessita de atenção
  atrasado: boolean // Atraso de envio
  motivoSemBackup?: string // Motivo quando envio concluído sem backup
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

interface HistoricoReset {
  id: string
  mesAno: string
  dataReset: string
  totalClientes: number
  clientesSnapshot: Cliente[]
}

interface ResetInfo {
  ultimoReset: string
}

// Obter todos os analistas
app.get('/make-server-c70d4af9/analistas', async (c) => {
  try {
    const analistas = await kv.getByPrefix('analista:')
    console.log('Analistas recuperados:', analistas.length)
    return c.json({ analistas: analistas || [] })
  } catch (error) {
    console.error('Erro ao buscar analistas:', error)
    return c.json({ error: 'Erro ao buscar analistas', details: String(error) }, 500)
  }
})

// Adicionar novo analista
app.post('/make-server-c70d4af9/analistas', async (c) => {
  try {
    const body = await c.req.json()
    const { nome } = body

    if (!nome) {
      return c.json({ error: 'Nome do analista é obrigatório' }, 400)
    }

    const id = `analista:${Date.now()}`
    const novoAnalista: Analista = {
      id,
      nome,
      dataCriacao: new Date().toISOString()
    }

    await kv.set(id, novoAnalista)
    console.log('Analista adicionado:', novoAnalista)
    return c.json({ analista: novoAnalista }, 201)
  } catch (error) {
    console.error('Erro ao adicionar analista:', error)
    return c.json({ error: 'Erro ao adicionar analista', details: String(error) }, 500)
  }
})

// Deletar analista
app.delete('/make-server-c70d4af9/analistas/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await kv.del(id)
    console.log('Analista deletado:', id)
    return c.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar analista:', error)
    return c.json({ error: 'Erro ao deletar analista', details: String(error) }, 500)
  }
})

// Obter todos os clientes
app.get('/make-server-c70d4af9/clientes', async (c) => {
  try {
    const clientes = await kv.getByPrefix('cliente:')
    console.log('Clientes recuperados:', clientes.length)
    return c.json({ clientes: clientes || [] })
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    return c.json({ error: 'Erro ao buscar clientes', details: String(error) }, 500)
  }
})

// Adicionar novo cliente
app.post('/make-server-c70d4af9/clientes', async (c) => {
  try {
    const body = await c.req.json()
    const { nome, sistema, email, telefone } = body

    if (!nome || !sistema || !email || !telefone) {
      return c.json({ error: 'Nome, sistema, email e telefone são obrigatórios' }, 400)
    }

    const id = `cliente:${Date.now()}`
    const novoCliente: Cliente = {
      id,
      nome,
      sistema,
      emails: [email],
      emailPrimario: email,
      telefone,
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

    await kv.set(id, novoCliente)
    console.log('Cliente adicionado:', novoCliente)
    return c.json({ cliente: novoCliente }, 201)
  } catch (error) {
    console.error('Erro ao adicionar cliente:', error)
    return c.json({ error: 'Erro ao adicionar cliente', details: String(error) }, 500)
  }
})

// Atualizar status do cliente
app.put('/make-server-c70d4af9/clientes/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()

    const clienteExistente = await kv.get(id) as Cliente
    if (!clienteExistente) {
      return c.json({ error: 'Cliente não encontrado' }, 404)
    }

    const dataAtual = new Date().toISOString()

    // Atualizar TODOS os campos que vierem no body
    const clienteAtualizado: Cliente = {
      ...clienteExistente,
      ...body,
      id: clienteExistente.id, // Preservar ID
      dataAtualizacao: dataAtual
    }

    // Registrar data de conclusão do envio
    if (body.statusEnvio === 'Enviado' && clienteExistente.statusEnvio !== 'Enviado') {
      clienteAtualizado.dataConclusaoEnvio = dataAtual
    }

    // Registrar data de conclusão do backup
    if (body.statusBackup === 'Feito' && clienteExistente.statusBackup !== 'Feito') {
      clienteAtualizado.dataConclusaoBackup = dataAtual
    }

    // Verificar se está concluído (ambos os status completos)
    clienteAtualizado.concluido = 
      clienteAtualizado.statusEnvio === 'Enviado' && 
      clienteAtualizado.statusBackup === 'Feito'

    // Verificar se necessita atenção (envio concluído mas backup pendente)
    clienteAtualizado.atencao = 
      clienteAtualizado.statusEnvio === 'Enviado' && 
      clienteAtualizado.statusBackup === 'Pendente'

    await kv.set(id, clienteAtualizado)
    console.log('Cliente atualizado:', clienteAtualizado)
    return c.json({ cliente: clienteAtualizado })
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    return c.json({ error: 'Erro ao atualizar cliente', details: String(error) }, 500)
  }
})

// Deletar cliente (mantido apenas para analistas)
app.delete('/make-server-c70d4af9/clientes/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await kv.del(id)
    console.log('Cliente deletado:', id)
    return c.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar cliente:', error)
    return c.json({ error: 'Erro ao deletar cliente', details: String(error) }, 500)
  }
})

// Reset mensal - zera todos os status para Pendente
app.post('/make-server-c70d4af9/reset-mensal', async (c) => {
  try {
    const clientes = await kv.getByPrefix('cliente:') as Cliente[]
    const dataAtual = new Date().toISOString()
    const mesAno = new Date().toISOString().slice(0, 7) // YYYY-MM

    // Salvar snapshot do estado atual antes do reset
    const historicoId = `historico:${mesAno}`
    const historico: HistoricoReset = {
      id: historicoId,
      mesAno,
      dataReset: dataAtual,
      totalClientes: clientes.length,
      clientesSnapshot: clientes
    }
    await kv.set(historicoId, historico)

    // Atualizar todos os clientes
    const updates = clientes.map(cliente => {
      // Marcar como atrasado se estiver ativo e com envio pendente
      const atrasado = cliente.ativo && cliente.statusEnvio === 'Pendente'
      
      const clienteAtualizado: Cliente = {
        ...cliente,
        statusEnvio: 'Pendente',
        statusBackup: 'Pendente',
        analista: '',
        concluido: false,
        atencao: false,
        atrasado: atrasado, // Marca como atrasado se estava pendente
        dataAtualizacao: dataAtual,
        // PRESERVA as datas de conclusão para relatórios
        dataConclusaoEnvio: cliente.dataConclusaoEnvio,
        dataConclusaoBackup: cliente.dataConclusaoBackup
      }
      return kv.set(cliente.id, clienteAtualizado)
    })

    await Promise.all(updates)

    // Salvar informação do último reset
    await kv.set('reset:info', { ultimoReset: mesAno })

    console.log('Reset mensal executado:', clientes.length, 'clientes atualizados')
    return c.json({ success: true, clientesAtualizados: clientes.length, mesAno })
  } catch (error) {
    console.error('Erro ao executar reset mensal:', error)
    return c.json({ error: 'Erro ao executar reset mensal', details: String(error) }, 500)
  }
})

// Obter informações do último reset
app.get('/make-server-c70d4af9/ultimo-reset', async (c) => {
  try {
    const info = await kv.get('reset:info') as ResetInfo | null
    return c.json({ ultimoReset: info?.ultimoReset || null })
  } catch (error) {
    console.error('Erro ao buscar informações de reset:', error)
    return c.json({ error: 'Erro ao buscar informações de reset', details: String(error) }, 500)
  }
})

// Obter histórico de resets
app.get('/make-server-c70d4af9/historico-resets', async (c) => {
  try {
    const historicos = await kv.getByPrefix('historico:') as HistoricoReset[]
    console.log('Históricos recuperados:', historicos.length)
    // Ordenar por data decrescente
    historicos.sort((a, b) => b.mesAno.localeCompare(a.mesAno))
    return c.json({ historicos: historicos || [] })
  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    return c.json({ error: 'Erro ao buscar histórico', details: String(error) }, 500)
  }
})

// ===== SISTEMAS =====

// Obter todos os sistemas
app.get('/make-server-c70d4af9/sistemas', async (c) => {
  try {
    const sistemas = await kv.getByPrefix('sistema:')
    console.log('Sistemas recuperados:', sistemas.length)
    return c.json({ sistemas: sistemas || [] })
  } catch (error) {
    console.error('Erro ao buscar sistemas:', error)
    return c.json({ error: 'Erro ao buscar sistemas', details: String(error) }, 500)
  }
})

// Adicionar novo sistema
app.post('/make-server-c70d4af9/sistemas', async (c) => {
  try {
    const body = await c.req.json()
    const { nome } = body

    if (!nome) {
      return c.json({ error: 'Nome do sistema é obrigatório' }, 400)
    }

    const id = `sistema:${Date.now()}`
    const novoSistema: Sistema = {
      id,
      nome,
      dataCriacao: new Date().toISOString()
    }

    await kv.set(id, novoSistema)
    console.log('Sistema adicionado:', novoSistema)
    return c.json({ sistema: novoSistema }, 201)
  } catch (error) {
    console.error('Erro ao adicionar sistema:', error)
    return c.json({ error: 'Erro ao adicionar sistema', details: String(error) }, 500)
  }
})

// Deletar sistema
app.delete('/make-server-c70d4af9/sistemas/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await kv.del(id)
    console.log('Sistema deletado:', id)
    return c.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar sistema:', error)
    return c.json({ error: 'Erro ao deletar sistema', details: String(error) }, 500)
  }
})

// ===== MOTIVOS DE BACKUP =====

// Obter todos os motivos
app.get('/make-server-c70d4af9/motivos-backup', async (c) => {
  try {
    const motivos = await kv.getByPrefix('motivo:')
    console.log('Motivos recuperados:', motivos.length)
    return c.json({ motivos: motivos || [] })
  } catch (error) {
    console.error('Erro ao buscar motivos:', error)
    return c.json({ error: 'Erro ao buscar motivos', details: String(error) }, 500)
  }
})

// Adicionar motivo de backup
app.post('/make-server-c70d4af9/motivos-backup', async (c) => {
  try {
    const body = await c.req.json()
    const { clienteId, clienteNome, analista, motivo } = body

    if (!clienteId || !clienteNome || !analista || !motivo) {
      return c.json({ error: 'Todos os campos são obrigatórios' }, 400)
    }

    const id = `motivo:${Date.now()}`
    const novoMotivo: MotivoBackup = {
      id,
      clienteId,
      clienteNome,
      analista,
      motivo,
      data: new Date().toISOString()
    }

    await kv.set(id, novoMotivo)
    console.log('Motivo adicionado:', novoMotivo)
    return c.json({ motivo: novoMotivo }, 201)
  } catch (error) {
    console.error('Erro ao adicionar motivo:', error)
    return c.json({ error: 'Erro ao adicionar motivo', details: String(error) }, 500)
  }
})

Deno.serve(app.fetch)