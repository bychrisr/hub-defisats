# Configuração de Proteções de Branch

## Configuração Recomendada no GitHub

### Branch `main` (Produção)
- ✅ **Require a pull request before merging**
- ✅ **Require approvals**: 1 (ou mais conforme necessário)
- ✅ **Dismiss stale PR approvals when new commits are pushed**
- ✅ **Require status checks to pass before merging**
  - `test` (backend + frontend)
  - `lint` (backend + frontend)
  - `type-check` (backend + frontend)
  - `security-audit`
  - `build`
- ✅ **Require branches to be up to date before merging**
- ✅ **Require conversation resolution before merging**
- ✅ **Restrict pushes that create files over 100MB**
- ✅ **Require linear history**

### Branch `develop` (Staging)
- ✅ **Require a pull request before merging**
- ✅ **Require status checks to pass before merging**
  - `test` (backend + frontend)
  - `lint` (backend + frontend)
  - `type-check` (backend + frontend)
- ✅ **Require branches to be up to date before merging**
- ✅ **Allow force pushes** (para correções rápidas)

### Branch `staging` (Desenvolvimento)
- ✅ **Require status checks to pass before merging**
- ✅ **Allow force pushes** (para testes)

## Configuração via GitHub CLI

```bash
# Configurar proteção para main
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test","lint","type-check","security-audit","build"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null

# Configurar proteção para develop
gh api repos/:owner/:repo/branches/develop/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test","lint","type-check"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":0}' \
  --field restrictions=null
```

## Workflow de Desenvolvimento

### 1. **Feature Branch**
```bash
# Criar feature branch
git checkout -b feature/nova-funcionalidade

# Fazer commits
git add .
git commit -m "feat: adiciona nova funcionalidade"

# Push para GitHub
git push origin feature/nova-funcionalidade
```

### 2. **Pull Request para Develop**
- Criar PR de `feature/nova-funcionalidade` → `develop`
- GitHub Actions executa validações automaticamente
- Merge automático após aprovação dos testes

### 3. **Deploy para Staging**
- Push para `develop` → Deploy automático para staging
- Testes em ambiente real
- Validação com stakeholders

### 4. **Pull Request para Main**
- Criar PR de `develop` → `main`
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

## Notificações

### Slack/Discord Integration
```yaml
# Adicionar ao final dos workflows
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    channel: '#deployments'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Email Notifications
```yaml
# Adicionar ao final dos workflows
- name: Send email notification
  if: always()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 587
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: "Deploy ${{ job.status }} - ${{ github.repository }}"
    to: admin@defisats.site
    from: GitHub Actions
    body: |
      Deploy status: ${{ job.status }}
      Repository: ${{ github.repository }}
      Commit: ${{ github.sha }}
      Branch: ${{ github.ref }}
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

---

**Documento**: Configuração de Proteções de Branch  
**Versão**: 1.0.0  
**Data**: 2025-01-20  
**Status**: ✅ Configurado
