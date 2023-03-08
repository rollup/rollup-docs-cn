---
title: Frequently Asked Questions
---

# {{ $frontmatter.title }}

[[toc]]

## 为什么 ES 模块优于 CommonJS 模块？

ES 模块是官方标准，是 JavaScript 代码结构的清晰发展方向，而 CommonJS 模块是一种独特的遗留格式，是在 ES 模块提出之前作为权宜之计的解决方案。ES 模块允许静态分析，有助于像摇树和作用域提升这样的优化，并新增了高级特性，如循环引用和动态绑定。

## 什么是 "tree-shaking"？

"Tree-shaking"，也称为 "实时代码包含"，是 Rollup 的一个过程，用于消除在给定项目中实际上没有使用的代码。它是一种[死代码消除](https://medium.com/@Rich_Harris/tree-shaking-versus-dead-code-elimination-d3765df85c80#.jnypozs9n)的形式，但在输出大小方面比其他方法更加高效。该名称源自模块（而不是模块图）的[抽象语法树](https://en.wikipedia.org/wiki/Abstract_syntax_tree)。该算法首先标记所有相关语句，然后 "摇晃语法树"，以删除所有死代码。它在思想上类似于[标记和扫描垃圾回收算法](https://en.wikipedia.org/wiki/Tracing_garbage_collection)。尽管该算法不限于 ES 模块，但由于 ES 模块允许 Rollup 将所有模块一起视为共享绑定的大型抽象语法树，因此它们使其更加高效。

## 如何在 Node.js 中使用 Rollup 处理 CommonJS 模块？

Rollup 旨在实现 ES 模块的规范，而不是必须遵循 Node.js、NPM、`require()` 和 CommonJS 的行为。因此，加载 CommonJS 模块和使用 Node 的模块位置解析逻辑都被实现为可选插件，不包含在 Rollup 核心中。只需使用 `npm install` 命令安装 [commonjs](https://github.com/rollup/plugins/tree/master/packages/commonjs) 和 [node-resolve](https://github.com/rollup/plugins/tree/master/packages/node-resolve) 插件，然后在 `rollup.config.js` 文件中启用它们，你就可以开始使用了。如果模块导入了 JSON 文件，你还需要 [json](https://github.com/rollup/plugins/tree/master/packages/json) 插件。


## 为什么 node-resolve 不是内置功能？

有两个主要原因：

1. 从哲学上讲，这是因为 Rollup 本质上是一种类似于 Node 和浏览器中本地模块加载器的 [polyfill](<https://en.wikipedia.org/wiki/Polyfill_(programming)>)。在浏览器中，`import foo from 'foo'` 无法工作，因为浏览器不使用 Node 的解析算法。

2. 在实践层面上，如果使用良好的 API 将这些问题清晰地分离，开发软件会更加容易。Rollup 的核心非常庞大，任何能够使它变得更小的事情都是好事。同时，修复错误和添加功能也更容易。通过保持 Rollup 精简，技术债务的潜力很小。

请参见 [此问题](https://github.com/rollup/rollup/issues/1555#issuecomment-322862209) 中的更详细的解释。


## 为什么使用代码分割时会在入口 chunk 中出现额外的导入？

默认情况下，当创建多个 chunk 时，入口 chunk 的依赖项的导入将被添加为空导入 [Example](../repl/index.md?shareable=JTdCJTIybW9kdWxlcyUyMiUzQSU1QiU3QiUyMm5hbWUlMjIlM0ElMjJtYWluLmpzJTIyJTJDJTIyY29kZSUyMiUzQSUyMmltcG9ydCUyMHZhbHVlJTIwZnJvbSUyMCcuJTJGb3RoZXItZW50cnkuanMnJTNCJTVDbmNvbnNvbGUubG9nKHZhbHVlKSUzQiUyMiUyQyUyMmlzRW50cnklMjIlM0F0cnVlJTdEJTJDJTdCJTIybmFtZSUyMiUzQSUyMm90aGVyLWVudHJ5LmpzJTIyJTJDJTIyY29kZSUyMiUzQSUyMmltcG9ydCUyMGV4dGVybmFsVmFsdWUlMjBmcm9tJTIwJ2V4dGVybmFsJyUzQiU1Q25leHBvcnQlMjBkZWZhdWx0JTIwMiUyMColMjBleHRlcm5hbFZhbHVlJTNCJTIyJTJDJTIyaXNFbnRyeSUyMiUzQXRydWUlN0QlNUQlMkMlMjJvcHRpb25zJTIyJTNBJTdCJTIyZm9ybWF0JTIyJTNBJTIyZXNtJTIyJTJDJTIybmFtZSUyMiUzQSUyMm15QnVuZGxlJTIyJTJDJTIyYW1kJTIyJTNBJTdCJTIyaWQlMjIlM0ElMjIlMjIlN0QlMkMlMjJnbG9iYWxzJTIyJTNBJTdCJTdEJTdEJTJDJTIyZXhhbXBsZSUyMiUzQW51bGwlN0Q=):

```js
// input
// main.js
import value from './other-entry.js';
console.log(value);

// other-entry.js
import externalValue from 'external';
export default 2 * externalValue;

// output
// main.js
import 'external'; // 这个导入已经从 other-entry.js 提升了
import value from './other-entry.js';
console.log(value);

// other-entry.js
import externalValue from 'external';
var value = 2 * externalValue;
export default value;
```

这不会影响代码的执行顺序或行为，但它会加快你的代码的加载和解析速度。没有这个优化，JavaScript 引擎需要执行以下步骤来运行 `main.js`：

1. 加载并解析 `main.js`。在最后，将发现对 `other-entry.js` 的导入。
2. 加载并解析 `other-entry.js`。在最后，将发现对 `external` 的导入。
3. 加载并解析 `external`。
4. 执行 `main.js`。

有了这个优化，JavaScript 引擎将在解析入口模块后发现所有传递依赖，避免了瀑布：

1. 加载并解析 `main.js`。在最后，将发现对 `other-entry.js` 和 `external` 的导入。
2. 加载并解析 `other-entry.js` 和 `external`。从 `other-entry.js` 导入的 `external` 已经加载和解析过了。
3. 执行 `main.js`。

可能有些情况下不希望使用这个优化，在这种情况下，你可以通过 [`output.hoistTransitiveImports`](../configuration-options/index.md#output-hoisttransitiveimports) 选项来关闭它。当使用 [`output.preserveModules`](../configuration-options/index.md#output-preservemodules) 选项时，也不会应用这个优化。

## 如何向 Rollup 包添加 polyfills？

尽管 Rollup 通常会在打包时尽量保持模块的执行顺序，但有两种情况下这并不总是成立：代码分割和外部依赖。这个问题在外部依赖上最为明显，看看下面的[例子](../repl/index.md?shareable=JTdCJTIybW9kdWxlcyUyMiUzQSU1QiU3QiUyMm5hbWUlMjIlM0ElMjJtYWluLmpzJTIyJTJDJTIyY29kZSUyMiUzQSUyMmltcG9ydCUyMCcuJTJGcG9seWZpbGwuanMnJTNCJTVDbmltcG9ydCUyMCdleHRlcm5hbCclM0IlNUNuY29uc29sZS5sb2coJ21haW4nKSUzQiUyMiUyQyUyMmlzRW50cnklMjIlM0F0cnVlJTdEJTJDJTdCJTIybmFtZSUyMiUzQSUyMnBvbHlmaWxsLmpzJTIyJTJDJTIyY29kZSUyMiUzQSUyMmNvbnNvbGUubG9nKCdwb2x5ZmlsbCcpJTNCJTIyJTJDJTIyaXNFbnRyeSUyMiUzQWZhbHNlJTdEJTVEJTJDJTIyb3B0aW9ucyUyMiUzQSU3QiUyMmZvcm1hdCUyMiUzQSUyMmVzbSUyMiUyQyUyMm5hbWUlMjIlM0ElMjJteUJ1bmRsZSUyMiUyQyUyMmFtZCUyMiUzQSU3QiUyMmlkJTIyJTNBJTIyJTIyJTdEJTJDJTIyZ2xvYmFscyUyMiUzQSU3QiU3RCU3RCUyQyUyMmV4YW1wbGUlMjIlM0FudWxsJTdE):

```js
// main.js
import './polyfill.js';
import 'external';
console.log('main');

// polyfill.js
console.log('polyfill');
```

这里的执行顺序是 `polyfill.js` → `external` → `main.js`。现在当你打包代码时，你会得到

```js
import 'external';
console.log('polyfill');
console.log('main');
```

执行顺序为 `external` → `polyfill.js` → `main.js`。这不是 Rollup 将 `import` 放在包的顶部导致的问题 —— 无论它们位于文件中的哪个位置，导入总是首先执行。这个问题可以通过创建更多的块来解决：如果 `polyfill.js` 和 `main.js` 结束在不同的块中，[正确的执行顺序将得到保证](../repl/index.md?shareable=JTdCJTIybW9kdWxlcyUyMiUzQSU1QiU3QiUyMm5hbWUlMjIlM0ElMjJtYWluLmpzJTIyJTJDJTIyY29kZSUyMiUzQSUyMmltcG9ydCUyMCcuJTJGcG9seWZpbGwuanMnJTNCJTVDbmltcG9ydCUyMCdleHRlcm5hbCclM0IlNUNuY29uc29sZS5sb2coJ21haW4nKSUzQiUyMiUyQyUyMmlzRW50cnklMjIlM0F0cnVlJTdEJTJDJTdCJTIybmFtZSUyMiUzQSUyMnBvbHlmaWxsLmpzJTIyJTJDJTIyY29kZSUyMiUzQSUyMmNvbnNvbGUubG9nKCdwb2x5ZmlsbCcpJTNCJTIyJTJDJTIyaXNFbnRyeSUyMiUzQXRydWUlN0QlNUQlMkMlMjJvcHRpb25zJTIyJTNBJTdCJTIyZm9ybWF0JTIyJTNBJTIyZXNtJTIyJTJDJTIybmFtZSUyMiUzQSUyMm15QnVuZGxlJTIyJTJDJTIyYW1kJTIyJTNBJTdCJTIyaWQlMjIlM0ElMjIlMjIlN0QlMkMlMjJnbG9iYWxzJTIyJTNBJTdCJTdEJTdEJTJDJTIyZXhhbXBsZSUyMiUzQW51bGwlN0Q=). 但是，Rollup 还没有一种自动的方法来做到这一点。对于代码分割，情况也类似，因为 Rollup 试图创建尽可能少的块，同时确保不执行不需要的代码。

对于大多数代码，这不是一个问题，因为 Rollup 可以保证：

如果模块 A 导入模块 B，并且没有循环导入，那么 B 将始终在 A 之前执行。

这对于 polyfill 来说是一个问题，因为它们通常需要首先执行，但通常不希望在每个模块中都放置一个 polyfill 的导入。幸运的是，这不是必需的：

1. 如果没有依赖于 polyfill 的外部依赖项，只需将 polyfill 的导入作为每个静态入口点的第一条语句添加即可。
2. 否则，另外将 polyfill 作为单独的入口或[手动块](../configuration-options/index.md#output-manualchunks)将始终确保它首先执行。

## Rollup 是用来构建库还是应用程序的？

Rollup 已经被许多主流的 JavaScript 库使用，也可以用来构建绝大多数的应用程序。然而，如果你想在旧版浏览器中使用代码分割或动态导入，你将需要一个额外的运行时来处理加载缺失的块。我们推荐使用 [SystemJS Production Build](https://github.com/systemjs/systemjs#browser-production)，因为它可以很好地与 Rollup 的 system 格式输出集成，并且能够正确地处理所有 ES 模块的实时绑定和重新导出边缘情况。或者，也可以使用一个 AMD 加载器。

## 如何在浏览器中运行 Rollup

尽管常规的 Rollup 构建依赖于一些 NodeJS 功能，但也有一个仅使用浏览器 API 的浏览器版本可用。您可以通过以下方式安装它：

```shell
npm install @rollup/browser
```

然后在您的脚本中通过以下方式导入：

```js
import { rollup } from '@rollup/browser';
```

或者，您也可以从 CDN 导入，例如对于 ESM 构建：

```js
import * as rollup from 'https://unpkg.com/@rollup/browser/dist/es/rollup.browser.js';
```

和对于 UMD 构建：

```html
<script src="https://unpkg.com/@rollup/browser/dist/rollup.browser.js"></script>
```

这将创建一个全局变量 `window.rollup` 。由于浏览器版本无法访问文件系统，您需要提供插件来解析和加载要捆绑的所有模块。以下是一个假设的例子：

```js
const modules = {
	'main.js': "import foo from 'foo.js'; console.log(foo);",
	'foo.js': 'export default 42;'
};

rollup
	.rollup({
		input: 'main.js',
		plugins: [
			{
				name: 'loader',
				resolveId(source) {
					if (modules.hasOwnProperty(source)) {
						return source;
					}
				},
				load(id) {
					if (modules.hasOwnProperty(id)) {
						return modules[id];
					}
				}
			}
		]
	})
	.then(bundle => bundle.generate({ format: 'es' }))
	.then(({ output }) => console.log(output[0].code));
```

这个例子只支持两个导入，`"main.js"` 和 `"foo.js"`，并且不支持相对导入。这里有另一个例子，它使用绝对 URL 作为入口点，并支持相对导入。在这种情况下，我们只是重新打包 Rollup 本身，但它可以用于任何其他暴露 ES 模块的 URL：

```js
rollup
	.rollup({
		input: 'https://unpkg.com/rollup/dist/es/rollup.js',
		plugins: [
			{
				name: 'url-resolver',
				resolveId(source, importer) {
					if (source[0] !== '.') {
						try {
							new URL(source);
							// 如果是有效的 URL，返回它
							return source;
						} catch {
							// 否则将其设为外部的
							return { id: source, external: true };
						}
					}
					return new URL(source, importer).href;
				},
				async load(id) {
					const response = await fetch(id);
					return response.text();
				}
			}
		]
	})
	.then(bundle => bundle.generate({ format: 'es' }))
	.then(({ output }) => console.log(output));
```

## Rollup 的 logo 是谁设计的？它很可爱。

[Julian Lloyd](https://github.com/jlmakes)!
