/* ============================================================================
 *  TRÌNH MÔ PHỎNG CÂN BẰNG — "chơi" game tự động bằng đúng cơ chế trong index.html
 *  Mục đích: đo độ khó từng đợt (ai cũng chạy được: `node tools/balance-sim.js`)
 *  KHÔNG ảnh hưởng game thật; chỉ là công cụ phân tích số liệu.
 * ==========================================================================*/

// ---- HẰNG SỐ (đồng bộ với index.html) ----
const GRID = 68, ROWS = 6, COLS = 12, DT = 0.05;
const WALL_X = 0;                       // tường ở mép trái
const cellX = c => WALL_X + c * GRID + GRID / 2;
const SPAWN_X = WALL_X + COLS * GRID + GRID; // quái xuất hiện ngoài mép phải

// Chỉnh các "núm vặn" ở đây để thử nghiệm rồi mới chép sang game:
const TUNE = {
  startGold: 250,
  baseHp: 100,
  hpScale: 1.18,          // máu quái theo đợt (hàm mũ nhẹ -> không vách đứng)
  speedScale: 0.05,       // quái nhanh dần -> tràn lane -> rò rỉ tăng dần (vừa phải vì sim lạc quan)
  countBase: 10, countPerWave: 2.5,
  wallScale: 0.09,        // sát thương quái vào thành × (1+(w-1)*wallScale)
  waveBonusBase: 15, waveBonusPer: 6,
  upgradePow: 1.7,        // giá nâng cấp = cost * pow^level
  minerCap: 4, minerIncome: 12,
  goldFromDmgTalent: false, // sửa lỗi: talent sát thương KHÔNG tăng vàng
};

// Ghi đè tầm/giá để thử nghiệm (so với bản hiện tại trong game)
const OVERRIDE = {
  archer: { range: 6.0, cost: 90 },   // sniper tầm trung, không còn phủ cả map
  mage:   { range: 12.0 },            // GIỮ "toàn bản đồ, mọi hàng" nhưng đắt (180) -> không spam được
};

const UNITS = {
  miner:  { type:'econ', cost:50, hp:300, income:15, cd:4.0 },
  knight: { type:'melee', cost:60, hp:700, dmg:15, range:1.2, aspd:1.2 },
  archer: { type:'linear', cost:80, hp:150, dmg:32, range:13.0, aspd:1.0 },
  gunner: { type:'gunner', cost:130, hp:200, dmg:60, range:6.5, aspd:1.8 },
  poison: { type:'pulse', cost:120, hp:250, dmg:10, range:2.6, aspd:1.5 },
  mage:   { type:'laser', cost:180, hp:120, dmg:40, range:12.0, aspd:1.6 },
  ice:    { type:'lob', cost:160, hp:120, dmg:35, range:6.0, aspd:2.0, splash:1.2 },
};

const ENEMIES = [
  { kind:'imp',      hp:80,  spd:26, dmg:5,  aspd:1.0, gold:10, xp:15 },
  { kind:'orc',      hp:350, spd:18, dmg:18, aspd:1.5, gold:20, xp:30, isHeavy:true },
  { kind:'wolf',     hp:50,  spd:70, dmg:8,  aspd:0.8, gold:8,  xp:20 },
  { kind:'skel',     hp:150, spd:15, dmg:20, aspd:1.5, gold:30, xp:40, shield:3 },
  { kind:'summoner', hp:120, spd:16, dmg:5,  aspd:2.0, gold:25, xp:35, summons:true },
  { kind:'assassin', hp:100, spd:55, dmg:25, aspd:1.0, gold:25, xp:35, jump:true, evade:0.4 },
  { kind:'boss',     hp:4500,spd:11, dmg:70, aspd:2.0, gold:300,xp:600, isBoss:true },
];

// áp dụng override + thu nhập mỏ vàng từ TUNE
for (const k in OVERRIDE) Object.assign(UNITS[k], OVERRIDE[k]);
UNITS.miner.income = TUNE.minerIncome;

// Talent (Nội Tại) — giả lập người chơi có đầu tư theo cấp độ trong trận
function talentEffect(T){ return { d:T.d*0.1, s:T.s*0.05, h:T.h*100, c:T.c*0.05 }; }

// ---- TRẠNG THÁI ----
function newState(){
  return {
    gold: TUNE.startGold, hp: TUNE.baseHp, maxHp: TUNE.baseHp,
    wave: 0, level: 1, xp: 0, maxXp: 100, sp: 0,
    talents: { d:0, s:0, h:0, c:0 },
    units: [], enemies: [], projs: [], time: 0, leaksThisWave: 0,
  };
}

function unitStats(u, T){
  const db = UNITS[u.type], lvM = Math.pow(1.4, u.level-1), te = talentEffect(T);
  const dmgM = 1 + te.d, spdM = 1 + te.s;
  if (db.type==='econ') return { inc: Math.floor(db.income*(u.level>=3?2:lvM)), cd: db.cd, hp: db.hp*lvM };
  if (db.type==='pulse') return { hp:db.hp*lvM, dmg:db.dmg*lvM*dmgM, rng:db.range*GRID*(u.level>=3?1.3:1), aspd:db.aspd/spdM };
  return { hp:db.hp*lvM, dmg:db.dmg*lvM*dmgM, rng:db.range*GRID, aspd:db.aspd/spdM };
}
const critMul = T => 1 + (0.1 + talentEffect(T).c); // kỳ vọng (bạo kích ×2)

// ---- NGƯỜI CHƠI TỰ ĐỘNG: mua/đặt/nâng cấp như một game thủ hợp lý ----
function aiSpend(s){
  const T = s.talents;
  const have = type => s.units.filter(u=>u.type===type);
  const laneHas = (type,row) => s.units.some(u=>u.type===type && u.row===row);
  const buy = (type,col,row)=>{ if(s.gold>=UNITS[type].cost){ s.gold-=UNITS[type].cost; s.units.push({type,col,row,level:1}); return true;} return false; };
  const tryUpgrade = (u)=>{ const c=Math.floor(UNITS[u.type].cost*Math.pow(TUNE.upgradePow,u.level)); if(u.level<3 && s.gold>=c){ s.gold-=c; u.level++; return true;} return false; };

  let guard = 0;
  while (guard++ < 200) {
    let acted = false;
    // 1) Kinh tế: 3 mỏ vàng trước
    if (have('miner').length < 3 && buy('miner', 0, have('miner').length)) acted = true;
    // 2) Mỗi hàng 1 Giáp Sĩ chắn ở tiền tuyến (cột 8)
    else { for(let r=0;r<ROWS;r++){ if(!laneHas('knight',r) && buy('knight',8,r)){ acted=true; break; } } }
    // 3) Mỗi hàng 1 Xạ Thủ phía sau (cột 2)
    if(!acted){ for(let r=0;r<ROWS;r++){ if(!laneHas('archer',r) && buy('archer',2,r)){ acted=true; break; } } }
    // 4) Mỏ vàng thứ 4-5
    if(!acted && have('miner').length < TUNE.minerCap && buy('miner',0,have('miner').length)) acted=true;
    // 5) Xạ Thủ thứ 2 mỗi hàng (cột 3)
    if(!acted){ for(let r=0;r<ROWS;r++){ if(s.units.filter(u=>u.type==='archer'&&u.row===r).length<2 && buy('archer',3,r)){ acted=true; break; } } }
    // 6) Nâng cấp: Xạ Thủ rồi Giáp Sĩ lên 2, rồi lên 3
    if(!acted){ const order=[...have('archer'),...have('knight')].sort((a,b)=>a.level-b.level); for(const u of order){ if(tryUpgrade(u)){ acted=true; break; } } }
    // 7) Còn dư vàng -> lấp đầy bàn bằng DPS (Thần Sét/Pháo/Xạ) ở ô trống, nâng cấp luôn
    if(!acted){
      const occupied = (c,r)=>s.units.some(u=>u.col===c&&u.row===r);
      const dpsCycle=['mage','gunner','archer'];
      outer:
      for(let r=0;r<ROWS;r++) for(let c=4;c<=10;c++){ if(!occupied(c,r)){ for(const tp of dpsCycle){ if(buy(tp,c,r)){ acted=true; break outer; } } } }
    }
    // 8) Vẫn dư -> nâng mọi thứ lên max
    if(!acted){ const order=s.units.filter(u=>UNITS[u.type].type!=='econ').sort((a,b)=>a.level-b.level); for(const u of order){ if(tryUpgrade(u)){ acted=true; break; } } }
    if(!acted) break;
  }
  // Tiêu SP talent: ưu tiên máu nhà rồi sát thương (giống ảnh: dồn Gia Cố)
  while (s.sp>0){ if(T.h<5){T.h++;s.hp+=100;s.maxHp+=100;} else if(T.d<10)T.d++; else if(T.c<5)T.c++; else if(T.s<10)T.s++; else break; s.sp--; }
}

function gainXp(s, a){
  s.xp += a;
  while (s.xp >= s.maxXp){ s.xp -= s.maxXp; s.level++; s.sp++; s.maxXp = Math.floor(100*Math.pow(1.5, s.level-1)); }
}

// ---- XÂY ĐỢT (giống buildWave) ----
function buildWave(w){
  const hm = Math.pow(TUNE.hpScale, w-1), count = TUNE.countBase + Math.round(w*TUNE.countPerWave);
  const interval = 1.5 - Math.min(0.8, w*0.04);
  const q = [];
  for (let i=0;i<count;i++){
    let r=Math.random(), tid=0;
    if (w<3) tid = r<0.2?1:0;
    else if (w<6){ if(r<0.2)tid=2; else if(r<0.4)tid=1; else if(r<0.6)tid=3; }
    else { if(r<0.1)tid=2; else if(r<0.2)tid=1; else if(r<0.3)tid=4; else if(r<0.45)tid=3; else if(r<0.6)tid=5; }
    if (i===count-1 && w%5===0) tid=6;
    q.push({ d:i*interval, db:ENEMIES[tid], m:hm });
  }
  return { queue:q, total:count };
}

// ---- MỘT ĐỢT: mô phỏng thời gian thực ----
function simWave(s, w){
  const T = s.talents;
  const spawn = buildWave(w);
  let tLocal = 0; s.leaksThisWave = 0;
  let minerTimers = s.units.filter(u=>u.type==='miner').map(u=>unitStats(u,T).cd);
  s.units.forEach(u=> u._cd = Math.random()*0.3);

  // an toàn: trần thời gian 1 đợt
  while ((spawn.queue.length>0 || s.enemies.length>0) && tLocal < 600 && s.hp>0){
    tLocal += DT; s.time += DT;
    // spawn
    for (let i=spawn.queue.length-1;i>=0;i--){ const it=spawn.queue[i]; it.d-=DT; if(it.d<=0){ s.enemies.push(makeEnemy(it.db, it.m, w)); spawn.queue.splice(i,1); } }
    // mỏ vàng
    const miners = s.units.filter(u=>u.type==='miner');
    miners.forEach((u,idx)=>{ minerTimers[idx]=(minerTimers[idx]??unitStats(u,T).cd)-DT; if(minerTimers[idx]<=0){ const st=unitStats(u,T); s.gold+=st.inc; minerTimers[idx]=st.cd; } });
    // tướng đánh
    for (const u of s.units){ if(UNITS[u.type].type==='econ') continue; u._cd-=DT; if(u._cd>0) continue; fireUnit(s,u,T); }
    // đạn bay (đạn cam kết mục tiêu -> overkill khi cả lane dồn 1 con)
    for (let i=s.projs.length-1;i>=0;i--){ const pr=s.projs[i]; const tg=pr.tgt;
      if (tg._gone || tg.hp<=0){ s.projs.splice(i,1); continue; }   // mục tiêu đã chết/biến mất -> đạn phí
      pr.x += pr.speed*DT;
      if (pr.x >= tg.x){ // trúng
        damageEnemy(tg, pr.dmg);
        if (pr.splash){ s.enemies.forEach(e=>{ if(e!==tg && Math.hypot(e.x-tg.x,(e.row-tg.row)*GRID)<=pr.splash) damageEnemy(e, pr.dmg*0.7); }); }
        if (pr.pierce){ s.enemies.forEach(e=>{ if(e!==tg && e.row===pr.row && e.x>tg.x) damageEnemy(e, pr.dmg); }); }
        s.projs.splice(i,1);
      }
    }
    // quái di chuyển/đánh
    for (const e of s.enemies){ updateEnemy(s,e); }
    // dọn quái chết / rò rỉ
    for (let i=s.enemies.length-1;i>=0;i--){ const e=s.enemies[i];
      if (e.x < WALL_X){ const leak=e.db.dmg*(1+(w-1)*TUNE.wallScale); s.hp-=leak; s.leaksThisWave++; e._gone=true; s.enemies.splice(i,1); continue; }
      if (e.hp<=0){ const g=Math.floor(e.db.gold*(1+(TUNE.goldFromDmgTalent?talentEffect(T).d:0))); s.gold+=g; gainXp(s,e.db.xp); e._gone=true; s.enemies.splice(i,1); }
    }
    // mua giữa trận mỗi 1s (người chơi vẫn thao tác khi đang thủ)
    if (Math.floor(s.time*2)%2===0 && Math.abs((s.time%0.5))<DT) aiSpend(s);
  }
  // thưởng dọn đợt
  if (s.hp>0){ s.gold += TUNE.waveBonusBase + w*TUNE.waveBonusPer; }
  return tLocal;
}

function makeEnemy(db, m, w){ return { db, hp:db.hp*m, maxHp:db.hp*m, x:SPAWN_X, row:Math.floor(Math.random()*ROWS), atkCd:0, kb:0, shield:db.shield||0, slowT:0, slowAmt:0, jp:false, summonT:4, spdMul:1+(w-1)*TUNE.speedScale }; }

function damageEnemy(e, dmg){
  if (e.shield>0){ e.shield--; return; }
  if (e.db.evade && Math.random()<e.db.evade) return;
  e.hp -= dmg;
}

function fireUnit(s, u, T){
  const st = unitStats(u, T), db = UNITS[u.type], ux = cellX(u.col), crit = critMul(T);
  const inRowAhead = e => e.row===u.row && (e.x-ux) > -GRID*0.5 && Math.abs(e.x-ux) <= st.rng;
  if (db.type==='melee'){
    // chỉ đánh quái đang bị chắn ngay trước mặt
    const blk = s.enemies.filter(e=>e.row===u.row && (e.x-ux)>0 && (e.x-ux)<GRID*0.6).sort((a,b)=>a.x-b.x)[0];
    if (blk){ damageEnemy(blk, st.dmg*crit*(u.level>=3?1.3:1)); u._cd=st.aspd; }
  } else if (db.type==='linear'){
    // bắn đạn bay tới CON GẦN NHẤT (cam kết mục tiêu) -> nhiều xạ thủ dồn 1 con = overkill như game thật
    const ts = s.enemies.filter(inRowAhead).sort((a,b)=>a.x-b.x);
    if (ts.length){ s.projs.push({ row:u.row, x:ux, tgt:ts[0], dmg:st.dmg*crit, pierce:u.level>=3, speed:760 }); u._cd=st.aspd; }
  } else if (db.type==='gunner'){
    const ts = s.enemies.filter(inRowAhead).sort((a,b)=>a.x-b.x);
    if (ts.length){ s.projs.push({ row:u.row, x:ux, tgt:ts[0], dmg:st.dmg*crit, splash:u.level>=3?GRID*1.2:0, speed:600 }); u._cd=st.aspd; }
  } else if (db.type==='lob'){
    const ts = s.enemies.filter(inRowAhead).sort((a,b)=>a.x-b.x);
    if (ts.length){ const tgt=ts[0]; const R=GRID*(u.level>=3?2.0:db.splash);
      s.enemies.forEach(e=>{ if(Math.hypot(e.x-tgt.x,(e.row-tgt.row)*GRID)<=R){ damageEnemy(e, st.dmg*crit); e.slowT=u.level>=3?3.5:1.5; e.slowAmt=u.level>=3?0.8:0.4; } });
      u._cd=st.aspd; }
  } else if (db.type==='laser'){
    // mọi hàng, gần nhất trong tầm
    const ts = s.enemies.filter(e=>Math.hypot(e.x-ux,(e.row-u.row)*GRID)<=st.rng).sort((a,b)=>a.x-b.x);
    if (ts.length){ const tgt=ts[0]; damageEnemy(tgt, st.dmg*crit);
      if(u.level>=3){ let chains=2, cur=tgt, hit=[tgt]; while(chains>0){ const n=s.enemies.filter(e=>!hit.includes(e)&&Math.hypot(e.x-cur.x,(e.row-cur.row)*GRID)<150).sort((a,b)=>Math.hypot(a.x-cur.x,(a.row-cur.row)*GRID)-Math.hypot(b.x-cur.x,(b.row-cur.row)*GRID))[0]; if(!n)break; damageEnemy(n, st.dmg*crit*0.7); cur=n; hit.push(n); chains--; } }
      u._cd=st.aspd; }
  } else if (db.type==='pulse'){
    const hit = s.enemies.filter(e=>Math.hypot(e.x-ux,(e.row-u.row)*GRID)<=st.rng);
    if (hit.length){ hit.forEach(e=>{ damageEnemy(e, st.dmg*crit); if(u.level>=3){e.slowT=2;e.slowAmt=0.5;} }); u._cd=st.aspd; }
  }
}

function updateEnemy(s, e){
  if (e.slowT>0) e.slowT-=DT;
  if (e.kb>0 && !e.db.isHeavy){ e.x+=e.kb*DT; e.kb-=DT*120; if(e.kb<0)e.kb=0; return; }
  if (e.atkCd>0) e.atkCd-=DT;
  if (e.db.summons){ e.summonT-=DT; if(e.summonT<=0){ e.summonT=5; s.enemies.push(makeEnemy(ENEMIES[0],1,s.wave)); } }
  // bị chắn?
  let blk=null;
  for (const u of s.units){ if(u.row===e.row && UNITS[u.type].type!=='econ' && UNITS[u.type].type!=='pulse'){ const d=e.x-cellX(u.col); if(d>0 && d<GRID*0.6){ blk=u; break; } } }
  if (blk){
    if (e.db.jump && !e.jp){ e.x-=GRID*1.2; e.jp=true; }
    else if (e.atkCd<=0){ blk._hp=(blk._hp??unitStats(blk,s.talents).hp)-e.db.dmg; e.atkCd=e.db.aspd; if(!e.db.isHeavy)e.kb=5;
      if (blk._hp<=0){ s.units=s.units.filter(x=>x!==blk); } }
  } else {
    const spd = e.db.spd*(e.spdMul||1)*(e.slowT>0?(1-e.slowAmt):1);
    e.x -= spd*DT;
  }
}

// ---- CHẠY ----
function armyValue(s){ return s.units.reduce((a,u)=>{ let c=UNITS[u.type].cost; for(let l=1;l<u.level;l++)c+=Math.floor(UNITS[u.type].cost*Math.pow(TUNE.upgradePow,l)); return a+c; },0); }
function comp(s){ const m={}; s.units.forEach(u=>{ const k=u.type+u.level; m[k]=(m[k]||0)+1; }); return Object.entries(m).map(([k,v])=>`${v}×${k}`).join(' '); }

function run(maxWave=30){
  const s = newState();
  console.log(`đợt | quái | ΣmáuQuái | quânGiá | rò rỉ | máuThành | vàng | t(s) | nhận xét`);
  console.log('-'.repeat(96));
  for (let w=1; w<=maxWave; w++){
    s.wave=w; aiSpend(s);
    const sp = buildWave(w); const totHP = sp.queue.reduce((a,q)=>a+q.db.hp*q.m,0);
    const hpBefore = s.hp;
    const t = simWave(s, w);
    const leaks = s.leaksThisWave;
    let note = '';
    if (s.hp<=0){ note='💀 THUA'; }
    else if (leaks===0 && t < 200) note = 'quá dễ (0 rò rỉ)';
    else if (leaks<=2) note = 'dễ';
    else if (s.hp < hpBefore*0.4) note = '⚠️ căng';
    else note = 'ổn';
    console.log(
      `${String(w).padStart(3)} | ${String(sp.total).padStart(4)} | ${String(Math.round(totHP)).padStart(8)} | ${String(armyValue(s)).padStart(7)} | ${String(leaks).padStart(5)} | ${String(Math.max(0,Math.round(s.hp))).padStart(8)} | ${String(Math.round(s.gold)).padStart(5)} | ${String(Math.round(t)).padStart(4)} | ${note}`
    );
    if (s.hp<=0){ console.log(`\n>>> Phòng tuyến sụp ở ĐỢT ${w}. Quân: ${comp(s)} | Cấp ${s.level} talents d${s.talents.d}/h${s.talents.h}/c${s.talents.c}/s${s.talents.s}`); return; }
  }
  console.log(`\n>>> Sống sót hết ${maxWave} đợt mà KHÔNG thua. Quân cuối: ${comp(s)} | vàng dư ${Math.round(s.gold)} | Cấp ${s.level}`);
}

run(30);
