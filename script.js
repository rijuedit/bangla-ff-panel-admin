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
const auth = firebase.auth();
const db = firebase.database();

let currentUser = null, userRole = "normal", userPerms = {};
let packages = [], mpPackages = [];
let fpDownloads = [], fbDownloads = [], emuDownloads = [], apkDownloads = [];

let homeCards = [
  { key:"freePanel", icon:"💻", title:"FREE PANEL", subtitle:"NEW PC PANEL UPDATED OB55", featured:true, visible:true },
  { key:"freeBypass", icon:"💻", title:"FREE BYPASS", subtitle:"PREMIUM • FAST • RELIABLE", featured:false, visible:true },
  { key:"emulator", icon:"💎", title:"EMULATOR", subtitle:"WORKING EMULATOR", featured:false, visible:true },
  { key:"freeFireApk", icon:"⚡", title:"FREE FIRE APK", subtitle:"DOWNLOAD LATEST APK", featured:false, visible:true },
  { key:"buyPanel", icon:"🔥", title:"BUY PANEL", subtitle:"PREMIUM • FAST • RELIABLE", featured:false, visible:true },
  { key:"mobilePanel", icon:"📱", title:"MOBILE PANEL", subtitle:"ANDROID MOBILE SYSTEM", featured:false, visible:true }
];

document.addEventListener('mousemove', e => {
  const g = document.querySelector('.mouse-glow');
  if (g) { g.style.left = e.clientX+'px'; g.style.top = e.clientY+'px'; }
});

function loginWithGoogle() {
  auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
    .then(r => checkAdmin(r.user))
    .catch(e => document.getElementById('login-error').innerText = e.message);
}

function checkAdmin(user) {
  const key = user.email.replace(/\./g, '_');
  if (user.email === "mdrijowan359@gmail.com") {
    db.ref('admins/'+key).set({ email:user.email, role:'super', permissions:allPerms() });
    grantAccess(user, 'super', allPerms());
    return;
  }
  db.ref('admins/'+key).once('value').then(s => {
    const d = s.val();
    if (d) grantAccess(user, d.role, d.permissions||{});
    else { alert('Access Denied!'); auth.signOut(); }
  });
}

function allPerms() {
  return { general:1, cards:1, 'free-panel':1, 'free-bypass':1, emulator:1, 'free-fire-apk':1, 'mobile-panel':1, 'buy-panel':1 };
}

function grantAccess(user, role, perms) {
  currentUser = user; userRole = role; userPerms = role==='super' ? allPerms() : (perms||{});
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard-screen').style.display = 'block';
  document.getElementById('user-email').innerText = user.email;
  const b = document.getElementById('user-role-badge');
  b.innerText = role==='super' ? '👑 Super Admin' : '🔧 Normal Admin';
  b.className = 'role-tag '+role;
  document.getElementById('tab-admins-btn').style.display = role==='super' ? 'flex' : 'none';
  applyTabPermissions();
  loadData();
  if (role==='super') loadAdmins();
}

function applyTabPermissions() {
  ['general','cards','free-panel','free-bypass','emulator','free-fire-apk','mobile-panel','buy-panel'].forEach(t => {
    const btn = document.querySelector(`.top-tab[data-tab="${t}"]`);
    if (btn) btn.style.display = (userRole==='super' || userPerms[t]) ? 'flex' : 'none';
  });
}

auth.onAuthStateChanged(u => {
  if (u) checkAdmin(u);
  else {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('dashboard-screen').style.display = 'none';
  }
});

function logout() { auth.signOut(); }

function switchTab(name) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.top-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  (document.querySelector(`.top-tab[data-tab="${name}"]`)||event.currentTarget).classList.add('active');
}

function setVal(id,v){ const e=document.getElementById(id); if(e) e.value=v||''; }
function getVal(id){ return document.getElementById(id)?.value||''; }
function setChk(id,v){ const e=document.getElementById(id); if(e) e.checked=v!==false; }
function getChk(id){ return document.getElementById(id)?.checked!==false; }

function loadData() {
  db.ref('panel_data').on('value', snap => {
    const d = snap.val()||{};
    setVal('gen-logo', d.general?.logo);
    setVal('gen-discord', d.general?.discord);
    setVal('gen-topup', d.general?.topup);

    if (d.homeCards?.length) homeCards = d.homeCards;
    renderHomeCardsEditor();

    setChk('fp-showVideo', d.freePanel?.showVideo); setVal('fp-video', d.freePanel?.video);
    setChk('fp-showSkip', d.freePanel?.showSkip); setVal('fp-skip', d.freePanel?.skip);
    setVal('fp-pass', d.freePanel?.pass); fpDownloads = d.freePanel?.downloads||[]; renderDl('fp');

    setChk('fb-showVideo', d.freeBypass?.showVideo); setVal('fb-video', d.freeBypass?.video);
    setChk('fb-showSkip', d.freeBypass?.showSkip); setVal('fb-skip', d.freeBypass?.skip);
    setVal('fb-pass', d.freeBypass?.pass); fbDownloads = d.freeBypass?.downloads||[]; renderDl('fb');

    setChk('emu-showVideo', d.emulator?.showVideo); setVal('emu-video', d.emulator?.video);
    setChk('emu-showSkip', d.emulator?.showSkip); setVal('emu-skip', d.emulator?.skip);
    setVal('emu-pass', d.emulator?.pass); emuDownloads = d.emulator?.downloads||[]; renderDl('emu');

    setChk('apk-showVideo', d.apk?.showVideo); setVal('apk-video', d.apk?.video);
    setChk('apk-showSkip', d.apk?.showSkip); setVal('apk-skip', d.apk?.skip);
    apkDownloads = d.apk?.downloads||[]; renderDl('apk');

    setVal('mp-message', d.mobilePanel?.message||'Mobile panel কিনতে Ticket এ যোগাযোগ করুন');
    setVal('mp-btnText', d.mobilePanel?.btnText||'TICKET');
    setVal('mp-ticketLink', d.mobilePanel?.ticketLink);
    mpPackages = d.mobilePanel?.packages||[]; renderMpPackages();

    setVal('buy-btn-text', d.buyButton?.text||'BUY NOW');
    setVal('buy-btn-link', d.buyButton?.link||'');
    packages = d.buyList||[]; renderPackages();
  });
}

function renderHomeCardsEditor() {
  const box = document.getElementById('home-cards-editor'); if(!box) return;
  box.innerHTML = '';
  homeCards.forEach((c,i) => {
    box.innerHTML += `<div class="editor-card">
      <div class="editor-card-head">
        <strong>${c.key}</strong>
        <label class="switch"><input type="checkbox" ${c.visible!==false?'checked':''} onchange="homeCards[${i}].visible=this.checked"><span class="slider"></span></label>
      </div>
      <div class="pkg-row">
        <input class="icon-input" value="${c.icon||''}" onchange="homeCards[${i}].icon=this.value" placeholder="💻">
        <input value="${c.title||''}" onchange="homeCards[${i}].title=this.value" placeholder="Title">
        <input value="${c.subtitle||''}" onchange="homeCards[${i}].subtitle=this.value" placeholder="Subtitle">
      </div>
      <label class="feat-check"><input type="checkbox" ${c.featured?'checked':''} onchange="homeCards[${i}].featured=this.checked"> Featured Badge</label>
    </div>`;
  });
}

function getArr(t){ return t==='fp'?fpDownloads:t==='fb'?fbDownloads:t==='emu'?emuDownloads:t==='apk'?apkDownloads:[]; }

function renderDl(type) {
  const box = document.getElementById(type+'-dl-container'); if(!box) return;
  const arr = getArr(type); box.innerHTML = '';
  arr.forEach((item,i) => {
    box.innerHTML += `<div class="list-item">
      <div class="list-item-info">
        <div class="list-item-title">${item.title||'Download'} <span class="badge-pill">${item.badge||'LIVE'}</span></div>
        <div class="list-item-url">${item.url||'No Link'}</div>
      </div>
      <div class="list-item-btns">
        <button class="btn-perm" onclick="openDlModal('${type}',${i})"><i class='bx bx-edit'></i></button>
        <button class="btn-del" onclick="getArr('${type}').splice(${i},1);renderDl('${type}')"><i class='bx bx-trash'></i></button>
      </div>
    </div>`;
  });
}

function openDlModal(type, editIndex=-1) {
  document.getElementById('dl-type').value = type;
  document.getElementById('dl-edit-index').value = editIndex;
  document.getElementById('dl-modal-title').innerText = editIndex>=0 ? '✏️ Edit Download' : '📥 Add Download';
  const arr = getArr(type);
  if (editIndex>=0 && arr[editIndex]) {
    document.getElementById('dl-title').value = arr[editIndex].title||'';
    document.getElementById('dl-badge').value = arr[editIndex].badge||'LIVE';
    document.getElementById('dl-url').value = arr[editIndex].url||'';
  } else {
    document.getElementById('dl-title').value = '';
    document.getElementById('dl-badge').value = 'LIVE';
    document.getElementById('dl-url').value = '';
  }
  document.getElementById('modal-dl-button').style.display = 'flex';
}

function saveDlButton() {
  const type = document.getElementById('dl-type').value;
  const idx = parseInt(document.getElementById('dl-edit-index').value);
  const title = document.getElementById('dl-title').value.trim();
  const badge = document.getElementById('dl-badge').value.trim()||'LIVE';
  const url = document.getElementById('dl-url').value.trim();
  if (!title) return alert('Title লিখুন!');
  const arr = getArr(type);
  const item = { title, badge, url };
  if (idx>=0) arr[idx] = item; else arr.push(item);
  renderDl(type);
  closeModal('modal-dl-button');
}

function renderPackages() {
  const box = document.getElementById('buy-list'); if(!box) return;
  box.innerHTML = '';
  packages.forEach((p,i) => {
    const dp = p.displayPrice||(p.durationText?`${p.priceText||'৳'+p.price} / ${p.durationText}`:(p.priceText||'৳'+p.price));
    box.innerHTML += `<div class="list-item">
      <div class="list-item-info">
        <div class="list-item-title">${p.name||'Untitled'}</div>
        <div class="list-item-price">${dp}</div>
        <div class="list-item-url">${p.desc||''}</div>
      </div>
      <div class="list-item-btns">
        <button class="btn-perm" onclick="openBuyModal(${i})"><i class='bx bx-edit'></i></button>
        <button class="btn-del" onclick="packages.splice(${i},1);renderPackages()"><i class='bx bx-trash'></i></button>
      </div>
    </div>`;
  });
}

function openBuyModal(editIndex=-1) {
  document.getElementById('buy-edit-index').value = editIndex;
  document.getElementById('buy-modal-title').innerText = editIndex>=0?'✏️ Edit Package':'🛒 Add Package';
  if (editIndex>=0 && packages[editIndex]) {
    const p = packages[editIndex];
    document.getElementById('buy-name').value = p.name||'';
    document.getElementById('buy-price').value = p.price||'';
    document.getElementById('buy-duration-num').value = p.durationNum||'30';
    document.getElementById('buy-duration-type').value = p.durationType||'DAY';
    document.getElementById('buy-features').value = p.desc||'';
  } else {
    document.getElementById('buy-name').value = '';
    document.getElementById('buy-price').value = '';
    document.getElementById('buy-duration-num').value = '30';
    document.getElementById('buy-duration-type').value = 'DAY';
    document.getElementById('buy-features').value = '';
  }
  document.getElementById('modal-buy-package').style.display = 'flex';
}

function saveBuyPackage() {
  const name = document.getElementById('buy-name').value.trim();
  const price = document.getElementById('buy-price').value.trim();
  const durationNum = document.getElementById('buy-duration-num').value.trim();
  const durationType = document.getElementById('buy-duration-type').value;
  const features = document.getElementById('buy-features').value.trim();
  const idx = parseInt(document.getElementById('buy-edit-index').value);
  if (!name) return alert('Name লিখুন!');
  if (!price) return alert('Price লিখুন!');
  const durationText = durationType==='LIFETIME'?'LIFETIME':(durationNum?`${durationNum} ${durationType}`:'');
  const priceText = `৳${price}`;
  const displayPrice = durationText?`${priceText} / ${durationText}`:priceText;
  const pkg = { name, price, priceText, durationNum, durationType, durationText, desc:features, displayPrice };
  if (idx>=0) packages[idx]=pkg; else packages.push(pkg);
  renderPackages();
  closeModal('modal-buy-package');
}

function renderMpPackages() {
  const box = document.getElementById('mp-list'); if(!box) return;
  box.innerHTML = '';
  mpPackages.forEach((p,i) => {
    const dp = p.displayPrice||(p.durationText?`${p.priceText||'৳'+p.price} / ${p.durationText}`:(p.priceText||'৳'+p.price));
    box.innerHTML += `<div class="list-item">
      <div class="list-item-info">
        <div class="list-item-title">${p.name||'Untitled'}</div>
        <div class="list-item-price">${dp}</div>
        <div class="list-item-url">${p.desc||''}</div>
      </div>
      <div class="list-item-btns">
        <button class="btn-perm" onclick="openMpModal(${i})"><i class='bx bx-edit'></i></button>
        <button class="btn-del" onclick="mpPackages.splice(${i},1);renderMpPackages()"><i class='bx bx-trash'></i></button>
      </div>
    </div>`;
  });
}

function openMpModal(editIndex=-1) {
  document.getElementById('mp-pkg-edit-index').value = editIndex;
  document.getElementById('mp-modal-title').innerText = editIndex>=0?'✏️ Edit Mobile Package':'📱 Add Mobile Package';
  if (editIndex>=0 && mpPackages[editIndex]) {
    const p = mpPackages[editIndex];
    document.getElementById('mp-pkg-name').value = p.name||'';
    document.getElementById('mp-pkg-price').value = p.price||'';
    document.getElementById('mp-pkg-duration-num').value = p.durationNum||'30';
    document.getElementById('mp-pkg-duration-type').value = p.durationType||'DAY';
    document.getElementById('mp-pkg-features').value = p.desc||'';
  } else {
    document.getElementById('mp-pkg-name').value = '';
    document.getElementById('mp-pkg-price').value = '';
    document.getElementById('mp-pkg-duration-num').value = '30';
    document.getElementById('mp-pkg-duration-type').value = 'DAY';
    document.getElementById('mp-pkg-features').value = '';
  }
  document.getElementById('modal-mp-package').style.display = 'flex';
}

function saveMpPackage() {
  const name = document.getElementById('mp-pkg-name').value.trim();
  const price = document.getElementById('mp-pkg-price').value.trim();
  const durationNum = document.getElementById('mp-pkg-duration-num').value.trim();
  const durationType = document.getElementById('mp-pkg-duration-type').value;
  const features = document.getElementById('mp-pkg-features').value.trim();
  const idx = parseInt(document.getElementById('mp-pkg-edit-index').value);
  if (!name) return alert('Name লিখুন!');
  if (!price) return alert('Price লিখুন!');
  const durationText = durationType==='LIFETIME'?'LIFETIME':(durationNum?`${durationNum} ${durationType}`:'');
  const priceText = `৳${price}`;
  const displayPrice = durationText?`${priceText} / ${durationText}`:priceText;
  const pkg = { name, price, priceText, durationNum, durationType, durationText, desc:features, displayPrice };
  if (idx>=0) mpPackages[idx]=pkg; else mpPackages.push(pkg);
  renderMpPackages();
  closeModal('modal-mp-package');
}

function saveData() {
  const data = {
    general: { logo:getVal('gen-logo'), discord:getVal('gen-discord'), topup:getVal('gen-topup') },
    homeCards: homeCards,
    freePanel: { showVideo:getChk('fp-showVideo'), video:getVal('fp-video'), showSkip:getChk('fp-showSkip'), skip:getVal('fp-skip'), pass:getVal('fp-pass'), downloads:fpDownloads },
    freeBypass: { showVideo:getChk('fb-showVideo'), video:getVal('fb-video'), showSkip:getChk('fb-showSkip'), skip:getVal('fb-skip'), pass:getVal('fb-pass'), downloads:fbDownloads },
    emulator: { showVideo:getChk('emu-showVideo'), video:getVal('emu-video'), showSkip:getChk('emu-showSkip'), skip:getVal('emu-skip'), pass:getVal('emu-pass'), downloads:emuDownloads },
    apk: { showVideo:getChk('apk-showVideo'), video:getVal('apk-video'), showSkip:getChk('apk-showSkip'), skip:getVal('apk-skip'), downloads:apkDownloads },
    mobilePanel: { message:getVal('mp-message'), btnText:getVal('mp-btnText')||'TICKET', ticketLink:getVal('mp-ticketLink'), packages:mpPackages },
    buyList: packages,
    buyButton: { text:getVal('buy-btn-text')||'BUY NOW', link:getVal('buy-btn-link') }
  };
  db.ref('panel_data').update(data).then(() => alert('✅ Saved Successfully!'));
}

function loadAdmins() {
  db.ref('admins').on('value', snap => {
    const admins = snap.val()||{};
    const sBox = document.getElementById('super-list'), nBox = document.getElementById('normal-list');
    if (!sBox||!nBox) return;
    sBox.innerHTML = ''; nBox.innerHTML = '';
    Object.keys(admins).forEach(key => {
      const a = admins[key];
      const isYou = currentUser && currentUser.email===a.email;
      const card = document.createElement('div');
      card.className = 'admin-card';
      card.innerHTML = `<div><strong>${a.email}</strong><small>${a.role==='super'?'Super Admin':'Normal Admin'}</small></div>
        <div class="admin-card-btns">
          ${a.role==='normal'&&userRole==='super'?`<button class="btn-perm" onclick="openPermModal('${key}','${a.email}')"><i class='bx bx-cog'></i></button>`:''}
          ${!isYou&&userRole==='super'?`<button class="btn-rm" onclick="removeAdmin('${key}')">Remove</button>`:''}
          ${isYou?'<span class="you-badge">You</span>':''}
        </div>`;
      (a.role==='super'?sBox:nBox).appendChild(card);
    });
  });
}

function openAddAdminModal(role) {
  document.getElementById('add-admin-role').value = role;
  document.getElementById('modal-add-title').innerText = role==='super'?'👑 Add Super Admin':'🔧 Add Normal Admin';
  document.getElementById('add-admin-email').value = '';
  document.getElementById('modal-add-admin').style.display = 'flex';
}

function confirmAddAdmin() {
  const email = document.getElementById('add-admin-email').value.trim();
  const role = document.getElementById('add-admin-role').value;
  if (!email||!email.includes('@')) return alert('Valid email!');
  const key = email.replace(/\./g,'_');
  const perms = role==='super'?allPerms():{general:0,cards:1,'free-panel':1,'free-bypass':1,emulator:1,'free-fire-apk':1,'mobile-panel':1,'buy-panel':1};
  db.ref('admins/'+key).set({email,role,permissions:perms}).then(()=>{closeModal('modal-add-admin');alert('✅ Added!');});
}

function openPermModal(key, email) {
  document.getElementById('perm-email-key').value = key;
  document.getElementById('perm-email-label').innerText = email;
  db.ref('admins/'+key+'/permissions').once('value').then(s => {
    const p = s.val()||{};
    ['general','cards','free-panel','free-bypass','emulator','free-fire-apk','mobile-panel','buy-panel'].forEach(k => {
      const el = document.getElementById('perm-'+k); if(el) el.checked = !!p[k];
    });
    document.getElementById('modal-permissions').style.display = 'flex';
  });
}

function savePermissions() {
  const key = document.getElementById('perm-email-key').value;
  const perms = {};
  ['general','cards','free-panel','free-bypass','emulator','free-fire-apk','mobile-panel','buy-panel'].forEach(k => {
    perms[k] = document.getElementById('perm-'+k)?.checked||false;
  });
  db.ref('admins/'+key+'/permissions').set(perms).then(()=>{closeModal('modal-permissions');alert('✅ Saved!');});
}

function removeAdmin(key) { if(confirm('Remove?')) db.ref('admins/'+key).remove(); }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
document.querySelectorAll('.modal-overlay').forEach(m => m.addEventListener('click', e => { if(e.target===m) m.style.display='none'; }));
