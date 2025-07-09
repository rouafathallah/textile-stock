const express = require('express');
const router = express.Router();
const Article = require('../models/article'); 

// POST route to create a new article
// POST /casiers/add  → ajouter un nouveau casier
router.post('/add', async (req, res) => {
  try {
    const { code_barre,nom,stock } = req.body;

    // Crée une nouvelle instance de Casier
    const newArticle = new Article({
      code_barre,
      nom,
      stock
    });

    // Enregistre-la dans la base
    const savedArticle = await newArticle.save();

    // Réponse 201 Created avec le casier sauvegardé
    res.status(201).json(savedArticle);
  } catch (error) {
    // Ex. : champs manquants, id en double, etc.
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

//delete an article
router.delete('/delete/:id', async (req, res) =>{
  try{
    const id=Number(req.params.id); //convertir en nombre
    const deleteArticle = await Article.findOneAndDelete({id});
    if (!deleteArticle) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }
     // Tu peux renvoyer l’objet supprimé ou juste un message
    res.json({
      message: `Article ${id} supprimé avec succès`,
      deleteArticle
    });
  }catch (error) {
    res.status(500).json({ message: error.message });
  }
});




//je veux trier les articles par ordre de nom,codebarre,,,,,,
module.exports = router;
