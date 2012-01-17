module.exports = function(app, client){
  app.post('/star', function(req, res) {
    req.session["star_" + req.body.star] = (req.body.on === 'true');
    if(req.session.identifier) {
      client.query("UPDATE dates SET star_" + req.body.star + "=$1 WHERE identifier = $2 AND cal_date = $3", [(req.body.on === 'true'), req.session.identifier, pg_date(new Date())]);
    }
    res.send();
  });
};