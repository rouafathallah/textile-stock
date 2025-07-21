const { Schema, model } = require('mongoose');

const casierSchema = new Schema({
  code_rayon:  { type: String, required: true },
  code_etage:  { type: String, required: true },
  code_casier: { type: String, required: true },
  code_unique:{ type: String, unique: true }, // exemple : "010101"

  contenus: [{
    echantillon: { type: Schema.Types.ObjectId, ref: 'Echantillon', required: true },
    quantite:    { type: Number, required: true, min: 0 }
  }],

  type: {
    type: String,
    enum: ['STK', 'DST'], // STK = casier normal, DST = casier de déstockage
    required: true
  }
}, { timestamps: true });


module.exports = model('Casier', casierSchema);
