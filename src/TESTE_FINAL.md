# ✅ CHECKLIST DE TESTE FINAL

## 🧪 Testes Obrigatórios Antes do Deploy

### 1️⃣ **Cadastro de Cliente**
- [ ] Criar cliente com sistema do select
- [ ] Criar cliente digitando novo sistema (opção ➕)
- [ ] Criar cliente SEM email (verificar que não obriga)
- [ ] Criar cliente SEM telefone (verificar que não obriga)
- [ ] Adicionar múltiplos emails (3 ou mais)
- [ ] Verificar que só mostra email primário na lista

---

### 2️⃣ **Editar Cliente**
- [ ] Clicar em "Editar Cliente"
- [ ] Selecionar um cliente existente
- [ ] Alterar nome
- [ ] Alterar sistema
- [ ] Adicionar/remover emails
- [ ] Salvar
- [ ] **VERIFICAR QUE AS MUDANÇAS APARECEM NA LISTA** ✅

---

### 3️⃣ **Ordenação Alfabética**
- [ ] Verificar que clientes estão divididos por letra (A, B, C...)
- [ ] **NÃO deve ter clientes antes do "A"** ✅
- [ ] Clientes com acentos (Á, É, Ó) devem ir para A, E, O
- [ ] Urgentes aparecem primeiro em cada grupo

---

### 4️⃣ **Atualizar Status**
- [ ] Clicar em "Atualizar" em um cliente pendente
- [ ] Mudar status de envio para "Enviado"
- [ ] Manter backup "Pendente"
- [ ] **DEVE ABRIR MODAL PEDINDO JUSTIFICATIVA** ✅
- [ ] Digitar motivo
- [ ] Salvar
- [ ] **CLIENTE DEVE IR PARA ABA "NECESSITA ATENÇÃO"** ✅
- [ ] **NÃO DEVE ESTAR MAIS EM "PENDENTES"** ✅

---

### 5️⃣ **Concluir Cliente**
- [ ] Pegar cliente com status pendente
- [ ] Atualizar status envio para "Enviado"
- [ ] Atualizar status backup para "Feito"
- [ ] Atribuir analista
- [ ] Salvar
- [ ] **CLIENTE DEVE IR PARA ABA "CONCLUÍDOS"** ✅
- [ ] **NÃO DEVE ESTAR EM "NECESSITA ATENÇÃO"** ✅

---

### 6️⃣ **Desativar Cliente**
- [ ] Clicar no botão de desativar (ícone ⭕)
- [ ] Cliente deve sumir da lista atual
- [ ] Ir na aba "🔒 Desativados"
- [ ] **CLIENTE DEVE ESTAR LÁ** ✅
- [ ] Contador de desativados deve aumentar

---

### 7️⃣ **Reset Mensal** (Senha: 301603)
**IMPORTANTE: Faça backup antes!**

- [ ] Ter pelo menos 2 clientes pendentes
- [ ] Ter pelo menos 2 clientes concluídos
- [ ] Clicar em "Reset Mensal"
- [ ] Digitar senha: **301603**
- [ ] Confirmar
- [ ] **Clientes que estavam pendentes DEVEM IR PARA "ATRASOS ENVIO"** ✅
- [ ] Todos os clientes voltam para status "Pendente"
- [ ] Analistas são removidos

---

### 8️⃣ **Relatórios NÃO Zeram** (CRÍTICO!)
**Antes do Reset:**
- [ ] Anotar quantos "Enviados do Mês" tem
- [ ] Anotar ranking de analistas

**Depois do Reset:**
- [ ] Ir em "Relatórios"
- [ ] **Enviados do Mês NÃO DEVE ZERAR** ✅
- [ ] **Ranking de Analistas NÃO DEVE ZERAR** ✅
- [ ] Filtrar por data (mês atual)
- [ ] Números devem bater com antes do reset

---

### 9️⃣ **Filtros**
- [ ] Clicar em "Filtros"
- [ ] Marcar "Apenas Urgentes"
- [ ] Deve mostrar só clientes urgentes
- [ ] Selecionar um sistema específico
- [ ] Deve filtrar por esse sistema
- [ ] Combinar: Urgentes + Sistema
- [ ] Deve mostrar apenas urgentes daquele sistema
- [ ] Clicar em "Limpar Filtros"

---

### 🔟 **Sistemas Cadastrados** (Senha: 301603)
- [ ] Clicar em "Sistemas"
- [ ] Digitar senha: **301603**
- [ ] Adicionar 3 sistemas: "ERP", "CRM", "NFe"
- [ ] Fechar modal
- [ ] Clicar em "Novo Cliente"
- [ ] **SISTEMAS DEVEM APARECER NO SELECT** ✅
- [ ] Selecionar "➕ Digitar novo sistema"
- [ ] Campo deve aparecer para digitar

---

### 1️⃣1️⃣ **Urgentes**
- [ ] Marcar cliente como urgente (estrela ⭐)
- [ ] **Fundo deve ficar VERMELHO FORTE** ✅
- [ ] Estrela vermelha preenchida com animação
- [ ] Cliente deve aparecer primeiro na lista

---

### 1️⃣2️⃣ **Importar/Exportar** (Senha: 301603)
- [ ] Clicar em "Exportar"
- [ ] Digitar senha: **301603**
- [ ] Arquivo Excel deve baixar
- [ ] Abrir Excel
- [ ] Verificar dados estão corretos
- [ ] Clicar em "Importar"
- [ ] Digitar senha: **301603**
- [ ] Selecionar Excel com colunas: CLIENTE, SISTEMA, E-MAIL, NUMERO
- [ ] Importar
- [ ] Clientes devem aparecer no sistema

---

## 🎯 Testes de Aba

### Aba: Pendentes
- [ ] Mostra apenas clientes com status não concluído
- [ ] NÃO mostra clientes em atenção
- [ ] NÃO mostra clientes atrasados
- [ ] NÃO mostra clientes concluídos

### Aba: Concluídos
- [ ] Mostra apenas clientes com envio "Enviado" E backup "Feito"
- [ ] NÃO mostra clientes em atenção

### Aba: Necessita Atenção
- [ ] Mostra apenas clientes com envio "Enviado" E backup "Pendente"
- [ ] Mostra justificativa quando clicar em "Ver Detalhes"

### Aba: Atrasos Envio
- [ ] Mostra apenas clientes marcados como atrasados
- [ ] Após reset, mostra os que estavam pendentes

### Aba: Desativados
- [ ] Mostra apenas clientes desativados
- [ ] NÃO mostra em nenhuma outra aba

---

## ⚠️ Problemas que NÃO DEVEM Acontecer

### ❌ Se acontecer, há BUG:
- [ ] Clientes antes da letra "A" na ordenação
- [ ] Editar cliente não salva
- [ ] Status muda mas cliente não muda de aba
- [ ] Desativar não funciona
- [ ] Reset zera relatórios
- [ ] Sistema pede digitar manualmente sempre
- [ ] Envio concluído + backup pendente não pede justificativa
- [ ] Pendentes não vão para atrasos após reset

---

## 📊 Verificação Visual

### Cores:
- [ ] Urgentes: **Fundo vermelho forte** (bg-red-100)
- [ ] Status Enviado: Verde
- [ ] Status Pendente: Amarelo
- [ ] Status outros: Azul

### Layout:
- [ ] Sistema usa tela inteira (98vw)
- [ ] Divisões alfabéticas visíveis
- [ ] Abas todas visíveis
- [ ] Botões funcionais

---

## 🔐 Senha Administrativa

**Senha:** `301603`

**Protege:**
- Reset Mensal
- Exportar Excel
- Importar Excel
- Gerenciar Analistas
- Gerenciar Sistemas

**Teste:**
- [ ] Tentar reset sem senha (não deve funcionar)
- [ ] Digitar senha errada (deve recusar)
- [ ] Digitar senha correta (deve funcionar)

---

## ✅ Critérios de Sucesso

Para considerar o sistema PRONTO PARA PRODUÇÃO, todos os itens acima devem estar ✅

### Mínimo Obrigatório:
1. ✅ Editar cliente SALVA
2. ✅ Status muda ABA corretamente
3. ✅ Necessita Atenção funciona
4. ✅ Desativar funciona
5. ✅ Reset NÃO zera relatórios
6. ✅ Atrasos após reset
7. ✅ Ordenação alfabética SEM bugs
8. ✅ Sistemas aparecem no select

---

## 🚀 Após Testes

### Se TODOS os testes passaram:
```bash
git add .
git commit -m "Sistema testado e aprovado - Pronto para produção"
git push origin main
```

### Se algum teste FALHOU:
- Anotar qual teste falhou
- Descrever o comportamento esperado vs atual
- Reportar para correção

---

**📋 Use este checklist para garantir que TUDO está funcionando antes de colocar em produção!**
