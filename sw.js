/* Service Worker - Kỷ Nguyên Thủ Thành PWA
 * Version source of truth: version.json
 */
const VERSION_URL = './version.json';
const FALLBACK_VERSION = '3.11.6';
const CACHE_PREFIX = 'kntt-cache-';

const CORE_STATIC = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png',
  './v311-runtime.js',
  './v311-profile.js',
  './version-sync.js'
];

const EXTRA = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&family=Oswald:wght@500;700;900&display=swap'
];

let versionInfoPromise = null;

function safeVersion(v) {
  return String(v || FALLBACK_VERSION).replace(/[^a-zA-Z0-9_.-]/g, '-');
}

function cacheName(version) {
  return CACHE_PREFIX + safeVersion(version);
}

async function readVersionInfo() {
  if (!versionInfoPromise) {
    versionInfoPromise = (async () => {
      try {
        const res = await fetch(VERSION_URL + '?t=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) throw new Error('version.json HTTP ' + res.status);
        const data = await res.json();
        if (data && data.version) return data;
      } catch (_) {}
      return { version: FALLBACK_VERSION, build: '', notes: '' };
    })();
  }
  return versionInfoPromise;
}

function patchIndexText(text, version) {
  let out = text;
  const v = version || FALLBACK_VERSION;

  // Đồng bộ hằng version trong index từ version.json.
  out = out.replace(/const\s+GAME_VERSION\s*=\s*['"][^'"]+['"];/, "const GAME_VERSION = '" + v + "';");

  // Đồng bộ nhãn hiển thị phiên bản.
  out = out.replace(/Phiên bản\s*3\.[0-9.]+\s*·\s*Kiểm tra cập nhật/g, 'Phiên bản ' + v + ' · Kiểm tra cập nhật');

  // Hook các bản vá runtime/profile theo version hiện tại.
  if (!out.includes('v311-runtime.js')) {
    out = out.replace('</body>', '<script src="v311-runtime.js?v=' + v + '"></script>\n</body>');
  } else {
    out = out.replace(/v311-runtime\.js\?v=[0-9.]+/g, 'v311-runtime.js?v=' + v);
  }

  if (!out.includes('v311-profile.js')) {
    out = out.replace('</body>', '<script src="v311-profile.js?v=' + v + '"></script>\n</body>');
  } else {
    out = out.replace(/v311-profile\.js\?v=[0-9.]+/g, 'v311-profile.js?v=' + v);
  }

  // File này ghi đè handler cập nhật để clear cache + reload cache-bust.
  if (!out.includes('version-sync.js')) {
    out = out.replace('</body>', '<script src="version-sync.js?v=' + v + '"></script>\n</body>');
  } else {
    out = out.replace(/version-sync\.js\?v=[0-9.]+/g, 'version-sync.js?v=' + v);
  }

  return out;
}

async function fetchPatchedIndex(req) {
  const info = await readVersionInfo();
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

async function putPatchedIndex(cache) {
  try {
    const patched = await fetchPatchedIndex('./index.html');
    await cache.put('./index.html', patched.clone());
    await cache.put('./', patched.clone());
  } catch (_) {}
}

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const info = await readVersionInfo();
    const cache = await caches.open(cacheName(info.version));

    await Promise.all(CORE_STATIC.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
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
    const info = await readVersionInfo();
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
  if (type === 'SKIP_WAITING') self.skipWaiting();
  if (type === 'CLEAR_KNTT_CACHE') {
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
    e.respondWith(fetch(req, { cache: 'no-store' }).catch(async () => {
      const info = await readVersionInfo();
      return new Response(JSON.stringify(info), { headers: { 'Content-Type': 'application/json' } });
    }));
    return;
  }

  const isIndex = req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/meo-phap-su-game/');
  if (isIndex) {
    e.respondWith((async () => {
      const info = await readVersionInfo();
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
