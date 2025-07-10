import { initModals } from './modals.js';
import { initNavigation } from './navigation.js';
import { initDocuments, loadDocuments } from './documents.js';
import { initUsers, loadUsers } from './users.js';
import { initLoans, loadLoans } from './loans.js';
import { initStats, loadStats } from './stats.js';
import { initCategories, loadCategories } from './categories.js';

document.addEventListener('DOMContentLoaded', () => {
  initModals();
  initNavigation();
  initDocuments();
  initUsers();
  initLoans();
  initStats();
  initCategories();

  loadDocuments();
  loadUsers();
  loadLoans();
  loadStats();
  loadCategories();

  window.electronAPI.onNavigate((page) => {
    const navItem = document.querySelector(`.nav-item[data-section="${page}"]`);
    if (navItem) {
      navItem.click();
    }
  });

  window.electronAPI.onNewDocument(() => {
    const addDocumentBtn = document.getElementById('addDocumentBtn');
    addDocumentBtn.click();
  });

  window.electronAPI.onSearchFocus(() => {
    const searchInput = document.getElementById('searchInput');
    searchInput.focus();
  });

  window.electronAPI.onShowAbout(() => {
    // You can implement a proper about modal here
    alert(`Bibliothèque App v${app.getVersion()}`);
  });
});
