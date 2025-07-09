import { fetchJSON } from './api.js';

const totalDocumentsElem = document.getElementById('totalDocuments');
const totalUsersElem = document.getElementById('totalUsers');
const activeLoansElem = document.getElementById('activeLoans');
const availableBooksElem = document.getElementById('availableBooks');
const refreshStatsBtn = document.getElementById('refreshStatsBtn');
const detailedStats = document.getElementById('detailedStats');

async function loadStats() {
  const stats = await fetchJSON('/api/stats');
  totalDocumentsElem.textContent = stats.totalDocuments;
  totalUsersElem.textContent = stats.totalUtilisateurs;
  activeLoansElem.textContent = stats.empruntsEnCours;
  availableBooksElem.textContent = stats.documentsDisponibles;

  detailedStats.innerHTML = `
    <p>Total documents: ${stats.totalDocuments}</p>
    <p>Total users: ${stats.totalUtilisateurs}</p>
    <p>Active loans: ${stats.empruntsEnCours}</p>
    <p>Available books: ${stats.documentsDisponibles}</p>
  `;
}

refreshStatsBtn.addEventListener('click', loadStats);

export { loadStats };
