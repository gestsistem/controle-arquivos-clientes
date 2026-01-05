-- Criar tabela KV Store para armazenar dados do sistema
CREATE TABLE IF NOT EXISTS kv_store (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para buscas por prefixo
CREATE INDEX IF NOT EXISTS idx_kv_store_key_prefix ON kv_store (key text_pattern_ops);

-- Index para data de atualização
CREATE INDEX IF NOT EXISTS idx_kv_store_updated_at ON kv_store (updated_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE kv_store ENABLE ROW LEVEL SECURITY;

-- Política: Permitir todas operações para service_role
CREATE POLICY "Service role can do everything" ON kv_store
  FOR ALL
  USING (auth.role() = 'service_role');

-- Política: Permitir leitura para anon
CREATE POLICY "Anonymous can read" ON kv_store
  FOR SELECT
  USING (true);

-- Política: Permitir escrita para anon (para desenvolvimento)
CREATE POLICY "Anonymous can write" ON kv_store
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anonymous can update" ON kv_store
  FOR UPDATE
  USING (true);

CREATE POLICY "Anonymous can delete" ON kv_store
  FOR DELETE
  USING (true);

-- Comentários
COMMENT ON TABLE kv_store IS 'Armazenamento chave-valor para o sistema CONTROL GESTÃO';
COMMENT ON COLUMN kv_store.key IS 'Chave única do registro (ex: cliente:123, sistema:456)';
COMMENT ON COLUMN kv_store.value IS 'Valor em formato JSON';
COMMENT ON COLUMN kv_store.updated_at IS 'Data da última atualização';
