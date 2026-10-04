# UI / UX GUIDELINES

Rótulos: **FATO**, **REGRA** (norma para trabalho futuro), **PROBLEMA**, **RECOMENDAÇÃO**, **TARGET**.
Origem das regras: versão anterior do `CLAUDE.md` e um contrato local anterior (histórico, não versionado e não necessário), conferidos contra o código em 2026-10-03. Onde o código diverge, está dito.

---

## 1. Hierarquia visual

- **REGRA:** a calma vem de espaço e fotografia, não de enfeite. Um ponto focal por tela (contador, foto, conversa).
- **REGRA:** hierarquia do vidro (do mais ao menos forte): Hero (dock, input, modais) → Standard (cards principais, contador, mensagens recebidas) → Subtle (chips, badges) → **sem vidro** (fotos, parágrafos longos).
- **FATO:** `LiquidGlassView` implementa variantes `hero | card | pill | control | scrim`. Não há variante literal "subtle"; chips/badges usam `pill`/`control`.
- **REGRA:** títulos de tela/seção com `accessibilityRole="header"` (FATO: 20 usos hoje).
- **REGRA:** nenhum texto esmagado: título com `flexShrink: 1`/`minWidth: 0`; metadados com `flexWrap` ou empilhados; sem altura fixa em container de texto; testar em 375px e com fonte 1,5×.

## 2. Navegação

- **FATO:** cinco abas — Início, Mensagens, Memórias, Datas, Perfil. Auth em `(auth)`; `onboarding` para quem não tem casal.
- **PROBLEMA:** os nomes diferem do contrato histórico ("Recados", "Ajustes"). Não renomear sem pedido; decisão em ROADMAP P2-05.
- **REGRA:** novas telas fora das abas abrem como rota empilhada ou modal, nunca como sexta aba sem decisão de produto.
- **REGRA:** após login → `/`; sem casal → onboarding; com casal → tabs. (FATO: implementado, mas em dois lugares — ver ARCHITECTURE.)

## 3. Tab bar / Dock

- **FATO:** `TabBar.tsx` — altura 64, margem lateral 16 (`DOCK_MARGIN`), indicador ("lente" de vidro) que desliza por spring (`springDock`) e pode ser arrastado com o centro sob o dedo (aba escolhida = aba sob o dedo; a geometria está em `components/layout/dockGeometry.ts`), ícone/rótulo/anel do avatar mudam de estado conforme a distância ao indicador, largura limitada por `MAX_CONTENT_WIDTH`, avatar do usuário carregado na própria TabBar, Haptics no toque e a cada aba cruzada no arrasto. Contraste medido sobre pixels renderizados no PWA (Início e Memórias, claro e escuro): rótulo inativo `textSecondary` opaco 5,6–6,7:1; rótulo ativo `textPrimary` 7,2–11,1:1; ícone ativo `primaryText`. Abaixo de 62px por aba (viewport ≲ 334px) o rótulo passa a 11px para "Mensagens" e "Memórias" não se tocarem. Na web as abas expõem `aria-selected`.
- **FATO:** posição: nativo `insets.bottom + 4` (ou 20 sem inset); web `insets.bottom + 8` (`useDockTop`).
- **REGRA:** alvo ≥ 48×48 por item; indicador desliza (não teleporta); ícone + rótulo (cor não é único indicador).
- **REGRA:** toda tela rolável usa `useDockInset()` (FATO: retorna ≥ 150 hoje). Telas com input fixo somam a altura do input + 8px.
- **REGRA:** a dock nunca cobre texto, botão ou foto; FAB e inputs ficam **acima** dela.

## 4. Gestos

- **FATO:** `(tabs)/_layout.tsx` troca de aba com `Fling` esquerda/direita no container inteiro, com Haptics leve (só nativo).
- **PROBLEMA / INFERÊNCIA:** o fling abrange toda a área e pode competir com listas, campos e modais (não testado em dispositivo). ROADMAP P2-04.
- **REGRA:** gesto novo não pode conflitar com scroll nem com o swipe de aba; defina quem vence e como cancelar (ver `MOTION_DESIGN.md`).
- **REGRA:** todo gesto tem alternativa por toque (a dock).

## 5. Estados

Toda tela com dados implementa **loading, vazio e erro**.

- **Loading — FATO:** `Skeleton`, `MessagesSkeleton`, splash em `app/index.tsx`. **REGRA:** skeleton em vidro/forma do conteúdo; spinner só em ação pontual (botão, upload).
- **Vazio — FATO:** `EmptyState` existe. **REGRA:** mensagem carinhosa + ação clara; sem ilustração infantil.
- **Erro — FATO/PROBLEMA:** vários hooks engolem erros (`catch {}`/"Ignora silenciosamente") — o usuário não vê falha. **REGRA:** erro visível, calmo, com "Tentar de novo"; nunca expor `error.message` técnico cru (FATO: `ErrorBoundary` raiz exibe `error.message`).
- **Sucesso:** confirmação discreta (Toast curto) para ações que o usuário não vê acontecer (salvar, apagar). Não para ações com resultado visível (mensagem aparecendo na conversa).

## 6. Feedback

- **FATO:** os mecanismos atuais são: `Toast` (`ToastContext`); `showAlert` (`lib/core/dialog.ts`, mesma assinatura de `Alert.alert`: no nativo usa o alerta do sistema e na web abre o `DialogHost` do app), usado em `onboarding`, `dates`, `profile`, `memories`, `login` e `reset-password`; e erros inline nos formulários (`GlassField` com `error`). Resta 1 chamada direta a `Alert.alert` em `useMessages.ts:490`. `window.confirm` não é mais usado.
- **REGRA:** erros/sucessos leves → Toast. Confirmação destrutiva → `showAlert` com botão `destructive` (já é o padrão nos arquivos acima; resta alinhar `useMessages.ts` — ROADMAP P2-03).
- **REGRA:** Haptics leve só em ações intencionais (enviar, favoritar, trocar aba). FATO: 10 arquivos usam `Haptics`. Não em carregamento, erro passivo ou animações automáticas.
- **REGRA:** não afirmar na UI o que o app não faz (ex.: "criptografado ponta a ponta"). Usar "Espaço privado".

## 7. Modais

- **FATO:** `AddDateModal`, `AddMemoryModal`, `AnniversaryModal`, `MemoryPreviewModal`.
- **REGRA:** modais usam vidro Hero, entram com fade + leve elevação (`translateY 8→0`), fecham por botão visível **e** gesto/ação padrão da plataforma, devolvem o foco ao disparador, e não perdem o que o usuário digitou ao errar o envio.

## 8. Formulários

- **FATO:** `GlassField`, `WebDatePicker`, `@react-native-community/datetimepicker`. Telas de auth em `AuthScreen`.
- **REGRA:** label/placeholder em pt-BR; placeholder de uma linha (`numberOfLines={1}`, `flex: 1`); erro junto ao campo; botão de envio com estado `loading` e bloqueio contra duplo toque (FATO: `memories.tsx` usa `if (uploading) return`); teclado não cobre o campo ativo (FATO: `AddDateModal`, `AddMemoryModal` e `AuthScreen` usam `KeyboardAvoidingView`; o input do chat calcula o deslocamento manualmente por `getInputOffset(isKeyboardVisible, keyboardHeight, dockTop)` em `MessageInput.tsx`. O README afirma "KeyboardAvoidingView" no chat — impreciso).
- **REGRA:** validar antes de enviar e dizer o que corrigir (FATO: `onboarding` mostra "Código inválido ou expirado" para qualquer erro do RPC — mensagem genérica).

## 9. Acessibilidade (WCAG 2.1 AA)

- Alvos ≥ 44×44 (dock 48). Contraste ≥ 4,5:1 (texto normal) / 3:1 (grande) — **verificar o par real** antes de entregar; não confie nos comentários de `colors.ts`.
- `accessibilityRole`, `accessibilityLabel` pt-BR, `accessibilityHint` quando útil, `accessibilityState` (disabled/busy/selected).
- Contadores decompostos: um único label no container; números soltos escondidos do leitor; segundos nunca anunciados em loop.
- Fotos: descrição contextual, nunca nome de arquivo.
- Reduce Motion e Reduce Transparency respeitados (FATO: ambos têm hook; ver Design System).
- Web: semântica equivalente (`h1/h2`, `aria-*`), foco visível, ordem de leitura lógica.
- FATO: o `ErrorBoundary` raiz usa `TouchableOpacity` com `accessibilityRole="button"` e `minHeight: 44`; o título tem `accessibilityRole="header"`. Continua com hex e sem tokens do tema (P2-06).

## 10. Responsividade e mobile

- **FATO:** coluna central limitada a 560px (`MAX_CONTENT_WIDTH`) em telas largas; `Screen` usa insets; `app.json` força `portrait`.
- **REGRA:** mobile-first; testar 375px; respeitar safe areas (topo, base, laterais); teclado; orientação retrato.

## 11. Comportamento PWA

- **FATO:** `display: standalone`, `viewport-fit=cover`, status bar `black-translucent`, dock fixa na viewport (commit "fixa a dock na viewport do PWA"), service worker com banner de atualização.
- **FATO:** `manifest.json` usa `theme_color`/`background_color` **claros** (`#F8F6FE`) enquanto a identidade é noturna. PROBLEMA de coerência (INFERÊNCIA: possível flash claro no splash do PWA — não testado). ROADMAP P2-06.
- **REGRA:** Safari/iOS exige `-webkit-backdrop-filter` (já em `glassWeb.ts`); não depender de hover; sem `alert()`/`window.confirm` do navegador (FATO: na web `showAlert` abre o `DialogHost`).
- **REGRA:** mudanças que afetam o service worker (`sw.js`, nome do cache) exigem validar o fluxo de atualização.

---

## 12. Regras para preservar a experiência premium do NÓS

O Liquid Glass é uma **linguagem visual**, não "usar blur". Ele significa: *profundidade por camadas de luz, material que reage ao que está atrás dele, e silêncio visual*.

1. **Material tem hierarquia.** Cada camada de vidro existe por um motivo (dock e input flutuam sobre o conteúdo; cards agrupam). Se uma superfície não precisa se destacar do fundo, ela **não é vidro**. Fotos e texto longo ficam sem vidro.
2. **O conteúdo é o protagonista.** A foto da memória, a mensagem, o número de dias. O vidro serve a eles; nunca compete (limite de 2–3 camadas de blur por tela).
3. **Luz vem de cima.** Borda superior mais clara e reflexo no topo (`glassBorderTop`, `glassHighlight`) — mantenha a direção da luz consistente em todos os componentes.
4. **Contraste não se sacrifica pela beleza.** Texto corrido usa o piso `readable`. Se o vidro não der contraste sobre certa foto, use `scrim`/`tintColor`, não diminua o texto.
5. **Degradação elegante.** Reduce Transparency e navegadores sem `backdrop-filter` recebem superfície sólida com a mesma borda e hierarquia, não uma versão quebrada.
6. **Sombra e recorte separados** (regra de ouro do iOS): a view externa tem sombra/raio; a interna recorta. Nunca na mesma view.
7. **Poucos acentos.** Lavanda para identidade e ação; rosa afeto com extrema moderação; nada de neon, brilho em excesso ou glow em tudo. Um glow discreto no item ativo, no máximo.
8. **Movimento é físico e discreto** (ver `MOTION_DESIGN.md`): o vidro nunca "pula"; elementos se deslocam e se assentam.
9. **Tom maduro e íntimo.** Texto em pt-BR, carinhoso e contido. Sem gírias de dating app, sem excesso de emoji, sem métricas fictícias, sem promessas de segurança que o app não cumpre.
10. **Honestidade de interface.** Não exibir "online", "visto", "conquistas" ou qualquer estado sem lógica real por trás.
11. **Consistência acima de novidade.** Reaproveitar `LiquidGlassView`, `PressableScale`, tokens e springs. Uma variação nova precisa de justificativa e atualização do Design System.
12. **Teste do detalhe:** em cada tela nova, verificar tema claro **e** escuro, Reduce Motion, Reduce Transparency, fonte 1,5×, 375px, safe area inferior com a dock.
