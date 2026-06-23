/* Service Worker - Kỷ Nguyên Thủ Thành PWA
 * Version source of truth: version.json
 */
const VERSION_URL = './version.json';
const FALLBACK_VERSION = '3.12.5';
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
  './v312-polish.js',
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

function patchScript(out, fileName, version) {
  const v = version || FALLBACK_VERSION;
  const re = new RegExp(fileName.replace('.', '\\.') + '\\?v=[^"\\']+', 'g');
  if (!out.includes(fileName)) {
    return out.replace('</body>', '<script src="' + fileName + '?v=' + v + '"></script>\n</body>');
  }
  return out.replace(re, fileName + '?v=' + v);
}

function inlineUpgradeRefreshScript(version) {
  const v = version || FALLBACK_VERSION;
  return '<script id="kntt-inline-upgrade-refresh">\n' +
    '(function(){\n' +
    '  if(window.__KNTT_INLINE_UPGRADE_REFRESH__) return;\n' +
    '  window.__KNTT_INLINE_UPGRADE_REFRESH__=true;\n' +
    '  window.KNTT_ACTIVE_VERSION="' + v + '";\n' +
    '  function q(id){return document.getElementById(id);}\n' +
    '  function num(v,f){v=Number(v);return Number.isFinite(v)?v:f;}\n' +
    '  function modalOpen(){var m=q("umod");return !!m&&!m.classList.contains("hidden");}\n' +
    '  function refreshUpgradeButton(){\n' +
    '    try{\n' +
    '      var btn=q("b-up"); if(!btn||!modalOpen()) return;\n' +
    '      var u=(typeof State!=="undefined"&&State.ui&&State.ui.selUnit)?State.ui.selUnit:null; if(!u) return;\n' +
    '      var maxLv=3; try{ if(typeof maxUnitLevel==="function") maxLv=maxUnitLevel(u.typeId); }catch(_){}\n' +
    '      var cost=0; try{ if(typeof upgradeCost==="function") cost=upgradeCost(u); }catch(_){}\n' +
    '      var gold=num((typeof State!=="undefined"?State.gold:0),0);\n' +
    '      var lv=q("um-lv"); if(lv) lv.innerText=u.level;\n' +
    '      var c=q("um-c"); if(c) c.innerText="🪙 "+cost+(u.level===3?" · Hoá Thần":"");\n' +
    '      if(u.level>=maxLv){btn.style.display="none";return;}\n' +
    '      var can=gold>=cost; btn.style.display="flex"; btn.style.pointerEvents="auto";\n' +
    '      btn.className=can?"flex-1 rounded py-1 flex flex-col items-center border shadow-sm":"flex-1 rounded py-1 flex flex-col items-center cursor-not-allowed";\n' +
    '      btn.style.opacity=can?"1":"0.45";\n' +
    '      btn.style.filter=can?"brightness(1.22)":"brightness(0.72)";\n' +
    '      btn.style.background=can?"linear-gradient(#38bdf8,#1d4ed8)":"#334155";\n' +
    '      btn.style.borderColor=can?"#60a5fa":"#475569";\n' +
    '      btn.style.boxShadow=can?"0 0 16px rgba(56,189,248,.55), inset 0 1px 0 rgba(255,255,255,.18)":"none";\n' +
    '      btn.dataset.canUpgrade=can?"1":"0";\n' +
    '    }catch(e){}\n' +
    '  }\n' +
    '  function patchCore(){\n' +
    '    try{\n' +
    '      if(typeof UI!=="undefined"&&UI&&!UI.__knttInlineUpgradePatched){\n' +
    '        UI.__knttInlineUpgradePatched=true;\n' +
    '        if(UI.openUnitModal){var oldOpen=UI.openUnitModal.bind(UI);UI.openUnitModal=function(){var r=oldOpen.apply(UI,arguments);setTimeout(refreshUpgradeButton,0);setTimeout(refreshUpgradeButton,120);return r;};}\n' +
    '        if(UI.updateDisplay){var oldUpd=UI.updateDisplay.bind(UI);UI.updateDisplay=function(){var r=oldUpd.apply(UI,arguments);refreshUpgradeButton();return r;};}\n' +
    '      }\n' +
    '    }catch(e){}\n' +
    '  }\n' +
    '  setInterval(refreshUpgradeButton,120);\n' +
    '  setInterval(patchCore,500);\n' +
    '  patchCore(); setTimeout(patchCore,300); setTimeout(patchCore,1200);\n' +
    '  setTimeout(refreshUpgradeButton,100); setTimeout(refreshUpgradeButton,500); setTimeout(refreshUpgradeButton,1200);\n' +
    '})();\n' +
    '</script>';
}

function patchInlineUpgradeRefresh(out, version) {
  if (out.includes('kntt-inline-upgrade-refresh')) return out;
  return out.replace('</body>', inlineUpgradeRefreshScript(version) + '\n</body>');
}

function patchUpgradeModalCore(out) {
  if (!out.includes('refreshUnitModal() {')) {
    const refreshMethod = [
      '    refreshUnitModal() {',
      "        let u = State.ui.selUnit, modal = document.getElementById('umod');",
      "        if (!u || !modal || modal.classList.contains('hidden')) return;",
      "        document.getElementById('um-lv').innerText = u.level;",
      "        let sDesc = document.getElementById('um-desc');",
      "        if (sDesc) { sDesc.innerText = u.level >= 4 ? 'HOÁ THẦN: chỉ số tăng mạnh, kỹ năng tối thượng được cường hoá.' : (hasGodForm(u.typeId) ? `${u.db.lv3Desc} · Đủ kỹ năng: có thể Hoá Thần cấp 4.` : u.db.lv3Desc); if (u.level >= 2) sDesc.classList.remove('hidden'); else sDesc.classList.add('hidden'); }",
      "        let btnUp = document.getElementById('b-up');",
      "        let maxLv = maxUnitLevel(u.typeId);",
      "        if (u.level >= maxLv) { btnUp.style.display = 'none'; }",
      "        else { btnUp.removeAttribute('style'); btnUp.style.display = 'flex'; let cost = upgradeCost(u); document.getElementById('um-c').innerText = `🪙 ${cost}${u.level === 3 ? ' · Hoá Thần' : ''}`; btnUp.className = State.gold >= cost ? 'flex-1 bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 rounded py-1 flex flex-col items-center border border-blue-400 shadow-sm' : 'flex-1 bg-slate-700 rounded py-1 flex flex-col items-center opacity-50 cursor-not-allowed'; }",
      "        document.getElementById('um-s').innerText = `🪙 ${Math.floor(u.db.cost * Math.pow(1.5, u.level - 1) * 0.5)}`;",
      '    },'
    ].join('\n');
    out = out.replace('    openUnitModal(u, x, y) {', refreshMethod + '\n    openUnitModal(u, x, y) {');
  }

  out = out.replace(
    "        let badge = document.getElementById('tp-bdg'); if (State.tp > 0) { badge.classList.remove('hidden'); badge.innerText = State.tp; } else badge.classList.add('hidden');\n    },",
    "        let badge = document.getElementById('tp-bdg'); if (State.tp > 0) { badge.classList.remove('hidden'); badge.innerText = State.tp; } else badge.classList.add('hidden');\n        this.refreshUnitModal();\n    },"
  );

  out = out.replace(
    "        modal.classList.remove('hidden');\n    },",
    "        modal.classList.remove('hidden'); this.refreshUnitModal();\n    },"
  );

  return out;
}

function patchIndexText(text, version) {
  let out = text;
  const v = version || FALLBACK_VERSION;

  out = out.replace(/const\s+GAME_VERSION\s*=\s*['"][^'"]+['"];/, "const GAME_VERSION = '" + v + "';");
  out = out.replace(/<span\s+id=["']ver-num["'][^>]*>[^<]*<\/span>/g, '<span id="ver-num">' + v + '</span>');
  out = out.replace(/<span\s+id=["']ver-num-2["'][^>]*>[^<]*<\/span>/g, '<span id="ver-num-2">' + v + '</span>');
  out = out.replace(/Phiên bản\s*3(?:\.[0-9]+)+\s*·\s*Kiểm tra cập nhật/g, 'Phiên bản ' + v + ' · Kiểm tra cập nhật');
  out = out.replace(/Phiên bản\s*<span\s+id=["']ver-num-2["'][^>]*>[^<]*<\/span>\s*·\s*Kiểm tra cập nhật/g, 'Phiên bản <span id="ver-num-2">' + v + '</span> · Kiểm tra cập nhật');

  out = patchUpgradeModalCore(out);
  out = patchScript(out, 'v311-runtime.js', v);
  out = patchScript(out, 'v311-profile.js', v);
  out = patchScript(out, 'version-sync.js', v);
  out = patchScript(out, 'v312-polish.js', v);
  out = patchInlineUpgradeRefresh(out, v);

  return out;
}

function patchRuntimeText(text, version) {
  const v = version || FALLBACK_VERSION;
  let out = text;

  // Lỗi cũ: v311-runtime.js tự ép dòng dưới Xuất quân về phiên bản hardcode.
  out = out.replace(/const\s+GAME_VER\s*=\s*['"][^'"]+['"];/, "const GAME_VER = '" + v + "';");
  out = out.replace(/window\.GAME_VERSION\s*=\s*GAME_VER;/g, 'window.GAME_VERSION = GAME_VER;');

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
