-- Migration: Funções manuais, policies faltantes e otimizações de RLS

-- 1. Função utilitária para verificar se o usuário pertence a um casal
CREATE OR REPLACE FUNCTION public.is_couple_member(p_couple_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM couple_members
    WHERE couple_id = p_couple_id AND user_id = auth.uid()
  );
$$;

-- couples: membros podem editar (ex.: data de início)
drop policy if exists "Couples update access" on public.couples;
create policy "Couples update access" on public.couples
  for update to authenticated
  using (public.is_couple_member(id))
  with check (public.is_couple_member(id));

-- profiles: upsert do próprio perfil
drop policy if exists "Profiles insert access" on public.profiles;
create policy "Profiles insert access" on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

-- messages: parceiro só pode marcar como lida
drop policy if exists "Messages update access" on public.messages;
create policy "Messages update access" on public.messages
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

create or replace function public.messages_guard_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  permitidos text[] := array['read', 'read_at', 'seen_at', 'updated_at'];
begin
  if new.couple_id is distinct from old.couple_id
     or new.created_by is distinct from old.created_by then
    raise exception 'Campos protegidos não podem ser alterados';
  end if;

  if (select auth.uid()) is distinct from old.created_by then
    if (to_jsonb(new) - permitidos) is distinct from (to_jsonb(old) - permitidos) then
      raise exception 'Você só pode marcar o recado como lido';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists messages_guard_update on public.messages;
create trigger messages_guard_update
  before update on public.messages
  for each row execute function public.messages_guard_update();

-- avatars: remove todas as policies abertas e cria as restritas
drop policy if exists "Avatar images are viewable by authenticated users" on storage.objects;
drop policy if exists "Avatars read access" on storage.objects;
drop policy if exists "Avatars insert access" on storage.objects;
drop policy if exists "Avatars update access" on storage.objects;
drop policy if exists "Avatars delete access" on storage.objects;
drop policy if exists "Users can upload avatars" on storage.objects;
drop policy if exists "Users can update avatars" on storage.objects;
drop policy if exists "Users can delete avatars" on storage.objects;
drop policy if exists "Users can upload own avatars" on storage.objects;
drop policy if exists "Users can update own avatars" on storage.objects;
drop policy if exists "Users can delete own avatars" on storage.objects;

create policy "Avatars read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Avatars insert own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Avatars update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Avatars delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- advisor: função auxiliar que ninguém precisa chamar
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
