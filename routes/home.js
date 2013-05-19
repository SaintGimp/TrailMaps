
/*
 * GET home page.
 */

module.exports = function(app) {
	app.get('/', function(req, res) {
    res.redirect('/trails/pct/maps');
  });
  app.get('/trails/pct/maps', exports.maps);
};

exports.maps = function(req, res){
  res.render('maps');
};
