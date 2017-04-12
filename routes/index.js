/**
 * In Node, you can require a folder as in require("./somefolder").
 * Node by default will look in that folder for a file with the name index.js
 * and if it exists it will use it as a module. If the folder contains other files
 * with exports then require them in the index.js file to export all the functionality
 * through the 1 index.js file. That is what this index file is doing. It is exposing all
 * routes defined in all the files in the routes directory by requiring those files.
*/

var app = require ("../server").app;

require("./api")(app);
require("./home")(app);
