---
title: 迁移到 Rollup 4
---

# {{ $frontmatter.title }}

[[toc]]

这里列举了一些在迁移 Rollup 3 时可能遇到的重要问题。有关所有破坏性更新的完整列表，我们建议你查阅：

- [Rollup 4 changelog](https://github.com/rollup/rollup/blob/master/CHANGELOG.md#400)

从 Rollup 3 或更早版本迁移时，请参阅 [下面的部分](#migrating-to-rollup-3).

## 前提条件 {#prerequisites}

确保你的 Node 版本至少为 18.0.0，并更新所有 Rollup 插件到最新版本。

对于更大的配置，首先更新到 `rollup@3.29.4`，将 [`strictDeprecations`](../configuration-options/index.md#strictdeprecations) 选项添加到你的配置中，并解决弹出的所有错误。这样，你可以确保你不依赖可能在 Rollup 4 中被删除的功能。如果你的插件有错误，请联系插件作者。

## 总体变更 {#general-changes}

Rollup 现在包含了自动安装（和删除）的原生代码，如果你的平台和架构受到支持，它将作为 [可选的 npm 依赖](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#optionaldependencies) 自动安装。更准确地说，Rollup 有一个 `optionalDependencies` 列表，每个列表只安装在特定的 [`os`](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#os) 和 [`cpu`](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#cpu) 上。如果你的系统不受支持，当你启动 Rollup 时，你将收到一个错误消息，该消息将告诉你你的平台和架构，并给出一个支持的列表。在这种情况下，你可以使用 `@rollup/wasm-node` 作为独立的跨平台替代品。

面向浏览器的构建（NPM 上的 `@rollup/browser`）现在依赖于一个需要提供的 WASM 文件。如果你正在使用 Vite 的浏览器构建，你需要将 `"@rollup/browser"` 添加到 `optimizeDeps.exclude` 中，否则 `npm run dev` 将因为 `.wasm` 文件的无效路径而失败（请参阅 [vitejs #14609](https://github.com/vitejs/vite/issues/14609)）。否则，它应该可以正常工作，无需任何特定的干预。

<<<<<<< HEAD
否则，一个明显的变化是 Rollup 现在在文件名中使用 url 安全的 base64 哈希，而不是旧的 base16 哈希。这提供了更多的哈希安全性，但意味着由于技术原因，哈希长度现在最多限制为 22 个字符。
=======
Otherwise, an obvious change is that Rollup now uses url-safe base64 hashes in file names instead of the older base16 hashes. This provides more hash safety but means that hash length is now limited to at most 21 characters for technical reasons.
>>>>>>> 7c0b1f8810013b5a351a976df30a6a5da4fa164b

当打包 CLI 应用程序时，如果输出 [`format`](../configuration-options/index.md#output-format) 为 `es` 或 `cjs`，Rollup 现在将自动保留入口文件中的 shebang 注释。以前，你需要通过插件添加注释。

最后，你可能会看到一些新的关于无效注释位置的警告。如果 Rollup 发现一个 [`@__PURE__`](../configuration-options/index.md#pure) 或 [`@__NO_SIDE_EFFECTS__`](../configuration-options/index.md#no-side-effects) 注释，它无法解释，因为它位于无效的位置，现在将发出警告。这些警告是为了帮助调试。为了消除它们，[`--filter-logs`](../command-line-interface/index.md#filterlogs-filter) CLI 选项可以帮助你。

## 配置变化 {#configuration-changes}

由于一些选项在 Rollup 3 中已经被弃用，因此这里唯一的主要变化是我们不再有 `acorn` 和 `acornInjectPlugin` 选项。这意味着，不幸的是，你不能再为不支持的语法添加插件。根据需求，我们考虑再次支持 JSX 语法，因为 SWC 解析器将支持该语法。

## 插件 API 的变更 {#changes-to-the-plugin-api}

一个重要变更是，[`this.resolve()`](../plugin-development/index.md#this-resolve) 现在默认会添加 `skipSelf: true`。这意味着当从 [`resolveId`](../plugin-development/index.md#resolveid) 钩子调用 `this.resolve()` 时，除非它们使用不同的 `source` 或 `importer`，否则此钩子将不会被此或其他插件的进一步嵌套 `this.resolve()` 调用再次调用。我们发现这对于大多数插件来说是一个合理的默认值，可以防止意外的无限循环。要获得旧的行为，你可以手动添加 `skipSelf: false`。

另一个重要变更是，Rollup 的 watch 模式将不再监视通过插件 [`load`](../plugin-development/index.md#load) 钩子加载的文件的 id。因此，这主要影响“虚拟”文件，其中监视硬盘位置的更改确实没有意义。相反，现在由使用 `load` 钩子的插件手动调用 [`this.addWatchFile()`](../plugin-development/index.md#this-addwatchfile) 来处理 `load` 钩子所依赖的所有文件。

如果你的插件会处理导入断言，请注意在 [`resolveId`](../plugin-development/index.md#resolveid) 钩子和其他地方，`assertions` 已被替换为 `attributes`，因为 JavaScript 功能也被重命名。此外，导入属性的抽象语法树表示现在再次遵循 [ESTree 规范](https://github.com/estree/estree/blob/7a0c8fb02a33a69fa16dbe3ca35beeaa8f58f1e3/experimental/import-attributes)。

如果你想要从你的插件中发出警告，你不能再在 [`buildStart`](../plugin-development/index.md#buildstart) 钩子中调用 `options.onwarn()`。相反，使用 [`this.warn()`](../plugin-development/index.md#load) 或 [`options.onLog()`](../configuration-options/index.md#onlog)。

## 迁移到 Rollup 3 {#migrating-to-rollup-3}

这里是你在从 Rollup 2 迁移到 Rollup 3 时可能遇到的最重要的主题列表。有关所有破坏性更新的完整列表，我们建议你查阅：

- [Rollup 3 更新日志](https://github.com/rollup/rollup/blob/master/CHANGELOG.md#300)

从 Rollup 1 或更早版本迁移时，请参阅

- [Rollup 2 更新日志](https://github.com/rollup/rollup/blob/master/CHANGELOG.md#200)
- [Rollup 1 更新日志](https://github.com/rollup/rollup/blob/master/CHANGELOG.md#100)

## 前置要求 {#prerequisites-v3}

请确保你的 Node 版本至少为 14.18.0，并更新所有 Rollup 插件到最新版本。

对于较大的配置，请首先更新到 `rollup@2.79.1` ，将 [`strictDeprecations`](../configuration-options/index.md#strictdeprecations) 选项添加到你的配置中，并解决弹出的所有错误。这样，你可以确保你不依赖可能在 Rollup 3 中被删除的功能。如果你的插件有错误，请联系插件作者。

## 配置文件使用 {#using-configuration-files}

如果你是使用 ES 模块作为配置文件，即使用 `import` 和 `export` 语法，那么你需要确保 Node 能够以 ES 模块形式加载你的配置。

最简单的方法是将文件扩展名更改为 `.mjs`，详情请参阅 [配置文件](../command-line-interface/index.md#configuration-files)。

当你使用 Node ES 模块时，有一些额外的注意事项，最重要的是

- 你不能直接地导入你的 `package.json` 文件
- 你不能使用 `__dirname` 来获取当前目录

参阅 [使用原生 Node ES 模块时的注意事项](../command-line-interface/index.md#caveats-when-using-native-node-es-modules) 将为你提供一些处理这些问题的替代方法。

或者你可以传递 [`--bundleConfigAsCjs`](../command-line-interface/index.md#bundleconfigascjs) 选项来强制使用旧的加载行为。

如果你使用了 [`--configPlugin`](../command-line-interface/index.md#configplugin-plugin) 选项，Rollup 将在运行配置文件之前将其作为 ES 模块进行打包，而不是 CommonJS。这允许你可以轻松地从你的配置文件中导入 ES 模块，但是有一些与使用原生 ES 模块相同的问题，例如 `__dirname` 将不再起作用。同样，你可以传递 [`--bundleConfigAsCjs`](../command-line-interface/index.md#bundleconfigascjs) 选项来强制使用旧的加载行为。

## 默认值更改 {#changed-defaults}

目前一些选项设置具有不同的默认值，如果你遇到了任何问题，请尝试将以下内容添加到你的配置文件中：

```js
({
	makeAbsoluteExternalsRelative: true,
	preserveEntrySignatures: 'strict',
	output: {
		esModule: true,
		generatedCode: {
			reservedNamesAsProps: false
		},
		interop: 'compat',
		systemNullSetters: false
	}
});
```

总的来说，我们你推荐使用新的默认值，有关每个设置选项的更多详细信息，请参阅相应的文档。

## 其他选项更改 {#more-changed-options}

- [`output.banner/footer`](../configuration-options/index.md#output-banner-output-footer)[`/intro/outro`](../configuration-options/index.md#output-intro-output-outro) 现在按块调用，因此不应该执行任何严重影响性能的操作。
- [`entryFileNames`](../configuration-options/index.md#output-entryfilenames) 和 [`chunkFileNames`](../configuration-options/index.md#output-chunkfilenames) 函数不再通过 `modules` 访问呈现的模块信息，而只能访问包含的 `moduleIds `列表。
- 当使用 [`output.preserveModules`](../configuration-options/index.md#output-preservemodules) 和 `entryFileNames`, 你不能再使用 `[ext]`, `[extName]` 和 `[assetExtName]` 文件名占位符. 此外，模块的路径不再自动添加到文件名前缀，而是包含在 `[name]` 占位符中。

## 从 CommonJS 输出中的动态导入 {#dynamic-import-in-commonjs-output}

默认情况下，当使用 `cjs` 作为输出时，Rollup 现在会将任何外部的（即非打包的）动态导入作为输出中的 `import(…)` 表达式。在 Node 14 及以上的所有版本中都支持从生成的 CommonJS 输出中加载 CommonJS 和 ES 模块。如果你需要支持旧的 Node 版本，你可以传递参数 [`output.dynamicImportInCjs: false`](../configuration-options/index.md#output-dynamicimportincjs)。

## 插件 API 更改 {#changes-to-the-plugin-api-v3}

重新设计了通用的输出生成流程，参阅 [输出生成钩子](../plugin-development/index.md#output-generation-hooks) 图表以获取新的插件钩子顺序。最明显的变化可能是 [`banner`](../plugin-development/index.md#banner)/[`footer`](../plugin-development/index.md#footer)/[`intro`](../plugin-development/index.md#intro)/[`outro`](../plugin-development/index.md#outro) 不再在开头调用一次，而是按块调用。另一方面，当创建哈希时，[`augmentChunkHash`](../plugin-development/index.md#augmentchunkhash) 现在在 [`renderChunk`](../plugin-development/index.md#renderchunk) 之后执行。

由于文件哈希现在基于 `renderChunk` 之后文件的实际内容，因此在生成哈希之前我们不再知道确切的文件名。相反，运行逻辑现在依赖于形式为 `!~{001}~` 的哈希占位符。这意味着在 `renderChunk` 钩子可用的所有文件名都可能包含占位符，并且可能不对应于最终的文件名。但如果你计划在块内使用这些文件名，Rollup 将在 [`generateBundle`](../plugin-development/index.md#generatebundle) 运行之前替换所有占位符。

这不一定是一个破坏性的更新，但在 [`renderChunk`](../plugin-development/index.md#renderchunk) 中添加或删除导入的插件应该确保它们也更新传递给此钩子的相应 `chunk` 信息。这将使其他插件能够依赖于准确的块信息，而无需自己解析。有关 `renderChunk` 钩子的更多信息，请参阅 [相关内容的文档](../plugin-development/index.md#renderchunk)。
