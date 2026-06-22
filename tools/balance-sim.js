/* ============================================================================
 *  CAMPAIGN BALANCE SIM — Kỷ Nguyên Thủ Thành v3.0
 *
 *  Chạy: node tools/balance-sim.js
 *  Mục tiêu: kiểm tra nhanh 12 màn campaign, đường mở khoá Tinh Thạch,
 *  và các cổng khắc chế (Băng/Thần Sét/Độc/Pháo) có bị kẹt quá sớm không.
 *
 *  Đây là mô phỏng số nhanh, không thay thế playtest tay:
 *  - Không vẽ canvas, không mô phỏng cảm giác thao tác.
 *  - Đạn được tính gần như trúng tức thì, nên kết quả hơi lạc quan.
 *  - Có mô phỏng kháng/né/khiên/chậm/boss footprint ở mức đủ để so độ khó.
 * ========================================================================== */

const TUNE = {
  rows: 6,
  cols: 11,
  cell: 68,
  dt: 0.05,
  maxWaveSeconds: 180,
  startGold: 280,
  baseHp: 150,
  buyRamp: 1.11,
  upgradePow: 1.8,
  hpScale: 1.16,
  waveBonusBase: 20,
  waveBonusPer: 8,
  replayRewardRate: 0.3,
};

const HERO_COST = { miner: 0, knight: 0, archer: 0, gunner: 40, ice: 55, poison: 70, mage: 90, priest: 75 };

const STAGES = [
  { n: 'Bìa Rừng',          map: 0, waves: 6,  mul: 1.0,  themes: ['intro'],                 reward: 30 },
  { n: 'Rừng Rậm',          map: 0, waves: 7,  mul: 1.25, themes: ['intro', 'swarm'],        reward: 35 },
  { n: 'Đầm Lầy',           map: 0, waves: 7,  mul: 1.5,  themes: ['swarm', 'fast'],         rec: 'ice',    reward: 40 },
  { n: 'Hẻm Núi',           map: 1, waves: 8,  mul: 1.85, themes: ['fast', 'swarm'],         rec: 'ice',    reward: 45 },
  { n: 'Lò Dung Nham',      map: 1, waves: 9,  mul: 2.2,  themes: ['armor', 'swarm'],        rec: 'mage',   reward: 55 },
  { n: 'Đỉnh Lửa ⚔TRÙM',    map: 1, waves: 9,  mul: 2.6,  themes: ['mixed'], boss: true,     rec: 'mage',   reward: 80 },
  { n: 'Cổng Ngục',         map: 2, waves: 10, mul: 3.1,  themes: ['armor', 'fast'],         rec: 'mage',   reward: 60 },
  { n: 'Hành Lang Xương',   map: 2, waves: 10, mul: 3.7,  themes: ['mixed', 'armor'],        rec: 'poison', reward: 65 },
  { n: 'Hầm Sâu',           map: 2, waves: 11, mul: 4.4,  themes: ['fast', 'mixed'],         rec: 'poison', reward: 70 },
  { n: 'Ngai Hắc Ám ⚔TRÙM', map: 2, waves: 11, mul: 5.2,  themes: ['mixed'], boss: true,                   reward: 110 },
  { n: 'Vực Thẳm I',        map: 2, waves: 12, mul: 6.2,  themes: ['mixed'],                               reward: 90 },
  { n: 'Vực Thẳm II ⚔TRÙM', map: 1, waves: 12, mul: 7.6,  themes: ['mixed'], boss: true,                   reward: 150 },
];

const WAVE_THEMES = {
  intro: { tag: 'NHẬP MÔN', tids: [0, 0, 0, 0, 2] },
  swarm: { tag: 'BẦY ĐÀN',  tids: [0, 0, 0, 4, 1] },
  armor: { tag: 'GIÁP DÀY', tids: [1, 1, 1, 3, 0] },
  fast:  { tag: 'TỐC ĐỘ',   tids: [2, 2, 2, 5, 0] },
  mixed: { tag: 'HỖN HỢP',  tids: [0, 1, 2, 3, 4, 5] },
  boss:  { tag: 'TRÙM',     tids: [0, 1, 2, 3] },
};

const UNITS = {
  miner:  { type: 'econ',    cost: 50,  hp: 300, income: 14, cd: 4.0, name: 'Mỏ Vàng' },
  knight: { type: 'melee',   cost: 60,  hp: 700, dmg: 15, range: 1.2, aspd: 1.2, dtype: 'phys',  name: 'Giáp Sĩ' },
  archer: { type: 'linear',  cost: 90,  hp: 150, dmg: 32, range: 7.0, aspd: 1.0, dtype: 'phys',  name: 'Xạ Thủ' },
  gunner: { type: 'gunner',  cost: 130, hp: 200, dmg: 60, range: 6.5, aspd: 1.8, dtype: 'phys',  splash: 1.2, name: 'Pháo Thủ' },
  poison: { type: 'pulse',   cost: 120, hp: 250, dmg: 10, range: 2.6, aspd: 0.8, dtype: 'pois',  name: 'Tháp Độc' },
  mage:   { type: 'laser',   cost: 180, hp: 120, dmg: 40, range: 12,  aspd: 1.6, dtype: 'magic', name: 'Thần Sét' },
  ice:    { type: 'lob',     cost: 160, hp: 120, dmg: 35, range: 6.0, aspd: 2.0, dtype: 'frost', splash: 1.2, name: 'Băng Thần' },
  priest: { type: 'support', cost: 150, hp: 250, dmg: 30, range: 3.0, aspd: 2.0, dtype: 'magic', name: 'Thánh Sứ' },
};

const ENEMIES = [
  { kind: 'imp',      hp: 70,   spd: 30, dmg: 5,  aspd: 1.0, gold: 9,   xp: 15,  size: 0.6,  resist: {} },
  { kind: 'orc',      hp: 420,  spd: 16, dmg: 18, aspd: 1.5, gold: 22,  xp: 30,  size: 0.85, resist: { phys: 0.45, frost: 0.6, pois: 0.6, magic: 1.4 } },
  { kind: 'wolf',     hp: 60,   spd: 78, dmg: 8,  aspd: 0.8, gold: 9,   xp: 20,  size: 0.55, resist: { phys: 0.6, frost: 1.6 } },
  { kind: 'skel',     hp: 150,  spd: 16, dmg: 20, aspd: 1.5, gold: 30,  xp: 40,  size: 0.8,  shieldHits: 3, resist: { frost: 0.7 } },
  { kind: 'summoner', hp: 140,  spd: 15, dmg: 5,  aspd: 2.0, gold: 25,  xp: 35,  size: 0.7,  summons: true, resist: { phys: 0.5, magic: 1.5 } },
  { kind: 'assassin', hp: 120,  spd: 60, dmg: 25, aspd: 1.0, gold: 28,  xp: 35,  size: 0.6,  evade: 0.55, resist: { phys: 0.45, pois: 1.5, magic: 1.2 } },
  { kind: 'boss',     hp: 5200, spd: 11, dmg: 70, aspd: 2.0, gold: 300, xp: 600, size: 1.5,  isBoss: true, resist: { phys: 0.5, magic: 0.8, frost: 0.8, pois: 0.8 } },
];

function mulberry32(seed) {
  return function rng() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function waveCount(w) { return Math.round(4 + w * 1.5 + w * w * 0.12); }
function waveInterval(w) { return Math.max(0.45, 1.9 - w * 0.09); }
function costOf(state, type) { return Math.round(UNITS[type].cost * Math.pow(TUNE.buyRamp, state.units.filter(u => u.type === type).length)); }
function upgradeCost(u) { return Math.round(UNITS[u.type].cost * Math.pow(TUNE.upgradePow, u.level)); }
function unitXY(u) { return { x: (u.col + 0.5) * TUNE.cell, y: (u.row + 0.5) * TUNE.cell }; }
function enemyY(e) { return (e.row + 0.5 + (e.rowSpan === 2 ? 0.5 : 0)) * TUNE.cell; }
function occRows(e) { return e.rowSpan === 2 ? [e.row, e.row + 1].filter(r => r < TUNE.rows) : [e.row]; }
function sameLane(u, e) { return occRows(e).includes(u.row); }
function distUnitEnemy(u, e) { const p = unitXY(u); return Math.hypot(e.x - p.x, enemyY(e) - p.y); }

function newEnemy(row, waveMul, db, rng) {
  const safeRow = db.isBoss ? Math.min(row, TUNE.rows - 2) : row;
  return {
    db,
    row: safeRow,
    rowSpan: db.isBoss || db.size >= 1.2 ? 2 : 1,
    x: TUNE.cols * TUNE.cell + TUNE.cell,
    hp: db.hp * waveMul,
    maxHp: db.hp * waveMul,
    shield: db.shieldHits || 0,
    slow: 0,
    atk: 0,
    skill: db.isBoss ? 5 + rng() : 0,
  };
}

function newBattle(stage, campaign, seed) {
  return { stage, rng: mulberry32(seed), gold: TUNE.startGold, hp: TUNE.baseHp, wave: 1, units: [], enemies: [], kills: 0, leaks: 0, unlocked: new Set(campaign.unlocked) };
}

function dmgEnemy(state, e, amount, dtype, projectile) {
  if (e.shield > 0) { e.shield -= 1; return 0; }
  if (projectile && e.db.evade && state.rng() < e.db.evade) return 0;
  const r = e.db.resist && e.db.resist[dtype] != null ? e.db.resist[dtype] : 1;
  const dealt = amount * r;
  e.hp -= dealt;
  return dealt;
}

function killDead(state) {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    if (e.hp <= 0) { state.gold += e.db.gold; state.kills += 1; state.enemies.splice(i, 1); }
  }
}

function desiredTypesFor(stage, wave) {
  const theme = stage.boss && wave >= stage.waves ? 'boss' : stage.themes[(wave - 1) % stage.themes.length];
  const base = ['archer'];
  if (theme === 'swarm') base.unshift('gunner', 'ice', 'poison');
  if (theme === 'armor') base.unshift('mage', 'poison');
  if (theme === 'fast') base.unshift('ice', 'poison', 'mage');
  if (theme === 'mixed' || theme === 'boss') base.unshift('mage', 'ice', 'poison', 'gunner', 'priest');
  if (stage.rec) base.unshift(stage.rec);
  return [...new Set(base)];
}

function aiSpend(state) {
  const have = t => state.units.filter(u => u.type === t);
  const occupied = (c, r) => state.units.some(u => u.col === c && u.row === r);
  const buy = (type, col, row) => {
    if (!state.unlocked.has(type) || occupied(col, row)) return false;
    const cost = costOf(state, type);
    if (state.gold < cost) return false;
    state.gold -= cost;
    state.units.push({ type, col, row, level: 1, hp: UNITS[type].hp, cd: 0 });
    return true;
  };

  let guard = 0;
  while (guard++ < 80) {
    let acted = false;
    if (have('miner').length < 3) { const n = have('miner').length; if (buy('miner', 0, n % TUNE.rows)) { acted = true; continue; } }
    for (let r = 0; r < TUNE.rows && !acted; r++) if (!state.units.some(u => u.type === 'knight' && u.row === r)) acted = buy('knight', 9, r);
    if (acted) continue;

    const up = state.units.filter(u => u.type !== 'miner' && u.level < 3).sort((a, b) => a.level - b.level || upgradeCost(a) - upgradeCost(b))[0];
    if (up && state.gold >= upgradeCost(up) && state.units.length >= 12) { state.gold -= upgradeCost(up); up.level++; up.hp = UNITS[up.type].hp * Math.pow(1.4, up.level - 1); continue; }

    const wants = desiredTypesFor(state.stage, state.wave).filter(t => state.unlocked.has(t));
    const cells = [];
    for (let c = 3; c <= 7; c++) for (let r = 0; r < TUNE.rows; r++) if (!occupied(c, r)) cells.push([c, r]);
    if (!cells.length || !wants.length) break;

    const type = wants.map(t => ({ t, n: have(t).length, cost: costOf(state, t) })).filter(o => state.gold >= o.cost).sort((a, b) => a.n - b.n || wants.indexOf(a.t) - wants.indexOf(b.t))[0]?.t;
    if (!type) break;
    const [c, r] = cells[0];
    if (!buy(type, c, r)) break;
  }
}

function unitStats(u) {
  const db = UNITS[u.type], lvM = Math.pow(1.4, u.level - 1);
  if (db.type === 'econ') return { income: Math.floor(db.income * (u.level >= 3 ? 2 : lvM)), cd: db.cd };
  return { dmg: db.dmg * lvM, range: db.range * TUNE.cell * (db.type === 'pulse' && u.level >= 3 ? 1.3 : 1), aspd: db.aspd, splash: (db.splash || 0) * TUNE.cell * (u.level >= 3 ? 1.25 : 1) };
}

function updateUnits(state, dt) {
  for (const u of state.units) {
    const db = UNITS[u.type], st = unitStats(u); u.cd -= dt;
    if (db.type === 'econ') { if (u.cd <= 0) { state.gold += st.income; u.cd = st.cd; } continue; }
    if (u.cd > 0) continue;

    if (db.type === 'pulse') {
      const p = unitXY(u), targets = state.enemies.filter(e => Math.hypot(e.x - p.x, enemyY(e) - p.y) <= st.range);
      if (!targets.length) continue;
      for (const e of targets) { dmgEnemy(state, e, st.dmg, db.dtype, false); if (u.level >= 3) e.slow = Math.max(e.slow, 0.20); }
      u.cd = st.aspd; continue;
    }

    let candidates = state.enemies.filter(e => e.x > unitXY(u).x - TUNE.cell * 0.2);
    if (db.type !== 'laser') candidates = candidates.filter(e => sameLane(u, e));
    candidates = candidates.filter(e => distUnitEnemy(u, e) <= st.range).sort((a, b) => a.x - b.x);
    const target = candidates[0]; if (!target) continue;

    if (db.type === 'gunner' || db.type === 'lob') {
      const splash = st.splash || TUNE.cell;
      for (const e of state.enemies) {
        if ((sameLane(u, e) || Math.abs(enemyY(e) - enemyY(target)) <= TUNE.cell * 0.9) && Math.abs(e.x - target.x) <= splash) {
          dmgEnemy(state, e, st.dmg * (e === target ? 1 : 0.55), db.dtype, true);
          if (db.type === 'lob') e.slow = Math.max(e.slow, u.level >= 3 ? 0.55 : 0.35);
        }
      }
    } else if (db.type === 'laser' && u.level >= 3) {
      dmgEnemy(state, target, st.dmg, db.dtype, false);
      for (const e of state.enemies.filter(e => e !== target).sort((a, b) => Math.abs(a.x - target.x) - Math.abs(b.x - target.x)).slice(0, 2)) dmgEnemy(state, e, st.dmg * 0.45, db.dtype, false);
    } else {
      dmgEnemy(state, target, st.dmg, db.dtype, db.type !== 'melee' && db.type !== 'support');
    }
    u.cd = st.aspd;
  }
  killDead(state);
}

function updateEnemies(state, dt) {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i]; e.slow = Math.max(0, e.slow - dt * 0.4); e.skill -= dt;
    if (e.db.isBoss && e.skill <= 0) { for (const u of state.units.filter(u => distUnitEnemy(u, e) <= TUNE.cell * 1.8)) u.hp -= 45; if (e.hp < e.maxHp * 0.4) e.slow = 0; e.skill = e.hp < e.maxHp * 0.4 ? 3 : 5; }
    const blocker = state.units.filter(u => sameLane(u, e) && Math.abs(e.x - unitXY(u).x) < TUNE.cell * 0.55).sort((a, b) => b.col - a.col)[0];
    if (blocker) { e.atk -= dt; if (e.atk <= 0) { blocker.hp -= e.db.dmg; e.atk = e.db.aspd; } } else e.x -= e.db.spd * (1 - e.slow) * dt;
    if (e.x <= 0) { state.hp -= e.db.dmg; state.leaks++; state.enemies.splice(i, 1); }
  }
  state.units = state.units.filter(u => u.hp > 0);
}

function buildWave(state, wave) {
  const st = state.stage, hm = Math.pow(TUNE.hpScale, wave - 1) * st.mul, count = waveCount(wave), interval = waveInterval(wave);
  const theme = st.boss && wave >= st.waves ? 'boss' : st.themes[(wave - 1) % st.themes.length];
  const pool = WAVE_THEMES[theme].tids, queue = [];
  for (let i = 0; i < count; i++) { let tid = pool[Math.floor(state.rng() * pool.length)]; if (i === count - 1 && theme === 'boss') tid = 6; queue.push({ at: i * interval, db: ENEMIES[tid], row: Math.floor(state.rng() * TUNE.rows), mul: hm }); }
  return { queue, theme, count };
}

function runStage(stage, campaign, seed) {
  const state = newBattle(stage, campaign, seed), waveReports = [];
  for (let wave = 1; wave <= stage.waves; wave++) {
    state.wave = wave; aiSpend(state);
    const { queue, theme, count } = buildWave(state, wave);
    let t = 0, qi = 0, hpBefore = state.hp;
    while ((qi < queue.length || state.enemies.length > 0) && state.hp > 0 && t < TUNE.maxWaveSeconds) {
      while (qi < queue.length && queue[qi].at <= t) { const q = queue[qi++]; state.enemies.push(newEnemy(q.row, q.mul, q.db, state.rng)); }
      if (Math.floor(t * 2) !== Math.floor((t - TUNE.dt) * 2)) aiSpend(state);
      updateUnits(state, TUNE.dt); updateEnemies(state, TUNE.dt); t += TUNE.dt;
    }
    if (state.hp > 0) state.gold += TUNE.waveBonusBase + wave * TUNE.waveBonusPer;
    waveReports.push({ wave, theme, count, hpLost: hpBefore - state.hp, hp: state.hp, gold: Math.round(state.gold), units: state.units.length });
    if (state.hp <= 0) return { ok: false, failedWave: wave, state, waveReports };
  }
  return { ok: true, state, waveReports };
}

function makeCampaign() { return { gems: 0, stageProg: 0, unlocked: new Set(['miner', 'knight', 'archer']), cleared: new Set() }; }
function replayFarm(campaign, stageIndex) { if (stageIndex <= 0) return 0; const reward = Math.round(STAGES[stageIndex - 1].reward * TUNE.replayRewardRate); campaign.gems += reward; return reward; }
function buyCampaignHeroes(campaign, stage) {
  const priority = [];
  if (stage?.rec) priority.push(stage.rec);
  const themes = new Set(stage?.themes || []);
  if (themes.has('swarm')) priority.push('gunner');
  if (themes.has('fast')) priority.push('ice', 'poison');
  if (themes.has('armor')) priority.push('mage');
  priority.push('ice', 'mage', 'poison', 'gunner', 'priest');
  const bought = [];
  for (const type of [...new Set(priority)]) { const cost = HERO_COST[type]; if (cost > 0 && !campaign.unlocked.has(type) && campaign.gems >= cost) { campaign.gems -= cost; campaign.unlocked.add(type); bought.push(type); } }
  return bought;
}

function runCampaign() {
  const campaign = makeCampaign(), rows = [];
  for (let i = 0; i < STAGES.length; i++) {
    const stage = STAGES[i]; let farms = 0, farmGems = 0, boughtLog = [], result = null;
    for (let attempt = 1; attempt <= 8; attempt++) {
      const preBuy = buyCampaignHeroes(campaign, stage); if (preBuy.length) boughtLog.push(...preBuy.map(x => `${x}@${attempt}`));
      result = runStage(stage, campaign, 20260622 + i * 101 + attempt * 17);
      if (result.ok) break;
      if (i === 0) break;
      farmGems += replayFarm(campaign, i); farms++;
    }
    if (!result || !result.ok) { rows.push({ stage: i + 1, name: stage.n, ok: false, wave: `${result?.failedWave || '?'} / ${stage.waves}`, gems: campaign.gems, unlocked: [...campaign.unlocked].join(','), bought: boughtLog.join(',') || '-', hp: Math.round(result?.state?.hp || 0), farms, farmGems }); break; }
    const first = !campaign.cleared.has(i), reward = Math.round(stage.reward * (first ? 1 : TUNE.replayRewardRate));
    campaign.gems += reward; campaign.cleared.add(i); campaign.stageProg = Math.max(campaign.stageProg, i + 1);
    rows.push({ stage: i + 1, name: stage.n, ok: true, wave: `${stage.waves}/${stage.waves}`, gems: campaign.gems, unlocked: [...campaign.unlocked].join(','), bought: boughtLog.join(',') || '-', hp: Math.round(result.state.hp), farms, farmGems });
  }
  return { campaign, rows };
}

function pad(s, n) { s = String(s); return s.length >= n ? s : s + ' '.repeat(n - s.length); }
function printRows(rows) {
  console.log('CAMPAIGN BALANCE SIM v3.0 — deterministic quick check');
  console.log('Lưu ý: sim hơi lạc quan vì tính đạn gần như trúng tức thì. Cần playtest tay trên mobile.');
  console.log('Cột Farm = số lần phải chơi lại màn trước để đủ Tinh Thạch / lực qua màn.\n');
  console.log(`${pad('Màn', 4)} ${pad('Tên', 22)} ${pad('KQ', 6)} ${pad('Đợt', 7)} ${pad('HP', 6)} ${pad('Gems', 6)} ${pad('Farm', 5)} ${pad('Mua', 18)} Tướng đã mở`);
  console.log('-'.repeat(124));
  for (const r of rows) console.log(`${pad(r.stage, 4)} ${pad(r.name, 22)} ${pad(r.ok ? 'PASS' : 'FAIL', 6)} ${pad(r.wave, 7)} ${pad(r.hp, 6)} ${pad(r.gems, 6)} ${pad(r.farms, 5)} ${pad(r.bought, 18)} ${r.unlocked}`);
}

function runSingleStageFromArgs() {
  const args = process.argv.slice(2), stageArg = args.find(a => a.startsWith('--stage='));
  if (!stageArg) return false;
  const idx = Number(stageArg.split('=')[1]) - 1, stage = STAGES[idx]; if (!stage) throw new Error('Không có màn này. Dùng --stage=1..12');
  const unlocked = new Set(['miner', 'knight', 'archer']);
  const unlockedArg = args.find(a => a.startsWith('--unlocked=')); if (unlockedArg) unlockedArg.split('=')[1].split(',').filter(Boolean).forEach(x => unlocked.add(x));
  const result = runStage(stage, { gems: 0, stageProg: idx, unlocked, cleared: new Set() }, 20260622 + idx * 101);
  console.log(`Stage ${idx + 1}: ${stage.n}`); console.log(`Unlocked: ${[...unlocked].join(', ')}`); console.log(result.ok ? 'PASS' : `FAIL tại đợt ${result.failedWave}/${stage.waves}`);
  console.table(result.waveReports.map(w => ({ wave: w.wave, theme: w.theme, count: w.count, hpLost: Math.round(w.hpLost), hp: Math.round(w.hp), gold: w.gold, units: w.units })));
  return true;
}

if (!runSingleStageFromArgs()) { const { rows } = runCampaign(); printRows(rows); }
