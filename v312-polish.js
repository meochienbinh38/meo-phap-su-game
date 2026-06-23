/* KNTT v3.12 polish layer
 * Các vá nhỏ không đụng sâu index.html.
 */
(function () {
  'use strict';

  if (window.__KNTT_V312_POLISH__) return;
  window.__KNTT_V312_POLISH__ = true;

  const FALLBACK_VERSION = '3.12.9';
  const VERSION_URL = './version.json';

  function q(id) { return document.getElementById(id); }
  function num(v, fallback) {
    const n = Number(String(v == null ? '' : v).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : fallback;
  }

  async function readLatestVersion() {
    try {
      const res = await fetch(VERSION_URL + '?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('version.json HTTP ' + res.status);
      const data = await res.json();
      return data && data.version ? String(data.version) : FALLBACK_VERSION;
    } catch (_) {
      return FALLBACK_VERSION;
    }
  }

  function setVersionLabels(version) {
    const v = version || FALLBACK_VERSION;
    window.GAME_VERSION = v;
    window.KNTT_ACTIVE_VERSION = v;

    const a = q('ver-num');
    const b = q('ver-num-2');
    const u = q('upd-ver');
    if (a) a.innerText = v;
    if (b) b.innerText = v;
    if (u && (!u.innerText || u.innerText === '?' || /^3\./.test(u.innerText))) u.innerText = v;

    ['b-update', 'b-update-2'].forEach((id) => {
      const el = q(id);
      if (el && /Phiên bản|Kiểm tra/.test(el.textContent || '')) {
        el.innerHTML = '↪ Phiên bản ' + v + ' · Kiểm tra cập nhật';
      }
    });
  }

  function startVersionGuard() {
    readLatestVersion().then((version) => {
      [0, 250, 800, 1400, 2600].forEach((delay) => setTimeout(() => setVersionLabels(version), delay));
    });
  }

  function currentUnits() {
    try { return Array.isArray(State.units) ? State.units : []; } catch (_) { return []; }
  }

  function buyRamp() {
    try { return num(CFG && CFG.buyRamp, 1.11); } catch (_) { return 1.11; }
  }

  function inferPurchaseCost(unit, countBefore) {
    if (!unit || !unit.db) return 0;
    return Math.round(num(unit.db.cost, 0) * Math.pow(buyRamp(), Math.max(0, num(countBefore, 0))));
  }

  function ensureUnitInvestment(unit) {
    if (!unit || !unit.db) return 0;
    if (!Number.isFinite(unit.knttInvestedGold)) {
      const othersBefore = currentUnits().filter((u) => u !== unit && u.typeId === unit.typeId).length;
      unit.knttInvestedGold = inferPurchaseCost(unit, othersBefore);
    }
    return unit.knttInvestedGold;
  }

  function refundValue(unit) {
    return Math.max(0, Math.floor(ensureUnitInvestment(unit) * 0.5));
  }

  function wrapUnitsPush() {
    try {
      const units = State && State.units;
      if (!Array.isArray(units) || units.__knttInvestmentWrapped) return;
      const originalPush = units.push;
      Object.defineProperty(units, '__knttInvestmentWrapped', { value: true, enumerable: false });
      units.push = function (...items) {
        items.forEach((item) => {
          if (item && item.db && item.typeId && !Number.isFinite(item.knttInvestedGold)) {
            const countBefore = this.filter((u) => u && u.typeId === item.typeId).length;
            item.knttInvestedGold = inferPurchaseCost(item, countBefore);
          }
        });
        return originalPush.apply(this, items);
      };
    } catch (_) {}
  }

  function modalOpen() {
    const modal = q('umod');
    return !!modal && !modal.classList.contains('hidden');
  }

  function selectedUnit() {
    try { return State && State.ui ? State.ui.selUnit : null; } catch (_) { return null; }
  }

  function currentGold() {
    try {
      const g = Number(State && State.gold);
      if (Number.isFinite(g)) return g;
    } catch (_) {}
    const goldEl = q('ui-g');
    return goldEl ? num(goldEl.innerText || goldEl.textContent, 0) : 0;
  }

  function currentUpgradeCost(unit) {
    try {
      if (unit && typeof upgradeCost === 'function') {
        const c = Number(upgradeCost(unit));
        if (Number.isFinite(c) && c > 0) return c;
      }
    } catch (_) {}
    const costEl = q('um-c');
    return costEl ? num(costEl.innerText || costEl.textContent, NaN) : NaN;
  }

  function setUpgradeVisual(canUpgrade) {
    const btn = q('b-up');
    if (!btn || !modalOpen()) return;

    btn.style.display = 'flex';
    btn.style.pointerEvents = 'auto';
    btn.style.opacity = canUpgrade ? '1' : '0.45';
    btn.style.filter = canUpgrade ? 'brightness(1.25)' : 'brightness(0.72)';
    btn.style.background = canUpgrade ? 'linear-gradient(#38bdf8,#1d4ed8)' : '#334155';
    btn.style.borderColor = canUpgrade ? '#60a5fa' : '#475569';
    btn.style.boxShadow = canUpgrade ? '0 0 18px rgba(56,189,248,.6), inset 0 1px 0 rgba(255,255,255,.18)' : 'none';
    btn.style.color = '#fff';
    btn.dataset.canUpgrade = canUpgrade ? '1' : '0';

    btn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-slate-700');
    if (!canUpgrade) btn.classList.add('cursor-not-allowed');
  }

  function refreshUpgradeButtonByDom() {
    try {
      const btn = q('b-up');
      if (!btn || !modalOpen()) return;

      const unit = selectedUnit();
      const cost = currentUpgradeCost(unit);
      const gold = currentGold();
      if (!Number.isFinite(cost) || cost <= 0) return;

      setUpgradeVisual(gold >= cost);
    } catch (_) {}
  }

  function refreshSellLabel() {
    try {
      const unit = selectedUnit();
      const sell = q('um-s');
      if (unit && sell) sell.innerText = '🪙 ' + refundValue(unit);
    } catch (_) {}
  }

  function ensureEndRewardCss() {
    if (q('kntt-end-reward-css')) return;
    const style = document.createElement('style');
    style.id = 'kntt-end-reward-css';
    style.textContent = `
      #kntt-end-reward{position:absolute;inset:0;z-index:240;display:flex;align-items:center;justify-content:center;padding:14px;background:radial-gradient(circle at 50% 42%,rgba(15,23,42,.55),rgba(2,6,23,.92));backdrop-filter:blur(4px)}
      #kntt-end-reward.hidden{display:none!important}
      .kntt-reward-card{width:min(430px,92vw);border-radius:18px;border:1px solid rgba(251,191,36,.55);background:linear-gradient(180deg,#172033,#08111f);box-shadow:0 18px 50px rgba(0,0,0,.75),0 0 30px rgba(251,191,36,.18);padding:18px;text-align:center;color:#eaf1ff;animation:knttRewardIn .24s ease-out}
      .kntt-reward-title{font-family:Oswald,sans-serif;font-size:24px;letter-spacing:.12em;font-weight:900;text-transform:uppercase;color:#fbbf24;text-shadow:0 0 14px rgba(251,191,36,.35)}
      .kntt-reward-stage{margin-top:6px;font-size:13px;font-weight:800;color:#cbd5e1}
      .kntt-reward-amount{margin:14px auto 8px;padding:14px;border-radius:15px;background:rgba(251,191,36,.09);border:1px solid rgba(251,191,36,.3);font-family:Oswald,sans-serif;font-size:32px;font-weight:900;color:#fde047}
      .kntt-reward-note{font-size:11px;color:#94a3b8;line-height:1.45;margin:8px 0 14px}
      .kntt-reward-btn{width:100%;border:1px solid #38bdf8;border-radius:13px;padding:12px;background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#fff;font-family:Oswald,sans-serif;font-size:16px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;box-shadow:0 0 18px rgba(56,189,248,.35)}
      .kntt-reward-btn:active{transform:scale(.97)}
      @keyframes knttRewardIn{from{opacity:0;transform:translateY(16px) scale(.94)}to{opacity:1;transform:none}}
    `;
    document.head.appendChild(style);
  }

  function ensureEndRewardModal() {
    ensureEndRewardCss();
    let modal = q('kntt-end-reward');
    if (modal) return modal;

    const stage = q('stage') || document.body;
    modal = document.createElement('div');
    modal.id = 'kntt-end-reward';
    modal.className = 'hidden';
    modal.innerHTML = `
      <div class="kntt-reward-card">
        <div style="font-size:34px;filter:drop-shadow(0 3px 6px rgba(0,0,0,.5))">🏆</div>
        <div class="kntt-reward-title" id="kntt-r-title">Qua màn</div>
        <div class="kntt-reward-stage" id="kntt-r-stage">Màn</div>
        <div class="kntt-reward-amount" id="kntt-r-amount">+0 💎</div>
        <div class="kntt-reward-note" id="kntt-r-note">Thưởng đã được cộng vào tài khoản.</div>
        <button class="kntt-reward-btn" id="kntt-r-exit">Thoát về menu</button>
      </div>`;
    stage.appendChild(modal);
    return modal;
  }

  function showEndRewardModal(payload) {
    try {
      const modal = ensureEndRewardModal();
      const title = q('kntt-r-title');
      const stage = q('kntt-r-stage');
      const amount = q('kntt-r-amount');
      const note = q('kntt-r-note');
      const exit = q('kntt-r-exit');
      const reward = Math.max(0, Math.round(payload.reward || 0));

      if (title) title.innerText = payload.first ? '🎉 Qua màn lần đầu!' : 'Qua màn';
      if (stage) stage.innerText = payload.stageName || 'Màn đã hoàn thành';
      if (amount) amount.innerText = '+' + reward + ' 💎 Tinh Thạch';
      if (note) note.innerText = payload.first ? 'Mở màn mới thành công. Thưởng đã được cộng vào tài khoản.' : 'Chơi lại màn đã qua nên nhận thưởng cày giảm còn 30%.';

      if (exit) {
        exit.onclick = function () {
          modal.classList.add('hidden');
          const start = q('start');
          const gStat = q('g-stat');
          const pmod = q('pmod');
          const call = q('call');
          if (call) call.style.display = 'none';
          if (pmod) pmod.classList.remove('show');
          if (start) start.classList.remove('hidden');
          if (gStat) gStat.classList.remove('hidden');
          try { if (UI && UI.refreshStart) UI.refreshStart(); } catch (_) {}
        };
      }

      modal.classList.remove('hidden');
    } catch (_) {}
  }

  function finishStageWithRewardModal() {
    try {
      State.running = false;
      State.paused = false;

      const stageIdx = Number(State.stageIdx || 0);
      const stageData = State.stage || (typeof STAGES !== 'undefined' ? STAGES[stageIdx] : null) || {};
      const first = stageIdx >= Number(Storage.data.stageProg || 0);
      let reward = Number(stageData.reward || 0) * (first ? 1 : 0.3);
      reward = Math.round(reward);

      Storage.data.gems = Number(Storage.data.gems || 0) + reward;
      if (stageIdx + 1 > Number(Storage.data.stageProg || 0)) Storage.data.stageProg = stageIdx + 1;
      if (Storage && Storage.sync) Storage.sync();

      if (typeof UI !== 'undefined') {
        UI.selStage = Math.min(Storage.data.stageProg, (typeof STAGES !== 'undefined' ? STAGES.length - 1 : Storage.data.stageProg));
        if (UI.refreshStart) UI.refreshStart();
      }

      try { if (Sound && Sound.play) Sound.play('cleared'); } catch (_) {}
      try { if (typeof vibe === 'function') vibe([0, 60, 40, 120]); } catch (_) {}

      const start = q('start');
      const gStat = q('g-stat');
      const pmod = q('pmod');
      if (start) start.classList.add('hidden');
      if (gStat) {
        gStat.classList.remove('hidden');
        const t = gStat.querySelector('.title');
        if (t) t.innerText = first ? '🎉 Qua màn lần đầu!' : 'Qua màn';
      }
      const gw = q('g-wav');
      if (gw) gw.innerHTML = `${stageData.n || 'Màn đã hoàn thành'}<div style="font-size:15px;color:var(--gold);margin-top:6px">+${reward} 💎 Tinh Thạch</div>`;
      const bs = q('b-start');
      if (bs) bs.innerText = 'CHƠI TIẾP';
      if (pmod) pmod.classList.remove('show');

      showEndRewardModal({ first, reward, stageName: stageData.n || 'Màn đã hoàn thành' });
    } catch (err) {
      try { console.warn('KNTT reward modal fallback', err); } catch (_) {}
    }
  }

  function patchModalButtons() {
    try {
      const up = q('b-up');
      if (up && !up.__knttInvestmentPatched) {
        up.__knttInvestmentPatched = true;
        const oldUp = up.onclick;
        up.onclick = function (...args) {
          const unit = selectedUnit();
          const beforeLevel = unit ? unit.level : 0;
          const cost = unit && typeof upgradeCost === 'function' ? upgradeCost(unit) : 0;
          const goldBefore = State ? State.gold : 0;
          const result = oldUp ? oldUp.apply(this, args) : undefined;
          if (unit && unit.level > beforeLevel && goldBefore >= cost) {
            unit.knttInvestedGold = ensureUnitInvestment(unit) + cost;
          }
          setTimeout(refreshUpgradeButtonByDom, 0);
          return result;
        };
      }

      const sell = q('b-sell');
      if (sell && !sell.__knttInvestmentPatched) {
        sell.__knttInvestmentPatched = true;
        sell.onclick = function () {
          if (performance.now() - ((State && State.ui && State.ui.modalAt) || 0) < 300) return;
          const unit = selectedUnit();
          if (!unit) return;
          const val = refundValue(unit);
          State.gold += val;
          State.units = currentUnits().filter((u) => u !== unit);
          wrapUnitsPush();
          try { if (Sound && Sound.play) Sound.play('click'); } catch (_) {}
          try { if (Engine && Engine.spawnText) Engine.spawnText(unit.x, unit.y, '+' + val, '#fde047', false); } catch (_) {}
          try { if (Engine && Engine.spawnParticles) Engine.spawnParticles(unit.x, unit.y, '#94a3b8', 10, 40); } catch (_) {}
          try { if (UI && UI.closeUnitModal) UI.closeUnitModal(); } catch (_) {}
          try { if (UI && UI.updateDisplay) UI.updateDisplay(); } catch (_) {}
        };
      }
    } catch (_) {}
  }

  function patchCoreHooks() {
    try {
      if (typeof Control !== 'undefined' && Control && !Control.__knttInvestmentStartPatched && Control.start) {
        Control.__knttInvestmentStartPatched = true;
        const originalStart = Control.start.bind(Control);
        Control.start = function (...args) {
          const result = originalStart(...args);
          wrapUnitsPush();
          const reward = q('kntt-end-reward');
          if (reward) reward.classList.add('hidden');
          return result;
        };
      }

      if (typeof Control !== 'undefined' && Control && !Control.__knttEndRewardPatched && Control.stageWin) {
        Control.__knttEndRewardPatched = true;
        Control.stageWin = function () {
          finishStageWithRewardModal();
        };
      }

      if (typeof UI !== 'undefined' && UI && !UI.__knttPolishPatched) {
        UI.__knttPolishPatched = true;
        if (UI.openUnitModal) {
          const oldOpen = UI.openUnitModal.bind(UI);
          UI.openUnitModal = function (...args) {
            const result = oldOpen(...args);
            refreshSellLabel();
            patchModalButtons();
            refreshUpgradeButtonByDom();
            return result;
          };
        }
        if (UI.updateDisplay) {
          const oldUpdate = UI.updateDisplay.bind(UI);
          UI.updateDisplay = function (...args) {
            const result = oldUpdate(...args);
            refreshSellLabel();
            refreshUpgradeButtonByDom();
            return result;
          };
        }
      }
    } catch (_) {}
  }

  function boot() {
    startVersionGuard();
    wrapUnitsPush();
    patchCoreHooks();
    patchModalButtons();
    refreshSellLabel();
    refreshUpgradeButtonByDom();
    ensureEndRewardCss();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  setInterval(refreshUpgradeButtonByDom, 100);
  setInterval(patchCoreHooks, 500);
  setTimeout(boot, 300);
  setTimeout(boot, 1200);
  setTimeout(boot, 2600);
})();
