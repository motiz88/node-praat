var os = require('os');

module.exports.getOsInfo = function getOsInfo() {
    return {
        isWindows: (/win/i).test(os.type()),
        isMac: (/darwin/i).test(os.type()),
        isLinux: (/linux/i).test(os.type()),
        is32Bit: (/32/).test(os.arch()),
        is64Bit: (/64/).test(os.arch())
    };
};

module.exports.praatExecName =function praatExecName(osinfo) {
    if (osinfo.isWindows)
        return 'praatcon';
    else
        return 'praat';
};


module.exports.praatRealExecName = function praatRealExecName(osinfo) {
    return praatExecName(osinfo) + (osinfo.isWindows ? '.exe' : '');
};
