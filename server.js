var m1 = require('./module1'),
    m2 = require('./module2'),
    m3 = require('./module3');

console.log('foo() → %s', m1.foo());
m2.hello(m3.who);
