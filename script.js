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
let packages = [], fpDownloads = [], fbDownloads = [], emuDownloads = [], apkDownloads = [];

document.addEventListener('mousemove', e => {
  const g = document.querySelector('.mouse-glow');
  if (g) { g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px'; }
});

function loginWithGoogle() {
  auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
    .then(r => checkAdmin(r.user))
    .catch(e => document.getElementById('login-error').innerText = e.message);
}

function checkAdmin(user) {
  const key = user.email.replace(/\./g, '_');
  if (user.email === "mdrijowan359@gmail.com") {
    db.ref('admins/' + key).set({ email: user.email, role: 'super', permissions: allPerms() });
    grantAccess(user, 'super', allPerms());
    return;
  }
  db.ref('admins/' + key).once('value').then(s => {
    const d = s.val();
    if (d) grantAccess(user, d.role, d.permissions || {});
    else { alert('Access Denied!'); auth.signOut(); }
  });
}

function allPerms() {
  return { general:1,'free-panel':1,'free-bypass':1,emulator:1,'free-fire-apk':1,'mobile-panel':1,'buy-panel':1 };
}

function grantAccess(user, role, perms) {
  currentUser = user; userRole = role; userPerms = role==='super' ? allPerms() : (perms||{});
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard-screen').style.display = 'block';
  document.getElementById('user-email').innerText = user.email;
  const b = document.getElementById('user-role-badge');
  b.innerText = role==='super' ? '👑 Super Admin' : '🔧 Normal Admin';
  b.className = 'role-tag ' + role;
  document.getElementById('tab-admins-btn').style.display = role==='super' ? 'flex' : 'none';
  applyTabPermissions();
  loadData();
  if (role==='super') loadAdmins();
}

function applyTabPermissions() {
  ['general','free-panel','free-bypass','emulator','free-fire-apk','mobile-panel','buy-panel'].forEach(t => {
    const btn = document.querySelector(`.top-tab[data-tab="${t}"]`);
    if (btn) btn.style.display = (userRole==='super' || userPerms[t]) ? 'flex' : 'none';
  });
}

auth.onAuthStateChanged(u => u ? checkAdmin(u) : (
  document.getElementById('login-screen').style.display='flex',
  document.getElementById('dashboard-screen').style.display='none'
));

function logout(){ auth.signOut(); }

function switchTab(name){
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.top-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  (document.querySelector(`.top-tab[data-tab="${name}"]`)||event.currentTarget).classList.add('active');
}

function setVal(id,v){ const e=document.getElementById(id); if(e) e.value=v||''; }
function getVal(id){ return document.getElementById(id)?.value||''; }
function setChk(id,v){ const e=document.getElementById(id); if(e) e.checked = v!==false; }
function getChk(id){ return document.getElementById(id)?.checked!==false; }

function loadData(){
  db.ref('panel_data').on('value', snap => {
    const d = snap.val()||{};
    setVal('gen-logo', d.general?.logo);
    setVal('gen-discord', d.general?.discord);
    setVal('gen-topup', d.general?.topup);

    const vis = d.cardVisibility||{};
    setChk('vis-freePanel', vis.freePanel);
    setChk('vis-freeBypass', vis.freeBypass);
    setChk('vis-emulator', vis.emulator);
    setChk('vis-freeFireApk', vis.freeFireApk);
    setChk('vis-buyPanel', vis.buyPanel);
    setChk('vis-mobilePanel', vis.mobilePanel);

    // Free Panel
    setChk('fp-showVideo', d.freePanel?.showVideo);
    setVal('fp-video', d.freePanel?.video);
    setChk('fp-showSkip', d.freePanel?.showSkip);
    setVal('fp-skip', d.freePanel?.skip);
    setVal('fp-pass', d.freePanel?.pass);
    fpDownloads = d.freePanel?.downloads||[];
    renderDl('fp');

    // Bypass
    setChk('fb-showVideo', d.freeBypass?.showVideo);
    setVal('fb-video', d.freeBypass?.video);
    setChk('fb-showSkip', d.freeBypass?.showSkip);
    setVal('fb-skip', d.freeBypass?.skip);
    setVal('fb-pass', d.freeBypass?.pass);
    fbDownloads = d.freeBypass?.downloads||[];
    renderDl('fb');

    // Emulator
    setChk('emu-showVideo', d.emulator?.showVideo);
    setVal('emu-video', d.emulator?.video);
    setChk('emu-showSkip', d.emulator?.showSkip);
    setVal('emu-skip', d.emulator?.skip);
    setVal('emu-pass', d.emulator?.pass);
    emuDownloads = d.emulator?.downloads||[];
    renderDl('emu');

    // APK
    setChk('apk-showVideo', d.apk?.showVideo);
    setVal('apk-video', d.apk?.video);
    setChk('apk-showSkip', d.apk?.showSkip);
    setVal('apk-skip', d.apk?.skip);
    apkDownloads = d.apk?.downloads||[];
    renderDl('apk');

    // Mobile Panel
    setVal('mp-message', d.mobilePanel?.message || 'Mobile panel কিনতে Ticket এ যোগাযোগ করুন');
    setVal('mp-btnText', d.mobilePanel?.btnText || 'TICKET');
    setVal('mp-ticketLink', d.mobilePanel?.ticketLink);

    packages = d.buyList||[];
    renderPackages();
  });
}

function getArr(type){
  if(type==='fp') return fpDownloads;
  if(type==='fb') return fbDownloads;
  if(type==='emu') return emuDownloads;
  if(type==='apk') return apkDownloads;
  return [];
}
function setArr(type, arr){
  if(type==='fp') fpDownloads=arr;
  if(type==='fb') fbDownloads=arr;
  if(type==='emu') emuDownloads=arr;
  if(type==='apk') apkDownloads=arr;
}

function renderDl(type){
  const box = document.getElementById(type+'-dl-container');
  if(!box) return;
  const arr = getArr(type);
  box.innerHTML = '';
  arr.forEach((item,i)=>{
    box.innerHTML += `<div class="pkg-row" style="margin-bottom:8px;">
      <input value="${item.title||''}" onchange="getArr('${type}')[${i}].title=this.value" placeholder="Button Title">
      <input value="${item.url||''}" onchange="getArr('${type}')[${i}].url=this.value" placeholder="Download URL">
      <button class="btn-del" onclick="getArr('${type}').splice(${i},1);renderDl('${type}')"><i class='bx bx-trash'></i></button>
    </div>`;
  });
}

function addDl(type){
  getArr(type).push({title:'NEW DOWNLOAD', url:''});
  renderDl(type);
}

function saveData(){
  const data = {
    general: {
      logo: getVal('gen-logo'),
      discord: getVal('gen-discord'),
      topup: getVal('gen-topup')
    },
    cardVisibility: {
      freePanel: getChk('vis-freePanel'),
      freeBypass: getChk('vis-freeBypass'),
      emulator: getChk('vis-emulator'),
      freeFireApk: getChk('vis-freeFireApk'),
      buyPanel: getChk('vis-buyPanel'),
      mobilePanel: getChk('vis-mobilePanel')
    },
    freePanel: {
      showVideo: getChk('fp-showVideo'), video: getVal('fp-video'),
      showSkip: getChk('fp-showSkip'), skip: getVal('fp-skip'),
      pass: getVal('fp-pass'), downloads: fpDownloads
    },
    freeBypass: {
      showVideo: getChk('fb-showVideo'), video: getVal('fb-video'),
      showSkip: getChk('fb-showSkip'), skip: getVal('fb-skip'),
      pass: getVal('fb-pass'), downloads: fbDownloads
    },
    emulator: {
      showVideo: getChk('emu-showVideo'), video: getVal('emu-video'),
      showSkip: getChk('emu-showSkip'), skip: getVal('emu-skip'),
      pass: getVal('emu-pass'), downloads: emuDownloads
    },
    apk: {
      showVideo: getChk('apk-showVideo'), video: getVal('apk-video'),
      showSkip: getChk('apk-showSkip'), skip: getVal('apk-skip'),
      downloads: apkDownloads
    },
    mobilePanel: {
      message: getVal('mp-message'),
      btnText: getVal('mp-btnText') || 'TICKET',
      ticketLink: getVal('mp-ticketLink')
    },
    buyList: packages
  };
  db.ref('panel_data').update(data).then(()=>alert('✅ Saved Successfully!'));
}

function renderPackages(){
  const box=document.getElementById('buy-list'); if(!box) return;
  box.innerHTML='';
  packages.forEach((p,i)=>{
    box.innerHTML+=`<div class="pkg-row">
      <input value="${p.name||''}" onchange="packages[${i}].name=this.value" placeholder="Name">
      <input value="${p.price||''}" onchange="packages[${i}].price=this.value" placeholder="Price">
      <input value="${p.desc||''}" onchange="packages[${i}].desc=this.value" placeholder="Features">
      <button class="btn-del" onclick="packages.splice(${i},1);renderPackages()"><i class='bx bx-trash'></i></button>
    </div>`;
  });
}
function addPackage(){ packages.push({name:'NEW PANEL',price:'৳0',desc:''}); renderPackages(); }

function loadAdmins(){
  db.ref('admins').on('value', snap=>{
    const admins=snap.val()||{};
    const sBox=document.getElementById('super-list'), nBox=document.getElementById('normal-list');
    if(!sBox||!nBox) return;
    sBox.innerHTML=''; nBox.innerHTML='';
    Object.keys(admins).forEach(key=>{
      const a=admins[key];
      const isYou=currentUser&&currentUser.email===a.email;
      const card=document.createElement('div');
      card.className='admin-card';
      card.innerHTML=`<div><strong>${a.email}</strong><small>${a.role==='super'?'Super Admin':'Normal Admin'}</small></div>
        <div class="admin-card-btns">
          ${a.role==='normal'&&userRole==='super'?`<button class="btn-perm" onclick="openPermModal('${key}','${a.email}')"><i class='bx bx-cog'></i> Permissions</button>`:''}
          ${!isYou&&userRole==='super'?`<button class="btn-rm" onclick="removeAdmin('${key}')">Remove</button>`:''}
          ${isYou?'<span class="you-badge">You</span>':''}
        </div>`;
      (a.role==='super'?sBox:nBox).appendChild(card);
    });
  });
}

function openAddAdminModal(role){
  document.getElementById('add-admin-role').value=role;
  document.getElementById('modal-add-title').innerText=role==='super'?'👑 Add Super Admin':'🔧 Add Normal Admin';
  document.getElementById('add-admin-email').value='';
  document.getElementById('modal-add-admin').style.display='flex';
}
function confirmAddAdmin(){
  const email=document.getElementById('add-admin-email').value.trim();
  const role=document.getElementById('add-admin-role').value;
  if(!email||!email.includes('@')) return alert('Valid email required!');
  const key=email.replace(/\./g,'_');
  const perms=role==='super'?allPerms():{general:0,'free-panel':1,'free-bypass':1,emulator:1,'free-fire-apk':1,'mobile-panel':1,'buy-panel':1};
  db.ref('admins/'+key).set({email,role,permissions:perms}).then(()=>{closeModal('modal-add-admin');alert('✅ Admin Added!');});
}
function openPermModal(key,email){
  document.getElementById('perm-email-key').value=key;
  document.getElementById('perm-email-label').innerText=email;
  db.ref('admins/'+key+'/permissions').once('value').then(s=>{
    const p=s.val()||{};
    ['general','free-panel','free-bypass','emulator','free-fire-apk','mobile-panel','buy-panel'].forEach(k=>{
      const el=document.getElementById('perm-'+k); if(el) el.checked=!!p[k];
    });
    document.getElementById('modal-permissions').style.display='flex';
  });
}
function savePermissions(){
  const key=document.getElementById('perm-email-key').value;
  const perms={};
  ['general','free-panel','free-bypass','emulator','free-fire-apk','mobile-panel','buy-panel'].forEach(k=>{
    perms[k]=document.getElementById('perm-'+k)?.checked||false;
  });
  db.ref('admins/'+key+'/permissions').set(perms).then(()=>{closeModal('modal-permissions');alert('✅ Saved!');});
}
function removeAdmin(key){ if(confirm('Remove?')) db.ref('admins/'+key).remove(); }
function closeModal(id){ document.getElementById(id).style.display='none'; }
document.querySelectorAll('.modal-overlay').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.style.display='none';}));
