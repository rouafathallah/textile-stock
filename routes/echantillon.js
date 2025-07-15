const express = require('express');
const router = express.Router();
const Echantillon = require('../models/echantillon');
const Article = require('../models/article');
const Casier = require('../models/casier');

// ✅ POST /echantillons/from-article : créer un échantillon depuis un QRCode d'article
router.post('/from-article', async (req, res) => {
  try {
    const { qrText, quantite, code_unique } = req.body;

    if (!qrText || !quantite || !code_unique) {
      return res.status(400).json({ message: 'qrText, quantite, et code_unique requis' });
    }

    // ✅ Rechercher l'article correspondant au qrCodeText
    const article = await Article.findOne({ qrCodeText: qrText });
    if (!article) {
      return res.status(404).json({ message: `❌ Article introuvable pour le QR code : ${qrText}` });
    }

    const quantiteNumber = parseInt(quantite, 10);
    if (isNaN(quantiteNumber) || quantiteNumber <= 0) {
      return res.status(400).json({ message: '❌ Quantité invalide' });
    }

    // ✅ Rechercher le casier via code_unique
    const casier = await Casier.findOne({ code_unique });
    if (!casier) {
      return res.status(404).json({ message: '❌ Casier non trouvé' });
    }

    // ✅ Vérifier la capacité du casier
    const total = casier.contenus.reduce((acc, c) => acc + c.quantite, 0);
    if (total + quantiteNumber > 30) {
      return res.status(400).json({ message: '❌ Capacité maximale du casier atteinte' });
    }

    // ✅ Créer un nouvel échantillon lié à l’article
    const echantillon = new Echantillon({
      nom: article.libelle,
      article: article._id,
      qrCode: article.qrCode // ← copier l'image QR dans l’échantillon (optionnel mais utile)
    });

    await echantillon.save();

    // ✅ Ajouter l’échantillon dans le casier
    casier.contenus.push({
      echantillon: echantillon._id,
      quantite: quantiteNumber
    });

    await casier.save();

    res.status(201).json({
      message: '✅ Échantillon créé et stocké avec succès',
      echantillon,
      casier: casier.code_unique
    });

  } catch (err) {
    console.error('Erreur stockage:', err);
    res.status(500).json({ message: '❌ Erreur serveur', error: err.message });
  }
});

module.exports = router;
