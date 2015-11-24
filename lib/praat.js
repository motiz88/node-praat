var info = require('./info');
var path = require('path');
var myPackageJson = require('../package.json');
var version = myPackageJson.praatVersion;
module.exports = [__dirname, '..', 'node_modules', '.bin', info.praatRealExecName(info.getOsInfo(), version)].join(path.sep);
