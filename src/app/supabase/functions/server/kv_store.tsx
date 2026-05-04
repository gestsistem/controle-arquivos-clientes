// KV Store - Interface com Supabase KV
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const supabase = createClient(supabaseUrl, supabaseKey)

const TABLE_NAME = 'kv_store'

// Garantir que a tabela existe
export async function initTable() {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .select('key')
      .limit(1)
    
    if (error && error.message.includes('does not exist')) {
      console.log('⚠️ Tabela kv_store não existe. Usando storage alternativo.')
    }
  } catch (error) {
    console.error('Erro ao verificar tabela:', error)
  }
}

// Armazenamento em memória como fallback
const memoryStore = new Map<string, any>()

export async function get(key: string): Promise<any | null> {
  try {
    // Tentar buscar no Supabase primeiro
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('value')
      .eq('key', key)
      .single()

    if (error) {
      // Se falhar, usar memória
      return memoryStore.get(key) || null
    }

    return data?.value ? JSON.parse(data.value) : null
  } catch (error) {
    console.error('Erro ao buscar:', key, error)
    return memoryStore.get(key) || null
  }
}

export async function set(key: string, value: any): Promise<void> {
  try {
    const jsonValue = JSON.stringify(value)
    
    // Salvar na memória
    memoryStore.set(key, value)

    // Tentar salvar no Supabase
    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert({ 
        key, 
        value: jsonValue,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      })

    if (error) {
      console.log('📝 Usando storage em memória para:', key)
    }
  } catch (error) {
    console.error('Erro ao salvar:', key, error)
    // Pelo menos salva em memória
    memoryStore.set(key, value)
  }
}

export async function del(key: string): Promise<void> {
  try {
    // Deletar da memória
    memoryStore.delete(key)

    // Tentar deletar do Supabase
    await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('key', key)
  } catch (error) {
    console.error('Erro ao deletar:', key, error)
  }
}

export async function getByPrefix(prefix: string): Promise<any[]> {
  try {
    // Tentar buscar no Supabase
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('value')
      .like('key', `${prefix}%`)

    if (error) {
      // Se falhar, usar memória
      const results: any[] = []
      for (const [key, value] of memoryStore.entries()) {
        if (key.startsWith(prefix)) {
          results.push(value)
        }
      }
      return results
    }

    return data?.map(row => JSON.parse(row.value)) || []
  } catch (error) {
    console.error('Erro ao buscar por prefixo:', prefix, error)
    
    // Fallback para memória
    const results: any[] = []
    for (const [key, value] of memoryStore.entries()) {
      if (key.startsWith(prefix)) {
        results.push(value)
      }
    }
    return results
  }
}

// Inicializar ao importar
initTable()
