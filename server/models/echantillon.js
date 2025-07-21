const mongoose = require('mongoose');

const echantillonSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Echantillon', echantillonSchema);

