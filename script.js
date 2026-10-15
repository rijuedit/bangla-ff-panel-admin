// Firebase Configuration
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

// Mouse Glow
const mouseGlow = document.getElementById('mouse-glow');
document.addEventListener('mousemove', (e) => {
    mouseGlow.style.left = e.clientX + 'px';
    mouseGlow.style.top = e.clientY + 'px';
});

// Google Login
document.getElementById('google-login-btn').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(error => {
        Swal.fire('Error', error.message, 'error');
    });
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

// Auth State Observer
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'flex';
        document.getElementById('user-email').innerText = user.email;
        document.getElementById('user-photo').src = user.photoURL || 'https://via.placeholder.com/60';
        
        if (user.email === SUPER_ADMIN) {
            document.getElementById('role-badge').innerText = 'Super Admin';
        }
        
        loadAdminPanels();
    } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-dashboard').style.display = 'none';
    }
});

// Modal Logic
function openPanelModal(panelId = null) {
    document.getElementById('panel-form').reset();
    document.getElementById('price-rows').innerHTML = '';
    document.getElementById('panel-id').value = '';
    
    if (panelId) {
        document.getElementById('modal-title').innerText = 'প্যানেল এডিট করুন';
        database.ref('panels/' + panelId).once('value', snapshot => {
            const data = snapshot.val();
            if (data) {
                document.getElementById('panel-id').value = panelId;
                document.getElementById('panel-title').value = data.title || '';
                document.getElementById('panel-icon').value = data.icon || '';
                document.getElementById('panel-category').value = data.category || 'home';
                document.getElementById('panel-visible').checked = data.isVisible !== false;

                if (data.priceList && data.priceList.length > 0) {
                    data.priceList.forEach(p => addPriceRow(p.duration, p.price, p.buyPrice));
                } else {
                    addPriceRow('30 Day', data.sellPrice || 0, data.buyPrice || 0);
                }
            }
        });
    } else {
        document.getElementById('modal-title').innerText = 'নতুন প্যানেল যুক্ত করুন';
        // Add default sample rows
        addPriceRow('1 Hour', '100', '50');
        addPriceRow('7 Day', '350', '200');
        addPriceRow('30 Day', '600', '400');
    }
    
    document.getElementById('panel-modal').style.display = 'flex';
}

function closePanelModal() {
    document.getElementById('panel-modal').style.display = 'none';
}

// Dynamic Price Row Addition
function addPriceRow(duration = '', sellPrice = '', buyPrice = '') {
    const container = document.getElementById('price-rows');
    const row = document.createElement('div');
    row.className = 'price-row-item';
    row.innerHTML = `
        <input type="text" class="p-duration" placeholder="মেয়াদ (যেমন 30 Day)" value="${duration}" required>
        <input type="number" class="p-sell" placeholder="বিক্রয় মূল্য ( Sell Price )" value="${sellPrice}" required>
        <input type="number" class="p-buy" placeholder="কেনা দাম ( Admin Only Buy Price )" value="${buyPrice}">
        <button type="button" onclick="this.parentElement.remove()" class="btn-del-row"><i class="fa-solid fa-trash"></i></button>
    `;
    container.appendChild(row);
}

// Form Submit (Save Panel)
document.getElementById('panel-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('panel-id').value || database.ref('panels').push().key;
    const title = document.getElementById('panel-title').value;
    const icon = document.getElementById('panel-icon').value;
    const category = document.getElementById('panel-category').value;
    const isVisible = document.getElementById('panel-visible').checked;

    // Collect all price rows
    const priceRows = document.querySelectorAll('.price-row-item');
    const priceList = [];
    priceRows.forEach(row => {
        priceList.push({
            duration: row.querySelector('.p-duration').value,
            price: row.querySelector('.p-sell').value,
            buyPrice: row.querySelector('.p-buy').value || 0
        });
    });

    database.ref('panels/' + id).set({
        title: title,
        icon: icon,
        category: category,
        isVisible: isVisible,
        priceList: priceList,
        sellPrice: priceList[0] ? priceList[0].price : 0 // Fallback
    }).then(() => {
        closePanelModal();
        Swal.fire('Saved!', 'প্যানেল সফলভাবে সেভ হয়েছে!', 'success');
    });
});

// Load Panels in Admin List
function loadAdminPanels() {
    const list = document.getElementById('panel-list');
    database.ref('panels').on('value', snapshot => {
        list.innerHTML = '';
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(key => {
                const item = data[key];
                const card = document.createElement('div');
                card.className = 'admin-panel-card';
                
                let iconImg = item.icon && item.icon.startsWith('http') ? `<img src="${item.icon}">` : `<i class="fa-solid fa-crown" style="font-size:24px; color:#00f0ff;"></i>`;

                let pricesSummary = '';
                if(item.priceList) {
                    item.priceList.forEach(p => {
                        pricesSummary += `<span style="font-size:12px; background:#1a202c; padding:2px 6px; border-radius:4px; margin-right:4px;">${p.duration}: ৳${p.price} (Buy: ৳${p.buyPrice || 0})</span>`;
                    });
                }

                card.innerHTML = `
                    <div class="card-info">
                        ${iconImg}
                        <div>
                            <h4>${item.title}</h4>
                            <div style="margin-top:5px;">${pricesSummary}</div>
                        </div>
                    </div>
                    <div>
                        <button onclick="openPanelModal('${key}')" class="btn-secondary"><i class="fa-solid fa-pen"></i> Edit</button>
                        <button onclick="deletePanel('${key}')" class="btn-del-row"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
                list.appendChild(card);
            });
        } else {
            list.innerHTML = '<p style="color:#777; text-align:center;">কোনো প্যানেল যুক্ত করা হয়নি। "+ Add New Panel" বাটনে ক্লিক করে যোগ করুন।</p>';
        }
    });
}

function deletePanel(key) {
    Swal.fire({
        title: 'মুছে ফেলতে চান?',
        text: 'এটি ওয়েবসাইট থেকে মুছে যাবে!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e53e3e',
        confirmButtonText: 'হ্যাঁ, মুছুন'
    }).then(result => {
        if (result.isConfirmed) {
            database.ref('panels/' + key).remove();
        }
    });
}
