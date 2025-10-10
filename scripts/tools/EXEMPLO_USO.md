# 🚀 Exemplo de Uso do Script de Organização

## 📋 Visão Geral

Este documento mostra como usar o script `organize-project.sh` para organizar automaticamente qualquer projeto de software seguindo a estrutura padrão do Axisor.

## 🎯 Casos de Uso

### **1. Organizar Projeto Atual**
```bash
# Organizar o projeto atual (pasta atual)
./scripts/tools/organize-project.sh

# Ou especificar o caminho
./scripts/tools/organize-project.sh /caminho/para/projeto
```

### **2. Organizar Projeto Específico**
```bash
# Organizar projeto em outra pasta
./scripts/tools/organize-project.sh /home/usuario/meu-projeto

# Organizar projeto relativo
./scripts/tools/organize-project.sh ../outro-projeto
```

### **3. Organizar Múltiplos Projetos**
```bash
# Script para organizar múltiplos projetos
for projeto in projeto1 projeto2 projeto3; do
    echo "Organizando $projeto..."
    ./scripts/tools/organize-project.sh "/caminho/$projeto"
done
```

## 📊 Exemplo Prático

### **Antes da Organização**
```
meu-projeto/
├── create-admin.js
├── deploy-prod.sh
├── setup-dev.sh
├── test-local.sh
├── .env.development
├── .env.production
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── debug-production.sh
├── fix-typescript-errors.sh
├── README.md
└── package.json
```

### **Executando o Script**
```bash
./scripts/tools/organize-project.sh meu-projeto
```

### **Saída do Script**
```
==========================================
🗂️  ORGANIZAÇÃO AUTOMÁTICA DE PROJETOS
==========================================

📦 Criando backup do projeto...
✅ Backup criado: meu-projeto-backup-20250115-143022

🏗️ Criando estrutura de pastas...
✅ Estrutura de pastas criada

📁 Organizando scripts...
✅ Scripts organizados

⚙️ Organizando configurações...
✅ Configurações organizadas

🛠️ Organizando ferramentas...
✅ Ferramentas organizadas

📚 Criando documentação...
✅ Documentação criada

🔍 Validando estrutura...
✅ Estrutura validada com sucesso

📊 RESUMO DA ORGANIZAÇÃO
=========================

📁 Scripts organizados: 4
⚙️ Configurações organizadas: 4
🛠️ Ferramentas organizadas: 2
📚 Documentação criada: 3

🎉 Organização concluída com sucesso!
📁 Projeto organizado em: meu-projeto
```

### **Após a Organização**
```
meu-projeto/
├── scripts/
│   ├── admin/
│   │   └── create-admin.js
│   ├── deploy/
│   │   └── deploy-prod.sh
│   ├── dev/
│   │   └── setup-dev.sh
│   └── test/
│       └── test-local.sh
├── config/
│   ├── docker/
│   │   ├── docker-compose.dev.yml
│   │   └── docker-compose.prod.yml
│   └── env/
│       ├── .env.development
│       └── .env.production
├── tools/
│   ├── debug-production.sh
│   └── fix-typescript-errors.sh
├── docs/
│   ├── api/
│   ├── architecture/
│   └── security/
├── README.md
└── package.json
```

## 🔧 Configurações Avançadas

### **Personalizar Categorias de Scripts**
```bash
# Editar o script para adicionar novas categorias
vim scripts/tools/organize-project.sh

# Adicionar nova categoria
mkdir -p "$project_dir/scripts/database"
mv "$project_dir"/*db*.sh "$project_dir/scripts/database/" 2>/dev/null || true
```

### **Personalizar Tipos de Arquivos**
```bash
# Adicionar suporte a arquivos Python
mv "$project_dir"/*.py "$project_dir/scripts/python/" 2>/dev/null || true

# Adicionar suporte a arquivos Go
mv "$project_dir"/*.go "$project_dir/scripts/golang/" 2>/dev/null || true
```

### **Personalizar Estrutura de Pastas**
```bash
# Adicionar pasta para documentação específica
mkdir -p "$project_dir/docs/{api,architecture,security,deployment}"

# Adicionar pasta para testes específicos
mkdir -p "$project_dir/tests/{unit,integration,e2e}"
```

## 🚨 Troubleshooting

### **Problema: Permissão negada**
```bash
# Solução: Dar permissão de execução
chmod +x scripts/tools/organize-project.sh
```

### **Problema: Arquivo não encontrado**
```bash
# Solução: Verificar se o script existe
ls -la scripts/tools/organize-project.sh

# Verificar se está no diretório correto
pwd
```

### **Problema: Backup falhou**
```bash
# Solução: Verificar espaço em disco
df -h

# Verificar permissões
ls -la /caminho/do/projeto
```

### **Problema: Validação falhou**
```bash
# Solução: Verificar estrutura manualmente
find . -type d -name "scripts" -o -name "config" -o -name "docs" -o -name "tools"

# Verificar READMEs
find . -name "README.md"
```

## 📋 Checklist de Uso

### **Antes de Executar**
- [ ] Backup manual do projeto (opcional)
- [ ] Verificar se o script tem permissão de execução
- [ ] Verificar se há espaço suficiente para backup
- [ ] Verificar se o projeto não está em uso

### **Durante a Execução**
- [ ] Acompanhar a saída do script
- [ ] Verificar se não há erros
- [ ] Aguardar conclusão completa

### **Após a Execução**
- [ ] Verificar se a estrutura foi criada
- [ ] Testar scripts movidos
- [ ] Verificar se as configurações funcionam
- [ ] Validar documentação criada

## 🎯 Dicas de Uso

### **1. Teste Primeiro**
```bash
# Testar em um projeto de exemplo
mkdir projeto-teste
cd projeto-teste
# Criar alguns arquivos de teste
touch create-admin.js deploy-prod.sh .env.development
# Executar o script
../scripts/tools/organize-project.sh .
```

### **2. Use Git**
```bash
# Commit antes da organização
git add -A
git commit -m "Backup antes da organização"

# Execute o script
./scripts/tools/organize-project.sh .

# Commit da organização
git add -A
git commit -m "Organização automática do projeto"
```

### **3. Personalize para Seu Projeto**
```bash
# Copiar o script para seu projeto
cp scripts/tools/organize-project.sh meu-projeto/

# Personalizar conforme necessário
vim meu-projeto/organize-project.sh

# Executar
./meu-projeto/organize-project.sh .
```

## 📞 Suporte

Para problemas com o script:
1. Verificar este documento
2. Verificar logs de erro
3. Abrir issue no GitHub
4. Contatar: dev@axisor.com

---

**Última atualização**: 2025-01-15  
**Responsável**: Equipe de Desenvolvimento  
**Versão**: 1.0.0
