# 🚨 MIGRATION URGENTE - Adicionar Colunas Faltantes

## ❌ PROBLEMA IDENTIFICADO:

Quando você marca um cliente como **concluído** ou **backup crítico** e **recarrega a página**, ele **DESAPARECE** ou volta para **pendentes** porque:

- ✅ O sistema SALVA no **state local** (funciona temporariamente)
- ❌ O sistema TENTA SALVAR no **banco de dados** mas **AS COLUNAS NÃO EXISTEM**
- ❌ Ao recarregar, busca do banco **SEM** os dados salvos
- ❌ Recalcula e perde tudo

## ✅ SOLUÇÃO:

Adicionar as **5 colunas faltantes** na tabela `clientes`:
1. `aba_atual` - Controla em qual aba o cliente está
2. `mes_referencia` - Mês de referência (YYYY-MM)
3. `mes_atrasado` - Mês que ficou atrasado
4. `analista_backup` - Analista do backup
5. `urgente` - Cliente urgente (destaque vermelho)

---

## 📋 COMO EXECUTAR (PASSO A PASSO):

### 1️⃣ Abrir o Supabase SQL Editor

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **"SQL Editor"**

### 2️⃣ Copiar e Colar o SQL

Copie **TODO** o código abaixo e cole no SQL Editor:

\`\`\`sql
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
\`\`\`

### 3️⃣ Executar

1. Clique no botão **"RUN"** (ou pressione **Ctrl+Enter**)
2. Aguarde aparecer: **"Success. No rows returned"**
3. ✅ **PRONTO!** As colunas foram adicionadas

### 4️⃣ Verificar

Execute este comando para confirmar:

\`\`\`sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'clientes'
AND column_name IN ('aba_atual', 'mes_referencia', 'mes_atrasado', 'analista_backup', 'urgente')
ORDER BY column_name;
\`\`\`

**Deve retornar 5 linhas:**
- aba_atual (text)
- analista_backup (text)
- mes_atrasado (text)
- mes_referencia (text)
- urgente (boolean)

---

## 🧪 TESTAR APÓS EXECUTAR:

1. **Recarregue a página do sistema** (Ctrl+Shift+R)
2. **Marque um cliente como concluído**:
   - Status Envio: **Enviado**
   - Status Backup: **Feito**
3. **Recarregue a página novamente**
4. ✅ O cliente **DEVE CONTINUAR** na aba **Concluídos**
5. ✅ Os **relatórios** devem mostrar os números corretamente

---

## 📊 RESULTADO ESPERADO:

Após executar a migration:
- ✅ Clientes **NÃO SOMEM** ao recarregar
- ✅ Abas mantêm os clientes corretos
- ✅ Relatórios atualizam corretamente
- ✅ Dashboard mostra dados reais
- ✅ **SISTEMA FUNCIONANDO 100%** 🚀

---

## ⚠️ IMPORTANTE:

- Esta migration usa `IF NOT EXISTS`, então é **SEGURA** para executar múltiplas vezes
- **NÃO APAGA** nenhum dado existente
- Apenas **ADICIONA** as colunas faltantes
- Todos os clientes existentes terão `aba_atual = 'pendentes'` por padrão

---

## 🆘 SE DER ERRO:

Me envie a mensagem de erro COMPLETA que apareceu no SQL Editor.
