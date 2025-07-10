import { openModal, closeModal, initModals } from './modals.js';

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const sections = document.querySelectorAll('.content-section');
  const navItems = document.querySelectorAll('.nav-item');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const notificationBtn = document.getElementById('notificationBtn');
  const notificationBadge = notificationBtn.querySelector('.notification-badge');

  // Document elements
  const documentsTable = document.getElementById('documentsTable');
  const addDocumentBtn = document.getElementById('addDocumentBtn');
  const documentModal = document.getElementById('documentModal');
  const documentForm = document.getElementById('documentForm');
  const documentModalTitle = document.getElementById('documentModalTitle');
  const categoryFilter = document.getElementById('categoryFilter');
  const statusFilter = document.getElementById('statusFilter');

  // User elements
  const usersTable = document.getElementById('usersTable');
  const addUserBtn = document.getElementById('addUserBtn');
  const userModal = document.getElementById('userModal');
  const userForm = document.getElementById('userForm');
  const userModalTitle = document.getElementById('userModalTitle');

  // Loan elements
  const loansTable = document.getElementById('loansTable');
  const addLoanBtn = document.getElementById('addLoanBtn');
  const loanModal = document.getElementById('loanModal');
  const loanForm = document.getElementById('loanForm');
  const loanDocumentSelect = document.getElementById('loanDocument');
  const loanUserSelect = document.getElementById('loanUser');

  // Stats elements
  const totalDocumentsElem = document.getElementById('totalDocuments');
  const totalUsersElem = document.getElementById('totalUsers');
  const activeLoansElem = document.getElementById('activeLoans');
  const availableBooksElem = document.getElementById('availableBooks');
  const refreshStatsBtn = document.getElementById('refreshStatsBtn');
  const detailedStats = document.getElementById('detailedStats');

  // Navigation
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const section = item.getAttribute('data-section');
      showSection(section);
    });
  });

  function showSection(sectionId) {
    sections.forEach(section => {
      if (section.id === sectionId) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });
  }

  // Modal helpers

  // Toast notifications
  const toastContainer = document.getElementById('toastContainer');
  function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, duration);
  }

  // Fetch API helpers
  async function fetchJSON(url, options = {}) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur serveur');
      }
      return await res.json();
    } catch (error) {
      showToast(error.message, 'error');
      throw error;
    }
  }

  // Documents management
  let editingDocumentId = null;

  async function loadDocuments() {
    const params = new URLSearchParams();
    if (categoryFilter.value) params.append('categorie', categoryFilter.value);
    if (statusFilter.value) params.append('statut', statusFilter.value);
    if (searchInput.value.trim()) params.append('search', searchInput.value.trim());

    const docs = await fetchJSON(`/api/documents?${params.toString()}`);
    documentsTable.innerHTML = '';
    docs.forEach(doc => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${doc.titre}</td>
        <td>${doc.auteur}</td>
        <td>${doc.isbn || ''}</td>
        <td>${doc.categorie}</td>
        <td>${doc.statut}</td>
        <td>
          <button class="btn btn-sm btn-primary edit-doc" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-danger delete-doc" data-id="${doc.id}"><i class="fas fa-trash"></i></button>
        </td>
      `;
      documentsTable.appendChild(tr);
    });

    // Attach event listeners for edit and delete buttons
    document.querySelectorAll('.edit-doc').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        editDocument(id);
      });
    });
    document.querySelectorAll('.delete-doc').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        deleteDocument(id);
      });
    });
  }

  async function editDocument(id) {
    try {
      const doc = await fetchJSON(`/api/documents?search=&categorie=&statut=`);
      const documentData = doc.find(d => d.id == id);
      if (!documentData) {
        showToast('Document non trouvé', 'error');
        return;
      }
      editingDocumentId = id;
      documentModalTitle.textContent = 'Modifier le document';
      documentForm.titre.value = documentData.titre;
      documentForm.auteur.value = documentData.auteur;
      documentForm.isbn.value = documentData.isbn || '';
      documentForm.categorie.value = documentData.categorie;
      documentForm.localisation.value = documentData.localisation || '';
      documentForm.description.value = documentData.description || '';
      documentForm.editeur.value = documentData.editeur || '';
      documentForm.annee_publication.value = documentData.annee_publication || '';
      openModal('documentModal');
    } catch (error) {
      // error handled in fetchJSON
    }
  }

  async function deleteDocument(id) {
    if (!confirm('Voulez-vous vraiment supprimer ce document ?')) return;
    try {
      await fetchJSON(`/api/documents/${id}`, { method: 'DELETE' });
      showToast('Document supprimé avec succès', 'success');
      loadDocuments();
    } catch (error) {
      // error handled in fetchJSON
    }
  }

  documentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(documentForm);
    const data = Object.fromEntries(formData.entries());

    try {
      if (editingDocumentId) {
        await fetchJSON(`/api/documents/${editingDocumentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        showToast('Document mis à jour avec succès', 'success');
      } else {
        await fetchJSON('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        showToast('Document ajouté avec succès', 'success');
      }
      closeModal('documentModal');
      editingDocumentId = null;
      documentForm.reset();
      loadDocuments();
    } catch (error) {
      // error handled in fetchJSON
    }
  });

  addDocumentBtn.addEventListener('click', () => {
    editingDocumentId = null;
    documentModalTitle.textContent = 'Ajouter un document';
    documentForm.reset();
    openModal('documentModal');
  });

  categoryFilter.addEventListener('change', loadDocuments);
  statusFilter.addEventListener('change', loadDocuments);
  searchBtn.addEventListener('click', loadDocuments);
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') loadDocuments();
  });

  // Users management
  let editingUserId = null;

  // Show/hide user form fields based on type
  function updateUserFormFields(type) {
    const fieldClasse = document.getElementById('fieldClasse');
    const fieldGrade = document.getElementById('fieldGrade');
    const fieldMatricule = document.getElementById('fieldMatricule');
    const fieldLieu = document.getElementById('fieldLieu');

    fieldClasse.style.display = 'none';
    fieldGrade.style.display = 'none';
    fieldMatricule.style.display = 'none';
    fieldLieu.style.display = 'none';

    if (type === 'etudiant') {
      fieldClasse.style.display = 'block';
      fieldMatricule.style.display = 'block';
    } else if (type === 'personnel') {
      fieldLieu.style.display = 'block';
      fieldMatricule.style.display = 'block';
    } else if (type === 'enseignant') {
      fieldGrade.style.display = 'block';
      fieldMatricule.style.display = 'block';
    }
  }

  const userTypeSelect = document.getElementById('userType');
  userTypeSelect.addEventListener('change', (e) => {
    updateUserFormFields(e.target.value);
  });

  async function loadUsers() {
    const users = await fetchJSON('/api/utilisateurs');
    usersTable.innerHTML = '';
    users.forEach(user => {
      // Determine class/grade/lieu display
      let classGradeLieu = '';
      if (user.type_utilisateur === 'etudiant') {
        classGradeLieu = user.classe || '';
      } else if (user.type_utilisateur === 'personnel') {
        classGradeLieu = user.lieu_affectation || '';
      } else if (user.type_utilisateur === 'enseignant') {
        classGradeLieu = user.grade || '';
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.nom}</td>
        <td>${user.prenom}</td>
        <td>${user.type_utilisateur}</td>
        <td>${classGradeLieu}</td>
        <td>${user.matricule || ''}</td>
        <td>${user.email}</td>
        <td>${new Date(user.date_inscription).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-sm btn-primary edit-user" data-id="${user.id}"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-danger delete-user" data-id="${user.id}"><i class="fas fa-trash"></i></button>
        </td>
      `;
      usersTable.appendChild(tr);
    });

    document.querySelectorAll('.edit-user').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        editUser(id);
      });
    });
    document.querySelectorAll('.delete-user').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        deleteUser(id);
      });
    });
  }

  async function editUser(id) {
    try {
      const users = await fetchJSON('/api/utilisateurs');
      const userData = users.find(u => u.id == id);
      if (!userData) {
        showToast('Utilisateur non trouvé', 'error');
        return;
      }
      editingUserId = id;
      userModalTitle.textContent = 'Modifier un utilisateur';
      userForm.nom.value = userData.nom;
      userForm.prenom.value = userData.prenom;
      userForm.email.value = userData.email;
      userForm.telephone.value = userData.telephone || '';
      userForm.adresse.value = userData.adresse || '';
      userForm.type_utilisateur.value = userData.type_utilisateur || 'lecteur';
      openModal('userModal');
    } catch (error) {
      // error handled in fetchJSON
    }
  }

  async function deleteUser(id) {
    if (!confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;
    try {
      await fetchJSON(`/api/utilisateurs/${id}`, { method: 'DELETE' });
      showToast('Utilisateur supprimé avec succès', 'success');
      loadUsers();
    } catch (error) {
      // error handled in fetchJSON
    }
  }

  userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(userForm);
    const data = Object.fromEntries(formData.entries());

    try {
      if (editingUserId) {
        await fetchJSON(`/api/utilisateurs/${editingUserId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        showToast('Utilisateur mis à jour avec succès', 'success');
      } else {
        await fetchJSON('/api/utilisateurs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        showToast('Utilisateur ajouté avec succès', 'success');
      }
      closeModal('userModal');
      editingUserId = null;
      userForm.reset();
      loadUsers();
    } catch (error) {
      // error handled in fetchJSON
    }
  });

  addUserBtn.addEventListener('click', () => {
    editingUserId = null;
    userModalTitle.textContent = 'Ajouter un utilisateur';
    userForm.reset();
    openModal('userModal');
  });

  // Loans management
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
      loadDocuments();
    } catch (error) {
      // error handled in fetchJSON
    }
  }

  addLoanBtn.addEventListener('click', async () => {
    // Load documents and users for selection
    const docs = await fetchJSON('/api/documents?statut=disponible');
    loanDocumentSelect.innerHTML = '<option value="">Sélectionnez un document</option>';
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
      loadDocuments();
    } catch (error) {
      // error handled in fetchJSON
    }
  });

  // Stats management
  async function loadStats() {
    const stats = await fetchJSON('/api/stats');
    totalDocumentsElem.textContent = stats.totalDocuments;
    totalUsersElem.textContent = stats.totalUtilisateurs;
    activeLoansElem.textContent = stats.empruntsEnCours;
    availableBooksElem.textContent = stats.documentsDisponibles;

    // Detailed stats placeholder
    detailedStats.innerHTML = `
      <p>Total documents: ${stats.totalDocuments}</p>
      <p>Total users: ${stats.totalUtilisateurs}</p>
      <p>Active loans: ${stats.empruntsEnCours}</p>
      <p>Available books: ${stats.documentsDisponibles}</p>
    `;
  }

  refreshStatsBtn.addEventListener('click', loadStats);

  // Initial load
  loadDocuments();
  loadUsers();
  loadLoans();
  loadStats();

 

  // Initialize modal event listeners
  initModals();

  // Add event listeners to "Annuler" buttons to close modals
  const cancelButtons = document.querySelectorAll('.modal .btn-secondary');
  cancelButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal');
      if (modal) {
        modal.classList.remove('active');
      }
    });
  });
});
