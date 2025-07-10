import { fetchJSON } from './api.js';
import { showToast, addNotification } from './notifications.js';
import { openModal, closeModal } from './modals.js';

const loansTable = document.getElementById('loansTable');
const addLoanBtn = document.getElementById('addLoanBtn');
const loanModal = document.getElementById('loanModal');
const loanForm = document.getElementById('loanForm');
const loanDocumentSelect = document.getElementById('loanDocument');
const loanUserSelect = document.getElementById('loanUser');

const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const exportLoansBtn = document.getElementById('exportLoansBtn');
const printLoansBtn = document.getElementById('printLoansBtn');

let allLoans = [];

async function loadLoans() {
  allLoans = await fetchJSON('/api/emprunts');
  renderLoans(allLoans);
}

function renderLoans(loans) {
  loansTable.innerHTML = '';
  loans.forEach(loan => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
  <td>${loan.titre}</td>
  <td>${loan.nom} ${loan.prenom}</td>
  <td>${loan.type_utilisateur || ''}</td>
  <td>${loan.classe_grade_lieu || ''}</td>
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
}

function filterLoansByDate(loans, startDate, endDate) {
  return loans.filter(loan => {
    const loanDate = new Date(loan.date_emprunt);
    if (startDate && loanDate < startDate) return false;
    if (endDate && loanDate > endDate) return false;
    return true;
  });
}

function loansToCSV(loans) {
  const headers = ['Document', 'Emprunteur', 'Type', 'Classe/Grade/Lieu', 'Matricule', "Date d'emprunt", 'Date de retour prévue', 'Statut'];
  const rows = loans.map(loan => [
    loan.titre,
    `${loan.nom} ${loan.prenom}`,
    loan.type_utilisateur || '',
    loan.classe_grade_lieu || '',
    loan.matricule || '',
    new Date(loan.date_emprunt).toLocaleDateString(),
    new Date(loan.date_retour_prevue).toLocaleDateString(),
    loan.statut
  ]);

  const csvContent = [headers, ...rows].map(e => e.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
  return csvContent;
}

function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function printLoans(loans) {
  const printWindow = window.open('', '', 'width=900,height=600');
  const style = `
    <style>
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
      h2 { text-align: center; }
    </style>
  `;
  const headers = ['Document', 'Emprunteur', 'Type', 'Classe/Grade/Lieu', 'Matricule', "Date d'emprunt", 'Date de retour prévue', 'Statut'];
  const rows = loans.map(loan => `
    <tr>
      <td>${loan.titre}</td>
      <td>${loan.nom} ${loan.prenom}</td>
      <td>${loan.type_utilisateur || ''}</td>
      <td>${loan.classe_grade_lieu || ''}</td>
      <td>${loan.matricule || ''}</td>
      <td>${new Date(loan.date_emprunt).toLocaleDateString()}</td>
      <td>${new Date(loan.date_retour_prevue).toLocaleDateString()}</td>
      <td>${loan.statut}</td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Impression des emprunts</title>
        ${style}
      </head>
      <body>
        <h2>Emprunts de la période sélectionnée</h2>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}

async function returnLoan(id) {
  if (!confirm('Confirmer le retour du document ?')) return;
  try {
    await fetchJSON(`/api/emprunts/${id}/retour`, { method: 'PUT' });
    addNotification('Retour enregistré avec succès', 'success');
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

let isSubmittingLoanForm = false;

loanForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (isSubmittingLoanForm) return;
  isSubmittingLoanForm = true;
  const formData = new FormData(loanForm);
  const data = Object.fromEntries(formData.entries());

  try {
    await fetchJSON('/api/emprunts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    addNotification('Emprunt créé avec succès', 'success');
    closeModal('loanModal');
    loadLoans();
    const { loadDocuments } = await import('./documents.js');
    loadDocuments();
  } catch (error) {
    // error handled in fetchJSON
  } finally {
    isSubmittingLoanForm = false;
  }
});

export { loadLoans };

if (exportLoansBtn && printLoansBtn && startDateInput && endDateInput) {
  exportLoansBtn.addEventListener('click', () => {
    const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
    const endDate = endDateInput.value ? new Date(endDateInput.value) : null;
    const filteredLoans = filterLoansByDate(allLoans, startDate, endDate);
    if (filteredLoans.length === 0) {
-      showToast('Aucun emprunt trouvé pour la période sélectionnée.', 'info');
+      addNotification('Aucun emprunt trouvé pour la période sélectionnée.', 'info');
      return;
    }
    const csvContent = loansToCSV(filteredLoans);
    downloadCSV(csvContent, 'emprunts_export.csv');
  });

  printLoansBtn.addEventListener('click', () => {
    const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
    const endDate = endDateInput.value ? new Date(endDateInput.value) : null;
    const filteredLoans = filterLoansByDate(allLoans, startDate, endDate);
    if (filteredLoans.length === 0) {
-      showToast('Aucun emprunt trouvé pour la période sélectionnée.', 'info');
+      addNotification('Aucun emprunt trouvé pour la période sélectionnée.', 'info');
      return;
    }
    printLoans(filteredLoans);
  });
}
