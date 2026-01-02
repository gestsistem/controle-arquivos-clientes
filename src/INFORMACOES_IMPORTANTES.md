# 🔐 INFORMAÇÕES IMPORTANTES DO SISTEMA

## 🔑 Senhas e Acessos

### Senha Administrativa
```
301603
```

**Usada para:**
- ✅ Reset Mensal
- ✅ Exportar para Excel
- ✅ Importar de Excel
- ✅ Gerenciar Analistas
- ✅ Gerenciar Sistemas

---

## 📊 Funcionalidades Principais

### Status de Envio Disponíveis
1. **Enviado** - Arquivo enviado com sucesso
2. **Pendente** - Aguardando envio
3. **Recém Implantado** - Cliente novo no sistema
4. **Gerencial** - Apenas gerenciamento
5. **Inativo** - Cliente temporariamente inativo
6. **Não Teve Vendas** - Sem movimento no período
7. **Bloqueio SEFAZ** - Bloqueado pela SEFAZ
8. **Bloqueio Financeiro** - Bloqueio por questões financeiras

### Abas do Sistema
1. **🕐 Pendentes** - Clientes com trabalho a fazer
2. **✅ Concluídos** - Envio E backup finalizados
3. **⚠️ Necessita Atenção** - Envio ok, backup pendente (com justificativa)
4. **🚨 Atrasos Envio** - Clientes que ficaram pendentes após reset
5. **📈 Relatórios** - Estatísticas e análises

---

## 🎯 Regras de Negócio

### Quando marcar como "Necessita Atenção"
- ✅ **Condição:** Status Envio = "Enviado" E Status Backup = "Pendente"
- ✅ **Ação:** Sistema solicita justificativa obrigatória
- ✅ **Resultado:** Cliente vai para aba "Necessita Atenção"
- ✅ **Registro:** Motivo fica salvo no banco e aparece em relatórios

### Reset Mensal
- ✅ Clientes com Status Envio = "Pendente" → Marcados como "Atrasados"
- ✅ Todos os status → Resetados para "Pendente"
- ✅ Analistas → Removidos
- ✅ Histórico → Salvo no banco
- ✅ Concluídos → Voltam para pendentes

### Clientes Urgentes
- ✅ **Marcação:** Clique na estrela ⭐
- ✅ **Destaque:** Fundo **vermelho forte** (bg-red-100)
- ✅ **Ordenação:** Sempre aparecem primeiro
- ✅ **Visual:** Estrela vermelha preenchida com animação

---

## 📋 Cadastro de Clientes

### Campos Obrigatórios
- ✅ Nome do Cliente
- ✅ Sistema

### Campos Opcionais
- ⚪ E-mails (pode adicionar múltiplos)
- ⚪ Telefone

### Múltiplos E-mails
- ✅ Primeiro e-mail = **E-mail Primário**
- ✅ Exibe apenas o primário na lista
- ✅ Todos os e-mails aparecem nos **Detalhes**
- ✅ Pode adicionar quantos quiser

---

## 🔍 Filtros Disponíveis

1. **Filtro Urgente** ⭐
   - Mostra apenas clientes marcados como urgentes

2. **Filtro por Sistema** 📊
   - Lista automaticamente todos os sistemas únicos
   - Filtra clientes de um sistema específico

3. **Filtro por Status de Envio** 📋
   - Todos os 8 status disponíveis
   - Permite ver clientes em situações específicas

4. **Pesquisa Global** 🔍
   - Busca em: Nome, Sistema, Analista, E-mail
   - Busca em tempo real

### Combinar Filtros
✅ Pode usar **todos os filtros juntos**
✅ Exemplo: Urgentes + Sistema "ERP" + Status "Pendente"

---

## 📈 Relatórios

### 1. Enviados por Período
- **Filtro:** Data início e/ou data fim
- **Resultado:** Total de clientes com Status Envio = "Enviado"
- **Uso:** Acompanhar produtividade mensal/semanal

### 2. Ranking de Analistas
- **Métricas:**
  - Envios no mês atual
  - Envios no ano atual
- **Ordenação:** Do maior para o menor
- **Visual:** Medalhas 🥇🥈🥉 para top 3

### 3. Status por Sistema
- **Dados:**
  - Total de clientes
  - Enviados
  - Pendentes
  - Percentual de conclusão
- **Uso:** Identificar sistemas com mais pendências

### 4. Justificativas de Backup Pendente
- **Mostra:** Últimas 10 justificativas
- **Dados:** Cliente, Data, Analista, Motivo
- **Uso:** Rastreabilidade e accountability

---

## 💾 Dados Salvos no Supabase

### Tabelas/Prefixos
- **cliente:** - Todos os clientes
- **analista:** - Analistas cadastrados
- **sistema:** - Sistemas cadastrados
- **motivo:** - Justificativas de backup pendente
- **historico:** - Histórico de resets mensais
- **reset:info** - Informação do último reset

### Campos do Cliente
```typescript
{
  id: string
  nome: string
  sistema: string
  emails: string[]              // Múltiplos e-mails
  emailPrimario: string          // Principal
  telefone: string
  statusEnvio: StatusEnvio
  statusBackup: 'Feito' | 'Pendente'
  analista: string
  dataAtualizacao: string
  concluido: boolean            // Ambos status completos
  prioritario: boolean          // Urgente
  ativo: boolean                // Ativo/Desativado
  atencao: boolean              // Necessita atenção
  atrasado: boolean             // Atrasado após reset
  motivoSemBackup?: string      // Justificativa
}
```

---

## 🎨 Design e Layout

### Cores Principais
- **Verde:** Tema principal (#059669, #10b981)
- **Vermelho:** Urgentes (#dc2626, #ef4444)
- **Laranja:** Atenção (#ea580c, #f97316)
- **Amarelo:** Pendentes (#ca8a04, #eab308)
- **Azul:** Informações (#2563eb, #3b82f6)

### Responsividade
- ✅ **Desktop:** Largura máxima 98vw (tela inteira)
- ✅ **Mobile:** Layout adaptado com flex-wrap
- ✅ **Abas:** Scroll horizontal em telas pequenas

### Ordenação Alfabética
- ✅ Clientes agrupados por **primeira letra**
- ✅ Divisor verde com a letra
- ✅ Urgentes aparecem primeiro em cada grupo
- ✅ Ordem alfabética dentro de cada grupo

---

## 🚀 Performance

### Carregamento
- ✅ Dados carregados em paralelo (Promise.all)
- ✅ Estados de loading
- ✅ Atualização otimizada

### Filtros
- ✅ Processamento client-side
- ✅ Instantâneo
- ✅ Sem requisições ao servidor

---

## 🔄 Fluxo de Trabalho Ideal

### 1. Início do Mês
1. Importar clientes (se necessário)
2. Cadastrar novos clientes
3. Configurar analistas

### 2. Durante o Mês
1. Atualizar status conforme trabalho
2. Marcar urgentes quando necessário
3. Registrar justificativas de atenção
4. Usar filtros para priorizar

### 3. Fim do Mês
1. Verificar relatórios
2. Exportar para Excel (backup)
3. Executar Reset Mensal
4. Revisar clientes atrasados

---

## ✅ Checklist Diário

- [ ] Verificar clientes urgentes
- [ ] Atualizar status dos trabalhos realizados
- [ ] Verificar aba "Necessita Atenção"
- [ ] Marcar novos urgentes se necessário

---

## 📞 Suporte Técnico

### Em caso de problemas:

1. **Erro ao carregar:**
   - Verifique conexão com internet
   - Veja console do navegador (F12)
   - Confirme Supabase está ativo

2. **Senha não funciona:**
   - Confirme: **301603**
   - Digite novamente
   - Verifique caps lock

3. **Dados não salvam:**
   - Verifique Supabase
   - Veja logs do servidor
   - Teste conexão de rede

4. **Filtros não funcionam:**
   - Limpe filtros e tente novamente
   - Recarregue a página (F5)
   - Limpe cache do navegador

---

## 🎯 Métricas de Sucesso

### Indicadores para Acompanhar

1. **Taxa de Conclusão Mensal**
   - Meta: > 95% dos clientes concluídos

2. **Clientes Atrasados**
   - Meta: < 5% de atrasos após reset

3. **Necessita Atenção**
   - Meta: Resolver em até 48h

4. **Produtividade por Analista**
   - Acompanhar ranking mensal
   - Balancear cargas de trabalho

---

## 🔐 Backup e Segurança

### Recomendações

1. ✅ Exportar Excel semanalmente
2. ✅ Verificar Supabase (backup automático)
3. ✅ Não compartilhar senha administrativa
4. ✅ Monitorar logs de acesso
5. ✅ Revisar permissões periodicamente

---

**📊 Sistema Completo e Profissional!**

Todas as informações necessárias para operação eficiente do CONTROL GESTÃO SISTEMAS.

**Senha Administrativa: 301603**
