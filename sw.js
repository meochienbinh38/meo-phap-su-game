/* Service Worker - Kỷ Nguyên Thủ Thành PWA */
const CACHE = 'kntt-v3116-profile-system';
const SERVED_GAME_VERSION = '3.11.6';

const CORE = [
  './',
  './index.html',
  './v311-runtime.js',
  './v311-profile.js',
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
  out = out.replace(/const\s+GAME_VERSION\s*=\s*['"][^'"]+['"];/, "const GAME_VERSION = '3.11.6';");
  out = out.replace(/Phiên bản\s*3\.[0-9.]+\s*·\s*Kiểm tra cập nhật/g, 'Phiên bản 3.11.6 · Kiểm tra cập nhật');

  out = out
    .replace("let isCrit = Math.random() < (0.1 + TALENTS_DB.c.effect(State.talents.c));", "let isCrit = Math.random() < (window.KNTT_critChance ? window.KNTT_critChance(this) : (0.1 + TALENTS_DB.c.effect(State.talents.c)));")
    .replace("let fd = isCrit ? s.dmg * 2 : s.dmg;", "let fd = isCrit ? s.dmg * (window.KNTT_critDmg ? window.KNTT_critDmg(this) : 2) : s.dmg;")
    .replace("t.takeDmg(fd, 'phys', false);", "t.takeDmg(fd, 'phys', false); if(window.KNTT_onUnitHit) window.KNTT_onUnitHit(this,t,fd,'melee');")
    .replace("t.takeDmg(fd, 'magic', false); Engine.spawnText(t.x, t.y - 20, Math.floor(fd), c, isCrit);", "t.takeDmg(fd, 'magic', false); if(window.KNTT_onUnitHit) window.KNTT_onUnitHit(this,t,fd,'magic'); Engine.spawnText(t.x, t.y - 20, Math.floor(fd), c, isCrit);")
    .replace("nT.takeDmg(fd * cdmg, 'magic', false); Engine.spawnText(nT.x, nT.y - 20, Math.floor(fd * cdmg), c, false);", "nT.takeDmg(fd * cdmg, 'magic', false); if(window.KNTT_onUnitHit) window.KNTT_onUnitHit(this,nT,fd*cdmg,'chain'); Engine.spawnText(nT.x, nT.y - 20, Math.floor(fd * cdmg), c, false);")
    .replace("e.takeDmg(s.dmg, this.db.dtype || 'pois', false); Engine.spawnText(e.x, e.y - 20, Math.floor(s.dmg), this.db.color, false); hitAny = true;", "e.takeDmg(s.dmg, this.db.dtype || 'pois', false); if(window.KNTT_onUnitHit) window.KNTT_onUnitHit(this,e,s.dmg,'pulse'); Engine.spawnText(e.x, e.y - 20, Math.floor(s.dmg), this.db.color, false); hitAny = true;")
    .replace("e.takeDmg(this.d, this.db.dtype || 'frost', false);                 // nổ AoE: không bị né", "e.takeDmg(this.d, this.db.dtype || 'frost', false); if(window.KNTT_onTypeHit) window.KNTT_onTypeHit(this.typeId,e,this.d,'lob');                 // nổ AoE: không bị né")
    .replace("State.enemies.forEach(en => { if (getDist(this.x, this.y, en.x, en.y) < rd) en.takeDmg(this.d, this.db.dtype || 'phys', false); });   // nổ chùm: không bị né", "State.enemies.forEach(en => { if (getDist(this.x, this.y, en.x, en.y) < rd) { en.takeDmg(this.d, this.db.dtype || 'phys', false); if(window.KNTT_onTypeHit) window.KNTT_onTypeHit(this.typeId,en,this.d,'expl'); } });   // nổ chùm: không bị né")
    .replace("e.takeDmg(this.d, this.db.dtype || 'phys', true);   // đạn thường -> có thể bị NÉ", "e.takeDmg(this.d, this.db.dtype || 'phys', true); if(window.KNTT_onTypeHit) window.KNTT_onTypeHit(this.typeId,e,this.d,'proj');   // đạn thường -> có thể bị NÉ")
    .replace("let rd = State.grid.size * 1.5 * (1 + unitSkillBonus('gunner').splash) * (this.lv >= 4 ? 1.2 : 1);", "let rd = State.grid.size * 1.5 * (1 + unitSkillBonus('gunner').splash) * (this.lv >= 4 ? 1.2 : 1) * (window.KNTT_splashMul ? window.KNTT_splashMul(this) : 1);");

  if (!out.includes('v311-runtime.js')) out = out.replace('</body>', '<script src="v311-runtime.js?v=3.11.6"></script>\n</body>');
  else out = out.replace(/v311-runtime\.js\?v=3\.11\.\d+/g, 'v311-runtime.js?v=3.11.6');

  if (!out.includes('v311-profile.js')) out = out.replace('</body>', '<script src="v311-profile.js?v=3.11.6"></script>\n</body>');
  else out = out.replace(/v311-profile\.js\?v=3\.11\.\d+/g, 'v311-profile.js?v=3.11.6');
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
