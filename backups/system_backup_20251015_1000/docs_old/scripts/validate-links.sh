#!/bin/bash
# Script para validar links em documentos Markdown

echo "🔍 Validando links em documentos Markdown..."

# Função para verificar se um arquivo existe
check_file_exists() {
    local file_path="$1"
    if [ -f "$file_path" ]; then
        echo "✅ $file_path"
        return 0
    else
        echo "❌ $file_path (NÃO ENCONTRADO)"
        return 1
    fi
}

# Função para extrair links de arquivos Markdown
extract_links() {
    local file="$1"
    grep -o '\[.*\]([^)]*\.md)' "$file" 2>/dev/null | sed 's/.*(\(.*\))/\1/' | sort | uniq
}

# Contador de erros
error_count=0

# Verificar links em todos os arquivos .md
find /home/bychrisr/projects/axisor/.system -name "*.md" -type f | while read -r file; do
    echo ""
    echo "📄 Verificando: $file"
    
    # Extrair links do arquivo
    links=$(extract_links "$file")
    
    if [ -n "$links" ]; then
        echo "$links" | while read -r link; do
            # Determinar caminho baseado no arquivo atual
            if [[ "$file" == *"/.system/docs/"* ]]; then
                # Se estamos em .system/docs/, links relativos começam com ../
                if [[ "$link" == "../"* ]]; then
                    target_file="/home/bychrisr/projects/axisor/.system/${link#../}"
                elif [[ "$link" == "./"* ]]; then
                    target_file="$(dirname "$file")/${link#./}"
                else
                    target_file="$(dirname "$file")/$link"
                fi
            else
                # Se estamos em .system/, links relativos são diretos
                if [[ "$link" == "./"* ]]; then
                    target_file="$(dirname "$file")/${link#./}"
                else
                    target_file="$(dirname "$file")/$link"
                fi
            fi
            
            # Verificar se o arquivo existe
            if ! check_file_exists "$target_file"; then
                ((error_count++))
            fi
        done
    else
        echo "ℹ️  Nenhum link encontrado"
    fi
done

echo ""
echo "📊 Resumo da validação:"
if [ $error_count -eq 0 ]; then
    echo "✅ Todos os links estão válidos!"
else
    echo "❌ $error_count links quebrados encontrados"
fi

echo ""
echo "🔗 Links válidos encontrados:"
find /home/bychrisr/projects/axisor/.system -name "*.md" -type f | while read -r file; do
    links=$(extract_links "$file")
    if [ -n "$links" ]; then
        echo "📄 $file:"
        echo "$links" | sed 's/^/  - /'
    fi
done
