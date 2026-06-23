/* Service Worker - Kỷ Nguyên Thủ Thành PWA
 * Version source of truth: version.json
 */
const VERSION_URL = './version.json';
const FALLBACK_VERSION = '3.11.9';
const CACHE_PREFIX = 'kntt-cache-';
const VERSION_TTL_MS = 30 * 1000;

const CORE_STATIC = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png',
  './v311-runtime.js',
  './v311-profile.js',
  './version-sync.js',
  './version.json'
];

const EXTRA = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&family=Oswald:wght@500;700;900&display=swap'
];

let cachedVersionInfo = null;
let cachedVersionAt = 0;
let versionInfoPromise = null;

function safeVersion(v) {
  return String(v || FALLBACK_VERSION).replace(/[^a-zA-Z0-9_.-]/g, '-');
}

function cacheName(version) {
  return CACHE_PREFIX + safeVersion(version);
}

function normalizeVersionInfo(data) {
  if (data && data.version) {
    return {
      version: String(data.version),
      build: data.build || '',
      notes: data.notes || ''
    };
  }
  return { version: FALLBACK_VERSION, build: '', notes: '' };
}

async function readVersionInfo(options = {}) {
  const force = !!options.force;
  const now = Date.now();

  if (!force && cachedVersionInfo && (now - cachedVersionAt) < VERSION_TTL_MS) {
    return cachedVersionInfo;
  }

  if (!force && versionInfoPromise) return versionInfoPromise;

  const promise = (async () => {
    try {
      const res = await fetch(VERSION_URL + '?t=' + now, { cache: 'no-store' });
      if (!res.ok) throw new Error('version.json HTTP ' + res.status);
      const data = await res.json();
      cachedVersionInfo = normalizeVersionInfo(data);
      cachedVersionAt = Date.now();
      return cachedVersionInfo;
    } catch (_) {
      if (cachedVersionInfo) return cachedVersionInfo;
      cachedVersionInfo = normalizeVersionInfo(null);
      cachedVersionAt = Date.now();
      return cachedVersionInfo;
    } finally {
      if (versionInfoPromise === promise) versionInfoPromise = null;
    }
  })();

  if (!force) versionInfoPromise = promise;
  return promise;
}

function resetVersionMemory() {
  cachedVersionInfo = null;
  cachedVersionAt = 0;
  versionInfoPromise = null;
}

function patchIndexText(text, version) {
  let out = text;
  const v = version || FALLBACK_VERSION;

  out = out.replace(/const\s+GAME_VERSION\s*=\s*['"][^'"]+['"];/, "const GAME_VERSION = '" + v + "';");
  out = out.replace(/<span\s+id=["']ver-num["'][^>]*>[^<]*<\/span>/g, '<span id="ver-num">' + v + '</span>');
  out = out.replace(/<span\s+id=["']ver-num-2["'][^>]*>[^<]*<\/span>/g, '<span id="ver-num-2">' + v + '</span>');
  out = out.replace(/Phiên bản\s*3(?:\.[0-9]+)+\s*·\s*Kiểm tra cập nhật/g, 'Phiên bản ' + v + ' · Kiểm tra cập nhật');
  out = out.replace(/Phiên bản\s*<span\s+id=["']ver-num-2["'][^>]*>[^<]*<\/span>\s*·\s*Kiểm tra cập nhật/g, 'Phiên bản <span id="ver-num-2">' + v + '</span> · Kiểm tra cập nhật');

  if (!out.includes('v311-runtime.js')) {
    out = out.replace('</body>', '<script src="v311-runtime.js?v=' + v + '"></script>\n</body>');
  } else {
    out = out.replace(/v311-runtime\.js\?v=[^"']+/g, 'v311-runtime.js?v=' + v);
  }

  if (!out.includes('v311-profile.js')) {
    out = out.replace('</body>', '<script src="v311-profile.js?v=' + v + '"></script>\n</body>');
  } else {
    out = out.replace(/v311-profile\.js\?v=[^"']+/g, 'v311-profile.js?v=' + v);
  }

  if (!out.includes('version-sync.js')) {
    out = out.replace('</body>', '<script src="version-sync.js?v=' + v + '"></script>\n</body>');
  } else {
    out = out.replace(/version-sync\.js\?v=[^"']+/g, 'version-sync.js?v=' + v);
  }

  return out;
}

function patchRuntimeText(text, version) {
  const v = version || FALLBACK_VERSION;
  let out = text;

  // Lỗi chính: v311-runtime.js tự ép dòng dưới Xuất quân về 3.11.5.
  out = out.replace(/const\s+GAME_VER\s*=\s*['"][^'"]+['"];/, "const GAME_VER = '" + v + "';");
  out = out.replace(/window\.GAME_VERSION\s*=\s*GAME_VER;/g, "window.GAME_VERSION = GAME_VER;");

  return out;
}

async function fetchPatchedIndex(req) {
  const info = await readVersionInfo({ force: true });
  const version = info.version || FALLBACK_VERSION;
  const res = await fetch(req || './index.html', { cache: 'no-store' });
  const text = await res.text();
  return new Response(patchIndexText(text, version), {
    status: res.status,
    statusText: res.statusText,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
    }
  });
}

async function fetchPatchedRuntime(req) {
  const info = await readVersionInfo({ force: true });
  const version = info.version || FALLBACK_VERSION;
  const res = await fetch(req, { cache: 'no-store' });
  const text = await res.text();
  return new Response(patchRuntimeText(text, version), {
    status: res.status,
    statusText: res.statusText,
    headers: {
      'Content-Type': 'application/javascript; charset=UTF-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
    }
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
    const info = await readVersionInfo({ force: true });
    const cache = await caches.open(cacheName(info.version));

    await Promise.all(CORE_STATIC.map(async (url) => {
      try {
        const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'v=' + encodeURIComponent(info.version), { cache: 'no-store' });
        if (res && (res.status === 200 || res.type === 'opaque')) await cache.put(url, res.clone());
      } catch (_) {}
    }));

    await putPatchedIndex(cache);
    await Promise.all(EXTRA.map(async (url) => {
      try {
        const res = await fetch(url, { mode: 'no-cors' });
        await cache.put(url, res);
      } catch (_) {}
    }));

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const info = await readVersionInfo({ force: true });
    const keep = cacheName(info.version);
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== keep).map((k) => caches.delete(k)));
    await self.clients.claim();

    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientsList) {
      client.postMessage({ type: 'KNTT_SW_READY', version: info.version || FALLBACK_VERSION });
    }
  })());
});

self.addEventListener('message', (e) => {
  const type = e && e.data && e.data.type;
  if (type === 'REFRESH_VERSION') resetVersionMemory();
  if (type === 'SKIP_WAITING') self.skipWaiting();
  if (type === 'CLEAR_KNTT_CACHE') {
    resetVersionMemory();
    e.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    })());
  }
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.pathname.endsWith('/version.json')) {
    e.respondWith((async () => {
      try {
        const res = await fetch(req, { cache: 'no-store' });
        if (res && res.ok) {
          res.clone().json().then((data) => {
            cachedVersionInfo = normalizeVersionInfo(data);
            cachedVersionAt = Date.now();
          }).catch(() => {});
        }
        return res;
      } catch (_) {
        const info = await readVersionInfo({ force: true });
        return new Response(JSON.stringify(info), { headers: { 'Content-Type': 'application/json' } });
      }
    })());
    return;
  }

  if (url.pathname.endsWith('/v311-runtime.js')) {
    e.respondWith((async () => {
      const info = await readVersionInfo({ force: true });
      const cache = await caches.open(cacheName(info.version));
      try {
        const patched = await fetchPatchedRuntime(req);
        await cache.put(req, patched.clone());
        return patched;
      } catch (_) {
        return (await cache.match(req, { ignoreSearch: true })) || Response.error();
      }
    })());
    return;
  }

  const isIndex = req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/meo-phap-su-game/');
  if (isIndex) {
    e.respondWith((async () => {
      const info = await readVersionInfo({ force: true });
      const cache = await caches.open(cacheName(info.version));
      try {
        const patched = await fetchPatchedIndex(req);
        await cache.put('./index.html', patched.clone());
        await cache.put('./', patched.clone());
        return patched;
      } catch (_) {
        return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }

  e.respondWith((async () => {
    const info = await readVersionInfo();
    const cache = await caches.open(cacheName(info.version));
    const cached = await cache.match(req, { ignoreSearch: false });
    if (cached) return cached;

    try {
      const res = await fetch(req);
      if (res && (res.status === 200 || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch (err) {
      const fallback = await cache.match(req, { ignoreSearch: true });
      if (fallback) return fallback;
      throw err;
    }
  })());
});
