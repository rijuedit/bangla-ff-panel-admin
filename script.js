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

let currentUser = null;
let userRole = "normal";
let userPerms = {};
let packages = [];
let fpDownloads = [];
let fbDownloads = [];
let emuDownloads = [];
let apkDownloads = [];
let mpDownloads = [];

document.addEventListener('mousemove', e => {
  const g = document.querySelector('.mouse-glow');
  if (g) { g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px'; }
});

function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(r => checkAdmin(r.user))
    .catch(e => document.getElementById('login-error').innerText = e.message);
}

function checkAdmin(user) {
  const key = user.email.replace(/\./g, '_');
  if (user.email === "mdrijowan359@gmail.com") {
    db.ref('admins/' + key).set({ email: user.email, role: 'super', permissions: allPermsTrue() });
    grantAccess(user, 'super', allPermsTrue());
    return;
  }
  db.ref('admins/' + key).once('value').then(snap => {
    const data = snap.val();
    if (data) grantAccess(user, data.role, data.permissions || {});
    else { alert('Access Denied!'); auth.signOut(); }
  });
}

function allPermsTrue() {
  return {
    general: true, 'free-panel': true, 'free-bypass': true, emulator: true,
    'free-fire-apk': true, 'mobile-panel': true, 'buy-panel': true
  };
}

function grantAccess(user, role, perms) {
  currentUser = user;
  userRole = role;
  userPerms = role === 'super' ? allPermsTrue() : (perms || {});

  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard-screen').style.display = 'block';
  document.getElementById('user-email').innerText = user.email;

  const badge = document.getElementById('user-role-badge');
  badge.innerText = role === 'super' ? '👑 Super Admin' : '🔧 Normal Admin';
  badge.className = 'role-tag ' + role;

  document.getElementById('tab-admins-btn').style.display = role === 'super' ? 'flex' : 'none';
  applyTabPermissions();
  loadData();
  if (role === 'super') loadAdmins();
}

function applyTabPermissions() {
  const tabs = ['general','free-panel','free-bypass','emulator','free-fire-apk','mobile-panel','buy-panel'];
  tabs.forEach(t => {
    const btn = document.querySelector(`.top-tab[data-tab="${t}"]`);
    if (!btn) return;
    btn.style.display = (userRole === 'super' || userPerms[t]) ? 'flex' : 'none';
  });
}

auth.onAuthStateChanged(user => {
  if (user) checkAdmin(user);
  else {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('dashboard-screen').style.display = 'none';
  }
});

function logout() { auth.signOut(); }

function switchTab(name) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.top-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  const btn = document.querySelector(`.top-tab[data-tab="${name}"]`) || event.currentTarget;
  btn.classList.add('active');
}

function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v || ''; }
function getVal(id) { return document.getElementById(id)?.value || ''; }

function loadData() {
  db.ref('panel_data').on('value', snap => {
    const d = snap.val() || {};

    setVal('gen-discord', d.general?.discord);
    setVal('gen-topup', d.general?.topup);

    // Visibility toggles
    const vis = d.cardVisibility || {};
    const setCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val !== false; };
    setCheck('vis-freePanel', vis.freePanel);
    setCheck('vis-freeBypass', vis.freeBypass);
    setCheck('vis-emulator', vis.emulator);
    setCheck('vis-freeFireApk', vis.freeFireApk);
    setCheck('vis-buyPanel', vis.buyPanel);
    setCheck('vis-mobilePanel', vis.mobilePanel);

    // Free Panel
    setVal('fp-video', d.freePanel?.video);
    setVal('fp-skip', d.freePanel?.skip);
    setVal('fp-pass', d.freePanel?.pass);
    fpDownloads = d.freePanel?.downloads || [];
    renderDlBox('fp-dl-container', fpDownloads, 'fpDownloads');

    // Bypass
    setVal('fb-video', d.freeBypass?.video);
    setVal('fb-skip', d.freeBypass?.skip);
    setVal('fb-pass', d.freeBypass?.pass);
    fbDownloads = d.freeBypass?.downloads || [];
    renderDlBox('fb-dl-container', fbDownloads, 'fbDownloads');

    // Emulator
    setVal('emu-video', d.emulator?.video);
    setVal('emu-skip', d.emulator?.skip);
    setVal('emu-pass', d.emulator?.pass);
    emuDownloads = d.emulator?.downloads || [];
    renderDlBox('emu-dl-container', emuDownloads, 'emuDownloads');

    // APK
    setVal('apk-video', d.apk?.video);
    setVal('apk-skip', d.apk?.skip);
    apkDownloads = d.apk?.downloads || [];
    renderDlBox('apk-dl-container', apkDownloads, 'apkDownloads');

    // Mobile Panel
    setVal('mp-video', d.mobilePanel?.video);
    setVal('mp-skip', d.mobilePanel?.skip);
    setVal('mp-pass', d.mobilePanel?.pass);
    mpDownloads = d.mobilePanel?.downloads || [];
    renderDlBox('mp-dl-container', mpDownloads, 'mpDownloads');

    packages = d.buyList || [];
    renderPackages();
  });
}

function renderDlBox(containerId, listArray, arrayName) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  listArray.forEach((item, index) => {
    container.innerHTML += `
      <div class="pkg-row" style="margin-bottom:8px;">
        <input type="text" value="${item.title || ''}" onchange="${arrayName}[${index}].title=this.value" placeholder="Button Title">
        <input type="text" value="${item.url || ''}" onchange="${arrayName}[${index}].url=this.value" placeholder="Download URL">
        <button class="btn-del" onclick="${arrayName}.splice(${index},1); renderDlBox('${containerId}', ${arrayName}, '${arrayName}')"><i class='bx bx-trash'></i></button>
      </div>`;
  });
}

function addDlBox(containerId, listArray) {
  // detect which array
  if (containerId === 'fp-dl-container') { fpDownloads.push({ title: 'NEW DOWNLOAD', url: '' }); renderDlBox(containerId, fpDownloads, 'fpDownloads'); }
  else if (containerId === 'fb-dl-container') { fbDownloads.push({ title: 'NEW DOWNLOAD', url: '' }); renderDlBox(containerId, fbDownloads, 'fbDownloads'); }
  else if (containerId === 'emu-dl-container') { emuDownloads.push({ title: 'NEW DOWNLOAD', url: '' }); renderDlBox(containerId, emuDownloads, 'emuDownloads'); }
  else if (containerId === 'apk-dl-container') { apkDownloads.push({ title: 'NEW DOWNLOAD', url: '' }); renderDlBox(containerId, apkDownloads, 'apkDownloads'); }
  else if (containerId === 'mp-dl-container') { mpDownloads.push({ title: 'NEW DOWNLOAD', url: '' }); renderDlBox(containerId, mpDownloads, 'mpDownloads'); }
}

function saveData() {
  const data = {
    general: {
      discord: getVal('gen-discord'),
      topup: getVal('gen-topup')
    },
    cardVisibility: {
      freePanel: document.getElementById('vis-freePanel')?.checked !== false,
      freeBypass: document.getElementById('vis-freeBypass')?.checked !== false,
      emulator: document.getElementById('vis-emulator')?.checked !== false,
      freeFireApk: document.getElementById('vis-freeFireApk')?.checked !== false,
      buyPanel: document.getElementById('vis-buyPanel')?.checked !== false,
      mobilePanel: document.getElementById('vis-mobilePanel')?.checked !== false
    },
    freePanel: {
      video: getVal('fp-video'), skip: getVal('fp-skip'), pass: getVal('fp-pass'), downloads: fpDownloads
    },
    freeBypass: {
      video: getVal('fb-video'), skip: getVal('fb-skip'), pass: getVal('fb-pass'), downloads: fbDownloads
    },
    emulator: {
      video: getVal('emu-video'), skip: getVal('emu-skip'), pass: getVal('emu-pass'), downloads: emuDownloads
    },
    apk: {
      video: getVal('apk-video'), skip: getVal('apk-skip'), downloads: apkDownloads
    },
    mobilePanel: {
      video: getVal('mp-video'), skip: getVal('mp-skip'), pass: getVal('mp-pass'), downloads: mpDownloads
    },
    buyList: packages
  };

  db.ref('panel_data').update(data).then(() => alert('✅ Saved Successfully!'));
}

function renderPackages() {
  const box = document.getElementById('buy-list');
  if (!box) return;
  box.innerHTML = '';
  packages.forEach((p, i) => {
    box.innerHTML += `<div class="pkg-row">
      <input value="${p.name||''}" onchange="packages[${i}].name=this.value" placeholder="Name">
      <input value="${p.price||''}" onchange="packages[${i}].price=this.value" placeholder="Price">
      <input value="${p.desc||''}" onchange="packages[${i}].desc=this.value" placeholder="Features">
      <button class="btn-del" onclick="packages.splice(${i},1);renderPackages()"><i class='bx bx-trash'></i></button>
    </div>`;
  });
}
function addPackage() { packages.push({ name: 'NEW PANEL', price: '৳0', desc: '' }); renderPackages(); }

function loadAdmins() {
  db.ref('admins').on('value', snap => {
    const admins = snap.val() || {};
    const sBox = document.getElementById('super-list');
    const nBox = document.getElementById('normal-list');
    if (!sBox || !nBox) return;
    sBox.innerHTML = ''; nBox.innerHTML = '';

    Object.keys(admins).forEach(key => {
      const a = admins[key];
      const isYou = currentUser && currentUser.email === a.email;
      const card = document.createElement('div');
      card.className = 'admin-card';
      card.innerHTML = `
        <div><strong>${a.email}</strong><small>${a.role === 'super' ? 'Super Admin' : 'Normal Admin'}</small></div>
        <div class="admin-card-btns">
          ${a.role === 'normal' && userRole === 'super' ? `<button class="btn-perm" onclick="openPermModal('${key}','${a.email}')"><i class='bx bx-cog'></i> Permissions</button>` : ''}
          ${!isYou && userRole === 'super' ? `<button class="btn-rm" onclick="removeAdmin('${key}')">Remove</button>` : ''}
          ${isYou ? '<span class="you-badge">You</span>' : ''}
        </div>`;
      if (a.role === 'super') sBox.appendChild(card);
      else nBox.appendChild(card);
    });
  });
}

function openAddAdminModal(role) {
  document.getElementById('add-admin-role').value = role;
  document.getElementById('modal-add-title').innerText = role === 'super' ? '👑 Add Super Admin' : '🔧 Add Normal Admin';
  document.getElementById('add-admin-email').value = '';
  document.getElementById('modal-add-admin').style.display = 'flex';
}

function confirmAddAdmin() {
  const email = document.getElementById('add-admin-email').value.trim();
  const role = document.getElementById('add-admin-role').value;
  if (!email || !email.includes('@')) return alert('Valid email required!');
  const key = email.replace(/\./g, '_');
  const perms = role === 'super' ? allPermsTrue() : {
    general: false, 'free-panel': true, 'free-bypass': true, emulator: true,
    'free-fire-apk': true, 'mobile-panel': true, 'buy-panel': true
  };
  db.ref('admins/' + key).set({ email, role, permissions: perms }).then(() => {
    closeModal('modal-add-admin');
    alert('✅ Admin Added!');
  });
}

function openPermModal(key, email) {
  document.getElementById('perm-email-key').value = key;
  document.getElementById('perm-email-label').innerText = email;
  db.ref('admins/' + key + '/permissions').once('value').then(snap => {
    const p = snap.val() || {};
    document.getElementById('perm-general').checked = !!p.general;
    document.getElementById('perm-free-panel').checked = !!p['free-panel'];
    document.getElementById('perm-free-bypass').checked = !!p['free-bypass'];
    document.getElementById('perm-emulator').checked = !!p.emulator;
    document.getElementById('perm-free-fire-apk').checked = !!p['free-fire-apk'];
    document.getElementById('perm-mobile-panel').checked = !!p['mobile-panel'];
    document.getElementById('perm-buy-panel').checked = !!p['buy-panel'];
    document.getElementById('modal-permissions').style.display = 'flex';
  });
}

function savePermissions() {
  const key = document.getElementById('perm-email-key').value;
  const perms = {
    general: document.getElementById('perm-general').checked,
    'free-panel': document.getElementById('perm-free-panel').checked,
    'free-bypass': document.getElementById('perm-free-bypass').checked,
    emulator: document.getElementById('perm-emulator').checked,
    'free-fire-apk': document.getElementById('perm-free-fire-apk').checked,
    'mobile-panel': document.getElementById('perm-mobile-panel').checked,
    'buy-panel': document.getElementById('perm-buy-panel').checked
  };
  db.ref('admins/' + key + '/permissions').set(perms).then(() => {
    closeModal('modal-permissions');
    alert('✅ Permissions Saved!');
  });
}

function removeAdmin(key) {
  if (confirm('Remove this admin?')) db.ref('admins/' + key).remove();
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }

document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.style.display = 'none'; });
});
