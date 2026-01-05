# 👁️ VERIFICAÇÃO VISUAL - Passo a Passo com Screenshots

## 📸 1. Criar Tabela no Supabase

### Onde ir:
```
https://supabase.com/dashboard
→ Seu Projeto (qaxnvpsatnwfonsbwhwt)
→ SQL Editor (menu esquerdo)
→ New Query
```

### O que fazer:
1. Cole o SQL completo
2. Clique em "RUN" (botão verde no canto superior direito)
3. ✅ Deve aparecer: "Success. No rows returned"

### Verificar se criou:
```
Table Editor (menu esquerdo)
→ Procure por "kv_store"
→ ✅ Deve aparecer na lista
```

---

## 📸 2. Deploy Edge Function

### Opção A: Via Painel (Mais Fácil)

**Onde ir:**
```
https://supabase.com/dashboard
→ Seu Projeto
→ Edge Functions (menu esquerdo)
```

**Passos:**

1. **Se função "server" JÁ EXISTE:**
   - Clique em "server"
   - Clique nos 3 pontinhos (⋮)
   - Clique em "Edit Function"
   - Cole TODO o código de `/supabase/functions/server/index.tsx`
   - Clique em "Deploy"

2. **Se função "server" NÃO EXISTE:**
   - Clique em "Create Function"
   - Nome: `server`
   - Cole TODO o código de `/supabase/functions/server/index.tsx`
   - Clique em "Deploy"

3. **Criar arquivo kv_store.tsx:**
   - Na mesma tela de edição
   - Clique em "Add File"
   - Nome: `kv_store.tsx`
   - Cole TODO o código de `/supabase/functions/server/kv_store.tsx`
   - Clique em "Save"
   - Clique em "Deploy"

### Opção B: Via CLI (Mais Profissional)

```bash
# 1. Instalar CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link projeto
supabase link --project-ref qaxnvpsatnwfonsbwhwt

# 4. Deploy
supabase functions deploy server
```

**✅ Deve aparecer:**
```
Deploying function server...
Function deployed successfully.
```

---

## 📸 3. Verificar Logs

### Onde ver:
```
https://supabase.com/dashboard
→ Edge Functions
→ server
→ Logs (aba superior)
```

### O que procurar:

✅ **Logs Bons:**
```
INFO GET /make-server-c70d4af9/health 200 OK
INFO GET /make-server-c70d4af9/sistemas 200 OK
```

❌ **Logs Ruins:**
```
ERROR Cannot find module
ERROR 404 Not Found
ERROR SyntaxError
```

---

## 📸 4. Testar Rotas no Navegador

### Passo 1: Abrir Console
```
Chrome/Edge: F12
Mac: Cmd+Option+I
→ Aba "Console"
```

### Passo 2: Testar Health Check

Cole no console:
```javascript
fetch('https://qaxnvpsatnwfonsbwhwt.supabase.co/functions/v1/make-server-c70d4af9/health')
  .then(r => r.json())
  .then(d => console.log('✅ FUNCIONOU:', d))
  .catch(e => console.error('❌ ERRO:', e))
```

**✅ Resultado esperado:**
```
✅ FUNCIONOU: {
  status: "ok",
  timestamp: "2025-01-05T...",
  service: "CONTROL GESTÃO SISTEMAS"
}
```

**❌ Se der erro:**
```
❌ ERRO: Failed to fetch
→ Backend não está deployado
→ Volte ao Passo 2
```

### Passo 3: Testar Sistemas

Cole no console:
```javascript
const API = 'https://qaxnvpsatnwfonsbwhwt.supabase.co/functions/v1/make-server-c70d4af9'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFheG52cHNhdG53Zm9uc2J3aHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNzM3NDUsImV4cCI6MjA1MTc0OTc0NX0.H_Y_MqHp8mmbFJWL2c8TqJYC1qE_SnZMNAqSZIxM1KE'

fetch(`${API}/sistemas`, {
  headers: { 'Authorization': `Bearer ${KEY}` }
})
  .then(r => r.json())
  .then(d => console.log('✅ SISTEMAS:', d))
  .catch(e => console.error('❌ ERRO:', e))
```

**✅ Resultado esperado:**
```
✅ SISTEMAS: { sistemas: [] }
ou
✅ SISTEMAS: { sistemas: [{ id: "...", nome: "...", ... }] }
```

### Passo 4: Adicionar Sistema de Teste

Cole no console:
```javascript
fetch(`${API}/sistemas`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${KEY}`
  },
  body: JSON.stringify({ nome: 'Sistema Teste' })
})
  .then(r => r.json())
  .then(d => console.log('✅ CRIADO:', d))
  .catch(e => console.error('❌ ERRO:', e))
```

**✅ Resultado esperado:**
```
✅ CRIADO: {
  sistema: {
    id: "sistema:1736123456789",
    nome: "Sistema Teste",
    dataCriacao: "2025-01-05T..."
  }
}
```

---

## 📸 5. Testar no Sistema

### Agora pode testar no próprio sistema:

1. **Adicionar Sistema:**
   ```
   Clicar em "Sistemas" (senha: 301603)
   → Adicionar "ERP Teste"
   → ✅ Deve aparecer na lista
   → Fechar modal
   ```

2. **Verificar no Cadastro:**
   ```
   Clicar em "Novo Cliente"
   → Select de Sistema
   → ✅ "ERP Teste" DEVE aparecer
   ```

3. **Cadastrar Cliente:**
   ```
   Nome: Cliente Teste
   Sistema: ERP Teste
   Email: teste@teste.com
   → Salvar
   → ✅ Deve aparecer na lista "Pendentes"
   ```

4. **Atualizar Status:**
   ```
   Clicar em "Atualizar" no cliente
   → Status Envio: "Enviado"
   → Status Backup: "Feito"
   → Salvar
   → ✅ Cliente DEVE ir para "Concluídos"
   → ✅ NÃO deve dar erro
   ```

5. **Verificar Relatórios:**
   ```
   Clicar em "Relatórios"
   → ✅ Deve mostrar dados
   → ✅ Cliente teste deve aparecer em "Enviados"
   ```

---

## 🔍 Checklist Visual

Use esta lista para marcar o que já fez:

### Supabase - SQL
- [ ] Acessei SQL Editor
- [ ] Colei o SQL da tabela kv_store
- [ ] Cliquei em RUN
- [ ] Vi "Success. No rows returned"
- [ ] Verifiquei em Table Editor
- [ ] Tabela kv_store aparece na lista

### Supabase - Edge Function
- [ ] Acessei Edge Functions
- [ ] Criei/editei função "server"
- [ ] Colei código de index.tsx
- [ ] Adicionei arquivo kv_store.tsx
- [ ] Cliquei em Deploy
- [ ] Vi mensagem de sucesso

### Testes - Console
- [ ] Abri Console (F12)
- [ ] Testei /health → 200 OK
- [ ] Testei GET /sistemas → 200 OK
- [ ] Testei POST /sistemas → 201 Created
- [ ] Testei GET /clientes → 200 OK

### Testes - Sistema
- [ ] Adicionei sistema
- [ ] Sistema aparece no select
- [ ] Cadastrei cliente
- [ ] Atualizei status para Enviado+Feito
- [ ] Cliente foi para Concluídos
- [ ] Sem erro 404
- [ ] Relatórios carregam

---

## ❌ Erros Comuns e Soluções Visuais

### Erro: "Failed to load resource: 404"

**O que significa:**
- Backend não está respondendo
- Função não foi deployada
- URL está errada

**Como resolver:**
1. Vá em Supabase → Edge Functions
2. Veja se "server" está na lista
3. Se NÃO estiver: Crie
4. Se estiver: Clique e veja os Logs
5. Se logs têm erros: Redeploy

### Erro: "Unexpected non-whitespace character"

**O que significa:**
- Backend está retornando HTML ao invés de JSON
- Rota não existe
- Função tem erro de sintaxe

**Como resolver:**
1. Vá em Logs da função
2. Procure por "ERROR"
3. Copie o erro
4. Corrija o código
5. Redeploy

### Erro: "relation kv_store does not exist"

**O que significa:**
- Tabela não foi criada
- SQL não foi executado

**Como resolver:**
1. Vá em Table Editor
2. Procure "kv_store"
3. Se NÃO encontrar:
   - Volte ao SQL Editor
   - Execute o SQL novamente
4. Aguarde 10 segundos
5. Verifique novamente

---

## 📊 Status Visual Esperado

### Após Deploy Correto:

```
Edge Functions → server
├── Status: ● ACTIVE (bolinha verde)
├── Last Deployed: há X minutos
├── Invocations: > 0
└── Logs: Sem erros recentes
```

### Table Editor:

```
Tables
├── auth (sistema)
├── storage (sistema)
└── kv_store ✅ (sua tabela)
    ├── Rows: 0 ou mais
    └── Columns: key, value, updated_at
```

---

## 🎯 Fluxo Completo Visual

```
1. Supabase Dashboard
   ↓
2. SQL Editor
   ↓ Execute SQL
3. Table Editor (verificar)
   ↓
4. Edge Functions
   ↓ Deploy function
5. Logs (verificar sucesso)
   ↓
6. Browser Console (F12)
   ↓ Testar rotas
7. Sistema Web
   ↓ Testar funcionalidades
8. ✅ FUNCIONANDO!
```

---

**👁️ Use este guia visual para não se perder!**

Cada passo tem um lugar específico no painel do Supabase.
Siga a ordem e tudo funcionará.
