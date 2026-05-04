-- ========================================
-- 🧹 LIMPAR TODOS OS ATRASADOS - PRODUÇÃO
-- ========================================

-- 1️⃣ VERIFICAR quantos atrasados existem
SELECT 
  COUNT(*) as total_atrasados,
  COUNT(CASE WHEN mes_atrasado IS NOT NULL THEN 1 END) as com_mes_atrasado
FROM clientes 
WHERE atrasado = true;

-- 2️⃣ LIMPAR TODOS OS ATRASADOS
UPDATE clientes
SET 
  atrasado = false,
  mes_atrasado = NULL
WHERE atrasado = true;

-- 3️⃣ VERIFICAR se limpou (deve retornar 0)
SELECT COUNT(*) as atrasados_restantes
FROM clientes 
WHERE atrasado = true;

-- 4️⃣ VERIFICAR distribuição por status
SELECT 
  status_envio,
  status_backup,
  COUNT(*) as quantidade
FROM clientes 
WHERE ativo = true
GROUP BY status_envio, status_backup
ORDER BY quantidade DESC;
