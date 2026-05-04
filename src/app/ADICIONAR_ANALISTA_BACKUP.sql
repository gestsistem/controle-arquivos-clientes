-- ========================================
-- 📋 ADICIONAR COLUNA ANALISTA_BACKUP
-- ========================================

-- 1️⃣ Adicionar coluna analista_backup
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS analista_backup TEXT DEFAULT '';

-- 2️⃣ Verificar se a coluna foi criada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clientes' 
  AND column_name = 'analista_backup';

-- 3️⃣ Ver estrutura completa da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'clientes'
ORDER BY ordinal_position;
