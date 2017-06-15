var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({secret: 'kevinplacid', resave: false, saveUninitialized: false}));

var restrict = function(req, res, next) {
  console.log('hello', req.url);
  if (req.url === '/signup' || req.url === '/login') {
    return next();
  }
  if (req.session.user) {
    console.log("Allow access");
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
};

app.get('/',
function(req, res) {
  res.render('index');
});

app.get('/create',
function(req, res) {
  res.render('index');
});

app.get('/links',
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
});

app.post('/links',
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri })
  .fetch()
  .then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login',
function(req, res) {
  res.render('login');
});

app.get('/signup',
function(req, res) {
  res.render('signup');
});

app.post('/login',
function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  console.log('username at login', username);
  console.log('password at login', password);

  new User({'username': username})
  .fetch()
  .then(function(user) {
    if(user) {
      user.checkPass(user.get('password'), function(err, match) {
        console.log('Match', username);
        req.session.user = username;
      });
    }
    console.log(user.get('password'));
  })
  .catch(function(err) {
    res.status(404).redirect('login');
  });
});

app.post('/signup',
function(req, res) {
  // console.log(req);
  var username = req.body.username;
  console.log('username', username);
  var password = req.body.password;
  console.log('password', password);

  new User({'username': username, 'password': password})
  .hashPass(password, function(hashed){
    Users.create({
      username: username,
      password: JSON.stringify(hashed)
    })
    .then(function(user) {
      console.log(user);
      req.session.user = username;
      res.status(201).redirect('/');
    });
  });

  // new User({username: username, password: password})
  //         .save()
  //         .then(function(user) {
  //           req.session.user = username;
  //           res.status(201).redirect('/');
  //         })
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

module.exports = app;
