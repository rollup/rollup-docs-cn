import cube from './cube.js';

// 这只被一个入口模块导入
// 并与该模块共享一个代码块
export default function hyperCube(x) {
	return cube(x) * x;
}
