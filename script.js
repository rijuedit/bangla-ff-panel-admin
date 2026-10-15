import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, push, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDOFL6dKvw_RfyKMe3QQgvE4lt7Gtc4yaM",
    authDomain: "bangla-ff-admin.firebaseapp.com",
    databaseURL: "https://bangla-ff-admin-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bangla-ff-admin",
    storageBucket: "bangla-ff-admin.firebasestorage.app",
    messagingSenderId: "295013484465",
    appId: "1:295013484465:web:b6bc2a949e239095761f90"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const SUPER_ADMIN = "mdrijowan359@gmail.com";

// Auth elements
const loginOverlay = document.getElementById('login-overlay');
const adminMain = document.getElementById('admin-main');
const loginBtn = document.getElementById('google-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const adminEmailSpan = document.getElementById('admin-email');

// UI logic
loginBtn.onclick = () => signInWithPopup(auth, provider);
logoutBtn.onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
    if (user) {
        checkAccess(user);
    } else {
        loginOverlay.style.display = 'flex';
        adminMain.style.display = 'none';
    }
});

function checkAccess(user) {
    onValue(ref(db, 'admins'), (snapshot) => {
        const admins = snapshot.val() || {};
        const isAdmin = Object.values(admins).some(a => a.email === user.email);
        
        if (user.email === SUPER_ADMIN || isAdmin) {
            loginOverlay.style.display = 'none';
            adminMain.style.display = 'flex';
            adminEmailSpan.innerText = user.email;
            loadSection('general');
        } else {
            alert("Access Denied!");
            signOut(auth);
        }
    });
}

// Section Switching
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const section = btn.dataset.section;
        document.getElementById('section-title').innerText = btn.innerText;
        loadSection(section);
    };
});

function loadSection(section) {
    const container = document.getElementById('dynamic-content');
    container.innerHTML = `<p>Loading ${section}...</p>`;

    if (section === 'general') {
        onValue(ref(db, 'general_settings'), (snap) => {
            const data = snap.val() || { logo_url: '', discord_url: '', notice: '' };
            container.innerHTML = `
                <div class="card">
                    <h3>Logo & Links</h3>
                    <input id="logo-url" placeholder="Logo URL" value="${data.logo_url}">
                    <input id="discord-url" placeholder="Discord URL" value="${data.discord_url}">
                    <textarea id="main-notice" placeholder="Global Notice">${data.notice}</textarea>
                    <button class="save-btn" id="save-gen">Save General Settings</button>
                </div>
            `;
            document.getElementById('save-gen').onclick = () => {
                set(ref(db, 'general_settings'), {
                    logo_url: document.getElementById('logo-url').value,
                    discord_url: document.getElementById('discord-url').value,
                    notice: document.getElementById('main-notice').value
                });
            };
        });
    }

    if (['free-panel', 'bypass', 'emulator', 'apk', 'mobile', 'buy'].includes(section)) {
        const dbPath = `items/${section}`;
        onValue(ref(db, dbPath), (snap) => {
            const items = snap.val() || {};
            container.innerHTML = `
                <div class="card">
                    <h3>Add New Item</h3>
                    <input id="item-title" placeholder="Title">
                    <input id="item-icon" placeholder="Icon URL or Emoji">
                    <input id="item-link" placeholder="Redirect Link">
                    <button class="save-btn" id="add-item">Add Item</button>
                </div>
                <div id="items-list"></div>
            `;
            
            const list = document.getElementById('items-list');
            Object.entries(items).forEach(([id, item]) => {
                const div = document.createElement('div');
                div.className = 'card item-row';
                div.innerHTML = `
                    <span>${item.title}</span>
                    <small>${item.link}</small>
                    <i class="fas fa-trash delete-btn" onclick="removeItem('${dbPath}', '${id}')"></i>
                `;
                list.appendChild(div);
            });

            document.getElementById('add-item').onclick = () => {
                const newItem = {
                    title: document.getElementById('item-title').value,
                    icon: document.getElementById('item-icon').value,
                    link: document.getElementById('item-link').value
                };
                push(ref(db, dbPath), newItem);
            };
        });
    }

    // Admins Section
    if (section === 'admins') {
        onValue(ref(db, 'admins'), (snap) => {
            const admins = snap.val() || {};
            container.innerHTML = `
                <div class="card">
                    <h3>Manage Admins</h3>
                    <input id="new-admin-email" placeholder="Admin Gmail Address">
                    <button class="save-btn" id="add-admin-btn">Add Admin</button>
                </div>
                <div id="admins-list"></div>
            `;
            const list = document.getElementById('admins-list');
            Object.entries(admins).forEach(([id, admin]) => {
                const div = document.createElement('div');
                div.className = 'card item-row';
                div.innerHTML = `<span>${admin.email}</span> <i class="fas fa-trash delete-btn" onclick="removeItem('admins', '${id}')"></i>`;
                list.appendChild(div);
            });
            document.getElementById('add-admin-btn').onclick = () => {
                const email = document.getElementById('new-admin-email').value;
                if (email) push(ref(db, 'admins'), { email });
            };
        });
    }
}

window.removeItem = (path, id) => {
    if (confirm("Delete this?")) remove(ref(db, `${path}/${id}`));
};
