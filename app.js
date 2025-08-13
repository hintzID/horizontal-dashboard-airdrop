/* ====== STATE ====== */
let dataStore = {
  aktif: JSON.parse(localStorage.getItem('aktif')) || [],
  raffle: JSON.parse(localStorage.getItem('raffle')) || [],
  selesai: JSON.parse(localStorage.getItem('selesai')) || []
};

/* Modal state */
let currentRow = null;
let currentKey = null;
let linkToEdit = null;

/* ====== UTILITY ====== */
function saveData() {
  localStorage.setItem('aktif', JSON.stringify(dataStore.aktif));
  localStorage.setItem('raffle', JSON.stringify(dataStore.raffle));
  localStorage.setItem('selesai', JSON.stringify(dataStore.selesai));
}

function guardLinks(obj) {
  return {
    main: obj?.main || '',
    discord: obj?.discord || '',
    x: obj?.x || '',
    telegram: obj?.telegram || '',
    custom1: obj?.custom1 || '',
    custom2: obj?.custom2 || ''
  };
}

/* ====== DOM ELEMENTS ====== */
const linkModal = document.getElementById('link-modal');
const closeModal = document.querySelector('.close');
const saveLinkBtn = document.getElementById('save-link');
const linkTypeSelect = document.getElementById('link-type');
const linkUrlInput = document.getElementById('link-url');

/* ====== TABS ====== */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    document.getElementById(tab).classList.add('active');
  });
});

/* ====== MODAL FUNCTIONS ====== */
function openLinkModal(row, key, linkKey = null) {
  currentRow = row;
  currentKey = key;
  linkToEdit = linkKey;
  
  if (linkKey) {
    const links = guardLinks(row.links);
    linkTypeSelect.value = linkKey;
    linkUrlInput.value = links[linkKey] || '';
  } else {
    linkTypeSelect.value = 'main';
    linkUrlInput.value = '';
  }
  
  linkModal.classList.add('active');
}

closeModal.addEventListener('click', () => {
  linkModal.classList.remove('active');
});

saveLinkBtn.addEventListener('click', () => {
  const linkType = linkTypeSelect.value;
  const linkUrl = linkUrlInput.value.trim();
  
  if (!currentRow.links) currentRow.links = {};
  
  if (linkUrl) {
    currentRow.links[linkType] = linkUrl;
  } else {
    delete currentRow.links[linkType];
  }
  
  saveData();
  renderAll();
  linkModal.classList.remove('active');
});

window.addEventListener('click', (e) => {
  if (e.target === linkModal) {
    linkModal.classList.remove('active');
  }
});

/* ====== RENDER FUNCTIONS ====== */
function renderTable(key, tableId, arr) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  
  if (arr.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>Tidak ada data airdrop</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = '';
  
  arr.forEach((row, i) => {
    const links = guardLinks(row.links);
    const tr = document.createElement('tr');
    
    // Nama
    const tdName = document.createElement('td');
    tdName.contentEditable = 'true';
    tdName.innerText = row.nama || '';
    tdName.addEventListener('input', () => {
      row.nama = tdName.innerText.trim();
      saveData();
    });
    tr.appendChild(tdName);
    
    // Deskripsi
    const tdDesc = document.createElement('td');
    tdDesc.contentEditable = 'true';
    tdDesc.innerText = row.deskripsi || '';
    tdDesc.addEventListener('input', () => {
      row.deskripsi = tdDesc.innerText.trim();
      saveData();
    });
    tr.appendChild(tdDesc);
    
    // Checklist
    const tdCheck = document.createElement('td');
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.className = 'status-check';
    chk.checked = !!row.checklist;
    chk.title = row.checklist ? 'Tandai belum selesai' : 'Tandai selesai';
    chk.addEventListener('change', () => {
      row.checklist = chk.checked;
      saveData();
    });
    tdCheck.appendChild(chk);
    tr.appendChild(tdCheck);
    
    // Links
    const tdLinks = document.createElement('td');
    const linksContainer = document.createElement('div');
    linksContainer.className = 'links-container';
    
    const linksOrder = [
      ['main', '🌐', 'Situs Utama'],
      ['discord', '🟣', 'Discord'],
      ['x', '𝕏', 'Twitter/X'],
      ['telegram', '✈️', 'Telegram'],
      ['custom1', '🔗', 'Tautan 1'],
      ['custom2', '🔗', 'Tautan 2']
    ];
    
    linksOrder.forEach(([k, emoji, title]) => {
      const btn = document.createElement('button');
      btn.className = `link-btn ${links[k] ? '' : 'empty'}`;
      btn.innerHTML = emoji;
      btn.title = links[k] ? `${title}: ${links[k]}` : `${title} (Klik untuk menambahkan)`;
      
      // Store tooltip data for mobile
      btn.dataset.tooltip = links[k] || title;
      
      btn.addEventListener('click', (e) => {
        if (e.shiftKey || !links[k]) {
          openLinkModal(row, key, k);
        } else if (links[k]) {
          window.open(links[k], '_blank');
        }
      });
      
      linksContainer.appendChild(btn);
    });
    
    tdLinks.appendChild(linksContainer);
    tr.appendChild(tdLinks);
    
    // Actions
    const tdActions = document.createElement('td');
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'action-buttons';
    
    if (key === 'aktif' || key === 'raffle') {
      const doneBtn = document.createElement('button');
      doneBtn.className = 'action-btn done-btn';
      doneBtn.innerHTML = '<i class="fas fa-check"></i>';
      doneBtn.title = 'Pindahkan ke Selesai';
      doneBtn.addEventListener('click', () => {
        dataStore.selesai.push(row);
        dataStore[key].splice(i, 1);
        renderAll();
        saveData();
      });
      actionsContainer.appendChild(doneBtn);
    }
    
    const delBtn = document.createElement('button');
    delBtn.className = 'action-btn delete-btn';
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.title = 'Hapus';
    delBtn.addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
        dataStore[key].splice(i, 1);
        renderAll();
        saveData();
      }
    });
    actionsContainer.appendChild(delBtn);
    
    tdActions.appendChild(actionsContainer);
    tr.appendChild(tdActions);
    
    tbody.appendChild(tr);
  });
}

function renderAll() {
  renderTable('aktif', 'table-aktif', dataStore.aktif);
  renderTable('raffle', 'table-raffle', dataStore.raffle);
  renderTable('selesai', 'table-selesai', dataStore.selesai);
}

/* ====== EVENT LISTENERS ====== */
document.getElementById('add-aktif').addEventListener('click', () => {
  dataStore.aktif.push({ 
    nama: '', 
    deskripsi: '', 
    links: {}, 
    checklist: false 
  });
  renderAll(); 
  saveData();
});

document.getElementById('add-raffle').addEventListener('click', () => {
  dataStore.raffle.push({ 
    nama: '', 
    deskripsi: '', 
    links: {}, 
    checklist: false 
  });
  renderAll(); 
  saveData();
});

document.getElementById('reset-aktif').addEventListener('click', () => {
  if (confirm('Reset semua status checklist di tab Aktif?')) {
    dataStore.aktif.forEach(r => r.checklist = false); 
    renderAll(); 
    saveData();
  }
});

document.getElementById('reset-raffle').addEventListener('click', () => {
  if (confirm('Reset semua status checklist di tab Raffle?')) {
    dataStore.raffle.forEach(r => r.checklist = false); 
    renderAll(); 
    saveData();
  }
});

/* ====== TOOLTIP HANDLER ====== */
document.addEventListener('mouseover', (e) => {
  if (e.target.classList.contains('link-btn') && window.innerWidth < 768) {
    const tooltip = document.createElement('div');
    tooltip.className = 'link-tooltip';
    tooltip.textContent = e.target.dataset.tooltip;
    document.body.appendChild(tooltip);
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.top = `${rect.top - 30}px`;
    tooltip.style.left = `${rect.left + rect.width/2 - tooltip.offsetWidth/2}px`;
    
    e.target.addEventListener('mouseout', () => {
      tooltip.remove();
    }, { once: true });
  }
});

/* ====== INIT ====== */
window.addEventListener('DOMContentLoaded', () => {
  renderAll();
});