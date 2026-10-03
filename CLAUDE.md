# CLAUDE.md — Contrato operacional do NÓS

Fonte de verdade compartilhada entre Claude Code, Gemini e o desenvolvedor humano.
Última verificação contra o código: 2026-10-03. Detalhes em `docs/`.

**Convenção de rótulos** (usada em todos os documentos): **FATO** (confirmado no código), **DECISÃO** (já existente e comprovada), **PROBLEMA** (identificado), **RECOMENDAÇÃO** (futura, **não implementada**), **TARGET** (estado-alvo, inexistente hoje).
Nenhum agente deve assumir que uma RECOMENDAÇÃO ou TARGET já foi implementada.

---

## 1. Identidade

- **NÓS** ("nós.") é um app privado para um casal (duas pessoas). Slogan: "Um espaço só nosso."
- Estética: Apple-inspired Liquid Glass, minimalismo de luxo, atmosfera noturna serena. Idioma da interface: pt-BR.
- Plataformas: iOS, Android e PWA web (`app.json`, `public/manifest.json`, `public/sw.js`).

## 2. Stack real (de `package.json`, 2026-10-03)

Expo `~57.0.26` · React Native `0.86.3` · React `19.2.3` · Expo Router `~57.0.23` · Reanimated `4.5.1` + `react-native-worklets 0.10.1` · gesture-handler `~2.32.0` · TypeScript `~6.0.3` (strict) · `@supabase/supabase-js ^2.117.2` · `expo-blur`, `expo-haptics`, `expo-image`, `expo-linear-gradient`, `expo-notifications` · `react-native-web ^0.21.2` · `@expo/vector-icons` (Feather).

**Não existem** no projeto: biblioteca de cache de dados (React Query/SWR), estado global (Zustand/Redux), testes, CI, FlashList. Não os use nem presuma que existem.

## 3. Arquitetura real (resumo — ver `docs/ARCHITECTURE.md`)

- Rotas em `src/app/` (grupos `(auth)`, `(tabs)`, mais `onboarding`, `terms`, `privacy`). Alias `@/*` → `src/*`.
- Features em `src/features/<nome>/{api,components,utils,types.ts}` para `home`, `dates`, `memories`, `messages`, `profile`. Hooks de dados ficam em `api/use*.ts`.
- UI compartilhada em `src/components/ui` (barrel `index.ts`), dock em `src/components/layout/TabBar.tsx`.
- Contexts em `src/lib/context`: `Auth`, `Couple`, `Theme`, `Toast`. Infra em `src/lib/core`. Tokens em `src/theme`.
- Providers (ordem real): GestureHandler → SafeArea → Theme → Toast → Auth → Couple.
- **FATO:** a arquitetura real **viola** parte das regras abaixo (lógica de Supabase em rotas e na TabBar; caches de módulo). Isso está catalogado em `docs/ROADMAP.md`. Não "corrija de passagem": só altere o que foi pedido.

## 4. Convenções comprovadas

- TypeScript estrito; imports via `@/`; componentes funcionais; estilos com `StyleSheet.create` + valores de `useTheme()`.
- Feature = `types.ts` (modelo), `api/use<Feature>.ts` (dados), `components/` (views), `utils/` (funções puras).
- Erros: `logger.warn/error` (`src/lib/core/logger.ts`, só emite em `__DEV__`). Avisos ao usuário via Toast (`ToastContext`) ou `Alert`.
- Textos de UI e `accessibilityLabel` em pt-BR.

## 5. Regras obrigatórias de arquitetura

1. Rotas em `src/app/(tabs)/*.tsx` orquestram componentes; **código novo** não coloca query/upload/RPC do Supabase na rota nem em componente de UI. Use/crie hook em `features/<x>/api/`.
2. Reaproveite componentes e hooks existentes antes de criar novos; se criar, explique por quê.
3. Sem dados fictícios hardcoded em produção (nomes, contagens, datas).
4. Sem código morto, arquivos comentados ou pastas órfãs. Sem scripts de patch na raiz (`fix_*.js` etc.). Edite os arquivos de fonte.
5. Não introduza dependência, biblioteca de estado/cache ou padrão arquitetural novo sem decisão registrada em `docs/DECISIONS.md` (ver "Open decisions") e aprovação do usuário.
6. Mudança visual não altera lógica de dados; mudança de dados não altera visual. Em dúvida, pergunte.

## 6. Regras de UI/UX e design

- Cores, espaços, raios, sombras e fontes vêm de `@/theme` (`useTheme()`). Sem hex/rgba soltos em código novo. (FATO: hoje há 14 ocorrências legadas fora de `src/theme/`.)
- Fundo noturno nunca é preto puro. Valores reais: `src/theme/colors.ts` (o **código vence** `docs/design.md`; ver divergências em `docs/DESIGN_SYSTEM.md`).
- Vidro **somente** via `LiquidGlassView` (+ `glassWeb.ts` na web). Regra de ouro iOS: view externa = sombra + raio; view interna = `overflow: 'hidden'`, blur, borda, reflexo. Sombra e `overflow: hidden` nunca na mesma view. Texto corrido sobre vidro usa `readable`/`glassSurfaceReadable`. Máx. 2–3 camadas de blur por tela.
- Proibido: estética de app de namoro, corações em excesso, neon, métricas biométricas fictícias, selos de segurança que o app não cumpre ("E2EE" etc.).
- Toda tela rolável compensa a dock com `useDockInset()` (hoje retorna no mínimo **150**; o contrato histórico dizia 140 — valor do código prevalece).
- Todo dado exibido tem estados de loading, vazio e erro.
- Nomes de abas: **atenção** — o código usa "Início, Mensagens, Memórias, Datas, Perfil"; `docs/design.md` (e um contrato local anterior, hoje histórico) usam "Recados" e "Ajustes". Não renomeie sem pedido (ver ROADMAP).

## 7. Regras de motion (ver `docs/MOTION_DESIGN.md`)

- Presets em `theme/motion.ts` (`springDock`, `springPressIn/Out`, `springShort`, `springBounce`). Não invente springs soltas.
- Sem `withTiming` sem easing explícito. Sem animação decorativa, sem loop infinito de decoração.
- Prefira `transform`/`opacity`; não anime `width/height/top/left`.
- Reduced Motion é obrigatório em todo componente animado. FATO: coexistem dois hooks (`@/lib/hooks/useAccessibility` em 9 arquivos e `react-native-reanimated` em 4). Em código novo use o de `useAccessibility` até decisão contrária.
- Haptics (`expo-haptics`, impacto leve) só em ações intencionais; nunca em loops/efeitos passivos.

## 8. Regras de acessibilidade

- Alvo de toque ≥ 44×44 (dock: 48×48). Contraste ≥ 4,5:1 em texto normal.
- `accessibilityRole` + `accessibilityLabel` pt-BR em todo `Pressable`/imagem; títulos de tela/seção com `accessibilityRole="header"`.
- Respeitar Reduce Motion e Reduce Transparency (`LiquidGlassView` já respeita este último).
- Cor nunca é o único indicador de estado.

## 9. Regras de segurança e Supabase (ver `docs/SECURITY.md`, `docs/DATABASE.md`)

- **Nunca** use `service_role` nem segredo no cliente. Só `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`. `.env` está no `.gitignore`; nunca o imprima nem comite.
- Todas as tabelas de dados têm RLS (migrations). Não crie tabela, policy ou bucket sem migration versionada em `supabase/migrations/`.
- **Não execute migrations, `supabase db push` ou SQL remoto** sem pedido explícito.
- **FATO:** o schema base e as RPCs (`create_couple`, `create_couple_invite`, `redeem_couple_invite`) **não estão** no repositório. Não presuma colunas/RPCs além das listadas em `docs/DATABASE.md`; confirme com o usuário/painel.
- Path de Storage e URLs assinadas: hoje há parsing duplicado (ver ROADMAP). Em código novo, não replique o `split('/memories/')`.
- Logout/troca de usuário: não adicione novos caches de módulo (`let cached… = null`) — FATO: os existentes não são limpos no logout.
- Não registre tokens, e-mails ou conteúdo de mensagens em logs.

## 10. Regras de navegação

- Expo Router baseado em arquivos. Redirecionamento hoje vive em **dois** lugares (`src/app/_layout.tsx` e `src/app/index.tsx`) — não adicione um terceiro. Qualquer mudança nos guards exige decisão (ver "Open decisions").
- Ordem das abas está duplicada em `TabBar.tsx` (mapa de labels/ícones) e em `(tabs)/_layout.tsx` (`tabOrder` do gesto de swipe). Ao adicionar/remover aba, atualize ambos.

## 11. Workflow obrigatório para alterações

1. **Verifique antes de usar.** Leia o arquivo real e `package.json`; para qualquer API de Expo/RN/Reanimated/Supabase/Router, confirme a versão instalada em `node_modules` ou na documentação **dessa versão** antes de usar. Nunca invente API, prop, dependência ou arquitetura.
2. **Liste os arquivos** que pretende criar/editar antes de mexer.
3. **Uma fase por vez.** Sem refatorações oportunistas fora do escopo.
4. Preserve o design system: reutilize tokens e componentes existentes.
5. **Valide depois:** rode `npm run check` e informe o resultado real (incluindo warnings). Se falhar, diga; não esconda.
6. **Explique** decisões técnicas relevantes (o quê, por quê, alternativas) e **diferencie fato de recomendação** na resposta.
7. Atualize a documentação em `docs/` quando a mudança alterar um fato documentado (e mova itens do ROADMAP só quando realmente concluídos e verificados).
8. Conflito entre pedido do usuário e este contrato: sinalize e peça confirmação.
9. Commits/push apenas quando o usuário pedir.

## 12. Comandos de validação (de `package.json`)

| Comando | Faz |
|---|---|
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `ESLINT_USE_FLAT_CONFIG=false eslint .` |
| `npm run check` | typecheck + lint |
| `npm run build` | `expo export -p web` (saída `dist/`, ignorada pelo git) |
| `npm start` / `ios` / `android` / `web` | Expo dev server |

Estado verificado em 2026-10-03 (antes da escrita desta documentação): `tsc` 0 erros; eslint 0 erros e 30 warnings. Não há testes automatizados.

## 13. Comportamento esperado do Claude Code

- Modelos: **haiku** para tarefas simples, **sonnet** para tarefas complexas. **Nunca use opus** (preferência do usuário, global e do projeto).
- Não crie Skills, Agents, MCPs ou Hooks sem pedido explícito.
- Não instale dependências, não execute migrations, não faça commits sem pedido.
- Em respostas, use os rótulos FATO / INFERÊNCIA / RECOMENDAÇÃO. Diga o que **não** conseguiu verificar.
- Se o código contradiz um documento, o **código vence**; avise e proponha atualizar o documento.

## 14. Mapa dos documentos

`docs/ARCHITECTURE.md` · `docs/DESIGN_SYSTEM.md` · `docs/UI_UX_GUIDELINES.md` · `docs/MOTION_DESIGN.md` · `docs/SECURITY.md` · `docs/DATABASE.md` · `docs/ROADMAP.md` · `docs/DECISIONS.md` · `docs/design.md` (referência visual legada; diverge dos tokens) · `docs/legal/*`.

> Fontes de verdade: este `CLAUDE.md` (operacional) e `docs/*` (detalhe). O projeto **não depende** de `AGENTS.md`: ele é um arquivo local, ignorado pelo Git, e pode não existir em outro clone. Qualquer menção a ele neste repositório é apenas histórica. Se você o encontrar localmente, não o trate como regra; em conflito, vale este arquivo.
