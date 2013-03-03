'use strict';

var readline   = require('readline');
var moment     = require('moment');
var fs         = require('fs');

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
        zone = parts.slice(0, 1);
        data.zones[zone] = data.zones[zone] || [];
        data.zones[zone].push(parseZone(parts.slice(1)));
        break;
      case 'Rule':
        rule = parts.slice(0, 1);
        data.rules[rule] = data.rules[rule] || [];
        data.rules[rule].push(parseRule(parts.slice(1)));
        break;
      case 'Link':
        data.zones[parts[1]] = parts[0];
        break;
    }
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
  'Dec': 11
};

function dashToNull(str){
  if (!str) return null;
  return str.trim() === '-' ? null : str;
}

function parseZone(parts){
  parts = parts.slice();

  var offset = parts.shift();
  var rule   = parts.shift();
  var format = parts.shift();
  var year   = parts.shift();
  var month  = parts.shift();
  var date   = parts.shift();
  var time   = parts.shift();

  return [
    parseOffset(offset),
    dashToNull(rule),
    format,
    parseTime(year, month, date, time)
  ];
}

function parseOffset(str){
  var negative = str[0] === '-';
  if (negative) str = str.slice(1);

  var parts = str.split(':');

  var hours   = parseInt(parts.shift(), 10) || 0;
  var minutes = parseInt(parts.shift(), 10) || 0;
  var seconds = parseInt(parts.shift(), 10) || 0;

  var duration = moment.duration({
    hours: hours,
    minutes: minutes,
    seconds: seconds
  });

  return negative ? duration.asMinutes() : -duration.asMinutes();
}

function parseTime(year, month, date, time){
  if (!year) return null;
  var timeParts = (time || '').split(':');

  var hours   = timeParts.shift();
  var minutes = timeParts.shift();

  var timestamp = moment.utc(0);
  timestamp.year(parseInt(year, 10));
  timestamp.month(month ? MONTH_CODES[month] : 11);
  timestamp.date(date ? parseInt(date, 10) : (month ? 1 : timestamp.daysInMonth()));
  timestamp.hours(hours ? parseInt(hours, 10) : 0);
  timestamp.minutes(minutes ? parseInt(minutes, 10) : 0);

  return timestamp.valueOf();
}

function parseDuration(str){
  var parts   = str.split(':');
  var hours   = parseInt(parts.shift(), 10) || 0;
  var minutes = parseInt(parts.shift(), 10) || 0;

  return moment.duration({
    hours: hours,
    minutes: minutes
  }).asMinutes();
}

function parseRule(parts){
  parts = parts.slice();

  var from   = parts.shift();
  var to     = parts.shift();
  var type   = parts.shift();
  var month  = parts.shift();
  var on     = parts.shift();
  var at     = parts.shift();
  var save   = parts.shift();
  var letter = parts.shift();

  return [
    parseInt(from, 10),
    parseInt(to, 10) || to,
    dashToNull(type),
    MONTH_CODES[month],
    on,
    at,
    parseDuration(save),
    dashToNull(letter)
  ];
}