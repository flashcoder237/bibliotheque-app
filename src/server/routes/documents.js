const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { page = 1, limit = 10, search = '', categorie = '', statut = '' } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  let countQuery = 'SELECT COUNT(*) as total FROM documents d LEFT JOIN categories c ON d.categorie_id = c.id WHERE 1=1';
  let dataQuery = 'SELECT d.*, c.nom as categorie_nom FROM documents d LEFT JOIN categories c ON d.categorie_id = c.id WHERE 1=1';

  if (search) {
    countQuery += ' AND (d.titre LIKE ? OR d.auteur LIKE ? OR d.isbn LIKE ? OR d.reference LIKE ?)';
    dataQuery += ' AND (d.titre LIKE ? OR d.auteur LIKE ? OR d.isbn LIKE ? OR d.reference LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (categorie) {
    countQuery += ' AND c.nom = ?';
    dataQuery += ' AND c.nom = ?';
    params.push(categorie);
  }

  if (statut) {
    countQuery += ' AND d.statut = ?';
    dataQuery += ' AND d.statut = ?';
    params.push(statut);
  }

  dataQuery += ' ORDER BY d.titre LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.get(countQuery, params.slice(0, params.length - 2), (err, countResult) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    db.all(dataQuery, params, (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({
          data: rows,
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        });
      }
    });
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM documents WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ error: 'Document non trouvé' });
    } else {
      res.json(row);
    }
  });
});

router.post('/', (req, res) => {
  const { titre, auteur, isbn, categorie_id, localisation, description, editeur, annee_publication } = req.body;

  db.get('SELECT * FROM categories WHERE id = ?', [categorie_id], (err, categorie) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!categorie) {
      return res.status(400).json({ error: 'Catégorie non valide' });
    }

    const reference = `${categorie.prefixe}-${String(categorie.prochain_numero).padStart(3, '0')}`;

    db.run(
      'INSERT INTO documents (reference, titre, auteur, isbn, categorie_id, localisation, description, editeur, annee_publication) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [reference, titre, auteur, isbn, categorie_id, localisation, description, editeur, annee_publication],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        db.run('UPDATE categories SET prochain_numero = ? WHERE id = ?', [categorie.prochain_numero + 1, categorie_id]);
        res.json({ id: this.lastID, message: 'Document ajouté avec succès' });
      }
    );
  });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { titre, auteur, isbn, categorie_id, localisation, statut, description, editeur, annee_publication } = req.body;
  
  db.run(
    'UPDATE documents SET titre=?, auteur=?, isbn=?, categorie_id=?, localisation=?, statut=?, description=?, editeur=?, annee_publication=? WHERE id=?',
    [titre, auteur, isbn, categorie_id, localisation, statut, description, editeur, annee_publication, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ message: 'Document mis à jour avec succès' });
      }
    }
  );
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM documents WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Document supprimé avec succès' });
    }
  });
});

module.exports = router;
