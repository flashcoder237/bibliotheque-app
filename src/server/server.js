const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Configuration middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// Initialisation de la base de données
const dbPath = path.join(__dirname, '../../database/bibliotheque.db');
const dbDir = path.dirname(dbPath);

// Créer le dossier database s'il n'existe pas
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur lors de l\'ouverture de la base de données:', err);
  } else {
    console.log('Base de données SQLite connectée');
    initializeDatabase();
  }
});

// Initialiser les tables
function initializeDatabase() {
  const queries = [
    // Table des documents
    `CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titre TEXT NOT NULL,
      auteur TEXT NOT NULL,
      isbn TEXT UNIQUE,
      categorie TEXT NOT NULL,
      localisation TEXT,
      statut TEXT DEFAULT 'disponible',
      date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP,
      description TEXT,
      editeur TEXT,
      annee_publication INTEGER
    )`,
    
    // Table des utilisateurs
    `CREATE TABLE IF NOT EXISTS utilisateurs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      telephone TEXT,
      adresse TEXT,
      type_utilisateur TEXT DEFAULT 'lecteur',
      date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
      statut TEXT DEFAULT 'actif'
    )`,
    
    // Table des emprunts
    `CREATE TABLE IF NOT EXISTS emprunts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      utilisateur_id INTEGER NOT NULL,
      date_emprunt DATETIME DEFAULT CURRENT_TIMESTAMP,
      date_retour_prevue DATETIME NOT NULL,
      date_retour_reelle DATETIME,
      statut TEXT DEFAULT 'en_cours',
      FOREIGN KEY (document_id) REFERENCES documents (id),
      FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id)
    )`,
    
    // Table des réservations
    `CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      utilisateur_id INTEGER NOT NULL,
      date_reservation DATETIME DEFAULT CURRENT_TIMESTAMP,
      statut TEXT DEFAULT 'active',
      FOREIGN KEY (document_id) REFERENCES documents (id),
      FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id)
    )`
  ];

  queries.forEach(query => {
    db.run(query, (err) => {
      if (err) {
        console.error('Erreur lors de la création des tables:', err);
      }
    });
  });

  // Insérer des données d'exemple
  insertSampleData();
}

function insertSampleData() {
  // Vérifier si des données existent déjà
  db.get("SELECT COUNT(*) as count FROM documents", (err, row) => {
    if (row.count === 0) {
      const sampleDocuments = [
        ['Le Petit Prince', 'Antoine de Saint-Exupéry', '9782070408504', 'Fiction', 'Étagère A1'],
        ['1984', 'George Orwell', '9782070368228', 'Fiction', 'Étagère A2'],
        ['Introduction à Python', 'Mark Lutz', '9782100508273', 'Informatique', 'Étagère B1'],
        ['Histoire du Cameroun', 'Engelbert Mveng', '9782869781234', 'Histoire', 'Étagère C1']
      ];

      sampleDocuments.forEach(doc => {
        db.run("INSERT INTO documents (titre, auteur, isbn, categorie, localisation) VALUES (?, ?, ?, ?, ?)", doc);
      });

      // Utilisateur admin par défaut
      db.run("INSERT INTO utilisateurs (nom, prenom, email, type_utilisateur) VALUES (?, ?, ?, ?)", 
        ['Admin', 'Système', 'admin@bibliotheque.com', 'administrateur']);
    }
  });
}

// Routes API

// Route principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Documents
app.get('/api/documents', (req, res) => {
  const { search, categorie, statut } = req.query;
  let query = 'SELECT * FROM documents WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (titre LIKE ? OR auteur LIKE ? OR isbn LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (categorie) {
    query += ' AND categorie = ?';
    params.push(categorie);
  }

  if (statut) {
    query += ' AND statut = ?';
    params.push(statut);
  }

  query += ' ORDER BY titre';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/documents', (req, res) => {
  const { titre, auteur, isbn, categorie, localisation, description, editeur, annee_publication } = req.body;
  
  db.run(
    'INSERT INTO documents (titre, auteur, isbn, categorie, localisation, description, editeur, annee_publication) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [titre, auteur, isbn, categorie, localisation, description, editeur, annee_publication],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: this.lastID, message: 'Document ajouté avec succès' });
      }
    }
  );
});

app.put('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const { titre, auteur, isbn, categorie, localisation, statut, description, editeur, annee_publication } = req.body;
  
  db.run(
    'UPDATE documents SET titre=?, auteur=?, isbn=?, categorie=?, localisation=?, statut=?, description=?, editeur=?, annee_publication=? WHERE id=?',
    [titre, auteur, isbn, categorie, localisation, statut, description, editeur, annee_publication, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ message: 'Document mis à jour avec succès' });
      }
    }
  );
});

app.delete('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM documents WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Document supprimé avec succès' });
    }
  });
});

// Utilisateurs
app.get('/api/utilisateurs', (req, res) => {
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

// Get single user by ID
app.get('/api/utilisateurs/:id', (req, res) => {
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

// Update user by ID
app.put('/api/utilisateurs/:id', (req, res) => {
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

// Delete user by ID
app.delete('/api/utilisateurs/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM utilisateurs WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Utilisateur supprimé avec succès' });
    }
  });
});


app.post('/api/utilisateurs', (req, res) => {
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

// Emprunts
app.get('/api/emprunts', (req, res) => {
  const query = `
    SELECT e.*, d.titre, d.auteur, u.nom, u.prenom, u.email
    FROM emprunts e
    JOIN documents d ON e.document_id = d.id
    JOIN utilisateurs u ON e.utilisateur_id = u.id
    ORDER BY e.date_emprunt DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/emprunts', (req, res) => {
  const { document_id, utilisateur_id, duree_jours = 14 } = req.body;
  
  // Calculer la date de retour prévue
  const dateRetourPrevue = new Date();
  dateRetourPrevue.setDate(dateRetourPrevue.getDate() + duree_jours);
  
  db.run(
    'INSERT INTO emprunts (document_id, utilisateur_id, date_retour_prevue) VALUES (?, ?, ?)',
    [document_id, utilisateur_id, dateRetourPrevue.toISOString()],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        // Mettre à jour le statut du document
        db.run('UPDATE documents SET statut = "emprunte" WHERE id = ?', [document_id]);
        res.json({ id: this.lastID, message: 'Emprunt enregistré avec succès' });
      }
    }
  );
});

app.put('/api/emprunts/:id/retour', (req, res) => {
  const { id } = req.params;
  
  db.run(
    'UPDATE emprunts SET date_retour_reelle = CURRENT_TIMESTAMP, statut = "termine" WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        // Récupérer l'ID du document pour mettre à jour son statut
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

// Statistiques
app.get('/api/stats', (req, res) => {
  const stats = {};
  
  db.get('SELECT COUNT(*) as total FROM documents', (err, row) => {
    stats.totalDocuments = row.total;
    
    db.get('SELECT COUNT(*) as total FROM utilisateurs', (err, row) => {
      stats.totalUtilisateurs = row.total;
      
      db.get('SELECT COUNT(*) as total FROM emprunts WHERE statut = "en_cours"', (err, row) => {
        stats.empruntsEnCours = row.total;
        
        db.get('SELECT COUNT(*) as total FROM documents WHERE statut = "disponible"', (err, row) => {
          stats.documentsDisponibles = row.total;
          res.json(stats);
        });
      });
    });
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

// Fermer la base de données proprement
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Erreur lors de la fermeture de la base de données:', err);
    } else {
      console.log('Base de données fermée');
    }
    process.exit(0);
  });
});
