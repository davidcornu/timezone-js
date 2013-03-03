'use strict';

var async = require('async');
var path  = require('path');

var downloader = require('./downloader');
var parser     = require('./parser');

var olsonFiles = [
  'africa',
  'antarctica',
  'asia',
  'australasia',
  'backward',
  'etcetera',
  'europe',
  'northamerica',
  'pacificnew',
  'southamerica'
];

exports.run = function(callback){
  var q = [], results;

  q.push(downloader.setup);

  q.push(downloader.download);

  q.push(function(done){
    async.map(olsonFiles, function(file, next){
      parser.parseFile(path.join(downloader.tmpdir, file), next);
    }, function(err, res){
      results = res;
      done(err);
    });
  });

  q.push(downloader.cleanup);

  async.series(q, function(err){
    if (err) return callback(err);
    callback(null, results);
  });
};