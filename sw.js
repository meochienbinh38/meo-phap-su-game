/* Service Worker - Kỷ Nguyên Thủ Thành PWA */
const CACHE = 'kntt-v31-campaign-hintfix';
const SERVED_GAME_VERSION = '3.1.0';

const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png'
];

// Cross-origin assets we want available offline (best-effort, opaque allowed).
const EXTRA = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&family=Oswald:wght@500;700;900&display=swap'
];

function patchIndexText(text) {
  // v3.1.0 hotfix: campaign dùng theme theo màn, không dùng waveTheme() endless cũ.
  // Đồng thời nâng nhãn phiên bản phục vụ qua GitHub Pages/PWA cache.
  return text
    .replace("const GAME_VERSION = '3.0.0';", `const GAME_VERSION = '${SERVED_GAME_VERSION}';`)
    .replace(
      "UI.showMessage(WAVE_THEMES[waveTheme(State.wave)].hint, waveTheme(State.wave) === 'boss'); Sound.play('wave'); this.buildWave();",
      "UI.showMessage(WAVE_THEMES[_th].hint, _th === 'boss'); Sound.play('wave'); this.buildWave();"
    );
}

async function patchIndexResponse(res) {
  if (!res || !res.ok) return res;
  const text = await res.text();
  return new Response(patchIndexText(text), {
    status: res.status,
    statusText: res.statusText,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'no-store'
    }
  });
}

async function cachePatchedIndex(cache) {
  try {
    const res = await fetch('./index.html', { cache: 'no-store' });
    const patched = await patchIndexResponse(res);
    await cache.put('./index.html', patched.clone());
    await cache.put('./', patched.clone());
  } catch (_) { /* keep cache.addAll fallback */ }
}

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    await cachePatchedIndex(cache);
    // Best-effort: ignore failures for cross-origin assets.
    await Promise.all(EXTRA.map(async (url) => {
      try {
        const res = await fetch(url, { mode: 'no-cors' });
        await cache.put(url, res);
      } catch (_) { /* offline-first still works for the shell */ }
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // version.json: luôn lấy từ mạng (không cache) để kiểm tra cập nhật chính xác.
  if (req.url.includes('version.json')) {
    e.respondWith(fetch(req).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  const url = new URL(req.url);
  const isIndex = req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/meo-phap-su-game/');

  // Navigation/index requests -> serve patched app shell; network-first, patched cache fallback.
  if (isIndex) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const patched = await patchIndexResponse(await fetch(req, { cache: 'no-store' }));
        cache.put('./index.html', patched.clone()).catch(() => {});
        cache.put('./', patched.clone()).catch(() => {});
        return patched;
      } catch (_) {
        return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }

  // Everything else: cache-first, then network (and cache the result).
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: false });
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && (res.status === 200 || res.type === 'opaque')) {
        cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    } catch (_) {
      const fallback = await cache.match(req, { ignoreSearch: true });
      if (fallback) return fallback;
      throw _;
    }
  })());
});
