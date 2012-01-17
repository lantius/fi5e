var pg = require('pg').native;
var postgresConnectionString = process.env.DATABASE_URL || "tcp://postgres:ps2mouse@localhost:5432/heroku";

module.exports = {
  client: new pg.Client(postgresConnectionString),

  init: function() {
    this.client.connect();
    
    var tables = {
      users: "identifier varchar(255), firstlogin bigint, lastlogin bigint, one varchar(255), two varchar(255), three varchar(255), four varchar(255), five varchar(255)",
      dates: "identifier varchar(255), cal_date date, one varchar(255), two varchar(255), three varchar(255), four varchar(255), five varchar(255), star_one boolean NOT NULL DEFAULT FALSE, star_two boolean NOT NULL DEFAULT FALSE, star_three boolean NOT NULL DEFAULT FALSE, star_four boolean NOT NULL DEFAULT FALSE, star_five boolean NOT NULL DEFAULT FALSE"
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
    
    create_table(this.client, "users");
    create_table(this.client, "dates");
  },
  
  pg_date: function(now) {
      return now.getFullYear() + '-' + now.getMonth() + 1 + '-' + now.getDate();
  }
};

// module.exports = function(){
//   var 
//   client.connect();
//   
//   var 
// 

// 
//   var 
// };
