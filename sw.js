/* Service Worker - Kỷ Nguyên Thủ Thành PWA */
const CACHE = 'kntt-v382-upgrade-button';
const SERVED_GAME_VERSION = '3.8.2';

const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png'
];

const EXTRA = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&family=Oswald:wght@500;700;900&display=swap'
];

const PERF_PATCH_SCRIPT = `
/* perf-v382: adaptive effect budget + FPS telemetry */
(function(){
  if (typeof Engine === 'undefined' || typeof State === 'undefined' || typeof Control === 'undefined') return;
  if (window.__KNTT_PERF_V382__) return;
  window.__KNTT_PERF_V382__ = true;

  const PERF = window.KNTT_PERF = {
    version: '3.8.2',
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
      const nn = PERF.low ? Math.min(3, Math.ceil((n || 1) * 0.22)) : Math.min(n || 1, 10);
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

const UPGRADE_BUTTON_PATCH_SCRIPT = `
/* upgrade-button-v382: nút nâng cấp tự sáng khi đủ tiền */
(function(){
  if (typeof UI === 'undefined' || typeof State === 'undefined' || typeof Engine === 'undefined') return;
  if (window.__KNTT_UPGRADE_BUTTON_V382__) return;
  window.__KNTT_UPGRADE_BUTTON_V382__ = true;

  let lastKey = '';

  function refreshUpgradeButton() {
    try {
      const u = State.ui && State.ui.selUnit;
      const modal = document.getElementById('umod');
      const btnUp = document.getElementById('b-up');
      if (!u || !modal || modal.classList.contains('hidden') || !btnUp) { lastKey = ''; return; }

      const maxLv = maxUnitLevel(u.typeId);
      if (u.level >= maxLv) {
        if (btnUp.style.display !== 'none') btnUp.style.display = 'none';
        lastKey = 'max';
        return;
      }

      const cost = upgradeCost(u);
      const canUp = State.gold >= cost;
      const key = [u.typeId, u.level, Math.floor(State.gold), cost, canUp ? 1 : 0].join('|');
      if (key === lastKey) return;
      lastKey = key;

      btnUp.style.display = 'flex';
      const costEl = document.getElementById('um-c');
      if (costEl) costEl.innerText = '🪙 ' + cost + (u.level === 3 ? ' · Hoá Thần' : '');
      btnUp.className = canUp
        ? 'flex-1 bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 rounded py-1 flex flex-col items-center border border-blue-400 shadow-sm'
        : 'flex-1 bg-slate-700 rounded py-1 flex flex-col items-center opacity-50 cursor-not-allowed';
    } catch (_) {}
  }

  const _updateDisplay = UI.updateDisplay && UI.updateDisplay.bind(UI);
  if (_updateDisplay) {
    UI.updateDisplay = function() {
      const result = _updateDisplay();
      refreshUpgradeButton();
      return result;
    };
  }

  const _openUnitModal = UI.openUnitModal && UI.openUnitModal.bind(UI);
  if (_openUnitModal) {
    UI.openUnitModal = function() {
      const result = _openUnitModal.apply(UI, arguments);
      lastKey = '';
      refreshUpgradeButton();
      return result;
    };
  }

  const _draw = Engine.draw && Engine.draw.bind(Engine);
  if (_draw) {
    Engine.draw = function() {
      refreshUpgradeButton();
      return _draw();
    };
  }
})();
`;

function patchIndexText(text) {
  let out = text
    .replace(/const GAME_VERSION = '[^']+';/, `const GAME_VERSION = '${SERVED_GAME_VERSION}';`)
    .replace(
      "const cont = document.getElementById('canv-cont'); const dpr = window.devicePixelRatio || 1;",
      "const cont = document.getElementById('canv-cont'); const dpr = Math.min(window.devicePixelRatio || 1, 1.35);"
    )
    .replace(
      "State.running = true; State.paused = false; State.speed = 1; document.getElementById('b-speed').innerText = '1x'; document.getElementById('b-speed').classList.remove('on');",
      "State.running = true; State.paused = false; State.speed = 0.9; document.getElementById('b-speed').innerText = '0.9x'; document.getElementById('b-speed').classList.remove('on');"
    )
    .replace(
      "State.speed = State.speed === 1 ? 2 : 1; Sound.play('click');",
      "State.speed = State.speed === 0.9 ? 1.5 : 0.9; Sound.play('click');"
    )
    .replace(
      "let b = document.getElementById('b-speed'); b.innerText = State.speed + 'x'; b.classList.toggle('on', State.speed === 2);",
      "let b = document.getElementById('b-speed'); b.innerText = State.speed + 'x'; b.classList.toggle('on', State.speed === 1.5);"
    )
    .replace(
      "if (State.running && !State.paused) { for (let i = 0; i < State.speed; i++) Engine.update(raw); }",
      "if (State.running && !State.paused) { Engine.update(raw * (State.speed || 1)); }"
    )
    .replace(
      "UI.showMessage(WAVE_THEMES[waveTheme(State.wave)].hint, waveTheme(State.wave) === 'boss'); Sound.play('wave'); this.buildWave();",
      "UI.showMessage(WAVE_THEMES[_th].hint, _th === 'boss'); Sound.play('wave'); this.buildWave();"
    );

  if (!out.includes('perf-v382')) out = out.replace('// ============ BOOT ============', `${PERF_PATCH_SCRIPT}\n// ============ BOOT ============`);
  if (!out.includes('upgrade-button-v382')) out = out.replace('// ============ BOOT ============', `${UPGRADE_BUTTON_PATCH_SCRIPT}\n// ============ BOOT ============`);
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
  } catch (_) { /* cache.addAll fallback is enough */ }
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
      } catch (_) {}
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
