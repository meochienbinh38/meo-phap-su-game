/* KNTT v3.13 Archer God Layer
 * Nâng tướng Cung Hoá Thần: Vạn Tiễn Xuyên Tâm.
 * v2: bám trực tiếp vào ProjLin vì đạn Cung gốc không gọi KNTT_onTypeHit.
 */
(function () {
  'use strict';

  if (window.__KNTT_ARCHER_GOD_313_V2__) return;
  window.__KNTT_ARCHER_GOD_313_V2__ = true;

  let hitPulse = 0;
  let lastCast = 0;

  function now() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }
  function gs() { try { return (State.grid && State.grid.size) || 64; } catch (_) { return 64; } }
  function dw() { try { return State.designW || 900; } catch (_) { return 900; } }
  function dist(x1, y1, x2, y2) { const dx = x1 - x2, dy = y1 - y2; return Math.sqrt(dx * dx + dy * dy); }
  function unitBonus(type) { try { return typeof unitSkillBonus === 'function' ? unitSkillBonus(type) : {}; } catch (_) { return {}; } }
  function metalPower() { try { return typeof window.KNTT_elPower === 'function' ? Number(window.KNTT_elPower('archer', 'metal')) || 0 : 0; } catch (_) { return 0; } }
  function hasGodArcher() { try { return State.units && State.units.some(u => u && u.typeId === 'archer' && u.level >= 4); } catch (_) { return false; } }

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

  function damage(enemy, amount, color, label) {
    if (!enemy || enemy.hp <= 0) return;
    try {
      if (enemy.shield > 0) enemy.shield = 0;
      enemy.takeDmg(amount, 'phys', false);
      text(enemy.x, enemy.y - 22, Math.floor(amount), color, true);
      if (label) text(enemy.x, enemy.y - 44, label, color, false);
      fx(enemy.x, enemy.y, color, 12, 95, 3);
      rewardIfDead(enemy);
    } catch (_) {}
  }

  function castPiercingVolley(target, baseDmg) {
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
      damage(en, strong ? main : side, strong ? '#fef3c7' : color, strong ? 'XUYÊN TÂM' : 'THẦN TIỄN');
      if (en.maxHp && en.hp > 0 && en.hp / en.maxHp < Math.min(0.22, 0.1 + pMetal * 0.012)) {
        en.hp = 0;
        text(en.x, en.y - 48, 'KẾT LIỄU', '#facc15', true);
        rewardIfDead(en);
      }
    });
  }

  function maybeVolley(enemy, dmg) {
    if (!enemy || enemy.hp <= 0) return;
    if (!hasGodArcher()) return;
    hitPulse++;
    const t = now();
    if (hitPulse % 3 === 0 && t - lastCast > 520) {
      lastCast = t;
      castPiercingVolley(enemy, Math.max(1, Number(dmg) || 1));
    }
  }

  function patchProjLin() {
    try {
      if (typeof ProjLin === 'undefined' || !ProjLin.prototype || ProjLin.prototype.__knttArcherGodV2) return;
      ProjLin.prototype.__knttArcherGodV2 = true;
      const oldUpdate = ProjLin.prototype.update;
      const oldDraw = ProjLin.prototype.draw;

      ProjLin.prototype.update = function (dt) {
        if (!(this.typeId === 'archer' && this.lv >= 4)) return oldUpdate.call(this, dt);

        this.x += this.db.pSpeed * dt;
        if (this.x > (State.designW || 1000) + 100) { this.a = false; return; }

        fx(this.x, this.y, '#fde047', 2, 18, 2);

        for (let enemy of State.enemies) {
          const laneHit = Math.abs(enemy.y - this.y) < (enemy.rowSpan || 1) * State.grid.size * 0.5 + 8;
          const xHit = enemy.x > this.x - 24 && enemy.x < this.x + 24;
          if (!this.hl.has(enemy) && laneHit && xHit) {
            enemy.takeDmg(this.d, this.db.dtype || 'phys', true);
            text(enemy.x, enemy.y - 20, Math.floor(this.d), '#fef3c7', this.cr);
            fx(enemy.x, enemy.y, '#fde047', 9, 55, 3);
            addBeam(this.x - State.grid.size * 0.42, this.y, enemy.x + State.grid.size * 0.18, enemy.y, '#fde047', 0.16);
            maybeVolley(enemy, this.d);
            rewardIfDead(enemy);
            this.hl.add(enemy);
          }
        }
      };

      ProjLin.prototype.draw = function (ctx) {
        if (!(this.typeId === 'archer' && this.lv >= 4)) return oldDraw.call(this, ctx);
        ctx.save();
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#fde047';
        ctx.fillRect(this.x - 26, this.y - 3, 42, 6);
        ctx.fillStyle = '#fff7ad';
        ctx.fillRect(this.x + 8, this.y - 1.5, 18, 3);
        ctx.restore();
      };
    } catch (_) {}
  }

  function patchDescriptions() {
    try {
      if (typeof UNITS_DB !== 'undefined' && UNITS_DB.archer) {
        UNITS_DB.archer.lv3Desc = 'Thần Cung: mỗi 3 lần bắn trúng tung Vạn Tiễn Xuyên Tâm, quét tia tên vàng xuyên cả hàng địch.';
      }
    } catch (_) {}
  }

  function boot() {
    patchDescriptions();
    patchProjLin();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  setInterval(boot, 500);
  setTimeout(boot, 800);
  setTimeout(boot, 1800);
})();
