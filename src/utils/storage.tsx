// Sistema de Storage Local - Funciona sem backend
// Sincroniza com Supabase quando disponível

const STORAGE_PREFIX = 'control_gestao_'

// Storage genérico
function getItem<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + key)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Erro ao ler do storage:', error)
    return []
  }
}

function setItem<T>(key: string, value: T[]): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch (error) {
    console.error('Erro ao salvar no storage:', error)
  }
}

// Clientes
export function getClientes() {
  return getItem('clientes')
}

export function setClientes(clientes: any[]) {
  setItem('clientes', clientes)
}

export function addCliente(cliente: any) {
  const clientes = getClientes()
  clientes.push(cliente)
  setClientes(clientes)
  return cliente
}

export function updateCliente(id: string, updates: any) {
  const clientes = getClientes()
  const index = clientes.findIndex((c: any) => c.id === id)
  if (index !== -1) {
    clientes[index] = { ...clientes[index], ...updates }
    setClientes(clientes)
    return clientes[index]
  }
  return null
}

export function deleteCliente(id: string) {
  const clientes = getClientes()
  const filtered = clientes.filter((c: any) => c.id !== id)
  setClientes(filtered)
}

// Analistas
export function getAnalistas() {
  return getItem('analistas')
}

export function setAnalistas(analistas: any[]) {
  setItem('analistas', analistas)
}

export function addAnalista(analista: any) {
  const analistas = getAnalistas()
  analistas.push(analista)
  setAnalistas(analistas)
  return analista
}

export function deleteAnalista(id: string) {
  const analistas = getAnalistas()
  const filtered = analistas.filter((a: any) => a.id !== id)
  setAnalistas(filtered)
}

// Sistemas
export function getSistemas() {
  return getItem('sistemas')
}

export function setSistemas(sistemas: any[]) {
  setItem('sistemas', sistemas)
}

export function addSistema(sistema: any) {
  const sistemas = getSistemas()
  sistemas.push(sistema)
  setSistemas(sistemas)
  return sistema
}

export function deleteSistema(id: string) {
  const sistemas = getSistemas()
  const filtered = sistemas.filter((s: any) => s.id !== id)
  setSistemas(filtered)
}

// Motivos de Backup
export function getMotivos() {
  return getItem('motivos')
}

export function setMotivos(motivos: any[]) {
  setItem('motivos', motivos)
}

export function addMotivo(motivo: any) {
  const motivos = getMotivos()
  motivos.push(motivo)
  setMotivos(motivos)
  return motivo
}

// Histórico de Reset
export function getHistorico() {
  return getItem('historico')
}

export function setHistorico(historico: any[]) {
  setItem('historico', historico)
}

export function addHistorico(item: any) {
  const historico = getHistorico()
  historico.push(item)
  setHistorico(historico)
  return item
}

// Último Reset
export function getUltimoReset(): string | null {
  try {
    return localStorage.getItem(STORAGE_PREFIX + 'ultimo_reset')
  } catch {
    return null
  }
}

export function setUltimoReset(mesAno: string) {
  try {
    localStorage.setItem(STORAGE_PREFIX + 'ultimo_reset', mesAno)
  } catch (error) {
    console.error('Erro ao salvar último reset:', error)
  }
}

// Limpar tudo (útil para testes)
export function limparTudo() {
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith(STORAGE_PREFIX)) {
      localStorage.removeItem(key)
    }
  })
}

// Exportar tudo (backup)
export function exportarTudo() {
  return {
    clientes: getClientes(),
    analistas: getAnalistas(),
    sistemas: getSistemas(),
    motivos: getMotivos(),
    historico: getHistorico(),
    ultimoReset: getUltimoReset()
  }
}

// Importar tudo (restore)
export function importarTudo(data: any) {
  if (data.clientes) setClientes(data.clientes)
  if (data.analistas) setAnalistas(data.analistas)
  if (data.sistemas) setSistemas(data.sistemas)
  if (data.motivos) setMotivos(data.motivos)
  if (data.historico) setHistorico(data.historico)
  if (data.ultimoReset) setUltimoReset(data.ultimoReset)
}
