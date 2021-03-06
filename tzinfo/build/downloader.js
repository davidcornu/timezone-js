'use strict';

var request = require('request');
var async   = require('async');
var spawn   = require('child_process').spawn;
var path    = require('path');
var fs      = require('fs.extra');

var url = 'http://www.iana.org/time-zones/repository/tzdata-latest.tar.gz';

var tmpdir = exports.tmpdir = path.resolve(__dirname, '../tmp');

exports.setup = function(done){ fs.mkdirp(tmpdir, done); };

exports.cleanup = function(done){ fs.rmrf(tmpdir, done); };

exports.download = function(done){
  var tar = spawn('tar', ['-xzf', '-'], {cwd: tmpdir});
  tar.stdout.pipe(process.stdout);
  tar.stderr.pipe(process.stderr);
  request(url).pipe(tar.stdin);
  tar.on('exit', done);
};

exports.getVersion = function(done){
  var makefile = path.join(tmpdir, 'Makefile');
  fs.exists(makefile, function(exists){
    if (!exists) return done(new Error(makefile + ' does not exist'));
    fs.readFile(makefile, 'utf8', function(err, body){
      if (err) return done(err);
      var matches = /VERSION=\s+([0-9a-b]+)/i.exec(body);
      done(null, matches[1]);
    });
  });
};