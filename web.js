var pretty = require("./lib/pretty");

var express = require('express');
var openid = require('openid');
var cradle = require('cradle');
var pg = require('pg').native;
var postgresConnectionString = process.env.DATABASE_URL || "tcp://postgres:ps2mouse@localhost:5432/heroku";

// // Defaults to 127.0.0.1:5984
// var conn = new(cradle.Connection);
// // Create a new database
// var db = conn.database('fi5e');
// db.create();

var app = express.createServer(express.logger());
app.set('view engine', 'jade');
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: "gang fight gang fight" }));

app.use('/lib', express.static(__dirname + '/lib'));
app.use('/static', express.static(__dirname + '/static'));


var client = new pg.Client(postgresConnectionString);
client.connect();

var tables = {
  users: "identifier varchar(255), firstlogin bigint, lastlogin bigint, one varchar(255), two varchar(255), three varchar(255), four varchar(255), five varchar(255)",
  dates: "identifier varchar(255), cal_date date, one varchar(255), two varchar(255), three varchar(255), four varchar(255), five varchar(255), one_star boolean, two_star boolean, three_star boolean, four_star boolean, five_star boolean"
};

var create_table = function(client, tablename) {
  client.query("CREATE TABLE " + tablename + "(" + tables[tablename] +")", 
    function(err, result) {
      if (err) {
        if (err.code === '42P07') {
          console.log("table '" + tablename + "' already exists");
        } else {
          console.log(err);
        }
      } else {
          console.log("created '" + tablename + "' table");
      }
    });
};

create_table(client, "users");

app.post('/authenticate', function(req, res) {
  // Resolve identifier, associate, build authentication URL
  var relyingParty = new openid.RelyingParty(
      'http://' + req.headers['host'] + '/verify', // Verification URL (yours)
      null, // Realm (optional, specifies realm for OpenID authentication)
      false, // Use stateless verification
      false, // Strict mode
      []); // List of extensions to enable and include
  
  relyingParty.authenticate(
    req.body.openid_identifier, // user supplied identifier
    false, // attempt immediate authentication first?
    function(error, authUrl)
    {
      if(error)
      {
        res.send('Authentication failed: ' + error);
      }
      else if (!authUrl)
      {
        res.send('Authentication failed');
      }
      else
      {
        res.redirect(authUrl);
      }    
    }
  );
});

app.get('/verify', function(req, res) {
  var relyingParty = new openid.RelyingParty(
      'http://' + req.headers['host'] + '/verify', // Verification URL (yours)
      null, // Realm (optional, specifies realm for OpenID authentication)
      false, // Use stateless verification
      false, // Strict mode
      []); // List of extensions to enable and include

  var result = relyingParty.verifyAssertion(req, function(error, result) {
    if(error) {
      res.send(error);
    }
    if(result.authenticated) {
      req.session.identifier = new Buffer(result.claimedIdentifier, 'binary').toString('base64');
      // db.get(req.session.identifier, function(err, doc) {
      client.query("SELECT * FROM users WHERE identifier = $1", [req.session.identifier], function(err, result) {
        console.log(result)
        if (err) {
          console.log("pg errorr: " + err);
        } else if (!result || 0 == result.rows.length) {
          console.log("inserting");
          
          req.session.firstlogin = Date.now();
          req.session.lastlogin = Date.now();
          
          client.query("INSERT INTO users(identifier, firstlogin, lastlogin) values($1, $2, $3)", [req.session.identifier, (new Date()).getTime(), (new Date()).getTime()]);
          
          // db.save(req.session.identifier, {firstlogin: Date.now(), lastlogin: Date.now()})
        } else {
          console.log("updating");
          req.session.firstlogin = result.rows[0].firstlogin;
          req.session.lastlogin = result.rows[0].lastlogin;
          req.session.one = result.rows[0].one;
          req.session.two = result.rows[0].two;
          req.session.three = result.rows[0].three;
          req.session.four = result.rows[0].four;
          req.session.five = result.rows[0].five;
          client.query("UPDATE users SET lastlogin=$2 WHERE identifier = $1", [req.session.identifier, (new Date()).getTime()]);
          // db.merge(req.session.identifier, {lastlogin: Date.now()})
        }
        res.redirect('/');
      });
      
    }
  });
});

app.get('/login', function(req, res) {
  if(!req.session.identifier) {
     res.render('login', {
      layout: false
     });
  } else {
    res.redirect('/');
  }
});

app.get('/logout', function(req, res) {
   req.session.destroy()
   res.redirect('/')
});

app.get('/', function(req, res) {
  var user;
  if(!req.session.identifier) {
    user = new Object();
    user.id = null;
  } else {
    user = new Object();
    user.id = req.session.identifier;
    user.prettylastlogin = pretty.prettyDate(req.session.lastlogin);
    user.one = req.session.one;
    user.two = req.session.two;
    user.three = req.session.three;
    user.four = req.session.four;
    user.five = req.session.five;
  }
  res.render('index', {
    locals: { 
      user: user
    }
  });
});

app.post('/star', function(req, res) {
  console.log(req.body)
  res.send();
});

app.post('/thing', function(req, res) {
  console.log(req.body)
  client.query("UPDATE users SET " + req.body.thing + "=$2 WHERE identifier = $1", [req.session.identifier, req.body.value]);
  req.session[req.body.thing]  = req.body.value;
  res.send();
});


var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log("Listening on " + port);
});