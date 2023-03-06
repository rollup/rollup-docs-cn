---
title: ES 模块语法
---

# {{ $frontmatter.title }}

[[toc]]

以下内容旨在作为对 [ES2015 规范](https://www.ecma-international.org/ecma-262/6.0/) 中定义的模块行为的轻量级参考，因为正确理解导入和导出语句对于成功使用 Rollup 是必要的。

## 导入 {#importing}

导入的值不能被重新分配，尽管导入的对象和数组 _可以_ 被 mutated（并且导出模块和任何其他导入将受到 mutation 的影响）。也就是说，它们的行为类似于 const 声明。

### 具名导入 {#named-imports}

使用 源模块中的原始名称 进行导入。

```js
import { something } from './module.js';
```

从源模块导入特定项目，并在导入时分配自定义名称。

```js
import { something as somethingElse } from './module.js';
```

### 名称空间导入 {#namespace-imports}

将源模块中的所有内容作为一个对象导入，该对象将所有源模块的 named exports 公开为属性和方法。

```js
import * as module from './module.js';
```

从上面的示例中，`something` 将作为属性附加到导入的对象上，例如 `module.something`。如果存在默认导出，则可以通过 `module.default` 访问它。

### 默认导入 {#default-import}

导入源模块的 **default export**。

```js
import something from './module.js';
```

### 无命名导入 {#empty-import}

加载模块代码，但不要使任何新对象可用。

```js
import './module.js';
```

这对于 polyfill 很有用，或者当导入代码的主要目的是处理 prototypes 时。

### 动态导入 {#dynamic-import}

使用 [动态导入 API](https://github.com/tc39/proposal-dynamic-import#import) 导入模块。

```js
import('./modules.js').then(({ default: DefaultExport, NamedExport }) => {
	// 用这个模块做点什么...
});
```

这对于代码分解应用程序和动态使用模块非常有用。

## 导出 {#exporting}

### 具名导出 {#named-exports}

导出先前声明的值：

```js
const something = true;
export { something };
```

导出时重命名：

```js
export { something as somethingElse };
```

声明后立即导出值：

```js
// `var`, `let`, `const`, `class`, 和 `function` 都是有效的
export const something = true;
```

### 默认导出 {#default-export}

导出单个值作为源模块的默认导出：

```js
export default something;
```

仅当您的源模块只有一个导出时才推荐这种做法。

尽管规范允许，但在同一个模块中混合默认和命名导出是不好的做法。

## 绑定是如何工作的？ {#how-bindings-work}

ES 模块导出 _live bindings_，而不是值，因此可以在初始导入后更改值。

[查看示例](../repl/index.md?shareable=JTdCJTIyZXhhbXBsZSUyMiUzQW51bGwlMkMlMjJtb2R1bGVzJTIyJTNBJTVCJTdCJTIyY29kZSUyMiUzQSUyMmltcG9ydCUyMCU3QiUyMGNvdW50JTJDJTIwaW5jcmVtZW50JTIwJTdEJTIwZnJvbSUyMCcuJTJGaW5jcmVtZW50ZXIuanMnJTNCJTVDbiU1Q25jb25zb2xlLmxvZyhjb3VudCklM0IlMjAlMkYlMkYlMjAwJTVDbmluY3JlbWVudCgpJTNCJTVDbmNvbnNvbGUubG9nKGNvdW50KSUzQiUyMCUyRiUyRiUyMDElMjIlMkMlMjJpc0VudHJ5JTIyJTNBdHJ1ZSUyQyUyMm5hbWUlMjIlM0ElMjJtYWluLmpzJTIyJTdEJTJDJTdCJTIyY29kZSUyMiUzQSUyMmV4cG9ydCUyMGxldCUyMGNvdW50JTIwJTNEJTIwMCUzQiU1Q24lNUNuZXhwb3J0JTIwZnVuY3Rpb24lMjBpbmNyZW1lbnQoKSUyMCU3QiU1Q24lMjAlMjBjb3VudCUyMCUyQiUzRCUyMDElM0IlNUNuJTdEJTIyJTJDJTIyaXNFbnRyeSUyMiUzQWZhbHNlJTJDJTIybmFtZSUyMiUzQSUyMmluY3JlbWVudGVyLmpzJTIyJTdEJTVEJTJDJTIyb3B0aW9ucyUyMiUzQSU3QiUyMmFtZCUyMiUzQSU3QiUyMmlkJTIyJTNBJTIyJTIyJTdEJTJDJTIyZm9ybWF0JTIyJTNBJTIyZXMlMjIlMkMlMjJnbG9iYWxzJTIyJTNBJTdCJTdEJTJDJTIybmFtZSUyMiUzQSUyMm15QnVuZGxlJTIyJTdEJTdE):

```js
// incrementer.js
export let count = 0;

export function increment() {
	count += 1;
}
```

```js
// main.js
import { count, increment } from './incrementer.js';

console.log(count); // 0
increment();
console.log(count); // 1

count += 1; // Error - 只有 incrementer.js 可以更改这个变量
```
