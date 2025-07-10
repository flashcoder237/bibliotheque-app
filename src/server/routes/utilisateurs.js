const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { search, type } = req.query;
  let query = 'SELECT * FROM utilisateurs WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (type) {
    query += ' AND type_utilisateur = ?';
    params.push(type);
  }

  query += ' ORDER BY nom, prenom';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM utilisateurs WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
    } else {
      res.json(row);
    }
  });
});

router.post('/', (req, res) => {
  const { nom, prenom, email, telephone, adresse, type_utilisateur } = req.body;
  
  db.run(
    'INSERT INTO utilisateurs (nom, prenom, email, telephone, adresse, type_utilisateur) VALUES (?, ?, ?, ?, ?, ?)',
    [nom, prenom, email, telephone, adresse, type_utilisateur],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: this.lastID, message: 'Utilisateur ajouté avec succès' });
      }
    }
  );
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nom, prenom, email, telephone, adresse, type_utilisateur, classe, grade, matricule, lieu_affectation, statut } = req.body;

  db.run(
    `UPDATE utilisateurs SET 
      nom = ?, prenom = ?, email = ?, telephone = ?, adresse = ?, 
      type_utilisateur = ?, classe = ?, grade = ?, matricule = ?, lieu_affectation = ?, statut = ?
      WHERE id = ?`,
    [nom, prenom, email, telephone, adresse, type_utilisateur, classe, grade, matricule, lieu_affectation, statut, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ message: 'Utilisateur mis à jour avec succès' });
      }
    }
  );
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM utilisateurs WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Utilisateur supprimé avec succès' });
    }
  });
});

module.exports = router;
