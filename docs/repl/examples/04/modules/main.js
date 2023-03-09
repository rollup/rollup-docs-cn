// 动态名称空间
// 在某些情况下，直到实际运行代码之前，你不知道哪些代码块将会被导出。
// 在这些情况下
// Rollup会创建一个用于动态查找的命名空间对象
import * as constants from './constants';

for (const key of Object.keys(constants)) {
	console.log(`The value of ${key} is ${constants[key]}`);
}
