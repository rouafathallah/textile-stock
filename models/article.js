const mongoose = require('mongoose');

const articleSchema = mongoose.Schema({
    code_barre:{
        type:String,
        required:true,
        unique:true
    },
    nom:{
        type:String,
        required:true
    },
    stock:{
        type:Number,
        required:false,
        min:0
    }
});
const Article = mongoose.model('article',articleSchema); //compile le schema vers un modele

module.exports = Article 

