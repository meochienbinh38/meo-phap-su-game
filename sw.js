/* Service Worker - Kỷ Nguyên Thủ Thành PWA */
const CACHE = 'kntt-v311-elements-step2';
const SERVED_GAME_VERSION = '3.11.1';

const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable.png'];
const EXTRA = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&family=Oswald:wght@500;700;900&display=swap'
];

const V311_ELEMENT_PATCH = `
/* kntt-v311-step2: five-element upgrade + real combat effects */
(function(){
  if (window.__KNTT_V311_ELEMENTS_STEP2__) return;
  if (typeof Storage === 'undefined' || typeof State === 'undefined' || typeof UI === 'undefined' || typeof UNITS_DB === 'undefined' || typeof UNIT_SKILLS === 'undefined') return;
  window.__KNTT_V311_ELEMENTS_STEP2__ = true;

  const ELEMENT_COST = [30, 80, 180, 320, 500];
  const ELEMENTS = {
    metal:{ icon:'⚙️', name:'Kim', short:'Crit / xuyên / bóc khiên', color:'#facc15' },
    wood:{ icon:'🌿', name:'Mộc', short:'Độc / lan / ăn mòn', color:'#22c55e' },
    water:{ icon:'💧', name:'Thủy', short:'Slow / đóng băng', color:'#38bdf8' },
    fire:{ icon:'🔥', name:'Hỏa', short:'Cháy / nổ lan', color:'#fb923c' },
    earth:{ icon:'🪨', name:'Thổ', short:'Khiên / sống sót', color:'#a3a3a3' }
  };
  const HERO_ELEMS = {
    miner:{main:'earth',sub:'wood'}, knight:{main:'earth',sub:'fire'}, archer:{main:'metal',sub:'fire'}, gunner:{main:'fire',sub:'metal'}, poison:{main:'wood',sub:'water'}, mage:{main:'metal',sub:'fire'}, ice:{main:'water',sub:'metal'}, priest:{main:'earth',sub:'water'}, druid:{main:'wood',sub:'earth'}, wind:{main:'water',sub:'metal'}
  };
  window.KNTT_ELEMENTS = ELEMENTS;
  window.KNTT_HERO_ELEMENTS = HERO_ELEMS;

  function q(id){ return document.getElementById(id); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>'\"]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'})[c]; }); }
  function ensureElements(){
    try {
      if (!Storage.data) Storage.data = {};
      if (!Storage.data.elements) Storage.data.elements = {};
      State.elements = Storage.data.elements;
      Object.keys(UNITS_DB).forEach(function(k){ if (!State.elements[k]) State.elements[k] = {}; });
    } catch(_) {}
    return State.elements || {};
  }
  const _load = Storage.load && Storage.load.bind(Storage);
  Storage.load = function(){ const r = _load ? _load() : Storage.data; ensureElements(); return r; };
  const _sync = Storage.sync && Storage.sync.bind(Storage);
  Storage.sync = function(){ try { Storage.data.elements = State.elements || {}; } catch(_) {} if (_sync) return _sync(); try { localStorage.setItem(Storage.key, JSON.stringify(Storage.data)); } catch(_) {} };
  ensureElements();

  function elLv(type, elem){ const all = ensureElements(); return Math.max(0, Math.min(5, Number(all[type] && all[type][elem]) || 0)); }
  function affinity(type, elem){ const h = HERO_ELEMS[type] || {}; if (h.main === elem) return 1; if (h.sub === elem) return 0.7; return 0.45; }
  function hasGod(type){ try { return ((State.unitSkills && State.unitSkills[type]) || 0) >= 3; } catch(_) { return false; } }
  function elPower(type, elem){ let p = elLv(type, elem) * affinity(type, elem); const h = HERO_ELEMS[type] || {}; if (hasGod(type) && h.sub === elem) p += elLv(type, elem) * 0.4; return p; }
  window.KNTT_elLv = elLv;
  window.KNTT_elPower = elPower;
  window.KNTT_critChance = function(unit){ const type = unit && unit.typeId; const base = 0.1 + (TALENTS_DB && TALENTS_DB.c ? TALENTS_DB.c.effect(State.talents.c || 0) : 0); return Math.min(0.75, base + elPower(type, 'metal') * 0.03); };
  window.KNTT_critDmg = function(unit){ const type = unit && unit.typeId; return 2 + elPower(type, 'metal') * 0.08; };
  window.KNTT_splashMul = function(proj){ const type = proj && proj.typeId; return type === 'gunner' ? 1 + elPower(type, 'fire') * 0.12 : 1; };

  if (UNITS_DB.archer) UNITS_DB.archer.lv3Desc = 'Xuyên Tâm: đạn xuyên, bóc khiên; hợp hệ Kim để crit/xuyên giáp.';
  if (UNITS_DB.gunner) UNITS_DB.gunner.lv3Desc = 'Đạn Nổ Chùm: nổ diện rộng; hợp hệ Hỏa để tăng vùng nổ/cháy lan.';
  if (UNITS_DB.poison) UNITS_DB.poison.lv3Desc = 'Dịch Độc: độc vùng, trị né; hợp hệ Mộc để độc lan/ăn mòn.';
  if (UNITS_DB.mage) UNITS_DB.mage.lv3Desc = 'Sét Chẻ: sét nảy chuỗi; hợp hệ Kim để crit và phán quyết giáp/boss.';
  if (UNITS_DB.ice) UNITS_DB.ice.lv3Desc = 'Đóng Băng: nổ băng, slow sâu; hợp hệ Thủy để khống chế.';
  if (UNITS_DB.druid) UNITS_DB.druid.lv3Desc = 'Rễ Thiêng: trói đất, khắc golem; hợp hệ Mộc.';
  if (UNITS_DB.wind) UNITS_DB.wind.lv3Desc = 'Cuồng Phong: xuyên hàng, đẩy lùi; hợp hệ Thủy.';

  const _unitSkillBonus = window.unitSkillBonus || unitSkillBonus;
  window.unitSkillBonus = function(type){
    const b = _unitSkillBonus(type);
    const metal = elPower(type, 'metal'), wood = elPower(type, 'wood'), water = elPower(type, 'water'), fire = elPower(type, 'fire'), earth = elPower(type, 'earth');
    if (metal) b.dmg += metal * 0.025;
    if (wood) { b.dmg += wood * 0.035; b.range += wood * 0.01; }
    if (water) b.slow = (b.slow || 0) + water * 0.035;
    if (fire) { b.dmg += fire * 0.035; b.splash += fire * 0.06; }
    if (earth) b.hp += earth * 0.05;
    return b;
  };

  function markText(e, txt, col){ try { if (Math.random() < 0.18) Engine.spawnText(e.x, e.y - 34, txt, col, false); } catch(_) {} }
  function addDot(e, key, dur, dps, color){ if (!e || e.hp <= 0) return; e[key] = Math.max(e[key] || 0, dur); e[key + 'Dps'] = Math.max(e[key + 'Dps'] || 0, dps); try { if (Math.random() < 0.18) Engine.spawnParticles(e.x, e.y, color, 4, 28, 2); } catch(_) {} }
  window.KNTT_onTypeHit = function(type, e, dmg, kind){
    if (!type || !e || e.hp <= 0) return;
    const metal = elPower(type, 'metal'), wood = elPower(type, 'wood'), water = elPower(type, 'water'), fire = elPower(type, 'fire');
    if (metal > 0) {
      if (e.shield > 0 && (type === 'archer' || type === 'mage' || metal >= 2) && Math.random() < Math.min(0.55, 0.12 + metal * 0.06)) { e.shield = Math.max(0, e.shield - 1); markText(e, 'BÓC KHIÊN', '#facc15'); }
      if ((type === 'mage' || type === 'archer') && Math.random() < Math.min(0.35, metal * 0.045)) { e._knttVuln = Math.max(e._knttVuln || 0, 2.4); e._knttVulnAmt = Math.max(e._knttVulnAmt || 0, 0.06 + metal * 0.025); markText(e, 'PHÁ GIÁP', '#facc15'); }
    }
    if (fire > 0) { const m = type === 'gunner' ? 1.7 : 1; addDot(e, '_knttBurn', 2.2 + fire * 0.18, dmg * (0.018 + fire * 0.006) * m, '#fb923c'); if (type === 'gunner') markText(e, 'CHÁY', '#fb923c'); }
    if (wood > 0) { const m = (type === 'poison' || type === 'druid') ? 1.8 : 1; addDot(e, '_knttPoison', 3.2 + wood * 0.2, dmg * (0.014 + wood * 0.006) * m, '#22c55e'); if (type === 'poison' || type === 'druid') markText(e, 'ĐỘC', '#22c55e'); }
    if (water > 0) { const m = (type === 'ice' || type === 'wind') ? 1.45 : 1; e.slowTimer = Math.max(e.slowTimer || 0, 1.1 + water * 0.18); e.slowAmt = Math.max(e.slowAmt || 0, Math.min(0.82, (0.07 + water * 0.035) * m)); if (type === 'ice' || type === 'wind') markText(e, 'LÀM CHẬM', '#38bdf8'); }
  };
  window.KNTT_onUnitHit = function(u, e, dmg, kind){ window.KNTT_onTypeHit(u && u.typeId, e, dmg, kind); };

  if (typeof Enemy !== 'undefined' && Enemy.prototype && !Enemy.prototype.__knttElemStep2) {
    Enemy.prototype.__knttElemStep2 = true;
    const _take = Enemy.prototype.takeDmg;
    Enemy.prototype.takeDmg = function(amt, dtype, proj){ if (this._knttVuln > 0) amt *= (1 + Math.min(0.35, this._knttVulnAmt || 0)); return _take.call(this, amt, dtype, proj); };
    const _upd = Enemy.prototype.update;
    Enemy.prototype.update = function(dt){
      if (this._knttBurn > 0) { this._knttBurn -= dt; this.hp -= (this._knttBurnDps || 0) * dt; this.flash = Math.max(this.flash || 0, 0.05); }
      if (this._knttPoison > 0) { this._knttPoison -= dt; const r = this.db && this.db.resist && this.db.resist.pois != null ? this.db.resist.pois : 1; this.hp -= (this._knttPoisonDps || 0) * dt * r; this.flash = Math.max(this.flash || 0, 0.05); }
      if (this._knttVuln > 0) this._knttVuln -= dt;
      return _upd.call(this, dt);
    };
  }
  if (typeof Unit !== 'undefined' && Unit.prototype && !Unit.prototype.__knttElemStep2) {
    Unit.prototype.__knttElemStep2 = true;
    const _utake = Unit.prototype.takeDamage;
    Unit.prototype.takeDamage = function(amt){
      const earth = elPower(this.typeId, 'earth');
      if (earth > 0) {
        if (!this._knttEarthShield && this.maxHp && this.hp / this.maxHp < 0.38) { this._knttEarthShield = this.maxHp * (0.06 + earth * 0.025); try { Engine.spawnText(this.x, this.y - 32, 'THỔ KHIÊN', '#d4d4d4', true); } catch(_) {} }
        if (this._knttEarthShield > 0) { const block = Math.min(this._knttEarthShield, amt); this._knttEarthShield -= block; amt -= block; }
        amt *= Math.max(0.68, 1 - earth * 0.035);
      }
      return _utake.call(this, amt);
    };
  }

  function costFor(lv){ return lv >= 5 ? 0 : ELEMENT_COST[lv]; }
  function buyElement(type, elem){
    ensureElements(); const lv = elLv(type, elem); const cost = costFor(lv); if (!cost) return;
    Storage.data.gems = Number(Storage.data.gems || 0);
    if (Storage.data.gems < cost) { try { UI.showMessage('Thiếu kim cương'); } catch(_) {} return; }
    Storage.data.gems -= cost;
    State.elements[type][elem] = lv + 1;
    Storage.sync(); try { UI.updateDisplay(); UI.refreshStart(); Sound.play('upgrade'); } catch(_) {}
    openElementPanel();
  }
  function openElementPanel(){
    ensureElements();
    let old = document.getElementById('elmod'); if (old) old.remove();
    const box = document.createElement('div'); box.id = 'elmod';
    box.style.cssText = 'position:fixed;inset:0;z-index:160;background:rgba(2,6,23,.88);display:flex;align-items:center;justify-content:center;padding:10px;backdrop-filter:blur(5px)';
    const shell = document.createElement('div'); shell.style.cssText='width:min(880px,94vw);height:min(430px,88vh);background:#0f172a;border:1px solid #334155;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.75);display:flex;flex-direction:column;overflow:hidden';
    shell.innerHTML = '<div style="height:44px;display:flex;align-items:center;padding:0 12px;border-bottom:1px solid #334155;gap:8px"><b style="font-family:Oswald,sans-serif;letter-spacing:.12em;color:#fff">☯️ LUYỆN HỆ NGŨ HÀNH</b><span style="margin-left:auto;color:#facc15;font-weight:900">💎 '+(Storage.data.gems||0)+'</span><button id="el-x" style="width:34px;height:30px;border-radius:9px;background:#1e293b;color:#cbd5e1;border:1px solid #475569;font-weight:900">×</button></div><div id="el-list" style="overflow:auto;padding:10px;display:flex;flex-direction:column;gap:8px"></div><div style="height:26px;font-size:10px;color:#94a3b8;text-align:center;border-top:1px solid #334155;padding-top:5px">Bước 2: hệ đã có hiệu ứng thật trong chiến đấu — cháy, độc, slow, bóc khiên, phá giáp, thổ khiên.</div>';
    box.appendChild(shell); document.body.appendChild(box); document.getElementById('el-x').onclick=function(){ box.remove(); };
    const list = document.getElementById('el-list');
    Object.keys(UNITS_DB).forEach(function(type){
      const u=UNITS_DB[type], pair=HERO_ELEMS[type]||{}; const row=document.createElement('div');
      row.style.cssText='display:grid;grid-template-columns:120px 1fr;gap:8px;align-items:center;background:rgba(2,6,23,.55);border:1px solid rgba(148,163,184,.18);border-radius:12px;padding:8px';
      const name='<div style="font-weight:900;color:#fff">'+u.icon+' '+esc(u.name)+'</div><div style="font-size:10px;color:#94a3b8">Chính: '+(ELEMENTS[pair.main]?.name||'-')+' · Phụ: '+(ELEMENTS[pair.sub]?.name||'-')+'</div>';
      const btns=Object.keys(ELEMENTS).map(function(e){ const d=ELEMENTS[e], lv=elLv(type,e), cost=costFor(lv), tag=pair.main===e?'CHÍNH':(pair.sub===e?'PHỤ':'LỆCH'); const good=pair.main===e; return '<button data-type="'+type+'" data-e="'+e+'" '+(cost?'':'disabled')+' style="min-height:42px;border-radius:10px;border:1px solid '+(good?'#facc15':'#334155')+';background:'+(good?'rgba(202,138,4,.18)':'#020617')+';color:#e2e8f0;font-size:10px;font-weight:900"><div>'+d.icon+' '+d.name+' Lv.'+lv+'/5</div><div style="color:'+(good?'#fde68a':'#94a3b8')+'">'+tag+' · '+(cost?cost+'💎':'MAX')+'</div><div style="font-size:8px;color:#94a3b8">'+esc(d.short)+'</div></button>'; }).join('');
      row.innerHTML='<div>'+name+'</div><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">'+btns+'</div>'; list.appendChild(row);
    });
    list.querySelectorAll('button[data-type]').forEach(function(b){ b.onclick=function(){ buyElement(b.getAttribute('data-type'), b.getAttribute('data-e')); }; });
  }
  window.openElementPanel = openElementPanel;
  function installButton(){
    if (document.getElementById('b-elements')) return;
    const anchor = document.getElementById('b-tal-2') || document.getElementById('b-tal'); if (!anchor || !anchor.parentNode) return;
    const b = document.createElement('button'); b.id='b-elements'; b.className = anchor.className; b.style.cssText = anchor.style.cssText || ''; b.innerHTML='☯️ NGŨ HÀNH'; b.onclick=function(){ try{ Sound.play('click'); }catch(_){} openElementPanel(); };
    anchor.parentNode.appendChild(b);
  }
  setTimeout(installButton, 250);
})();
`;

function patchIndexText(text) {
  let out = text;
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
    .replace("let rd = State.grid.size * 1.5 * (1 + unitSkillBonus('gunner').splash) * (this.lv >= 4 ? 1.2 : 1);", "let rd = State.grid.size * 1.5 * (1 + unitSkillBonus('gunner').splash) * (this.lv >= 4 ? 1.2 : 1) * (window.KNTT_splashMul ? window.KNTT_splashMul(this) : 1);")
    .replace("UI.showMessage(WAVE_THEMES[waveTheme(State.wave)].hint, waveTheme(State.wave) === 'boss'); Sound.play('wave'); this.buildWave();", "let _th = waveTheme(State.wave); UI.showMessage(WAVE_THEMES[_th].hint, _th === 'boss'); Sound.play('wave'); this.buildWave();");
  if (!out.includes('__KNTT_V311_ELEMENTS_STEP2__')) out = out.replace('// ============ BOOT ============', `${V311_ELEMENT_PATCH}\n// ============ BOOT ============`);
  return out;
}

async function patchIndexResponse(res) {
  if (!res || !res.ok) return res;
  const text = await res.text();
  return new Response(patchIndexText(text), { status: res.status, statusText: res.statusText, headers: { 'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'no-store' } });
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
    await Promise.all(EXTRA.map(async (url) => { try { const res = await fetch(url, { mode: 'no-cors' }); await cache.put(url, res); } catch (_) {} }));
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
