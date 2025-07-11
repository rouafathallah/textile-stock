const express = require('express');
const router = express.Router();
const Echantillon = require('../models/echantillon');
const Article = require('../models/article');
const Casier=require('../models/casier');
const QRCode = require('qrcode');

//generer un code qr pour les echantillons 
router.post('/add', async (req, res) => {
  try {
    const { nom, code_article } = req.body;

    if (!nom || !code_article) {
      return res.status(400).json({ message: 'nom et code_article requis' });
    }

    const article = await Article.findOne({ code_article });
    if (!article) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }

    // Vérifier si un échantillon avec ce nom et cet article existe déjà
    const existing = await Echantillon.findOne({ nom, article: article._id });
    if (existing) {
      return res.status(409).json({
        message: 'Échantillon déjà existant pour cet article',
        echantillon: existing
      });
    }

    // Sinon, générer le QR code et enregistrer
    const qrText = `${nom}-${Date.now()}`;
    const qrCodeImage = await QRCode.toDataURL(qrText);

    const echantillon = new Echantillon({
      nom,
      article: article._id,
      qrCode: qrCodeImage
    });

    await echantillon.save();

    res.status(201).json({
      message: 'Échantillon créé avec succès',
      echantillon
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

//stocker les echantillons
router.post('/stockage', async (req, res) => {
  try {
    const { qrCode, quantite, code_casier } = req.body;

    if (!qrCode || !quantite || !code_casier) {
      return res.status(400).json({ message: 'qrCode, quantite et code_casier sont requis' });
    }

    const echantillon = await Echantillon.findOne({ qrCode });
    if (!echantillon) {
      return res.status(404).json({ message: 'Échantillon introuvable via QR code' });
    }

    const casier = await Casier.findOne({ code_unique: code_casier });
    if (!casier) {
      return res.status(404).json({ message: 'Casier non trouvé avec ce code' });
    }

    // Chercher si l’échantillon est déjà dans ce casier
    const index = casier.contenus.findIndex(item =>
      item.echantillon.toString() === echantillon._id.toString()
    );

    if (index !== -1) {
      // Échantillon déjà présent → incrémenter la quantité
      casier.contenus[index].quantite += quantite;
    } else {
      // Sinon → ajouter un nouveau contenu
      casier.contenus.push({
        echantillon: echantillon._id,
        quantite
      });
    }

    await casier.save();

    res.status(200).json({
      message: 'Échantillon stocké avec succès',
      casier
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});









module.exports = router;