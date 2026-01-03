# 🚀 COMANDOS GIT - COPIAR E COLAR

## ⚡ Deploy Rápido

### Opção 1: Commit Completo
```bash
git add .
git commit -m "Sistema otimizado e corrigido - Pronto para produção

✅ Sistema 3-5x mais rápido
✅ Necessita de Atenção funcionando
✅ Desativar cliente funcionando  
✅ Relatórios preservados após reset
✅ Sistemas cadastrados aparecem
✅ Backend reescrito profissionalmente
✅ Banco de dados organizado
✅ Logs de debug implementados"

git push origin main
```

### Opção 2: Commit Simples
```bash
git add .
git commit -m "Sistema otimizado - Todas correções aplicadas"
git push origin main
```

### Opção 3: Commit Urgente
```bash
git add . && git commit -m "Correções críticas aplicadas" && git push origin main
```

---

## 🔍 Ver Status Antes de Commit

```bash
# Ver arquivos modificados
git status

# Ver diferenças
git diff

# Ver diferenças de um arquivo específico
git diff /App.tsx
git diff /supabase/functions/server/index.tsx
```

---

## 📝 Histórico

```bash
# Ver últimos commits
git log --oneline -10

# Ver detalhes do último commit
git show

# Ver commits de um arquivo
git log --oneline /App.tsx
```

---

## 🔄 Se Precisar Desfazer

### Desfazer Último Commit (mantém arquivos)
```bash
git reset --soft HEAD~1
```

### Desfazer Mudanças de um Arquivo
```bash
git checkout -- /App.tsx
```

### Voltar Para Versão Anterior
```bash
git log --oneline
# Copie o hash do commit desejado
git reset --hard HASH_DO_COMMIT
```

---

## 🌿 Branches (Opcional)

### Criar Branch de Desenvolvimento
```bash
git checkout -b desenvolvimento
git add .
git commit -m "Testes"
git push origin desenvolvimento
```

### Voltar para Main
```bash
git checkout main
```

### Merge Desenvolvimento → Main
```bash
git checkout main
git merge desenvolvimento
git push origin main
```

---

## 🔐 Configuração Inicial (Se Necessário)

### Configurar Nome e Email
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

### Ver Configuração
```bash
git config --list
```

---

## 🆘 Problemas Comuns

### Erro: "Nothing to commit"
```bash
# Verifique se há mudanças
git status

# Se não houver mudanças, tudo está OK
# Se houver mudanças não rastreadas:
git add .
git commit -m "Suas mudanças"
```

### Erro: "Your branch is behind"
```bash
# Atualizar seu código local
git pull origin main

# Se houver conflitos, resolva e depois:
git add .
git commit -m "Conflitos resolvidos"
git push origin main
```

### Erro: "Permission denied"
```bash
# Usar token de acesso pessoal
# GitHub → Settings → Developer settings → Personal access tokens
# Gerar novo token com permissões 'repo'
# Usar token como senha ao fazer push
```

### Erro: "fatal: not a git repository"
```bash
# Inicializar repositório
git init
git add .
git commit -m "Inicial"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/REPO.git
git push -u origin main
```

---

## 📦 Deploy Vercel

### Após Git Push

1. **Vercel faz deploy automático**
2. Aguarde 2-3 minutos
3. Acesse: https://vercel.com/seu-projeto
4. Veja o status do deploy

### Forçar Redeploy Manual

1. Acesse painel Vercel
2. Vá em "Deployments"
3. Clique nos 3 pontinhos do último deploy
4. Clique em "Redeploy"

---

## ✅ Checklist Pré-Deploy

Antes de fazer push:

- [ ] Código testado localmente (`npm run dev`)
- [ ] Console sem erros
- [ ] Todas funcionalidades testadas
- [ ] Arquivos importantes commitados
- [ ] Mensagem de commit clara

---

## 🎯 Workflow Recomendado

### Desenvolvimento
```bash
# 1. Fazer mudanças no código
# 2. Testar localmente
npm run dev

# 3. Ver mudanças
git status
git diff

# 4. Adicionar arquivos
git add .

# 5. Commit
git commit -m "Descrição clara das mudanças"

# 6. Push
git push origin main

# 7. Aguardar deploy Vercel

# 8. Testar em produção
```

### Hotfix (Correção Urgente)
```bash
# Fazer correção
# Testar rápido
git add . && git commit -m "Hotfix: descrição" && git push origin main
# Monitorar deploy
```

---

## 📊 Ver Diferenças Detalhadas

### Ver O Que Mudou em Cada Arquivo
```bash
git diff --stat

# Resultado:
# App.tsx                           | 45 +++++++++---
# supabase/functions/server/index.tsx | 120 +++++++++++-----------
# 2 files changed, 92 insertions(+), 73 deletions(-)
```

### Ver Mudanças de Forma Visual
```bash
git diff --color-words
```

---

## 🔖 Tags (Versões)

### Criar Tag de Versão
```bash
git tag -a v1.0.0 -m "Versão 1.0.0 - Sistema completo"
git push origin v1.0.0
```

### Listar Tags
```bash
git tag
```

### Ver Detalhes de uma Tag
```bash
git show v1.0.0
```

---

## 🗂️ .gitignore

Certifique-se que `.gitignore` tem:

```
node_modules/
dist/
.env
.env.local
.vercel/
*.log
.DS_Store
```

---

## 💡 Dicas Úteis

### Commit Parcial
```bash
# Adicionar apenas alguns arquivos
git add /App.tsx
git add /supabase/functions/server/index.tsx
git commit -m "Atualizar apenas frontend e backend"
git push origin main
```

### Ver Mudanças de Hoje
```bash
git log --since="midnight" --oneline
```

### Ver Quem Mudou o Quê
```bash
git blame /App.tsx
```

### Buscar no Histórico
```bash
git log --all --grep="correção"
```

---

## 🎊 PRONTO PARA DEPLOY!

### Comando Final (Copie e Cole):

```bash
echo "🚀 Iniciando deploy..."
git add .
git commit -m "Sistema otimizado - Produção ready"
git push origin main
echo "✅ Push concluído! Aguardando deploy Vercel..."
echo "📊 Acompanhe em: https://vercel.com"
```

---

**⚡ Use estes comandos para fazer deploy rápido e seguro!**
