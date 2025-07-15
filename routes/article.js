const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const Article = require('../models/article'); 

// ✅ CREATE new article with QR code and qrCodeText
router.post('/add', async (req, res) => {
  try {
    const { code_article, libelle } = req.body;

    if (!code_article || !libelle) {
      return res.status(400).json({ message: 'code_article et libelle sont requis.' });
    }

    const existingArticle = await Article.findOne({ code_article });
    if (existingArticle) {
      return res.status(409).json({
        message: `L'article avec le code ${code_article} existe déjà.`,
        article: existingArticle
      });
    }

    // ✅ Générer le texte QR à stocker
    const qrCodeText = `${libelle}-${code_article}`; // Ex: "Tissu coton-ART001"

    // ✅ Générer l'image QR code en base64
    const qrCodeBase64 = await QRCode.toDataURL(qrCodeText);

    // ✅ Créer et enregistrer l’article avec le texte + image QR
    const newArticle = new Article({
      code_article,
      libelle,
      qrCodeText,      // <== Nouveau champ important
      qrCode: qrCodeBase64
    });

    const savedArticle = await newArticle.save();

    res.status(201).json({
      message: '✅ Article créé avec QR code.',
      article: savedArticle
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ✅ GET all articles
router.get('/getall', async (req, res) => {
  try {
    const articles = await Article.find();
    res.status(200).json(articles);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ✅ GET article by code_article
router.get('/:code_article', async (req, res) => {
  try {
    const { code_article } = req.params;
    const article = await Article.findOne({ code_article });

    if (!article) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }

    res.status(200).json(article);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ✅ DELETE article by code_article
router.delete('/delete/:code_article', async (req, res) => {
  try {
    const { code_article } = req.params;
    const deleted = await Article.findOneAndDelete({ code_article });

    if (!deleted) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }

    res.status(200).json({
      message: `Article ${code_article} supprimé avec succès.`,
      article: deleted
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
