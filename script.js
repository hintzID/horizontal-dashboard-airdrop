// ====== Konfigurasi ======
const CLIENT_ID = "123146255469-kbddr3ni88jj9i92b3hjjg32os13qn3j.apps.googleusercontent.com";
const API_KEY = "AIzaSyAsGL6J2EOFi35rtgiuMk0wKZUbwNbZjYE";
const SCOPES = "https://www.googleapis.com/auth/drive.appdata";
const FILE_NAME = "horizontalARDP.json";

let accessToken = null;
let fileId = null;

// ====== Load GAPI ======
function gapiLoaded() {
  gapi.load("client", initClient);
}

async function initClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
  });

  const storedToken = localStorage.getItem("g_token");
  if (storedToken) {
    accessToken = storedToken;
    gapi.client.setToken({ access_token: accessToken });
    onLoginSuccess();
  }
}

// ====== Login ======
function handleCredentialResponse(response) {
  google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenRes) => {
      accessToken = tokenRes.access_token;
      localStorage.setItem("g_token", accessToken);
      gapi.client.setToken({ access_token: accessToken });
      onLoginSuccess();
    }
  }).requestAccessToken();
}

// ====== Logout ======
function logout() {
  localStorage.removeItem("g_token");
  location.reload();
}

// ====== Setelah Login ======
function onLoginSuccess() {
  document.getElementById("user-name").textContent = "Tersambung";
  loadFile();
}

// ====== Load File ======
async function loadFile() {
  const res = await gapi.client.drive.files.list({
    spaces: "appDataFolder",
    q: `name='${FILE_NAME}'`,
    fields: "files(id, name)"
  });

  if (res.result.files.length > 0) {
    fileId = res.result.files[0].id;
    const content = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: "media"
    });
    renderTable(JSON.parse(content.body));
  } else {
    saveFile([]);
  }
}

// ====== Simpan File ======
async function saveFile(data) {
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const metadata = {
    name: FILE_NAME,
    parents: ["appDataFolder"]
  };

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", blob);

  let url = "https://www.googleapis.com/upload/drive/v3/files";
  let method = "POST";
  if (fileId) {
    url += `/${fileId}?uploadType=multipart`;
    method = "PATCH";
  } else {
    url += "?uploadType=multipart";
  }

  const res = await fetch(url, {
    method,
    headers: new Headers({ Authorization: "Bearer " + accessToken }),
    body: form
  });

  const result = await res.json();
  if (!fileId) fileId = result.id;
}

// ====== Render Table ======
function renderTable(data) {
  const tbody = document.querySelector("tbody");
  tbody.innerHTML = "";
  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td contenteditable>${row.name}</td><td contenteditable>${row.link}</td>`;
    tbody.appendChild(tr);
  });
}

// ====== Auto Save ======
function enableAutoSave() {
  document.querySelector("tbody").addEventListener("input", () => {
    const rows = [...document.querySelectorAll("tbody tr")].map(tr => ({
      name: tr.cells[0].textContent.trim(),
      link: tr.cells[1].textContent.trim()
    }));
    saveFile(rows);
  });
}

enableAutoSave();
