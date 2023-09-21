---
title: 配置选项
---

# {{ $frontmatter.title }}

[[toc]]

## 核心功能 {#core-functionality}

### external {#external}

|  |  |
| --: | :-- |
| 类型： | `(string \| RegExp)[]\| RegExp\| string\| (id: string, parentId: string, isResolved: boolean) => boolean` |
| CLI： | `-e`/`--external <external-id,another-external-id,...>` |

该选项用于匹配需要排除在 bundle 外部的模块，它的值可以是一个接收模块 `id` 参数并返回 `true` （表示外部依赖）或 `false` （表示非外部依赖）的函数，也可以是一个模块 ID 数组或者正则表达式。除此之外，它还可以只是单个的模块 ID 或正则表达式。被匹配的模块 ID 应该满足以下条件之一：

1. 外部依赖的名称，需要和引入语句中写法完全一致。例如，如果想标记 `import "dependency.js"` 为外部依赖，就需要使用 `"dependency.js"` 作为模块 ID；而如果要标记 `import "dependency"` 为外部依赖，则使用 `"dependency"`。
2. 解析过的模块 ID（如文件的绝对路径）。

```js
// rollup.config.js
import { fileURLToPath } from 'node:url';

export default {
	//...,
	external: [
		'some-externally-required-library',
		fileURLToPath(
			new URL(
				'src/some-local-file-that-should-not-be-bundled.js',
				import.meta.url
			)
		),
		/node_modules/
	]
};
```

请注意，如果要通过 `/node_modules/` 正则表达式过滤掉包的引入，例如 `import {rollup} from 'rollup'`，需要先使用类似 [@rollup/plugin-node-resolve](https://github.com/rollup/plugins/tree/master/packages/node-resolve) 的插件，来将引入依赖解析到 `node_modules`。

当用作命令行参数时，该选项的值应该是一个以逗号分隔的模块 ID 列表：

```bash
rollup -i src/main.js ... -e foo,bar,baz
```

当该选项的值为函数时，它提供了三个参数 `(id, parent, isResolved)`，可以为你提供更细粒度的控制：

- `id` 为相关模块 id
- `parent` 为进行引入的模块 id
- `isResolved` 表示 `id` 是否已被插件等解析

当创建 `iife` 或 `umd` 格式的 bundle 时，你需要通过 [`output.globals`](#output-globals) 选项提供全局变量名，以替换掉外部引入。

如果一个相对引入，即以 `./` 或 `../` 开头，被标记为 `external`，rollup 将在内部将该模块 ID 解析为绝对路径，以便引入的不同外部模块可以合并。当写入生成的 bundle 后，这些引入模块将再次被转换为相对引入。例如：

```js
// 输入
// src/main.js （入口文件）
import x from '../external.js';
import './nested/nested.js';
console.log(x);

// src/nested/nested.js
// 如果引入依赖已存在，它将指向同一个文件
import x from '../../external.js';
console.log(x);

// 输出
// 不同的依赖将会合并
import x from '../external.js';

console.log(x);

console.log(x);
```

如果存在多个入口，rollup 会转换回相对引入的方式，就像 `output.file` 或 `output.dir` 与入口文件或所有入口文件位于相同目录。

### input {#input}

|        |                                                         |
| -----: | :------------------------------------------------------ |
| 类型： | `string \| string []\| { [entryName: string]: string }` |
|  CLI： | `-i`/`--input <filename>`                               |

该选项用于指定 bundle 的入口文件（例如，你的 `main.js`，`app.js` 或 `index.js` 文件）。如果值为一个入口文件的数组或一个将名称映射到入口文件的对象，那么它们将被打包到单独的输出 chunks。除非使用 [`output.file`](#output-file) 选项，否则生成的 chunk 名称将遵循 [`output.entryFileNames`](#output-entryfilenames) 选项设置。当该选项的值为对象形式时，对象的属性名将作为文件名中的 `[name]`，而对于值为数组形式，数组的值将作为入口文件名。

请注意，当选项的值使用对象形式时，可以通过在名称中添加 `/` 来将入口文件放入不同的子文件夹。以下例子将根据 `entry-a.js` 和 `entry-b/index.js`，产生至少两个入口 chunks，即 `index.js`文件将输出在 `entry-b` 文件夹中：

```js
// rollup.config.js
export default {
  ...,
  input: {
    a: 'src/main-a.js',
    'b/index': 'src/main-b.js'
  },
  output: {
    ...,
    entryFileNames: 'entry-[name].js'
  }
};
```

如果你想将一组文件转换为另一种格式，并同时保持文件结构和导出签名，推荐的方法是将每个文件变成一个入口文件，而不是使用 [`output.preserveModules`](#output-preservemodules)，后者可能会导出被除屑优化，并产生由插件创建的虚拟文件。你可以动态地处理，例如通过 `glob` 包。

```js
import glob from 'glob';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default {
	input: Object.fromEntries(
		glob.sync('src/**/*.js').map(file => [
			// 这里将删除 `src/` 以及每个文件的扩展名。
			// 因此，例如 src/nested/foo.js 会变成 nested/foo
			path.relative(
				'src',
				file.slice(0, file.length - path.extname(file).length)
			),
			// 这里可以将相对路径扩展为绝对路径，例如
			// src/nested/foo 会变成 /project/src/nested/foo.js
			fileURLToPath(new URL(file, import.meta.url))
		])
	),
	output: {
		format: 'es',
		dir: 'dist'
	}
};
```

如果某些插件在 [`buildStart`](../plugin-development/index.md#this-emitfile) 钩子结束前至少生成了一个 chunk（使用 [`this.emitFile`](../plugin-development/index.md#this-emitfile)），则该选项可以省略。

当使用命令行时，多个入口只需要多次使用该选项输入。当作为第一个选项提供时，相当于不以 `--input` 为前缀：

```shell
rollup --format es --input src/entry1.js --input src/entry2.js
# 等同于
rollup src/entry1.js src/entry2.js --format es
```

可以使用 `=` 赋值来命名 chunk：

```shell
rollup main=src/entry1.js other=src/entry2.js --format es
```

可以使用引号指定包含空格的文件名：

```shell
rollup "main entry"="src/entry 1.js" "src/other entry.js" --format es
```

### output.dir {#output-dir}

|        |                        |
| -----: | :--------------------- |
| 类型： | `string`               |
|  CLI： | `-d`/`--dir <dirname>` |

该选项用于指定所有生成的 chunk 被放置在哪个目录中。如果生成一个以上的 chunk，那么这个选项是必需的。否则，可以使用 `file` 选项来代替。

### output.file {#output-file}

|        |                          |
| -----: | :----------------------- |
| 类型： | `string`                 |
|  CLI： | `-o`/`--file <filename>` |

该选项用于指定要写入的文件。如果适用的话，也可以用于生成 sourcemap。只有在生成的 chunk 不超过一个的情况下才可以使用。

### output.format {#output-format}

|        |                                   |
| -----: | :-------------------------------- |
| 类型： | `string`                          |
|  CLI： | `-f`/`--format <formatspecifier>` |
| 默认： | `"es"`                            |

该选项用于指定生成的 bundle 的格式。满足以下其中之一：

- `amd` – 异步模块加载，适用于 RequireJS 等模块加载器
- `cjs` – CommonJS，适用于 Node 环境和其他打包工具（别名：`commonjs`）
- `es` – 将 bundle 保留为 ES 模块文件，适用于其他打包工具，以及支持 `<script type=module>` 标签的浏览器。（别名：`esm`，`module`）
- `iife` – 自执行函数，适用于 `<script>` 标签（如果你想为你的应用程序创建 bundle，那么你可能会使用它）。`iife` 表示“自执行 [函数表达式](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function)”
- `umd` – 通用模块定义规范，同时支持 `amd`，`cjs` 和 `iife`
- `system` – SystemJS 模块加载器的原生格式（别名：`systemjs`）

### output.globals {#output-globals}

|  |  |
| --: | :-- |
| 类型： | `{ [id: string]: string }\| ((id: string) => string)` |
| CLI： | `-g`/`--globals <external-id:variableName,another-external-id:anotherVariableName,...>` |

该选项用于在 `umd` / `iife` bundle 中，使用 `id: variableName` 键值对指定外部依赖。例如，在这样的情况下：

```js
import $ from 'jquery';
```

我们需要告诉 Rollup `jquery` 是外部依赖，`jquery` 模块的 ID 为全局变量 `$`：

```js
// rollup.config.js
export default {
  ...,
  external: ['jquery'],
  output: {
    format: 'iife',
    name: 'MyBundle',
    globals: {
      jquery: '$'
    }
  }
};

/*
var MyBundle = (function ($) {
  // 这里编辑代码
}($));
*/
```

或者，可以提供一个函数，将外部模块的 ID 变成一个全局变量名。

当作为命令行参数时，该选项的值应该是以逗号分隔的 `id:variableName` 键值对列表：

```shell
rollup -i src/main.js ... -g jquery:$,underscore:_
```

要告诉 Rollup 用全局变量替换本地文件时，请使用一个绝对路径的 ID。

```js
// rollup.config.js
import { fileURLToPath } from 'node:url';
const externalId = fileURLToPath(
	new URL(
		'src/some-local-file-that-should-not-be-bundled.js',
		import.meta.url
	)
);

export default {
	//...,
	external: [externalId],
	output: {
		format: 'iife',
		name: 'MyBundle',
		globals: {
			[externalId]: 'globalVariable'
		}
	}
};
```

### output.name {#output-name}

|        |                              |
| -----: | :--------------------------- |
| 类型： | `string`                     |
|  CLI： | `-n`/`--name <variableName>` |

对于输出格式为 `iife` / `umd` 的 bundle 来说，若想要使用全局变量名来表示你的 bundle 时，该选项是必要的。同一页面上的其他脚本可以使用这个变量名来访问你的 bundle 输出。

```js
// rollup.config.js
export default {
  ...,
  output: {
    file: 'bundle.js',
    format: 'iife',
    name: 'MyBundle'
  }
};

// var MyBundle = (function () {...
```

该选项也支持命名空间，即可以包含点 `.` 的名字。最终生成的 bundle 将包含命名空间所需要的设置。

```shell
rollup -n "a.b.c"

/* ->
this.a = this.a || {};
this.a.b = this.a.b || {};
this.a.b.c = ...
*/
```

### output.plugins {#output-plugins}

|        |                                                  |
| -----: | :----------------------------------------------- |
| 类型： | `MaybeArray<MaybePromise<OutputPlugin \| void>>` |

该选项用于指定输出插件。关于如何使用特定输出的插件，请查看 [使用输出插件](../tutorial/index.md#using-output-plugins)，关于如何编写自己的插件，请查看 [插件](../plugin-development/index.md)。对于从包中引入的插件，记得要调用引入的插件函数（即调用 `commonjs()`，而不仅仅是 `commonjs`）。返回值为假的插件将被忽略，这样可以用来灵活启用或禁用插件。嵌套的插件将扁平化。异步插件将等待和被解决。

并非所有的插件都可以通过该选项使用。`output.plugins` 仅限于在 `bundle.generate()` 或 `bundle.write()` 阶段，即在 Rollup 的主要分析完成后运行钩子的插件才可使用。如果你是一个插件作者，请查看 [输出生成钩子](../plugin-development/index.md#output-generation-hooks) 章节以了解哪些钩子可以使用。

以下是一个使用压缩插件作用于其中一个输出的例子：

```js
// rollup.config.js
import terser from '@rollup/plugin-terser';

export default {
	input: 'main.js',
	output: [
		{
			file: 'bundle.js',
			format: 'es'
		},
		{
			file: 'bundle.min.js',
			format: 'es',
			plugins: [terser()]
		}
	]
};
```

### plugins {#plugins}

|        |                                            |
| -----: | :----------------------------------------- |
| 类型： | `MaybeArray<MaybePromise<Plugin \| void>>` |

关于如何使用插件的更多信息，请查看 [使用插件](../tutorial/index.md#using-plugins)章节，关于如何编写你自己的插件，请查看 [插件](../plugin-development/index.md)章节（试试看吧，它并不像听起来那么困难，你可以通过 Rollup 插件做很多拓展）。对于从包中引入的插件，记住要调用引入的插件函数（即调用 `commonjs()`，而不仅仅是 `commonjs`）。返回值为假的插件将被忽略，这样可以用来灵活启用或禁用插件。嵌套的插件将扁平化。异步插件将等待和被解决。

```js
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const isProduction = process.env.NODE_ENV === 'production';

export default (async () => ({
	input: 'main.js',
	plugins: [
		resolve(),
		commonjs(),
		isProduction && (await import('@rollup/plugin-terser')).default()
	],
	output: {
		file: 'bundle.js',
		format: 'cjs'
	}
}))();
```

（上述例子还演示了如何使用一个异步 IIFE 和动态引入来避免引入不必要的模块，这可能会使打包过程变慢。）

## 进阶功能 {#advanced-functionality}

### cache {#cache}

|        |                          |
| -----: | :----------------------- |
| 类型： | `RollupCache \| boolean` |
| 默认： | `true`                   |

该选项用于指定之前 bundle 的 `cache` 属性。使用该设置，Rollup 将只会对改变的模块重新分析，从而加速观察模式中后续的构建。将此选项明确设置为 `false` 将阻止 bundle 生成 `cache` 属性，也将导致插件的缓存失效。

```js
const rollup = require('rollup');
let cache;

async function buildWithCache() {
	const bundle = await rollup.rollup({
		cache // 如果值为假，则忽略
		// ... 其他输入项
	});
	cache = bundle.cache; // 保存之前构建的缓存对象
	return bundle;
}

buildWithCache()
	.then(bundle => {
		// ... 操作 bundle
	})
	.then(() => buildWithCache()) // 将使用之前构建的缓存
	.then(bundle => {
		// ... 操作 bundle
	});
```

### logLevel {#loglevel}

|          |                        |
| -------: | :--------------------- |
|    类型：| `LogLevel \| "silent"` |
|     CLI: | `--logLevel <level>`   |
|    默认：| `"info"`               |

该选项决定哪些日志将被处理。查看 [`onLog`](#onlog) 以了解可用的日志级别。默认的 `logLevel` 为 `"info"`，这意味着 info 和 warning 日志将被处理，而 debug 日志将被忽略，这意味着它们既不会传递给插件 [`onLog`](../plugin-development/index.md#onlog) 钩子，也不会传递给 `onLog` 选项或打印到控制台。

当使用命令行时，错误日志仍将打印到控制台，因为它们不会通过日志系统处理。查看 [`--silent`](../command-line-interface/index.md#silent) 标志以了解如何抑制错误日志。

### makeAbsoluteExternalsRelative {#makeabsoluteexternalsrelative}

|  |  |
| --: | :-- |
| 类型： | `boolean\| "ifRelativeSource"` |
| CLI： | `--makeAbsoluteExternalsRelative`/`--no-makeAbsoluteExternalsRelative` |
| 默认： | `"ifRelativeSource"` |

该选项决定外部依赖的绝对路径是否应该在输出中转换为相对路径。本选项不仅适用于源文件中的绝对路径，也适用于由插件或 Rollup 核心解析出的绝对路径。

值为 `true` 时，像 `import "/Users/Rollup/project/relative.js"` 这样的外部引入将被转换为相对路径。当把绝对路径转换为相对路径时，Rollup _不考虑_ `file` 或 `dir` 选项，因为这些选项可能不存在，比如在使用 JavaScript API 的构建中。相反，它假设输出 bundle 的根目录位于 bundle 中包含的所有模块的同一父目录。比如说所有模块的公共父目录是 `"/Users/Rollup/project"`，上面的引入可能会在输出中被转换为 `import "./relative.js"`。如果输出 chunk 本身是嵌套在一个子目录中，通过设置例如 `chunkFileNames: "chunks/[name].js"`，那么引入将会转换为 `"../relative.js"`。

如上所述，这也适用于最初的相对引入，如 `import "./relative.js"`，在被 [`external`](#external) 选项标记为外部依赖之前会被解析为绝对路径。

一个常见的问题是，这种机制也会适用于像 `import "/absolute.js'"` 这样的引入，导致输出中出现意外的相对路径。

对于这种情况，设置为 `"ifRelativeSource"` 可以检查原始引入是否是相对引入，然后在输出时才将其转换为相对引入。设置为 `false` 将在输出时保持所有路径为绝对路径。

请注意，当一个相对路径使用 [`external`](#external) 选项直接标记为 "外部依赖" 时，那么它在输出时会是相同的相对路径。当它通过插件或 Rollup 核心解析，然后标记为外部依赖后，上述逻辑将适用。

### maxParallelFileOps {#maxparallelfileops}

|        |                                 |
| -----: | :------------------------------ |
| 类型： | `number`                        |
|  CLI： | `--maxParallelFileOps <number>` |
| 默认： | 20                              |

该选项限制 rollup 在读取模块或写入 chunk 时，同时能打开的文件数量。如果没有限制或者数值足够高，构建可能会失败，显示“EMFILE: Too many open files”（EMFILE：打开的文件数过多）。这取决于操作系统限制的句柄数（open file handles）大小。

### onLog {#onlog}

|  |  |
| --: | :-- |
| Type: | `(level: LogLevel, log: RollupLog, defaultHandler: LogOrStringHandler) => void;` |

```typescript
type LogLevel = 'warn' | 'info' | 'debug';

type LogOrStringHandler = (
	level: LogLevel | 'error',
	log: string | RollupLog
) => void;

// 所有可能的属性，实际的属性都取决 log
interface RollupLog {
	binding?: string;
	cause?: Error;
	code?: string;
	exporter?: string;
	frame?: string; // 始终会被 CLI 打印出来
	hook?: string;
	id?: string; // 始终会被 CLI 打印出来
	ids?: string[];
	loc?: {
		column: number;
		file?: string;
		line: number;
	}; // 只要 id 存在，就始终会被 CLI 打印出来
	message: string; // 实际信息，始终会被 CLI 打印出来
	meta?: any; // add custom plugin properties to logs
	names?: string[];
	plugin?: string; // added by Rollup for plugin logs, only printed for warnings
	pluginCode?: string; // added by Rollup for plugin logs that contain a code
	pos?: number;
	reexporter?: string;
	stack?: string; // url for additional information, always printed by the CLI
	url?: string;
}
```

一个用于截取日志信息的函数。如果未提供，日志将打印到控制台，其中 Rollup CLI 会聚合某些 `"warn"` 日志，并在构建完成后打印汇总的警告，以减少干扰。当使用 [`--silent`](../command-line-interface/index.md#silent) 命令行选项时，也会触发此处理程序。

该函数接收三个参数：日志级别、日志对象和默认处理程序。日志对象至少有一个 `code` 和一个 `message` 属性，允许你控制如何处理不同类型的日志。其他属性根据日志类型添加。参见 [`utils/logs.ts`](https://github.com/rollup/rollup/blob/master/src/utils/logs.ts)，查看内置错误和日志的完整列表，以及它们的代码和属性。

如果不调用默认处理程序，日志将不会打印到控制台。此外，您可以通过调用不同级别的默认处理程序来改变日志级别。使用附加级别 `"error"` 将把日志转换为一个抛出的错误，该错误具有附加的所有日志属性。

```js
// rollup.config.js
export default {
	//...
	onLog(level, log, handler) {
		if (log.code === 'CIRCULAR_DEPENDENCY') {
			return; // 忽略循环依赖警告
		}
		if (level === 'warn') {
			handler('error', log); // 将其他警告转为错误
		} else {
			handler(level, info); // 否则直接打印出日志
		}
	}
};
```

这个处理程序不会在日志被 [`logLevel`](#loglevel) 选项过滤掉时被调用。例如，默认情况下，`"debug"` 日志将被忽略。

一些日志也有 `loc` 和 `frame` 属性，允许你定位日志的源：

```js
// rollup.config.js
export default {
	//...
	onLog(level, { loc, frame, message }) {
		if (loc) {
			console.warn(`${loc.file} (${loc.line}:${loc.column}) ${message}`);
			if (frame) console.warn(frame);
		} else {
			console.warn(message);
		}
	}
};
```

### onwarn {#onwarn}

|  |  |
| --: | :-- |
| 类型： | `(warning: RollupLog, defaultHandler: (warning: string \| RollupLog) => void) => void;` |

一个函数，用于拦截警告信息。它与 [`onLog`](#onlog) 非常相似，但只接收警告。如果调用默认处理程序，日志将被处理为警告。如果提供了 `onLog` 和 `onwarn` 处理程序，只有当 `onLog` 调用其默认处理程序时，`onwarn` 处理程序才会被调用，且 `level` 为 `warn`。

查看 [`onLog`](#onlog) 了解更多信息

### output.assetFileNames {#output-assetfilenames}

|        |                                               |
| -----: | :-------------------------------------------- |
| 类型： | `string\| ((assetInfo: AssetInfo) => string)` |
|  CLI： | `--assetFileNames <pattern>`                  |
| 默认： | `"assets/[name]-[hash][extname]"`             |

该选项的值是一个匹配模式，用于自定义构建结果中的静态资源名称，或者值为一个函数，对每个资源调用以返回匹配模式。这种模式支持以下的占位符：

- `[extname]`：包含点的静态资源文件扩展名，例如 `.css`。
- `[ext]`：不包含点的文件扩展名，例如 `css`。
- `[hash]`：基于静态资源内容的哈希。也可以通过例如 `[hash:10]` 设置一个特定的哈希值长度。
- `[name]`：静态资源的名称，不包含扩展名。

正斜杠 `/` 可以用来划分文件到子目录。当值为函数时，`assetInfo` 是 [`generateBundle`](../plugin-development/index.md#generatebundle) 中没有 `fileName` 的简化版本。另见[`output.chunkFileNames`](#output-chunkfilenames)，[`output.entryFileNames`](#output-entryfilenames)。

### output.banner/output.footer {#output-banner-output-footer}

|        |                                                              |
| -----: | :----------------------------------------------------------- |
| 类型： | `string \| ((chunk: ChunkInfo) => string\| Promise<string>)` |
|  CLI： | `--banner`/`--footer <text>`                                 |

该选项用于在 bundle 前或后添加一个字符串。其值也可以是一个返回 `string` 的 `Promise` 异步函数（注意：`banner` 和 `footer` 选项不会破坏 sourcemaps）。

如果该选项值为函数，参数 `chunk` 包含了额外信息，使用了与 [`generateBundle`](../plugin-development/index.md#generatebundle) 钩子相同的 `ChunkInfo` 类型，但有以下区别：

- `code` 和 `map` 没有设置，因为该 chunk 还没有被渲染。
- 所有包含哈希值的引用 chunk 文件名将包含哈希占位符。包括 `fileName`、`imports`、`importedBindings`、`dynamicImports` 和 `implicitlyLoadedBefore`。当你在该选项返回的代码中使用这样的占位符文件名或部分文件名时，Rollup 将在 `generateBundle` 之前用实际的哈希值替换掉占位符，确保哈希值反映的是最终生成的 chunk 中的实际内容，包括所有引用的文件哈希值。

`chunk` 是可变的，在这个钩子中应用的变化将传递到其他插件和生成的 bundle 中。这意味着如果你在这个钩子中增加或删除引入或导出，你应该更新 `imports`、`importedBindings` 以及 `exports`。

```js
// rollup.config.js
export default {
  ...,
  output: {
    ...,
    banner: '/* my-library version ' + version + ' */',
    footer: '/* follow me on Twitter! @rich_harris */'
  }
};
```

另见 [`output.intro/output.outro`](#output-intro-output-outro)。

### output.chunkFileNames {#output-chunkfilenames}

|        |                                                |
| -----: | :--------------------------------------------- |
| 类型： | `string \| ((chunkInfo: ChunkInfo) => string)` |
|  CLI： | `--chunkFileNames <pattern>`                   |
| 默认： | `"[name]-[hash].js"`                           |

该选项用于对代码分割中产生的 chunk 自定义命名，其值也可以是一个函数，对每个 chunk 调用以返回匹配模式。这种模式支持以下的占位符：

- `[format]`：输出（output）选项中定义的格式（format），例如 `es` 或 `cjs`。
- `[hash]`：仅基于最终生成的 chunk 内容的哈希值，其中包括 [`renderChunk`](../plugin-development/index.md#renderchunk) 中的转换部分和其依赖文件哈希值。你也可以通过例如 `[hash:10]` 设置一个特定的哈希值长度。
- `[name]`：chunk 的名称。它可以通过 [`output.manualChunks`](#output-manualchunks) 选项显示的设置，或者通过插件调用 [`this.emitFile`](../plugin-development/index.md#this-emitfile) 设置。否则，它将会根据 chunk 的内容确定。

正斜杠 `/` 可以用来划分文件到子目录。当值为函数时，`chunkInfo` 是 [`generateBundle`](../plugin-development/index.md#generatebundle) 的简化版本，其中不包含依赖于文件名的属性，且没有关于所渲染模块的信息，因为只有在文件名生成之后才会渲染。另见 [`output.assetFileNames`](#output-assetfilenames)，[`output.entryFileNames`](#output-entryfilenames)。

### output.compact {#output-compact}

|        |                            |
| -----: | :------------------------- |
| 类型： | `boolean`                  |
|  CLI： | `--compact`/`--no-compact` |
| 默认： | `false`                    |

该选项用于压缩 Rollup 产生的额外代码。请注意，这个选项不会影响用户的代码。这个选择在构建已经压缩好的代码时是很有用的。

### output.dynamicImportInCjs {#output-dynamicimportincjs}

|        |                                                  |
| -----: | :----------------------------------------------- |
| 类型： | `boolean`                                        |
|  CLI： | `--dynamicImportInCjs`/`--no-dynamicImportInCjs` |
| 默认： | `true`                                           |

虽然 CommonJS 输出最初只支持 `require(…)` 语法来引入依赖，但最近的 Node 版本也开始支持 `import(…)` 语法，这是从 CommonJS 文件中引入 ES 模块的唯一方法。如果这个选项默认值为 `true`，表示 Rollup 会在 CommonJS 输出中保持外部依赖以 `import(…)` 表达式动态引入。将值设置为 `false`，以使用 `require(…)` 语法重写动态引入。

```js
// 输入
import('external').then(console.log);

// 设置 dynamicImportInCjs 为 true 或不设置的 cjs 输出
import('external').then(console.log);

// 设置 dynamicImportInCjs 为 false 的 cjs 输出
function _interopNamespaceDefault(e) {
	var n = Object.create(null);
	if (e) {
		Object.keys(e).forEach(function (k) {
			if (k !== 'default') {
				var d = Object.getOwnPropertyDescriptor(e, k);
				Object.defineProperty(
					n,
					k,
					d.get
						? d
						: {
								enumerable: true,
								get: function () {
									return e[k];
								}
						  }
				);
			}
		});
	}
	n.default = e;
	return Object.freeze(n);
}

Promise.resolve()
	.then(function () {
		return /*#__PURE__*/ _interopNamespaceDefault(require('external'));
	})
	.then(console.log);
```

### output.entryFileNames {#output-entryfilenames}

|        |                                                |
| -----: | :--------------------------------------------- |
| 类型： | `string \| ((chunkInfo: ChunkInfo) => string)` |
|  CLI： | `--entryFileNames <pattern>`                   |
| 默认： | `"[name].js"`                                  |

该选项用于指定 chunks 的入口文件模式，其值也可以是一个函数，对每个入口 chunk 调用以返回匹配模式。这种模式支持以下的占位符：

- `[format]`：输出（output）选项中定义的格式（format），例如 `es` 或 `cjs`。
- `[hash]`：仅基于最终生成的入口 chunk 内容的哈希值，其中包括 [`renderChunk`](../plugin-development/index.md#renderchunk) 中的转换部分和其依赖文件哈希值。你也可以通过例如 `[hash:10]` 设置一个特定的哈希值长度。
- `[name]`：入口文件的文件名（不包含扩展名），除非当入口文件为对象时，才用来定义不同的名称。

正斜杠 `/` 可以用来划分文件到子目录。当值为函数时，`chunkInfo` 是 [`generateBundle`](../plugin-development/index.md#generatebundle) 的简化版本，其中不包含依赖于文件名的属性，且没有关于所渲染模块的信息，因为只有在文件名生成之后才会渲染。但是，你可以访问包含 `moduleIds` 的列表。另见 [`output.assetFileNames`](#output-assetfilenames)，[`output.chunkFileNames`](#output-chunkfilenames)。

在设置 [`output.preserveModules`](#output-preservemodules) 选项时，该模式也会生效。需要注意在这种情况下，`[name]` 将包括来自输出根路径的相对路径以及可能有原始文件的扩展名，如果它不是 `.js`、`.jsx`、`.mjs`、`.cjs`、`.ts`、`.tsx`、`.mts` 或 `.cts` 的其中之一。

### output.extend {#output-extend}

|        |                          |
| -----: | :----------------------- |
| 类型： | `boolean`                |
|  CLI： | `--extend`/`--no-extend` |
| 默认： | `false`                  |

该选项用于指定是否扩展 `umd` 或 `iife` 格式中 `name` 选项定义的全局变量。当值为 `true` 时，该全局变量将定义为 `(global.name = global.name || {})`。当值为 `false` 时，`name` 选项指定的全局变量将被覆盖为 `(global.name = {})`。

### output.externalImportAssertions {#output-externalimportassertions}

|        |                                                              |
| -----: | :----------------------------------------------------------- |
| 类型： | `boolean`                                                    |
|  CLI： | `--externalImportAssertions`/`--no-externalImportAssertions` |
| 默认： | `true`                                                       |

该选项表示如果输出格式为 `es`，是否在输出中为外部引入添加引入断言。默认情况下，断言取自输入文件，但插件可以在之后添加或删除断言。例如，`import "foo" assert {type: "json"}` 将导致相同的引入出现在输出中，除非该选项赋值为 `false`。需要注意的是，一个模块的所有引入需要有一致的断言，否则会发出警告。

### output.generatedCode {#output-generatedcode}

|  |  |
| --: | :-- |
| 类型： | `"es5" \| "es2015"\| { arrowFunctions?: boolean, constBindings?: boolean, objectShorthand?: boolean, preset?: "es5"\| "es2015", reservedNamesAsProps?: boolean, symbols?: boolean }` |
| CLI： | `--generatedCode <preset>` |
| 默认： | `"es5"` |

该选项用于制定 Rollup 可以在生成的代码中安全地使用哪些语言特性。这不会转译任何用户的代码，而只改变 Rollup 在包装器和辅助函数中使用的代码。你可以从几个预设中选择一个：

- `"es5"`：不能使用 ES2015+ 的特性，比如箭头函数，不能使用引号包裹的预留词汇作为属性名。
- `"es2015"`：使用任意 ES2015 之前的 JavaScript 特性。

#### output.generatedCode.arrowFunctions {#output-generatedcode-arrowfunctions}

|  |  |
| --: | :-- |
| 类型： | `boolean` |
| CLI： | `--generatedCode.arrowFunctions`/`--no-generatedCode.arrowFunctions` |
| 默认： | `false` |

该选项表示是否为自动生成的代码片段使用箭头函数。请注意，在某些地方，比如模块封装器，Rollup 会继续生成用小括号封装的常规函数，因为在一些 JavaScript 引擎中，这些函数会提供 [明显更好的性能](https://v8.dev/blog/preparser#pife)。

#### output.generatedCode.constBindings {#output-generatedcode-constbindings}

|  |  |
| --: | :-- |
| 类型： | `boolean` |
| CLI： | `--generatedCode.constBindings`/`--no-generatedCode.constBindings` |
| 默认： | `false` |

该选项表示在某些地方和辅助函数中使用 `const` 而不是 `var`。由于代码块的作用域，会使 Rollup 产生更有效的辅助函数。

```js
// 输入
export * from 'external';

// 设置 constBindings 为 false 的 cjs 输出
var external = require('external');

Object.keys(external).forEach(function (k) {
	if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k))
		Object.defineProperty(exports, k, {
			enumerable: true,
			get: function () {
				return external[k];
			}
		});
});

// 设置 constBindings 为 true 的 cjs 输出
const external = require('external');

for (const k in external) {
	if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k))
		Object.defineProperty(exports, k, {
			enumerable: true,
			get: () => external[k]
		});
}
```

#### output.generatedCode.objectShorthand {#output-generatedcode-objectshorthand}

|  |  |
| --: | :-- |
| 类型： | `boolean` |
| CLI： | `--generatedCode.objectShorthand`/`--no-generatedCode.objectShorthand` |
| 默认： | `false` |

该选项表示当属性名称与值匹配时，是否允许在对象中使用别名。

```javascript
// input
const foo = 1;
export { foo, foo as bar };

// 设置 objectShorthand 为 false 的系统输出
System.register('bundle', [], function (exports) {
	'use strict';
	return {
		execute: function () {
			const foo = 1;
			exports({ foo: foo, bar: foo });
		}
	};
});

// 设置 objectShorthand 为 true 的系统输出
System.register('bundle', [], function (exports) {
	'use strict';
	return {
		execute: function () {
			const foo = 1;
			exports({ foo, bar: foo });
		}
	};
});
```

#### output.generatedCode.preset {#output-generatedcode-preset}

|        |                           |
| -----: | :------------------------ |
| 类型： | `"es5" \| "es2015"`       |
|  CLI： | `--generatedCode <value>` |

该选项可以选择上面列出的预设之一，同时覆盖一些选项。

```js
export default {
	// ...
	output: {
		generatedCode: {
			preset: 'es2015',
			arrowFunctions: false
		}
		// ...
	}
};
```

#### output.generatedCode.reservedNamesAsProps {#output-generatedcode-reservednamesasprops}

|  |  |
| --: | :-- |
| 类型： | `boolean` |
| CLI： | `--generatedCode.reservedNamesAsProps`/`--no-generatedCode.reservedNamesAsProps` |
| 默认： | `true` |

该选项确定像 `default` 这样的预留词，是否可以在不加引号的情况下作为属性名。这将使生成的代码语法符合 ES3 标准。但是请注意，为了完全符合 ES3 标准，你可能还需要对一些内置函数进行补丁（polyfill），比如 `Object.keys` 或 `Array.prototype.forEach`。

```javascript
// 输入
const foo = null;
export { foo as void };

// 设置 reservedNamesAsProps 为 false 的 cjs 输出
const foo = null;

exports['void'] = foo;

// 设置 reservedNamesAsProps 为 true 的 cjs 输出
const foo = null;

exports.void = foo;
```

#### output.generatedCode.symbols {#output-generatedcode-symbols}

|        |                                                        |
| -----: | :----------------------------------------------------- |
| 类型： | `boolean`                                              |
|  CLI： | `--generatedCode.symbols`/`--no-generatedCode.symbols` |
| 默认： | `false`                                                |

该选项确定是否允许在自动生成的代码片断中使用 `Symbol`。目前，该选项只控制命名空间是否将 `Symbol.toStringTag` 属性设置为正确的 `Module` 值，这意味着对于一个命名空间来说，`String(namespace)` 打印为 `[object Module]`。该值又被用于某些库和框架的特征检测。

```javascript
// 输入
export const foo = 42;

// 设置 symbols 为 false 的 cjs 输出
const foo = 42;

exports.foo = foo;

// 设置 symbols 为 true 的 cjs 输出
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const foo = 42;

exports.foo = foo;
```

### output.hoistTransitiveImports {#output-hoisttransitiveimports}

|        |                                                          |
| -----: | :------------------------------------------------------- |
| 类型： | `boolean`                                                |
|  CLI： | `--hoistTransitiveImports`/`--no-hoistTransitiveImports` |
| 默认： | `true`                                                   |

默认情况下，创建多个 chunk 时，入口 chunk 的可传递引入将以空引入的形式被打包。详细信息和背景请查看 ["Why do additional imports turn up in my entry chunks when code-splitting?"](../faqs/index.md#why-do-additional-imports-turn-up-in-my-entry-chunks-when-code-splitting)。该选项的值为 `false` 将禁用此行为。当使用 [`output.preserveModules`](#output-preservemodules) 选项时，该选项会被忽略，使得永远不会取消引入。

### output.inlineDynamicImports {#output-inlinedynamicimports}

|        |                                                      |
| -----: | :--------------------------------------------------- |
| 类型： | `boolean`                                            |
|  CLI： | `--inlineDynamicImports`/`--no-inlineDynamicImports` |
| 默认： | `false`                                              |

该选项用于内联动态引入，而不是用于创建包含新 chunk 的独立 bundle。该选项只在单一输入源时发挥作用。请注意，它会影响执行顺序：如果该模块是内联动态引入，那么它将会被立即执行。

### output.interop {#output-interop}

|  |  |
| --: | :-- |
| 类型： | `"compat" \| "auto"\| "esModule"\| "default"\| "defaultOnly"\| ((id: string) => "compat"\| "auto"\| "esModule"\| "default"\| "defaultOnly")` |
| CLI： | `--interop <value>` |
| 默认： | `"default"` |

该选项用于控制 Rollup 如何处理默认值，命名空间和动态引入像 CommonJS 这样并不支持这些概念的外部依赖格式。请注意，"default" 的默认模式是模仿 NodeJS 的行为，与 TypeScript 的 `esModuleInterop` 不同。要获得像 TypeScript 中的行为，需要明确地设置该值为 `"auto"`。在例子中，我们将使用 CommonJS 格式，但该互操作（interop）的选择也同样适用于 AMD、IIFE 和 UMD 目标。

为了理解不同的取值，我们假设打包以下代码为 `cjs`：

```js
import ext_default, * as external from 'external1';
console.log(ext_default, external.bar, external);
import('external2').then(console.log);
```

请记住，对于 Rollup 来说，`import * as ext_namespace from 'external'; console.log(ext_namespace.bar);` 完全等同于 `import {bar} from 'external'; console.log(bar);`，并且会打包出同样的代码。然而，在上面的例子中，命名空间对象本身也被传递给一个全局函数，这意味着我们需要它组成一个正确的对象。

- `"default"` 意为所需的值应该被视为引入模块的默认出口，就像在 NodeJS 中从 ES 模块上下文引入 CommonJS 一样。其也支持命名的引入，它们被视为默认引入的属性。为了创建命名空间对象，Rollup 注入了这些辅助函数：

  ```js
  var external = require('external1');

  function _interopNamespaceDefault(e) {
  	var n = Object.create(null);
  	if (e) {
  		Object.keys(e).forEach(function (k) {
  			if (k !== 'default') {
  				var d = Object.getOwnPropertyDescriptor(e, k);
  				Object.defineProperty(
  					n,
  					k,
  					d.get
  						? d
  						: {
  								enumerable: true,
  								get: function () {
  									return e[k];
  								}
  						  }
  				);
  			}
  		});
  	}
  	n.default = e;
  	return Object.freeze(n);
  }

  var external__namespace =
  	/*#__PURE__*/ _interopNamespaceDefault(external);
  console.log(external, external__namespace.bar, external__namespace);
  Promise.resolve()
  	.then(function () {
  		return /*#__PURE__*/ _interopNamespaceDefault(require('external2'));
  	})
  	.then(console.log);
  ```

- `"esModule"` 意为 ES 模块转译为所需模块，其中所需的值对应模块的命名空间，而默认的导出是导出对象的 `.default` 属性。这是唯一不会注入任何辅助函数的互操作类型：

  ```js
  var external = require('external1');
  console.log(external.default, external.bar, external);
  Promise.resolve()
  	.then(function () {
  		return require('external2');
  	})
  	.then(console.log);
  ```

  当使用 `esModule` 时，Rollup 不添加额外的辅助函数，并且对默认出口也支持实时绑定。

- `"auto"` 结合了 `"esModule"` 和 `"default"`，通过注入辅助函数，其包含在运行时检测所需的值是否包含 [`__esModule` 属性](#output-esmodule) 的代码。添加这个属性是 TypeScript `esModuleInterop`、Babel 和其他工具实现的一种解决方式，标志着所需值是 ES 模块编译后的命名空间：

  ```js
  var external = require('external1');

  function _interopNamespace(e) {
  	if (e && e.__esModule) return e;
  	var n = Object.create(null);
  	if (e) {
  		Object.keys(e).forEach(function (k) {
  			if (k !== 'default') {
  				var d = Object.getOwnPropertyDescriptor(e, k);
  				Object.defineProperty(
  					n,
  					k,
  					d.get
  						? d
  						: {
  								enumerable: true,
  								get: function () {
  									return e[k];
  								}
  						  }
  				);
  			}
  		});
  	}
  	n.default = e;
  	return Object.freeze(n);
  }

  var external__namespace = /*#__PURE__*/ _interopNamespace(external);
  console.log(
  	external__namespace.default,
  	external__namespace.bar,
  	external__namespace
  );
  Promise.resolve()
  	.then(function () {
  		return /*#__PURE__*/ _interopNamespace(require('external2'));
  	})
  	.then(console.log);
  ```

  注意 Rollup 是如何重复使用创建的命名空间对象来获得 `default` 导出的。如果不需要命名空间对象，Rollup 将使用一个更简单的辅助函数：

  ```js
  // 输入
  import ext_default from 'external';
  console.log(ext_default);

  // 输出
  var ext_default = require('external');

  function _interopDefault(e) {
  	return e && e.__esModule ? e : { default: e };
  }

  var ext_default__default = /*#__PURE__*/ _interopDefault(ext_default);
  console.log(ext_default__default.default);
  ```

- `compat` 等同于 `"auto"`，只是它对默认导出使用了一个稍微不同的辅助函数，其检查是否存在一个 `default` 属性而不是 `__esModule` 属性。除了 CommonJS 模块导出的属性 `"default"` 不应该是默认导出的这种罕见情况，该值通常有助于使互操作“正常工作”，因为它不依赖于特异的实现，而是使用鸭子类型（duck-typing）：

  ```js
  var external = require('external1');

  function _interopNamespaceCompat(e) {
  	if (e && typeof e === 'object' && 'default' in e) return e;
  	var n = Object.create(null);
  	if (e) {
  		Object.keys(e).forEach(function (k) {
  			if (k !== 'default') {
  				var d = Object.getOwnPropertyDescriptor(e, k);
  				Object.defineProperty(
  					n,
  					k,
  					d.get
  						? d
  						: {
  								enumerable: true,
  								get: function () {
  									return e[k];
  								}
  						  }
  				);
  			}
  		});
  	}
  	n.default = e;
  	return Object.freeze(n);
  }

  var external__namespace = /*#__PURE__*/ _interopNamespaceCompat(external);

  console.log(
  	external__namespace.default,
  	external__namespace.bar,
  	external__namespace
  );
  Promise.resolve()
  	.then(function () {
  		return /*#__PURE__*/ _interopNamespaceCompat(require('external2'));
  	})
  	.then(console.log);
  ```

  于 `"auto"` 类似，如果不需要命名空间，Rollup 将使用一个更简单的辅助函数：

  ```js
  // 输入
  import ext_default from 'external';
  console.log(ext_default);

  // 输出
  var ext_default = require('external');

  function _interopDefaultCompat(e) {
  	return e && typeof e === 'object' && 'default' in e
  		? e
  		: { default: e };
  }

  var ext_default__default =
  	/*#__PURE__*/ _interopDefaultCompat(ext_default);

  console.log(ext_default__default.default);
  ```

- `"defaultOnly"` 与 `"default"` 类似，但有以下几点区别：

  - 禁止命名引入。如果遇到这样的引入，Rollup 会抛出一个错误，即使是 `es` 和 `system` 格式。这样可以确保 `es` 版本的代码能够正确引入 Node 中的非内置 CommonJS 模块。
  - 虽然命名空间内再次输出 `export * from 'external';` 不被禁止，但会被忽略掉，并且会导致 Rollup 抛出警告，因为如果没有命名的输出，它们并不会产生影响。
  - 当一个命名空间对象生成时，Rollup 将会使用一个更简单的辅助函数。

  下面示例代码展示了 Rollup 产生的内容。注意，我们从代码中删除了 `external.bar`，否则，Rollup 会抛出一个错误，因为如上所述，这等同于一个命名引入。

  ```js
  var ext_default = require('external1');

  function _interopNamespaceDefaultOnly(e) {
  	return Object.freeze({ __proto__: null, default: e });
  }

  var ext_default__namespace =
  	/*#__PURE__*/ _interopNamespaceDefaultOnly(ext_default);
  console.log(ext_default, ext_default__namespace);
  Promise.resolve()
  	.then(function () {
  		return /*#__PURE__*/ _interopNamespaceDefaultOnly(
  			require('external2')
  		);
  	})
  	.then(console.log);
  ```

- 当值为一个函数时，Rollup 将把每个外部依赖 id 传递给这个函数，以控制每个依赖关系的互操作类型。

  例如，如果所有的依赖都是 CommonJs，下面的配置将确保只允许从 Node 内置的命名引入：

  ```js
  // rollup.config.js
  import builtins from 'builtins';
  const nodeBuiltins = new Set(builtins());

  export default {
  	// ...
  	output: {
  		// ...
  		interop(id) {
  			if (nodeBuiltins.has(id)) {
  				return 'default';
  			}
  			return 'defaultOnly';
  		}
  	}
  };
  ```

有一些额外的选项对生成互操作的代码有影响：

- 设置 [`output.externalLiveBindings`](#output-externallivebindings) 为 `false` 将生成简化的命名空间辅助函数，以及简化提取默认引入的代码。
- 设置 [`output.freeze`](#output-freeze) 为 `false` 将防止生成的互操作命名空间对象被冻结（`Object.freeze()`）。

### output.intro/output.outro {#output-intro-output-outro}

|        |                                                              |
| -----: | :----------------------------------------------------------- |
| 类型： | `string \| ((chunk: ChunkInfo) => string\| Promise<string>)` |
|  CLI： | `--intro`/`--outro <text>`                                   |

除了在特定格式中代码不同外，该选项功能和 [`output.banner/output.footer`](#output-banner-output-footer) 类似。

```js
export default {
	//...,
	output: {
		//...,
		intro: 'const ENVIRONMENT = "production";'
	}
};
```

### output.manualChunks {#output-manualchunks}

|  |  |
| --: | :-- |
| 类型： | `{ [chunkAlias: string]: string[] } \| ((id: string, {getModuleInfo, getModuleIds}) => string \| void)` |

该选项允许你创建自定义的公共 chunk。当值为对象形式时，每个属性代表一个 chunk，其中包含列出的模块及其所有依赖，除非他们已经在其他 chunk 中，否则将会是模块图（module graph）的一部分。chunk 的名称由对象属性的键决定。

请注意，列出的模块本身不一定是模块图的一部分，该特性对于使用 `@rollup/plugin-node-resolve` 包并从中使用深度引用（deep imports）是非常有用的。例如：

```javascript
({
	manualChunks: {
		lodash: ['lodash']
	}
});
```

上述例子中，即使你只是使用 `import get from 'lodash/get'` 形式引入，Rollup 也会将 lodash 的所有模块放到一个自定义 chunk 中。

当该选项值为函数形式时，每个被解析的模块都会经过该函数处理。如果函数返回字符串，那么该模块及其所有依赖将被添加到以返回字符串命名的自定义 chunk 中。例如，以下例子会创建一个命名为 `vendor` 的 chunk，它包含所有在 `node_modules` 中的依赖：

```javascript
function manualChunks(id) {
	if (id.includes('node_modules')) {
		return 'vendor';
	}
}
```

请注意，如果自定义 chunk 在使用相应模块之前触发了副作用，那么它可能改变整个应用的行为。

当 `manualChunks` 值为函数形式时，它的第二个参数是一个对象，包含 `getModuleInfo` 函数和 `getModuleIds` 函数，其工作方式与插件上下文中的 [`this.getModuleInfo`](../plugin-development/index.md#this-getmoduleinfo) 和 [`this.getModuleIds`](../plugin-development/index.md#this-getmoduleids) 相同。

该选项可以用于根据模块在模块图中的位置动态确定它应该被放在哪个自定义 chunk 中。例如，考虑有这样一个场景，有一组组件，每个组件动态引入一组已转译的依赖，即：

```js
// 在 “foo” 组件中

function getTranslatedStrings(currentLanguage) {
	switch (currentLanguage) {
		case 'en':
			return import('./foo.strings.en.js');
		case 'de':
			return import('./foo.strings.de.js');
		// ...
	}
}
```

如果有很多这样的组件一起使用，则会导致生成许多很小的动态引入 chunk：尽管我们知道由同一 chunk 引入的所有相同语言的语言文件将始终一起使用，但是 Rollup 并不知道。

下面代码将会合并所有仅由单个入口使用的相一语言文件：

```js
function manualChunks(id, { getModuleInfo }) {
	const match = /.*\.strings\.(\w+)\.js/.exec(id);
	if (match) {
		const language = match[1]; // 例如 “en”
		const dependentEntryPoints = [];

		// 在这里，我们使用 Set 一次性处理每个依赖模块
		// 它可以阻止循环依赖中的无限循环
		const idsToHandle = new Set(getModuleInfo(id).dynamicImporters);

		for (const moduleId of idsToHandle) {
			const { isEntry, dynamicImporters, importers } =
				getModuleInfo(moduleId);
			if (isEntry || dynamicImporters.length > 0)
				dependentEntryPoints.push(moduleId);

			// Set 迭代器足够智能，可以处理
			// 在迭代过程中添加元素
			for (const importerId of importers) idsToHandle.add(importerId);
		}

		// 如果仅有一个入口，那么我们会根据入口名
		// 将它放到独立的 chunk 中
		if (dependentEntryPoints.length === 1) {
			return `${
				dependentEntryPoints[0].split('/').slice(-1)[0].split('.')[0]
			}.strings.${language}`;
		}
		// 对于多个入口，我们会把它放到“共享”的 chunk 中
		if (dependentEntryPoints.length > 1) {
			return `shared.strings.${language}`;
		}
	}
}
```

### output.minifyInternalExports {#output-minifyinternalexports}

|  |  |
| --: | :-- |
| 类型： | `boolean` |
| CLI： | `--minifyInternalExports`/`--no-minifyInternalExports` |
| 默认： | 在 `es`、`system` 格式下或者 `output.compact` 值为 `true` 的情况下值为 `true`，否则为 `false` |

默认情况下，在 `es`、`system` 格式下或者 `output.compact` 值为 `true` 的情况下该选项值为 `true`，这意味着 Rollup 会尝试把内部变量导出为单个字母的变量，以便更好地压缩代码。

**示例**<br> 输入：

```js
// main.js
import './lib.js';

// lib.js
import('./dynamic.js');
export const importantValue = 42;

// dynamic.js
import { importantValue } from './lib.js';
console.log(importantValue);
```

`output.minifyInternalExports: true` 时，输出为：

```js
// main.js
import './main-5532def0.js';

// main-5532def0.js
import('./dynamic-402de2f0.js');
const importantValue = 42;

export { importantValue as i };

// dynamic-402de2f0.js
import { i as importantValue } from './main-5532def0.js';

console.log(importantValue);
```

`output.minifyInternalExports: false` 时，输出为：

```js
// main.js
import './main-5532def0.js';

// main-5532def0.js
import('./dynamic-402de2f0.js');
const importantValue = 42;

export { importantValue };

// dynamic-402de2f0.js
import { importantValue } from './main-5532def0.js';

console.log(importantValue);
```

该选项值为 `true` 时，尽管表面上会导致代码输出变大，但实际上，如果你使用了压缩工具，代码输出会更小。在这种情况下，`export { importantValue as i }` 理论上会被压缩成，比如 `export{a as i}`，甚至是 `export{i}`，但实际上输出的是 `export{ a as importantValue }`，因为压缩工具通常不会改变导出签名。

### output.paths {#output-paths}

|        |                                                        |
| -----: | :----------------------------------------------------- |
| 类型： | `{ [id: string]: string } \| ((id: string) => string)` |

该选项用于将外部依赖 ID 映射为路径。其中，外部依赖 ID 是指该选项 [无法解析](../troubleshooting/index.md#warning-treating-module-as-external-dependency) 的模块或者通过 [`external`](#external) 选项明确指定的模块。`output.paths` 提供的路径会取代模块 ID，在生成的 bundle 中使用，比如你可以从 CDN 中加载依赖：

```js
// app.js
import { selectAll } from 'd3';
selectAll('p').style('color', 'purple');
// ...

// rollup.config.js
export default {
	input: 'app.js',
	external: ['d3'],
	output: {
		file: 'bundle.js',
		format: 'amd',
		paths: {
			d3: 'https://d3js.org/d3.v4.min'
		}
	}
};

// bundle.js
define(['https://d3js.org/d3.v4.min'], function (d3) {
	d3.selectAll('p').style('color', 'purple');
	// ...
});
```

### output.preserveModules {#output-preservemodules}

|        |                                            |
| -----: | :----------------------------------------- |
| 类型： | `boolean`                                  |
|  CLI： | `--preserveModules`/`--no-preserveModules` |
| 默认： | `false`                                    |

该选项将使用原始模块名作为文件名，为所有模块创建单独的 chunk，而不是创建尽可能少的 chunk。它需要配合 [`output.dir`](#output-dir) 选项一起使用。除屑优化（Tree-shaking）仍会对没有被入口使用或者执行阶段没有副作用的文件生效，并删除不属于入口起点的未使用文件的导出。另一方面，如果插件（如 `@rollup/plugin-commonjs`）为实现某些结果而产生了额外的“虚拟”文件，这些文件将作为实际文件使用 `_virtual/fileName.js` 模式产生。

因此，如果你直接想从这些文件中引入，不建议盲目地使用这个选项将整个文件结构转换为另一种格式，因为预期的输出可能会丢失。在这种情况下，你应该把所有文件明确指定为入口，把它们添加到 [`input` 选项对象](#input) 中，可以查看那里的例子。

请注意，在转换为 `cjs` 或 `amd` 格式时，设置 [`output.exports`](#output-exports) 的值为 `auto` 可以默认把每个文件作为入口点。这意味着，例如对于 `cjs`，只包含默认导出的文件将会渲染为：

```js
// 输入 main.js
export default 42;

// 输出 main.js
('use strict');

var main = 42;

module.exports = main;
```

直接将值赋值给 `module.exports`。如果有人引入此文件，他们可以通过以下方式访问默认导出

```js
const main = require('./main.js');
console.log(main); // 42
```

与常规入口点一样，混合使用默认导出和命名导出的模块将会产生警告。你可以通过设置 `output.exports: "named"`，强制所有文件使用命名导出模式来避免出现警告。在这种情况下，可以通过导出的 `.default` 属性访问默认导出：

```js
// 输入 main.js
export default 42;

// 输出 main.js
('use strict');

Object.defineProperty(exports, '__esModule', { value: true });

var main = 42;

exports.default = main;

// 使用
const main = require('./main.js');
console.log(main.default); // 42
```

### output.preserveModulesRoot {#output-preservemodulesroot}

|        |                                          |
| -----: | :--------------------------------------- |
| 类型： | `string`                                 |
|  CLI： | `--preserveModulesRoot <directory-name>` |

当 [`output.preserveModules`](#output-preservemodules) 值为 `true` 时，输入模块的目录路径应从 [`output.dir`](#output-dir) 路径中剥离出来。

例如，给定以下配置：

```javascript
export default {
	input: ['src/module.js', `src/another/module.js`],
	output: [
		{
			format: 'es',
			dir: 'dist',
			preserveModules: true,
			preserveModulesRoot: 'src'
		}
	]
};
```

`preserveModulesRoot` 设置确保输入的模块会输出到 `dist/module.js` 和 `dist/another/module.js` 路径。

在使用 `@rollup/plugin-node-resolve` 等插件时，这个选项特别有用，它可能导致输出目录结构的变化。当第三方模块没有标记为 [`external`](#external) 时，或者在 monorepo 中多个包相互依赖时，没有标记为 [`external`](#external)，都可能发生这种情况。

### output.sourcemap {#output-sourcemap}

|        |                                     |
| -----: | :---------------------------------- |
| 类型： | `boolean \| 'inline'\| 'hidden'`    |
|  CLI： | `-m`/`--sourcemap`/`--no-sourcemap` |
| 默认： | `false`                             |

如果该选项值为 `true`，那么将生成一个独立的 sourcemap 文件。如果值为 `"inline"`，那么 sourcemap 会以 data URI 的形式附加到 `output` 文件末尾。如果值为 `"hidden"`，那么它的表现和 `true` 相同，除了 bundle 文件中将没有 sourcemap 的注释。

### output.sourcemapBaseUrl {#output-sourcemapbaseurl}

|        |                            |
| -----: | :------------------------- |
| 类型： | `string`                   |
|  CLI： | `--sourcemapBaseUrl <url>` |

默认情况下，Rollup 生成的 sourcemap 使用相对 URL 路径来引用它们描述的文件。该选项可提供一个绝对基础 URL 路径，例如 `https://example.com`，sourcemap 将使用绝对 URL 路径来代替。

### output.sourcemapExcludeSources {#output-sourcemapexcludesources}

|        |                                                            |
| -----: | :--------------------------------------------------------- |
| 类型： | `boolean`                                                  |
|  CLI： | `--sourcemapExcludeSources`/`--no-sourcemapExcludeSources` |
| 默认： | `false`                                                    |

如果该选项的值为 `true`，那么实际源代码将不会被添加到 sourcemap 文件中，从而使其变得更小。

### output.sourcemapFile {#output-sourcemapfile}

|        |                                         |
| -----: | :-------------------------------------- |
| 类型： | `string`                                |
|  CLI： | `--sourcemapFile <file-name-with-path>` |

该选项用于指定生成 sourcemap 文件的位置。如果是一个绝对路径，那么 sourcemap 文件中的所有 `sources` 文件路径都相对于该路径。`map.file` 属性是 `sourcemapFile` 的基本名称，因为 sourcemap 文件一般是和其构建后的 bundle 处于同一目录。

如果 `output` 设置了值，那么 `sourcemapFile` 不是必须的，这种情况下，它的值会通过输出文件名中添加“.map”推断出来。

<<<<<<< HEAD
### output.sourcemapIgnoreList {#output-sourcemapignorelist}
=======
### output.sourcemapFileNames

|       |                                                |
| ----: | :--------------------------------------------- |
| Type: | `string \| ((chunkInfo: ChunkInfo) => string)` |
|  CLI: | `--sourcemapFileNames <pattern>`               |

The pattern to use for sourcemaps, or a function that is called per sourcemap to return such a pattern. Patterns support the following placeholders:

- `[format]`: The rendering format defined in the output options, e.g. `es` or `cjs`.
- `[hash]`: A hash based only on the content of the final generated sourcemap. You can also set a specific hash length via e.g. `[hash:10]`.
- `[chunkhash]`: The same hash as the one used for the corresponding generated chunk (if any).
- `[name]`: The file name (without extension) of the entry point, unless the object form of input was used to define a different name.

Forward slashes `/` can be used to place files in sub-directories. When using a function, `chunkInfo` is a reduced version of the one in [`generateBundle`](../plugin-development/index.md#generatebundle) without properties that depend on file names and no information about the rendered modules as rendering only happens after file names have been generated. You can however access a list of included `moduleIds`. See also [`output.assetFileNames`](#output-assetfilenames), [`output.chunkFileNames`](#output-chunkfilenames).

### output.sourcemapIgnoreList
>>>>>>> 1e8355b2b68811da24e1d96dea32176b403dc377

|  |  |
| --: | :-- |
| 类型： | `boolean \| (relativeSourcePath: string, sourcemapPath: string) => boolean` |

该选项决定是否忽略 sourcemap 中列出的源文件，用于填充 [`x_google_ignoreList` source map 扩展](https://developer.chrome.com/articles/x-google-ignore-list/)。`relativeSourcePath` 是生成的 `.map` 文件到相应源文件的相对路径，而 `sourcemapPath` 是生成的 sourcemap 文件的绝对路径。

```js
import path from 'node:path';
export default {
	input: 'src/main',
	output: [
		{
			file: 'bundle.js',
			sourcemapIgnoreList: (relativeSourcePath, sourcemapPath) => {
				// 将忽略所有路径中含有 node_modules 的文件
				return relativeSourcePath.includes('node_modules');
			},
			format: 'es',
			sourcemap: true
		}
	]
};
```

当没有明确指定这个选项时，默认情况下它会把所有路径中带有 `node_modules` 的文件放在忽略列表中。你可以设置值为 `false` 来完全关闭忽略列表。

### output.sourcemapPathTransform {#output-sourcemappathtransform}

|        |                                                                 |
| -----: | :-------------------------------------------------------------- |
| 类型： | `(relativeSourcePath: string, sourcemapPath: string) => string` |

该选项用于 sourcemap 的路径转换。其中，`relativeSourcePath` 是指从生成的 `.map` 文件到相对应的源文件的相对路径，而 `sourcemapPath` 是指生成 sourcemap 文件的绝对路径。

```js
import path from 'node:path';
export default {
	input: 'src/main',
	output: [
		{
			file: 'bundle.js',
			sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
				// 将会把相对路径替换为绝对路径
				return path.resolve(
					path.dirname(sourcemapPath),
					relativeSourcePath
				);
			},
			format: 'es',
			sourcemap: true
		}
	]
};
```

### output.validate {#output-validate}

|        |                              |
| -----: | :--------------------------- |
| 类型： | `boolean`                    |
|  CLI： | `--validate`/`--no-validate` |
| 默认： | `false`                      |

该选项用于重新解析每个生成的 chunk，以检测生成的代码是否是有效的 JavaScript 代码。这对于调试使用 [`renderChunk`](../plugin-development/index.md#renderchunk) 钩子转换代码的插件所产生的输出时很有用。

如果代码是无效的，将抛出警告。请注意，如果没有错误被抛出，你就可以检查输出代码。要把这个警告提升为错误，你可以在 [`onwarn`](#onwarn) 中查询。

### preserveEntrySignatures {#preserveentrysignatures}

|  |  |
| --: | :-- |
| 类型： | `"strict" \| "allow-extension" \| "exports-only"\| false` |
| CLI： | `--preserveEntrySignatures <strict \| allow-extension>`/`--no-preserveEntrySignatures` |
| 默认： | `"exports-only"` |

该选项用于控制 Rollup 尝试确保入口 chunk 与基础入口模块具有相同的导出。

- 如果值设置为 `"strict"`，Rollup 将在入口 chunk 中创建与相应入口模块中完全相同的导出。如果因为需要向 chunk 中添加额外的内部导出而无法这样做，那么 Rollup 将创建一个“facade”入口 chunk，它将仅从前其他 chunk 中导出必要的绑定，但不包含任何其他代码。对于库来说，推荐使用此设置。
- 值为 `"allow-extension"`，Rollup 将在入口 chunk 中创建入口模块的所有导出，但是如果有必要，还可以添加其他导出，从而避免出现“facade”入口 chunk。对于不需要严格签名的库，此设置很有意义。
- 值为 `"exports-only"`，如果入口模块有导出，它的行为就像 `"strict"`，否则就像 `"allow-extension"`。
- 值为 `false`，Rollup 不会将入口模块中的任何导出内容添加到相应的 chunk 中，甚至不包含相应的代码，除非这些导出内容在 bundle 的其他位置使用。但是，可以将内部导出添加到入口 chunks 中。对于将入口 chunks 放置在脚本标记中的 Web 应用，推荐使用该设置，因为它可以同时减少 chunks 的数量和 bundle 的大小。

**示例**<br> 输入：

```js
// main.js
import { shared } from './lib.js';
export const value = `value: ${shared}`;
import('./dynamic.js');

// lib.js
export const shared = 'shared';

// dynamic.js
import { shared } from './lib.js';
console.log(shared);
```

`preserveEntrySignatures: "strict"` 时的输出：

```js
// main.js
export { v as value } from './main-50a71bb6.js';

// main-50a71bb6.js
const shared = 'shared';

const value = `value: ${shared}`;
import('./dynamic-cd23645f.js');

export { shared as s, value as v };

// dynamic-cd23645f.js
import { s as shared } from './main-50a71bb6.js';

console.log(shared);
```

`preserveEntrySignatures: "allow-extension"` 时的输出：

```js
// main.js
const shared = 'shared';

const value = `value: ${shared}`;
import('./dynamic-298476ec.js');

export { shared as s, value };

// dynamic-298476ec.js
import { s as shared } from './main.js';

console.log(shared);
```

`preserveEntrySignatures: false` 时的输出：

```js
// main.js
import('./dynamic-39821cef.js');

// dynamic-39821cef.js
const shared = 'shared';

console.log(shared);
```

目前，为独立的入口 chunks 覆盖此设置的唯一方法，是使用插件 API 并通过 [`this.emitFile`](../plugin-development/index.md#this-emitfile) 触发这些 chunks，而不是使用 [`input`](#input) 选项。

### strictDeprecations {#strictdeprecations}

|        |                                                  |
| -----: | :----------------------------------------------- |
| 类型： | `boolean`                                        |
|  CLI： | `--strictDeprecations`/`--no-strictDeprecations` |
| 默认： | `false`                                          |

启用此选项后，当使用废弃的功能时，Rollup 将抛出错误而不是警告。此外，如果使用了在下一个主版本（major version）被标记为废弃警告的功能时，也会抛出错误。

该选项用于让插件作者等人能尽早地为即将发布的主要版本调整其插件配置。

## 慎用选项 {#danger-zone}

除非你知道自己在做什么，否则尽量别使用这些选项！

### acorn {#acorn}

|        |                |
| -----: | :------------- |
| 类型： | `AcornOptions` |

该选项用于指定要传递给 Acorn `parse` 函数的选项，比如 `allowReserved: true`。查看 [Acorn 文档](https://github.com/acornjs/acorn/tree/master/acorn#interface) 了解更多选项。

### acornInjectPlugins {#acorninjectplugins}

|        |                                                |
| -----: | :--------------------------------------------- |
| 类型： | `AcornPluginFunction \| AcornPluginFunction[]` |

该选项用于指定注入到 Acorn 中的单个插件或者插件数组。例如要支持 JSX 预发，你可以指定

```javascript
import jsx from 'acorn-jsx';

export default {
	// … 其他选项 …
	acornInjectPlugins: [jsx()]
};
```

在你的 Rollup 配置中。请注意，这与使用 Babel 不同，因为生成的输出文件仍将包含 JSX，而 Babel 会将其替换为有效的 JavaScript 代码。

### context {#context}

|        |                               |
| -----: | :---------------------------- |
| 类型： | `string`                      |
|  CLI： | `--context <contextVariable>` |
| 默认： | `undefined`                   |

默认情况下，模块的上下文（即，全局 `this`）为 `undefined`。在极少数情况下，你可能需要将其修改为其他名称，比如 `window`。

### moduleContext {#modulecontext}

|        |                                                        |
| -----: | :----------------------------------------------------- |
| 类型： | `((id: string) => string) \| { [id: string]: string }` |

与 [`context`](#context) 相同，但每个模块要么是由 `id: context` 键值对构成的对象，要么是 `id => context` 的函数。

### output.amd {#output-amd}

|  |  |
| --: | :-- |
| 类型： | `{ id?: string, autoId?: boolean, basePath?: string, define?: string }` |

注意，`id` 仅适用于单文件构建，并且不能与 `autoId` 或 `basePath` 结合使用。

#### output.amd.id {#output-amd-id}

|        |                    |
| -----: | :----------------- |
| 类型： | `string`           |
|  CLI： | `--amd.id <amdId>` |

该选项用于设置 AMD/UMD bundle 的 ID：

```js
// rollup.config.js
export default {
  ...,
  format: 'amd',
  amd: {
    id: 'my-bundle'
  }
};

// -> define('my-bundle', ['dependency'], ...
```

#### output.amd.autoId {#output-amd-autoid}

|        |                |
| -----: | :------------- |
| 类型： | `boolean`      |
|  CLI： | `--amd.autoId` |

该选项用于设置 chunk ID 的 ID（去除“.js”扩展名后）。

```js
// rollup.config.js
export default {
  ...,
  format: 'amd',
  amd: {
    autoId: true
  }
};

// -> define('main', ['dependency'], ...
// -> define('dynamic-chunk', ['dependency'], ...
```

#### output.amd.basePath {#output-amd-basepath}

|        |                  |
| -----: | :--------------- |
| 类型： | `string`         |
|  CLI： | `--amd.basePath` |

该选项用于设置预生成的 ID 前缀路径。如果构建产物将放置在另一个 AMD 项目中，而不是在根目录中，那么这个设置是有用的。

只在 [`output.amd.autoId`](#output-amd-autoid) 下生效。

```js
// rollup.config.js
export default {
  ...,
  format: 'amd',
  amd: {
    autoId: true,
    basePath: 'some/where'
  }
};

// -> define('some/where/main', ['dependency'], ...
// -> define('some/where/dynamic-chunk', ['dependency'], ...
```

#### output.amd.define {#output-amd-define}

|        |                                     |
| -----: | :---------------------------------- |
| 类型： | `string`                            |
|  CLI： | `--amd.define <defineFunctionName>` |

该选项用于指定代替 `define` 的函数名称：

```js
// rollup.config.js
export default {
  ...,
  format: 'amd',
  amd: {
    define: 'def'
  }
};

// -> def(['dependency'],...
```

#### output.amd.forceJsExtensionForImports {#output-amd-forcejsextensionforimports}

|        |                                    |
| -----: | :--------------------------------- |
| 类型： | `boolean`                          |
|  CLI： | `--amd.forceJsExtensionForImports` |
| 默认： | `false`                            |

该选项决定为生成的 chunk 和本地 AMD 模块的引入添加 `.js` 扩展名：

```js
// rollup.config.js
export default {
  ...,
  format: 'amd',
  amd: {
    forceJsExtensionForImports: true
  }
};

// -> define(['./chunk-or-local-file.js', 'dependency', 'third/dependency'],...
```

### output.esModule {#output-esmodule}

|        |                                |
| -----: | :----------------------------- |
| 类型： | `boolean \| "if-default-prop"` |
|  CLI： | `--esModule`/`--no-esModule`   |
| 默认： | `"if-default-prop"`            |

该选项用于决定是否在生成非 ES 格式导出时添加 `__esModule: true` 属性。此属性表示导出的值是 ES 模块的命名空间，并且此模块的默认导出对应于导出对象的 `.default` 属性。

- 值为 `true`，当使用 [命名导出模式](#output-exports) 时将始终添加该属性，这与其他工具类似。
- 值为`"if-default-prop"`，仅当使用命名导出模式且存在默认导出时，才会添加该属性。微妙之处在于，如果没有默认导出，你的 CommonJS 版本的库使用者将获得所有命名导出作为默认导出，而不是出现错误或 `undefined`。我们选择将其设置为默认值，因为 `__esModule` 属性不是任何 JavaScript 运行时遵循的标准，并且会导致许多互操作问题，因此我们希望将其用于确实需要它的情况。
- 值为 `false`，即使默认导出会变成属性 `.default`，也不会添加该属性。

可以查看 [`output.interop`](#output-interop) 选项。

### output.exports {#output-exports}

|        |                                          |
| -----: | :--------------------------------------- |
| 类型： | `"auto" \| "default"\| "named"\| "none"` |
|  CLI： | `--exports <exportMode>`                 |
| 默认： | `'auto'`                                 |

该选项用于指定导出模式。默认是 `auto`，指根据 `input` 模块导出推测你的意图：

- `default` – 适用于只使用 `export default ...` 的情况；请注意，此操作可能会导致生成想要在与 ESM 输出可互换的 CommonJS 输出时出现问题，具体可见下文
- `named` – 适用于使用命名导出的情况
- `none` – 适用于没有导出的情况（比如，当你在构建应用而非库时）

由于这只是一个输出的转换过程，因此仅当默认导出是所有入口 chunk 的唯一导出时，你才能选择 `default`。同样地，仅当没有导出时，才能选择 `none`，否则 Rollup 将会抛出错误。

`default` 和 `named` 之间的差异会影响其他人使用你的 bundle 的方式。例如，如果该选项的值为 `default` 时，那么 CommonJS 用户可以通过以下方式使用你的库，例如：

```js
// your-lib 包入口
export default 'Hello world';

// CommonJS 消费者
/* require( "your-lib" ) 返回 "Hello World" */
const hello = require('your-lib');
```

如果该选项的值是 `named`，那么用户则通过以下方式使用你的库：

```js
// your-lib 包入口
export const hello = 'Hello world';

// CommonJS 消费者
/* require( "your-lib" ) 返回 {hello: "Hello World"} */
const hello = require('your-lib').hello;
/* 或使用解构 */
const { hello } = require('your-lib');
```

问题是，如果你使用 `named` 导出，但 _也_ 会有一个 `default` 导出，用户将不得不类似这样做来使用默认到处：

```js
// your-lib 包入口
export default 'foo';
export const bar = 'bar';

// CommonJS 消费者
/* require( "your-lib" ) 返回 {default: "foo", bar: "bar"} */
const foo = require('your-lib').default;
const bar = require('your-lib').bar;
/* 或使用解构 */
const { default: foo, bar } = require('your-lib');
```

请注意：一些工具，如 Babel、TypeScript、Webpack 和 `@rollup/plugin-commonjs`，它们能够解析 CommonJS 的 `require(...)` 调用，并将其转换为 ES 模块。如果你正在生成想要在与这些工具的 ESM 输出可互换的 CommonJS 输出，则应始终使用 `named` 导出模式。原因是这些工具中大多数默认情况下会在 `require` 中返回 ES 模块的命名空间，其中默认导出是 `.default` 属性。

换句话说，对于这些工具，你无法创建一个包接口，在该接口中 `const lib = require("your-lib")` 能够产生与 `import lib from "your-lib"` 相同的结果。但是，使用 `named` 导出模式，`const {lib} = require("your-lib")` 将与 `import {lib} from "your-lib"` 等效。

### output.externalLiveBindings {#output-externallivebindings}

|        |                                                      |
| -----: | :--------------------------------------------------- |
| 类型： | `boolean`                                            |
|  CLI： | `--externalLiveBindings`/`--no-externalLiveBindings` |
| 默认： | `true`                                               |

当该选项的值为 `false` 时，Rollup 不会为外部依赖生成支持动态绑定的代码，而是假定外部依赖永远不会改变。这使得 Rollup 会生成更多优化代码。请注意，当外部依赖存在循环引用时，该选项值为 `false` 可能会引起问题。

在大多数情况下，该选项值为 `false` 将避免 Rollup 生成多余代码的 getters，因此在很多情况下，可以使代码兼容 IE8。

例如：

```js
// 输入
export { x } from 'external';

// externalLiveBindings: true 时的 CJS 输出
var external = require('external');

Object.defineProperty(exports, 'x', {
	enumerable: true,
	get: function () {
		return external.x;
	}
});

// externalLiveBindings: false 时的 CJS 输出
var external = require('external');

exports.x = external.x;
```

### output.freeze {#output-freeze}

|        |                          |
| -----: | :----------------------- |
| 类型： | `boolean`                |
|  CLI： | `--freeze`/`--no-freeze` |
| 默认： | `true`                   |

该选项用于决定是否使用 `Object.freeze()` 冻结动态访问的引入对象的命名空间（例如 `import * as namespaceImportObject from...`）。

### output.indent {#output-indent}

|        |                          |
| -----: | :----------------------- |
| 类型： | `boolean \| string`      |
|  CLI： | `--indent`/`--no-indent` |
| 默认： | `true`                   |

该选项用于指定代码缩进的缩进字符串（在 `amd`，`iife`，`umd` 和 `system` 格式中）。它的值可以是 `false` （没有缩进）或 `true` （默认值——自动缩进）。

```js
// rollup.config.js
export default {
  ...,
  output: {
    ...,
    indent: false
  }
};
```

### output.noConflict {#output-noconflict}

|        |                                  |
| -----: | :------------------------------- |
| 类型： | `boolean`                        |
|  CLI： | `--noConflict`/`--no-noConflict` |
| 默认： | `false`                          |

该选项决定在 UMD bundle 中生成一个额外的 `noConflict` 导出。在 IIFE 场景中调用此方法时，该方法将返回打包的导出，同时将相应的全局变量恢复为其先前的值。

### output.sanitizeFileName {#output-sanitizefilename}

|        |                                            |
| -----: | :----------------------------------------- |
| 类型： | `boolean \| (string) => string`            |
|  CLI： | `--sanitizeFileName`/`no-sanitizeFileName` |
| 默认： | `true`                                     |

该选项值为 `false` 时禁用所有 chunk 名称的清理（移除 `\0`, `?` 和 `*` 字符）。

值也可以是一个函数，以允许自定义的 chunk 名称的清理。

### output.strict {#output-strict}

|        |                          |
| -----: | :----------------------- |
| 类型： | `boolean`                |
|  CLI： | `--strict`/`--no-strict` |
| 默认： | `true`                   |

该选项用于决定是否在生成非 ES bundle 的顶部包含“use strict”用法。严格地讲，ES 模块 _总是_ 使用严格模式，所以不要无缘无故禁用该选项。

### output.systemNullSetters {#output-systemnullsetters}

|        |                                                |
| -----: | :--------------------------------------------- |
| 类型： | `boolean`                                      |
|  CLI： | `--systemNullSetters`/`--no-systemNullSetters` |
| 默认： | `true`                                         |

在导出 `system` 模块格式时，该选项将代替空的 setter 函数，以 `null` 形式简化输出。该选项仅在 SystemJS 6.3.3 及以上版本中支持。停用这个选项，可以输出旧版 SystemJS 支持的空函数。

### preserveSymlinks {#preservesymlinks}

|        |                      |
| -----: | :------------------- |
| 类型： | `boolean`            |
|  CLI： | `--preserveSymlinks` |
| 默认： | `false`              |

当该选项值为 `false` 时，引用的文件为软链接实际指向的文件。当该选项值为 `true` 时，引入的文件为软链接所在目录的文件。为了更好的解释，思考以下例子：

```js
// /main.js
import { x } from './linked.js';
console.log(x);

// /linked.js
// 这是 /nested/file.js 的软链接

// /nested/file.js
export { x } from './dep.js';

// /dep.js
export const x = 'next to linked';

// /nested/dep.js
export const x = 'next to original';
```

如果 `preserveSymlinks` 值为 `false`，那么从 `/main.js` 将会输出“next to original”，因为它将使用软链接文件的位置来解决其依赖。然而，如果 `preserveSymlinks` 值为 `true`，那么它将会输出“next to linked”，因为软链接将无法正确解析。

### shimMissingExports {#shimmissingexports}

|        |                                                  |
| -----: | :----------------------------------------------- |
| 类型： | `boolean`                                        |
|  CLI： | `--shimMissingExports`/`--no-shimMissingExports` |
| 默认： | `false`                                          |

如果该选项值为 `true`，那么从未定义绑定的文件中引入依赖时，打包不会失败。相反，将为这些绑定创建值为 `undefined` 的新变量。

### treeshake {#treeshake}

|        |                                                      |
| -----: | :--------------------------------------------------- |
| 类型： | `boolean \| TreeshakingPreset \| TreeshakingOptions` |
|  CLI： | `--treeshake`/`--no-treeshake`                       |
| 默认： | `true`                                               |

```typescript
type TreeshakingPreset = 'smallest' | 'safest' | 'recommended';

interface TreeshakingOptions {
	annotations?: boolean;
	correctVarValueBeforeDeclaration?: boolean;
	moduleSideEffects?: ModuleSideEffectsOption;
	preset?: TreeshakingPreset;
	propertyReadSideEffects?: boolean | 'always';
	tryCatchDeoptimization?: boolean;
	unknownGlobalSideEffects?: boolean;
}

type ModuleSideEffectsOption =
	| boolean
	| 'no-external'
	| string[]
	| HasModuleSideEffects;
type HasModuleSideEffects = (id: string, external: boolean) => boolean;
```

该选项用于决定是否应用除屑优化（tree-shaking），并微调除屑优化的过程。该选项的值设置为 `false` 时，Rollup 将生成更大的 bundle，但是可能会提高构建性能。你也可以从三个预设中选择一个，如果有新的选项加入，就会自动更新：

- 值为 `"smallest"`，将选择选项值以尽可能减小输出大小。这对大多数代码库都应该有效，只要你不依赖于某些模式，目前是：
  - 有副作用的 getters 只有在返回值被使用时才会被保留（[`treeshake.propertyReadSideEffects: false`](#treeshake-propertyreadsideeffects)）
  - 只有在至少使用了一个导出值的情况下，引入模块的代码才会被保留（[`treeshake.moduleSideEffects: false`](#treeshake-modulesideeffects)）
  - 你不应该打包依赖于检测损坏的内置函数的 polyfill（[`treeshake.tryCatchDeoptimization: false`](#treeshake-trycatchdeoptimization)）
  - 一些语义问题可能被吞没（[`treeshake.unknownGlobalSideEffects: false`](#treeshake-unknownglobalsideeffects)，[`treeshake.correctVarValueBeforeDeclaration: false`](#treeshake-correctvarvaluebeforedeclaration)）
- 值为 `"recommended"`，对于大多数的使用模式来说，应该可以很好地工作。虽然一些语义问题可能会被吞没（`treeshake.unknownGlobalSideEffects: false`，`treeshake.correctVarValueBeforeDeclaration: false`）
- 值为 `"safest"`，试图在提供一些基本的除屑优化功能的同时，尽可能地符合规范。
- 值为 `true`，相当于不指定该选项，并将始终选择默认值（见下文）

如果你发现由除屑优化算法造成的 bug，请给我们提 issue！将此选项的值设置为对象意味着启用除屑优化，并启用以下选项：

#### treeshake.annotations {#treeshake-annotations}

|        |                                                        |
| -----: | :----------------------------------------------------- |
| 类型： | `boolean`                                              |
|  CLI： | `--treeshake.annotations`/`--no-treeshake.annotations` |
| 默认： | `true`                                                 |

如果该选项值为 `false`，则忽略注释中的注解提示：

##### `@__PURE__` {#pure}

包含 `@__PURE__` 或 `#__PURE__` 的注释标记特定的函数调用或构造函数调用为无副作用。这意味着 Rollup 将除屑优化，即移除调用，除非返回值在一些未除屑优化的代码中被使用。这些注解需要紧跟在调用调用之前才能生效。以下代码将完全除屑优化，除非将该选项设置为 `false`，否则它将保持不变。

```javascript
/*@__PURE__*/ console.log('side-effect');

class Impure {
	constructor() {
		console.log('side-effect');
	}
}

/*@__PURE__*/ new Impure();
```

##### `@__NO_SIDE_EFFECTS__` {#nosideeffects}

包含 `@__NO_SIDE_EFFECTS__` 或者 `#__NO_SIDE_EFFECTS__` 的注释标记函数声明本身是无副作用的。当一个函数被标记为没有副作用时，所有对该函数的调用都将被认为是没有副作用的。下面的代码将被完全除屑优化，除非将该选项设置为 `false`，否则它将保持不变。

```javascript
/*@__NO_SIDE_EFFECTS__*/
function impure() {
	console.log('side-effect');
}

/*@__NO_SIDE_EFFECTS__*/
const impureArrowFn = () => {
	console.log('side-effect');
};

impure(); // <-- call will be considered as side effect free
impureArrowFn(); // <-- call will be considered as side effect free
```

#### treeshake.correctVarValueBeforeDeclaration {#treeshake-correctvarvaluebeforedeclaration}

|  |  |
| --: | :-- |
| 类型： | `boolean` |
| CLI： | `--treeshake.correctVarValueBeforeDeclaration`/`--no-treeshake.correctVarValueBeforeDeclaration` |
| 默认： | `false` |

在某些极端情况下，如果一个变量在其声明赋值之前被访问并且未被重新赋值，那么 Rollup 可能会错误地假设该变量在整个程序中都是常量，就像下面的示例一样。但是，如果使用 `var` 声明变量，则是不正确的，因为这些变量可以在其声明之前被访问，此时它们将被定义为 `undefined`。值为 `true` 时可以确保 Rollup 不会对使用 `var` 声明的变量的值做任何假设。但请注意，这可能会对除屑优化的结果产生明显的负面影响。

```js
// 除非 treeshake.correctVarValueBeforeDeclaration === true，否则一切都将被除屑优化
let logBeforeDeclaration = false;

function logIfEnabled() {
	if (logBeforeDeclaration) {
		log();
	}

	var value = true;

	function log() {
		if (!value) {
			console.log('should be retained, value is undefined');
		}
	}
}

logIfEnabled(); // 可被移除
logBeforeDeclaration = true;
logIfEnabled(); // 需要保留，因为它展示日志
```

#### treeshake.manualPureFunctions {#treeshake-manualpurefunctions}

|        |                                           |
| -----: | :---------------------------------------- |
| 类型： | `string[]`                                |
|  CLI： | `--treeshake.manualPureFunctions <names>` |

该选项允许手动定义一个函数名列表，这些函数名应该总是被认为是“纯”的，即它们在调用时没有副作用，如改变全局状态等。检查只按名称进行。

这不仅可以帮助去除死代码，而且还可以改善 JavaScript chunk 的生成，特别是在使用 [`output.experimentalMinChunkSize`](#output-experimentalminchunksize) 时。

除了任何与该名称相匹配的函数，纯函数上的任何属性以及从纯函数返回的任何函数也将被视为纯函数，访问任何属性都不会被检查出副作用。

```js
// rollup.config.js
export default {
	treeshake: {
		preset: 'smallest',
		manualPureFunctions: ['styled', 'local']
	}
	// ...
};

// code
import styled from 'styled-components';
const local = console.log;

local(); // 去除
styled.div`
	color: blue;
`; // 去除
styled?.div(); // 去除
styled()(); // 去除
styled().div(); // 去除
```

#### treeshake.moduleSideEffects {#treeshake-modulesideeffects}

|  |  |
| --: | :-- |
| 类型： | `boolean\| "no-external"\| string[]\| (id: string, external: boolean) => boolean` |
| CLI： | `--treeshake.moduleSideEffects`/`--no-treeshake.moduleSideEffects`/`--treeshake.moduleSideEffects no-external` |
| 默认： | `true` |

如果该选项的值为 `false`，则假定像改变全局变量或不执行检查就记录等行为一样，没有引入任何内容的模块和外部依赖没有其他副作用。对于外部依赖，该选项将影响未使用的引入：

```javascript
// 输入文件
import { unused } from 'external-a';
import 'external-b';
console.log(42);
```

```javascript
// treeshake.moduleSideEffects === true 时的输出
import 'external-a';
import 'external-b';
console.log(42);
```

```javascript
// treeshake.moduleSideEffects === false 时的输出
console.log(42);
```

对于非外部依赖模块，该选项值为 `false` 时，除非来自改模块的引入被使用，否则输出中将不会包含来自该模块的任何语句：

```javascript
// 输入文件 a.js
import { unused } from './b.js';
console.log(42);

// 输入文件 b.js
console.log('side-effect');
const ignored = 'will still be removed';
```

```javascript
// treeshake.moduleSideEffects === true 时的输出
console.log('side-effect');

console.log(42);
```

```javascript
// treeshake.moduleSideEffects === false 时的输出
console.log(42);
```

该选项的值也可以是具有副作用的模块列表，或者是一个返回指定模块的函数。该选项的值为 `"no-external"` 将意味着如果可能，则仅删除外部依赖，它等同于函数 `(id, external) => !external`。

如果一个模块将此选项设置为 `false` 并从另一个模块重新导出变量，而且该变量被使用了，则扫描重新导出模块是否存在副作用的问题取决于变量的重新导出方式：

```javascript
// 输入文件 a.js
import { foo } from './b.js';
console.log(foo);

// 输入文件 b.js
// 直接重新导出将忽略副作用
export { foo } from './c.js';
console.log('this side-effect is ignored');

// 输入文件 c.js
// 非直接重新导出将包含副作用
import { foo } from './d.js';
foo.mutated = true;
console.log('this side-effect and the mutation are retained');
export { foo };

// 输入文件 d.js
export const foo = 42;
```

```javascript
// treeshake.moduleSideEffects === false 时的输出
const foo = 42;

foo.mutated = true;
console.log('this side-effect and the mutation are retained');

console.log(foo);
```

请注意，尽管名字有点误导，但此选项不会向没有副作用的模块“添加”副作用。重要的是，例如，因为你需要这个模块来跟踪依赖关系，而将空模块“包含”在 bundle 中，则插件接口允许你通过 [`resolveId`](../plugin-development/index.md#resolveid)，[`load`](../plugin-development/index.md#load) 或 [`transform`](../plugin-development/index.md#transform) 钩子将模块指定为不被除屑优化删除。

#### treeshake.preset {#treeshake-preset}

|        |                                          |
| -----: | :--------------------------------------- |
| 类型： | `"smallest" \| "safest"\| "recommended"` |
|  CLI： | `--treeshake <value>`<br>                |

该选项可以选择上面列出的预设之一，同时覆盖一些选项。

```js
export default {
	treeshake: {
		preset: 'smallest',
		propertyReadSideEffects: true
	}
	// ...
};
```

#### treeshake.propertyReadSideEffects {#treeshake-propertyreadsideeffects}

|  |  |
| --: | :-- |
| 类型： | `boolean\| 'always'` |
| CLI： | `--treeshake.propertyReadSideEffects`/`--no-treeshake.propertyReadSideEffects` |
| 默认： | `true` |

如果该选项值为 `true`，则保留未使用的属性读取，这会被 Rollup 确定为具有副作用。这包括访问 `null` 或 `undefined` 的属性，或通过属性访问触发显式 getter。请注意，这并不包括解构赋值或对象上当作函数参数传递的 getter。

如果值为 `false`，则假定读取对象的属性将永远不会有副作用。根据你的代码，禁用该属性能够显著缩小 bundle 的大小，但是如果你依赖了 getters 或非法属性访问的造成的错误，那么可能会破坏该功能。

如果值为 `'always'`，则假定所有成员属性访问，包括解构赋值，都具有副作用。建议对依赖具有副作用 getter 的代码使用此设置。它通常会导致更大的包大小，但比完全禁用 `treeshake` 更小。

```javascript
// 如果 treeshake.propertyReadSideEffects === false 将会被移除
const foo = {
	get bar() {
		console.log('effect');
		return 'bar';
	}
};
const result = foo.bar;
const illegalAccess = foo.quux.tooDeep;
```

#### treeshake.tryCatchDeoptimization {#treeshake-trycatchdeoptimization}

|  |  |
| --: | :-- |
| 类型： | `boolean` |
| CLI： | `--treeshake.tryCatchDeoptimization`/`--no-treeshake.tryCatchDeoptimization` |
| 默认： | `true` |

默认情况下，Rollup 假定在进行除屑优化时，很多运行时内置的全局变量的行为均符合最新规范，并且不会引发意外错误。为了支持，像依赖于抛出错误的特征检测工作流，Rollup 将默认禁用 try 语句中的除屑优化。如果函数参数在 try 语句中被使用，那么该参数也不会被优化处理。如果你不需要此功能，想要在 try 语句中使用除屑优化，则可以设置 `treeshake.tryCatchDeoptimization` 为 `false`。

```js
function otherFn() {
	// 尽管该函数时在 try 语句中使用，但是下列代码
	// 然会被当做无副作用而被移除
	Object.create(null);
}

function test(callback) {
	try {
		// tryCatchDeoptimization: true 时，在 try 语句块中，
		// 将保留对本来没有副作用的全局函数的调用
		Object.create(null);

		// 对其他函数的调用也被保留，但该函数的主体
		// 可能再次受到除屑优化
		otherFn();

		// 如果函数类型参数被调用，那么所有被该函数使用的
		// 参数将不会被优化
		callback();
	} catch {}
}

test(() => {
	// 将会保留
	Object.create(null);
});

// 调用将保留，但同样，otherFn 会被优化
test(otherFn);
```

#### treeshake.unknownGlobalSideEffects {#treeshake-unknownglobalsideeffects}

|  |  |
| --: | :-- |
| 类型： | `boolean` |
| CLI： | `--treeshake.unknownGlobalSideEffects`/`--no-treeshake.unknownGlobalSideEffects` |
| 默认： | `true` |

因为访问不存在的全局变量会引起错误，所以默认情况下 Rollup 保留所有对非内置全局变量的访问。该选项的值设置为 `false` 可以避免该检查。对于大多数代码库而言，这样做很可能更安全。

```js
// 输入
const jQuery = $;
const requestTimeout = setTimeout;
const element = angular.element;

// unknownGlobalSideEffects == true 时的输出
const jQuery = $;
const element = angular.element;

// unknownGlobalSideEffects == false 时的输出
const element = angular.element;
```

在这个例子中，最后一行将被始终保留，用于访问 `element` 属性，但如果 `angular` 值比如为 `null`，也可能抛出错误。为了避免这种情况的检查，可以设置 [`treeshake.propertyReadSideEffects`](#treeshake-propertyreadsideeffects) 为 `false`。

## 实验选项 {#experimental-options}

这些选项反应了尚未完全确定的新功能。因此，它们的可行性、行为和用法在次要版本（minor version）中可能发生变化。

### experimentalCacheExpiry {#experimentalcacheexpiry}

|        |                                            |
| -----: | :----------------------------------------- |
| 类型： | `number`                                   |
|  CLI： | `--experimentalCacheExpiry <numberOfRuns>` |
| 默认： | `10`                                       |

该选项用于确定在多少次执行以后，应该删除不再被插件使用的静态缓存。

### experimentalLogSideEffects {#experimentallogsideeffects}

|  |  |
| --: | :-- |
| 类型： | `boolean` |
| CLI： | `--experimentalLogSideEffects`/`--no-experimentalLogSideEffects` |
| 默认： | `false` |

该选项值为 `true` 时，将会在每个文件发现的第一个副作用打印到控制台。这对于计算哪些文件有副作用以及实际的副作用是什么非常有帮助。删除副作用可以改善除屑优化和 chunk 的生成，对于使 [`output.experimentalMinChunkSize`](#output-experimentalminchunksize) 发挥作用至关重要。

不过，该选项只记录顶层的语句。有时，例如在立即调用函数表达式的情况下，实际的副作用可能隐藏在一个嵌套表达式中。

### output.experimentalMinChunkSize {#output-experimentalminchunksize}

|          |                                     |
| -------: | :---------------------------------- |
|    类型: | `number`                            |
|    CLI: | `--experimentalMinChunkSize <size>` |
|    默认: | `1`                                 |

该选项用于为代码分割设置一个以字节为单位的最小 chunk 大小。当该值设置为默认值 `1` 时，Rollup 将尝试将不包含代码（仅包含导入和重新导出）的块合并到其他 chunk 中。仅当合并不会改变任何入口加载时执行的副作用时，才会执行合并。对于值为 `1` 的情况，仅允许执行不增加任何入口加载的代码量的合并。

较大的值将尝试将低于限制的任何 chunk 合并到其他 chunk 中。在这种情况下，可能会加载一些不必要的代码，不过也是可以接受的。同时该算法进行合并时总是尽可能地减少不必要的代码。

不幸的是，由于块的渲染插件（如最小化压缩工具）运行之前，chunk 大小是在测量之前进行的，这意味着您应该给出足够高的限额。在计算大小时，它也将考虑对顶层语句的除屑优化。

### perf {#perf}

|        |                      |
| -----: | :------------------- |
| 类型： | `boolean`            |
|  CLI： | `--perf`/`--no-perf` |
| 默认： | `false`              |

该选项用于决定是否收集打包执行耗时。当使用命令行或者配置文件时，将会展示与当前构建过程有关的详细指标。当在 [JavaScript API](../javascript-api/index.md) 中使用时，返回的 bundle 对象将包含额外的 `getTimings()` 函数，可以随时调用该函数来获取所有累计的指标。

`getTimings()` 函数返回以下对象形式：

```
{
  "# BUILD": [ 698.020877, 33979632, 45328080 ],
  "## parse modules": [ 537.509342, 16295024, 27660296 ],
  "load modules": [ 33.253778999999994, 2277104, 38204152 ],
  ...
}
```

对于每个键的值，是一个数组，其中，第一个数值表示经过的时间，第二个数值表示内存消耗的变化，第三个数值表示此步骤完成后的总内存消耗。这些步骤的顺序是通过 `Object.keys` 确定的。顶层的键以 `#` 开头，包含嵌套步骤的耗时，例如，在上面例子中，耗时 698ms 的 `# BUILD` 步骤包含了耗时 539ms 的 `## parse modules` 步骤。

## 观察选项 {#watch}

|        |                           |
| -----: | :------------------------ |
| 类型： | `WatcherOptions \| false` |
| 默认： | `{}`                      |

```typescript
interface WatcherOptions {
	buildDelay?: number;
	chokidar?: ChokidarOptions;
	clearScreen?: boolean;
	exclude?: string | RegExp | (string | RegExp)[];
	include?: string | RegExp | (string | RegExp)[];
	skipWrite?: boolean;
}
```

该选项用于指定观察模式（watch mode）的选项，或防止 Rollup 配置被观察。指定该选项为 `false`，将仅对 Rollup 使用数组配置时有效。在这种情况下，Rollup 配置将不会根据观察模式中的变更构建或重新构建，而是在 Rollup 运行时定期构建：

```js
// rollup.config.js
export default [
	{
		input: 'main.js',
		output: { file: 'bundle.cjs.js', format: 'cjs' }
	},
	{
		input: 'main.js',
		watch: false,
		output: { file: 'bundle.es.js', format: 'es' }
	}
];
```

这些选项仅在使用 `--watch` 标志或使用 `rollup.watch` 运行 Rollup 时生效。

### watch.buildDelay {#watch-builddelay}

|        |                               |
| -----: | :---------------------------- |
| 类型： | `number`                      |
|  CLI： | `--watch.buildDelay <number>` |
| 默认： | `0`                           |

该选项用于配置 Rollup 触发重新构建到执行下一次构建需要等待的时间，以毫秒为单位。默认情况下，Rollup 不会等待，但是在 chokidar 实例中配置了一个小的防抖定时器（debounce timeout）。该选项的值大于 `0` 将意味着如果配置的毫秒数没有发生变化，Rollup 只会触发一次重新构建。如果观察到多个配置变化，Rollup 将使用配置的最大构建延迟。

### watch.chokidar {#watch-chokidar}

|        |                   |
| -----: | :---------------- |
| 类型： | `ChokidarOptions` |

在观察选项中，该选项是可选对象，将传递给 [chokidar](https://github.com/paulmillr/chokidar) 实例。查阅 [chokidar 文档](https://github.com/paulmillr/chokidar#api) 以了解可用的选项。

### watch.clearScreen {#watch-clearscreen}

|        |                                                |
| -----: | :--------------------------------------------- |
| 类型： | `boolean`                                      |
|  CLI： | `--watch.clearScreen`/`--no-watch.clearScreen` |
| 默认： | `true`                                         |

该选项用于决定在触发重建是是否清除屏幕。

### watch.exclude {#watch-exclude}

|        |                                          |
| -----: | :--------------------------------------- |
| 类型： | `string \| RegExp\| (string\| RegExp)[]` |
|  CLI： | `--watch.exclude <files>`                |

该选项用于指定不需要被 watch 的文件：

```js
// rollup.config.js
export default {
  ...,
  watch: {
    exclude: 'node_modules/**'
  }
};
```

### watch.include {#watch-include}

|        |                                          |
| -----: | :--------------------------------------- |
| 类型： | `string \| RegExp\| (string\| RegExp)[]` |
|  CLI： | `--watch.include <files>`                |

该选项用于限制只能对指定文件进行观察。请注意，该选项只过滤模块图中的文件，不允许添加额外的观察文件：

```js
// rollup.config.js
export default {
  ...,
  watch: {
    include: 'src/**'
  }
};
```

### watch.skipWrite {#watch-skipwrite}

|        |                                            |
| -----: | :----------------------------------------- |
| 类型： | `boolean`                                  |
|  CLI： | `--watch.skipWrite`/`--no-watch.skipWrite` |
| 默认： | `false`                                    |

该选项用于决定是否在触发重新构建时跳过 `bundle.write()` 步骤。

## 废弃选项 {#deprecated-options}

☢️ 这些选项已经废弃，可能从未来的 Rollup 版本中移除。

### inlineDynamicImports {#inlinedynamicimports}

_请使用具有相同签名的 [`output.inlineDynamicImports`](#output-inlinedynamicimports) 选项代替。_

### manualChunks {#manualchunks}

_请使用具有相同签名的 [`output.manualChunks`](#output-manualchunks) 选项代替。_

### maxParallelFileReads {#maxparallelfilereads}

_请使用 [`maxParallelFileOps`](#maxparallelfileops) 选项代替。_

|        |                                   |
| -----: | :-------------------------------- |
| 类型： | `number`                          |
|  CLI： | `--maxParallelFileReads <number>` |
| 默认： | 20                                |

该选项限制 Rollup 在读取模块时并行打开的文件数量。如果没有限制，或者数值足够高，构建可能会失败，显示“EMFILE: Too many open files”（EMFILE：打开的文件数过多）。这取决于操作系统限制的句柄数（open file handles）大小。

### output.dynamicImportFunction {#output-dynamicimportfunction}

_请使用 [`renderDynamicImport`](../plugin-development/index.md#renderdynamicimport) 插件钩子代替。_

|        |                                  |
| -----: | :------------------------------- |
| 类型： | `string`                         |
|  CLI： | `--dynamicImportFunction <name>` |
| 默认： | `import`                         |

当输出为 ES bundle 时，该选项将会把动态引入函数重命名为该选项指定的名称。这对于使用了动态引入 polyfill 的代码非常有用，比如 [这个库](https://github.com/uupaa/dynamic-import-polyfill)。

### output.experimentalDeepDynamicChunkOptimization {#output-experimentaldeepdynamicchunkoptimization}

_该选项不再需要_

|  |  |
| --: | :-- |
| 类型： | `boolean` |
| CLI： | `--experimentalDeepDynamicChunkOptimization`/`--no-experimentalDeepDynamicChunkOptimization` |
| 默认： | `false` |

该选项是用来防止全部 chunk 优化算法带来的性能问题。由于该算法现在快得多，所以现在这个选项被 Rollup 忽略，不应该再使用。

### output.preferConst {#output-preferconst}

_请使用 [`output.generatedCode.constBindings`](#output-generatedcode-constbindings) 选项代替。_

|        |                                    |
| -----: | :--------------------------------- |
| 类型： | `boolean`                          |
|  CLI： | `--preferConst`/`--no-preferConst` |
| 默认： | `false`                            |

该选项表示在导出中使用 `const` 而不是 `var`。

### output.namespaceToStringTag {#output-namespacetostringtag}

_请使用 [`output.generatedCode.symbols`](#output-generatedcode-symbols) 选项代替。_

|        |                                                      |
| -----: | :--------------------------------------------------- |
| 类型： | `boolean`                                            |
|  CLI： | `--namespaceToStringTag`/`--no-namespaceToStringTag` |
| 默认： | `false`                                              |

该选项确定是否允许向命名空间对象添加符合规范的 `.toString()`。如果值为 `true`，

```javascript
import * as namespace from './file.js';
console.log(String(namespace));
```

将总是打印`[object Module]`。

### preserveModules {#preservemodules}

_请使用具有相同签名的 [`output.preserveModules`](#output-preservemodules) 选项代替。_
