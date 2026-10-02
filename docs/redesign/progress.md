# Progresso do redesign do NÓS

Atualizado pelo agente ao fim de cada fase. Não apague este arquivo.

## Fases

- [x] Fase 0: Auditoria (docs/redesign/00-auditoria.md)
- [x] Fase 1: Segurança e dependências
- [x] **PARADA 1**: usuário aplica as migrations e rotaciona chaves, se preciso
- [x] Fase 2A: Estrutura e qualidade
- [x] Fase 2B: 1ª tela (a menor)
- [x] **PARADA 2**: usuário confere que a tela é igual à anterior
- [x] Fase 2B: demais telas, uma a uma
- [x] **PARADA 3**: usuário testa o app inteiro
- [x] Fase 3A: Tokens
- [x] Fase 3B: Componentes do design system
- [x] Fase 4: Casca do app, dock e PWA
- [x] **PARADA 4**: usuário vê /dev/design-system e a dock no iPhone
- [x] Fase 5: Início
- [x] **PARADA 5**: usuário aprova o visual
- [x] Fase 6: Recados
- [x] Fase 7: Memórias
- [x] Fase 8: Datas
- [ ] Fase 9A: Ajustes e vínculo (Perfil)
- [x] Fase 9B: Telas de boas-vindas, login e cadastro (Auth)
- [ ] **PARADA 6**: usuário revisa as telas
- [ ] Fase 10: Acessibilidade
- [ ] Fase 11: Performance
- [ ] Fase 12: Testes
- [ ] Fase 13: Revisão final de segurança e release
- [ ] **PARADA 7**: fim, usuário revisa e faz o merge

## Registro por fase

(O agente acrescenta aqui, a cada fase: o que foi feito, arquivos alterados, pendências, riscos e o que o usuário precisa testar ou fazer.)
### Fase 1: Segurança e Dependências
- Limpeza de dependências nulas e vulnerabilidades mitigadas.
- Verificação de segredos e chaves de banco.
- Criação de migrations de RLS rigoroso para tabelas e storage.
- **Pendente para o Usuário (PARADA 1)**: Aplicar as `migrations` contidas em `supabase/migrations/` pelo console do Supabase ou CLI (`supabase db push`).

### Fase 2A: Estrutura e Qualidade
- Criada a nova árvore em `src/` (`app`, `design`, `features`, `lib`).
- Imports atualizados para usarem o path alias `@/*`.
- Configurado TypeScript strict, ESLint, npm scripts (`check`, `typecheck`, `lint`) sem desativar novas regras.
- Adicionado `ErrorBoundary` global em `src/app/_layout.tsx`.
- **Pendente para o Usuário**: Iniciar o app e validar que a navegação e a tela inicial continuam funcionando 100% como antes da refatoração. Nenhuma mudança visual ou de comportamento foi feita.

### Fase 2B: 1ª tela (a menor)
- **O que foi feito:** Refatorada a tela `messages.tsx`.
- **Arquivos criados:**
  - `src/features/messages/types.ts`
  - `src/features/messages/utils/dateFormatting.ts`
  - `src/features/messages/utils/stringFormatting.ts`
  - `src/features/messages/api/useMessages.ts` (Hook com Supabase e Realtime)
  - `src/features/messages/components/MessagesHeader.tsx`
  - `src/features/messages/components/MessageBubble.tsx`
  - `src/features/messages/components/MessageInput.tsx`
  - `src/features/messages/components/MessagesSkeleton.tsx`
  - `src/features/messages/components/MessageList.tsx`
- **Tornar a Rota Fina:** `messages.tsx` reduzida de 1410 para cerca de 220 linhas, servindo apenas para montar e orquestrar os componentes com os dados da API.
- **Pendente para o Usuário (PARADA 2):** 
  - Limpar o cache do bundler (que está causando o erro "Cannot find native module 'ExpoAsset'").
  - Testar a aba de Recados (messages) e confirmar que funciona **exatamente** igual a antes (renderização, animações, blur, chat realtime e visual).

### Fase 2B: 2ª tela (memories.tsx)
- **O que foi feito:** Refatorada a tela `memories.tsx`.
- **Arquivos criados:**
  - `src/features/memories/types.ts`
  - `src/features/memories/utils/formatting.ts`
  - `src/features/memories/utils/storage.ts`
  - `src/features/memories/api/useMemories.ts` (Hook com Supabase, Batch URL Signing e Realtime)
  - `src/features/memories/components/MemoryCard.tsx`
  - `src/features/memories/components/MemoryList.tsx`
  - `src/features/memories/components/MemoriesHeader.tsx`
  - `src/features/memories/components/MemoryFAB.tsx`
  - `src/features/memories/components/AddMemoryModal.tsx`
  - `src/features/memories/components/MemoryPreviewModal.tsx`
- **Tornar a Rota Fina:** `memories.tsx` reduzida de 1615 para cerca de 270 linhas, limpando toda a interface para componentes especialistas e a lógica de banco de dados para o hook `useMemories`.
- **Pendente para o Usuário:** 
  - Testar a aba de **Memórias** e confirmar que a listagem, pull-to-refresh, modal ampliado, exclusão e a adição de foto continuam funcionando como antes.

### Fase 2B: 3ª tela (profile.tsx)
- **O que foi feito:** Refatorada a tela `profile.tsx`.
- **Arquivos criados:**
  - `src/features/profile/types.ts`
  - `src/features/profile/utils/formatting.ts`
  - `src/features/profile/api/useProfile.ts` (Hook com Supabase e Realtime)
  - `src/features/profile/components/ProfileHero.tsx` (Com animação de pulso)
  - `src/features/profile/components/RelationshipSection.tsx`
  - `src/features/profile/components/ThemeSection.tsx`
  - `src/features/profile/components/SecuritySection.tsx`
  - `src/features/profile/components/AccountActions.tsx`
  - `src/features/profile/components/AnniversaryModal.tsx`
- **Tornar a Rota Fina:** `profile.tsx` reduzida de 1644 para cerca de 295 linhas.
- **Pendente para o Usuário:** 
  - Testar a aba de **Ajustes (Perfil)** e confirmar que as alterações de tema, cópia do código, avatar e logout funcionam perfeitamente.
### Fase 2B: 4ª tela (index.tsx)
- **O que foi feito:** Refatorada a tela `index.tsx` (Início).
- **Arquivos criados:**
  - `src/features/home/types.ts`
  - `src/features/home/utils/time.ts`
  - `src/features/home/api/useHomeData.ts` (Cache SWR, Realtime com 5 tabelas)
  - `src/features/home/components/CoupleJourneyCounter.tsx`
  - `src/features/home/components/HeroCard.tsx`
  - `src/features/home/components/ShortcutsRow.tsx`
  - `src/features/home/components/NextMilestoneCard.tsx`
  - `src/features/home/components/RecentMemoryCard.tsx`
  - `src/features/home/components/ThrowbackMemoryCard.tsx`
- **Tornar a Rota Fina:** `index.tsx` reduzida de 1720 para cerca de 320 linhas.
- **Pendente para o Usuário:** 
  - Testar a aba de **Início** e confirmar que a saudação, o contador ao vivo (jornada), o card de próxima celebração, os atalhos e os mini-cards de memória funcionam sem piscar e exatamente iguais.

### Dates (5ª tela - concluída)
- Dividida logicamente com hooks customizados (`useDates`) isolados em `src/features/dates/api/`.
- Componentes complexos `Floating3DHeart`, `CountdownDigits`, `DatesHeroCard`, `DateListItem` e `AddDateModal` extraídos.
- Funções de cálculo de datas e utilitários colocados em `src/features/dates/utils/`.

### Fase 3A: Tokens de Design
- **O que foi feito:** Criada a infraestrutura base do Design System (`src/theme/`).
- **Arquivos criados:**
  - `src/theme/colors.ts`: Paleta de cores com suporte a `light` e `dark`, garantindo que não haja "preto puro" e sim `roxo-noite`, além da acentuação rosa e tons pastéis (`primarySoft`, `accentSoft`).
  - `src/theme/typography.ts`: Famílias, pesos, tamanhos (escala modular) e alturas de linha baseados em Nunito e Fraunces.
  - `src/theme/spacing.ts`: Espaçamentos (base 4) e raios de borda (`sm`, `md`, `lg`, `pill`).
  - `src/theme/shadows.ts`: Sombras nos níveis `soft` e `medium` com tom difuso roxo/preto (dependendo do esquema de cor).
  - `src/theme/motion.ts`: Durações de animação (`micro`, `normal`, `celebration`) e *easings* otimizados (ease-out, springs) para Reanimated.
  - `src/theme/index.ts`: Hook `useTheme()` para expor os tokens no contexto correto com tipagem forte e esquema de cores automático (React Native `useColorScheme`).
- **Pendente:** Iniciar a Fase 3B (Componentes base) utilizando esses tokens.

### Fase 3B: Componentes do Design System
- **O que foi feito:** Criada a biblioteca de componentes base reaproveitáveis (`src/components/ui/`), todos consumindo estritamente os tokens de `src/theme/`.
- **Componentes criados:**
  - `Screen`: Container base com tratamento de insets (Safe Area) e espaço reservado para a Tab Bar flutuante.
  - `PressableScale`: Botão base com animação de escala (spring) via Reanimated.
  - `Button`: Botão principal com suporte a variantes (primary, secondary, ghost) e estado de loading.
  - `IconButton`: Botão apenas com ícone (Feather).
  - `Card`: Container com variantes (elevated, outlined) aplicando bordas e sombras do tema.
  - `Chip`: Indicador visual/tag arredondada.
  - `SectionTitle`: Título e subtítulo padronizado para seções.
  - `Avatar`: Imagem redonda de usuário ou placeholder com iniciais.
  - `EmptyState`: Estado vazio amigável, com ícone, título, descrição e botão de ação.
  - `Skeleton`: Placeholder animado (pulsante) para estados de carregamento.
  - `Toast`: Mensagem flutuante para feedback rápido (sucesso, erro, info).
- **Pendências:** Iniciar a migração da casca do app e Tab Bar (Fase 4).

### Fase 4: Casca do app, dock e PWA
- **O que foi feito:**
  - Migrada a antiga Tab Bar (`LiquidTabBar`) para dentro do Design System novo em `src/components/layout/TabBar.tsx`, refatorada para consumir estritamente os tokens de `@/theme` e ícones `Feather`.
  - Migrado o componente `Toast` e `UpdateBanner` para a nova estrutura base `src/components/ui/`, refatorando os ícones para `Feather` e as cores/tipografia para consumir `useTheme()`.
  - Revisado e verificado o arquivo `sw.js` (PWA Cache) e `manifest.json`.
  - Criada a tela `/dev/design-system` para expor o catálogo de componentes visuais do app de forma isolada.
- **Pendências para o Usuário (PARADA 4):** Abrir o app no iPhone (ou Safari Desktop), navegar até a rota `/dev/design-system`, inspecionar o visual e comportamento da Dock flutuante, e validar a coesão do Design System até o momento.

### Fase 5: Início
- **O que foi feito:**
  - Migrada a tela `index.tsx` da Tab Bar (Início) para utilizar o novo componente base `<Screen />`.
  - Refatorado todos os cards da Home: `HeroCard`, `ShortcutsRow`, `NextMilestoneCard`, `RecentMemoryCard`, `ThrowbackMemoryCard` e `CoupleJourneyCounter`.
  - Removido dependência do `AppHeader`, `GlassSurface` e `AtmosphereBackground` da rota `/`, inserindo cabeçalho minimalista em sintonia com a identidade nova e implementando tokens via `useTheme()`.
  - Atualizado todos os ícones da Home para `Feather` com ajustes de tamanhos.
- **Pendências para o Usuário (PARADA 5):** Navegar para a tela "Início", avaliar os espaços, a nova tipografia, as bordas, as cores quentes, e como as animações de cascata/entrada ocorrem.

### Fase 6: Recados
- **O que foi feito:**
  - Migrada toda a estrutura da tela de Mensagens para utilizar o tema e `colors` direto do novo core de UI.
  - Refatorados o Header (substituindo o antigo desfoque de `GlassSurface` por um visual minimalista e sólido que otimiza performance web), a barra de Input e as bolhas do Chat (`MessageBubble`).
  - O Chat agora usa os Feather Icons e possui os marcadores de dia de maneira padronizada.
  - Refatorado o "Skeleton" de carregamento e o `EmptyState` central.
- **Pendências:** Validar com o usuário se o Chat ficou fluido e sem resíduos visuais do design velho.

### Fase 7: Memórias
- **O que foi feito:**
  - Migrados todos os componentes `MemoryCard`, `MemoryList`, `MemoryFAB`, `AddMemoryModal`, `MemoryPreviewModal` para consumir os tokens nativos de `@/theme`.
  - Removemos fundos blur caros e passamos a usar sombras leves e botões padronizados (`Button`, `IconButton`) com fallback nativo.
  - Skeletons padronizados via UI e substituição total de ícones para o Feather.
- **Pendências:** Validar abertura do preview de fotos com o usuário.

### Fase 8: Datas
- **O que foi feito:**
  - Migração de `DatesHeroCard`, `CountdownDigits`, `DateListItem`, `AddDateModal`, `FilterTabs` e `dates.tsx` para o `@/theme` e uso de Feather.
  - O header agora é simples, com fundo sólido, para melhorar a performance.
  - Remoção de blurs pesados em modais de adicionar evento, mantendo a experiência fluida no PWA web e iOS.
- **Pendências:** Confirmar os tamanhos de fonte no contador se ficam bons em telas pequenas.
