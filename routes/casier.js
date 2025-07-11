// routes/casier.js
const express = require('express');
const router = express.Router();
const Casier = require('../models/casier'); // adapte le chemin si besoin
const Article = require('../models/article');

//generer auto des casiers
router.post('/generer-auto', async (req, res) => {
  try {
    const { nbrCasiersAjouter, maxRayons, maxEtages, maxCasiers, type } = req.body;

    if (![nbrCasiersAjouter, maxRayons, maxEtages, maxCasiers, type].every(Boolean)) {
      return res.status(400).json({ message: 'Tous les champs sont requis : nbrCasiersAjouter, maxRayons, maxEtages, maxCasiers, type' });
    }

    if (type !== 'STK') {
      return res.status(400).json({ message: 'Seuls les casiers de type STK peuvent être générés automatiquement.' });
    }

    const last = await Casier.findOne({ type: 'STK' }).sort({ code_unique: -1 });

    let [r, e, c] = [1, 1, 1];

    if (last) {
      r = +last.code_rayon;
      e = +last.code_etage;
      c = +last.code_casier + 1;

      if (c > maxCasiers) {
        c = 1;
        if (++e > maxEtages) {
          e = 1;
          r++;
        }
      }
    }

    const casiers = [];

    for (let i = 0; i < nbrCasiersAjouter && r <= maxRayons; i++) {
      const [cr, ce, cc] = [String(r).padStart(2, '0'), String(e).padStart(2, '0'), String(c).padStart(2, '0')];
      const code_unique = `${cr}${ce}${cc}`;

      if (!await Casier.exists({ code_unique })) {
        const casier = await Casier.create({
          code_rayon: cr,
          code_etage: ce,
          code_casier: cc,
          code_unique,
          contenus: [],
          type
        });
        casiers.push(casier);
      }

      if (++c > maxCasiers) {
        c = 1;
        if (++e > maxEtages) {
          e = 1;
          r++;
        }
      }
    }

    res.status(201).json({
      message: `${casiers.length} casiers générés avec succès`,
      casiers
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Route pour créer un casier unique de type DST (déstockage)
router.post('/init-destockage', async (req, res) => {
  try {
    // Vérifier s'il existe déjà un casier de type DST
    if (await Casier.findOne({ type: 'DST' })) {
      return res.status(400).json({ message: 'Le casier de déstockage existe déjà' });
    }

    // Créer et sauvegarder directement le casier
    await Casier.create({
      code_rayon: '99',
      code_etage: '99',
      code_casier: '99',
      code_unique: '999999',
      contenus: [],
      type: 'DST'
    });

    res.status(201).json({ message: 'Casier de déstockage créé avec succès' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

//vider un casier
router.post('/vider/:code_unique', async (req, res) => {
  try {
    const casier = await Casier.findOne({ code_unique: req.params.code_unique });
    if (!casier) return res.status(404).json({ message: 'Casier introuvable' });
    if (!casier.contenus.length) return res.status(200).json({ message: 'Le casier est déjà vide.' });

    casier.contenus = [];
    await casier.save();

    const casiers = await Casier.find().select('code_unique type');
    res.status(200).json({ message: 'Casier vidé avec succès', casiers });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

//consulter tous les casiers
router.get('/get', async (req, res) => {
  try {
    const casiers = await Casier.find().sort({ code_unique: 1 }).select('code_unique type');
    res.status(200).json(casiers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

//afficher un casier specifique
router.get('/get/:code', async (req, res) => {
  try {
    const casier = await Casier.findOne({ code_unique: req.params.code })
      .select('code_unique type contenus');

    if (!casier) {
      return res.status(404).json({ message: 'Casier non trouvé' });
    }

    res.status(200).json(casier);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});



module.exports = router;
