/* Module dependencies */

module.exports = function(client) {
  var User = function User(id) {
    this.id = id;
    
    var now = new Date();
    this.firstlogin = now;
    this.lastlogin = now;
    
    this.one = '';
    this.two = '';
    this.three = '';
    this.four = '';
    this.five = '';
  };
  
  User.get = function(id) {
    client.query("SELECT * FROM users WHERE identifier = $1", [id], function(err, result) {
      console.log(result)
      if (err) {
        console.log("pg error: " + err);
      } else if (!result || 0 === result.rows.length) {
        console.log("inserting");
        user = new User(req.session.identifier);
        user.create();
      } else {
        console.log("updating");
        user = new User(req.session.identifier);
        user.firstlogin = result.rows[0].firstlogin;
        user.one = result.rows[0].one;
        user.two = result.rows[0].two;
        user.three = result.rows[0].three;
        user.four = result.rows[0].four;
        user.five = result.rows[0].five;
        user.save();

        console.log("pg date: " + pg_date(now));
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
        });
      }
    });
  };
  
  User.prototype.create = function() {
    client.query("INSERT INTO users(identifier, firstlogin, lastlogin) values($1, $2, $3)", [this.id, this.firstlogin, this.lastlogin]);
    client.query("INSERT INTO dates(identifier, cal_date) values($1, $2)", [this.id, pg_date(new Date())]);
  };
  
  User.prototype.save = function() {
    client.query("UPDATE users SET lastlogin=$2 WHERE identifier = $1", [this.id, this.lastlogin]);
  };
  
};
