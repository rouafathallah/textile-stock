const express = require('express');
const router = express.Router();
const Article = require('../models/article'); 

// POST route to create a new article
router.post('/add', async (req, res) => { 
  try {
    const { id, code_barre, nom, stock } = req.body;

    // Create a new Article instance
    const newArticle = new Article({
      id,
      code_barre,
      nom,
      stock
    });

    // Save it to the database
    const savedArticle = await newArticle.save();

    // Return success response
    res.status(201).json(savedArticle);
  } catch (error) {
    // Handle errors (e.g., validation errors, duplicate code_barre)
    res.status(400).json({ message: error.message });
  }
});

// GET route to get all articles
router.get('/getall', async (req, res) => {
  try {
    const articles = await Article.find();
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT  /articles/update/:id      -> met à jour l'article dont id = :id
router.put('/update/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);           // ← conversion
    const updatedArticle = await Article.findOneAndUpdate(
      { id },                                   // critère numérique
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedArticle) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }

    res.json(updatedArticle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


module.exports = router;
