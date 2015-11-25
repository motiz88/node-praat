var assert = require('assert');
var fs = require('fs');
var url = require('url');
var chai = require('chai');
chai.use(require('chai-string'));

var praat = require('../');
var myPackageJson = require('../package.json');
var installCore = require('../install-core');

var expect = chai.expect;
var version = myPackageJson.praatVersion;
var child_process = require('child_process');

describe('installed praat executable', function() {
	before(function(done) {
		installCore(done);
	});
	it('should exist', function() {
		expect(fs.existsSync(praat)).to.be.true;
	});
	it('should be executable', function() {
		var spawnResult = child_process.spawnSync(praat, ['--version']);
		expect(spawnResult.error).to.be.empty;
	});
	it('should be version ' + version, function() {
		var spawnResult = child_process.spawnSync(praat, ['--version']);
		expect(spawnResult.error).to.be.empty;
		expect(spawnResult.stderr.toString()).to.be.empty;
		var reportedPraatVersion = spawnResult.stdout.toString();
		expect(reportedPraatVersion).to.be.a('string').and.startWith('Praat ' + version);
	});	
});

describe('praat version', function() {	
	it('should be defined in package.json', function() {
		expect(myPackageJson).to.be.an('object')
			.with.property('praatVersion')
			.which.is.a('string')
			.and.is.not.empty;
	});
});

describe('praat ' + version + ' download url', function() {
	['linux32', 'linux64', 'win32', 'win64'].forEach(function(os) {
		it('should be valid for ' + os, function() {
			var osinfo = require('../misc/os_' + os);
			var praatUrl = installCore.praatDownloadUrl(osinfo, version);
			expect(praatUrl).to.be.a('string').and.not.be.empty;
			praatUrl = url.parse(praatUrl);
			expect(praatUrl).to.have.property('protocol').which.is.a('string').and.matches(/^https?:/);
		});
	});
});

console.log('Praat found at ' + praat);