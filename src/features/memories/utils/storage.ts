import { supabase } from '@/lib/core/supabase';
import { MemoryItem } from '../types';

interface CacheEntry {
  url: string;
  expiresAt: number;
}

const signedUrlCache = new Map<string, CacheEntry>();

export function clearSignedUrlCache() {
  signedUrlCache.clear();
}

export const sanitizeStoragePath = (pathString?: string | null): string => {
  if (!pathString) return '';
  let cleanPath = pathString.trim();
  if (
    cleanPath.startsWith('file:') ||
    cleanPath.startsWith('data:') ||
    cleanPath.startsWith('blob:')
  ) {
    return cleanPath;
  }
  if (cleanPath.includes('/memories/')) {
    cleanPath = cleanPath.split('/memories/')[1].split('?')[0];
  }
  return cleanPath.replace(/^\/+/, '');
};

export const isSignableStoragePath = (path: string): boolean => {
  if (!path) return false;
  if (
    path.startsWith('file:') ||
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return false;
  }
  return true;
};

export const resolveBatchMemoryUrls = async (items: MemoryItem[]): Promise<MemoryItem[]> => {
  const now = Date.now();
  const pathsToSignSet = new Set<string>();

  for (const item of items) {
    const mainPath = sanitizeStoragePath(item.image_url);
    const thumbPath = sanitizeStoragePath(item.thumb_path || item.image_url);

    if (isSignableStoragePath(mainPath)) {
      const cached = signedUrlCache.get(mainPath);
      if (!cached || cached.expiresAt <= now + 60000) {
        pathsToSignSet.add(mainPath);
      }
    }

    if (isSignableStoragePath(thumbPath)) {
      const cached = signedUrlCache.get(thumbPath);
      if (!cached || cached.expiresAt <= now + 60000) {
        pathsToSignSet.add(thumbPath);
      }
    }
  }

  const pathsToSign = Array.from(pathsToSignSet);

  if (pathsToSign.length > 0) {
    try {
      const { data: signedData, error: signError } = await supabase.storage
        .from('memories')
        .createSignedUrls(pathsToSign, 3600);

      if (!signError && signedData) {
        const expiresAt = Date.now() + 3500 * 1000;
        signedData.forEach((result) => {
          if (result.path && result.signedUrl) {
            signedUrlCache.set(result.path, { url: result.signedUrl, expiresAt });
          }
        });
      }
    } catch {
      // Ignora falha no lote
    }
  }

  return Promise.all(
    items.map(async (item) => {
      const mainPath = sanitizeStoragePath(item.image_url);
      const thumbPath = sanitizeStoragePath(item.thumb_path || item.image_url);

      let displayUrl = mainPath;
      if (isSignableStoragePath(mainPath)) {
        const cached = signedUrlCache.get(mainPath);
        if (cached?.url) {
          displayUrl = cached.url;
        } else {
          try {
            const { data } = await supabase.storage.from('memories').createSignedUrl(mainPath, 3600);
            if (data?.signedUrl) {
              signedUrlCache.set(mainPath, { url: data.signedUrl, expiresAt: Date.now() + 3500 * 1000 });
              displayUrl = data.signedUrl;
            }
          } catch {
            displayUrl = item.image_url;
          }
        }
      }

      let displayThumbUrl = thumbPath;
      if (isSignableStoragePath(thumbPath)) {
        const cached = signedUrlCache.get(thumbPath);
        if (cached?.url) {
          displayThumbUrl = cached.url;
        } else if (thumbPath === mainPath && displayUrl) {
          displayThumbUrl = displayUrl;
        } else {
          try {
            const { data } = await supabase.storage.from('memories').createSignedUrl(thumbPath, 3600);
            if (data?.signedUrl) {
              signedUrlCache.set(thumbPath, { url: data.signedUrl, expiresAt: Date.now() + 3500 * 1000 });
              displayThumbUrl = data.signedUrl;
            }
          } catch {
            displayThumbUrl = displayUrl;
          }
        }
      }

      return {
        ...item,
        displayUrl: displayUrl || item.image_url,
        displayThumbUrl: displayThumbUrl || displayUrl || item.image_url,
      };
    })
  );
};
