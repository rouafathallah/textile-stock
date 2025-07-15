const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const articleRoutes = require('./routes/article');
const casierRoutes = require('./routes/casier');
const echantillonRoutes=require('./routes/echantillon');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/textile_db'
)
.then(() => console.log('✅ Connecté à MongoDB'))
.catch(err => console.error('❌ Erreur de connexion MongoDB :', err));

// Use article routes for /articles
app.use('/articles', articleRoutes);

// Use casier routes for /casiers
app.use('/casiers', casierRoutes);

app.use('/echantillons',echantillonRoutes);

// Basic root route
app.get('/', (req, res) => {
  res.send('Bonjour, serveur en marche!');
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Serveur en marche sur le port ${PORT}`);
});

app.use(express.static('public'));
app.use(cors());

