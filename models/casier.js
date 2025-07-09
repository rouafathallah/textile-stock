const { Schema, model } = require('mongoose');

const casierSchema = new Schema({
  ligne: {
    type: Number,
    required: function() { return this.isTemp === null; },
    default: null
  },
  colonne: {
    type: Number,
    required: function() { return this.isTemp === null; },
    default: null
  },
  article: {
    type: Schema.Types.ObjectId,
    ref: 'Article',
    required: false,
    default: null
  },
  quantite: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  isTemp: {
    type: String,
    enum: ['IN', 'OUT', null],
    default: null
  }
}, { timestamps: true });

module.exports = model('Casier', casierSchema);
