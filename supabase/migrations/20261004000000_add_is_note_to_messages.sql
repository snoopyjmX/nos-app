-- Bilhete do Dia: distingue o bilhete intencional (is_note = true) do fluxo normal de chat.
-- Mensagens existentes ficam como chat (default false); sem backfill.
alter table public.messages add column if not exists is_note boolean not null default false;
