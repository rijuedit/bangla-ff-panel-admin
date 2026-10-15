// =========================================
// FIREBASE CONFIG
// =========================================
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

// Mouse glow
document.addEventListener('mousemove', e => {
  const g = document.querySelector('.mouse-glow');
  if (g) { g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px'; }
});

// ===== AUTH =====
function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(r => checkAdmin(r.user))
    .catch(e => document.getElementById('login-error').innerText = e.message);
}

function checkAdmin(user) {
  const key = user.email.replace(/\./g, '_');
  
  // 100% Guaranteed Access for Owner
  if (user.email === "mdrijowan359@gmail.com") {
    db.ref('admins/' + key).set({ email: user.email, role: 'super', permissions: allPermsTrue() });
    grantAccess(user, 'super', allPermsTrue());
    return;
  }

  // Check for other admins in Database
  db.ref('admins/' + key).once('value').then(snap => {
    const data = snap.val();
    if (data) {
      grantAccess(user, data.role, data.permissions || {});
    } else {
      alert('Access Denied!');
      auth.signOut();
    }
  });
}

function allPermsTrue() {
  return { general: true, 'free-panel': true, 'free-bypass': true, emulator: true, 'free-fire-apk': true, 'buy-panel': true };
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
  const tabs = ['general','free-panel','free-bypass','emulator','free-fire-apk','buy-panel'];
  tabs.forEach(t => {
    const btn = document.querySelector(`.top-tab[data-tab="${t}"]`);
    if (!btn) return;
    if (userRole === 'super' || userPerms[t]) {
      btn.style.display = 'flex';
    } else {
      btn.style.display = 'none';
    }
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

// ===== TABS =====
function switchTab(name) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.top-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  const btn = document.querySelector(`.top-tab[data-tab="${name}"]`) || event.currentTarget;
  btn.classList.add('active');
}

// ===== DATA LOAD / SAVE =====
function loadData() {
  db.ref('panel_data').on('value', snap => {
    const d = snap.val() || {};
    setVal('gen-discord', d.general?.discord);
    setVal('gen-topup', d.general?.topup);
    setVal('fp-video', d.freePanel?.video); setVal('fp-skip', d.freePanel?.skip); setVal('fp-pass', d.freePanel?.pass); setVal('fp-dl1', d.freePanel?.dl1); setVal('fp-dl2', d.freePanel?.dl2);
    setVal('fb-video', d.freeBypass?.video); setVal('fb-skip', d.freeBypass?.skip); setVal('fb-pass', d.freeBypass?.pass); setVal('fb-dl1', d.freeBypass?.dl1); setVal('fb-dl2', d.freeBypass?.dl2);
    setVal('emu-video', d.emulator?.video); setVal('emu-skip', d.emulator?.skip); setVal('emu-pass', d.emulator?.pass); setVal('emu-dl1', d.emulator?.dl1); setVal('emu-dl2', d.emulator?.dl2);
    setVal('apk-video', d.apk?.video); setVal('apk-skip', d.apk?.skip); setVal('apk-dl1', d.apk?.dl1);
    packages = d.buyList || [];
    renderPackages();
  });
}

function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v || ''; }
function getVal(id) { return document.getElementById(id)?.value || ''; }

function saveData() {
  const data = {
    general: { discord: getVal('gen-discord'), topup: getVal('gen-topup') },
    freePanel: { video: getVal('fp-video'), skip: getVal('fp-skip'), pass: getVal('fp-pass'), dl1: getVal('fp-dl1'), dl2: getVal('fp-dl2') },
    freeBypass: { video: getVal('fb-video'), skip: getVal('fb-skip'), pass: getVal('fb-pass'), dl1: getVal('fb-dl1'), dl2: getVal('fb-dl2') },
    emulator: { video: getVal('emu-video'), skip: getVal('emu-skip'), pass: getVal('emu-pass'), dl1: getVal('emu-dl1'), dl2: getVal('emu-dl2') },
    apk: { video: getVal('apk-video'), skip: getVal('apk-skip'), dl1: getVal('apk-dl1') },
    buyList: packages
  };
  db.ref('panel_data').update(data).then(() => alert('✅ Saved Successfully!'));
}

// ===== BUY PACKAGES =====
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

// ===== ADMIN MANAGEMENT =====
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
  const perms = role === 'super' ? allPermsTrue() : { general:false,'free-panel':true,'free-bypass':true,emulator:true,'free-fire-apk':true,'buy-panel':true };
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
