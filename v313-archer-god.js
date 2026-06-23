/* KNTT v3.13 Combat Feel Layer
 * Hướng mới:
 * - Xạ Thủ: Liên Châu Tiễn, bắn chùm nhiều mũi tên, nâng cấp tăng tốc đánh.
 * - Thần Sét: Lôi Động Cửu Thiên, sét giáng từ trên xuống, nâng cấp tăng sát thương rõ hơn.
 */
(function () {
  'use strict';

  if (window.__KNTT_COMBAT_FEEL_313__) return;
  window.__KNTT_COMBAT_FEEL_313__ = true;

  let godVolleyPulse = 0;
  let lastGodVolley = 0;
  let lastThunderText = 0;

  function now() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }
  function gs() { try { return (State.grid && State.grid.size) || 64; } catch (_) { return 64; } }
  function dw() { try { return State.designW || 900; } catch (_) { return 900; } }
  function dist(x1, y1, x2, y2) { const dx = x1 - x2, dy = y1 - y2; return Math.sqrt(dx * dx + dy * dy); }
  function unitBonus(type) { try { return typeof unitSkillBonus === 'function' ? unitSkillBonus(type) : {}; } catch (_) { return {}; } }
  function metalPower() { try { return typeof window.KNTT_elPower === 'function' ? Number(window.KNTT_elPower('archer', 'metal')) || 0 : 0; } catch (_) { return 0; } }
  function isGodArcherAlive() { try { return State.units && State.units.some(u => u && u.typeId === 'archer' && u.level >= 4); } catch (_) { return false; } }

  function addBeam(x1, y1, x2, y2, color, life) {
    try {
      if (!State.beams) State.beams = [];
      State.beams.push({ x1, y1, x2, y2, c: color, l: life || 0.22 });
    } catch (_) {}
  }

  function text(x, y, msg, color, big) {
    try { if (Engine && Engine.spawnText) Engine.spawnText(x, y, msg, color, !!big); } catch (_) {}
  }

  function fx(x, y, color, count, speed, size) {
    try { if (Engine && Engine.spawnParticles) Engine.spawnParticles(x, y, color, count, speed, size); } catch (_) {}
  }

  function rewardIfDead(enemy) {
    try { if (enemy && enemy.hp <= 0 && typeof rewardEnemyDeath === 'function') rewardEnemyDeath(enemy); } catch (_) {}
  }

  function patchDescriptions() {
    try {
      if (typeof UNITS_DB !== 'undefined') {
        if (UNITS_DB.archer) {
          UNITS_DB.archer.lv3Desc = 'Liên Châu Tiễn: bắn chùm nhiều mũi tên, nâng cấp càng cao bắn càng nhanh và bóc khiên tốt hơn.';
        }
        if (UNITS_DB.mage) {
          UNITS_DB.mage.name = 'Thần Sét';
          UNITS_DB.mage.lv3Desc = 'Lôi Động Cửu Thiên: thiên lôi giáng từ trời xuống, sát thương phép mạnh và nảy chuỗi.';
        }
      }
      if (typeof UNIT_SKILLS !== 'undefined') {
        if (UNIT_SKILLS.archer) {
          UNIT_SKILLS.archer[0].n = 'Tay Nhanh'; UNIT_SKILLS.archer[0].d = '+15% tốc đánh';
          UNIT_SKILLS.archer[1].n = 'Mưa Tên'; UNIT_SKILLS.archer[1].d = 'Bắn thêm mũi tên trong mỗi loạt';
          UNIT_SKILLS.archer[2].n = 'Liên Châu'; UNIT_SKILLS.archer[2].d = 'Bắn chùm xuyên thấu từ cấp 1';
        }
        if (UNIT_SKILLS.mage) {
          UNIT_SKILLS.mage[0].n = 'Tụ Lôi'; UNIT_SKILLS.mage[0].d = '+25% sát thương sét'; UNIT_SKILLS.mage[0].dmg = 0.25;
          UNIT_SKILLS.mage[1].n = 'Thiên Phạt'; UNIT_SKILLS.mage[1].d = '+20% sát thương sét'; UNIT_SKILLS.mage[1].dmg = 0.20;
          UNIT_SKILLS.mage[2].n = 'Lôi Động Cửu Thiên'; UNIT_SKILLS.mage[2].d = 'Sét giáng từ trời và nảy chuỗi từ cấp 1';
        }
      }
    } catch (_) {}
  }

  function patchUnitStats() {
    try {
      if (typeof Unit === 'undefined' || !Unit.prototype || Unit.prototype.__knttCombatFeelStats) return;
      Unit.prototype.__knttCombatFeelStats = true;
      const oldGetStats = Unit.prototype.getStats;
      Unit.prototype.getStats = function () {
        const s = oldGetStats.call(this);
        try {
          if (this.typeId === 'archer') {
            // cooldown càng nhỏ càng bắn nhanh. Lv2/Lv3/Lv4 cho cảm giác cung thủ lên cấp là bắn dồn dập hơn.
            const levelSpeed = this.level >= 4 ? 0.58 : (this.level >= 3 ? 0.68 : (this.level >= 2 ? 0.82 : 1));
            s.aspd *= levelSpeed;
          }
          if (this.typeId === 'mage') {
            // Thần Sét đắt tiền nên nâng cấp phải tăng dame rõ ràng hơn.
            const thunderDmg = this.level >= 4 ? 1.80 : (this.level >= 3 ? 1.52 : (this.level >= 2 ? 1.28 : 1.12));
            s.dmg *= thunderDmg;
          }
        } catch (_) {}
        return s;
      };
    } catch (_) {}
  }

  function volleyArrowCount(lv) {
    if (lv >= 4) return 5;
    if (lv >= 3 || unitBonus('archer').earlyPierce) return 4;
    if (lv >= 2) return 3;
    return 2;
  }

  function arrowDamageMul(count, lv) {
    // Tổng sát thương tăng vừa phải: Lv1 ~1.18x, Lv2 ~1.32x, Lv3 ~1.44x, Lv4 ~1.55x.
    if (count >= 5) return 0.31;
    if (count === 4) return 0.36;
    if (count === 3) return 0.44;
    return 0.59;
  }

  function castGodVolley(target, baseDmg) {
    if (!target || target.hp <= 0) return;
    const size = gs();
    const y = target.y;
    const color = '#fde047';
    const pMetal = metalPower();

    try { State.shake = Math.max(State.shake || 0, 14); } catch (_) {}
    try { if (Sound && Sound.play) Sound.play('shoot'); } catch (_) {}

    text(target.x, y - size * 0.72, 'VẠN TIỄN XUYÊN TÂM', color, true);

    for (let i = -3; i <= 3; i++) {
      const yy = y + i * size * 0.13;
      addBeam(size * 0.15, yy, dw() - size * 0.2, yy + (Math.random() - 0.5) * size * 0.16, i === 0 ? '#ffffff' : color, i === 0 ? 0.24 : 0.32);
    }
    fx(target.x, y, '#facc15', 45, 170, 5);

    const enemies = ((State && State.enemies) || [])
      .filter(en => en && en.hp > 0 && Math.abs(en.y - y) <= size * 0.66)
      .sort((a, b) => a.x - b.x);

    const main = baseDmg * (1.15 + pMetal * 0.06);
    const side = baseDmg * (0.68 + pMetal * 0.045);
    enemies.forEach(en => {
      const strong = en === target;
      damageNoEvade(en, strong ? main : side, strong ? '#fef3c7' : color, strong ? 'XUYÊN TÂM' : 'THẦN TIỄN');
      if (en.maxHp && en.hp > 0 && en.hp / en.maxHp < Math.min(0.22, 0.1 + pMetal * 0.012)) {
        en.hp = 0;
        text(en.x, en.y - 48, 'KẾT LIỄU', '#facc15', true);
        rewardIfDead(en);
      }
    });
  }

  function damageNoEvade(enemy, amount, color, label) {
    if (!enemy || enemy.hp <= 0) return;
    try {
      enemy.takeDmg(amount, 'phys', false);
      text(enemy.x, enemy.y - 22, Math.floor(amount), color, true);
      if (label) text(enemy.x, enemy.y - 44, label, color, false);
      fx(enemy.x, enemy.y, color, 12, 95, 3);
      rewardIfDead(enemy);
    } catch (_) {}
  }

  function maybeGodVolley(enemy, dmg) {
    if (!enemy || enemy.hp <= 0) return;
    if (!isGodArcherAlive()) return;
    godVolleyPulse++;
    const t = now();
    if (godVolleyPulse % 4 === 0 && t - lastGodVolley > 620) {
      lastGodVolley = t;
      castGodVolley(enemy, Math.max(1, Number(dmg) || 1));
    }
  }

  function patchProjLin() {
    try {
      if (typeof ProjLin === 'undefined' || !ProjLin.prototype || ProjLin.prototype.__knttCombatFeelProj) return;
      ProjLin.prototype.__knttCombatFeelProj = true;
      const oldUpdate = ProjLin.prototype.update;
      const oldDraw = ProjLin.prototype.draw;

      ProjLin.prototype.update = function (dt) {
        if (this.typeId !== 'archer') return oldUpdate.call(this, dt);

        this.x += this.db.pSpeed * dt;
        if (this.x > (State.designW || 1000) + 100) { this.a = false; return; }

        const size = gs();
        const count = volleyArrowCount(this.lv);
        const dmgEach = this.d * arrowDamageMul(count, this.lv);
        const offsets = count === 5 ? [-14, -7, 0, 7, 14]
          : count === 4 ? [-12, -4, 4, 12]
          : count === 3 ? [-9, 0, 9]
          : [-5, 5];

        fx(this.x, this.y, this.lv >= 3 ? '#fde047' : '#34d399', count >= 4 ? 2 : 1, 18, 2);

        for (let enemy of State.enemies) {
          const laneHit = Math.abs(enemy.y - this.y) < (enemy.rowSpan || 1) * size * 0.5 + 10;
          const xHit = enemy.x > this.x - 24 && enemy.x < this.x + 24;
          if (!this.hl.has(enemy) && laneHit && xHit) {
            let totalShown = 0;
            offsets.forEach((off, idx) => {
              const yy = this.y + off;
              const nearArrow = Math.abs(enemy.y - yy) < (enemy.rowSpan || 1) * size * 0.5 + 12;
              if (!nearArrow) return;
              enemy.takeDmg(dmgEach, this.db.dtype || 'phys', true);
              totalShown += dmgEach;
              fx(enemy.x - idx * 2, enemy.y + off * 0.15, this.lv >= 3 ? '#fde047' : this.db.color, 3, 45, 2);
            });

            if (totalShown > 0) {
              text(enemy.x, enemy.y - 20, Math.floor(totalShown), this.lv >= 3 ? '#fde047' : '#fff', this.cr);
              if (count >= 4) addBeam(this.x - size * 0.35, this.y, enemy.x + size * 0.14, enemy.y, '#fde047', 0.14);
              maybeGodVolley(enemy, totalShown);
              rewardIfDead(enemy);
            }

            if (this.p) this.hl.add(enemy);
            else { this.a = false; break; }
          }
        }
      };

      ProjLin.prototype.draw = function (ctx) {
        if (this.typeId !== 'archer') return oldDraw.call(this, ctx);
        const count = volleyArrowCount(this.lv);
        const col = this.lv >= 4 ? '#fef3c7' : (this.lv >= 3 || this.p ? '#fde047' : this.db.color);
        const offsets = count === 5 ? [-12, -6, 0, 6, 12]
          : count === 4 ? [-10, -3, 3, 10]
          : count === 3 ? [-8, 0, 8]
          : [-4, 4];
        ctx.save();
        ctx.shadowColor = col;
        ctx.shadowBlur = this.lv >= 3 ? 16 : 9;
        ctx.lineWidth = this.lv >= 3 ? 3 : 2;
        offsets.forEach((off, idx) => {
          const x = this.x - idx * 4;
          ctx.strokeStyle = idx === Math.floor(offsets.length / 2) ? '#fff7ad' : col;
          ctx.beginPath(); ctx.moveTo(x - 28, this.y + off); ctx.lineTo(x + 14, this.y + off * 0.65); ctx.stroke();
          ctx.fillStyle = ctx.strokeStyle;
          ctx.beginPath();
          ctx.moveTo(x + 18, this.y + off * 0.65);
          ctx.lineTo(x + 7, this.y + off * 0.65 - 4);
          ctx.lineTo(x + 7, this.y + off * 0.65 + 4);
          ctx.closePath(); ctx.fill();
        });
        ctx.restore();
      };
    } catch (_) {}
  }

  function isThunderColor(c) {
    const s = String(c || '').toLowerCase();
    return s === '#06b6d4' || s === '#c084fc' || s === '#fef3c7';
  }

  function patchThunderBeams() {
    try {
      if (typeof State === 'undefined' || !State || !Array.isArray(State.beams) || State.beams.__knttThunderSky) return;
      const arr = State.beams;
      const oldPush = arr.push;
      Object.defineProperty(arr, '__knttThunderSky', { value: true, enumerable: false });
      arr.push = function (...items) {
        const top = (State.grid && Number.isFinite(State.grid.offsetY)) ? State.grid.offsetY - gs() * 0.7 : -30;
        items.forEach(b => {
          if (!b || !isThunderColor(b.c)) return;
          const tx = Number(b.x2), ty = Number(b.y2);
          if (!Number.isFinite(tx) || !Number.isFinite(ty)) return;
          b.x1 = tx + (Math.random() - 0.5) * gs() * 0.8;
          b.y1 = top;
          b.l = Math.max(Number(b.l) || 0.15, 0.22);
          try { State.shake = Math.max(State.shake || 0, 6); } catch (_) {}
          fx(tx, ty, b.c, 8, 90, 3);
          const t = now();
          if (t - lastThunderText > 900) {
            lastThunderText = t;
            text(tx, ty - gs() * 0.75, 'LÔI ĐỘNG CỬU THIÊN', b.c, true);
          }
        });
        return oldPush.apply(this, items);
      };
    } catch (_) {}
  }

  function boot() {
    patchDescriptions();
    patchUnitStats();
    patchProjLin();
    patchThunderBeams();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  setInterval(boot, 500);
  setTimeout(boot, 800);
  setTimeout(boot, 1800);
})();
