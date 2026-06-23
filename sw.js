/* KNTT PWA service worker
 * v3.12.13: clean network-first updater, injects extension layers directly.
 */
const SW_BUILD = '3.12.13';
const CACHE_PREFIX = 'kntt-cache-';
const CACHE_NAME = CACHE_PREFIX + SW_BUILD;

const CORE = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png',
  './v311-runtime.js',
  './v311-profile.js',
  './version-sync.js',
  './v312-polish.js',
  './v313-archer-god.js',
  './version.json'
];

function noStoreHeaders(type) {
  return {
    'Content-Type': type,
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
  };
}

function bust(path) {
  return path + (path.includes('?') ? '&' : '?') + 'v=' + encodeURIComponent(SW_BUILD) + '&t=' + Date.now();
}

function replaceVersion(html) {
  return html
    .replace(/const\s+GAME_VERSION\s*=\s*['"][^'"]+['"];/, "const GAME_VERSION = '" + SW_BUILD + "';")
    .replace(/<span\s+id=["']ver-num["'][^>]*>[^<]*<\/span>/g, '<span id="ver-num">' + SW_BUILD + '</span>')
    .replace(/<span\s+id=["']ver-num-2["'][^>]*>[^<]*<\/span>/g, '<span id="ver-num-2">' + SW_BUILD + '</span>')
    .replace(/Phiên bản\s*3(?:\.[0-9]+)+\s*·\s*Kiểm tra cập nhật/g, 'Phiên bản ' + SW_BUILD + ' · Kiểm tra cập nhật');
}

function injectLayer(html, file) {
  if (html.includes(file)) return html.replace(new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:\\?v=[^"\']*)?', 'g'), file + '?v=' + SW_BUILD);
  return html.replace('</body>', '<script src="' + file + '?v=' + SW_BUILD + '"></script>\n</body>');
}

function patchIndex(html) {
  let out = replaceVersion(html);
  out = injectLayer(out, 'v311-runtime.js');
  out = injectLayer(out, 'v311-profile.js');
  out = injectLayer(out, 'version-sync.js');
  out = injectLayer(out, 'v312-polish.js');
  out = injectLayer(out, 'v313-archer-god.js');
  if (!out.includes('kntt-modal-stack-fix-clean')) {
    out = out.replace('</head>', '<style id="kntt-modal-stack-fix-clean">#tmod,#hmod{position:absolute!important;inset:0!important;z-index:220!important;background:rgba(4,8,18,.92)!important;backdrop-filter:blur(5px)!important;align-items:center!important;justify-content:center!important;padding:10px!important}#tmod.hidden,#hmod.hidden{display:none!important}#tmod:not(.hidden),#hmod:not(.hidden){display:flex!important}#tmod .ov-card,#hmod .ov-card{width:min(520px,94vw)!important;max-width:min(520px,94vw)!important;max-height:88vh!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}#t-cont,#h-cont{min-height:0!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important}</style>\n</head>');
  }
  return out;
}

function patchRuntime(js) {
  return js.replace(/const\s+GAME_VER\s*=\s*['"][^'"]+['"];/, "const GAME_VER = '" + SW_BUILD + "';");
}

async function networkFirst(req, cacheKey) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await fetch(req, { cache: 'no-store' });
    if (res && (res.ok || res.type === 'opaque')) cache.put(cacheKey || req, res.clone()).catch(() => {});
    return res;
  } catch (_) {
    return (await cache.match(cacheKey || req, { ignoreSearch: true })) || Response.error();
  }
}

async function serveIndex(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await fetch(req, { cache: 'no-store' });
    const html = await res.text();
    const patched = new Response(patchIndex(html), { status: 200, headers: noStoreHeaders('text/html; charset=UTF-8') });
    await cache.put('./index.html', patched.clone());
    await cache.put('./', patched.clone());
    return patched;
  } catch (_) {
    return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
  }
}

async function servePatchedJs(req, patcher) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await fetch(req, { cache: 'no-store' });
    const js = await res.text();
    const patched = new Response(patcher(js), { status: 200, headers: noStoreHeaders('application/javascript; charset=UTF-8') });
    await cache.put(req, patched.clone());
    return patched;
  } catch (_) {
    return (await cache.match(req, { ignoreSearch: true })) || Response.error();
  }
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(CORE.map(async file => {
      try {
        const res = await fetch(bust(file), { cache: 'no-store' });
        if (res && (res.ok || res.type === 'opaque')) await cache.put(file, res.clone());
      } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  const type = event && event.data && event.data.type;
  if (type === 'SKIP_WAITING') self.skipWaiting();
  if (type === 'CLEAR_KNTT_CACHE' || type === 'REFRESH_VERSION') {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(CACHE_PREFIX)).map(k => caches.delete(k)))));
  }
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/meo-phap-su-game/')) {
    event.respondWith(serveIndex(req));
    return;
  }
  if (url.pathname.endsWith('/v311-runtime.js') || url.pathname.endsWith('/v311-profile.js')) {
    event.respondWith(servePatchedJs(req, patchRuntime));
    return;
  }
  if (url.pathname.endsWith('/version.json')) {
    event.respondWith(fetch(req, { cache: 'no-store' }).catch(() => new Response(JSON.stringify({ version: SW_BUILD }), { headers: noStoreHeaders('application/json') })));
    return;
  }
  event.respondWith(networkFirst(req));
});
