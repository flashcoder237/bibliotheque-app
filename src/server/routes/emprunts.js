const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { page = 1, limit = 10, search = '', statut = '' } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  let countQuery = `
    SELECT COUNT(*) as total
    FROM emprunts e
    JOIN documents d ON e.document_id = d.id
    JOIN utilisateurs u ON e.utilisateur_id = u.id
    WHERE 1=1
  `;
  let dataQuery = `
    SELECT e.*, d.titre, d.auteur, u.nom, u.prenom, u.email
    FROM emprunts e
    JOIN documents d ON e.document_id = d.id
    JOIN utilisateurs u ON e.utilisateur_id = u.id
    WHERE 1=1
  `;

  if (search) {
    countQuery += ' AND (d.titre LIKE ? OR d.auteur LIKE ? OR u.nom LIKE ? OR u.prenom LIKE ?)';
    dataQuery += ' AND (d.titre LIKE ? OR d.auteur LIKE ? OR u.nom LIKE ? OR u.prenom LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (statut) {
    countQuery += ' AND e.statut = ?';
    dataQuery += ' AND e.statut = ?';
    params.push(statut);
  }

  dataQuery += ' ORDER BY e.date_emprunt DESC LIMIT ? OFFSET ?';
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

router.post('/', (req, res) => {
  const { document_id, utilisateur_id, duree_jours = 14 } = req.body;
  
  const dateRetourPrevue = new Date();
  dateRetourPrevue.setDate(dateRetourPrevue.getDate() + duree_jours);
  
  db.run(
    'INSERT INTO emprunts (document_id, utilisateur_id, date_retour_prevue) VALUES (?, ?, ?)',
    [document_id, utilisateur_id, dateRetourPrevue.toISOString()],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        db.run('UPDATE documents SET statut = "emprunte" WHERE id = ?', [document_id]);
        res.json({ id: this.lastID, message: 'Emprunt enregistré avec succès' });
      }
    }
  );
});

router.put('/:id/retour', (req, res) => {
  const { id } = req.params;
  
  db.run(
    'UPDATE emprunts SET date_retour_reelle = CURRENT_TIMESTAMP, statut = "termine" WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        db.get('SELECT document_id FROM emprunts WHERE id = ?', [id], (err, row) => {
          if (row) {
            db.run('UPDATE documents SET statut = "disponible" WHERE id = ?', [row.document_id]);
          }
        });
        res.json({ message: 'Retour enregistré avec succès' });
      }
    }
  );
});

module.exports = router;
