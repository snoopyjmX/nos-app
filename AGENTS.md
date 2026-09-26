# NÓS — DESIGN, UX & ENGINEERING MASTER GUIDELINES

> **Projeto:** NÓS
> **Slogan:** Um espaço só nosso.
> **Plataforma:** React Native + Expo + Expo Router
> **Backend:** Supabase
> **Objetivo:** Aplicação privada para duas pessoas
> **Design direction:** Apple-inspired Liquid Glass, premium, íntimo, minimalista e tecnológico.

---

# 1. PRINCÍPIO CENTRAL

NÓS não deve parecer um aplicativo genérico feito com componentes prontos.

Deve parecer um produto cuidadosamente desenhado, consistente e intencional.

A experiência deve transmitir:

* intimidade
* elegância
* calma
* qualidade
* tecnologia
* simplicidade
* exclusividade
* fluidez

O produto deve parecer premium sem parecer exagerado.

### Regra fundamental

> **O design deve parecer simples porque foi cuidadosamente refinado, não porque possui poucos elementos.**

---

# 2. PAPEL DO AGENTE

Atue como:

* Senior React Native Engineer
* Senior UI/UX Designer
* Product Designer
* Design Systems Engineer
* Mobile Interaction Designer
* Supabase Engineer

Ao modificar o projeto, pense simultaneamente em:

1. experiência do usuário
2. hierarquia visual
3. consistência
4. acessibilidade
5. performance
6. responsividade
7. arquitetura
8. segurança
9. manutenção futura

Não trate a tarefa apenas como "fazer funcionar".

A implementação deve resultar em uma interface pronta para uso real.

---

# 3. REGRA ABSOLUTA: NÃO CODAR CEGAMENTE

Antes de modificar código:

1. examine a estrutura existente;
2. identifique componentes reutilizáveis;
3. identifique tokens existentes;
4. entenda a navegação;
5. entenda o estado atual da tela;
6. verifique dependências instaladas;
7. preserve funcionalidades existentes;
8. determine o menor conjunto de alterações necessário.

Nunca substitua arquivos inteiros sem necessidade.

Nunca reescreva uma tela funcional apenas para aplicar um estilo.

Nunca invente APIs, hooks, tabelas, funções ou componentes que não existam sem antes verificar o projeto.

---

# 4. IDENTIDADE DO NÓS

## Nome

**NÓS**

## Slogan

**Um espaço só nosso.**

## Personalidade

NÓS deve ser:

* íntimo
* elegante
* moderno
* sofisticado
* acolhedor
* discreto
* tecnológico
* emocional sem ser infantil

Evitar:

* excesso de corações
* rosa excessivo
* estética de aplicativo de namoro
* visual infantil
* excesso de gradientes
* excesso de animações
* excesso de elementos decorativos
* aparência de template
* aparência de rede social
* aparência de dashboard empresarial

---

# 5. REFERÊNCIAS DE DESIGN

Usar como referência conceitual:

* Apple Human Interface Guidelines
* Apple Music
* Apple Photos
* Apple Messages
* iOS Settings
* Day One
* Things
* Bear
* Linear
* Arc

As referências servem para estudar:

* hierarquia
* espaçamento
* tipografia
* interação
* transições
* composição
* clareza

Não copiar interfaces, marcas ou elementos proprietários literalmente.

> **Apple-inspired, never Apple-copied.**

---

# 6. PALETA OFICIAL

Estas cores são a fonte de verdade do projeto.

Não criar novas cores arbitrariamente.

## Light Mode

```ts
export const COLORS = {
  primary: '#8E7CE8',
  background: '#F8F9FC',

  glassSurface: 'rgba(255,255,255,0.70)',
  glassBorder: 'rgba(255,255,255,0.65)',

  textPrimary: '#16151E',
  textSecondary: '#686578',

  glow: '#A797FF',

  orbLavender: '#DDD6FE',
  orbPink: '#FCE7F3',
};
```

## Dark Mode

```ts
export const DARK_COLORS = {
  background: '#0F0D18',

  primary: '#A797FF',
  amethyst: '#8B5CF6',

  glassSurface: 'rgba(30,28,42,0.55)',
  glassBorder: 'rgba(255,255,255,0.12)',

  textPrimary: '#F7F5FF',
  textSecondary: '#AAA5B8',

  glow: '#A797FF',

  orbLavender: '#4C3A8C',
  orbPink: '#3A2A4D',
};
```

### Regra

A paleta acima deve ser centralizada em tokens.

Não espalhar hexadecimais pelo código.

---

# 7. DARK MODE

Dark Mode é obrigatório.

Não deve ser uma simples inversão das cores.

O Dark Mode deve parecer uma versão nativa da mesma identidade visual.

### Comportamento

Por padrão:

```ts
useColorScheme()
```

deve acompanhar o sistema.

Se houver preferência manual, oferecer:

* Sistema
* Claro
* Escuro

A preferência deve ser persistida utilizando a solução já existente no projeto.

Não adicionar uma biblioteca apenas para isso se não for necessário.

### Regras

Todos os seguintes elementos precisam possuir versão Dark:

* background
* glass
* bordas
* sombras
* texto
* ícones
* orbs
* inputs
* botões
* modais
* bottom sheets
* navbar
* chat
* estados vazios
* loading states

Nunca permitir:

* texto preto em fundo escuro;
* vidro branco excessivamente brilhante;
* sombras pretas pesadas;
* elementos invisíveis;
* contraste insuficiente;
* flash de Light Mode durante a inicialização.

---

# 8. LIQUID GLASS

Liquid Glass é uma parte fundamental da identidade do NÓS.

Porém:

> **Liquid Glass não significa colocar BlurView em tudo.**

O vidro deve ser mais forte onde existe interação.

## Prioridade do Glass

### Muito forte

* navbar
* botões principais
* input do chat
* modais
* bottom sheets
* controles flutuantes
* selected states

### Médio

* cards hero
* controles contextuais
* filtros
* elementos de destaque

### Leve

* cards secundários
* mensagens recebidas
* pequenas superfícies

### Sem Glass

* textos longos
* listas densas
* fotografias
* conteúdo que exige leitura contínua
* grandes áreas de conteúdo

---

# 9. GLASS — RECEITA VISUAL

Baseline:

```tsx
<BlurView
  intensity={75}
  tint="systemUltraThinMaterialLight"
/>
```

Para superfícies premium, intensidade pode chegar a aproximadamente:

```text
75–100
```

sem exagerar.

Borda:

```ts
borderWidth: 1,
borderColor: 'rgba(255,255,255,0.65)'
```

Dark:

```ts
borderColor: 'rgba(255,255,255,0.12)'
```

Sombra:

```ts
shadowColor: '#5B4294'
```

A sombra deve ser difusa e discreta.

Nunca utilizar uma sombra enorme para compensar uma hierarquia visual ruim.

---

# 10. GLASS: CAMADA DE CONTROLE VS CONTEÚDO

O NÓS possui duas camadas visuais.

## CONTENT LAYER

Conteúdo:

* fotos
* mensagens
* memórias
* datas
* textos
* listas
* timelines

O conteúdo deve permanecer claro.

## CONTROL LAYER

Controles:

* navbar
* botões
* inputs
* sheets
* modais
* ações flutuantes

Essa camada pode utilizar Liquid Glass de forma muito mais evidente.

### Resultado desejado

O usuário deve perceber:

> "O conteúdo está sobre uma interface de vidro."

E não:

> "Tudo virou vidro."

---

# 11. ATMOSFERA DO BACKGROUND

O background pode utilizar dois orbs suaves:

### Lavanda

```text
#DDD6FE
```

### Rosa

```text
#FCE7F3
```

Opacidade aproximada:

```text
0.5
```

Os orbs devem ser:

* grandes
* desfocados
* discretos
* estáticos ou quase estáticos

Eles existem para criar profundidade atrás do vidro.

Não devem parecer objetos flutuando pela tela.

### NÃO FAZER

* orbs se movimentando continuamente;
* partículas;
* estrelas;
* glitter;
* ondas;
* background pulsando.

---

# 12. DESIGN TOKENS

Utilizar grid de 4pt.

```ts
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};
```

Radii:

```ts
export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};
```

Evitar valores arbitrários.

---

# 13. TIPOGRAFIA

A tipografia deve seguir a estética nativa do sistema.

Priorizar:

* clareza
* peso adequado
* espaçamento
* leitura confortável

Hierarquia:

### Display

Para:

* títulos principais
* datas importantes
* hero content

### Heading

Para:

* títulos de seção
* cards importantes

### Body

Para:

* conteúdo
* mensagens
* descrições

### Caption

Para:

* timestamps
* metadados
* informações secundárias

Nunca utilizar texto pequeno apenas para "caber".

---

# 14. ACESSIBILIDADE

Respeitar Dynamic Type.

O layout deve continuar funcionando com fontes maiores.

Nunca:

* cortar textos importantes;
* fixar alturas desnecessariamente;
* impedir quebra natural;
* depender exclusivamente de cor;
* utilizar contraste insuficiente.

Mensagens e memórias do usuário nunca devem ser truncadas sem necessidade.

---

# 15. MOTION PHILOSOPHY — REGRA MAIS IMPORTANTE

> **FEWER ANIMATIONS. HIGHER QUALITY.**

Motion não é decoração.

A animação deve comunicar:

* mudança de estado;
* continuidade;
* hierarquia;
* interação;
* relação espacial.

O usuário deve perceber a interação.

Não deve perceber "a animação".

---

# 16. O QUE NÃO ANIMAR

NÃO animar automaticamente:

* todos os cards ao entrar na tela;
* todos os textos;
* todas as seções;
* cada ícone individualmente;
* cada componente com direção diferente;
* todo o conteúdo em stagger;
* grandes zooms;
* parallax desnecessário;
* floating contínuo;
* bounce exagerado;
* elasticidade excessiva;
* blur pulsando;
* sombras pulsando;
* background se movimentando constantemente.

Não transformar a aplicação em uma demonstração de motion design.

---

# 17. PRINCÍPIO DE MOVIMENTO

A interface deve parecer:

* física
* precisa
* leve
* natural
* controlada

Evitar:

* movimento teatral;
* bounce infantil;
* springs extremamente elásticos;
* transições longas;
* zoom exagerado.

### Regra prática

Se remover uma animação deixar a interface mais elegante:

> **REMOVER A ANIMAÇÃO.**

---

# 18. DURAÇÕES

Para interações comuns:

```text
150–350ms
```

Evitar:

```text
> 500ms
```

sem uma justificativa clara.

Animações pequenas devem ser rápidas.

---

# 19. ENTRADA DE TELAS

Uma tela normalmente deve possuir UMA transição coordenada.

Preferência:

```text
opacity: 0 → 1
translateY: 6–12 → 0
```

Não animar cada elemento da tela individualmente.

### ERRADO

Logo aparece.

Depois título.

Depois subtítulo.

Depois card.

Depois botão.

Depois navbar.

### CERTO

A tela entra como uma composição única.

---

# 20. CARDS

Cards normalmente devem aparecer imediatamente.

Não utilizar entrance animation apenas porque é possível.

Uma animação pode ser utilizada quando:

* existe mudança de estado;
* existe conteúdo novo importante;
* existe hierarquia clara;
* a transição espacial precisa ser comunicada.

---

# 21. BOTÕES

Press feedback extremamente sutil.

Preferência:

```text
scale: 1.00 → 0.97 → 1.00
```

aproximadamente:

```text
120–180ms
```

Pode utilizar:

* haptic leve;
* pequena mudança de opacidade;
* pequena mudança de escala.

Nunca:

* botão pulando;
* botão expandindo demais;
* bounce exagerado.

---

# 22. NAVBAR — ELEMENTO PRINCIPAL DE MOTION

A navbar é uma das poucas áreas em que o motion pode ser mais perceptível.

Ela deve ser um:

> **objeto físico único dentro da interface.**

## Estrutura

Floating capsule.

```text
position: absolute
bottom: insets.bottom > 0 ? insets.bottom : 20
left: 20
right: 20
borderRadius: 33
```

Utilizar:

* BlurView
* borda translúcida
* sombra suave
* safe area
* ícones
* indicador ativo

Não utilizar labels longos.

---

# 23. NAVBAR — ACTIVE INDICATOR

Esta é uma regra crítica.

O indicador ativo deve:

* deslizar;
* seguir o destino;
* permanecer como um único objeto;
* utilizar spring controlado;
* não desaparecer e reaparecer;
* não teleportar.

### ERRADO

```text
indicador antigo desaparece
↓
indicador novo aparece
```

### CERTO

```text
indicador
───────→
desloca fisicamente
```

A sensação deve ser semelhante a um objeto de vidro deslizando de uma posição para outra.

### Importante

Evitar overshoot exagerado.

O indicador deve parar naturalmente.

---

# 24. NAVBAR — HIDE ON SCROLL

Se implementado:

Ao desaparecer:

* pequena translação vertical;
* sair completamente da área de toque;
* sem bounce.

Ao reaparecer:

* pequena translação;
* spring gentil;
* sem fade dramático.

Não esconder e mostrar a navbar a cada pequeno movimento.

Utilizar threshold consistente.

---

# 25. NAVBAR — ÍCONES

Ícones devem:

* permanecer visualmente estáveis;
* utilizar SF Symbols/Lucide/ícones compatíveis já presentes no projeto;
* possuir peso consistente;
* evitar mistura de estilos.

Não trocar ícone por outro apenas para criar animação.

O ícone pode possuir uma pequena alteração de escala/opacidade ao mudar de estado.

---

# 26. TRANSIÇÕES ENTRE TELAS

Priorizar continuidade.

Evitar:

* zoom de tela inteira;
* rotações;
* slides exagerados;
* efeitos 3D desnecessários.

A navegação deve parecer uma sequência natural de superfícies.

---

# 27. MODAIS E BOTTOM SHEETS

Sheets devem parecer fisicamente conectados à parte inferior da tela.

Utilizar:

```text
translateY
+
opacity sutil
+
spring controlado
```

Nunca utilizar zoom dramático.

Ao fechar:

* retorno suave;
* velocidade curta;
* sem bounce excessivo.

---

# 28. GESTOS

Gestos permitidos quando realmente melhorarem a experiência:

* swipe
* long press
* pull to refresh
* drag
* bottom-sheet drag-to-dismiss

Nunca esconder ação crítica exclusivamente atrás de gesto.

Especialmente:

> excluir nunca deve depender somente de swipe.

---

# 29. CHAT — DIREÇÃO VISUAL

O chat é uma das superfícies mais importantes do NÓS.

Deve possuir aparência:

* íntima
* limpa
* fluida
* premium
* confortável

## Input

O campo de mensagem deve ser uma superfície Liquid Glass de destaque.

Deve parecer irmão visual da navbar.

## Mensagens recebidas

Utilizar glass:

```text
rgba(255,255,255,0.70)
```

com blur controlado.

## Mensagens enviadas

Utilizar:

```text
COLORS.primary
```

com superfície sólida.

Isso facilita identificar imediatamente quem enviou.

---

# 30. CHAT — AVATARES

Mensagens devem poder utilizar avatar circular.

Avatar:

* redondo;
* pequeno;
* consistente;
* alinhado ao balão;
* sem bordas pesadas.

Não utilizar avatar em tamanho excessivo.

---

# 31. CHAT — ANIMAÇÃO

Quando uma nova mensagem chegar:

Preferência:

```text
opacity: 0 → 1
translateY: 6–10px → 0
```

aproximadamente:

```text
180–250ms
```

Nunca reanimar a conversa inteira.

Nunca utilizar stagger para todas as mensagens.

---

# 32. CHAT — ENVIO

Ao enviar:

1. feedback imediato;
2. mensagem aparece;
3. input permanece responsivo;
4. scroll acompanha o conteúdo quando necessário;
5. envio real acontece em background;
6. erro deve ser tratado claramente.

A interface nunca deve parecer travada esperando Supabase.

---

# 33. CHAT — TECLADO

O input deve:

* permanecer acima do teclado;
* respeitar safe area;
* não cobrir mensagens;
* manter scroll correto;
* funcionar em teclado grande;
* funcionar em landscape quando aplicável.

Evitar layouts que dependam de alturas fixas.

---

# 34. MEMÓRIAS

Memórias são conteúdo emocional importante.

Priorizar:

* fotografia;
* título;
* data;
* descrição;
* contexto.

Não sobrecarregar com Glass.

A fotografia deve continuar sendo protagonista.

---

# 35. DATAS

Datas importantes devem possuir hierarquia clara.

Priorizar:

1. evento;
2. data;
3. contador;
4. descrição;
5. ações.

Evitar transformar toda data em um card excessivamente decorado.

---

# 36. HOME

A Home deve funcionar como um resumo emocional da relação.

Estrutura possível:

### Header

```text
NÓS
João & Malu
```

### Hero

Fotografia + contador.

Exemplo:

```text
Juntos há 925 dias
```

### Conteúdo

* memória recente;
* próxima data;
* mensagem recente;
* pequenos indicadores relevantes.

Não transformar a Home em dashboard.

---

# 37. SAFE AREA

Todos os screens devem utilizar:

```ts
useSafeAreaInsets()
```

Todo conteúdo principal deve respeitar:

```ts
paddingTop: insets.top + 10
```

Não permitir colisão com:

* status bar;
* Dynamic Island;
* notch.

No:

```text
app/_layout.tsx
```

manter:

```tsx
screenOptions={{
  headerShown: false
}}
```

---

# 38. SCROLL COMPENSATION

Todas as:

* ScrollView
* FlatList

que utilizarem a navbar flutuante devem possuir espaço inferior suficiente.

Padrão:

```ts
contentContainerStyle={{
  paddingBottom: 130,
}}
```

Ajustar somente quando o layout exigir valor diferente.

Nenhum conteúdo pode ficar escondido atrás da dock.

---

# 39. RESPONSIVIDADE

A aplicação deve funcionar corretamente em:

* iPhone pequeno;
* iPhone grande;
* aparelhos com Dynamic Island;
* Android pequeno;
* Android grande;
* diferentes densidades;
* diferentes escalas de fonte.

Nunca construir uma tela pensando apenas em um tamanho de iPhone.

---

# 40. ORIENTAÇÃO

Prioridade:

1. portrait mobile;
2. landscape quando suportado;
3. tablets quando necessário.

Não sacrificar a experiência mobile para acomodar casos extremos.

---

# 41. COMPONENTES REUTILIZÁVEIS

Antes de criar um novo componente, verificar se já existe um equivalente.

Priorizar:

* `GlassSurface`
* `GlassButton`
* `GlassInput`
* `Avatar`
* `Screen`
* `SectionHeader`
* `EmptyState`
* `LoadingState`
* `MessageBubble`
* `FloatingDock`

Componentes devem possuir responsabilidade clara.

Não criar componentes gigantes.

---

# 42. ESTADOS DE COMPONENTES

Todo componente interativo deve considerar:

* default
* pressed
* focused
* disabled
* loading
* success
* error
* selected

Não desenhar apenas o estado perfeito.

---

# 43. EMPTY STATES

Empty states devem ser acolhedores e objetivos.

Exemplo:

```text
Ainda não há memórias.

Que tal guardar a primeira?
```

Evitar telas vazias sem explicação.

Não exagerar nas ilustrações.

---

# 44. LOADING

Loading deve ser:

* discreto;
* rápido;
* contextual.

Evitar skeletons complexos se um indicador simples resolver.

Nunca bloquear a tela inteira quando apenas uma pequena ação está carregando.

---

# 45. ERROS

Erros devem:

* explicar o problema;
* orientar o próximo passo;
* não expor detalhes técnicos;
* não mostrar stack traces ao usuário.

Exemplo:

```text
Não foi possível enviar a mensagem.

Verifique sua conexão e tente novamente.
```

---

# 46. SUPABASE

Segurança é absoluta.

Nunca:

* desabilitar RLS;
* expor service role key;
* colocar segredo no frontend;
* confiar somente no frontend para autorização.

Sempre respeitar:

* RLS;
* autenticação;
* políticas existentes;
* relacionamento do casal.

---

# 47. STORAGE

Fotos e memórias são privadas.

Utilizar:

* bucket privado;
* políticas RLS/storage adequadas;
* signed URLs quando necessário.

Nunca tornar o bucket público apenas para simplificar o desenvolvimento.

---

# 48. PERFORMANCE

Evitar:

* BlurViews excessivos;
* listas sem otimização;
* animações contínuas;
* renders desnecessários;
* imagens gigantes;
* listeners sem cleanup.

Liquid Glass deve ser forte, mas utilizado estrategicamente.

---

# 49. ANIMAÇÃO E PERFORMANCE

Animações importantes devem preferencialmente utilizar:

```text
react-native-reanimated
```

Não executar animações pesadas no JS thread sem necessidade.

Nunca criar loop de animação contínuo apenas para deixar a interface "viva".

---

# 50. REDUCED MOTION

Se o sistema solicitar redução de movimento:

Remover ou reduzir:

* translate;
* spring;
* parallax;
* movimento decorativo;
* animações contínuas.

Manter:

* mudanças simples de opacity;
* feedback funcional;
* transições essenciais.

---

# 51. HAPTICS

Haptics devem ser utilizados com moderação.

Pode utilizar em:

* seleção importante;
* ação concluída;
* botão principal;
* mudança de navegação;
* confirmação significativa.

Não utilizar haptic em absolutamente tudo.

---

# 52. ICONOGRAFIA

Ícones devem seguir uma única linguagem.

Priorizar:

* SF Symbols quando disponível;
* biblioteca já existente;
* ícones lineares consistentes.

Evitar misturar:

* filled;
* outlined;
* 3D;
* emoji;
* estilos diferentes.

---

# 53. MICROCOPY

Textos da interface devem ser:

* humanos;
* curtos;
* claros;
* íntimos;
* naturais.

Evitar linguagem corporativa.

Evitar frases excessivamente infantis.

---

# 54. IMAGENS

Fotos devem possuir:

* bordas suaves;
* crop adequado;
* carregamento progressivo quando necessário;
* fallback;
* suporte a imagens indisponíveis.

Não distorcer imagens.

---

# 55. PWA

Quando implementando PWA:

* respeitar viewport;
* safe areas;
* standalone mode;
* ícone;
* splash;
* aparência mobile;
* navegação touch.

A experiência web deve parecer uma aplicação, não um site responsivo comum.

---

# 56. IOS-FIRST

O iOS deve receber atenção especial.

Verificar:

* Dynamic Island;
* safe areas;
* teclado;
* blur;
* haptics;
* gestos;
* navegação;
* scroll;
* dark mode;
* performance.

O resultado deve parecer natural em um iPhone real.

---

# 57. ANDROID

Android deve continuar funcional e visualmente consistente.

Não criar uma interface completamente diferente.

Adaptar apenas quando houver diferenças reais de plataforma.

---

# 58. DEPENDÊNCIAS

Não instalar bibliotecas por conveniência.

Antes de adicionar uma dependência:

1. verificar se Expo suporta;
2. verificar se React Native atual suporta;
3. verificar se a funcionalidade já existe;
4. considerar impacto no bundle;
5. considerar manutenção.

Preferir APIs nativas e bibliotecas já instaladas.

---

# 59. PRESERVAÇÃO DO PROJETO

Nunca apagar funcionalidades existentes sem motivo.

Antes de alterar:

* autenticação;
* Supabase;
* navegação;
* storage;
* realtime;
* notificações;

entender a implementação atual.

---

# 60. NOTIFICAÇÕES

Notificações devem ser discretas.

Não transformar NÓS em um aplicativo que interrompe constantemente o usuário.

Push notifications devem ser utilizadas para eventos realmente relevantes.

---

# 61. ESTADOS DE REDE

O app deve lidar com:

* internet lenta;
* ausência de internet;
* erro do Supabase;
* timeout;
* retry;
* dados carregando;
* dados vazios.

Não presumir que a rede está sempre disponível.

---

# 62. UI/UX QUALITY GATE

Antes de considerar uma tela concluída, verificar:

### Visual

* [ ] Hierarquia clara
* [ ] Espaçamento consistente
* [ ] Tipografia correta
* [ ] Cores da identidade
* [ ] Glass adequado
* [ ] Sem excesso de elementos
* [ ] Sem poluição visual

### Interaction

* [ ] Press states
* [ ] Loading states
* [ ] Error states
* [ ] Empty states
* [ ] Selected states
* [ ] Keyboard behavior
* [ ] Gestures

### Motion

* [ ] Nenhuma animação desnecessária
* [ ] Transições curtas
* [ ] Sem bounce exagerado
* [ ] Navbar fluida
* [ ] Indicador deslizando
* [ ] Sem stagger excessivo
* [ ] Reduced Motion respeitado

### Responsive

* [ ] iPhone pequeno
* [ ] iPhone grande
* [ ] Android
* [ ] Font scaling
* [ ] Safe area

---

# 63. REAL DEVICE QA

Não considerar uma tela pronta apenas porque funciona no simulador.

Sempre que possível testar em dispositivo real.

Verificar:

* FPS;
* blur;
* teclado;
* safe area;
* touch;
* haptics;
* scroll;
* navegação;
* dark mode;
* orientação;
* carregamento.

---

# 64. MOTION QUALITY CHECK

Antes de aprovar uma animação, perguntar:

1. Ela comunica alguma coisa?
2. Ela melhora a compreensão?
3. Ela parece física?
4. Ela é rápida?
5. Ela é discreta?
6. Ela pode ser removida sem prejudicar UX?

Se a resposta para a última pergunta for "sim":

> remover.

---

# 65. APPLE-STYLE LIQUID GLASS

Para superfícies hero:

* BlurView forte;
* transparência;
* highlight;
* borda translúcida;
* sombra suave;
* contraste;
* depth;
* refração visual.

A superfície deve parecer um material.

Não apenas:

```text
backgroundColor + opacity
```

O objetivo é criar sensação de profundidade.

---

# 66. GLASS HIERARCHY

Estabelecer níveis:

### Level 1 — Soft Glass

Cards secundários.

### Level 2 — Standard Glass

Controles e superfícies importantes.

### Level 3 — Hero Glass

Navbar, input, modal, sheet e controles principais.

### Level 4 — Focus Glass

Estados selecionados e interações especiais.

Não utilizar Level 4 em tudo.

---

# 67. CHAT GLASS

O chat possui tratamento especial.

## Input

Hero Glass.

Deve ficar visualmente conectado à navbar.

## Received message

Glass médio.

## Sent message

Primary sólido.

## Background

Atmosfera discreta.

Não aplicar blur no conteúdo inteiro da conversa.

---

# 68. DARK MODE — EXPERIÊNCIA PREMIUM

Dark Mode não deve parecer:

> "Light Mode com fundo preto."

Deve parecer uma composição própria.

Utilizar:

```text
#0F0D18
```

como base.

Glass:

```text
rgba(30,28,42,0.55)
```

Bordas:

```text
rgba(255,255,255,0.12)
```

Texto:

```text
#F7F5FF
```

Secondary:

```text
#AAA5B8
```

Glow:

```text
#A797FF
```

O glow pode aparecer em:

* selected states;
* navbar;
* controles principais;
* pequenos highlights.

Nunca transformar a tela inteira em neon.

---

# 69. NAVBAR PHYSICS

A navbar deve possuir sensação de peso.

Ao aparecer:

```text
translateY: pequeno deslocamento → 0
```

com spring gentil.

Ao desaparecer:

* sair completamente da área de toque;
* sem bounce;
* sem fade exagerado.

Indicador:

* um único objeto;
* movimento contínuo;
* spring controlado;
* pequeno settling;
* nenhum teleport.

---

# 70. CHAT INTERACTION QUALITY

Enviar mensagem deve parecer instantâneo.

Ao enviar:

```text
opacity 0 → 1
translateY 6–10 → 0
```

Nunca:

* reanimar a lista inteira;
* mover todas as mensagens;
* aplicar zoom;
* fazer a tela "pular".

---

# 71. SCREEN TRANSITIONS

Transições entre telas devem ser:

* rápidas;
* coerentes;
* discretas.

Preferir:

```text
fade
+
small translate
```

Evitar:

* zoom dramático;
* rotação;
* bounce;
* parallax exagerado.

---

# 72. KEYBOARD EXPERIENCE

Ao abrir teclado:

* conteúdo deve continuar acessível;
* input deve subir naturalmente;
* navbar deve respeitar o teclado;
* nenhum botão deve ficar escondido.

Ao fechar:

* retornar sem salto.

---

# 73. TOUCH TARGETS

Áreas tocáveis devem ser confortáveis.

Nunca criar ícones minúsculos como única área de toque.

Mesmo que o ícone visual seja pequeno, sua área de interação deve ser adequada.

---

# 74. RESPONSIVE GLASS

Glass deve se adaptar ao tamanho da tela.

Não fixar:

* larguras desnecessárias;
* alturas rígidas;
* posições absolutas para conteúdo.

Absolute positioning deve ser reservado principalmente para:

* navbar;
* overlays;
* elementos decorativos;
* controles flutuantes.

---

# 75. DESIGNING FROM STATES

Toda tela deve ser pensada nos seguintes estados:

```text
Loading
↓
Empty
↓
Populated
↓
Interaction
↓
Error
↓
Success
```

Não projetar apenas o estado populado.

---

# 76. TYPOGRAPHY ACCESSIBILITY

Com fontes grandes:

* containers podem crescer;
* botões podem ficar maiores;
* textos podem quebrar;
* metadata pode mudar de linha;
* layouts horizontais podem virar verticais.

Nunca cortar conteúdo importante para preservar a estética.

---

# 77. VISUAL RESTRAINT

O NÓS deve seguir:

> **Premium through restraint.**

Quando houver dúvida entre:

```text
mais efeito
```

e

```text
mais espaço
```

preferir:

```text
mais espaço
```

Quando houver dúvida entre:

```text
mais animação
```

e

```text
mais estabilidade
```

preferir:

```text
mais estabilidade
```

---

# 78. CRIATIVIDADE CONTROLADA

O agente possui liberdade criativa para:

* melhorar composição;
* criar microinterações;
* melhorar hierarquia;
* sugerir soluções;
* melhorar estados vazios;
* melhorar detalhes visuais.

Porém essa criatividade deve permanecer dentro da identidade do NÓS.

Não criar efeitos apenas para parecer "mais impressionante".

---

# 79. O QUE FAZ UMA INTERFACE PARECER PREMIUM

Não é:

* quantidade de animações;
* quantidade de blur;
* quantidade de sombras;
* quantidade de gradientes;
* quantidade de efeitos.

É:

* espaçamento;
* tipografia;
* proporção;
* hierarquia;
* consistência;
* feedback;
* velocidade;
* precisão;
* silêncio visual.

---

# 80. DEFINITION OF DONE

Uma implementação somente está concluída quando:

### Código

* [ ] TypeScript sem erros
* [ ] Sem imports inúteis
* [ ] Sem código duplicado desnecessário
* [ ] Componentes reutilizados
* [ ] Arquitetura preservada

### Backend

* [ ] RLS preservado
* [ ] Segurança preservada
* [ ] Supabase funcionando
* [ ] Erros tratados

### UI

* [ ] Light Mode
* [ ] Dark Mode
* [ ] Safe Area
* [ ] Responsive
* [ ] Accessibility
* [ ] Empty
* [ ] Loading
* [ ] Error
* [ ] Success

### Motion

* [ ] Animações discretas
* [ ] Sem exageros
* [ ] Navbar fluida
* [ ] Indicador deslizando
* [ ] Chat suave
* [ ] Reduced Motion

### Visual

* [ ] Paleta oficial
* [ ] Liquid Glass consistente
* [ ] Hierarquia correta
* [ ] Espaçamento correto
* [ ] Sem poluição
* [ ] Sem efeitos gratuitos

---

# 81. PROTOCOLO ANTES DE CODAR

Antes de qualquer alteração relevante, seguir:

```text
1. INSPECIONAR
↓
2. ENTENDER
↓
3. PLANEJAR
↓
4. IMPLEMENTAR
↓
5. TESTAR
↓
6. REVISAR VISUALMENTE
↓
7. CORRIGIR
↓
8. FINALIZAR
```

Não pular diretamente para:

```text
CODAR
```

---

# 82. PROTOCOLO DE ALTERAÇÃO

Para cada tarefa:

### Primeiro

Explique brevemente:

* o que será alterado;
* quais arquivos provavelmente serão afetados;
* por que a abordagem foi escolhida.

### Depois

Faça a menor alteração necessária.

### Depois

Verifique:

* TypeScript;
* imports;
* navegação;
* layout;
* responsive;
* estados;
* animações.

### Finalmente

Informe:

* o que mudou;
* quais arquivos foram alterados;
* como testar.

---

# 83. NÃO SUBSTITUIR ARQUIVOS CEGAMENTE

Nunca:

```text
replace entire file
```

sem necessidade.

Preferir:

* edição localizada;
* preservação de código existente;
* refatoração incremental.

Antes de remover algo, verificar se outro componente depende dele.

---

# 84. NÃO CRIAR COMPLEXIDADE ARTIFICIAL

Não criar:

* abstrações desnecessárias;
* hooks inúteis;
* componentes para uma única linha;
* dependências para problemas simples;
* sistemas de animação complexos sem necessidade.

Código premium também significa código simples.

---

# 85. REGRA FINAL DE MOTION

Memorizar:

> **NÓS NÃO É UM MOTION DESIGN SHOWCASE.**

A animação deve desaparecer da consciência do usuário.

A sensação correta é:

> "Isso é muito fluido."

E não:

> "Olha essa animação."

---

# 86. REGRA FINAL DE GLASS

Memorizar:

> **GLASS DEVE PARECER MATERIAL, NÃO EFEITO.**

Se parecer apenas um `BlurView` colocado atrás de um componente, melhorar:

* iluminação;
* borda;
* contraste;
* profundidade;
* hierarquia.

---

# 87. REGRA FINAL DE UI/UX

Memorizar:

> **CLAREZA ANTES DE DECORAÇÃO.**

Uma interface bonita que dificulta o uso é uma interface ruim.

---

# 88. REGRA FINAL DO NÓS

O produto final deve transmitir:

**"Isso poderia ter sido lançado pela própria Apple, mas pertence somente a nós."**

Não copiar a Apple.

Não copiar aplicativos existentes.

Construir uma identidade própria utilizando os princípios de:

* precisão;
* simplicidade;
* profundidade;
* consistência;
* elegância;
* intimidade.

---

# FINAL STANDARD

Antes de considerar qualquer implementação pronta, pergunte:

> A interface parece premium?

> O Liquid Glass parece um material real?

> O Dark Mode parece cuidadosamente projetado?

> A navbar parece física?

> O indicador realmente desliza?

> As animações são discretas?

> Existe alguma animação que poderia ser removida?

> O chat parece natural?

> A tela funciona perfeitamente em tamanhos diferentes?

> O conteúdo continua sendo o protagonista?

> O usuário entende imediatamente o que pode fazer?

> O código continua simples e seguro?

Se alguma resposta for "não":

**não considerar a implementação concluída.**

---

# NÓS

### Um espaço só nosso.

**Design com intenção.**
**Motion com propósito.**
**Glass com profundidade.**
**Código com responsabilidade.**
