/**
 * Script Opcional: Gerar thumbnails para memórias já existentes no Supabase
 *
 * Como executar (manualmente):
 * 1. Instale o pacote 'sharp' e '@supabase/supabase-js' se ainda não tiver:
 *    npm install sharp @supabase/supabase-js --no-save
 * 2. Configure suas variáveis de ambiente:
 *    export SUPABASE_URL="https://seu-projeto.supabase.co"
 *    export SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"
 *    (no Windows PowerShell: $env:SUPABASE_URL="..."; $env:SUPABASE_SERVICE_ROLE_KEY="...")
 * 3. Execute:
 *    node scripts/migrate-memories-thumbnails.mjs
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function migrateThumbnails() {
  console.log('🔍 Buscando memórias sem thumbnail (thumb_path IS NULL)...');

  const { data: memories, error } = await supabase
    .from('memories')
    .select('id, couple_id, image_url, thumb_path')
    .is('thumb_path', null);

  if (error) {
    console.error('❌ Erro ao buscar memórias:', error.message);
    process.exit(1);
  }

  if (!memories || memories.length === 0) {
    console.log('✅ Nenhuma memória pendente. Todas já possuem thumbnail!');
    return;
  }

  console.log(`📸 Encontradas ${memories.length} memórias para processar.`);

  let successCount = 0;
  let errorCount = 0;

  for (const memory of memories) {
    try {
      let cleanPath = memory.image_url.trim();
      if (cleanPath.includes('/memories/')) {
        cleanPath = cleanPath.split('/memories/')[1].split('?')[0];
      }
      cleanPath = cleanPath.replace(/^\/+/, '');

      console.log(`⬇️ Baixando [${memory.id}]: ${cleanPath}...`);

      const { data: fileData, error: downloadError } = await supabase.storage
        .from('memories')
        .download(cleanPath);

      if (downloadError || !fileData) {
        console.warn(`⚠️ Não foi possível baixar ${cleanPath}:`, downloadError?.message);
        errorCount++;
        continue;
      }

      const inputBuffer = Buffer.from(await fileData.arrayBuffer());

      // Gera thumbnail de 400px de largura com Sharp em JPEG 75%
      const thumbBuffer = await sharp(inputBuffer)
        .resize({ width: 400, withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer();

      const pathWithoutExt = cleanPath.replace(/\.[^/.]+$/, '');
      const thumbPath = `${pathWithoutExt}_thumb.jpg`;

      console.log(`⬆️ Enviando thumbnail: ${thumbPath}...`);

      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(thumbPath, thumbBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.warn(`⚠️ Erro ao subir thumbnail ${thumbPath}:`, uploadError.message);
        errorCount++;
        continue;
      }

      const { error: updateError } = await supabase
        .from('memories')
        .update({ thumb_path: thumbPath })
        .eq('id', memory.id);

      if (updateError) {
        console.warn(`⚠️ Erro ao atualizar tabela para ${memory.id}:`, updateError.message);
        errorCount++;
        continue;
      }

      console.log(`✅ Memória [${memory.id}] atualizada com sucesso!`);
      successCount++;
    } catch (err) {
      console.error(`❌ Erro no processamento da memória [${memory.id}]:`, err.message);
      errorCount++;
    }
  }

  console.log('\n--- Resultado da Migração ---');
  console.log(`Total processadas: ${memories.length}`);
  console.log(`Sucessos: ${successCount}`);
  console.log(`Falhas: ${errorCount}`);
  console.log('Lembre-se: nenhuma imagem original foi apagada ou alterada.');
}

migrateThumbnails().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
