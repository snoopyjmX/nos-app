# SECURITY

Rótulos: **FATO** (código/arquivo), **INFERÊNCIA**, **NÃO VERIFICADO** (depende do projeto Supabase remoto), **RECOMENDAÇÃO**.
Documenta somente o que foi comprovado em arquivos do repositório em 2026-10-03. O estado real do Supabase remoto **não foi inspecionado**.

---

# CURRENT SECURITY MODEL

## 1. Autenticação e sessão (FATO)

- Supabase Auth com e-mail/senha: `signInWithPassword`, `signUp`, `resetPasswordForEmail`, `exchangeCodeForSession`, `setSession`, `updateUser` (`src/app/(auth)/*`).
- Cliente: `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: true` (`lib/core/supabase.ts`).
- Sessão persistida em **AsyncStorage** (`safeStorage`); no web, `AsyncStorage` do RN-web usa `localStorage`. (INFERÊNCIA: sessão legível por qualquer script na origem — tolerável, mas torna XSS crítico; ver CSP.)
- Reset de senha: `AuthContext` redireciona para `/(auth)/reset-password` em `PASSWORD_RECOVERY`.
- `signOut`: chama `supabase.auth.signOut()`, zera o estado, limpa os caches de módulo e de signed URL, remove do AsyncStorage as chaves que começam com `sb-` ou `supabase.` e navega para login.
- Rotas públicas (sem sessão): `(auth)`, `reset-password`, `terms`, `privacy` (`_layout.tsx`).

## 2. Variáveis de ambiente (FATO)

- Usadas: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (e opcional `EXPO_PUBLIC_PROJECT_ID` em push). Valores `EXPO_PUBLIC_*` vão para o bundle do cliente — a anon key é pública por desenho; **a segurança depende 100% de RLS**.
- `.env` existe localmente e está no `.gitignore` (confirmado por `git check-ignore`). `.env.example` contém apenas placeholders. Não há `service_role` no código (busca no `src/`: nenhuma ocorrência de `service_role`).
- `lib/core/supabase.ts` cai em `https://placeholder.supabase.co` / `placeholder-anon-key` se a variável faltar (PROBLEMA: falha silenciosa — ver Hardening).

## 3. RLS (tabelas) — FATO, a partir de `supabase/migrations/`

`20261002000000_strict_rls_policies.sql` habilita RLS (`IF EXISTS`) em `couples, couple_members, profiles, memories, messages, special_dates` e recria as policies:

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `couples` | membro do casal | — (via RPC, não visível no repo) | membro (`is_couple_member`, migration 02) | — |
| `couple_members` | próprio ou mesmo casal | — | só o próprio (`user_id = auth.uid()`) | — |
| `profiles` | próprio ou parceiro do casal | próprio (`id = auth.uid()`, migration 02) | próprio | — |
| `memories` | membro | membro **e** `created_by = auth.uid()` | membro | membro (qualquer membro) |
| `messages` | membro | membro **e** `created_by = auth.uid()` | membro, com trigger `messages_guard_update` (parceiro só altera `read, read_at, seen_at, updated_at`; `couple_id`/`created_by` imutáveis) | só o autor |
| `special_dates` | membro | membro **e** `created_by = auth.uid()` | membro | membro |

- Função `public.is_couple_member(uuid)` é `SECURITY DEFINER` com `search_path = public`.
- Migration 02 executa `revoke execute on function public.rls_auto_enable() ...`: a função **não aparece em nenhuma migration do repo** (NÃO VERIFICADO).
- **NÃO VERIFICADO:** `couple_invites` (usada em `useProfile`) e os RPCs `create_couple`, `create_couple_invite`, `redeem_couple_invite` — não têm RLS/definição no repo. Se `couple_invites` não tiver RLS, o código de convite pode ficar exposto.
- **NÃO VERIFICADO:** que as migrations foram aplicadas no remoto e na ordem (nomes: `20261001_…` e `20261002000000…02`).

## 4. Storage (FATO, migrations 01 e 02)

- Bucket `memories`: policies de INSERT/UPDATE/DELETE restritas à pasta `[1] = couple_id` do usuário (`storage.foldername(name)[1]`). Policy de **SELECT** para `memories` não está nas migrations (o comentário da migration 01 diz que "já estavam corretas"; NÃO VERIFICADO).
- Bucket `avatars`: migration 01 criou policies **abertas a qualquer autenticado**; migration 02 as removeu e criou policies **por pasta do próprio usuário** (`[1] = auth.uid()`) para SELECT/INSERT/UPDATE/DELETE.
- Upload de avatar no app usa `<userId>/<timestamp>.jpg` — compatível com as policies da migration 02.
- **INFERÊNCIA / PROBLEMA potencial:** a policy "Avatars read own" só permite ler a **própria** pasta. O app gera `createSignedUrl` para o avatar do **parceiro** (`useMessages`, `useHomeData`, `useProfile`, `TabBar`). Com essa policy, a assinatura da URL do avatar do parceiro deveria falhar, e o código cai em `getPublicUrl`, que só funciona se o bucket for **público**. Se for público, qualquer pessoa com a URL vê o avatar (sem RLS efetiva). O estado real do bucket é **NÃO VERIFICADO**.
- URLs assinadas: `memories` → 3600s (`createSignedUrls` em lote); `avatars` → 86400s. Fallback `getPublicUrl` em `useHomeData` também para `memories` (só funcionaria com bucket público; NÃO VERIFICADO).
- Cache em memória de signed URLs (`features/memories/utils/storage.ts`) com folga de 60s; limpo no `signOut()` explícito.
- Exclusão de memória: o app remove os arquivos do Storage **antes** de apagar a linha; se o delete da linha falhar, o registro pode apontar para arquivo inexistente.

## 5. Realtime (FATO)

- `postgres_changes` filtrado por `couple_id`/`id` (a entrega respeita RLS).
- O chat usa também **Broadcast** (`new_message`, `message_confirmed`) em `messages_room_<coupleId>`, enviando o conteúdo da mensagem pelo canal **antes** do `insert`. Não há `private: true` no canal. (INFERÊNCIA: a menos que o projeto tenha Realtime Authorization configurada, quem conhecer o `coupleId` — um UUID — e tiver uma sessão qualquer poderia entrar no canal e ler/injetar broadcasts. NÃO VERIFICADO no painel.)
- O cliente confia em `payload.created_by` recebido pelo broadcast para decidir de quem é a mensagem (`incoming.created_by === user?.id`), sem validar contra o servidor até a confirmação do `insert`.

## 6. Push tokens (FATO)

- O token Expo é gravado em `profiles.push_token` (`update ... eq('id', userId)`).
- O app consulta `push_token` dos perfis do casal (`select 'id, display_name, avatar_url, push_token'`), consistente com a policy de leitura de `profiles` (parceiro pode ler).
- O envio é feito **pelo cliente** via `fetch` à API pública da Expo, usando o token do parceiro. Não há Edge Function. (Risco: um cliente adulterado do casal pode enviar push arbitrário ao parceiro; baixo, pois só há duas pessoas.)
- O registro roda a cada evento de auth (inclui refresh), não só no login; `catch` silencioso.

## 7. Exposição de dados no cliente (FATO)

- `logger` só emite em `__DEV__`. `LogBox.ignoreAllLogs(true)` em `_layout.tsx`.
- `ErrorBoundary` raiz mostra `error.message` ao usuário.
- Mensagens e memórias não são criptografadas pelo app (o conteúdo trafega e é armazenado em texto/objetos protegidos por RLS/Storage). A UI **não deve** alegar E2EE.
- Termos e Política de Privacidade: `src/constants/legal/*.ts` (renderizados) e `docs/legal/*.md` (cópia em markdown). **Duas cópias** que podem divergir.

## 8. PWA e CSP (FATO, `vercel.json`, `public/sw.js`)

- Headers: HSTS (2 anos, `includeSubDomains`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(self), microphone=(self), geolocation=()`.
- **CSP está em `Content-Security-Policy-Report-Only`** (não bloqueia): `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' fonts.googleapis; img-src self data: blob: <supabase>; connect-src self <supabase> wss://<supabase>; frame-ancestors 'none'; object-src 'none'`.
- A CSP referencia o host Supabase de um projeto específico (hardcoded em `vercel.json`).
- A CSP **não lista `https://exp.host`** em `connect-src`; o `fetch` de push ao Expo seria bloqueado se a CSP fosse aplicada (INFERÊNCIA; relevante ao endurecer).
- Service worker: não intercepta requisições de Supabase/`/auth/v1`/`/rest/v1`/`/storage/v1` nem URLs com `token/apikey/signature`; cacheia HTML (network-first) e estáticos (stale-while-revalidate, incl. `.json`). Cache nomeado `nos-static-v2`.
- Câmera e microfone estão permitidos na `Permissions-Policy`; não foi encontrado uso de câmera/microfone no código (busca por `expo-camera`/`getUserMedia`: nenhum; `expo-image-picker` está instalado).

## 9. Riscos encontrados (resumo)

| # | Risco | Tipo |
|---|---|---|
| S1 | Schema base, RPCs, `couple_invites` e Realtime Authorization não estão no repo | NÃO VERIFICADO |
| S2 | Leitura de avatar do parceiro vs. policy "own" / bucket possivelmente público | INFERÊNCIA |
| S3 | Broadcast do chat em canal não privado, sem validação de autor | INFERÊNCIA |
| S4 | Caches de módulo e signed URLs: limpos no `signOut()` explícito desde 2026-10-04, mas não no `SIGNED_OUT` vindo do `onAuthStateChange` nem na troca de casal | FATO |
| S5 | `signOut` apagava chaves por substring `auth`; corrigido em 2026-10-04 (só prefixos `sb-`/`supabase.`) | FATO |
| S6 | Fallback silencioso para URL/chave placeholder | FATO |
| S7 | CSP em modo Report-Only; `unsafe-inline` em estilos; permissões de câmera/mic sem uso | FATO |
| S8 | Push enviado pelo cliente | FATO |
| S9 | `ErrorBoundary` exibe `error.message` cru | FATO |
| S10 | Duas cópias dos textos legais | FATO |
| S11 | Qualquer membro do casal pode apagar memórias/datas de qualquer outro (policies `DELETE` sem `created_by`) | FATO (pode ser intencional — decisão de produto) |

---

# RECOMMENDED HARDENING

> **RECOMENDAÇÃO — nenhum item abaixo está implementado.** Ver prioridades em `docs/ROADMAP.md`.

1. Exportar o schema remoto completo (tabelas, RPCs, `couple_invites`, buckets, policies, triggers) e versionar como migration inicial; revisar `couple_invites` e RPCs (S1).
2. Verificar no painel: visibilidade do bucket `avatars`/`memories`, policies de SELECT de Storage e Realtime Authorization; decidir como o parceiro lê o avatar com segurança (S2).
3. Tornar o canal de chat privado (Realtime Authorization) **ou** remover o Broadcast e confiar apenas em `postgres_changes`; nunca confiar em `created_by` vindo do cliente (S3).
4. Limpar caches e signed URLs também na troca de casal e no `SIGNED_OUT` do `onAuthStateChange` (a limpeza no `signOut()` explícito e o filtro do `multiRemove` já existem desde 2026-10-04) (S4, S5).
5. Lançar erro em build/startup se as variáveis `EXPO_PUBLIC_SUPABASE_*` faltarem (S6).
6. Promover a CSP de Report-Only para enforcement depois de revisar violações; incluir `https://exp.host` se o push permanecer no cliente; reavaliar `unsafe-inline` e remover `camera`/`microphone` da `Permissions-Policy` se não usados (S7).
7. Mover o envio de push para Edge Function/trigger no servidor, lendo o token com segurança (S8).
8. Mostrar mensagem genérica no `ErrorBoundary` e logar o detalhe apenas em dev (S9).
9. Manter uma única fonte para os textos legais (S10).
10. Decidir (produto) se `DELETE` deve ser restrito ao autor (S11).
11. Avaliar armazenamento de sessão mais seguro no nativo (ex.: SecureStore) — **requer decisão e nova dependência**, não presumir.
