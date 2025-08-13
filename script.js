// ===== Konfigurasi =====
const CLIENT_ID = "123146255469-kbddr3ni88jj9i92b3hjjg32os13qn3j.apps.googleusercontent.com";
const API_KEY = "AIzaSyAsGL6J2EOFi35rtgiuMk0wKZUbwNbZjYE"; // Dapatkan dari Google Cloud Console
const SCOPES = "https://www.googleapis.com/auth/drive.appdata";

// ===== Variabel Global =====
let accessToken = null;
let fileId = null;
const FILE_NAME = "horizontalARDP.json";

// ===== Inisialisasi Google API =====
function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  });
  checkLogin();
}

// ===== Cek Login Saat Refresh =====
function checkLogin() {
  const storedToken = localStorage.getItem("google_access_token");
  if (storedToken) {
    accessToken = storedToken;
    gapi.client.setToken({ access_token: storedToken });
    document.getElementById("user-name").textContent = "Tersambung";
    loadFile();
  }
}

// ===== Login =====
function handleCredentialResponse(response) {
  const credential = response.credential;
  const jwt = parseJwt(credential);
  document.getElementById("user-name").textContent = jwt.name;

  google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      localStorage.setItem("google_access_token", accessToken);
      gapi.client.setToken({ access_token: accessToken });
      loadFile();
    }
  }).requestAccessToken();
}

// ===== Logout =====
function logout() {
  localStorage.removeItem("google_access_token");
  location.reload();
}

// ===== Decode JWT =====
function parseJwt(token) {
  let base64Url = token.split('.')[1];
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  let jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

// ===== Cari File di Drive =====
async function loadFile() {
  const res = await gapi.client.drive.files.list({
    spaces: 'appDataFolder',
    fields: 'files(id, name)',
    q: `name='${FILE_NAME}'`
  });

  if (res.result.files.length > 0) {
    fileId = res.result.files[0].id;
    const content = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media'
    });
    loadTableData(JSON.parse(content.body));
  } else {
    saveFile([]); // Buat file baru kosong
  }
}

// ===== Simpan ke Drive =====
async function saveFile(data) {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify({
    name: FILE_NAME,
    parents: ['appDataFolder']
  })], { type: 'application/json' }));
  form.append('file', blob);

  let url = 'https://www.googleapis.com/upload/drive/v3/files';
  if (fileId) {
    url += `/${fileId}?uploadType=multipart`;
  } else {
    url += '?uploadType=multipart';
  }

  const res = await fetch(url, {
    method: fileId ? 'PATCH' : 'POST',
    headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
    body: form
  });

  const result = await res.json();
  if (!fileId) fileId = result.id;
}

// ===== Load Tabel =====
function loadTableData(data) {
  const tbody = document.querySelector("tbody");
  tbody.innerHTML = "";
  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${row.name}</td><td>${row.link}</td>`;
    tbody.appendChild(tr);
  });
}

// ===== Simpan Saat Ada Perubahan =====
function setupAutoSave() {
  document.querySelector("tbody").addEventListener("input", () => {
    const rows = [...document.querySelectorAll("tbody tr")].map(tr => {
      return {
        name: tr.cells[0].textContent,
        link: tr.cells[1].textContent
      };
    });
    saveFile(rows);
  });
}

setupAutoSave();
