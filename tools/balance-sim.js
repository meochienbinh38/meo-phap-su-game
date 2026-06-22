/* ============================================================================
 *  TRÌNH MÔ PHỎNG CÂN BẰNG v2 — kiểm chứng HỆ KHẮC CHẾ
 *  "Chơi" tự động bằng đúng cơ chế game. Chạy: `node tools/balance-sim.js`
 *  Mục tiêu: spam 1 loại tướng PHẢI thua sớm; kết hợp đúng tướng mới qua ải.
 *
 *  Khắc chế (kéo–búa–bao):
 *   - phys (Giáp Sĩ/Xạ Thủ/Pháo) : đòn thường; bị Orc/Sói/Sát Thủ kháng mạnh
 *   - magic (Thần Sét)           : khắc Orc giáp dày & Triệu Hồi; không bị né
 *   - frost (Băng)               : khắc Sói nhanh (sát thương + LÀM CHẬM)
 *   - pois  (Tháp Độc)           : khắc Sát Thủ né & bóc khiên (đánh nhiều nhịp, không bị né)
 *   - Khiên (Skel): chặn theo SỐ đòn -> đòn nhanh (Xạ Thủ/Độc) bóc; đòn to chậm phí
 *   - Né (Sát Thủ): chỉ né ĐẠN (phys tầm xa / frost), KHÔNG né magic/độc/cận chiến
 * ==========================================================================*/

const GRID = 68, ROWS = 6, COLS = 12, DT = 0.05, WALL_X = 0;
const cellX = c => WALL_X + c*GRID + GRID/2;
const SPAWN_X = WALL_X + COLS*GRID + GRID;

const TUNE = {
  startGold: 280, baseHp: 150,
  hpScale: 1.16, speedScale: 0.05,
  wallScale: 0.09, waveBonusBase: 20, waveBonusPer: 8,
  upgradePow: 1.8,        // nâng cấp đắt hơn
  buyRamp: 1.11,          // mua thêm 1 tướng (cùng loại) đắt hơn con trước (van chống snowball, bỏ cap)
  minerIncome: 14,
};
// giá mua tướng kế tiếp = base × buyRamp^(số con CÙNG LOẠI đang có)
function costOf(s, t){ return Math.round(UNITS[t].cost * Math.pow(TUNE.buyRamp, s.units.filter(u=>u.type===t).length)); }
// NHỊP ĐỘ: màn đầu ÍT & CHẬM (thư thả) -> cuối BÙNG NỔ (đông & dồn dập)
function waveCount(w){ return Math.round(4 + w*1.4 + w*w*0.13); }      // w1≈6, w10≈31, w20≈84
function waveInterval(w){ return Math.max(0.35, 1.9 - w*0.08); }       // w1≈1.8s (rỉ rả) -> cuối 0.35s (lũ lượt)

// dtype = loại sát thương; range theo ô (×GRID)
const UNITS = {
  miner:  { type:'econ',  cost:50,  hp:300, income:12, cd:4.0 },
  knight: { type:'melee', cost:60,  hp:700, dmg:15, range:1.2, aspd:1.2, dtype:'phys' },
  archer: { type:'linear',cost:90,  hp:150, dmg:32, range:7.0, aspd:1.0, dtype:'phys', pSpeed:760 },
  gunner: { type:'gunner',cost:130, hp:200, dmg:60, range:6.5, aspd:1.8, dtype:'phys', pSpeed:600 },
  poison: { type:'pulse', cost:120, hp:250, dmg:10, range:2.6, aspd:0.8, dtype:'pois' }, // đánh nhanh (nhiều nhịp)
  mage:   { type:'laser', cost:180, hp:120, dmg:40, range:12.0,aspd:1.6, dtype:'magic' },
  ice:    { type:'lob',   cost:160, hp:120, dmg:35, range:6.0, aspd:2.0, dtype:'frost', splash:1.2 },
};

// resist: <1 = kháng, >1 = yếu. evade: chỉ né đạn. shield: chặn N đòn.
const ENEMIES = [
  // mỗi quái có KHẮC TINH rõ ràng (weak >1) và điểm KHÁNG (resist <1)
  { kind:'imp',      hp:70,  spd:30, dmg:5,  aspd:1.0, gold:9,  xp:15, resist:{} },                                   // bầy đàn -> AoE
  { kind:'orc',      hp:420, spd:16, dmg:18, aspd:1.5, gold:22, xp:30, isHeavy:true, resist:{phys:0.45, frost:0.6, pois:0.6, magic:1.4} }, // giáp dày -> THẦN SÉT
  { kind:'wolf',     hp:60,  spd:78, dmg:8,  aspd:0.8, gold:9,  xp:20, resist:{phys:0.6, frost:1.6} },                // nhanh -> BĂNG (chậm)
  { kind:'skel',     hp:150, spd:16, dmg:20, aspd:1.5, gold:30, xp:40, shield:3, resist:{frost:0.7} },                // khiên -> đòn NHANH (Xạ/Độc)
  { kind:'summoner', hp:140, spd:15, dmg:5,  aspd:2.0, gold:25, xp:35, summons:true, resist:{phys:0.5, magic:1.5} },  // triệu hồi -> THẦN SÉT diệt nhanh
  { kind:'assassin', hp:120, spd:60, dmg:25, aspd:1.0, gold:28, xp:35, jump:true, evade:0.55, resist:{phys:0.45, pois:1.5, magic:1.2} }, // né+nhảy -> ĐỘC/SÉT
  { kind:'boss',     hp:5200,spd:11, dmg:70, aspd:2.0, gold:300,xp:600, isBoss:true, resist:{phys:0.5, magic:0.8, frost:0.8, pois:0.8} }, // cần KẾT HỢP
];
const E = {}; ENEMIES.forEach(e=>E[e.kind]=e);

function talentEffect(T){ return { d:T.d*0.1, s:T.s*0.05, h:T.h*100, c:T.c*0.05 }; }

function newState(profile){ const T = (profile==='maxed'||profile==='godlike') ? {d:10,s:10,h:5,c:5} : {d:0,s:0,h:0,c:0};
  const US = profile==='godlike' ? {miner:3,knight:3,archer:3,gunner:3,poison:3,mage:3,ice:3,priest:3} : {};
  return { gold:TUNE.startGold, hp:TUNE.baseHp+T.h*100, maxHp:TUNE.baseHp+T.h*100, wave:0, level:1, xp:0, maxXp:100, sp:0,
  talents:T, unitSkills:US, units:[], enemies:[], projs:[], time:0, leaks:0 }; }

// KỸ NĂNG TƯỚNG (mirror index.html) — bậc 1/2 cộng dồn số, bậc 3 = cờ mở khoá đặc tính
const USK = {
  miner:[{income:.2},{income:.25},{cdMul:.75}], knight:[{hp:.25},{reflect:.15},{hp:.3,reflect:.2}],
  archer:[{aspd:.15},{dmg:.2},{earlyPierce:1}], gunner:[{dmg:.2},{splash:.4},{earlyExplode:1}],
  poison:[{dmg:.25},{range:.25},{earlySlow:1}], mage:[{dmg:.2},{aspd:.15},{earlyChain:1}],
  ice:[{dmg:.2},{slow:.2},{earlyFreeze:1}], priest:[{dmg:.3},{range:.25},{earlyAura:1}],
};
function uskBonus(US,type){ const tiers=USK[type]||[], n=(US&&US[type])||0; let b={dmg:1,hp:1,aspd:1,range:1,income:1,splash:1,cdMul:1,reflect:0,slow:0};
  for(let i=0;i<n;i++){const t=tiers[i]; if(t.dmg)b.dmg+=t.dmg; if(t.hp)b.hp+=t.hp; if(t.aspd)b.aspd+=t.aspd; if(t.range)b.range+=t.range; if(t.income)b.income+=t.income; if(t.splash)b.splash+=t.splash; if(t.cdMul)b.cdMul*=t.cdMul; if(t.reflect)b.reflect+=t.reflect; if(t.slow)b.slow+=t.slow; if(t.earlyPierce)b.earlyPierce=1; if(t.earlyExplode)b.earlyExplode=1; if(t.earlyChain)b.earlyChain=1; if(t.earlyFreeze)b.earlyFreeze=1; if(t.earlySlow)b.earlySlow=1; if(t.earlyAura)b.earlyAura=1;}
  return b; }
function tiersTotal(US){ let n=0; for(const k in (US||{}))n+=US[k]; return n; }

// SỨC MẠNH META = Nội Tại chung; ĐỘ KHÓ = meta × kỹ năng tướng
function metaPow(T){ return 1 + 0.10*T.d + 0.06*T.s + 0.06*T.c; }   // max ×2.9
function diffScale(T,US){ return metaPow(T) * (1 + 0.02*tiersTotal(US)); }

function unitStats(u,T,US){ const db=UNITS[u.type], lvM=Math.pow(1.4,u.level-1), sb=uskBonus(US,u.type), te=talentEffect(T), dmgM=(1+te.d)*sb.dmg, spdM=(1+te.s)*sb.aspd;
  if(db.type==='econ') return { inc:Math.floor(db.income*(u.level>=3?2:lvM)*sb.income), cd:db.cd*sb.cdMul };
  if(db.type==='pulse') return { dmg:db.dmg*lvM*dmgM, rng:db.range*GRID*(u.level>=3?1.3:1)*sb.range, aspd:db.aspd/spdM };
  return { dmg:db.dmg*lvM*dmgM, rng:db.range*GRID*sb.range, aspd:db.aspd/spdM };
}
const critMul = T => 1 + (0.1 + talentEffect(T).c);

// ---- KHẮC CHẾ trung tâm ----
function hurt(e, dmg, dtype, proj){
  if (e.shield>0){ e.shield--; return; }                          // khiên chặn theo SỐ đòn
  if (proj && e.db.evade && Math.random()<e.db.evade) return;     // né chỉ với đạn
  const r = (e.db.resist && e.db.resist[dtype]!=null) ? e.db.resist[dtype] : 1;
  e.hp -= dmg * r;
}

// ---- NGƯỜI CHƠI TỰ ĐỘNG (theo chiến lược) ----
function aiSpend(s, strat){
  const have=t=>s.units.filter(u=>u.type===t);
  const laneHas=(t,r)=>s.units.some(u=>u.type===t&&u.row===r);
  const occ=(c,r)=>s.units.some(u=>u.col===c&&u.row===r);
  const buy=(t,c,r)=>{ const cost=costOf(s,t); if(s.gold>=cost && !occ(c,r)){ s.gold-=cost; s.units.push({type:t,col:c,row:r,level:1}); return true;} return false; };
  const up=(u)=>{ const c=Math.round(UNITS[u.type].cost*Math.pow(TUNE.upgradePow,u.level)); if(u.level<3&&s.gold>=c){ s.gold-=c; u.level++; return true;} return false; };
  const nextCell=()=>{ for(let c=3;c<=8;c++) for(let r=0;r<ROWS;r++) if(!occ(c,r)) return [c,r]; return null; };
  const minerCell=()=>{ const n=have('miner').length; return [Math.floor(n/ROWS), n%ROWS]; };
  // tỉ lệ dàn cân đối (đủ 4 loại sát thương để khắc mọi quái)
  const targets = strat==='mono' ? {archer:60} : {mage:6, ice:5, poison:5, gunner:4, archer:4};
  let g=0;
  while(g++<400){ let act=false;
    if(have('miner').length<3){ const mc=minerCell(); if(buy('miner',mc[0],mc[1]))act=true; }
    else { for(let r=0;r<ROWS;r++){ if(!laneHas('knight',r)&&buy('knight',9,r)){act=true;break;} } } // tuyến đầu chắn
    if(!act){ // chọn loại THIẾU nhất so với tỉ lệ mục tiêu; nếu loại cần nhất chưa đủ tiền -> để dành (không mua bừa)
      const types=Object.keys(targets);
      const need=types.map(t=>({t, deficit:targets[t]-have(t).length})).filter(o=>o.deficit>0).sort((a,b)=>b.deficit-a.deficit);
      if(need.length){ const cell=nextCell();
        if(cell){ const top=need[0];
          if(s.gold>=costOf(s,top.t)){ if(buy(top.t,cell[0],cell[1]))act=true; }
          else { // để dành cho loại cần nhất, trừ khi loại khác cũng thiếu mà rẻ hơn nhiều
            const cheap=need.find(o=>s.gold>=costOf(s,o.t) && costOf(s,o.t)<=costOf(s,top.t)*0.6);
            if(cheap && buy(cheap.t,cell[0],cell[1]))act=true;
          }
        }
      }
    }
    if(!act && s.gold > costOf(s,'miner')*3 && have('miner').length<12){ const mc=minerCell(); if(buy('miner',mc[0],mc[1]))act=true; }
    if(!act){ const order=s.units.filter(u=>UNITS[u.type].type!=='econ').sort((a,b)=>a.level-b.level); for(const u of order){ if(up(u)){act=true;break;} } }
    if(!act) break;
  }
  while(s.sp>0){ const T=s.talents; if(T.h<3){T.h++;s.hp+=100;s.maxHp+=100;} else if(T.d<10)T.d++; else if(T.c<5)T.c++; else if(T.s<10)T.s++; else break; s.sp--; }
}

function gainXp(s,a){ s.xp+=a; while(s.xp>=s.maxXp){ s.xp-=s.maxXp; s.level++; s.sp++; s.maxXp=Math.floor(100*Math.pow(1.5,s.level-1)); } }

// ---- ĐỢT theo CHỦ ĐỀ (ép người chơi đổi/kết hợp tướng) ----
function waveTheme(w){ if(w<=3) return 'intro'; if(w%5===0) return 'boss'; return ['swarm','armor','fast','mixed'][(w-4)%4]; }
function pick(theme){ const r=Math.random();
  switch(theme){
    case 'intro':  return r<0.25?'orc':'imp';
    case 'swarm':  return r<0.65?'imp':(r<0.85?'summoner':'orc');
    case 'armor':  return r<0.6?'orc':(r<0.8?'skel':'imp');
    case 'fast':   return r<0.5?'wolf':(r<0.8?'assassin':'imp');
    case 'mixed':  return ['imp','orc','wolf','skel','summoner','assassin'][Math.floor(r*6)];
    case 'boss':   return ['imp','orc','wolf','skel'][Math.floor(r*4)];
  }
}
function buildWave(w, T, US){ const mp=diffScale(T||{d:0,s:0,h:0,c:0}, US||{});
  const hm=Math.pow(TUNE.hpScale,w-1)*mp, count=Math.round(waveCount(w)*(1+(mp-1)*0.25)), interval=waveInterval(w), theme=waveTheme(w);
  const q=[]; for(let i=0;i<count;i++){ let k=pick(theme); if(i===count-1&&theme==='boss')k='boss'; q.push({d:i*interval, db:E[k], m:hm}); }
  return { queue:q, total:count, theme };
}

function makeEnemy(db,m,w){ return { db, hp:db.hp*m, x:SPAWN_X, row:Math.floor(Math.random()*ROWS), atkCd:0, kb:0, shield:db.shield||0, slowT:0, slowAmt:0, jp:false, summonT:4, spdMul:1+(w-1)*TUNE.speedScale }; }

function fireUnit(s,u,T){
  const US=s.unitSkills, sb=uskBonus(US,u.type), st=unitStats(u,T,US), db=UNITS[u.type], ux=cellX(u.col), crit=critMul(T), dmg=st.dmg*crit;
  const ahead=e=>e.row===u.row && (e.x-ux)>-GRID*0.5 && Math.abs(e.x-ux)<=st.rng;
  if(db.type==='melee'){ const blk=s.enemies.filter(e=>e.row===u.row&&(e.x-ux)>0&&(e.x-ux)<GRID*0.6).sort((a,b)=>a.x-b.x)[0]; if(blk){ const bonus=(u.level>=3?0.3:0)+sb.reflect; hurt(blk,dmg*(1+bonus),'phys',false); u._cd=st.aspd; } }
  else if(db.type==='linear'){ const ts=s.enemies.filter(ahead).sort((a,b)=>a.x-b.x); if(ts.length){ s.projs.push({row:u.row,x:ux,tgt:ts[0],dmg,dtype:'phys',pierce:(u.level>=3||sb.earlyPierce),speed:760}); u._cd=st.aspd; } }
  else if(db.type==='gunner'){ const ts=s.enemies.filter(ahead).sort((a,b)=>a.x-b.x); if(ts.length){ const ex=(u.level>=3||sb.earlyExplode); s.projs.push({row:u.row,x:ux,tgt:ts[0],dmg,dtype:'phys',splash:ex?GRID*1.2*(1+sb.splash):0,speed:600}); u._cd=st.aspd; } }
  else if(db.type==='lob'){ const ts=s.enemies.filter(ahead).sort((a,b)=>a.x-b.x); if(ts.length){ const tg=ts[0],mx=(u.level>=3||sb.earlyFreeze),R=GRID*(mx?2.0:db.splash);
      s.enemies.forEach(e=>{ if(Math.hypot(e.x-tg.x,(e.row-tg.row)*GRID)<=R){ hurt(e,dmg,'frost',true); e.slowT=mx?3.5:1.5; e.slowAmt=Math.min(0.9,(mx?0.8:0.4)+sb.slow); } }); u._cd=st.aspd; } }
  else if(db.type==='laser'){ const ts=s.enemies.filter(e=>Math.hypot(e.x-ux,(e.row-u.row)*GRID)<=st.rng).sort((a,b)=>a.x-b.x); if(ts.length){ const tg=ts[0]; hurt(tg,dmg,'magic',false);
      if(u.level>=3||sb.earlyChain){ let ch=2,cur=tg,hl=[tg]; while(ch>0){ const n=s.enemies.filter(e=>!hl.includes(e)&&Math.hypot(e.x-cur.x,(e.row-cur.row)*GRID)<150)[0]; if(!n)break; hurt(n,dmg*0.7,'magic',false); cur=n; hl.push(n); ch--; } }
      u._cd=st.aspd; } }
  else if(db.type==='pulse'){ const hit=s.enemies.filter(e=>Math.hypot(e.x-ux,(e.row-u.row)*GRID)<=st.rng); if(hit.length){ hit.forEach(e=>{ hurt(e,dmg,'pois',false); if(u.level>=3||sb.earlySlow){e.slowT=2;e.slowAmt=0.5;} }); u._cd=st.aspd; } }
}

function updateEnemy(s,e){
  if(e.slowT>0)e.slowT-=DT;
  if(e.kb>0&&!e.db.isHeavy){ e.x+=e.kb*DT; e.kb-=DT*120; if(e.kb<0)e.kb=0; return; }
  if(e.atkCd>0)e.atkCd-=DT;
  if(e.db.summons){ e.summonT-=DT; if(e.summonT<=0){ e.summonT=5; s.enemies.push(makeEnemy(E.imp,1,s.wave)); } }
  let blk=null; for(const u of s.units){ if(u.row===e.row&&UNITS[u.type].type!=='econ'&&UNITS[u.type].type!=='pulse'){ const d=e.x-cellX(u.col); if(d>0&&d<GRID*0.6){blk=u;break;} } }
  if(blk){ if(e.db.jump&&!e.jp){ e.x-=GRID*1.2; e.jp=true; } else if(e.atkCd<=0){ blk._hp=(blk._hp??UNITS[blk.type].hp*Math.pow(1.4,blk.level-1))-e.db.dmg; e.atkCd=e.db.aspd; if(!e.db.isHeavy)e.kb=5; if(blk._hp<=0)s.units=s.units.filter(x=>x!==blk); } }
  else { e.x -= e.db.spd*(e.spdMul||1)*(e.slowT>0?(1-e.slowAmt):1)*DT; }
}

function simWave(s,w,strat){
  const sp=buildWave(w, s.talents, s.unitSkills); const wallMp=1+(diffScale(s.talents,s.unitSkills)-1)*0.5; let tL=0; s.leaks=0;
  let mt=s.units.filter(u=>u.type==='miner').map(u=>unitStats(u,s.talents,s.unitSkills).cd);
  s.units.forEach(u=>u._cd=Math.random()*0.3);
  while((sp.queue.length>0||s.enemies.length>0)&&tL<600&&s.hp>0){
    tL+=DT; s.time+=DT;
    for(let i=sp.queue.length-1;i>=0;i--){ const it=sp.queue[i]; it.d-=DT; if(it.d<=0){ s.enemies.push(makeEnemy(it.db,it.m,w)); sp.queue.splice(i,1); } }
    const miners=s.units.filter(u=>u.type==='miner'); miners.forEach((u,i)=>{ mt[i]=(mt[i]??unitStats(u,s.talents,s.unitSkills).cd)-DT; if(mt[i]<=0){ const st=unitStats(u,s.talents,s.unitSkills); s.gold+=st.inc; mt[i]=st.cd; } });
    for(const u of s.units){ if(UNITS[u.type].type==='econ')continue; u._cd-=DT; if(u._cd>0)continue; fireUnit(s,u,s.talents); }
    for(let i=s.projs.length-1;i>=0;i--){ const pr=s.projs[i],tg=pr.tgt; if(tg._gone||tg.hp<=0){ s.projs.splice(i,1); continue; } pr.x+=pr.speed*DT;
      if(pr.x>=tg.x){ hurt(tg,pr.dmg,pr.dtype,true); if(pr.splash)s.enemies.forEach(e=>{ if(e!==tg&&Math.hypot(e.x-tg.x,(e.row-tg.row)*GRID)<=pr.splash)hurt(e,pr.dmg*0.7,pr.dtype,false); }); if(pr.pierce)s.enemies.forEach(e=>{ if(e!==tg&&e.row===pr.row&&e.x>tg.x)hurt(e,pr.dmg,pr.dtype,true); }); s.projs.splice(i,1); } }
    for(const e of s.enemies)updateEnemy(s,e);
    for(let i=s.enemies.length-1;i>=0;i--){ const e=s.enemies[i];
      if(e.x<WALL_X){ s.hp-=e.db.dmg*(1+(w-1)*TUNE.wallScale)*wallMp; s.leaks++; e._gone=true; s.enemies.splice(i,1); continue; }
      if(e.hp<=0){ s.gold+=e.db.gold; gainXp(s,e.db.xp); e._gone=true; s.enemies.splice(i,1); } }
    if(Math.abs(s.time%0.5)<DT)aiSpend(s,strat);
  }
  if(s.hp>0)s.gold+=TUNE.waveBonusBase+w*TUNE.waveBonusPer;
  return { t:tL, theme:sp.theme, total:sp.total };
}

function comp(s){ const m={}; s.units.forEach(u=>m[u.type]=(m[u.type]||0)+1); return Object.entries(m).map(([k,v])=>`${v}${k.slice(0,2)}`).join(' '); }

function run(strat, profile, maxWave=35, verbose=true){
  const s=newState(profile);
  if(verbose){ console.log(`\n=== ${strat.toUpperCase()} | ${profile.toUpperCase()} (độ khó ×${diffScale(s.talents,s.unitSkills).toFixed(2)}) ===`);
    console.log(`đợt | chủ đề  | quái | rò rỉ | máuThành | vàng | nhận xét`); console.log('-'.repeat(70)); }
  for(let w=1;w<=maxWave;w++){ s.wave=w; aiSpend(s,strat);
    const r=simWave(s,w,strat);
    let note=''; if(s.hp<=0)note='💀 THUA'; else if(r.leaks===0)note='dễ'; else if(s.hp<s.maxHp*0.35)note='⚠️ căng'; else note='ổn';
    if(verbose) console.log(`${String(w).padStart(3)} | ${r.theme.padEnd(7)} | ${String(r.total).padStart(4)} | ${String(s.leaks).padStart(5)} | ${String(Math.max(0,Math.round(s.hp))).padStart(8)} | ${String(Math.round(s.gold)).padStart(5)} | ${note}`);
    if(s.hp<=0){ if(verbose)console.log(`>>> SỤP ở ĐỢT ${w} (chủ đề ${r.theme}). Quân: ${comp(s)}`); return w; }
  }
  if(verbose)console.log(`>>> sống hết ${maxWave} đợt. Quân: ${comp(s)}`); return maxWave+1;
}

// godlike = MAX cả Nội Tại chung + MỌI kỹ năng tướng (người chơi cày lâu = tình huống cuối)
run('balanced','godlike');
console.log(`\n================ TỔNG HỢP (điểm SỤP, trung bình) ================`);
for(const p of ['fresh','maxed','godlike']){
  let mS=0,bS=0,N=4; for(let i=0;i<N;i++){ mS+=run('mono',p,40,false); bS+=run('balanced',p,40,false); }
  console.log(`${p.padEnd(7)}: spam 1 loại sụp ~đợt ${(mS/N).toFixed(0).padStart(2)} | kết hợp khắc chế ~đợt ${(bS/N).toFixed(0)}`);
}
