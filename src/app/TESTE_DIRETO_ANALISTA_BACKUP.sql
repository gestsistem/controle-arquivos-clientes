-- ========================================
-- 🧪 TESTE DIRETO - ANALISTA BACKUP
-- ========================================

-- 1️⃣ VERIFICAR ESTRUTURA DA TABELA
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'clientes'
ORDER BY ordinal_position;

-- 2️⃣ SE NÃO EXISTIR, CRIAR COM FORÇA
DROP TABLE IF EXISTS clientes_backup;
CREATE TABLE clientes_backup AS SELECT * FROM clientes;

ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS analista_backup TEXT DEFAULT '';

-- 3️⃣ ATUALIZAR UM CLIENTE ESPECÍFICO (escolha um real)
UPDATE clientes 
SET 
  analista_backup = 'JORGE_TESTE',
  status_backup = 'Feito'
WHERE nome ILIKE '%almeida%'
LIMIT 1;

-- 4️⃣ VERIFICAR SE SALVOU (CRUCIAL!)
SELECT 
  id,
  nome,
  analista,
  analista_backup,
  status_backup
FROM clientes 
WHERE analista_backup IS NOT NULL 
  AND analista_backup != '';

-- 5️⃣ SELECT IGUAL AO QUE O SISTEMA FAZ
SELECT * FROM clientes 
WHERE nome ILIKE '%almeida%'
LIMIT 1;

-- 6️⃣ VER TODOS OS CAMPOS (exatamente como o sistema verá)
SELECT 
  nome,
  sistema,
  analista,
  analista_backup,
  status_envio,
  status_backup,
  motivo_sem_backup,
  ativo
FROM clientes 
WHERE ativo = true
ORDER BY nome
LIMIT 5;
