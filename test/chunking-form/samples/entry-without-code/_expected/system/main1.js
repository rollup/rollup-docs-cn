System.register(['./main2.js'], (function () {
	'use strict';
	var foo;
	return {
		setters: [function (module) {
			foo = module.foo;
		}],
		execute: (function () {

			console.log(foo);

		})
	};
}));
