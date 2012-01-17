var express = require('express')
  , expose = require('express-expose');

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


var db = require('./models/initialize');
require('./models/user')(db.client)
db.init();

/* Controllers */
require('./controllers/login')(app);
require('./controllers/authenticate')(app);
require('./controllers/verify')(app, User);
require('./controllers/star')(app, db.client);
require('./controllers/thing')(app, db.client);
require('./controllers/index')(app);

var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log("Listening on " + port);
});