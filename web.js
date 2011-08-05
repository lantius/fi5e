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
  dates: "identifier varchar(255), cal_date date, one varchar(255), two varchar(255), three varchar(255), four varchar(255), five varchar(255), star_one boolean, star_two boolean, star_three boolean, star_four boolean, star_five boolean"
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

var pg_date = function(now) {
  return now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate();
}

create_table(client, "users");
create_table(client, "dates");


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
          console.log("pg error: " + err);
        } else if (!result || 0 === result.rows.length) {
          console.log("inserting");
          
          var now = new Date();
          req.session.firstlogin = now;
          req.session.lastlogin = now;
          
          client.query("INSERT INTO users(identifier, firstlogin, lastlogin) values($1, $2, $3)", [req.session.identifier, now.getTime(), now.getTime()]);
          client.query("INSERT INTO dates(identifier, cal_date) values($1, $2)", [req.session.identifier, pg_date(now)]);
          
          // db.save(req.session.identifier, {firstlogin: Date.now(), lastlogin: Date.now()})
        } else {
          console.log("updating");
          var now = new Date();
          
          req.session.firstlogin = result.rows[0].firstlogin;
          req.session.lastlogin = result.rows[0].lastlogin;
          req.session.one = result.rows[0].one;
          req.session.two = result.rows[0].two;
          req.session.three = result.rows[0].three;
          req.session.four = result.rows[0].four;
          req.session.five = result.rows[0].five;
          client.query("UPDATE users SET lastlogin=$2 WHERE identifier = $1", [req.session.identifier, now.getTime()]);

          client.query("SELECT * FROM dates WHERE identifier = $1 AND cal_date = $2 ", [req.session.identifier, pg_date(now)], function(err, result) {
            if (err) {
              console.log("pg error: " + err);
            }
            else if (0 === result.rows.length) {
              client.query("INSERT INTO dates(identifier, cal_date) values($1, $2)", [req.session.identifier, pg_date(now)]);
            }
            else {
              req.session.star_one = result.rows[0].star_one;
              req.session.star_two = result.rows[0].star_two;
              req.session.star_three = result.rows[0].star_three;
              req.session.star_four = result.rows[0].star_four;
              req.session.star_five = result.rows[0].star_five;
            }
            res.redirect('/');
          });
          
          // db.merge(req.session.identifier, {lastlogin: Date.now()})
        }
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
    user.star_one = req.session.star_one ? "on" : '';
    user.star_two = req.session.star_two ? "on" : '';
    user.star_three = req.session.star_three ? "on" : '';
    user.star_four = req.session.star_four ? "on" : '';
    user.star_five = req.session.star_five ? "on" : '';
  }
  res.render('index', {
    locals: { 
      user: user
    }
  });
});

app.post('/star', function(req, res) {
  req.session["star_" + req.body.star] = (req.body.on === 'true');
  if(req.session.identifier) {
    client.query("UPDATE dates SET star_" + req.body.star + "=$1 WHERE identifier = $2 AND cal_date = $3", [(req.body.on === 'true'), req.session.identifier, pg_date(new Date())]);
  }
  res.send();
});

app.post('/thing', function(req, res) {
  if(req.session.identifier) {
    client.query("UPDATE users SET " + req.body.thing + "=$2 WHERE identifier = $1", [req.session.identifier, req.body.value]);
  }
  req.session[req.body.thing]  = req.body.value;
  res.send();
});


var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log("Listening on " + port);
});