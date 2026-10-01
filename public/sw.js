// Service Worker para nós. (PWA iOS / Web)
// Cache stale-while-revalidate para assets estáticos.
// NUNCA cacheia requisições ao Supabase, APIs dinâmicas ou URLs assinadas de fotos.

const CACHE_NAME = 'nos-static-v2';

const STATIC_EXTENSIONS = [
  '.js',
  '.css',
  '.woff',
  '.woff2',
  '.ttf',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.webp',
  '.ico',
  '.json',
];

self.addEventListener('install', (event) => {
  // Espera ativação manual via SKIP_WAITING para não desestabilizar sessões ativas
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // 1. Só intercepta requisições GET
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 2. NUNCA cachear chamadas ao Supabase, APIs, autenticação ou URLs assinadas de Storage
  const isSupabase =
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('/rest/v1') ||
    url.pathname.includes('/auth/v1') ||
    url.pathname.includes('/storage/v1');

  const hasSignedTokens =
    url.searchParams.has('token') ||
    url.searchParams.has('apikey') ||
    url.searchParams.has('X-Amz-Signature') ||
    url.searchParams.has('signature');

  if (isSupabase || hasSignedTokens) {
    return; // Passa direto para a rede sem encostar no cache
  }

  // 3. Ignora esquemas não-HTTP
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 4. Navegações (documentos HTML): Network First com fallback para cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const indexCached = await caches.match('/');
          if (indexCached) return indexCached;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 5. Assets estáticos: Stale-While-Revalidate
  const isStatic =
    STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext)) ||
    url.pathname.startsWith('/_expo/') ||
    url.pathname.startsWith('/assets/');

  if (isStatic) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);

        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
