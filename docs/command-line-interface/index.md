---
title: 命令行接口
---

# {{$frontmatter.title}}

[[toc]]

Rollup 通常应该从命令行使用。你可以提供一个可选的 Rollup 配置文件，以简化命令行使用并启用高级 Rollup 功能。

## 配置文件 {#configuration-files}

Rollup 配置文件是可选的，但它们非常强大和方便，因此**推荐**使用。配置文件是一个 ES 模块，它导出一个默认对象，其中包含所需的选项：

```javascript twoslash
/** @type {import('rollup').RollupOptions} */
// ---cut---
export default {
	input: 'src/main.js',
	output: {
		file: 'bundle.js',
		format: 'cjs'
	}
};
```

通常，它被称为 `rollup.config.js` 或 `rollup.config.mjs`，并位于项目的根目录中。除非使用 [`--configPlugin`](#configplugin-plugin) 或 [`--bundleConfigAsCjs`](#bundleconfigascjs) 选项，否则 Rollup 将直接使用 Node 导入该文件。请注意，使用原生 Node ES 模块时存在一些[注意事项](#caveats-when-using-native-node-es-modules)，因为 Rollup 将遵循 [Node ESM 语义](https://nodejs.org/docs/latest-v14.x/api/packages.html#packages_determining_module_system)。

如果你想使用 `require` 和 `module.exports` 编写 CommonJS 模块的配置文件，你应该将文件扩展名更改为 `.cjs`。

你也可以使用其他语言编写配置文件，比如 TypeScript。为此，安装相应的 Rollup 插件，例如 `@rollup/plugin-typescript`，并使用 [`--configPlugin`](#configplugin-plugin) 选项：

```shell
rollup --config rollup.config.ts --configPlugin typescript
```

使用 `--configPlugin` 选项将始终强制将你的配置文件先转换为 CommonJS 格式。同时，查看 [Config Intellisense](#config-intellisense) 以获取在配置文件中使用 TypeScript 类型定义的更多方法。

配置文件支持下面列出的选项。有关每个选项的详细信息，请参阅[选项大全](../configuration-options/index.md)：

```javascript twoslash
// rollup.config.js

// 可以是数组（即多个输入源）
// ---cut-start---
/** @type {import('rollup').RollupOptions} */
// ---cut-end---
export default {
	// 核心输入选项
	external,
	input, // 有条件地需要
	plugins,

	// 进阶输入选项
	cache,
	logLevel,
	makeAbsoluteExternalsRelative,
	maxParallelFileOps,
	onLog,
	onwarn,
	preserveEntrySignatures,
	strictDeprecations,

	// 危险区域
	context,
	moduleContext,
	preserveSymlinks,
	shimMissingExports,
	treeshake,

	// 实验性
	experimentalCacheExpiry,
	experimentalLogSideEffects,
	experimentalMinChunkSize,
	perf,

	// 必需（可以是数组，用于描述多个输出）
	output: {
		// 核心输出选项
		dir,
		file,
		format,
		globals,
		name,
		plugins,

		// 进阶输出选项
		assetFileNames,
		banner,
		chunkFileNames,
		compact,
		dynamicImportInCjs,
		entryFileNames,
		extend,
		externalImportAttributes,
		footer,
		generatedCode,
		hashCharacters,
		hoistTransitiveImports,
		importAttributesKey,
		inlineDynamicImports,
		interop,
		intro,
		manualChunks,
		minifyInternalExports,
		outro,
		paths,
		preserveModules,
		preserveModulesRoot,
		sourcemap,
		sourcemapBaseUrl,
		sourcemapExcludeSources,
		sourcemapFile,
		sourcemapFileNames,
		sourcemapIgnoreList,
		sourcemapPathTransform,
		validate,

		// 危险区域
		amd,
		esModule,
		exports,
		externalLiveBindings,
		freeze,
		indent,
		noConflict,
		sanitizeFileName,
		strict,
		systemNullSetters,

		// 实验性
		experimentalMinChunkSize
	},

	watch: {
		buildDelay,
		chokidar,
		clearScreen,
		exclude,
		include,
		skipWrite
	}
};
```

你可以从配置文件中导出一个**数组**，以便一次从多个不相关的输入进行打包，即使在监视模式下也可以。要使用相同的输入打出不同的包，你需要为每个输入提供一个输出选项数组：

```javascript twoslash
// rollup.config.js (building more than one bundle)

// ---cut-start---
/** @type {import('rollup').RollupOptions[]} */
// ---cut-end---
export default [
	{
		input: 'main-a.js',
		output: {
			file: 'dist/bundle-a.js',
			format: 'cjs'
		}
	},
	{
		input: 'main-b.js',
		output: [
			{
				file: 'dist/bundle-b1.js',
				format: 'cjs'
			},
			{
				file: 'dist/bundle-b2.js',
				format: 'es'
			}
		]
	}
];
```

如果你想异步创建配置文件，Rollup 也可以处理解析为对象或数组的 `Promise`。

```javascript
// rollup.config.js
import fetch from 'node-fetch';

export default fetch('/some-remote-service-which-returns-actual-config');
```

类似地，你也可以这样做：

```javascript
// rollup.config.js (Promise 解析为数组)
export default Promise.all([fetch('get-config-1'), fetch('get-config-2')]);
```

要使用配置文件来运行 Rollup，请传递 `--config` 或 `-c` 标志：

```shell
# 向 Rollup 传递自定义配置文件位置
rollup --config my.config.js

# 如果你没有传递文件名，Rollup 将会尝试
# 按照以下顺序加载配置文件：
# rollup.config.mjs -> rollup.config.cjs -> rollup.config.js
rollup --config
```

你还可以导出一个返回任何上述配置格式的函数。该函数将传递当前的命令行参数，以便你可以动态地调整你的配置以遵循例如 [`--silent`](#silent)。如果你使用 `config` 作为前缀定义自己的命令行选项，你甚至可以自定义它们：

```javascript twoslash
// rollup.config.js
import defaultConfig from './rollup.default.config.js';
import debugConfig from './rollup.debug.config.js';

// ---cut-start---
/** @type {import('rollup').RollupOptionsFunction} */
// ---cut-end---
export default commandLineArgs => {
	if (commandLineArgs.configDebug === true) {
		return debugConfig;
	}
	return defaultConfig;
};
```

如果你现在运行 `rollup --config --configDebug`，将使用调试配置。

默认情况下，命令行参数将始终覆盖从配置文件中导出的相应值。如果你想更改这种行为，可以通过从 `commandLineArgs` 对象中删除它们来让 Rollup 忽略命令行参数：

```javascript twoslash
// rollup.config.js
// ---cut-start---
/** @type {import('rollup').RollupOptionsFunction} */
// ---cut-end---
export default commandLineArgs => {
	const inputBase = commandLineArgs.input || 'main.js';

	// 这会使 Rollup 忽略 CLI 参数
	delete commandLineArgs.input;
	return {
		input: 'src/entries/' + inputBase,
		output: {
			/* ... */
		}
	};
};
```

### 填写配置时的智能提示 {#config-intellisense}

由于 Rollup 随附了 TypeScript 类型定义，因此你可以使用 JSDoc 类型提示来利用你的 IDE 的智能感知功能：

```javascript twoslash
// rollup.config.js
/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
	/* 你的配置 */
};
export default config;
```

或者，你可以使用 `defineConfig` 辅助函数，它应该提供无需 JSDoc 注释即可使用智能感知的功能：

```javascript twoslash
// rollup.config.js
import { defineConfig } from 'rollup';

export default defineConfig({
	/* 你的配置 */
});
```

除了 `RollupOptions` 和封装了该类型的 `defineConfig` 辅助函数之外，以下类型也可能会很有用：

- `OutputOptions`：配置文件的 `output` 部分
- `Plugin`：提供 `name` 和一些钩子的插件对象。所有钩子都是完全类型化的，以帮助插件开发。
- `PluginImpl`：将选项对象映射到插件对象的函数。大多数公共的 Rollup 插件都遵循这种模式。

你还可以通过 [`--configPlugin`](#configplugin-plugin) 选项直接使用 TypeScript 编写配置文件。使用 TypeScript，你可以直接导入 `RollupOptions` 类型：

```typescript twoslash
import type { RollupOptions } from 'rollup';

const config: RollupOptions = {
	/* 你的配置 */
};
export default config;
```

## 与 JavaScript API 的差异 {#differences-to-the-javascript-api}

虽然配置文件提供了一种简单的配置 Rollup 的方式，但它们也限制了 Rollup 可以被调用和配置的方式。特别是如果你正在将 Rollup 嵌入到另一个构建工具中，或者想将其集成到更高级构建流程中，直接从脚本中以编程方式调用 Rollup 可能更好。

如果你想在某个时候从配置文件切换到使用 [JavaScript API](../javascript-api/index.md)，则需要了解一些重要的差异：

- 当使用 JavaScript API 时，传递给 `rollup.rollup` 的配置必须是一个对象，不能被包装在 Promise 或函数中。
- 你不能再使用配置数组。相反，你应该为每个 `inputOptions` 集运行一次 `rollup.rollup`。
- `output` 选项将被忽略。相反，你应该为每个 `outputOptions` 集运行一次 `bundle.generate(outputOptions)` 或 `bundle.write(outputOptions)`。

## 从一个 NPM 包加载配置 {#loading-a-configuration-from-a-node-package}

为了实现互操作性，Rollup 还支持从安装到 `node_modules` 中的包中加载配置文件：

```shell
# 这将首先尝试加载包 "rollup-config-my-special-config"
# 如果失败，则尝试加载 "my-special-config"
rollup --config node:my-special-config
```

## 使用原生 Node ES 模块时的注意事项 {#caveats-when-using-native-node-es-modules}

特别是在从旧版本 Rollup 升级时，当使用原生 ES 模块作为配置文件时，有一些需要注意的事项。

### 获取当前目录 {#getting-the-current-directory}

对于 CommonJS 文件，人们经常使用 `__dirname` 访问当前目录并将相对路径解析为绝对路径。这在原生 ES 模块中不被支持。相反，我们建议使用以下方法 (例如生成外部模块的绝对 id)：

```js twoslash
// rollup.config.js
import { fileURLToPath } from 'node:url';

export default {
	/* ..., */
	// 为 <currentdir>/src/some-file.js 生成绝对路径
	external: [fileURLToPath(new URL('src/some-file.js', import.meta.url))]
};
```

### 导入 package.json {#importing-packagejson}

导入你的 package 文件可能很有用，例如自动将你的依赖项标记为 “external”。根据你的 Node 版本，有不同的方法来实现此目的：

- 对于 Node 17.5+，你可以使用导入断言

  ```js twoslash
  import pkg from './package.json' assert { type: 'json' };

  export default {
  	// Mark package dependencies as "external". Rest of configuration
  	// omitted.
  	external: Object.keys(pkg.dependencies)
  };
  ```

- 对于旧一些的 Node 版本，你可以使用 `createRequire`

  ```js twoslash
  import { createRequire } from 'node:module';
  const require = createRequire(import.meta.url);
  const pkg = require('./package.json');

  // ...
  ```

- 或者直接从磁盘读取并解析其内容

  ```js twoslash
  // rollup.config.mjs
  import { readFileSync } from 'node:fs';

  // 使用 import.meta.url 可以使路径相对于当前源文件而不是 process.cwd()。
  // 更多信息参见：
  // https://nodejs.org/docs/latest-v16.x/api/esm.html#importmetaurl
  const packageJson = JSON.parse(
  	readFileSync(new URL('./package.json', import.meta.url))
  );

  // ...
  ```

## 命令行标志 {#command-line-flags}

许多选项都有等效的命令行标志。在这些情况下，如果你正在使用配置文件，则此处传递的任何参数都将覆盖配置文件。以下是所有支持的选项列表：

```
-c, --config <filename>     使用此配置文件
														（如果使用参数但未指定值，则默认为 rollup.config.js）
-d, --dir <dirname>         用于块的目录（如果不存在，则打印到 stdout）
-e, --external <ids>        排除模块 ID 的逗号分隔列表
-f, --format <format>       输出类型（amd、cjs、es、iife、umd、system）
-g, --globals <pairs>       `moduleID:Global` 对的逗号分隔列表
-h, --help                  显示此帮助消息
-i, --input <filename>      输入（替代 <entry file>）
-m, --sourcemap             生成源映射（`-m inline` 为内联映射）
-n, --name <name>           UMD 导出的名称
-o, --file <output>         单个输出文件（如果不存在，则打印到 stdout）
-p, --plugin <plugin>       使用指定的插件（可重复）
-v, --version               显示版本号
-w, --watch                 监视产物文件并在更改时重新构建
--amd.autoId                基于块名称生成 AMD ID
--amd.basePath <prefix>     要预先添加到自动生成的 AMD ID 的路径
--amd.define <name>         在 `define` 位置使用的函数
--amd.forceJsExtensionForImports 在 AMD 导入中使用 `.js` 扩展名
--amd.id <id>               AMD 模块的 ID（默认为匿名）
--assetFileNames <pattern>  发布资源的名称模式
--banner <text>             在产物顶部插入的代码（位于包装器之外）
--chunkFileNames <pattern>  发布次要块的名称模式
--compact                   缩小包装器代码
--context <variable>        指定顶级 `this` 值
--no-dynamicImportInCjs     将外部动态 CommonJS 导入编写为 require
--entryFileNames <pattern>  发布入口块的名称模式
--environment <values>      传递给配置文件的设置（请参阅示例）
--no-esModule               不添加 __esModule 属性
--exports <mode>            指定导出模式（auto、default、named、none）
--extend                    扩展由 --name 定义的全局变量
--no-externalImportAttributes 在 "es" 格式输出中省略导入属性
--no-externalLiveBindings   不生成支持实时绑定的代码
--failAfterWarnings         如果生成的构建产生警告，则退出并显示错误
--filterLogs <filter>       过滤日志信息
--footer <text>             在产物底部插入的代码（位于包装器之外）
--forceExit                 当任务完成后，强制结束进程
--no-freeze                 不冻结命名空间对象
--generatedCode <preset>    使用哪些代码特性（es5/es2015）
--generatedCode.arrowFunctions 在生成的代码中使用箭头函数
--generatedCode.constBindings 在生成的代码中使用 "const"
--generatedCode.objectShorthand 在生成的代码中使用简写属性
--no-generatedCode.reservedNamesAsProps 始终引用保留名称作为 props
--generatedCode.symbols     在生成的代码中使用符号
--hashCharacters <name>     使用指定的字符集来生成文件的哈希值
--no-hoistTransitiveImports 不将中转导入提升到入口块中
--importAttributesKey <name> 使用特定的关键词作为导入属性
--no-indent                 不缩进结果
--inlineDynamicImports      使用动态导入时创建单次打包
--no-interop                不包括交互操作块
--intro <text>              在产物顶部插入的代码（位于包装器内部）
--logLevel <level>          要显示哪种类型的日志
--no-makeAbsoluteExternalsRelative 不规范化外部导入
--maxParallelFileOps <value> 并行读取的文件数
--minifyInternalExports     强制或禁用内部导出的缩小
--noConflict                为 UMD 全局生成 noConflict 方法
--outro <text>              在产物底部插入的代码（位于包装器内部）
--perf                      显示性能计时
--no-preserveEntrySignatures 避免入口点的门面块
--preserveModules           保留模块结构
--preserveModulesRoot       将保留的模块放置在根路径下的此路径下
--preserveSymlinks          解析文件时不要跟随符号链接
--no-reexportProtoFromExternal 在使用重新导出星号（'*'）时，忽略 __proto__
--no-sanitizeFileName       不要替换文件名中的无效字符
--shimMissingExports        为丢失的导出创建卡扣变量
--silent                    不打印警告
--sourcemapBaseUrl <url>    使用给定的基本 URL 发出绝对源映射 URL
--sourcemapExcludeSources   在源映射中不包括源代码
--sourcemapFile <file>      指定源映射的包位置
--sourcemapFileNames <pattern> 编译后 sourcemap 的命名模式
--stdin=ext                 指定用于标准输入的文件扩展名
--no-stdin                  不要从 stdin 读取 "-"
--no-strict                 不在生成的模块中发出 `"use strict";`
--strictDeprecations        抛出有关不推荐使用的功能的错误
--no-systemNullSetters      不要将空的 SystemJS setter 替换为 `null`
--no-treeshake              禁用除屑优化
--no-treeshake.annotations 忽略纯调用注释
--treeshake.correctVarValueBeforeDeclaration 在声明之前将变量取消优化
--treeshake.manualPureFunctions <names> 手动将函数声明为纯函数
--no-treeshake.moduleSideEffects 假设模块没有副作用
--no-treeshake.propertyReadSideEffects 忽略属性访问副作用
--no-treeshake.tryCatchDeoptimization 不要关闭 try-catch-tree-shaking
--no-treeshake.unknownGlobalSideEffects 假设未知的全局变量不会抛出异常
--validate                  验证输出
--waitForBundleInput        等待打包输入文件
--watch.buildDelay <number> 节流观察重建
--no-watch.clearScreen      重建时不要清除屏幕
--watch.exclude <files>     排除要观察的文件
--watch.include <files>     限制观察到指定文件
--watch.onBundleEnd <cmd>   在 "BUNDLE_END" 事件上运行的 Shell 命令
--watch.onBundleStart <cmd> 在 "BUNDLE_START" 事件上运行的 Shell 命令
--watch.onEnd <cmd>         在 "END" 事件上运行的 Shell 命令
--watch.onError <cmd>       在 "ERROR" 事件上运行的 Shell 命令
--watch.onStart <cmd>       在 "START" 事件上运行的 Shell 命令
--watch.skipWrite           在监视时不要将文件写入磁盘
```

以下标志仅通过命令行界面可用。所有其他标志都对应并覆盖其配置文件等效项，请参阅[选项大列表](../configuration-options/index.md)获取详细信息。

### `--bundleConfigAsCjs` {#bundleconfigascjs}

此选项将强制将你的配置转译为 CommonJS。

这允许你在配置中使用 CommonJS 常用的变量/方法，例如 `__dirname` 或 `require.resolve`，即使配置本身是作为 ES 模块编写的。

### `--configPlugin <plugin>` {#configplugin-plugin}

允许指定 Rollup 插件来转译或控制解析配置文件。主要好处是可以使用非 JavaScript 的配置文件。例如，如果你安装了 `@rollup/plugin-typescript`，则以下内容将允许你使用 TypeScript 编写配置文件：

```shell
rollup --config rollup.config.ts --configPlugin @rollup/plugin-typescript
```

对于 TypeScript，请确保在 `tsconfig.json` 的 `include` 路径中包含 Rollup 配置文件。例如：

```
"include": ["src/**/*", "rollup.config.ts"],
```

此选项支持与 [`--plugin`](#p-plugin-plugin-plugin) 选项相同的语法，即你可以多次指定该选项，可以省略 `@rollup/plugin-` 前缀，只需编写 `typescript`，并可以通过 `={...}` 指定插件选项。

使用此选项将使 Rollup 首先将你的配置文件转译为 ES 模块，然后再执行它。如果要转译为 CommonJS，请还传递 [`--bundleConfigAsCjs`](#bundleconfigascjs) 选项。

### `--environment <values>` {#environment-values}

通过 `process.ENV` 传递其他设置到配置文件。

```shell
rollup -c --environment INCLUDE_DEPS,BUILD:production
```

将设置 `process.env.INCLUDE_DEPS === 'true'` 和 `process.env.BUILD === 'production'`。你可以多次使用此选项。在这种情况下，后续设置的变量将覆盖先前的定义。这使你可以覆盖 `package.json` 脚本中的环境变量：

```json
{
	"scripts": {
		"build": "rollup -c --environment INCLUDE_DEPS,BUILD:production"
	}
}
```

如果通过以下方式调用此脚本：

```shell
npm run build -- --environment BUILD:development
```

则配置文件将接收到 `process.env.INCLUDE_DEPS === 'true'` 和 `process.env.BUILD === 'development'`。

### `--failAfterWarnings` {#failafterwarnings}

一旦构建完成，如果出现任何警告，则以错误退出构建。

### `--filterLogs <filter>`{#filterlogs-filter}

根据自定义的过滤器可以仅展示特定的日志。一个过滤器最基本的形式是一个 `key:value` 键值对，其中键是日志对象的属性，而值是允许的值。例如：

```shell
rollup -c --filterLogs code:EVAL
```

仅会展示 `log.code === 'EVAL'` 的日志消息。可以通过使用逗号分隔它们或多次使用该选项来指定多个过滤器：

```shell
rollup -c --filterLogs "code:FOO,message:This is the message" --filterLogs code:BAR
```

这将展示所有 `code` 为 `"FOO"` 或 `"BAR"`，或者 `message` 为 `"This is the message"` 的日志。

对于无法添加额外命令行参数的情况，还可以使用 `ROLLUP_FILTER_LOGS` 环境变量。该变量的值将被处理为与在命令行上指定 `--filterLogs` 相同，并支持逗号分隔的过滤器列表。

还有一些高级语法可用于更复杂的过滤器。

- `!` 对过滤器进行取反操作：

  ```shell
  rollup -c --filterLogs "!code:CIRCULAR_DEPENDENCY"
  ```

  将展示 CIRCULAR_DEPENDENCY (循环依赖) 警告外的其他日志。

- `*` 在过滤器值中可以匹配任何子字符串：

  ```shell
  rollup -c --filterLogs "code:*_ERROR,message:*error*"
  ```

  只会展示 `code` 以 `_ERROR` 结尾或者 `message` 包含字符串 `error` 的日志。

- `&` 多个过滤器取交集：

  ```shell
  rollup -c --filterLogs "code:CIRCULAR_DEPENDENCY&ids:*/main.js*"
  ```

  只会展示 `code` 为 `"CIRCULAR_DEPENDENCY"` 并且 `ids` 包含 `/main.js` 的日志。这利用了另一个特性：

- 如果值是一个对象，在应用过滤器之前，将通过 `JSON.stringify` 将其转换为字符串。其他非字符串值将直接转换为字符串。
- 支持嵌套属性：

  ```shell
  rollup -c --filterLogs "foo.bar:value"
  ```

  只会展示属性 `log.foo.bar` 的值为 `"value"` 的日志。

### `--forceExit`

执行完毕后强制退出进程。在某些情况下，插件或其依赖可能无法正确清理并阻止 CLI 进程退出。根本原因可能很难诊断，而此标志提供了一个逃生口，直到找到并解决该问题。

请注意，这可能会破坏某些工作流程，并且不一定始终正常工作。

### `-h`/`--help`

打印帮助文档。

### `-p <plugin>`，`--plugin <plugin>` {#p-plugin-plugin-plugin}

使用指定的插件。在此处指定插件的方式有多种：

- 通过相对路径：

  ```
  rollup -i input.js -f es -p ./my-plugin.js
  ```

  文件应该导出一个返回插件对象的函数。

- 通过在本地或全局的 `node_modules` 文件夹中安装的插件的名称：

  ```
  rollup -i input.js -f es -p @rollup/plugin-node-resolve
  ```

  如果插件名称不以 `rollup-plugin-` 或 `@rollup/plugin-` 开头，Rollup 将自动尝试添加这些前缀：

  ```
  rollup -i input.js -f es -p node-resolve
  ```

- 通过一个内联实现：

  ```
  rollup -i input.js -f es -p '{transform: (c, i) => `/* ${JSON.stringify(i)} */\n${c}`}'
  ```

如果你想加载多个插件，可以重复使用该选项或提供逗号分隔的名称列表：

```shell
rollup -i input.js -f es -p node-resolve -p commonjs,json
```

默认情况下，插件函数将不带参数调用以创建插件。但是，你也可以传递自定义参数：

```shell
rollup -i input.js -f es -p 'terser={output: {beautify: true, indent_level: 2}}'
```

### `--silent` {#silent}

不要将警告打印到控制台。如果你的配置文件包含 `onLog` 或 `onwarn` 处理程序，则仍将调用此处理程序。对于具有 `onLog` 钩子的插件也是如此。为了防止这种情况，另外使用 [`logLevel`](../configuration-options/index.md#loglevel) 选项或传递 `--logLevel silent`。

### `--stdin=ext` {#stdinext}

在从 stdin 读取内容时指定虚拟文件扩展名。默认情况下，Rollup 将使用虚拟文件名 `-`，没有扩展名，用于从 stdin 读取的内容。但是，一些插件依赖于文件扩展名来确定是否处理文件。另请参见[从 stdin 读取文件](#reading-a-file-from-stdin)。

### `--no-stdin` {#no-stdin}

不要从 `stdin` 读取文件。设置此标志将防止将内容传输到 Rollup 并确保 Rollup 将 `-` 和 `-.[ext]` 解释为常规文件名，而不是将其解释为 `stdin` 的名称。另请参见[从 stdin 读取文件](#reading-a-file-from-stdin)。

### `-v`/`--version` {#v-version}

打印已安装的版本号。

### `--waitForBundleInput` {#waitforbundleinput}

如果入口点文件中有一个文件不可用，这不会引发错误。相反，在开始构建之前，它将等待所有文件都存在。这在监视模式下特别有用，当 Rollup 正在使用另一个进程的输出时。

### `-w`/`--watch` {#w-watch}

当其源文件在磁盘上发生更改时重新打包。

_注意：在观察模式下，Rollup 的命令行界面将设置 `ROLLUP_WATCH` 环境变量为 `"true"`，其他进程可以进行检查。插件应该检查 [`this.meta.watchMode`](../plugin-development/index.md#this-meta)，它独立于命令行界面。_

### `--watch.onStart <cmd>`，`--watch.onBundleStart <cmd>`，`--watch.onBundleEnd <cmd>`，`--watch.onEnd <cmd>`，`--watch.onError <cmd>` {#watchonstart-cmd-watchonbundlestart-cmd-watchonbundleend-cmd-watchonend-cmd-watchonerror-cmd}

在监视模式下，为监视事件代码运行一个 shell 命令 `<cmd>`。另请参见 [rollup.watch](../javascript-api/index.md#rollup-watch)。

```shell
rollup -c --watch --watch.onEnd="node ./afterBuildScript.js"
```

## 从标准输入读取文件 {#reading-a-file-from-stdin}

当使用命令行界面时，Rollup 也可以从标准输入中读取内容：

```shell
echo "export const foo = 42;" | rollup --format cjs --file out.js
```

当该文件包含导入时，Rollup 将尝试相对于当前工作目录解析它们。当使用配置文件时，只有当入口点的文件名为 `-` 时，Rollup 才会使用 `stdin` 作为入口点。要从 stdin 读取非入口点文件，只需将其命名为 `-`，这是用于引用 `stdin` 的内部文件名。例如：

```js
import foo from '-';
```

在任何文件中，都可以提示 Rollup 尝试从 `stdin` 读取导入的文件，并将默认导出分配给 `foo`。你可以向 Rollup 传递 [`--no-stdin`](#no-stdin) CLI 标志，将 `-` 视为常规文件名。

由于某些插件依赖于文件扩展名来处理文件，你可以通过 `--stdin=ext` 指定 stdin 的文件扩展名，其中 `ext` 是所需的扩展名。在这种情况下，虚拟文件名将为 `-.ext`：

```shell
echo '{"foo": 42, "bar": "ok"}' | rollup --stdin=json -p json
```

JavaScript API 总是将 `-` 和 `-.ext` 视为常规文件名。
