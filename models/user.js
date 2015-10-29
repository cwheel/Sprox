var mongoose = require('mongoose');

module.exports = mongoose.model('CachedUser', {
    user : {type : String, default: ''},
    noteState : {type :  Object, default: {title : "WelcomeToNotebook", section : "WelcomeToNotebook"}},
    cached : {type : Boolean, default: false},
    spire : {type : Object, default: null}
});