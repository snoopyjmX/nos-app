# MOTION DESIGN

Rótulos: **FATO**, **REGRA**, **PROBLEMA**, **RECOMENDAÇÃO**, **TARGET**.
Motion é tratado aqui como **sistema de engenharia**: toda animação tem contrato, orçamento de performance e comportamento definido para gestos e Reduced Motion.
Verificado contra o código em 2026-10-03 (Reanimated `4.5.1`).

> Antes de usar qualquer API de Reanimated (`withSpring`, `withDecay`, layout animations, `useReducedMotion`…), **confirme a assinatura na versão instalada**. Não presuma API de outra versão.

---

## 1. Filosofia

Sofisticado, discreto, intencional. O movimento comunica **causa e efeito, hierarquia e continuidade espacial** — nunca decora. Se remover a animação não tira informação nem continuidade, ela provavelmente não deve existir.

## 2. Inventário real (FATO)

| Onde | O que anima | Mecanismo | Reduced Motion |
|---|---|---|---|
| `PressableScale` | escala 1 → 0.97 ao pressionar | `withSpring` (`springPressIn` / `springPressOut`) | troca por fade de opacidade 0.7 (`withTiming` 120ms, `Easing.out(cubic)`) |
| `TabBar` — assentar | indicador e ícones deslizam até a aba escolhida | `withSpring` (`springDock`) | `withTiming` 120ms `Easing.out(cubic)` |
| `TabBar` — arrastar | indicador acompanha o dedo (centro sob o dedo) e o ícone/rótulo/anel do avatar mudam de estado na distância ao indicador; ao agarrar, o indicador sobe (escala 1.05 + sombra maior) e estica/comprime com a velocidade | `withSpring` com `springShort` (seguir), `springPressIn/Out` (agarrar/soltar) | indicador segue o dedo direto, sem escala/sombra; estados por fade 120ms |
| `TabBar` — toque | a aba sob o dedo reage ao toque antes de soltar (escala 0.96) | `withSpring` (`springPressIn/Out`) | opacidade 0.7 em 120ms |
| `AnimatedIcon` | escala 1.22 ativa + "wiggle" -6° | `withSpring({damping:10, stiffness:220})`, `withTiming` 60ms + `withSpring({damping:12})` | escala 1, rotação 0 (sem animação) |
| `MessageInput`, `LiquidThemeSelector` | deslocamento/seleção | `withTiming` 120ms `Easing.out(cubic)` (alternativa Reduced) / spring `springDock` | tratado |
| `CountdownDigits` | progresso do ciclo | `withTiming` com `PROGRESS_MS`, `Easing.out(cubic)` | tratado (condicional) |
| Home (`index.tsx`, `HeroCard`, `NextMilestoneCard`…) | entrada em cascata | `FadeInDown.duration(350)` (layout animation do Reanimated) | só toca se `!hasPlayedHomeEntranceInSession && !reducedMotion` (uma vez por sessão) |
| `CoupleJourneyCounter` (cápsulas mês/dia/hora) | entrada em cascata das 3 cápsulas, dentro da do `HeroCard` | `FadeInDown.duration(motion.duration.normal)` + `Easing.bezier(easeOut)`, delays 120/180/240 ms | herda `shouldAnimateCascade` da Home (uma vez por sessão; desligada com Reduced Motion) |
| `Skeleton` | pulso de opacidade 0.35↔0.65 | `withRepeat(withSequence(withTiming 900, withTiming 900), -1, true)` com `Easing.inOut(Easing.ease)` | opacidade fixa 0.45 (`useAccessibility`) |
| Haptics | impacto leve em troca de aba (swipe), `selectionAsync` na TabBar, recebimento de mensagem, ações em memórias | `expo-haptics` | n/a (10 arquivos usam) |

### Tokens (`src/theme/motion.ts`)

`duration`: `micro 150`, `normal 300`, `celebration 1000`. `easing.easeOut`: bezier `[0.25,1,0.5,1]`.
Springs: `springDock {damping 18, stiffness 180, mass 1}` · `springPressIn {18, 200, mass 0.5}` · `springPressOut {15, 150, mass 0.6}` · `springShort {15, 200, mass 0.5}` · `springBounce {10, 100, mass 1}`.

### Problemas encontrados (PROBLEMA)

1. `Skeleton` — **resolvido em 2026-10-04**: os dois `withTiming` usam `Easing.inOut(Easing.ease)` e, com Reduced Motion, a opacidade fica fixa em 0.45 (P2-02).
2. `AnimatedIcon` — spring `damping: 10, stiffness: 220` é fora da faixa `damping 15–20 / stiffness 150–200` da regra do projeto e produz mais repique (escala 1.22 + wiggle); constantes locais em vez de token (P2-02).
3. `FadeInDown.duration(350)` — duração hardcoded e sem easing explícito; `springBounce` (damping 10) existe nos tokens, **uso não confirmado**.
4. Dois hooks de Reduced Motion coexistem: `@/lib/hooks/useAccessibility` (15 arquivos) e `react-native-reanimated` (5 arquivos). O hook próprio inicia em `false` e só atualiza após uma Promise (`AccessibilityInfo.isReduceMotionEnabled()`), então o primeiro frame pode animar mesmo com a preferência ativa (INFERÊNCIA — não testado) (P2-01).
5. Valores de duração soltos (120, 60, 900, 350) espalhados; só 150/300/1000 estão em tokens.
6. **`mass` omitida vira 4 no Reanimated 4.5.1** (o padrão é `GentleSpringConfig`, `mass: 4`). `springDock` não definia `mass`: medido no PWA, o indicador da dock passava 32% do alvo e levava ~2,5 s para assentar; com `mass: 1` passa ~5,8% e assenta em ~0,9 s. Os springs locais do `AnimatedIcon` (`{damping:10, stiffness:220}` e `{damping:12}`) ainda omitem `mass`, logo hoje têm massa efetiva 4 e repicam mais do que os números sugerem (P2-02). **REGRA:** todo spring define `mass` explicitamente.

---

## 3. Contrato obrigatório para toda animação nova

Antes de implementar, preencha (no PR/descrição ou em comentário curto no código) e registre animações novas relevantes neste documento:

| Campo | O que definir |
|---|---|
| **Propósito** | Que informação/continuidade a animação comunica? ("mostra que o toque foi registrado", "mantém a relação espacial entre abas") |
| **Gatilho** | O que dispara (toque, mudança de estado, montagem, dado novo)? Roda uma vez por sessão ou sempre? |
| **Estado inicial** | Valores de partida (ex.: `opacity 0`, `translateY 8`) |
| **Estado final** | Valores de chegada |
| **Duração** | Para spring: damping/stiffness/mass do token. Para timing: duração de `theme.motion.duration`. |
| **Easing / spring** | Token existente. Spring é o padrão; timing exige easing explícito. |
| **Interruptibilidade** | Pode ser interrompida e reverter do valor atual (sem salto)? Spring e `withTiming` partem do valor atual — confirme. |
| **Durante gestos** | Quem controla o valor enquanto o dedo está na tela? A animação cancela, sobrescreve ou espera? Sem "briga" entre gesto e animação. |
| **Háptico** | Só em ação intencional (enviar, favoritar, trocar aba). Impacto leve. Nenhum háptico em animação passiva. |
| **Reduced Motion** | Alternativa definida: fade curto (≤150ms) ou estado imediato. Nunca "sem tratamento". |
| **Performance** | Propriedades animadas (`transform`/`opacity` apenas); nº de elementos simultâneos; roda na UI thread (worklet); custo em lista/scroll. |

## 4. Regras (REGRA)

### 4.1 Mecânica
- **Springs são padrão** para toque e posição. Use os presets de `theme/motion.ts`; **não crie spring solta** — se precisar de um comportamento novo, proponha um token.
- **Timing** só com easing explícito (`Easing.out(Easing.cubic)` ou o bezier `easeOut`) e duração dos tokens. Entradas/saídas de tela e modal: 200–350ms, `translateY 8 → 0` + fade.
- Anime **`transform` e `opacity`**. Evite `width/height/top/left/margin` (força layout); se inevitável, justifique.
- **Entradas (layout animations) na web:** use os presets só com `.duration/.delay/.easing`. FATO (Reanimated 4.5.1, `layoutReanimation/web/componentUtils.ts`): `withInitialValues` gera um keyframe próprio, e entradas com keyframe próprio terminam com `position: absolute` no elemento, que sai do fluxo e quebra o layout do pai (visto nas cápsulas da Home em 2026-10-04).
- Animações vivem na UI thread (shared values/worklets); evite `setState` por frame.
- Máximo de uma animação "protagonista" por interação; as demais são coadjuvantes (menores e mais rápidas).

### 4.2 O que evitar
- **Decorativas sem propósito:** brilho pulsante, partículas, ícones que "respiram", corações flutuando, qualquer coisa em loop contínuo. Exceção única existente: `Skeleton`, e apenas enquanto carrega.
- **Excesso de bounce:** o repique deve ser quase imperceptível. Escalas de toque entre 0.95–0.98; destaque de ativo ≤ 1.1 (o 1.22 do `AnimatedIcon` é legado, não precedente).
- **Springs exageradas:** damping < 15 só com justificativa registrada. `springBounce` (damping 10) fica restrito a momentos de celebração raros.
- **Transições lentas:** nada acima de 350ms em navegação/feedback. Celebração (`celebration` 1000ms) só para marcos reais e raros.
- **Movimento que compete com conteúdo:** nada animando sobre texto que está sendo lido, nem durante digitação; entradas em cascata no máximo uma vez por sessão (padrão já existente na Home).
- **Inconsistência entre telas:** mesma ação ⇒ mesma resposta. Toque em botão sempre via `PressableScale`; entrada de modal sempre com o mesmo par fade+elevação; troca de aba sempre com o mesmo spring.
- **Atrasos encadeados** (`delay` crescente em muitas peças) que fazem a interface parecer lenta.

### 4.3 Reduced Motion (obrigatório)
- Todo componente animado trata Reduced Motion: substitui escala/deslocamento/loop por **fade ≤150ms** ou **estado imediato**; remove loops.
- Use um único hook. Enquanto a decisão P2-01 não for tomada, use `@/lib/hooks/useAccessibility` em código novo (mais usado) e não misture os dois no mesmo componente.
- Reduce Transparency é independente: `LiquidGlassView` já cai para superfície sólida.

### 4.4 Haptics
- `expo-haptics` apenas no nativo (FATO: o código protege com `Platform.OS !== 'web'` no swipe). Impacto leve para ações intencionais; `selectionAsync` para troca de seleção; peso médio só em ação destrutiva. Nunca por render, polling ou evento passivo.
- FATO/PROBLEMA: há háptico ao **receber** mensagem do parceiro (`useMessages`) — é um evento passivo. Decisão de produto pendente (P2-09).

### 4.5 Gestos
- Enquanto o usuário arrasta, o gesto manda: cancele a animação em andamento no `onBegin` e retome a partir do valor atual.
- O swipe de aba (Fling) não pode disparar durante scroll, digitação ou modal aberto (hoje não há essa garantia — INFERÊNCIA, P2-04).

### 4.6 Performance
- Teto de elementos animados simultâneos por tela: mantenha baixo e justifique listas animadas (use `FlatList` virtualizada; não anime cada item no scroll).
- Evite animar views que contêm `BlurView` (custo de recomposição no iOS). Anime o contêiner por `transform`/`opacity`, não o blur.
- Se uma animação causar queda perceptível de FPS em dispositivo real, ela é bug — simplifique ou remova.

## 5. Checklist de revisão de motion

- [ ] Propósito claro e não decorativo?
- [ ] Token de spring/duração existente (ou token novo proposto)?
- [ ] Easing explícito se for `withTiming`?
- [ ] Interrompível sem salto? Convive com gesto?
- [ ] Reduced Motion tratado e testado?
- [ ] Apenas `transform`/`opacity`?
- [ ] Háptico só se ação intencional?
- [ ] Consistente com ações equivalentes em outras telas?
- [ ] Testado em dispositivo real (iOS), claro e escuro?

## TARGET (inexistente hoje)

- Tokens de duração/easing para entradas (`enter`, `exit`, `fade`) e substituição das constantes soltas (120, 60, 350, 900).
- Hook único de Reduced Motion com valor síncrono.
- Hook compartilhado para "entrada de tela/modal" (fade + `translateY 8→0`) para garantir consistência.
