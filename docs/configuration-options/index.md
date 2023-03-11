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

该选项用于匹配需要排除在 bundle 外部的模块，它的值可以是一个接收模块 `id` 参数并返回 `true` （表示排除）或 `false` （表示包含）的函数，也可以一个 ID 构成的 `Array`，还可以能匹配到模块 ID 的正则表达式。除此之外，它还可以只是单个的模块 ID 或正则表达式。其匹配得到的模块 ID 应该满足以下条件之一：

1. 外部依赖的名称，需要和引入语句中书写的形式一样。例如，如果想标记 `import "dependency.js"` 为外部依赖，就需要使用 `"dependency.js"` 作为模块 ID，而如果要标记 `import "dependency"` 为外部依赖，就要使用 `"dependency"`。
2. 解析过的模块 ID（比如，文件的绝对路径）。

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

请注意，如果想通过 `/node_modules/` 正则表达式过滤包的引入，例如 `import {rollup} from 'rollup'`，你需要先引入类似 [@rollup/plugin-node-resolve](https://github.com/rollup/plugins/tree/master/packages/node-resolve) 的插件，来将引入依赖解析为 `node_modules`。

当用作命令行参数时，该选项的值应该是一个以逗号分隔的模块 ID 列表：

```bash
rollup -i src/main.js ... -e foo,bar,baz
```

当该选项的值为函数时，它提供了三个参数 `(id, parent, isResolved)`，可以可以为你提供更细粒度的控制：

- `id` 为相关模块 id
- `parent` 为执行引入的模块 id
- `isResolved` 表示是否已经被插件等方式解决了模块依赖

当创建 `iife` 或 `umd` 格式的 bundle 时，你需要通过 [`output.globals`](#output-globals) 选项提供全局变量名，以替换掉外部引入。

如果一个相对引入，即以 `./` 或 `../` 开头，被标记为 `external`，rollup 将在内部将该模块 ID 解析为系统中绝对文件路径，以便引入的不同外部模块可以合并。当写入生成的 bundle 后，这些引入模块将再次被转换为相对引入。例如：

```js
// 输入
// src/main.js （入口文件）
import x from '../external.js';
import './nested/nested.js';
console.log(x);

// src/nested/nested.js
// 如果引入依赖已存在，它将指向同一个文件
import x from '.../external.js';
console.log(x);

// output
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

如果你想将一组文件转换为另一种格式，并同时保持文件结构和导出签名，推荐的方法是将每个文件变成一个入口文件，而不是使用 [`output.preserveModules`](#output-preservemodules)，后者可能会除屑导出，并产生由插件创建的虚拟文件。你可以动态地处理，例如通过 `glob` 包。

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

```sh
rollup --format es --input src/entry1.js --input src/entry2.js
# 等同于
rollup src/entry1.js src/entry2.js --format es
```

可以使用 `=` 赋值来命名 chunk：

```sh
rollup main=src/entry1.js other=src/entry2.js --format es
```

可以使用引号指定包含空格的文件名：

```sh
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
- `iife` – 自执行函数，适用于 `<script>` 标签（如果你想为你的应用程序创建 bundle，那么你可能会使用它）。`iife` 表示”自执行 [函数表达式](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function)“
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
  // code goes here
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
		// ... do something with the bundle
	})
	.then(() => buildWithCache()) // 将使用之前构建的缓存
	.then(bundle => {
		// ... do something with the bundle
	});
```

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

该选项限制 rollup 在读取模块或写入 chunk 时，同时能打开的文件数量。如果没有限制或者数值足够高，构建可能会失败，出现 "EMFILE: Too many open files"（EMFILE：打开的文件数过多）。这取决于操作系统限制的句柄数（open file handles）大小。

### onwarn {#onwarn}

|  |  |
| --: | :-- |
| 类型： | `(warning: RollupWarning, defaultHandler: (warning: string \| RollupWarning) => void) => void;` |

该选项为一个拦截警告信息的函数。如果不提供，警告将去重并打印到控制台。当在命令行使用 [`--silent`](../command-line-interface/index.md#silent) 选项时，该选项是获取警告通知的唯一途径。

该函数接收两个参数：警告对象和默认处理函数。其中，警告对象至少有一个 `code` 和一个 `message` 属性，用于控制如何处理不同种类的警告。另外，根据不同的警告类型，警告对象上会有其他的属性。可查看 [`utils/error.ts`](https://github.com/rollup/rollup/blob/master/src/utils/error.ts) 以获得完整的错误和警告列表，以及它们的代码和属性。

```js
// rollup.config.js
export default {
	//...,
	onwarn(warning, warn) {
		// 跳过指定类型的警告
		if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;

		// 抛出其他类型的警告
		// 使用 Object.assign 拷贝 new Error(warning.message) 将使
		// 命令行打印额外的信息，如警告位置
		// 和帮助 URL。
		if (warning.code === 'MISSING_EXPORT')
			throw Object.assign(new Error(), warning);

		// 使用默认处理函数兜底
		warn(warning);
	}
};
```

很多警告还具有 `loc` 和 `frame` 属性，它们可以用来定位警告来源：

```js
// rollup.config.js
export default {
  ...,
  onwarn ({ loc, frame, message }) {
    if (loc) {
      console.warn(`${loc.file} (${loc.line}:${loc.column}) ${message}`);
      if (frame) console.warn(frame);
    } else {
      console.warn(message);
    }
  }
};
```

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
	if (k !== 'default' && !exports.hasOwnProperty(k))
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
	if (k !== 'default' && !exports.hasOwnProperty(k))
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

该选项用于控制 Rollup 如何处理默认值，命名空间和动态引入像 CommonJS 这样并不支持这些概念的外部依赖格式。请注意，"default" 的默认模式是模仿 NodeJS 的行为，与 TypeScript 的`esModuleInterop` 不同。要获得像 TypeScript 中的行为，需要明确地设置该值为 `"auto"`。在例子中，我们将使用 CommonJS 格式，但该互操作（interop）的选择也同样适用于 AMD、IIFE 和 UMD 目标。

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

该选项将使用原始模块名作为文件名，为所有模块创建单独的 chunk，而不是创建尽可能少的 chunk。它需要配合 [`output.dir`](#output-dir) 选项一起使用。除屑（Tree-shaking）仍会对没有被入口使用或者执行阶段没有副作用的文件生效，并删除不属于入口起点的未使用文件的导出。另一方面，如果插件（如 `@rollup/plugin-commonjs`）为实现某些结果而产生了额外的“虚拟”文件，这些文件将作为实际文件使用 `_virtual/fileName.js` 模式产生。

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

在使用 `@rollup/plugin-node-resolve` 等插件时，这个选项特别有用，它可能导致输出目录结构的变化。当第三方模块没有标记为 [`external`](#external) 时，或者在 monorepo 中多个包相互依赖时，没有标记为[`external`](#external)，都可能发生这种情况。

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

### output.sourcemapIgnoreList {#output-sourcemapignorelist}

|  |  |
| --: | :-- |
| 类型： | `boolean \| (relativeSourcePath: string, sourcemapPath: string) => boolean` |

该选项决定是否忽略 sourcemap 中列出的源文件，用于填充 [`x_google_ignoreList` source map 扩展](https://developer.chrome.com/blog/devtools-better-angular-debugging/#the-x_google_ignorelist-source-map-extension)。`relativeSourcePath` 是生成的 `.map` 文件到相应源文件的相对路径，而 `sourcemapPath` 是生成的 sourcemap 文件的绝对路径。

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

该选项被用于例如插件作者能尽早地为即将发布的主要版本调整其插件配置。

## Danger zone

You probably don't need to use these options unless you know what you are doing!

### acorn

|        |                |
| -----: | :------------- |
| 类型： | `AcornOptions` |

Any options that should be passed through to Acorn's `parse` function, such as `allowReserved: true`. Cf. the [Acorn documentation](https://github.com/acornjs/acorn/tree/master/acorn#interface) for more available options.

### acornInjectPlugins

|        |                                                |
| -----: | :--------------------------------------------- |
| 类型： | `AcornPluginFunction \| AcornPluginFunction[]` |

A single plugin or an array of plugins to be injected into Acorn. For instance to use JSX syntax, you can specify

```javascript
import jsx from 'acorn-jsx';

export default {
	// … other options …
	acornInjectPlugins: [jsx()]
};
```

in your rollup configuration. Note that this is different from using Babel in that the generated output will still contain JSX while Babel will replace it with valid JavaScript.

### context

|          |                               |
| -------: | :---------------------------- |
|   类型： | `string`                      |
| 命令行： | `--context <contextVariable>` |
| Default: | `undefined`                   |

By default, the context of a module – i.e., the value of `this` at the top level – is `undefined`. In rare cases you might need to change this to something else, like `'window'`.

### moduleContext

|        |                                                        |
| -----: | :----------------------------------------------------- |
| 类型： | `((id: string) => string) \| { [id: string]: string }` |

Same as [`context`](#context), but per-module – can either be an object of `id: context` pairs, or an `id => context` function.

### output.amd

|  |  |
| --: | :-- |
| 类型： | `{ id?: string, autoId?: boolean, basePath?: string, define?: string }` |

Note `id` can only be used for single-file builds, and cannot be combined with `autoId`/`basePath`.

#### output.amd.id

|          |                    |
| -------: | :----------------- |
|   类型： | `string`           |
| 命令行： | `--amd.id <amdId>` |

An ID to use for AMD/UMD bundles:

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

#### output.amd.autoId

|          |                |
| -------: | :------------- |
|   类型： | `boolean`      |
| 命令行： | `--amd.autoId` |

Set the ID to the chunk ID (with the '.js' extension removed).

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

#### output.amd.basePath

|          |                  |
| -------: | :--------------- |
|   类型： | `string`         |
| 命令行： | `--amd.basePath` |

The path that will be prepended to the auto generated ID. This is useful if the build is going to be placed inside another AMD project, and is not at the root.

Only valid with [`output.amd.autoId`](#output-amd-autoid).

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

#### output.amd.define

|          |                                     |
| -------: | :---------------------------------- |
|   类型： | `string`                            |
| 命令行： | `--amd.define <defineFunctionName>` |

A function name to use instead of `define`:

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

#### output.amd.forceJsExtensionForImports

|          |                                    |
| -------: | :--------------------------------- |
|   类型： | `boolean`                          |
| 命令行： | `--amd.forceJsExtensionForImports` |
| Default: | `false`                            |

Add `.js` extension for imports of generated chunks and local AMD modules:

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

### output.esModule

|          |                                |
| -------: | :----------------------------- |
|   类型： | `boolean \| "if-default-prop"` |
| 命令行： | `--esModule`/`--no-esModule`   |
| Default: | `"if-default-prop"`            |

Whether to add a `__esModule: true` property when generating exports for non-ES formats. This property signifies that the exported value is the namespace of an ES module and that the default export of this module corresponds to the `.default` property of the exported object.

- `true` will always add the property when using [named exports mode](#output-exports), which is similar to what other tools do.
- `"if-default-prop"` will only add the property when using named exports mode and there also is a default export. The subtle difference is that if there is no default export, consumers of the CommonJS version of your library will get all named exports as default export instead of an error or `undefined`. We chose to make this the default value as the `__esModule` property is not a standard followed by any JavaScript runtime and leads to many interop issues, so we want to limit its use to the cases where it is really needed.
- `false` on the other hand will never add the property even if the default export would become a property `.default`.

See also [`output.interop`](#output-interop).

### output.exports

|          |                                          |
| -------: | :--------------------------------------- |
|   类型： | `"auto" \| "default"\| "named"\| "none"` |
| 命令行： | `--exports <exportMode>`                 |
| Default: | `'auto'`                                 |

What export mode to use. Defaults to `auto`, which guesses your intentions based on what the `input` module exports:

- `default` – if you are only exporting one thing using `export default ...`; note that this can cause issues when generating CommonJS output that is meant to be interchangeable with ESM output, see below
- `named` – if you are using named exports
- `none` – if you are not exporting anything (e.g. you are building an app, not a library)

As this is only an output transformation, you can only choose `default` if a default export is the only export for all entry chunks. Likewise, you can only choose `none` if there are no exports, otherwise Rollup will throw an error.

The difference between `default` and `named` affects how other people can consume your bundle. If you use `default`, a CommonJS user could do this, for example:

```js
// your-lib package entry
export default 'Hello world';

// a CommonJS consumer
/* require( "your-lib" ) returns "Hello World" */
const hello = require('your-lib');
```

With `named`, a user would do this instead:

```js
// your-lib package entry
export const hello = 'Hello world';

// a CommonJS consumer
/* require( "your-lib" ) returns {hello: "Hello World"} */
const hello = require('your-lib').hello;
/* or using destructuring */
const { hello } = require('your-lib');
```

The wrinkle is that if you use `named` exports but _also_ have a `default` export, a user would have to do something like this to use the default export:

```js
// your-lib package entry
export default 'foo';
export const bar = 'bar';

// a CommonJS consumer
/* require( "your-lib" ) returns {default: "foo", bar: "bar"} */
const foo = require('your-lib').default;
const bar = require('your-lib').bar;
/* or using destructuring */
const { default: foo, bar } = require('your-lib');
```

Note: There are some tools such as Babel, TypeScript, Webpack, and `@rollup/plugin-commonjs` that are capable of resolving a CommonJS `require(...)` call with an ES module. If you are generating CommonJS output that is meant to be interchangeable with ESM output for those tools, you should always use `named` export mode. The reason is that most of those tools will by default return the namespace of an ES module on `require` where the default export is the `.default` property.

In other words for those tools, you cannot create a package interface where `const lib = require("your-lib")` yields the same as `import lib from "your-lib"`. With named export mode however, `const {lib} = require("your-lib")` will be equivalent to `import {lib} from "your-lib"`.

### output.externalLiveBindings

|          |                                                      |
| -------: | :--------------------------------------------------- |
|   类型： | `boolean`                                            |
| 命令行： | `--externalLiveBindings`/`--no-externalLiveBindings` |
| Default: | `true`                                               |

When set to `false`, Rollup will not generate code to support live bindings for external imports but instead assume that exports do not change over time. This will enable Rollup to generate more optimized code. Note that this can cause issues when there are circular dependencies involving an external dependency.

This will avoid most cases where Rollup generates getters in the code and can therefore be used to make code IE8 compatible in many cases.

Example:

```js
// input
export { x } from 'external';

// CJS output with externalLiveBindings: true
var external = require('external');

Object.defineProperty(exports, 'x', {
	enumerable: true,
	get: function () {
		return external.x;
	}
});

// CJS output with externalLiveBindings: false
var external = require('external');

exports.x = external.x;
```

### output.freeze

|          |                          |
| -------: | :----------------------- |
|   类型： | `boolean`                |
| 命令行： | `--freeze`/`--no-freeze` |
| Default: | `true`                   |

Whether to `Object.freeze()` namespace import objects (i.e. `import * as namespaceImportObject from...`) that are accessed dynamically.

### output.indent

|          |                          |
| -------: | :----------------------- |
|   类型： | `boolean \| string`      |
| 命令行： | `--indent`/`--no-indent` |
| Default: | `true`                   |

The indent string to use, for formats that require code to be indented (`amd`, `iife`, `umd`, `system`). Can also be `false` (no indent), or `true` (the default – auto-indent)

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

### output.noConflict

|          |                                  |
| -------: | :------------------------------- |
|   类型： | `boolean`                        |
| 命令行： | `--noConflict`/`--no-noConflict` |
| Default: | `false`                          |

This will generate an additional `noConflict` export to UMD bundles. When called in an IIFE scenario, this method will return the bundle exports while restoring the corresponding global variable to its previous value.

### output.sanitizeFileName

|          |                                                            |
| -------: | :--------------------------------------------------------- |
|   类型： | `boolean \| (string) => string`                            |
| 命令行： | `--sanitizeFileName`/`no-sanitizeFileName` Default: `true` |

Set to `false` to disable all chunk name sanitizations (removal of `\0`, `?` and `*` characters).

Alternatively set to a function to allow custom chunk name sanitization.

### output.strict

|          |                          |
| -------: | :----------------------- |
|   类型： | `boolean`                |
| 命令行： | `--strict`/`--no-strict` |
| Default: | `true`                   |

Whether to include the 'use strict' pragma at the top of generated non-ES bundles. Strictly speaking, ES modules are _always_ in strict mode, so you shouldn't disable this without good reason.

### output.systemNullSetters

|          |                                                |
| -------: | :--------------------------------------------- |
|   类型： | `boolean`                                      |
| 命令行： | `--systemNullSetters`/`--no-systemNullSetters` |
| Default: | `true`                                         |

When outputting the `system` module format, by default, empty setter functions are replaced with `null` as an output simplification. This is incompatible with SystemJS before v6.3.3. Deactivate this option to output empty functions instead that older SystemJS versions support.

### preserveSymlinks

|          |                      |
| -------: | :------------------- |
|   类型： | `boolean`            |
| 命令行： | `--preserveSymlinks` |
| Default: | `false`              |

When set to `false`, symbolic links are followed when resolving a file. When set to `true`, instead of being followed, symbolic links are treated as if the file is where the link is. To illustrate, consider the following situation:

```js
// /main.js
import { x } from './linked.js';
console.log(x);

// /linked.js
// this is a symbolic link to /nested/file.js

// /nested/file.js
export { x } from './dep.js';

// /dep.js
export const x = 'next to linked';

// /nested/dep.js
export const x = 'next to original';
```

If `preserveSymlinks` is `false`, then the bundle created from `/main.js` will log "next to original" as it will use the location of the symbolically linked file to resolve its dependencies. If `preserveSymlinks` is `true`, however, it will log "next to linked" as the symbolic link will not be resolved.

### shimMissingExports

|          |                                                  |
| -------: | :----------------------------------------------- |
|   类型： | `boolean`                                        |
| 命令行： | `--shimMissingExports`/`--no-shimMissingExports` |
| Default: | `false`                                          |

If this option is provided, bundling will not fail if bindings are imported from a file that does not define these bindings. Instead, new variables will be created for these bindings with the value `undefined`.

### treeshake

|          |                                                      |
| -------: | :--------------------------------------------------- |
|   类型： | `boolean \| TreeshakingPreset \| TreeshakingOptions` |
| 命令行： | `--treeshake`/`--no-treeshake`                       |
| Default: | `true`                                               |

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

Whether to apply tree-shaking and to fine-tune the tree-shaking process. Setting this option to `false` will produce bigger bundles but may improve build performance. You may also choose one of three presets that will automatically be updated if new options are added:

- `"smallest"` will choose option values for you to minimize output size as much as possible. This should work for most code bases as long as you do not rely on certain patterns, which are currently:
  - getters with side effects will only be retained if the return value is used ([`treeshake.propertyReadSideEffects: false`](#treeshake-propertyreadsideeffects))
  - code from imported modules will only be retained if at least one exported value is used ([`treeshake.moduleSideEffects: false`](#treeshake-modulesideeffects))
  - you should not bundle polyfills that rely on detecting broken builtins ([`treeshake.tryCatchDeoptimization: false`](#treeshake-trycatchdeoptimization))
  - some semantic issues may be swallowed ([`treeshake.unknownGlobalSideEffects: false`](#treeshake-unknownglobalsideeffects), [`treeshake.correctVarValueBeforeDeclaration: false`](#treeshake-correctvarvaluebeforedeclaration))
- `"recommended"` should work well for most usage patterns. Some semantic issues may be swallowed, though (`treeshake.unknownGlobalSideEffects: false`, `treeshake.correctVarValueBeforeDeclaration: false`)
- `"safest"` tries to be as spec compliant as possible while still providing some basic tree-shaking capabilities.
- `true` is equivalent to not specifying the option and will always choose the default value (see below).

If you discover a bug caused by the tree-shaking algorithm, please file an issue! Setting this option to an object implies tree-shaking is enabled and grants the following additional options:

#### treeshake.annotations

|          |                                                        |
| -------: | :----------------------------------------------------- |
|   类型： | `boolean`                                              |
| 命令行： | `--treeshake.annotations`/`--no-treeshake.annotations` |
| Default: | `true`                                                 |

If `false`, ignore hints from pure annotations, i.e. comments containing `@__PURE__` or `#__PURE__`, when determining side effects of function calls and constructor invocations. These annotations need to immediately precede the call invocation to take effect. The following code will be completely removed unless this option is set to `false`, in which case it will remain unchanged.

```javascript
/*@__PURE__*/ console.log('side-effect');

class Impure {
	constructor() {
		console.log('side-effect');
	}
}

/*@__PURE__*/ new Impure();
```

#### treeshake.correctVarValueBeforeDeclaration

|  |  |
| --: | :-- |
| 类型： | `boolean` |
| 命令行： | `--treeshake.correctVarValueBeforeDeclaration`/`--no-treeshake.correctVarValueBeforeDeclaration` |
| Default: | `false` |

In some edge cases if a variable is accessed before its declaration assignment and is not reassigned, then Rollup may incorrectly assume that variable is constant throughout the program, as in the example below. This is not true if the variable is declared with `var`, however, as those variables can be accessed before their declaration where they will evaluate to `undefined`. Choosing `true` will make sure Rollup does not make any assumptions about the value of variables declared with `var`. Note though that this can have a noticeable negative impact on tree-shaking results.

```js
// everything will be tree-shaken unless treeshake.correctVarValueBeforeDeclaration === true
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

logIfEnabled(); // could be removed
logBeforeDeclaration = true;
logIfEnabled(); // needs to be retained as it displays a log
```

#### treeshake.manualPureFunctions

|          |                                           |
| -------: | :---------------------------------------- |
|   类型： | `string[]`                                |
| 命令行： | `--treeshake.manualPureFunctions <names>` |

Allows to manually define a list of function names that should always be considered "pure", i.e. they have no side effects like changing global state etc. when called. The check is performed solely by name.

This can not only help with dead code removal, but can also improve JavaScript chunk generation especially when using [`output.experimentalMinChunkSize`](#output-experimentalminchunksize).

Besides any functions matching that name, any properties on a pure function and any functions returned from a pure functions will also be considered pure functions, and accessing any properties is not checked for side effects.

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

local(); // removed
styled.div`
	color: blue;
`; // removed
styled?.div(); // removed
styled()(); // removed
styled().div(); // removed
```

#### treeshake.moduleSideEffects

|  |  |
| --: | :-- |
| 类型： | `boolean\| "no-external"\| string[]\| (id: string, external: boolean) => boolean` |
| 命令行： | `--treeshake.moduleSideEffects`/`--no-treeshake.moduleSideEffects`/`--treeshake.moduleSideEffects no-external` |
| Default: | `true` |

If `false`, assume modules and external dependencies from which nothing is imported do not have other side effects like mutating global variables or logging without checking. For external dependencies, this will suppress empty imports:

```javascript
// input file
import { unused } from 'external-a';
import 'external-b';
console.log(42);
```

```javascript
// output with treeshake.moduleSideEffects === true
import 'external-a';
import 'external-b';
console.log(42);
```

```javascript
// output with treeshake.moduleSideEffects === false
console.log(42);
```

For non-external modules, `false` will not include any statements from a module unless at least one import from this module is included:

```javascript
// input file a.js
import { unused } from './b.js';
console.log(42);

// input file b.js
console.log('side-effect');
const ignored = 'will still be removed';
```

```javascript
// output with treeshake.moduleSideEffects === true
console.log('side-effect');

console.log(42);
```

```javascript
// output with treeshake.moduleSideEffects === false
console.log(42);
```

You can also supply a list of modules with side effects or a function to determine it for each module individually. The value `"no-external"` will only remove external imports if possible and is equivalent to the function `(id, external) => !external`;

If a module that has this flag set to `false` reexports a variable from another module and this variable is used, the question if the reexporting module is scanned for side effects depends on how the variable is reexported:

```javascript
// input file a.js
import { foo } from './b.js';
console.log(foo);

// input file b.js
// direct reexports will ignore side effects
export { foo } from './c.js';
console.log('this side-effect is ignored');

// input file c.js
// indirect reexports will include side effects
import { foo } from './d.js';
foo.mutated = true;
console.log('this side-effect and the mutation are retained');
export { foo };

// input file d.js
export const foo = 42;
```

```javascript
// output with treeshake.moduleSideEffects === false
const foo = 42;

foo.mutated = true;
console.log('this side-effect and the mutation are retained');

console.log(foo);
```

Note that despite the name, this option does not "add" side effects to modules that do not have side effects. If it is important that e.g. an empty module is "included" in the bundle because you need this for dependency tracking, the plugin interface allows you to designate modules as being excluded from tree-shaking via the [`resolveId`](../plugin-development/index.md#resolveid), [`load`](../plugin-development/index.md#load) or [`transform`](../plugin-development/index.md#transform) hook.

#### treeshake.preset

|          |                                          |
| -------: | :--------------------------------------- |
|   类型： | `"smallest" \| "safest"\| "recommended"` |
| 命令行： | `--treeshake <value>`<br>                |

Allows choosing one of the presets listed above while overriding some options.

```js
export default {
	treeshake: {
		preset: 'smallest',
		propertyReadSideEffects: true
	}
	// ...
};
```

#### treeshake.propertyReadSideEffects

|  |  |
| --: | :-- |
| 类型： | `boolean\| 'always'` |
| 命令行： | `--treeshake.propertyReadSideEffects`/`--no-treeshake.propertyReadSideEffects` |
| Default: | `true` |

If `true`, retain unused property reads that Rollup can determine to have side effects. This includes accessing properties of `null` or `undefined` or triggering explicit getters via property access. Note that this does not cover destructuring assignment or getters on objects passed as function parameters.

If `false`, assume reading a property of an object never has side effects. Depending on your code, disabling this option can significantly reduce bundle size but can potentially break functionality if you rely on getters or errors from illegal property access.

If `'always'`, assume all member property accesses, including destructuring, have side effects. This setting is recommended for code relying on getters with side effects. It typically results in larger bundle size, but smaller than disabling `treeshake` altogether.

```javascript
// Will be removed if treeshake.propertyReadSideEffects === false
const foo = {
	get bar() {
		console.log('effect');
		return 'bar';
	}
};
const result = foo.bar;
const illegalAccess = foo.quux.tooDeep;
```

#### treeshake.tryCatchDeoptimization

|  |  |
| --: | :-- |
| 类型： | `boolean` |
| 命令行： | `--treeshake.tryCatchDeoptimization`/`--no-treeshake.tryCatchDeoptimization` |
| Default: | `true` |

By default, Rollup assumes that many builtin globals of the runtime behave according to the latest specs when tree-shaking and do not throw unexpected errors. In order to support e.g. feature detection workflows that rely on those errors being thrown, Rollup will by default deactivate tree-shaking inside try-statements. If a function parameter is called from within a try-statement, this parameter will be deoptimized as well. Set `treeshake.tryCatchDeoptimization` to `false` if you do not need this feature and want to have tree-shaking inside try-statements.

```js
function otherFn() {
	// even though this function is called from a try-statement, the next line
	// will be removed as side-effect-free
	Object.create(null);
}

function test(callback) {
	try {
		// calls to otherwise side-effect-free global functions are
		// retained inside try-statements for tryCatchDeoptimization: true
		Object.create(null);

		// calls to other function are retained as well but the body of
		// this function may again be subject to tree-shaking
		otherFn();

		// if a parameter is called, then all arguments passed to that
		// function parameter will be deoptimized
		callback();
	} catch {}
}

test(() => {
	// will be ratained
	Object.create(null);
});

// call will be retained but again, otherFn is not deoptimized
test(otherFn);
```

#### treeshake.unknownGlobalSideEffects

|  |  |
| --: | :-- |
| 类型： | `boolean` |
| 命令行： | `--treeshake.unknownGlobalSideEffects`/`--no-treeshake.unknownGlobalSideEffects` |
| Default: | `true` |

Since accessing a non-existing global variable will throw an error, Rollup does by default retain any accesses to non-builtin global variables. Set this option to `false` to avoid this check. This is probably safe for most code-bases.

```js
// input
const jQuery = $;
const requestTimeout = setTimeout;
const element = angular.element;

// output with unknownGlobalSideEffects == true
const jQuery = $;
const element = angular.element;

// output with unknownGlobalSideEffects == false
const element = angular.element;
```

In the example, the last line is always retained as accessing the `element` property could also throw an error if `angular` is e.g. `null`. To avoid this check, set [`treeshake.propertyReadSideEffects`](#treeshake-propertyreadsideeffects) to `false` as well.

## Experimental options

These options reflect new features that have not yet been fully finalized. Availability, behaviour and usage may therefore be subject to change between minor versions.

### experimentalCacheExpiry

|          |                                            |
| -------: | :----------------------------------------- |
|   类型： | `number`                                   |
| 命令行： | `--experimentalCacheExpiry <numberOfRuns>` |
| Default: | `10`                                       |

Determines after how many runs cached assets that are no longer used by plugins should be removed.

### experimentalLogSideEffects

|  |  |
| --: | :-- |
| 类型： | `boolean` |
| CLI： | `--experimentalLogSideEffects`/`--no-experimentalLogSideEffects` |
| 默认： | `false` |

When set to `true`, this will log the first side effect it finds in every file to the console. This can be very helpful to figure which files have side effects and what the actual side effects are. Removing side effects can improve tree-shaking and chunk generation and is crucial to make [`output.experimentalMinChunkSize`](#output-experimentalminchunksize) work.

This option will only log top-level statements, though. Sometimes, e.g. in case of immediately-invoked-function-expressions, the actual side effect can be hidden inside a nested expression.

### output.experimentalMinChunkSize

|        |                                     |
| -----: | :---------------------------------- |
| 类型： | `number`                            |
|  CLI： | `--experimentalMinChunkSize <size>` |
| 默认： | `0`                                 |

Set a minimal chunk size target in Byte for code-splitting setups. When this value is greater than `0`, Rollup will try to merge any chunk that does not have side effects when executed, i.e. any chunk that only contains function definitions etc., and is below this size limit into another chunk that is likely to be loaded under similar conditions.

This will mean that the generated bundle will possibly load code that is not required yet in order to reduce the number of chunks. The condition for the merged chunks to be side effect free ensures that this does not change behaviour.

Unfortunately, due to the way chunking works, chunk size is measured before any chunk rendering plugins like minifiers ran, which means you should use a high enough limit to take this into account.

### perf

|        |                      |
| -----: | :------------------- |
| 类型： | `boolean`            |
|  CLI： | `--perf`/`--no-perf` |
| 默认： | `false`              |

Whether to collect performance timings. When used from the command line or a configuration file, detailed measurements about the current bundling process will be displayed. When used from the [JavaScript API](../javascript-api/index.md), the returned bundle object will contain an additional `getTimings()` function that can be called at any time to retrieve all accumulated measurements.

`getTimings()` returns an object of the following form:

```
{
  "# BUILD": [ 698.020877, 33979632, 45328080 ],
  "## parse modules": [ 537.509342, 16295024, 27660296 ],
  "load modules": [ 33.253778999999994, 2277104, 38204152 ],
  ...
}
```

For each key, the first number represents the elapsed time while the second represents the change in memory consumption, and the third represents the total memory consumption after this step. The order of these steps is the order used by `Object.keys`. Top level keys start with `#` and contain the timings of nested steps, i.e. in the example above, the 698ms of the `# BUILD` step include the 538ms of the `## parse modules` step.

## watch

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

Specify options for watch mode or prevent this configuration from being watched. Specifying `false` is only really useful when an array of configurations is used. In that case, this configuration will not be built or rebuilt on change in watch mode, but it will be built when running Rollup regularly:

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

These options only take effect when running Rollup with the `--watch` flag, or using `rollup.watch`.

### watch.buildDelay

|        |                               |
| -----: | :---------------------------- |
| 类型： | `number`                      |
|  CLI： | `--watch.buildDelay <number>` |
| 默认： | `0`                           |

Configures how long Rollup will wait for further changes until it triggers a rebuild in milliseconds. By default, Rollup does not wait but there is a small debounce timeout configured in the chokidar instance. Setting this to a value greater than `0` will mean that Rollup will only trigger a rebuild if there was no change for the configured number of milliseconds. If several configurations are watched, Rollup will use the largest configured build delay.

### watch.chokidar

|        |                   |
| -----: | :---------------- |
| 类型： | `ChokidarOptions` |

An optional object of watch options that will be passed to the bundled [chokidar](https://github.com/paulmillr/chokidar) instance. See the [chokidar documentation](https://github.com/paulmillr/chokidar#api) to find out what options are available.

### watch.clearScreen

|        |                                                |
| -----: | :--------------------------------------------- |
| 类型： | `boolean`                                      |
|  CLI： | `--watch.clearScreen`/`--no-watch.clearScreen` |
| 默认： | `true`                                         |

Whether to clear the screen when a rebuild is triggered.

### watch.exclude

|        |                                          |
| -----: | :--------------------------------------- |
| 类型： | `string \| RegExp\| (string\| RegExp)[]` |
|  CLI： | `--watch.exclude <files>`                |

Prevent files from being watched:

```js
// rollup.config.js
export default {
  ...,
  watch: {
    exclude: 'node_modules/**'
  }
};
```

### watch.include

|        |                                          |
| -----: | :--------------------------------------- |
| 类型： | `string \| RegExp\| (string\| RegExp)[]` |
|  CLI： | `--watch.include <files>`                |

Limit the file-watching to certain files. Note that this only filters the module graph but does not allow adding additional watch files:

```js
// rollup.config.js
export default {
  ...,
  watch: {
    include: 'src/**'
  }
};
```

### watch.skipWrite

|        |                                            |
| -----: | :----------------------------------------- |
| 类型： | `boolean`                                  |
|  CLI： | `--watch.skipWrite`/`--no-watch.skipWrite` |
| 默认： | `false`                                    |

Whether to skip the `bundle.write()` step when a rebuild is triggered.

## Deprecated options

☢️ These options have been deprecated and may be removed in a future Rollup version.

### inlineDynamicImports

_Use the [`output.inlineDynamicImports`](#output-inlinedynamicimports) output option instead, which has the same signature._

### manualChunks

_Use the [`output.manualChunks`](#output-manualchunks) output option instead, which has the same signature._

### maxParallelFileReads

_Use the [`maxParallelFileOps`](#maxparallelfileops) option instead._

|        |                                   |
| -----: | :-------------------------------- |
| 类型： | `number`                          |
|  CLI： | `--maxParallelFileReads <number>` |
| 默认： | 20                                |

Limits the number of files rollup will open in parallel when reading modules. Without a limit or with a high enough value, builds can fail with an "EMFILE: too many open files". This depends on how many open file handles the os allows.

### output.dynamicImportFunction

_Use the [`renderDynamicImport`](../plugin-development/index.md#renderdynamicimport) plugin hook instead._

|        |                                  |
| -----: | :------------------------------- |
| 类型： | `string`                         |
|  CLI： | `--dynamicImportFunction <name>` |
| 默认： | `import`                         |

This will rename the dynamic import function to the chosen name when outputting ES bundles. This is useful for generating code that uses a dynamic import polyfill such as [this one](https://github.com/uupaa/dynamic-import-polyfill).

### output.experimentalDeepDynamicChunkOptimization

_This option is no longer needed._

|  |  |
| --: | :-- |
| 类型： | `boolean` |
| CLI： | `--experimentalDeepDynamicChunkOptimization`/`--no-experimentalDeepDynamicChunkOptimization` |
| 默认： | `false` |

This option was used to prevent performance issues with the full chunk optimization algorithm. As the algorithm is much faster now, this option is now ignored by Rollup and should no longer be used.

### output.preferConst

_Use the [`output.generatedCode.constBindings`](#output-generatedcode-constbindings) option instead._

|        |                                    |
| -----: | :--------------------------------- |
| 类型： | `boolean`                          |
|  CLI： | `--preferConst`/`--no-preferConst` |
| 默认： | `false`                            |

Generate `const` declarations for exports rather than `var` declarations.

### output.namespaceToStringTag

_Use [`output.generatedCode.symbols`](#output-generatedcode-symbols) instead._

|        |                                                      |
| -----: | :--------------------------------------------------- |
| 类型： | `boolean`                                            |
|  CLI： | `--namespaceToStringTag`/`--no-namespaceToStringTag` |
| 默认： | `false`                                              |

Whether to add spec compliant `.toString()` tags to namespace objects. If this option is set,

```javascript
import * as namespace from './file.js';
console.log(String(namespace));
```

will always log `[object Module]`;

### preserveModules

_Use the [`output.preserveModules`](#output-preservemodules) output option instead, which has the same signature._
