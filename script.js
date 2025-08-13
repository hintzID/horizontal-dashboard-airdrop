// ====== KONFIGURASI GOOGLE API ======
const CLIENT_ID = "123146255469-kbddr3ni88jj9i92b3hjjg32os13qn3j.apps.googleusercontent.com";
const API_KEY = "AIzaSyAsGL6J2EOFi35rtgiuMk0wKZUbwNbZjYE"; // kosongkan kalau tidak pakai API key
const SCOPES = "https://www.googleapis.com/auth/drive.file";

let tokenClient;
let gapiInited = false;
let gisInited = false;
let accessToken = null;
let fileId = null;

// ====== ELEMENT ======
const signInBtn = document.getElementById("googleSignInBtn");
const userInfo = document.getElementById("userInfo");

// ====== INISIALISASI GOOGLE API ======
function gapiLoaded() {
  gapi.load("client", initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  });
  gapiInited = true;
  maybeEnableSignin();
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (resp) => {
      if (resp.access_token) {
        accessToken = resp.access_token;
        localStorage.setItem("googleAccessToken", accessToken);
        loadUserInfo();
      }
    },
  });
  gisInited = true;
  maybeEnableSignin();
}

function maybeEnableSignin() {
  if (gapiInited && gisInited) {
    const savedToken = localStorage.getItem("googleAccessToken");
    if (savedToken) {
      accessToken = savedToken;
      loadUserInfo();
    }
  }
}

// ====== LOGIN GOOGLE ======
signInBtn.addEventListener("click", () => {
  tokenClient.requestAccessToken({ prompt: "" });
});

function loadUserInfo() {
  gapi.client.request({
    path: "https://www.googleapis.com/oauth2/v2/userinfo",
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((res) => {
    const profile = res.result;
    userInfo.textContent = `Halo, ${profile.name}`;
    signInBtn.style.display = "none";
    autoLoadData();
  });
}

// ====== SIMPAN & MUAT DATA ======
function autoLoadData() {
  gapi.client.drive.files.list({
    q: "name='airdropsData.json' and trashed=false",
    spaces: "drive",
    fields: "files(id, name)",
  }).then((res) => {
    if (res.result.files && res.result.files.length > 0) {
      fileId = res.result.files[0].id;
      gapi.client.drive.files.get({
        fileId: fileId,
        alt: "media"
      }).then((file) => {
        const data = JSON.parse(file.body);
        renderTable(data);
      });
    } else {
      saveData([]);
    }
  });
}

function saveData(data) {
  const fileContent = JSON.stringify(data);
  const file = new Blob([fileContent], { type: "application/json" });
  const metadata = {
    name: "airdropsData.json",
    mimeType: "application/json"
  };

  if (!fileId) {
    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", file);
    fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: new Headers({ Authorization: "Bearer " + accessToken }),
      body: form
    }).then(res => res.json()).then(file => {
      fileId = file.id;
    });
  } else {
    fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: "PATCH",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json"
      },
      body: fileContent
    });
  }
}

// ====== RENDER TABEL (Contoh) ======
function renderTable(data) {
  const tbody = document.querySelector("#airdropTable tbody");
  tbody.innerHTML = "";
  data.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.name}</td>
      <td>${row.date}</td>
      <td>${row.status}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ====== LOAD SCRIPT GOOGLE ======
document.write('<script src="https://apis.google.com/js/api.js?onload=gapiLoaded"></script>');
document.write('<script src="https://accounts.google.com/gsi/client" onload="gisLoaded()"></script>');
