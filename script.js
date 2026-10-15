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
const db = firebase.database();
const SUPER = "mdrijowan359@gmail.com";

const HOME_KEYS = {
  freePanel:   { title: "FREE PANEL", subtitle: "NEW PC PANEL UPDATED OB55", icon: "💻", badge: "FEATURED", link: "free.html", isVisible: true },
  freeBypass:  { title: "FREE BYPASS", subtitle: "PREMIUM • FAST • RELIABLE", icon: "🛡️", badge: "", link: "bypass.html", isVisible: true },
  emulator:    { title: "EMULATOR", subtitle: "WORKING EMULATOR", icon: "💎", badge: "", link: "emulator.html", isVisible: true },
  freeFireApk: { title: "FREE FIRE APK", subtitle: "DOWNLOAD LATEST APK", icon: "⚡", badge: "", link: "apk.html", isVisible: true },
  mobilePanel: { title: "MOBILE PANEL", subtitle: "ANDROID MOBILE SYSTEM", icon: "📱", badge: "", link: "mobile.html", isVisible: true },
  buyPanel:    { title: "BUY PANEL", subtitle: "PREMIUM • FAST • RELIABLE", icon: "🔥", badge: "VIP", link: "buy.html", isVisible: true }
};

// Tabs
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
  });
});

// Auth
document.getElementById("google-login-btn").onclick = () => {
  auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(e => Swal.fire("Error", e.message, "error"));
};
document.getElementById("logout-btn").onclick = () => auth.signOut();

auth.onAuthStateChanged(user => {
  if (!user) {
    document.getElementById("login-screen").style.display = "grid";
    document.getElementById("admin-dashboard").style.display = "none";
    return;
  }
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("admin-dashboard").style.display = "flex";
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("avatar-letter").textContent = (user.email || "A").charAt(0).toUpperCase();
  document.getElementById("user-role").innerHTML = user.email === SUPER
    ? '<i class="fa-solid fa-shield-halved"></i> Super Admin'
    : '<i class="fa-solid fa-user"></i> Admin';

  loadGeneral();
  loadHomeCards();
  ["free","bypass","emulator","apk","mobile","buy"].forEach(loadCategory);
  loadAdmins();
});

// General
function loadGeneral() {
  db.ref("general_settings").on("value", s => {
    const d = s.val() || {};
    document.getElementById("set-logo").value = d.logo || "";
    document.getElementById("set-discord").value = d.discord || "";
    document.getElementById("set-topup").value = d.topup || "";
  });
}
function saveGeneral() {
  db.ref("general_settings").set({
    logo: document.getElementById("set-logo").value.trim(),
    discord: document.getElementById("set-discord").value.trim(),
    topup: document.getElementById("set-topup").value.trim()
  }).then(() => Swal.fire({ icon: "success", title: "Saved!", timer: 1200, showConfirmButton: false }));
}

// Home cards
function loadHomeCards() {
  const box = document.getElementById("home-cards-box");
  db.ref("home_cards").on("value", s => {
    const data = s.val() || HOME_KEYS;
    box.innerHTML = "";
    Object.keys(HOME_KEYS).forEach(key => {
      const c = data[key] || HOME_KEYS[key];
      const el = document.createElement("div");
      el.className = "hc-block";
      el.innerHTML = `
        <div class="hc-top">
          <h4>${key}</h4>
          <label style="color:var(--muted);font-size:12px;"><input type="checkbox" id="vis-${key}" ${c.isVisible !== false ? "checked" : ""}> Show</label>
        </div>
        <div class="hc-grid">
          <div class="fg"><label>Title</label><input id="t-${key}" value="${esc(c.title || "")}"></div>
          <div class="fg"><label>Subtitle</label><input id="s-${key}" value="${esc(c.subtitle || "")}"></div>
          <div class="fg"><label>Icon / Image URL</label><input id="i-${key}" value="${esc(c.icon || "")}"></div>
          <div class="fg"><label>Link page</label><input id="l-${key}" value="${esc(c.link || HOME_KEYS[key].link)}"></div>
        </div>
        <div class="fg check" style="margin-top:10px;margin-bottom:0;">
          <label><input type="checkbox" id="b-${key}" ${c.badge ? "checked" : ""}> Featured Badge</label>
        </div>`;
      box.appendChild(el);
    });
  });
}
function saveHomeCards() {
  const out = {};
  Object.keys(HOME_KEYS).forEach(key => {
    out[key] = {
      title: val(`t-${key}`),
      subtitle: val(`s-${key}`),
      icon: val(`i-${key}`),
      link: val(`l-${key}`) || HOME_KEYS[key].link,
      badge: document.getElementById(`b-${key}`)?.checked ? "FEATURED" : "",
      isVisible: document.getElementById(`vis-${key}`)?.checked !== false
    };
  });
  db.ref("home_cards").set(out).then(() => Swal.fire({ icon: "success", title: "Home Cards Saved!", timer: 1200, showConfirmButton: false }));
}

// Category items
function loadCategory(cat) {
  const box = document.getElementById("list-" + cat);
  if (!box) return;
  db.ref("items/" + cat).on("value", s => {
    box.innerHTML = "";
    const data = s.val();
    if (!data) {
      box.innerHTML = `<div class="card" style="color:var(--muted);text-align:center;">No items yet. Click Add.</div>`;
      return;
    }
    Object.keys(data).forEach(id => {
      const it = data[id];
      let icon = it.icon || "⚡";
      const iconHtml = (icon.startsWith("http")) ? `<img src="${icon}">` : icon;
      let pills = "";
      if (it.priceList && it.priceList.length) {
        pills = `<div class="pills">${it.priceList.map(p =>
          `<span class="pill">${p.duration}: ৳${p.sellPrice} <span class="buy">(Buy ৳${p.buyPrice || 0})</span></span>`
        ).join("")}</div>`;
      }
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `
        <div class="item-left">
          <div class="ico">${iconHtml}</div>
          <div>
            <div class="item-title">${esc(it.title || "")} ${it.isVisible === false ? '<small style="color:#f66">(hidden)</small>' : ""}</div>
            <div class="item-sub">${esc(it.subtitle || "")}</div>
            ${pills}
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-mini" onclick="openItemModal('${cat}','${id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-mini danger" onclick="delItem('${cat}','${id}')"><i class="fa-solid fa-trash"></i></button>
        </div>`;
      box.appendChild(row);
    });
  });
}

function openItemModal(cat, id = null) {
  document.getElementById("item-form").reset();
  document.getElementById("price-rows").innerHTML = "";
  document.getElementById("item-cat").value = cat;
  document.getElementById("item-id").value = id || "";
  document.getElementById("modal-title").textContent = id ? "Edit Item" : "Add Item";

  const needPrice = (cat === "buy" || cat === "mobile");
  document.getElementById("price-block").style.display = needPrice ? "block" : "none";

  if (id) {
    db.ref("items/" + cat + "/" + id).once("value").then(s => {
      const it = s.val() || {};
      document.getElementById("item-title").value = it.title || "";
      document.getElementById("item-sub").value = it.subtitle || "";
      document.getElementById("item-icon").value = it.icon || "";
      document.getElementById("item-link").value = it.link || "";
      document.getElementById("item-visible").checked = it.isVisible !== false;
      if (needPrice) {
        if (it.priceList && it.priceList.length) it.priceList.forEach(p => addPriceRow(p.duration, p.sellPrice, p.buyPrice));
        else addPriceRow("30 Day", "600", "400");
      }
    });
  } else if (needPrice) {
    addPriceRow("1 Hour", "100", "50");
    addPriceRow("7 Day", "350", "200");
    addPriceRow("30 Day", "600", "400");
  }
  document.getElementById("item-modal").style.display = "flex";
}
function closeItemModal() { document.getElementById("item-modal").style.display = "none"; }

function addPriceRow(duration = "", sell = "", buy = "") {
  const row = document.createElement("div");
  row.className = "price-row";
  row.innerHTML = `
    <input class="d" placeholder="30 Day / 1 Hour / Lifetime" value="${esc(duration)}" required>
    <input class="s" type="number" placeholder="Sell ৳" value="${esc(sell)}" required>
    <input class="b" type="number" placeholder="Buy ৳" value="${esc(buy)}">
    <button type="button" class="btn-del" onclick="this.parentElement.remove()"><i class="fa-solid fa-trash"></i></button>`;
  document.getElementById("price-rows").appendChild(row);
}

document.getElementById("item-form").addEventListener("submit", e => {
  e.preventDefault();
  const cat = document.getElementById("item-cat").value;
  const id = document.getElementById("item-id").value || db.ref("items/" + cat).push().key;
  const payload = {
    title: val("item-title"),
    subtitle: val("item-sub"),
    icon: val("item-icon"),
    link: val("item-link"),
    isVisible: document.getElementById("item-visible").checked
  };
  if (cat === "buy" || cat === "mobile") {
    payload.priceList = [];
    document.querySelectorAll("#price-rows .price-row").forEach(r => {
      payload.priceList.push({
        duration: r.querySelector(".d").value.trim(),
        sellPrice: r.querySelector(".s").value,
        buyPrice: r.querySelector(".b").value || 0
      });
    });
  }
  db.ref("items/" + cat + "/" + id).set(payload).then(() => {
    closeItemModal();
    Swal.fire({ icon: "success", title: "Saved!", timer: 1000, showConfirmButton: false });
  });
});

function delItem(cat, id) {
  Swal.fire({ title: "Delete?", icon: "warning", showCancelButton: true, confirmButtonColor: "#ff4d4d" })
    .then(r => { if (r.isConfirmed) db.ref("items/" + cat + "/" + id).remove(); });
}

// Admins
function loadAdmins() {
  const ul = document.getElementById("admin-list");
  db.ref("admins").on("value", s => {
    ul.innerHTML = "";
    const data = s.val() || {};
    // always show super
    ul.innerHTML += `<li><span>${SUPER} <small style="color:var(--cyan)">(Super)</small></span><span></span></li>`;
    Object.keys(data).forEach(email => {
      if (email === SUPER) return;
      ul.innerHTML += `<li><span>${email}</span><button class="btn-mini danger" onclick="removeAdmin('${email}')">Remove</button></li>`;
    });
  });
}
function addAdmin() {
  const email = document.getElementById("new-admin").value.trim().toLowerCase();
  if (!email) return;
  if (auth.currentUser?.email !== SUPER) return Swal.fire("Only Super Admin", "", "error");
  db.ref("admins/" + email.replace(/\./g, ",")).set(true).then(() => {
    document.getElementById("new-admin").value = "";
    Swal.fire({ icon: "success", title: "Admin added", timer: 1000, showConfirmButton: false });
  });
}
function removeAdmin(email) {
  if (auth.currentUser?.email !== SUPER) return;
  db.ref("admins/" + email.replace(/\./g, ",")).remove();
}

// helpers
function val(id) { return (document.getElementById(id)?.value || "").trim(); }
function esc(s) { return String(s).replace(/"/g, "&quot;"); }
