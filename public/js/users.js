import { fetchJSON } from './api.js';
import { showToast } from './notifications.js';
import { openModal, closeModal } from './modals.js';

const usersTable = document.getElementById('usersTable');
const addUserBtn = document.getElementById('addUserBtn');
const userModal = document.getElementById('userModal');
const userForm = document.getElementById('userForm');
const userModalTitle = document.getElementById('userModalTitle');

let editingUserId = null;

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
}

// Use event delegation for edit and delete buttons
usersTable.addEventListener('click', (event) => {
  const editBtn = event.target.closest('.edit-user');
  if (editBtn) {
    const id = editBtn.getAttribute('data-id');
    editUser(id);
    return;
  }
  const deleteBtn = event.target.closest('.delete-user');
  if (deleteBtn) {
    const id = deleteBtn.getAttribute('data-id');
    deleteUser(id);
  }
});

async function editUser(id) {
  try {
    const userData = await fetchJSON(`/api/utilisateurs/${id}`);
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
    updateUserFormFields(userData.type_utilisateur);
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

export { loadUsers };
