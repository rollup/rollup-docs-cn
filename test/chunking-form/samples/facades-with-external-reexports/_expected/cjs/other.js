'use strict';

var external = require('external');

console.log('other');

console.log('main');

Object.defineProperty(exports, 'bar', {
	enumerable: true,
	get: function () { return external.bar; }
});
