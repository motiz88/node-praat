var fs = require('fs');
var fse = require('fs-extra')
var http = require('http');
var path = require('path');

var praatRepo = 'http://www.fon.hum.uva.nl/praat/';

var getOsInfo = require('./lib/info').getOsInfo;
if (process.argv[2] === 'osinfo' && process.argv.length >= 4)
    getOsInfo = function() {
        return require(process.argv[3]);
    }

var praatExecName = require('./lib/info').praatExecName;

function execFileExt(osinfo) {
    if (osinfo.isWindows)
        return '.exe';
    else if (osinfo.isLinux)
        return '';
    else
        throw new Error('Sorry, the installer does not support this OS.');
}

function praatPlatformPkgSuffix(osinfo) {
    if (osinfo.isWindows && osinfo.is32Bit)
        return '_win32.zip';
    else if (osinfo.isWindows && osinfo.is64Bit)
        return '_win64.zip';
    else if (osinfo.isLinux && osinfo.is32Bit)
        return '_linux32.tar.gz';
    else if (osinfo.isLinux && osinfo.is64Bit)
        return '_linux64.tar.gz';
    else
        throw new Error('Sorry, the installer does not support this OS.');
}

function praatPackageName(osinfo, version) {
    var rawVersion = version.replace(/\./g, '');
    var praat = praatExecName(osinfo, version);
    return praat + rawVersion + praatPlatformPkgSuffix(osinfo, version);
}

function praatDownloadUrl(osinfo, version) {
    return praatRepo + praatPackageName(osinfo, version);
}

function praatExecFilename(osinfo, version) {
    return praatExecName(osinfo, version) + execFileExt(osinfo);
}

function unpack(pkgfile, destDir, cb) {
    if (typeof cb !== 'function')
        cb = function() {};

    fse.ensureDirSync(destDir);
    try {
        if ((/\.zip$/i).test(pkgfile)) {
            var unzip = require('unzip');
            fs
                .createReadStream(pkgfile)
                .pipe(unzip.Extract({
                    path: destDir
                }))
                .on('error', cb)
                .on('close', cb);
        } else if ((/\.tar\.gz$/i).test(pkgfile)) {
            var gunzip = require('zlib').createGunzip();
            var tar = require('tar');
            fs
                .createReadStream(pkgfile)
                .pipe(gunzip)
                .pipe(tar.Extract({
                    path: destDir
                }))
                .on('error', cb)
                .on('close', cb);
        }
    } catch (e) {
        cb(e);
    }
}

function installPkgFile(pkgfile, targetDir, osinfo, version, cb) {
    if (typeof cb !== 'function')
        cb = function() {};
    try {

        var unpackDir = path.dirname(pkgfile);

        fse.ensureDirSync(targetDir);

        var execFilename = praatExecFilename(osinfo, version);
        var praatUnpackedExecPath = unpackDir + path.sep + execFilename;
        var praatTargetExecPath = targetDir + path.sep + execFilename;

        unpack(pkgfile, unpackDir, function(err) {
            try {
                if (err)
                    throw err;

                if (!fs.existsSync(praatUnpackedExecPath))
                    throw new Error("Could not find praat executable after unpacking.");

                fse.copySync(praatUnpackedExecPath, praatTargetExecPath);

                console.log(praatTargetExecPath);

                cb();
            } catch (e) {
                cb(e);
            }
        });
    } catch (e) {
        cb(e);
    }
}

function install(cb) {
    if (typeof cb !== 'function')
        cb = function() {};

    var myPackageJson = require('./package.json');
    var version = myPackageJson.praatVersion;
    var osinfo = getOsInfo();
    var url = praatDownloadUrl(osinfo, version);

    var workDir = __dirname + path.sep + 'dl';
    var targetDir = __dirname + path.sep + 'node_modules/.bin';
    var pkgfile = workDir + path.sep + praatPackageName(osinfo, version);
    var execFilename = praatExecFilename(osinfo, version);
    var praatTargetExecPath = targetDir + path.sep + execFilename;
    if (fs.existsSync(praatTargetExecPath)) {
        cb();
        return;
    }


    function workDirCleanup() {
        setImmediate(function() {fse.removeSync(workDir);});
    }

    fse.ensureDirSync(workDir);

    try {
        download(url, pkgfile, function(err) {
            try {
                if (err)
                    throw err;
                installPkgFile(pkgfile, targetDir, osinfo, version, function(err) {
                    try {
                        if (err)
                            throw err;
                        if (!fs.existsSync(praatTargetExecPath))
                            throw new Error('Installation failed.');
                        workDirCleanup();
                        cb();
                    } catch (e) {
                        workDirCleanup();
                        cb(e);
                    }
                });
            } catch (e) {
                workDirCleanup();
                cb(e);
            }
        });
    } catch (e) {
        workDirCleanup();
        cb(e);
    }
}

function download(url, dest, cb) {
    console.log('Downloading ' + url);
    var file = fs.createWriteStream(dest);
    var request = http.get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close(cb); // close() is async, call cb after close completes.
        });
    }).on('error', function(err) { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        if (cb) cb(err);
    });
}

module.exports = {
    install: install
};

install(function(err) {
    if (err)
        throw err;
});