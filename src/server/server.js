const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const documentsRouter = require('./routes/documents');
const utilisateursRouter = require('./routes/utilisateurs');
const empruntsRouter = require('./routes/emprunts');
const statsRouter = require('./routes/stats');
const categoriesRouter = require('./routes/categories');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

app.use('/api/documents', documentsRouter);
app.use('/api/utilisateurs', utilisateursRouter);
app.use('/api/emprunts', empruntsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/categories', categoriesRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

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