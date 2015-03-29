var mongoose = require('mongoose');

module.exports = mongoose.model('Note', {
    user : {type : String, default: ''},
    section : {type : String, default: ''},
   	title : {type : String, default: ''},
   	content : {type : String, default: ''}
});