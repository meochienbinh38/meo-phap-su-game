/* KNTT v3.12 polish layer
 * Mục tiêu: sửa các lỗi hoàn thiện nhỏ mà không đụng sâu lõi index.html.
 */
(function () {
  'use strict';

  if (window.__KNTT_V312_POLISH__) return;
  window.__KNTT_V312_POLISH__ = true;

  const FALLBACK_VERSION = '3.12.2';
  const VERSION_URL = './version.json';

  function q(id) { return document.getElementById(id); }
  function safeNum(v, fallback) {
    const n = Number(v);
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
      [0, 250, 800, 1400, 2600].forEach((delay) => {
        setTimeout(() => setVersionLabels(version), delay);
      });
    });
  }

  function buyRamp() {
    try { return safeNum(CFG && CFG.buyRamp, 1.11); } catch (_) { return 1.11; }
  }

  function currentUnits() {
    try { return Array.isArray(State.units) ? State.units : []; } catch (_) { return []; }
  }

  function inferPurchaseCost(unit, countBefore) {
    if (!unit || !unit.db) return 0;
    const n = Math.max(0, safeNum(countBefore, 0));
    return Math.round(safeNum(unit.db.cost, 0) * Math.pow(buyRamp(), n));
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

  function selectedUnit() {
    try { return State && State.ui ? State.ui.selUnit : null; } catch (_) { return null; }
  }

  function maxLevelOf(unit) {
    try { return typeof maxUnitLevel === 'function' ? maxUnitLevel(unit.typeId) : 3; } catch (_) { return 3; }
  }

  function upgradeCostOf(unit) {
    try { return typeof upgradeCost === 'function' ? upgradeCost(unit) : 0; } catch (_) { return 0; }
  }

  function isUnitModalOpen() {
    const modal = q('umod');
    return !!modal && !modal.classList.contains('hidden');
  }

  function applyUpgradeButtonVisual(btn, canUpgrade) {
    if (!btn) return;
    btn.className = canUpgrade
      ? 'flex-1 rounded py-1 flex flex-col items-center border shadow-sm'
      : 'flex-1 rounded py-1 flex flex-col items-center cursor-not-allowed';
    btn.style.display = 'flex';
    btn.style.opacity = canUpgrade ? '1' : '0.45';
    btn.style.filter = canUpgrade ? 'brightness(1.18)' : 'brightness(0.72)';
    btn.style.pointerEvents = 'auto';
    btn.style.borderColor = canUpgrade ? '#60a5fa' : '#475569';
    btn.style.background = canUpgrade
      ? 'linear-gradient(#38bdf8, #1d4ed8)'
      : '#334155';
    btn.style.boxShadow = canUpgrade
      ? '0 0 16px rgba(56,189,248,.45), inset 0 1px 0 rgba(255,255,255,.18)'
      : 'none';
    btn.dataset.canUpgrade = canUpgrade ? '1' : '0';
  }

  function refreshUnitModalAffordance() {
    try {
      const unit = selectedUnit();
      if (!unit || !isUnitModalOpen()) return;

      const up = q('b-up');
      const sell = q('um-s');
      const costLabel = q('um-c');
      const levelLabel = q('um-lv');
      const maxLv = maxLevelOf(unit);
      const gold = safeNum(State && State.gold, 0);

      if (levelLabel) levelLabel.innerText = unit.level;
      if (sell) sell.innerText = '🪙 ' + refundValue(unit);

      if (!up) return;
      if (unit.level >= maxLv) {
        up.style.display = 'none';
        return;
      }

      const cost = upgradeCostOf(unit);
      if (costLabel) costLabel.innerText = '🪙 ' + cost + (unit.level === 3 ? ' · Hoá Thần' : '');
      applyUpgradeButtonVisual(up, gold >= cost);
    } catch (_) {}
  }

  function startModalWatcher() {
    if (window.__KNTT_UPGRADE_MODAL_WATCHER__) return;
    window.__KNTT_UPGRADE_MODAL_WATCHER__ = true;
    setInterval(refreshUnitModalAffordance, 200);
  }

  function patchControlStart() {
    try {
      if (!window.Control && typeof Control === 'undefined') return;
      const C = window.Control || Control;
      if (!C || C.__knttInvestmentStartPatched || !C.start) return;
      C.__knttInvestmentStartPatched = true;
      const originalStart = C.start.bind(C);
      C.start = function (...args) {
        const result = originalStart(...args);
        wrapUnitsPush();
        startModalWatcher();
        return result;
      };
    } catch (_) {}
  }

  function patchUnitModal() {
    try {
      if (typeof UI === 'undefined' || !UI || UI.__knttInvestmentModalPatched) return;
      UI.__knttInvestmentModalPatched = true;
      const originalOpen = UI.openUnitModal.bind(UI);
      UI.openUnitModal = function (unit, x, y) {
        ensureUnitInvestment(unit);
        const result = originalOpen(unit, x, y);
        patchModalButtons();
        refreshUnitModalAffordance();
        startModalWatcher();
        return result;
      };
    } catch (_) {}
  }

  function patchUiUpdateDisplay() {
    try {
      if (typeof UI === 'undefined' || !UI || UI.__knttModalRefreshPatched || !UI.updateDisplay) return;
      UI.__knttModalRefreshPatched = true;
      const originalUpdate = UI.updateDisplay.bind(UI);
      UI.updateDisplay = function (...args) {
        const result = originalUpdate(...args);
        refreshUnitModalAffordance();
        return result;
      };
    } catch (_) {}
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
          const cost = unit ? upgradeCostOf(unit) : 0;
          const goldBefore = safeNum(State && State.gold, 0);
          const result = oldUp ? oldUp.apply(this, args) : undefined;

          if (unit && unit.level > beforeLevel && goldBefore >= cost) {
            unit.knttInvestedGold = ensureUnitInvestment(unit) + cost;
          }
          refreshUnitModalAffordance();
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

  function patchUpdateButtonCheck() {
    try {
      if (typeof window.KNTT_checkUpdate !== 'function') return;
      const old = window.KNTT_checkUpdate;
      if (old.__knttPolished) return;
      const wrapped = async function (manual) {
        const result = await old(manual);
        const latest = await readLatestVersion();
        setVersionLabels(latest);
        return result;
      };
      wrapped.__knttPolished = true;
      window.KNTT_checkUpdate = wrapped;
    } catch (_) {}
  }

  function boot() {
    startVersionGuard();
    wrapUnitsPush();
    patchControlStart();
    patchUnitModal();
    patchUiUpdateDisplay();
    patchModalButtons();
    patchUpdateButtonCheck();
    startModalWatcher();
    refreshUnitModalAffordance();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  setTimeout(boot, 300);
  setTimeout(boot, 1200);
  setTimeout(boot, 2600);
})();
