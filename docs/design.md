---
name: NÓS — Liquid Glass Lavanda
colors:
  background: '#0F0D18'
  surface: '#14121D'
  surface-elevated: '#1C1A26'
  primary: '#A797FF'
  primary-deep: '#8E7CE8'
  amethyst: '#8B5CF6'
  bubble-sent: '#7A55F5'
  on-primary: '#16151E'
  on-surface: '#F7F5FF'
  on-surface-variant: '#AAA5B8'
  muted: '#8E8A9E'
  affection: '#F29BB5'
  error: '#FFB4AB'
  background-light: '#F8F9FC'
  on-surface-light: '#16151E'
  on-surface-variant-light: '#686578'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 38px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.1em
  metric:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 32px
    letterSpacing: -0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  full: 9999px
spacing:
  margin: 1.25rem
  gutter: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

# NÓS — DESIGN.md

Este arquivo descreve **a aparência**. Regras operacionais e de comportamento do agente estão no `CLAUDE.md`; arquitetura, design system, UX, motion, segurança e acessibilidade estão em `docs/` (`ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `UI_UX_GUIDELINES.md`, `MOTION_DESIGN.md`, `SECURITY.md`). Os valores reais vivem no arquivo de tokens do código; se algo aqui divergir dele, o código vence e este arquivo deve ser atualizado.

## Marca e estilo

O NÓS é um espaço privado para duas pessoas. A estética é **Apple-inspired Liquid Glass**: minimalismo de luxo, atmosfera noturna serena, vidro translúcido e tecnologia refinada. A emoção vem da calma, do espaço em branco e da fotografia, não de enfeites.

Sensação desejada: um objeto de vidro bem feito sobre um fundo escuro e profundo. Íntimo, maduro, silencioso.

Evitar: estética de app de namoro, corações em excesso, glitter, ilustrações infantis, neon berrante, bloom exagerado, ondas ou batimentos biométricos fictícios.

## Cores

- **Fundo `#0F0D18`**, superfícies `#14121D` e `#1C1A26`: noite profunda, sem preto puro.
- **Lavanda `#A797FF`** (primária), **`#8E7CE8`** (estrutural) e **`#8B5CF6`** (ametista): identidade do app, destaques, item ativo, progresso.
- **`bubble-sent #7A55F5`**: fundo das mensagens enviadas, escolhido para ter contraste com texto branco acima de 4,5:1.
- **`on-primary #16151E`**: texto sobre botões lavanda (contraste alto, ~7:1).
- **Texto**: `#F7F5FF` para leitura e títulos; `#AAA5B8` para subtítulos e metadados; `#8E8A9E` apenas para microcopy e placeholders.
- **`affection #F29BB5`**: rosa suave, usado com muita moderação (coração do badge, favorito). Nunca como cor de botão, fundo ou texto longo.
- **Claro (suporte)**: fundo `#F8F9FC`, texto `#16151E`, secundário `#686578`. No claro, a lavanda serve para ícones, realces e preenchimentos; nunca como cor de texto corrido.

Fundo ambiente: um gradiente radial lavanda muito suave no topo (`rgba(139, 92, 246, 0.14)`), **estático**, sem animação.

## Tipografia

**Plus Jakarta Sans** em tudo. Títulos e números em pesos altos com tracking negativo; microtextos em caixa alta com tracking aberto (`label-caps`).

- `display-hero` é usado no contador de dias ("213 dias") e nos hero de tela.
- `metric` é usado nas cápsulas de tempo e nos displays de contagem regressiva.
- Nenhum texto abaixo de 11px. Todos os tamanhos escalam com a fonte dinâmica do sistema (limite sugerido de 1,5x nos displays grandes, sem escala ilimitada).
- Alturas de linha são sempre derivadas do texto, nunca fixas em containers.

## Layout e espaçamento

Mobile first, margem lateral de `1.25rem` e respiro vertical generoso entre seções. Em telas maiores, a coluna central fica limitada a 520px (feeds) ou 768px (painéis) para preservar a intimidade.

A **dock flutuante** mede 64px e fica a 20px da base (mais a safe area do aparelho). O espaço reservado no rodapé de qualquer tela rolável é calculado a partir disso (ver `CLAUDE.md` §6 e `docs/UI_UX_GUIDELINES.md`, mínimo de 140px), nunca um número solto.

Cabeçalhos de seção nunca quebram em coluna estreita: título e ação ficam na mesma linha com `flexShrink` no título; se faltar espaço, a ação desce para baixo do título, nunca esmaga o texto.

## Profundidade e vidro

Profundidade vem de camadas de vidro e luz suave, não de sombras pesadas.

| Nível | Uso | Fundo | Blur | Borda |
|---|---|---|---|---|
| Hero | dock, barra de input, modais, bottom sheets | `rgba(30,28,42,0.70)` | até 24 | `rgba(255,255,255,0.15)` |
| Standard | cards principais, contador, mensagens recebidas | `rgba(30,28,42,0.55)` | até 16 | `rgba(255,255,255,0.12)` |
| Subtle | chips, badges, campos secundários | `rgba(255,255,255,0.05)` | nenhum | `rgba(255,255,255,0.08)` |
| Sem vidro | fotos, parágrafos longos de memória, texto corrido | nenhum | nenhum | nenhum |

- **Tinta do vidro**: bem translúcida, ~14% no claro e ~10% no escuro (tokens `glassSurface`). O efeito vem do blur (até 24px, saturação 160%) e do brilho no topo, não de fundo opaco. Quando há texto corrido sobre o vidro, use `glassSurfaceReadable` (~32% claro, ~38% escuro) para manter contraste AA. Os valores da tabela acima são a referência de hierarquia; os valores reais estão em `src/theme/colors.ts`.
- **Web/PWA (Safari iOS)**: `backdrop-filter` e `-webkit-backdrop-filter` com blur real.
- **Fallback sólido** (Reduce Transparency ativo ou navegador sem `backdrop-filter`): cor de superfície sólida, sem blur, mantendo a borda.
- **Sombra**: fica em uma view externa sem `overflow`; o recorte em raio (`overflow: hidden`) fica em uma view interna.
- No máximo 2 ou 3 camadas com blur visíveis ao mesmo tempo por tela.
- **Brilho (glow)**: um único glow lavanda discreto (`0 0 16px rgba(167,151,255,0.25)`), só no item ativo da dock e no estado pressionado de controles principais.

## Formas

Cápsulas e cantos generosos, como vidro polido.
- Chips, badges, botões, input e dock: `full` (pill).
- Cards: `lg` (32px). Fotos de memória: `md` ou `lg`. Cápsulas de métrica: `DEFAULT` a `md`.

## Componentes

**Botão primário**: preenchimento lavanda `#A797FF` (ou degradê suave de `#A797FF` para `#8E7CE8`), texto `on-primary`, pill, altura mínima 48px. Pressionado: escala 0,97 e glow discreto.

**Botão secundário (vidro)**: Subtle glass com borda fina; pressionado, a borda ganha tom lavanda.

**Dock flutuante**: cápsula Hero glass, 5 itens (Início, Recados, Memórias, Datas, Ajustes), alvo mínimo de 48px por item. O indicador ativo é uma cápsula luminosa discreta que **desliza** entre itens, sem teleportar nem piscar. Inativos em `#AAA5B8`, ativo em lavanda.

**Cards de memória**: foto protagonista, badge de data em vidro sobre a foto, botão de favorito, e abaixo, local e autoria em linhas que quebram sem sobrepor. Título emotivo e texto da memória em área **sem vidro**, com espaçamento generoso.

**Balões**: enviados em `bubble-sent` com texto claro, à direita; recebidos em Standard glass (`rgba(255,255,255,0.08)`, borda 1px), à esquerda, com avatar. Largura máxima ~80% da tela.

**Input do chat**: cápsula Hero glass com anexo, campo (`flex: 1`, placeholder em uma linha: "Escreva um recado com carinho…"), microfone/envio. Foco: borda lavanda e anel suave.

**Contagem e métricas**: cada unidade (dias, horas, minutos, segundos) em cápsula independente com `metric` e legenda `label-caps`. Nunca coladas nem truncadas.

**Progresso**: trilho fino translúcido, preenchimento lavanda, rótulo "Ciclo Anual: 92% percorrido".

**Controle segmentado**: cápsula única com o segmento ativo em lavanda sutil ("Próximas" | "Conquistas").

## Movimento (visual)

Calmo e físico: transições de 200 a 350ms, easing suave, sem repique exagerado. Entradas com fade e leve deslocamento; indicador da dock desliza; números podem fazer uma transição discreta ao mudar. Nada pulsa em loop. Todo movimento respeita Reduce Motion (detalhes em `docs/MOTION_DESIGN.md`).