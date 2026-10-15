// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDOFL6dKvw_RfyKMe3QQgvE4lt7Gtc4yaM",
    authDomain: "bangla-ff-admin.firebaseapp.com",
    databaseURL: "https://bangla-ff-admin-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bangla-ff-admin",
    storageBucket: "bangla-ff-admin.firebasestorage.app",
    messagingSenderId: "295013484465",
    appId: "1:295013484465:web:b6bc2a949e239095761f90"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Tab Switching
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(btn.getAttribute('data-tab')).classList.add('active');
    });
});

// Google Login
document.getElementById('google-login-btn').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => alert(err.message));
});

document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'flex';
        document.getElementById('user-email').innerText = user.email;
        document.getElementById('user-avatar-text').innerText = user.email.charAt(0).toUpperCase();
        
        loadGeneralSettings();
    } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-dashboard').style.display = 'none';
    }
});

// Settings Load/Save
function loadGeneralSettings() {
    database.ref('general_settings').on('value', snap => {
        const data = snapshot.val() || {};
        document.getElementById('setting-logo').value = data.logo || '';
        document.getElementById('setting-discord').value = data.discord || '';
        document.getElementById('setting-topup').value = data.topup || '';
    });
}

function saveGeneralSettings() {
    database.ref('general_settings').set({
        logo: document.getElementById('setting-logo').value,
        discord: document.getElementById('setting-discord').value,
        topup: document.getElementById('setting-topup').value
    }).then(() => Swal.fire('Saved!', 'Settings updated', 'success'));
}
