var fs = require('fs');

function onReadFile (filename) {
  return function (err, content) {
    console.log('Lecture "%s": %s', filename, err ? ('Erreur = ' + (err.message || err)) : content);
  }
}

fs.readFile('fail', onReadFile('fail'));
fs.readFile('README', onReadFile('README'));
