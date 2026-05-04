-- Adicionar colunas faltantes na tabela clientes

-- Coluna para controlar em qual aba o cliente está
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS aba_atual TEXT DEFAULT 'pendentes';

-- Coluna para armazenar o mês de referência (formato YYYY-MM)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS mes_referencia TEXT;

-- Coluna para armazenar o mês em que ficou atrasado
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS mes_atrasado TEXT;

-- Coluna para armazenar o analista responsável pelo backup
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS analista_backup TEXT DEFAULT '';

-- Coluna para marcar clientes urgentes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS urgente BOOLEAN DEFAULT FALSE;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_clientes_aba_atual ON clientes(aba_atual);
CREATE INDEX IF NOT EXISTS idx_clientes_mes_referencia ON clientes(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_clientes_urgente ON clientes(urgente);

-- Comentários para documentação
COMMENT ON COLUMN clientes.aba_atual IS 'Aba onde o cliente está atualmente: pendentes, concluidos, backupCritico, atencao';
COMMENT ON COLUMN clientes.mes_referencia IS 'Mês de referência do cliente no formato YYYY-MM';
COMMENT ON COLUMN clientes.mes_atrasado IS 'Mês em que o cliente ficou atrasado no formato YYYY-MM';
COMMENT ON COLUMN clientes.analista_backup IS 'Nome do analista responsável pelo backup';
COMMENT ON COLUMN clientes.urgente IS 'Indica se o cliente é urgente (destaque vermelho)';
