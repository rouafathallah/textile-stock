const express = require('express');
const router = express.Router();
const Article = require('../models/article'); 

// POST /articles/add
router.post('/add', async (req, res) => {
  try {
    const { code_article, libelle } = req.body;

    if (!code_article || !libelle) {
      return res.status(400).json({ message: 'code_article et libelle sont requis.' });
    }

    // Vérifier si un article avec ce code existe déjà
    const existingArticle = await Article.findOne({ code_article });
    if (existingArticle) {
      return res.status(409).json({
        message: `L'article avec le code ${code_article} existe déjà.`,
        article: existingArticle
      });
    }

    // Créer l’article
    const newArticle = new Article({ code_article, libelle });
    const savedArticle = await newArticle.save();

    res.status(201).json({
      message: 'Article créé avec succès.',
      article: savedArticle
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET route to get all articles
router.get('/getall', async (req, res) => {
  try {
    const articles = await Article.find();
    res.status(200).json(articles);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

//GET ARTICLE BY CODE ARTICLE
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


//delete an article
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
