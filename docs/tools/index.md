---
title: Rollup 与其它工具的集成
---

# {{ $frontmatter.title }}

[[toc]]

## 与其他 NPM 包 {#with-npm-packages}

在某个时刻，你的项目可能会依赖于从 NPM 安装到 `node_modules` 文件夹中的软件包。与 Webpack 和 Browserify 等其他打包程序不同，Rollup 默认情况下不知道如何处理这些依赖项，我们需要添加一些配置。

让我们添加一个名为 [the-answer](https://www.npmjs.com/package/the-answer) 的简单依赖项，它导出了生命、宇宙和一切问题的答案：

```shell
npm install the-answer
# or `npm i the-answer` {#or-npm-i-the-answer}
```

如果我们更新了 `src/main.js` 文件…

```js
// src/main.js
import answer from 'the-answer';

export default function () {
	console.log('the answer is ' + answer);
}
```

…然后运行 Rollup…

```shell
npm run build
```

…我们会看到这样的警告：

```
(!) Unresolved dependencies
https://github.com/rollup/rollup/wiki/Troubleshooting#treating-module-as-external-dependency
the-answer (imported by main.js)
```

生成的 `bundle.js` 仍然可以在 Node.js 中使用，因为 `import` 声明会被转换为 CommonJS 的 `require` 语句，但是 `the-answer` 不会被包含在 bundle 中。为此，我们需要一个插件。

### @rollup/plugin-node-resolve {#rollupplugin-node-resolve}

[@rollup/plugin-node-resolve](https://github.com/rollup/plugins/tree/master/packages/node-resolve) 插件可以让 Rollup 找到外部模块。让我们安装它…

```shell
npm install --save-dev @rollup/plugin-node-resolve
```

…然后将它添加到我们的配置文件中：

```js
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';

export default {
	input: 'src/main.js',
	output: {
		file: 'bundle.js',
		format: 'cjs'
	},
	plugins: [resolve()]
};
```

这一次，当你运行 `npm run build` 时，不会发出警告 - bundle 包含了导入的模块。

### @rollup/plugin-commonjs {#rollupplugin-commonjs}

一些库会暴露出 ES 模块，你可以直接导入它们，`the-answer` 就是这样的一个模块。但是目前，大多数 NPM 上的包都以 CommonJS 模块的方式暴露。在这种情况下，我们需要在 Rollup 处理它们之前将 CommonJS 转换为 ES2015。

[@rollup/plugin-commonjs](https://github.com/rollup/plugins/tree/master/packages/commonjs) 插件就是用来做这件事的。

请注意，大多数情况下，`@rollup/plugin-commonjs` 应该放在转换模块的其他插件之前 - 这是为了防止其他插件对 CommonJS 检测产生影响。一个例外是 Babel 插件，如果你使用它，请将它放在 commonjs 插件之前。

## 对等依赖 {#peer-dependencies}

假设你正在构建一个具有对等依赖项（peer dependency）的库，例如 React 或 Lodash。如果按照上面描述的设置 externals，你的 rollup 将会打包 _所有_ 导入的依赖项：

```js
import answer from 'the-answer';
import _ from 'lodash';
```

你可以精细调整哪些导入将被打包，哪些将被视为外部导入。在此示例中，我们将把 `lodash` 视为外部导入，但不将 `the-answer` 视为外部导入。

以下是配置文件：

```js
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';

export default {
	input: 'src/main.js',
	output: {
		file: 'bundle.js',
		format: 'cjs'
	},
	plugins: [
		resolve({
			// 将自定义选项传递给解析插件
			moduleDirectories: ['node_modules']
		})
	],
	// 指出哪些模块应该视为外部模块
	external: ['lodash']
};
```

现在，`lodash` 将被视为外部导入，不会与你的库捆绑在一起。

`external` 键接受模块名称的数组或一个函数，该函数接受模块名称并返回 true，如果应将其视为外部导入。例如：

```js
export default {
	// ...
	external: id => /lodash/.test(id)
};
```

如果你使用 [babel-plugin-lodash](https://github.com/lodash/babel-plugin-lodash) 来挑选 `lodash` 模块，则可能会使用此形式。在这种情况下，Babel 将转换你的导入语句，使之类似于：

```js
import _merge from 'lodash/merge';
```

数组形式的 `external` 不支持通配符，因此此导入语句只会在函数形式下被视为外部导入。

## Babel {#babel}

许多开发人员在项目中使用 [Babel](https://babeljs.io/) 来使用尚未被浏览器和 Node.js 支持的最新 JavaScript 特性。

使用 Babel 和 Rollup 最简单的方法是使用 [@rollup/plugin-babel](https://github.com/rollup/plugins/tree/master/packages/babel)。首先，安装该插件：

```shell
npm i -D @rollup/plugin-babel @rollup/plugin-node-resolve
```

Add it to `rollup.config.js`:

```js
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';

export default {
	input: 'src/main.js',
	output: {
		file: 'bundle.js',
		format: 'cjs'
	},
	plugins: [resolve(), babel({ babelHelpers: 'bundled' })]
};
```

在 Babel 实际编译代码之前，需要进行配置。创建一个名为 `src/.babelrc.json` 的新文件：

```json
{
	"presets": ["@babel/env"]
}
```

我们将 `.babelrc.json` 文件放在 `src` 目录中，而不是项目根目录中。如果以后需要，这可以让我们为诸如测试之类的事物拥有不同的 `.babelrc.json` 文件 - 有关项目范围和文件相对配置的更多信息，请参见 [Babel 文档](https://babeljs.io/docs/en/config-files#project-wide-configuration)。

现在，在运行 rollup 之前，我们需要安装 [`babel-core`](https://babeljs.io/docs/en/babel-core) 和 [`env`](https://babeljs.io/docs/en/babel-preset-env) 预设：

```shell
npm i -D @babel/core @babel/preset-env
```

运行 Rollup 现在将进行一次打包 - 但目前我们并没有使用到任何 ES2015 特性。让我们通过编辑 `src/main.js` 来改变这一点：

```js
// src/main.js
import answer from 'the-answer';

export default () => {
	console.log(`the answer is ${answer}`);
};
```

使用 `npm run build` 来运行 Rollup 之后，我们可以来看看产物：

```js
'use strict';

var index = 42;

var main = function () {
	console.log('the answer is ' + index);
};

module.exports = main;
```

## Gulp {#gulp}

Rollup 返回的 Promise 被 gulp 所理解，因此集成相对容易。

语法与配置文件非常相似，但属性被分成两个不同的操作，对应于 [JavaScript API](../javascript-api/index.md)：

```js
const gulp = require('gulp');
const rollup = require('rollup');
const rollupTypescript = require('@rollup/plugin-typescript');

gulp.task('build', () => {
	return rollup
		.rollup({
			input: './src/main.ts',
			plugins: [rollupTypescript()]
		})
		.then(bundle => {
			return bundle.write({
				file: './dist/library.js',
				format: 'umd',
				name: 'library',
				sourcemap: true
			});
		});
});
```

你也可能会用到 `async/await` 语法：

```js
const gulp = require('gulp');
const rollup = require('rollup');
const rollupTypescript = require('@rollup/plugin-typescript');

gulp.task('build', async function () {
	const bundle = await rollup.rollup({
		input: './src/main.ts',
		plugins: [rollupTypescript()]
	});

	await bundle.write({
		file: './dist/library.js',
		format: 'umd',
		name: 'library',
		sourcemap: true
	});
});
```

## Deno {#deno}

如果你想要在 Deno 中使用 Rollup，你可以通过 [esm.sh](https://esm.sh/) 这样做：

```js
import { rollup } from "https://esm.sh/@rollup/browser";

const bundle = await rollup({ //...
```

<<<<<<< HEAD
或者你可以从 npm 安装 rollup 并使用 [node 兼容层](https://deno.land/std@0.110.0/node)：
=======
But it is not suitable for complex compiling. Alternatively you can install rollup from npm:
>>>>>>> c9b3655ec25d08f5182feb3d118cc676940f1549

```js
import { rollup } from "npm:rollup";

const bundle = await rollup({ //...
```

<<<<<<< HEAD
请确保使用 `--unstable` 标志运行 deno。如果你计划使用 `bundle.write()`，请不要忘记 `--allow-read` 和 `--allow-write`。
=======
Notice: Deno will request some permissions when running Rollup.
>>>>>>> c9b3655ec25d08f5182feb3d118cc676940f1549
