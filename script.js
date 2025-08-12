let data = [];
try {
  data = JSON.parse(localStorage.getItem('airdropData') || '[]');
  if (!Array.isArray(data)) data = [];
} catch (e) {
  data = [];
}

function saveTable() {
  localStorage.setItem('airdropData', JSON.stringify(data));
}

function setLink(index, url) {
  if (data[index]) {
    data[index].link = url || '';
    saveTable();
    renderTable();
  }
}

function renderTable() {
  const tbody = document.querySelector('#airdropTable tbody');
  tbody.innerHTML = '';
  data.forEach((row, i) => {
    const tr = document.createElement('tr');

    // ID
    const tdId = document.createElement('td');
    tdId.textContent = i + 1;
    tr.appendChild(tdId);

    // Nama
    const tdNama = document.createElement('td');
    tdNama.contentEditable = "true";
    tdNama.innerText = row.nama || '';
    tdNama.oninput = () => { data[i].nama = tdNama.innerText.trim(); saveTable(); };
    tr.appendChild(tdNama);

    // Deskripsi
    const tdDesc = document.createElement('td');
    tdDesc.contentEditable = "true";
    tdDesc.innerText = row.deskripsi || '';
    tdDesc.oninput = () => { data[i].deskripsi = tdDesc.innerText.trim(); saveTable(); };
    tr.appendChild(tdDesc);

    // Link (Button)
    const tdLink = document.createElement('td');
    const btnLink = document.createElement('button');

    if (row.link) {
      btnLink.textContent = "🔗";
      btnLink.title = "Klik untuk buka, Shift+Klik untuk edit";
      btnLink.onclick = (e) => {
        if (e.shiftKey) {
          const url = prompt("Edit Link:", row.link);
          if (url !== null) setLink(i, url.trim());
        } else {
          window.open(row.link, "_blank");
        }
      };
    } else {
      btnLink.textContent = "+";
      btnLink.title = "Atur Link";
      btnLink.onclick = () => {
        const url = prompt("Masukkan Link:", '');
        if (url !== null) setLink(i, url.trim());
      };
    }
    tdLink.appendChild(btnLink);
    tr.appendChild(tdLink);

    // Checklist
    const tdCheck = document.createElement('td');
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = row.checklist || false;
    check.onchange = e => { data[i].checklist = e.target.checked; saveTable(); };
    tdCheck.appendChild(check);
    tr.appendChild(tdCheck);

    // Aksi
    const tdAksi = document.createElement('td');
    const btnHapus = document.createElement('button');
    btnHapus.textContent = "🗑";
    btnHapus.title = "Hapus Baris";
    btnHapus.onclick = () => { data.splice(i, 1); saveTable(); renderTable(); };
    tdAksi.appendChild(btnHapus);
    tr.appendChild(tdAksi);

    tbody.appendChild(tr);
  });
}

function addRow() {
  data.push({ nama: '', deskripsi: '', link: '', checklist: false });
  saveTable();
  renderTable();
}

document.getElementById('resetChecklist').onclick = () => {
  data.forEach(r => r.checklist = false);
  saveTable();
  renderTable();
};

renderTable();
