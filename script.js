/***********************
 *  A. KONFIGURASI GAPI
 ***********************/
const GOOGLE_CLIENT_ID = "123146255469-vs68gm9qurlc2ej29kq091qm13bisf6b.apps.googleusercontent.com";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file"; // akses file yg dibuat app
const DRIVE_DISCOVERY = "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";

// Nama file di Google Drive
const DRIVE_FILENAME = "airdrop_tracker_data.json";

let isSignedIn = false;
let driveFileId = null; // diset setelah ditemukan/dibuat
let accessToken = null;

/*****************************************
 *  B. DATA & RENDER TABEL (Airdrop App)
 *****************************************/
const storages = { aktif: "airdropData", raffle: "airdropRaffle", selesai: "airdropDone" }; // label kategori
let dataMap = { aktif: [], raffle: [], selesai: [] };

function defaultEmptyRow() {
  return {
    nama: "",
    deskripsi: "",
    links: { main: "", discord: "", x: "", telegram: "", custom1: "", custom2: "" },
    checklist: false,
  };
}

function createLinkButton(type, index, key, label, emoji) {
  const btn = document.createElement("button");
  const url = dataMap[type][index].links?.[key] || "";
  btn.textContent = emoji;
  btn.classList.toggle("empty", !url);
  btn.title = url
    ? `${label} (Klik buka, Shift+Klik edit)`
    : `${label} (Klik untuk atur)`;

  btn.onclick = (e) => {
    const current = dataMap[type][index].links[key] || "";
    if (current && !e.shiftKey) {
      window.open(current, "_blank");
      return;
    }
    const newUrl = prompt(`Masukkan Link ${label}:`, current);
    if (newUrl !== null) {
      dataMap[type][index].links[key] = newUrl.trim();
      renderTable(type); // re-render biar kelas .empty update
    }
  };
  return btn;
}

function renderTable(type) {
  const container = document.querySelector(`#${type} .table-container`);
  container.innerHTML = "";
  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>ID</th>
        <th>Nama Airdrop</th>
        <th>Deskripsi</th>
        <th>Links</th>
        <th>✓</th>
        <th>Aksi</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");

  dataMap[type].forEach((row, i) => {
    if (!row.links) row.links = defaultEmptyRow().links; // guard
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td contenteditable="true">${row.nama || ""}</td>
      <td contenteditable="true">${row.deskripsi || ""}</td>
      <td class="links"></td>
      <td><input type="checkbox" ${row.checklist ? "checked" : ""}></td>
      <td></td>
    `;

    // Edit handlers
    tr.cells[1].oninput = () => { row.nama = tr.cells[1].innerText.trim(); };
    tr.cells[2].oninput = () => { row.deskripsi = tr.cells[2].innerText.trim(); };
    tr.cells[4].querySelector("input").onchange = (e) => { row.checklist = e.target.checked; };

    // Link buttons (urutan sesuai request)
    const linksCell = tr.cells[3];
    linksCell.appendChild(createLinkButton(type, i, "main",     "Link Utama", "🔗"));
    linksCell.appendChild(createLinkButton(type, i, "discord",  "Discord",    "🟣")); // placeholder ungu
    linksCell.appendChild(createLinkButton(type, i, "x",        "X / Twitter","𝕏"));
    linksCell.appendChild(createLinkButton(type, i, "telegram", "Telegram",   "📨"));
    linksCell.appendChild(createLinkButton(type, i, "custom1",  "Custom 1",   "🌐"));
    linksCell.appendChild(createLinkButton(type, i, "custom2",  "Custom 2",   "📄"));

    // Aksi
    const aksiCell = tr.cells[5];
    if (type === "aktif" || type === "raffle") {
      const doneBtn = document.createElement("button");
      doneBtn.textContent = "✅";
      doneBtn.title = "Pindahkan ke Selesai";
      doneBtn.onclick = () => moveRow(type, "selesai", i);
      aksiCell.appendChild(doneBtn);
    }
    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑";
    delBtn.title = "Hapus";
    delBtn.onclick = () => { dataMap[type].splice(i, 1); renderTable(type); };
    aksiCell.appendChild(delBtn);

    tbody.appendChild(tr);
  });

  container.appendChild(table);
}

function addRow(type) {
  dataMap[type].push(defaultEmptyRow());
  renderTable(type);
}
function resetChecklist(type) {
  dataMap[type].forEach(r => r.checklist = false);
  renderTable(type);
}
function moveRow(from, to, index) {
  dataMap[to].push(dataMap[from][index]);
  dataMap[from].splice(index, 1);
  renderTable(from);
  renderTable(to);
}

/****************************
 *  C. TAB & UI INITIALIZER
 ****************************/
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"));
    document.getElementById(btn.dataset.tab).classList.add("active");
  };
});
// default tab
window.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".tab-btn[data-tab='aktif']").click();
});

/***************************************
 *  D. GOOGLE AUTH + DRIVE INTEGRATION
 ***************************************/
function updateAuthUI() {
  const status = document.getElementById("auth-status");
  const btnLogin = document.getElementById("btn-login");
  const btnLogout = document.getElementById("btn-logout");
  const btnLoad = document.getElementById("btn-load");
  const btnSave = document.getElementById("btn-save");

  if (isSignedIn) {
    const user = gapi.auth2.getAuthInstance().currentUser.get();
    const profile = user.getBasicProfile();
    status.textContent = `Login: ${profile.getEmail()}`;
    btnLogin.style.display = "none";
    btnLogout.style.display = "";
    btnLoad.style.display = "";
    btnSave.style.display = "";
  } else {
    status.textContent = "Belum login";
    btnLogin.style.display = "";
    btnLogout.style.display = "none";
    btnLoad.style.display = "none";
    btnSave.style.display = "none";
  }
}

async function initGapi() {
  return new Promise((resolve) => {
    gapi.load("client:auth2", async () => {
      await gapi.client.init({
        clientId: GOOGLE_CLIENT_ID,
        scope: DRIVE_SCOPE,
        discoveryDocs: [DRIVE_DISCOVERY],
      });
      const auth = gapi.auth2.getAuthInstance();
      isSignedIn = auth.isSignedIn.get();
      auth.isSignedIn.listen((val) => {
        isSignedIn = val;
        accessToken = isSignedIn
          ? auth.currentUser.get().getAuthResponse().access_token
          : null;
        updateAuthUI();
        if (isSignedIn) ensureDriveFile().then(loadFromDrive);
      });
      if (isSignedIn) {
        accessToken = auth.currentUser.get().getAuthResponse().access_token;
        await ensureDriveFile();
        await loadFromDrive();
      }
      updateAuthUI();
      resolve();
    });
  });
}

async function signIn() {
  await gapi.auth2.getAuthInstance().signIn();
}
async function signOut() {
  await gapi.auth2.getAuthInstance().signOut();
  driveFileId = null;
}

document.getElementById("btn-login").addEventListener("click", signIn);
document.getElementById("btn-logout").addEventListener("click", signOut);
document.getElementById("btn-load").addEventListener("click", () => loadFromDrive(true));
document.getElementById("btn-save").addEventListener("click", saveToDrive);

// Panggil init saat API JS sudah siap
window.addEventListener("load", initGapi);

/****************************************
 *  E. DRIVE HELPERS (find/create/save)
 ****************************************/
async function ensureDriveFile() {
  // Cari file berdasar nama
  const query = `name='${DRIVE_FILENAME}' and trashed=false`;
  const res = await gapi.client.drive.files.list({
    q: query,
    fields: "files(id,name)",
    pageSize: 1,
  });

  if (res.result.files && res.result.files.length > 0) {
    driveFileId = res.result.files[0].id;
    return driveFileId;
  }

  // Buat file baru jika belum ada
  const initialData = { aktif: [], raffle: [], selesai: [] };
  const createdId = await createOrUpdateFileMultipart(null, initialData);
  driveFileId = createdId;
  return driveFileId;
}

async function loadFromDrive(showAlert = false) {
  if (!isSignedIn) { alert("Login dulu."); return; }
  await ensureDriveFile();
  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`,
    { headers: { Authorization: `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}` } }
  );
  if (!resp.ok) {
    alert("Gagal memuat data dari Drive.");
    return;
  }
  const json = await resp.json();
  // Validasi & merge minimal
  ["aktif","raffle","selesai"].forEach(t => {
    dataMap[t] = Array.isArray(json[t]) ? json[t] : [];
  });
  // Render ulang
  ["aktif","raffle","selesai"].forEach(renderTable);
  if (showAlert) alert("Data dimuat dari Google Drive.");
}

async function saveToDrive() {
  if (!isSignedIn) { alert("Login dulu."); return; }
  await ensureDriveFile();
  const payload = {
    aktif: dataMap.aktif,
    raffle: dataMap.raffle,
    selesai: dataMap.selesai,
  };
  await createOrUpdateFileMultipart(driveFileId, payload);
  alert("Data tersimpan ke Google Drive.");
}

// Multipart upload (create jika id null, else update)
async function createOrUpdateFileMultipart(fileId, jsonObj) {
  const metadata = {
    name: DRIVE_FILENAME,
    mimeType: "application/json",
  };
  const boundary = "-------314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;

  const body =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    "Content-Type: application/json\r\n\r\n" +
    JSON.stringify(jsonObj) +
    closeDelim;

  const method = fileId ? "PATCH" : "POST";
  const url = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;

  const res = await fetch(url, {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Drive upload error:", text);
    alert("Gagal menyimpan ke Drive.");
    throw new Error("Drive upload failed");
  }

  const out = await res.json();
  return out.id;
}
