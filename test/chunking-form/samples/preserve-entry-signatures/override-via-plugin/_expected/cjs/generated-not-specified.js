'use strict';

const shared = 'shared';

console.log(shared);
Promise.resolve().then(function () { return require('./generated-dynamic4.js'); });
const unused = 42;

exports.shared = shared;
exports.unused = unused;
