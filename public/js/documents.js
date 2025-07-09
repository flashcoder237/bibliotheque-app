import { fetchJSON } from './api.js';
import { showToast } from './notifications.js';
import { openModal, closeModal } from './modals.js';

const documentsTable = document.getElementById('documentsTable');
const addDocumentBtn = document.getElementById('addDocumentBtn');
const documentModal = document.getElementById('documentModal');
const documentForm = document.getElementById('documentForm');
const documentModalTitle = document.getElementById('documentModalTitle');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

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

export { loadDocuments };
