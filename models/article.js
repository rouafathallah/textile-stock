const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  code_article: { type: String, required: true, unique: true },
  libelle:      { type: String, required: true }
});

module.exports = mongoose.model('Article', articleSchema);
