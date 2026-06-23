#!/usr/bin/env node
/* ============================================================================
 * GATE LUCK SIM — Kỷ Nguyên Thủ Thành
 *
 * Mục tiêu:
 * - Giả lập đúng tư duy người chơi ở cổng màn 6:
 *   kẹt boss -> quay lại farm màn 5 để đủ Thần Sét Hóa Thần.
 * - Thử cơ chế nhân phẩm 2.0:
 *   1) Đòn đánh / kỹ năng có crit damage.
 *   2) Quái chết rơi EXP ngẫu nhiên, không cố định.
 *   3) Quái chết có tỉ lệ rơi kim cương.
 *   4) Trùm có tỉ lệ rớt kim cương lớn.
 *   5) Sau trận có bảng tổng kết EXP / kim cương / crit / may mắn.
 *   6) Nội tại chung có thêm chỉ số Sát Thương Chí Mạng.
 * - Không sửa gameplay thật. File này chỉ để cân bằng số liệu trước khi đưa vào game.
 *
 * Chạy:
 *   node tools/gate-luck-sim.js
 *   node tools/gate-luck-sim.js --json
 * ========================================================================== */

const JSON_OUT = process.argv.includes('--json');
const SEEDS = 500;

const CFG = {
  mageCost: 90,
  skillCosts: [2, 3, 5],              // thử nghiệm: tổng 10 SP để mở kỹ năng Hóa Thần
  replayGemRate: 0.15,
  targetFarmMin: 4,
  targetFarmMax: 8,

  // Cân bằng EXP: đủ để cày có tiến triển nhưng vẫn cần farm màn 5 trước boss 6.
  xpNeed(level) { return Math.floor(120 + Math.pow(Math.max(1, level), 1.62) * 80 + level * 18); },
  spPerLevel(level) { return level % 5 === 0 ? 2 : 1; },

  // Nhân phẩm chiến đấu.
  baseCritChance: 0.06,
  baseCritDamage: 1.50,
  critDmgTalentStep: 0.10,            // mỗi điểm Sát Thương Chí Mạng +10% crit damage
  critDmgTalentMax: 10,

  // Nhân phẩm rơi đồ.
  normalDiamondDropBase: 0.003,
  normalDiamondDropPerStage: 0.0007,
  gateFarmDiamondBonus: 0.003,
  gateFarmInsightSpChance: 0.25,      // Ngộ đạo +1SP khi farm đúng màn chuẩn bị boss
  bossDiamondDropChance: 0.35,
};

const STAGES = [
  { n: 'Bìa Rừng', waves: 6, mul: 1.0, reward: 30 },
  { n: 'Rừng Rậm', waves: 7, mul: 1.25, reward: 35 },
  { n: 'Đầm Lầy', waves: 7, mul: 1.5, reward: 40 },
  { n: 'Hẻm Núi', waves: 8, mul: 1.85, reward: 45 },
  { n: 'Lò Dung Nham', waves: 9, mul: 2.2, reward: 55 },
  { n: 'Đỉnh Lửa ⚔TRÙM', waves: 9, mul: 2.6, reward: 80, boss: true },
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
function enemyCount(stageIndex) { return Array.from({ length: STAGES[stageIndex].waves }, (_, i) => waveCount(i + 1)).reduce((a, b) => a + b, 0); }
function enemyBaseXp(stageIndex) { return (2.5 + stageIndex * 0.75 + STAGES[stageIndex].mul * 0.9) * 0.65; }
function stageClearXp(stageIndex, first = true) {
  const st = STAGES[stageIndex];
  const base = (first ? 70 : 25) + (stageIndex + 1) * (first ? 16 : 7) + st.waves * (first ? 6 : 2) + st.mul * (first ? 10 : 4);
  return Math.round(base * 0.9);
}

function fresh(seed, luckBias = 0) {
  return {
    rng: rng(seed), luckBias,
    level: 1, xp: 0, sp: 0, gems: 0,
    mageUnlocked: false, mageSkill: 0,
    critDmgTalent: 0,
    luckDry: 0,
    totals: { xp: 0, gems: 0, enemyXp: 0, clearXp: 0, enemyGems: 0, bossGems: 0, insightSp: 0, critHits: 0, attacks: 0, luckEvents: 0, bigLuck: 0 },
    log: [],
  };
}

function addXp(s, xp) {
  s.xp += xp;
  s.totals.xp += xp;
  while (s.xp >= CFG.xpNeed(s.level)) {
    s.xp -= CFG.xpNeed(s.level);
    s.level++;
    s.sp += CFG.spPerLevel(s.level);
  }
}

function rollEnemyXp(s, stageIndex) {
  const r = Math.max(0, Math.min(0.999, s.rng() - s.luckBias * 0.04));
  let mult = 0.75, tag = 'Ít EXP';
  if (r < 0.02) { mult = 2.20; tag = 'Đại ngộ EXP quái'; s.totals.bigLuck++; }
  else if (r < 0.09) { mult = 1.60; tag = 'May EXP quái'; }
  else if (r < 0.31) { mult = 1.25; tag = 'Lộc EXP quái'; }
  else if (r < 0.84) { mult = 1.00; tag = 'EXP thường'; }
  return { xp: Math.max(1, Math.round(enemyBaseXp(stageIndex) * mult)), tag };
}

function rollCrit(s) {
  const critChance = CFG.baseCritChance;
  const critDamage = CFG.baseCritDamage + s.critDmgTalent * CFG.critDmgTalentStep;
  const attacks = 7 + s.mageSkill * 2 + s.critDmgTalent;
  let critHits = 0;
  for (let i = 0; i < attacks; i++) if (s.rng() < critChance) critHits++;
  s.totals.attacks += attacks;
  s.totals.critHits += critHits;
  return 1 + critHits * (critDamage - 1) / Math.max(1, attacks);
}

function luckClearReward(s, clearXp, gems, mode) {
  const pity = Math.min(0.12, s.luckDry * 0.018);
  const bias = s.luckBias || 0;
  const r1 = Math.max(0, Math.min(0.999, s.rng() - bias * 0.07 - pity));
  const r2 = Math.max(0, Math.min(0.999, s.rng() - bias * 0.06 - pity * 0.6));
  const r3 = Math.max(0, Math.min(0.999, s.rng() - bias * 0.04 - Math.min(0.18, s.luckDry * 0.025)));
  let xpMul = 1, gemMul = 1, bonusSp = 0, tags = [];

  if (r1 < 0.035) { xpMul = 1.75; tags.push('Đại ngộ EXP trận'); s.totals.bigLuck++; }
  else if (r1 < 0.14) { xpMul = 1.35; tags.push('May EXP trận'); }
  else if (r1 < 0.42) { xpMul = 1.15; tags.push('Lộc EXP trận'); }

  if (r2 < 0.025) { gemMul = 2.0; tags.push('Bội thu kim cương'); s.totals.bigLuck++; }
  else if (r2 < 0.10) { gemMul = 1.5; tags.push('May kim cương'); }
  else if (r2 < 0.32) { gemMul = 1.2; tags.push('Lộc kim cương'); }

  if (mode === 'gateFarm' && r3 < CFG.gateFarmInsightSpChance + bias * 0.05) {
    bonusSp = 1;
    tags.push('Ngộ đạo +1SP');
    s.totals.bigLuck++;
  }

  if (tags.length) { s.totals.luckEvents += tags.length; s.luckDry = 0; }
  else s.luckDry++;

  return { xp: Math.round(clearXp * xpMul), gems: Math.round(gems * gemMul), sp: bonusSp, tags };
}

function spendForPlan(s) {
  // Người chơi biết màn 5/6 là cổng Thần Sét nên dồn kim cương và SP cho mage trước.
  if (!s.mageUnlocked && s.gems >= CFG.mageCost) {
    s.gems -= CFG.mageCost;
    s.mageUnlocked = true;
  }
  while (s.mageUnlocked && s.mageSkill < 3) {
    const cost = CFG.skillCosts[s.mageSkill];
    if (s.sp < cost) break;
    s.sp -= cost;
    s.mageSkill++;
  }
  // Khi đã đủ Thần Sét Hóa Thần, điểm dư mới đổ vào nội tại Sát Thương Chí Mạng.
  while (s.mageSkill >= 3 && s.sp > 0 && s.critDmgTalent < CFG.critDmgTalentMax) {
    s.sp--;
    s.critDmgTalent++;
  }
}

function clearStage(s, stageIndex, { first = true, farm = false } = {}) {
  const before = { level: s.level, sp: s.sp, gems: s.gems, mageSkill: s.mageSkill, critDmgTalent: s.critDmgTalent };
  const mode = farm && stageIndex === 4 ? 'gateFarm' : 'clear';
  const count = enemyCount(stageIndex);
  let enemyXp = 0, enemyGems = 0, enemyLuckTags = 0;

  for (let i = 0; i < count; i++) {
    const ex = rollEnemyXp(s, stageIndex);
    enemyXp += ex.xp;
    if (ex.tag !== 'EXP thường' && ex.tag !== 'Ít EXP') enemyLuckTags++;
    const dropRate = CFG.normalDiamondDropBase + stageIndex * CFG.normalDiamondDropPerStage + (mode === 'gateFarm' ? CFG.gateFarmDiamondBonus : 0) + Math.max(0, s.luckBias) * 0.0015;
    if (s.rng() < dropRate) enemyGems++;
  }

  let bossGems = 0;
  if (STAGES[stageIndex].boss && s.rng() < CFG.bossDiamondDropChance + s.luckBias * 0.08) {
    bossGems = [8, 10, 12, 15][Math.floor(s.rng() * 4)];
    s.totals.bigLuck++;
  }

  const clearBase = stageClearXp(stageIndex, first);
  const baseGems = first ? STAGES[stageIndex].reward : Math.max(3, Math.round(STAGES[stageIndex].reward * CFG.replayGemRate));
  const rw = luckClearReward(s, clearBase, baseGems, mode);
  const critPower = rollCrit(s);
  const finalEnemyXp = Math.round(enemyXp * critPower);
  const totalXp = finalEnemyXp + rw.xp;
  const totalGems = enemyGems + bossGems + rw.gems;

  s.totals.enemyXp += finalEnemyXp;
  s.totals.clearXp += rw.xp;
  s.totals.enemyGems += enemyGems;
  s.totals.bossGems += bossGems;
  s.totals.gems += totalGems;
  s.totals.insightSp += rw.sp;
  s.totals.luckEvents += enemyLuckTags;

  addXp(s, totalXp);
  s.gems += totalGems;
  s.sp += rw.sp;
  spendForPlan(s);

  const after = { level: s.level, sp: s.sp, gems: s.gems, mageSkill: s.mageSkill, critDmgTalent: s.critDmgTalent };
  s.log.push({
    stage: stageIndex + 1,
    name: STAGES[stageIndex].n,
    farm,
    before,
    after,
    summary: {
      enemyKills: count,
      enemyXp: finalEnemyXp,
      clearXp: rw.xp,
      totalXp,
      enemyGems,
      bossGems,
      clearGems: rw.gems,
      totalGems,
      critHits: s.totals.critHits,
      attacks: s.totals.attacks,
      luck: [...rw.tags, enemyLuckTags ? `EXP quái may x${enemyLuckTags}` : null, bossGems ? `Boss rớt ${bossGems}💎` : null].filter(Boolean),
    },
  });
}

function canPassStage6(s) {
  // Ở bản giả lập này, điều kiện qua boss 6 là Thần Sét đủ 3 bậc + level đủ nền.
  return s.mageSkill >= 3 && s.level >= 6;
}

function simulate(seed, luckBias = 0) {
  const s = fresh(seed, luckBias);
  for (let i = 0; i <= 4; i++) clearStage(s, i, { first: true, farm: false });

  const beforeGate = { level: s.level, sp: s.sp, gems: s.gems, mageUnlocked: s.mageUnlocked, mageSkill: s.mageSkill, critDmgTalent: s.critDmgTalent };
  let farms = 0;
  while (!canPassStage6(s) && farms < 20) {
    clearStage(s, 4, { first: false, farm: true });
    farms++;
  }
  const afterFarm = { level: s.level, sp: s.sp, gems: s.gems, mageUnlocked: s.mageUnlocked, mageSkill: s.mageSkill, critDmgTalent: s.critDmgTalent };
  const stage6Pass = canPassStage6(s);
  if (stage6Pass) clearStage(s, 5, { first: true, farm: false });

  return { seed, luckBias, farms, stage6Pass, beforeGate, afterFarm, totals: s.totals, lastMatchSummary: s.log[s.log.length - 1].summary, log: s.log };
}

function q(arr, p) { const a = [...arr].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * (a.length - 1)))]; }
function batch(name, luckBias) {
  const runs = [];
  for (let i = 1; i <= SEEDS; i++) runs.push(simulate(1000 + i * 131 + name.length, luckBias));
  const farms = runs.map(r => r.farms);
  const xp = runs.map(r => r.totals.xp);
  const gems = runs.map(r => r.totals.gems);
  const critRate = runs.map(r => r.totals.attacks ? r.totals.critHits / r.totals.attacks : 0);
  return {
    name,
    passRate: +(runs.filter(r => r.stage6Pass).length / runs.length).toFixed(3),
    farmMin: Math.min(...farms), farmP25: q(farms, .25), farmP50: q(farms, .50), farmP75: q(farms, .75), farmMax: Math.max(...farms),
    xpP50: q(xp, .50), gemsP50: q(gems, .50), critRateP50: +q(critRate, .50).toFixed(3),
    luckP50: q(runs.map(r => r.totals.luckEvents), .50), bigLuckP50: q(runs.map(r => r.totals.bigLuck), .50),
    sample: runs[0],
  };
}

function main() {
  const results = [
    batch('xui', -0.35),
    batch('binh_thuong', 0),
    batch('may_man', 0.35),
  ];
  const normal = results[1];
  const verdict = normal.passRate >= 0.98 && normal.farmP50 >= CFG.targetFarmMin && normal.farmP50 <= CFG.targetFarmMax
    ? 'LUCK_GATE_OK'
    : 'NEEDS_TUNING';
  const out = { verdict, config: CFG, results };
  if (JSON_OUT) return console.log(JSON.stringify(out, null, 2));

  console.log('GATE LUCK SIM — Nhân phẩm 2.0 / Màn 6');
  console.log('Verdict:', verdict);
  for (const r of results) {
    console.log(`- ${r.name}: pass=${r.passRate}, farm màn 5 min/p25/p50/p75/max=${r.farmMin}/${r.farmP25}/${r.farmP50}/${r.farmP75}/${r.farmMax}, xp50=${r.xpP50}, gem50=${r.gemsP50}, critRate50=${r.critRateP50}, luck p50=${r.luckP50}, big p50=${r.bigLuckP50}`);
  }
  console.log('\nSample bình thường:', JSON.stringify(normal.sample, null, 2));
}

if (require.main === module) main();
module.exports = { simulate, batch, CFG };
