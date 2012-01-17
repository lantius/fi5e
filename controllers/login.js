module.exports = function(app){
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
};
