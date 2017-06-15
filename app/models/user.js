var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: false,
  checkPass: function(pass, callback) {
    // console.log('User pass in model', this.get('password'));
    bcrypt.compare(pass, this.get('password'), function(err, res) {
      if (err) {
        console.error(err);
        callback(err, null);
      } else {
        callback(null, res);
      }
    });
  },
  hashPass: function(pass, callback) {
    console.log('reached creating function');
    console.log('pass before hashing', pass);

    bcrypt.hash(pass, null, null, function(err, hash) {
      if(err) {
        console.log('err in creating',err);
        //callback(err, null);
      } else {
        console.log('hash', hash);
        callback(hash);
      }
    });
  },
  // initialize: function() {
  //   this.on('creating', function(model, attrs, options) {
  //     console.log('reached creating function');
  //     var pass = model.get('password');
  //     console.log('pass before hashing', pass);
  //     // var hash = bcrypt.hashSync(pass);
  //     // model.set('password', hash);
  //     // model.set(pass, function(err, result) {

  //     // });
  //     bcrypt.hash(pass, null, null, function(err, hash) {
  //       if(err) {
  //         console.log('err in creating',err);
  //         //callback(err, null);
  //       } else {
  //         console.log('hash', hash);
  //         model.set('password', hash);
  //       }
  //     });
  //   });
  // }
});

module.exports = User;