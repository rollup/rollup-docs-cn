<<<<<<< HEAD
// 除屑优化
import { cube } from './maths.js';
=======
// NAMED EXPORTS
// There are many ways to export bindings
// from an ES2015 module
export var foo = 1;
>>>>>>> 5d91210dd1dc78205f28ffbcfe17fd79eb25ee7b

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
