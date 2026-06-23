#!/usr/bin/env node
/* ============================================================================
 * GATE LUCK SIM — Kỷ Nguyên Thủ Thành
 *
 * Mục tiêu:
 * - Giả lập đúng tư duy người chơi ở cổng màn 6:
 *   kẹt boss -> quay lại farm màn 5 để đủ Thần Sét Hóa Thần.
 * - Thử cơ chế thưởng may mắn: EXP, kim cương, Ngộ đạo +SP.
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
  skillCosts: [2, 2, 3],          // thử nghiệm: tổng 7 SP để mở kỹ năng Hóa Thần
  replayGemRate: 0.15,
  targetFarmMin: 4,
  targetFarmMax: 8,
  xpNeed(level) { return Math.floor(120 + Math.pow(Math.max(1, level), 1.58) * 74 + level * 16); },
  spPerLevel(level) { return level % 5 === 0 ? 2 : 1; },
};

const STAGES = [
  { n: 'Bìa Rừng', waves: 6, mul: 1.0, reward: 30 },
  { n: 'Rừng Rậm', waves: 7, mul: 1.25, reward: 35 },
  { n: 'Đầm Lầy', waves: 7, mul: 1.5, reward: 40 },
  { n: 'Hẻm Núi', waves: 8, mul: 1.85, reward: 45 },
  { n: 'Lò Dung Nham', waves: 9, mul: 2.2, reward: 55 },
  { n: 'Đỉnh Lửa ⚔TRÙM', waves: 9, mul: 2.6, reward: 80 },
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

function baseXp(stageIndex, first = true) {
  const st = STAGES[stageIndex];
  const base = (first ? 70 : 25) + (stageIndex + 1) * (first ? 16 : 7) + st.waves * (first ? 6 : 2) + st.mul * (first ? 10 : 4);
  return Math.round(base * 2.35);
}

function fresh(seed, luckBias = 0) {
  return {
    rng: rng(seed), luckBias,
    level: 1, xp: 0, sp: 0, gems: 0,
    mageUnlocked: false, mageSkill: 0,
    luckDry: 0, luckEvents: 0, bigLuck: 0,
    log: [],
  };
}

function addXp(s, xp) {
  s.xp += xp;
  while (s.xp >= CFG.xpNeed(s.level)) {
    s.xp -= CFG.xpNeed(s.level);
    s.level++;
    s.sp += CFG.spPerLevel(s.level);
  }
}

function luckReward(s, xp, gems, mode) {
  const pity = Math.min(0.12, s.luckDry * 0.018);
  const bias = s.luckBias || 0;
  const r1 = Math.max(0, Math.min(0.999, s.rng() - bias * 0.07 - pity));
  const r2 = Math.max(0, Math.min(0.999, s.rng() - bias * 0.06 - pity * 0.6));
  const r3 = Math.max(0, Math.min(0.999, s.rng() - bias * 0.04 - Math.min(0.18, s.luckDry * 0.025)));
  let xpMul = 1, gemMul = 1, bonusSp = 0, tags = [];

  if (r1 < 0.035) { xpMul = 1.75; tags.push('Đại ngộ EXP'); s.bigLuck++; }
  else if (r1 < 0.14) { xpMul = 1.35; tags.push('May EXP'); }
  else if (r1 < 0.42) { xpMul = 1.15; tags.push('Lộc EXP'); }

  if (r2 < 0.025) { gemMul = 2.0; tags.push('Bội thu kim cương'); s.bigLuck++; }
  else if (r2 < 0.10) { gemMul = 1.5; tags.push('May kim cương'); }
  else if (r2 < 0.32) { gemMul = 1.2; tags.push('Lộc kim cương'); }

  // Chỉ bật Ngộ đạo mạnh khi người chơi đang farm đúng màn chuẩn bị boss.
  if (mode === 'gateFarm' && r3 < 0.20) { bonusSp = 1; tags.push('Ngộ đạo +1SP'); s.bigLuck++; }

  if (tags.length) { s.luckEvents++; s.luckDry = 0; } else s.luckDry++;
  return { xp: Math.round(xp * xpMul), gems: Math.round(gems * gemMul), sp: bonusSp, text: tags.join(' + ') || '-' };
}

function spendForMageGod(s) {
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
}

function clearStage(s, stageIndex, { first = true, farm = false } = {}) {
  let xp = baseXp(stageIndex, first);
  let gems = first ? STAGES[stageIndex].reward : Math.max(3, Math.round(STAGES[stageIndex].reward * CFG.replayGemRate));
  if (farm && stageIndex === 4) xp = Math.round(xp * 1.55); // farm đúng Lò Dung Nham để luyện boss lửa
  const rw = luckReward(s, xp, gems, farm && stageIndex === 4 ? 'gateFarm' : 'clear');
  addXp(s, rw.xp);
  s.gems += rw.gems;
  s.sp += rw.sp;
  spendForMageGod(s);
  s.log.push({ stage: stageIndex + 1, farm, level: s.level, sp: s.sp, gems: s.gems, mageSkill: s.mageSkill, reward: rw.text });
}

function simulate(seed, luckBias = 0) {
  const s = fresh(seed, luckBias);
  // Người chơi qua 1-5, biết màn 5 và màn 6 đều gợi ý Thần Sét nên ưu tiên giữ tài nguyên cho mage.
  for (let i = 0; i <= 4; i++) clearStage(s, i, { first: true });

  const before = { level: s.level, sp: s.sp, gems: s.gems, mageUnlocked: s.mageUnlocked, mageSkill: s.mageSkill };

  // Màn 6 nếu chưa đủ Thần Sét Hóa Thần thì coi như kẹt boss và farm màn 5.
  let farms = 0;
  while (s.mageSkill < 3 && farms < 20) {
    clearStage(s, 4, { first: false, farm: true });
    farms++;
  }
  const after = { level: s.level, sp: s.sp, gems: s.gems, mageUnlocked: s.mageUnlocked, mageSkill: s.mageSkill };
  const stage6Pass = s.mageSkill >= 3;
  return { seed, luckBias, farms, stage6Pass, before, after, luckEvents: s.luckEvents, bigLuck: s.bigLuck, log: s.log };
}

function q(arr, p) { const a = [...arr].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * (a.length - 1)))]; }
function batch(name, luckBias) {
  const runs = [];
  for (let i = 1; i <= SEEDS; i++) runs.push(simulate(1000 + i * 131 + name.length, luckBias));
  const farms = runs.map(r => r.farms);
  return {
    name,
    passRate: +(runs.filter(r => r.stage6Pass).length / runs.length).toFixed(3),
    farmMin: Math.min(...farms), farmP25: q(farms, .25), farmP50: q(farms, .50), farmP75: q(farms, .75), farmMax: Math.max(...farms),
    luckP50: q(runs.map(r => r.luckEvents), .50), bigLuckP50: q(runs.map(r => r.bigLuck), .50),
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
    ? 'STAGE_6_GATE_OK'
    : 'NEEDS_TUNING';
  const out = { verdict, config: CFG, results };
  if (JSON_OUT) return console.log(JSON.stringify(out, null, 2));
  console.log('GATE LUCK SIM — Màn 6 / Thần Sét Hóa Thần');
  console.log('Verdict:', verdict);
  for (const r of results) {
    console.log(`- ${r.name}: pass=${r.passRate}, farm màn 5 min/p25/p50/p75/max=${r.farmMin}/${r.farmP25}/${r.farmP50}/${r.farmP75}/${r.farmMax}, luck p50=${r.luckP50}, big p50=${r.bigLuckP50}`);
  }
  console.log('\nSample bình thường:', JSON.stringify(normal.sample, null, 2));
}

if (require.main === module) main();
module.exports = { simulate, batch, CFG };
