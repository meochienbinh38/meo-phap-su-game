/* Service Worker - Kỷ Nguyên Thủ Thành PWA */
const CACHE = 'kntt-v3100-ui-foundation';
const SERVED_GAME_VERSION = '3.10.0';

const CORE = [
  './', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png', './icon-maskable.png'
];
const EXTRA = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&family=Oswald:wght@500;700;900&display=swap'
];

const ALL_PATCH_SCRIPT = `
/* kntt-v3100: UI foundation + profile/progression + speed/perf */
(function(){
  if (window.__KNTT_PATCH_V3100__) return;
  if (typeof Storage === 'undefined' || typeof State === 'undefined' || typeof Engine === 'undefined' || typeof UI === 'undefined' || typeof Control === 'undefined') return;
  window.__KNTT_PATCH_V3100__ = true;

  const AVATARS = ['🐱','🧙','🛡️','🏹','⚡','❄️','🌿','🌪️','👑','🐯','🦊','🐲'];
  let selectedAvatar = null;
  let lastSaveAt = 0;

  function q(id){ return document.getElementById(id); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>'"]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[c]; }); }
  function readStored(){ try { const raw = localStorage.getItem(Storage.key); return raw ? JSON.parse(raw) : null; } catch(_) { return null; } }
  function readStoredProfile(){ const d = readStored(); return d && d.profile ? d.profile : null; }
  function xpNeed(level){ level = Math.max(1, Math.floor(Number(level) || 1)); return Math.floor(120 + Math.pow(level, 1.62) * 82 + level * 18); }

  function defaultProgress(profile){
    return {
      talents: { d: 0, s: 0, h: 0, c: 0 }, unitSkills: {}, tp: 0, best: [0,0,0],
      sfx: (typeof Sound === 'undefined') ? true : Sound.sfxOn !== false,
      music: (typeof Sound === 'undefined') ? false : !!Sound.musicOn,
      gems: 0, stageProg: 0, unlocked: [],
      profile: profile || { name:'Tân Thủ', avatar:'🐱', level:1, xp:0, totalXp:0, createdAt:new Date().toISOString(), configured:true }
    };
  }

  function ensureProfile(){
    const old = (Storage.data && Storage.data.profile) || readStoredProfile() || {};
    const p = Object.assign({ name:'Tân Thủ', avatar:'🐱', level:1, xp:0, totalXp:0, createdAt:new Date().toISOString(), configured:false }, old);
    p.name = String(p.name || 'Tân Thủ').trim().slice(0,18) || 'Tân Thủ';
    p.avatar = AVATARS.includes(p.avatar) ? p.avatar : '🐱';
    p.level = Math.max(1, Math.floor(Number(p.level) || 1));
    p.xp = Math.max(0, Math.floor(Number(p.xp) || 0));
    p.totalXp = Math.max(0, Math.floor(Number(p.totalXp) || 0));
    while (p.xp >= xpNeed(p.level)) { p.xp -= xpNeed(p.level); p.level++; }
    Storage.data.profile = p;
    return p;
  }
  function syncStateFromProfile(){ const p = ensureProfile(); State.level = p.level; State.xp = p.xp; State.maxXp = xpNeed(p.level); }
  function syncStateProgressFromStorage(){
    State.talents = Object.assign({ d:0, s:0, h:0, c:0 }, Storage.data.talents || {});
    State.unitSkills = Object.assign({}, Storage.data.unitSkills || {});
    State.tp = Storage.data.tp || 0;
    if (typeof Sound !== 'undefined') { Sound.sfxOn = Storage.data.sfx !== false; Sound.musicOn = !!Storage.data.music; }
    syncStateFromProfile();
  }
  function directSync(){
    try {
      if (State.talents) Storage.data.talents = Object.assign({}, State.talents);
      if (State.unitSkills) Storage.data.unitSkills = Object.assign({}, State.unitSkills);
      if (typeof State.tp === 'number') Storage.data.tp = State.tp;
      if (typeof Sound !== 'undefined') { Storage.data.sfx = Sound.sfxOn; Storage.data.music = Sound.musicOn; }
      ensureProfile();
      localStorage.setItem(Storage.key, JSON.stringify(Storage.data));
    } catch(_) {}
  }
  function resetProgressWithProfile(profile){
    const p = Object.assign({ name:'Tân Thủ', avatar:'🐱' }, profile || {});
    const fresh = { name:String(p.name || 'Tân Thủ').trim().slice(0,18) || 'Tân Thủ', avatar:AVATARS.includes(p.avatar) ? p.avatar : '🐱', level:1, xp:0, totalXp:0, createdAt:new Date().toISOString(), configured:true };
    Storage.data = defaultProgress(fresh);
    syncStateProgressFromStorage();
    State.running = false; State.paused = false; State.gold = 0;
    State.units = []; State.enemies = []; State.projs = []; State.eProjs = []; State.particles = []; State.floatTexts = []; State.beams = []; State.flyingCoins = [];
    try { q('pmod').classList.remove('show'); q('g-stat').classList.add('hidden'); q('start').classList.remove('hidden'); q('b-start').innerText = 'XUẤT QUÂN'; } catch(_) {}
    directSync();
    try { UI.selStage = 0; UI.refreshStart(); UI.updateDisplay(); } catch(_) {}
    renderProfileCard();
  }

  const _load = Storage.load && Storage.load.bind(Storage);
  Storage.load = function(){ const d = _load ? _load() : Storage.data; const stored = readStoredProfile(); if (stored) Storage.data.profile = stored; ensureProfile(); return d; };
  Storage.sync = directSync;

  window.playerXpNeed = xpNeed;
  window.calcEnemyXp = function(e){
    try {
      const base = Math.max(1, (e && e.db && e.db.xp) || 1);
      const dbHp = Math.max(1, (e && e.db && e.db.hp) || 1);
      const hpMul = Math.max(1, ((e && e.maxHp) || dbHp) / dbHp);
      const stageDepth = 1 + Math.max(0, State.stageIdx || 0) * 0.035;
      const typeMul = (e && e.db && e.db.isBoss) ? 4.2 : ((e && e.db && e.db.isHeavy) ? 1.45 : 1);
      return Math.max(1, Math.round(base * stageDepth * typeMul * Math.pow(hpMul, 0.52)));
    } catch(_) { return 1; }
  };
  window.stageClearXp = function(st, first){ const idx = Math.max(1,(State.stageIdx||0)+1), waves = Math.max(1,(st&&st.waves)||6), mul = Math.max(1,(st&&st.mul)||1); return Math.round((first?70:25)+idx*(first?16:7)+waves*(first?6:2)+mul*(first?10:4)); };
  window.stageGemReward = function(st, first){ const reward = Math.max(0, (st && st.reward) || 0); return first ? reward : Math.max(3, Math.round(reward * 0.15)); };

  Engine.gainXp = function(amount){
    amount = Math.max(0, Math.round(Number(amount) || 0)); if (!amount) return 0;
    const p = ensureProfile(); p.xp += amount; p.totalXp += amount;
    let levelUps = 0, spGain = 0;
    while (p.xp >= xpNeed(p.level)) { p.xp -= xpNeed(p.level); p.level++; levelUps++; spGain += (p.level % 5 === 0) ? 2 : 1; }
    if (spGain > 0) State.tp += spGain;
    Storage.data.profile = p; syncStateFromProfile();
    if (levelUps > 0) { UI.showMessage('CẤP ' + p.level + '! +' + spGain + ' SP'); try { Sound.play('upgrade'); vibe([0,30,20,70]); } catch(_) {} }
    UI.updateDisplay();
    const now = performance.now(); if (levelUps > 0 || now - lastSaveAt > 1000) { lastSaveAt = now; directSync(); }
    return amount;
  };

  function installCss(){
    if (q('ui-v3100-css')) return;
    const st = document.createElement('style'); st.id = 'ui-v3100-css';
    st.textContent =
      '.ui-modal{position:absolute!important;inset:0!important;z-index:130!important;display:none!important;align-items:center!important;justify-content:center!important;padding:10px!important;background:rgba(4,8,18,.88)!important;backdrop-filter:blur(5px)!important}.ui-modal:not(.hidden),.ui-modal.show{display:flex!important}' +
      '.ui-shell{width:min(780px,92%);height:min(340px,84%);display:grid;grid-template-rows:44px 40px 1fr 24px;background:linear-gradient(180deg,#13203a,#0f1a30);border:1px solid var(--line-2);border-radius:18px;box-shadow:var(--sh-lg);overflow:hidden}' +
      '.ui-head{display:flex;align-items:center;gap:10px;padding:0 14px;border-bottom:1px solid var(--line);background:rgba(5,10,22,.38)}.ui-title{font-family:var(--f-disp);font-size:22px;font-weight:900;letter-spacing:.14em;color:var(--ink);text-transform:uppercase;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ui-spacer{flex:1}.ui-chip{display:inline-flex;align-items:center;gap:4px;height:26px;border-radius:999px;padding:0 9px;background:rgba(2,6,23,.62);border:1px solid var(--line-2);font-size:11px;font-weight:900;color:var(--gold);white-space:nowrap}.ui-x{width:32px;height:32px;border-radius:10px;border:1px solid var(--line);background:rgba(15,23,42,.78);color:var(--dim);font-size:19px;font-weight:900}' +
      '.ui-tabs{display:flex;gap:8px;align-items:center;padding:6px 14px;border-bottom:1px solid var(--line);background:rgba(2,6,23,.22)}.ui-tab{flex:1;height:28px;border-radius:10px;border:1px solid var(--line-2);background:#0a1120;color:var(--dim);font-family:var(--f-disp);font-weight:900;letter-spacing:.08em;font-size:11px}.ui-tab.on{background:linear-gradient(135deg,#6366f1,#4338ca);border-color:#818cf8;color:#fff;box-shadow:0 0 14px rgba(129,140,248,.32)}.ui-content{min-height:0;overflow-y:auto;padding:8px 14px;display:flex;flex-direction:column;gap:7px}.ui-foot{display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--mut);border-top:1px solid rgba(255,255,255,.06);background:rgba(2,6,23,.22)}' +
      '.ui-row{display:flex;align-items:center;gap:10px;min-height:58px;padding:8px 10px;border-radius:12px;background:rgba(2,6,23,.52);border:1px solid rgba(148,163,184,.16)}.ui-ico{width:34px;flex:0 0 34px;text-align:center;font-size:24px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.45))}.ui-main{min-width:0;flex:1}.ui-name{font-size:12px;font-weight:900;color:#fff;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ui-sub{font-size:9px;color:var(--dim);line-height:1.25;margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.ui-lv{font-size:9px;color:var(--indigo);font-weight:900;margin-left:4px}.ui-act{min-width:46px;height:34px;border-radius:10px;border:1px solid rgba(129,140,248,.55);background:linear-gradient(135deg,#6366f1,#4338ca);color:#fff;font-weight:900;font-family:var(--f-disp)}.ui-act.off{opacity:.45;filter:grayscale(1);pointer-events:none;background:#1e293b;border-color:#334155;color:#94a3b8}.ui-badge{font-size:10px;font-weight:900;border-radius:999px;padding:5px 9px;border:1px solid rgba(74,222,128,.35);color:#4ade80;background:rgba(22,101,52,.18);white-space:nowrap}' +
      '#hmod,#tmod{z-index:130!important}.s-col-side{justify-content:flex-start!important;gap:7px!important;overflow:hidden!important;padding:9px!important}.s-actions{gap:7px!important;margin-top:9px!important}.s-actions .btn{padding:8px 7px!important;font-size:12px!important}#maps{max-height:242px!important}.m-card{min-height:48px!important}.s-hero{padding:10px 14px!important}.s-body{padding:12px!important;gap:10px!important}.s-hero-title{font-size:clamp(22px,4.4vw,34px)!important}.s-hero-sub{font-size:10px!important}' +
      '#profile-card{background:linear-gradient(180deg,rgba(15,23,42,.95),rgba(2,6,23,.95));border:1px solid rgba(148,163,184,.25);border-radius:11px;padding:7px;box-shadow:0 5px 14px rgba(0,0,0,.3);flex:0 0 auto}#profile-card .p-row{display:flex;align-items:center;gap:7px}#profile-card .p-av{width:32px;height:32px;border-radius:10px;background:#111827;border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:21px}#profile-card .p-name{font-weight:900;color:#fff;font-size:11px;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#profile-card .p-sub{font-size:8px;color:#94a3b8;margin-top:1px}#profile-card .p-xp{height:5px;border-radius:999px;background:#111827;overflow:hidden;margin-top:5px;border:1px solid rgba(255,255,255,.08)}#profile-card .p-xp>div{height:100%;background:linear-gradient(90deg,#38bdf8,#a78bfa);width:0%}#profile-card .p-btn{margin-top:5px;width:100%;height:21px;border-radius:7px;border:1px solid rgba(56,189,248,.45);background:rgba(14,165,233,.14);color:#bae6fd;font-size:9px;font-weight:900}' +
      '#prof-modal{position:fixed;inset:0;z-index:140;background:rgba(2,6,23,.86);display:none;align-items:center;justify-content:center;padding:12px}#prof-modal.show{display:flex}#prof-box{width:min(420px,94vw);background:#0f172a;border:1px solid #334155;border-radius:16px;padding:16px;box-shadow:0 20px 60px rgba(0,0,0,.75)}#prof-name-input{width:100%;background:#020617;border:1px solid #334155;border-radius:10px;color:#fff;padding:10px;font-weight:800;outline:none}#prof-avatars{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:12px 0}#prof-avatars button{height:42px;border-radius:10px;background:#020617;border:1px solid #334155;font-size:24px}#prof-avatars button.sel{border-color:#38bdf8;box-shadow:0 0 14px rgba(56,189,248,.4);background:#0c4a6e}.prof-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.prof-actions button{border-radius:10px;padding:10px;font-weight:900}.prof-save{background:#2563eb;color:#fff;border:1px solid #60a5fa}.prof-close{background:#1e293b;color:#cbd5e1;border:1px solid #475569}.prof-reset{grid-column:1/3;background:#7f1d1d;color:#fecaca;border:1px solid #fca5a5}' +
      '#umod{width:230px!important;padding:8px!important}.ov-card{max-height:88%!important}';
    document.head.appendChild(st);
  }

  function makeShell(modalId, title, chipId, chipText, tabsHtml, footerText){
    const modal = q(modalId); if (!modal) return null;
    modal.classList.add('ui-modal');
    modal.innerHTML = '<div class="ui-shell"><div class="ui-head"><div class="ui-title">' + title + '</div><div class="ui-spacer"></div><div class="ui-chip" id="' + chipId + '">' + chipText + '</div><button class="ui-x" data-close="' + modalId + '">×</button></div><div class="ui-tabs">' + tabsHtml + '</div><div class="ui-content" id="' + modalId + '-content"></div><div class="ui-foot">' + footerText + '</div></div>';
    const x = modal.querySelector('[data-close]'); if (x) x.onclick = function(){ Sound.play('click'); modal.classList.add('hidden'); };
    return q(modalId + '-content');
  }
  function tabBtn(label, on){ return '<button class="ui-tab ' + (on ? 'on' : '') + '">' + label + '</button>'; }

  function openTalentsV3100(){
    installCss();
    if (!UI._talTab) UI._talTab = 'common';
    const content = makeShell('tmod', 'NỘI TẠI VĨNH VIỄN', 'ui-sp-chip', 'SP ' + State.tp, tabBtn('🌐 CHUNG', UI._talTab === 'common') + tabBtn('🐱 TỪNG TƯỚNG', UI._talTab === 'units'), 'Nội tại áp dụng vĩnh viễn cho mọi trận.');
    if (!content) return;
    const tabs = q('tmod').querySelectorAll('.ui-tab');
    tabs[0].onclick = function(){ UI._talTab = 'common'; Sound.play('click'); openTalentsV3100(); };
    tabs[1].onclick = function(){ UI._talTab = 'units'; Sound.play('click'); openTalentsV3100(); };
    if (UI._talTab === 'common') {
      Object.keys(TALENTS_DB).forEach(function(k){
        const t = TALENTS_DB[k], lv = State.talents[k] || 0, canUp = State.tp > 0 && lv < t.max;
        const row = document.createElement('div'); row.className = 'ui-row';
        row.innerHTML = '<div class="ui-ico">' + t.icon + '</div><div class="ui-main"><div class="ui-name">' + esc(t.name) + '<span class="ui-lv">Lv.' + lv + '/' + t.max + '</span></div><div class="ui-sub">' + esc(t.desc) + '</div></div><button class="ui-act ' + (canUp ? '' : 'off') + '">' + (lv >= t.max ? 'MAX' : '+') + '</button>';
        if (canUp) row.querySelector('button').onclick = function(){ State.tp--; State.talents[k]++; if (k === 'h') State.hp += 100; Sound.play('upgrade'); Storage.sync(); UI.updateDisplay(); UI.refreshStart(); openTalentsV3100(); };
        content.appendChild(row);
      });
    } else {
      Object.keys(UNIT_SKILLS).forEach(function(k){
        const u = UNITS_DB[k], tiers = UNIT_SKILLS[k], lv = State.unitSkills[k] || 0, next = tiers[lv], owned = isUnlocked(k), canUp = owned && next && State.tp >= next.cost;
        const row = document.createElement('div'); row.className = 'ui-row'; if (!owned) row.style.opacity = '.55';
        const info = !owned ? 'Chưa mở tướng. Mở trong Cửa hàng trước.' : (next ? ('Bậc ' + (lv+1) + ': ' + next.n + ' — ' + next.d + (lv === 2 ? ' · Mở Hoá Thần cấp 4' : '')) : 'Đã mở toàn bộ kỹ năng · Có thể Hoá Thần cấp 4 trong trận');
        const btn = !owned ? '🔒' : (!next ? 'MAX' : (next.cost + ' SP'));
        row.innerHTML = '<div class="ui-ico">' + u.icon + '</div><div class="ui-main"><div class="ui-name" style="color:' + u.color + '">' + esc(u.name) + '<span class="ui-lv">Lv.' + lv + '/' + tiers.length + '</span></div><div class="ui-sub">' + esc(info) + '</div></div><button class="ui-act ' + (canUp ? '' : 'off') + '">' + btn + '</button>';
        if (canUp) row.querySelector('button').onclick = function(){ State.tp -= next.cost; State.unitSkills[k] = lv + 1; Sound.play('upgrade'); Storage.sync(); UI.updateDisplay(); UI.refreshStart(); openTalentsV3100(); };
        content.appendChild(row);
      });
    }
    q('tmod').classList.remove('hidden');
  }

  function openShopV3100(){
    installCss();
    if (!UI._shopTab) UI._shopTab = 'all';
    const content = makeShell('hmod', 'CỬA HÀNG TƯỚNG', 'ui-gem-chip', '💎 ' + Storage.data.gems, tabBtn('TẤT CẢ', UI._shopTab === 'all') + tabBtn('ĐÃ MỞ', UI._shopTab === 'owned') + tabBtn('CHƯA MỞ', UI._shopTab === 'locked'), 'Tướng đã mở sẽ dùng được trong mọi trận.');
    if (!content) return;
    const tabs = q('hmod').querySelectorAll('.ui-tab');
    tabs[0].onclick = function(){ UI._shopTab = 'all'; Sound.play('click'); openShopV3100(); };
    tabs[1].onclick = function(){ UI._shopTab = 'owned'; Sound.play('click'); openShopV3100(); };
    tabs[2].onclick = function(){ UI._shopTab = 'locked'; Sound.play('click'); openShopV3100(); };
    Object.keys(UNITS_DB).forEach(function(k){
      const u = UNITS_DB[k], cost = HERO_COST[k], owned = isUnlocked(k), free = HERO_COST[k] === 0;
      if (UI._shopTab === 'owned' && !owned) return;
      if (UI._shopTab === 'locked' && owned) return;
      const canBuy = !owned && Storage.data.gems >= cost;
      const row = document.createElement('div'); row.className = 'ui-row';
      const right = owned ? '<span class="ui-badge">' + (free ? 'Mặc định' : 'Đã mở') + '</span>' : '<button class="ui-act ' + (canBuy ? '' : 'off') + '">' + cost + '💎</button>';
      row.innerHTML = '<div class="ui-ico">' + u.icon + '</div><div class="ui-main"><div class="ui-name" style="color:' + u.color + '">' + esc(u.name) + '</div><div class="ui-sub">' + esc(u.lv3Desc || 'Tướng chiến đấu') + '</div></div>' + right;
      if (!owned && canBuy) row.querySelector('button').onclick = function(){ Storage.data.gems -= cost; Storage.data.unlocked = Storage.data.unlocked || []; if (!Storage.data.unlocked.includes(k)) Storage.data.unlocked.push(k); Storage.sync(); Sound.play('upgrade'); vibe(20); UI.refreshStart(); openShopV3100(); };
      content.appendChild(row);
    });
    q('hmod').classList.remove('hidden');
  }

  function refreshUpgradeButton(){
    try {
      const u = State.ui && State.ui.selUnit, modal = q('umod'), btnUp = q('b-up');
      if (!u || !modal || modal.classList.contains('hidden') || !btnUp) return;
      const maxLv = maxUnitLevel(u.typeId); if (u.level >= maxLv) { btnUp.style.display = 'none'; return; }
      const cost = upgradeCost(u), canUp = State.gold >= cost;
      btnUp.style.display = 'flex'; const costEl = q('um-c'); if (costEl) costEl.innerText = '🪙 ' + cost + (u.level === 3 ? ' · Hoá Thần' : '');
      btnUp.className = canUp ? 'flex-1 bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 rounded py-1 flex flex-col items-center border border-blue-400 shadow-sm' : 'flex-1 bg-slate-700 rounded py-1 flex flex-col items-center opacity-50 cursor-not-allowed';
    } catch(_) {}
  }

  function ensureProfileUi(){
    installCss();
    let card = q('profile-card'); const side = document.querySelector('.s-col-side'), startBtn = q('b-start');
    if (!card && side && startBtn) {
      card = document.createElement('div'); card.id = 'profile-card';
      card.innerHTML = '<div class="p-row"><div class="p-av" id="prof-av">🐱</div><div style="min-width:0;flex:1"><div class="p-name" id="prof-name">Tân Thủ</div><div class="p-sub"><span id="prof-lv">Lv.1</span> · <span id="prof-xptxt">0/0 EXP</span></div></div></div><div class="p-xp"><div id="prof-xpbar"></div></div><button class="p-btn" id="b-profile">👤 Hồ sơ</button>';
      side.insertBefore(card, startBtn); card.querySelector('#b-profile').onclick = openProfileModal; card.querySelector('#prof-av').onclick = openProfileModal;
    }
    let modal = q('prof-modal');
    if (!modal) {
      modal = document.createElement('div'); modal.id = 'prof-modal';
      modal.innerHTML = '<div id="prof-box"><h2 class="title title--grad" style="font-size:24px;text-align:center;margin-bottom:8px">Hồ sơ nhân vật</h2><p class="muted" style="text-align:center;font-size:11px;margin-bottom:12px">Tạo hồ sơ mới sẽ reset tiến trình để chơi lại từ đầu.</p><input id="prof-name-input" maxlength="18" placeholder="Tên nhân vật"><div id="prof-avatars"></div><div class="prof-actions"><button class="prof-close" id="prof-cancel">Đóng</button><button class="prof-save" id="prof-save">Lưu</button><button class="prof-reset" id="prof-reset">Tạo hồ sơ mới / Chơi lại từ đầu</button></div></div>';
      document.body.appendChild(modal); modal.querySelector('#prof-cancel').onclick = function(){ modal.classList.remove('show'); }; modal.querySelector('#prof-save').onclick = saveProfileModal; modal.querySelector('#prof-reset').onclick = resetFromProfileModal;
      const grid = modal.querySelector('#prof-avatars'); AVATARS.forEach(function(a){ const b = document.createElement('button'); b.textContent = a; b.onclick = function(){ selectedAvatar = a; renderAvatarChoices(); }; grid.appendChild(b); });
    }
  }
  function renderAvatarChoices(){ const grid = q('prof-avatars'); if (!grid) return; Array.from(grid.children).forEach(function(b){ b.classList.toggle('sel', b.textContent === selectedAvatar); }); }
  function readModalProfile(){ const cur = ensureProfile(), input = q('prof-name-input'); return { name:String((input && input.value) || cur.name || 'Tân Thủ').trim().slice(0,18) || 'Tân Thủ', avatar:AVATARS.includes(selectedAvatar) ? selectedAvatar : cur.avatar }; }
  function openProfileModal(){ ensureProfileUi(); const p = ensureProfile(); selectedAvatar = p.avatar; const input = q('prof-name-input'); if (input) input.value = p.name; renderAvatarChoices(); q('prof-modal').classList.add('show'); }
  function saveProfileModal(){ const p = ensureProfile(), next = readModalProfile(); p.name = next.name; p.avatar = next.avatar; p.configured = true; Storage.data.profile = p; directSync(); renderProfileCard(); q('prof-modal').classList.remove('show'); try { UI.showMessage('ĐÃ LƯU HỒ SƠ'); Sound.play('upgrade'); } catch(_) {} }
  function resetFromProfileModal(){ const next = readModalProfile(); resetProgressWithProfile(next); q('prof-modal').classList.remove('show'); try { UI.showMessage('ĐÃ TẠO HỒ SƠ MỚI'); Sound.play('upgrade'); } catch(_) {} }
  function renderProfileCard(){ ensureProfileUi(); const p = ensureProfile(), need = xpNeed(p.level), pct = Math.max(0, Math.min(100, (p.xp / need) * 100)); if(q('prof-av')) q('prof-av').textContent = p.avatar; if(q('prof-name')) q('prof-name').textContent = p.name; if(q('prof-lv')) q('prof-lv').textContent = 'Lv.' + p.level; if(q('prof-xptxt')) q('prof-xptxt').textContent = p.xp + '/' + need + ' EXP'; if(q('prof-xpbar')) q('prof-xpbar').style.width = pct + '%'; }

  const _refreshStart = UI.refreshStart && UI.refreshStart.bind(UI);
  UI.refreshStart = function(){ syncStateFromProfile(); const r = _refreshStart ? _refreshStart() : undefined; renderProfileCard(); return r; };
  const _updateDisplay = UI.updateDisplay && UI.updateDisplay.bind(UI);
  UI.updateDisplay = function(){ syncStateFromProfile(); const r = _updateDisplay ? _updateDisplay() : undefined; refreshUpgradeButton(); renderProfileCard(); return r; };
  UI.openTalents = openTalentsV3100;
  UI.openShop = openShopV3100;

  const _draw = Engine.draw && Engine.draw.bind(Engine);
  Engine.draw = function(){
    try { if (State.particles && State.particles.length > 120) State.particles.splice(0, State.particles.length - 120); if (State.floatTexts && State.floatTexts.length > 28) State.floatTexts.splice(0, State.floatTexts.length - 28); if (State.flyingCoins && State.flyingCoins.length > 18) State.flyingCoins.splice(0, State.flyingCoins.length - 18); if (State.beams && State.beams.length > 18) State.beams.splice(0, State.beams.length - 18); } catch(_) {}
    return _draw ? _draw() : undefined;
  };
  const _initMap = Engine.initMap && Engine.initMap.bind(Engine);
  if (_initMap) Engine.initMap = function(){ const r = _initMap(); if (State.weather && State.weather.length > 18) State.weather.length = 18; return r; };

  Control.toggleSpeed = function(){ State.speed = State.speed === 0.9 ? 1.5 : 0.9; Sound.play('click'); const b = q('b-speed'); if (b) { b.innerText = State.speed + 'x'; b.classList.toggle('on', State.speed === 1.5); } };
  const _stageWin = Control.stageWin && Control.stageWin.bind(Control);
  Control.stageWin = function(){
    try {
      State.running = false;
      const first = State.stageIdx >= Storage.data.stageProg;
      const reward = stageGemReward(State.stage, first);
      const xp = stageClearXp(State.stage, first);
      Storage.data.gems += reward;
      if (State.stageIdx + 1 > Storage.data.stageProg) Storage.data.stageProg = State.stageIdx + 1;
      Engine.gainXp(xp); directSync(); UI.refreshStart(); Sound.play('cleared'); vibe([0,60,40,120]);
      q('start').classList.remove('hidden'); q('g-stat').classList.remove('hidden');
      q('g-stat').querySelector('.title').innerText = first ? '🎉 Qua màn lần đầu!' : 'Qua màn · Cày lại';
      q('g-wav').innerHTML = esc(State.stage.n) + '<div style="font-size:13px;color:var(--gold);margin-top:5px">+' + reward + ' 💎 · +' + xp + ' EXP</div>';
      q('b-start').innerText = 'CHƠI TIẾP'; q('pmod').classList.remove('show'); UI.selStage = Math.min(Storage.data.stageProg, STAGES.length - 1);
    } catch(e) { if (_stageWin) return _stageWin(); }
  };
  const _gameOver = Control.gameOver && Control.gameOver.bind(Control);
  Control.gameOver = function(){
    try {
      State.running = false; directSync(); UI.refreshStart(); Sound.play('lose'); vibe([0,100,50,100,50,200]);
      q('start').classList.remove('hidden'); q('g-stat').classList.remove('hidden'); q('g-stat').querySelector('.title').innerText = 'Thất bại tại';
      q('g-wav').innerHTML = esc(State.stage.n) + '<div style="font-size:12px;color:var(--dim);margin-top:4px">Đợt ' + State.wave + '/' + State.stage.waves + ' · EXP đã cày được vẫn giữ</div>';
      q('b-start').innerText = 'CHƠI LẠI MÀN'; q('pmod').classList.remove('show');
    } catch(e) { if (_gameOver) return _gameOver(); }
  };

  window.KNTTProfile = { ensure:ensureProfile, open:openProfileModal, render:renderProfileCard, xpNeed:xpNeed, reset:resetProgressWithProfile };
  setTimeout(function(){ installCss(); ensureProfile(); syncStateFromProfile(); renderProfileCard(); }, 0);
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
  if (!out.includes('__KNTT_PATCH_V3100__')) out = out.replace('// ============ BOOT ============', `${ALL_PATCH_SCRIPT}\n// ============ BOOT ============`);
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
