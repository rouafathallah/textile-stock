const mongoose = require('mongoose');

const articleSchema = mongoose.Schema({
    id:{
        type:Number,
        required:true
    },
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
        required:false
    }
});
const Article = mongoose.model('article',articleSchema); //compile le schema vers un modele

module.exports = Article 

