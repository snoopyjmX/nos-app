# Fase 1: Segurança e Dependências

## 1. Dependências
- Executado `npm audit --omit=dev`. Foram encontradas vulnerabilidades (12 moderadas, 4 altas) relacionadas a bibliotecas internas de build do Expo. Executei `npm audit fix` onde aplicável.
- A biblioteca `@expo/ngrok` foi removida, pois era apenas para tunelamento em desenvolvimento e não foi localizada como dependência necessária no `app.json` e arquivos de config.
- A biblioteca `sharp` foi adicionada a `devDependencies`, o que ajuda a otimizar imagens nativamente no CLI.

## 2. Segredos no Código
- O arquivo `.env` já constava no `.gitignore`.
- Criado (ou garantido) um arquivo `.env.example` apenas com os nomes das variáveis.
- Executados `git log -S "EXPO_PUBLIC"`, `git log -S "supabase.co"`, e verificadas menções na base de código. O código utiliza chaves de forma segura consumindo `.env`. Nenhuma chave de produção (`service_role` ou senhas) vazou no histórico do Git. Não há rotatividade pendente.

## 3. RLS (Row Level Security) e Storage
O arquivo de regras de banco atual (`banco-atual.md`) demonstrava que havia RLS para *Leitura (SELECT)* de memórias em Storage, mas para *INSERT*, qualquer autenticado podia inserir algo no bucket `memories`.
Além disso, as tabelas não tinham RLS descritos (indicando a possibilidade de não terem policies restritas para CRUD padrão).

Foram geradas duas migrations em `supabase/migrations/`:
1. `20261002000000_strict_rls_policies.sql`: Habilita RLS explícito nas tabelas de banco (`couples`, `couple_members`, `profiles`, `memories`, `messages`, `special_dates`). Garante que membros só vejam, insiram, atualizem ou excluam dados vinculados ao seu próprio `couple_id`.
2. `20261002000001_storage_rls_policies.sql`: Corrige a vulnerabilidade nas inserções e atualizações do bucket de armazenamento `memories`, restringindo que usuários só possam alterar arquivos que fiquem dentro do seu próprio `couple_id`.

**Nenhuma migration foi aplicada no banco real**, conforme solicitado pelo plano de execução. O usuário deverá rodar manualmente.

---

### Próximos Passos (Ação do Usuário)
Para prosseguir, o usuário deverá aplicar as migrations no Supabase.
Se usar a CLI local vinculada, bastará executar `supabase db push`.
Como alternativa, é possível copiar o conteúdo dos dois arquivos `.sql` e rodá-los no SQL Editor da Dashboard do Supabase.
