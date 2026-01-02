# 🚀 GUIA RÁPIDO DE DEPLOY

## ⚡ Comandos para Subir no GitHub e Vercel

### 1️⃣ **Preparar Git Local**

```bash
# Inicializar repositório
git init

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Sistema CONTROL GESTÃO SISTEMAS - Versão Final"

# Renomear branch para main
git branch -M main
```

---

### 2️⃣ **Criar Repositório no GitHub**

**Opção A: Via Site (Mais Fácil)**
1. Acesse: https://github.com/new
2. Nome do repositório: `control-gestao-sistemas`
3. Deixe **Público**
4. **NÃO** marque "Add README" (já temos)
5. Clique em **"Create repository"**

**Opção B: Via Linha de Comando**
```bash
# Substitua SEU_USUARIO pelo seu username do GitHub
git remote add origin https://github.com/SEU_USUARIO/control-gestao-sistemas.git

# Fazer push
git push -u origin main
```

**Se pedir usuário e senha:**
- Use seu username do GitHub
- Senha: Crie um **Personal Access Token** em:
  - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  - Generate new token → Marque "repo" → Generate
  - Copie o token e use como senha

---

### 3️⃣ **Deploy no Vercel**

**Passo a Passo:**

1. **Acesse:** https://vercel.com

2. **Login:**
   - Clique em "Sign Up" ou "Login"
   - Escolha "Continue with GitHub"
   - Autorize o Vercel

3. **Novo Projeto:**
   - Clique em "Add New..." → "Project"
   - Localize `control-gestao-sistemas`
   - Clique em "Import"

4. **Configuração:**
   ```
   Project Name: control-gestao-sistemas
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

5. **Deploy:**
   - Clique em "Deploy"
   - Aguarde 2-3 minutos ⏳

6. **Configurar Variáveis:**
   - Após deploy, vá em "Settings"
   - Clique em "Environment Variables"
   - Adicione:
     ```
     Nome: VITE_SUPABASE_PROJECT_ID
     Valor: [copie do arquivo utils/supabase/info.tsx]

     Nome: VITE_SUPABASE_ANON_KEY
     Valor: [copie do arquivo utils/supabase/info.tsx]
     ```
   - Clique em "Save"

7. **Redeploy:**
   - Vá em "Deployments"
   - Clique nos 3 pontinhos do último deployment
   - Clique em "Redeploy"

8. **Pronto! 🎉**
   - Seu site estará em: `https://control-gestao-sistemas.vercel.app`

---

### 4️⃣ **Atualizações Futuras**

Quando fizer mudanças no código:

```bash
# 1. Adicionar arquivos modificados
git add .

# 2. Commit com mensagem
git commit -m "Descrição da mudança"

# 3. Enviar para GitHub
git push origin main
```

**O Vercel vai fazer deploy automático! 🚀**

---

## 📝 Checklist Final

Antes de considerar concluído:

- [ ] Código no GitHub
- [ ] Deploy no Vercel realizado
- [ ] Variáveis de ambiente configuradas
- [ ] Site abrindo corretamente
- [ ] Teste: Criar um cliente
- [ ] Teste: Criar um analista (senha: 301603)
- [ ] Teste: Criar um sistema (senha: 301603)
- [ ] Teste: Atualizar status de cliente
- [ ] Teste: Marcar cliente como urgente
- [ ] Teste: Usar filtros
- [ ] Teste: Ver relatórios
- [ ] Teste: Exportar Excel (senha: 301603)

---

## 🆘 Problemas Comuns

### "Failed to fetch"
**Causa:** Variáveis de ambiente não configuradas
**Solução:** Verifique as variáveis no Vercel e faça redeploy

### "Build failed"
**Causa:** Erro no código ou dependências
**Solução:** Veja os logs no Vercel, procure por erros em vermelho

### Página em branco
**Causa:** Erro no JavaScript
**Solução:** Pressione F12 no navegador, veja o Console

### Git pede senha toda hora
**Solução:** Use SSH ao invés de HTTPS:
```bash
git remote set-url origin git@github.com:SEU_USUARIO/control-gestao-sistemas.git
```

---

## 🎯 URLs Importantes

- **GitHub:** https://github.com
- **Vercel:** https://vercel.com
- **Supabase:** https://supabase.com
- **Seu Site:** `https://control-gestao-sistemas.vercel.app` (após deploy)

---

## 💡 Dicas

1. ✅ Sempre faça commit antes de mudanças grandes
2. ✅ Use mensagens de commit descritivas
3. ✅ Teste localmente antes de fazer push (`npm run dev`)
4. ✅ Mantenha backup do banco Supabase
5. ✅ Monitore uso do Supabase (tem limite free)

---

## 📞 Comandos Úteis

```bash
# Ver status do git
git status

# Ver histórico de commits
git log --oneline

# Desfazer último commit (mantém arquivos)
git reset --soft HEAD~1

# Ver diferenças antes de commit
git diff

# Criar nova branch
git checkout -b nome-da-branch

# Voltar para main
git checkout main

# Atualizar do GitHub
git pull origin main
```

---

**🎉 Sucesso no seu deploy!**

Sistema profissional, completo e pronto para substituir planilhas! 🚀
