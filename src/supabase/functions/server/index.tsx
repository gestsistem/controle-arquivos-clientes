import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import * as kv from './kv_store.tsx'

const app = new Hono()

// CORS e Logger
app.use('*', cors())
app.use('*', logger(console.log))

// ==================== INTERFACES ====================

interface Cliente {
  id: string
  nome: string
  sistema: string
  emails: string[]
  emailPrimario: string
  telefone: string
  statusEnvio: 'Enviado' | 'Pendente' | 'Recém Implantado' | 'Gerencial' | 'Inativo' | 'Não Teve Vendas' | 'Bloqueio SEFAZ' | 'Bloqueio Financeiro'
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

interface HistoricoReset {
  id: string
  mesAno: string
  dataReset: string
  totalClientes: number
  clientesSnapshot: Cliente[]
}

// ==================== HELPERS ====================

const calcularStatusCliente = (cliente: Cliente): Cliente => {
  return {
    ...cliente,
    concluido: cliente.statusEnvio === 'Enviado' && cliente.statusBackup === 'Feito',
    atencao: cliente.statusEnvio === 'Enviado' && cliente.statusBackup === 'Pendente'
  }
}

// ==================== ANALISTAS ====================

app.get('/make-server-c70d4af9/analistas', async (c) => {
  try {
    const analistas = await kv.getByPrefix('analista:')
    return c.json({ analistas: analistas || [] })
  } catch (error) {
    console.error('Erro ao buscar analistas:', error)
    return c.json({ error: 'Erro ao buscar analistas' }, 500)
  }
})

app.post('/make-server-c70d4af9/analistas', async (c) => {
  try {
    const { nome } = await c.req.json()
    
    if (!nome || !nome.trim()) {
      return c.json({ error: 'Nome do analista é obrigatório' }, 400)
    }

    const id = `analista:${Date.now()}`
    const novoAnalista: Analista = {
      id,
      nome: nome.trim(),
      dataCriacao: new Date().toISOString()
    }

    await kv.set(id, novoAnalista)
    return c.json({ analista: novoAnalista }, 201)
  } catch (error) {
    console.error('Erro ao adicionar analista:', error)
    return c.json({ error: 'Erro ao adicionar analista' }, 500)
  }
})

app.delete('/make-server-c70d4af9/analistas/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await kv.del(id)
    return c.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar analista:', error)
    return c.json({ error: 'Erro ao deletar analista' }, 500)
  }
})

// ==================== SISTEMAS ====================

app.get('/make-server-c70d4af9/sistemas', async (c) => {
  try {
    const sistemas = await kv.getByPrefix('sistema:')
    return c.json({ sistemas: sistemas || [] })
  } catch (error) {
    console.error('Erro ao buscar sistemas:', error)
    return c.json({ error: 'Erro ao buscar sistemas' }, 500)
  }
})

app.post('/make-server-c70d4af9/sistemas', async (c) => {
  try {
    const { nome } = await c.req.json()
    
    if (!nome || !nome.trim()) {
      return c.json({ error: 'Nome do sistema é obrigatório' }, 400)
    }

    const id = `sistema:${Date.now()}`
    const novoSistema: Sistema = {
      id,
      nome: nome.trim(),
      dataCriacao: new Date().toISOString()
    }

    await kv.set(id, novoSistema)
    return c.json({ sistema: novoSistema }, 201)
  } catch (error) {
    console.error('Erro ao adicionar sistema:', error)
    return c.json({ error: 'Erro ao adicionar sistema' }, 500)
  }
})

app.delete('/make-server-c70d4af9/sistemas/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await kv.del(id)
    return c.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar sistema:', error)
    return c.json({ error: 'Erro ao deletar sistema' }, 500)
  }
})

// ==================== CLIENTES ====================

app.get('/make-server-c70d4af9/clientes', async (c) => {
  try {
    const clientes = await kv.getByPrefix('cliente:')
    return c.json({ clientes: clientes || [] })
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    return c.json({ error: 'Erro ao buscar clientes' }, 500)
  }
})

app.post('/make-server-c70d4af9/clientes', async (c) => {
  try {
    const body = await c.req.json()
    const { nome, sistema, email, telefone } = body

    if (!nome || !nome.trim() || !sistema || !sistema.trim()) {
      return c.json({ error: 'Nome e sistema são obrigatórios' }, 400)
    }

    const id = `cliente:${Date.now()}`
    const emailsArray = email && email.trim() ? [email.trim()] : []
    
    const novoCliente: Cliente = {
      id,
      nome: nome.trim(),
      sistema: sistema.trim(),
      emails: emailsArray,
      emailPrimario: emailsArray[0] || '',
      telefone: telefone || '',
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
    return c.json({ cliente: novoCliente }, 201)
  } catch (error) {
    console.error('Erro ao adicionar cliente:', error)
    return c.json({ error: 'Erro ao adicionar cliente' }, 500)
  }
})

app.put('/make-server-c70d4af9/clientes/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()

    const clienteExistente = await kv.get(id) as Cliente
    if (!clienteExistente) {
      return c.json({ error: 'Cliente não encontrado' }, 404)
    }

    const dataAtual = new Date().toISOString()
    
    // Merge dos dados
    let clienteAtualizado: Cliente = {
      ...clienteExistente,
      ...body,
      id: clienteExistente.id,
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

    // Calcular status automáticos
    clienteAtualizado = calcularStatusCliente(clienteAtualizado)

    await kv.set(id, clienteAtualizado)
    return c.json({ cliente: clienteAtualizado })
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    return c.json({ error: 'Erro ao atualizar cliente' }, 500)
  }
})

app.delete('/make-server-c70d4af9/clientes/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await kv.del(id)
    return c.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar cliente:', error)
    return c.json({ error: 'Erro ao deletar cliente' }, 500)
  }
})

// ==================== MOTIVOS BACKUP ====================

app.get('/make-server-c70d4af9/motivos-backup', async (c) => {
  try {
    const motivos = await kv.getByPrefix('motivo:')
    return c.json({ motivos: motivos || [] })
  } catch (error) {
    console.error('Erro ao buscar motivos:', error)
    return c.json({ error: 'Erro ao buscar motivos' }, 500)
  }
})

app.post('/make-server-c70d4af9/motivos-backup', async (c) => {
  try {
    const { clienteId, clienteNome, analista, motivo } = await c.req.json()

    if (!clienteId || !clienteNome || !motivo) {
      return c.json({ error: 'Campos obrigatórios faltando' }, 400)
    }

    const id = `motivo:${Date.now()}`
    const novoMotivo: MotivoBackup = {
      id,
      clienteId,
      clienteNome,
      analista: analista || 'Não informado',
      motivo,
      data: new Date().toISOString()
    }

    await kv.set(id, novoMotivo)
    return c.json({ motivo: novoMotivo }, 201)
  } catch (error) {
    console.error('Erro ao adicionar motivo:', error)
    return c.json({ error: 'Erro ao adicionar motivo' }, 500)
  }
})

// ==================== RESET MENSAL ====================

app.post('/make-server-c70d4af9/reset-mensal', async (c) => {
  try {
    const clientes = await kv.getByPrefix('cliente:') as Cliente[]
    const dataAtual = new Date().toISOString()
    const mesAno = new Date().toISOString().slice(0, 7)

    // Salvar histórico
    const historicoId = `historico:${mesAno}`
    const historico: HistoricoReset = {
      id: historicoId,
      mesAno,
      dataReset: dataAtual,
      totalClientes: clientes.length,
      clientesSnapshot: clientes
    }
    await kv.set(historicoId, historico)

    // Resetar clientes
    const updates = clientes.map(cliente => {
      const atrasado = cliente.ativo && cliente.statusEnvio === 'Pendente'
      
      const clienteAtualizado: Cliente = {
        ...cliente,
        statusEnvio: 'Pendente',
        statusBackup: 'Pendente',
        analista: '',
        concluido: false,
        atencao: false,
        atrasado: atrasado,
        dataAtualizacao: dataAtual,
        dataConclusaoEnvio: cliente.dataConclusaoEnvio,
        dataConclusaoBackup: cliente.dataConclusaoBackup
      }
      return kv.set(cliente.id, clienteAtualizado)
    })

    await Promise.all(updates)
    await kv.set('reset:info', { ultimoReset: mesAno })

    return c.json({ success: true, clientesAtualizados: clientes.length, mesAno })
  } catch (error) {
    console.error('Erro ao executar reset mensal:', error)
    return c.json({ error: 'Erro ao executar reset mensal' }, 500)
  }
})

app.get('/make-server-c70d4af9/ultimo-reset', async (c) => {
  try {
    const info = await kv.get('reset:info') as { ultimoReset: string } | null
    return c.json({ ultimoReset: info?.ultimoReset || null })
  } catch (error) {
    console.error('Erro ao buscar último reset:', error)
    return c.json({ error: 'Erro ao buscar último reset' }, 500)
  }
})

app.get('/make-server-c70d4af9/historico-resets', async (c) => {
  try {
    const historicos = await kv.getByPrefix('historico:') as HistoricoReset[]
    historicos.sort((a, b) => b.mesAno.localeCompare(a.mesAno))
    return c.json({ historicos: historicos || [] })
  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    return c.json({ error: 'Erro ao buscar histórico' }, 500)
  }
})

// ==================== HEALTH CHECK ====================

app.get('/make-server-c70d4af9/health', async (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'CONTROL GESTÃO SISTEMAS'
  })
})

// ==================== SERVIDOR ====================

Deno.serve(app.fetch)
