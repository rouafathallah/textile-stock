const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Routes
const userRoutes = require('./routes/user');
const articleRoutes = require('./routes/article');
const casierRoutes = require('./routes/casier');
const echantillonRoutes = require('./routes/echantillon');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/textile_db')
.then(() => console.log('✅ Connecté à MongoDB'))
.catch(err => console.error('❌ Erreur de connexion MongoDB :', err));

// API Routes
app.use('/user', userRoutes);
app.use('/articles', articleRoutes);
app.use('/casiers', casierRoutes);
app.use('/echantillons', echantillonRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur en marche sur le port ${PORT}`);
});
