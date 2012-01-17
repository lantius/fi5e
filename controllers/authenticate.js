/* Module dependencies */
var openid = require('openid');

module.exports = function(app){
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
};