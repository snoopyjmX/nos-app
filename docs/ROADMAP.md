# ROADMAP

Backlog **de organização** derivado do diagnóstico de 2026-10-03. Os itens estão **ABERTOS**, salvo quando o campo Status indicar outra coisa.
Status possíveis: `Aberto` · `Em andamento` · `Bloqueado (decisão)` · `Concluído` (só com verificação).
Itens marcados "Bloqueado (decisão)" dependem de uma decisão em `docs/DECISIONS.md → OPEN ARCHITECTURAL DECISIONS`.
Evidências são arquivos/linhas reais; INFERÊNCIA está marcada.

Dependências usam os IDs deste arquivo. Ordem sugerida: P0 → P1 → P2 → P3, respeitando dependências.

---

## P0 — Segurança / Fundação

### P0-01 Schema remoto fora do repositório
- **Problema:** não há `CREATE TABLE`, RPCs, `couple_invites`, buckets, FKs nem índices versionados.
- **Evidência:** `supabase/migrations/` tem 4 arquivos, todos `ALTER`/`POLICY`; `onboarding.tsx` chama 3 RPCs sem definição no repo.
- **Impacto:** impossível recriar o banco, revisar RLS completo ou gerar tipos; auditoria de segurança incompleta.
- **Solução proposta:** exportar schema remoto, versionar como migration inicial e documentar em `DATABASE.md`; comparar com as migrations atuais.
- **Dependências:** acesso ao projeto Supabase; decisão D-06 (schema/migrations).
- **Status:** Aberto · Bloqueado (decisão D-06).

### P0-02 Verificar Storage, `couple_invites` e Realtime Authorization
- **Problema:** visibilidade dos buckets, policy de SELECT de `memories`, RLS de `couple_invites` e privacidade do canal do chat não verificados.
- **Evidência:** migration 02 do avatar permite ler só a própria pasta, mas o app assina URLs do avatar do parceiro (`useMessages`, `useHomeData`, `useProfile`, `TabBar`) e cai em `getPublicUrl`; `couple_invites` ausente das migrations; canal `messages_room_*` sem `private`.
- **Impacto (INFERÊNCIA):** possível leitura pública de avatares; possível exposição do código de convite; broadcast do chat acessível a quem conhecer o `coupleId`.
- **Solução proposta:** inspecionar painel; se confirmado, ajustar policies/bucket e tornar o canal privado ou remover Broadcast.
- **Dependências:** P0-01.
- **Status:** Aberto.

### P0-03 Caches de módulo não limpos no logout / troca de usuário
- **Problema:** dados do usuário anterior permanecem em memória e podem aparecer ao próximo login na mesma sessão JS/aba PWA.
- **Evidência:** `homeDataCache` (`useHomeData.ts:6`), `cachedMemories` (`useMemories.ts:16`), `cachedDates` (`useDates.ts:13`), `cachedProfileData` (`useProfile.ts:5`), `signedUrlCache` (`features/memories/utils/storage.ts:9`).
- **Impacto (INFERÊNCIA, não reproduzido):** vazamento de dados entre contas no mesmo dispositivo.
- **Solução proposta:** invalidar/limpar caches no logout e na mudança de `coupleId` (mecanismo depende da decisão D-03).
- **Feito (2026-10-04):** `signOut()` (`AuthContext.tsx`) chama `clearHomeDataCache`, `clearMemoriesCache`, `clearDatesCache`, `clearProfileCache` e `clearSignedUrlCache`. Verificado por leitura de código; sem teste em runtime.
- **Dependências:** decisão D-03 (estratégia de cache) pode absorver este item.
- **Status:** Em andamento (faltam o `SIGNED_OUT` que chega pelo `onAuthStateChange` sem passar por `signOut()` e a troca de `coupleId`).

### P0-04 `signOut` apaga chaves por substring `auth`
- **Problema:** `keys.filter(k => k.includes('supabase') || k.includes('sb-') || k.includes('auth'))` pode remover chaves que não são do Supabase.
- **Evidência:** `AuthContext.tsx` (função `signOut`). Chaves de tema usam `@nos_theme_mode` (não afetada hoje).
- **Impacto:** perda indevida de dados locais se chaves futuras contiverem "auth".
- **Solução proposta:** restringir às chaves do cliente Supabase.
- **Feito (2026-10-04):** filtro trocado por `k.startsWith('sb-') || k.startsWith('supabase.')`; a chave padrão do cliente é `sb-<ref>-auth-token` (`defaultStorageKey` do supabase-js) e `lib/core/supabase.ts` não define outra.
- **Dependências:** nenhuma.
- **Status:** Concluído (verificado por leitura de código e `npm run check`; sem teste em runtime).

### P0-05 Fallback silencioso para URL/chave placeholder
- **Problema:** variáveis ausentes geram cliente apontando para `placeholder.supabase.co`, com falhas obscuras.
- **Evidência:** `lib/core/supabase.ts`.
- **Impacto:** erros difíceis de diagnosticar; build de produção pode subir "funcionando" sem backend.
- **Solução proposta:** falhar explicitamente na inicialização (dev e build).
- **Dependências:** nenhuma.
- **Status:** Aberto.

### P0-06 Chat: Broadcast antes do `insert` e confiança em `created_by` do payload
- **Problema:** mensagem otimista é transmitida por Broadcast antes de persistir; o receptor aceita `created_by` do payload.
- **Evidência:** `useMessages.ts` (`channel.send({event:'new_message'…})` antes do `insert`; handler compara `incoming.created_by`).
- **Impacto (INFERÊNCIA):** possível falsificação/duplicação de mensagem exibida; vazamento se o canal não for privado.
- **Solução proposta:** depender de `postgres_changes` (já presente) ou autorizar o canal; validar no servidor.
- **Dependências:** P0-02.
- **Status:** Aberto.

### P0-07 Promessas do README não comprovadas
- **Problema:** README afirma "deleção em cascata" e "validadas contra `couple_id`" sem evidência no repo.
- **Evidência:** `DATABASE.md` §9 (D2, D4).
- **Impacto:** falsa sensação de segurança/integridade.
- **Solução proposta:** corrigir o README após P0-01 ou remover as afirmações.
- **Dependências:** P0-01.
- **Status:** Aberto.

---

## P1 — Arquitetura

### P1-01 Lógica de Supabase em rotas e TabBar
- **Problema:** upload, insert, delete, RPC e push dentro de telas e da dock.
- **Evidência:** `onboarding.tsx`, `(tabs)/profile.tsx`, `components/layout/TabBar.tsx` (ver `ARCHITECTURE.md` §5).
- **Impacto:** difícil testar/reaproveitar; viola o contrato "rota orquestradora".
- **Solução proposta:** extrair para hooks de feature (ex.: upload de avatar, onboarding, avatar da dock). Sem mudar comportamento.
- **Feito (2026-10-04):** `(tabs)/dates.tsx` → `useDates` (`addDate`, `updateDate`, `removeDate`); `(tabs)/memories.tsx` → `useMemories` (`addMemory`: compressão, upload, insert e push; `removeMemory`). As duas rotas não importam mais `supabase`. Comportamento, cache (D-03) e push no cliente (D-05) inalterados. Verificado com `npm run check`; **não testado em dispositivo**.
- **Dependências:** P1-05 (storage helper) e decisões D-03/D-05.
- **Status:** Em andamento (faltam `onboarding.tsx`, `profile.tsx` e `TabBar.tsx`).

### P1-02 Guards de navegação duplicados e incompletos
- **Problema:** redirecionamento em `_layout.tsx` (sessão) e `index.tsx` (sessão + casal); sem guard de casal no `_layout`.
- **Evidência:** `src/app/_layout.tsx` `useEffect`; `src/app/index.tsx`.
- **Impacto (INFERÊNCIA):** possível flicker/redirecionamento concorrente; acesso a `(tabs)` sem casal por deep link (não testado).
- **Solução proposta:** única fonte de decisão (auth → casal → tabs).
- **Dependências:** decisão D-02.
- **Status:** Aberto · Bloqueado (decisão D-02).

### P1-03 Estratégia de dados/cache indefinida
- **Problema:** cada hook reimplementa loading/refresh/realtime/cache de módulo.
- **Evidência:** 5 hooks de dados; 4 caches globais.
- **Impacto:** inconsistência, duplicação e risco de dados obsoletos.
- **Solução proposta:** decidir entre biblioteca de cache ou padrão próprio e migrar gradualmente.
- **Dependências:** decisão D-01/D-03.
- **Status:** Aberto · Bloqueado (decisão).

### P1-04 Tipagem frouxa (`any`)
- **Problema:** 53 ocorrências (`user: any`, `(p as any).push_token`, `catch (err: any)`, `throwbackMemory: any`).
- **Evidência:** `grep ": any\b|as any"` em `src/`; `useHomeData.ts`, `useMemories.ts`, `memories.tsx`, `(tabs)/_layout.tsx`.
- **Impacto:** `tsc` não protege os pontos mais sensíveis (usuário, push, dados do Supabase).
- **Solução proposta:** tipar com `User`, `unknown` em `catch`, modelos de `types.ts`; tipos gerados do schema se P0-01.
- **Dependências:** P0-01 (para tipos gerados).
- **Status:** Aberto.

### P1-05 Parsing de path de Storage duplicado
- **Problema:** `split('/memories/')`/`split('/avatars/')` em 5 lugares. O módulo morto `lib/core/storage.ts` foi removido em 2026-10-04.
- **Evidência:** ver `ARCHITECTURE.md` §6.
- **Impacto:** correções divergem.
- **Solução proposta:** um módulo único de resolução de paths/URLs.
- **Dependências:** decisão D-04 (localização da lógica de Storage).
- **Status:** Aberto · Bloqueado (decisão D-04).

### P1-06 Fallback de coluna `thumb_path`
- **Problema:** queries repetidas sem `thumb_path` se o erro for `42703`.
- **Evidência:** `useMemories.ts` (2× no `select`, 1× no `insert` de `addMemory`).
- **Impacto:** código defensivo duplicado que esconde migration não aplicada.
- **Solução proposta:** garantir a migration em todos os ambientes e remover o fallback.
- **Dependências:** P0-01.
- **Status:** Aberto.

### P1-07 Erros engolidos
- **Problema:** `catch {}` com comentário "Ignora silenciosamente"; usuário não vê falha.
- **Evidência:** `useDates.ts`, `useProfile.ts`, `TabBar.tsx`, `pushNotifications.ts`.
- **Impacto:** falhas invisíveis, difícil depurar; estados de erro inexistentes na UI.
- **Solução proposta:** expor estado de erro nos hooks e tratar na UI (ver P2-03).
- **Dependências:** P2-03.
- **Status:** Aberto.

### P1-08 Envio de push pelo cliente
- **Problema:** o cliente lê o token do parceiro e chama `exp.host` diretamente.
- **Evidência:** `useMessages.ts`, `useMemories.ts` (`addMemory`); `profiles.push_token` selecionado em `useMessages`/`useMemories`.
- **Impacto:** superfície de abuso e tokens trafegando no cliente.
- **Solução proposta:** estudar envio server-side.
- **Dependências:** decisão D-05; P0-01.
- **Status:** Aberto · Bloqueado (decisão D-05).

---

## P2 — UI/UX / Design System

### P2-01 Dois hooks de Reduced Motion
- **Problema:** `useAccessibility.useReducedMotion` (15 arquivos) e `reanimated.useReducedMotion` (5 arquivos); o próprio inicia em `false` e atualiza via Promise.
- **Evidência:** `lib/hooks/useAccessibility.ts`; imports.
- **Impacto (INFERÊNCIA):** primeiro frame pode animar mesmo com a preferência ativa.
- **Solução proposta:** unificar em um hook com valor síncrono (verificar API na versão instalada).
- **Dependências:** nenhuma.
- **Status:** Aberto.

### P2-02 Animações fora do padrão
- **Problema:** `AnimatedIcon` já usa escala 1.08 e spring `{damping 20, stiffness 220, mass 1}` (commit `3a82cf9`), mas `stiffness` 220 fica fora da faixa 150–200, é constante local (não token) e o `withTiming` da inclinação não tem easing.
- **Evidência:** `components/ui/AnimatedIcon.tsx`.
- **Impacto:** contraria as regras de `MOTION_DESIGN.md`.
- **Solução proposta:** ajustar conforme tokens e Reduced Motion.
- **Feito (2026-10-04):** `Skeleton` com `Easing.inOut(Easing.ease)` nos dois `withTiming` e opacidade fixa sob Reduced Motion (`useAccessibility`).
- **Dependências:** P2-01.
- **Status:** Em andamento (falta `AnimatedIcon`).

### P2-03 Feedback e confirmação inconsistentes
- **Problema:** parcialmente tratado. `showAlert` (`lib/core/dialog.ts`) já unifica os diálogos (sistema no nativo, `DialogHost` na web) e `window.confirm` não é mais usado; formulários de auth têm erro inline (`GlassField error`). Resta 1 `Alert.alert` direto, o convívio de `Toast` com diálogos sem critério documentado e os erros engolidos (P1-07).
- **Evidência:** `showAlert` em `onboarding`, `dates`, `profile`, `memories`, `login`, `reset-password`; `Alert.alert` direto em `useMessages.ts:490`.
- **Impacto:** experiência ainda desigual para erros que não chegam à UI.
- **Solução proposta:** alinhar `useMessages.ts`, definir quando usar Toast vs. diálogo e tratar erros engolidos.
- **Dependências:** P1-07.
- **Status:** Aberto (parcialmente tratado).

### P2-04 Fling de troca de aba vs. gestos internos
- **Problema:** `Fling` no container inteiro das abas.
- **Evidência:** `(tabs)/_layout.tsx`.
- **Impacto (INFERÊNCIA, não testado):** troca involuntária de aba durante scroll/modal.
- **Solução proposta:** testar em dispositivo; restringir/condicionar o gesto.
- **Dependências:** nenhuma.
- **Status:** Aberto.

### P2-05 Nomes das abas divergem do contrato histórico
- **Problema:** código "Mensagens/Perfil" vs `docs/design.md` e contrato local anterior (histórico) "Recados/Ajustes".
- **Evidência:** `TabBar.tsx` (mapa de labels), `docs/design.md`.
- **Impacto:** documentação e código desalinhados.
- **Solução proposta:** decisão de produto; alinhar um dos lados.
- **Dependências:** decisão do usuário.
- **Status:** Aberto · Bloqueado (decisão de produto).

### P2-06 Identidade noturna vs. manifest/app.json claros e ErrorBoundary fora do sistema
- **Problema:** `manifest.json` e `app.json` continuam com cores claras; o `ErrorBoundary` ainda usa hex e `TouchableOpacity` (já tem `accessibilityRole` e `minHeight: 44`). O splash de `app/index.tsx` já usa tokens do tema.
- **Evidência:** `public/manifest.json` (`#F8F6FE`), `app.json` (`#F8F9FC` no ícone adaptativo), `app/_layout.tsx` (5 linhas com cor literal).
- **Impacto (INFERÊNCIA):** possível flash claro na abertura do PWA; 9 linhas com cor literal fora de `@/theme` (ver `DESIGN_SYSTEM.md` §8).
- **Solução proposta:** migrar o `ErrorBoundary` para tokens e alinhar manifest/`app.json`.
- **Dependências:** decisão de produto sobre tema padrão do splash.
- **Status:** Aberto.

### P2-07 Duplicidade no design system
- **Problema:** `Button` vs `GlassButton`; sombras inline do `LiquidGlassView` vs `shadows.*`; `LiquidGlassView` fora do barrel; fundos de categoria (`cat*Bg`) iguais em light/dark.
- **Evidência:** `DESIGN_SYSTEM.md` §5, §8.
- **Impacto:** inconsistência visual e manutenção.
- **Solução proposta:** consolidar após decisão de design.
- **Dependências:** nenhuma.
- **Status:** Aberto.

### P2-08 `docs/design.md` desatualizado vs. tokens
- **Problema:** tabela de divergências (`DESIGN_SYSTEM.md` §3).
- **Evidência:** `docs/design.md` vs `src/theme/colors.ts`.
- **Impacto:** agentes podem seguir valores errados.
- **Solução proposta:** reescrever a partir dos tokens ou aposentar.
- **Dependências:** nenhuma.
- **Status:** Aberto.

### P2-09 Textos/estados fictícios e hápticos passivos
- **Problema:** fallbacks "Você & Meu Amor", "Meu Amor", "Seu amor"; háptico ao receber mensagem.
- **Evidência:** `useHomeData.ts`, `useMemories.ts`, `useMessages.ts`.
- **Impacto:** contraria "sem dados fictícios" e a regra de hápticos intencionais.
- **Solução proposta:** definir fallbacks neutros e política de háptico (decisão de produto).
- **Dependências:** decisão do usuário.
- **Status:** Aberto.

### P2-10 Fonte nativa
- **Problema:** `typography` usa `System` no nativo; Plus Jakarta Sans só na web (via CDN).
- **Evidência:** `typography.ts`, `+html.tsx`; nenhum uso de `expo-font` no código (apenas no plugin do `app.json`).
- **Impacto:** identidade tipográfica diferente entre plataformas (INFERÊNCIA se intencional).
- **Solução proposta:** confirmar intenção antes de agir.
- **Dependências:** decisão do usuário.
- **Status:** Aberto.

---

## P3 — Manutenção

### P3-01 Supressões de `react-hooks/exhaustive-deps`
- **Problema:** `npm run lint` hoje não emite warnings (eram 30). Parte saiu por correção (ex.: `isLoaded` removido de `ThemeContext.tsx`); existem 8 `eslint-disable-next-line react-hooks/exhaustive-deps` no código, alguns sem justificativa escrita. O que foi corrigido e o que foi suprimido não foi auditado caso a caso.
- **Evidência:** `grep -rn "eslint-disable" src` → `messages.tsx` (2), `MessageInput.tsx:69`, `useMessages.ts:131`, `AnimatedIcon.tsx` (2), `TabBar.tsx` (2).
- **Impacto (INFERÊNCIA):** closures possivelmente desatualizadas ficam escondidas (ex.: `profileMap` em `useMessages.ts:129`).
- **Solução proposta:** revisar cada supressão: corrigir ou justificar por escrito.
- **Dependências:** nenhuma.
- **Status:** Aberto (warnings zerados; supressões pendentes de revisão).

### P3-02 ESLint em formato legado
- **Problema:** `.eslintrc.js` (eslintrc depreciado, exige `ESLINT_USE_FLAT_CONFIG=false`). O plugin `react-native-a11y` já está ativo via `plugin:react-native-a11y/basic` (com `has-accessibility-hint` desligada).
- **Evidência:** `.eslintrc.js`, `package.json` (`lint`).
- **Impacto:** quebra futura (eslint v10). A cobertura real do preset `basic` não foi avaliada.
- **Solução proposta:** migrar para flat config mantendo o preset de a11y (verificar na versão instalada).
- **Dependências:** nenhuma.
- **Status:** Aberto.

### P3-03 Arquivos grandes
- **Problema:** `TabBar` 643, `useMessages` 515, `useHomeData` 463, `AddDateModal` 438, `onboarding` 382 linhas.
- **Impacto:** difícil revisar.
- **Solução proposta:** dividir por responsabilidade (após P1-01).
- **Dependências:** P1-01.
- **Status:** Aberto.

### P3-04 Código e resíduos
- **Problema:** aliases duplicados no `ThemeContext` (`themeMode`/`mode`, `setThemeMode`/`setMode`); comentários de raciocínio na migration 03; `LogBox.ignoreAllLogs(true)`.
- **Evidência:** arquivos citados.
- **Impacto:** ruído e confusão para agentes.
- **Solução proposta:** limpar (migration já aplicada não deve ser editada — registrar em vez de reescrever; decidir).
- **Dependências:** P0-01 (para migrations).
- **Status:** Aberto.

### P3-05 Sem testes e sem CI
- **Problema:** nenhum `*.test.*`, jest ou `.github/`.
- **Evidência:** busca no repo.
- **Impacto:** regressões não detectadas; `npm run check` depende de execução manual.
- **Solução proposta:** estratégia mínima para `utils/` + CI com `npm run check`.
- **Dependências:** decisão D-07.
- **Status:** Aberto · Bloqueado (decisão D-07).

### P3-06 CSP e permissões
- **Problema:** CSP em Report-Only; `unsafe-inline`; câmera/mic permitidos sem uso; `exp.host` ausente de `connect-src`.
- **Evidência:** `vercel.json`.
- **Impacto:** proteção XSS não aplicada.
- **Solução proposta:** ver `SECURITY.md` §Hardening.
- **Dependências:** P1-08.
- **Status:** Aberto.

### P3-07 Textos legais duplicados
- **Problema:** `docs/legal/*.md` e `src/constants/legal/*.ts`.
- **Impacto:** divergência.
- **Solução proposta:** fonte única.
- **Dependências:** nenhuma.
- **Status:** Aberto.

### P3-08 Versionamento de `CLAUDE.md` e destino do `AGENTS.md`
- **Problema:** o contrato operacional precisa estar no Git; `AGENTS.md` (local, ignorado) não deve ser dependência.
- **Evidência:** a regra `CLAUDE.md` foi removida do `.gitignore` e `CLAUDE.md` + `docs/*` constam em `git ls-files` (commit `6e0d17a`); `AGENTS.md` segue ignorado (`.gitignore` linha 44). `CLAUDE.md` e `docs/*` não dependem do `AGENTS.md`.
- **Impacto:** `CLAUDE.md` e `docs/*` já chegam a outros clones; o `AGENTS.md` não, e nenhum documento depende dele.
- **Solução proposta:** decidir o destino final do `AGENTS.md` (manter local, remover ou migrar).
- **Dependências:** decisão do usuário.
- **Status:** Em andamento (versionamento do `CLAUDE.md` concluído; resta a decisão sobre o `AGENTS.md`).

### P3-09 README
- **Problema:** placeholders (`SEU-USUARIO`), "Pêssego", `KeyboardAvoidingView`, cascata (ver `DATABASE.md` §9).
- **Solução proposta:** corrigir após P0-01.
- **Dependências:** P0-07.
- **Status:** Aberto.
