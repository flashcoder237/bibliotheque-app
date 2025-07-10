import { fetchJSON } from './api.js';

export async function loadStats() {
  const totalDocumentsElem = document.getElementById('totalDocuments');
  const totalUsersElem = document.getElementById('totalUsers');
  const activeLoansElem = document.getElementById('activeLoans');
  const availableBooksElem = document.getElementById('availableBooks');
  const detailedStats = document.getElementById('detailedStats');

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

export function initStats() {
  const refreshStatsBtn = document.getElementById('refreshStatsBtn');
  refreshStatsBtn.addEventListener('click', loadStats);
}