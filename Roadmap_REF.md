### **Roadmap Refatoração: Integração com API da LN Markets**

**Objetivo:** Reestruturar a camada de comunicação com a API da LN Markets para torná-la mais segura, escalável e preparada para futuras integrações de corretoras.

**Status Atual:** A autenticação foi corrigida (base64, path com /v2), mas a estrutura do código é complexa e não preparada para múltiplas corretoras.

**Stack Técnica:** Node.js, Fastify, TypeScript, Docker Compose, PostgreSQL (Prisma), Redis (opcional para cache).

---

#### **Fase 1: Preparação e Definição de Estrutura (1-2 dias)**

*   **Tarefa 1.1: Centralizar URLs e Endpoints em Variáveis de Ambiente e Constantes**
    *   **Subtarefa 1.1.1:** Criar variáveis de ambiente para URLs base da API da LN Markets (`LN_MARKETS_API_BASE_URL`, `LN_MARKETS_API_BASE_URL_TESTNET`, `LN_MARKETS_API_BASE_URL_CURRENT`).
    *   **Subtarefa 1.1.2:** Criar arquivo `backend/src/config/lnmarkets-endpoints.ts` para centralizar todos os caminhos de endpoints da LN Markets (ex: `futures: '/futures'`, `futuresTicker: '/futures/btc_usd/ticker'`, etc.). Utilizar `as const` e `keyof` para tipagem.
    *   **Arquivos Impactados:** `.env`, `backend/src/config/lnmarkets-endpoints.ts`.
    *   **Validação:** Confirmar que as URLs e caminhos estão definidos e são acessíveis.

*   **Tarefa 1.2: Definir Interface Genérica para Integração com Corretoras**
    *   **Subtarefa 1.2.1:** Criar interface `ExchangeApiService` em `backend/src/services/ExchangeApiService.interface.ts`. Definir métodos genéricos (ex: `getTicker`, `getPositions`, `placeOrder`, `closePosition`).
    *   **Arquivos Impactados:** `backend/src/services/ExchangeApiService.interface.ts`.
    *   **Validação:** Interface definida com os métodos essenciais identificados.

*   **Tarefa 1.3: Planejar Estrutura de Serviços Específicos**
    *   **Subtarefa 1.3.1:** Planejar a estrutura do `LNMarketsApiService` para implementar a interface `ExchangeApiService`.
    *   **Subtarefa 1.3.2:** Planejar como as credenciais do usuário serão injetadas ou buscadas (provavelmente via construtor ou método de inicialização).
    *   **Validação:** Estrutura lógica planejada.

---

#### **Fase 2: Implementação do Serviço Base para LN Markets (2-3 dias)**

*   **Tarefa 2.1: Criar Serviço Base para LN Markets**
    *   **Subtarefa 2.1.1:** Criar classe `LNMarketsApiService` em `backend/src/services/LNMarketsApiService.ts`.
    *   **Subtarefa 2.1.2:** Implementar o construtor para receber `credentials` (apiKey, apiSecret, passphrase) e armazenar a `baseUrl` (da variável de ambiente).
    *   **Subtarefa 2.1.3:** Criar método privado `makeAuthenticatedRequest` que:
        *   Recebe configurações do Axios (method, url, params, data).
        *   Constroi a string de assinatura correta: `method + '/v2' + url + timestamp + paramsStringOrDataString`.
        *   Calcula a assinatura com `crypto.createHmac('sha256', apiSecret).digest('base64')`.
        *   Adiciona headers de autenticação (`LNM-ACCESS-*`).
        *   Faz a requisição com Axios e trata erros (API, rede, configuração).
    *   **Arquivos Impactados:** `backend/src/services/LNMarketsApiService.ts`.
    *   **Validação:** Método `makeAuthenticatedRequest` implementado corretamente com base nas correções de autenticação anteriores.

*   **Tarefa 2.2: Implementar Métodos Específicos da LN Markets**
    *   **Subtarefa 2.2.1:** Implementar métodos como `getTicker`, `getPositions`, `closePosition`, `placeOrder`, etc., dentro de `LNMarketsApiService`, chamando `makeAuthenticatedRequest` com os endpoints corretos (usando as constantes de `lnmarkets-endpoints.ts`).
    *   **Subtarefa 2.2.2:** Definir tipos TypeScript para as respostas da LN Markets (opcional, mas recomendado para segurança).
    *   **Arquivos Impactados:** `backend/src/services/LNMarketsApiService.ts`.
    *   **Validação:** Métodos específicos chamam `makeAuthenticatedRequest` com os parâmetros corretos.

*   **Tarefa 2.3: Implementar Testes Unitários para o Serviço**
    *   **Subtarefa 2.3.1:** Criar testes para `makeAuthenticatedRequest`, mockando `crypto` e `axios` para verificar a geração da string de assinatura e o envio dos headers corretos.
    *   **Subtarefa 2.3.2:** Criar testes para os métodos específicos (ex: `getPositions`), mockando `makeAuthenticatedRequest` para verificar a chamada com os endpoints e parâmetros corretos.
    *   **Arquivos Impactados:** `backend/src/services/__tests__/LNMarketsApiService.test.ts` (ou similar).
    *   **Validação:** Testes unitários cobrem a lógica crítica do serviço.

---

#### **Fase 3: Atualização dos Controladores e Rotas (1-2 dias)**

*   **Tarefa 3.1: Atualizar Rotas para Usar o Novo Serviço**
    *   **Subtarefa 3.1.1:** Identificar rotas que fazem chamadas à API da LN Markets (ex: `lnmarketsUserRoutes.ts`, `lnmarketsMarketRoutes.ts`, `dashboard-optimized.routes.ts`).
    *   **Subtarefa 3.1.2:** Modificar essas rotas para instanciar `LNMarketsApiService` com as credenciais do usuário (buscadas do banco de dados via Prisma).
    *   **Subtarefa 3.1.3:** Chamar os métodos específicos do serviço (`service.getPositions`, `service.getTicker`, etc.) em vez de chamadas diretas ao antigo serviço.
    *   **Subtarefa 3.1.4:** Tratar erros retornados pelo serviço e propagá-los ou retornar respostas HTTP apropriadas.
    *   **Arquivos Impactados:** `backend/src/routes/*.ts`.
    *   **Validação:** Rotas chamam o novo serviço e retornam dados corretamente.

*   **Tarefa 3.2: Simplificar Estrutura de Rotas (Opcional, se aplicável)**
    *   **Subtarefa 3.2.1:** Verificar se há rotas duplicadas ou conflitantes e removê-las ou consolidá-las.
    *   **Subtarefa 3.2.2:** Garantir que a ordem de registro das rotas no `index.ts` esteja correta (específicas antes de genéricas).
    *   **Validação:** Estrutura de rotas é limpa e funcional.

---

#### **Fase 4: Preparação para Futuras Integrações (1 dia)**

*   **Tarefa 4.1: Criar Fábrica de Serviços (Factory Pattern)**
    *   **Subtarefa 4.1.1:** Criar classe `ExchangeServiceFactory` em `backend/src/services/ExchangeServiceFactory.ts`.
    *   **Subtarefa 4.1.2:** Implementar método `createService(exchangeName, credentials)` que retorna a instância correta do serviço (ex: `new LNMarketsApiService(credentials)`).
    *   **Arquivos Impactados:** `backend/src/services/ExchangeServiceFactory.ts`.
    *   **Validação:** Fábrica pode instanciar corretamente o serviço da LN Markets.

*   **Tarefa 4.2: Atualizar Controladores para Usar a Fábrica (Opcional para esta fase)**
    *   **Subtarefa 4.2.1:** Modificar rotas para usar `ExchangeServiceFactory.createService('LNMarkets', credentials)` em vez de instanciar `LNMarketsApiService` diretamente.
    *   **Validação:** Funcionalidade é mantida, mas com abstração preparada para novas corretoras.

---

#### **Fase 5: Testes e Validação (1 dia)**

*   **Tarefa 5.1: Testes de Integração**
    *   **Subtarefa 5.1.1:** Testar fluxos completos (ex: Login -> Dashboard -> Carregar Posições) para garantir que tudo funciona com o novo serviço.
    *   **Subtarefa 5.1.2:** Verificar logs para confirmar que a nova lógica está sendo executada.
    *   **Validação:** Funcionalidade crítica está operacional.

*   **Tarefa 5.2: Atualização da Documentação**
    *   **Subtarefa 5.2.1:** Atualizar `.system/CHANGELOG.md` com as mudanças.
    *   **Subtarefa 5.2.2:** Atualizar `.system/DECISIONS.md` se novas decisões arquiteturais forem tomadas.
    *   **Subtarefa 5.2.3:** Atualizar `.system/ANALYSIS.md` ou criar novos documentos em `.system/docs/` para documentar a nova estrutura.
    *   **Validação:** Documentação está sincronizada com o código.

---

#### **Fase 6: Deploy e Monitoramento (0.5 dias)**

*   **Tarefa 6.1: Deploy em Ambiente de Teste**
    *   **Subtarefa 6.1.1:** Fazer deploy das mudanças em um ambiente de teste.
    *   **Subtarefa 6.1.2:** Realizar testes manuais e automatizados.
    *   **Validação:** Sistema estável no ambiente de teste.

*   **Tarefa 6.2: Monitoramento**
    *   **Subtarefa 6.2.1:** Verificar logs e métricas após o deploy.
    *   **Validação:** Novo serviço está operando conforme esperado.

---

**Critérios de Sucesso:**

*   A autenticação com a LN Markets continua funcional.
*   Os dados (posições, ticker, etc.) são carregados corretamente.
*   O código está mais modular, com responsabilidades bem definidas.
*   Variáveis de ambiente e constantes centralizadas estão em uso.
*   A estrutura está pronta para adicionar novas corretoras.
*   Testes cobrem a lógica crítica.
*   Documentação está atualizada.

---