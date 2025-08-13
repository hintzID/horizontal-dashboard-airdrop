const storages = {
  aktif: "airdropData",
  raffle: "airdropRaffle",
  selesai: "airdropDone",
};

let dataMap = {};

function loadData(type) {
  try {
    return JSON.parse(localStorage.getItem(storages[type])) || [];
  } catch {
    return [];
  }
}

function saveData(type) {
  localStorage.setItem(storages[type], JSON.stringify(dataMap[type]));
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
    if (url && !e.shiftKey) {
      window.open(url, "_blank");
    } else {
      const newUrl = prompt(`Masukkan Link ${label}:`, url || "");
      if (newUrl !== null) {
        dataMap[type][index].links[key] = newUrl.trim();
        saveData(type);
        renderTable(type);
      }
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
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td contenteditable="true">${row.nama || ""}</td>
      <td contenteditable="true">${row.deskripsi || ""}</td>
      <td class="links"></td>
      <td><input type="checkbox" ${row.checklist ? "checked" : ""}></td>
      <td></td>
    `;

    if (!row.links)
      row.links = { main: "", discord: "", x: "", telegram: "", custom1: "", custom2: "" };

    // Editable fields update data
    tr.cells[1].oninput = () => {
      row.nama = tr.cells[1].innerText.trim();
      saveData(type);
    };
    tr.cells[2].oninput = () => {
      row.deskripsi = tr.cells[2].innerText.trim();
      saveData(type);
    };

    const linkCell = tr.cells[3];
    linkCell.appendChild(createLinkButton(type, i, "main", "Link Utama", "🔗"));
    linkCell.appendChild(createLinkButton(type, i, "discord", "Discord", "🟣"));
    linkCell.appendChild(createLinkButton(type, i, "x", "X / Twitter", "𝕏"));
    linkCell.appendChild(createLinkButton(type, i, "telegram", "Telegram", "📨"));
    linkCell.appendChild(createLinkButton(type, i, "custom1", "Custom 1", "🌐"));
    linkCell.appendChild(createLinkButton(type, i, "custom2", "Custom 2", "📄"));

    tr.cells[4].querySelector("input").onchange = (e) => {
      row.checklist = e.target.checked;
      saveData(type);
    };

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
    delBtn.onclick = () => {
      dataMap[type].splice(i, 1);
      saveData(type);
      renderTable(type);
    };
    aksiCell.appendChild(delBtn);

    tbody.appendChild(tr);
  });

  container.appendChild(table);
}

function addRow(type) {
  dataMap[type].push({
    nama: "",
    deskripsi: "",
    links: { main: "", discord: "", x: "", telegram: "", custom1: "", custom2: "" },
    checklist: false,
  });
  saveData(type);
  renderTable(type);
}
function resetChecklist(type) {
  dataMap[type].forEach((r) => (r.checklist = false));
  saveData(type);
  renderTable(type);
}
function moveRow(from, to, index) {
  dataMap[to].push(dataMap[from][index]);
  dataMap[from].splice(index, 1);
  saveData(from);
  saveData(to);
  renderTable(from);
  renderTable(to);
}

// Tab switching
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"));
    document.getElementById(btn.dataset.tab).classList.add("active");
  };
});

// Inisialisasi data dan tampilan
["aktif", "raffle", "selesai"].forEach((t) => (dataMap[t] = loadData(t)));
["aktif", "raffle", "selesai"].forEach(renderTable);
document.querySelector(".tab-btn[data-tab='aktif']").click();
