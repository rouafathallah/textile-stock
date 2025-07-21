const express = require('express');
const router = express.Router();
const Echantillon = require('../models/echantillon');
const Article = require('../models/article');
const Casier = require('../models/casier');


// ✅ POST /stock : Stocker un échantillon
router.post('/stock', async (req, res) => {
  try {
    const { qrText, quantite, code_unique } = req.body;

    if (!qrText || !quantite || !code_unique) {
      return res.status(400).json({ message: 'qrText, quantite et code_unique sont requis.' });
    }

    const quantiteNumber = parseInt(quantite, 10);
    if (isNaN(quantiteNumber) || quantiteNumber <= 0) {
      return res.status(400).json({ message: 'Quantité invalide.' });
    }

    // Trouver l'article lié au QR code
    const article = await Article.findOne({ qrCodeText: qrText });
    if (!article) {
      return res.status(404).json({ message: `Article non trouvé pour : ${qrText}` });
    }

    const casier = await Casier.findOne({ code_unique });
    if (!casier) {
      return res.status(404).json({ message: 'Casier non trouvé.' });
    }

    // Vérifier capacité du casier
    const totalContenu = casier.contenus.reduce((sum, item) => sum + item.quantite, 0);
    if (totalContenu + quantiteNumber > 30) {
      return res.status(400).json({ message: 'Capacité maximale du casier atteinte (30).' });
    }

    // Créer l'échantillon lié à l'article
    const echantillon = await Echantillon.create({
      nom: article.libelle,
      article: article._id
    });

    // Ajouter au casier
    casier.contenus.push({
      echantillon: echantillon._id,
      quantite: quantiteNumber
    });

    await casier.save();

    res.status(201).json({
      message: '✅ Échantillon stocké avec succès.',
      echantillon,
      casier: casier.code_unique
    });

  } catch (err) {
    console.error('Erreur STOCKAGE:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});


// ✅ POST /destock : Retirer une quantité d’un article depuis ses casiers
router.post('/destock', async (req, res) => {
  try {
    const { qrText, quantite } = req.body;

    if (!qrText || !quantite) {
      return res.status(400).json({ message: 'qrText et quantite sont requis.' });
    }

    const quantiteToRemove = parseInt(quantite, 10);
    if (isNaN(quantiteToRemove) || quantiteToRemove <= 0) {
      return res.status(400).json({ message: 'Quantité invalide.' });
    }

    // Trouver article
    const article = await Article.findOne({ qrCodeText: qrText });
    if (!article) {
      return res.status(404).json({ message: `Article non trouvé pour : ${qrText}` });
    }

    // Trouver tous les échantillons liés à cet article
    const echantillons = await Echantillon.find({ article: article._id });
    const echantillonIds = echantillons.map(e => e._id);

    // Trouver tous les casiers qui contiennent ces échantillons
    const casiers = await Casier.find({ 'contenus.echantillon': { $in: echantillonIds } });

    let remainingToRemove = quantiteToRemove;
    let updatedCasiers = [];

    for (const casier of casiers) {
      let updated = false;

      casier.contenus = casier.contenus.map(item => {
        if (remainingToRemove > 0 && echantillonIds.includes(item.echantillon.toString())) {
          const removeQty = Math.min(item.quantite, remainingToRemove);
          item.quantite -= removeQty;
          remainingToRemove -= removeQty;
          updated = true;
        }
        return item;
      }).filter(item => item.quantite > 0); // Retirer les 0

      if (updated) {
        await casier.save();
        updatedCasiers.push(casier.code_unique);
      }

      if (remainingToRemove <= 0) break;
    }

    if (remainingToRemove > 0) {
      return res.status(400).json({ message: `Stock insuffisant. Il manque ${remainingToRemove} unité(s).` });
    }

    res.status(200).json({
      message: `✅ ${quantiteToRemove} unité(s) déstockée(s) avec succès.`,
      casiers_modifiés: updatedCasiers
    });

  } catch (err) {
    console.error('Erreur DESTOCKAGE:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

module.exports = router;
