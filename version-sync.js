/* KNTT Version Sync
 * version.json là nguồn sự thật duy nhất cho số phiên bản hiển thị.
 * GAME_VERSION trong index.html chỉ là hằng cũ, không dùng để ghi nhãn UI nữa.
 */
(function () {
  'use strict';

  const VERSION_URL = './version.json';
  const FALLBACK_VERSION = '3.12.6';
  let updateStarted = false;

  function qs(id) { return document.getElementById(id); }
  function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

  function getBundledAppVersion() {
    try {
      if (typeof GAME_VERSION !== 'undefined' && GAME_VERSION) return String(GAME_VERSION);
    } catch (_) {}

    const active = (window.KNTT_ACTIVE_VERSION || '').trim();
    if (active) return active;

    const label = qs('ver-num') || qs('ver-num-2');
    const text = label && label.innerText ? label.innerText.trim() : '';
    return text && text !== '—' ? text : FALLBACK_VERSION;
  }

  function getLatestVersionFromUi() {
    const inBar = qs('upd-ver');
    const text = inBar && inBar.innerText ? inBar.innerText.trim() : '';
    return text && text !== '?' ? text : FALLBACK_VERSION;
  }

  async function readVersionInfo(timeoutMs) {
    const request = (async () => {
      const res = await fetch(VERSION_URL + '?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('version.json HTTP ' + res.status);
      const data = await res.json();
      if (data && data.version) return data;
      throw new Error('version.json missing version');
    })();

    if (!timeoutMs) return request.catch(() => ({ version: getLatestVersionFromUi(), build: '', notes: '' }));

    return Promise.race([
      request,
      sleep(timeoutMs).then(() => ({ version: getLatestVersionFromUi(), build: '', notes: '' }))
    ]).catch(() => ({ version: getLatestVersionFromUi(), build: '', notes: '' }));
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

  async function refreshServiceWorkerFast() {
    if (!('serviceWorker' in navigator)) return;

    try {
      postToController({ type: 'REFRESH_VERSION' });
      postToController({ type: 'CLEAR_KNTT_CACHE' });

      const reg = await Promise.race([
        navigator.serviceWorker.getRegistration(),
        sleep(700).then(() => null)
      ]);
      if (!reg) return;

      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });

      const updatedReg = await Promise.race([
        reg.update(),
        sleep(1000).then(() => reg)
      ]);

      const waiting = (updatedReg && updatedReg.waiting) || reg.waiting;
      if (waiting) waiting.postMessage({ type: 'SKIP_WAITING' });

      const installing = (updatedReg && updatedReg.installing) || reg.installing;
      if (installing) {
        await Promise.race([
          new Promise((resolve) => {
            installing.addEventListener('statechange', () => {
              if (installing.state === 'installed' || installing.state === 'activated') {
                const next = (updatedReg && updatedReg.waiting) || reg.waiting;
                if (next) next.postMessage({ type: 'SKIP_WAITING' });
                resolve();
              }
            });
          }),
          sleep(1000)
        ]);
      }
    } catch (_) {}
  }

  function buildCacheBustUrl(version) {
    const url = new URL(location.href);
    url.searchParams.set('v', version || FALLBACK_VERSION);
    url.searchParams.set('t', Date.now().toString());
    url.hash = '';
    return url.toString();
  }

  function navigateToFreshApp(version) {
    const target = buildCacheBustUrl(version);
    try { location.replace(target); }
    catch (_) { location.href = target; }
  }

  async function hardUpdate() {
    if (updateStarted) return;
    updateStarted = true;

    const btn = qs('b-do-update');
    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Đang cập nhật...';
    }

    const info = await readVersionInfo(700);
    const latest = info.version || getLatestVersionFromUi() || FALLBACK_VERSION;
    setUpdateBarVersion(latest);
    setVisibleVersion(latest);

    const watchdog = setTimeout(() => navigateToFreshApp(latest), 2200);

    await Promise.race([
      Promise.allSettled([refreshServiceWorkerFast(), clearAllAppCaches()]),
      sleep(1600)
    ]);

    clearTimeout(watchdog);
    navigateToFreshApp(latest);
  }

  async function checkUpdateFromSingleSource(manual) {
    const info = await readVersionInfo(1200);
    const latest = info.version || FALLBACK_VERSION;
    const bundled = window.KNTT_BUNDLED_VERSION || getBundledAppVersion();

    // Nhãn hiển thị luôn theo version.json, nhưng vẫn giữ bundled để biết app có cần cập nhật thật không.
    setUpdateBarVersion(latest);
    setVisibleVersion(latest);
    window.KNTT_ACTIVE_VERSION = latest;

    if (latest !== bundled) {
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
    const bundled = getBundledAppVersion();
    window.KNTT_BUNDLED_VERSION = bundled;

    const info = await readVersionInfo(1200);
    const latest = info.version || FALLBACK_VERSION;

    // Số phiên bản hiển thị theo version.json, nhưng nếu lệch bundled thì phải hiện thanh cập nhật.
    window.KNTT_ACTIVE_VERSION = latest;
    setUpdateBarVersion(latest);
    setVisibleVersion(latest);

    const updateBtn = qs('b-do-update');
    if (updateBtn) updateBtn.onclick = hardUpdate;

    ['b-update', 'b-update-2'].forEach((id) => {
      const el = qs(id);
      if (el) el.onclick = function () {
        try { if (window.Sound && Sound.play) Sound.play('click'); } catch (_) {}
        checkUpdateFromSingleSource(true);
      };
    });

    if (latest !== bundled) showUpdateBar(latest);

    window.KNTT_hardUpdate = hardUpdate;
    window.KNTT_checkUpdate = checkUpdateFromSingleSource;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVersionSync);
  } else {
    initVersionSync();
  }
})();