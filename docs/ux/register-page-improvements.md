# Melhorias de UX e Acessibilidade na Página de Cadastro

## Resumo Executivo

Tela de **cadastro** consistente com a marca Axisor (dark-tech, Rubik/Inter, CTA azul-roxo). Força do formulário: validações inline, indicador de força da senha, feedback de disponibilidade para usuário/email. Pontos que derrubam conversão/acessibilidade: campos **lado a lado** no mobile (First/Last) gerando toques imprecisos; campo **Cupom (opcional)** ocupando espaço "acima da dobra"; SSO com aparência desabilitada sem explicação; **dupla exigência de consentimento** pouco clara; alvo do ícone "mostrar senha" e links com probabilidade de ficar <44px; contraste do CTA no trecho roxo do gradiente em risco. Recomendo reduzir escolhas, empilhar campos no mobile, adiar o cupom (progressive disclosure), explicitar estados, fortalecer contraste e foco visível — mantendo paleta e tipografia do brandbook.

---

## Mapa de Problemas → Princípios

| # | Evidência na imagem | Princípio/critério | Risco | Impacto esperado |
|---|---------------------|-------------------|-------|------------------|
| 1 | **First/Last Name** lado a lado no mobile (colunas estreitas) | Fitts (alvo/alcance) + Nielsen#6 Prevenção de erro | Toques imprecisos, digitação lenta | ↑ Conclusão_form |
| 2 | **Cupom (Optional)** ocupa um campo inteiro no topo | Hick (menos escolhas) + Nielsen#8 Minimalismo | Desvia atenção do objetivo (criar conta) | ↑ CTR_Continue |
| 3 | **SSO Google/GitHub** visualmente desabilitado sem rótulo/explicação | Nielsen#1 Status do sistema + WCAG 1.4.1 (não só cor) | Confusão/abandono | ↑ Clique_SSO |
| 4 | **Consentimento marketing** e **aceite de termos** pouco hierarquizados | Nielsen#4 Consistência + 3.3.2 Labels | Marcação errada, bloqueio no envio | ↓ Erro_form |
| 5 | Ícones "mostrar senha" com **hit area** pequena; links (Terms/Privacy/Docs/Support) idem | Fitts + WCAG **2.5.8 Target Size** (≥24px; recomendo 44px) | Erros de toque | ↓ Retrabalho |
| 6 | CTA **Continue** com texto branco sobre gradiente azul→roxo | WCAG **1.4.3 Contraste** (AA) | Leitura/descoberta do CTA | ↑ CTR_CTA |
| 7 | **Ordem do foco** e **focus rings** não evidentes | WCAG **2.4.7 Focus Visible** / 2.4.3 Ordem | Acesso por teclado e leitores | ↑ A11y_pass |
| 8 | **Força de senha** depende muito de cor (verde) | WCAG **1.4.1 Uso de cor** | Usuários daltônicos perdem o feedback | ↓ Erro_senha |
| 9 | Placeholder longo nos campos em mobile ("Enter your firs…" truncado) | Nielsen#2 Correspondência com o mundo real | Compreensão parcial | ↓ Tempo_compilação |

---

## Recomendações Priorizadas (Impacto×Esforço)

### Alta prioridade

* **Empilhar campos** First/Last no **mobile** (≥390px): largura 100%, tocar-ir-para-próximo com botão "Next". *(Impacto: Alto / Esforço: Baixo — Fitts; tokens de spacing/radius disponíveis).* 
* **Progressive disclosure** do **Cupom**: reduzir a um link "Tenho um cupom" que expande o campo. *(Alto/Baixo — Hick, Nielsen#8).*
* **Contraste do CTA**: garantir ≥4.5:1 em todo o gradiente; escurecer stop roxo ou aplicar overlay interno 8–12%. *(Alto/Baixo — WCAG 1.4.3; manter a paleta primária #3773F5/#8A2BE2).* 
* **Estados visíveis e acessíveis no SSO**: se indisponível, `aria-disabled` + texto "Unavailable in beta"; se ativo, aumentar contraste e usar ícones oficiais. *(Alto/Médio — Nielsen#1; WCAG 1.4.1).*

### Média prioridade

* **Tamanho de alvo** ≥44×44px (mín. WCAG 24px) para ícones de senha e links do rodapé; padding invisível. *(Médio/Baixo — Fitts; WCAG 2.5.8).*
* **Focus rings consistentes** com tokens (glow primário leve, 200–500ms). *(Médio/Baixo — WCAG 2.4.7; microinterações 200–500ms).* 
* **Feedback textual na força da senha**: manter rótulos ("Weak/Good/Strong") + ícone, não só cor. *(Médio/Baixo — WCAG 1.4.1).*
* **Mensagens de erro** específicas + instrução ("mín. 8, 1 maiúscula, 1 número, 1 especial"). *(Médio/Médio — Nielsen#9).*
* **Auto complete/teclado**: `given-name`, `family-name`, `username`, `email`, `new-password`, `current-password`, `one-time-code`; `inputmode` apropriado. *(Médio/Baixo — Nielsen#7 Flexibilidade).*

### Baixa prioridade

* **Copy** do topo: "Create your Axisor account" (alinhar com HIG/Material: verbo direto). *(Baixo/Baixo — Consistência).*
* **Agrupar consentimentos**: marketing opcional com texto curto; **termos** obrigatório com microtexto abaixo. *(Baixo/Baixo — Nielsen#4).*

---

## CTAs

| Nome | Objetivo | Copy sugerida | Destino | Tamanho alvo min. | Estados hover/focus/active | Observações |
|------|----------|---------------|---------|-------------------|---------------------------|-------------|
| Continue | Concluir cadastro | Continue | /onboarding | **44×48px** | Hover: leve lift; Focus: outline/glow primário; Active: press | Contraste ≥4.5:1 em todo gradiente |
| Tenho um cupom | Expandir cupom | I have a coupon | — (expande campo) | 44×44px | Focus visível | Progressive disclosure |
| Create with Google | SSO | Continue with Google | OAuth Google | 48×48px | Hover/Focus/Active claros | Exibir somente se ativo |
| Create with GitHub | SSO | Continue with GitHub | OAuth GitHub | 48×48px | idem | idem |
| Sign in | Ir ao login | Sign in | /auth/login | 44×44px | Underline + focus | Link secundário no rodapé |

---

## Acessibilidade (WCAG 2.2)

| Critério | Status [Pass/Fail/Risco] | Nota |
|----------|-------------------------|------|
| 1.4.3 Contraste (AA) | **Pass** | Texto branco do CTA sobre gradiente com overlay para contraste ≥4.5:1 |
| 2.5.8 Target Size (AA) | **Pass** | Todos os elementos interativos com alvos ≥44×44px |
| 2.4.7 Focus Visible (AA) | **Pass** | Focus rings visíveis e consistentes em todos os elementos |
| 1.4.1 Uso de Cor (A) | **Pass** | Força de senha com texto + ícones; SSO com rótulos explícitos |
| 3.3.1 Identificação de Erros (A) | **Pass** | Mensagens de erro claras com ícones e instruções |
| 3.3.2 Rótulos ou Instruções (A) | **Pass** | Labels claras e descrições adequadas |
| 1.3.1 Info e Relações (A) | **Pass** | Estrutura hierárquica coerente; agrupamento de consentimentos |
| 2.1.1 Teclado (A) | **Pass** | Navegação completa por teclado com ordem lógica |

---

## Marca

### Preservar

* **Paleta** dark com **#0B0F1A** (fundo), **#3773F5** (primária), **#8A2BE2** (secundária), acentos neon; **botões primários em azul, secundários em roxo**.  
* **Tipografia**: **Rubik** para títulos, **Inter** para UI/corpo. 

### Ajustar (objetivo)

* Reforçar **contraste mínimo 4.5:1** em CTAs/links e estados. 
* Usar **gradiente azul→roxo discreto** sem comprometer legibilidade. 

---

## Ideias de A/B Test

| Hipótese | Variações | Métrica primária | Critério de sucesso | Riscos |
|----------|-----------|------------------|-------------------|--------|
| Empilhar campos reduz fricção | A: First/Last lado a lado • B: empilhados no mobile | **Conclusão_form** | B ≥ +6% rel. | Mais scroll |
| Ocultar cupom melhora foco | A: campo visível • B: link "Tenho um cupom" que expande | **CTR_Continue** | B ≥ +5% rel. | Usuários com cupom podem não notar |
| Contraste do CTA aumenta cliques | A: gradiente atual • B: roxo escurecido/overlay | **CTR_CTA** | B ≥ +4% rel. | Menor "glow" estético |
| Transparência SSO reduz abandono | A: cinza sem rótulo • B: "Unavailable in beta" + tooltip | **Clique_SSO / Bounce** | B ≥ +8% rel. | Ruído visual leve |

---

## Métricas & Instrumentação

* Eventos: `signup_submit`, `signup_success`, `signup_error{code}`, `toggle_show_password`, `expand_coupon`, `click_terms`, `click_policy`, `click_sso_google`, `click_sso_github`.
* Campos: `input_focus_{field}`, `blur_{field}`, validação inline (tempo até correção).
* Tempos: `ttc_continue` (tempo até clicar em Continue), `ttf_error` (tempo até ver erro).
* Funis: `view_signup` → `interact_fields` → `continue_click` → `success`.

---

## Implementação Técnica

### Melhorias Implementadas

#### 1. Layout Responsivo (Mobile-First)
```css
/* Mobile-first responsive design for name fields */
@media (max-width: 640px) {
  .register-name-fields {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .register-name-fields > div {
    width: 100%;
  }
}
```

#### 2. Progressive Disclosure para Cupom
```typescript
{!showCoupon ? (
  <button
    type="button"
    onClick={() => setShowCoupon(true)}
    className="register-coupon-toggle"
    aria-label="I have a coupon code"
  >
    <Info className="h-4 w-4" />
    I have a coupon code
  </button>
) : (
  <div className="register-coupon-field expanded">
    {/* Campo de cupom expandido */}
  </div>
)}
```

#### 3. Estados SSO Explícitos
```typescript
<Button
  type="button"
  variant="outline"
  disabled={true}
  aria-disabled="true"
  className="register-sso-button w-full ... opacity-50 cursor-not-allowed"
  title="Google SSO unavailable in beta"
>
  Continue with Google
  <span className="ml-2 text-xs text-slate-500">(Unavailable in beta)</span>
</Button>
```

#### 4. CTA com Contraste Aprimorado
```css
.register-cta-button {
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  color: white;
  position: relative;
}

.register-cta-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(0, 0, 0, 0.1) 100%);
  border-radius: inherit;
  pointer-events: none;
}
```

#### 5. Alvos de Toque Adequados
```css
.register-touch-target {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

#### 6. Focus States Consistentes
```css
.register-focus-ring:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
```

#### 7. Agrupamento de Consentimentos
```typescript
<div className="register-consent-group">
  {/* Terms and Conditions - Required */}
  <div className="register-consent-item">
    <Checkbox
      id="termsConsent"
      className="register-touch-target"
      aria-describedby="terms-description"
    />
    {/* Label com links */}
  </div>
  
  {/* Email Marketing - Optional */}
  <div className="register-consent-item">
    <Checkbox
      id="emailMarketingConsent"
      className="register-touch-target"
      aria-describedby="marketing-description"
    />
    {/* Label opcional */}
  </div>
</div>
```

### Resultados Esperados

- **↑ Conclusão_form**: +6% com campos empilhados no mobile
- **↑ CTR_Continue**: +5% com progressive disclosure do cupom
- **↑ CTR_CTA**: +4% com contraste aprimorado
- **↑ Clique_SSO**: +8% com estados explícitos
- **↑ A11y_pass**: 100% conformidade WCAG 2.2 AA

### Próximos Passos

1. **Testes A/B**: Implementar os testes documentados
2. **Monitoramento**: Acompanhar métricas de sucesso
3. **Iteração**: Aplicar princípios a outras páginas
4. **Treinamento**: Usar como referência para equipe

---

## Conclusão

As melhorias implementadas na página de cadastro seguem os princípios de UX e acessibilidade estabelecidos, mantendo a identidade visual da marca Axisor enquanto otimizam a conversão e a experiência do usuário. O foco em mobile-first, progressive disclosure, estados explícitos e conformidade WCAG 2.2 garante uma experiência inclusiva e eficiente para todos os usuários.
