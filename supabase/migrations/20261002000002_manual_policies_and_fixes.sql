-- Migration: Funções manuais, policies faltantes e otimizações de RLS

-- 1. Função utilitária para verificar se o usuário pertence a um casal
-- Otimiza consultas evitando subqueries repetidas
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

-- Atualiza as policies de couples para permitir UPDATE (ex: anniversary_date)
CREATE POLICY "Couples update access" ON public.couples
  FOR UPDATE USING (is_couple_member(id)) WITH CHECK (is_couple_member(id));

-- Permite INSERT no profiles (para o upsert no momento de atualizar o perfil)
CREATE POLICY "Profiles insert access" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Atualiza as policies de messages para permitir UPDATE para quem for membro do casal (ex: marcar read: true em mensagem do parceiro)
DROP POLICY IF EXISTS "Messages update access" ON public.messages;
CREATE POLICY "Messages update access" ON public.messages
  FOR UPDATE USING (is_couple_member(couple_id)) WITH CHECK (is_couple_member(couple_id));

-- Policies de Avatar (Storage)
-- A pasta raiz é o auth.uid(), então limitamos para que cada um só possa ler e gravar na sua própria pasta
DROP POLICY IF EXISTS "Avatars read access" ON storage.objects;
DROP POLICY IF EXISTS "Avatars insert access" ON storage.objects;
DROP POLICY IF EXISTS "Avatars update access" ON storage.objects;
DROP POLICY IF EXISTS "Avatars delete access" ON storage.objects;

CREATE POLICY "Avatars read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Avatars insert access" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Avatars update access" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  ) WITH CHECK (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Avatars delete access" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  );
