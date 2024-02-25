---
title: JavaScript API
---

# {{ $frontmatter.title }}

[[toc]]

Rollup 提供了一个可从 Node.js 使用的 JavaScript API。你很少需要使用它，除非你正在扩展 Rollup 本身或者需要编程式地打包等特殊用途，否则应该使用命令行 API。

## rollup.rollup {#rollup-rollup}

`rollup.rollup` 函数接收一个输入选项对象作为参数，并返回一个 Promise，该 Promise 解析为一个 `bundle` 对象，该对象具有下列各种属性和方法。在此步骤中，Rollup 将构建模块图并执行除屑优化，但不会生成任何输出。

在 `bundle` 对象上，你可以多次调用 `bundle.generate` 并使用不同的输出选项对象来生成不同的产物到内存中。如果你想直接将它们写入磁盘，请使用 `bundle.write`。

完成 `bundle` 对象后，应调用 `bundle.close()`，这将通过 [`closeBundle`](../plugin-development/index.md#closebundle) 钩子让插件清理它们的外部进程或服务。

如果任一阶段发生错误，它将返回一个 Promise，该 Promise 被 reject 得到一个 Error，你可以通过它们的 `code` 属性来识别。除了 `code` 和 `message`，许多错误还有其他属性，你可以用于自定义报告，见 [`utils/logs.ts`](https://github.com/rollup/rollup/blob/master/src/utils/logs.ts) 以获取完整的错误和日志列表，以及它们的代码和属性。

```javascript
import { rollup } from 'rollup';

// 请继续浏览下面的内容获取更多关于这个选项的细节
const inputOptions = {...};

// 你可以从相同的输入创建多个输出，
// 以生成例如 CommonJS 和 ESM 这样的不同格式
const outputOptionsList = [{...}, {...}];

build();

async function build() {
  let bundle;
  let buildFailed = false;
  try {
    // 启动一次打包
    bundle = await rollup(inputOptions);

    // 一个文件名数组，表示此产物所依赖的文件
    console.log(bundle.watchFiles);

    await generateOutputs(bundle);
  } catch (error) {
    buildFailed = true;
    // 进行一些错误报告
    console.error(error);
  }
  if (bundle) {
    // 关闭打包过程
    await bundle.close();
  }
  process.exit(buildFailed ? 1 : 0);
}

async function generateOutputs(bundle) {
  for (const outputOptions of outputOptionsList) {
    // 生成特定于输出的内存中代码
    // 你可以在同一个 bundle 对象上多次调用此函数
    // 使用 bundle.write 代替 bundle.generate 直接写入磁盘
    const { output } = await bundle.generate(outputOptions);

    for (const chunkOrAsset of output) {
      if (chunkOrAsset.type === 'asset') {
        // 对于资源文件，它包含：
        // {
        //   fileName: string,              // 资源文件名
        //   source: string | Uint8Array    // 资源文件内容
        //   type: 'asset'                  // 标志它是一个资源文件
        // }
        console.log('Asset', chunkOrAsset);
      } else {
        // 对于 chunk，它包含以下内容：
        // {
        //   code: string,                  // 生成的 JS 代码
        //   dynamicImports: string[],      // 此 chunk 动态导入的外部模块
        //   exports: string[],             // 导出的变量名
        //   facadeModuleId: string | null, // 与此 chunk 对应的模块的 ID
        //   fileName: string,              // chunk 文件名
        //   implicitlyLoadedBefore: string[]; // 仅在此 chunk 后加载的条目
        //   imports: string[],             // 此 chunk 静态导入的外部模块
        //   importedBindings: {[imported: string]: string[]} // 每个依赖项的导入绑定
        //   isDynamicEntry: boolean,       // 此 chunk 是否为动态入口点
        //   isEntry: boolean,              // 此 chunk 是否为静态入口点
        //   isImplicitEntry: boolean,      // 是否应在其他 chunk 之后仅加载此 chunk
        //   map: string | null,            // 如果存在，则为源映射
        //   modules: {                     // 此 chunk 中模块的信息
        //     [id: string]: {
        //       renderedExports: string[]; // 包含的导出变量名
        //       removedExports: string[];  // 已删除的导出变量名
        //       renderedLength: number;    // 此模块中剩余代码的长度
        //       originalLength: number;    // 此模块中代码的原始长度
        //       code: string | null;       // 此模块中的剩余代码
        //     };
        //   },
        //   name: string                   // 用于命名模式的此 chunk 的名称
		//   preliminaryFileName: string    // 此 chunk 带有哈希占位符的初始文件名
        //   referencedFiles: string[]      // 通过 import.meta.ROLLUP_FILE_URL_<id> 引用的文件
        //   type: 'chunk',                 // 表示这是一个 chunk
        // }
        console.log('Chunk', chunkOrAsset.modules);
      }
    }
  }
}
```

### inputOptions 对象 {#inputoptions-object}

`inputOptions` 对象可以包含以下属性（有关详细信息，请参见 [选项大全](../configuration-options/index.md)）：

```js
const inputOptions = {
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
	perf
};
```

### outputOptions 对象 {#outputoptions-object}

`outputOptions` 对象可以包含以下属性（有关详细信息，请参见 [选项大全](../configuration-options/index.md)）：

```js
const outputOptions = {
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
	hoistTransitiveImports,
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

	// experimental
	experimentalMinChunkSize
};
```

## rollup.watch {#rollup-watch}

Rollup 还提供了一个 `rollup.watch` 函数，当检测到磁盘上的某个模块已更改时，它将重新打包。当你在命令行中使用 `--watch` 标志运行 Rollup 时，它会在内部使用。请注意，当通过 JavaScript API 使用观察模式时，你需要在响应 `BUNDLE_END` 事件时调用 `event.result.close()`，以允许插件在 [`closeBundle`](../plugin-development/index.md#closebundle) 钩子中清理资源，见下文。

```js
const rollup = require('rollup');

const watchOptions = {...};
const watcher = rollup.watch(watchOptions);

watcher.on('event', event => {
  // event.code 可以是以下之一：
  //   START        - 监视器正在（重新）启动
  //   BUNDLE_START - 单次打包
  //                  * 如果存在，event.input 将是输入选项对象
  //                  * event.output 包含生成的输出的 "file"
  //                      或 "dir" 选项值的数组
  //   BUNDLE_END   - 完成打包
  //                  * 如果存在，event.input 将是输入选项对象
  //                  * event.output 包含生成的输出的 "file"
  //                      或 "dir" 选项值的数组
  //                  * event.duration 是构建持续时间（以毫秒为单位）
  //                  * event.result 包含 bundle 对象，
  //                      可以通过调用 bundle.generate
  //                      或 bundle.write 来生成其他输出。
  //                      当使用 watch.skipWrite 选项时，这尤其重要。
  //                  生成输出后，你应该调用 "event.result.close()"，
  //                  或者如果你不生成输出，也应该调用。
  //                  这将允许插件通过
  //                  "closeBundle" 钩子清理资源。
  //   END          - 完成所有产物的构建
  //   ERROR        - 在打包时遇到错误
  //                  * event.error 包含抛出的错误
  //                  * 对于构建错误，event.result 为 null，
  //                      对于输出生成错误，它包含 bundle 对象。
  //                      与 "BUNDLE_END" 一样，如果存在，
  //                      你应该在完成后调用 "event.result.close()"。
  // 如果从事件处理程序返回一个 Promise，则 Rollup
  // 将等待 Promise 解析后再继续。
});

// 这将确保在每次运行后正确关闭打包
watcher.on('event', ({ result }) => {
  if (result) {
  	result.close();
  }
});

// 此外，你可以挂钩以下内容。
// 同样，返回 Promise 以使 Rollup 在该阶段等待：
watcher.on('change', (id, { event }) => { /* 更改了一个文件 */ })
watcher.on('restart', () => { /* 新触发了一次运行 */ })
watcher.on('close', () => { /* 监视器被关闭了，请看下面的代码 */ })

// 停止监听
watcher.close();
```

### watchOptions {#watchoptions}

`watchOptions` 参数是一个配置（或配置数组），你可以从配置文件中导出它。

```js
const watchOptions = {
	...inputOptions,
	output: [outputOptions],
	watch: {
		buildDelay,
		chokidar,
		clearScreen,
		skipWrite,
		exclude,
		include
	}
};
```

有关 `inputOptions` 和 `outputOptions` 的详细信息，请参见上文，或者查阅 [选项大全](../configuration-options/index.md) 以获取有关 `chokidar`、`include` 和 `exclude` 的信息。

## 以编程方式加载配置文件 {#programmatically-loading-a-config-file}

rollup 通过一个单独的入口点公开了它用来在命令行界面中加载配置文件的工具函数，为加载配置提供帮助，此工具函数接收一个解析过的 `fileName` （文件路径）和可选的包含命令行参数的对象：

```js
const { loadConfigFile } = require('rollup/loadConfigFile');
const path = require('node:path');
const rollup = require('rollup');

// 加载位于当前脚本旁边的配置文件；
// 提供的配置对象具有与在命令行上传递 "--format es" 相同的效果，
// 并将覆盖所有输出的格式
loadConfigFile(path.resolve(__dirname, 'rollup.config.js'), {
	format: 'es'
}).then(async ({ options, warnings }) => {
	// "warnings" 包装了 CLI 传递的默认 `onwarn` 处理程序。
	// 这将打印到此为止所有的警告：
	console.log(`We currently have ${warnings.count} warnings`);

	// 这将打印所有延迟的警告
	warnings.flush();

	// options 是一个包含额外 "output" 属性的 "inputOptions" 对象数组，
	// 该属性包含一个 "outputOptions" 数组。
	// 以下将为所有输入生成所有输出，
	// 并以与 CLI 相同的方式将它们写入磁盘：
	for (const optionsObj of options) {
		const bundle = await rollup.rollup(optionsObj);
		await Promise.all(optionsObj.output.map(bundle.write));
	}

	// 你也可以直接将选项传给 "rollup.watch"
	rollup.watch(options);
});
```

## 应用高级日志过滤器 {#applying-advanced-log-filters}

虽然命令行界面提供了通过 [`--filterLogs`](../command-line-interface/index.md#filterlogs-filter) 标志对日志进行强大过滤的方式，但在使用 JavaScript API 时，直接使用此功能是不可用的。然而，Rollup 提供了一个辅助函数 `getLogFilter`，可以使用与 CLI 相同的语法生成过滤器。这在指定自定义的 `onLog` 处理方法以及希望为第三方系统提供与 Rollup CLI 类似的过滤功能体验时非常有用。该函数接受一个字符串数组作为参数。需要注意的是，它不会像 CLI 那样拆分以逗号分隔的过滤器列表。

```js
// rollup.config.mjs
import { getLogFilter } from 'rollup/getLogFilter';

const logFilter = getLogFilter(['code:FOO', 'code:BAR']);

export default {
	input: 'main.js',
	output: { format: 'es' },
	onLog(level, log, handler) {
		if (logFilter(log)) {
			handler(level, log);
		}
	}
};
```

## 访问解析器 {#accessing-the-parser}

为了使用 Rollup 的解析器解析任意代码，插件可以使用 [`this.parse`](../plugin-development/index.md#this-parse) 。为了在 Rollup 构建的上下文之外使用这个功能，解析器也作为一个单独的导出项暴露出来。它的签名与 `this.parse` 相同：

```js
import { parseAst } from 'rollup/parseAst';
import assert from 'node:assert';

assert.deepEqual(
	parseAst('return 42;', { allowReturnOutsideFunction: true }),
	{
		type: 'Program',
		start: 0,
		end: 10,
		body: [
			{
				type: 'ReturnStatement',
				start: 0,
				end: 10,
				argument: {
					type: 'Literal',
					start: 7,
					end: 9,
					raw: '42',
					value: 42
				}
			}
		],
		sourceType: 'module'
	}
);
```

在 Rollup 的非 wasm 版本中，还有一个异步版本在不同的线程中进行解析：

```js
import { parseAstAsync } from 'rollup/parseAst';
import assert from 'node:assert';

assert.deepEqual(
	await parseAstAsync('return 42;', { allowReturnOutsideFunction: true }),
	{
		type: 'Program',
		start: 0,
		end: 10,
		body: [
			{
				type: 'ReturnStatement',
				start: 0,
				end: 10,
				argument: {
					type: 'Literal',
					start: 7,
					end: 9,
					raw: '42',
					value: 42
				}
			}
		],
		sourceType: 'module'
	}
);
```
