const storages = {
  aktif: "airdropData",
  selesai: "airdropDone",
  raffle: "airdropRaffle"
};

let dataMap = {
  aktif: loadData("aktif"),
  selesai: loadData("selesai"),
  raffle: loadData("raffle")
};

function loadData(type) {
  try {
    let d = JSON.parse(localStorage.getItem(storages[type]) || "[]");
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}

function saveData(type) {
  localStorage.setItem(storages[type], JSON.stringify(dataMap[type]));
}

function setLink(type, index, url) {
  if (dataMap[type][index]) {
    dataMap[type][index].link = url || "";
    saveData(type);
    renderTable(type);
  }
}

function renderTable(type) {
  const tbody = document.querySelector(`#${type} tbody`);
  tbody.innerHTML = "";
  dataMap[type].forEach((row, i) => {
    const tr = document.createElement("tr");

    // ID
    const tdId = document.createElement("td");
    tdId.textContent = i + 1;
    tr.appendChild(tdId);

    // Nama
    const tdNama = document.createElement("td");
    tdNama.contentEditable = "true";
    tdNama.innerText = row.nama || "";
    tdNama.oninput = () => {
      dataMap[type][i].nama = tdNama.innerText.trim();
      saveData(type);
    };
    tr.appendChild(tdNama);

    // Deskripsi
    const tdDesc = document.createElement("td");
    tdDesc.contentEditable = "true";
    tdDesc.innerText = row.deskripsi || "";
    tdDesc.oninput = () => {
      dataMap[type][i].deskripsi = tdDesc.innerText.trim();
      saveData(type);
    };
    tr.appendChild(tdDesc);

    // Link
    const tdLink = document.createElement("td");
    const btnLink = document.createElement("button");
    if (row.link) {
      btnLink.textContent = "🔗";
      btnLink.title = "Klik untuk buka, Shift+Klik untuk edit";
      btnLink.onclick = (e) => {
        if (e.shiftKey) {
          const url = prompt("Edit Link:", row.link);
          if (url !== null) setLink(type, i, url.trim());
        } else {
          window.open(row.link, "_blank");
        }
      };
    } else {
      btnLink.textContent = "+";
      btnLink.title = "Atur Link";
      btnLink.onclick = () => {
        const url = prompt("Masukkan Link:", "");
        if (url !== null) setLink(type, i, url.trim());
      };
    }
    tdLink.appendChild(btnLink);
    tr.appendChild(tdLink);

    // Checklist
    const tdCheck = document.createElement("td");
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = row.checklist || false;
    check.onchange = e => {
      dataMap[type][i].checklist = e.target.checked;
      saveData(type);
    };
    tdCheck.appendChild(check);
    tr.appendChild(tdCheck);

    // Aksi
    const tdAksi = document.createElement("td");

    if (type === "aktif") {
      const btnSelesai = document.createElement("button");
      btnSelesai.textContent = "✅";
      btnSelesai.title = "Pindahkan ke Selesai";
      btnSelesai.onclick = () => {
        dataMap["selesai"].push(dataMap[type][i]);
        dataMap[type].splice(i, 1);
        saveData(type);
        saveData("selesai");
        renderTable(type);
        renderTable("selesai");
      };
      tdAksi.appendChild(btnSelesai);
    }

    const btnHapus = document.createElement("button");
    btnHapus.textContent = "🗑";
    btnHapus.title = "Hapus Baris";
    btnHapus.onclick = () => {
      dataMap[type].splice(i, 1);
      saveData(type);
      renderTable(type);
    };
    tdAksi.appendChild(btnHapus);

    tr.appendChild(tdAksi);

    tbody.appendChild(tr);
  });
}

function addRow(type) {
  dataMap[type].push({ nama: "", deskripsi: "", link: "", checklist: false });
  saveData(type);
  renderTable(type);
}

function resetChecklist(type) {
  dataMap[type].forEach(r => r.checklist = false);
  saveData(type);
  renderTable(type);
}

// Tab switching
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-content").forEach(tab => tab.style.display = "none");
    document.getElementById(btn.dataset.tab).style.display = "block";
  });
});

// Init default tab
document.querySelector(".tab-btn[data-tab='aktif']").click();

// Render awal
renderTable("aktif");
renderTable("selesai");
renderTable("raffle");
