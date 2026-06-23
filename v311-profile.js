/* v3.11.6 profile module */
(function(){
  if(window.__KNTT_PROFILE_V3116__) return;
  window.__KNTT_PROFILE_V3116__=true;

  const GAME_VER='3.11.6';
  const BASE_KEY='kntt_v17';
  const INDEX_KEY='kntt_profiles_v1';
  const ACTIVE_KEY='kntt_active_profile_v1';
  const AVAS=['🐱','😺','🧙','🛡️','🏹','💣','⚡','❄️','☠️','🌿','🌀','👑'];

  function q(id){return document.getElementById(id)}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function parse(s,f){try{return s?JSON.parse(s):f}catch(_){return f}}
  function id(){return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
  function dk(pid){return BASE_KEY+'_profile_'+pid}
  function blank(){return {talents:{d:0,s:0,h:0,c:0},unitSkills:{},tp:0,best:[0,0,0],sfx:true,music:false,gems:0,stageProg:0,unlocked:[],elements:{}}}
  function idx(){let x=parse(localStorage.getItem(INDEX_KEY),null); if(!x||!x.profiles||!x.profiles.length){let pid=id(); let old=parse(localStorage.getItem(BASE_KEY),null)||blank(); x={profiles:[{id:pid,name:'Người chơi',avatar:'🐱',time:Date.now()}]}; localStorage.setItem(dk(pid),JSON.stringify(old)); localStorage.setItem(INDEX_KEY,JSON.stringify(x)); localStorage.setItem(ACTIVE_KEY,pid)} let a=localStorage.getItem(ACTIVE_KEY); if(!x.profiles.find(p=>p.id===a)){localStorage.setItem(ACTIVE_KEY,x.profiles[0].id)} return x}
  function saveIdx(x){localStorage.setItem(INDEX_KEY,JSON.stringify(x))}
  function active(){let x=idx(), a=localStorage.getItem(ACTIVE_KEY); return x.profiles.find(p=>p.id===a)||x.profiles[0]}
  function key(){return dk(active().id)}
  function getSave(pid){return parse(localStorage.getItem(dk(pid)),blank())}

  function applyStorage(){
    if(typeof Storage==='undefined') return;
    Storage.key=key();
    Storage.data=blank();
    Storage.load();
    if(typeof State!=='undefined'){
      State.talents={d:0,s:0,h:0,c:0,...(Storage.data.talents||{})};
      State.unitSkills=Storage.data.unitSkills||{};
      State.tp=Storage.data.tp||0;
      State.elements=Storage.data.elements||{};
    }
    try{Sound.sfxOn=Storage.data.sfx!==false;Sound.musicOn=!!Storage.data.music}catch(_){}
    try{UI.updateDisplay();UI.refreshStart();UI.syncAudioUI()}catch(_){}
  }

  function patchStorage(){
    if(typeof Storage==='undefined'||Storage.__profileV3116) return;
    Storage.__profileV3116=true;
    Storage.key=key();
    let sync=Storage.sync&&Storage.sync.bind(Storage);
    Storage.sync=function(){let r=sync?sync():undefined; try{let x=idx(),p=active(); let pp=x.profiles.find(z=>z.id===p.id); if(pp){pp.time=Date.now();saveIdx(x)}}catch(_){} return r};
    applyStorage();
  }

  function css(){
    if(q('profile-css')) return;
    let s=document.createElement('style'); s.id='profile-css';
    s.textContent='#profile-chip{display:flex;align-items:center;justify-content:center;gap:6px;min-height:28px;padding:3px 8px;border:1px solid rgba(148,163,184,.32);border-radius:999px;background:rgba(2,6,23,.56);font-size:11px;color:#e2e8f0;margin:4px auto 0;max-width:220px;cursor:pointer}#pfm{position:fixed;inset:0;z-index:180;background:rgba(2,6,23,.88);display:flex;align-items:center;justify-content:center;padding:10px;backdrop-filter:blur(5px)}.pf-card{width:min(780px,94vw);height:min(430px,88vh);background:#0f172a;border:1px solid #334155;border-radius:16px;display:flex;flex-direction:column;overflow:hidden}.pf-row{display:grid;grid-template-columns:48px 1fr auto;gap:8px;align-items:center;padding:8px;border:1px solid rgba(148,163,184,.18);border-radius:12px;background:rgba(2,6,23,.55)}.pf-btn{border:1px solid #334155;background:#111827;color:#e2e8f0;border-radius:10px;padding:7px 9px;font-size:11px;font-weight:900}.pf-btn.good{border-color:#22c55e;background:rgba(34,197,94,.18)}.pf-ava{font-size:24px;width:38px;height:38px;border-radius:12px;background:#020617;display:flex;align-items:center;justify-content:center;border:1px solid #334155}';
    document.head.appendChild(s);
  }

  function entry(){
    let p=active();
    let chip=q('profile-chip');
    if(!chip){let hero=document.querySelector('.s-hero')||q('start'); chip=document.createElement('div'); chip.id='profile-chip'; chip.onclick=openPanel; if(hero) hero.appendChild(chip)}
    chip.innerHTML='<span style="font-size:18px">'+esc(p.avatar||'🐱')+'</span><b>'+esc(p.name||'Người chơi')+'</b><span style="color:#94a3b8">· Hồ sơ</span>';
    if(!q('b-profile')){let a=q('b-elements')||q('b-tal-2')||q('b-tal'); if(a&&a.parentNode){let b=document.createElement('button'); b.id='b-profile'; b.className=a.className; b.style.cssText=a.style.cssText||''; b.innerHTML='👤 HỒ SƠ'; b.onclick=openPanel; a.parentNode.appendChild(b)}}
  }

  function switchP(pid){try{Storage.sync()}catch(_){} localStorage.setItem(ACTIVE_KEY,pid); location.reload()}
  function createP(){let name=(prompt('Tên nhân vật / hồ sơ:','Tân thủ')||'').trim(); if(!name)return; let pid=id(); let x=idx(); x.profiles.push({id:pid,name:name.slice(0,18),avatar:AVAS[Math.floor(Math.random()*AVAS.length)],time:Date.now()}); localStorage.setItem(dk(pid),JSON.stringify(blank())); saveIdx(x); switchP(pid)}
  function renameP(pid){let x=idx(),p=x.profiles.find(a=>a.id===pid); if(!p)return; let n=(prompt('Đổi tên nhân vật:',p.name)||'').trim(); if(!n)return; p.name=n.slice(0,18); p.time=Date.now(); saveIdx(x); openPanel(); entry()}
  function avatarP(pid,a){let x=idx(),p=x.profiles.find(z=>z.id===pid); if(!p)return; p.avatar=a; p.time=Date.now(); saveIdx(x); openPanel(); entry()}

  function stat(pid){let d=getSave(pid);return {stage:(d.stageProg||0)+1,gems:d.gems||0,sp:d.tp||0,heroes:(d.unlocked||[]).length+3}}
  function openPanel(){
    css(); let old=q('pfm'); if(old)old.remove(); let x=idx(),act=localStorage.getItem(ACTIVE_KEY); let box=document.createElement('div'); box.id='pfm';
    let rows=x.profiles.map(p=>{let st=stat(p.id),is=p.id===act;return '<div class="pf-row"><button class="pf-ava" data-ava="'+p.id+'">'+esc(p.avatar||'🐱')+'</button><div><div style="font-weight:900;color:#fff">'+esc(p.name||'Người chơi')+(is?' <span style="color:#22c55e">✓ Đang chơi</span>':'')+'</div><div style="font-size:10px;color:#94a3b8">Màn '+st.stage+' · '+st.gems+'💎 · '+st.sp+' SP · '+st.heroes+' tướng</div></div><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">'+(is?'':'<button class="pf-btn good" data-sw="'+p.id+'">Chọn</button>')+'<button class="pf-btn" data-ren="'+p.id+'">Tên</button></div></div>'}).join('');
    box.innerHTML='<div class="pf-card"><div style="height:46px;display:flex;align-items:center;gap:8px;padding:0 12px;border-bottom:1px solid #334155"><b style="color:#fff;font-family:Oswald,sans-serif;letter-spacing:.12em">👤 HỒ SƠ NHÂN VẬT</b><button id="pf-new" class="pf-btn good" style="margin-left:auto">+ Tạo nick mới</button><button id="pf-x" class="pf-btn">×</button></div><div style="padding:10px;overflow:auto;display:flex;flex-direction:column;gap:8px">'+rows+'<div id="pf-avas" style="display:none;gap:6px;flex-wrap:wrap;padding:8px;border-radius:12px;background:#020617;border:1px solid #334155"></div><div style="font-size:10px;color:#94a3b8;background:rgba(15,23,42,.7);border-radius:12px;padding:8px">Mỗi nick có tiến trình riêng: tên, avatar, màn chơi, kim cương, SP, tướng, Ngũ Hành và nội tại. Tạo nick mới sẽ chơi lại từ màn 1.</div></div></div>';
    document.body.appendChild(box); q('pf-x').onclick=()=>box.remove(); q('pf-new').onclick=createP;
    box.querySelectorAll('[data-sw]').forEach(b=>b.onclick=()=>switchP(b.getAttribute('data-sw')));
    box.querySelectorAll('[data-ren]').forEach(b=>b.onclick=()=>renameP(b.getAttribute('data-ren')));
    box.querySelectorAll('[data-ava]').forEach(b=>b.onclick=()=>{let pid=b.getAttribute('data-ava'),h=q('pf-avas');h.style.display='flex';h.innerHTML=AVAS.map(a=>'<button class="pf-ava" data-a="'+a+'">'+a+'</button>').join('');h.querySelectorAll('[data-a]').forEach(x=>x.onclick=()=>avatarP(pid,x.getAttribute('data-a')))});
  }

  function boot(){idx(); patchStorage(); css(); entry()}
  boot(); setTimeout(boot,300); setTimeout(boot,1200);
})();
