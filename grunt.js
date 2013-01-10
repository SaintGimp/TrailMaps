#!/usr/bin/env node

module.exports = function (grunt) {
    "use strict";

    // Project configuration.
    grunt.initConfig({
        lint: {
            all: ["grunt.js", "app.js", "test/**/*.js", "public/js/*.js", "routes/**/*.js"]
        },
        jshint: {
            options: {
                // Predefined globals whom JSHint will ignore.
                "browser"       : true,  // Standard browser globals e.g. `window`, `document`.
                "couch"         : false,
                "dojo"          : false,
                "jquery"        : true,
                "mootools"      : false,
                "node"          : true,
                "prototypejs"   : false,
                "rhino"         : false,
                "wsh"           : false,

                // Development.
                "debug"         : false, // Allow debugger statements e.g. browser breakpoints.
                "devel"         : false, // Allow developments statements e.g. `console.log();`.


                // EcmaScript 5.
                "es5"           : true, // Allow EcmaScript 5 syntax.
                "globalstrict"  : false, // Allow global "use strict" (also enables 'strict').
                "strict"        : false, // Require `use strict` pragma  in every file.


                // The Good Parts.
                "asi"           : false, // Tolerate Automatic Semicolon Insertion (no semicolons).
                "bitwise"       : true,  // Prohibit bitwise operators (&, |, ^, etc.).
                "boss"          : false, // Tolerate assignments inside if, for & while. Usually conditions & loops are for comparison, not assignments.
                "curly"         : true,  // Require {} for every new block or scope.
                "eqeqeq"        : true,  // Require triple equals i.e. `===`.
                "eqnull"        : true,  // Tolerate use of `== null`.
                "evil"          : false, // Tolerate use of `eval`.
                "expr"          : false, // Tolerate `ExpressionStatement` as Programs.
                "forin"         : true,  // Prohibit `for in` loops without `hasOwnPrototype`.
                "immed"         : true,  // Require immediate invocations to be wrapped in parens e.g. `( function(){}() );`
                "latedef"       : true,  // Prohibit variable use before definition.
                "laxbreak"      : false, // Tolerate unsafe line breaks e.g. `return [\n] x` without semicolons.
                "loopfunc"      : false, // Allow functions to be defined within loops.
                "noarg"         : true,  // Prohibit use of `arguments.caller` and `arguments.callee`.
                "regexdash"     : true,  // Tolerate unescaped last dash i.e. `[-...]`.
                "regexp"        : false, // Prohibit `.` and `[^...]` in regular expressions.
                "scripturl"     : false, // Tolerate script-targeted URLs.
                "shadow"        : false, // Allows re-define variables later in code e.g. `var x=1; x=2;`.
                "supernew"      : false, // Tolerate `new function () { ... };` and `new Object;`.
                "undef"         : true,  // Require all non-global variables be declared before they are used.
                "unused"        : false, // Prohibit unused variables

                // Personal styling prefrences.
                "camelcase"     : true,  // Require all variables to be camelCase or UPPER
                "newcap"        : true,  // Require capitalization of all constructor functions e.g. `new F()`.
                "noempty"       : true,  // Prohipit use of empty blocks.
                "nomen"         : false, // Prohibit use of initial or trailing underbars in names.
                "nonew"         : true,  // Prohibit use of constructors for side-effects.
                "onevar"        : false, // Allow only one `var` statement per function.
                "plusplus"      : false, // Prohibit use of `++` & `--`.
                "sub"           : false, // Tolerate all forms of subscript notation besides dot notation e.g. `dict['key']` instead of `dict.key`.
                "trailing"      : true,  // Prohibit trailing whitespaces.
                "white"         : false  // Check against strict whitespace and indentation rules.
            },
            globals: {
                exports: true,
                Ext: false,
                console: false,
                alert: false,
                prompt: false,
                describe: false,
                it: false,
                angular: false
            }
        },
        simplemocha: {
            all: { src: 'test/**/*.js' },
            options: {
                globals: ['should'],
                timeout: 3000,
                ignoreLeaks: false,
                grep: '*-test',
                ui: 'bdd',
                reporter: 'dot'
            }
        }
    });

    // For this to work, you need to have run `npm install grunt-simple-mocha`
    grunt.loadNpmTasks('grunt-simple-mocha');

    // Default task.
    grunt.registerTask('default', ['lint', 'simplemocha']);
};