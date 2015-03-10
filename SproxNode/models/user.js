var mongoose = require('mongoose');

module.exports = mongoose.model('Build', {
    username : {type : String, default: ''},
    cached : {type : Boolean, default: false},
    spire : {type : Object, default: null}
});