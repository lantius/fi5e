var pretty = require("../lib/pretty");

module.exports = function(app){
  app.get('/', function(req, res) {
    var user;
    if(!req.session.identifier) {
      user = new Object();
      res.render('index', {
        user: {}
      });
    } else {
      user = {
        id: req.session.identifier,
        prettylastlogin: pretty.prettyDate(req.session.lastlogin),
        one: req.session.one,
        two: req.session.two,
        three: req.session.three,
        four: req.session.four,
        five: req.session.five,
        star_one: req.session.star_one ? "on" : '',
        star_two: req.session.star_two ? "on" : '',
        star_three: req.session.star_three ? "on" : '',
        star_four: req.session.star_four ? "on" : '',
        star_five: req.session.star_five ? "on" : ''
      };

      user.history = new Object();
      client.query("SELECT cal_date, (star_one::int + star_two::int + star_three::int + star_four::int + star_five::int) AS rating FROM dates WHERE identifier = $1", [req.session.identifier], function(err, result) {
        if (err) {
          console.log("pg error: " + err);
        }
        else {
          for(var i = 0; i < result.rows.length; i++) {
            user.history[new Date(result.rows[i].cal_date).getDate()] = result.rows[i].rating;
          }
          res.render('index', {
            user: user,
          });
        }
      });
    }
  });
};