// 默认导出
// 从“入口模块”默认导出的内容会被打包后导出
import answer from './answer.js';

export default () => console.log('the answer is ' + answer);
