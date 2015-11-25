var fs = require('fs');
var fse = require('fs-extra')
var http = require('./follow-redirects-http-https');
var path = require('path');

var praatRepo = 'https://github.com/praat/praat/releases/download/';
var praatExecName = require('./lib/info').praatExecName;

module.exports = function downloadAndInstallPraat(cb, osinfo) {
	if (!osinfo) {
		osinfo = require('./lib/info').getOsInfo();
	}

	install(osinfo, cb || function(err) {
		if (err)
			throw err;
	});
};
module.exports.praatDownloadUrl = praatDownloadUrl;


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
	return praatRepo + 'v' + version + '/' + praatPackageName(osinfo, version);
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
		var praatUnpackedExecPath = path.resolve(unpackDir, execFilename);
		var praatTargetExecPath = path.resolve(targetDir, execFilename);

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

function install(osinfo, cb) {
	if (typeof cb !== 'function')
		cb = function() {};

	var myPackageJson = require('./package.json');
	var version = myPackageJson.praatVersion;
	var url = praatDownloadUrl(osinfo, version);

	var workDir = path.resolve(__dirname, 'dl');
	var targetDir = path.resolve(__dirname, 'node_modules', '.bin');
	var pkgfile = path.resolve(workDir, praatPackageName(osinfo, version));
	var execFilename = praatExecFilename(osinfo, version);
	var praatTargetExecPath = path.resolve(targetDir, execFilename);
	if (fs.existsSync(praatTargetExecPath)) {
		cb();
		return;
	}


	function workDirCleanup() {
		setImmediate(function() {
			fse.removeSync(workDir);
		});
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