System.register([], (function (exports) {
	'use strict';
	return {
		execute: (function () {

			console.log('effect');

			const big = exports("b", '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890');

			const small = exports("s", '0');

		})
	};
}));
