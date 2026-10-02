-- Migration: Add Strict RLS Policies for all tables
-- nós. app - Digital private space for couples

-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE IF EXISTS public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.couple_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.special_dates ENABLE ROW LEVEL SECURITY;

-- 2. Limpar policies existentes para garantir o recálculo (evitar "using (true)")
DROP POLICY IF EXISTS "Couples read access" ON public.couples;
DROP POLICY IF EXISTS "Couple_members read access" ON public.couple_members;
DROP POLICY IF EXISTS "Couple_members update access" ON public.couple_members;
DROP POLICY IF EXISTS "Profiles read access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update access" ON public.profiles;
DROP POLICY IF EXISTS "Memories read access" ON public.memories;
DROP POLICY IF EXISTS "Memories insert access" ON public.memories;
DROP POLICY IF EXISTS "Memories update access" ON public.memories;
DROP POLICY IF EXISTS "Memories delete access" ON public.memories;
DROP POLICY IF EXISTS "Messages read access" ON public.messages;
DROP POLICY IF EXISTS "Messages insert access" ON public.messages;
DROP POLICY IF EXISTS "Messages update access" ON public.messages;
DROP POLICY IF EXISTS "Messages delete access" ON public.messages;
DROP POLICY IF EXISTS "SpecialDates read access" ON public.special_dates;
DROP POLICY IF EXISTS "SpecialDates insert access" ON public.special_dates;
DROP POLICY IF EXISTS "SpecialDates update access" ON public.special_dates;
DROP POLICY IF EXISTS "SpecialDates delete access" ON public.special_dates;

-- 3. Tabela: couples
-- Read: Membros do casal podem ver o seu próprio couple
CREATE POLICY "Couples read access" ON public.couples
  FOR SELECT USING (
    id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
  );

-- 4. Tabela: couple_members
-- Read: Pode ver membros do mesmo casal ou de si mesmo
CREATE POLICY "Couple_members read access" ON public.couple_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
  );
-- Update: Somente o próprio usuário
CREATE POLICY "Couple_members update access" ON public.couple_members
  FOR UPDATE USING (
    user_id = auth.uid()
  ) WITH CHECK (
    user_id = auth.uid()
  );

-- 5. Tabela: profiles
-- Read: Pode ver o próprio profile ou profile de seu parceiro
CREATE POLICY "Profiles read access" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR
    id IN (
      SELECT user_id FROM public.couple_members WHERE couple_id IN (
        SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
      )
    )
  );
-- Update: Somente o próprio perfil
CREATE POLICY "Profiles update access" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 6. Tabela: memories
-- Read: Restrito aos membros do casal
CREATE POLICY "Memories read access" ON public.memories
  FOR SELECT USING (
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
  );
-- Insert: Membros do casal, garantindo created_by
CREATE POLICY "Memories insert access" ON public.memories
  FOR INSERT WITH CHECK (
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
    AND created_by = auth.uid()
  );
-- Update: Restrito aos membros do casal
CREATE POLICY "Memories update access" ON public.memories
  FOR UPDATE USING (
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
  ) WITH CHECK (
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
  );
-- Delete: Restrito aos membros do casal
CREATE POLICY "Memories delete access" ON public.memories
  FOR DELETE USING (
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
  );

-- 7. Tabela: messages
-- Read: Restrito aos membros do casal
CREATE POLICY "Messages read access" ON public.messages
  FOR SELECT USING (
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
  );
-- Insert: Membros do casal, garantindo created_by
CREATE POLICY "Messages insert access" ON public.messages
  FOR INSERT WITH CHECK (
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
    AND created_by = auth.uid()
  );
-- Update: Apenas o autor da mensagem (ou ambos se for um soft delete/status?)
-- Pela regra restrita, usaremos que apenas o autor pode alterar sua mensagem (caso exista edicao)
CREATE POLICY "Messages update access" ON public.messages
  FOR UPDATE USING (
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()) AND created_by = auth.uid()
  ) WITH CHECK (
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()) AND created_by = auth.uid()
  );
-- Delete: Apenas o autor da mensagem
CREATE POLICY "Messages delete access" ON public.messages
  FOR DELETE USING (
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()) AND created_by = auth.uid()
  );

-- 8. Tabela: special_dates
-- Read: Restrito aos membros do casal
CREATE POLICY "SpecialDates read access" ON public.special_dates
  FOR SELECT USING (
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
  );
-- Insert: Membros do casal, garantindo created_by
CREATE POLICY "SpecialDates insert access" ON public.special_dates
  FOR INSERT WITH CHECK (
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
    AND created_by = auth.uid()
  );
-- Update: Restrito aos membros do casal
CREATE POLICY "SpecialDates update access" ON public.special_dates
  FOR UPDATE USING (
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
  ) WITH CHECK (
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
  );
-- Delete: Restrito aos membros do casal
CREATE POLICY "SpecialDates delete access" ON public.special_dates
  FOR DELETE USING (
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
  );
