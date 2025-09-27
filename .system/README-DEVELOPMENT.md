# Hub DefiSATS - Guia de Desenvolvimento

## 🚀 Início Rápido

### Pré-requisitos
- Docker e Docker Compose instalados
- Node.js 20+ (para desenvolvimento local)
- Git

### Configuração do Ambiente

1. **Clone o repositório**
```bash
git clone <repository-url>
cd hub-defisats
```

2. **Configure as variáveis de ambiente**
```bash
cp config/env/env.production.example config/env/env.production
# Edite o arquivo com suas configurações
```

3. **Inicie o ambiente de desenvolvimento**
```bash
docker compose -f config/docker/docker-compose.dev.yml up -d
```

4. **Crie um usuário superadmin**
```bash
docker exec hub-defisats-backend npx tsx scripts/create-superadmin.ts
```

5. **Acesse a aplicação**
- Frontend: http://localhost:13000
- Backend: http://localhost:13010
- Admin: http://localhost:13000/admin (após login como superadmin)

## 🏗️ Arquitetura

### Backend
- **Framework**: Fastify
- **Database**: PostgreSQL
- **Cache**: Redis
- **ORM**: Prisma
- **Porta**: 13010

### Frontend
- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Porta**: 13000

### Serviços
- **PostgreSQL**: Porta 15432
- **Redis**: Porta 16379

## 🔧 Comandos Úteis

### Docker Compose
```bash
# Iniciar ambiente
docker compose -f config/docker/docker-compose.dev.yml up -d

# Parar ambiente
docker compose -f config/docker/docker-compose.dev.yml down

# Reconstruir containers
docker compose -f config/docker/docker-compose.dev.yml build --no-cache

# Ver logs
docker compose -f config/docker/docker-compose.dev.yml logs -f backend
docker compose -f config/docker/docker-compose.dev.yml logs -f frontend

# Verificar status
docker compose -f config/docker/docker-compose.dev.yml ps
```

### Backend
```bash
# Executar no container
docker exec -it hub-defisats-backend sh

# Instalar dependências
docker exec hub-defisats-backend npm install

# Executar migrações
docker exec hub-defisats-backend npx prisma migrate dev

# Gerar cliente Prisma
docker exec hub-defisats-backend npx prisma generate

# Executar testes
docker exec hub-defisats-backend npm test
```

### Frontend
```bash
# Executar no container
docker exec -it hub-defisats-frontend sh

# Instalar dependências
docker exec hub-defisats-frontend npm install

# Executar testes
docker exec hub-defisats-frontend npm test
```

## 🔐 Autenticação e Autorização

### Usuário Superadmin
- **Email**: admin@defisats.com
- **Senha**: Admin123!
- **Role**: superadmin

### Estrutura de Usuários
```typescript
// Tabela User
interface User {
  id: string;
  email: string;
  username: string;
  plan_type: 'free' | 'basic' | 'advanced' | 'pro' | 'lifetime';
  is_active: boolean;
  email_verified: boolean;
  created_at: Date;
  last_activity_at: Date;
}

// Tabela AdminUser
interface AdminUser {
  id: string;
  user_id: string;
  role: 'superadmin' | 'admin' | 'moderator';
  created_at: Date;
}
```

### Campos de Resposta
- **Login**: Retorna `is_admin: boolean`
- **Perfil**: Retorna `is_admin: boolean` e `admin_role: string`

## 📊 Sistema de Monitoramento

### Endpoints Disponíveis
- `GET /api/admin/monitoring` - Resumo geral
- `GET /api/admin/monitoring/metrics/realtime` - Métricas em tempo real
- `GET /api/admin/monitoring/services/health` - Saúde dos serviços
- `GET /api/admin/monitoring/performance` - Métricas de performance
- `GET /api/admin/monitoring/alerts` - Lista de alertas
- `POST /api/admin/monitoring/alerts/{id}/resolve` - Resolver alerta

### Acesso
- Requer autenticação JWT
- Requer role `superadmin`
- Middleware: `superAdminMiddleware`

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Container não inicia
```bash
# Verificar logs
docker compose -f config/docker/docker-compose.dev.yml logs

# Verificar se as portas estão livres
netstat -tulpn | grep :13000
netstat -tulpn | grep :13010
```

#### 2. Erro de conexão com banco
```bash
# Verificar se o PostgreSQL está rodando
docker compose -f config/docker/docker-compose.dev.yml ps postgres

# Verificar logs do PostgreSQL
docker compose -f config/docker/docker-compose.dev.yml logs postgres
```

#### 3. Erro de autenticação
```bash
# Verificar se o usuário admin existe
docker exec hub-defisats-backend npx tsx scripts/check-admin-user.ts

# Criar usuário admin
docker exec hub-defisats-backend npx tsx scripts/create-superadmin.ts
```

#### 4. Campo is_admin não retornado
```bash
# Verificar logs do backend
docker compose -f config/docker/docker-compose.dev.yml logs backend | grep "AUTH SERVICE"

# Testar endpoint de perfil
curl -X GET "http://localhost:13010/api/profile" \
  -H "Authorization: Bearer <token>"
```

### Logs de Debug

#### Backend
```typescript
// AuthService
console.log('🔍 AUTH SERVICE - Checking admin status for user:', user.id);
console.log('✅ AUTH SERVICE - Admin user found:', adminUser);
console.log('✅ AUTH SERVICE - Is admin:', !!adminUser);

// ProfileController
console.log('🔍 PROFILE - Fetching profile for user:', user?.id);
console.log('✅ PROFILE - Profile fetched successfully');
```

#### Frontend
```typescript
// Monitoring
console.log('🔍 MONITORING - Fetching monitoring data...');
console.log('✅ MONITORING - Data received:', response.data);

// Auth
console.log('🔍 AUTH - Login result:', result);
console.log('✅ AUTH - User is admin:', result.is_admin);
```

## 🧪 Testes

### Testes de API
```bash
# Testar login
curl -X POST "http://localhost:13010/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@defisats.com", "password": "Admin123!"}'

# Testar perfil
curl -X GET "http://localhost:13010/api/profile" \
  -H "Authorization: Bearer <token>"

# Testar monitoramento
curl -X GET "http://localhost:13010/api/admin/monitoring" \
  -H "Authorization: Bearer <token>"
```

### Testes de Frontend
```bash
# Executar testes
docker exec hub-defisats-frontend npm test

# Executar testes com coverage
docker exec hub-defisats-frontend npm run test:coverage
```

## 📝 Scripts Úteis

### Criar Superadmin
```bash
docker exec hub-defisats-backend npx tsx scripts/create-superadmin.ts
```

### Verificar Usuário Admin
```bash
docker exec hub-defisats-backend npx tsx scripts/check-admin-user.ts
```

### Testar Perfil
```bash
docker exec hub-defisats-backend npx tsx scripts/test-profile.ts
```

### Testar Controller
```bash
docker exec hub-defisats-backend npx tsx scripts/test-profile-controller.ts
```

## 🔄 Fluxo de Desenvolvimento

1. **Fazer mudanças no código**
2. **Reconstruir containers se necessário**
   ```bash
   docker compose -f config/docker/docker-compose.dev.yml build --no-cache
   ```
3. **Reiniciar containers**
   ```bash
   docker compose -f config/docker/docker-compose.dev.yml up -d
   ```
4. **Testar mudanças**
5. **Fazer commit**
   ```bash
   git add .
   git commit -m "feat: descrição das mudanças"
   ```

## 📚 Documentação

- [Sistema de Monitoramento](docs/MONITORING_SYSTEM.md)
- [Melhorias de UI/UX](docs/UI_UX_ENHANCEMENTS.md)
- [API de Admin](backend/docs/ADMIN_API.md)

## 🤝 Contribuição

1. Fork o repositório
2. Crie uma branch para sua feature
3. Faça suas mudanças
4. Teste localmente
5. Faça commit e push
6. Abra um Pull Request

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs dos containers
2. Consulte a documentação
3. Verifique os issues do repositório
4. Abra uma nova issue se necessário