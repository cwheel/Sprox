var mongoose = require('mongoose');

module.exports = mongoose.model('CachedUser', {
    user : {type : String, default: ''},
    cached : {type : Boolean, default: false},
    spire : {type : Object, default: null}
});