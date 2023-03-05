---
title: ES Module Syntax
---

# {{ $frontmatter.title }}

[[toc]]

以下内容旨在作为对 [ES2015 规范](https://www.ecma-international.org/ecma-262/6.0/) 中定义的模块行为的轻量级参考，因为正确理解导入和导出语句对于成功使用 Rollup 是必要的。

## Importing

导入的值不能被重新分配，尽管导入的对象和数组 _可以_ 被 mutated（并且导出模块和任何其他导入将受到 mutation 的影响）。也就是说，它们的行为类似于 const 声明。

### Named Imports

使用 源模块中的原始名称 进行导入。

```js
import { something } from './module.js';
```

从源模块导入特定项目，并在导入时分配自定义名称。

```js
import { something as somethingElse } from './module.js';
```

### Namespace Imports

将源模块中的所有内容作为一个对象导入，该对象将所有源模块的 named exports 公开为属性和方法。

```js
import * as module from './module.js';
```

The `something` example from above would then be attached to the imported object as a property, e.g. `module.something`. If present, the default export can be accessed via `module.default`.

### Default Import

导入源模块的 **default export**。

```js
import something from './module.js';
```

### Empty Import

加载模块代码，但不要使任何新对象可用。

```js
import './module.js';
```

这对于 polyfill 很有用，或者当导入代码的主要目的是处理 prototypes 时。

### Dynamic Import

使用 [dynamic import API](https://github.com/tc39/proposal-dynamic-import#import) 导入模块。

```js
import('./modules.js').then(({ default: DefaultExport, NamedExport }) => {
	// do something with modules.
});
```

This is useful for code-splitting applications and using modules on-the-fly.

## Exporting

### Named exports

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
// this works with `var`, `let`, `const`, `class`, and `function`
export const something = true;
```

### Default Export

导出单个值作为源模块的默认导出：

```js
export default something;
```

仅当您的源模块只有一个导出时才推荐这种做法。

尽管规范允许，但在同一个模块中混合默认和命名导出是不好的做法。

## How bindings work

ES 模块导出 _live bindings_，而不是值，因此可以在初始导入后更改值。

[this demo](../repl/index.md?shareable=JTdCJTIyZXhhbXBsZSUyMiUzQW51bGwlMkMlMjJtb2R1bGVzJTIyJTNBJTVCJTdCJTIyY29kZSUyMiUzQSUyMmltcG9ydCUyMCU3QiUyMGNvdW50JTJDJTIwaW5jcmVtZW50JTIwJTdEJTIwZnJvbSUyMCcuJTJGaW5jcmVtZW50ZXIuanMnJTNCJTVDbiU1Q25jb25zb2xlLmxvZyhjb3VudCklM0IlMjAlMkYlMkYlMjAwJTVDbmluY3JlbWVudCgpJTNCJTVDbmNvbnNvbGUubG9nKGNvdW50KSUzQiUyMCUyRiUyRiUyMDElMjIlMkMlMjJpc0VudHJ5JTIyJTNBdHJ1ZSUyQyUyMm5hbWUlMjIlM0ElMjJtYWluLmpzJTIyJTdEJTJDJTdCJTIyY29kZSUyMiUzQSUyMmV4cG9ydCUyMGxldCUyMGNvdW50JTIwJTNEJTIwMCUzQiU1Q24lNUNuZXhwb3J0JTIwZnVuY3Rpb24lMjBpbmNyZW1lbnQoKSUyMCU3QiU1Q24lMjAlMjBjb3VudCUyMCUyQiUzRCUyMDElM0IlNUNuJTdEJTIyJTJDJTIyaXNFbnRyeSUyMiUzQWZhbHNlJTJDJTIybmFtZSUyMiUzQSUyMmluY3JlbWVudGVyLmpzJTIyJTdEJTVEJTJDJTIyb3B0aW9ucyUyMiUzQSU3QiUyMmFtZCUyMiUzQSU3QiUyMmlkJTIyJTNBJTIyJTIyJTdEJTJDJTIyZm9ybWF0JTIyJTNBJTIyZXMlMjIlMkMlMjJnbG9iYWxzJTIyJTNBJTdCJTdEJTJDJTIybmFtZSUyMiUzQSUyMm15QnVuZGxlJTIyJTdEJTdE):

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

count += 1; // Error — only incrementer.js can change this
```
