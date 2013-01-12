/*
 * Serve JSON to our AngularJS client
 */

module.exports = function(app){
	app.get('/api/name', exports.name);

	return exports;
};

exports.name = function (req, res) {
  res.json({
    name: 'Bob'
  });
};