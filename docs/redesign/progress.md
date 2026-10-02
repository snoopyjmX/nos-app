# Progresso do redesign do NÓS

Atualizado pelo agente ao fim de cada fase. Não apague este arquivo.

## Fases

- [x] Fase 0: Auditoria (docs/redesign/00-auditoria.md)
- [x] Fase 1: Segurança e dependências
- [ ] **PARADA 1**: usuário aplica as migrations e rotaciona chaves, se preciso
- [ ] Fase 2A: Estrutura e qualidade
- [ ] Fase 2B: 1ª tela (a menor)
- [ ] **PARADA 2**: usuário confere que a tela é igual à anterior
- [ ] Fase 2B: demais telas, uma a uma
- [ ] **PARADA 3**: usuário testa o app inteiro
- [ ] Fase 3A: Tokens
- [ ] Fase 3B: Componentes do design system
- [ ] Fase 4: Casca do app, dock e PWA
- [ ] **PARADA 4**: usuário vê /dev/design-system e a dock no iPhone
- [ ] Fase 5: Início
- [ ] **PARADA 5**: usuário aprova o visual
- [ ] Fase 6: Recados
- [ ] Fase 7: Memórias
- [ ] Fase 8: Datas
- [ ] Fase 9: Ajustes e vínculo
- [ ] **PARADA 6**: usuário revisa as telas
- [ ] Fase 10: Acessibilidade
- [ ] Fase 11: Performance
- [ ] Fase 12: Testes
- [ ] Fase 13: Revisão final de segurança e release
- [ ] **PARADA 7**: fim, usuário revisa e faz o merge

## Registro por fase

(O agente acrescenta aqui, a cada fase: o que foi feito, arquivos alterados, pendências, riscos e o que o usuário precisa testar ou fazer.)
### Fase 1: Segurança e Dependências
- Limpeza de dependências nulas e vulnerabilidades mitigadas.
- Verificação de segredos e chaves de banco.
- Criação de migrations de RLS rigoroso para tabelas e storage.
- **Pendente para o Usuário (PARADA 1)**: Aplicar as `migrations` contidas em `supabase/migrations/` pelo console do Supabase ou CLI (`supabase db push`).
