import { fetchJSON } from './api.js';
import { showToast } from './notifications.js';
import { openModal, closeModal } from './modals.js';
import { loadDocuments } from './documents.js';

export async function loadLoans(page = 1, limit = 10, search = '', statut = '') {
  const loansTable = document.getElementById('loansTable');
  const params = new URLSearchParams({ page, limit });
  if (search) params.append('search', search);
  if (statut) params.append('statut', statut);

  const response = await fetchJSON(`/api/emprunts?${params.toString()}`);
  const loans = response.data;
  const totalPages = response.totalPages;

  loansTable.innerHTML = '';
  loans.forEach(loan => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${loan.titre}</td>
      <td>${loan.nom} ${loan.prenom}</td>
      <td>${loan.type_utilisateur || ''}</td>
      <td>${loan.classe || loan.grade || loan.lieu_affectation || ''}</td>
      <td>${loan.matricule || ''}</td>
      <td>${new Date(loan.date_emprunt).toLocaleDateString()}</td>
      <td>${new Date(loan.date_retour_prevue).toLocaleDateString()}</td>
      <td>${loan.statut}</td>
      <td>
        ${loan.statut === 'en_cours' ? `<button class="btn btn-sm btn-success return-loan" data-id="${loan.id}"><i class="fas fa-undo"></i> Retour</button>` : ''}
      </td>
    `;
    loansTable.appendChild(tr);
  });

  document.querySelectorAll('.return-loan').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      returnLoan(id);
    });
  });

  renderPagination(totalPages, page, loadLoans);
}

function renderPagination(totalPages, currentPage, onPageChange) {
  const paginationContainer = document.getElementById('loansPagination');
  paginationContainer.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = 'btn btn-sm ' + (i === currentPage ? 'btn-primary' : 'btn-secondary');
    btn.addEventListener('click', () => onPageChange(i));
    paginationContainer.appendChild(btn);
  }
}

async function returnLoan(id) {
  if (!confirm('Confirmer le retour du document ?')) return;
  try {
    await fetchJSON(`/api/emprunts/${id}/retour`, { method: 'PUT' });
    showToast('Retour enregistré avec succès', 'success');
    loadLoans();
    loadDocuments();
  } catch (error) {
    // error handled in fetchJSON
  }
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function createSuggestionItem(text, id, onClick) {
  const div = document.createElement('div');
  div.className = 'autocomplete-suggestion';
  div.textContent = text;
  div.addEventListener('click', () => onClick(id, text));
  return div;
}

export function initLoans() {
  const addLoanBtn = document.getElementById('addLoanBtn');
  const loanForm = document.getElementById('loanForm');
  const loanDocumentInput = document.getElementById('loanDocumentInput');
  const loanDocumentHidden = document.getElementById('loanDocument');
  const loanDocumentSuggestions = document.getElementById('loanDocumentSuggestions');
  const loanUserInput = document.getElementById('loanUserInput');
  const loanUserHidden = document.getElementById('loanUser');
  const loanUserSuggestions = document.getElementById('loanUserSuggestions');

  addLoanBtn.addEventListener('click', () => {
    loanDocumentInput.value = '';
    loanDocumentHidden.value = '';
    loanDocumentSuggestions.innerHTML = '';
    loanUserInput.value = '';
    loanUserHidden.value = '';
    loanUserSuggestions.innerHTML = '';
    loanForm.reset();
    openModal('loanModal');
  });

  const fetchDocumentSuggestions = debounce(async () => {
    const query = loanDocumentInput.value.trim();
    if (query.length < 2) {
      loanDocumentSuggestions.innerHTML = '';
      loanDocumentHidden.value = '';
      return;
    }
    try {
      const docs = await fetchJSON(`/api/documents?search=${encodeURIComponent(query)}&statut=disponible`);
      loanDocumentSuggestions.innerHTML = '';
      docs.data.forEach(doc => {
        const item = createSuggestionItem(`${doc.titre} (${doc.auteur})`, doc.id, (id, text) => {
          loanDocumentInput.value = text;
          loanDocumentHidden.value = id;
          loanDocumentSuggestions.innerHTML = '';
        });
        loanDocumentSuggestions.appendChild(item);
      });
    } catch (error) {
      loanDocumentSuggestions.innerHTML = '';
    }
  }, 300);

  loanDocumentInput.addEventListener('input', fetchDocumentSuggestions);

  const fetchUserSuggestions = debounce(async () => {
    const query = loanUserInput.value.trim();
    if (query.length < 2) {
      loanUserSuggestions.innerHTML = '';
      loanUserHidden.value = '';
      return;
    }
    try {
      const users = await fetchJSON(`/api/utilisateurs?search=${encodeURIComponent(query)}`);
      loanUserSuggestions.innerHTML = '';
      users.data?.forEach ? users.data.forEach(user => {
        const item = createSuggestionItem(`${user.nom} ${user.prenom}`, user.id, (id, text) => {
          loanUserInput.value = text;
          loanUserHidden.value = id;
          loanUserSuggestions.innerHTML = '';
        });
        loanUserSuggestions.appendChild(item);
      }) : users.forEach(user => {
        const item = createSuggestionItem(`${user.nom} ${user.prenom}`, user.id, (id, text) => {
          loanUserInput.value = text;
          loanUserHidden.value = id;
          loanUserSuggestions.innerHTML = '';
        });
        loanUserSuggestions.appendChild(item);
      });
    } catch (error) {
      loanUserSuggestions.innerHTML = '';
    }
  }, 300);

  loanUserInput.addEventListener('input', fetchUserSuggestions);

  loanForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!loanDocumentHidden.value) {
      showToast('Veuillez sélectionner un document valide dans la liste.', 'error');
      return;
    }
    if (!loanUserHidden.value) {
      showToast('Veuillez sélectionner un utilisateur valide dans la liste.', 'error');
      return;
    }
    const formData = new FormData(loanForm);
    const data = Object.fromEntries(formData.entries());
    // Remove the temporary input fields from data
    delete data.loanDocumentInput;
    delete data.loanUserInput;

    try {
      await fetchJSON('/api/emprunts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      showToast('Emprunt créé avec succès', 'success');
      closeModal('loanModal');
      loadLoans();
      loadDocuments();
    } catch (error) {
      // error handled in fetchJSON
    }
  });

  loadLoans();
}
