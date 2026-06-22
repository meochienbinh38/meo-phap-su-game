/* Service Worker - Kỷ Nguyên Thủ Thành PWA */
const CACHE = 'kntt-v32-compact-menu';
const SERVED_GAME_VERSION = '3.2.0';

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

const COMPACT_START_CSS = `
/* campaign-ui-v32: gom màn chọn màn vào đúng 1 màn landscape */
#start {
  padding: 6px !important;
  overflow: hidden !important;
  align-items: stretch !important;
  justify-content: stretch !important;
}
#s-card {
  height: 100% !important;
  max-width: none !important;
  margin: 0 !important;
  display: flex !important;
  flex-direction: column !important;
}
.s-hero {
  flex: 0 0 64px !important;
  padding: 5px 14px 6px !important;
}
.s-hero-title {
  font-size: 30px !important;
  line-height: 1.06 !important;
  letter-spacing: .12em !important;
  white-space: nowrap !important;
}
.s-hero-sub {
  font-size: 10.5px !important;
  line-height: 1.25 !important;
  margin-top: 0 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
.s-body {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) 300px !important;
  gap: 8px !important;
  padding: 8px !important;
}
.s-col-main {
  min-height: 0 !important;
  display: flex !important;
  flex-direction: column !important;
}
.s-col-main > div:first-child {
  margin-bottom: 5px !important;
}
.s-sec-title {
  font-size: 15px !important;
  line-height: 1.1 !important;
  letter-spacing: .2em !important;
}
#gem-d {
  font-size: 14px !important;
}
#maps {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  max-height: none !important;
  gap: 5px !important;
  overflow-y: auto !important;
  padding-right: 2px !important;
}
#maps .m-card {
  min-height: 50px !important;
  padding: 6px 8px !important;
  border-radius: 11px !important;
}
#maps .m-card div[style*="font-size:17px"] {
  font-size: 15px !important;
}
#maps .m-card div[style*="font-size:12px"] {
  font-size: 11px !important;
  line-height: 1.15 !important;
}
#maps .m-card .sub {
  font-size: 8.5px !important;
  line-height: 1.15 !important;
}
.s-actions {
  flex: 0 0 42px !important;
  margin-top: 6px !important;
  gap: 6px !important;
}
.s-actions .btn,
#b-shop,
#b-tal-2 {
  height: 42px !important;
  min-height: 42px !important;
  padding: 6px 8px !important;
  font-size: 11.5px !important;
  line-height: 1.15 !important;
  position: relative !important;
  z-index: 120 !important;
  pointer-events: auto !important;
}
#b-set {
  width: 42px !important;
  min-width: 42px !important;
  height: 42px !important;
  font-size: 17px !important;
  z-index: 120 !important;
  pointer-events: auto !important;
}
.s-col-side {
  width: auto !important;
  min-width: 0 !important;
  padding: 10px !important;
  gap: 7px !important;
  justify-content: center !important;
}
#b-start {
  font-size: 20px !important;
  padding: 13px 10px !important;
  min-height: 72px !important;
}
#b-install {
  font-size: 10px !important;
  padding: 7px !important;
}
.s-col-side .muted {
  font-size: 9px !important;
  line-height: 1.25 !important;
}
#b-update-2 {
  font-size: 10px !important;
  line-height: 1.25 !important;
}
#tmod .ov-card,
#hmod .ov-card {
  max-height: calc(100% - 12px) !important;
  max-width: 620px !important;
  padding: 12px !important;
}
#t-cont,
#h-cont {
  min-height: 0 !important;
}
@media (max-height: 380px) {
  .s-hero { flex-basis: 54px !important; padding-top: 3px !important; }
  .s-hero-title { font-size: 24px !important; }
  .s-hero-sub { font-size: 9px !important; }
  .s-body { padding: 6px !important; gap: 6px !important; grid-template-columns: minmax(0, 1fr) 270px !important; }
  #maps .m-card { min-height: 44px !important; padding: 5px 7px !important; }
  .s-actions, #b-shop, #b-tal-2, #b-set { height: 38px !important; min-height: 38px !important; }
  #b-start { min-height: 58px !important; font-size: 17px !important; padding: 9px !important; }
}
`;

function patchIndexText(text) {
  let out = text
    .replace("const GAME_VERSION = '3.0.0';", `const GAME_VERSION = '${SERVED_GAME_VERSION}';`)
    .replace(
      "UI.showMessage(WAVE_THEMES[waveTheme(State.wave)].hint, waveTheme(State.wave) === 'boss'); Sound.play('wave'); this.buildWave();",
      "UI.showMessage(WAVE_THEMES[_th].hint, _th === 'boss'); Sound.play('wave'); this.buildWave();"
    );

  // v3.2.0: làm gọn màn chọn màn để nút Cửa Hàng/Nội Tại luôn nằm trong một màn landscape.
  if (!out.includes('campaign-ui-v32')) out = out.replace('</style>', `${COMPACT_START_CSS}\n</style>`);
  return out;
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
