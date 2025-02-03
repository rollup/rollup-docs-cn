(function (factory) {
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
})((function () { 'use strict';

	// effect
	console.log( 'effect' );
	console.log( 'effect' );
	console.log( 'effect' ) || {};
	console.log( 'effect' ) && {};

	const foo = {
		get effect () {
			console.log( 'effect' );
		}};

	// effect
	(foo).effect;
	(foo).effect;

	// effect
	(null).foo = 1;
	(null).foo = 1;

	// effect
	(true)();
	(false)();
	((() => console.log( 'effect' )))();
	((() => console.log( 'effect' )))();

	// effect
	(true)()();
	(false)()();
	((() => () => console.log( 'effect' )))()();
	((() => () => console.log( 'effect' )))()();

}));
