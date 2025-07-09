import { fetchJSON } from './api.js';
import { showToast } from './notifications.js';
import { openModal, closeModal } from './modals.js';

const loansTable = document.getElementById('loansTable');
const addLoanBtn = document.getElementById('addLoanBtn');
const loanModal = document.getElementById('loanModal');
const loanForm = document.getElementById('loanForm');
const loanDocumentSelect = document.getElementById('loanDocument');
const loanUserSelect = document.getElementById('loanUser');

async function loadLoans() {
  const loans = await fetchJSON('/api/emprunts');
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
}

async function returnLoan(id) {
  if (!confirm('Confirmer le retour du document ?')) return;
  try {
    await fetchJSON(`/api/emprunts/${id}/retour`, { method: 'PUT' });
    showToast('Retour enregistré avec succès', 'success');
    loadLoans();
    // Reload documents to update availability
    const { loadDocuments } = await import('./documents.js');
    loadDocuments();
  } catch (error) {
    // error handled in fetchJSON
  }
}

addLoanBtn.addEventListener('click', async () => {
  const docs = await fetchJSON('/api/documents?statut=disponible');

  docs.forEach(doc => {
    const option = document.createElement('option');
    option.value = doc.id;
    option.textContent = `${doc.titre} (${doc.auteur})`;
    loanDocumentSelect.appendChild(option);
  });

  const users = await fetchJSON('/api/utilisateurs');
  loanUserSelect.innerHTML = '<option value="">Sélectionnez un utilisateur</option>';
  users.forEach(user => {
    const option = document.createElement('option');
    option.value = user.id;
    option.textContent = `${user.nom} ${user.prenom}`;
    loanUserSelect.appendChild(option);
  });
  loanForm.reset();
  openModal('loanModal');
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
    const { loadDocuments } = await import('./documents.js');
    loadDocuments();
  } catch (error) {
    // error handled in fetchJSON
  }
});

export { loadLoans };
