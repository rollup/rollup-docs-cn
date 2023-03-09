// 动态导入
// Rollup支持通过动态导入
// 利用主机系统的导入机制
// 进行自动分块和延迟加载。
import square from './square.js';

// 直接使用一些数学方法
console.log(square(2));

// 动态导入其余部分
import('./maths.js').then(maths => {
	console.log(maths.square(5));
	console.log(maths.cube(5));
});
