var downloadAndInstallPraat = require('./install-core');

if (process.argv[2] === 'osinfo' && process.argv.length >= 4)
    downloadAndInstallPraat(require(process.argv[3]));
else
    downloadAndInstallPraat();
