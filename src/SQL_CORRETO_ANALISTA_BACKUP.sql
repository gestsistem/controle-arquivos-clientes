-- ========================================
-- ✅ SQL CORRIGIDO - ANALISTA BACKUP
-- ========================================

-- 1️⃣ Criar a coluna
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS analista_backup TEXT DEFAULT '';

-- 2️⃣ Atualizar um cliente para teste (SINTAXE CORRETA)
UPDATE clientes 
SET analista_backup = 'JORGE_TESTE_MANUAL'
WHERE nome ILIKE '%almeida%';

-- 3️⃣ Verificar se salvou
SELECT nome, analista, analista_backup, status_backup
FROM clientes 
WHERE analista_backup = 'JORGE_TESTE_MANUAL';

-- 4️⃣ Ver TODOS os campos
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'clientes'
ORDER BY ordinal_position;

-- 5️⃣ Ver estrutura completa da linha do ALMEIDA
SELECT *
FROM clientes 
WHERE nome ILIKE '%almeida%';
