import { fetchJSON } from './api.js';
import { showToast } from './notifications.js';
import { openModal, closeModal } from './modals.js';

let editingCategoryId = null;

export async function loadCategories(page = 1, limit = 10, search = '') {
  const categoriesTable = document.getElementById('categoriesTable');
  const params = new URLSearchParams({ page, limit });
  if (search) params.append('search', search);
  const response = await fetchJSON(`/api/categories?${params.toString()}`);
  const categories = response.data;
  const totalPages = response.totalPages;
  categoriesTable.innerHTML = '';
  categories.forEach(cat => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${cat.nom}</td>
      <td>${cat.numero_debut}</td>
      <td>${cat.numero_fin}</td>
      <td>
        <button class="btn btn-sm btn-primary edit-cat" data-id="${cat.id}"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm btn-danger delete-cat" data-id="${cat.id}"><i class="fas fa-trash"></i></button>
      </td>
    `;
    categoriesTable.appendChild(tr);
  });

  document.querySelectorAll('.edit-cat').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      editCategory(id);
    });
  });
  document.querySelectorAll('.delete-cat').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      deleteCategory(id);
    });
  });

  renderPagination(totalPages, page, loadCategories);
}

function renderPagination(totalPages, currentPage, onPageChange) {
  const paginationContainer = document.getElementById('categoriesPagination');
  paginationContainer.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = 'btn btn-sm ' + (i === currentPage ? 'btn-primary' : 'btn-secondary');
    btn.addEventListener('click', () => onPageChange(i));
    paginationContainer.appendChild(btn);
  }
}

async function editCategory(id) {
  try {
    const categories = await fetchJSON('/api/categories');
    const categoryData = categories.find(c => c.id == id);
    if (!categoryData) {
      showToast('Catégorie non trouvée', 'error');
      return;
    }
    editingCategoryId = id;
    const categoryModalTitle = document.getElementById('categoryModalTitle');
    const categoryForm = document.getElementById('categoryForm');
    categoryModalTitle.textContent = 'Modifier la catégorie';
    categoryForm.nom.value = categoryData.nom;
    // Removed prefixe field as per user request
    categoryForm.numero_debut.value = categoryData.numero_debut;
    categoryForm.numero_fin.value = categoryData.numero_fin;
    openModal('categoryModal');
  } catch (error) {
    // error handled in fetchJSON
  }
}

async function deleteCategory(id) {
  if (!confirm('Voulez-vous vraiment supprimer cette catégorie ?')) return;
  try {
    await fetchJSON(`/api/categories/${id}`, { method: 'DELETE' });
    showToast('Catégorie supprimée avec succès', 'success');
    loadCategories();
  } catch (error) {
    // error handled in fetchJSON
  }
}

export function initCategories() {
  const categoryForm = document.getElementById('categoryForm');
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  const searchInput = document.getElementById('categorySearchInput');

  categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(categoryForm);
    const data = Object.fromEntries(formData.entries());

    // Remove prefixe from data before sending to backend
    delete data.prefixe;

    try {
      if (editingCategoryId) {
        await fetchJSON(`/api/categories/${editingCategoryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        showToast('Catégorie mise à jour avec succès', 'success');
      } else {
        await fetchJSON('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        showToast('Catégorie créée avec succès', 'success');
      }
      closeModal('categoryModal');
      editingCategoryId = null;
      categoryForm.reset();
      loadCategories();
    } catch (error) {
      // error handled in fetchJSON
    }
  });

  addCategoryBtn.addEventListener('click', () => {
    editingCategoryId = null;
    const categoryModalTitle = document.getElementById('categoryModalTitle');
    categoryModalTitle.textContent = 'Ajouter une catégorie';
    categoryForm.reset();
    openModal('categoryModal');
  });

  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      loadCategories(1, 10, searchInput.value.trim());
    }
  });

  loadCategories();
}
