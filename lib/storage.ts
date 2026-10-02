import { logger } from './lib/logger';
import { supabase } from './supabase';

interface CacheEntry {
  signedUrl: string;
  expiresAt: number;
}

// Cache em memória para URLs assinadas
const signedUrlCache = new Map<string, CacheEntry>();
const inFlightPromises = new Map<string, Promise<string | null>>();

/**
 * Extrai o caminho relativo (path) no bucket 'memories'
 * a partir de um path relativo puro ou de uma URL legada do Supabase Storage.
 */
export function extractMemoryStoragePath(pathOrUrl?: string | null): string | null {
  if (!pathOrUrl) return null;

  const trimmed = pathOrUrl.trim();
  if (!trimmed) return null;

  // Se já for URI local ou base64, mantém
  if (
    trimmed.startsWith('file:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Se for URL legada do Supabase Storage pública contendo '/memories/'
  if (trimmed.includes('/memories/')) {
    const afterMemories = trimmed.split('/memories/')[1];
    return afterMemories ? afterMemories.split('?')[0] : trimmed;
  }

  return trimmed;
}

/**
 * Retorna a URL assinada do cache de forma síncrona se ainda estiver válida
 * com pelo menos 5 minutos de folga.
 */
export function getCachedSignedMemoryUrl(pathOrUrl?: string | null): string | null {
  const path = extractMemoryStoragePath(pathOrUrl);
  if (!path) return null;

  // Se for URI local, retorna diretamente
  if (
    path.startsWith('file:') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  const cached = signedUrlCache.get(path);
  const now = Date.now();
  if (cached && cached.expiresAt > now + 5 * 60 * 1000) {
    return cached.signedUrl;
  }

  return null;
}

/**
 * Obtém ou gera uma URL assinada válida para exibir imagens do bucket privado 'memories'.
 * Reutiliza cache por padrão com validade de 1 hora (3600 segundos).
 */
export async function getSignedMemoryUrl(
  pathOrUrl?: string | null,
  expiresInSeconds = 3600
): Promise<string | null> {
  const path = extractMemoryStoragePath(pathOrUrl);
  if (!path) return null;

  // Se for URI local, retorna imediatamente
  if (
    path.startsWith('file:') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  // 1. Verifica cache existente
  const cachedUrl = getCachedSignedMemoryUrl(path);
  if (cachedUrl) {
    return cachedUrl;
  }

  // 2. Reutiliza requisição em andamento para o mesmo path
  const inFlight = inFlightPromises.get(path);
  if (inFlight) {
    return inFlight;
  }

  // 3. Gera nova signed URL no Supabase Storage
  const fetchPromise = (async () => {
    try {
      const { data, error } = await supabase.storage
        .from('memories')
        .createSignedUrl(path, expiresInSeconds);

      if (error || !data?.signedUrl) {
        logger.warn('Erro ao gerar signed URL para memória:', error?.message);
        return null;
      }

      const signedUrl = data.signedUrl;
      signedUrlCache.set(path, {
        signedUrl,
        expiresAt: Date.now() + expiresInSeconds * 1000,
      });

      return signedUrl;
    } catch (err: any) {
      logger.warn('Falha inesperada ao obter signed URL:', err?.message || err);
      return null;
    } finally {
      inFlightPromises.delete(path);
    }
  })();

  inFlightPromises.set(path, fetchPromise);
  return fetchPromise;
}
