# Fase 0: Auditoria (NÓS)

## Resumo Executivo

O NÓS necessita de uma grande refatoração estrutural, estilística e de arquitetura para cumprir as regras do `AGENTS.md` e do `DESIGN.md`. A base atual apresenta grandes monolitos de código (arquivos chegando a 1900 linhas) com acoplamento intenso entre lógicas de fetch de dados do Supabase e componentes de UI. Adicionalmente, as regras de estilo de identidade visual (*Apple-inspired Liquid Glass Noturno*) não estão refletidas no tema atual (`constants/theme.ts`), que define um ambiente claro/roxo, oposto ao fundo noturno exigido (`#0F0D18`).  

Acessibilidade e performance também encontram-se comprometidas. O hook `useDockInset`, listado como fundamental para calcular espaços sob a dock flutuante, não existe. Há fixação excessiva de tamanhos de texto (`height` fixo em cartões e containers textuais), e ausência de propriedades essenciais de acessibilidade (como `accessibilityRole` ou de fallback para animações `useReducedMotion`). Em segurança, não há a definição de RLS completa versionada e ocorrem alertas de vulnerabilidades no registro npm (16 registradas).

## Tabela de Achados

| Severidade | Arquivo/Área | Descrição | Sugestão de Correção |
|---|---|---|---|
| **Crítico** | `app/(tabs)/*.tsx` | Arquivos excedem severamente as 250 linhas (ex: `dates.tsx` 1894 lin., `index.tsx` 1723 lin.). UI misturada com chamadas de rede e animação. | Extrair componentes lógicos independentes em pastas (`components/dates`, etc) e isolar fetchers do Supabase para serviços ou custom hooks. |
| **Crítico** | `constants/theme.ts` | Divergência completa de estilo. As cores e tipografias atuais divergem das definidas no `DESIGN.md`. | Reescrever o arquivo de tokens para utilizar exatamente a paleta do Liquid Glass Noturno (fundo `#0F0D18`, primário `#A797FF`). |
| **Alto** | Repositório Todo | Falta do `useDockInset()`. Telas roláveis usam compensação rígida. | Criar o hook `useDockInset` combinando `safeArea.bottom` e aplicar como `paddingBottom` no `contentContainerStyle` das listas. |
| **Alto** | `app/(tabs)/*.tsx` | Uso excessivo de `any` em tipagens de payload do Supabase e blocos catch (`err: any`). | Implementar interfaces/tipos estritos (ex: `Memory`, `DateEvent`) via TypeScript e evitar `any`. |
| **Alto** | `package.json` | 16 vulnerabilidades detectadas (4 high, 12 moderate) em libs auxiliares. Dependências como `@expo/ngrok`, `react-native-worklets` estão ociosas. | Rodar `npm audit fix`, remover pacotes não utilizados indicados pelo `depcheck` e instalar dependências faltantes (como `sharp`). |
| **Médio** | `components/` (geral) | Uso não semântico de alturas (`height` estático em textos), não conformidade com Fontes Dinâmicas. Ausência de `accessibilityRole`. | Substituir lógicas de `height` por `minHeight` e padding. Inserir `accessibilityRole` e `accessibilityLabel` nos touchables. |
| **Médio** | `app/` e `components/` | Ausência da implementação do `useReducedMotion`. Possível excesso de "blur". | Integrar o `useReducedMotion` do `react-native-reanimated` nas animações complexas. Validar performance de camadas translúcidas de blur. |
| **Médio** | `supabase/` | Apesar do `lib/supabase.ts` estar bem estruturado, os scripts SQL de migração e Policies (RLS) não se encontram unificados e detalhados. | Versionar inteiramente as RLS Policies nos arquivos `supabase/migrations/`. |
| **Baixo** | `app/` | `console.warn` vazando logs de banco (`messages.tsx`, `memories.tsx`). | Remover logs de produção e utilizar um logger estruturado que não exponha mensagens puras. |

## Ordem Proposta para Correção

1. **Fundação e Tokens (Configuração do Sistema)**
   - Corrigir e alinhar `constants/theme.ts` e `constants/typography.ts` para que obedeçam religiosamente ao `DESIGN.md`.
   - Criar `hooks/useDockInset.ts` para ser imediatamente absorvido pelo layout.

2. **Arquitetura de Dados e Tipagem**
   - Substituir as instâncias de tipo `any` pelos devidos Tipos/Interfaces de Casal, Mensagens e Memórias, e extrair operações do Supabase para serviços locais (ou custom hooks).

3. **Refatoração UI (Quebra do Monolito)**
   - Dividir as telas imensas de `app/(tabs)` em micro-componentes focados (por exemplo, decompor as células de contagem regresiva que não existem como folha hoje). Garantir os `<FlatList>` isolados e focados.

4. **Acessibilidade e Animações**
   - Integrar suporte estrito do `useReducedMotion`, propriedades visuais A11Y de leitor de tela (como `importantForAccessibility`) e correção do problema de limitação de texto (`height`).

5. **Limpeza Geral (Segurança / Performance)**
   - Ajustar e atualizar pacotes, corrigir logs inseguros e versionar as Policies de segurança e RLS dentro do repositório via `supabase/migrations/`.
