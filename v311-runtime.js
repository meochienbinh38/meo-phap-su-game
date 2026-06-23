/* v3.11 runtime module - hard asset, not generated inside service worker */
(function(){
  if (window.__KNTT_V311_RUNTIME__) return;
  window.__KNTT_V311_RUNTIME__ = true;

  const GAME_VER = '3.11.5';
  const ELEMENT_COST = [30, 80, 180, 320, 500];
  const ELEMENTS = {
    metal:{ icon:'⚙️', name:'Kim', short:'Crit / xuyên / bóc khiên' },
    wood:{ icon:'🌿', name:'Mộc', short:'Độc / lan / ăn mòn' },
    water:{ icon:'💧', name:'Thủy', short:'Slow / đóng băng' },
    fire:{ icon:'🔥', name:'Hỏa', short:'Cháy / nổ lan' },
    earth:{ icon:'🪨', name:'Thổ', short:'Khiên / sống sót' }
  };
  const HERO_ELEMS = {
    miner:{main:'earth',sub:'wood'}, knight:{main:'earth',sub:'fire'}, archer:{main:'metal',sub:'fire'}, gunner:{main:'fire',sub:'metal'}, poison:{main:'wood',sub:'water'}, mage:{main:'metal',sub:'fire'}, ice:{main:'water',sub:'metal'}, priest:{main:'earth',sub:'water'}, druid:{main:'wood',sub:'earth'}, wind:{main:'water',sub:'metal'}
  };
  window.KNTT_ELEMENTS = ELEMENTS;
  window.KNTT_HERO_ELEMENTS = HERO_ELEMS;

  function q(id){ return document.getElementById(id); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function rnd(min, max){ return min + Math.random() * (max - min); }

  function installFitCss(){
    if (q('kntt-v3115-hard-css')) return;
    const st = document.createElement('style'); st.id = 'kntt-v3115-hard-css';
    st.textContent = [
      '#start{overflow:hidden!important;padding:6px!important;align-items:center!important;justify-content:center!important}',
      '#s-card{height:calc(100% - 12px)!important;max-height:none!important;display:flex!important;flex-direction:column!important;margin:auto!important;overflow:hidden!important}',
      '.s-hero{flex:0 0 58px!important;padding:6px 12px!important}.s-hero-title{font-size:clamp(20px,4vw,31px)!important;line-height:1.02!important}.s-hero-sub{font-size:10px!important;margin-top:2px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}',
      '.s-body{flex:1!important;min-height:0!important;padding:8px 12px 9px!important;gap:10px!important}.s-col-main{display:flex!important;flex-direction:column!important;min-height:0!important}.s-col-main>div:first-child{flex:0 0 30px!important;margin-bottom:5px!important}.s-sec-title{font-size:18px!important}',
      '#maps{flex:1 1 auto!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;display:flex!important;flex-direction:column!important;gap:6px!important}.m-card{min-height:47px!important;padding:7px 10px!important}.m-card .sub{font-size:9px!important}',
      '.s-actions{flex:0 0 38px!important;margin-top:7px!important;gap:7px!important}.s-actions .btn{height:38px!important;padding:0 8px!important;font-size:11px!important}.s-actions .ibtn{height:38px!important;width:42px!important}',
      '.s-col-side{width:34%!important;min-width:178px!important;padding:8px!important;gap:6px!important;justify-content:flex-start!important;min-height:0!important;overflow:hidden!important}#b-start{height:66px!important;padding:0!important;font-size:20px!important;flex:0 0 66px!important}#b-update-2{font-size:10px!important;line-height:1.1!important;padding:0!important;min-height:20px!important}.s-col-side>p.muted{font-size:9px!important;line-height:1.25!important;max-height:34px!important;overflow:hidden!important;flex:0 0 auto!important}#g-stat{flex:0 0 auto!important}',
      '.kntt-summary{margin-top:8px;text-align:left;background:rgba(15,23,42,.72);border:1px solid rgba(148,163,184,.22);border-radius:12px;padding:8px 10px;font-size:11px;line-height:1.35}.kntt-summary b{color:#fde68a}.kntt-summary .grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 10px}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function setVersionText(){
    try {
      const a = q('ver-num'); if (a) a.innerText = GAME_VER;
      const b = q('ver-num-2'); if (b) b.innerText = GAME_VER;
      ['b-update','b-update-2'].forEach(id => { const el=q(id); if (el && /Phiên bản|Kiểm tra/.test(el.textContent || '')) el.innerHTML='↪ Phiên bản ' + GAME_VER + ' · Kiểm tra cập nhật'; });
    } catch(_) {}
  }

  function installUpdateFix(){
    try {
      window.GAME_VERSION = GAME_VER;
      window.checkUpdate = async function(manual){
        try {
          const res = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
          const data = await res.json();
          const remote = data && data.version ? data.version : GAME_VER;
          if (remote !== GAME_VER) {
            const bar = q('updbar'); const v = q('upd-ver'); if (v) v.innerText = remote; if (bar) bar.classList.add('show');
          } else if (manual) {
            if (typeof toast === 'function') toast('Bạn đang dùng bản mới nhất ✓ (v' + GAME_VER + ')');
            else alert('Bạn đang dùng bản mới nhất ✓ (v' + GAME_VER + ')');
          }
        } catch(e) { if (manual) alert('Không kiểm tra được — cần kết nối mạng.'); }
      };
      ['b-update','b-update-2'].forEach(id => { const el=q(id); if (el) el.onclick = () => { try{Sound && Sound.play && Sound.play('click');}catch(_){} window.checkUpdate(true); }; });
    } catch(_) {}
  }

  function ensureElements(){
    try { if (!Storage.data) Storage.data = {}; if (!Storage.data.elements) Storage.data.elements = {}; if (typeof State !== 'undefined') State.elements = Storage.data.elements; if (typeof UNITS_DB !== 'undefined') Object.keys(UNITS_DB).forEach(k => { if (!Storage.data.elements[k]) Storage.data.elements[k] = {}; }); } catch(_) {}
    return (typeof State !== 'undefined' && State.elements) || (Storage && Storage.data && Storage.data.elements) || {};
  }
  function patchStorage(){
    try {
      if (Storage.__knttV3115) return;
      Storage.__knttV3115 = true;
      const oldLoad = Storage.load && Storage.load.bind(Storage);
      Storage.load = function(){ const r = oldLoad ? oldLoad() : Storage.data; ensureElements(); return r; };
      const oldSync = Storage.sync && Storage.sync.bind(Storage);
      Storage.sync = function(){ try { Storage.data.elements = (typeof State !== 'undefined' && State.elements) || Storage.data.elements || {}; } catch(_) {} if (oldSync) return oldSync(); try { localStorage.setItem(Storage.key, JSON.stringify(Storage.data)); } catch(_) {} };
    } catch(_) {}
    ensureElements();
  }

  function elLv(type, elem){ const all = ensureElements(); return Math.max(0, Math.min(5, Number(all[type] && all[type][elem]) || 0)); }
  function affinity(type, elem){ const h = HERO_ELEMS[type] || {}; if (h.main === elem) return 1; if (h.sub === elem) return 0.7; return 0.45; }
  function hasGod(type){ try { return ((State.unitSkills && State.unitSkills[type]) || 0) >= 3; } catch(_) { return false; } }
  function elPower(type, elem){ let p = elLv(type, elem) * affinity(type, elem); const h = HERO_ELEMS[type] || {}; if (hasGod(type) && h.sub === elem) p += elLv(type, elem) * 0.4; return p; }
  window.KNTT_elLv = elLv;
  window.KNTT_elPower = elPower;
  window.KNTT_critChance = unit => Math.min(0.75, 0.1 + ((typeof TALENTS_DB !== 'undefined' && TALENTS_DB.c) ? TALENTS_DB.c.effect(State.talents.c || 0) : 0) + elPower(unit && unit.typeId, 'metal') * 0.03);
  window.KNTT_critDmg = unit => { try { const s = battleStats(); s.crits++; } catch(_) {} return 2 + elPower(unit && unit.typeId, 'metal') * 0.08; };
  window.KNTT_splashMul = proj => proj && proj.typeId === 'gunner' ? 1 + elPower('gunner', 'fire') * 0.12 : 1;

  function patchDescriptions(){
    try {
      if (UNITS_DB.archer) UNITS_DB.archer.lv3Desc = 'Thần Tiễn: xuyên hàng, crit, bóc khiên; hệ Kim mở xuyên giáp/kết liễu.';
      if (UNITS_DB.gunner) UNITS_DB.gunner.lv3Desc = 'Thiên Pháo: nổ diện rộng, cháy lan; hệ Hỏa tăng nổ phụ.';
      if (UNITS_DB.poison) UNITS_DB.poison.lv3Desc = 'Dịch Thần: độc vùng, ăn mòn, lan dịch; hệ Mộc là mạnh nhất.';
      if (UNITS_DB.mage) UNITS_DB.mage.lv3Desc = 'Thiên Lôi: sét chuỗi, phán quyết giáp/boss; hệ Kim tăng crit/phá giáp.';
      if (UNITS_DB.ice) UNITS_DB.ice.lv3Desc = 'Cực Hàn: nổ băng, slow sâu, đông cứng ngắn; hệ Thủy khống chế mạnh.';
      if (UNITS_DB.druid) UNITS_DB.druid.lv3Desc = 'Thần Lâm: rễ trói đất, khắc golem; hệ Mộc tăng độc thiên nhiên.';
      if (UNITS_DB.wind) UNITS_DB.wind.lv3Desc = 'Thiên Phong: xuyên hàng, đẩy/gom quái, lộ hồn ma; hệ Thủy tăng kiểm soát.';
    } catch(_) {}
  }

  function patchUnitSkillBonus(){
    try {
      if (window.__knttUnitSkillV3115) return;
      window.__knttUnitSkillV3115 = true;
      const base = window.unitSkillBonus || unitSkillBonus;
      window.unitSkillBonus = function(type){
        const b = base(type);
        const metal=elPower(type,'metal'), wood=elPower(type,'wood'), water=elPower(type,'water'), fire=elPower(type,'fire'), earth=elPower(type,'earth');
        if (metal) b.dmg += metal * 0.025;
        if (wood) { b.dmg += wood * 0.035; b.range += wood * 0.01; }
        if (water) b.slow = (b.slow || 0) + water * 0.035;
        if (fire) { b.dmg += fire * 0.035; b.splash += fire * 0.06; }
        if (earth) b.hp += earth * 0.05;
        return b;
      };
    } catch(_) {}
  }

  function resetBattleStats(){
    if (typeof State !== 'undefined') State.knttBattle = { kills:0, randomXp:0, enemyGems:0, bossGems:0, crits:0, elementHits:0, bigLuck:0, effects:{metal:0,wood:0,water:0,fire:0,earth:0} };
  }
  function battleStats(){
    if (typeof State === 'undefined') return { effects:{} };
    if (!State.knttBattle) resetBattleStats();
    return State.knttBattle;
  }
  function rollEnemyXp(e){
    const base = Math.max(1, Number(e && e.db && e.db.xp) || 1);
    const r = Math.random();
    let mult = 0.75, label = 'Ít EXP';
    if (r < 0.02) { mult = 2.3; label = 'Đại ngộ EXP'; }
    else if (r < 0.10) { mult = 1.6; label = 'May EXP'; }
    else if (r < 0.34) { mult = 1.25; label = 'Lộc EXP'; }
    else if (r < 0.86) { mult = 1.0; label = ''; }
    return { xp: Math.max(1, Math.round(base * mult)), label, big: mult >= 1.6 };
  }
  function rewardEnemyDeath(e){
    if (!e || e.__knttRewarded) return;
    e.__knttRewarded = true;
    const st = battleStats();
    const xp = rollEnemyXp(e);
    st.kills++; st.randomXp += xp.xp; if (xp.big) st.bigLuck++;
    try { Engine.gainXp(xp.xp); if (xp.label) Engine.spawnText(e.x, e.y - 36, xp.label + ' +' + xp.xp, '#a7f3d0', false); } catch(_) {}

    const stageIdx = Math.max(0, Number(State.stageIdx) || 0);
    let gem = 0;
    const normalDrop = 0.004 + stageIdx * 0.0009;
    if (Math.random() < normalDrop) gem += 1;
    if (e.db && e.db.isBoss && Math.random() < 0.38) gem += [8,10,12,15][Math.floor(Math.random()*4)];
    if (gem > 0) {
      if (!Storage.data) Storage.data = {};
      Storage.data.gems = Number(Storage.data.gems || 0) + gem;
      if (e.db && e.db.isBoss) st.bossGems += gem; else st.enemyGems += gem;
      if (gem >= 8) st.bigLuck++;
      try { Engine.spawnText(e.x, e.y - 54, '+' + gem + '💎', '#67e8f9', true); Storage.sync(); } catch(_) {}
    }
  }
  function summaryHtml(baseReward, first){
    const s = battleStats();
    const totalGem = (s.enemyGems || 0) + (s.bossGems || 0) + (baseReward || 0);
    const eff = Object.entries(s.effects || {}).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v]) => (ELEMENTS[k] ? ELEMENTS[k].name : k) + ' x' + v).join(' · ') || 'Chưa rõ';
    return '<div class="kntt-summary"><b>📊 Tổng kết trận</b><div class="grid">'
      + '<span>Quái hạ</span><b>' + (s.kills||0) + '</b>'
      + '<span>EXP nhân phẩm</span><b>+' + (s.randomXp||0) + '</b>'
      + '<span>Kim cương quái</span><b>+' + (s.enemyGems||0) + '💎</b>'
      + '<span>Kim cương boss</span><b>+' + (s.bossGems||0) + '💎</b>'
      + '<span>Thưởng màn</span><b>+' + (baseReward||0) + '💎</b>'
      + '<span>Tổng kim cương</span><b>+' + totalGem + '💎</b>'
      + '<span>Crit</span><b>' + (s.crits||0) + '</b>'
      + '<span>Hệ nổi bật</span><b>' + eff + '</b>'
      + '</div><div style="margin-top:5px;color:#94a3b8">' + (first ? 'Lần đầu qua màn.' : 'Chơi lại: thưởng màn giảm, nhưng quái/boss vẫn có nhân phẩm.') + '</div></div>';
  }

  const pulse = {};
  function bump(type,key,mod){ const k=type+':'+key; pulse[k]=(pulse[k]||0)+1; return pulse[k] % mod === 0; }
  function mark(e,txt,col){ try { if (Math.random() < 0.2) Engine.spawnText(e.x, e.y - 34, txt, col, false); } catch(_) {} }
  function dot(e,key,dur,dps,col){ if(!e || e.hp<=0) return; e[key]=Math.max(e[key]||0,dur); e[key+'Dps']=Math.max(e[key+'Dps']||0,dps); try { if(Math.random()<0.18) Engine.spawnParticles(e.x,e.y,col,4,28,2); } catch(_){} }
  function near(e,rd,fn){ try { (State.enemies||[]).forEach(en => { if(en && en.hp>0 && getDist(e.x,e.y,en.x,en.y)<=rd) fn(en); }); } catch(_){} }
  function bonus(e,amt,dtype,label,col){ if(!e || e.hp<=0) return; e.takeDmg(amt,dtype||'magic',false); try { Engine.spawnText(e.x,e.y-22,Math.floor(amt),col||'#fff',true); if(label) mark(e,label,col||'#fff'); } catch(_){} }

  function godSkill(type,e,dmg,kind,p){
    if(!hasGod(type) || !e || e.hp<=0) return;
    const gs = State.grid && State.grid.size ? State.grid.size : 64;
    if(type==='gunner' && (kind==='expl'||kind==='proj') && bump(type,'cannon',3)){ try{Engine.spawnText(e.x,e.y-50,'THIÊN PHÁO','#fb923c',true);Engine.spawnParticles(e.x,e.y,'#fb923c',30,130,5);State.shake+=8;Sound.play('boom');}catch(_){} near(e, gs*(1.05+p.fire*.12), en => { if(en!==e) bonus(en,dmg*(.28+p.fire*.035),'phys',null,'#fb923c'); dot(en,'_knttBurn',3,dmg*(.025+p.fire*.008),'#fb923c'); }); }
    if(type==='archer' && (kind==='proj'||kind==='melee') && bump(type,'arrow',4)){ if(e.shield>0) e.shield=0; bonus(e,dmg*(.38+p.metal*.045),'phys','THẦN TIỄN','#facc15'); if(e.maxHp && e.hp>0 && e.hp/e.maxHp<Math.min(.18,.08+p.metal*.012)){ e.hp=0; rewardEnemyDeath(e); mark(e,'KẾT LIỄU','#facc15'); } }
    if(type==='mage' && (kind==='magic'||kind==='chain') && bump(type,'judgement',3)){ e._knttVuln=Math.max(e._knttVuln||0,3.2); e._knttVulnAmt=Math.max(e._knttVulnAmt||0,.10+p.metal*.025); bonus(e,dmg*(.24+p.metal*.035),'magic','PHÁN QUYẾT','#facc15'); }
    if(type==='ice' && (kind==='lob'||kind==='proj') && bump(type,'frost',2)){ try{Engine.spawnText(e.x,e.y-46,'CỰC HÀN','#38bdf8',true);Engine.spawnParticles(e.x,e.y,'#e0f2fe',24,90,4);}catch(_){} near(e,gs*(1+p.water*.10),en => { en.slowTimer=Math.max(en.slowTimer||0,2.2+p.water*.22); en.slowAmt=Math.max(en.slowAmt||0,Math.min(.9,.38+p.water*.045)); if(Math.random()<Math.min(.22,.06+p.water*.02)){ en.slowTimer=Math.max(en.slowTimer||0,3.2); mark(en,'ĐÓNG BĂNG','#38bdf8'); } }); }
    if(type==='poison' && bump(type,'plague',4)){ try{Engine.spawnText(e.x,e.y-46,'DỊCH THẦN','#22c55e',true);}catch(_){} near(e,gs*(.9+p.wood*.08),en => dot(en,'_knttPoison',4,dmg*(.03+p.wood*.008),'#22c55e')); }
    if(type==='druid' && bump(type,'root',3)){ try{Engine.spawnText(e.x,e.y-46,'RỄ THẦN','#22c55e',true);}catch(_){} near(e,gs*(1+p.wood*.08),en => { en.slowTimer=Math.max(en.slowTimer||0,2.4); en.slowAmt=Math.max(en.slowAmt||0,.65); dot(en,'_knttPoison',3,dmg*(.018+p.wood*.006),'#22c55e'); }); }
    if(type==='wind' && bump(type,'wind',3)){ try{Engine.spawnText(e.x,e.y-46,'THIÊN PHONG','#38bdf8',true);}catch(_){} near(e,gs*(1.05+p.water*.08),en => { en.kb=Math.max(en.kb||0,34+p.water*4); en.slowTimer=Math.max(en.slowTimer||0,2); en.slowAmt=Math.max(en.slowAmt||0,.42+p.water*.035); }); }
    if(type==='knight' && bump(type,'shield',5)){ e.slowTimer=Math.max(e.slowTimer||0,1.2); e.slowAmt=Math.max(e.slowAmt||0,.35); bonus(e,dmg*(.22+p.earth*.025),'phys','THẦN THUẪN','#d4d4d4'); }
  }

  window.KNTT_onTypeHit = function(type,e,dmg,kind){
    if(!type || !e || e.hp<=0) return;
    const p={metal:elPower(type,'metal'),wood:elPower(type,'wood'),water:elPower(type,'water'),fire:elPower(type,'fire'),earth:elPower(type,'earth')};
    const s = battleStats();
    if(p.metal>0){ s.effects.metal++; s.elementHits++; if(e.shield>0 && (type==='archer'||type==='mage'||p.metal>=2) && Math.random()<Math.min(.55,.12+p.metal*.06)){e.shield=Math.max(0,e.shield-1);mark(e,'BÓC KHIÊN','#facc15');} if((type==='mage'||type==='archer') && Math.random()<Math.min(.35,p.metal*.045)){e._knttVuln=Math.max(e._knttVuln||0,2.4);e._knttVulnAmt=Math.max(e._knttVulnAmt||0,.06+p.metal*.025);mark(e,'PHÁ GIÁP','#facc15');} }
    if(p.fire>0){ s.effects.fire++; s.elementHits++; const m=type==='gunner'?1.7:1; dot(e,'_knttBurn',2.2+p.fire*.18,dmg*(.018+p.fire*.006)*m,'#fb923c'); if(type==='gunner') mark(e,'CHÁY','#fb923c'); }
    if(p.wood>0){ s.effects.wood++; s.elementHits++; const m=(type==='poison'||type==='druid')?1.8:1; dot(e,'_knttPoison',3.2+p.wood*.2,dmg*(.014+p.wood*.006)*m,'#22c55e'); if(type==='poison'||type==='druid') mark(e,'ĐỘC','#22c55e'); }
    if(p.water>0){ s.effects.water++; s.elementHits++; const m=(type==='ice'||type==='wind')?1.45:1; e.slowTimer=Math.max(e.slowTimer||0,1.1+p.water*.18); e.slowAmt=Math.max(e.slowAmt||0,Math.min(.82,(.07+p.water*.035)*m)); if(type==='ice'||type==='wind') mark(e,'LÀM CHẬM','#38bdf8'); }
    if(p.earth>0){ s.effects.earth++; }
    godSkill(type,e,dmg,kind,p);
    if (e.hp <= 0) rewardEnemyDeath(e);
  };
  window.KNTT_onUnitHit = (u,e,dmg,kind) => window.KNTT_onTypeHit(u && u.typeId,e,dmg,kind);

  function patchDamageHooks(){
    try {
      if (typeof Enemy !== 'undefined' && Enemy.prototype && !Enemy.prototype.__knttV3115) {
        Enemy.prototype.__knttV3115 = true;
        const take=Enemy.prototype.takeDmg;
        Enemy.prototype.takeDmg=function(amt,dtype,proj){
          if(this._knttVuln>0) amt*=1+Math.min(.35,this._knttVulnAmt||0);
          const r = take.call(this,amt,dtype,proj);
          if (this.hp <= 0) rewardEnemyDeath(this);
          return r;
        };
        const upd=Enemy.prototype.update;
        Enemy.prototype.update=function(dt){
          if(this._knttBurn>0){this._knttBurn-=dt;this.hp-=(this._knttBurnDps||0)*dt;this.flash=Math.max(this.flash||0,.05);}
          if(this._knttPoison>0){this._knttPoison-=dt; const r=this.db&&this.db.resist&&this.db.resist.pois!=null?this.db.resist.pois:1; this.hp-=(this._knttPoisonDps||0)*dt*r;this.flash=Math.max(this.flash||0,.05);}
          if(this.hp <= 0) rewardEnemyDeath(this);
          if(this._knttVuln>0)this._knttVuln-=dt;
          return upd.call(this,dt);
        };
      }
      if (typeof Unit !== 'undefined' && Unit.prototype && !Unit.prototype.__knttV3115) {
        Unit.prototype.__knttV3115 = true;
        const td=Unit.prototype.takeDamage;
        Unit.prototype.takeDamage=function(amt){ const earth=elPower(this.typeId,'earth'); if(earth>0){ if(!this._knttEarthShield && this.maxHp && this.hp/this.maxHp<.38){this._knttEarthShield=this.maxHp*(.06+earth*.025);try{Engine.spawnText(this.x,this.y-32,'THỔ KHIÊN','#d4d4d4',true);}catch(_){}} if(this._knttEarthShield>0){const block=Math.min(this._knttEarthShield,amt);this._knttEarthShield-=block;amt-=block;} amt*=Math.max(.68,1-earth*.035); } return td.call(this,amt); };
      }
    } catch(_) {}
  }

  function patchControl(){
    try {
      if (typeof Control === 'undefined' || Control.__knttV3115) return;
      Control.__knttV3115 = true;
      const start = Control.start.bind(Control);
      Control.start = function(idx){ resetBattleStats(); return start(idx); };
      const win = Control.stageWin.bind(Control);
      Control.stageWin = function(){
        const first = State.stageIdx >= Storage.data.stageProg;
        const baseReward = Math.round(State.stage.reward * (first ? 1 : 0.3));
        const html = summaryHtml(baseReward, first);
        const r = win();
        try { const gw = q('g-wav'); if (gw && !gw.querySelector('.kntt-summary')) gw.innerHTML += html; } catch(_) {}
        return r;
      };
    } catch(_) {}
  }

  function openElementPanel(){
    ensureElements(); const old=q('elmod'); if(old) old.remove();
    const box=document.createElement('div'); box.id='elmod'; box.style.cssText='position:fixed;inset:0;z-index:160;background:rgba(2,6,23,.88);display:flex;align-items:center;justify-content:center;padding:10px;backdrop-filter:blur(5px)';
    const shell=document.createElement('div'); shell.style.cssText='width:min(880px,94vw);height:min(430px,88vh);background:#0f172a;border:1px solid #334155;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.75);display:flex;flex-direction:column;overflow:hidden';
    shell.innerHTML='<div style="height:44px;display:flex;align-items:center;padding:0 12px;border-bottom:1px solid #334155;gap:8px"><b style="font-family:Oswald,sans-serif;letter-spacing:.12em;color:#fff">☯️ LUYỆN HỆ NGŨ HÀNH</b><span style="margin-left:auto;color:#facc15;font-weight:900">💎 '+((Storage.data&&Storage.data.gems)||0)+'</span><button id="el-x" style="width:34px;height:30px;border-radius:9px;background:#1e293b;color:#cbd5e1;border:1px solid #475569;font-weight:900">×</button></div><div id="el-list" style="overflow:auto;padding:10px;display:flex;flex-direction:column;gap:8px"></div><div style="height:26px;font-size:10px;color:#94a3b8;text-align:center;border-top:1px solid #334155;padding-top:5px">Ngũ Hành được lưu cứng trong tiến trình. Đúng hệ chính mạnh nhất.</div>';
    box.appendChild(shell); document.body.appendChild(box); q('el-x').onclick=()=>box.remove();
    const list=q('el-list');
    Object.keys(UNITS_DB).forEach(type => {
      const u=UNITS_DB[type], pair=HERO_ELEMS[type]||{}, row=document.createElement('div');
      row.style.cssText='display:grid;grid-template-columns:120px 1fr;gap:8px;align-items:center;background:rgba(2,6,23,.55);border:1px solid rgba(148,163,184,.18);border-radius:12px;padding:8px';
      const name='<div style="font-weight:900;color:#fff">'+u.icon+' '+esc(u.name)+'</div><div style="font-size:10px;color:#94a3b8">Chính: '+(ELEMENTS[pair.main]&&ELEMENTS[pair.main].name||'-')+' · Phụ: '+(ELEMENTS[pair.sub]&&ELEMENTS[pair.sub].name||'-')+'</div>';
      const btns=Object.keys(ELEMENTS).map(e => { const d=ELEMENTS[e], lv=elLv(type,e), cost=lv>=5?0:ELEMENT_COST[lv], tag=pair.main===e?'CHÍNH':(pair.sub===e?'PHỤ':'LỆCH'), good=pair.main===e; return '<button data-type="'+type+'" data-e="'+e+'" '+(cost?'':'disabled')+' style="min-height:42px;border-radius:10px;border:1px solid '+(good?'#facc15':'#334155')+';background:'+(good?'rgba(202,138,4,.18)':'#020617')+';color:#e2e8f0;font-size:10px;font-weight:900"><div>'+d.icon+' '+d.name+' Lv.'+lv+'/5</div><div style="color:'+(good?'#fde68a':'#94a3b8')+'">'+tag+' · '+(cost?cost+'💎':'MAX')+'</div><div style="font-size:8px;color:#94a3b8">'+esc(d.short)+'</div></button>'; }).join('');
      row.innerHTML='<div>'+name+'</div><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">'+btns+'</div>'; list.appendChild(row);
    });
    list.querySelectorAll('button[data-type]').forEach(b => b.onclick = () => buyElement(b.getAttribute('data-type'), b.getAttribute('data-e')));
  }
  function buyElement(type, elem){
    ensureElements(); const lv=elLv(type,elem), cost=lv>=5?0:ELEMENT_COST[lv]; if(!cost) return;
    Storage.data.gems=Number(Storage.data.gems||0);
    if(Storage.data.gems<cost){ try{UI.showMessage('Thiếu kim cương');}catch(_){} return; }
    Storage.data.gems-=cost; State.elements[type][elem]=lv+1; Storage.sync();
    try{UI.updateDisplay();UI.refreshStart();Sound.play('upgrade');}catch(_){}
    openElementPanel();
  }
  window.openElementPanel = openElementPanel;
  function installButton(){ if(q('b-elements')) return; const anchor=q('b-tal-2')||q('b-tal'); if(!anchor||!anchor.parentNode) return; const b=document.createElement('button'); b.id='b-elements'; b.className=anchor.className; b.style.cssText=anchor.style.cssText||''; b.innerHTML='☯️ NGŨ HÀNH'; b.onclick=()=>{try{Sound.play('click');}catch(_){} openElementPanel();}; anchor.parentNode.appendChild(b); }

  function boot(){
    installFitCss(); setVersionText(); installUpdateFix(); patchStorage(); ensureElements(); patchDescriptions(); patchUnitSkillBonus(); patchDamageHooks(); patchControl(); installButton();
  }
  boot(); setTimeout(boot, 250); setTimeout(boot, 1200);
})();
