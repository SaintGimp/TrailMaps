
/*
 * GET home page.
 */

module.exports = function(app){
	app.get('/', exports.index);
    app.get('/partials/:name', exports.partials);

	return exports;
};

exports.index = function(req, res){
  res.render('index');
};

exports.partials = function (req, res) {
  var name = req.params.name;
  res.render('partials/' + name);
};