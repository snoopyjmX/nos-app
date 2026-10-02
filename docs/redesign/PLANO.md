# NÓS — Plano de execução do redesign (v2, autônomo por fases)

Este arquivo é o roteiro do agente. Leia-o inteiro antes de começar. Ele substitui qualquer versão anterior do plano.

---

## 1. Protocolo de execução

1. Leia, nesta ordem: `AGENTS.md`, `DESIGN.md`, este arquivo, `docs/redesign/progress.md` e `docs/redesign/00-auditoria.md`.
2. Confirme que está na branch `redesign/nos-v2` (`git branch --show-current`). Se não estiver, **pare** e avise.
3. Em `progress.md`, identifique a próxima fase pendente. Execute as fases em sequência até chegar a uma **PARADA** (tabela da seção 3) ou a uma falha.
4. Em cada fase:
   - apresente um plano curto (arquivos a criar, editar e remover) e execute;
   - rode `npx tsc --noEmit`, o lint e os testes existentes;
   - se tudo passar, faça um commit local: `fase X: resumo`;
   - atualize `docs/redesign/progress.md` (fase concluída, arquivos alterados, pendências, riscos).
5. Se algo falhar, corrija e rode de novo. Se falhar duas vezes pelo mesmo motivo, **pare** e explique a causa.
6. Ao chegar numa PARADA: atualize o `progress.md` com "o que testar manualmente" e "o que o usuário precisa fazer", avise e **aguarde a palavra "continuar"**.

### Limites obrigatórios

- Nunca execute SQL contra o banco real nem aplique migrations: apenas gere os arquivos.
- Nunca imprima, grave ou faça commit de segredos. Se encontrar algum, pare e avise.
- Nunca faça push, `reset --hard`, force, nem apague branches. Commits apenas locais.
- Não rode comandos destrutivos fora da pasta do projeto e não instale pacotes sem justificar.
- Não remova `react-native-worklets` (exigido pelo Reanimated 4).
- Se algo exigir ação humana (aplicar migration, rotacionar chave, testar no iPhone, fornecer imagem ou dado ausente), pare e diga exatamente o que é.
- Não avance além do escopo da fase atual e não adicione funcionalidades que não estejam no plano.

### Regras globais (valem para todas as fases)

- **Fonte da verdade:** AGENTS.md > arquivo de tokens do código > DESIGN.md > imagens do Stitch. As imagens são só referência visual; nunca copie HTML/Tailwind, reimplemente em React Native com os componentes e tokens do projeto.
- **Clean code:** TypeScript estrito, sem `any` (use `unknown` em `catch`), sem código morto, sem `console.*`, sem números mágicos (tokens/constantes), componentes pequenos (menos de ~200 linhas) com uma responsabilidade, lógica fora do JSX (hooks e funções puras), rotas finas, acesso ao Supabase só na camada `api`. Siga a convenção de nomes existente; textos de interface em pt-BR.
- **Segurança:** nenhum segredo no código; nenhum `dangerouslySetInnerHTML`; conteúdo de usuário sempre renderizado como texto puro; validação de toda entrada; nada de dados pessoais, tokens ou conteúdo de mensagens em logs; mensagens de erro genéricas.
- **Dependências:** não invente. Se precisar de uma nova, justifique, instale com `npx expo install` quando aplicável e confirme manutenção e licença.
- **Acessibilidade e performance:** as regras do AGENTS.md (seções 5 a 8) valem sempre.
- **Dados:** nenhuma lógica de Supabase/Auth/Realtime/Storage é alterada fora do escopo da fase. Nenhum dado de exemplo hardcoded.
- **Ao concluir qualquer fase:** relate o que mudou por arquivo, o que ficou pendente e os riscos. Não diga "pronto" sem ter rodado os comandos de verificação.

### Referências visuais e dados do usuário

- Telas do Stitch: `docs/redesign/refs/`. Se houver arquivos separados (`inicio.png`, `recados.png`, `memorias.png`, `datas.png`), use-os. Se houver só `stitch-4-telas.png`, as colunas, da esquerda para a direita, são: **Datas, Início, Memórias, Recados**. Se não conseguir abrir a imagem, pare e peça para o usuário anexá-la na conversa.
- Logo/ícone: `docs/redesign/refs/icone-anel.png` e `simbolo-infinito.png` (se existirem).
- Estado atual do banco (resultado de consultas feitas pelo usuário): `docs/redesign/banco-atual.md`. Obrigatório na Fase 1.

---

## 2. Mapa de fases e paradas

Ordem das telas nas fases 2B e 5 a 9: da de menor arquivo (`wc -l`) para a maior; `dates.tsx` por último na refatoração.

| Fase | Assunto | Parada ao final |
|---|---|---|
| 0 | Auditoria | feita |
| 1 | Segurança e dependências | **PARADA 1**: usuário aplica migrations e rotaciona chaves, se preciso |
| 2A | Estrutura de pastas e qualidade | não |
| 2B (1ª tela, a menor) | Refatorar sem mudar o visual | **PARADA 2**: usuário confere que a tela é igual à anterior |
| 2B (demais telas) | Refatorar uma a uma | **PARADA 3**: usuário testa o app inteiro |
| 3A, 3B, 4 | Tokens, componentes, dock e PWA | **PARADA 4**: usuário vê `/dev/design-system` e a dock no iPhone |
| 5 | Início | **PARADA 5**: usuário aprova o visual |
| 6, 7, 8, 9 | Recados, Memórias, Datas, Ajustes | **PARADA 6**: usuário revisa as telas |
| 10, 11, 12, 13 | Acessibilidade, performance, testes, revisão final | **PARADA 7**: fim, usuário revisa e faz o merge |

---

## 3. Fases

### Fase 1 — Segurança e dependências

A auditoria da Fase 0 não verificou os itens 2 a 7. Verifique-os.

Pré-requisito: `docs/redesign/banco-atual.md` com o resultado das consultas de RLS e Storage. Se não existir ou estiver vazio, pare e peça.

Gere migrations em `supabase/migrations/` e o relatório `docs/redesign/01-seguranca.md` explicando cada uma. Não execute SQL.

1. **Dependências:** rode `npm audit --omit=dev` e separe o que afeta produção do que é só ferramenta de desenvolvimento. Não use `npm audit fix --force`. Antes de remover qualquer pacote apontado pelo depcheck, confirme que não é usado em `app.json`/plugins, `babel.config`, `metro.config` ou scripts. `sharp`, se usado só por scripts, vai em `devDependencies`. Atualize só o que o `npx expo install --check` aceitar para o SDK atual.
2. **Segredos:** procure chaves no código e no histórico do git (`git grep`, `git log -S` por "service_role", "secret", "key"). Só a chave anon/pública pode estar no cliente. Garanta `.env` no `.gitignore` e crie `.env.example` sem valores. Se algum segredo já esteve no histórico, avise: precisa ser rotacionado.
3. **RLS:** toda tabela com dados do casal com RLS ativo; policies restritas aos membros do casal, com `USING` e `WITH CHECK`; o autor de um registro só pode ser o usuário autenticado; nenhuma policy `using (true)`.
4. **Código de vínculo:** expira, é de uso único, não pode ser descoberto por tentativa e erro e é resolvido por RPC (`SECURITY DEFINER` com `search_path` fixo), nunca por consulta direta.
5. **Storage:** buckets privados, caminhos por casal, policies por membro, URLs assinadas de curta duração. Antes do upload, reencode as fotos para remover EXIF (localização). Valide tipo e tamanho.
6. **Sessão e entrada:** onde o token fica guardado (nativo: `expo-secure-store`; web: documente o risco). Schemas de validação (zod) para texto, títulos, legendas, datas e uploads. Substitua os `console.warn` por um logger que não imprime dados pessoais.
7. **Realtime:** assinaturas filtradas pelo casal e dependentes de RLS.

Entregue em `01-seguranca.md`: o que mudou, o que depende do usuário aplicar no Supabase e um checklist de testes manuais (ex.: "um usuário de outro casal não consegue ler X").

### Fase 2A — Estrutura e qualidade (sem mudar comportamento nem visual)

Crie a estrutura:

```
src/
  app/        rotas do Expo Router, finas
  features/{inicio,recados,memorias,datas,ajustes,vinculo}/{components,hooks,api,types}
  design/     tokens e componentes do design system
  lib/        cliente Supabase, utilitários, datas, validação
```

Mova com `git mv`, ajuste imports (alias), sem dependência circular. Configure TypeScript strict, ESLint (react-hooks e acessibilidade para React Native), Prettier e scripts `typecheck`, `lint`, `test`, `check` (roda tudo). Adicione um ErrorBoundary global. Corrija os avisos novos sem desativar regras. O app deve rodar idêntico ao de antes.

### Fase 2B — Refatorar uma tela (repita para cada tela, sem mudar o visual)

Método, nesta ordem:

1. Liste o que a tela faz (dados lidos e escritos, assinaturas Realtime, animações, regras de cálculo). Não altere comportamento.
2. Extraia as regras de cálculo (datas, contagens, progresso) para funções puras e escreva testes **antes** de mover (virada de mês, ano bissexto, fuso).
3. Mova todo acesso ao Supabase para `features/{x}/api` (funções tipadas) e crie hooks que expõem `{ data, status, error }`. Troque todo `any` por tipos reais.
4. Quebre a UI em componentes pequenos, com contadores e timers em componentes folha isolados.
5. A rota fica fina: só monta a tela.
6. Troque alturas fixas de texto por `minHeight` e padding, sem alterar a aparência.
7. Remova código morto e `console.*`.

Se a tela for grande demais para uma passada, faça os passos 1 a 3, faça o commit e continue na sequência.

### Fase 3A — Tokens

Já existe um arquivo de tokens (`constants/theme.ts` e `constants/typography.ts`). Não crie um segundo: refatore-o para refletir o DESIGN.md e o AGENTS.md. O tema escuro é o padrão e o claro continua funcionando como suporte.

1. Antes de editar, liste as diferenças entre os tokens atuais e o DESIGN.md.
2. Tokens: cores (dark e light, incluindo `bubble-sent`, `on-primary` e `affection`), tipografia (Plus Jakarta Sans), espaçamento, raios, níveis de vidro com fallback, durações e easings.
3. Substitua todo valor hardcoded de cor, espaço, raio e fonte nas telas pelos tokens.
4. Confirme o carregamento da fonte (com fallback) e que o texto escala com a fonte dinâmica.
5. Confira e relate o contraste dos pares texto/fundo principais (alvo AA).

### Fase 3B — Componentes do design system (`src/design/`)

Já existe um `GlassSurface`: refatore-o, não recrie. Entregue:

- `GlassSurface` (hero, standard, subtle, none) com fallback sólido na web/PWA e com Reduce Transparency ativo.
- `AppText`, `Chip`, `IconButton` (mínimo 44x44), `PrimaryButton`, `SecondaryButton`, `MetricCapsule`, `SectionHeader` (nunca esmaga o texto: `flexShrink`, `minWidth: 0`, a ação desce se faltar espaço), `ScreenContainer`.
- Hooks: `useDockInset()` (dock 64 + margem 20 + safe area inferior + respiro 24, mínimo 140), `useReducedMotion()` (pode envolver o do Reanimated), `useReducedTransparency()`.
- `Skeleton`, `EmptyState`, `ErrorState` com tom carinhoso.
- Tela `/dev/design-system` (somente em desenvolvimento) mostrando tudo em dark e light e com fonte aumentada.

### Fase 4 — Casca do app (dock, safe areas, PWA)

1. Dock flutuante (Hero glass) com 5 itens: Início, Recados, Memórias, Datas, Ajustes. Alvo 48x48, indicador ativo deslizante, respeita safe area e Reduce Motion, badge discreto de novo recado.
2. Layout raiz: fundo ambiente estático, safe areas, teclado (o input do chat sobe acima da dock).
3. HTML do PWA: `viewport-fit=cover`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` (`black-translucent`), `apple-touch-icon` 180x180 sem cantos arredondados, `theme-color`, `lang="pt-BR"`.
4. Manifest: separe os ícones `any` e `maskable` (o maskable com o símbolo dentro da zona segura central, full-bleed); mantenha `id`, `scope`, `start_url`, `display: standalone`, `orientation: portrait`, cores `#0F0D18`.
5. Ícones: gere os tamanhos a partir de `refs/icone-anel.png` com um script usando `sharp` (devDependency). Se a imagem tiver cantos arredondados embutidos, recorte por dentro (cerca de 6% por lado) e deixe quadrada full-bleed; avise se o resultado ficar ruim.
6. Service worker (se existir): só assets estáticos versionados; nunca cacheie respostas autenticadas, URLs assinadas de fotos ou dados do Supabase.
7. Liste, em `docs/redesign/04-pwa-host.md`, o que precisa ser configurado no host do PWA: CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

### Fase 5 — Início

Reconstrua a camada visual a partir de `refs/` (coluna **Início**), com os componentes do design system, seguindo a anatomia do AGENTS.md: título de saudação, badge "Com {parceiro(a)}", hero com foto circular, "Desde {data}", contador grande, 3 cápsulas (meses, dias, horas) separadas, 3 ações rápidas, Próxima Celebração com progresso e Memória Recente com "Ver álbum".

- Dados só dos hooks existentes. Contador e cápsulas em componentes folha isolados, com um único rótulo de acessibilidade.
- Estados de carregando, vazio e erro.
- Teste em 375px e com fonte 1,5x. Padding inferior com `useDockInset()`.

### Fase 6 — Recados

Referência: coluna **Recados**. Header (avatar, nome, status opcional, badge "Espaço privado"), Bilhete do Dia com texto na largura total, balões (enviados em `bubble-sent` à direita, recebidos em vidro à esquerda com avatar), áudio, fotos, respostas rápidas e input flutuante **acima** da dock.

- Placeholder do input em uma linha, com `flex: 1`; envio 44x44.
- Lista não escondida atrás do input nem da dock; rolagem para a última mensagem sem pular; lista otimizada.
- Mensagens sempre como texto puro; links só com esquema http/https validado.
- Acessibilidade: ordem de leitura, quem enviou, player com rótulo "Reproduzir recado de voz, {n} segundos".
- Mantenha toda a lógica de Realtime e envio.

### Fase 7 — Memórias

Referência: coluna **Memórias**. Galeria editorial com a foto como protagonista. Header "{n} momentos guardados a dois" (sem quebrar em coluna estreita), botão "Adicionar" e filtros em chips. Card: foto, badge de data e favorito sobre a imagem; abaixo, local e autoria (empilham sem sobrepor); título emotivo e texto completo sem vidro. O botão de nova memória respeita margens e nunca cobre legendas.

- Imagens otimizadas, lista virtualizada.
- Upload com validação de tipo e tamanho, remoção de EXIF e feedback de progresso e erro.
- Fotos com descrição acessível emotiva (nunca nome de arquivo).
- Estados: carregando, vazio ("Suas memórias aparecerão aqui") e erro.

### Fase 8 — Datas

Referência: coluna **Datas**. Hero do próximo marco, grid de 4 displays (dias, horas, minutos, segundos), barra de progresso do ciclo, controle segmentado "Próximas ({n})" | "Conquistas", linha do tempo com miniatura, "Em {n} dias" e status.

- Cálculos por funções puras testadas.
- Atualização da contagem isolada; um único rótulo de acessibilidade, sem anunciar segundos em loop.
- Mostre "Conquistas" só se houver lógica real; senão oculte a aba e avise.
- Textos como "Reserva confirmada no Terraço" cabem sem truncar mal; teste em 375px e fonte 1,5x.

### Fase 9 — Ajustes e vínculo

Perfil do casal, data de início, código de vínculo, tema claro/escuro (respeitando o sistema por padrão) e seção "Privacidade": presença opcional ("Online agora" / "Visto há…") e sair da conta. Fluxo de vínculo com estados claros (gerar, expirado, usado, inválido) e mensagens genéricas que não revelam dados de terceiros. Confirmação antes de ações destrutivas; o código de vínculo nunca vai para logs.

### Fase 10 — Acessibilidade transversal

1. Todo `Pressable` com `accessibilityRole`, `accessibilityLabel` em pt-BR e hint quando útil; títulos de tela e seções com role `header`.
2. Alvos mínimos de 44x44 (48 na dock); `hitSlop` quando o visual for menor.
3. Contraste: audite todos os pares texto/fundo contra AA e liste os que falham **antes** de corrigir; depois corrija pelos tokens.
4. Fonte dinâmica: nada de altura fixa em texto; teste a 1,5x.
5. Reduce Motion e Reduce Transparency respeitados em todos os componentes.
6. Cor nunca é o único indicador de estado.
7. PWA: foco visível, ordem de tabulação lógica, atributos semânticos equivalentes.

Entregue relatório por arquivo e uma lista do que exige teste manual com VoiceOver.

### Fase 11 — Performance

Meça antes (tempo de carregamento, FPS ao rolar Memórias e Recados) e depois de mudar. Máximo de 2 a 3 camadas de blur por tela; fallback sólido na web. Remova re-renders desnecessários, mantenha timers isolados, use listas virtualizadas, imagens no tamanho certo, carregamento sob demanda de rotas pesadas e animações só com `transform` e `opacity`. Reduza o bundle. Relate os números e não troque bibliotecas sem justificar com medição.

### Fase 12 — Testes

1. Testes unitários das funções puras (datas, contagens, progresso, validações) com casos de borda.
2. Testes de componentes críticos (`MetricCapsule`, `SectionHeader`, balões, dock) com `@testing-library/react-native`: renderização, rótulos de acessibilidade e estados.
3. Testes dos hooks de dados com a camada `api` mockada (sucesso, vazio, erro).
4. Roteiro de testes manuais em `docs/redesign/12-testes-manuais.md` (usuário de outro casal não acessa dados, tema claro/escuro, fonte 1,5x, Reduce Motion, VoiceOver).

Não reduza regras de lint para passar. O script `check` roda typecheck, lint e testes.

### Fase 13 — Revisão final de segurança e release

Não implemente funções novas.

1. Repita a auditoria de segurança da Fase 0 e compare com o estado inicial.
2. Rode `npm audit`, `npx expo-doctor`, `npx tsc --noEmit`, lint e testes, e registre os resultados.
3. Varra o repositório por segredos, `console.*`, `dangerouslySetInnerHTML`, `any` e TODOs.
4. Gere uma matriz "quem pode ler/escrever o quê" por tabela e bucket.
5. Confira o PWA (manifest, ícones, service worker, cabeçalhos recomendados) e o checklist da seção 11 do AGENTS.md.

Entregue `docs/redesign/13-release.md` com evidências e pendências por severidade.

---

## 4. Novas funções (opcionais)

Só execute se o usuário pedir explicitamente, depois da Fase 13, uma de cada vez:

- **N1 Notificações de novo recado:** Web Push com opt-in em Ajustes, chaves VAPID só no servidor, envio por Edge Function, notificação sem mostrar o texto da mensagem, assinaturas por usuário com RLS e remoção das inválidas.
- **N2 Cápsula do tempo:** recado com data de abertura; a trava é no servidor (RLS/RPC), de modo que o destinatário não leia antes da data nem por consulta direta.
- **N3 Pergunta do dia:** uma pergunta por dia; as respostas só aparecem quando ambos responderam, garantido no servidor; pode pular.
- **N4 Lista de desejos compartilhada:** itens, marcar como feito, RLS por casal, validação, estados e acessibilidade.
- **N5 Exportar e excluir dados (LGPD):** exportar memórias e recados e excluir conta e dados, com confirmação dupla e execução no servidor; documente o que é apagado e o que é mantido.