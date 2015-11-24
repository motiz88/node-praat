var os = require('os');

var getOsInfo = module.exports.getOsInfo = function getOsInfo() {
    return {
        isWindows: (/win/i).test(os.type()),
        isMac: (/darwin/i).test(os.type()),
        isLinux: (/linux/i).test(os.type()),
        is32Bit: (/32/).test(os.arch()),
        is64Bit: (/64/).test(os.arch())
    };
};

var praatExecName = module.exports.praatExecName = function praatExecName(osinfo, version) {
    if (version.match(/^\d+/)[0] >= 6) 
        return 'praat';
    if (osinfo.isWindows)
        return 'praatcon';
    else
        return 'praat';
};


var praatRealExecName = module.exports.praatRealExecName = function praatRealExecName(osinfo, version) {
    return praatExecName(osinfo) + (osinfo.isWindows ? '.exe' : '');
};
