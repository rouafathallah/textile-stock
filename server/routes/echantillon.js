const express = require('express');
const router = express.Router();
const Echantillon = require('../models/echantillon');
const Article = require('../models/article');
const Casier = require('../models/casier');
const { authMiddleware } = require('../middleware/auth');


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

    // Chercher un échantillon existant pour cet article
    let echantillon = await Echantillon.findOne({ article: article._id });
    if (!echantillon) {
      echantillon = await Echantillon.create({
        nom: article.libelle,
        article: article._id
      });
    }

    // Vérifier si le casier contient déjà cet échantillon
    const contenuIndex = casier.contenus.findIndex(
      c => c.echantillon.toString() === echantillon._id.toString()
    );
    if (contenuIndex !== -1) {
      // Augmenter la quantité
      casier.contenus[contenuIndex].quantite += quantiteNumber;
    } else {
      // Ajouter un nouvel item
      casier.contenus.push({
        echantillon: echantillon._id,
        quantite: quantiteNumber
      });
    }

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

// ✅ GET /echantillons/getall : Liste des échantillons
router.get('/getall', authMiddleware, async (req, res) => {
  try {
    const echantillons = await Echantillon.find().populate('article');
    res.status(200).json(echantillons);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération des échantillons', error: err.message });
  }
});

// ✅ POST /stock-by-code : Stocker un échantillon par code_article
router.post('/stock-by-code', async (req, res) => {
  try {
    const { code_article, quantite, code_unique } = req.body;

    if (!code_article || !quantite || !code_unique) {
      return res.status(400).json({ message: 'code_article, quantite et code_unique sont requis.' });
    }

    const quantiteNumber = parseInt(quantite, 10);
    if (isNaN(quantiteNumber) || quantiteNumber <= 0) {
      return res.status(400).json({ message: 'Quantité invalide.' });
    }

    // Trouver l'article par code_article
    const article = await Article.findOne({ code_article });
    if (!article) {
      return res.status(404).json({ message: `Article non trouvé pour : ${code_article}` });
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

    // Chercher un échantillon existant pour cet article
    let echantillon = await Echantillon.findOne({ article: article._id });
    if (!echantillon) {
      echantillon = await Echantillon.create({
        nom: article.libelle,
        article: article._id
      });
    }

    // Vérifier si le casier contient déjà cet échantillon
    const contenuIndex = casier.contenus.findIndex(
      c => c.echantillon.toString() === echantillon._id.toString()
    );
    if (contenuIndex !== -1) {
      // Augmenter la quantité
      casier.contenus[contenuIndex].quantite += quantiteNumber;
    } else {
      // Ajouter un nouvel item
      casier.contenus.push({
        echantillon: echantillon._id,
        quantite: quantiteNumber
      });
    }

    await casier.save();

    res.status(201).json({
      message: '✅ Échantillon stocké avec succès (par code article).',
      echantillon,
      casier: casier.code_unique
    });

  } catch (err) {
    console.error('Erreur STOCKAGE CODE:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

module.exports = router;
