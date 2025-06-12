---
title: 在浏览器中运行 Rollup
---

# {{ $frontmatter.title }}

[[toc]]

## 浏览器构建 {#the-browser-build}

虽然常规的 Rollup 构建依赖于一些 NodeJS 内置库，但也有一个仅使用浏览器 API 的浏览器构建可用。可以通过以下方式安装：

```shell
npm install @rollup/browser
```

在你的脚本中，可以通过以下方式导入：

```js
import { rollup } from '@rollup/browser';
```

或者，你也可以从 CDN 导入，例如对于 ESM 构建：

```js
import * as rollup from 'https://unpkg.com/@rollup/browser/dist/es/rollup.browser.js';
```

对于 UMD 构建：

```html
<script src="https://unpkg.com/@rollup/browser/dist/rollup.browser.js"></script>
```

这将创建一个全局变量 `window.rollup`。请注意，在每种情况下，你需要确保 `@rollup/browser` 包中的 `dist/bindings_wasm_bg.wasm` 文件与浏览器构建一起提供。

由于浏览器构建无法访问文件系统，你需要提供一个 [内存文件系统](#using-an-in-memory-file-system) 通过 [`fs`](../configuration-options/index.md#fs) 选项，或者你需要提供 [插件](#using-plugins-to-resolve-and-load-modules) 来解析和加载所有你想要打包的模块。

## 使用内存文件系统 {#using-an-in-memory-file-system}

Rollup 允许你提供一个内存文件系统实现，该实现需要实现 NodeJS `fs` API 的至少一个子集，参见 [`fs`](../configuration-options/index.md#fs) 选项。这使得浏览器构建的行为非常类似于 NodeJS 构建，甚至允许你使用某些依赖于文件系统的插件，前提是它们只能通过 [`this.fs`](../plugin-development/index.md#this-fs) 插件上下文属性访问它。下面是一个使用 [`memfs`](https://www.npmjs.com/package/memfs) 的示例：

```js twoslash
/** @type {import('rollup')} */
var rollup;
// ---cut---
import { rollup } from '@rollup/browser';
import { Volume } from 'memfs';

const vol = Volume.fromJSON({
	'/main.js': "import foo from 'foo.js'; console.log(foo);",
	'/foo.js': 'export default 42;'
});

rollup
	.rollup({
		input: '/main.js',
		fs: vol.promises
	})
	.then(bundle => bundle.generate({ format: 'es' }))
	.then(({ output }) => console.log(output[0].code));
```

## 使用插件解析和加载模块 {#using-plugins-to-resolve-and-load-modules}

你也可以通过插件解析和加载所有模块。下面是一个示例：

```js twoslash
/** @type {import('rollup')} */
var rollup;
// ---cut---
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

这个示例只支持两个导入，`"main.js"` 和 `"foo.js"`，并且不支持相对导入。下面是一个使用绝对 URL 作为入口文件并支持相对导入的示例。在这种情况下，我们只是重新打包 Rollup 本身，但它可以用于任何其他暴露 ES 模块的 URL：

```js twoslash
/** @type {import('rollup')} */
var rollup;
// ---cut---
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
