const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const Article = require('../models/article');
const { authMiddleware } = require('../middleware/auth');

router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { code_article, libelle } = req.body;

    if (!code_article || !libelle) {
      return res.status(400).json({ message: 'Les champs "code_article" et "libelle" sont requis.' });
    }

    // Check if article already exists
    const existingArticle = await Article.findOne({ code_article });
    if (existingArticle) {
      return res.status(409).json({
        message: `L'article avec le code "${code_article}" existe déjà.`,
        article: existingArticle
      });
    }

    // Create qrCodeText (unique readable code)
    const qrCodeText = `${libelle}-${code_article}`; // Ex: "Chaussure-ART007"

    // Generate QR code base64
    const qrCodeBase64 = await QRCode.toDataURL(qrCodeText);

    // Create article document
    const newArticle = new Article({
      code_article,
      libelle,
      qrCodeText,
      qrCode: qrCodeBase64
    });

    const saved = await newArticle.save();

    res.status(201).json({
      message: '✅ Article créé avec succès.',
      article: saved
    });

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

router.get('/getall', authMiddleware, async (req, res) => {
  try {
    const articles = await Article.find();
    res.status(200).json(articles);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération.', error: err.message });
  }
});

router.get('/code/:code_article', authMiddleware, async (req, res) => {
  try {
    const { code_article } = req.params;
    const article = await Article.findOne({ code_article });

    if (!article) {
      return res.status(404).json({ message: `Aucun article trouvé avec le code "${code_article}".` });
    }

    res.status(200).json(article);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

router.delete('/delete/:code_article', authMiddleware, async (req, res) => {
  try {
    const { code_article } = req.params;
    const deleted = await Article.findOneAndDelete({ code_article });

    if (!deleted) {
      return res.status(404).json({ message: `Aucun article trouvé avec le code "${code_article}".` });
    }

    res.status(200).json({
      message: `✅ Article "${code_article}" supprimé avec succès.`,
      article: deleted
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

module.exports = router;
