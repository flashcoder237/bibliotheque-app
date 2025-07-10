const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', async (req, res) => {
  try {
    const stats = {};
    
    const totalDocuments = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as total FROM documents', (err, row) => {
        if (err) reject(err);
        resolve(row.total);
      });
    });
    stats.totalDocuments = totalDocuments;

    const totalUtilisateurs = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as total FROM utilisateurs', (err, row) => {
        if (err) reject(err);
        resolve(row.total);
      });
    });
    stats.totalUtilisateurs = totalUtilisateurs;

    const empruntsEnCours = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as total FROM emprunts WHERE statut = "en_cours"', (err, row) => {
        if (err) reject(err);
        resolve(row.total);
      });
    });
    stats.empruntsEnCours = empruntsEnCours;

    const documentsDisponibles = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as total FROM documents WHERE statut = "disponible"', (err, row) => {
        if (err) reject(err);
        resolve(row.total);
      });
    });
    stats.documentsDisponibles = documentsDisponibles;

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
