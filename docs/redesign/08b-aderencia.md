# Auditoria de Aderência — Fase 8 (Pré-Fase 9)

Este relatório compila as divergências encontradas entre a implementação atual (após as Fases 3A, 3B, 4, 5, 6, 7 e 8) e o plano original especificado no `PLANO.md`, no guia de design (`DESIGN.md`) e nas regras de agentes (`AGENTS.md`). Esta auditoria é estritamente descritiva e não altera código.

---

## 1. Divergências de Tokens vs. DESIGN.md

A paleta e tipografia criadas em `src/theme` refletem os valores recomendados em `AGENTS.md` no lugar das especificações exatas de `DESIGN.md`. Essa divergência ocorreu pois o `AGENTS.md` (que possui precedência de acordo com a regra de "Fonte da Verdade") sugeria valores distintos:

*   **Cores de Background e Surface:**
    *   **DESIGN.md:** Fundo escuro `#0F0D18` e superfícies `#14121D` / `#1C1A26`.
    *   **Implementado:** Fundo `#15122A` e superfícies `#1F1B3A`.
    *   *Motivo:* Seguimos os "valores iniciais sugeridos" da seção 3.2 do `AGENTS.md`.

*   **Tipografia:**
    *   **DESIGN.md:** `Plus Jakarta Sans` para tudo (títulos, contadores, corpo).
    *   **Implementado:** Fontes `Nunito_400Regular` (e seus pesos) e `Fraunces_700Bold` (display).
    *   *Motivo:* O `AGENTS.md` instruía o uso de `Nunito` e `Fraunces` na seção 3.3.

*   **Raios (Border Radius):**
    *   **DESIGN.md:** `sm: 8px`, `DEFAULT: 16px`, `md: 24px`, `lg: 32px`.
    *   **Implementado:** `sm: 12px`, `md: 20px`, `lg: 28px`.
    *   *Motivo:* Os valores `12, 20, 28` foram baseados estritamente na seção 3.4 do `AGENTS.md`.

---

## 2. Itens do PLANO.md Não Implementados

Várias exigências do plano não foram seguidas ou foram substituídas por atalhos focados apenas na funcionalidade, pulando a infraestrutura de Design System exigida no planejamento:

*   **Fase 3B (Design System & Hooks):**
    *   Os componentes visuais base `MetricCapsule`, `SectionHeader`, `AppText` e `ScreenContainer` não foram criados.
    *   Os hooks `useDockInset()`, `useReducedMotion()` (wrapper) e `useReducedTransparency()` não foram implementados. No lugar de `useDockInset()`, o código está somando valores brutos como `tabBarPaddingBottom + 40` diretamente nas ScrollViews das telas.
    *   O componente `GlassSurface` com quatro níveis (`hero`, `standard`, `subtle`, `none`) e com fallback web / reduzido de transparência não foi modernizado como instruía a fase 3B. Em vez disso, foi sumariamente apagado na maioria das telas para melhorar a performance.

*   **Fase 4 (PWA, Dock e Assets Visuais):**
    *   *Meta tags do iOS:* Não foram inseridas as tags `<meta name="viewport" content="viewport-fit=cover">`, `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` no `index.html`.
    *   *Ícones (Manifest):* O plano previa usar um script com a biblioteca `sharp` para gerar ícones `maskable` e `any` a partir do `icone-anel.png`, extraindo-os "full-bleed". O script não foi criado.
    *   *Host do PWA:* Não foi redigido o documento exigido `docs/redesign/04-pwa-host.md` com as instruções sobre as regras CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, etc.

---

## 3. Cores, Fontes e Espaços Hardcoded (Fora de `src/theme`)

Uma busca pelo código mostra que valores rígidos de cor continuam espalhados em dezenas de arquivos, ao invés de centralizados pelo `useTheme()`:

*   **`src/features/dates/utils/formatting.ts`**: Cada categoria tem valores hex e rbga *hardcoded* (`color: '#2B6CB0'`, `bg: 'rgba(43, 108, 176, 0.12)'`), contornando o token de cores do `useTheme()`.
*   **`src/features/home/components/HeroCard.tsx`**: Contém vários gradientes de sobreposição (`rgba(15, 12, 28, 0.94)`) e o texto da badge fotográfica está cravado como `#FFFFFF`.
*   **`src/features/memories/components/MemoryPreviewModal.tsx`**: As propriedades visuais estão fixas: o overlay usa `'rgba(0,0,0,0.85)'`, as ações usam `backgroundColor: 'rgba(0,0,0,0.5)'`, os ícones usam `#FFFFFF`.
*   **`src/features/dates/components/CountdownDigits.tsx`**: Para simular o preenchimento, usa `rgba(255, 255, 255, 0.08)` e `rgba(124, 111, 224, 0.08)` como fallbacks diretos.
*   **`src/features/profile/*`**: A fase 2B manteve as rotas e componentes recheadas de cores antigas (ex.: `'#DC2626'`, `'rgba(34, 197, 94, 0.12)'`, etc.), o que é esperado já que a tela de ajustes/perfil só será modernizada visualmente na vindoura Fase 9.

Esses pontos representam débitos técnicos visuais e arquiteturais que deverão ser resolvidos ou revistos nas próximas etapas de polimento e encerramento.
