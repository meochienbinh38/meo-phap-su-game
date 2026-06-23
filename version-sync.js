/* KNTT Version Sync
 * Mục tiêu: version.json là nguồn sự thật duy nhất cho phiên bản mới nhất.
 * GAME_VERSION trong index.html là phiên bản code đang chạy.
 */
(function () {
  'use strict';

  const VERSION_URL = './version.json';
  const FALLBACK_VERSION = '3.11.7';

  function qs(id) { return document.getElementById(id); }

  function getCurrentAppVersion() {
    try {
      if (typeof GAME_VERSION !== 'undefined' && GAME_VERSION) return String(GAME_VERSION);
    } catch (_) {}

    const active = (window.KNTT_ACTIVE_VERSION || '').trim();
    if (active) return active;

    const label = qs('ver-num') || qs('ver-num-2');
    const text = label && label.innerText ? label.innerText.trim() : '';
    return text && text !== '—' ? text : FALLBACK_VERSION;
  }

  async function readVersionInfo() {
    try {
      const res = await fetch(VERSION_URL + '?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('version.json HTTP ' + res.status);
      const data = await res.json();
      if (data && data.version) return data;
    } catch (_) {}
    return { version: FALLBACK_VERSION, build: '', notes: '' };
  }

  function setTextIfExists(id, value) {
    const el = qs(id);
    if (el) el.innerText = value;
  }

  function setUpdateBarVersion(version) {
    setTextIfExists('upd-ver', version);
  }

  function setVisibleVersion(version) {
    setTextIfExists('ver-num', version);
    setTextIfExists('ver-num-2', version);
  }

  function showUpdateBar(version) {
    const bar = qs('updbar');
    if (!bar) return;
    const span = bar.querySelector('span');
    const btn = bar.querySelector('#b-do-update');
    if (span) span.innerHTML = '✨ Đã có bản mới (v<span id="upd-ver">' + version + '</span>)';
    if (btn) {
      btn.style.display = '';
      btn.disabled = false;
      btn.innerText = 'Cập nhật';
    }
    bar.classList.add('show');
  }

  async function clearAllAppCaches() {
    if (!('caches' in window)) return;
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    } catch (_) {}
  }

  function postToController(message) {
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(message);
      }
    } catch (_) {}
  }

  async function waitForControllerChange(timeoutMs) {
    if (!('serviceWorker' in navigator)) return false;

    return await new Promise((resolve) => {
      let done = false;
      const finish = (value) => {
        if (done) return;
        done = true;
        navigator.serviceWorker.removeEventListener('controllerchange', onChange);
        clearTimeout(timer);
        resolve(value);
      };
      const onChange = () => finish(true);
      const timer = setTimeout(() => finish(false), timeoutMs);

      navigator.serviceWorker.addEventListener('controllerchange', onChange);
    });
  }

  async function refreshServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    try {
      postToController({ type: 'REFRESH_VERSION' });
      postToController({ type: 'CLEAR_KNTT_CACHE' });

      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;

      const controllerChange = waitForControllerChange(3000);
      const updatedReg = await reg.update();

      const waiting = updatedReg.waiting || reg.waiting;
      if (waiting) waiting.postMessage({ type: 'SKIP_WAITING' });

      const installing = updatedReg.installing || reg.installing;
      if (installing) {
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 3000);
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' || installing.state === 'activated') {
              clearTimeout(timer);
              const next = updatedReg.waiting || reg.waiting;
              if (next) next.postMessage({ type: 'SKIP_WAITING' });
              resolve();
            }
          });
        });
      }

      await controllerChange;
    } catch (_) {}
  }

  async function hardUpdate() {
    const btn = qs('b-do-update');
    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Đang cập nhật...';
    }

    const info = await readVersionInfo();
    const latest = info.version || FALLBACK_VERSION;
    setUpdateBarVersion(latest);

    await refreshServiceWorker();
    await clearAllAppCaches();

    try { sessionStorage.setItem('kntt_updated_to', latest); } catch (_) {}

    const url = new URL(location.href);
    url.searchParams.set('v', latest);
    url.searchParams.set('t', Date.now().toString());
    location.replace(url.toString());
  }

  async function checkUpdateFromSingleSource(manual) {
    const info = await readVersionInfo();
    const latest = info.version || FALLBACK_VERSION;
    const current = getCurrentAppVersion();

    setUpdateBarVersion(latest);
    setVisibleVersion(current);
    window.KNTT_ACTIVE_VERSION = current;

    if (latest !== current) {
      showUpdateBar(latest);
      return;
    }

    if (manual) {
      const bar = qs('updbar');
      if (bar) {
        const span = bar.querySelector('span');
        const btn = bar.querySelector('#b-do-update');
        if (span) span.innerHTML = 'Bạn đang dùng bản mới nhất ✓ (v' + latest + ')';
        if (btn) btn.style.display = 'none';
        bar.classList.add('show');
        setTimeout(() => {
          bar.classList.remove('show');
          if (btn) {
            btn.style.display = '';
            btn.disabled = false;
            btn.innerText = 'Cập nhật';
          }
          if (span) span.innerHTML = '✨ Đã có bản mới (v<span id="upd-ver">' + latest + '</span>)';
        }, 2600);
      }
    }
  }

  async function initVersionSync() {
    const current = getCurrentAppVersion();
    window.KNTT_ACTIVE_VERSION = current;
    setVisibleVersion(current);

    const info = await readVersionInfo();
    const latest = info.version || FALLBACK_VERSION;
    setUpdateBarVersion(latest);

    const updateBtn = qs('b-do-update');
    if (updateBtn) updateBtn.onclick = hardUpdate;

    ['b-update', 'b-update-2'].forEach((id) => {
      const el = qs(id);
      if (el) el.onclick = function () {
        try { if (window.Sound && Sound.play) Sound.play('click'); } catch (_) {}
        checkUpdateFromSingleSource(true);
      };
    });

    window.KNTT_hardUpdate = hardUpdate;
    window.KNTT_checkUpdate = checkUpdateFromSingleSource;

    try {
      const done = sessionStorage.getItem('kntt_updated_to');
      if (done && done === current) sessionStorage.removeItem('kntt_updated_to');
    } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVersionSync);
  } else {
    initVersionSync();
  }
})();
