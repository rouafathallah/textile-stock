const express = require('express');
const router = express.Router();
const Casier = require('../models/casier');
const Echantillon = require('../models/echantillon');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.post('/generer-auto', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { nbrCasiersAjouter, maxRayons, maxEtages, maxCasiers, type } = req.body;

    if (![nbrCasiersAjouter, maxRayons, maxEtages, maxCasiers, type].every(Boolean)) {
      return res.status(400).json({ message: 'Tous les champs sont requis : nbrCasiersAjouter, maxRayons, maxEtages, maxCasiers, type.' });
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
      message: `${casiers.length} casier(s) généré(s) avec succès.`,
      casiers
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});
router.post('/init-destockage', authMiddleware, adminOnly, async (req, res) => {
  try {
    const alreadyExists = await Casier.findOne({ type: 'DST' });
    if (alreadyExists) {
      return res.status(400).json({ message: 'Le casier de déstockage existe déjà.' });
    }

    await Casier.create({
      code_rayon: '99',
      code_etage: '99',
      code_casier: '99',
      code_unique: '999999',
      contenus: [],
      type: 'DST'
    });

    res.status(201).json({ message: '✅ Casier de déstockage créé avec succès.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});
router.post('/vider/:code_unique', authMiddleware, adminOnly, async (req, res) => {
  try {
    const casier = await Casier.findOne({ code_unique: req.params.code_unique });

    if (!casier) return res.status(404).json({ message: 'Casier introuvable.' });

    if (!casier.contenus.length) {
      return res.status(200).json({ message: '🔁 Le casier est déjà vide.' });
    }

    casier.contenus = [];
    await casier.save();

    const allCasiers = await Casier.find().select('code_unique type');

    res.status(200).json({ message: '✅ Casier vidé avec succès.', casiers: allCasiers });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

router.get('/get', authMiddleware, async (req, res) => {
  try {
    const casiers = await Casier.find()
      .sort({ code_unique: 1 })
      .select('code_unique type contenus');

    res.status(200).json(casiers);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});


router.get('/get/:code', authMiddleware, async (req, res) => {
  try {
    const casier = await Casier.findOne({ code_unique: req.params.code })
      .populate({
        path: 'contenus.echantillon',
        populate: { path: 'article' }
      });

    if (!casier) {
      return res.status(404).json({ message: 'Casier non trouvé.' });
    }

    res.status(200).json(casier);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

router.post('/empty/:code_unique', async (req, res) => {
  try {
    const casier = await Casier.findOne({ code_unique: req.params.code_unique });
    if (!casier) return res.status(404).json({ message: 'Casier non trouvé.' });

    // Remove associated échantillons from DB
    const echantillonIds = casier.contenus.map(item => item.echantillon);
    if (echantillonIds.length > 0) {
      await Echantillon.deleteMany({ _id: { $in: echantillonIds } });
    }

    casier.contenus = [];
    await casier.save();

    res.json({ message: 'Casier vidé et échantillons supprimés avec succès.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});
router.delete('/remove/:code_unique', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { code_unique } = req.params;

    const casier = await Casier.findOne({ code_unique });
    if (!casier) {
      return res.status(404).json({ message: 'Casier non trouvé.' });
    }

    await casier.deleteOne();

    res.status(200).json({ message: 'Casier supprimé avec succès.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression du casier.', error: err.message });
  }
});

// POST /casiers/generate
router.post('/generate', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { nbrRayons, nbrEtages, nbrCasiers, startRayon, startEtage, startCasier } = req.body;

    if (
      [nbrRayons, nbrEtages, nbrCasiers, startRayon, startEtage, startCasier].some(
        (v) => v === undefined || isNaN(v)
      )
    ) {
      return res.status(400).json({ message: 'Tous les champs sont requis et doivent être numériques.' });
    }

    const newCasiers = [];

    for (let r = 0; r < nbrRayons; r++) {
      const rayonNum = (startRayon + r).toString().padStart(2, '0');

      for (let e = 0; e < nbrEtages; e++) {
        const etageNum = (startEtage + e).toString().padStart(2, '0');

        for (let c = 0; c < nbrCasiers; c++) {
          const casierNum = (startCasier + c).toString().padStart(2, '0');

          const code_unique = rayonNum + etageNum + casierNum;

          newCasiers.push({
            code_rayon: rayonNum,
            code_etage: etageNum,
            code_casier: casierNum,
            code_unique,
            contenus: [],
            type: 'STK',
          });
        }
      }
    }

    await Casier.insertMany(newCasiers);

    res.status(201).json({
      message: '✅ Casiers générés avec succès.',
      total: newCasiers.length,
      exemples: newCasiers.slice(0, 5),
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

router.delete('/remove-all-stk', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await Casier.deleteMany({ type: 'STK' });
    res.status(200).json({ message: `✅ ${result.deletedCount} casier(s) de type STK supprimé(s) avec succès.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression des casiers STK.', error: err.message });
  }
});

module.exports = router;