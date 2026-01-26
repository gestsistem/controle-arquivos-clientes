-- ========================================
-- EXECUTE LINHA POR LINHA (COPIE E COLE UMA DE CADA VEZ)
-- ========================================

-- LINHA 1: Criar coluna (copie só esta linha)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS analista_backup TEXT DEFAULT '';

-- Depois execute esta:
-- LINHA 2: Verificar se criou
SELECT column_name FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'analista_backup';

-- Se apareceu "analista_backup", execute esta:
-- LINHA 3: Atualizar UM cliente
UPDATE clientes SET analista_backup = 'JORGE' WHERE nome = 'ALMEIDA FRIOS E CONGELADOS';

-- Execute esta:
-- LINHA 4: Ver se salvou
SELECT nome, analista, analista_backup FROM clientes WHERE nome = 'ALMEIDA FRIOS E CONGELADOS';

-- Deve aparecer:
-- nome                        | analista | analista_backup
-- ALMEIDA FRIOS E CONGELADOS  | RAFAEL   | JORGE
