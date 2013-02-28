'use strict';

var downloader = require('./downloader');
var readline   = require('readline');
var moment     = require('moment');
var path       = require('path');
var fs         = require('fs');

var tmpdir  = downloader.tmpdir;
var datadir = exports.datadir = path.resolve(__dirname, '../data');

exports.parseFile = function(filename, callback){
  var reader = readline.createInterface({
    input: fs.createReadStream(filename, {encoding: 'utf8'}),
    output: 'ignore'
  });

  var data = {zones: {}, rules: {}};
  var rule, zone;

  function parseLine(line){
    // Remove extra spacing and line returns
    line = line.trimRight();

    // Ignore comments
    if (line.match(/^#.*/)) return;
    line = line.replace(/\s?#.*$/, '');

    // Ignore empty lines
    if (line.length === 0) return;

    // Normalize tabbed lines belonging to a zone
    if (line.match(/^\s/)) line = "Zone " + zone + line;

    var parts = line.split(/\s+/);
    var chunk = parts.shift();

    switch (chunk) {
      case 'Zone':
        zone = parts.shift();
        data.zones[zone] = data.zones[zone] || [];
        data.zones[zone].push(parseZone(parts));
        break;
      case 'Rule':
        rule = parts.shift();
        break;
      case 'Link':
        break;
    }

    // processZone
    // getBasicOffset

        // l = l.split("#")[0];
        // if (l.length > 3) {
        //   arr = l.split(/\s+/);
        //   chunk = arr.shift();
        //   //Ignore Leap.
        //   switch (chunk) {
        //     case 'Zone':
        //       zone = arr.shift();
        //       if (!_this.zones[zone]) {
        //         _this.zones[zone] = [];
        //       }
        //       if (arr.length < 3) break;
        //       //Process zone right here and replace 3rd element with the processed array.
        //       arr.splice(3, arr.length, processZone(arr));
        //       if (arr[3]) arr[3] = Date.UTC.apply(null, arr[3]);
        //       arr[0] = -getBasicOffset(arr[0]);
        //       _this.zones[zone].push(arr);
        //       break;
        //     case 'Rule':
        //       rule = arr.shift();
        //       if (!_this.rules[rule]) {
        //         _this.rules[rule] = [];
        //       }
        //       //Parse int FROM year and TO year
        //       arr[0] = parseInt(arr[0], 10);
        //       arr[1] = parseInt(arr[1], 10) || arr[1];
        //       //Parse time string AT
        //       arr[5] = parseTimeString(arr[5]);
        //       //Parse offset SAVE
        //       arr[6] = getBasicOffset(arr[6]);
        //       _this.rules[rule].push(arr);
        //       break;
        //     case 'Link':
        //       //No zones for these should already exist.
        //       if (_this.zones[arr[1]]) {
        //         throw new Error('Error with Link ' + arr[1] + '. Cannot create link of a preexisted zone.');
        //       }
        //       //Create the link.
        //       _this.zones[arr[1]] = arr[0];
        //       break;
        //   }
        // }
  }

  reader.on('line', parseLine);
  reader.on('close', function(){ callback(null, data); });
};

var MONTH_CODES = {
  'Jan': 0,
  'Feb': 1,
  'Mar': 2,
  'Apr': 3,
  'May': 4,
  'Jun': 5,
  'Jul': 6,
  'Aug': 7,
  'Sep': 8,
  'Oct': 9,
  'Nov': 10,
  'Dec': 11,
};

function parseZone(parts){
  var offset = parts.shift() || 0;
  var rule   = parts.shift();
  var format = parts.shift();
  var year   = parts.shift();
  var month  = parts.shift();
  var date   = parts.shift();
  var time   = parts.shift();

  return [
    parseOffset(offset),
    parseRule(rule),
    format,
    parseTime(year, month, date, time)
  ];
}

function parseOffset(str){
  var parts = str.split(':');

  var hours   = parseInt(parts.shift(), 10) || 0;
  var minutes = parseInt(parts.shift(), 10) || 0;
  var seconds = parseInt(parts.shift(), 10) || 0;

  var duration = moment.duration({
    hours: hours,
    minutes: minutes,
    seconds: seconds
  });

  return -duration.asMinutes();
}

function parseRule(rule){
  if (rule.trim() === '-') return null;
  return rule;
}

function parseTime(year, month, date, time){
  if (!year) return null;
  var timeParts = (time || '').split(':');

  var hours   = timeParts.shift();
  var minutes = timeParts.shift();

  var parts = [];
  parts.push(parseInt(year, 10));
  parts.push(MONTH_CODES[month] || 11);
  parts.push(date ? parseInt(date, 10) : 31);
  parts.push(hours ? parseInt(hours, 10) : 23);
  parts.push(minutes ? parseInt(minutes, 10) : 59);

  return moment.utc(parts).toDate().valueOf();
}


var africa = path.resolve(__dirname, './tmp/africa');
exports.parseFile(africa, function(err, data){
  console.log(JSON.stringify(data, null, '  '));
});