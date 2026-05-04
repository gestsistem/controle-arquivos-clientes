-- ========================================
-- 🔍 VERIFICAR E ADICIONAR ANALISTA_BACKUP
-- ========================================

-- 1️⃣ VERIFICAR se a coluna existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clientes' 
  AND column_name = 'analista_backup';

-- 2️⃣ SE NÃO EXISTIR, ADICIONAR (execute este):
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS analista_backup TEXT DEFAULT '';

-- 3️⃣ VERIFICAR novamente se foi criada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clientes' 
  AND column_name = 'analista_backup';

-- 4️⃣ TESTAR: Atualizar um cliente de teste
UPDATE clientes 
SET analista_backup = 'TESTE_ANALISTA'
WHERE id = (SELECT id FROM clientes LIMIT 1);

-- 5️⃣ VERIFICAR se salvou
SELECT nome, analista, analista_backup, status_backup
FROM clientes 
WHERE analista_backup = 'TESTE_ANALISTA';

-- 6️⃣ LIMPAR o teste
UPDATE clientes 
SET analista_backup = ''
WHERE analista_backup = 'TESTE_ANALISTA';

-- 7️⃣ VER ESTRUTURA COMPLETA DA TABELA
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'clientes'
ORDER BY ordinal_position;
