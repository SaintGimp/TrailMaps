
/*
 * GET home page.
 */

module.exports = function(app){
	app.get('/', exports.index);
};

exports.index = function(req, res){
  res.render('index');
};
