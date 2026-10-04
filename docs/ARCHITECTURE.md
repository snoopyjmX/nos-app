# ARCHITECTURE

Rótulos: **FATO**, **DECISÃO**, **PROBLEMA**, **RECOMENDAÇÃO**, **TARGET** (ver `CLAUDE.md`).
Verificado contra o código em 2026-10-03. Tamanhos de arquivo vêm de `wc -l`.

---

# CURRENT STATE

## 1. Estrutura de diretórios (FATO)

```
src/
  app/                     rotas Expo Router
    (auth)/  welcome, login, register, reset-password
    (tabs)/  _layout, index, messages, memories, dates, profile
    _layout.tsx  index.tsx  onboarding.tsx  terms.tsx  privacy.tsx  +html.tsx
  components/
    layout/TabBar.tsx      dock flutuante (643 linhas); layout/dockGeometry.ts (geometria pura do gesto)
    ui/                    Button, LiquidGlassButton, IconButton, PressableScale, LiquidGlassView,
                           glassWeb, GlassField, Screen, ScreenTitleBar, Avatar, EmptyState,
                           Skeleton, Toast, UpdateBanner, WebDatePicker, AnimatedIcon,
                           AtmosphereBackground, AuthScreen, DialogHost, LegalDocumentView,
                           LiquidThemeSelector, index.ts (barrel)
  features/{home,dates,memories,messages,profile}/
    api/use<Feature>.ts  components/  utils/  types.ts
  lib/
    context/ AuthContext, CoupleContext, ThemeContext, ToastContext
    core/    supabase, logger, dialog, pushNotifications, imageManipulation
    hooks/   useAccessibility, useCopyToClipboard, useDockInset, useWebKeyboard
    milestones.ts
  theme/     colors, typography, spacing (+radii, MAX_CONTENT_WIDTH), shadows, motion, index (useTheme)
  constants/legal/  privacy.ts, terms.ts
supabase/migrations/  4 arquivos .sql
public/               manifest.json, sw.js, ícones, index.html, _redirects
docs/                 documentação
```

Outros fatos: alias `@/*` → `./src/*` (`tsconfig.json`); build web `expo export -p web`; deploy configurado por `vercel.json`; não há `.github/`, nem testes.

## 2. Expo Router e navegação (FATO)

- `src/app/_layout.tsx`: `Stack` sem header. Um `useEffect` com `useSegments()` redireciona: sem sessão e fora de `(auth)`/`reset-password`/`terms`/`privacy` → `/(auth)/welcome`; com sessão dentro de `(auth)` (exceto `reset-password`) → `/`. Também exporta `ErrorBoundary`, chama `LogBox.ignoreAllLogs(true)` e renderiza `UpdateBanner`, `Toast` e `DialogHost` (modal web de `lib/core/dialog.ts`).
- `src/app/index.tsx`: splash enquanto `isLoadingAuth || (session && isLoadingCouple)`; depois `<Redirect>` para welcome (sem sessão), `/onboarding` (sem casal) ou `/(tabs)`.
- `src/app/(tabs)/_layout.tsx`: `Tabs` com `tabBar={TabBar}`, cinco telas (`index, messages, memories, dates, profile`). Envolve tudo em `GestureDetector` com `Gesture.Fling` (esquerda/direita) que chama `router.navigate` usando um array `tabOrder` próprio. Coluna central limitada por `MAX_CONTENT_WIDTH` (560).
- `AuthContext` navega imperativamente (`router.replace`) em `PASSWORD_RECOVERY` e no `signOut`.
- **PROBLEMA:** a decisão de redirecionamento está em dois lugares (`_layout` olha só sessão; `index` olha sessão + casal). **Não** há guard de casal no `_layout`: um usuário com sessão e sem casal que chegue a uma rota de `(tabs)` por link direto não é barrado pelo `_layout`. (INFERÊNCIA — não testado em runtime.) Nenhum uso de `Stack.Protected` foi encontrado.

## 3. Contexts (FATO)

| Context | Responsabilidade | Observações |
|---|---|---|
| `AuthContext` | `session`, `user`, `isLoading`, `signOut`. `getSession()` + `onAuthStateChange`. | A cada evento de auth com usuário, importa dinamicamente `pushNotifications` e registra push token (inclui eventos de refresh). `signOut` limpa os caches de módulo e de signed URL e apaga do AsyncStorage só as chaves que começam com `sb-` ou `supabase.`. |
| `CoupleContext` | `coupleId`, `hasCouple`, `isLoadingCouple`, `anniversaryDate`, `refreshCoupleStatus`, `updateAnniversaryDate`, `clearCouple`. | Consulta `couple_members` (`maybeSingle`) e `couples.anniversary_date`. |
| `ThemeContext` | `isDark`, modo `light`/`dark`, persistência em AsyncStorage (`@nos_theme_mode`), segue o sistema até haver preferência. | Expõe aliases duplicados (`themeMode`/`mode`, `setThemeMode`/`setMode`) |
| `ToastContext` | `showToast`. | Renderizado por `components/ui/Toast`. |

Ordem dos providers: GestureHandlerRootView → SafeAreaProvider → Theme → Toast → Auth → Couple.

## 4. Features e hooks (FATO)

Padrão por feature: `types.ts`, `api/use<Feature>.ts`, `components/`, `utils/`. Hooks de dados:

| Hook | Linhas | Tabelas/Storage | Realtime | Cache |
|---|---|---|---|---|
| `useHomeData` | 463 | `couple_members, profiles, couples, memories, messages, special_dates`, buckets `memories`/`avatars` | canal `home_channel_<coupleId>` com 5 `postgres_changes` | `let homeDataCache` (módulo) |
| `useMessages` | 515 | `messages, couple_members, profiles`, bucket `avatars` | canal `messages_room_<coupleId>`: **Broadcast** (`new_message`, `message_confirmed`) + `postgres_changes` | estado local/refs |
| `useMemories` | 343 | `memories, couple_members, profiles`, bucket `memories` | canal `memories_tab_<coupleId>` | `let cachedMemories` (módulo) |
| `useDates` | 202 | `special_dates` | canal `special_dates_tab_<coupleId>` | `let cachedDates` (módulo) |
| `useProfile` | 240 | `couple_members, profiles, couples, couple_invites`, bucket `avatars` | canal `profile_tab_<coupleId>` | `let cachedProfileData` (módulo) |

Constantes: `PAGE_SIZE = 20` em `useMemories`; `PAGE_SIZE` também em `useMessages`.

## 5. Camada Supabase (FATO)

- Cliente único: `src/lib/core/supabase.ts` (`createClient` com storage AsyncStorage embrulhado em `safeStorage`, `autoRefreshToken`, `persistSession`, `detectSessionInUrl: true`). Se as variáveis `EXPO_PUBLIC_*` não existirem, usa `https://placeholder.supabase.co` / `placeholder-anon-key` **silenciosamente**.
- Não existe camada de repositório/serviço: `supabase.from(...)` é chamado diretamente em hooks, rotas e na TabBar.
- **Chamadas diretas fora de `features/*/api`** (PROBLEMA vs. contrato histórico "rota sem lógica de banco"):
  - `src/app/onboarding.tsx` — RPCs `create_couple`, `create_couple_invite`, `redeem_couple_invite` + select em `couple_members`.
  - `src/app/(tabs)/profile.tsx` — upload em `avatars`, `upsert` em `profiles`, `update` em `couples`.
  - `src/components/layout/TabBar.tsx` — select em `profiles` + `createSignedUrl`/`getPublicUrl` do avatar.
  - `src/app/(auth)/*` — `supabase.auth.*` (aceitável para auth, mas sem camada própria).
- Já extraídos (P1-01, 2026-10-04): `(tabs)/dates.tsx` usa `addDate`/`updateDate`/`removeDate` de `useDates`; `(tabs)/memories.tsx` usa `addMemory` (compressão, upload principal + thumbnail, `insert`, push) e `removeMemory` (arquivos + `delete`) de `useMemories`. As rotas mantêm só validação, diálogos, toasts, háptico e estado de modal. `useDates` atualiza a lista local na hora: inclusão e edição usam a linha devolvida pelo banco (`select` após `insert`/`update`) e a exclusão é otimista, com rollback local se falhar.

## 6. Storage (FATO)

- Buckets usados no código: `memories` (privado: lido via `createSignedUrls`/`createSignedUrl`, 3600s) e `avatars` (lido com `createSignedUrl` 86400s **e fallback `getPublicUrl`**).
- Upload de memória: `<coupleId>/<timestamp>.jpg` + `<coupleId>/<timestamp>_thumb.jpg`, após compressão (`imageManipulation`: 1080px/0.8 e 400px/0.75). O corpo do upload é sempre `Blob` (`fetch(uri).blob()`): `FormData` com `{ uri, name, type }` falha no nativo ("Unsupported FormDataPart implementation") e vira `"[object Object]"` no navegador. Upload de avatar: `<userId>/<timestamp>.jpg`.
- **PROBLEMA — duplicação:** o parsing de path (`split('/memories/')`, `split('/avatars/')`) aparece em `memories/utils/storage.ts` (`sanitizeStoragePath`), `useHomeData`, `useMessages`, `useProfile` e `TabBar`. (`removeMemory` reutiliza `sanitizeStoragePath`.) O módulo morto `lib/core/storage.ts` foi removido em 2026-10-04; o cache de signed URL vive só em `features/memories/utils/storage.ts`.
- `useHomeData` usa `getPublicUrl` como fallback para imagens de memória, mesmo o bucket sendo lido por URL assinada nos demais pontos (INFERÊNCIA: só funciona se o bucket for público — verificar).

## 7. Realtime (FATO)

- Cada hook abre o próprio canal e remove no cleanup (`removeChannel`).
- Chat: além de `postgres_changes`, usa **Broadcast** do cliente para entrega otimista: envia `new_message` (payload da mensagem otimista) **antes** do `insert` e `message_confirmed` depois. Config `broadcast: { self: false }`. Não há `private: true` no canal (busca por `private` sem resultados).
- Haptics leve ao receber mensagem do parceiro.
- INFERÊNCIA: como as abas ficam montadas após a primeira visita, até 5 canais permanecem abertos por usuário.

## 8. Cache (FATO)

Quatro caches de módulo (`homeDataCache`, `cachedMemories`, `cachedDates`, `cachedProfileData`) e um `Map` de signed URL (`features/memories/utils/storage.ts`). Todos são limpos no `signOut()` explícito (`AuthContext` chama `clearHomeDataCache`, `clearMemoriesCache`, `clearDatesCache`, `clearProfileCache` e `clearSignedUrlCache`). O handler de `onAuthStateChange` não limpa, e não há invalidação por troca de casal.

## 9. Push (FATO)

- `lib/core/pushNotifications.ts` obtém o Expo push token e grava em `profiles.push_token`. Ignora simuladores e Expo Go Android; exige `projectId` EAS (`app.json`).
- O **cliente** do remetente lê `push_token` do parceiro (`profiles`) e faz `fetch('https://exp.host/--/api/v2/push/send')` diretamente (em `useMessages` e em `useMemories.addMemory`).

## 10. PWA / Web (FATO)

`+html.tsx` (lang pt-BR, viewport-fit=cover, Google Fonts Plus Jakarta Sans, metas iOS), `public/manifest.json` (`theme_color`/`background_color` `#F8F6FE`, tema **claro**), `public/sw.js` (`nos-static-v2`; não intercepta Supabase nem URLs com token; navegação network-first; estáticos stale-while-revalidate), `UpdateBanner`. Headers e CSP em `vercel.json`.

## 11. Violações arquiteturais e dívida técnica (PROBLEMA)

Cada item tem ID em `docs/ROADMAP.md`.

1. Lógica de Supabase/Storage/push em rotas e TabBar (P1-01).
2. Redirecionamento duplicado e sem guard de casal no `_layout` (P1-02).
3. Caches de módulo sem estratégia, limpos só no `signOut()` explícito (P0-03, P1-03).
4. 53 ocorrências de `any` (`user: any`, `(p as any).push_token`, `catch (err: any)`) (P1-04).
5. Parsing de path duplicado (P1-05).
6. Fallback de coluna `thumb_path` por erro `42703` repetido 3× em `useMemories` (2 `select` + `insert` de `addMemory`) (P1-06).
7. Arquivos grandes concentrando responsabilidade: `TabBar` 643, `useMessages` 515, `useHomeData` 463, `AddDateModal` 438, `onboarding` 382 (P3-03).
8. Falhas silenciosas: `catch {}` vazios (ex.: `useDates`, avatar na TabBar, push) (P1-07).
9. Sem testes e sem CI (P3-05).

---

# TARGET STATE

> **TARGET — nada desta seção existe hoje.** É uma direção proposta, condicionada às decisões abertas em `docs/DECISIONS.md`. Não implemente sem aprovação.

1. **Rotas finas:** `src/app/**` só compõe componentes e chama hooks de feature. Toda chamada ao Supabase vive em `features/<x>/api/` ou `lib/core/`.
2. **Guards únicos:** uma única fonte para decidir auth → casal → tabs (mecanismo a decidir: `Stack.Protected` do Expo Router ou equivalente — *a verificar na versão `~57.0.23` antes de escolher*).
3. **Storage centralizado:** um módulo único para resolver paths e URLs (`memories`, `avatars`), eliminando as 5 cópias de parsing.
4. **Cache com ciclo de vida:** estratégia única (React Query **ou** hooks próprios com reset), invalidada em logout/troca de casal. *Decisão aberta.*
5. **Tipos fortes:** `User` do Supabase tipado, `catch (err: unknown)`, tipos gerados do schema (a depender de exportar o schema).
6. **Push no servidor:** envio por Edge Function/trigger em vez do cliente. *Decisão aberta.*
7. **Quebra de arquivos grandes** por responsabilidade (TabBar → indicador/ícone/avatar; hooks grandes → leitura/escrita/realtime).
8. **Qualidade:** testes de `utils/` + CI com `npm run check`.
