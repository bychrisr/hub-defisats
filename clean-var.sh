#!/bin/bash

# Script para limpar o diretório /var e liberar espaço em disco
# Desenvolvido para o projeto hub-defisats
# Uso: sudo ./clean-var.sh

set -e

echo "🧹 Iniciando limpeza do diretório /var..."

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Este script deve ser executado como root (sudo)"
    exit 1
fi

# Mostrar espaço antes da limpeza
echo "📊 Espaço em disco antes da limpeza:"
df -h /var

echo ""
echo "🔍 Verificando tamanho dos diretórios em /var..."

# Verificar tamanho dos principais diretórios
du -sh /var/log/* 2>/dev/null | sort -hr | head -10
du -sh /var/cache/* 2>/dev/null | sort -hr | head -10
du -sh /var/lib/* 2>/dev/null | sort -hr | head -10

echo ""
echo "🧹 Iniciando limpeza..."

# 1. Limpar logs antigos (manter apenas últimos 7 dias)
echo "📝 Limpando logs antigos..."
find /var/log -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
find /var/log -name "*.gz" -type f -mtime +30 -delete 2>/dev/null || true
find /var/log -name "*.1" -type f -mtime +30 -delete 2>/dev/null || true

# 2. Limpar cache do apt
echo "📦 Limpando cache do apt..."
apt-get clean 2>/dev/null || true
apt-get autoclean 2>/dev/null || true

# 3. Limpar cache do snap
echo "📦 Limpando cache do snap..."
rm -rf /var/cache/snapd/* 2>/dev/null || true

# 4. Limpar cache do pip
echo "🐍 Limpando cache do pip..."
rm -rf /var/cache/pip/* 2>/dev/null || true

# 5. Limpar cache do npm
echo "📦 Limpando cache do npm..."
rm -rf /var/cache/npm/* 2>/dev/null || true

# 6. Limpar cache do Docker (se existir)
echo "🐳 Limpando cache do Docker..."
docker system prune -f 2>/dev/null || true

# 7. Limpar arquivos temporários
echo "🗑️ Limpando arquivos temporários..."
find /var/tmp -type f -mtime +7 -delete 2>/dev/null || true
find /tmp -type f -mtime +7 -delete 2>/dev/null || true

# 8. Limpar logs do journald (manter apenas últimos 3 dias)
echo "📰 Limpando logs do journald..."
journalctl --vacuum-time=3d 2>/dev/null || true

# 9. Limpar cache do systemd
echo "⚙️ Limpando cache do systemd..."
systemd-tmpfiles --clean 2>/dev/null || true

# 10. Limpar cache do fontconfig
echo "🔤 Limpando cache do fontconfig..."
rm -rf /var/cache/fontconfig/* 2>/dev/null || true

# 11. Limpar cache do man
echo "📚 Limpando cache do man..."
rm -rf /var/cache/man/* 2>/dev/null || true

# 12. Limpar cache do ldconfig
echo "🔗 Limpando cache do ldconfig..."
rm -f /var/cache/ldconfig/aux-cache 2>/dev/null || true

# 13. Limpar logs do Docker (se existir)
echo "🐳 Limpando logs do Docker..."
if [ -d "/var/lib/docker" ]; then
    find /var/lib/docker -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
fi

# 14. Limpar logs do containerd (se existir)
echo "📦 Limpando logs do containerd..."
if [ -d "/var/log/containers" ]; then
    find /var/log/containers -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
fi

# 15. Limpar logs do kubelet (se existir)
echo "☸️ Limpando logs do kubelet..."
if [ -d "/var/log/pods" ]; then
    find /var/log/pods -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
fi

echo ""
echo "📊 Espaço em disco após a limpeza:"
df -h /var

echo ""
echo "✅ Limpeza concluída!"
echo "💡 Dica: Execute este script regularmente para manter o sistema limpo"
echo "🔄 Para executar novamente: sudo ./clean-var.sh"
