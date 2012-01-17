/* Module dependencies */
var openid = require('openid')

module.exports = function(app, User) {
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
        user = User.get(req.session.identifier);
        console.log(user);
        res.redirect('/');
      }
    });
  });
  
};