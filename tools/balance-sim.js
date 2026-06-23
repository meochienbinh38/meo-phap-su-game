/* ============================================================================
 *  CAMPAIGN BALANCE SIM — Kỷ Nguyên Thủ Thành v3.8
 *
 *  Chạy: node tools/balance-sim.js
 *  Mục tiêu: kiểm tra nhanh 16 màn campaign, đường mở khoá Tinh Thạch,
 *  và các cổng khắc chế (Băng/Thần Sét/Độc/Pháo) có bị kẹt quá sớm không.
 *
 *  Đây là mô phỏng số nhanh, không thay thế playtest tay:
 *  - Không vẽ canvas, không mô phỏng cảm giác thao tác.
 *  - Đạn được tính gần như trúng tức thì, nên kết quả hơi lạc quan.
 *  - Có mô phỏng kháng/né/khiên/chậm/boss footprint và meta SP ở mức đủ để so độ khó.
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

const HERO_COST = { miner: 0, knight: 0, archer: 0, gunner: 40, ice: 55, poison: 70, mage: 90, priest: 75, druid: 120, wind: 135 };
const TALENTS = {
  d: { max: 10, cost: () => 1 },
  s: { max: 10, cost: () => 1 },
  h: { max: 5, cost: () => 1 },
  c: { max: 5, cost: () => 1 },
};

const UNIT_SKILLS = {
  miner:  [ { cost: 2, income: .2 }, { cost: 4, income: .25 }, { cost: 7, cdMul: .75 } ],
  knight: [ { cost: 2, hp: .25 }, { cost: 4, reflect: .15 }, { cost: 7, hp: .3, reflect: .2 } ],
  archer: [ { cost: 2, aspd: .15 }, { cost: 4, dmg: .2 }, { cost: 7, earlyPierce: true } ],
  gunner: [ { cost: 2, dmg: .2 }, { cost: 4, splash: .4 }, { cost: 7, earlyExplode: true } ],
  poison: [ { cost: 2, dmg: .25 }, { cost: 4, range: .25 }, { cost: 7, earlySlow: true } ],
  mage:   [ { cost: 2, dmg: .2 }, { cost: 4, aspd: .15 }, { cost: 7, earlyChain: true } ],
  ice:    [ { cost: 2, dmg: .2 }, { cost: 4, slow: .2 }, { cost: 7, earlyFreeze: true } ],
  priest: [ { cost: 2, heal: .3 }, { cost: 4, range: .25 }, { cost: 7, earlyAura: true } ],
  druid:  [ { cost: 2, dmg: .2 }, { cost: 4, range: .25 }, { cost: 7, earlyRoot: true } ],
  wind:   [ { cost: 2, aspd: .15 }, { cost: 4, dmg: .2 }, { cost: 7, earlyGust: true } ],
};

const STAGES = [
  { n: 'Bìa Rừng',          map: 0, waves: 6,  mul: 1.0,  themes: ['intro'],                 reward: 30 },
  { n: 'Rừng Rậm',          map: 0, waves: 7,  mul: 1.25, themes: ['intro', 'swarm'],        reward: 35 },
  { n: 'Đầm Lầy',           map: 0, waves: 7,  mul: 1.5,  themes: ['swarm', 'fast'],         rec: 'ice',    reward: 40 },
  { n: 'Hẻm Núi',           map: 1, waves: 8,  mul: 1.85, themes: ['fast', 'swarm'],         rec: 'ice',    reward: 45 },
  { n: 'Lò Dung Nham',      map: 1, waves: 9,  mul: 2.2,  themes: ['armor', 'swarm'],        rec: 'mage',   reward: 55 },
  { n: 'Đỉnh Lửa ⚔TRÙM',    map: 1, waves: 9,  mul: 2.6,  themes: ['mixed'], boss: true,     rec: 'mage',   reward: 80 },
  { n: 'Cổng Ngục',         map: 2, waves: 10, mul: 3.5,  themes: ['armor', 'fast'],         rec: 'mage',   reward: 60 },
  { n: 'Hành Lang Xương',   map: 2, waves: 10, mul: 4.6,  themes: ['mixed', 'armor'],        rec: 'poison', reward: 65 },
  { n: 'Hầm Sâu',           map: 2, waves: 11, mul: 5.7,  themes: ['fast', 'mixed'],         rec: 'poison', reward: 70 },
  { n: 'Ngai Hắc Ám ⚔TRÙM', map: 2, waves: 11, mul: 6.3,  themes: ['mixed'], boss: true,                   reward: 110 },
  { n: 'Vực Thẳm I',        map: 2, waves: 12, mul: 8.1,  themes: ['mixed'],                               reward: 90 },
  { n: 'Vực Thẳm II ⚔TRÙM', map: 1, waves: 12, mul: 10.2, themes: ['mixed'], boss: true,                   reward: 150 },
  { n: 'Rừng Cổ Thụ',       map: 0, waves: 12, mul: 11.5, themes: ['root', 'mixed'],        rec: 'druid',  reward: 120 },
  { n: 'Đền Gió Lộng',      map: 0, waves: 13, mul: 7.8,  themes: ['spirit', 'fast'],       rec: 'wind',   reward: 130 },
  { n: 'Cấm Thành Xương',   map: 2, waves: 13, mul: 13.2, themes: ['root', 'spirit', 'mixed'], rec: 'druid', reward: 140 },
  { n: 'Thiên Môn ⚔TRÙM',   map: 1, waves: 14, mul: 15.8, themes: ['apex'], boss: true, bossTheme: 'apex', rec: 'wind', reward: 220 },
];

const WAVE_THEMES = {
  intro: { tag: 'NHẬP MÔN', tids: [0, 0, 0, 0, 2] },
  swarm: { tag: 'BẦY ĐÀN',  tids: [0, 0, 0, 4, 1] },
  armor: { tag: 'GIÁP DÀY', tids: [1, 1, 1, 3, 0] },
  fast:  { tag: 'TỐC ĐỘ',   tids: [2, 2, 2, 5, 0] },
  mixed: { tag: 'HỖN HỢP',  tids: [0, 1, 2, 3, 4, 5] },
  root:  { tag: 'THẠCH MỘC', tids: [7, 7, 1, 3, 0] },
  spirit:{ tag: 'HỒN MA',   tids: [8, 8, 5, 2, 4] },
  apex:  { tag: 'HỖN MANG', tids: [1, 2, 3, 4, 5, 7, 8] },
  boss:  { tag: 'TRÙM',     tids: [0, 1, 2, 3] },
};

const UNITS = {
  miner:  { type: 'econ',    cost: 50,  hp: 300, income: 14, cd: 4.0, name: 'Mỏ Vàng' },
  knight: { type: 'melee',   cost: 60,  hp: 700, dmg: 15, range: 1.2, aspd: 1.2, dtype: 'phys',  name: 'Giáp Sĩ' },
  archer: { type: 'linear',  cost: 90,  hp: 150, dmg: 32, range: 7.0, aspd: 1.0, dtype: 'phys',  name: 'Xạ Thủ' },
  gunner: { type: 'gunner',  cost: 130, hp: 200, dmg: 60, range: 6.5, aspd: 1.8, dtype: 'phys',  splash: 1.5, name: 'Pháo Thủ' },
  poison: { type: 'pulse',   cost: 120, hp: 250, dmg: 10, range: 2.6, aspd: 0.8, dtype: 'pois',  name: 'Tháp Độc' },
  mage:   { type: 'laser',   cost: 180, hp: 120, dmg: 40, range: 12,  aspd: 1.6, dtype: 'magic', name: 'Thần Sét' },
  ice:    { type: 'lob',     cost: 160, hp: 120, dmg: 35, range: 6.0, aspd: 2.0, dtype: 'frost', splash: 1.2, name: 'Băng Thần' },
  priest: { type: 'support', cost: 150, hp: 250, dmg: 30, range: 3.0, aspd: 2.0, dtype: 'magic', name: 'Thánh Sứ' },
  druid:  { type: 'pulse',   cost: 170, hp: 260, dmg: 16, range: 3.0, aspd: 1.1, dtype: 'nature', name: 'Cổ Mộc' },
  wind:   { type: 'linear',  cost: 155, hp: 140, dmg: 28, range: 8.0, aspd: 0.85, dtype: 'wind', name: 'Phong Linh' },
};

const ENEMIES = [
  { kind: 'imp',      hp: 70,   spd: 30, dmg: 5,  aspd: 1.0, gold: 9,   xp: 15,  size: 0.6,  resist: {} },
  { kind: 'orc',      hp: 420,  spd: 16, dmg: 18, aspd: 1.5, gold: 22,  xp: 30,  size: 0.85, resist: { phys: 0.45, frost: 0.6, pois: 0.6, magic: 1.4 } },
  { kind: 'wolf',     hp: 60,   spd: 78, dmg: 8,  aspd: 0.8, gold: 9,   xp: 20,  size: 0.55, resist: { phys: 0.6, frost: 1.6 } },
  { kind: 'skel',     hp: 150,  spd: 16, dmg: 20, aspd: 1.5, gold: 30,  xp: 40,  size: 0.8,  shieldHits: 3, resist: { frost: 0.7 } },
  { kind: 'summoner', hp: 140,  spd: 15, dmg: 5,  aspd: 2.0, gold: 25,  xp: 35,  size: 0.7,  summons: true, resist: { phys: 0.5, magic: 1.5 } },
  { kind: 'assassin', hp: 120,  spd: 60, dmg: 25, aspd: 1.0, gold: 28,  xp: 35,  size: 0.6,  evade: 0.55, resist: { phys: 0.45, pois: 1.5, magic: 1.2 } },
  { kind: 'boss',     hp: 5200, spd: 11, dmg: 70, aspd: 2.0, gold: 300, xp: 600, size: 1.5,  isBoss: true, resist: { phys: 0.5, magic: 0.8, frost: 0.8, pois: 0.8 } },
  { kind: 'golem',    hp: 920,  spd: 12, dmg: 34, aspd: 1.8, gold: 38,  xp: 70,  size: 1.05, isHeavy: true, shieldHits: 2, resist: { phys: 0.35, magic: 0.75, frost: 0.55, pois: 0.75, nature: 1.7, wind: 0.9 } },
  { kind: 'wraith',   hp: 190,  spd: 48, dmg: 20, aspd: 1.1, gold: 32,  xp: 60,  size: 0.7,  evade: 0.35, resist: { phys: 0.35, magic: 0.65, frost: 0.9, pois: 0.8, nature: 1.2, wind: 1.6 } },
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
function maxUnitLevel(campaign, type) { return (campaign.unitSkills[type] || 0) >= 3 ? 4 : 3; }
function upgradeCost(u) { return Math.round(UNITS[u.type].cost * Math.pow(TUNE.upgradePow, u.level) * (u.level >= 3 ? 1.15 : 1)); }
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
  const hp = TUNE.baseHp + (campaign.talents.h || 0) * 100;
  return { stage, rng: mulberry32(seed), gold: TUNE.startGold, hp, wave: 1, level: 1, xp: 0, maxXp: 100, units: [], enemies: [], kills: 0, leaks: 0, unlocked: new Set(campaign.unlocked), campaign };
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
    if (e.hp <= 0) { state.gold += e.db.gold; gainXp(state, e.db.xp); state.kills += 1; state.enemies.splice(i, 1); }
  }
}

function gainXp(state, amount) {
  state.xp += amount;
  while (state.xp >= state.maxXp) {
    state.xp -= state.maxXp;
    state.level += 1;
    state.campaign.tp += 1;
    state.maxXp = Math.floor(100 * Math.pow(1.5, state.level - 1));
  }
}

function stageWaveTheme(stage, wave) {
  if (stage?.boss && wave >= stage.waves) return stage.bossTheme || 'boss';
  if (stage?.themes?.length) return stage.themes[(wave - 1) % stage.themes.length];
  return 'mixed';
}

function desiredTypesFor(stage, wave) {
  const theme = stageWaveTheme(stage, wave);
  const base = ['archer'];
  if (theme === 'swarm') base.unshift('gunner', 'ice', 'poison');
  if (theme === 'armor') base.unshift('mage', 'poison');
  if (theme === 'fast') base.unshift('ice', 'poison', 'mage');
  if (theme === 'mixed' || theme === 'boss') base.unshift('mage', 'ice', 'poison', 'gunner', 'priest');
  if (theme === 'root') base.unshift('druid', 'mage', 'poison');
  if (theme === 'spirit') base.unshift('wind', 'druid', 'mage');
  if (theme === 'apex') base.unshift('wind', 'druid', 'mage', 'ice', 'poison', 'gunner', 'priest');
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

    const wants = desiredTypesFor(state.stage, state.wave).filter(t => state.unlocked.has(t));
    const priorityOf = (type) => wants.includes(type) ? wants.indexOf(type) : 99;
    const up = state.units
      .filter(u => u.type !== 'miner' && u.level < maxUnitLevel(state.campaign, u.type))
      .sort((a, b) => priorityOf(a.type) - priorityOf(b.type) || a.level - b.level || upgradeCost(a) - upgradeCost(b))[0];
    if (up && state.gold >= upgradeCost(up) && state.units.length >= 12) { state.gold -= upgradeCost(up); up.level++; up.hp = UNITS[up.type].hp * Math.pow(1.4, up.level - 1); continue; }

    const cells = [];
    for (let c = 3; c <= 7; c++) for (let r = 0; r < TUNE.rows; r++) if (!occupied(c, r)) cells.push([c, r]);
    if (!cells.length || !wants.length) break;

    const type = wants.map(t => ({ t, n: have(t).length, cost: costOf(state, t) })).filter(o => state.gold >= o.cost).sort((a, b) => a.n - b.n || wants.indexOf(a.t) - wants.indexOf(b.t))[0]?.t;
    if (!type) break;
    const [c, r] = cells[0];
    if (!buy(type, c, r)) break;
  }
}

function unitSkillBonus(campaign, type) {
  const tiers = UNIT_SKILLS[type] || [], n = campaign.unitSkills[type] || 0;
  const b = { dmg: 1, hp: 1, aspd: 1, range: 1, income: 1, splash: 1, cdMul: 1, reflect: 0, slow: 0 };
  for (let i = 0; i < n; i++) {
    const t = tiers[i];
    if (t.dmg) b.dmg += t.dmg;
    if (t.hp) b.hp += t.hp;
    if (t.aspd) b.aspd += t.aspd;
    if (t.range) b.range += t.range;
    if (t.income) b.income += t.income;
    if (t.splash) b.splash += t.splash;
    if (t.cdMul) b.cdMul *= t.cdMul;
    if (t.reflect) b.reflect += t.reflect;
    if (t.slow) b.slow += t.slow;
    if (t.earlyPierce) b.earlyPierce = true;
    if (t.earlyExplode) b.earlyExplode = true;
    if (t.earlyChain) b.earlyChain = true;
    if (t.earlyFreeze) b.earlyFreeze = true;
    if (t.earlySlow) b.earlySlow = true;
    if (t.earlyAura) b.earlyAura = true;
    if (t.earlyRoot) b.earlyRoot = true;
    if (t.earlyGust) b.earlyGust = true;
  }
  return b;
}

function unitStats(state, u) {
  const db = UNITS[u.type], god = u.level >= 4, lvM = Math.pow(1.4, u.level - 1) * (god ? 1.12 : 1);
  const camp = state.campaign, sb = unitSkillBonus(camp, u.type);
  const dmgMul = (1 + 0.10 * (camp.talents.d || 0)) * sb.dmg;
  const spdMul = (1 + 0.05 * (camp.talents.s || 0)) * sb.aspd;
  const critEv = 1 + (0.10 + 0.05 * (camp.talents.c || 0));
  const splashMul = db.type === 'lob'
    ? (god ? 2.45 : ((u.level >= 3 || sb.earlyFreeze) ? 2.0 : 1))
    : (db.type === 'gunner' ? (god ? 1.2 : 1) : 1);
  if (db.type === 'econ') return { income: Math.floor(db.income * (god ? 3.25 : (u.level >= 3 ? 2 : lvM)) * sb.income), cd: db.cd * sb.cdMul * (god ? 0.78 : 1) };
  return {
    ...sb,
    dmg: db.dmg * lvM * dmgMul * critEv,
    hp: db.hp * lvM * sb.hp,
    range: db.range * TUNE.cell * (db.type === 'pulse' ? (god ? 1.55 : (u.level >= 3 ? 1.3 : 1)) : 1) * sb.range,
    aspd: db.aspd / spdMul,
    splash: (db.splash || 0) * TUNE.cell * splashMul * sb.splash,
  };
}

function updateUnits(state, dt) {
  for (const u of state.units) {
    const db = UNITS[u.type], st = unitStats(state, u); u.cd -= dt;
    if (db.type === 'econ') { if (u.cd <= 0) { state.gold += st.income; u.cd = st.cd; } continue; }
    if (u.cd > 0) continue;
    if (st.hp) u.hp = Math.min(u.hp, st.hp);

    if (db.type === 'pulse') {
      const p = unitXY(u), targets = state.enemies.filter(e => Math.hypot(e.x - p.x, enemyY(e) - p.y) <= st.range);
      if (!targets.length) continue;
      for (const e of targets) {
        dmgEnemy(state, e, st.dmg, db.dtype, false);
        if (u.type === 'poison' && (u.level >= 3 || st.earlySlow)) e.slow = Math.max(e.slow, u.level >= 4 ? 0.65 : 0.50);
        if (u.type === 'druid' && (u.level >= 3 || st.earlyRoot)) e.slow = Math.max(e.slow, u.level >= 4 ? 0.85 : 0.65);
      }
      u.cd = st.aspd; continue;
    }
    if (db.type === 'support') {
      const wounded = state.units.filter(x => x !== u && distUnits(u, x) <= st.range && x.hp < unitStats(state, x).hp).sort((a, b) => a.hp - b.hp)[0];
      if (!wounded) continue;
      wounded.hp = Math.min(unitStats(state, wounded).hp, wounded.hp + st.dmg);
      u.cd = st.aspd; continue;
    }

    let candidates = state.enemies.filter(e => e.x > unitXY(u).x - TUNE.cell * 0.2);
    if (db.type !== 'laser') candidates = candidates.filter(e => sameLane(u, e));
    candidates = candidates.filter(e => distUnitEnemy(u, e) <= st.range).sort((a, b) => a.x - b.x);
    const target = candidates[0]; if (!target) continue;

    if (db.type === 'gunner' && !(u.level >= 3 || st.earlyExplode)) {
      dmgEnemy(state, target, st.dmg, db.dtype, true);
    } else if (db.type === 'gunner' || db.type === 'lob') {
      const splash = st.splash || TUNE.cell;
      for (const e of state.enemies) {
        if ((sameLane(u, e) || Math.abs(enemyY(e) - enemyY(target)) <= TUNE.cell * 0.9) && Math.abs(e.x - target.x) <= splash) {
          dmgEnemy(state, e, st.dmg * (e === target ? 1 : 0.55), db.dtype, true);
          if (db.type === 'lob') e.slow = Math.max(e.slow, (u.level >= 4 ? 0.88 : (u.level >= 3 || st.earlyFreeze ? 0.80 : 0.40)) + st.slow);
        }
      }
    } else if (db.type === 'laser' && (u.level >= 3 || st.earlyChain)) {
      dmgEnemy(state, target, st.dmg, db.dtype, false);
      const chainCount = u.level >= 4 ? 3 : 2, chainMul = u.level >= 4 ? 0.85 : 0.70;
      for (const e of state.enemies.filter(e => e !== target).sort((a, b) => Math.abs(a.x - target.x) - Math.abs(b.x - target.x)).slice(0, chainCount)) dmgEnemy(state, e, st.dmg * chainMul, db.dtype, false);
    } else {
      if (u.type === 'wind' && (u.level >= 3 || st.earlyGust)) {
        const windTargets = candidates.slice(0, u.level >= 4 ? 4 : 3);
        for (const e of windTargets) {
          dmgEnemy(state, e, st.dmg, db.dtype, true);
          e.x += u.level >= 4 ? 34 : 18;
          e.slow = Math.max(e.slow, u.level >= 4 ? 0.45 : 0.25);
        }
      } else {
        dmgEnemy(state, target, st.dmg, db.dtype, db.type !== 'melee' && db.type !== 'support');
      }
      if (db.type === 'melee') dmgEnemy(state, target, st.dmg * ((u.level >= 4 ? 0.55 : (u.level >= 3 ? 0.30 : 0)) + st.reflect), db.dtype, false);
    }
    u.cd = st.aspd;
  }
  killDead(state);
}

function distUnits(a, b) { return Math.hypot((a.col - b.col) * TUNE.cell, (a.row - b.row) * TUNE.cell); }

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
  const theme = stageWaveTheme(st, wave);
  const pool = WAVE_THEMES[theme].tids, queue = [];
  for (let i = 0; i < count; i++) { let tid = pool[Math.floor(state.rng() * pool.length)]; if (i === count - 1 && st.boss && wave >= st.waves) tid = 6; queue.push({ at: i * interval, db: ENEMIES[tid], row: Math.floor(state.rng() * TUNE.rows), mul: hm }); }
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

function makeCampaign() { return { gems: 0, stageProg: 0, tp: 0, talents: { d: 0, s: 0, h: 0, c: 0 }, unitSkills: {}, unlocked: new Set(['miner', 'knight', 'archer']), cleared: new Set() }; }
function replayFarm(campaign, stageIndex) { if (stageIndex <= 0) return 0; const reward = Math.round(STAGES[stageIndex - 1].reward * TUNE.replayRewardRate); campaign.gems += reward; return reward; }
function buyCampaignHeroes(campaign, stage) {
  const required = [];
  if (stage?.rec) required.push(stage.rec);
  const themes = new Set(stage?.themes || []);
  if (themes.has('swarm')) required.push('gunner');
  if (themes.has('fast')) required.push('ice');
  if (themes.has('armor')) required.push('mage');
  if (themes.has('root')) required.push('druid');
  if (themes.has('spirit')) required.push('wind');
  if (themes.has('apex')) required.push('wind', 'druid', 'mage');
  const optional = [];
  if (themes.has('fast')) optional.push('poison');
  if (themes.has('mixed') || stage?.boss) optional.push('poison', 'priest', 'gunner', 'ice', 'mage');
  if (themes.has('root')) optional.push('mage', 'poison');
  if (themes.has('spirit')) optional.push('druid', 'mage');
  if (themes.has('apex')) optional.push('ice', 'poison', 'gunner', 'priest');
  optional.push('ice', 'mage', 'poison', 'gunner', 'priest', 'druid', 'wind');
  const bought = [];
  for (const type of [...new Set(required)]) {
    const cost = HERO_COST[type];
    if (cost > 0 && !campaign.unlocked.has(type)) {
      if (campaign.gems < cost) return bought;
      campaign.gems -= cost; campaign.unlocked.add(type); bought.push(type);
    }
  }
  for (const type of [...new Set(optional)]) {
    const cost = HERO_COST[type];
    if (cost > 0 && !campaign.unlocked.has(type) && campaign.gems >= cost) { campaign.gems -= cost; campaign.unlocked.add(type); bought.push(type); }
  }
  return bought;
}

function spendMeta(campaign, stage) {
  const spent = [];
  const themes = new Set(stage?.themes || []);
  const godPriority = [];
  if (stage?.rec) godPriority.push(stage.rec);
  if (themes.has('root')) godPriority.push('druid');
  if (themes.has('spirit')) godPriority.push('wind', 'druid');
  if (themes.has('apex')) godPriority.push('wind', 'druid', 'mage', 'ice', 'poison');
  if (stage?.boss) godPriority.push('mage', 'ice', 'poison');
  const pendingGodSkill = () => [...new Set(godPriority)].some(type => {
    if (!campaign.unlocked.has(type)) return false;
    const lv = campaign.unitSkills[type] || 0;
    return lv < 3 && !!UNIT_SKILLS[type]?.[lv];
  });
  const buyTalent = (k) => {
    const t = TALENTS[k], cost = t.cost(campaign.talents[k] || 0);
    if ((campaign.talents[k] || 0) >= t.max || campaign.tp < cost) return false;
    campaign.tp -= cost; campaign.talents[k] = (campaign.talents[k] || 0) + 1; spent.push(k); return true;
  };
  const buySkill = (type) => {
    if (!campaign.unlocked.has(type)) return false;
    const lv = campaign.unitSkills[type] || 0, next = UNIT_SKILLS[type]?.[lv];
    if (!next || campaign.tp < next.cost) return false;
    campaign.tp -= next.cost; campaign.unitSkills[type] = lv + 1; spent.push(`${type}${lv + 1}`); return true;
  };
  let guard = 0;
  while (campaign.tp > 0 && guard++ < 80) {
    let acted = false;
    if ((campaign.talents.h || 0) < 1) acted = buyTalent('h');
    else if ((campaign.talents.d || 0) < 3) acted = buyTalent('d');
    else if ((campaign.talents.s || 0) < 2) acted = buyTalent('s');
    else if ((campaign.unitSkills.archer || 0) < 2) acted = buySkill('archer');
    else if (stage?.rec && (campaign.unitSkills[stage.rec] || 0) < 2) acted = buySkill(stage.rec);
    else {
      for (const type of [...new Set(godPriority)]) {
        if ((campaign.unitSkills[type] || 0) < 3 && buySkill(type)) { acted = true; break; }
      }
    }
    if (!acted && pendingGodSkill()) break;
    if (!acted && (campaign.talents.h || 0) < 2) acted = buyTalent('h');
    if (!acted && (campaign.talents.d || 0) < 6) acted = buyTalent('d');
    if (!acted && (campaign.talents.s || 0) < 5) acted = buyTalent('s');
    if (!acted && (campaign.talents.c || 0) < 3) acted = buyTalent('c');
    if (!acted) {
      for (const type of ['mage', 'ice', 'gunner', 'poison', 'druid', 'wind', 'knight', 'miner', 'priest', 'archer']) {
        if ((campaign.unitSkills[type] || 0) < 2 && buySkill(type)) { acted = true; break; }
      }
      if (!acted) for (const k of ['d', 's', 'c', 'h']) { if (buyTalent(k)) { acted = true; break; } }
      if (!acted) for (const type of ['wind', 'druid', 'mage', 'ice', 'gunner', 'poison', 'archer', 'knight', 'miner', 'priest']) {
        if (buySkill(type)) { acted = true; break; }
      }
    }
    if (!acted) break;
  }
  return spent;
}

function runCampaign() {
  const campaign = makeCampaign(), rows = [];
  for (let i = 0; i < STAGES.length; i++) {
    const stage = STAGES[i]; let farms = 0, farmGems = 0, boughtLog = [], result = null;
    for (let attempt = 1; attempt <= 8; attempt++) {
      const meta = spendMeta(campaign, stage); if (meta.length) boughtLog.push(`SP:${meta.join('+')}@${attempt}`);
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
  console.log('CAMPAIGN BALANCE SIM v3.8 — deterministic quick check');
  console.log('Lưu ý: sim hơi lạc quan vì tính đạn gần như trúng tức thì. Cần playtest tay trên mobile.');
  console.log('Cột Farm = số lần phải chơi lại màn trước để đủ Tinh Thạch / lực qua màn.\n');
  console.log(`${pad('Màn', 4)} ${pad('Tên', 22)} ${pad('KQ', 6)} ${pad('Đợt', 7)} ${pad('HP', 6)} ${pad('Gems', 6)} ${pad('Farm', 5)} ${pad('Mua', 18)} Tướng đã mở`);
  console.log('-'.repeat(124));
  for (const r of rows) console.log(`${pad(r.stage, 4)} ${pad(r.name, 22)} ${pad(r.ok ? 'PASS' : 'FAIL', 6)} ${pad(r.wave, 7)} ${pad(r.hp, 6)} ${pad(r.gems, 6)} ${pad(r.farms, 5)} ${pad(r.bought, 18)} ${r.unlocked}`);
}

function runSingleStageFromArgs() {
  const args = process.argv.slice(2), stageArg = args.find(a => a.startsWith('--stage='));
  if (!stageArg) return false;
  const idx = Number(stageArg.split('=')[1]) - 1, stage = STAGES[idx]; if (!stage) throw new Error(`Không có màn này. Dùng --stage=1..${STAGES.length}`);
  const unlocked = new Set(['miner', 'knight', 'archer']);
  const unlockedArg = args.find(a => a.startsWith('--unlocked=')); if (unlockedArg) unlockedArg.split('=')[1].split(',').filter(Boolean).forEach(x => unlocked.add(x));
  const result = runStage(stage, { gems: 0, stageProg: idx, unlocked, cleared: new Set() }, 20260622 + idx * 101);
  console.log(`Stage ${idx + 1}: ${stage.n}`); console.log(`Unlocked: ${[...unlocked].join(', ')}`); console.log(result.ok ? 'PASS' : `FAIL tại đợt ${result.failedWave}/${stage.waves}`);
  console.table(result.waveReports.map(w => ({ wave: w.wave, theme: w.theme, count: w.count, hpLost: Math.round(w.hpLost), hp: Math.round(w.hp), gold: w.gold, units: w.units })));
  return true;
}

if (!runSingleStageFromArgs()) { const { rows } = runCampaign(); printRows(rows); }
