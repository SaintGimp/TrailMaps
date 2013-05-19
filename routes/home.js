
/*
 * GET home page.
 */

module.exports = function(app) {
	app.get('/', function(req, res) {
    res.redirect('/trails/pct/maps/bing');
  });
  app.get('/trails/pct/maps/:mapName', exports.maps);
};

exports.maps = function(req, res) {
  // TODO: 404 if it's not a map name we recognize
  // TODO: allow no map name, default to Bing
  res.render('maps', {
    mapName: req.params.mapName,
    baseMapUrl: '/trails/pct/maps'
  });
};
