var mongoose = require('mongoose');

module.exports = mongoose.model('CachedUser', {
    user : {type : String, default: ''},
    noteState : {type :  Object, default: {title : "Welcome", section : "Welcome"}},
    cached : {type : Boolean, default: false},
    spire : {type : Object, default: null}
});