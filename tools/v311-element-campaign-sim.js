#!/usr/bin/env node
/* ============================================================================
 * V3.11 ELEMENT CAMPAIGN SIM — Kỷ Nguyên Thủ Thành
 *
 * Mục tiêu:
 * - Mô phỏng thiết kế mới: Hero Identity + Hóa Thần + Ngũ Hành + wave/quái.
 * - Kiểm tra từ màn 1 đến 16:
 *   + có phá đảo được không
 *   + replay/cày có giảm không
 *   + kim cương cuối game có dư nhiều không
 *   + mọi nhóm tướng có đất diễn không
 *
 * Chạy:
 *   node tools/v311-element-campaign-sim.js
 *   node tools/v311-element-campaign-sim.js --json
 * ========================================================================== */

const JSON_OUT = process.argv.includes('--json');
const SEEDS = Number(process.env.SEEDS || 500);

const ELEMENT_COST = [30, 80, 180, 320, 500];
const HERO_COST = { miner:0, knight:0, archer:0, gunner:40, ice:55, poison:70, mage:90, priest:75, druid:120, wind:135 };
const SKILL_COST = [2, 3, 5];

const ELEMENT = {
  metal: { vi: 'Kim', role: 'crit / pierce / shield break' },
  wood:  { vi: 'Mộc', role: 'poison / spread / erosion' },
  water: { vi: 'Thủy', role: 'slow / freeze / control' },
  fire:  { vi: 'Hỏa', role: 'burn / splash / chain explosion' },
  earth: { vi: 'Thổ', role: 'shield / tank / protection' },
};

const HERO = {
  miner:  { vi:'Mỏ Vàng', role:['econ'], main:'earth', sub:'wood',  base:0.45 },
  knight: { vi:'Giáp Sĩ', role:['tank','block'], main:'earth', sub:'fire',  base:0.82 },
  archer: { vi:'Xạ Thủ', role:['single','shield','crit'], main:'metal', sub:'fire', base:1.04 },
  gunner: { vi:'Pháo Thủ', role:['aoe','swarm'], main:'fire', sub:'metal', base:1.12 },
  poison: { vi:'Tháp Độc', role:['dot','evade','swarm'], main:'wood', sub:'water', base:1.00 },
  mage:   { vi:'Thần Sét', role:['chain','armor','boss'], main:'metal', sub:'fire', base:1.10 },
  ice:    { vi:'Băng Thần', role:['control','fast','swarm'], main:'water', sub:'metal', base:1.03 },
  priest: { vi:'Thánh Sứ', role:['support','protect'], main:'earth', sub:'water', base:0.75 },
  druid:  { vi:'Cổ Mộc', role:['root','golem','armor'], main:'wood', sub:'earth', base:1.10 },
  wind:   { vi:'Phong Linh', role:['spirit','fast','push'], main:'water', sub:'metal', base:1.05 },
};

const STAGES = [
  { n:'Bìa Rừng', waves:['intro','swarm'], reward:30, need:[] },
  { n:'Rừng Rậm', waves:['swarm','fast'], reward:35, need:[] },
  { n:'Đầm Lầy', waves:['fast','swarm'], reward:40, need:['ice'] },
  { n:'Hẻm Núi', waves:['fast','shield'], reward:45, need:['ice','gunner'] },
  { n:'Lò Dung Nham', waves:['armor','swarm'], reward:55, need:['mage'] },
  { n:'Đỉnh Lửa ⚔TRÙM', waves:['armor','boss'], reward:80, boss:true, gate:{ mage:{skill:1, element:['metal',1]} } },
  { n:'Cổng Ngục', waves:['armor','shield','swarm'], reward:60, need:['mage','poison'] },
  { n:'Hành Lang Xương', waves:['shield','evade'], reward:65, gate:{ poison:{skill:2, element:['wood',1]} } },
  { n:'Hầm Sâu', waves:['fast','evade','swarm'], reward:70, need:['poison','ice'] },
  { n:'Ngai Hắc Ám ⚔TRÙM', waves:['boss','evade','swarm'], reward:110, boss:true, gate:{ poison:{skill:3, element:['wood',2]}, mage:{skill:2, element:['metal',2]} } },
  { n:'Vực Thẳm I', waves:['armor','boss','shield'], reward:90, need:['mage','gunner','ice'] },
  { n:'Vực Thẳm II ⚔TRÙM', waves:['boss','armor','swarm'], reward:150, boss:true, gate:{ mage:{skill:3, element:['metal',2]}, gunner:{skill:3, element:['fire',2]} } },
  { n:'Rừng Cổ Thụ', waves:['golem','armor'], reward:120, gate:{ druid:{skill:2, element:['wood',2]} } },
  { n:'Đền Gió Lộng', waves:['spirit','fast'], reward:130, gate:{ wind:{skill:2, element:['water',2]} } },
  { n:'Cấm Thành Xương', waves:['golem','spirit','shield'], reward:140, gate:{ druid:{skill:3, element:['wood',3]}, wind:{skill:2, element:['water',2]} } },
  { n:'Thiên Môn ⚔TRÙM', waves:['apex','boss','spirit','golem'], reward:220, boss:true, gate:{ wind:{skill:3, element:['water',3]}, druid:{skill:3, element:['wood',3]}, mage:{skill:3, element:['metal',2]} } },
];

const WAVE_TAGS = {
  intro:  ['swarm'],
  swarm:  ['swarm','aoe'],
  fast:   ['fast','control'],
  armor:  ['armor','single'],
  shield: ['shield','crit'],
  evade:  ['evade','dot'],
  golem:  ['golem','armor','root'],
  spirit: ['spirit','push','fast'],
  boss:   ['boss','single','support'],
  apex:   ['boss','swarm','armor','fast','spirit','golem'],
};

function rng(seed){ return () => { seed|=0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed>>>15, 1|seed); t = t + Math.imul(t ^ t>>>7, 61|t) ^ t; return ((t ^ t>>>14)>>>0)/4294967296; }; }
function xpNeed(lv){ return Math.floor(120 + Math.pow(lv, 1.60) * 74 + lv * 18); }
function spPerLevel(lv){ return lv % 5 === 0 ? 2 : 1; }
function q(a,p){ const b=[...a].sort((x,y)=>x-y); return b[Math.floor((b.length-1)*p)]; }

function fresh(seed, luckBias){
  return { r:rng(seed), luckBias, level:1, xp:0, sp:0, gems:0, replays:0,
    unlock:new Set(['miner','knight','archer']), skill:{}, elem:{}, spentHero:0, spentElem:0,
    stageLog:[], roleScore:{aoe:0,single:0,control:0,dot:0,tank:0,support:0,root:0,push:0,spirit:0,armor:0,crit:0},
  };
}
function addXp(s, xp){ s.xp += xp; while(s.xp >= xpNeed(s.level)){ s.xp -= xpNeed(s.level); s.level++; s.sp += spPerLevel(s.level); } }
function heroUnlocked(s,h){ if (s.unlock.has(h)) return true; if (s.gems >= HERO_COST[h]){ s.gems -= HERO_COST[h]; s.spentHero += HERO_COST[h]; s.unlock.add(h); return true; } return false; }
function skillLv(s,h){ return s.skill[h]||0; }
function elemLv(s,h,e){ return (s.elem[h] && s.elem[h][e]) || 0; }
function buySkill(s,h,target){ if(!heroUnlocked(s,h)) return false; while(skillLv(s,h)<target){ const cost=SKILL_COST[skillLv(s,h)]; if(s.sp<cost) return false; s.sp-=cost; s.skill[h]=skillLv(s,h)+1; } return true; }
function buyElem(s,h,e,target){ if(!heroUnlocked(s,h)) return false; if(!s.elem[h]) s.elem[h]={}; while(elemLv(s,h,e)<target){ const cost=ELEMENT_COST[elemLv(s,h,e)]; if(s.gems<cost) return false; s.gems-=cost; s.spentElem+=cost; s.elem[h][e]=elemLv(s,h,e)+1; } return true; }
function satisfyGate(s, gate){ if(!gate) return true; let ok=true; for(const [h,g] of Object.entries(gate)){ if(g.skill && !buySkill(s,h,g.skill)) ok=false; if(g.element && !buyElem(s,h,g.element[0],g.element[1])) ok=false; } return ok; }
function targetPlan(stageIndex){
  if(stageIndex < 2) return [];
  if(stageIndex < 5) return [['ice','water',1,1],['gunner','fire',1,1]];
  if(stageIndex < 8) return [['mage','metal',2,1],['gunner','fire',2,1],['ice','water',1,1]];
  if(stageIndex < 11) return [['poison','wood',2,2],['mage','metal',2,2],['ice','water',2,1]];
  if(stageIndex < 13) return [['gunner','fire',3,2],['mage','metal',3,2],['poison','wood',2,2]];
  return [['druid','wood',3,3],['wind','water',3,3],['mage','metal',3,2],['gunner','fire',3,2],['ice','water',2,2]];
}
function applyPlan(s, stageIndex){ for(const [h,e,sk,elv] of targetPlan(stageIndex)){ heroUnlocked(s,h); buyElem(s,h,e,elv); buySkill(s,h,sk); } }
function clearStage(s, i, first, farm){
  const st=STAGES[i], tags=[...new Set(st.waves.flatMap(w=>WAVE_TAGS[w]||[]))];
  const baseXp = Math.round((90 + i*32 + st.waves.length*24) * (first?1:0.55) * (farm?1.2:1));
  const xpLuck = s.r() < 0.18 + s.luckBias*0.04 ? 1.25 : (s.r()<0.04+s.luckBias*0.02 ? 1.65 : 1);
  const gemBase = first ? st.reward : Math.max(3, Math.round(st.reward*0.15));
  const enemyGem = Math.floor((i+1) * (0.25 + Math.max(0,s.luckBias)*0.08) + (s.r()<0.25?1:0));
  const bossGem = st.boss && s.r() < 0.35 + s.luckBias*0.08 ? [8,10,12,15][Math.floor(s.r()*4)] : 0;
  const gemLuck = s.r() < 0.12 + s.luckBias*0.04 ? 1.3 : 1;
  addXp(s, Math.round(baseXp*xpLuck));
  s.gems += Math.round(gemBase*gemLuck) + enemyGem + bossGem;
  if(farm && s.r()<0.20+s.luckBias*0.05) s.sp += 1;
  applyPlan(s, i+1);
  const roleHits = tags.map(t => roleToScoreKey(t)).filter(Boolean);
  roleHits.forEach(k => { s.roleScore[k]=(s.roleScore[k]||0)+1; });
}
function roleToScoreKey(t){
  if(t==='swarm') return 'aoe'; if(t==='single'||t==='boss') return 'single'; if(t==='fast') return 'control';
  if(t==='evade') return 'dot'; if(t==='armor') return 'armor'; if(t==='shield'||t==='crit') return 'crit'; if(t==='golem') return 'root'; if(t==='spirit') return 'spirit'; return null;
}
function canPass(s,i){ applyPlan(s,i); return satisfyGate(s, STAGES[i].gate); }
function simulate(seed,luckBias){
  const s=fresh(seed,luckBias);
  for(let i=0;i<STAGES.length;i++){
    applyPlan(s,i);
    let farms=0;
    while(!canPass(s,i) && farms<60){ clearStage(s,Math.max(0,i-1),false,true); s.replays++; farms++; }
    const cleared=canPass(s,i);
    s.stageLog.push({stage:i+1, farms, cleared, level:s.level, gems:s.gems, gods:Object.values(s.skill).filter(v=>v>=3).length});
    if(!cleared) return {s, cleared:false, failedAt:i+1};
    clearStage(s,i,true,false);
  }
  return {s, cleared:true, failedAt:null};
}
function batch(name,bias){
  const runs=[]; for(let i=1;i<=SEEDS;i++) runs.push(simulate(31000+i*97+name.length,bias));
  const replay=runs.map(x=>x.s.replays), gems=runs.map(x=>x.s.gems), elem=runs.map(x=>x.s.spentElem), gods=runs.map(x=>Object.values(x.s.skill).filter(v=>v>=3).length), level=runs.map(x=>x.s.level);
  return { name, passRate:+(runs.filter(x=>x.cleared).length/runs.length).toFixed(3), failAt:runs.find(x=>!x.cleared)?.failedAt||0,
    replay:{min:Math.min(...replay),p50:q(replay,.5),p75:q(replay,.75),max:Math.max(...replay)},
    finalGems:{min:Math.min(...gems),p25:q(gems,.25),p50:q(gems,.5),p75:q(gems,.75),max:Math.max(...gems)},
    spentElemP50:q(elem,.5), godsP50:q(gods,.5), levelP50:q(level,.5), sample:runs[0].s.stageLog, roleCoverage:runs[0].s.roleScore };
}
function main(){
  const results=[batch('xui',-0.35),batch('binh_thuong',0),batch('may_man',0.35)];
  const n=results[1];
  const verdict = n.passRate>=.98 && n.finalGems.p50>=200 && n.finalGems.p50<=800 && n.replay.p50<=35 ? 'READY_FOR_PROTOTYPE' : 'NEEDS_TUNING';
  const out={verdict, elementCost:ELEMENT_COST, results};
  if(JSON_OUT) return console.log(JSON.stringify(out,null,2));
  console.log('V3.11 ELEMENT CAMPAIGN SIM');
  console.log('Verdict:',verdict);
  for(const r of results) console.log(`- ${r.name}: pass=${r.passRate}, replay ${r.replay.min}/${r.replay.p50}/${r.replay.p75}/${r.replay.max}, gems ${r.finalGems.min}/${r.finalGems.p25}/${r.finalGems.p50}/${r.finalGems.p75}/${r.finalGems.max}, spentElem50=${r.spentElemP50}, gods50=${r.godsP50}, lv50=${r.levelP50}`);
}
if(require.main===module) main();
module.exports={simulate,batch,ELEMENT,HERO,STAGES,ELEMENT_COST};
