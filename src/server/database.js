const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../database/bibliotheque.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur lors de l\'ouverture de la base de donnees:', err);
  } else {
    console.log('Base de données SQLite connectée');
    initializeDatabase();
  }
});

function initializeDatabase() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL UNIQUE,
      prefixe TEXT,
      numero_debut INTEGER NOT NULL,
      numero_fin INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference TEXT UNIQUE,
      titre TEXT NOT NULL,
      auteur TEXT NOT NULL,
      isbn TEXT UNIQUE,
      categorie_id INTEGER,
      localisation TEXT,
      statut TEXT DEFAULT 'disponible',
      date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP,
      description TEXT,
      editeur TEXT,
      annee_publication INTEGER,
      FOREIGN KEY (categorie_id) REFERENCES categories (id)
    )`,
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

  db.serialize(() => {
    queries.forEach(query => {
      db.run(query, (err) => {
        if (err) {
          console.error('Erreur lors de la création des tables:', err);
        }
      });
    });

    insertSampleData();
  });
}

function insertSampleData() {
  db.get("SELECT COUNT(*) as count FROM categories", (err, row) => {
    if (row.count === 0) {
      const categories = [
        { name: 'Fiction', prefixe: 'FIC', start: 1000, end: 1999 },
        { name: 'Informatique', prefixe: 'INF', start: 2000, end: 2999 },
        { name: 'Histoire', prefixe: 'HIS', start: 3000, end: 3999 }
      ];

      const stmt = db.prepare("INSERT INTO categories (nom, prefixe, numero_debut, numero_fin) VALUES (?, ?, ?, ?)");
      categories.forEach(c => stmt.run(c.name, c.prefixe, c.start, c.end));
      stmt.finalize(err => {
        if (!err) {
          insertSampleDocuments();
        }
      });
    } else {
      insertSampleDocuments();
    }
  });
}

function insertSampleDocuments() {
  db.get("SELECT COUNT(*) as count FROM documents", (err, row) => {
    if (row.count === 0) {
      db.all("SELECT id, nom FROM categories", [], (err, categories) => {
        if (err) return;
        const categoryMap = categories.reduce((acc, cat) => ({ ...acc, [cat.nom]: cat.id }), {});

        const sampleDocuments = [
          ['Le Petit Prince', 'Antoine de Saint-Exupéry', '9782070408504', categoryMap['Fiction'], 'Étagère A1'],
          ['1984', 'George Orwell', '9782070368228', categoryMap['Fiction'], 'Étagère A2'],
          ['Introduction à Python', 'Mark Lutz', '9782100508273', categoryMap['Informatique'], 'Étagère B1'],
          ['Histoire du Cameroun', 'Engelbert Mveng', '9782869781234', categoryMap['Histoire'], 'Étagère C1']
        ];

        const stmt = db.prepare("INSERT INTO documents (titre, auteur, isbn, categorie_id, localisation) VALUES (?, ?, ?, ?, ?)");
        sampleDocuments.forEach(doc => stmt.run(doc));
        stmt.finalize();
      });
    }
  });

  db.get("SELECT COUNT(*) as count FROM utilisateurs", (err, row) => {
    if (row.count === 0) {
      db.run("INSERT INTO utilisateurs (nom, prenom, email, type_utilisateur) VALUES (?, ?, ?, ?)",
        ['Admin', 'Système', 'admin@bibliotheque.com', 'administrateur']);
    }
  });
}

module.exports = db;
