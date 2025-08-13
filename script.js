// ===== KONFIGURASI GOOGLE API =====
const CLIENT_ID = "123146255469-vs68gm9qurlc2ej29kq091qm13bisf6b.apps.googleusercontent.com";
const API_KEY = ""; // Bisa dikosongkan kalau cuma OAuth
const SCOPES = "https://www.googleapis.com/auth/drive.file";

let authInstance;
let dataFileId = null;
let tableData = [];

// ===== INISIALISASI GOOGLE API =====
function initClient() {
  gapi.client
    .init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      scope: SCOPES,
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
    })
    .then(() => {
      authInstance = gapi.auth2.getAuthInstance();
      authInstance.isSignedIn.listen(updateSigninStatus);
      updateSigninStatus(authInstance.isSignedIn.get());
    });
}

function handleClientLoad() {
  gapi.load("client:auth2", initClient);
}

// ===== UPDATE STATUS LOGIN =====
function updateSigninStatus(isSignedIn) {
  const statusElem = document.getElementById("loginStatus");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (isSignedIn) {
    const profile = authInstance.currentUser.get().getBasicProfile();
    statusElem.textContent = "Login sebagai: " + profile.getName();
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";

    loadDataFromDrive();
  } else {
    statusElem.textContent = "Belum login";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
  }
}

// ===== LOGIN & LOGOUT =====
function handleLogin() {
  authInstance.signIn();
}

function handleLogout() {
  authInstance.signOut();
}

// ===== MENCARI FILE DI DRIVE =====
function loadDataFromDrive() {
  gapi.client.drive.files
    .list({
      q: "name='airdrop_data.json' and trashed=false",
      spaces: "drive",
    })
    .then((response) => {
      const files = response.result.files;
      if (files && files.length > 0) {
        dataFileId = files[0].id;
        downloadFile(dataFileId);
      } else {
        tableData = [];
        renderTable();
      }
    });
}

// ===== DOWNLOAD FILE JSON =====
function downloadFile(fileId) {
  gapi.client.drive.files
    .get({
      fileId: fileId,
      alt: "media",
    })
    .then((res) => {
      try {
        tableData = JSON.parse(res.body);
      } catch {
        tableData = [];
      }
      renderTable();
    });
}

// ===== SIMPAN FILE KE DRIVE =====
function saveDataToDrive() {
  const fileContent = JSON.stringify(tableData);
  const file = new Blob([fileContent], { type: "application/json" });
  const metadata = {
    name: "airdrop_data.json",
    mimeType: "application/json",
  };

  if (dataFileId) {
    // Update file
    gapi.client.request({
      path: `/upload/drive/v3/files/${dataFileId}`,
      method: "PATCH",
      params: { uploadType: "media" },
      body: fileContent,
    });
  } else {
    // Buat file baru
    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("file", file);

    fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: new Headers({ Authorization: "Bearer " + gapi.auth.getToken().access_token }),
      body: form,
    })
      .then((res) => res.json())
      .then((val) => {
        dataFileId = val.id;
      });
  }
}

// ===== RENDER TABEL =====
function renderTable() {
  const tbody = document.querySelector("#mainTable tbody");
  tbody.innerHTML = "";
  tableData.forEach((row, idx) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td contenteditable="true">${row.name || ""}</td>
      <td contenteditable="true">${row.category || ""}</td>
      <td><input type="checkbox" ${row.checked ? "checked" : ""}></td>
      <td class="links">${renderLinks(row.links || {})}</td>
      <td contenteditable="true">${row.notes || ""}</td>
      <td>
        <button onclick="deleteRow(${idx})">🗑️</button>
      </td>
    `;

    tr.querySelectorAll("[contenteditable]").forEach((cell, cIdx) => {
      cell.addEventListener("input", () => {
        if (cIdx === 0) row.name = cell.textContent.trim();
        if (cIdx === 1) row.category = cell.textContent.trim();
        if (cIdx === 4) row.notes = cell.textContent.trim();
        saveDataToDrive();
      });
    });

    tr.querySelector("input[type=checkbox]").addEventListener("change", (e) => {
      row.checked = e.target.checked;
      saveDataToDrive();
    });

    tbody.appendChild(tr);
  });
}

// ===== BUAT LINK ICONS =====
function renderLinks(links) {
  const icons = {
    utama: "🌐",
    discord: "💜",
    x: "𝕏",
    tele: "📱",
    custom1: "🔗",
    custom2: "🔗"
  };

  return Object.keys(icons)
    .map((k) => {
      const hasLink = links[k];
      return `<button ${hasLink ? `onclick="window.open('${links[k]}')"` : ""} class="${hasLink ? "" : "empty"}">${icons[k]}</button>`;
    })
    .join("");
}

// ===== TAMBAH & HAPUS ROW =====
function addRow() {
  tableData.push({ name: "", category: "", checked: false, links: {}, notes: "" });
  renderTable();
  saveDataToDrive();
}

function deleteRow(idx) {
  tableData.splice(idx, 1);
  renderTable();
  saveDataToDrive();
}
