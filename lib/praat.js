var info = require('./info');
var path = require('path');
module.exports = [__dirname, 'node_modules', 'bin', info.praatRealExecName(info.getOsInfo())].join(path.sep);
