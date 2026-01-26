// Cliente Supabase - Comunicação direta com banco de dados
import { projectId, publicAnonKey } from './supabase/info'

const SUPABASE_URL = `https://${projectId}.supabase.co`
const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`

// Headers padrão para todas as requisições
const getHeaders = () => ({
  'apikey': publicAnonKey,
  'Authorization': `Bearer ${publicAnonKey}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
})

// ==================== CONVERSÃO CAMELCASE <-> SNAKE_CASE ====================

// Converter camelCase para snake_case
function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(toSnakeCase)
  if (typeof obj !== 'object') return obj

  const snakeObj: any = {}
  for (const key in obj) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    snakeObj[snakeKey] = toSnakeCase(obj[key])
  }
  return snakeObj
}

// Converter snake_case para camelCase
function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj
  
  // Arrays de primitivos (strings, números) devem ser retornados como estão
  if (Array.isArray(obj)) {
    // Se é array de primitivos, retornar direto
    if (obj.length === 0 || typeof obj[0] !== 'object') {
      return obj
    }
    // Se é array de objetos, converter cada objeto
    return obj.map(toCamelCase)
  }
  
  if (typeof obj !== 'object') return obj

  const camelObj: any = {}
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    
    // Preservar arrays de strings (como emails) sem conversão
    if (Array.isArray(obj[key]) && obj[key].length > 0 && typeof obj[key][0] === 'string') {
      camelObj[camelKey] = obj[key]
    } else {
      camelObj[camelKey] = toCamelCase(obj[key])
    }
  }
  return camelObj
}

// Função auxiliar para fazer requisições
async function fetchSupabase(endpoint: string, options: RequestInit = {}) {
  const url = `${SUPABASE_REST_URL}/${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    
    // Não logar erros de tabelas opcionais (configuracoes)
    const isSilentError = endpoint.includes('configuracoes')
    
    if (!isSilentError) {
      console.error('Erro Supabase:', errorText)
    }
    
    throw new Error(`Erro ${response.status}: ${errorText}`)
  }

  // Se não há conteúdo, retornar array vazio
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return []
  }

  return response.json()
}

// ==================== KV STORE ====================

export async function getKvStore(key: string) {
  try {
    const data = await fetchSupabase(`kv_store?key=eq.${key}`)
    return data || []
  } catch (error) {
    console.error('Erro ao buscar kv_store:', error)
    return []
  }
}

// ==================== CLIENTES ====================

export async function getClientes() {
  try {
    const data = await fetchSupabase('clientes?select=*&order=nome.asc')
    
    // DEBUG: Ver dados RAW do banco
    if (data[0]) {
      console.log('🟦 RAW do banco:', { nome: data[0].nome, analista_backup: data[0].analista_backup })
    }
    
    const converted = toCamelCase(data)
    
    // DEBUG: Ver depois da conversão
    if (converted[0]) {
      console.log('🟩 CONVERTIDO:', { nome: converted[0].nome, analistaBackup: converted[0].analistaBackup })
    }
    
    return converted
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    return []
  }
}

export async function addCliente(cliente: any) {
  try {
    // Converter emails (array) para email (string JSON)
    const clienteParaSalvar = { ...cliente }
    if (clienteParaSalvar.emails && Array.isArray(clienteParaSalvar.emails)) {
      clienteParaSalvar.email = JSON.stringify(clienteParaSalvar.emails)
      delete clienteParaSalvar.emails
    }
    
    const [data] = await fetchSupabase('clientes', {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(clienteParaSalvar))
    })
    return toCamelCase(data)
  } catch (error) {
    console.error('Erro ao adicionar cliente:', error)
    throw error
  }
}

export async function updateCliente(id: string, updates: any) {
  try {
    // Converter emails (array) para email (string JSON)
    const updatesParaSalvar = { ...updates }
    if (updatesParaSalvar.emails && Array.isArray(updatesParaSalvar.emails)) {
      updatesParaSalvar.email = JSON.stringify(updatesParaSalvar.emails)
      delete updatesParaSalvar.emails
    }
    
    const [data] = await fetchSupabase(`clientes?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(toSnakeCase(updatesParaSalvar))
    })
    return toCamelCase(data)
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    throw error
  }
}

export async function deleteCliente(id: string) {
  try {
    await fetchSupabase(`clientes?id=eq.${id}`, {
      method: 'DELETE'
    })
  } catch (error) {
    console.error('Erro ao deletar cliente:', error)
    throw error
  }
}

// ==================== ANALISTAS ====================

export async function getAnalistas() {
  try {
    const data = await fetchSupabase('analistas?select=*&order=nome.asc')
    return data
  } catch (error) {
    console.error('Erro ao buscar analistas:', error)
    return []
  }
}

export async function addAnalista(analista: any) {
  try {
    const [data] = await fetchSupabase('analistas', {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(analista))
    })
    return data
  } catch (error) {
    console.error('Erro ao adicionar analista:', error)
    throw error
  }
}

export async function deleteAnalista(id: string) {
  try {
    await fetchSupabase(`analistas?id=eq.${id}`, {
      method: 'DELETE'
    })
  } catch (error) {
    console.error('Erro ao deletar analista:', error)
    throw error
  }
}

// ==================== SISTEMAS ====================

export async function getSistemas() {
  try {
    const data = await fetchSupabase('sistemas?select=*&order=nome.asc')
    return data
  } catch (error) {
    console.error('Erro ao buscar sistemas:', error)
    return []
  }
}

export async function addSistema(sistema: any) {
  try {
    const [data] = await fetchSupabase('sistemas', {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(sistema))
    })
    return data
  } catch (error) {
    console.error('Erro ao adicionar sistema:', error)
    throw error
  }
}

export async function deleteSistema(id: string) {
  try {
    await fetchSupabase(`sistemas?id=eq.${id}`, {
      method: 'DELETE'
    })
  } catch (error) {
    console.error('Erro ao deletar sistema:', error)
    throw error
  }
}

// ==================== MOTIVOS DE BACKUP ====================

export async function getMotivos() {
  try {
    // Buscar sem ordenação (evita erro de coluna inexistente)
    const data = await fetchSupabase('motivos_backup?select=*')
    return data || []
  } catch (error) {
    console.error('Erro ao buscar motivos:', error)
    return []
  }
}

export async function addMotivo(motivo: any) {
  try {
    const [data] = await fetchSupabase('motivos_backup', {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(motivo))
    })
    return data
  } catch (error) {
    console.error('Erro ao adicionar motivo:', error)
    throw error
  }
}

// ==================== HISTÓRICO DE RESET ====================

export async function getHistorico() {
  try {
    // Buscar sem ordenação (evita erro de coluna inexistente)
    const data = await fetchSupabase('historico_reset?select=*')
    return data || []
  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    return []
  }
}

export async function addHistorico(item: any) {
  try {
    const [data] = await fetchSupabase('historico_reset', {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(item))
    })
    return data
  } catch (error) {
    console.error('Erro ao adicionar histórico:', error)
    throw error
  }
}

// ==================== CONFIGURAÇÕES ====================

export async function getUltimoReset(): Promise<string | null> {
  try {
    const data = await fetchSupabase('configuracoes?chave=eq.ultimo_reset')
    if (data && data.length > 0) {
      return data[0].valor
    }
    return null
  } catch (error) {
    // Se a tabela não existir, retornar null silenciosamente (sem console.warn)
    return null
  }
}

export async function setUltimoReset(mesAno: string) {
  try {
    // Primeiro, tentar atualizar
    const existing = await fetchSupabase('configuracoes?chave=eq.ultimo_reset')
    
    if (existing && existing.length > 0) {
      // Atualizar registro existente
      await fetchSupabase('configuracoes?chave=eq.ultimo_reset', {
        method: 'PATCH',
        body: JSON.stringify({ valor: mesAno })
      })
    } else {
      // Criar novo registro
      await fetchSupabase('configuracoes', {
        method: 'POST',
        body: JSON.stringify({
          id: `config:${Date.now()}`,
          chave: 'ultimo_reset',
          valor: mesAno
        })
      })
    }
  } catch (error) {
    // Falha silenciosa - a tabela configuracoes é opcional
    return
  }
}

// ==================== UTILITÁRIOS ====================

// Testar conexão com Supabase
export async function testarConexao() {
  try {
    console.log('🔍 Testando conexão com Supabase...')
    console.log('📍 URL:', SUPABASE_URL)
    console.log('🔑 API Key configurada:', publicAnonKey ? 'Sim ✅' : 'Não ❌')
    
    // Tentar buscar tabelas
    const [clientes, analistas, sistemas] = await Promise.all([
      getClientes(),
      getAnalistas(),
      getSistemas()
    ])
    
    console.log('✅ Conexão bem-sucedida!')
    console.log('📊 Dados encontrados:', {
      clientes: clientes.length,
      analistas: analistas.length,
      sistemas: sistemas.length
    })
    
    return {
      sucesso: true,
      dados: { clientes: clientes.length, analistas: analistas.length, sistemas: sistemas.length }
    }
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error)
    return {
      sucesso: false,
      erro: (error as Error).message
    }
  }
}

// Limpar todas as tabelas (para testes)
export async function limparTudo() {
  try {
    await Promise.all([
      fetchSupabase('clientes', { method: 'DELETE', headers: { 'Prefer': 'return=minimal' } }),
      fetchSupabase('analistas', { method: 'DELETE', headers: { 'Prefer': 'return=minimal' } }),
      fetchSupabase('sistemas', { method: 'DELETE', headers: { 'Prefer': 'return=minimal' } }),
      fetchSupabase('motivos_backup', { method: 'DELETE', headers: { 'Prefer': 'return=minimal' } }),
      fetchSupabase('historico_reset', { method: 'DELETE', headers: { 'Prefer': 'return=minimal' } }),
      fetchSupabase('configuracoes', { method: 'DELETE', headers: { 'Prefer': 'return=minimal' } })
    ])
    console.log('✅ Todas as tabelas foram limpas')
  } catch (error) {
    console.error('Erro ao limpar tabelas:', error)
    throw error
  }
}

// Exportar todos os dados
export async function exportarTudo() {
  try {
    const [clientes, analistas, sistemas, motivos, historico, ultimoReset] = await Promise.all([
      getClientes(),
      getAnalistas(),
      getSistemas(),
      getMotivos(),
      getHistorico(),
      getUltimoReset()
    ])

    return {
      clientes,
      analistas,
      sistemas,
      motivos,
      historico,
      ultimoReset
    }
  } catch (error) {
    console.error('Erro ao exportar dados:', error)
    throw error
  }
}

// Importar dados (para migração)
export async function importarTudo(data: any) {
  try {
    // Importar em ordem para evitar problemas de referência
    if (data.analistas && data.analistas.length > 0) {
      for (const analista of data.analistas) {
        await addAnalista(analista)
      }
    }

    if (data.sistemas && data.sistemas.length > 0) {
      for (const sistema of data.sistemas) {
        await addSistema(sistema)
      }
    }

    if (data.clientes && data.clientes.length > 0) {
      for (const cliente of data.clientes) {
        await addCliente(cliente)
      }
    }

    if (data.motivos && data.motivos.length > 0) {
      for (const motivo of data.motivos) {
        await addMotivo(motivo)
      }
    }

    if (data.historico && data.historico.length > 0) {
      for (const item of data.historico) {
        await addHistorico(item)
      }
    }

    if (data.ultimoReset) {
      await setUltimoReset(data.ultimoReset)
    }

    console.log('✅ Importação concluída')
  } catch (error) {
    console.error('Erro ao importar dados:', error)
    throw error
  }
}