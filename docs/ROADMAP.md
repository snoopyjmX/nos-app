# ROADMAP

Backlog **de organização** derivado do diagnóstico de 2026-10-03. Todos os itens estão **ABERTOS**: nada aqui foi implementado.
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
- **Evidência:** `homeDataCache` (`useHomeData.ts:6`), `cachedMemories` (`useMemories.ts:9`), `cachedDates` (`useDates.ts:6`), `cachedProfileData` (`useProfile.ts:5`), `signedUrlCache` (`features/memories/utils/storage.ts:9`); busca por qualquer reset retornou vazio. `signOut` (`AuthContext.tsx`) não os toca.
- **Impacto (INFERÊNCIA, não reproduzido):** vazamento de dados entre contas no mesmo dispositivo.
- **Solução proposta:** invalidar/limpar caches no logout e na mudança de `coupleId` (mecanismo depende da decisão D-03).
- **Dependências:** decisão D-03 (estratégia de cache) pode absorver este item.
- **Status:** Aberto.

### P0-04 `signOut` apaga chaves por substring `auth`
- **Problema:** `keys.filter(k => k.includes('supabase') || k.includes('sb-') || k.includes('auth'))` pode remover chaves que não são do Supabase.
- **Evidência:** `AuthContext.tsx` (função `signOut`). Chaves de tema usam `@nos_theme_mode` (não afetada hoje).
- **Impacto:** perda indevida de dados locais se chaves futuras contiverem "auth".
- **Solução proposta:** restringir às chaves do cliente Supabase.
- **Dependências:** nenhuma.
- **Status:** Aberto.

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
- **Evidência:** `onboarding.tsx`, `(tabs)/memories.tsx`, `(tabs)/dates.tsx`, `(tabs)/profile.tsx`, `components/layout/TabBar.tsx` (ver `ARCHITECTURE.md` §5).
- **Impacto:** difícil testar/reaproveitar; viola o contrato "rota orquestradora".
- **Solução proposta:** extrair para hooks de feature (ex.: upload de memória, upload de avatar, onboarding, avatar da dock). Sem mudar comportamento.
- **Dependências:** P1-05 (storage helper) e decisões D-03/D-05.
- **Status:** Aberto.

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
- **Problema:** ~55 ocorrências (`user: any`, `(p as any).push_token`, `catch (err: any)`, `throwbackMemory: any`).
- **Evidência:** `grep ": any\b|as any"` em `src/`; `useHomeData.ts`, `useMemories.ts`, `memories.tsx`, `(tabs)/_layout.tsx`.
- **Impacto:** `tsc` não protege os pontos mais sensíveis (usuário, push, dados do Supabase).
- **Solução proposta:** tipar com `User`, `unknown` em `catch`, modelos de `types.ts`; tipos gerados do schema se P0-01.
- **Dependências:** P0-01 (para tipos gerados).
- **Status:** Aberto.

### P1-05 Parsing de path de Storage duplicado + módulo morto
- **Problema:** `split('/memories/')`/`split('/avatars/')` em 7 lugares; `lib/core/storage.ts` não é importado em lugar nenhum.
- **Evidência:** `grep "lib/core/storage'"` → só o próprio arquivo; ver `ARCHITECTURE.md` §6.
- **Impacto:** correções divergem; código morto confunde agentes.
- **Solução proposta:** um módulo único de resolução de paths/URLs; remover o morto.
- **Dependências:** decisão D-04 (localização da lógica de Storage).
- **Status:** Aberto · Bloqueado (decisão D-04).

### P1-06 Fallback de coluna `thumb_path`
- **Problema:** queries repetidas sem `thumb_path` se o erro for `42703`.
- **Evidência:** `useMemories.ts` (2×), `memories.tsx` (insert).
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
- **Evidência:** `useMessages.ts`, `memories.tsx`; `profiles.push_token` selecionado em `useMessages`/`useMemories`.
- **Impacto:** superfície de abuso e tokens trafegando no cliente.
- **Solução proposta:** estudar envio server-side.
- **Dependências:** decisão D-05; P0-01.
- **Status:** Aberto · Bloqueado (decisão D-05).

---

## P2 — UI/UX / Design System

### P2-01 Dois hooks de Reduced Motion
- **Problema:** `useAccessibility.useReducedMotion` (9 arquivos) e `reanimated.useReducedMotion` (4 arquivos); o próprio inicia em `false` e atualiza via Promise.
- **Evidência:** `lib/hooks/useAccessibility.ts`; imports.
- **Impacto (INFERÊNCIA):** primeiro frame pode animar mesmo com a preferência ativa.
- **Solução proposta:** unificar em um hook com valor síncrono (verificar API na versão instalada).
- **Dependências:** nenhuma.
- **Status:** Aberto.

### P2-02 Animações fora do padrão
- **Problema:** `Skeleton` com loop infinito sem easing e sem Reduced Motion; `AnimatedIcon` com spring `damping 10`.
- **Evidência:** `components/ui/Skeleton.tsx`, `AnimatedIcon.tsx`.
- **Impacto:** contraria as regras de `MOTION_DESIGN.md`.
- **Solução proposta:** ajustar conforme tokens e Reduced Motion.
- **Dependências:** P2-01.
- **Status:** Aberto.

### P2-03 Feedback e confirmação inconsistentes
- **Problema:** `Toast`, `Alert.alert` e `window.confirm` coexistem; erros engolidos.
- **Evidência:** `onboarding`, `dates`, `profile`, `memories`, `login`, `reset-password`, `useMessages`.
- **Impacto:** experiência desigual entre plataformas.
- **Solução proposta:** padrão único de confirmação/erro.
- **Dependências:** P1-07.
- **Status:** Aberto.

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

### P2-06 Identidade noturna vs. splash/PWA claros e ErrorBoundary fora do sistema
- **Problema:** `app/index.tsx` usa `#F8F9FC`; `manifest.json` e `app.json` claros; `ErrorBoundary` com hex e `TouchableOpacity` sem a11y.
- **Evidência:** `app/index.tsx` (7 cores), `app/_layout.tsx` (5), `public/manifest.json`, `app.json`.
- **Impacto (INFERÊNCIA):** flash claro na abertura; 14 hex fora de `@/theme`.
- **Solução proposta:** migrar para tokens e alinhar splash/manifest.
- **Dependências:** decisão de produto sobre tema padrão do splash.
- **Status:** Aberto.

### P2-07 Duplicidade no design system
- **Problema:** `Button` vs `GlassButton`; sombras inline do `LiquidGlassView` vs `shadows.*`; `LiquidGlassView` fora do barrel; categorias iguais em light/dark.
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
- **Evidência:** `useHomeData.ts`, `memories.tsx`, `useMessages.ts`.
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

### P3-01 30 warnings de lint
- **Problema:** dependências faltando em hooks, variáveis sem uso.
- **Evidência:** `npm run lint` (30 warnings, 0 erros), ex.: `useMessages.ts:129`, `MessageInput.tsx:61`, `ThemeContext.tsx:36`.
- **Impacto:** possíveis closures desatualizadas (INFERÊNCIA); ruído.
- **Solução proposta:** revisar um a um (não suprimir).
- **Dependências:** nenhuma.
- **Status:** Aberto.

### P3-02 ESLint legado e regras de a11y desligadas
- **Problema:** `.eslintrc.js` (eslintrc depreciado, exige `ESLINT_USE_FLAT_CONFIG=false`); plugin `react-native-a11y` declarado sem regras ativas.
- **Evidência:** `.eslintrc.js`, `package.json` (`lint`).
- **Impacto:** quebra futura (eslint v10) e nenhuma checagem de a11y.
- **Solução proposta:** migrar para flat config e habilitar regras (verificar na versão instalada).
- **Dependências:** nenhuma.
- **Status:** Aberto.

### P3-03 Arquivos grandes
- **Problema:** `TabBar` 538, `useMessages` 514, `useHomeData` 463, `AddDateModal` 437, `onboarding` 381 linhas.
- **Impacto:** difícil revisar.
- **Solução proposta:** dividir por responsabilidade (após P1-01).
- **Dependências:** P1-01.
- **Status:** Aberto.

### P3-04 Código e resíduos
- **Problema:** `lib/core/storage.ts` morto; `Screen.tsx` com `tabBarHeight` sem uso e comentário que cita um arquivo de regras local não versionado; aliases/`isLoaded` no `ThemeContext`; comentários de raciocínio na migration 03; `LogBox.ignoreAllLogs(true)`.
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
- **Evidência:** a regra `CLAUDE.md` foi removida do `.gitignore` (alteração ainda não commitada); `AGENTS.md` segue ignorado (`.gitignore` linha 44). `CLAUDE.md` e `docs/*` não dependem do `AGENTS.md`.
- **Impacto:** enquanto `CLAUDE.md` e `docs/*` não forem commitados, outros clones não os veem.
- **Solução proposta:** commitar `CLAUDE.md` e `docs/*` (a pedido do usuário). Destino final do `AGENTS.md` (manter local, remover ou migrar): decisão do usuário.
- **Dependências:** decisão do usuário.
- **Status:** Em andamento (parte local concluída; commit pendente).

### P3-09 README
- **Problema:** placeholders (`SEU-USUARIO`), "Pêssego", `KeyboardAvoidingView`, cascata (ver `DATABASE.md` §9).
- **Solução proposta:** corrigir após P0-01.
- **Dependências:** P0-07.
- **Status:** Aberto.
