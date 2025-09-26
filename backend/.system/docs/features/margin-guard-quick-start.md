# 🚀 Margin Guard - Guia de Configuração Rápida

## ⚡ Configuração em 5 Minutos

### 1. Acesse a Página de Automações
- Faça login na plataforma
- Navegue para **Automações** no menu
- Localize a seção **Margin Guard**

### 2. Configure os Parâmetros

#### 🎯 Configuração Básica (Recomendada)
```
✅ Ativar Margin Guard: SIM
📊 Threshold de Margem: 90%
🎯 Ação: Aumentar Distância de Liquidação
📏 Nova Distância: 25%
```

#### ⚙️ Configuração Avançada
```
✅ Ativar Margin Guard: SIM
📊 Threshold de Margem: 85%
🎯 Ação: Fechar Posição
📏 Redução: 50% (apenas se ação = reduzir)
💰 Margem Adicional: 1000 sats (apenas se ação = adicionar)
```

### 3. Salve a Configuração
- Clique em **"Salvar Configurações"**
- Aguarde a confirmação de sucesso
- Verifique se o status mostra **"Ativo"**

### 4. Verifique o Funcionamento
- O Margin Guard inicia automaticamente
- Monitora suas posições a cada 20 segundos
- Logs detalhados são gerados no backend

---

## 🎯 Configurações Recomendadas por Perfil

### 🟢 Conservador
```
Threshold: 95%
Ação: Aumentar Distância de Liquidação
Nova Distância: 30%
```
**Ideal para**: Traders que preferem máxima proteção

### 🟡 Moderado
```
Threshold: 85%
Ação: Reduzir Posição
Redução: 50%
```
**Ideal para**: Traders que querem proteção sem fechar completamente

### 🔴 Agressivo
```
Threshold: 75%
Ação: Fechar Posição
```
**Ideal para**: Traders experientes que querem ação rápida

---

## ⚠️ Ações Disponíveis

### 1. 🛑 Fechar Posição
- **O que faz**: Fecha completamente a posição
- **Quando usar**: Máxima proteção, sem margem para erro
- **Risco**: Perda total da posição

### 2. 📉 Reduzir Posição
- **O que faz**: Reduz o tamanho da posição em %
- **Quando usar**: Quer manter parte da posição
- **Risco**: Ainda pode ser liquidado se mercado continuar contra

### 3. 💰 Adicionar Margem
- **O que faz**: Adiciona sats à margem da posição
- **Quando usar**: Acredita que mercado vai reverter
- **Risco**: Pode perder mais capital

### 4. 📏 Aumentar Distância de Liquidação
- **O que faz**: Move o preço de liquidação para mais longe
- **Quando usar**: Quer mais tempo para a posição se recuperar
- **Risco**: Pode ser liquidado em preço pior

---

## 🔍 Monitoramento

### Como Verificar se Está Funcionando

1. **Logs do Sistema**
```bash
docker logs hub-defisats-backend | grep "MARGIN GUARD"
```

2. **Status na Interface**
- Página de Automações mostra status "Ativo"
- Configurações são carregadas corretamente
- Botão "Salvar" funciona sem erros

3. **Teste Manual**
- Configure threshold baixo (ex: 50%)
- Abra uma posição pequena
- Aguarde o alerta (pode levar até 20s)

---

## 🚨 Alertas e Notificações

### Tipos de Alertas

#### ⚠️ Warning (80% do threshold)
- Margem se aproximando do limite
- Apenas notificação, sem ação

#### 🚨 Critical (100% do threshold)
- Margem atingiu o limite
- Ação configurada é executada
- Notificação de execução enviada

### Exemplo de Alerta
```
🚨 MARGIN CRITICAL: Trade BTC-USD
📊 Margem: 89.5% (limite: 90%)
🎯 Ação: Aumentar distância para 25%
✅ Executado com sucesso
```

---

## 🔧 Troubleshooting Rápido

### ❌ "Mudanças não salvas"
**Solução**: 
1. Recarregue a página
2. Configure novamente
3. Clique em "Salvar"

### ❌ "Configuração não carrega"
**Solução**:
1. Verifique conexão com internet
2. Faça logout e login novamente
3. Limpe cache do navegador

### ❌ "Worker não está rodando"
**Solução**:
1. Verifique se backend está online
2. Reinicie o container: `docker restart hub-defisats-backend`
3. Aguarde 30 segundos

### ❌ "Credenciais LN Markets inválidas"
**Solução**:
1. Vá para Perfil > Credenciais
2. Reconfigure as credenciais LN Markets
3. Teste a conexão

---

## 📊 Exemplos Práticos

### Exemplo 1: Proteção Básica
```
Posição: 0.1 BTC long
Margem: 1000 sats
Preço de liquidação: 50,000
Threshold: 90%

Quando BTC cair para ~51,000:
- Margin Guard detecta margem crítica
- Executa ação configurada
- Protege seu capital
```

### Exemplo 2: Gestão de Risco
```
Posição: 0.5 BTC short
Margem: 5000 sats
Preço de liquidação: 70,000
Threshold: 85%
Ação: Reduzir 50%

Quando BTC subir para ~68,000:
- Margin Guard reduz posição para 0.25 BTC
- Mantém parte da posição
- Reduz risco de liquidação
```

---

## 🎯 Dicas de Uso

### ✅ Boas Práticas
- Configure threshold conservador (85-95%)
- Teste com posições pequenas primeiro
- Monitore os logs regularmente
- Mantenha credenciais atualizadas

### ❌ Evite
- Threshold muito baixo (< 70%)
- Ações muito agressivas
- Ignorar alertas de warning
- Usar sem entender as ações

---

## 📞 Suporte

### Precisa de Ajuda?
- **Discord**: [Link do servidor]
- **Email**: suporte@hubdefisats.com
- **GitHub**: [Link do repositório]

### Informações para Suporte
- ID do usuário
- Configuração atual
- Logs de erro (se houver)
- Descrição do problema

---

## 🏆 Conclusão

O Margin Guard é sua proteção automática contra liquidações. Com configuração simples e monitoramento contínuo, você pode negociar com mais confiança sabendo que seu capital está protegido.

**Lembre-se**: O Margin Guard é uma ferramenta de proteção, não uma garantia de lucro. Use sempre com responsabilidade e dentro de sua tolerância ao risco.

---

*Configuração recomendada para iniciantes: Threshold 90%, Ação "Aumentar Distância", Nova Distância 25%*
