/* Service Worker - Kỷ Nguyên Thủ Thành PWA */
const CACHE = 'kntt-v35-performance';
const SERVED_GAME_VERSION = '3.5.0';

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
/* campaign-ui-v35: menu 1 màn + title nhỏ + performance-ready */
#start {
  padding: 5px !important;
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
  overflow: hidden !important;
}
.s-hero {
  flex: 0 0 38px !important;
  padding: 1px 12px 2px !important;
}
.s-hero-title {
  font-size: 18px !important;
  line-height: 1.02 !important;
  letter-spacing: .14em !important;
  white-space: nowrap !important;
}
.s-hero-sub {
  font-size: 7.6px !important;
  line-height: 1.06 !important;
  margin-top: 0 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
.s-body {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) 270px !important;
  gap: 6px !important;
  padding: 6px !important;
  overflow: hidden !important;
}
.s-col-main {
  min-height: 0 !important;
  height: 100% !important;
  display: grid !important;
  grid-template-rows: 28px minmax(0, 1fr) 38px !important;
  gap: 5px !important;
  overflow: hidden !important;
}
.s-col-main > div:first-child {
  margin-bottom: 0 !important;
  height: 28px !important;
  min-height: 28px !important;
}
.s-sec-title {
  font-size: 13px !important;
  line-height: 1 !important;
  letter-spacing: .18em !important;
}
.s-col-main .chip {
  height: 26px !important;
  padding: 2px 9px !important;
  font-size: 11px !important;
}
#gem-d {
  font-size: 12px !important;
}
#maps {
  height: 100% !important;
  max-height: none !important;
  min-height: 0 !important;
  overflow-y: auto !important;
  gap: 4px !important;
  padding-right: 2px !important;
  display: flex !important;
  flex-direction: column !important;
}
#maps .m-card {
  min-height: 42px !important;
  padding: 5px 7px !important;
  border-radius: 10px !important;
}
#maps .m-card div[style*="font-size:17px"] {
  font-size: 13px !important;
  width: 20px !important;
}
#maps .m-card div[style*="font-size:12px"] {
  font-size: 10px !important;
  line-height: 1.08 !important;
}
#maps .m-card .sub {
  font-size: 7.5px !important;
  line-height: 1.08 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
#maps .m-card div[style*="font-size:10px"] {
  font-size: 8.5px !important;
}
.s-actions {
  height: 38px !important;
  min-height: 38px !important;
  margin-top: 0 !important;
  gap: 5px !important;
  display: grid !important;
  grid-template-columns: 1fr 1fr 38px !important;
  overflow: visible !important;
}
.s-actions .btn,
#b-shop,
#b-tal-2 {
  height: 38px !important;
  min-height: 38px !important;
  padding: 4px 6px !important;
  font-size: 10.5px !important;
  line-height: 1.08 !important;
  position: relative !important;
  z-index: 180 !important;
  pointer-events: auto !important;
}
#b-set {
  width: 38px !important;
  min-width: 38px !important;
  height: 38px !important;
  padding: 0 !important;
  font-size: 16px !important;
  z-index: 180 !important;
  pointer-events: auto !important;
}
.s-col-side {
  width: auto !important;
  min-width: 0 !important;
  height: 100% !important;
  min-height: 0 !important;
  padding: 8px !important;
  gap: 6px !important;
  justify-content: center !important;
  overflow: hidden !important;
}
#b-start {
  font-size: 17px !important;
  padding: 10px 8px !important;
  min-height: 56px !important;
}
#b-install {
  font-size: 9px !important;
  padding: 6px !important;
}
.s-col-side .muted {
  font-size: 8px !important;
  line-height: 1.15 !important;
}
#b-update-2 {
  font-size: 9px !important;
  line-height: 1.15 !important;
}
#tmod,
#hmod {
  position: absolute !important;
  inset: 0 !important;
  z-index: 240 !important;
  background: rgba(4,8,18,.92) !important;
  backdrop-filter: blur(5px) !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 8px !important;
}
#tmod:not(.hidden),
#hmod:not(.hidden) {
  display: flex !important;
}
#tmod .ov-card,
#hmod .ov-card {
  max-height: calc(100% - 10px) !important;
  max-width: 650px !important;
  padding: 10px !important;
}
#tmod h2,
#hmod h2 {
  font-size: 17px !important;
}
#t-cont,
#h-cont {
  min-height: 0 !important;
}
.t-row {
  padding: 7px 9px !important;
}
@media (max-height: 380px) {
  .s-hero { flex-basis: 32px !important; padding-top: 0 !important; }
  .s-hero-title { font-size: 16px !important; }
  .s-hero-sub { font-size: 7px !important; }
  .s-body { padding: 5px !important; gap: 5px !important; grid-template-columns: minmax(0, 1fr) 248px !important; }
  .s-col-main { grid-template-rows: 24px minmax(0, 1fr) 34px !important; gap: 4px !important; }
  .s-col-main > div:first-child { height: 24px !important; min-height: 24px !important; }
  #maps .m-card { min-height: 36px !important; padding: 4px 6px !important; }
  .s-actions, #b-shop, #b-tal-2, #b-set { height: 34px !important; min-height: 34px !important; }
  #b-start { min-height: 48px !important; font-size: 15px !important; padding: 7px !important; }
}
`;

const PERF_PATCH_SCRIPT = `
/* perf-v35: render cap + adaptive effect budget */
(function(){
  if (typeof Engine === 'undefined' || typeof State === 'undefined' || typeof Control === 'undefined') return;
  if (window.__KNTT_PERF_V35__) return;
  window.__KNTT_PERF_V35__ = true;

  const PERF = window.KNTT_PERF = {
    version: '3.5.0',
    fps: 60,
    low: false,
    particleHigh: 150,
    particleLow: 70,
    textHigh: 32,
    textLow: 16,
    coinHigh: 24,
    coinLow: 10,
    beamHigh: 22,
    beamLow: 10
  };

  function capArray(arr, max) {
    if (arr && arr.length > max) arr.splice(0, arr.length - max);
  }

  const _spawnParticles = Engine.spawnParticles && Engine.spawnParticles.bind(Engine);
  if (_spawnParticles) {
    Engine.spawnParticles = function(x, y, c, n, spd, sz) {
      const max = PERF.low ? PERF.particleLow : PERF.particleHigh;
      if (State.particles && State.particles.length >= max) return;
      const nn = PERF.low ? Math.min(3, Math.ceil(n * 0.22)) : Math.min(n, 10);
      return _spawnParticles(x, y, c, nn, PERF.low ? spd * 0.65 : spd, PERF.low ? Math.max(1, (sz || 3) * 0.8) : sz);
    };
  }

  const _spawnText = Engine.spawnText && Engine.spawnText.bind(Engine);
  if (_spawnText) {
    Engine.spawnText = function(x, y, t, c, cr) {
      const max = PERF.low ? PERF.textLow : PERF.textHigh;
      if (State.floatTexts && State.floatTexts.length >= max) return;
      return _spawnText(x, y, t, c, cr);
    };
  }

  const _spawnFlyingCoin = Engine.spawnFlyingCoin && Engine.spawnFlyingCoin.bind(Engine);
  if (_spawnFlyingCoin) {
    Engine.spawnFlyingCoin = function(x, y, v) {
      const max = PERF.low ? PERF.coinLow : PERF.coinHigh;
      if (State.flyingCoins && State.flyingCoins.length >= max) return;
      return _spawnFlyingCoin(x, y, v);
    };
  }

  const _draw = Engine.draw && Engine.draw.bind(Engine);
  if (_draw) {
    Engine.draw = function() {
      capArray(State.particles, PERF.low ? PERF.particleLow : PERF.particleHigh);
      capArray(State.floatTexts, PERF.low ? PERF.textLow : PERF.textHigh);
      capArray(State.flyingCoins, PERF.low ? PERF.coinLow : PERF.coinHigh);
      capArray(State.beams, PERF.low ? PERF.beamLow : PERF.beamHigh);
      return _draw();
    };
  }

  const _initMap = Engine.initMap && Engine.initMap.bind(Engine);
  if (_initMap) {
    Engine.initMap = function() {
      const r = _initMap();
      if (State.weather && State.weather.length > 18) State.weather.length = 18;
      return r;
    };
  }

  const _loop = Control.loop && Control.loop.bind(Control);
  if (_loop) {
    let last = 0, acc = 0, frames = 0;
    Control.loop = function(t) {
      if (last) {
        const dt = t - last;
        if (dt > 0) {
          acc += dt; frames++;
          if (acc >= 900) {
            PERF.fps = Math.round(frames * 1000 / acc);
            const crowd = (State.units ? State.units.length : 0) + (State.enemies ? State.enemies.length : 0) + (State.projs ? State.projs.length : 0);
            PERF.low = PERF.fps < 48 || crowd > 70;
            acc = 0; frames = 0;
          }
        }
      }
      last = t;
      return _loop(t);
    };
  }
})();
`;

function patchIndexText(text) {
  let out = text
    .replace("const GAME_VERSION = '3.0.0';", `const GAME_VERSION = '${SERVED_GAME_VERSION}';`)
    .replace(
      "const cont = document.getElementById('canv-cont'); const dpr = window.devicePixelRatio || 1;",
      "const cont = document.getElementById('canv-cont'); const dpr = Math.min(window.devicePixelRatio || 1, 1.35);"
    )
    .replace(
      "UI.showMessage(WAVE_THEMES[waveTheme(State.wave)].hint, waveTheme(State.wave) === 'boss'); Sound.play('wave'); this.buildWave();",
      "UI.showMessage(WAVE_THEMES[_th].hint, _th === 'boss'); Sound.play('wave'); this.buildWave();"
    );

  if (!out.includes('campaign-ui-v35')) out = out.replace('</style>', `${COMPACT_START_CSS}\n</style>`);
  if (!out.includes('perf-v35')) out = out.replace('// ============ BOOT ============', `${PERF_PATCH_SCRIPT}\n// ============ BOOT ============`);
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

  if (req.url.includes('version.json')) {
    e.respondWith(fetch(req).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  const url = new URL(req.url);
  const isIndex = req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/meo-phap-su-game/');

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
