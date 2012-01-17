module.exports = function(app, client){
  app.post('/thing', function(req, res) {
    if(req.session.identifier) {
      client.query("UPDATE users SET " + req.body.thing + "=$2 WHERE identifier = $1", [req.session.identifier, req.body.desc]);
    }
    req.session[req.body.thing]  = req.body.desc;
    res.send();
  });
};