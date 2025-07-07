const mongoose = require('mongoose');

const casierSchema = mongoose.Schema({
    id:{
        type:Number,
        required:true
    },
    ligne:{
        type:Number,
        required:true
    },
    colonne:{
        type:Number,
        required:true
    }
});
const Casier = mongoose.model('casier',casierSchema); //compile le schema vers un modele

module.exports = Casier 

