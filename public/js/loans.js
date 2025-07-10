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

export function initLoans() {
  const addLoanBtn = document.getElementById('addLoanBtn');
  const loanForm = document.getElementById('loanForm');
  const loanDocumentInput = document.getElementById('loanDocumentInput');
  const loanUserInput = document.getElementById('loanUserInput');
  const loanDocumentSelect = document.getElementById('loanDocumentSelect');
  const loanUserSelect = document.getElementById('loanUserSelect');

  addLoanBtn.addEventListener('click', async () => {
    loanDocumentInput.value = '';
    loanUserInput.value = '';
    loanDocumentSelect.innerHTML = '';
    loanUserSelect.innerHTML = '';
    loanForm.reset();
    openModal('loanModal');
  });

  loanDocumentInput.addEventListener('input', async () => {
    const query = loanDocumentInput.value.trim();
    if (query.length < 2) {
      loanDocumentSelect.innerHTML = '';
      return;
    }
    const docs = await fetchJSON(`/api/documents?search=${encodeURIComponent(query)}&statut=disponible`);
    loanDocumentSelect.innerHTML = '<option value="">Sélectionnez un document</option>';
    docs.data.forEach(doc => {
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = `${doc.titre} (${doc.auteur})`;
      loanDocumentSelect.appendChild(option);
    });
  });

  loanUserInput.addEventListener('input', async () => {
    const query = loanUserInput.value.trim();
    if (query.length < 2) {
      loanUserSelect.innerHTML = '';
      return;
    }
    const users = await fetchJSON(`/api/utilisateurs?search=${encodeURIComponent(query)}`);
    loanUserSelect.innerHTML = '<option value="">Sélectionnez un utilisateur</option>';
    users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = `${user.nom} ${user.prenom}`;
      loanUserSelect.appendChild(option);
    });
  });

  loanForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(loanForm);
    const data = Object.fromEntries(formData.entries());

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
  loanDocumentSelect.addEventListener('change', () => {
    loanDocumentInput.value = loanDocumentSelect.options[loanDocumentSelect.selectedIndex].text;
  });

  loanUserSelect.addEventListener('change', () => {
    loanUserInput.value = loanUserSelect.options[loanUserSelect.selectedIndex].text;
  });

  loadLoans();
}
