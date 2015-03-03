# node-praat
A cross-platform [NPM][1] installer for [Praat][2], for use in [node.js][3] programs. This package is aimed at developers/users of Praat scripts wishing to integrate them easily with Node.

## How to install

```bash
npm install motiz88/node-praat
```

## Usage

```javascript
var praat = require('praat');
var spawn = require('child_process').spawn;

spawn(praat, ['my_script.praat'], /* etc */);
```

## System notes
On Windows and Linux, the installer will grab the appropriate Praat binary from the Praat website. Both 32-bit and 64-bit OSs are supported. Other OSs are currently not supported.

The installer does not ensure that Praat's own dependencies are installed (on Linux these are GTK, asound and libc >= 2.11 as the Praat website notes [here][4]).

On Windows, you get Praatcon (the console variant) rather than Praat (the GUI application).

[1]: https://www.npmjs.com/
[2]: http://www.fon.hum.uva.nl/praat
[3]: http://nodejs.org/
[4]: http://www.fon.hum.uva.nl/praat/download_linux.html
