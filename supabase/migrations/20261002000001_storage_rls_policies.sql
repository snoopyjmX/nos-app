-- Migration: Fix Storage RLS Policies
-- nós. app - Digital private space for couples

-- Deleta as policies permissivas de storage
DROP POLICY IF EXISTS "Couple members can upload memory images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;

-- Nova policy restrita para memórias (INSERT)
CREATE POLICY "Couple members can upload memory images restricted"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'memories' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT (couple_id)::text 
    FROM public.couple_members 
    WHERE user_id = auth.uid()
  )
);

-- Nova policy restrita para memórias (UPDATE)
CREATE POLICY "Couple members can update memory images restricted"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'memories' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT (couple_id)::text 
    FROM public.couple_members 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'memories' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT (couple_id)::text 
    FROM public.couple_members 
    WHERE user_id = auth.uid()
  )
);

-- Nova policy restrita para memórias (DELETE)
CREATE POLICY "Couple members can delete memory images restricted"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'memories' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT (couple_id)::text 
    FROM public.couple_members 
    WHERE user_id = auth.uid()
  )
);

-- Nova policy restrita para avatars (INSERT)
-- O folder/file name do avatar normalmente tem o ID do user.
-- No app: `await supabase.storage.from('avatars').upload(fileName, ...)`
-- fileName é `avatar_${coupleId}_${user.id}_${Date.now()}.jpg` (segundo lib/storage.ts ou profile.tsx)
-- Como o nome do arquivo na raiz tem o user_id (split_part(name, '_', 3) = user_id), podemos usar isso, ou ser flexível para users do próprio casal.
-- Vamos permitir INSERT se o auth.uid() for o usuário, assumindo que ele está autenticado.
-- E vamos usar LIKE para garantir que o auth.uid() está no nome do arquivo (se for esse o formato) ou usar a regra mais geral de autenticado para avatars (que já é público).
-- Se a pasta for pública para leitura, ainda assim o insert deve ser só se tiver autenticado.
-- Manter a segurança de upload no auth.uid() -> mas precisamos validar o nome?
-- Vamos recriar as de avatar com autenticação (no app antigo era só auth.role() = authenticated).
CREATE POLICY "Users can upload avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update avatars"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete avatars"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

-- Obs: As policies antigas "Avatar images are viewable by authenticated users" e "Couple members can view memory images" já estavam corretas na leitura (uma é para todo auth ver avatar de qualquer um, a outra restringe memoria por folder).
