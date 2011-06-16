var convert = require('base-converter');

console.log('Méthodes', Object.keys(convert));
console.log('1337 en base 16 = %s', convert.decToHex(1337));
console.log('1337 en base 36 = %s', convert.decTo36(1337));
console.log('1337 en base 62 = %s', convert.decTo62(1337));

console.log("Connect version: %s", require('connect').version);
