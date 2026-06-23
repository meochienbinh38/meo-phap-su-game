/* Service Worker - Kỷ Nguyên Thủ Thành PWA
 * v3.12.8: modal stack fix + network-first + direct modal refresh hotfix.
 */
const SW_BUILD = '3.12.8';
const VERSION_URL = './version.json';
const CACHE_PREFIX = 'kntt-cache-';

const CORE_STATIC = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png',
  './v311-runtime.js',
  './v311-profile.js',
  './version-sync.js',
  './v312-polish.js',
  './version.json'
];

const EXTRA = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&family=Oswald:wght@500;700;900&display=swap'
];

function cacheName(version) {
  return CACHE_PREFIX + String(version || SW_BUILD).replace(/[^a-zA-Z0-9_.-]/g, '-');
}

async function readVersionInfo() {
  try {
    const res = await fetch(VERSION_URL + '?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('version.json HTTP ' + res.status);
    const data = await res.json();
    return {
      version: String((data && data.version) || SW_BUILD),
      build: (data && data.build) || '',
      notes: (data && data.notes) || ''
    };
  } catch (_) {
    return { version: SW_BUILD, build: '', notes: '' };
  }
}

function escReg(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function patchScriptTag(out, fileName) {
  const src = fileName + '?v=' + encodeURIComponent(SW_BUILD);
  const re = new RegExp(escReg(fileName) + '(?:\\?v=[^"\']*)?', 'g');
  if (out.includes(fileName)) return out.replace(re, src);
  return out.replace('</body>', '<script src="' + src + '"></script>\n</body>');
}

function modalStackFixCss() {
  return '<style id="kntt-modal-stack-fix-v3128">\n' +
    '#tmod,#hmod{position:absolute!important;inset:0!important;z-index:220!important;background:rgba(4,8,18,.92)!important;backdrop-filter:blur(5px)!important;align-items:center!important;justify-content:center!important;padding:10px!important;}\n' +
    '#tmod.hidden,#hmod.hidden{display:none!important;}\n' +
    '#tmod:not(.hidden),#hmod:not(.hidden){display:flex!important;}\n' +
    '#tmod .ov-card,#hmod .ov-card{width:min(520px,94vw)!important;max-width:min(520px,94vw)!important;max-height:88vh!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;}\n' +
    '#t-cont,#h-cont{min-height:0!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;}\n' +
    '</style>';
}

function directModalRefreshScript() {
  return '<script id="kntt-direct-modal-refresh-v3128">\n' +
    '(function(){\n' +
    '  if(window.__KNTT_DIRECT_MODAL_REFRESH_V3128__) return;\n' +
    '  window.__KNTT_DIRECT_MODAL_REFRESH_V3128__ = true;\n' +
    '  function q(id){ return document.getElementById(id); }\n' +
    '  function modalOpen(){ var m=q("umod"); return !!m && !m.classList.contains("hidden"); }\n' +
    '  function selectedUnit(){ try { return (typeof State!=="undefined" && State.ui) ? State.ui.selUnit : null; } catch(e){ return null; } }\n' +
    '  function goldNow(){ try { var g = Number(State.gold); return Number.isFinite(g) ? g : 0; } catch(e){ return 0; } }\n' +
    '  function maxLevel(u){ try { if(typeof maxUnitLevel==="function") return maxUnitLevel(u.typeId); } catch(e){} return 3; }\n' +
    '  function upCost(u){ try { if(typeof upgradeCost==="function") { var c=Number(upgradeCost(u)); if(Number.isFinite(c)) return c; } } catch(e){} return Infinity; }\n' +
    '  function setText(id, value){ var el=q(id); if(el) el.innerText=value; }\n' +
    '  function refreshUnitModal(){\n' +
    '    try {\n' +
    '      if(!modalOpen()) return;\n' +
    '      var u = selectedUnit(); if(!u) return;\n' +
    '      var btn = q("b-up"); if(!btn) return;\n' +
    '      setText("um-lv", u.level);\n' +
    '      var desc = q("um-desc");\n' +
    '      if(desc && u.db){\n' +
    '        var canGod = false; try { canGod = typeof hasGodForm==="function" && hasGodForm(u.typeId); } catch(e){}\n' +
    '        desc.innerText = u.level >= 4 ? "HOÁ THẦN: chỉ số tăng mạnh, kỹ năng tối thượng được cường hoá." : (canGod ? (u.db.lv3Desc + " · Đủ kỹ năng: có thể Hoá Thần cấp 4.") : u.db.lv3Desc);\n' +
    '        if(u.level >= 2) desc.classList.remove("hidden"); else desc.classList.add("hidden");\n' +
    '      }\n' +
    '      var maxLv = maxLevel(u);\n' +
    '      if(u.level >= maxLv){ btn.style.display="none"; return; }\n' +
    '      var cost = upCost(u);\n' +
    '      var gold = goldNow();\n' +
    '      setText("um-c", "🪙 " + cost + (u.level === 3 ? " · Hoá Thần" : ""));\n' +
    '      var sell = q("um-s");\n' +
    '      if(sell && u.db){ var invested = Number(u.knttInvestedGold); var val = Number.isFinite(invested) ? Math.floor(invested * 0.5) : Math.floor(u.db.cost * Math.pow(1.5, u.level - 1) * 0.5); sell.innerText = "🪙 " + val; }\n' +
    '      var can = gold >= cost;\n' +
    '      btn.removeAttribute("style");\n' +
    '      btn.style.display = "flex";\n' +
    '      btn.style.pointerEvents = "auto";\n' +
    '      btn.style.opacity = can ? "1" : "0.45";\n' +
    '      btn.style.filter = can ? "brightness(1.25)" : "brightness(0.72)";\n' +
    '      btn.style.background = can ? "linear-gradient(#38bdf8,#1d4ed8)" : "#334155";\n' +
    '      btn.style.borderColor = can ? "#60a5fa" : "#475569";\n' +
    '      btn.style.boxShadow = can ? "0 0 18px rgba(56,189,248,.6), inset 0 1px 0 rgba(255,255,255,.18)" : "none";\n' +
    '      btn.className = can ? "flex-1 rounded py-1 flex flex-col items-center border shadow-sm" : "flex-1 rounded py-1 flex flex-col items-center cursor-not-allowed";\n' +
    '      btn.dataset.canUpgrade = can ? "1" : "0";\n' +
    '    } catch(e){}\n' +
    '  }\n' +
    '  function patchUI(){\n' +
    '    try {\n' +
    '      if(typeof UI === "undefined" || !UI || UI.__knttDirectModalRefresh3128) return;\n' +
    '      UI.__knttDirectModalRefresh3128 = true;\n' +
    '      if(UI.updateDisplay){ var oldUpdate = UI.updateDisplay.bind(UI); UI.updateDisplay = function(){ var r = oldUpdate.apply(UI, arguments); refreshUnitModal(); return r; }; }\n' +
    '      if(UI.openUnitModal){ var oldOpen = UI.openUnitModal.bind(UI); UI.openUnitModal = function(){ var r = oldOpen.apply(UI, arguments); setTimeout(refreshUnitModal, 0); setTimeout(refreshUnitModal, 80); setTimeout(refreshUnitModal, 180); return r; }; }\n' +
    '    } catch(e){}\n' +
    '  }\n' +
    '  window.KNTT_refreshUnitModal = refreshUnitModal;\n' +
    '  setInterval(function(){ patchUI(); refreshUnitModal(); }, 100);\n' +
    '  document.addEventListener("visibilitychange", function(){ if(!document.hidden){ patchUI(); refreshUnitModal(); } });\n' +
    '  patchUI(); setTimeout(patchUI, 300); setTimeout(patchUI, 1200); setTimeout(refreshUnitModal, 300); setTimeout(refreshUnitModal, 1200);\n' +
    '})();\n' +
    '</script>';
}

function patchIndexText(text) {
  let out = text;
  out = out.replace(/const\s+GAME_VERSION\s*=\s*['"][^'"]+['"];/, "const GAME_VERSION = '" + SW_BUILD + "';");
  out = out.replace(/<span\s+id=["']ver-num["'][^>]*>[^<]*<\/span>/g, '<span id="ver-num">' + SW_BUILD + '</span>');
  out = out.replace(/<span\s+id=["']ver-num-2["'][^>]*>[^<]*<\/span>/g, '<span id="ver-num-2">' + SW_BUILD + '</span>');
  out = out.replace(/Phiên bản\s*3(?:\.[0-9]+)+\s*·\s*Kiểm tra cập nhật/g, 'Phiên bản ' + SW_BUILD + ' · Kiểm tra cập nhật');

  out = patchScriptTag(out, 'v311-runtime.js');
  out = patchScriptTag(out, 'v311-profile.js');
  out = patchScriptTag(out, 'version-sync.js');
  out = patchScriptTag(out, 'v312-polish.js');

  if (!out.includes('kntt-modal-stack-fix-v3128')) {
    out = out.replace('</head>', modalStackFixCss() + '\n</head>');
  }
  if (!out.includes('kntt-direct-modal-refresh-v3128')) {
    out = out.replace('</body>', directModalRefreshScript() + '\n</body>');
  }
  return out;
}

function patchRuntimeText(text) {
  return text.replace(/const\s+GAME_VER\s*=\s*['"][^'"]+['"];/, "const GAME_VER = '" + SW_BUILD + "';");
}

function patchProfileText(text) {
  return text.replace(/const\s+GAME_VER\s*=\s*['"][^'"]+['"];/, "const GAME_VER = '" + SW_BUILD + "';");
}

async function fetchTextNoStore(req) {
  const res = await fetch(req, { cache: 'no-store' });
  const text = await res.text();
  return { res, text };
}

async function patchedIndexResponse(req) {
  const got = await fetchTextNoStore(req || './index.html');
  return new Response(patchIndexText(got.text), {
    status: got.res.status,
    statusText: got.res.statusText,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
    }
  });
}

async function patchedJsResponse(req, patcher) {
  const got = await fetchTextNoStore(req);
  return new Response(patcher(got.text), {
    status: got.res.status,
    statusText: got.res.statusText,
    headers: {
      'Content-Type': 'application/javascript; charset=UTF-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
    }
  });
}

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName(SW_BUILD));
    await Promise.all(CORE_STATIC.map(async (url) => {
      try {
        const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'v=' + encodeURIComponent(SW_BUILD), { cache: 'no-store' });
        if (res && (res.status === 200 || res.type === 'opaque')) await cache.put(url, res.clone());
      } catch (_) {}
    }));
    try {
      const patched = await patchedIndexResponse('./index.html');
      await cache.put('./index.html', patched.clone());
      await cache.put('./', patched.clone());
    } catch (_) {}
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
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== cacheName(SW_BUILD)).map((k) => caches.delete(k)));
    await self.clients.claim();
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientsList) client.postMessage({ type: 'KNTT_SW_READY', version: SW_BUILD });
  })());
});

self.addEventListener('message', (e) => {
  const type = e && e.data && e.data.type;
  if (type === 'SKIP_WAITING') self.skipWaiting();
  if (type === 'CLEAR_KNTT_CACHE' || type === 'REFRESH_VERSION') {
    e.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX)).map((k) => caches.delete(k)));
    })());
  }
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const cacheKey = cacheName(SW_BUILD);

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
      const cache = await caches.open(cacheKey);
      try {
        const patched = await patchedIndexResponse(req);
        await cache.put('./index.html', patched.clone());
        await cache.put('./', patched.clone());
        return patched;
      } catch (_) {
        return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }

  if (url.pathname.endsWith('/v311-runtime.js')) {
    e.respondWith((async () => {
      const cache = await caches.open(cacheKey);
      try { const patched = await patchedJsResponse(req, patchRuntimeText); await cache.put(req, patched.clone()); return patched; }
      catch (_) { return (await cache.match(req, { ignoreSearch: true })) || Response.error(); }
    })());
    return;
  }

  if (url.pathname.endsWith('/v311-profile.js')) {
    e.respondWith((async () => {
      const cache = await caches.open(cacheKey);
      try { const patched = await patchedJsResponse(req, patchProfileText); await cache.put(req, patched.clone()); return patched; }
      catch (_) { return (await cache.match(req, { ignoreSearch: true })) || Response.error(); }
    })());
    return;
  }

  e.respondWith((async () => {
    const cache = await caches.open(cacheKey);
    try {
      const res = await fetch(req, { cache: 'no-store' });
      if (res && (res.status === 200 || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch (_) {
      return (await cache.match(req, { ignoreSearch: true })) || Response.error();
    }
  })());
});
