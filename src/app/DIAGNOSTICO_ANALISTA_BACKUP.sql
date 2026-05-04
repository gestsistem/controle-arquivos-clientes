-- ========================================
-- 🔍 DIAGNÓSTICO COMPLETO - ANALISTA BACKUP
-- ========================================

-- ✅ PASSO 1: Verificar se a coluna existe
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Coluna analista_backup EXISTE'
    ELSE '❌ Coluna analista_backup NÃO EXISTE'
  END as status
FROM information_schema.columns 
WHERE table_name = 'clientes' 
  AND column_name = 'analista_backup';

-- ✅ PASSO 2: Se não existir, CRIAR AGORA
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS analista_backup TEXT DEFAULT '';

-- ✅ PASSO 3: Confirmar que foi criada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'clientes' 
  AND column_name = 'analista_backup';

-- ✅ PASSO 4: Ver TODOS os campos da tabela clientes
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'clientes'
ORDER BY ordinal_position;

-- ✅ PASSO 5: Testar INSERT de dados
UPDATE clientes 
SET 
  status_backup = 'Feito',
  analista_backup = 'TESTE_MARIA'
WHERE nome ILIKE '%mercadinho%'
LIMIT 1;

-- ✅ PASSO 6: Verificar se salvou
SELECT 
  nome,
  sistema,
  analista as analista_envio,
  analista_backup,
  status_backup,
  motivo_sem_backup
FROM clientes 
WHERE analista_backup = 'TESTE_MARIA';

-- ✅ PASSO 7: Ver TODOS os clientes com backup feito
SELECT 
  nome,
  analista as quem_enviou,
  analista_backup as quem_fez_backup,
  status_backup,
  motivo_sem_backup
FROM clientes 
WHERE status_backup = 'Feito'
ORDER BY nome
LIMIT 10;

-- ✅ PASSO 8: LIMPAR o teste
UPDATE clientes 
SET analista_backup = ''
WHERE analista_backup = 'TESTE_MARIA';
