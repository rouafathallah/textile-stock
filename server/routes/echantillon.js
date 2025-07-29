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

// ✅ GET /echantillons/getall : Liste des échantillons
router.get('/getall', authMiddleware, async (req, res) => {
  try {
    // Fetch all echantillons with their articles
    const echantillons = await Echantillon.find().populate('article');

    // Fetch all casiers with their contenus including echantillon references
    const casiers = await Casier.find().populate('contenus.echantillon');

    // For each echantillon, build stocks array of all casiers containing it
    const result = echantillons.map(echantillon => {
      // Find all casiers that contain this echantillon
      const stocks = [];

      casiers.forEach(casier => {
        casier.contenus.forEach(contenu => {
          if (contenu.echantillon && contenu.echantillon._id.toString() === echantillon._id.toString()) {
            stocks.push({
              quantite: contenu.quantite,
              casier: {
                _id: casier._id,
                code_unique: casier.code_unique,
                type: casier.type
              }
            });
          }
        });
      });

      // Calculate total quantity on casiers type STK only
      const totalQuantiteSTK = stocks
        .filter(s => s.casier.type === 'STK')
        .reduce((sum, s) => sum + (s.quantite || 0), 0);

      return {
        ...echantillon.toObject(),
        stocks,
        totalQuantiteSTK
      };
    });

    // Filter to keep only echantillons with totalQuantiteSTK > 0
    const filteredResult = result.filter(e => e.totalQuantiteSTK > 0);

    res.status(200).json(filteredResult);
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

// ✅ GET /echantillons/:id : Détails d'un échantillon
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const echantillon = await Echantillon.findById(req.params.id).populate('article');
    if (!echantillon) return res.status(404).json({ message: 'Échantillon non trouvé.' });

    const casiers = await Casier.find({ 'contenus.echantillon': echantillon._id });

    const casiersWithQuantite = casiers
      .map(casier => {
        const contenu = casier.contenus.find(item => item.echantillon.toString() === echantillon._id.toString());
        return {
          code_unique: casier.code_unique,
          type: casier.type,
          quantite: contenu ? contenu.quantite : 0
        };
      })
      .filter(c => c.quantite > 0); // ✅ NE GARDE QUE LES CASIERS AVEC QUANTITÉ > 0

    // Calculs des quantités
    const quantiteStock = casiersWithQuantite
      .filter(c => c.type !== 'DST')
      .reduce((sum, c) => sum + c.quantite, 0);
    const quantiteDestock = casiersWithQuantite
      .filter(c => c.type === 'DST')
      .reduce((sum, c) => sum + c.quantite, 0);
    const totalQuantite = quantiteStock + quantiteDestock;

    res.json({
      echantillon: {
        ...echantillon.toObject(),
        quantiteStock,
        quantiteDestock,
        totalQuantite
      },
      casiers: casiersWithQuantite
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});


// ✅ POST /destock : Retirer une quantité d’un article depuis ses casiers
router.post('/destock/init', async (req, res) => {
  try {
    const { qrText } = req.body;

    if (!qrText) {
      return res.status(400).json({ message: 'qrText est requis.' });
    }

    // Find article by QR text
    const article = await Article.findOne({ qrCodeText: qrText });
    if (!article) {
      return res.status(404).json({ message: 'Article non trouvé.' });
    }

    // Get echantillons for this article
    const echantillons = await Echantillon.find({ article: article._id });
    const echantillonIds = echantillons.map(e => e._id);
    const echantillonIdStrings = echantillonIds.map(id => id.toString());

    const casiers = await Casier.find({
      type: 'STK',
      'contenus.echantillon': { $in: echantillonIds }
    });

    const result = casiers.map(casier => {
      const filteredContents = casier.contenus
        .filter(item => echantillonIdStrings.includes(item.echantillon.toString()))
        .map(item => ({
          echantillon: item.echantillon,
          quantite: item.quantite
        }));

      return {
        casierId: casier._id,
        casierCode: casier.code_unique,
        contenus: filteredContents
      };
    });

    res.status(200).json({
      articleId: article._id,
      articleNom: article.nom,
      casiers: result
    });

  } catch (err) {
    console.error('Erreur init destock:', err);
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});


// ✅ POST /destock-final : Finalise le destockage depuis plusieurs casiers
router.post('/destock/confirm', authMiddleware, async (req, res) => {
  try {
    const { lignes } = req.body;

    if (!Array.isArray(lignes) || lignes.length === 0) {
      return res.status(400).json({ message: 'Liste des casiers à destocker requise.' });
    }

    // Récupérer ou créer le casier DESTOCK-001
    let casierDestock = await Casier.findOne({ code_unique: '999999' });
    if (!casierDestock) {
      casierDestock = new Casier({
        code_unique: '999999',
        type: 'DST',
        contenus: []
      });
    }

    for (const ligne of lignes) {
      const { casierId, echantillonId, quantite } = ligne;

      if (!casierId || !echantillonId || !quantite || quantite <= 0) {
        return res.status(400).json({ message: 'Champs manquants ou invalides dans une ligne.' });
      }

      const casier = await Casier.findById(casierId);
      if (!casier) {
        return res.status(404).json({ message: `Casier non trouvé: ${casierId}` });
      }

      const index = casier.contenus.findIndex(
        c => c.echantillon.toString() === echantillonId
      );

      if (index === -1) {
        return res.status(400).json({ message: `Échantillon non présent dans le casier: ${casier.code_unique}` });
      }

      if (casier.contenus[index].quantite < quantite) {
        return res.status(400).json({ message: `Quantité insuffisante dans le casier ${casier.code_unique}` });
      }

      // 🟡 Retirer la quantité
      casier.contenus[index].quantite -= quantite;

      // Supprimer l’entrée si quantité = 0
      if (casier.contenus[index].quantite === 0) {
        casier.contenus.splice(index, 1);
      }

      await casier.save();

      // 🟣 Ajouter au casier DESTOCK
      const destockIndex = casierDestock.contenus.findIndex(
        c => c.echantillon.toString() === echantillonId
      );

      if (destockIndex !== -1) {
        casierDestock.contenus[destockIndex].quantite += quantite;
      } else {
        casierDestock.contenus.push({
          echantillon: echantillonId,
          quantite
        });
      }
    }

    await casierDestock.save();

    res.status(200).json({ message: '✅ Destockage effectué et transféré dans DESTOCK-001.' });

  } catch (err) {
    console.error('Erreur lors du destockage final:', err);
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

module.exports = router;
