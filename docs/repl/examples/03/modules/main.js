// 静态名称空间
// ES6 模块允许你
// 将另一个模块的所有导出都作为命名空间导入...
import * as assert from './assert';

// ...但我们可以静态地
// 将其解析为原始函数定义
assert.equal(1 + 1, 2);
