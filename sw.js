/* Service Worker - Kỷ Nguyên Thủ Thành PWA */
const CACHE = 'kntt-v392-profile-ui-reset';
const SERVED_GAME_VERSION = '3.9.2';

const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable.png'];
const EXTRA = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&family=Oswald:wght@500;700;900&display=swap'
];

const ALL_PATCH_SCRIPT = `
/* kntt-v392: fix modal layering + account reset + profile/progression */
(function(){
  if (window.__KNTT_PATCH_V392__) return;
  if (typeof Storage === 'undefined' || typeof State === 'undefined' || typeof Engine === 'undefined' || typeof UI === 'undefined' || typeof Control === 'undefined') return;
  window.__KNTT_PATCH_V392__ = true;

  const AVATARS = ['🐱','🧙','🛡️','🏹','⚡','❄️','🌿','🌪️','👑','🐯','🦊','🐲'];
  let selectedAvatar = null;
  let lastSaveAt = 0;

  function readStoredProfile() {
    try {
      const raw = localStorage.getItem(Storage.key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && parsed.profile ? parsed.profile : null;
    } catch (_) { return null; }
  }

  function xpNeed(level) {
    level = Math.max(1, Math.floor(Number(level) || 1));
    return Math.floor(120 + Math.pow(level, 1.62) * 82 + level * 18);
  }

  function defaultProgress(profile) {
    return {
      talents: { d: 0, s: 0, h: 0, c: 0 },
      unitSkills: {},
      tp: 0,
      best: [0, 0, 0],
      sfx: (typeof Sound === 'undefined') ? true : Sound.sfxOn !== false,
      music: (typeof Sound === 'undefined') ? false : !!Sound.musicOn,
      gems: 0,
      stageProg: 0,
      unlocked: [],
      profile: profile || { name: 'Tân Thủ', avatar: '🐱', level: 1, xp: 0, totalXp: 0, createdAt: new Date().toISOString(), configured: true }
    };
  }

  function ensureProfile() {
    const old = (Storage.data && Storage.data.profile) || readStoredProfile() || {};
    const p = Object.assign({ name: 'Tân Thủ', avatar: '🐱', level: 1, xp: 0, totalXp: 0, createdAt: new Date().toISOString(), configured: false }, old);
    p.name = String(p.name || 'Tân Thủ').trim().slice(0, 18) || 'Tân Thủ';
    p.avatar = AVATARS.includes(p.avatar) ? p.avatar : '🐱';
    p.level = Math.max(1, Math.floor(Number(p.level) || 1));
    p.xp = Math.max(0, Math.floor(Number(p.xp) || 0));
    p.totalXp = Math.max(0, Math.floor(Number(p.totalXp) || 0));
    while (p.xp >= xpNeed(p.level)) { p.xp -= xpNeed(p.level); p.level++; }
    Storage.data.profile = p;
    return p;
  }

  function syncStateFromProfile() {
    const p = ensureProfile();
    State.level = p.level;
    State.xp = p.xp;
    State.maxXp = xpNeed(p.level);
  }

  function syncStateProgressFromStorage() {
    State.talents = Object.assign({ d: 0, s: 0, h: 0, c: 0 }, Storage.data.talents || {});
    State.unitSkills = Object.assign({}, Storage.data.unitSkills || {});
    State.tp = Storage.data.tp || 0;
    if (typeof Sound !== 'undefined') {
      Sound.sfxOn = Storage.data.sfx !== false;
      Sound.musicOn = !!Storage.data.music;
    }
    syncStateFromProfile();
  }

  function directSync() {
    try {
      if (State.talents) Storage.data.talents = Object.assign({}, State.talents);
      if (State.unitSkills) Storage.data.unitSkills = Object.assign({}, State.unitSkills);
      if (typeof State.tp === 'number') Storage.data.tp = State.tp;
      if (typeof Sound !== 'undefined') { Storage.data.sfx = Sound.sfxOn; Storage.data.music = Sound.musicOn; }
      ensureProfile();
      localStorage.setItem(Storage.key, JSON.stringify(Storage.data));
    } catch (_) {}
  }

  function resetProgressWithProfile(profile) {
    const p = Object.assign({ name: 'Tân Thủ', avatar: '🐱' }, profile || {});
    const freshProfile = {
      name: String(p.name || 'Tân Thủ').trim().slice(0, 18) || 'Tân Thủ',
      avatar: AVATARS.includes(p.avatar) ? p.avatar : '🐱',
      level: 1,
      xp: 0,
      totalXp: 0,
      createdAt: new Date().toISOString(),
      configured: true
    };
    Storage.data = defaultProgress(freshProfile);
    syncStateProgressFromStorage();
    State.running = false;
    State.paused = false;
    State.gold = 0;
    State.units = [];
    State.enemies = [];
    State.projs = [];
    State.eProjs = [];
    State.particles = [];
    State.floatTexts = [];
    State.beams = [];
    State.flyingCoins = [];
    try {
      document.getElementById('pmod').classList.remove('show');
      document.getElementById('g-stat').classList.add('hidden');
      document.getElementById('start').classList.remove('hidden');
      document.getElementById('b-start').innerText = 'XUẤT QUÂN';
    } catch (_) {}
    directSync();
    try { UI.refreshStart(); UI.updateDisplay(); } catch (_) {}
    renderProfileCard();
  }

  const _load = Storage.load && Storage.load.bind(Storage);
  Storage.load = function() {
    const d = _load ? _load() : Storage.data;
    const stored = readStoredProfile();
    if (stored) Storage.data.profile = stored;
    ensureProfile();
    return d;
  };
  Storage.sync = directSync;

  window.playerXpNeed = xpNeed;
  window.calcEnemyXp = function(e) {
    try {
      const base = Math.max(1, (e && e.db && e.db.xp) || 1);
      const dbHp = Math.max(1, (e && e.db && e.db.hp) || 1);
      const hpMul = Math.max(1, ((e && e.maxHp) || dbHp) / dbHp);
      const stageDepth = 1 + Math.max(0, State.stageIdx || 0) * 0.035;
      const typeMul = (e && e.db && e.db.isBoss) ? 4.2 : ((e && e.db && e.db.isHeavy) ? 1.45 : 1);
      return Math.max(1, Math.round(base * stageDepth * typeMul * Math.pow(hpMul, 0.52)));
    } catch (_) { return 1; }
  };
  window.stageClearXp = function(st, first) {
    const idx = Math.max(1, (State.stageIdx || 0) + 1);
    const waves = Math.max(1, (st && st.waves) || 6);
    const mul = Math.max(1, (st && st.mul) || 1);
    return Math.round((first ? 70 : 25) + idx * (first ? 16 : 7) + waves * (first ? 6 : 2) + mul * (first ? 10 : 4));
  };
  window.stageGemReward = function(st, first) {
    const reward = Math.max(0, (st && st.reward) || 0);
    return first ? reward : Math.max(3, Math.round(reward * 0.15));
  };

  Engine.gainXp = function(amount) {
    amount = Math.max(0, Math.round(Number(amount) || 0));
    if (!amount) return 0;
    const p = ensureProfile();
    p.xp += amount;
    p.totalXp += amount;
    let levelUps = 0;
    let spGain = 0;
    while (p.xp >= xpNeed(p.level)) {
      p.xp -= xpNeed(p.level);
      p.level++;
      levelUps++;
      spGain += (p.level % 5 === 0) ? 2 : 1;
    }
    if (spGain > 0) State.tp += spGain;
    Storage.data.profile = p;
    syncStateFromProfile();
    if (levelUps > 0) {
      UI.showMessage('CẤP ' + p.level + '! +' + spGain + ' SP');
      try { Sound.play('upgrade'); vibe([0, 30, 20, 70]); } catch (_) {}
    }
    UI.updateDisplay();
    const now = performance.now();
    if (levelUps > 0 || now - lastSaveAt > 1000) { lastSaveAt = now; directSync(); }
    return amount;
  };

  function refreshUpgradeButton() {
    try {
      const u = State.ui && State.ui.selUnit;
      const modal = document.getElementById('umod');
      const btnUp = document.getElementById('b-up');
      if (!u || !modal || modal.classList.contains('hidden') || !btnUp) return;
      const maxLv = maxUnitLevel(u.typeId);
      if (u.level >= maxLv) { btnUp.style.display = 'none'; return; }
      const cost = upgradeCost(u);
      const canUp = State.gold >= cost;
      btnUp.style.display = 'flex';
      const costEl = document.getElementById('um-c');
      if (costEl) costEl.innerText = '🪙 ' + cost + (u.level === 3 ? ' · Hoá Thần' : '');
      btnUp.className = canUp
        ? 'flex-1 bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 rounded py-1 flex flex-col items-center border border-blue-400 shadow-sm'
        : 'flex-1 bg-slate-700 rounded py-1 flex flex-col items-center opacity-50 cursor-not-allowed';
    } catch (_) {}
  }

  function injectProfileCss() {
    if (document.getElementById('profile-v392-css')) return;
    const st = document.createElement('style');
    st.id = 'profile-v392-css';
    st.textContent =
      '#hmod,#tmod{position:absolute!important;inset:0!important;z-index:130!important;background:rgba(4,8,18,.92)!important;backdrop-filter:blur(5px)!important;align-items:center!important;justify-content:center!important;padding:10px!important}' +
      '#hmod:not(.hidden),#tmod:not(.hidden){display:flex!important}' +
      '#hmod .ov-card,#tmod .ov-card{max-height:88%!important;overflow:hidden!important}' +
      '#hmod #h-cont,#tmod #t-cont{min-height:0!important;overflow-y:auto!important}' +
      '.s-col-side{justify-content:flex-start!important;gap:6px!important;overflow:hidden!important;padding:8px!important}' +
      '#profile-card{background:linear-gradient(180deg,rgba(15,23,42,.95),rgba(2,6,23,.95));border:1px solid rgba(148,163,184,.25);border-radius:10px;padding:6px;margin-bottom:4px;box-shadow:0 5px 14px rgba(0,0,0,.3);flex:0 0 auto}' +
      '#profile-card .p-row{display:flex;align-items:center;gap:6px}#profile-card .p-av{width:30px;height:30px;border-radius:9px;background:#111827;border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:20px}' +
      '#profile-card .p-name{font-weight:900;color:#fff;font-size:11px;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#profile-card .p-sub{font-size:8px;color:#94a3b8;margin-top:1px}' +
      '#profile-card .p-xp{height:5px;border-radius:999px;background:#111827;overflow:hidden;margin-top:5px;border:1px solid rgba(255,255,255,.08)}#profile-card .p-xp>div{height:100%;background:linear-gradient(90deg,#38bdf8,#a78bfa);width:0%}' +
      '#profile-card .p-btn{margin-top:5px;width:100%;height:20px;border-radius:7px;border:1px solid rgba(56,189,248,.45);background:rgba(14,165,233,.14);color:#bae6fd;font-size:9px;font-weight:900}' +
      '#prof-modal{position:fixed;inset:0;z-index:140;background:rgba(2,6,23,.86);display:none;align-items:center;justify-content:center;padding:12px}#prof-modal.show{display:flex}' +
      '#prof-box{width:min(420px,94vw);background:#0f172a;border:1px solid #334155;border-radius:16px;padding:16px;box-shadow:0 20px 60px rgba(0,0,0,.75)}#prof-name-input{width:100%;background:#020617;border:1px solid #334155;border-radius:10px;color:#fff;padding:10px;font-weight:800;outline:none}' +
      '#prof-avatars{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:12px 0}#prof-avatars button{height:42px;border-radius:10px;background:#020617;border:1px solid #334155;font-size:24px}#prof-avatars button.sel{border-color:#38bdf8;box-shadow:0 0 14px rgba(56,189,248,.4);background:#0c4a6e}' +
      '.prof-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.prof-actions button{border-radius:10px;padding:10px;font-weight:900}.prof-save{background:#2563eb;color:#fff;border:1px solid #60a5fa}.prof-close{background:#1e293b;color:#cbd5e1;border:1px solid #475569}.prof-reset{grid-column:1/3;background:#7f1d1d;color:#fecaca;border:1px solid #fca5a5}';
    document.head.appendChild(st);
  }

  function ensureProfileUi() {
    injectProfileCss();
    let card = document.getElementById('profile-card');
    const side = document.querySelector('.s-col-side');
    const startBtn = document.getElementById('b-start');
    if (!card && side && startBtn) {
      card = document.createElement('div');
      card.id = 'profile-card';
      card.innerHTML = '<div class="p-row"><div class="p-av" id="prof-av">🐱</div><div style="min-width:0;flex:1"><div class="p-name" id="prof-name">Tân Thủ</div><div class="p-sub"><span id="prof-lv">Lv.1</span> · <span id="prof-xptxt">0/0 EXP</span></div></div></div><div class="p-xp"><div id="prof-xpbar"></div></div><button class="p-btn" id="b-profile">👤 Hồ sơ</button>';
      side.insertBefore(card, startBtn);
      card.querySelector('#b-profile').onclick = openProfileModal;
      card.querySelector('#prof-av').onclick = openProfileModal;
    }
    let modal = document.getElementById('prof-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'prof-modal';
      modal.innerHTML = '<div id="prof-box"><h2 class="title title--grad" style="font-size:24px;text-align:center;margin-bottom:8px">Hồ sơ nhân vật</h2><p class="muted" style="text-align:center;font-size:11px;margin-bottom:12px">Tạo hồ sơ mới sẽ reset tiến trình để chơi lại từ đầu.</p><input id="prof-name-input" maxlength="18" placeholder="Tên nhân vật"><div id="prof-avatars"></div><div class="prof-actions"><button class="prof-close" id="prof-cancel">Đóng</button><button class="prof-save" id="prof-save">Lưu</button><button class="prof-reset" id="prof-reset">Tạo hồ sơ mới / Chơi lại từ đầu</button></div></div>';
      document.body.appendChild(modal);
      modal.querySelector('#prof-cancel').onclick = function(){ modal.classList.remove('show'); };
      modal.querySelector('#prof-save').onclick = saveProfileModal;
      modal.querySelector('#prof-reset').onclick = resetFromProfileModal;
      const grid = modal.querySelector('#prof-avatars');
      AVATARS.forEach(function(a){ const b = document.createElement('button'); b.textContent = a; b.onclick = function(){ selectedAvatar = a; renderAvatarChoices(); }; grid.appendChild(b); });
    }
  }

  function renderAvatarChoices() {
    const grid = document.getElementById('prof-avatars');
    if (!grid) return;
    Array.from(grid.children).forEach(function(b){ b.classList.toggle('sel', b.textContent === selectedAvatar); });
  }

  function readModalProfile() {
    const cur = ensureProfile();
    const input = document.getElementById('prof-name-input');
    return {
      name: String((input && input.value) || cur.name || 'Tân Thủ').trim().slice(0, 18) || 'Tân Thủ',
      avatar: AVATARS.includes(selectedAvatar) ? selectedAvatar : cur.avatar
    };
  }

  function openProfileModal() {
    ensureProfileUi();
    const p = ensureProfile();
    selectedAvatar = p.avatar;
    const input = document.getElementById('prof-name-input');
    if (input) input.value = p.name;
    renderAvatarChoices();
    const modal = document.getElementById('prof-modal');
    if (modal) modal.classList.add('show');
  }

  function saveProfileModal() {
    const p = ensureProfile();
    const next = readModalProfile();
    p.name = next.name;
    p.avatar = next.avatar;
    p.configured = true;
    Storage.data.profile = p;
    directSync();
    renderProfileCard();
    const modal = document.getElementById('prof-modal');
    if (modal) modal.classList.remove('show');
    try { UI.showMessage('ĐÃ LƯU HỒ SƠ'); Sound.play('upgrade'); } catch (_) {}
  }

  function resetFromProfileModal() {
    const next = readModalProfile();
    resetProgressWithProfile(next);
    const modal = document.getElementById('prof-modal');
    if (modal) modal.classList.remove('show');
    try { UI.showMessage('ĐÃ TẠO HỒ SƠ MỚI'); Sound.play('upgrade'); } catch (_) {}
  }

  function renderProfileCard() {
    ensureProfileUi();
    const p = ensureProfile();
    const need = xpNeed(p.level);
    const pct = Math.max(0, Math.min(100, (p.xp / need) * 100));
    const av = document.getElementById('prof-av'); if (av) av.textContent = p.avatar;
    const name = document.getElementById('prof-name'); if (name) name.textContent = p.name;
    const lv = document.getElementById('prof-lv'); if (lv) lv.textContent = 'Lv.' + p.level;
    const xpTxt = document.getElementById('prof-xptxt'); if (xpTxt) xpTxt.textContent = p.xp + '/' + need + ' EXP';
    const bar = document.getElementById('prof-xpbar'); if (bar) bar.style.width = pct + '%';
  }

  const _updateDisplay = UI.updateDisplay && UI.updateDisplay.bind(UI);
  UI.updateDisplay = function() { syncStateFromProfile(); const r = _updateDisplay ? _updateDisplay() : undefined; refreshUpgradeButton(); renderProfileCard(); return r; };
  const _refreshStart = UI.refreshStart && UI.refreshStart.bind(UI);
  UI.refreshStart = function() { syncStateFromProfile(); const r = _refreshStart ? _refreshStart() : undefined; renderProfileCard(); return r; };
  const _openUnitModal = UI.openUnitModal && UI.openUnitModal.bind(UI);
  if (_openUnitModal) UI.openUnitModal = function() { const r = _openUnitModal.apply(UI, arguments); refreshUpgradeButton(); return r; };
  const _draw = Engine.draw && Engine.draw.bind(Engine);
  if (_draw) Engine.draw = function() { refreshUpgradeButton(); return _draw(); };

  window.KNTTProfile = { ensure: ensureProfile, open: openProfileModal, render: renderProfileCard, xpNeed: xpNeed, reset: resetProgressWithProfile };
  setTimeout(function(){ ensureProfile(); syncStateFromProfile(); renderProfileCard(); }, 0);
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
      "State.level = 1; State.xp = 0; State.maxXp = CFG.xpBase;",
      "State.level = Math.max(1, (Storage.data.profile && Storage.data.profile.level) || 1); State.xp = Math.max(0, (Storage.data.profile && Storage.data.profile.xp) || 0); State.maxXp = playerXpNeed(State.level);"
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
      "let reward = State.stage.reward * (first ? 1 : 0.3);",
      "let reward = stageGemReward(State.stage, first);"
    )
    .replace(
      "Storage.data.gems += reward;",
      "Storage.data.gems += reward; Engine.gainXp(stageClearXp(State.stage, first));"
    )
    .replace(
      "this.gainXp(e.db.xp);",
      "this.gainXp(calcEnemyXp(e));"
    )
    .replace(
      "UI.showMessage(WAVE_THEMES[waveTheme(State.wave)].hint, waveTheme(State.wave) === 'boss'); Sound.play('wave'); this.buildWave();",
      "UI.showMessage(WAVE_THEMES[_th].hint, _th === 'boss'); Sound.play('wave'); this.buildWave();"
    );

  if (!out.includes('__KNTT_PATCH_V392__')) out = out.replace('// ============ BOOT ============', `${ALL_PATCH_SCRIPT}\n// ============ BOOT ============`);
  return out;
}

async function patchIndexResponse(res) {
  if (!res || !res.ok) return res;
  const text = await res.text();
  return new Response(patchIndexText(text), {
    status: res.status,
    statusText: res.statusText,
    headers: { 'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'no-store' }
  });
}

async function cachePatchedIndex(cache) {
  try {
    const res = await fetch('./index.html', { cache: 'no-store' });
    const patched = await patchIndexResponse(res);
    await cache.put('./index.html', patched.clone());
    await cache.put('./', patched.clone());
  } catch (_) {}
}

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    await cachePatchedIndex(cache);
    await Promise.all(EXTRA.map(async (url) => {
      try { const res = await fetch(url, { mode: 'no-cors' }); await cache.put(url, res); } catch (_) {}
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
