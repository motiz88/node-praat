var assert = require('assert');
var fs = require('fs');
var praat = require('./');

assert(fs.existsSync(praat), 'Praat not found at ' + praat);
console.log('Praat found at ' + praat);