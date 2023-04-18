---
title: 常见问题
---

# {{ $frontmatter.title }}

[[toc]]

## 为什么 ES 模块比 CommonJS 模块更好？ {#why-are-es-modules-better-than-commonjs-modules}

ES 模块是官方标准，是 JavaScript 代码结构的明确未来发展方向，而 CommonJS 模块是一种特殊的兼容型格式，被视为 ES 模块提出之前的一种临时解决方案。ES 模块允许静态分析，可帮助进行优化（如除屑优化和作用域提升），并提供高级功能（如循环引用和实时绑定）。

## 什么是除屑优化 {#what-is-tree-shaking}

除屑优化，也即“保留有用代码”，是 Rollup 的一个处理过程，用于消除在给定项目中实际上未使用的代码。它是一种冗余代码消除的形式，但与输出大小相关的其他方法相比，可以更加高效。该名称源自模块的抽象语法树（而不是模块图）。该算法首先标记所有相关语句，然后“摇晃语法树（让枯叶掉落下来）”，删除所有冗余代码。它的思想与“标记-清除垃圾收集算法”类似。尽管此算法与 ES 模块本身并不相关，但这个思想使其更加高效，因为它们允许 Rollup 将所有模块作为一个具有共享绑定的大型抽象语法树进行处理。

## 如何在 Node.js 中使用 Rollup 和 CommonJS 模块？ {#how-do-i-use-rollup-in-nodejs-with-commonjs-modules}

Rollup 力求实现 ES 模块的规范，而不是 Node.js、NPM、`require()` 和 CommonJS 的行为。因此，CommonJS 模块的加载和使用 Node 的模块位置解析逻辑都作为可选插件实现，不包含在 Rollup 核心中。只需 `npm install` [commonjs](https://github.com/rollup/plugins/tree/master/packages/commonjs) 和 [node-resolve](https://github.com/rollup/plugins/tree/master/packages/node-resolve) 插件，然后使用 `rollup.config.js` 文件启用它们，即可完成设置。如果模块导入 JSON 文件，则还需要 [json](https://github.com/rollup/plugins/tree/master/packages/json) 插件。

## 为什么 node-resolve 不是内置功能？ {#why-isnt-node-resolve-a-built-in-feature}

有两个主要原因：

1. 在设计哲学上，这是因为 Rollup 本质上是一种类似于 Node 和浏览器中本机模块加载器的 [polyfill](<https://en.wikipedia.org/wiki/Polyfill_(programming)>)。在浏览器中，`import foo from 'foo'` 将无法工作，因为浏览器不使用 Node 的解析算法。

2. 在实际层面上，如果这些问题有一个良好的 API 可以清晰地分离，那么开发软件就会更加容易。Rollup 的核心非常庞大，一切可以阻止其变得更大的东西都是好事。同时，修复错误和添加功能也更容易。通过保持 Rollup 精简，技术债务的潜在风险很小。

请参见 [此问题](https://github.com/rollup/rollup/issues/1555#issuecomment-322862209) 以获得更详细的解释。

## 为什么在代码分割时我的入口块中会出现额外的导入？ {#why-do-additional-imports-turn-up-in-my-entry-chunks-when-code-splitting}

默认情况下，在创建多个块时，入口块的依赖项导入将作为空导入添加到入口块本身。[请看示例](../repl/index.md?shareable=JTdCJTIybW9kdWxlcyUyMiUzQSU1QiU3QiUyMm5hbWUlMjIlM0ElMjJtYWluLmpzJTIyJTJDJTIyY29kZSUyMiUzQSUyMmltcG9ydCUyMHZhbHVlJTIwZnJvbSUyMCcuJTJGb3RoZXItZW50cnkuanMnJTNCJTVDbmNvbnNvbGUubG9nKHZhbHVlKSUzQiUyMiUyQyUyMmlzRW50cnklMjIlM0F0cnVlJTdEJTJDJTdCJTIybmFtZSUyMiUzQSUyMm90aGVyLWVudHJ5LmpzJTIyJTJDJTIyY29kZSUyMiUzQSUyMmltcG9ydCUyMGV4dGVybmFsVmFsdWUlMjBmcm9tJTIwJ2V4dGVybmFsJyUzQiU1Q25leHBvcnQlMjBkZWZhdWx0JTIwMiUyMColMjBleHRlcm5hbFZhbHVlJTNCJTIyJTJDJTIyaXNFbnRyeSUyMiUzQXRydWUlN0QlNUQlMkMlMjJvcHRpb25zJTIyJTNBJTdCJTIyZm9ybWF0JTIyJTNBJTIyZXNtJTIyJTJDJTIybmFtZSUyMiUzQSUyMm15QnVuZGxlJTIyJTJDJTIyYW1kJTIyJTNBJTdCJTIyaWQlMjIlM0ElMjIlMjIlN0QlMkMlMjJnbG9iYWxzJTIyJTNBJTdCJTdEJTdEJTJDJTIyZXhhbXBsZSUyMiUzQW51bGwlN0Q=):

```js
// 输入
// main.js
import value from './other-entry.js';
console.log(value);

// other-entry.js
import externalValue from 'external';
export default 2 * externalValue;

// 输出
// main.js
import 'external'; // 这个导入已经从 other-entry.js 提升了。
import value from './other-entry.js';
console.log(value);

// other-entry.js
import externalValue from 'external';
var value = 2 * externalValue;
export default value;
```

这不会影响代码执行顺序或行为，但它将加快代码的加载和解析速度。如果没有这个优化，JavaScript 引擎需要执行以下步骤来运行 `main.js`：

1. 加载和解析 `main.js`。最后，将发现对 `other-entry.js` 的导入。
2. 加载和解析 `other-entry.js`。最后，将发现对 `external` 的导入。
3. 加载和解析 `external`。
4. 执行 `main.js`。

通过此优化，JavaScript 引擎将在解析入口模块后发现所有传递依赖关系，避免了瀑布式加载：

1. 加载和解析 `main.js`。最后，将发现对 `other-entry.js` 和 `external` 的导入。
2. 加载和解析 `other-entry.js` 和 `external`。从 `other-entry.js` 导入 `external` 已经被加载和解析。
3. 执行 `main.js`。

可能存在不需要此优化的情况，在这种情况下，你可以通过 [`output.hoistTransitiveImports`](../configuration-options/index.md#output-hoisttransitiveimports) 选项关闭它。当使用 [`output.preserveModules`](../configuration-options/index.md#output-preservemodules) 选项时，也不会应用此优化。

## 如何将 polyfill 添加到 Rollup 产物中？ {#how-do-i-add-polyfills-to-a-rollup-bundle}

即使 Rollup 在打包时通常会尝试维护精确的模块执行顺序，但在两种情况下，这并不总是成立：代码分割和外部依赖。外部依赖的问题最为明显，可以参考以下 [示例](../repl/index.md?shareable=JTdCJTIybW9kdWxlcyUyMiUzQSU1QiU3QiUyMm5hbWUlMjIlM0ElMjJtYWluLmpzJTIyJTJDJTIyY29kZSUyMiUzQSUyMmltcG9ydCUyMCcuJTJGcG9seWZpbGwuanMnJTNCJTVDbmltcG9ydCUyMCdleHRlcm5hbCclM0IlNUNuY29uc29sZS5sb2coJ21haW4nKSUzQiUyMiUyQyUyMmlzRW50cnklMjIlM0F0cnVlJTdEJTJDJTdCJTIybmFtZSUyMiUzQSUyMnBvbHlmaWxsLmpzJTIyJTJDJTIyY29kZSUyMiUzQSUyMmNvbnNvbGUubG9nKCdwb2x5ZmlsbCcpJTNCJTIyJTJDJTIyaXNFbnRyeSUyMiUzQWZhbHNlJTdEJTVEJTJDJTIyb3B0aW9ucyUyMiUzQSU3QiUyMmZvcm1hdCUyMiUzQSUyMmVzbSUyMiUyQyUyMm5hbWUlMjIlM0ElMjJteUJ1bmRsZSUyMiUyQyUyMmFtZCUyMiUzQSU3QiUyMmlkJTIyJTNBJTIyJTIyJTdEJTJDJTIyZ2xvYmFscyUyMiUzQSU3QiU3RCU3RCUyQyUyMmV4YW1wbGUlMjIlM0FudWxsJTdE)：

```js
// main.js
import './polyfill.js';
import 'external';
console.log('main');

// polyfill.js
console.log('polyfill');
```

这里的执行顺序是 `polyfill.js` → `external` → `main.js`。现在，当你打包代码时，你将得到以下结果：

```js
import 'external';
console.log('polyfill');
console.log('main');
```

使用 `external` → `polyfill.js` → `main.js` 的执行顺序。这不是由 Rollup 将 `import` 放在捆绑包顶部引起的问题——无论在文件中的位置如何，`import` 都会被首先执行。此问题可以通过创建更多的块来解决：如果 `polyfill.js` 最终位于与 `main.js` 不同的块中，[正确的执行顺序将得以保留](../repl/index.md?shareable=JTdCJTIybW9kdWxlcyUyMiUzQSU1QiU3QiUyMm5hbWUlMjIlM0ElMjJtYWluLmpzJTIyJTJDJTIyY29kZSUyMiUzQSUyMmltcG9ydCUyMCcuJTJGcG9seWZpbGwuanMnJTNCJTVDbmltcG9ydCUyMCdleHRlcm5hbCclM0IlNUNuY29uc29sZS5sb2coJ21haW4nKSUzQiUyMiUyQyUyMmlzRW50cnklMjIlM0F0cnVlJTdEJTJDJTdCJTIybmFtZSUyMiUzQSUyMnBvbHlmaWxsLmpzJTIyJTJDJTIyY29kZSUyMiUzQSUyMmNvbnNvbGUubG9nKCdwb2x5ZmlsbCcpJTNCJTIyJTJDJTIyaXNFbnRyeSUyMiUzQXRydWUlN0QlNUQlMkMlMjJvcHRpb25zJTIyJTNBJTdCJTIyZm9ybWF0JTIyJTNBJTIyZXNtJTIyJTJDJTIybmFtZSUyMiUzQSUyMm15QnVuZGxlJTIyJTJDJTIyYW1kJTIyJTNBJTdCJTIyaWQlMjIlM0ElMjIlMjIlN0QlMkMlMjJnbG9iYWxzJTIyJTNBJTdCJTdEJTdEJTJDJTIyZXhhbXBsZSUyMiUzQW51bGwlN0Q=)。然而，在 Rollup 中还没有自动执行此操作的方法。对于代码分割，情况类似，因为 Rollup 正在尝试创建尽可能少的块，同时确保不执行不需要的代码。

对于大多数代码而言，这不是一个问题，因为 Rollup 可以保证：

> 如果模块 A 导入模块 B，且没有循环导入，那么模块 B 总是会在模块 A 之前被执行。

但是，这对于 polyfill 来说是一个问题，因为它们通常需要首先执行，同时又通常不希望在每个模块中都放置一个 polyfill 的导入。幸运的是，这并不是必需的：

1. 如果没有依赖于 polyfill 的外部依赖项，则在每个静态入口点的第一个语句中添加对 polyfill 的导入即可。
2. 否则，将 polyfill 作为单独的入口或 [手动添加的块](../configuration-options/index.md#output-manualchunks) 也会始终确保它首先被执行。

## Rollup 适用于构建库还是应用程序？ {#is-rollup-meant-for-building-libraries-or-applications}

Rollup 已经被许多主要的 JavaScript 库使用，并且也可以用于构建绝大多数应用程序。但是，如果你想在旧版浏览器中使用代码拆分或动态导入，则需要使用额外的运行时来处理加载丢失的块。我们建议使用 [SystemJS 构建产物作为生产环境](https://github.com/systemjs/systemjs#browser-production)，因为它与 Rollup 的系统格式输出很好地集成，并且能够正确处理所有 ES 模块实时绑定和重新导出边缘情况。或者，也可以使用 AMD 加载器。

## 我如何在浏览器中运行 Rollup？ {#how-do-i-run-rollup-itself-in-a-browser}

虽然常规的 Rollup 构建依赖于一些 NodeJS 特性，但还有一个仅使用浏览器 API 的浏览器版本可用。你可以通过以下方式安装它：

```shell
npm install @rollup/browser
```

在你的脚本代码中，这样导入：

```js
import { rollup } from '@rollup/browser';
```

另外，你也可以从 CDN 导入，例如导入 ESM 格式产物：

```js
import * as rollup from 'https://unpkg.com/@rollup/browser/dist/es/rollup.browser.js';
```

而对于 UMD 格式产物：

```html
<script src="https://unpkg.com/@rollup/browser/dist/rollup.browser.js"></script>
```

这将创建一个全局变量 `window.rollup`。由于浏览器构建无法访问文件系统，因此你需要提供解析和加载要捆绑的所有模块的插件。以下是一个虚构的示例：

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

此示例仅支持两个导入，`"main.js"` 和 `"foo.js"`，不支持相对导入。以下是另一个示例，它使用绝对 URL 作为入口点，并支持相对导入。在这种情况下，我们只是重新打包 Rollup 本身，但它可以用于任何其他公开 ES 模块的 URL：

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
							// If it is a valid URL, return it
							return source;
						} catch {
							// Otherwise make it external
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

## Rollup logo 是谁制作的？太可爱了！ {#who-made-the-rollup-logo-its-lovely}

[Julian Lloyd](https://github.com/jlmakes)!
