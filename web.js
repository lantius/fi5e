var express = require('express');
var openid = require('openid');

var app = express.createServer(express.logger());
app.set('view engine', 'jade');
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: "gang fight gang fight" }));

app.use('/lib', express.static(__dirname + '/lib'));
app.use('/static', express.static(__dirname + '/static'));

app.post('/authenticate', function(req, res) {
  // Resolve identifier, associate, build authentication URL
  console.log(req)
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
      req.session.identifier = result.claimedIdentifier;
    }
    res.redirect('/');
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
  res.render('index', {
    locals: { 
      user: !!req.session.identifier
    }
  });
});

var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log("Listening on " + port);
});