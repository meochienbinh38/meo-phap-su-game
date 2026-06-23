#!/usr/bin/env node
/* ============================================================================
 * CAMPAIGN LUCK ECONOMY SIM — Kỷ Nguyên Thủ Thành
 *
 * Mục tiêu:
 * - Test từ đầu tới cuối 16 màn với cơ chế nhân phẩm 2.0.
 * - Kiểm tra sau khi mở toàn bộ tướng thì kim cương cuối game có dư quá nhiều không.
 * - Giả lập bot biết farm có mục tiêu ở các cổng boss/khắc chế.
 *
 * Chạy:
 *   node tools/campaign-luck-sim.js
 *   node tools/campaign-luck-sim.js --json
 *
 * Ghi chú kết quả thử ban đầu:
 * - Nếu chỉ dùng kim cương để mở tướng, cuối game sẽ dư rất nhiều.
 * - Cần thêm sink late-game: nâng sao tướng / reroll chỉ số / rương thần / nâng cấp nội tại bằng kim cương.
 * ========================================================================== */

const JSON_OUT = process.argv.includes('--json');
const SEEDS = 500;

const CFG = {
  replayGemRate: 0.15,
  skillCosts: [2, 3, 5],
  critChance: 0.06,
  critDamage: 1.5,
  critDmgTalentStep: 0.10,
  normalDiamondDropBase: 0.003,
  normalDiamondDropPerStage: 0.0007,
  farmDiamondBonus: 0.003,
  bossDiamondDropChance: 0.35,
  insightSpChance: 0.25,
  xpNeed(level) { return Math.floor(120 + Math.pow(Math.max(1, level), 1.62) * 80 + level * 18); },
  spPerLevel(level) { return level % 5 === 0 ? 2 : 1; },
};

const HERO_COST = { miner: 0, knight: 0, archer: 0, gunner: 40, ice: 55, poison: 70, mage: 90, priest: 75, druid: 120, wind: 135 };
const UNLOCK_ORDER = ['gunner', 'ice', 'mage', 'poison', 'priest', 'druid', 'wind'];

const STAGES = [
  { n: 'Bìa Rừng', waves: 6, mul: 1.0, reward: 30 },
  { n: 'Rừng Rậm', waves: 7, mul: 1.25, reward: 35 },
  { n: 'Đầm Lầy', waves: 7, mul: 1.5, rec: 'ice', reward: 40 },
  { n: 'Hẻm Núi', waves: 8, mul: 1.85, rec: 'ice', reward: 45 },
  { n: 'Lò Dung Nham', waves: 9, mul: 2.2, rec: 'mage', reward: 55 },
  { n: 'Đỉnh Lửa ⚔TRÙM', waves: 9, mul: 2.6, boss: true, rec: 'mage', reward: 80 },
  { n: 'Cổng Ngục', waves: 10, mul: 3.5, rec: 'mage', reward: 60 },
  { n: 'Hành Lang Xương', waves: 10, mul: 4.6, rec: 'poison', reward: 65 },
  { n: 'Hầm Sâu', waves: 11, mul: 5.7, rec: 'poison', reward: 70 },
  { n: 'Ngai Hắc Ám ⚔TRÙM', waves: 11, mul: 6.3, boss: true, reward: 110 },
  { n: 'Vực Thẳm I', waves: 12, mul: 8.1, reward: 90 },
  { n: 'Vực Thẳm II ⚔TRÙM', waves: 12, mul: 10.2, boss: true, reward: 150 },
  { n: 'Rừng Cổ Thụ', waves: 12, mul: 11.5, rec: 'druid', reward: 120 },
  { n: 'Đền Gió Lộng', waves: 13, mul: 7.8, rec: 'wind', reward: 130 },
  { n: 'Cấm Thành Xương', waves: 13, mul: 13.2, rec: 'druid', reward: 140 },
  { n: 'Thiên Môn ⚔TRÙM', waves: 14, mul: 15.8, boss: true, rec: 'wind', reward: 220 },
];

function rng(seed) {
  return function () {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function waveCount(w) { return Math.round(4 + w * 1.5 + w * w * 0.12); }
function enemyCount(i) { return Array.from({ length: STAGES[i].waves }, (_, k) => waveCount(k + 1)).reduce((a, b) => a + b, 0); }
function enemyBaseXp(i) { return (2.5 + i * 0.75 + STAGES[i].mul * 0.9) * 0.65; }
function stageClearXp(i, first = true) {
  const s = STAGES[i];
  const base = (first ? 70 : 25) + (i + 1) * (first ? 16 : 7) + s.waves * (first ? 6 : 2) + s.mul * (first ? 10 : 4);
  return Math.round(base * 0.9);
}
function fresh(seed, luckBias) {
  return {
    rand: rng(seed), luckBias,
    level: 1, xp: 0, sp: 0, gems: 0,
    unlocks: new Set(['miner', 'knight', 'archer']), skills: {}, critDmgTalent: 0,
    replays: 0, gates: [],
    totals: { xp: 0, gems: 0, spent: 0, enemyGems: 0, bossGems: 0, enemyXp: 0, clearXp: 0, insightSp: 0, critHits: 0, attacks: 0, luckEvents: 0, bigLuck: 0 },
  };
}
function addXp(c, amount) {
  c.xp += amount;
  c.totals.xp += amount;
  while (c.xp >= CFG.xpNeed(c.level)) {
    c.xp -= CFG.xpNeed(c.level);
    c.level++;
    c.sp += CFG.spPerLevel(c.level);
  }
}
function rollEnemyXp(c, i) {
  const r = Math.max(0, Math.min(0.999, c.rand() - c.luckBias * 0.04));
  let m = 0.75;
  if (r < 0.02) { m = 2.2; c.totals.bigLuck++; c.totals.luckEvents++; }
  else if (r < 0.09) { m = 1.6; c.totals.luckEvents++; }
  else if (r < 0.31) { m = 1.25; c.totals.luckEvents++; }
  else if (r < 0.84) m = 1.0;
  return Math.max(1, Math.round(enemyBaseXp(i) * m));
}
function rollCrit(c) {
  const attacks = 7 + Object.values(c.skills).reduce((a, b) => a + b, 0) + c.critDmgTalent;
  const critDamage = CFG.critDamage + c.critDmgTalent * CFG.critDmgTalentStep;
  let hits = 0;
  for (let i = 0; i < attacks; i++) if (c.rand() < CFG.critChance) hits++;
  c.totals.attacks += attacks;
  c.totals.critHits += hits;
  return 1 + hits * (critDamage - 1) / Math.max(1, attacks);
}
function rollClearLuck(c, clearXp, gems, farm) {
  let xpMul = 1, gemMul = 1, sp = 0;
  const r1 = Math.max(0, Math.min(0.999, c.rand() - c.luckBias * 0.07));
  const r2 = Math.max(0, Math.min(0.999, c.rand() - c.luckBias * 0.06));
  const r3 = Math.max(0, Math.min(0.999, c.rand() - c.luckBias * 0.04));
  if (r1 < 0.035) { xpMul = 1.75; c.totals.bigLuck++; c.totals.luckEvents++; }
  else if (r1 < 0.14) { xpMul = 1.35; c.totals.luckEvents++; }
  else if (r1 < 0.42) { xpMul = 1.15; c.totals.luckEvents++; }
  if (r2 < 0.025) { gemMul = 2.0; c.totals.bigLuck++; c.totals.luckEvents++; }
  else if (r2 < 0.10) { gemMul = 1.5; c.totals.luckEvents++; }
  else if (r2 < 0.32) { gemMul = 1.2; c.totals.luckEvents++; }
  if (farm && r3 < CFG.insightSpChance + c.luckBias * 0.05) { sp = 1; c.totals.insightSp++; c.totals.bigLuck++; c.totals.luckEvents++; }
  return { xp: Math.round(clearXp * xpMul), gems: Math.round(gems * gemMul), sp };
}
function clearStage(c, i, first, farm) {
  const count = enemyCount(i);
  let enemyXp = 0, enemyGems = 0;
  for (let k = 0; k < count; k++) {
    enemyXp += rollEnemyXp(c, i);
    const drop = CFG.normalDiamondDropBase + i * CFG.normalDiamondDropPerStage + (farm ? CFG.farmDiamondBonus : 0) + Math.max(0, c.luckBias) * 0.0015;
    if (c.rand() < drop) enemyGems++;
  }
  let bossGems = 0;
  if (STAGES[i].boss && c.rand() < CFG.bossDiamondDropChance + c.luckBias * 0.08) {
    bossGems = [8, 10, 12, 15][Math.floor(c.rand() * 4)];
    c.totals.bigLuck++; c.totals.luckEvents++;
  }
  const baseGems = first ? STAGES[i].reward : Math.max(3, Math.round(STAGES[i].reward * CFG.replayGemRate));
  const clear = rollClearLuck(c, stageClearXp(i, first), baseGems, farm);
  const finalEnemyXp = Math.round(enemyXp * rollCrit(c));
  const totalXp = finalEnemyXp + clear.xp;
  const totalGems = enemyGems + bossGems + clear.gems;
  c.totals.enemyXp += finalEnemyXp; c.totals.clearXp += clear.xp; c.totals.enemyGems += enemyGems; c.totals.bossGems += bossGems; c.totals.gems += totalGems;
  addXp(c, totalXp);
  c.gems += totalGems;
  c.sp += clear.sp;
}
function spendUnlock(c, h) {
  if (!c.unlocks.has(h) && c.gems >= HERO_COST[h]) {
    c.gems -= HERO_COST[h]; c.totals.spent += HERO_COST[h]; c.unlocks.add(h); return true;
  }
  return c.unlocks.has(h);
}
function skillUp(c, h) {
  if (!c.unlocks.has(h)) return false;
  const lv = c.skills[h] || 0;
  if (lv >= 3) return false;
  const cost = CFG.skillCosts[lv];
  if (c.sp < cost) return false;
  c.sp -= cost; c.skills[h] = lv + 1; return true;
}
function targetsFor(i) {
  if (i === 2 || i === 3) return ['ice'];
  if (i <= 6) return ['mage'];
  if (i <= 9) return ['poison', 'mage', 'ice'];
  if (i <= 11) return ['mage', 'gunner', 'ice', 'poison'];
  if (i <= 14) return ['druid', 'mage', 'gunner', 'ice', 'poison'];
  return ['wind', 'druid', 'mage', 'gunner', 'ice', 'poison'];
}
function spendPlan(c, targets) {
  for (const h of targets || []) {
    if (!spendUnlock(c, h)) return;
    while ((c.skills[h] || 0) < 3) if (!skillUp(c, h)) return;
  }
  for (const h of UNLOCK_ORDER) spendUnlock(c, h);
  for (const h of ['gunner', 'ice', 'mage', 'poison', 'druid', 'wind', 'knight', 'archer', 'priest', 'miner']) while (skillUp(c, h)) {}
  while (c.sp > 0 && c.critDmgTalent < 10 && Object.values(c.skills).reduce((a, b) => a + b, 0) >= 15) { c.sp--; c.critDmgTalent++; }
}
function god(c, h) { return (c.skills[h] || 0) >= 3; }
function canPass(c, i) {
  if (i === 5) return god(c, 'mage') && c.level >= 6;
  if (i === 9) return god(c, 'mage') && (c.skills.poison || 0) >= 2 && c.level >= 9;
  if (i === 11) return ['mage', 'gunner', 'ice', 'poison'].filter(h => god(c, h)).length >= 2 && c.level >= 11;
  if (i === 14) return god(c, 'druid') && c.level >= 13;
  if (i === 15) return god(c, 'wind') && Object.values(c.skills).filter(v => v >= 3).length >= 4 && c.level >= 15;
  const rec = STAGES[i].rec;
  return !rec || c.unlocks.has(rec);
}
function simulate(seed, luckBias) {
  const c = fresh(seed, luckBias);
  for (let i = 0; i < STAGES.length; i++) {
    spendPlan(c, targetsFor(i));
    let farms = 0;
    while (!canPass(c, i) && farms < 40) {
      clearStage(c, Math.max(0, i - 1), false, true);
      c.replays++; farms++;
      spendPlan(c, targetsFor(i));
    }
    if (farms) c.gates.push({ stage: i + 1, farms, cleared: canPass(c, i) });
    if (!canPass(c, i)) return { c, cleared: false, failedAt: i + 1 };
    clearStage(c, i, true, false);
    spendPlan(c, targetsFor(i + 1));
  }
  return { c, cleared: true, failedAt: null };
}
function quantile(values, p) { const a = [...values].sort((x, y) => x - y); return a[Math.floor((a.length - 1) * p)]; }
function batch(name, bias) {
  const runs = [];
  for (let i = 1; i <= SEEDS; i++) runs.push(simulate(1000 + i * 131 + name.length, bias));
  const gems = runs.map(r => r.c.gems);
  const earned = runs.map(r => r.c.totals.gems);
  const spent = runs.map(r => r.c.totals.spent);
  const replays = runs.map(r => r.c.replays);
  const levels = runs.map(r => r.c.level);
  const gods = runs.map(r => Object.values(r.c.skills).filter(v => v >= 3).length);
  return {
    name,
    passRate: +(runs.filter(r => r.cleared).length / runs.length).toFixed(3),
    failMost: runs.find(r => !r.cleared)?.failedAt || 0,
    finalGems: { min: Math.min(...gems), p25: quantile(gems, .25), p50: quantile(gems, .5), p75: quantile(gems, .75), max: Math.max(...gems) },
    earnedGemsP50: quantile(earned, .5), spentGemsP50: quantile(spent, .5), replaysP50: quantile(replays, .5), replaysP75: quantile(replays, .75), levelP50: quantile(levels, .5), godP50: quantile(gods, .5),
    sample: runs[0].c,
  };
}
function main() {
  const results = [batch('xui', -0.35), batch('binh_thuong', 0), batch('may_man', 0.35)];
  const normal = results[1];
  const verdict = normal.finalGems.p50 > 900 ? 'GEM_SURPLUS_TOO_HIGH' : (normal.passRate >= .95 ? 'OK_FOR_PROTOTYPE' : 'NEEDS_TUNING');
  const out = { verdict, results };
  if (JSON_OUT) return console.log(JSON.stringify(out, null, 2));
  console.log('CAMPAIGN LUCK ECONOMY SIM');
  console.log('Verdict:', verdict);
  for (const r of results) {
    console.log(`- ${r.name}: pass=${r.passRate}, gems min/p25/p50/p75/max=${r.finalGems.min}/${r.finalGems.p25}/${r.finalGems.p50}/${r.finalGems.p75}/${r.finalGems.max}, earned50=${r.earnedGemsP50}, spent50=${r.spentGemsP50}, replay50=${r.replaysP50}, replay75=${r.replaysP75}, lv50=${r.levelP50}, god50=${r.godP50}`);
  }
}
if (require.main === module) main();
module.exports = { simulate, batch, CFG };
