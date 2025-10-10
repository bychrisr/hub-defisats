# Guia de Configuração GitHub Actions

## Configuração Inicial

### 1. **Configurar Secrets no GitHub**

```bash
# Instalar GitHub CLI (se não tiver)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Fazer login no GitHub
gh auth login

# Adicionar SSH key como secret
gh secret set SERVER_SSH_KEY < ~/.ssh/debian.pem

# Verificar secrets
gh secret list
```

### 2. **Configurar Proteções de Branch**

Acesse: `https://github.com/SEU_USUARIO/axisor/settings/branches`

#### Branch `main` (Produção)
- ✅ **Require a pull request before merging**
- ✅ **Require approvals**: 1
- ✅ **Dismiss stale PR approvals when new commits are pushed**
- ✅ **Require status checks to pass before merging**
  - `test`
  - `lint`
  - `type-check`
  - `security-audit`
  - `build`
- ✅ **Require branches to be up to date before merging**
- ✅ **Require conversation resolution before merging**

#### Branch `develop` (Staging)
- ✅ **Require a pull request before merging**
- ✅ **Require status checks to pass before merging**
  - `test`
  - `lint`
  - `type-check`
- ✅ **Require branches to be up to date before merging**

### 3. **Configurar DNS**

#### Adicionar Subdomínio Staging
```bash
# No seu provedor de DNS, adicionar:
staging.defisats.site    A    3.143.248.70
```

#### Verificar Configuração
```bash
# Verificar DNS
nslookup staging.defisats.site
nslookup defisats.site
```

## Fluxo de Desenvolvimento

### 1. **Criar Feature Branch**
```bash
git checkout -b feature/nova-funcionalidade
# Fazer alterações
git add .
git commit -m "feat: adiciona nova funcionalidade"
git push origin feature/nova-funcionalidade
```

### 2. **Pull Request para Develop**
- Criar PR no GitHub: `feature/nova-funcionalidade` → `develop`
- GitHub Actions executa validações automaticamente
- Merge após aprovação dos testes
- Deploy automático para staging

### 3. **Testes em Staging**
- Acessar `https://staging.defisats.site`
- Testes manuais
- Validação com stakeholders

### 4. **Pull Request para Main**
- Criar PR no GitHub: `develop` → `main`
- Requer aprovação manual
- Deploy manual para produção após merge

## Comandos Úteis

### Verificar Status dos Workflows
```bash
# Listar workflows
gh workflow list

# Ver status de um workflow
gh run list --workflow=staging.yml

# Ver logs de um run específico
gh run view <run-id> --log
```

### Gerenciar Pull Requests
```bash
# Listar PRs abertas
gh pr list

# Ver detalhes de um PR
gh pr view <pr-number>

# Aprovar um PR
gh pr review <pr-number> --approve

# Mergear um PR
gh pr merge <pr-number> --merge
```

### Deploy Manual (se necessário)
```bash
# Staging
ssh -i ~/.ssh/debian.pem ubuntu@defisats.site "cd /home/ubuntu/apps/axisor-staging && ./scripts/deploy-staging-github.sh"

# Produção
ssh -i ~/.ssh/debian.pem ubuntu@defisats.site "cd /home/ubuntu/apps/axisor-production && ./scripts/deploy-production-github.sh"
```

## Troubleshooting

### Workflow Falhou
1. Verificar logs no GitHub Actions
2. Corrigir problemas localmente
3. Fazer novo commit para re-trigger
4. Se necessário, fazer rollback

### Deploy Falhou
1. Verificar logs do servidor
2. Verificar status dos serviços (PM2/Docker)
3. Restaurar backup se necessário
4. Investigar causa raiz

### PR Não Pode Ser Mergeada
1. Verificar se todos os checks passaram
2. Resolver conflitos se houver
3. Atualizar branch com main/develop
4. Solicitar aprovação se necessário

## Monitoramento

### Verificar Status dos Serviços
```bash
# Staging (Docker)
ssh -i ~/.ssh/debian.pem ubuntu@defisats.site "cd /home/ubuntu/apps/axisor-staging && docker compose -f docker-compose.staging.yml ps"

# Produção (PM2)
ssh -i ~/.ssh/debian.pem ubuntu@defisats.site "pm2 status"
```

### Verificar Logs
```bash
# Staging
ssh -i ~/.ssh/debian.pem ubuntu@defisats.site "cd /home/ubuntu/apps/axisor-staging && docker compose -f docker-compose.staging.yml logs -f"

# Produção
ssh -i ~/.ssh/debian.pem ubuntu@defisats.site "pm2 logs"
```

### Health Checks
```bash
# Staging
curl -f https://staging.defisats.site/health

# Produção
curl -f https://defisats.site/health
```

---

**Documento**: Guia de Configuração GitHub Actions  
**Versão**: 1.0.0  
**Data**: 2025-01-20  
**Status**: ✅ Configurado
