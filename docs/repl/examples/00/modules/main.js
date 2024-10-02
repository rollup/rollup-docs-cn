<<<<<<< HEAD
// 除屑优化
import { cube } from './maths.js';
=======
// NAMED EXPORTS
// There are many ways to export bindings
// from an ES2015 module
export var foo = 1;
>>>>>>> d3c000f4fd453e39a354299f0cfaa6831f56d7d8

export function bar() {
	// try changing this to `foo++`
	// when generating CommonJS
	return foo;
}

function baz() {
	return bar();
}

export * from './qux';
export { baz };
