# 📸 Sistema de Upload de Imagens - Documentação Completa

## 📋 Visão Geral

Sistema completo de upload de imagens com funcionalidades avançadas de edição, redimensionamento automático e excelente experiência do usuário.

## 🎯 Funcionalidades

### ✨ Frontend (ImageUpload Component)
- **Drag & Drop** - Arraste e solte imagens diretamente
- **Click to Upload** - Clique para selecionar arquivos
- **Image Editor** - Editor integrado com:
  - Zoom in/out com scroll do mouse
  - Rotação (90° à direita/esquerda)
  - Crop manual com área selecionável
  - Preview em tempo real
- **Validação de Arquivos**:
  - Tipos aceitos: JPEG, PNG, WEBP
  - Tamanho máximo: 5MB
  - Validação em tempo real
- **Feedback Visual**:
  - Indicadores de progresso
  - Mensagens de erro/sucesso
  - Preview da imagem processada

### 🔧 Backend (UploadController)
- **Processamento com Sharp**:
  - Redimensionamento automático para 400x400px
  - Compressão JPEG com 90% de qualidade
  - Otimização de performance
- **Armazenamento Seguro**:
  - Diretório: `/uploads/avatars/`
  - Nomes únicos com UUID
  - Estrutura organizada
- **Validação Robusta**:
  - Verificação de tipos MIME
  - Validação de tamanho
  - Sanitização de nomes de arquivo

## 🏗️ Arquitetura

### 📁 Estrutura de Arquivos
```
backend/
├── src/
│   ├── controllers/
│   │   └── upload.controller.ts      # Controller de upload
│   ├── routes/
│   │   └── upload.routes.ts          # Rotas de upload
│   └── index.ts                      # Registro do plugin multipart
├── uploads/
│   └── avatars/                      # Diretório de avatars
└── package.json                      # Dependências (@fastify/multipart, sharp)

frontend/
├── src/
│   ├── components/
│   │   └── ui/
│   │       └── ImageUpload.tsx       # Componente de upload
│   └── pages/
│       └── Profile.tsx               # Integração no perfil
```

### 🔌 APIs Disponíveis

#### `POST /api/upload/avatar`
**Descrição:** Upload de avatar do usuário

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**
```
avatar: <file> (JPEG, PNG, WEBP, max 5MB)
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Avatar atualizado com sucesso",
  "imageUrl": "/uploads/avatars/uuid.png",
  "filename": "uuid.png"
}
```

**Respostas de Erro:**
```json
// 400 - Arquivo inválido
{
  "error": "INVALID_FILE_TYPE",
  "message": "Tipo de arquivo não permitido: image/gif. Apenas image/jpeg, image/png, image/webp são aceitos."
}

// 401 - Não autenticado
{
  "error": "UNAUTHORIZED",
  "message": "Usuário não autenticado"
}

// 500 - Erro interno
{
  "error": "UPLOAD_FAILED",
  "message": "Falha ao fazer upload do avatar."
}
```

## 🚀 Como Usar

### 1. **No Frontend (React)**
```tsx
import { ImageUpload } from '@/components/ui/ImageUpload';

function ProfilePage() {
  const handleImageUpload = async (file: File | null) => {
    if (file) {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const result = await response.json();
      console.log('Upload successful:', result);
    }
  };

  return (
    <ImageUpload
      onImageChange={handleImageUpload}
      currentImage="/path/to/current/image.jpg"
      maxSize={5}
      acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
      className="max-w-md"
    />
  );
}
```

### 2. **Props do Componente ImageUpload**
```typescript
interface ImageUploadProps {
  onImageChange: (file: File | null) => void;
  currentImage?: string;
  maxSize?: number; // MB, default: 5
  acceptedTypes?: string[]; // default: ['image/jpeg', 'image/png', 'image/webp']
  className?: string;
}
```

## ⚙️ Configuração

### Backend Dependencies
```json
{
  "@fastify/multipart": "^8.0.0",
  "sharp": "^0.32.0"
}
```

### Plugin Registration
```typescript
// backend/src/index.ts
import multipart from '@fastify/multipart';

await fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});
```

### Diretório de Uploads
```bash
# Criar diretório de uploads
mkdir -p uploads/avatars
chmod 755 uploads/avatars
```

## 🔒 Segurança

### Validações Implementadas
- ✅ **Autenticação obrigatória** - Token JWT necessário
- ✅ **Validação de tipos MIME** - Apenas imagens permitidas
- ✅ **Limite de tamanho** - Máximo 5MB por arquivo
- ✅ **Nomes únicos** - UUID para evitar conflitos
- ✅ **Sanitização** - Remoção de caracteres perigosos
- ✅ **Processamento seguro** - Sharp para redimensionamento

### Recomendações Adicionais
- 🔄 **Rate limiting** - Implementar limite de uploads por usuário
- 🗑️ **Limpeza automática** - Remover arquivos órfãos periodicamente
- 📊 **Logs de auditoria** - Registrar tentativas de upload
- 🛡️ **Scan de malware** - Verificar arquivos suspeitos

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. **"Erro ao fazer upload da imagem"**
**Causa:** Plugin @fastify/multipart não registrado
**Solução:**
```bash
# Verificar se o plugin está registrado
docker logs axisor-backend | grep "multipart"

# Reiniciar backend se necessário
docker restart axisor-backend
```

#### 2. **"Tipo de arquivo não permitido"**
**Causa:** Arquivo não é JPEG, PNG ou WEBP
**Solução:** Converter imagem para formato suportado

#### 3. **"Arquivo muito grande"**
**Causa:** Arquivo excede 5MB
**Solução:** Reduzir tamanho da imagem

#### 4. **"Usuário não autenticado"**
**Causa:** Token JWT inválido ou expirado
**Solução:** Fazer login novamente

### Logs de Debug
```bash
# Verificar logs do backend
docker logs axisor-backend --tail 50

# Verificar logs de upload
docker logs axisor-backend | grep -i upload

# Verificar arquivos de upload
ls -la backend/uploads/avatars/
```

## 📊 Performance

### Otimizações Implementadas
- **Redimensionamento automático** - 400x400px para consistência
- **Compressão JPEG** - 90% qualidade para balancear tamanho/qualidade
- **Processamento assíncrono** - Não bloqueia a thread principal
- **Validação rápida** - Verificações de tipo MIME antes do processamento

### Métricas Esperadas
- **Tamanho médio de arquivo:** ~50-100KB (após processamento)
- **Tempo de upload:** <2s para imagens <1MB
- **Tempo de processamento:** <1s para redimensionamento
- **Taxa de sucesso:** >99% para arquivos válidos

## 🔄 Manutenção

### Limpeza de Arquivos
```bash
# Remover arquivos órfãos (não referenciados no banco)
find backend/uploads/avatars/ -type f -mtime +30 -delete

# Verificar uso de disco
du -sh backend/uploads/avatars/
```

### Backup
```bash
# Backup dos avatars
tar -czf avatars-backup-$(date +%Y%m%d).tar.gz backend/uploads/avatars/

# Restaurar backup
tar -xzf avatars-backup-YYYYMMDD.tar.gz
```

## 🚀 Próximas Melhorias

### Funcionalidades Planejadas
- [ ] **Upload múltiplo** - Suporte a várias imagens
- [ ] **Filtros de imagem** - Aplicar filtros automáticos
- [ ] **CDN Integration** - Servir imagens via CDN
- [ ] **WebP automático** - Conversão automática para WebP
- [ ] **Thumbnails** - Geração de miniaturas
- [ ] **Watermark** - Adicionar marca d'água
- [ ] **OCR** - Extração de texto de imagens
- [ ] **Moderação** - Detecção automática de conteúdo inapropriado

### Otimizações Técnicas
- [ ] **Streaming upload** - Upload em chunks para arquivos grandes
- [ ] **Progress tracking** - Barra de progresso em tempo real
- [ ] **Retry mechanism** - Tentativas automáticas em caso de falha
- [ ] **Caching** - Cache de imagens processadas
- [ ] **Compression levels** - Diferentes níveis de compressão

## 📝 Changelog

### v1.0.0 (2025-09-22)
- ✅ Implementação inicial do sistema de upload
- ✅ Componente ImageUpload com editor integrado
- ✅ Backend com Sharp para processamento
- ✅ Validação completa de arquivos
- ✅ Integração com sistema de perfil
- ✅ Documentação completa

---

## 👥 Contribuição

Para contribuir com melhorias no sistema de upload:

1. **Fork** o repositório
2. **Crie** uma branch para sua feature
3. **Implemente** as melhorias
4. **Teste** thoroughly
5. **Documente** as mudanças
6. **Submeta** um Pull Request

## 📞 Suporte

Para dúvidas ou problemas:
- 📧 **Email:** dev@axisor.com
- 💬 **Discord:** #support
- 📋 **Issues:** GitHub Issues
- 📚 **Docs:** Esta documentação

---

**Sistema de Upload de Imagens v1.0.0**  
*Desenvolvido com ❤️ para Hub DeFiSATS*
