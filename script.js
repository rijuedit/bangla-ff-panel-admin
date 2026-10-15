// =========================================
// FIREBASE CONFIGURATION (পাসওয়ার্ড ও ডাটাবেস)
// =========================================
const firebaseConfig = {
  // আপনার Firebase Config এর কোডগুলো এখানে পেস্ট করবেন
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let currentUser = null;
let userRole = "normal"; // Default

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

// Check If Logged In User Is Admin
function checkAdminPermission(user) {
  const emailKey = user.email.replace(/\./g, '_at_');
  
  db.ref('admins/' + emailKey).once('value').then((snapshot) => {
    const adminData = snapshot.val();
    
    // First run bootstrap: If database has NO admins at all, make first logged in user Super Admin!
    db.ref('admins').once('value').then((allAdminsSnap) => {
      if (!allAdminsSnap.exists()) {
        const initialAdmin = { email: user.email, role: 'super' };
        db.ref('admins/' + emailKey).set(initialAdmin);
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
  
  const roleBadge = document.getElementById('user-role-badge');
  if (role === 'super') {
    roleBadge.innerText = '👑 Super Admin';
    roleBadge.className = 'role-tag super';
    document.getElementById('tab-btn-admins').style.display = 'flex';
  } else {
    roleBadge.innerText = '🔧 Normal Admin';
    roleBadge.className = 'role-tag normal';
    document.getElementById('tab-btn-admins').style.display = 'none';
  }

  loadDataFromDB();
  loadAdminsList();
}

// Check Auth State On Page Load
auth.onAuthStateChanged((user) => {
  if (user) {
    checkAdminPermission(user);
  } else {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('dashboard-screen').style.display = 'none';
  }
});

// Logout
function logout() {
  auth.signOut();
}

// Switch Tabs
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));

  document.getElementById('tab-' + tabName).classList.add('active');
  event.currentTarget.classList.add('active');
}

// Load Data From Database To Inputs
function loadDataFromDB() {
  db.ref('panel_data').once('value').then((snapshot) => {
    const data = snapshot.val() || {};
    
    // General
    if(data.general) {
      document.getElementById('gen-discord').value = data.general.discord || '';
      document.getElementById('gen-topup').value = data.general.topup || '';
    }

    // Free Panel
    if(data.freePanel) {
      document.getElementById('fp-video').value = data.freePanel.video || '';
      document.getElementById('fp-skip').value = data.freePanel.skip || '';
      document.getElementById('fp-pass').value = data.freePanel.pass || '1';
      document.getElementById('fp-dl1').value = data.freePanel.dl1 || '';
      document.getElementById('fp-dl2').value = data.freePanel.dl2 || '';
    }
  });
}

// Save All Inputs To Database
function saveData() {
  const panelData = {
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

  db.ref('panel_data').set(panelData).then(() => {
    alert('✅ All Data Saved Successfully!');
  });
}

// ADMIN MANAGEMENT (Super Admin Only)
function loadAdminsList() {
  db.ref('admins').on('value', (snapshot) => {
    const admins = snapshot.val() || {};
    const superBox = document.getElementById('super-admins-container');
    const normalBox = document.getElementById('normal-admins-container');

    superBox.innerHTML = '';
    normalBox.innerHTML = '';

    Object.keys(admins).forEach((key) => {
      const admin = admins[key];
      const isYou = currentUser && currentUser.email === admin.email;

      const card = document.createElement('div');
      card.className = 'admin-item-card';
      card.innerHTML = `
        <div>
          <strong>${admin.email} ${isYou ? '(You)' : ''}</strong>
          <small>${admin.role === 'super' ? 'Super Admin' : 'Normal Admin'}</small>
        </div>
        ${!isYou && userRole === 'super' ? `<button class="btn-remove" onclick="removeAdmin('${key}')">Remove</button>` : `<span class="you-tag">${isYou ? 'You' : ''}</span>`}
      `;

      if (admin.role === 'super') {
        superBox.appendChild(card);
      } else {
        normalBox.appendChild(card);
      }
    });
  });
}

function addNewAdmin(role) {
  if (userRole !== 'super') return alert('Only Super Admin can add new admins!');
  
  const email = prompt(`Enter Email for new ${role === 'super' ? 'Super Admin' : 'Normal Admin'}:`);
  if (!email || !email.includes('@')) return alert('Invalid Email!');

  const emailKey = email.replace(/\./g, '_at_');
  db.ref('admins/' + emailKey).set({
    email: email,
    role: role
  }).then(() => {
    alert('✅ Admin Added Successfully!');
  });
}

function removeAdmin(emailKey) {
  if (userRole !== 'super') return alert('Only Super Admin can remove admins!');
  if (confirm('Are you sure you want to remove this admin?')) {
    db.ref('admins/' + emailKey).remove();
  }
}
