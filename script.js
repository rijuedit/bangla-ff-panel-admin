// =========================================
// BANGLA FF PANEL - ADMIN SCRIPT
// =========================================

// Default Admin Password (আপনি পরে পরিবর্তন করতে পারবেন)
const DEFAULT_PASS = "admin123";

// Mouse Tracking Glow
document.addEventListener('mousemove', function (e) {
  const glow = document.querySelector('.mouse-glow');
  if (glow) {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  }
});

// Login Handler
document.getElementById('login-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const inputPass = document.getElementById('admin-pass').value;
  const errorMsg = document.getElementById('login-error');

  if (inputPass === DEFAULT_PASS) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard-screen').style.display = 'flex';
    errorMsg.innerText = '';
  } else {
    errorMsg.innerText = 'Incorrect password! Try again.';
  }
});

// Tab Switcher
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));

  document.getElementById('tab-' + tabName).classList.add('active');
  event.currentTarget.classList.add('active');
}

// Logout Handler
function logout() {
  document.getElementById('dashboard-screen').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-pass').value = '';
}

// Save Function (Local/Firebase/GitHub storage connection placeholder)
function saveData() {
  alert('Data Saved Successfully!');
}

// Package Manager for BUY PANEL
let packages = [
  { name: "VIP PANEL", price: "৳500 / month", desc: "Aimbot AI • Anti-Ban" },
  { name: "LIFETIME PANEL", price: "৳1200 / lifetime", desc: "All Features • Priority Support" }
];

function renderPackages() {
  const container = document.getElementById('buy-packages-list');
  if (!container) return;
  container.innerHTML = '';

  packages.forEach((pkg, index) => {
    container.innerHTML += `
      <div class="pkg-item">
        <input type="text" value="${pkg.name}" placeholder="Name">
        <input type="text" value="${pkg.price}" placeholder="Price">
        <input type="text" value="${pkg.desc}" placeholder="Features">
        <button class="del-btn" onclick="removePackage(${index})"><i class='bx bx-trash'></i></button>
      </div>
    `;
  });
}

function addPackage() {
  packages.push({ name: "NEW PANEL", price: "৳0", desc: "Features" });
  renderPackages();
}

function removePackage(index) {
  packages.splice(index, 1);
  renderPackages();
}

// Initial render
renderPackages();
