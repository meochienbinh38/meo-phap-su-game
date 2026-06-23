/* KNTT Version Sync
 * Mục tiêu: version.json là nguồn sự thật duy nhất cho phiên bản hiển thị và cập nhật.
 */
(function () {
  'use strict';

  const VERSION_URL = './version.json';
  const FALLBACK_VERSION = '3.11.6';

  function qs(id) { return document.getElementById(id); }

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
    setTextIfExists('ver-num', version);
    setTextIfExists('ver-num-2', version);
  }

  async function clearAllAppCaches() {
    if (!('caches' in window)) return;
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    } catch (_) {}
  }

  async function refreshServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        await reg.update();
      }
    } catch (_) {}
  }

  async function hardUpdate() {
    const info = await readVersionInfo();
    setUpdateBarVersion(info.version || FALLBACK_VERSION);
    await refreshServiceWorker();
    await clearAllAppCaches();

    const url = new URL(location.href);
    url.searchParams.set('v', info.version || FALLBACK_VERSION);
    url.searchParams.set('t', Date.now().toString());
    location.replace(url.toString());
  }

  async function checkUpdateFromSingleSource(manual) {
    const info = await readVersionInfo();
    const latest = info.version || FALLBACK_VERSION;
    setUpdateBarVersion(latest);

    const current = (window.KNTT_ACTIVE_VERSION || '').trim() || latest;
    if (latest !== current) {
      const bar = qs('updbar');
      if (bar) bar.classList.add('show');
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
          if (btn) btn.style.display = '';
          if (span) span.innerHTML = '✨ Đã có bản mới (v<span id="upd-ver">' + latest + '</span>)';
        }, 2600);
      }
    }
  }

  async function initVersionSync() {
    const info = await readVersionInfo();
    const version = info.version || FALLBACK_VERSION;
    window.KNTT_ACTIVE_VERSION = version;
    setUpdateBarVersion(version);

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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVersionSync);
  } else {
    initVersionSync();
  }
})();
