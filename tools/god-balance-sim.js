#!/usr/bin/env node
/* ============================================================================
 * GOD BALANCE SIM — Kỷ Nguyên Thủ Thành
 *
 * Mục tiêu:
 * - Thử thiết kế Hóa Thần + quái tiến hóa bên ngoài game thật.
 * - Cho bot tự mở tướng, tự cày, tự cộng kỹ năng, tự qua màn.
 * - Chỉ khi kết quả đạt ngưỡng cân bằng mới nên đưa vào index/sw gameplay.
 *
 * Chạy:
 *   node tools/god-balance-sim.js
 *   node tools/god-balance-sim.js --details
 *   node tools/god-balance-sim.js --json
 * ========================================================================== */

const args = new Set(process.argv.slice(2));
const DETAILS = args.has('--details');
const JSON_OUT = args.has('--json');

const TUNE = {
  replayRewardRate: 0.15,
  xpNeed: (level) => Math.floor(120 + Math.pow(Math.max(1, level), 1.62) * 82 + level * 18),
  spPerLevel: (level) => (level % 5 === 0 ? 2 : 1),
  winMargin: -0.15,
  skillCosts: [2, 3, 5],
  target: {
    maxGateReplaysBeforeStage12: 10,
    maxGateReplaysTotal: 28,
    minLateGodMargin: 0.06,
    maxLateGodMargin: 0.42,
  },
};

const HERO_COST = { miner: 0, knight: 0, archer: 0, gunner: 40, ice: 55, poison: 70, mage: 90, priest: 75, druid: 120, wind: 135 };
const STAGES = [
  { n: 'Bìa Rừng', waves: 6, mul: 1.0, themes: ['intro'], reward: 30 },
  { n: 'Rừng Rậm', waves: 7, mul: 1.25, themes: ['intro', 'swarm'], reward: 35 },
  { n: 'Đầm Lầy', waves: 7, mul: 1.5, themes: ['swarm', 'fast'], rec: 'ice', reward: 40 },
  { n: 'Hẻm Núi', waves: 8, mul: 1.85, themes: ['fast', 'swarm'], rec: 'ice', reward: 45 },
  { n: 'Lò Dung Nham', waves: 9, mul: 2.2, themes: ['armor', 'swarm'], rec: 'mage', reward: 55 },
  { n: 'Đỉnh Lửa ⚔TRÙM', waves: 9, mul: 2.6, themes: ['mixed'], boss: true, rec: 'mage', reward: 80 },
  { n: 'Cổng Ngục', waves: 10, mul: 3.5, themes: ['armor', 'fast'], rec: 'mage', reward: 60 },
  { n: 'Hành Lang Xương', waves: 10, mul: 4.6, themes: ['mixed', 'armor'], rec: 'poison', reward: 65 },
  { n: 'Hầm Sâu', waves: 11, mul: 5.7, themes: ['fast', 'mixed'], rec: 'poison', reward: 70 },
  { n: 'Ngai Hắc Ám ⚔TRÙM', waves: 11, mul: 6.3, themes: ['mixed'], boss: true, reward: 110 },
  { n: 'Vực Thẳm I', waves: 12, mul: 8.1, themes: ['mixed'], reward: 90 },
  { n: 'Vực Thẳm II ⚔TRÙM', waves: 12, mul: 10.2, themes: ['mixed'], boss: true, reward: 150 },
  { n: 'Rừng Cổ Thụ', waves: 12, mul: 11.5, themes: ['root', 'mixed'], rec: 'druid', reward: 120 },
  { n: 'Đền Gió Lộng', waves: 13, mul: 7.8, themes: ['spirit', 'fast'], rec: 'wind', reward: 130 },
  { n: 'Cấm Thành Xương', waves: 13, mul: 13.2, themes: ['root', 'spirit', 'mixed'], rec: 'druid', reward: 140 },
  { n: 'Thiên Môn ⚔TRÙM', waves: 14, mul: 15.8, themes: ['apex'], boss: true, bossTheme: 'apex', rec: 'wind', reward: 220 },
];

const WAVE_THEMES = {
  intro: ['imp', 'imp', 'imp', 'imp', 'wolf'],
  swarm: ['imp', 'imp', 'imp', 'summoner', 'orc'],
  armor: ['orc', 'orc', 'orc', 'skel', 'imp'],
  fast: ['wolf', 'wolf', 'wolf', 'assassin', 'imp'],
  mixed: ['imp', 'orc', 'wolf', 'skel', 'summoner', 'assassin'],
  root: ['golem', 'golem', 'orc', 'skel', 'imp'],
  spirit: ['wraith', 'wraith', 'assassin', 'wolf', 'summoner'],
  apex: ['orc', 'wolf', 'skel', 'summoner', 'assassin', 'golem', 'wraith'],
  boss: ['imp', 'orc', 'wolf', 'skel', 'boss'],
};

const ENEMIES = {
  imp: { hp: 70, pressure: 1.0, tags: ['swarm'] },
  orc: { hp: 420, pressure: 1.15, tags: ['armor'] },
  wolf: { hp: 60, pressure: 1.45, tags: ['fast'] },
  skel: { hp: 150, pressure: 1.20, tags: ['shield'] },
  summoner: { hp: 140, pressure: 1.35, tags: ['summon'] },
  assassin: { hp: 120, pressure: 1.65, tags: ['evade', 'backline'] },
  boss: { hp: 5200, pressure: 3.0, tags: ['boss'] },
  golem: { hp: 920, pressure: 1.75, tags: ['armor', 'golem'] },
  wraith: { hp: 190, pressure: 1.70, tags: ['spirit', 'evade'] },
};

const HEROES = {
  miner: { base: 0.42, counters: ['econ'], role: 'econ' },
  knight: { base: 0.74, counters: ['backline', 'tank'], role: 'tank' },
  archer: { base: 0.92, counters: ['shield'], role: 'dps' },
  gunner: { base: 1.06, counters: ['swarm', 'summon'], role: 'aoe' },
  poison: { base: 0.96, counters: ['evade', 'shield'], role: 'dot' },
  mage: { base: 1.08, counters: ['armor', 'summon', 'boss'], role: 'global' },
  ice: { base: 1.00, counters: ['fast'], role: 'control' },
  priest: { base: 0.70, counters: ['tank', 'boss'], role: 'support' },
  druid: { base: 1.06, counters: ['golem', 'armor'], role: 'root' },
  wind: { base: 1.03, counters: ['spirit', 'fast'], role: 'push' },
};

const GOD_SKILLS = {
  miner: { name: 'Thần Mạch Kim Sơn', tags: ['econ'], boost: 0.16 },
  knight: { name: 'Thần Thuẫn Bất Diệt', tags: ['tank', 'backline'], boost: 0.20 },
  archer: { name: 'Thần Tiễn Xuyên Tâm', tags: ['shield', 'evade'], boost: 0.18 },
  gunner: { name: 'Thiên Pháo Diệt Quân', tags: ['swarm', 'summon'], boost: 0.22 },
  poison: { name: 'Dịch Thần Ăn Mòn', tags: ['evade', 'shield'], boost: 0.19 },
  mage: { name: 'Thiên Lôi Phán Quyết', tags: ['armor', 'boss', 'summon'], boost: 0.22 },
  ice: { name: 'Cực Hàn Lĩnh Vực', tags: ['fast'], boost: 0.20 },
  priest: { name: 'Thần Quang Hộ Mệnh', tags: ['tank', 'boss'], boost: 0.18 },
  druid: { name: 'Thần Lâm Trói Đất', tags: ['golem', 'armor'], boost: 0.22 },
  wind: { name: 'Thiên Phong Phá Trận', tags: ['spirit', 'fast'], boost: 0.21 },
};

const ENEMY_EVOLUTIONS = {
  splitter: { name: 'Kẻ Phân Thân', counters: ['aoe'], threat: 0.18 },
  berserk: { name: 'Cuồng Thú', counters: ['control', 'root', 'push'], threat: 0.16 },
  rod: { name: 'Cột Thu Lôi', counters: ['global'], threat: 0.17 },
  breaker: { name: 'Phá Giáp Quỷ', counters: ['tank'], threat: 0.16 },
  thief: { name: 'Đạo Tặc Tinh Thạch', counters: ['econ'], threat: 0.13 },
  cleanser: { name: 'Tịnh Hóa Giả', counters: ['dot'], threat: 0.14 },
};

const PLAYERS = {
  newPlayer: { name: 'New player', planning: 0.80, grindTolerance: 10, preferGod: false, unlock: ['gunner', 'ice', 'mage', 'poison', 'priest', 'druid', 'wind'], skills: ['gunner', 'ice', 'mage', 'poison', 'knight', 'archer', 'priest', 'druid', 'wind', 'miner'] },
  normalFarmer: { name: 'Normal farmer', planning: 0.90, grindTolerance: 14, preferGod: false, unlock: ['gunner', 'ice', 'mage', 'poison', 'priest', 'druid', 'wind'], skills: ['gunner', 'ice', 'mage', 'poison', 'knight', 'archer', 'priest', 'druid', 'wind', 'miner'] },
  optimal: { name: 'Optimal counter player', planning: 1.04, grindTolerance: 20, preferGod: false, unlock: ['gunner', 'ice', 'mage', 'poison', 'priest', 'druid', 'wind'], skills: ['mage', 'ice', 'gunner', 'poison', 'druid', 'wind', 'knight', 'archer', 'priest', 'miner'] },
  godStack: { name: 'God-form late player', planning: 1.08, grindTolerance: 26, preferGod: true, unlock: ['gunner', 'ice', 'mage', 'poison', 'priest', 'druid', 'wind'], skills: ['mage', 'gunner', 'ice', 'poison', 'druid', 'wind', 'knight', 'archer', 'priest', 'miner'] },
};

function freshCampaign() {
  return { gems: 0, stageProg: 0, level: 1, xp: 0, sp: 0, saveFor: null, unlocks: new Set(['miner', 'knight', 'archer']), unitSkills: {}, talents: { d: 0, s: 0, h: 0, c: 0 }, totalReplays: 0, logs: [] };
}
function addXp(c, amount) {
  c.xp += amount;
  while (c.xp >= TUNE.xpNeed(c.level)) {
    c.xp -= TUNE.xpNeed(c.level);
    c.level++;
    c.sp += TUNE.spPerLevel(c.level);
  }
}
function spendProgression(c, p, stageIndex) {
  const st = STAGES[stageIndex] || STAGES[STAGES.length - 1];
  const forced = c.saveFor || st.rec;
  if (forced && !c.unlocks.has(forced)) {
    if (c.gems >= HERO_COST[forced]) { c.gems -= HERO_COST[forced]; c.unlocks.add(forced); c.saveFor = null; }
    return;
  }
  for (const h of p.unlock) if (!c.unlocks.has(h) && c.gems >= HERO_COST[h]) { c.gems -= HERO_COST[h]; c.unlocks.add(h); }

  let changed = true;
  while (changed) {
    changed = false;
    for (const h of p.skills) {
      if (!c.unlocks.has(h)) continue;
      const cur = c.unitSkills[h] || 0;
      if (cur >= 3) continue;
      const cost = TUNE.skillCosts[cur];
      if (c.sp >= cost) { c.sp -= cost; c.unitSkills[h] = cur + 1; changed = true; }
    }
  }
  if (!p.preferGod) {
    for (const k of ['d', 's', 'c', 'h']) {
      const max = k === 'd' || k === 's' ? 10 : 5;
      while (c.sp > 1 && c.talents[k] < max) { c.sp--; c.talents[k]++; }
    }
  }
}
function themeFor(st, wave) { if (st.boss && wave >= st.waves) return st.bossTheme || 'boss'; return st.themes[(wave - 1) % st.themes.length] || 'mixed'; }
function waveThreat(c, stageIndex, wave) {
  const st = STAGES[stageIndex];
  const theme = themeFor(st, wave);
  const kinds = WAVE_THEMES[theme];
  const count = Math.round(4 + wave * 1.5 + wave * wave * 0.12);
  const tags = new Set();
  let raw = 0;
  for (let i = 0; i < count; i++) {
    const e = ENEMIES[kinds[i % kinds.length]];
    raw += e.hp * st.mul * (1 + (wave - 1) * 0.055) * e.pressure;
    e.tags.forEach(t => tags.add(t));
  }
  if (st.boss && wave === st.waves) {
    const bossScale = Math.min(0.52, 0.18 + stageIndex * 0.016);
    raw *= bossScale * (stageIndex >= 10 ? 1.28 : 1.12);
    tags.add('boss');
  }
  const godCount = Object.values(c.unitSkills).filter(v => v >= 3).length;
  const eliteRate = Math.min(0.38, 0.05 + stageIndex * 0.018);
  const counterRate = Math.min(0.35, godCount * 0.035 + Math.max(0, stageIndex - 8) * 0.012);
  return { raw: raw * (1 + eliteRate * (stageIndex >= 4 ? 1 : 0.35) + counterRate * (stageIndex >= 8 ? 1 : 0.25)), tags, theme };
}
function heroContribution(hero, c, tags) {
  const h = HEROES[hero];
  const skill = c.unitSkills[hero] || 0;
  const god = skill >= 3;
  let v = h.base * (1 + skill * 0.145) * (1 + c.talents.d * 0.025 + c.talents.s * 0.014 + c.talents.c * 0.012);
  let hits = 0;
  for (const t of tags) if (h.counters.includes(t)) hits++;
  v *= 1 + hits * 0.72;
  if (god) {
    const gs = GOD_SKILLS[hero];
    let gh = 0;
    for (const t of tags) if (gs.tags.includes(t)) gh++;
    v *= 1 + gs.boost + gh * 0.22;
  }
  return v;
}
function chooseArmy(c, stageIndex, tags) {
  const army = ['miner', 'knight', 'archer'];
  if (stageIndex >= 2 && c.unlocks.has('gunner')) army.push('gunner');
  if (stageIndex >= 2 && c.unlocks.has('ice')) army.push('ice');
  if (stageIndex >= 4 && c.unlocks.has('mage')) army.push('mage');
  if (stageIndex >= 7 && c.unlocks.has('poison')) army.push('poison');
  if (stageIndex >= 8 && c.unlocks.has('priest')) army.push('priest');
  if (stageIndex >= 12 && c.unlocks.has('druid')) army.push('druid');
  if (stageIndex >= 13 && c.unlocks.has('wind')) army.push('wind');
  for (const h of c.unlocks) if ([...tags].some(t => HEROES[h].counters.includes(t))) army.push(h);
  const slots = Math.round(6 + stageIndex * 0.34);
  const fixed = army.slice(0, 3);
  const rest = army.slice(3).sort((a, b) => heroContribution(b, c, tags) - heroContribution(a, c, tags));
  return [...fixed, ...rest].slice(0, slots);
}
function defensePower(c, p, stageIndex, wd) {
  const army = chooseArmy(c, stageIndex, wd.tags);
  let power = army.reduce((s, h) => s + heroContribution(h, c, wd.tags), 0);
  const miners = army.filter(h => h === 'miner').length;
  power *= 1 + Math.min(0.26, miners * 0.05 + (c.unitSkills.miner || 0) * 0.025);
  if (army.includes('priest')) power *= 1 + 0.055 + (c.unitSkills.priest || 0) * 0.018;
  if (army.includes('knight')) power *= 1 + Math.min(0.12, 0.04 + (c.unitSkills.knight || 0) * 0.02);
  power *= p.planning * (3950 + stageIndex * 170 + STAGES[stageIndex].waves * 70);
  return { power, army };
}
function xpGain(stageIndex, first, win, threat) {
  const st = STAGES[stageIndex];
  const base = (first ? 70 : 25) + (stageIndex + 1) * (first ? 16 : 7) + st.waves * (first ? 6 : 2) + st.mul * (first ? 10 : 4);
  return Math.round(base * 2.25 * (win ? 1 : 0.45) * (0.9 + Math.min(0.35, threat / 12000)));
}
function simulateStage(c, p, stageIndex) {
  spendProgression(c, p, stageIndex);
  const st = STAGES[stageIndex];
  let margin = Infinity, totalThreat = 0, army = [];
  for (let w = 1; w <= st.waves; w++) {
    const wd = waveThreat(c, stageIndex, w);
    const dp = defensePower(c, p, stageIndex, wd);
    margin = Math.min(margin, (dp.power - wd.raw) / wd.raw);
    totalThreat += wd.raw;
    army = dp.army;
  }
  const win = margin > TUNE.winMargin;
  const first = stageIndex >= c.stageProg;
  const xp = xpGain(stageIndex, first, win, totalThreat / st.waves);
  addXp(c, xp);
  if (win) {
    c.gems += first ? st.reward : Math.max(3, Math.round(st.reward * TUNE.replayRewardRate));
    if (first) c.stageProg = stageIndex + 1;
  }
  c.logs.push({ stage: stageIndex + 1, name: st.n, win, margin: Number(margin.toFixed(3)), xp, gems: c.gems, level: c.level, sp: c.sp, godCount: Object.values(c.unitSkills).filter(v => v >= 3).length, army });
  return { win, margin };
}
function runCampaign(p) {
  const c = freshCampaign();
  const gates = [];
  for (let i = 0; i < STAGES.length; i++) {
    let attempt = simulateStage(c, p, i);
    let replays = 0;
    while (!attempt.win && replays < p.grindTolerance) {
      if (STAGES[i].rec && !c.unlocks.has(STAGES[i].rec)) c.saveFor = STAGES[i].rec;
      simulateStage(c, p, Math.max(0, i - 1));
      c.totalReplays++;
      replays++;
      attempt = simulateStage(c, p, i);
    }
    if (attempt.win) c.saveFor = null;
    if (replays > 0) gates.push({ stage: i + 1, replays, cleared: attempt.win });
    if (!attempt.win) return { player: p.name, cleared: false, failedAt: i + 1, campaign: c, gates };
  }
  return { player: p.name, cleared: true, failedAt: null, campaign: c, gates };
}
function summarize(r) {
  const c = r.campaign;
  return { player: r.player, cleared: r.cleared, failedAt: r.failedAt, finalLevel: c.level, finalSp: c.sp, finalGems: c.gems, totalReplays: c.totalReplays, godCount: Object.values(c.unitSkills).filter(v => v >= 3).length, gates: r.gates };
}
function audit(results) {
  const normal = results.normalFarmer, optimal = results.optimal, god = results.godStack, newbie = results.newPlayer;
  const late = god.campaign.logs.filter(x => x.stage >= 12);
  const avgLate = late.reduce((s, x) => s + x.margin, 0) / Math.max(1, late.length);
  const normalBefore12 = normal.gates.filter(g => g.stage <= 12).reduce((s, g) => s + g.replays, 0);
  const checks = [
    { id: 'early_new_player_no_hard_wall', ok: newbie.failedAt === null || newbie.failedAt >= 8, value: newbie.failedAt || 'clear' },
    { id: 'normal_campaign_clearable', ok: normal.cleared, value: normal.failedAt || 'clear' },
    { id: 'normal_grind_before_12_reasonable', ok: normalBefore12 <= TUNE.target.maxGateReplaysBeforeStage12, value: normalBefore12 },
    { id: 'normal_total_grind_reasonable', ok: normal.campaign.totalReplays <= TUNE.target.maxGateReplaysTotal, value: normal.campaign.totalReplays },
    { id: 'god_late_not_trivial', ok: avgLate <= TUNE.target.maxLateGodMargin, value: Number(avgLate.toFixed(3)) },
    { id: 'god_late_not_impossible', ok: avgLate >= TUNE.target.minLateGodMargin, value: Number(avgLate.toFixed(3)) },
    { id: 'optimal_clearable', ok: optimal.cleared, value: optimal.failedAt || 'clear' },
  ];
  return { ok: checks.every(c => c.ok), checks, avgGodLateMargin: Number(avgLate.toFixed(3)) };
}
function main() {
  const results = Object.fromEntries(Object.entries(PLAYERS).map(([k, p]) => [k, runCampaign(p)]));
  const a = audit(results);
  const out = { verdict: a.ok ? 'BALANCED_FOR_PROTOTYPE' : 'NEEDS_TUNING', audit: a, summary: Object.fromEntries(Object.entries(results).map(([k, r]) => [k, summarize(r)])) };
  if (JSON_OUT) return console.log(JSON.stringify(out, null, 2));
  console.log('GOD BALANCE SIM — Kỷ Nguyên Thủ Thành');
  console.log('Verdict:', out.verdict);
  console.log('\nChecks:');
  for (const c of a.checks) console.log(`- ${c.ok ? 'PASS' : 'FAIL'} ${c.id}: ${c.value}`);
  console.log('\nCampaign summary:');
  for (const s of Object.values(out.summary)) {
    console.log(`- ${s.player}: ${s.cleared ? 'clear' : 'fail @' + s.failedAt}, lv ${s.finalLevel}, god ${s.godCount}, replays ${s.totalReplays}, gems ${s.finalGems}`);
    if (s.gates.length) console.log(`  gates: ${s.gates.map(g => `S${g.stage}=${g.replays}${g.cleared ? '' : ' fail'}`).join(', ')}`);
  }
  if (DETAILS) {
    console.log('\nDetailed godStack stages >= 10:');
    for (const row of results.godStack.campaign.logs.filter(x => x.stage >= 10)) console.log(`S${row.stage} ${row.win ? 'W' : 'L'} margin=${row.margin} lv=${row.level} god=${row.godCount} army=${row.army.join('/')}`);
  }
}

if (require.main === module) main();
module.exports = { runCampaign, audit, PLAYERS, GOD_SKILLS, ENEMY_EVOLUTIONS, TUNE };
