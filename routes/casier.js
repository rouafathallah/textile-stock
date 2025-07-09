// routes/casier.js
const express = require('express');
const router = express.Router();
const Casier = require('../models/casier'); // adapte le chemin si besoin
const Article = require('../models/article');

module.exports = router;

//creer un casier 
router.post('/creer-casier-simple', async (req, res) => {
  try {
    const { ligne, colonne } = req.body;

    if (ligne == null || colonne == null) {
      return res.status(400).json({ message: "ligne et colonne sont obligatoires" });
    }

    // Vérifier si casier existe déjà à cette position (final)
    const casierExist = await Casier.findOne({ ligne, colonne, isTemp: null });
    if (casierExist) {
      return res.status(400).json({ message: "Ce casier existe déjà à cette position" });
    }

    // Créer le casier final vide
    const nouveauCasier = new Casier({
      ligne,
      colonne,
      article: null,
      quantite: 0,
      isTemp: null
    });

    await nouveauCasier.save();

    res.status(201).json({ message: "Casier créé avec succès", casier: nouveauCasier });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

//creer les deux casiers ded stockage et déstockage une seule fois
router.post('/init-casiers-temp', async (req, res) => {
  try {
    // Vérifier si les casiers temporaires existent déjà
    const tamponIn = await Casier.findOne({ isTemp: 'IN' });
    const tamponOut = await Casier.findOne({ isTemp: 'OUT' });

    if (tamponIn && tamponOut) {
      return res.status(400).json({ message: "Les casiers temporaires existent déjà." });
    }

    const casiersTemp = [];

    if (!tamponIn) {
      casiersTemp.push(new Casier({
        ligne: null,
        colonne: null,
        article: null,
        quantite: 0,
        isTemp: 'IN'
      }).save());
    }

    if (!tamponOut) {
      casiersTemp.push(new Casier({
        ligne: null,
        colonne: null,
        article: null,
        quantite: 0,
        isTemp: 'OUT'
      }).save());
    }

    await Promise.all(casiersTemp);

    res.status(201).json({ message: "Casiers temporaires créés avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});


//stocker temporairement des articles dans un casier tampon
router.post('/stockage-temporaire', async (req, res) => {
  try {
    const { code_barre, quantite } = req.body;

    if (!code_barre || quantite == null || quantite <= 0) {
      return res.status(400).json({ message: 'code_barre et quantite (>0) requis' });
    }

    const article = await Article.findOne({ code_barre });
    if (!article) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }

    // 1. Récupérer l’unique tampon IN
    let tamponIn = await Casier.findOne({ isTemp: 'IN' });
    if (!tamponIn) {
      return res.status(500).json({ message: "Casier tampon IN inexistant : exécutez /casiers/init-casiers-temp d'abord" });
    }

    // 2. Vérifier stock dispo en tenant compte de la qté déjà dans tampon
    const qteDansTampon = tamponIn.article && tamponIn.article.equals(article._id) ? tamponIn.quantite : 0;
    if (qteDansTampon + quantite > article.stock) {
      return res.status(400).json({ message: 'Quantité dépasse le stock disponible' });
    }

    // 3. Si le tampon contient un autre article → refuser
    if (tamponIn.article && !tamponIn.article.equals(article._id)) {
      return res.status(400).json({ message: 'Le tampon IN contient déjà un autre article, vide-le ou valide l’entrée avant' });
    }

    // 4. Affecter l’article (si tampon vide) puis ajouter la quantité
    tamponIn.article  = article._id;
    tamponIn.quantite = qteDansTampon + quantite;
    await tamponIn.save();

    res.status(201).json({ message: 'Stockage temporaire réussi', tamponIn });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// POST /casiers/valider-entree
router.post('/valider-entree', async (req, res) => {
  try {
    const { code_barre } = req.body;
    if (!code_barre) return res.status(400).json({ message: 'code_barre est requis' });

    const article = await Article.findOne({ code_barre });
    if (!article) return res.status(404).json({ message: 'Article non trouvé' });

    const tamponIn = await Casier.findOne({ article: article._id, isTemp: 'IN' });
    if (!tamponIn || tamponIn.quantite <= 0) {
      return res.status(400).json({ message: 'Aucune quantité dans le stockage temporaire' });
    }

    const qte = tamponIn.quantite;

    // Chercher casier final existant
    let casierFinal = await Casier.findOne({ article: article._id, isTemp: null });

    // Sinon trouver un emplacement libre
    if (!casierFinal) {
      const MAX_LIGNE = 100, MAX_COL = 10;
      let ligneLibre, colLibre;
      outer: for (let l = 1; l <= MAX_LIGNE; l++) {
        for (let c = 1; c <= MAX_COL; c++) {
          const occupe = await Casier.exists({ ligne: l, colonne: c, isTemp: null });
          if (!occupe) { ligneLibre = l; colLibre = c; break outer; }
        }
      }
      if (ligneLibre == null) return res.status(500).json({ message: 'Plus de casier libre' });
      casierFinal = new Casier({ article: article._id, ligne: ligneLibre, colonne: colLibre, quantite: 0, isTemp: null });
    }

    // Transfert
    casierFinal.quantite += qte;
    await casierFinal.save();

    // Vider le tampon IN
    tamponIn.quantite = 0;
    tamponIn.article  = null;
    await tamponIn.save();

    // Décrémenter le stock global APRÈS validation
    article.stock -= qte;
    await article.save();

    res.status(200).json({ message: 'Entrée validée', casierFinal, stockRestant: article.stock });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// GET /casiers/getall → récupérer tous les casiers
router.get('/getall', async (_req, res) => {
  try {
    const casier = await Casier.find();
    res.json(casier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Retirer provisoirement des articles pour expédition
router.post('/destockage-temporaire', async (req, res) => {
  try {
    const { code_barre, quantite } = req.body;

    if (!code_barre || quantite == null || quantite <= 0)
      return res.status(400).json({ message: 'code_barre et quantite (>0) requis' });

    const article = await Article.findOne({ code_barre });
    if (!article) return res.status(404).json({ message: 'Article non trouvé' });

    // 1. Récupérer l’unique tampon OUT
    let tamponOut = await Casier.findOne({ isTemp: 'OUT' });
    if (!tamponOut)
      return res.status(500).json({ message: `Tampon OUT manquant : lance d'abord /casiers/init-casiers-temp` });

    // 2. Casier final (isTemp:null) pour cet article
    const casierFinal = await Casier.findOne({ article: article._id, isTemp: null });
    if (!casierFinal || casierFinal.quantite < quantite)
      return res.status(400).json({ message: 'Quantité insuffisante dans le casier final' });

    // 3. Refuser si le tampon contient déjà un autre article
    if (tamponOut.article && !tamponOut.article.equals(article._id))
      return res.status(400).json({ message: 'Tampon OUT occupé par un autre article ; validez la sortie avant' });

    // 4. Déplacer la quantité
    tamponOut.article  = article._id;
    tamponOut.quantite = (tamponOut.quantite || 0) + quantite;
    await tamponOut.save();

    casierFinal.quantite -= quantite;
    if (casierFinal.quantite === 0) await casierFinal.deleteOne();
    else await casierFinal.save();

    // (on ne touche pas encore à article.stock)
    res.status(200).json({ message: 'Déstockage temporaire réussi', tamponOut });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Valider la sortie (expédition client)
router.post('/valider-sortie', async (req, res) => {
  try {
    const { code_barre } = req.body;
    if (!code_barre) return res.status(400).json({ message: 'code_barre est requis' });

    const article = await Article.findOne({ code_barre });
    if (!article) return res.status(404).json({ message: 'Article non trouvé' });

    // Tampon OUT pour cet article
    const tamponOut = await Casier.findOne({ article: article._id, isTemp: 'OUT' });
    if (!tamponOut || tamponOut.quantite <= 0)
      return res.status(400).json({ message: 'Aucune quantité à expédier dans le tampon OUT' });

    const qte = tamponOut.quantite;

    // 1. Vider le tampon OUT
    tamponOut.quantite = 0;
    tamponOut.article  = null;
    await tamponOut.save();

    // 2. Décrémenter le stock global
    if (qte > article.stock)
      return res.status(500).json({ message: 'Incohérence stock : quantité > stock global' });

    article.stock -= qte;
    await article.save();

    res.status(200).json({
      message: 'Sortie validée ; articles expédiés',
      quantiteExpediee: qte,
      stockRestant    : article.stock
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});


// GET /casiers/emplacement/:code_barre
router.get('/emplacement/:code_barre', async (req, res) => {
  try {
    const { code_barre } = req.params;

    // Trouver l'article
    const article = await Article.findOne({ code_barre });
    if (!article) return res.status(404).json({ message: 'Article non trouvé' });

    // Trouver le casier final (isTemp:null)
    const casierFinal = await Casier.findOne({ article: article._id, isTemp: null });
    if (!casierFinal) return res.status(404).json({ message: 'Casier final introuvable pour cet article' });

    res.status(200).json({
      message: 'Emplacement trouvé',
      ligne: casierFinal.ligne,
      colonne: casierFinal.colonne
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});


module.exports = router;
