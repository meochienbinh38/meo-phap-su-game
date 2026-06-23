/* Service Worker - Kỷ Nguyên Thủ Thành PWA */
const CACHE = 'kntt-v3114-hard-runtime';
const SERVED_GAME_VERSION = '3.11.4';

const CORE = [
  './',
  './index.html',
  './v311-runtime.js',
  './version.json',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png'
];

const EXTRA = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&family=Oswald:wght@500;700;900&display=swap'
];

function patchIndexText(text) {
  let out = text;
  out = out.replace(/const\s+GAME_VERSION\s*=\s*['"][^'"]+['"];/, "const GAME_VERSION = '3.11.4';");
  out = out.replace(/Phiên bản\s*3\.[0-9.]+\s*·\s*Kiểm tra cập nhật/g, 'Phiên bản 3.11.4 · Kiểm tra cập nhật');
  if (!out.includes('v311-runtime.js')) {
    out = out.replace('</body>', '<script src="v311-runtime.js?v=3.11.4"></script>\n</body>');
  }
  return out;
}

async function fetchPatchedIndex(req) {
  const res = await fetch(req || './index.html', { cache: 'no-store' });
  const text = await res.text();
  return new Response(patchIndexText(text), {
    status: res.status,
    statusText: res.statusText,
    headers: { 'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'no-store' }
  });
}

async function putPatchedIndex(cache) {
  try {
    const patched = await fetchPatchedIndex('./index.html');
    await cache.put('./index.html', patched.clone());
    await cache.put('./', patched.clone());
  } catch (_) {}
}

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    await putPatchedIndex(cache);
    await Promise.all(EXTRA.map(async (url) => { try { const res = await fetch(url, { mode: 'no-cors' }); await cache.put(url, res); } catch (_) {} }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientsList) client.postMessage({ type: 'KNTT_SW_READY', version: SERVED_GAME_VERSION });
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.pathname.endsWith('/version.json')) {
    e.respondWith(fetch(req, { cache: 'no-store' }).catch(() => new Response(JSON.stringify({ version: SERVED_GAME_VERSION }), { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  const isIndex = req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/meo-phap-su-game/');
  if (isIndex) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const patched = await fetchPatchedIndex(req);
        cache.put('./index.html', patched.clone()).catch(() => {});
        cache.put('./', patched.clone()).catch(() => {});
        return patched;
      } catch (_) {
        return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: false });
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && (res.status === 200 || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch (_) {
      const fallback = await cache.match(req, { ignoreSearch: true });
      if (fallback) return fallback;
      throw _;
    }
  })());
});
