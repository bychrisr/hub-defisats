# Instruções de Implementação - Proxy Reverso Global

## ✅ Implementação Concluída

A arquitetura de proxy reverso global foi implementada com sucesso! Aqui estão as instruções para colocar em funcionamento:

## 🚀 Passos para Ativação

### 1. Parar a Aplicação Atual
```bash
cd /home/bychrisr/projects/axisor
docker-compose -f docker-compose.prod.yml down
```

### 2. Criar a Rede Proxy (se não existir)
```bash
docker network create proxy-network
```

### 3. Configurar Certificados SSL
```bash
# Copie seus certificados para o diretório do proxy
cp /caminho/para/seu/certificado.crt ~/proxy/certs/defisats.site.crt
cp /caminho/para/sua/chave.key ~/proxy/certs/defisats.site.key

# Ajuste as permissões
chmod 644 ~/proxy/certs/defisats.site.crt
chmod 600 ~/proxy/certs/defisats.site.key
```

### 4. Iniciar o Proxy Global
```bash
cd ~/proxy
./start-proxy.sh start
```

### 5. Iniciar a Aplicação
```bash
cd /home/bychrisr/projects/axisor
docker-compose -f docker-compose.prod.yml up -d
```

### 6. Verificar o Status
```bash
# Verificar proxy global
cd ~/proxy
./start-proxy.sh status

# Verificar aplicação
cd /home/bychrisr/projects/axisor
docker-compose -f docker-compose.prod.yml ps
```

## 🔍 Testes

### Teste de Redirecionamento HTTP→HTTPS
```bash
curl -I http://defisats.site
# Deve retornar: HTTP/1.1 301 Moved Permanently
# Location: https://defisats.site/
```

### Teste de Acesso HTTPS
```bash
curl -I https://defisats.site
# Deve retornar: HTTP/1.1 200 OK
```

### Teste da API
```bash
curl -I https://api.defisats.site/health
# Deve retornar: HTTP/1.1 200 OK
```

## 📁 Estrutura Criada

### Proxy Global (`~/proxy/`)
```
~/proxy/
├── docker-compose.yml      # Container do proxy
├── nginx.conf              # Configuração principal
├── conf.d/
│   └── defisats.conf       # Configuração do DeFiSats
├── certs/                  # Certificados SSL
├── logs/                   # Logs do nginx
├── start-proxy.sh          # Script de gerenciamento
└── README.md               # Documentação
```

### Aplicação (Atualizada)
- `infra/nginx/nginx.conf` - Simplificado (sem SSL)
- `docker-compose.prod.yml` - Conectado à rede proxy
- Documentação atualizada

## 🛠️ Comandos Úteis

### Gerenciar Proxy Global
```bash
cd ~/proxy
./start-proxy.sh start    # Iniciar
./start-proxy.sh stop     # Parar
./start-proxy.sh restart  # Reiniciar
./start-proxy.sh logs     # Ver logs
./start-proxy.sh status   # Ver status
```

### Gerenciar Aplicação
```bash
cd /home/bychrisr/projects/axisor
docker-compose -f docker-compose.prod.yml up -d    # Iniciar
docker-compose -f docker-compose.prod.yml down     # Parar
docker-compose -f docker-compose.prod.yml logs     # Ver logs
```

### Debugging
```bash
# Testar configuração nginx do proxy
docker exec global-nginx-proxy nginx -t

# Recarregar configuração nginx
docker exec global-nginx-proxy nginx -s reload

# Ver logs em tempo real
docker logs -f global-nginx-proxy
```

## 🔧 Configurações Importantes

### Portas
- **Proxy Global**: 80 (HTTP), 443 (HTTPS)
- **Aplicação**: Apenas rede interna (sem portas expostas)

### Redes Docker
- **proxy-network**: Compartilhada entre proxy e aplicações
- **axisor-network**: Rede interna da aplicação

### Domínios Configurados
- `defisats.site` → Frontend
- `www.defisats.site` → Frontend  
- `api.defisats.site` → Backend API

## 🚨 Troubleshooting

### Problema: Container não acessível
**Solução**: Verificar se ambos estão na rede `proxy-network`
```bash
docker network inspect proxy-network
```

### Problema: SSL não funciona
**Solução**: Verificar certificados e permissões
```bash
ls -la ~/proxy/certs/
```

### Problema: Redirecionamento infinito
**Solução**: Verificar configuração de headers
```bash
docker exec global-nginx-proxy nginx -t
```

## 📚 Documentação Adicional

- [Arquitetura do Proxy](../architecture/overview.md)
- [Visão Geral da Arquitetura](../architecture/overview.md)
- [README do Proxy](../architecture/overview.md)

## ✅ Próximos Passos Recomendados

1. **Let's Encrypt**: Implementar renovação automática de certificados
2. **Monitoring**: Adicionar Prometheus/Grafana para monitoramento
3. **Backup**: Configurar backup das configurações do proxy
4. **Logs**: Implementar rotação de logs
5. **Security**: Adicionar WAF (Web Application Firewall)

---

**Status**: ✅ Implementação Concluída  
**Versão**: v0.2.22  
**Data**: 20 de Janeiro de 2025
