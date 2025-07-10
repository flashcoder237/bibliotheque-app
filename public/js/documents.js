import { fetchJSON } from './api.js';
import { showToast } from './notifications.js';
import { openModal, closeModal } from './modals.js';

let editingDocumentId = null;

export async function loadDocuments(page = 1, limit = 10, search = '', categorie = '', statut = '') {
  const categoryFilter = document.getElementById('categoryFilter');
  const statusFilter = document.getElementById('statusFilter');
  const searchInput = document.getElementById('searchInput');
  const documentsTable = document.getElementById('documentsTable');

  const params = new URLSearchParams({ page, limit });
  if (categorie) params.append('categorie', categorie);
  else if (categoryFilter.value) params.append('categorie', categoryFilter.value);
  if (statut) params.append('statut', statut);
  else if (statusFilter.value) params.append('statut', statusFilter.value);
  if (search) params.append('search', search);
  else if (searchInput.value.trim()) params.append('search', searchInput.value.trim());

  const response = await fetchJSON(`/api/documents?${params.toString()}`);
  const docs = response.data;
  const totalPages = response.totalPages;

  documentsTable.innerHTML = '';
  docs.forEach(doc => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${doc.titre}</td>
      <td>${doc.auteur}</td>
      <td>${doc.isbn || ''}</td>
      <td>${doc.categorie_nom || doc.categorie}</td>
      <td>${doc.statut}</td>
      <td>
        <button class="btn btn-sm btn-primary edit-doc" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm btn-danger delete-doc" data-id="${doc.id}"><i class="fas fa-trash"></i></button>
      </td>
    `;
    documentsTable.appendChild(tr);
  });

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

  renderPagination(totalPages, page, loadDocuments);
}

function renderPagination(totalPages, currentPage, onPageChange) {
  const paginationContainer = document.getElementById('documentsPagination');
  paginationContainer.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = 'btn btn-sm ' + (i === currentPage ? 'btn-primary' : 'btn-secondary');
    btn.addEventListener('click', () => onPageChange(i));
    paginationContainer.appendChild(btn);
  }
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
    const documentModalTitle = document.getElementById('documentModalTitle');
    const documentForm = document.getElementById('documentForm');
    documentModalTitle.textContent = 'Modifier le document';
    documentForm.titre.value = documentData.titre;
    documentForm.auteur.value = documentData.auteur;
    documentForm.isbn.value = documentData.isbn || '';
    documentForm.categorie_id.value = documentData.categorie_id;
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

export function initDocuments() {
  const documentForm = document.getElementById('documentForm');
  const addDocumentBtn = document.getElementById('addDocumentBtn');
  const categoryFilter = document.getElementById('categoryFilter');
  const statusFilter = document.getElementById('statusFilter');
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');

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
    const documentModalTitle = document.getElementById('documentModalTitle');
    documentModalTitle.textContent = 'Ajouter un document';
    documentForm.reset();
    openModal('documentModal');
  });

  categoryFilter.addEventListener('change', () => loadDocuments(1, 10));
  statusFilter.addEventListener('change', () => loadDocuments(1, 10));
  searchBtn.addEventListener('click', () => loadDocuments(1, 10));
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') loadDocuments(1, 10);
  });

  loadDocuments();
}
