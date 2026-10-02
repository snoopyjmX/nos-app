# Configurações de Host PWA

Para garantir a segurança, aderência às diretrizes e performance do PWA no iPhone, o servidor de hospedagem (Firebase Hosting, Vercel ou Nginx) deve incluir os seguintes headers HTTP:

## Content Security Policy (CSP)
```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co; font-src 'self' data:;
```
*(Ajuste conforme os domínios do Supabase utilizados).*

## Strict-Transport-Security (HSTS)
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

## Outros Headers de Segurança
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=()
```
*(Caso o app não use localização, câmera ou microfone; libere apenas o necessário).*
