// Firebase Config
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
const database = firebase.database();

const SUPER_ADMIN = "mdrijowan359@gmail.com";

// Mouse Glow Effect
document.addEventListener('mousemove', (e) => {
    const glow = document.querySelector('.mouse-glow');
    if (glow) {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    }
});

// Tab Switch Logic
document.querySelectorAll('.nav-tab').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        button.classList.add('active');
        document.getElementById(button.getAttribute('data-tab')).classList.add('active');
    });
});

// Google Login
document.getElementById('google-login-btn').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(error => Swal.fire('Error', error.message, 'error'));
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

// Auth Observer
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'flex';
        document.getElementById('user-email').innerText = user.email;
        document.getElementById('user-photo').src = user.photoURL || 'https://via.placeholder.com/40';

        loadGeneralSettings();
        loadHomeCardsEditor();
        loadProducts();
    } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-dashboard').style.display = 'none';
    }
});

// 1. General Settings
function loadGeneralSettings() {
    database.ref('general_settings').on('value', snapshot => {
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
    }).then(() => Swal.fire('Saved', 'General Settings সেভ হয়েছে!', 'success'));
}

// 2. Home Cards Editor
const defaultCards = {
    freePanel: { title: "FREE PANEL", subtitle: "NEW PC PANEL UPDATED OB55", icon: "💻", badge: "FEATURED", link: "free.html", isVisible: true },
    freeBypass: { title: "FREE BYPASS", subtitle: "PREMIUM • FAST • RELIABLE", icon: "💻", badge: "", link: "bypass.html", isVisible: false },
    emulator: { title: "EMULATOR", subtitle: "WORKING EMULATOR", icon: "💎", badge: "", link: "emulator.html", isVisible: true },
    freeFireApk: { title: "FREE FIRE APK", subtitle: "DOWNLOAD LATEST APK", icon: "⚡", badge: "", link: "apk.html", isVisible: true },
    mobilePanel: { title: "MOBILE PANEL", subtitle: "ANDROID MOBILE SYSTEM", icon: "📱", badge: "", link: "mobile.html", isVisible: true },
    buyPanel: { title: "BUY PANEL", subtitle: "PREMIUM • FAST • RELIABLE", icon: "🔥", badge: "VIP", link: "buy.html", isVisible: true }
};

function loadHomeCardsEditor() {
    const container = document.getElementById('home-cards-container');
    database.ref('home_cards').on('value', snapshot => {
        const data = snapshot.val() || defaultCards;
        container.innerHTML = '';

        Object.keys(data).forEach(key => {
            const card = data[key];
            const div = document.createElement('div');
            div.className = 'home-card-item';
            div.innerHTML = `
                <div class="card-item-header">
                    <h4>${key}</h4>
                    <label><input type="checkbox" id="card-visible-${key}" ${card.isVisible !== false ? 'checked' : ''}> Show</label>
                </div>
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" id="card-title-${key}" value="${card.title || ''}">
                </div>
                <div class="form-group">
                    <label>Subtitle</label>
                    <input type="text" id="card-subtitle-${key}" value="${card.subtitle || ''}">
                </div>
                <div class="form-group">
                    <label>Icon / Emoji / Image URL</label>
                    <input type="text" id="card-icon-${key}" value="${card.icon || ''}">
                </div>
                <div class="form-group">
                    <label><input type="checkbox" id="card-badge-${key}" ${card.badge ? 'checked' : ''}> Featured Badge</label>
                </div>
            `;
            container.appendChild(div);
        });
    });
}

function saveHomeCards() {
    const keys = ['freePanel', 'freeBypass', 'emulator', 'freeFireApk', 'mobilePanel', 'buyPanel'];
    const updatedCards = {};

    keys.forEach(key => {
        const title = document.getElementById(`card-title-${key}`) ? document.getElementById(`card-title-${key}`).value : defaultCards[key].title;
        const subtitle = document.getElementById(`card-subtitle-${key}`) ? document.getElementById(`card-subtitle-${key}`).value : defaultCards[key].subtitle;
        const icon = document.getElementById(`card-icon-${key}`) ? document.getElementById(`card-icon-${key}`).value : defaultCards[key].icon;
        const isVisible = document.getElementById(`card-visible-${key}`) ? document.getElementById(`card-visible-${key}`).checked : true;
        const hasBadge = document.getElementById(`card-badge-${key}`) ? document.getElementById(`card-badge-${key}`).checked : false;

        updatedCards[key] = {
            title: title,
            subtitle: subtitle,
            icon: icon,
            badge: hasBadge ? "FEATURED" : "",
            link: defaultCards[key] ? defaultCards[key].link : "index.html",
            isVisible: isVisible
        };
    });

    database.ref('home_cards').set(updatedCards)
        .then(() => Swal.fire('Saved', 'Homepage Cards সেভ হয়েছে!', 'success'));
}

// 3. Products / Panel Package Manager
function openProductModal(id = null) {
    document.getElementById('product-form').reset();
    document.getElementById('price-duration-rows').innerHTML = '';
    document.getElementById('prod-id').value = '';

    if (id) {
        document.getElementById('modal-title').innerText = 'প্যাকেজ এডিট করুন';
        database.ref('products/' + id).once('value', snapshot => {
            const p = snapshot.val();
            if (p) {
                document.getElementById('prod-id').value = id;
                document.getElementById('prod-title').value = p.title || '';
                document.getElementById('prod-icon').value = p.icon || '';
                document.getElementById('prod-category').value = p.category || 'buy';
                document.getElementById('prod-visible').checked = p.isVisible !== false;

                if (p.priceList && p.priceList.length > 0) {
                    p.priceList.forEach(item => addPriceDurationRow(item.duration, item.sellPrice, item.buyPrice));
                } else {
                    addPriceDurationRow('30 Day', p.sellPrice || 0, p.buyPrice || 0);
                }
            }
        });
    } else {
        document.getElementById('modal-title').innerText = 'নতুন প্যাকেজ যুক্ত করুন';
        addPriceDurationRow('1 Hour', '100', '50');
        addPriceDurationRow('7 Day', '350', '200');
        addPriceDurationRow('30 Day', '600', '400');
    }

    document.getElementById('product-modal').style.display = 'flex';
}

function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
}

function addPriceDurationRow(duration = '', sellPrice = '', buyPrice = '') {
    const container = document.getElementById('price-duration-rows');
    const div = document.createElement('div');
    div.className = 'price-row-item';
    div.innerHTML = `
        <input type="text" class="p-dur" placeholder="মেয়াদ (e.g. 30 Day)" value="${duration}" required>
        <input type="number" class="p-sell" placeholder="Sell Price (৳)" value="${sellPrice}" required>
        <input type="number" class="p-buy" placeholder="Buy Price (৳)" value="${buyPrice}">
        <button type="button" onclick="this.parentElement.remove()" class="btn-del-row"><i class="fa-solid fa-trash"></i></button>
    `;
    container.appendChild(div);
}

document.getElementById('product-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-id').value || database.ref('products').push().key;
    const title = document.getElementById('prod-title').value;
    const icon = document.getElementById('prod-icon').value;
    const category = document.getElementById('prod-category').value;
    const isVisible = document.getElementById('prod-visible').checked;

    const priceRows = document.querySelectorAll('.price-row-item');
    const priceList = [];
    priceRows.forEach(row => {
        priceList.push({
            duration: row.querySelector('.p-dur').value,
            sellPrice: row.querySelector('.p-sell').value,
            buyPrice: row.querySelector('.p-buy').value || 0
        });
    });

    database.ref('products/' + id).set({
        title, icon, category, isVisible, priceList
    }).then(() => {
        closeProductModal();
        Swal.fire('Saved', 'প্যাকেজ সেভ হয়েছে!', 'success');
    });
});

function loadProducts() {
    const container = document.getElementById('product-list');
    database.ref('products').on('value', snapshot => {
        container.innerHTML = '';
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(key => {
                const item = data[key];
                const card = document.createElement('div');
                card.className = 'product-card-admin';

                let iconHTML = item.icon && item.icon.startsWith('http') ? `<img src="${item.icon}">` : (item.icon || '👑');
                let pricesHTML = '';
                if (item.priceList) {
                    item.priceList.forEach(p => {
                        pricesHTML += `<span class="price-pill">${p.duration}: ৳${p.sellPrice} <small class="buy-price-text">(Buy: ৳${p.buyPrice || 0})</small></span>`;
                    });
                }

                card.innerHTML = `
                    <div class="product-info">
                        <div class="product-icon-frame">${iconHTML}</div>
                        <div>
                            <h4>${item.title} <small style="color:var(--text-muted);">[${item.category}]</small></h4>
                            <div style="margin-top:6px;">${pricesHTML}</div>
                        </div>
                    </div>
                    <div>
                        <button onclick="openProductModal('${key}')" class="btn-secondary"><i class="fa-solid fa-pen"></i> Edit</button>
                        <button onclick="deleteProduct('${key}')" class="btn-del-row" style="padding:0 12px;"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p style="color:var(--text-muted); text-align:center;">কোনো প্যাকেজ যুক্ত করা নেই। "+ Add New Package" এ ক্লিক করে যুক্ত করুন।</p>';
        }
    });
}

function deleteProduct(key) {
    Swal.fire({
        title: 'মুছে ফেলতে চান?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff4757',
        confirmButtonText: 'হ্যাঁ'
    }).then(r => {
        if (r.isConfirmed) database.ref('products/' + key).remove();
    });
}
