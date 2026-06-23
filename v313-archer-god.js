/* KNTT v3.13 Archer God Layer
 * Nâng tướng Cung Hoá Thần: Vạn Tiễn Xuyên Tâm.
 */
(function () {
  'use strict';

  if (window.__KNTT_ARCHER_GOD_313__) return;
  window.__KNTT_ARCHER_GOD_313__ = true;

  let hitPulse = 0;
  let lastCast = 0;

  function q(id) { return document.getElementById(id); }
  function now() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }
  function gridSize() {
    try { return (State.grid && State.grid.size) || 64; } catch (_) { return 64; }
  }
  function designWidth() {
    try { return State.designW || 900; } catch (_) { return 900; }
  }
  function archerGodActive() {
    try {
      if (State && State.units && State.units.some(function (u) { return u && u.typeId === 'archer' && u.level >= 4; })) return true;
    } catch (_) {}
    return false;
  }
  function metalPower() {
    try {
      if (typeof window.KNTT_elPower === 'function') return Number(window.KNTT_elPower('archer', 'metal')) || 0;
    } catch (_) {}
    return 0;
  }
  function sameLane(enemy, y, gs) {
    return enemy && enemy.hp > 0 && Math.abs(enemy.y - y) <= gs * 0.62;
  }
  function addBeam(x1, y1, x2, y2, color, life) {
    try {
      if (!State.beams) State.beams = [];
      State.beams.push({ x1: x1, y1: y1, x2: x2, y2: y2, c: color, l: life || 0.22 });
    } catch (_) {}
  }
  function burstText(x, y, text, color, big) {
    try { if (Engine && Engine.spawnText) Engine.spawnText(x, y, text, color, !!big); } catch (_) {}
  }
  function particles(x, y, color, count, speed, size) {
    try { if (Engine && Engine.spawnParticles) Engine.spawnParticles(x, y, color, count, speed, size); } catch (_) {}
  }
  function damageEnemy(enemy, amount, color, label) {
    if (!enemy || enemy.hp <= 0) return;
    try {
      if (enemy.shield > 0) enemy.shield = Math.max(0, enemy.shield - 1);
      enemy.takeDmg(amount, 'phys', false);
      burstText(enemy.x, enemy.y - 22, Math.floor(amount), color, true);
      if (label && Math.random() < 0.35) burstText(enemy.x, enemy.y - 42, label, color, false);
      particles(enemy.x, enemy.y, color, 9, 85, 3);
    } catch (_) {}
  }

  function castPiercingVolley(target, dmg) {
    if (!target || target.hp <= 0) return;
    const gs = gridSize();
    const color = '#fde047';
    const glow = '#facc15';
    const y = target.y;
    const w = designWidth();
    const pMetal = metalPower();

    try { State.shake = Math.max(State.shake || 0, 12); } catch (_) {}
    try { if (Sound && Sound.play) Sound.play('shoot'); } catch (_) {}

    burstText(target.x, y - gs * 0.72, 'VẠN TIỄN XUYÊN TÂM', color, true);

    for (let i = -2; i <= 2; i++) {
      const yy = y + i * gs * 0.16;
      addBeam(gs * 0.2, yy, w - gs * 0.25, yy + (Math.random() - 0.5) * gs * 0.18, color, 0.26);
    }
    addBeam(gs * 0.2, y, w - gs * 0.25, y, '#ffffff', 0.18);
    particles(target.x, y, glow, 34, 150, 5);

    const enemies = ((State && State.enemies) || [])
      .filter(function (en) { return sameLane(en, y, gs); })
      .sort(function (a, b) { return a.x - b.x; });

    const mainDmg = dmg * (0.95 + pMetal * 0.055);
    const sideDmg = dmg * (0.55 + pMetal * 0.04);
    enemies.forEach(function (en) {
      const isMain = en === target;
      damageEnemy(en, isMain ? mainDmg : sideDmg, isMain ? '#fef3c7' : color, isMain ? 'XUYÊN TÂM' : null);
      if (en.maxHp && en.hp > 0 && en.hp / en.maxHp < Math.min(0.2, 0.09 + pMetal * 0.012)) {
        en.hp = 0;
        burstText(en.x, en.y - 44, 'KẾT LIỄU', '#facc15', true);
      }
    });
  }

  function patchHitHook() {
    try {
      if (!window.KNTT_onTypeHit || window.KNTT_onTypeHit.__archerGod313) return;
      const oldHit = window.KNTT_onTypeHit;
      const wrapped = function (type, enemy, dmg, kind) {
        const result = oldHit.apply(this, arguments);
        try {
          if (type === 'archer' && enemy && enemy.hp > 0 && (kind === 'proj' || kind === 'melee') && archerGodActive()) {
            hitPulse++;
            const t = now();
            if (hitPulse % 5 === 0 && t - lastCast > 850) {
              lastCast = t;
              castPiercingVolley(enemy, Math.max(1, Number(dmg) || 1));
            }
          }
        } catch (_) {}
        return result;
      };
      wrapped.__archerGod313 = true;
      window.KNTT_onTypeHit = wrapped;
      window.KNTT_onUnitHit = function (unit, enemy, dmg, kind) {
        return window.KNTT_onTypeHit(unit && unit.typeId, enemy, dmg, kind);
      };
    } catch (_) {}
  }

  function patchDescriptions() {
    try {
      if (typeof UNITS_DB !== 'undefined' && UNITS_DB.archer) {
        UNITS_DB.archer.lv3Desc = 'Thần Cung: mỗi nhịp bắn tích thần lực, tung Vạn Tiễn Xuyên Tâm quét xuyên cả hàng địch.';
      }
    } catch (_) {}
  }

  function boot() {
    patchDescriptions();
    patchHitHook();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  setInterval(boot, 500);
  setTimeout(boot, 1200);
  setTimeout(boot, 2600);
})();
