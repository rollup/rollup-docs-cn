// maths.js

// 这个函数并没有被外部模块使用
// 所以 Rollup 会将它从打包产物中排除掉...
export const square = x => x * x;

// 这个函数被外部模块使用了
// 把这个函数重写为 `square(x) * x`
// 看看会发生什么。
export const cube = x => x * x * x;

// 这个“副作用”创建了一个全局变量
// 所以它不会被移除。
window.effect1 = 'created';

const includeEffect = false;
if (includeEffect) {
	// 另一方面来说，这将永远不会被执行
	// 所以会被移除。
	window.effect1 = 'not created';
}
