import square from './square.js';

// 两个入口模块都使用的所有内容都将成为一个单独的代码块，
// 由两个入口代码块导入
// 以避免代码重复
export default function cube(x) {
	return square(x) * x;
}
