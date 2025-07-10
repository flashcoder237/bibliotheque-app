const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all categories with pagination and filtering
router.get('/', (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  let countQuery = 'SELECT COUNT(*) as total FROM categories WHERE 1=1';
  let dataQuery = 'SELECT * FROM categories WHERE 1=1';

  if (search) {
    countQuery += ' AND (nom LIKE ? OR prefixe LIKE ?)';
    dataQuery += ' AND (nom LIKE ? OR prefixe LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  dataQuery += ' ORDER BY nom LIMIT ? OFFSET ?';
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

// Create a new category
router.post('/', (req, res) => {
  const { nom, prefixe, prochain_numero } = req.body;
  db.run(
    'INSERT INTO categories (nom, prefixe, prochain_numero) VALUES (?, ?, ?)',
    [nom, prefixe, prochain_numero || 1],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: this.lastID, message: 'Catégorie créée avec succès' });
      }
    }
  );
});

// Update a category
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nom, prefixe, prochain_numero } = req.body;
  db.run(
    'UPDATE categories SET nom = ?, prefixe = ?, prochain_numero = ? WHERE id = ?',
    [nom, prefixe, prochain_numero, id],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ message: 'Catégorie mise à jour avec succès' });
      }
    }
  );
});

// Delete a category
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM categories WHERE id = ?', [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Catégorie supprimée avec succès' });
    }
  });
});

module.exports = router;
