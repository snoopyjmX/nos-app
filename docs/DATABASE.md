# DATABASE

Rótulos: **FATO** (arquivo do repositório), **INFERÊNCIA**, **NÃO VERIFICADO**, **RECOMENDAÇÃO**.

> ## ⚠️ O schema completo remoto NÃO está no repositório.
> `supabase/migrations/` contém apenas 4 arquivos que **alteram** objetos já existentes (RLS, policies, 1 coluna, 1 função, 1 trigger). Não há `CREATE TABLE` para nenhuma tabela, nem definição das RPCs, nem de `couple_invites`, nem criação de buckets. Tudo abaixo vem de **uso no código** ou dessas 4 migrations. O schema remoto precisa ser **exportado e verificado** (ex.: `supabase db dump`) antes de qualquer trabalho de banco — ver ROADMAP P0-01.
> Este documento foi montado sem acesso ao Supabase remoto.

Verificado em 2026-10-03.

---

## 1. Tabelas conhecidas

Colunas marcadas ✔ foram vistas em `select`/`insert`/`update`/tipos TS ou migrations; outras colunas podem existir.

| Tabela | Colunas vistas no código | Origem |
|---|---|---|
| `couples` | `id`, `anniversary_date`, `created_at` | `CoupleContext`, `useProfile`, `profile.tsx` (update) |
| `couple_members` | `couple_id`, `user_id` | `CoupleContext`, hooks |
| `profiles` | `id`, `display_name`, `avatar_url`, `push_token`, `updated_at` | `useMessages`, `useProfile`, `profile.tsx` (upsert), push |
| `memories` | `id`, `couple_id`, `title`, `memory_date`, `image_url`, `thumb_path`, `created_at`, `created_by` | `useMemories`, migration 20261001 (`thumb_path text`) |
| `messages` | `id`, `couple_id`, `created_by`, `content`, `created_at`, `is_note` (migration `20261004000000`, **a aplicar manualmente no Supabase**); colunas `read`, `read_at`, `seen_at`, `updated_at` citadas **só no trigger** | `useMessages`, migration 02 |
| `special_dates` | `id`, `couple_id`, `title`, `event_date`, `category`, `created_at`, `created_by` | `useDates` |
| `couple_invites` | `code`, `couple_id`, `created_at` | `useProfile` (select) — **sem DDL/RLS no repo** |

## 2. Relações conhecidas (INFERÊNCIA a partir de uso e policies)

- `couple_members (couple_id, user_id)` liga usuário ↔ casal; o app usa `maybeSingle()` para buscar o casal do usuário, o que **pressupõe um casal por usuário** (não verificado como constraint).
- `memories|messages|special_dates|couple_invites` → `couple_id` (casal). `created_by` → usuário.
- `profiles.id` = `auth.users.id` (policies comparam `id = auth.uid()`).
- `ON DELETE CASCADE`: **NÃO VERIFICADO** (nenhuma migration define FKs). O README afirma "deleção em cascata" — afirmação não comprovada pelo repositório.

## 3. RPCs conhecidas (FATO — apenas chamadas; definições NÃO estão no repo)

| RPC | Chamada em | Argumentos | Retorno tratado pelo app |
|---|---|---|---|
| `create_couple` | `onboarding.tsx` | nenhum | `string` (uuid) **ou** objeto com `id`/`couple_id`; senão, fallback consulta `couple_members` |
| `create_couple_invite` | `onboarding.tsx` | `p_couple_id` | `string` **ou** objeto com `code`; senão `String(inviteData)` |
| `redeem_couple_invite` | `onboarding.tsx` | `p_code` (maiúsculo, sem `-`) | erro → mensagem genérica "Código inválido ou expirado" |

O app trata retornos de forma defensiva por não conhecer o contrato (PROBLEMA: contrato não documentado).

Funções/trigger **definidos** nas migrations:
- `public.is_couple_member(p_couple_id uuid) → boolean` — `SECURITY DEFINER`, `search_path = public`.
- `public.messages_guard_update()` + trigger `messages_guard_update` (BEFORE UPDATE em `messages`).
- Referência a `public.rls_auto_enable()` (apenas `REVOKE`; função não definida no repo).

## 4. RLS (FATO — resumo; tabela completa em `SECURITY.md`)

RLS habilitado por migration (`ALTER TABLE IF EXISTS … ENABLE ROW LEVEL SECURITY`) em `couples, couple_members, profiles, memories, messages, special_dates`. **`couple_invites` não aparece em nenhuma migration.** Policies são baseadas em pertencimento ao casal (`couple_members.user_id = auth.uid()` ou `is_couple_member`). Não há policy de INSERT/DELETE visível para `couples`/`couple_members` (criação ocorre via RPC, que não está no repo).

Migrations existentes e ordem (por nome):
1. `20261001_add_thumb_path_to_memories.sql`
2. `20261002000000_strict_rls_policies.sql`
3. `20261002000001_storage_rls_policies.sql` — cria policies de avatar **abertas** (qualquer autenticado) e as restritas de `memories`; contém comentários de raciocínio no corpo.
4. `20261002000002_manual_policies_and_fixes.sql` — remove as policies abertas de avatar e cria "own folder"; adiciona `is_couple_member`, `couples update`, `profiles insert`, nova `messages update` + trigger.

INFERÊNCIA: a migration 3 e a 4 em conjunto deixam o estado final das policies de avatar dependente da ordem de aplicação; a 4 faz `DROP … IF EXISTS` das policies criadas pela 3.

## 5. Storage (FATO)

| Bucket | Convenção de path | Leitura no app | Escrita |
|---|---|---|---|
| `memories` | `<coupleId>/<timestamp>.jpg` e `<coupleId>/<timestamp>_thumb.jpg` | `createSignedUrls` (lote) / `createSignedUrl`, 3600s; fallback `getPublicUrl` em `useHomeData` | policies por pasta `couple_id` (migration 3) |
| `avatars` | `<userId>/<timestamp>.jpg` | `createSignedUrl` 86400s → fallback `getPublicUrl` | policies por pasta `auth.uid()` (migration 4) |

Colunas guardam o **path** (`image_url`, `thumb_path`, `avatar_url`), mas o código também aceita **URLs completas legadas** e as converte com `split('/memories/')` / `split('/avatars/')` (5 pontos duplicados — ver ARCHITECTURE). Criação dos buckets e visibilidade: **NÃO VERIFICADO**. Policy de SELECT do bucket `memories`: não está nas migrations (**NÃO VERIFICADO**).

## 6. Realtime (FATO)

| Canal | Fonte | Eventos |
|---|---|---|
| `home_channel_<coupleId>` | `useHomeData` | `postgres_changes` `*` em `couple_members`, `couples`, `memories`, `messages`, `special_dates` (filtros por `couple_id`/`id`) |
| `messages_room_<coupleId>` | `useMessages` | **Broadcast** `new_message`, `message_confirmed` + `postgres_changes` |
| `memories_tab_<coupleId>` | `useMemories` | `postgres_changes` em `memories` |
| `special_dates_tab_<coupleId>` | `useDates` | `postgres_changes` em `special_dates` |
| `profile_tab_<coupleId>` | `useProfile` | `couples` (UPDATE), `profiles` (próprio e parceiro), `couple_members` |

Quais tabelas estão na publicação `supabase_realtime`: **NÃO VERIFICADO**.

## 7. Queries e paginação (FATO)

- Seleção explícita de colunas (não foi encontrado `select('*')`).
- `messages`: página de 20 (`PAGE_SIZE`), `order created_at desc`, paginação por cursor `lt('created_at', oldest.created_at)`; carga incremental de novas mensagens por `created_at`.
- `memories`: página de 20, ordenada por `memory_date desc, id desc`, cursor composto via `.or('memory_date.lt…,and(memory_date.eq…,id.lt…)')`. (INFERÊNCIA: `id` como desempate só é estável se for ordenável; com uuid v4 a ordem de desempate é arbitrária mas determinística.)
- `special_dates`: **sem paginação** (`order event_date asc`, todas as linhas do casal).
- `useHomeData`: `limit(1)` / `limit(8)` por consulta; 5 cargas independentes.
- Fallback de compatibilidade: se `select` com `thumb_path` falhar com código `42703` (coluna inexistente) ou mensagem contendo `thumb_path`, repete sem a coluna — em `useMemories` (2× no `select` e 1× no `insert` de `addMemory`). PROBLEMA: código defensivo por migration possivelmente não aplicada em algum ambiente.
- Índices: **NÃO VERIFICADO** (nenhum `CREATE INDEX` no repo). Considerar `(couple_id, created_at)` em `messages` e `(couple_id, memory_date, id)` em `memories` — RECOMENDAÇÃO após ver o schema.

## 8. Cache (FATO)

- Memória de módulo: `homeDataCache`, `cachedMemories`, `cachedDates`, `cachedProfileData` (hooks) e um `Map` de signed URL (`features/memories/utils/storage.ts`).
- Sem TTL nem invalidação por troca de casal; limpos no `signOut()` explícito (`AuthContext`).
- Service worker não cacheia chamadas ao Supabase.

## 9. Inconsistências entre README, migrations, código e docs

| # | Afirmação / origem | Realidade verificada |
|---|---|---|
| D1 | README: "Acesso às memórias através de Signed URLs temporárias" | Verdadeiro para `memories` (3600s). `useHomeData` tem fallback para `getPublicUrl`. |
| D2 | README: "Deleção em cascata" | Nenhuma FK/cascade nas migrations; **NÃO VERIFICADO** |
| D3 | README: "Chat em tempo real… `KeyboardAvoidingView`" | O chat não usa `KeyboardAvoidingView`; calcula deslocamento em `MessageInput.getInputOffset` |
| D4 | README: "Todas as operações … validadas contra o `couple_id`" | Verdadeiro para as 6 tabelas com policy; `couple_invites` e RPCs **sem evidência** |
| D5 | README: stack "Expo SDK 57", RN 0.86 | Confere com `package.json` |
| D6 | README: palavra "Pêssego" na paleta | A paleta do código é lavanda/ametista/rosa (`accent`); não há token pêssego |
| D7 | README: clone `SEU-USUARIO` | placeholder; nenhuma instrução de migrations/Supabase setup |
| D8 | Migration 3 comentário: avatar insert exige nome com `user_id` | Código usa `<userId>/…` (pasta); migration 4 corrige |
| D9 | `docs/design.md` e contrato local anterior (histórico): abas "Recados"/"Ajustes" | Código: "Mensagens"/"Perfil" |
| D10 | `docs/legal/*.md` vs `src/constants/legal/*.ts` | Duas cópias (294 linhas no total); sem verificação de equivalência |
| D11 | Trigger `messages_guard_update` permite `read`, `read_at`, `seen_at` | O app não seleciona nem escreve essas colunas (nenhum "lido" implementado nas queries vistas) |

## 10. O que precisa ser verificado/exportado

1. `supabase db dump` (schema) → migration inicial versionada; comparar com as 4 migrations.
2. Definição e permissões das RPCs `create_couple`, `create_couple_invite`, `redeem_couple_invite`; expiração/uso único do código.
3. RLS e policies de `couple_invites`.
4. Visibilidade dos buckets `avatars` e `memories` e policies de SELECT.
5. Publicação Realtime e Realtime Authorization.
6. FKs, `ON DELETE`, unicidade de `couple_members.user_id`, índices.
7. Existência de `rls_auto_enable()` e demais funções.
8. Se todas as migrations foram aplicadas em produção e em que ordem.
