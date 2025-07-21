const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  code_article: { type: String, required: true, unique: true },
  libelle:      { type: String, required: true },
  qrCode:       { type: String },  // base64 image
  qrCodeText:   { type: String, required: true, unique: true } // ← AJOUT OBLIGATOIRE
});

module.exports = mongoose.model('Article', articleSchema);
