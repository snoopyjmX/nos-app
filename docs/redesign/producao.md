# NÓS — De projeto pessoal a app para vários casais (checklist de produção)

Complementa o `PLANO.md`. Coloque em `docs/redesign/PRODUCAO.md`.

## 0. O que muda por ser para vários casais

- **O RLS passa a ser a única barreira** entre um casal e outro. Antes, um erro de policy expunha dados a quase ninguém; agora expõe a desconhecidos. Por isso entra um teste de isolamento entre casais (seção 3, P1).
- **Cadastro aberto atrai abuso** (contas falsas, spam de `create_couple`, tentativas de força bruta). Cada proteção abaixo reduz isso.
- **Você passa a guardar dados pessoais e íntimos de terceiros** (fotos, recados). Isso traz obrigações da LGPD: Termos, Política de Privacidade e meio de excluir e exportar dados. Não sou advogado; se o app crescer, vale uma revisão jurídica.
- **Custo e limites:** Storage, banco e banda do Supabase crescem com fotos. Os thumbnails já ajudam. Acompanhe o uso no painel.

---

## 1. O que VOCÊ faz no painel do Supabase

Os nomes dos menus podem variar um pouco; procure por Authentication.

1. **Confirmação de e-mail ligada** (Confirm email), para ninguém criar conta com e-mail dos outros.
2. **Senha mínima de 8 caracteres** (ou mais) nas configurações de senha do Auth.
3. **SMTP próprio** (Authentication, SMTP Settings): o envio padrão do Supabase serve só para testes e tem limite muito baixo. Com vários casais, "esqueci a senha" e confirmação deixam de chegar. Use um serviço como Resend ou Brevo, com remetente de domínio verificado.
4. **URL Configuration:** Site URL = o domínio da Vercel. Em Redirect URLs, só os domínios reais (sem curingas desnecessários) e, se testar localmente, só durante o desenvolvimento.
5. **Rate limits** (Authentication, Rate Limits): revise os limites de cadastro, login e e-mails por hora.
6. **Attack Protection:** CAPTCHA (hCaptcha ou Cloudflare Turnstile) é recomendado **antes de divulgar o app publicamente**; exige mudança no app (prompt P5). Proteção contra senhas vazadas é, até onde sei, recurso do plano Pro; se não puder ligar, a senha mínima mais alta compensa em parte.
7. **Projeto de desenvolvimento separado** (recomendado): previews e testes não devem tocar o banco real. Crie um segundo projeto Supabase e use suas chaves só em `.env` local e nos ambientes de Preview da Vercel.
8. **Backups:** no plano gratuito, até onde sei, não há backup diário restaurável por você. Se os dados importam, exporte periodicamente (pg_dump) e confira os arquivos do Storage.
9. **Advisors** (Security e Performance): rode de novo no fim e resolva o que sobrar.

---

## 2. Vercel

1. **Variáveis de ambiente:** só `EXPO_PUBLIC_SUPABASE_URL` e a chave `anon`. Nunca a `service_role`. Separe Production e Preview (cada um com o seu projeto Supabase, se você criou o de desenvolvimento).
2. **Deployment Protection** ligada para os deploys de Preview (para não ficarem públicos).
3. **Cabeçalhos de segurança e cache:** use o arquivo `vercel.json` entregue junto. **Se já existir um `vercel.json` no projeto (rewrites, por exemplo), mescle a seção `headers`, não substitua o arquivo.** Antes de publicar, troque `SEU-PROJETO` pelo identificador do seu projeto Supabase.
4. **A CSP começa em modo "só relatar"** (`Content-Security-Policy-Report-Only`): nada é bloqueado. Publique, abra o app no navegador do computador, use todas as telas (login, recados, enviar foto, áudio) e olhe o Console: as violações aparecem lá. Se surgirem, **me mande a lista**; não afrouxe com `unsafe-inline` nem `unsafe-eval` no script. Com tudo limpo, renomeie a chave para `Content-Security-Policy` para passar a bloquear.
5. O `sw.js` e o `manifest.json` ficam sem cache longo, para atualizações chegarem aos usuários.

---

## 3. Prompts para o agente

Use o mesmo protocolo do `PLANO.md` (uma tarefa por vez, `tsc`, lint, testes e commit local; sem aplicar SQL; sem segredos).

### P1 — Isolamento entre casais

```
TAREFA: TESTE DE ISOLAMENTO ENTRE CASAIS. Não aplique SQL no banco.
Crie scripts/test-isolation.ts (executável com tsx ou ts-node), que lê de variáveis de ambiente locais (nunca commitadas, documente em .env.example) as credenciais de 3 contas de teste: A e B de casais diferentes e C sem casal, e usa o supabase-js com a chave anon.
Verifique que, com a conta A:
1. SELECT em couples, couple_members, profiles, messages, memories e special_dates não retorna nenhuma linha do casal de B (e, para couples e couple_members, só o seu).
2. INSERT, UPDATE e DELETE com o couple_id de B falham.
3. A conta A não consegue listar, baixar nem enviar arquivos nos caminhos do casal de B nos buckets memories e avatars.
4. create_couple_invite com o couple_id de B falha.
5. redeem_couple_invite com código errado, expirado ou já usado devolve sempre "Código inválido ou expirado".
6. A conta C (sem casal) não lê nada.
7. Em messages, o parceiro consegue marcar como lida, mas não consegue alterar o texto.
Saída: tabela de resultados no terminal e docs/redesign/12b-isolamento.md. Qualquer falha é crítica: pare e me avise com o caso exato.
```

Você precisa criar as 3 contas de teste (de preferência no projeto de desenvolvimento) e colocar as credenciais no `.env` local.

### P2 — Termos e Política de Privacidade

```
TAREFA: TELAS DE TERMOS E POLÍTICA DE PRIVACIDADE.
Crie duas telas simples (rotas públicas, acessíveis sem login) que renderizam o texto de docs/legal/termos.md e docs/legal/privacidade.md, que eu fornecerei. Linke-as no cadastro ("Ao criar sua conta, você concorda com os Termos e a Política de Privacidade"), em Ajustes e na tela de boas-vindas. Texto como texto puro, com acessibilidade (títulos como header), usando os componentes do design system. Se os arquivos não existirem, pare e me avise.
```

Eu posso redigir um rascunho dos dois textos em pt-BR para você revisar (não substitui revisão jurídica). É só pedir.

### P3 — Exportar e excluir dados (LGPD)

Antes de mandar, decida: **quando uma pessoa exclui a conta, o que acontece com o que é do casal?** (a) apaga só o que ela criou e o vínculo, e o parceiro mantém o restante; ou (b) apaga tudo do casal, com aviso ao parceiro. Informe a escolha no prompt.

```
TAREFA: EXPORTAR E EXCLUIR DADOS (Ajustes > Privacidade). Regra de exclusão escolhida: {a ou b}.
1. Exportar: gerar para o usuário um arquivo (zip) com seus recados, memórias (metadados e fotos) e datas, usando apenas dados que ele já pode ler por RLS.
2. Excluir conta: confirmação dupla (digitar uma palavra de confirmação). A exclusão roda NO SERVIDOR, em uma Edge Function do Supabase com service_role (a chave só no servidor, nunca no app): apaga os arquivos do Storage pela API de Storage (não por SQL), os registros conforme a regra escolhida e, por fim, o usuário do Auth. Se o parceiro continuar, notifique-o de forma discreta.
3. Gere o código da função e uma migration apenas como arquivo, sem aplicar. Documente em docs/redesign/p3-exclusao.md o que é apagado e o que é mantido (por exemplo, backups).
4. Mensagens genéricas, sem logs de dados pessoais. Teste com uma conta descartável.
```

### P4 — Cabeçalhos na Vercel

```
TAREFA: CABEÇALHOS DE SEGURANÇA. Mescle a seção "headers" de docs/redesign/vercel.json no vercel.json da raiz (se não existir, crie), preservando qualquer rewrite existente. Substitua SEU-PROJETO pelo host do Supabase lido de EXPO_PUBLIC_SUPABASE_URL (não imprima chaves). Mantenha a CSP em Report-Only. Documente em docs/redesign/04-pwa-host.md como testar e como passar para modo de bloqueio.
```

### P5 — CAPTCHA (recomendado antes de divulgar)

```
TAREFA: CAPTCHA NO CADASTRO E LOGIN, usando Cloudflare Turnstile ou hCaptcha (provedor já ligado no painel do Supabase por mim). No web/PWA, carregue o widget e envie o captchaToken nas chamadas signUp e signInWithPassword; no nativo, avalie WebView e me diga o impacto antes de implementar. Ajuste a CSP em vercel.json (script-src e frame-src do provedor) e relate o que mudou. A chave de site é pública; a secreta fica só no painel do Supabase.
```

---

## 4. Ordem recomendada

1. Parada 6 (testes das telas) e Fases 10, 11 e 12 do `PLANO.md`.
2. **P1** (isolamento), depois os itens da seção 1 (você, no Supabase) e a seção 2 (Vercel), com **P4**.
3. **P2** (Termos e Privacidade) e **P3** (exportar e excluir).
4. Fase 13 do `PLANO.md` (revisão final), mais uma nova rodada dos Advisors.
5. **P5** (CAPTCHA), antes de divulgar para o público.
6. Divulgar para poucos casais primeiro, acompanhando o uso e os logs.