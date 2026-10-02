# Configurações de Host PWA (Vercel)

Para garantir a segurança, aderência às diretrizes e performance do PWA no iPhone, configuramos o servidor de hospedagem (Vercel) através do arquivo `vercel.json`.

## Como testar a CSP em Modo Relatório (Report-Only)

1. A política de segurança (`Content-Security-Policy-Report-Only`) atualmente está no `vercel.json` em modo apenas de alerta.
2. Acesse o aplicativo publicado e abra o DevTools (Console) do seu navegador.
3. Navegue por todas as telas: faça login, ouça recados em áudio, envie fotos e veja o calendário.
4. Qualquer violação aparecerá no Console em amarelo/vermelho indicando que um recurso foi bloqueado (mas por ser Report-Only, ele continua funcionando).
5. Se nenhuma violação aparecer relacionada a scripts ou imagens legítimas do Supabase, você pode prosseguir para o modo bloqueio.

## Como passar para Modo de Bloqueio

Quando tiver certeza de que a CSP não está quebrando funcionalidades do app, edite o arquivo `vercel.json`:
- Localize a chave `"Content-Security-Policy-Report-Only"`.
- Renomeie-a para `"Content-Security-Policy"`.
- Faça o commit e publique novamente na Vercel. A partir desse momento, recursos não autorizados serão ativamente bloqueados pelo navegador.

## Outros Headers de Segurança

Estes já estão ativos e aplicados a todas as rotas no `vercel.json`:
```http
Strict-Transport-Security: max-age=63072000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(self), microphone=(self), geolocation=()
```
