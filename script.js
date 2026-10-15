// =========================================
// FIREBASE CONFIGURATION (Connected)
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let currentUser = null;
let userRole = "normal";

// Mouse Glow Effect
document.addEventListener('mousemove', function (e) {
  const glow = document.querySelector('.mouse-glow');
  if (glow) {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  }
});

// Google Sign-In
function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then((result) => {
      checkAdminPermission(result.user);
    })
    .catch((error) => {
      document.getElementById('login-error').innerText = error.message;
    });
}

// Check Admin Permission
function checkAdminPermission(user) {
  const emailKey = user.email.replace(/\./g, '_at_');
  
  db.ref('admins/' + emailKey).once('value').then((snapshot) => {
    const adminData = snapshot.val();
    
    // Bootstrap: If NO admins exist, make first user Super Admin
    db.ref('admins').once('value').then((allSnap) => {
      if (!allSnap.exists()) {
        const initial = { email: user.email, role: 'super' };
        db.ref('admins/' + emailKey).set(initial);
        grantAccess(user, 'super');
        return;
      }

      if (adminData) {
        grantAccess(user, adminData.role);
      } else {
        alert('Access Denied! You are not an authorized admin.');
        auth.signOut();
      }
    });
  });
}

function grantAccess(user, role) {
  currentUser = user;
  userRole = role;
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard-screen').style.display = 'flex';
  document.getElementById('user-email').innerText = user.email;
  
  const badge = document.getElementById('user-role-badge');
  badge.innerText = role === 'super' ? '👑 Super Admin' : '🔧 Normal Admin';
  badge.className = 'role-tag ' + role;
  
  document.getElementById('tab-btn-admins').style.display = role === 'super' ? 'flex' : 'none';

  loadDataFromDB();
  loadAdminsList();
}

auth.onAuthStateChanged((user) => {
  if (user) checkAdminPermission(user);
  else {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('dashboard-screen').style.display = 'none';
  }
});

function logout() { auth.signOut(); }

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tabName).classList.add('active');
  event.currentTarget.classList.add('active');
}

// Load Data
function loadDataFromDB() {
  db.ref('panel_data').on('value', (snapshot) => {
    const data = snapshot.val() || {};
    if(data.general) {
      document.getElementById('gen-discord').value = data.general.discord || '';
      document.getElementById('gen-topup').value = data.general.topup || '';
    }
    if(data.freePanel) {
      document.getElementById('fp-video').value = data.freePanel.video || '';
      document.getElementById('fp-skip').value = data.freePanel.skip || '';
      document.getElementById('fp-pass').value = data.freePanel.pass || '1';
      document.getElementById('fp-dl1').value = data.freePanel.dl1 || '';
      document.getElementById('fp-dl2').value = data.freePanel.dl2 || '';
    }
    // ... আপনি চাইলে বাকি ট্যাবগুলোর জন্যও একই ভাবে যোগ করতে পারেন
  });
}

// Save Data
function saveData() {
  const data = {
    general: {
      discord: document.getElementById('gen-discord').value,
      topup: document.getElementById('gen-topup').value
    },
    freePanel: {
      video: document.getElementById('fp-video').value,
      skip: document.getElementById('fp-skip').value,
      pass: document.getElementById('fp-pass').value,
      dl1: document.getElementById('fp-dl1').value,
      dl2: document.getElementById('fp-dl2').value
    }
  };

  db.ref('panel_data').update(data).then(() => {
    alert('✅ Data Updated on Live Site!');
  });
}

// Admin Management
function loadAdminsList() {
  db.ref('admins').on('value', (snapshot) => {
    const admins = snapshot.val() || {};
    const superBox = document.getElementById('super-admins-container');
    const normalBox = document.getElementById('normal-admins-container');
    superBox.innerHTML = ''; normalBox.innerHTML = '';

    Object.keys(admins).forEach((key) => {
      const admin = admins[key];
      const isYou = currentUser && currentUser.email === admin.email;
      const card = document.createElement('div');
      card.className = 'admin-item-card';
      card.innerHTML = `<div><strong>${admin.email}</strong><small>${admin.role}</small></div>
      ${!isYou && userRole === 'super' ? `<button class="btn-remove" onclick="removeAdmin('${key}')">Remove</button>` : ''}`;
      if (admin.role === 'super') superBox.appendChild(card);
      else normalBox.appendChild(card);
    });
  });
}

function addNewAdmin(role) {
  const email = prompt("Enter email:");
  if (email) db.ref('admins/' + email.replace(/\./g, '_at_')).set({ email, role });
}

function removeAdmin(key) {
  if (confirm("Remove this admin?")) db.ref('admins/' + key).remove();
}
