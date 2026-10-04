# DECISIONS

Log em estilo ADR. A parte 1 contém **somente decisões comprovadas por arquivos do repositório** (não são recomendações). A parte 2 lista decisões **ainda não tomadas**: nenhuma opção foi escolhida e nenhum agente deve escolher por conta própria.
Verificado em 2026-10-03.

---

# 1. DECISIONS ALREADY IN EFFECT

Formato: **Contexto** · **Decisão** · **Evidência** · **Consequência/observação**. Datas de decisão não são conhecidas; o estado reflete o código em 2026-10-03.

### ADR-001 — Expo + React Native + Expo Router, multiplataforma incluindo PWA
- **Decisão:** um único código para iOS, Android e web (PWA).
- **Evidência:** `package.json` (Expo `~57.0.26`, RN `0.86.3`, `react-native-web`), `app.json` (`web.bundler: metro`), `public/manifest.json`, `vercel.json`, script `build: expo export -p web`.
- **Consequência:** código precisa tratar `Platform.OS === 'web'` (ex.: `glassWeb.ts`, `lib/core/dialog.ts`).

### ADR-002 — Roteamento por arquivos com grupos `(auth)` e `(tabs)`
- **Evidência:** estrutura de `src/app/`; `typedRoutes` **não** habilitado em `app.json` (nenhuma chave `experiments`).
- **Consequência:** rotas são strings; há casts `as any` em `router.navigate` (`(tabs)/_layout.tsx`).

### ADR-003 — Backend Supabase (Auth, Postgres, Realtime, Storage) acessado diretamente do cliente
- **Evidência:** `lib/core/supabase.ts`; `supabase.from/rpc/storage/channel` nos hooks, rotas e TabBar.
- **Consequência:** a segurança depende de RLS; não há camada de servidor própria.

### ADR-004 — Organização por feature (`api/`, `components/`, `utils/`, `types.ts`)
- **Evidência:** `src/features/{home,dates,memories,messages,profile}`.
- **Observação:** adoção parcial — parte da lógica de dados vive em rotas e na TabBar (violação, não decisão).

### ADR-005 — Estado compartilhado via React Context; dados via hooks próprios
- **Evidência:** `lib/context/*`; ausência de React Query/SWR/Zustand/Redux em `package.json`.
- **Observação:** é o estado atual, **não** uma decisão final — ver D-01/D-03.

### ADR-006 — Design tokens em `src/theme`, consumidos por `useTheme()`; tema claro/escuro
- **Evidência:** `src/theme/*`; `ThemeContext` com persistência `@nos_theme_mode`.
- **Consequência:** valores de cor/espaço/raio vêm de tokens (com exceções legadas: 8 linhas em 3 arquivos, ver `DESIGN_SYSTEM.md` §8).

### ADR-007 — Linguagem visual "Liquid Glass" via primitiva única `LiquidGlassView`
- **Decisão:** blur nativo com `expo-blur`; web com `backdrop-filter` + `-webkit-`; fallback sólido com Reduce Transparency/sem suporte; sombra e recorte em views separadas.
- **Evidência:** `components/ui/LiquidGlassView.tsx`, `glassWeb.ts`.

### ADR-008 — Dock flutuante customizada (`TabBar`) com indicador deslizante por spring
- **Evidência:** `components/layout/TabBar.tsx` (`DOCK_MARGIN = 16`, `INDICATOR_PADDING = 8`, `INDICATOR_INSET_X = 0`, `springDock`); `DOCK_HEIGHT = 76` exportado por `lib/hooks/useDockInset.ts`, que também calcula a compensação (`useDockInset`, mínimo 150) e o topo da dock (`useDockTop`). Altura 64 → 76 em 2026-10-04 (pedido do usuário: dock "estrangulada" no iPhone 12).

### ADR-009 — Animação com Reanimated 4, springs centralizadas em `theme/motion.ts`, com alternativa a Reduced Motion
- **Evidência:** `theme/motion.ts`, `PressableScale`, `TabBar`, `useAccessibility`.
- **Observação:** aplicação incompleta (AnimatedIcon) e hook duplicado — ver P2-01/P2-02.

### ADR-010 — Imagens de memória no bucket privado, lidas por URLs assinadas, com thumbnail e compressão no cliente
- **Evidência:** `features/memories/utils/storage.ts` (`createSignedUrls`, 3600s), `useMemories.ts` (`addMemory`: principal 1080px + thumb 400px), migration `thumb_path`.

### ADR-011 — Mensagens com entrega otimista + Realtime (Broadcast + `postgres_changes`)
- **Evidência:** `useMessages.ts`.
- **Observação:** implicações de segurança em P0-06.

### ADR-012 — Pareamento do casal por RPCs de convite (código)
- **Evidência:** `onboarding.tsx` (`create_couple`, `create_couple_invite`, `redeem_couple_invite`).

### ADR-013 — RLS por pertencimento ao casal; função auxiliar `is_couple_member`; trigger de proteção em `messages`
- **Evidência:** migrations `20261002000000` e `…02`.

### ADR-014 — Push com Expo Notifications, token em `profiles.push_token`
- **Evidência:** `lib/core/pushNotifications.ts`.

### ADR-015 — Hospedagem web na Vercel com cabeçalhos de segurança e CSP em modo Report-Only; Service Worker próprio
- **Evidência:** `vercel.json`, `public/sw.js`, `UpdateBanner`.

### ADR-016 — Validação por `tsc --noEmit` + ESLint (eslintrc, `eslint-config-expo`, `unused-imports`)
- **Evidência:** `package.json` scripts, `.eslintrc.js`.

### ADR-017 — Idioma da interface pt-BR; marca "nós."
- **Evidência:** `app.json` (`name: "nós."`), `+html.tsx` (`lang="pt-BR"`), `manifest.json`.

### ADR-018 — Seleção de modelos de IA: Haiku para tarefas simples, Sonnet para complexas; nunca Opus
- **Origem:** instrução do usuário (global e do projeto), não derivada do código.

### ADR-019 — `react-native-svg` para caminhos e feixes animados
- **Contexto (FATO):** o `IntegrationCard` (porte do 21st.dev) precisa de caminhos SVG e `strokeDashoffset` animado; o projeto não tinha biblioteca SVG.
- **Decisão:** adicionar `react-native-svg` (versão fixada por `npx expo install`: 15.15.4) e animar com Reanimated 4 via `Animated.createAnimatedComponent(Path)`.
- **Evidência:** `package.json`, `src/components/ui/IntegrationCard.tsx`.
- **Aprovação:** usuário, 2026-10-03.
- **Consequência:** nova dependência nativa (exige dev build/Expo Go compatível); sob Reduce Motion os feixes não são renderizados, só as linhas fixas.

---

# 2. OPEN ARCHITECTURAL DECISIONS

> Para cada item: contexto verificado, opções, critérios e o que falta para decidir. **Status: NÃO DECIDIDO.** Nenhuma opção está recomendada como vencedora sem a análise pedida ao usuário.

### D-01 — React Query (ou similar) vs. hooks próprios
- **Contexto (FATO):** 5 hooks de dados repetem loading/refresh/realtime; 4 caches de módulo; nenhuma biblioteca de cache instalada.
- **Opções:** (a) adicionar biblioteca de cache de servidor; (b) padronizar hooks próprios (com reset de cache e invalidação); (c) híbrido por feature.
- **Critérios a avaliar:** integração com Realtime, paginação (mensagens/memórias), cache otimista do chat, tamanho de bundle no PWA, compatibilidade com RN 0.86/React 19.2 (**verificar versões antes**), curva de migração.
- **Falta decidir/verificar:** apetite por nova dependência; custo de migrar o chat.
- **Relacionado:** P1-03, P0-03.

### D-02 — Guards de auth/couple/onboarding
- **Contexto (FATO):** lógica em `_layout.tsx` (`useEffect`) e `index.tsx` (`<Redirect>`); sem `Stack.Protected`.
- **Opções:** (a) `Stack.Protected` do Expo Router (**confirmar existência/API em `expo-router ~57.0.23`**); (b) guard único no `useEffect` do layout; (c) manter `index.tsx` como roteador e remover o efeito.
- **Critérios:** deep links, reset de senha (`PASSWORD_RECOVERY`), PWA reload, ausência de flicker, rotas públicas (`terms`, `privacy`).
- **Relacionado:** P1-02.

### D-03 — Estratégia de cache (e ciclo de vida)
- **Contexto (FATO):** caches de módulo sem TTL, limpos só no `signOut()` explícito; signed URL com cache próprio; cache da Home ligado a estado inicial dos hooks.
- **Opções:** cache de módulo com `reset()` no logout; cache dentro do provider (escopo por usuário/casal); biblioteca (ver D-01).
- **Critérios:** não vazar entre contas; experiência de abertura instantânea; simplicidade.
- **Relacionado:** P0-03, D-01.

### D-04 — Onde vive a lógica de Storage (paths, URLs, upload)
- **Contexto (FATO):** 5 cópias de parsing; upload de avatar dentro de rota (`profile.tsx`); o de memória já está em `useMemories`.
- **Opções:** `lib/core/` (genérico) vs. dentro de cada feature (`memories/`, `profile/`) com um helper comum.
- **Critérios:** reuso entre `memories` e `avatars`; testabilidade; migração de URLs legadas vs. só paths.
- **Falta verificar:** se ainda existem registros com URL completa legada no banco.
- **Relacionado:** P1-01, P1-05.

### D-05 — Estratégia de push
- **Contexto (FATO):** envio pelo cliente via `exp.host`; token em `profiles`.
- **Opções:** manter no cliente; Edge Function chamada pelo cliente; trigger/Database Webhook no servidor.
- **Critérios:** segurança do token, custo/complexidade, offline, controle de abuso, CSP.
- **Falta verificar:** projeto Supabase suporta/usa Edge Functions? (não consta no repo).
- **Relacionado:** P1-08.

### D-06 — Schema e migrations
- **Contexto (FATO):** repo só tem `ALTER`/policies; schema real só no remoto.
- **Opções:** exportar como baseline e seguir com Supabase CLI; manter fluxo manual pelo painel documentando; outra ferramenta.
- **Critérios:** reprodutibilidade, ambientes (dev/prod), tipos gerados.
- **Falta verificar:** existe ambiente de desenvolvimento separado do de produção? Ordem de aplicação das migrations atuais.
- **Relacionado:** P0-01, P1-04, P1-06.

### D-07 — Estratégia de testes e CI
- **Contexto (FATO):** nenhum teste, nenhum CI.
- **Opções:** (a) testes unitários só de `utils/` e funções puras; (b) + testes de hooks/componentes; (c) + e2e.
- **Critérios:** custo, compatibilidade com Expo 57/React 19.2 (**verificar ferramentas suportadas antes**), valor de proteção por esforço.
- **Relacionado:** P3-05.

### D-08 — Tema, nomes e identidade (decisões de produto)
- **Contexto (FATO):** manifest/`app.json` claros vs. identidade noturna (o splash em JS já usa tokens do tema); "Mensagens/Perfil" vs. "Recados/Ajustes"; fonte nativa `System`.
- **Quem decide:** o usuário (produto). Relacionado: P2-05, P2-06, P2-10.

### D-09 — Versionamento de `CLAUDE.md`/`AGENTS.md`
- **Contexto (FATO):** a regra que ignorava `CLAUDE.md` foi removida do `.gitignore` e `CLAUDE.md` + `docs/*` estão versionados (commit `6e0d17a`); `AGENTS.md` continua ignorado e **não é fonte necessária** (`CLAUDE.md` e `docs/*` são as fontes oficiais).
- **Em aberto:** destino do `AGENTS.md` (manter só local, remover ou migrar). Quem decide: o usuário. Relacionado: P3-08.

### D-10 — Autoria de exclusão (produto)
- **Contexto (FATO):** qualquer membro pode apagar memórias/datas de outro (policies DELETE sem `created_by`), mensagens só o autor.
- **Quem decide:** o usuário. Relacionado: `SECURITY.md` S11.

---

## Como registrar uma nova decisão

1. Mova o item da parte 2 para a parte 1 como `ADR-0NN`, com **Contexto, Decisão, Evidência, Consequência**.
2. Cite quem decidiu (usuário/aprovação) e a data.
3. Atualize `ROADMAP.md` (remova o bloqueio) e os documentos afetados.
4. Só marque como implementada após o código existir e `npm run check` passar.
