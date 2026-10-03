# Fase 1: Segurança e Dependências

## 1. Dependências
- Executado `npm audit --omit=dev` e resolvidas as vulnerabilidades (`npm audit fix`). Mantida a compatibilidade de SDK verificada com `expo-doctor`.
- Removido `@expo/ngrok` e instalado `sharp` para manipulação de imagem.

## 2. Segredos e Variáveis de Ambiente
- `EXPO_PUBLIC` e URIs verificados no git log, não há senhas vazadas (apenas mockups do `supabase.co` e anon keys que são públicas).
- O `.env` está isolado com `.env.example` disponibilizado para a equipe.
- Token de Sessão: o token JWT é guardado em **AsyncStorage** (padrão do `supabase-js` em React Native), sendo recomendado migrar para `expo-secure-store` no futuro.

## 3. Uploads de Imagens (Avatares e Memórias)
- Orientação EXIF: substituímos chamadas diretas que removiam dados sem corrigir rotação pelo nosso utilitário cross-platform em `lib/imageManipulation.ts`. Ele aplica a orientação no frame (com `createImageBitmap` no Web ou omitindo `height` no Nativo) antes da remoção dos metadados.
- Cobertura: corrigido nos Avatares e Memórias (imagem principal e thumbnails).
- Validação: o CLI impõe controle por qualidades, mas a nível de storage foi gerado um policy e uma validação deve ser contida.

## 4. Realtime Channels
- **Filtrados por casal:** Todos os listeners nas telas (`index.tsx`, `dates.tsx`, `memories.tsx`, `messages.tsx`, `profile.tsx`) utilizam `filter: couple_id=eq.${coupleId}` ou fitros por `user.id`. Nenhuma assinatura ouve a tabela toda sem filtro, garantindo que o Web Socket não vaze dados alheios.

## 5. Código de Vínculo (Invite)
- **Como funciona:** Hoje o vínculo utiliza três RPCs no Onboarding: `create_couple`, `create_couple_invite` e `redeem_couple_invite`.
- **Risco:** Códigos muito curtos ou sem taxa limite (rate limit) de tentativas (brute force) no RPC `redeem_couple_invite` abrem brecha para um ator entrar em casais de terceiros.
- **Mitigação:** Uma nova versão do RPC e regras Zod foram propostas, limitando caracteres e exigindo chaves mais complexas, com expiração restrita.

## 6. Logs de Sistema (console.warn)
- Criado o arquivo `lib/logger.ts`. Substituímos o uso espalhado de `console.warn` e `console.error` em arquivos-chave para evitar logs indevidos em produção (vazamentos de informações do usuário/token se capturados).

## 7. RLS e Policies Omitidas/Correções Manuais
Durante a operação, o app executa atualizações e leituras específicas:
- `couples`: Atualização de data de aniversário (`UPDATE`). Faltava policy.
- `couple_members`: Verificações base.
- `profiles`: O app faz `upsert` no perfil (exige `INSERT` e `UPDATE`). Faltava `INSERT`.
- `messages`: O parceiro atualiza `read: true` nas mensagens do autor. A policy antiga restringia updates só para o criador, bloqueando o recibo de leitura.

Foi criado `20261002000002_manual_policies_and_fixes.sql` contendo:
- A função RPC manual `is_couple_member(uuid)` (ganho em performance nas policies em vez de subqueries aninhadas repetitivas).
- As policies de correção mencionadas (`UPDATE` message/couple, `INSERT` profile).
- As policies rígidas sobre a pasta `avatars` em Storage (uma vez que os avatares operam em pastas com `auth.uid()`).
