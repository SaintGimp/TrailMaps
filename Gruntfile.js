#!/usr/bin/env node

module.exports = function (grunt) {
  "use strict";

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: { src: [
        "Gruntfile.js",
        "app.js",
        "**/*.js",
        "!public/js/lib/**/*.js",
        "!test/lib/**/*.js",
        "!public/bootstrap/**/*.js",
        "!node_modules/**/*.js"
      ]},
      options: {
        jshintrc: ".jshintrc"
      }
    },

    simplemocha: {
      all: { src: 'test/server/**/*.js' },
      options: {
        globals: ['should'],
        timeout: 3000,
        ignoreLeaks: false,
        //grep: '*-test',
        ui: 'bdd',
        reporter: 'dot'
      }
    },

    testem: {
      options : {
        launch_in_ci : [
          'phantomjs'
        ],
        "test_page": "test/client/runner.html",
        "routes": {
          "/js": "public/js",
          "/stylesheets": "public/stylesheets",
          "/test": "test"
        },
        "src_files": [
          "public/js/*.js",
          "test/client/*.js"
        ],
        "serve_files": [
        ]
      },
      main : {
        files : {
          'test/client/tests.tap': [
            'test/client/runner.html'
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-testem');

  // Default task.
  grunt.registerTask('default', ['jshint', 'simplemocha', 'testem']);
};