# DESIGN SYSTEM

Rótulos: **FATO**, **PROBLEMA**, **RECOMENDAÇÃO**, **TARGET** (ver `CLAUDE.md`).
Fonte de verdade dos valores: `src/theme/*.ts`. Em conflito, **o código vence** `docs/design.md`.
Verificado em 2026-10-03.

## 1. Como o tema é consumido (FATO)

- `src/theme/index.ts` exporta `theme`, `getThemeColors(isDark)` e `useTheme()`.
- `useTheme()` retorna `{ colors, typography, spacing, radii, shadows, motion, isDark }`. `colors` e `shadows` mudam conforme `isDark` (vindo do `ThemeContext`); os demais são constantes.
- O `ThemeContext` só conhece dois modos: `light` e `dark`. Segue o sistema (`useColorScheme`/`matchMedia`) até o usuário escolher; a escolha fica em AsyncStorage (`@nos_theme_mode`).
- `LiquidGlassView` usa `useAppTheme()` + `getThemeColors()` diretamente.

## 2. Cores (`src/theme/colors.ts`) — FATO

Mesmo conjunto de chaves em `colors.light` e `colors.dark` (`ColorToken = keyof ColorTheme`).

| Grupo | Tokens |
|---|---|
| Marca | `primary`, `primarySoft`, `accent`, `accentSoft`, `glow`, `orbLavender`, `orbPink` |
| Base | `background`, `surface`, `surfaceSubtle`, `border`, `shadow` |
| Texto | `textPrimary`, `textSecondary`, `textMuted`, `primaryText`, `accentText`, `dangerText`, `onPrimary`, `white` |
| Estado | `error`, `danger`, `success` |
| Vidro | `glassSurface`, `glassSurfaceReadable`, `glassBorder`, `glassBorderTop`, `glassHighlight` (array) |
| Dock | `dockIndicator` (array), `dockIndicatorGlint` (array), `dockIndicatorBorder`, `dockFade` (array) |
| Gradientes | `progressGradient`, `bubbleSent`, `celebrationGradient` |
| Foto | `photoScrim`, `photoScrimTop`, `photoBadge`, `photoInfo` |
| Overlays | `overlayDark`, `overlayMedium`, `overlayLight`, `countdownFillLight`, `countdownFillDark` |
| Categorias de data | `catTravel/Date/Celeb/Bday/Other` + `…Bg` |
| Outros | `avatarBorder` |

Valores-chave:

| Token | Light | Dark |
|---|---|---|
| `background` | `#F8F6FE` | `#15122A` |
| `surface` | `#FFFFFF` | `#1F1B3A` |
| `primary` | `#7C6FE0` | `#9D92F0` |
| `accent` | `#F58FA8` | `#F7A6BB` |
| `onPrimary` | `#1E1A33` | `#15122A` |
| `textPrimary` / `textSecondary` | `#1E1A33` / `#5B5675` | `#F3F1FB` / `#B7B2D0` |
| `glassSurface` | `rgba(255,255,255,0.45)` | `rgba(255,255,255,0.07)` |
| `glassSurfaceReadable` | `rgba(255,255,255,0.58)` | `rgba(255,255,255,0.10)` |
| `bubbleSent` | `['#7A55F5','#8B5CF6']` | igual |

PROBLEMAS (FATO):
- Tokens de categoria (`catTravel`…`catOtherBg`) têm **valores idênticos** em light e dark; os fundos foram definidos com alpha 0.12–0.15 sem variação por tema.
- `error` (`#EF4444`) e `danger` (`#FF3B30`/`#FF453A`) coexistem sem distinção documentada no código.
- Nenhum cálculo de contraste foi executado nesta documentação; os comentários "AA" em `colors.ts` são **afirmações do código, não verificadas aqui**.

## 3. Divergências entre `docs/design.md` e os tokens do código (FATO)

| Item | `docs/design.md` | Código |
|---|---|---|
| Fundo escuro | `#0F0D18` | `#15122A` |
| Superfície escura | `#14121D` / `#1C1A26` | `#1F1B3A` / `#262145` (`surfaceSubtle`) |
| Primária | `#A797FF` | dark `#9D92F0`; light `#7C6FE0` (`#A797FF` existe só em `glow` e gradientes) |
| `on-primary` | `#16151E` | `#1E1A33` / `#15122A` |
| Fundo claro | `#F8F9FC` | `#F8F6FE` (o `app.json` e `app/index.tsx` ainda usam `#F8F9FC`) |
| Tinta do vidro | "~14% claro / ~10% escuro" | 45% claro / 7% escuro |
| Piso legível | "~32% / ~38%" | 58% / 10% |
| Raio de card | `lg` = 32px | `radii.lg` = 28 |
| Largura máx. | 520px / 768px | `MAX_CONTENT_WIDTH` = 560 |
| Escala tipográfica | `display-hero 56`, `metric 28`, `label-caps 11`… | `fontSize`: xs12, sm14, md16, lg20, xl24, 2xl32, display44 |
| Nomes das abas | Recados / Ajustes | Mensagens / Perfil |

`docs/design.md` (legado, anterior a esta documentação) ainda menciona um arquivo local de regras de agente (`AGENTS.md`, ignorado pelo Git). Isso é apenas histórico: o projeto não depende dele; as regras vigentes estão em `CLAUDE.md` e `docs/*`.
RECOMENDAÇÃO: decidir se `design.md` será reescrito a partir dos tokens ou aposentado (ROADMAP P2-08). Até lá, trate-o como **referência de intenção**, não de valores.

## 4. Tipografia (`typography.ts`) — FATO

- Família: `"Plus Jakarta Sans", -apple-system, sans-serif` **na web**; `System` no nativo (não há `expo-font`/fonte embarcada: a fonte vem do `<link>` do Google Fonts em `+html.tsx`). Logo, no iOS/Android nativo **não** é Plus Jakarta Sans.
- `font.regular/medium/bold/black` = pesos 400/600/700/800 (espalhar com `...typography.font.bold`); `font.mono` para códigos.
- `fontSize`: `xs 12 · sm 14 · md 16 · lg 20 · xl 24 · 2xl 32 · display 44`. `lineHeight`: `tight 1.2 · normal 1.5 · relaxed 1.75` (multiplicadores).
- Não há tokens de `letterSpacing` nem de `label-caps`/`metric` (existem só em `design.md`).

## 5. Spacing, radii, sombras — FATO

- `spacing`: 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 (chave = valor em px).
- `radii`: `none 0 · sm 12 · md 20 · lg 28 · pill 999`.
- `MAX_CONTENT_WIDTH = 560`.
- `shadows.light|dark`: `soft`, `medium`, `none`. `LiquidGlassView` define **sombras próprias inline por variante** (hero/pill/card), não usa `shadows.*` — PROBLEMA de duplicação (P2-07).

## 6. Motion tokens (`theme/motion.ts`) — FATO

`duration`: `micro 150`, `normal 300`, `celebration 1000`. `easing.easeOut` = `[0.25,1,0.5,1]` (bezier). Springs: `springDock {18,180}`, `springPressIn {18,200,m0.5}`, `springPressOut {15,150,m0.6}`, `springShort {15,200,m0.5}`, `springBounce {10,100,m1}`. Detalhes e regras em `MOTION_DESIGN.md`.

## 7. Liquid Glass (`LiquidGlassView`) — FATO

- Variantes: `hero | card | pill | control | scrim`. Props: `intensity`, `borderRadius` (padrão 28), `disableBlur`, `readable` (padrão verdadeiro em `card`), `tintColor`, `corners`.
- Estrutura: view externa (sombra + raio, sem overflow) → view interna `absoluteFill` com `overflow:hidden` e `borderWidth 0.8` (`glassBorder`, topo mais claro `glassBorderTop`) → `BlurView` (nativo) → camada de tinta → `LinearGradient` de reflexo (altura 55%).
- Nativo: `expo-blur` `BlurView` com `tint` `systemUltraThinMaterial(Dark|Light)`; intensidade 75 (padrão) ou 88 (hero/control/scrim); Android usa 100.
- Web: `backdrop-filter` + `-webkit-backdrop-filter` via `glassWeb.ts` (`blur(0–24px) saturate(160%)`).
- Fallback sólido (`theme.surface`, sem blur): quando Reduce Transparency está ativo **ou** a web não suporta `backdrop-filter`.
- Scrim: sem sombra, sem borda, `overlayMedium` (ou `overlayDark` no fallback).

## 8. Componentes de `src/components/ui` — FATO

| Componente | Função | Exportado no barrel? |
|---|---|---|
| `PressableScale` | Pressable com spring de escala (0.97) e fallback de fade com Reduced Motion | sim |
| `Button` | primary (gradiente) / secondary / ghost; texto em `children: string` | sim |
| `GlassButton` | pílula de vidro (`LiquidGlassView variant="control"`) com ícone opcional | sim |
| `IconButton` | botão de ícone (Feather) primary/secondary/ghost | sim |
| `GlassField` | campo de texto em vidro | sim |
| `Screen` | container com insets e fundo | sim |
| `ScreenTitleBar` | barra de título | sim |
| `Avatar`, `EmptyState`, `Skeleton`, `Toast`, `UpdateBanner`, `WebDatePicker`, `AnimatedIcon`, `AuthScreen` | utilitários | sim |
| `LiquidGlassView`, `glassWeb`, `AtmosphereBackground`, `LegalDocumentView`, `LiquidThemeSelector` | primitivas/específicos | **não** (importados por caminho direto) |

### Duplicidades e inconsistências (PROBLEMA)

- `Button` (secondary = `primarySoft`, sólido) **vs** `GlassButton` (vidro): dois "botões secundários" com visuais diferentes. Não confirmado se é intencional (INFERÊNCIA).
- `IconButton` e `PressableScale` sobrepõem papel de toque; `IconButton` usa `PressableScale` internamente.
- `Screen.tsx` calcula `tabBarHeight` que não é usado; um comentário no código cita um arquivo de regras local (histórico) que o repositório não versiona.
- `LiquidGlassView` fora do barrel enquanto `GlassButton`/`GlassField` estão.
- Hex/rgba fora de `src/theme` (14 ocorrências, contagem por arquivo verificada): `app/index.tsx` (7), `app/_layout.tsx` (5), `AtmosphereBackground.tsx` (1), `lib/core/pushNotifications.ts` (1).
- Sem componentes de card/lista genéricos: cada feature cria o seu.

## 9. Regras para novos componentes

1. Antes de criar, procure em `components/ui` e na feature. Se criar, justifique.
2. Valores só de `useTheme()`; proibido hex/rgba/px mágico (exceto geometria local nomeada em constante no topo do arquivo, como `DOCK_HEIGHT`).
3. Vidro só com `LiquidGlassView`. Texto corrido → `readable`.
4. Toque via `PressableScale` (ou componente que a use). Alvo ≥ 44px (`hitSlop` se o visual for menor).
5. `accessibilityRole` + `accessibilityLabel` pt-BR; `accessibilityState` para disabled/busy/selected.
6. Animação só conforme `MOTION_DESIGN.md`, com Reduced Motion.
7. Props tipadas (sem `any`); componente de UI é **puro**: recebe dados/callbacks por props, sem Supabase.
8. Exportar no barrel apenas componentes genéricos reutilizáveis.

## 10. Acessibilidade no design system

- FATO: `LiquidGlassView` respeita Reduce Transparency; `PressableScale` respeita Reduced Motion; `GlassButton` define role/label/state.
- FATO: lint `react-native-a11y` está no plugin list mas **nenhuma regra dele está habilitada** em `.eslintrc.js` (apenas `plugins`). Logo não há checagem automática de a11y.
- RECOMENDAÇÃO: habilitar regras do plugin (P3-02).

## TARGET (inexistente hoje)

- Tokens de `letterSpacing`/papéis tipográficos (`display`, `metric`, `label`) alinhados ao design.
- Variações de categoria por tema (light/dark) com contraste verificado.
- Sombras do vidro derivadas de `shadows.*`.
- Fonte Plus Jakarta Sans embarcada no nativo (hoje só web) — *decisão de produto: confirmar se é desejado*.
- Um único componente de botão secundário, ou documentação clara de quando usar cada um.
