---
title: 配置选项
---

# {{ $frontmatter.title }}

[[toc]]

## 核心功能 {#core-functionality}

### external

|  |  |
| --: | :-- |
| 类型： | `(string \| RegExp)[]\| RegExp\| string\| (id: string, parentId: string, isResolved: boolean) => boolean` |
| CLI： | `-e`/`--external <external-id,another-external-id,...>` |

可以是一个函数，接受一个 `id` 参数并返回 `true`（表示外部依赖）或 `false`（表示非外部依赖），也可以是一个模块 ID 数组或者正则表达式，用于匹配应该保持在打包文件外的模块 ID。也可以只是一个单独的 ID 或正则表达式。被匹配的 ID 应该是：

1. 外部依赖的名称，与 import 语句中写法完全一致。例如，将 `import "dependency.js"` 标记为外部依赖，使用的是 `"dependency.js"`；而将 `import "dependency"` 标记为外部依赖，则使用 `"dependency"`。
2. 一个已解析的 ID（如文件的绝对路径）。

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

请注意，如果要通过 `/node_modules/` 正则表达式过滤掉包的导入，例如 `import {rollup} from 'rollup'`，需要使用类似 [@rollup/plugin-node-resolve](https://github.com/rollup/plugins/tree/master/packages/node-resolve) 的插件先将导入解析到 `node_modules`。

当作为命令行参数给出时，它应该是一个逗号分隔的 ID 列表：

```bash
rollup -i src/main.js ... -e foo,bar,baz
```

当提供一个函数时，它会被调用，并带有三个参数 `(id, parent, isResolved)`，这可以给你更细粒度的控制：

- `id` 是模块的 id
- `parent` 是进行导入的模块的 id
- `isResolved` 表示 `id` 是否已被插件等解析

当创建一个 `iife` 或 `umd` 包时，你需要通过 [`output.globals`](#output-globals) 选项来提供全局变量名称，以替换你的外部导入。

如果一个相对导入，即以 `./` 或 `../` 开头的导入，被标记为 “external”，rollup 将在内部将其解析为绝对路径，以便合并外部模块的不同导入。当写入结果包时，导入将再次转换为相对路径。例如：

```js
// input
// src/main.js（入口点）
import x from '../external.js';
import './nested/nested.js';
console.log(x);

// src/nested/nested.js
// 这个导入将会指向同一个文件（只要它存在）
import x from '../../external.js';
console.log(x);

// output
// 不同路径表示的导入将被合并
import x from '../external.js';

console.log(x);

console.log(x);
```

转换回相对导入的操作好像是假定 `output.file` 或 `output.dir` 与入口点在同一位置，或者与所有入口点的共同基本目录在同一位置。如果有多个入口点，则使用所有入口点的共同基本目录。

### input

|       |                                                         |
| ----: | :------------------------------------------------------ |
| Type: | `string \| string []\| { [entryName: string]: string }` |
|  CLI: | `-i`/`--input <filename>`                               |

入口点的打包（例如 `main.js` 或 `app.js` 或 `index.js`）。如果你提供一个入口点数组或一个将名称映射到入口点的对象，则它们将被打包成单独的输出块。除非使用 [`output.file`](#output-file) 选项，否则生成的块名称将遵循 [`output.entryFileNames`](#output-entryfilenames) 选项。在使用对象形式时，文件名中的 `[name]` 部分将是对象属性的名称，而在使用数组形式时，它将是入口点的文件名。

请注意，在使用对象形式时，可以通过在名称后添加 `/` 将入口点放入不同的子文件夹中。以下代码将生成至少两个入口块，名称为 `entry-a.js` 和 `entry-b/index.js`，即文件 `index.js` 被放置在 `entry-b` 文件夹中：

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

If you want to convert a set of files to another format while maintaining the file structure and export signatures, the recommended way—instead of using [`output.preserveModules`](#output-preservemodules) that may tree-shake exports as well as emit virtual files created by plugins—is to turn every file into an entry point. You can do so dynamically e.g. via the `glob` package:

```js
import glob from 'glob';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default {
	input: Object.fromEntries(
		glob.sync('src/**/*.js').map(file => [
			// This remove `src/` as well as the file extension from each
			// file, so e.g. src/nested/foo.js becomes nested/foo
			path.relative(
				'src',
				file.slice(0, file.length - path.extname(file).length)
			),
			// This expands the relative paths to absolute paths, so e.g.
			// src/nested/foo becomes /project/src/nested/foo.js
			fileURLToPath(new URL(file, import.meta.url))
		])
	),
	output: {
		format: 'es',
		dir: 'dist'
	}
};
```

The option can be omitted if some plugin emits at least one chunk (using [`this.emitFile`](../plugin-development/index.md#this-emitfile)) by the end of the [`buildStart`](../plugin-development/index.md#buildstart) hook.

When using the command line interface, multiple inputs can be provided by using the option multiple times. When provided as the first options, it is equivalent to not prefix them with `--input`:

```sh
rollup --format es --input src/entry1.js --input src/entry2.js
# is equivalent to
rollup src/entry1.js src/entry2.js --format es
```

Chunks can be named by adding an `=` to the provided value:

```sh
rollup main=src/entry1.js other=src/entry2.js --format es
```

File names containing spaces can be specified by using quotes:

```sh
rollup "main entry"="src/entry 1.js" "src/other entry.js" --format es
```

### output.dir

|       |                        |
| ----: | :--------------------- |
| Type: | `string`               |
|  CLI: | `-d`/`--dir <dirname>` |

The directory in which all generated chunks are placed. This option is required if more than one chunk is generated. Otherwise, the `file` option can be used instead.

### output.file

|       |                          |
| ----: | :----------------------- |
| Type: | `string`                 |
|  CLI: | `-o`/`--file <filename>` |

The file to write to. Will also be used to generate sourcemaps, if applicable. Can only be used if not more than one chunk is generated.

### output.format

|          |                                   |
| -------: | :-------------------------------- |
|    Type: | `string`                          |
|     CLI: | `-f`/`--format <formatspecifier>` |
| Default: | `"es"`                            |

Specifies the format of the generated bundle. One of the following:

- `amd` – Asynchronous Module Definition, used with module loaders like RequireJS
- `cjs` – CommonJS, suitable for Node and other bundlers (alias: `commonjs`)
- `es` – Keep the bundle as an ES module file, suitable for other bundlers and inclusion as a `<script type=module>` tag in modern browsers (alias: `esm`, `module`)
- `iife` – A self-executing function, suitable for inclusion as a `<script>` tag. (If you want to create a bundle for your application, you probably want to use this.). "iife" stands for "immediately-invoked [Function Expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function)"
- `umd` – Universal Module Definition, works as `amd`, `cjs` and `iife` all in one
- `system` – Native format of the SystemJS loader (alias: `systemjs`)

### output.globals

|  |  |
| --: | :-- |
| Type: | `{ [id: string]: string }\| ((id: string) => string)` |
| CLI: | `-g`/`--globals <external-id:variableName,another-external-id:anotherVariableName,...>` |

Specifies `id: variableName` pairs necessary for external imports in `umd`/`iife` bundles. For example, in a case like this…

```js
import $ from 'jquery';
```

…we want to tell Rollup that `jquery` is external and the `jquery` module ID equates to the global `$` variable:

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

Alternatively, supply a function that will turn an external module ID into a global variable name.

When given as a command line argument, it should be a comma-separated list of `id:variableName` pairs:

```shell
rollup -i src/main.js ... -g jquery:$,underscore:_
```

To tell Rollup that a local file should be replaced by a global variable, use an absolute id:

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

### output.name

|       |                              |
| ----: | :--------------------------- |
| Type: | `string`                     |
|  CLI: | `-n`/`--name <variableName>` |

Necessary for `iife`/`umd` bundles that exports values in which case it is the global variable name representing your bundle. Other scripts on the same page can use this variable name to access the exports of your bundle.

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

Namespaces are supported i.e. your name can contain dots. The resulting bundle will contain the setup necessary for the namespacing.

```shell
rollup -n "a.b.c"

/* ->
this.a = this.a || {};
this.a.b = this.a.b || {};
this.a.b.c = ...
*/
```

### output.plugins

|       |                                                  |
| ----: | :----------------------------------------------- |
| Type: | `MaybeArray<MaybePromise<OutputPlugin \| void>>` |

Adds a plugin just to this output. See [Using output plugins](../tutorial/index.md#using-output-plugins) for more information on how to use output-specific plugins and [Plugins](../plugin-development/index.md) on how to write your own. For plugins imported from packages, remember to call the imported plugin function (i.e. `commonjs()`, not just `commonjs`). Falsy plugins will be ignored, which can be used to easily activate or deactivate plugins. Nested plugins will be flattened. Async plugin will be awaited and resolved.

Not every plugin can be used here. `output.plugins` is limited to plugins that only use hooks that run during `bundle.generate()` or `bundle.write()`, i.e. after Rollup's main analysis is complete. If you are a plugin author, see [output generation hooks](../plugin-development/index.md#output-generation-hooks) to find out which hooks can be used.

The following will add minification to one of the outputs:

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

### plugins

|       |                                            |
| ----: | :----------------------------------------- |
| Type: | `MaybeArray<MaybePromise<Plugin \| void>>` |

See [Using plugins](../tutorial/index.md#using-plugins) for more information on how to use plugins and [Plugins](../plugin-development/index.md) on how to write your own (try it out, it's not as difficult as it may sound and very much extends what you can do with Rollup). For plugins imported from packages, remember to call the imported plugin function (i.e. `commonjs()`, not just `commonjs`). Falsy plugins will be ignored, which can be used to easily activate or deactivate plugins. Nested plugins will be flatten. Async plugins will be awaited and resolved.

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

(This example also demonstrates how to use an async IIFE and dynamic imports to avoid unnecessary module loading, which can be surprisingly slow.)

## Advanced functionality

### cache

|          |                          |
| -------: | :----------------------- |
|    Type: | `RollupCache \| boolean` |
| Default: | `true`                   |

The `cache` property of a previous bundle. Use it to speed up subsequent builds in watch mode — Rollup will only reanalyse the modules that have changed. Setting this option explicitly to `false` will prevent generating the `cache` property on the bundle and also deactivate caching for plugins.

```js
const rollup = require('rollup');
let cache;

async function buildWithCache() {
	const bundle = await rollup.rollup({
		cache // is ignored if falsy
		// ... other input options
	});
	cache = bundle.cache; // store the cache object of the previous build
	return bundle;
}

buildWithCache()
	.then(bundle => {
		// ... do something with the bundle
	})
	.then(() => buildWithCache()) // will use the cache of the previous build
	.then(bundle => {
		// ... do something with the bundle
	});
```

### makeAbsoluteExternalsRelative

|  |  |
| --: | :-- |
| Type: | `boolean\| "ifRelativeSource"` |
| CLI: | `--makeAbsoluteExternalsRelative`/`--no-makeAbsoluteExternalsRelative` |
| Default: | `"ifRelativeSource"` |

Determines if absolute external paths should be converted to relative paths in the output. This does not only apply to paths that are absolute in the source but also to paths that are resolved to an absolute path by either a plugin or Rollup core.

For `true`, an external import like `import "/Users/Rollup/project/relative.js"` would be converted to a relative path. When converting an absolute path to a relative path, Rollup does _not_ take the `file` or `dir` options into account, because those may not be present e.g. for builds using the JavaScript API. Instead, it assumes that the root of the generated bundle is located at the common shared parent directory of all modules that were included in the bundle. Assuming that the common parent directory of all modules is `"/Users/Rollup/project"`, the import from above would likely be converted to `import "./relative.js"` in the output. If the output chunk is itself nested in a subdirectory by choosing e.g. `chunkFileNames: "chunks/[name].js"`, the import would be `"../relative.js"`.

As stated before, this would also apply to originally relative imports like `import "./relative.js"` that are resolved to an absolute path before they are marked as external by the [`external`](#external) option.

One common problem is that this mechanism will also apply to imports like `import "/absolute.js'"`, resulting in unexpected relative paths in the output.

For this case, `"ifRelativeSource"` checks if the original import was a relative import and only then convert it to a relative import in the output. Choosing `false` will keep all paths as absolute paths in the output.

Note that when a relative path is directly marked as "external" using the [`external`](#external) option, then it will be the same relative path in the output. When it is resolved first via a plugin or Rollup core and then marked as external, the above logic will apply.

### maxParallelFileOps

|          |                                 |
| -------: | :------------------------------ |
|    Type: | `number`                        |
|     CLI: | `--maxParallelFileOps <number>` |
| Default: | 20                              |

Limits the number of files rollup will open in parallel when reading modules or writing chunks. Without a limit or with a high enough value, builds can fail with an "EMFILE: too many open files". This depends on how many open file handles the operating system allows.

### onwarn

|  |  |
| --: | :-- |
| Type: | `(warning: RollupWarning, defaultHandler: (warning: string \| RollupWarning) => void) => void;` |

A function that will intercept warning messages. If not supplied, warnings will be deduplicated and printed to the console. When using the [`--silent`](../command-line-interface/index.md#silent) CLI option, this handler is the only way to get notified about warnings.

The function receives two arguments: the warning object and the default handler. Warnings objects have, at a minimum, a `code` and a `message` property, allowing you to control how different kinds of warnings are handled. Other properties are added depending on the type of warning. See [`utils/error.ts`](https://github.com/rollup/rollup/blob/master/src/utils/error.ts) for a complete list of errors and warnings together with their codes and properties.

```js
// rollup.config.js
export default {
	//...,
	onwarn(warning, warn) {
		// skip certain warnings
		if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;

		// throw on others
		// Using Object.assign over new Error(warning.message) will make
		// the CLI print additional information such as warning location
		// and help url.
		if (warning.code === 'MISSING_EXPORT')
			throw Object.assign(new Error(), warning);

		// Use default for everything else
		warn(warning);
	}
};
```

Many warnings also have a `loc` property and a `frame` allowing you to locate the source of the warning:

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

### output.assetFileNames

|          |                                               |
| -------: | :-------------------------------------------- |
|    Type: | `string\| ((assetInfo: AssetInfo) => string)` |
|     CLI: | `--assetFileNames <pattern>`                  |
| Default: | `"assets/[name]-[hash][extname]"`             |

The pattern to use for naming custom emitted assets to include in the build output, or a function that is called per asset to return such a pattern. Patterns support the following placeholders:

- `[extname]`: The file extension of the asset including a leading dot, e.g. `.css`.
- `[ext]`: The file extension without a leading dot, e.g. `css`.
- `[hash]`: A hash based on the content of the asset. You can also set a specific hash length via e.g. `[hash:10]`.
- `[name]`: The file name of the asset excluding any extension.

Forward slashes `/` can be used to place files in sub-directories. When using a function, `assetInfo` is a reduced version of the one in [`generateBundle`](../plugin-development/index.md#generatebundle) without the `fileName`. See also [`output.chunkFileNames`](#output-chunkfilenames), [`output.entryFileNames`](#output-entryfilenames).

### output.banner/output.footer

|       |                                                              |
| ----: | :----------------------------------------------------------- |
| Type: | `string \| ((chunk: ChunkInfo) => string\| Promise<string>)` |
|  CLI: | `--banner`/`--footer <text>`                                 |

A string to prepend/append to the bundle. You can also supply a function that returns a `Promise` that resolves to a `string` to generate it asynchronously (Note: `banner` and `footer` options will not break sourcemaps).

If you supply a function, `chunk` contains additional information about the chunk using the same `ChunkInfo` type as the [`generateBundle`](../plugin-development/index.md#generatebundle) hook with the following differences:

- `code` and `map` are not set as the chunk has not been rendered yet.
- all referenced chunk file names that would contain hashes will contain hash placeholders instead. This includes `fileName`, `imports`, `importedBindings`, `dynamicImports` and `implicitlyLoadedBefore`. When you use such a placeholder file name or part of it in the code returned from this option, Rollup will replace the placeholder with the actual hash before `generateBundle`, making sure the hash reflects the actual content of the final generated chunk including all referenced file hashes.

`chunk` is mutable and changes applied in this hook will propagate to other plugins and to the generated bundle. That means if you add or remove imports or exports in this hook, you should update `imports`, `importedBindings` and/or `exports`.

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

See also [`output.intro/output.outro`](#output-intro-output-outro).

### output.chunkFileNames

|          |                                                |
| -------: | :--------------------------------------------- |
|    Type: | `string \| ((chunkInfo: ChunkInfo) => string)` |
|     CLI: | `--chunkFileNames <pattern>`                   |
| Default: | `"[name]-[hash].js"`                           |

The pattern to use for naming shared chunks created when code-splitting, or a function that is called per chunk to return such a pattern. Patterns support the following placeholders:

- `[format]`: The rendering format defined in the output options, e.g. `es` or `cjs`.
- `[hash]`: A hash based only on the content of the final generated chunk, including transformations in [`renderChunk`](../plugin-development/index.md#renderchunk) and any referenced file hashes. You can also set a specific hash length via e.g. `[hash:10]`.
- `[name]`: The name of the chunk. This can be explicitly set via the [`output.manualChunks`](#output-manualchunks) option or when the chunk is created by a plugin via [`this.emitFile`](../plugin-development/index.md#this-emitfile). Otherwise, it will be derived from the chunk contents.

Forward slashes `/` can be used to place files in sub-directories. When using a function, `chunkInfo` is a reduced version of the one in [`generateBundle`](../plugin-development/index.md#generatebundle) without properties that depend on file names and no information about the rendered modules as rendering only happens after file names have been generated. You can however access a list of included `moduleIds`. See also [`output.assetFileNames`](#output-assetfilenames), [`output.entryFileNames`](#output-entryfilenames).

### output.compact

|          |                            |
| -------: | :------------------------- |
|    Type: | `boolean`                  |
|     CLI: | `--compact`/`--no-compact` |
| Default: | `false`                    |

This will minify the wrapper code generated by rollup. Note that this does not affect code written by the user. This option is useful when bundling pre-minified code.

### output.dynamicImportInCjs

|          |                                                  |
| -------: | :----------------------------------------------- |
|    Type: | `boolean`                                        |
|     CLI: | `--dynamicImportInCjs`/`--no-dynamicImportInCjs` |
| Default: | `true`                                           |

While CommonJS output originally supported only `require(…)` to import dependencies, recent Node versions also started to support `import(…)`, which is the only way to import ES modules from CommonJS files. If this option is `true`, which is the default, Rollup will keep external dynamic imports as `import(…)` expressions in CommonJS output. Set this to `false` to rewrite dynamic imports using `require(…)` syntax.

```js
// input
import('external').then(console.log);

// cjs output with dynamicImportInCjs: true or not set
import('external').then(console.log);

// cjs output with dynamicImportInCjs: false
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

### output.entryFileNames

|          |                                                |
| -------: | :--------------------------------------------- |
|    Type: | `string \| ((chunkInfo: ChunkInfo) => string)` |
|     CLI: | `--entryFileNames <pattern>`                   |
| Default: | `"[name].js"`                                  |

The pattern to use for chunks created from entry points, or a function that is called per entry chunk to return such a pattern. Patterns support the following placeholders:

- `[format]`: The rendering format defined in the output options, e.g. `es` or `cjs`.
- `[hash]`: A hash based only on the content of the final generated entry chunk, including transformations in [`renderChunk`](../plugin-development/index.md#renderchunk) and any referenced file hashes. You can also set a specific hash length via e.g. `[hash:10]`.
- `[name]`: The file name (without extension) of the entry point, unless the object form of input was used to define a different name.

Forward slashes `/` can be used to place files in sub-directories. When using a function, `chunkInfo` is a reduced version of the one in [`generateBundle`](../plugin-development/index.md#generatebundle) without properties that depend on file names and no information about the rendered modules as rendering only happens after file names have been generated. You can however access a list of included `moduleIds`. See also [`output.assetFileNames`](#output-assetfilenames), [`output.chunkFileNames`](#output-chunkfilenames).

This pattern will also be used for every file when setting the [`output.preserveModules`](#output-preservemodules) option. Note that in this case, `[name]` will include the relative path from the output root and possibly the original file extension if it was not one of `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.mts`, or `.cts`.

### output.extend

|          |                          |
| -------: | :----------------------- |
|    Type: | `boolean`                |
|     CLI: | `--extend`/`--no-extend` |
| Default: | `false`                  |

Whether to extend the global variable defined by the `name` option in `umd` or `iife` formats. When `true`, the global variable will be defined as `(global.name = global.name || {})`. When false, the global defined by `name` will be overwritten like `(global.name = {})`.

### output.externalImportAssertions

|          |                                                              |
| -------: | :----------------------------------------------------------- |
|    Type: | `boolean`                                                    |
|     CLI: | `--externalImportAssertions`/`--no-externalImportAssertions` |
| Default: | `true`                                                       |

Whether to add import assertions to external imports in the output if the output format is `es`. By default, assertions are taken from the input files, but plugins can add or remove assertions later. E.g. `import "foo" assert {type: "json"}` will cause the same import to appear in the output unless the option is set to `false`. Note that all imports of a module need to have consistent assertions, otherwise a warning is emitted.

### output.generatedCode

|  |  |
| --: | :-- |
| Type: | `"es5" \| "es2015"\| { arrowFunctions?: boolean, constBindings?: boolean, objectShorthand?: boolean, preset?: "es5"\| "es2015", reservedNamesAsProps?: boolean, symbols?: boolean }` |
| CLI: | `--generatedCode <preset>` |
| Default: | `"es5"` |

Which language features Rollup can safely use in generated code. This will not transpile any user code but only change the code Rollup uses in wrappers and helpers. You may choose one of several presets:

- `"es5"`: Do not use ES2015+ features like arrow functions, but do not quote reserved names used as props.
- `"es2015"`: Use any JavaScript features up to ES2015.

#### output.generatedCode.arrowFunctions

|  |  |
| --: | :-- |
| Type: | `boolean` |
| CLI: | `--generatedCode.arrowFunctions`/`--no-generatedCode.arrowFunctions` |
| Default: | `false` |

Whether to use arrow functions for auto-generated code snippets. Note that in certain places like module wrappers, Rollup will keep using regular functions wrapped in parentheses as in some JavaScript engines, these will provide [noticeably better performance](https://v8.dev/blog/preparser#pife).

#### output.generatedCode.constBindings

|  |  |
| --: | :-- |
| Type: | `boolean` |
| CLI: | `--generatedCode.constBindings`/`--no-generatedCode.constBindings` |
| Default: | `false` |

This will use `const` instead of `var` in certain places and helper functions. This will allow Rollup to generate more efficient helpers due to block scoping.

```js
// input
export * from 'external';

// cjs output with constBindings: false
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

// cjs output with constBindings: true
const external = require('external');

for (const k in external) {
	if (k !== 'default' && !exports.hasOwnProperty(k))
		Object.defineProperty(exports, k, {
			enumerable: true,
			get: () => external[k]
		});
}
```

#### output.generatedCode.objectShorthand

|  |  |
| --: | :-- |
| Type: | `boolean` |
| CLI: | `--generatedCode.objectShorthand`/`--no-generatedCode.objectShorthand` |
| Default: | `false` |

Allows the use of shorthand notation in objects when the property name matches the value.

```javascript
// input
const foo = 1;
export { foo, foo as bar };

// system output with objectShorthand: false
System.register('bundle', [], function (exports) {
	'use strict';
	return {
		execute: function () {
			const foo = 1;
			exports({ foo: foo, bar: foo });
		}
	};
});

// system output with objectShorthand: true
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

#### output.generatedCode.preset

|       |                           |
| ----: | :------------------------ |
| Type: | `"es5" \| "es2015"`       |
|  CLI: | `--generatedCode <value>` |

Allows choosing one of the presets listed above while overriding some options.

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

#### output.generatedCode.reservedNamesAsProps

|  |  |
| --: | :-- |
| Type: | `boolean` |
| CLI: | `--generatedCode.reservedNamesAsProps`/`--no-generatedCode.reservedNamesAsProps` |
| Default: | `true` |

Determine whether reserved words like "default" can be used as prop names without using quotes. This will make the syntax of the generated code ES3 compliant. Note however that for full ES3 compliance, you may also need to polyfill some builtin functions like `Object.keys` or `Array.prototype.forEach`.

```javascript
// input
const foo = null;
export { foo as void };

// cjs output with reservedNamesAsProps: false
const foo = null;

exports['void'] = foo;

// cjs output with reservedNamesAsProps: true
const foo = null;

exports.void = foo;
```

#### output.generatedCode.symbols

|          |                                                        |
| -------: | :----------------------------------------------------- |
|    Type: | `boolean`                                              |
|     CLI: | `--generatedCode.symbols`/`--no-generatedCode.symbols` |
| Default: | `false`                                                |

Whether to allow the use of `Symbol` in auto-generated code snippets. Currently, this only controls if namespaces will have the `Symbol.toStringTag` property set to the correct value of `Module`, which means that for a namespace, `String(namespace)` logs `[object Module]`. This again is used for feature detection in certain libraries and frameworks.

```javascript
// input
export const foo = 42;

// cjs output with symbols: false
const foo = 42;

exports.foo = foo;

// cjs output with symbols: true
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const foo = 42;

exports.foo = foo;
```

### output.hoistTransitiveImports

|          |                                                          |
| -------: | :------------------------------------------------------- |
|    Type: | `boolean`                                                |
|     CLI: | `--hoistTransitiveImports`/`--no-hoistTransitiveImports` |
| Default: | `true`                                                   |

By default, when creating multiple chunks, transitive imports of entry chunks will be added as empty imports to the entry chunks. See ["Why do additional imports turn up in my entry chunks when code-splitting?"](../faqs/index.md#why-do-additional-imports-turn-up-in-my-entry-chunks-when-code-splitting) for details and background. Setting this option to `false` will disable this behaviour. This option is ignored when using the [`output.preserveModules`](#output-preservemodules) option as here, imports will never be hoisted.

### output.inlineDynamicImports

|          |                                                      |
| -------: | :--------------------------------------------------- |
|    Type: | `boolean`                                            |
|     CLI: | `--inlineDynamicImports`/`--no-inlineDynamicImports` |
| Default: | `false`                                              |

This will inline dynamic imports instead of creating new chunks to create a single bundle. Only possible if a single input is provided. Note that this will change the execution order: A module that is only imported dynamically will be executed immediately if the dynamic import is inlined.

### output.interop

|  |  |
| --: | :-- |
| Type: | `"compat" \| "auto"\| "esModule"\| "default"\| "defaultOnly"\| ((id: string) => "compat"\| "auto"\| "esModule"\| "default"\| "defaultOnly")` |
| CLI: | `--interop <value>` |
| Default: | `"default"` |

Controls how Rollup handles default, namespace and dynamic imports from external dependencies in formats like CommonJS that do not natively support these concepts. Note that the default mode of "default" mimics NodeJS behavior and is different from TypeScript `esModuleInterop`. To get TypeScript's behavior, explicitly set the value to `"auto"`. In the examples, we will be using the CommonJS format, but the choice of interop similarly applies to AMD, IIFE and UMD targets as well.

To understand the different values, assume we are bundling the following code for a `cjs` target:

```js
import ext_default, * as external from 'external1';
console.log(ext_default, external.bar, external);
import('external2').then(console.log);
```

Keep in mind that for Rollup, `import * as ext_namespace from 'external'; console.log(ext_namespace.bar);` is completely equivalent to `import {bar} from 'external'; console.log(bar);` and will produce the same code. In the example above however, the namespace object itself is passed to a global function as well, which means we need it as a properly formed object.

- `"default"` assumes that the required value should be treated as the default export of the imported module, just like when importing CommonJS from an ES module context in NodeJS. Named imports are supported as well, which are treated as properties of the default import. To create the namespace object, Rollup injects these helpers:

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

- `"esModule"` assumes that required modules are transpiled ES modules where the required value corresponds to the module namespace, and the default export is the `.default` property of the exported object. This is the only interop type that will not inject any helper functions:

  ```js
  var external = require('external1');
  console.log(external.default, external.bar, external);
  Promise.resolve()
  	.then(function () {
  		return require('external2');
  	})
  	.then(console.log);
  ```

  When `esModule` is used, Rollup adds no additional interop helpers and also supports live-bindings for default exports.

- `"auto"` combines both `"esModule"` and `"default"` by injecting helpers that contain code that detects at runtime if the required value contains the [`__esModule` property](#output-esmodule). Adding this property is a hack implemented by TypeScript `esModuleInterop`, Babel and other tools to signify that the required value is the namespace of a transpiled ES module.:

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

  Note how Rollup is reusing the created namespace object to get the `default` export. If the namespace object is not needed, Rollup will use a simpler helper:

  ```js
  // input
  import ext_default from 'external';
  console.log(ext_default);

  // output
  var ext_default = require('external');

  function _interopDefault(e) {
  	return e && e.__esModule ? e : { default: e };
  }

  var ext_default__default = /*#__PURE__*/ _interopDefault(ext_default);
  console.log(ext_default__default.default);
  ```

- `compat` is equivalent to `"auto"` except that it uses a slightly different helper for the default export that checks for the presence of a `default` property instead of the `__esModule` property. Except for the rare situation where a CommonJS module exports a property `"default"` that should not be the default export, this often helps to make interop "just work" as it does not rely on idiosyncratic hacks but instead uses duck-typing:

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

  Similar to `"auto"`, Rollup will use a simpler helper if the namespace is not needed:

  ```js
  // input
  import ext_default from 'external';
  console.log(ext_default);

  // output
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

- `"defaultOnly"` is similar to `"default"` except for the following:

  - Named imports are forbidden. If such an import is encountered, Rollup throws an error even in `es` and `system` formats. That way it is ensures that the `es` version of the code is able to import non-builtin CommonJS modules in Node correctly.
  - While namespace reexports `export * from 'external';` are not prohibited, they are ignored and will cause Rollup to display a warning because they would not have an effect if there are no named exports.
  - When a namespace object is generated, Rollup uses a much simpler helper.

  Here is what Rollup will create from the example code. Note that we removed `external.bar` from the code as otherwise, Rollup would have thrown an error because, as stated before, this is equivalent to a named import.

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

- When a function is supplied, Rollup will pass each external id to this function once to control the interop type per dependency.

  As an example if all dependencies are CommonJs, the following config will ensure that named imports are only permitted from Node builtins:

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

There are some additional options that have an effect on the generated interop code:

- Setting [`output.externalLiveBindings`](#output-externallivebindings) to `false` will generate simplified namespace helpers as well as simplified code for extracted default imports.
- Setting [`output.freeze`](#output-freeze) to `false` will prevent generated interop namespace objects from being frozen.

### output.intro/output.outro

|       |                                                              |
| ----: | :----------------------------------------------------------- |
| Type: | `string \| ((chunk: ChunkInfo) => string\| Promise<string>)` |
|  CLI: | `--intro`/`--outro <text>`                                   |

Similar to [`output.banner/output.footer`](#output-banner-output-footer), except that the code goes _inside_ any format-specific wrapper.

```js
export default {
	//...,
	output: {
		//...,
		intro: 'const ENVIRONMENT = "production";'
	}
};
```

### output.manualChunks

|  |  |
| --: | :-- |
| Type: | `{ [chunkAlias: string]: string[] } \| ((id: string, {getModuleInfo, getModuleIds}) => string \| void)` |

Allows the creation of custom shared common chunks. When using the object form, each property represents a chunk that contains the listed modules and all their dependencies if they are part of the module graph unless they are already in another manual chunk. The name of the chunk will be determined by the property key.

Note that it is not necessary for the listed modules themselves to be part of the module graph, which is useful if you are working with `@rollup/plugin-node-resolve` and use deep imports from packages. For instance

```javascript
({
	manualChunks: {
		lodash: ['lodash']
	}
});
```

will put all lodash modules into a manual chunk even if you are only using imports of the form `import get from 'lodash/get'`.

When using the function form, each resolved module id will be passed to the function. If a string is returned, the module and all its dependency will be added to the manual chunk with the given name. For instance this will create a `vendor` chunk containing all dependencies inside `node_modules`:

```javascript
function manualChunks(id) {
	if (id.includes('node_modules')) {
		return 'vendor';
	}
}
```

Be aware that manual chunks can change the behaviour of the application if side effects are triggered before the corresponding modules are actually used.

When using the function form, `manualChunks` will be passed an object as second parameter containing the functions `getModuleInfo` and `getModuleIds` that work the same way as [`this.getModuleInfo`](../plugin-development/index.md#this-getmoduleinfo) and [`this.getModuleIds`](../plugin-development/index.md#this-getmoduleids) on the plugin context.

This can be used to dynamically determine into which manual chunk a module should be placed depending on its position in the module graph. For instance consider a scenario where you have a set of components, each of which dynamically imports a set of translated strings, i.e.

```js
// Inside the "foo" component

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

If a lot of such components are used together, this will result in a lot of dynamic imports of very small chunks: Even though we know that all language files of the same language that are imported by the same chunk will always be used together, Rollup does not have this information.

The following code will merge all files of the same language that are only used by a single entry point:

```js
function manualChunks(id, { getModuleInfo }) {
	const match = /.*\.strings\.(\w+)\.js/.exec(id);
	if (match) {
		const language = match[1]; // e.g. "en"
		const dependentEntryPoints = [];

		// we use a Set here so we handle each module at most once. This
		// prevents infinite loops in case of circular dependencies
		const idsToHandle = new Set(getModuleInfo(id).dynamicImporters);

		for (const moduleId of idsToHandle) {
			const { isEntry, dynamicImporters, importers } =
				getModuleInfo(moduleId);
			if (isEntry || dynamicImporters.length > 0)
				dependentEntryPoints.push(moduleId);

			// The Set iterator is intelligent enough to iterate over
			// elements that are added during iteration
			for (const importerId of importers) idsToHandle.add(importerId);
		}

		// If there is a unique entry, we put it into a chunk based on the
		// entry name
		if (dependentEntryPoints.length === 1) {
			return `${
				dependentEntryPoints[0].split('/').slice(-1)[0].split('.')[0]
			}.strings.${language}`;
		}
		// For multiple entries, we put it into a "shared" chunk
		if (dependentEntryPoints.length > 1) {
			return `shared.strings.${language}`;
		}
	}
}
```

### output.minifyInternalExports

|  |  |
| --: | :-- |
| Type: | `boolean` |
| CLI: | `--minifyInternalExports`/`--no-minifyInternalExports` |
| Default: | `true` for formats `es` and `system` or if `output.compact` is `true`, `false` otherwise |

By default, for formats `es` and `system` or if `output.compact` is `true`, Rollup will try to export internal variables as single letter variables to allow for better minification.

**Example**<br> Input:

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

Output with `output.minifyInternalExports: true`:

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

Output with `output.minifyInternalExports: false`:

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

Even though it appears that setting this option to `true` makes the output larger, it actually makes it smaller if a minifier is used. In this case, `export { importantValue as i }` can become e.g. `export{a as i}` or even `export{i}`, while otherwise it would produce `export{ a as importantValue }` because a minifier usually will not change export signatures.

### output.paths

|       |                                                        |
| ----: | :----------------------------------------------------- |
| Type: | `{ [id: string]: string } \| ((id: string) => string)` |

Maps external module IDs to paths. External ids are ids that [cannot be resolved](../troubleshooting/index.md#warning-treating-module-as-external-dependency) or ids explicitly provided by the [`external`](#external) option. Paths supplied by `output.paths` will be used in the generated bundle instead of the module ID, allowing you to, for example, load dependencies from a CDN:

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

### output.preserveModules

|          |                                            |
| -------: | :----------------------------------------- |
|    Type: | `boolean`                                  |
|     CLI: | `--preserveModules`/`--no-preserveModules` |
| Default: | `false`                                    |

Instead of creating as few chunks as possible, this mode will create separate chunks for all modules using the original module names as file names. Requires the [`output.dir`](#output-dir) option. Tree-shaking will still be applied, suppressing files that are not used by the provided entry points or do not have side effects when executed and removing unused exports of files that are not entry points. On the other hand, if plugins (like `@rollup/plugin-commonjs`) emit additional "virtual" files to achieve certain results, those files will be emitted as actual files using a pattern `_virtual/fileName.js`.

It is therefore not recommended to blindly use this option to transform an entire file structure to another format if you directly want to import from those files as expected exports may be missing. In that case, you should rather designate all files explicitly as entry points by adding them to the [`input` option object](#input), see the example there for how to do that.

Note that when transforming to `cjs` or `amd` format, each file will by default be treated as an entry point with [`output.exports`](#output-exports) set to `auto`. This means that e.g. for `cjs`, a file that only contains a default export will be rendered as

```js
// input main.js
export default 42;

// output main.js
('use strict');

var main = 42;

module.exports = main;
```

assigning the value directly to `module.exports`. If someone imports this file, they will get access to the default export via

```js
const main = require('./main.js');
console.log(main); // 42
```

As with regular entry points, files that mix default and named exports will produce warnings. You can avoid the warnings by forcing all files to use named export mode via `output.exports: "named"`. In that case, the default export needs to be accessed via the `.default` property of the export:

```js
// input main.js
export default 42;

// output main.js
('use strict');

Object.defineProperty(exports, '__esModule', { value: true });

var main = 42;

exports.default = main;

// consuming file
const main = require('./main.js');
console.log(main.default); // 42
```

### output.preserveModulesRoot

|       |                                          |
| ----: | :--------------------------------------- |
| Type: | `string`                                 |
|  CLI: | `--preserveModulesRoot <directory-name>` |

A directory path to input modules that should be stripped away from [`output.dir`](#output-dir) path while [`output.preserveModules`](#output-preservemodules) is `true`.

For example, given the following configuration:

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

The `preserveModulesRoot` setting ensures that the input modules will be output to the paths `dist/module.js` and `dist/another/module.js`.

This option is particularly useful while using plugins such as `@rollup/plugin-node-resolve`, which may cause changes in the output directory structure. This can happen when third-party modules are not marked [`external`](#external), or while developing in a monorepo of multiple packages that rely on one another and are not marked [`external`](#external).

### output.sourcemap

|          |                                     |
| -------: | :---------------------------------- |
|    Type: | `boolean \| 'inline'\| 'hidden'`    |
|     CLI: | `-m`/`--sourcemap`/`--no-sourcemap` |
| Default: | `false`                             |

If `true`, a separate sourcemap file will be created. If `"inline"`, the sourcemap will be appended to the resulting `output` file as a data URI. `"hidden"` works like `true` except that the corresponding sourcemap comments in the bundled files are suppressed.

### output.sourcemapBaseUrl

|       |                            |
| ----: | :------------------------- |
| Type: | `string`                   |
|  CLI: | `--sourcemapBaseUrl <url>` |

By default, sourcemap files generated by Rollup uses relative URLs to reference the files they describe. By providing an absolute base URL, e.g. `https://example.com`, sourcemaps will use absolute URLs instead.

### output.sourcemapExcludeSources

|          |                                                            |
| -------: | :--------------------------------------------------------- |
|    Type: | `boolean`                                                  |
|     CLI: | `--sourcemapExcludeSources`/`--no-sourcemapExcludeSources` |
| Default: | `false`                                                    |

If `true`, the actual code of the sources will not be added to the sourcemaps, making them considerably smaller.

### output.sourcemapFile

|       |                                         |
| ----: | :-------------------------------------- |
| Type: | `string`                                |
|  CLI: | `--sourcemapFile <file-name-with-path>` |

The location of the generated bundle. If this is an absolute path, all the `sources` paths in the sourcemap will be relative to it. The `map.file` property is the basename of `sourcemapFile`, as the location of the sourcemap is assumed to be adjacent to the bundle.

`sourcemapFile` is not required if `output` is specified, in which case an output filename will be inferred by adding ".map" to the output filename for the bundle.

### output.sourcemapIgnoreList

|  |  |
| --: | :-- |
| Type: | `boolean \| (relativeSourcePath: string, sourcemapPath: string) => boolean` |

A predicate to decide whether or not to ignore-list source files in a sourcemap, used to populate the [`x_google_ignoreList` source map extension](https://developer.chrome.com/blog/devtools-better-angular-debugging/#the-x_google_ignorelist-source-map-extension). `relativeSourcePath` is a relative path from the generated `.map` file to the corresponding source file while `sourcemapPath` is the fully resolved path of the generated sourcemap file.

```js
import path from 'node:path';
export default {
	input: 'src/main',
	output: [
		{
			file: 'bundle.js',
			sourcemapIgnoreList: (relativeSourcePath, sourcemapPath) => {
				// will ignore-list all files with node_modules in their paths
				return relativeSourcePath.includes('node_modules');
			},
			format: 'es',
			sourcemap: true
		}
	]
};
```

When you don't specify this option explicitly, by default it will put all files with `node_modules` in their path on the ignore list. You can specify `false` here to turn off the ignore-listing completely.

### output.sourcemapPathTransform

|       |                                                                 |
| ----: | :-------------------------------------------------------------- |
| Type: | `(relativeSourcePath: string, sourcemapPath: string) => string` |

A transformation to apply to each path in a sourcemap. `relativeSourcePath` is a relative path from the generated `.map` file to the corresponding source file while `sourcemapPath` is the fully resolved path of the generated sourcemap file.

```js
import path from 'node:path';
export default {
	input: 'src/main',
	output: [
		{
			file: 'bundle.js',
			sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
				// will replace relative paths with absolute paths
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

### output.validate

|          |                              |
| -------: | :--------------------------- |
|    Type: | `boolean`                    |
|     CLI: | `--validate`/`--no-validate` |
| Default: | `false`                      |

Re-parses each generated chunk to detect if the generated code is valid JavaScript. This can be useful to debug output generated by plugins that use the [`renderChunk`](../plugin-development/index.md#renderchunk) hook to transform code.

If the code is invalid, a warning will be issued. Note that no error is thrown so that you can still inspect the generated output. To promote this warning to an error, you can watch for it in an [`onwarn`](#onwarn) handler.

### preserveEntrySignatures

|  |  |
| --: | :-- |
| Type: | `"strict" \| "allow-extension" \| "exports-only"\| false` |
| CLI: | `--preserveEntrySignatures <strict \| allow-extension>`/`--no-preserveEntrySignatures` |
| Default: | `"exports-only"` |

Controls if Rollup tries to ensure that entry chunks have the same exports as the underlying entry module.

- If set to `"strict"`, Rollup will create exactly the same exports in the entry chunk as there are in the corresponding entry module. If this is not possible because additional internal exports need to be added to a chunk, Rollup will instead create a "facade" entry chunk that reexports just the necessary bindings from other chunks but contains no code otherwise. This is the recommended setting for libraries.
- `"allow-extension"` will create all exports of the entry module in the entry chunk but may also add additional exports if necessary, avoiding a "facade" entry chunk. This setting makes sense for libraries where a strict signature is not required.
- `"exports-only"` behaves like `"strict"` if the entry module has exports, otherwise it behaves like `"allow-extension"`.
- `false` will not add any exports of an entry module to the corresponding chunk and does not even include the corresponding code unless those exports are used elsewhere in the bundle. Internal exports may be added to entry chunks, though. This is the recommended setting for web apps where the entry chunks are to be placed in script tags as it may reduce both the number of chunks and possibly the bundle size.

**Example**<br> Input:

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

Output for `preserveEntrySignatures: "strict"`:

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

Output for `preserveEntrySignatures: "allow-extension"`:

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

Output for `preserveEntrySignatures: false`:

```js
// main.js
import('./dynamic-39821cef.js');

// dynamic-39821cef.js
const shared = 'shared';

console.log(shared);
```

At the moment, the only way to override this setting for individual entry chunks is to use the plugin API and emit those chunks via [`this.emitFile`](../plugin-development/index.md#this-emitfile) instead of using the [`input`](#input) option.

### strictDeprecations

|          |                                                  |
| -------: | :----------------------------------------------- |
|    Type: | `boolean`                                        |
|     CLI: | `--strictDeprecations`/`--no-strictDeprecations` |
| Default: | `false`                                          |

When this flag is enabled, Rollup will throw an error instead of showing a warning when a deprecated feature is used. Furthermore, features that are marked to receive a deprecation warning with the next major version will also throw an error when used.

This flag is intended to be used by e.g. plugin authors to be able to adjust their plugins for upcoming major releases as early as possible.

## Danger zone

You probably don't need to use these options unless you know what you are doing!

### acorn

|       |                |
| ----: | :------------- |
| Type: | `AcornOptions` |

Any options that should be passed through to Acorn's `parse` function, such as `allowReserved: true`. Cf. the [Acorn documentation](https://github.com/acornjs/acorn/tree/master/acorn#interface) for more available options.

### acornInjectPlugins

|       |                                                |
| ----: | :--------------------------------------------- |
| Type: | `AcornPluginFunction \| AcornPluginFunction[]` |

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
|    Type: | `string`                      |
|     CLI: | `--context <contextVariable>` |
| Default: | `undefined`                   |

By default, the context of a module – i.e., the value of `this` at the top level – is `undefined`. In rare cases you might need to change this to something else, like `'window'`.

### moduleContext

|       |                                                        |
| ----: | :----------------------------------------------------- |
| Type: | `((id: string) => string) \| { [id: string]: string }` |

Same as [`context`](#context), but per-module – can either be an object of `id: context` pairs, or an `id => context` function.

### output.amd

|  |  |
| --: | :-- |
| Type: | `{ id?: string, autoId?: boolean, basePath?: string, define?: string }` |

Note `id` can only be used for single-file builds, and cannot be combined with `autoId`/`basePath`.

#### output.amd.id

|       |                    |
| ----: | :----------------- |
| Type: | `string`           |
|  CLI: | `--amd.id <amdId>` |

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

|       |                |
| ----: | :------------- |
| Type: | `boolean`      |
|  CLI: | `--amd.autoId` |

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

|       |                  |
| ----: | :--------------- |
| Type: | `string`         |
|  CLI: | `--amd.basePath` |

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

|       |                                     |
| ----: | :---------------------------------- |
| Type: | `string`                            |
|  CLI: | `--amd.define <defineFunctionName>` |

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
|    Type: | `boolean`                          |
|     CLI: | `--amd.forceJsExtensionForImports` |
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
|    Type: | `boolean \| "if-default-prop"` |
|     CLI: | `--esModule`/`--no-esModule`   |
| Default: | `"if-default-prop"`            |

Whether to add a `__esModule: true` property when generating exports for non-ES formats. This property signifies that the exported value is the namespace of an ES module and that the default export of this module corresponds to the `.default` property of the exported object.

- `true` will always add the property when using [named exports mode](#output-exports), which is similar to what other tools do.
- `"if-default-prop"` will only add the property when using named exports mode and there also is a default export. The subtle difference is that if there is no default export, consumers of the CommonJS version of your library will get all named exports as default export instead of an error or `undefined`. We chose to make this the default value as the `__esModule` property is not a standard followed by any JavaScript runtime and leads to many interop issues, so we want to limit its use to the cases where it is really needed.
- `false` on the other hand will never add the property even if the default export would become a property `.default`.

See also [`output.interop`](#output-interop).

### output.exports

|          |                                          |
| -------: | :--------------------------------------- |
|    Type: | `"auto" \| "default"\| "named"\| "none"` |
|     CLI: | `--exports <exportMode>`                 |
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
|    Type: | `boolean`                                            |
|     CLI: | `--externalLiveBindings`/`--no-externalLiveBindings` |
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
|    Type: | `boolean`                |
|     CLI: | `--freeze`/`--no-freeze` |
| Default: | `true`                   |

Whether to `Object.freeze()` namespace import objects (i.e. `import * as namespaceImportObject from...`) that are accessed dynamically.

### output.indent

|          |                          |
| -------: | :----------------------- |
|    Type: | `boolean \| string`      |
|     CLI: | `--indent`/`--no-indent` |
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
|    Type: | `boolean`                        |
|     CLI: | `--noConflict`/`--no-noConflict` |
| Default: | `false`                          |

This will generate an additional `noConflict` export to UMD bundles. When called in an IIFE scenario, this method will return the bundle exports while restoring the corresponding global variable to its previous value.

### output.sanitizeFileName

|       |                                                            |
| ----: | :--------------------------------------------------------- |
| Type: | `boolean \| (string) => string`                            |
|  CLI: | `--sanitizeFileName`/`no-sanitizeFileName` Default: `true` |

Set to `false` to disable all chunk name sanitizations (removal of `\0`, `?` and `*` characters).

Alternatively set to a function to allow custom chunk name sanitization.

### output.strict

|          |                          |
| -------: | :----------------------- |
|    Type: | `boolean`                |
|     CLI: | `--strict`/`--no-strict` |
| Default: | `true`                   |

Whether to include the 'use strict' pragma at the top of generated non-ES bundles. Strictly speaking, ES modules are _always_ in strict mode, so you shouldn't disable this without good reason.

### output.systemNullSetters

|          |                                                |
| -------: | :--------------------------------------------- |
|    Type: | `boolean`                                      |
|     CLI: | `--systemNullSetters`/`--no-systemNullSetters` |
| Default: | `true`                                         |

When outputting the `system` module format, by default, empty setter functions are replaced with `null` as an output simplification. This is incompatible with SystemJS before v6.3.3. Deactivate this option to output empty functions instead that older SystemJS versions support.

### preserveSymlinks

|          |                      |
| -------: | :------------------- |
|    Type: | `boolean`            |
|     CLI: | `--preserveSymlinks` |
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
|    Type: | `boolean`                                        |
|     CLI: | `--shimMissingExports`/`--no-shimMissingExports` |
| Default: | `false`                                          |

If this option is provided, bundling will not fail if bindings are imported from a file that does not define these bindings. Instead, new variables will be created for these bindings with the value `undefined`.

### treeshake

|          |                                                      |
| -------: | :--------------------------------------------------- |
|    Type: | `boolean \| TreeshakingPreset \| TreeshakingOptions` |
|     CLI: | `--treeshake`/`--no-treeshake`                       |
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
|    Type: | `boolean`                                              |
|     CLI: | `--treeshake.annotations`/`--no-treeshake.annotations` |
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
| Type: | `boolean` |
| CLI: | `--treeshake.correctVarValueBeforeDeclaration`/`--no-treeshake.correctVarValueBeforeDeclaration` |
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

|       |                                           |
| ----: | :---------------------------------------- |
| Type: | `string[]`                                |
|  CLI: | `--treeshake.manualPureFunctions <names>` |

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
| Type: | `boolean\| "no-external"\| string[]\| (id: string, external: boolean) => boolean` |
| CLI: | `--treeshake.moduleSideEffects`/`--no-treeshake.moduleSideEffects`/`--treeshake.moduleSideEffects no-external` |
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

|       |                                          |
| ----: | :--------------------------------------- |
| Type: | `"smallest" \| "safest"\| "recommended"` |
|  CLI: | `--treeshake <value>`<br>                |

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
| Type: | `boolean\| 'always'` |
| CLI: | `--treeshake.propertyReadSideEffects`/`--no-treeshake.propertyReadSideEffects` |
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
| Type: | `boolean` |
| CLI: | `--treeshake.tryCatchDeoptimization`/`--no-treeshake.tryCatchDeoptimization` |
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
| Type: | `boolean` |
| CLI: | `--treeshake.unknownGlobalSideEffects`/`--no-treeshake.unknownGlobalSideEffects` |
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
|    Type: | `number`                                   |
|     CLI: | `--experimentalCacheExpiry <numberOfRuns>` |
| Default: | `10`                                       |

Determines after how many runs cached assets that are no longer used by plugins should be removed.

### experimentalLogSideEffects

|  |  |
| --: | :-- |
| Type: | `boolean` |
| CLI: | `--experimentalLogSideEffects`/`--no-experimentalLogSideEffects` |
| Default: | `false` |

When set to `true`, this will log the first side effect it finds in every file to the console. This can be very helpful to figure which files have side effects and what the actual side effects are. Removing side effects can improve tree-shaking and chunk generation and is crucial to make [`output.experimentalMinChunkSize`](#output-experimentalminchunksize) work.

This option will only log top-level statements, though. Sometimes, e.g. in case of immediately-invoked-function-expressions, the actual side effect can be hidden inside a nested expression.

### output.experimentalMinChunkSize

|          |                                     |
| -------: | :---------------------------------- |
|    Type: | `number`                            |
|     CLI: | `--experimentalMinChunkSize <size>` |
| Default: | `0`                                 |

Set a minimal chunk size target in Byte for code-splitting setups. When this value is greater than `0`, Rollup will try to merge any chunk that does not have side effects when executed, i.e. any chunk that only contains function definitions etc., and is below this size limit into another chunk that is likely to be loaded under similar conditions.

This will mean that the generated bundle will possibly load code that is not required yet in order to reduce the number of chunks. The condition for the merged chunks to be side effect free ensures that this does not change behaviour.

Unfortunately, due to the way chunking works, chunk size is measured before any chunk rendering plugins like minifiers ran, which means you should use a high enough limit to take this into account.

### perf

|          |                      |
| -------: | :------------------- |
|    Type: | `boolean`            |
|     CLI: | `--perf`/`--no-perf` |
| Default: | `false`              |

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

|          |                           |
| -------: | :------------------------ |
|    Type: | `WatcherOptions \| false` |
| Default: | `{}`                      |

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

|          |                               |
| -------: | :---------------------------- |
|    Type: | `number`                      |
|     CLI: | `--watch.buildDelay <number>` |
| Default: | `0`                           |

Configures how long Rollup will wait for further changes until it triggers a rebuild in milliseconds. By default, Rollup does not wait but there is a small debounce timeout configured in the chokidar instance. Setting this to a value greater than `0` will mean that Rollup will only trigger a rebuild if there was no change for the configured number of milliseconds. If several configurations are watched, Rollup will use the largest configured build delay.

### watch.chokidar

|       |                   |
| ----: | :---------------- |
| Type: | `ChokidarOptions` |

An optional object of watch options that will be passed to the bundled [chokidar](https://github.com/paulmillr/chokidar) instance. See the [chokidar documentation](https://github.com/paulmillr/chokidar#api) to find out what options are available.

### watch.clearScreen

|          |                                                |
| -------: | :--------------------------------------------- |
|    Type: | `boolean`                                      |
|     CLI: | `--watch.clearScreen`/`--no-watch.clearScreen` |
| Default: | `true`                                         |

Whether to clear the screen when a rebuild is triggered.

### watch.exclude

|       |                                          |
| ----: | :--------------------------------------- |
| Type: | `string \| RegExp\| (string\| RegExp)[]` |
|  CLI: | `--watch.exclude <files>`                |

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

|       |                                          |
| ----: | :--------------------------------------- |
| Type: | `string \| RegExp\| (string\| RegExp)[]` |
|  CLI: | `--watch.include <files>`                |

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

|          |                                            |
| -------: | :----------------------------------------- |
|    Type: | `boolean`                                  |
|     CLI: | `--watch.skipWrite`/`--no-watch.skipWrite` |
| Default: | `false`                                    |

Whether to skip the `bundle.write()` step when a rebuild is triggered.

## Deprecated options

☢️ These options have been deprecated and may be removed in a future Rollup version.

### inlineDynamicImports

_Use the [`output.inlineDynamicImports`](#output-inlinedynamicimports) output option instead, which has the same signature._

### manualChunks

_Use the [`output.manualChunks`](#output-manualchunks) output option instead, which has the same signature._

### maxParallelFileReads

_Use the [`maxParallelFileOps`](#maxparallelfileops) option instead._

|          |                                   |
| -------: | :-------------------------------- |
|    Type: | `number`                          |
|     CLI: | `--maxParallelFileReads <number>` |
| Default: | 20                                |

Limits the number of files rollup will open in parallel when reading modules. Without a limit or with a high enough value, builds can fail with an "EMFILE: too many open files". This depends on how many open file handles the os allows.

### output.dynamicImportFunction

_Use the [`renderDynamicImport`](../plugin-development/index.md#renderdynamicimport) plugin hook instead._

|          |                                  |
| -------: | :------------------------------- |
|    Type: | `string`                         |
|     CLI: | `--dynamicImportFunction <name>` |
| Default: | `import`                         |

This will rename the dynamic import function to the chosen name when outputting ES bundles. This is useful for generating code that uses a dynamic import polyfill such as [this one](https://github.com/uupaa/dynamic-import-polyfill).

### output.experimentalDeepDynamicChunkOptimization

_This option is no longer needed._

|  |  |
| --: | :-- |
| Type: | `boolean` |
| CLI: | `--experimentalDeepDynamicChunkOptimization`/`--no-experimentalDeepDynamicChunkOptimization` |
| Default: | `false` |

This option was used to prevent performance issues with the full chunk optimization algorithm. As the algorithm is much faster now, this option is now ignored by Rollup and should no longer be used.

### output.preferConst

_Use the [`output.generatedCode.constBindings`](#output-generatedcode-constbindings) option instead._

|          |                                    |
| -------: | :--------------------------------- |
|    Type: | `boolean`                          |
|     CLI: | `--preferConst`/`--no-preferConst` |
| Default: | `false`                            |

Generate `const` declarations for exports rather than `var` declarations.

### output.namespaceToStringTag

_Use [`output.generatedCode.symbols`](#output-generatedcode-symbols) instead._

|          |                                                      |
| -------: | :--------------------------------------------------- |
|    Type: | `boolean`                                            |
|     CLI: | `--namespaceToStringTag`/`--no-namespaceToStringTag` |
| Default: | `false`                                              |

Whether to add spec compliant `.toString()` tags to namespace objects. If this option is set,

```javascript
import * as namespace from './file.js';
console.log(String(namespace));
```

will always log `[object Module]`;

### preserveModules

_Use the [`output.preserveModules`](#output-preservemodules) output option instead, which has the same signature._
