#!/usr/bin/env node

module.exports = function (grunt) {
    "use strict";

    // Project configuration.
    grunt.initConfig({
        jshint: {
            all: { src: ["Gruntfile.js", "app.js", "**/*.js", "!public/js/lib/**/*.js", "!public/bootstrap/**/*.js", "!node_modules/**/*.js", ] },
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
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-simple-mocha');

    // Default task.
    grunt.registerTask('default', ['jshint', 'simplemocha']);
};