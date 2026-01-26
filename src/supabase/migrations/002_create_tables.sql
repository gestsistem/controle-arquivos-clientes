-- Criar tabelas para o sistema de Controle de Gestão

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  sistema TEXT NOT NULL,
  emails JSONB DEFAULT '[]'::jsonb,
  emailPrimario TEXT DEFAULT '',
  telefone TEXT DEFAULT '',
  statusEnvio TEXT DEFAULT 'Pendente',
  statusBackup TEXT DEFAULT 'Pendente',
  analista TEXT DEFAULT '',
  dataAtualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dataConclusaoEnvio TIMESTAMP WITH TIME ZONE,
  dataConclusaoBackup TIMESTAMP WITH TIME ZONE,
  concluido BOOLEAN DEFAULT FALSE,
  prioritario BOOLEAN DEFAULT FALSE,
  ativo BOOLEAN DEFAULT TRUE,
  atencao BOOLEAN DEFAULT FALSE,
  atrasado BOOLEAN DEFAULT FALSE,
  motivoSemBackup TEXT
);

-- Tabela de Analistas
CREATE TABLE IF NOT EXISTS analistas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  dataCriacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Sistemas
CREATE TABLE IF NOT EXISTS sistemas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  dataCriacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Motivos de Backup
CREATE TABLE IF NOT EXISTS motivos_backup (
  id TEXT PRIMARY KEY,
  clienteId TEXT NOT NULL,
  clienteNome TEXT NOT NULL,
  analista TEXT NOT NULL,
  motivo TEXT NOT NULL,
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Histórico de Reset
CREATE TABLE IF NOT EXISTS historico_reset (
  id TEXT PRIMARY KEY,
  mesAno TEXT NOT NULL,
  totalClientes INTEGER DEFAULT 0,
  totalResetados INTEGER DEFAULT 0,
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Configurações
CREATE TABLE IF NOT EXISTS configuracoes (
  id TEXT PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_clientes_sistema ON clientes(sistema);
CREATE INDEX IF NOT EXISTS idx_clientes_analista ON clientes(analista);
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);
CREATE INDEX IF NOT EXISTS idx_clientes_concluido ON clientes(concluido);
CREATE INDEX IF NOT EXISTS idx_clientes_atencao ON clientes(atencao);
CREATE INDEX IF NOT EXISTS idx_clientes_prioritario ON clientes(prioritario);
CREATE INDEX IF NOT EXISTS idx_motivos_clienteId ON motivos_backup(clienteId);
CREATE INDEX IF NOT EXISTS idx_historico_mesAno ON historico_reset(mesAno);

-- Habilitar RLS (Row Level Security)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sistemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE motivos_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_reset ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (permitir tudo com apikey)
CREATE POLICY "Permitir tudo para clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para analistas" ON analistas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para sistemas" ON sistemas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para motivos_backup" ON motivos_backup FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para historico_reset" ON historico_reset FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para configuracoes" ON configuracoes FOR ALL USING (true) WITH CHECK (true);
