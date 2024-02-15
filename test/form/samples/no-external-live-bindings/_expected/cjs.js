'use strict';

var external1 = require('external1');
var external2 = require('external2');

function _interopNamespaceDefault(e) {
	var n = Object.create(null);
	if (e) {
		for (var k in e) {
			n[k] = e[k];
		}
	}
	n.default = e;
	return Object.freeze(n);
}

const dynamic = Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefault(require('external3')); });

exports.external1 = external1.external1;
exports.dynamic = dynamic;
Object.prototype.hasOwnProperty.call(external2, '__proto__') &&
	!Object.prototype.hasOwnProperty.call(exports, '__proto__') &&
	Object.defineProperty(exports, '__proto__', {
		enumerable: true,
		value: external2['__proto__']
	});

Object.keys(external2).forEach(function (k) {
	if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) exports[k] = external2[k];
});
