# 🔍 TESTE DE ROTAS - Verificação Rápida

## Como Testar as Rotas do Backend

Abra o **Console do Navegador** (F12) e execute estes comandos:

### 1️⃣ Verificar Health Check
```javascript
fetch('https://qaxnvpsatnwfonsbwhwt.supabase.co/functions/v1/make-server-c70d4af9/health')
  .then(r => r.json())
  .then(data => console.log('✅ Health:', data))
  .catch(e => console.error('❌ Erro:', e))
```

**Resultado Esperado:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-03T...",
  "service": "CONTROL GESTÃO SISTEMAS"
}
```

---

### 2️⃣ Testar Rota de Sistemas
```javascript
const API_URL = 'https://qaxnvpsatnwfonsbwhwt.supabase.co/functions/v1/make-server-c70d4af9'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFheG52cHNhdG53Zm9uc2J3aHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNzM3NDUsImV4cCI6MjA1MTc0OTc0NX0.H_Y_MqHp8mmbFJWL2c8TqJYC1qE_SnZMNAqSZIxM1KE'

// GET Sistemas
fetch(`${API_URL}/sistemas`, {
  headers: { 'Authorization': `Bearer ${ANON_KEY}` }
})
  .then(r => r.json())
  .then(data => console.log('✅ Sistemas:', data))
  .catch(e => console.error('❌ Erro:', e))
```

**Resultado Esperado:**
```json
{
  "sistemas": [...]
}
```

---

### 3️⃣ Adicionar Sistema de Teste
```javascript
const API_URL = 'https://qaxnvpsatnwfonsbwhwt.supabase.co/functions/v1/make-server-c70d4af9'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFheG52cHNhdG53Zm9uc2J3aHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNzM3NDUsImV4cCI6MjA1MTc0OTc0NX0.H_Y_MqHp8mmbFJWL2c8TqJYC1qE_SnZMNAqSZIxM1KE'

// POST Sistema
fetch(`${API_URL}/sistemas`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ANON_KEY}`
  },
  body: JSON.stringify({ nome: 'Sistema Teste' })
})
  .then(r => r.json())
  .then(data => console.log('✅ Sistema Criado:', data))
  .catch(e => console.error('❌ Erro:', e))
```

**Resultado Esperado:**
```json
{
  "sistema": {
    "id": "sistema:1234567890",
    "nome": "Sistema Teste",
    "dataCriacao": "2025-01-03T..."
  }
}
```

---

### 4️⃣ Testar Rota de Clientes
```javascript
// GET Clientes
fetch(`${API_URL}/clientes`, {
  headers: { 'Authorization': `Bearer ${ANON_KEY}` }
})
  .then(r => r.json())
  .then(data => console.log('✅ Clientes:', data.clientes.length, 'encontrados'))
  .catch(e => console.error('❌ Erro:', e))
```

---

### 5️⃣ Atualizar Cliente (Teste)
```javascript
// Primeiro pegue um ID de cliente real da lista
const CLIENTE_ID = 'cliente:1234567890' // SUBSTITUA por ID real

// PUT Cliente
fetch(`${API_URL}/clientes/${CLIENTE_ID}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ANON_KEY}`
  },
  body: JSON.stringify({
    statusEnvio: 'Enviado',
    statusBackup: 'Pendente'
  })
})
  .then(r => r.json())
  .then(data => {
    console.log('✅ Cliente Atualizado:', data.cliente)
    console.log('🔍 Atencao?', data.cliente.atencao) // Deve ser TRUE
  })
  .catch(e => console.error('❌ Erro:', e))
```

---

## 📋 Checklist de Rotas

Execute cada teste acima e marque:

- [ ] ✅ Health Check (200 OK)
- [ ] ✅ GET /sistemas (200 OK)
- [ ] ✅ POST /sistemas (201 Created)
- [ ] ✅ GET /clientes (200 OK)
- [ ] ✅ PUT /clientes/:id (200 OK)
- [ ] ✅ GET /analistas (200 OK)
- [ ] ✅ GET /motivos-backup (200 OK)

---

## ❌ Se Aparecer Erro 404

### Causa Possível:
1. Backend não foi deployado
2. Função Edge não está ativa
3. URL incorreta

### Solução:
```bash
# 1. Fazer redeploy do Supabase Edge Function
cd supabase
supabase functions deploy server

# Ou no painel do Supabase:
# Functions → server → Deploy
```

---

## ❌ Se Aparecer Erro CORS

### Causa:
Requisição de origem diferente

### Solução:
Backend já tem CORS habilitado:
```typescript
app.use('*', cors())
```

Se ainda der erro, verifique no painel do Supabase:
- Settings → API → CORS
- Adicionar origem: `*` (desenvolvimento) ou seu domínio

---

## 🔍 Ver Logs em Tempo Real

### No Painel do Supabase:
1. Vá em **Functions**
2. Clique em **server**
3. Aba **Logs**
4. Veja logs em tempo real

### Exemplo de Logs:
```
INFO GET /make-server-c70d4af9/sistemas 200 OK
INFO POST /make-server-c70d4af9/clientes 201 Created
INFO PUT /make-server-c70d4af9/clientes/cliente:123 200 OK
```

---

## 🚀 Teste Completo de Integração

Execute este script completo:

```javascript
const API_URL = 'https://qaxnvpsatnwfonsbwhwt.supabase.co/functions/v1/make-server-c70d4af9'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFheG52cHNhdG53Zm9uc2J3aHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNzM3NDUsImV4cCI6MjA1MTc0OTc0NX0.H_Y_MqHp8mmbFJWL2c8TqJYC1qE_SnZMNAqSZIxM1KE'

async function testarTudo() {
  console.log('🧪 Iniciando testes...\n')
  
  // 1. Health Check
  console.log('1️⃣ Testando Health Check...')
  let res = await fetch(`${API_URL}/health`)
  let data = await res.json()
  console.log(res.ok ? '✅ Health OK' : '❌ Falhou', data)
  
  // 2. GET Sistemas
  console.log('\n2️⃣ Testando GET Sistemas...')
  res = await fetch(`${API_URL}/sistemas`, {
    headers: { 'Authorization': `Bearer ${ANON_KEY}` }
  })
  data = await res.json()
  console.log(res.ok ? `✅ ${data.sistemas.length} sistemas encontrados` : '❌ Falhou', data)
  
  // 3. POST Sistema
  console.log('\n3️⃣ Testando POST Sistema...')
  res = await fetch(`${API_URL}/sistemas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({ nome: `Teste ${Date.now()}` })
  })
  data = await res.json()
  console.log(res.ok ? '✅ Sistema criado' : '❌ Falhou', data)
  
  // 4. GET Clientes
  console.log('\n4️⃣ Testando GET Clientes...')
  res = await fetch(`${API_URL}/clientes`, {
    headers: { 'Authorization': `Bearer ${ANON_KEY}` }
  })
  data = await res.json()
  console.log(res.ok ? `✅ ${data.clientes.length} clientes encontrados` : '❌ Falhou')
  
  console.log('\n🎉 Testes concluídos!')
}

testarTudo()
```

---

## ✅ Resultado Esperado

Se tudo estiver OK, você verá:

```
🧪 Iniciando testes...

1️⃣ Testando Health Check...
✅ Health OK { status: "ok", ... }

2️⃣ Testando GET Sistemas...
✅ 3 sistemas encontrados

3️⃣ Testando POST Sistema...
✅ Sistema criado { sistema: { ... } }

4️⃣ Testando GET Clientes...
✅ 15 clientes encontrados

🎉 Testes concluídos!
```

---

## 📞 Se Precisar de Ajuda

1. **Abra o Console (F12)**
2. **Execute os testes**
3. **Copie os erros que aparecerem**
4. **Verifique:**
   - URL está correta?
   - ANON_KEY está correto?
   - Backend está deployado?

---

**🔍 Use este guia para diagnosticar problemas rapidamente!**
