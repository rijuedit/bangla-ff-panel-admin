const firebaseConfig = {
  apiKey: "AIzaSyDOFL6dKvw_RfyKMe3QQgvE4lt7Gtc4yaM",
  authDomain: "bangla-ff-admin.firebaseapp.com",
  databaseURL: "https://bangla-ff-admin-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bangla-ff-admin",
  storageBucket: "bangla-ff-admin.firebasestorage.app",
  messagingSenderId: "295013484465",
  appId: "1:295013484465:web:b6bc2a949e239095761f90",
  measurementId: "G-BBL16S84J8"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(), db = firebase.database();
let currentUser=null, userRole="normal", userPerms={};
let packages=[], mpPackages=[], fpDownloads=[], fbDownloads=[], emuDownloads=[], apkDownloads=[];
let homeCards = [];

document.addEventListener('mousemove', e => { const g = document.querySelector('.mouse-glow'); if (g) { g.style.left = e.clientX+'px'; g.style.top = e.clientY+'px'; }});
function loginWithGoogle() { auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(r => checkAdmin(r.user)).catch(e => document.getElementById('login-error').innerText = e.message); }
function checkAdmin(user) {
  const key = user.email.replace(/\./g, '_');
  if (user.email === "mdrijowan359@gmail.com") { db.ref('admins/'+key).set({ email:user.email, role:'super', permissions:allPerms() }); grantAccess(user, 'super', allPerms()); return; }
  db.ref('admins/'+key).once('value').then(s => { const d = s.val(); if (d) grantAccess(user, d.role, d.permissions||{}); else { alert('Access Denied!'); auth.signOut(); } });
}
function allPerms() { return { general:1, cards:1, 'free-panel':1, 'free-bypass':1, emulator:1, 'free-fire-apk':1, 'mobile-panel':1, 'buy-panel':1 }; }
function grantAccess(user, role, perms) {
  currentUser=user; userRole=role; userPerms=role==='super'?allPerms():(perms||{});
  document.getElementById('login-screen').style.display='none'; document.getElementById('dashboard-screen').style.display='block';
  document.getElementById('user-email').innerText=user.email;
  const b=document.getElementById('user-role-badge'); b.innerText=role==='super'?'👑 Super Admin':'🔧 Normal Admin'; b.className='role-tag '+role;
  document.getElementById('tab-admins-btn').style.display=role==='super'?'flex':'none';
  ['general','cards','free-panel','free-bypass','emulator','free-fire-apk','mobile-panel','buy-panel'].forEach(t => {
    const btn = document.querySelector(`.top-tab[data-tab="${t}"]`); if (btn) btn.style.display = (userRole==='super'||userPerms[t])?'flex':'none';
  });
  loadData(); if(role==='super') loadAdmins();
}
auth.onAuthStateChanged(u => { if(u) checkAdmin(u); else { document.getElementById('login-screen').style.display='flex'; document.getElementById('dashboard-screen').style.display='none'; }});
function logout() { auth.signOut(); }
function switchTab(name) { document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active')); document.querySelectorAll('.top-tab').forEach(t=>t.classList.remove('active')); document.getElementById('tab-'+name).classList.add('active'); (document.querySelector(`.top-tab[data-tab="${name}"]`)||event.currentTarget).classList.add('active'); }
function setVal(id,v){ const e=document.getElementById(id); if(e) e.value=v||''; }
function getVal(id){ return document.getElementById(id)?.value||''; }
function setChk(id,v){ const e=document.getElementById(id); if(e) e.checked=v!==false; }
function getChk(id){ return document.getElementById(id)?.checked!==false; }

function loadData() {
  db.ref('panel_data').on('value', snap => {
    const d = snap.val()||{};
    setVal('gen-logo', d.general?.logo); setVal('gen-discord', d.general?.discord); setVal('gen-topup', d.general?.topup);
    if(d.homeCards?.length) homeCards=d.homeCards; renderHomeCardsEditor();
    
    setChk('fp-showVideo',d.freePanel?.showVideo); setVal('fp-video',d.freePanel?.video); setChk('fp-showSkip',d.freePanel?.showSkip); setVal('fp-skip',d.freePanel?.skip); setVal('fp-pass',d.freePanel?.pass); fpDownloads=d.freePanel?.downloads||[]; renderDl('fp');
    setChk('fb-showVideo',d.freeBypass?.showVideo); setVal('fb-video',d.freeBypass?.video); setChk('fb-showSkip',d.freeBypass?.showSkip); setVal('fb-skip',d.freeBypass?.skip); setVal('fb-pass',d.freeBypass?.pass); fbDownloads=d.freeBypass?.downloads||[]; renderDl('fb');
    setChk('emu-showVideo',d.emulator?.showVideo); setVal('emu-video',d.emulator?.video); setChk('emu-showSkip',d.emulator?.showSkip); setVal('emu-skip',d.emulator?.skip); setVal('emu-pass',d.emulator?.pass); emuDownloads=d.emulator?.downloads||[]; renderDl('emu');
    setChk('apk-showVideo',d.apk?.showVideo); setVal('apk-video',d.apk?.video); setChk('apk-showSkip',d.apk?.showSkip); setVal('apk-skip',d.apk?.skip); apkDownloads=d.apk?.downloads||[]; renderDl('apk');

    setVal('mp-message', d.mobilePanel?.message); setVal('mp-btnText', d.mobilePanel?.btnText); setVal('mp-ticketLink', d.mobilePanel?.ticketLink); setVal('mp-webhook', d.mobilePanel?.webhook);
    mpPackages=d.mobilePanel?.packages||[]; renderMpPackages();

    setVal('buy-btn-text', d.buyButton?.text); setVal('buy-btn-link', d.buyButton?.link); setVal('buy-webhook', d.buyButton?.webhook);
    packages=d.buyList||[]; renderPackages();
  });
}

function renderHomeCardsEditor() {
  const box = document.getElementById('home-cards-editor'); if(!box) return; box.innerHTML = '';
  homeCards.forEach((c,i) => {
    box.innerHTML += `<div style="border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;margin-bottom:12px;background:rgba(0,0,0,0.2);">
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><strong style="color:#a78bfa;">${c.key}</strong><label class="switch"><input type="checkbox" ${c.visible!==false?'checked':''} onchange="homeCards[${i}].visible=this.checked"><span class="slider"></span></label></div>
      <div class="pkg-row"><input style="width:70px;text-align:center;font-size:20px;" value="${c.icon||''}" onchange="homeCards[${i}].icon=this.value"><input value="${c.title||''}" onchange="homeCards[${i}].title=this.value"><input value="${c.subtitle||''}" onchange="homeCards[${i}].subtitle=this.value"></div>
      <label style="font-size:12px;color:#94a3b8;"><input type="checkbox" ${c.featured?'checked':''} onchange="homeCards[${i}].featured=this.checked"> Featured Badge</label>
    </div>`;
  });
}

function getArr(t){ return t==='fp'?fpDownloads:t==='fb'?fbDownloads:t==='emu'?emuDownloads:t==='apk'?apkDownloads:[]; }
function renderDl(type) {
  const box = document.getElementById(type+'-dl-container'); if(!box) return; const arr = getArr(type); box.innerHTML = '';
  arr.forEach((item,i) => {
    box.innerHTML += `<div style="background:rgba(0,0,0,0.25);padding:12px 16px;border-radius:12px;margin-bottom:10px;border:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;">
      <div style="flex:1;min-width:0;"><div style="font-weight:800;color:#fff;font-size:13px;margin-bottom:3px;">${item.title||'DL'} <span style="font-size:10px;background:rgba(0,242,254,0.15);color:#00f2fe;padding:2px 6px;border-radius:4px;">${item.badge||'LIVE'}</span></div><div style="font-size:11px;color:#94a3b8;">${item.url||'No Link'}</div></div>
      <div style="display:flex;gap:6px;"><button class="btn-perm" onclick="openDlModal('${type}',${i})"><i class='bx bx-edit'></i></button><button class="btn-del" onclick="getArr('${type}').splice(${i},1);renderDl('${type}')"><i class='bx bx-trash'></i></button></div>
    </div>`;
  });
}
function openDlModal(type, editIndex=-1) {
  document.getElementById('dl-type').value=type; document.getElementById('dl-edit-index').value=editIndex;
  const arr=getArr(type);
  if(editIndex>=0 && arr[editIndex]){ setVal('dl-title',arr[editIndex].title); setVal('dl-badge',arr[editIndex].badge); setVal('dl-url',arr[editIndex].url); }
  else{ setVal('dl-title',''); setVal('dl-badge','LIVE'); setVal('dl-url',''); }
  document.getElementById('modal-dl-button').style.display='flex';
}
function saveDlButton() {
  const type=getVal('dl-type'), idx=parseInt(getVal('dl-edit-index')), title=getVal('dl-title'), badge=getVal('dl-badge')||'LIVE', url=getVal('dl-url');
  if(!title) return alert('Title!'); const arr=getArr(type); const item={title,badge,url};
  if(idx>=0) arr[idx]=item; else arr.push(item); renderDl(type); closeModal('modal-dl-button');
}

function buildDur(num, type){ if(type==='LIFETIME') return 'LIFETIME'; return num?`${num} ${type}`:''; }

// BUY PC
function renderPackages() {
  const box=document.getElementById('buy-list'); if(!box) return; box.innerHTML='';
  packages.forEach((p,i) => {
    box.innerHTML += `<div style="background:rgba(0,0,0,0.25);padding:12px 16px;border-radius:12px;margin-bottom:10px;border:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;">
      <div style="flex:1;min-width:0;"><div style="font-weight:800;color:#fff;font-size:14px;margin-bottom:4px;">${p.name}</div><div style="font-size:12px;color:#00f2fe;font-weight:700;">Sell: ৳${p.sellPrice} <span style="color:#ef4444;margin-left:8px;">Buy: ৳${p.buyPrice}</span></div></div>
      <div style="display:flex;gap:6px;"><button class="btn-perm" onclick="openBuyModal(${i})"><i class='bx bx-edit'></i></button><button class="btn-del" onclick="packages.splice(${i},1);renderPackages()"><i class='bx bx-trash'></i></button></div>
    </div>`;
  });
}
function openBuyModal(idx=-1) {
  document.getElementById('buy-edit-index').value=idx;
  if(idx>=0){ const p=packages[idx]; setVal('buy-name',p.name); setVal('buy-buy-price',p.buyPrice); setVal('buy-sell-price',p.sellPrice); setVal('buy-duration-num',p.durationNum); setVal('buy-duration-type',p.durationType); setVal('buy-features',p.desc); }
  else { setVal('buy-name',''); setVal('buy-buy-price',''); setVal('buy-sell-price',''); setVal('buy-duration-num','30'); setVal('buy-duration-type','DAY'); setVal('buy-features',''); }
  document.getElementById('modal-buy-package').style.display='flex';
}
function saveBuyPackage() {
  const name=getVal('buy-name'), buyPrice=getVal('buy-buy-price'), sellPrice=getVal('buy-sell-price'), durationNum=getVal('buy-duration-num'), durationType=getVal('buy-duration-type'), desc=getVal('buy-features'), idx=parseInt(getVal('buy-edit-index'));
  if(!name||!sellPrice) return alert('Name & Sell Price required!');
  const pkg = { name, buyPrice, sellPrice, durationNum, durationType, durationText:buildDur(durationNum,durationType), desc };
  if(idx>=0) packages[idx]=pkg; else packages.push(pkg); renderPackages(); closeModal('modal-buy-package');
}

// MOBILE PANEL (WITH CATEGORY)
function renderMpPackages() {
  const box=document.getElementById('mp-list'); if(!box) return; box.innerHTML='';
  mpPackages.forEach((p,i) => {
    let catIcon = p.category === 'IOS' ? "<i class='bx bxl-apple'></i> iOS" : "<i class='bx bxl-android'></i> Android";
    box.innerHTML += `<div style="background:rgba(0,0,0,0.25);padding:12px 16px;border-radius:12px;margin-bottom:10px;border:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;">
      <div style="flex:1;min-width:0;">
        <div style="font-weight:800;color:#fff;font-size:14px;margin-bottom:4px;">${p.name} <span style="font-size:10px;background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;margin-left:6px;">${catIcon}</span></div>
        <div style="font-size:12px;color:#00f2fe;font-weight:700;">Sell: ৳${p.sellPrice} <span style="color:#ef4444;margin-left:8px;">Buy: ৳${p.buyPrice}</span></div>
      </div>
      <div style="display:flex;gap:6px;"><button class="btn-perm" onclick="openMpModal(${i})"><i class='bx bx-edit'></i></button><button class="btn-del" onclick="mpPackages.splice(${i},1);renderMpPackages()"><i class='bx bx-trash'></i></button></div>
    </div>`;
  });
}
function openMpModal(idx=-1) {
  document.getElementById('mp-pkg-edit-index').value=idx;
  if(idx>=0){ const p=mpPackages[idx]; setVal('mp-pkg-category',p.category); setVal('mp-pkg-name',p.name); setVal('mp-pkg-buy-price',p.buyPrice); setVal('mp-pkg-sell-price',p.sellPrice); setVal('mp-pkg-duration-num',p.durationNum); setVal('mp-pkg-duration-type',p.durationType); setVal('mp-pkg-features',p.desc); }
  else { setVal('mp-pkg-category','ANDROID'); setVal('mp-pkg-name',''); setVal('mp-pkg-buy-price',''); setVal('mp-pkg-sell-price',''); setVal('mp-pkg-duration-num','30'); setVal('mp-pkg-duration-type','DAY'); setVal('mp-pkg-features',''); }
  document.getElementById('modal-mp-package').style.display='flex';
}
function saveMpPackage() {
  const category=getVal('mp-pkg-category'), name=getVal('mp-pkg-name'), buyPrice=getVal('mp-pkg-buy-price'), sellPrice=getVal('mp-pkg-sell-price'), durationNum=getVal('mp-pkg-duration-num'), durationType=getVal('mp-pkg-duration-type'), desc=getVal('mp-pkg-features'), idx=parseInt(getVal('mp-pkg-edit-index'));
  if(!name||!sellPrice) return alert('Name & Sell Price required!');
  const pkg = { category, name, buyPrice, sellPrice, durationNum, durationType, durationText:buildDur(durationNum,durationType), desc };
  if(idx>=0) mpPackages[idx]=pkg; else mpPackages.push(pkg); renderMpPackages(); closeModal('modal-mp-package');
}

function saveData() {
  const data = {
    general: { logo:getVal('gen-logo'), discord:getVal('gen-discord'), topup:getVal('gen-topup') },
    homeCards,
    freePanel: { showVideo:getChk('fp-showVideo'), video:getVal('fp-video'), showSkip:getChk('fp-showSkip'), skip:getVal('fp-skip'), pass:getVal('fp-pass'), downloads:fpDownloads },
    freeBypass: { showVideo:getChk('fb-showVideo'), video:getVal('fb-video'), showSkip:getChk('fb-showSkip'), skip:getVal('fb-skip'), pass:getVal('fb-pass'), downloads:fbDownloads },
    emulator: { showVideo:getChk('emu-showVideo'), video:getVal('emu-video'), showSkip:getChk('emu-showSkip'), skip:getVal('emu-skip'), pass:getVal('emu-pass'), downloads:emuDownloads },
    apk: { showVideo:getChk('apk-showVideo'), video:getVal('apk-video'), showSkip:getChk('apk-showSkip'), skip:getVal('apk-skip'), downloads:apkDownloads },
    mobilePanel: { message:getVal('mp-message'), btnText:getVal('mp-btnText'), ticketLink:getVal('mp-ticketLink'), webhook:getVal('mp-webhook'), packages:mpPackages },
    buyList: packages, buyButton: { text:getVal('buy-btn-text'), link:getVal('buy-btn-link'), webhook:getVal('buy-webhook') }
  };
  db.ref('panel_data').update(data).then(()=>alert('✅ Saved!'));
}

function loadAdmins(){ db.ref('admins').on('value',s=>{ /* same code as before */ }); }
function openAddAdminModal(r){ setVal('add-admin-role',r); setVal('add-admin-email',''); document.getElementById('modal-add-admin').style.display='flex'; }
function confirmAddAdmin(){ /* same */ closeModal('modal-add-admin'); }
function closeModal(id){ document.getElementById(id).style.display='none'; }
document.querySelectorAll('.modal-overlay').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.style.display='none';}));
