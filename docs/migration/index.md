---
title: 迁移到 Rollup 3
---

# {{ $frontmatter.title }}

[[toc]]

这里列举了一些在迁移 Rollup 3 时可能遇到的重要问题。有关所有破坏性更新的完整列表，我们建议你查阅

- [Rollup 3 更新日志](https://github.com/rollup/rollup/blob/master/CHANGELOG.md#300)

从 Rollup 1 或更早版本迁移时，请参阅

- [Rollup 2 更新日志](https://github.com/rollup/rollup/blob/master/CHANGELOG.md#200)
- [Rollup 1 更新日志](https://github.com/rollup/rollup/blob/master/CHANGELOG.md#100)

## 前置要求

请确保你的 Node 版本至少为 14.18.0，并更新所有 Rollup 插件到最新版本。

对于较大的配置，请首先更新到 `rollup@2.79.1` ，将[`strictDeprecations`](../configuration-options/index.md#strictdeprecations) 选项添加到你的配置中，并解决弹出的所有错误。这样，你可以确保你不依赖可能在 Rollup 3 中被删除的功能。如果你的插件有错误，请联系插件作者。

## 配置文件使用

如果你使用的是将 ES 模块作为配置文件，即使用 `import` 和 `export` 语法，那么你需要确保 Node 会加载你的配置作为 ES 模块。

最简单的方法是将文件扩展名更改为 `.mjs`，详情请参阅 [配置文件](../command-line-interface/index.md#configuration-files)。

当你使用 Node ES 模块时，有一些额外的注意事项，最重要的是

- 你不能直接地导入你的 `package.json` 文件
- 你不能使用 `__dirname` 来获取当前目录

参阅 [使用原生 Node ES 模块时的陷阱](../command-line-interface/index.md#caveats-when-using-native-node-es-modules) 将为你提供一些处理这些问题的替代方法。

或者你可以传递 [`--bundleConfigAsCjs`](../command-line-interface/index.md#bundleconfigascjs) 选项来强制使用旧的加载行为。

如果你使用了 [`--configPlugin`](../command-line-interface/index.md#configplugin-plugin) 选项，Rollup 将在运行配置文件之前将其作为 ES 模块进行打包，而不是 CommonJS。这允许你可以轻松地从你的配置文件中导入 ES 模块，但是有一些与使用原生 ES 模块相同的问题，例如 `__dirname` 将不再起作用。同样，你可以传递 [`--bundleConfigAsCjs`](../command-line-interface/index.md#bundleconfigascjs) 选项来强制使用旧的加载行为。

## 默认值更改

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

## 其他选项更改

- [`output.banner/footer`](../configuration-options/index.md#output-banner-output-footer)[`/intro/outro`](../configuration-options/index.md#output-intro-output-outro) 现在按块调用，因此不应该执行任何性能繁琐的操作。
- [`entryFileNames`](../configuration-options/index.md#output-entryfilenames) 和 [`chunkFileNames`](../configuration-options/index.md#output-chunkfilenames) 函数不再通过 `modules` 访问呈现的模块信息，而只能访问包含的 `moduleIds `列表。
- 当使用 [`output.preserveModules`](../configuration-options/index.md#output-preservemodules) 和 `entryFileNames`, 你不能再使用 `[ext]`, `[extName]` 和 `[assetExtName]` 文件名占位符. 此外，模块的路径不再自动添加到文件名前缀，而是包含在 `[name]` 占位符中。

## 从 CommonJS 输出中的动态导入

默认情况下，当使用 `cjs` 作为输出时， Rollup 现在会将任何外部的（即非打包的）动态导入作为输出中的 `import(…)` 表达式。在 Node 14 及以上的所有版本中都支持从生成的 CommonJS 输出中加载 CommonJS 和 ES 模块。如果你需要支持旧的 Node 版本，你可以传递参数[`output.dynamicImportInCjs: false`](../configuration-options/index.md#output-dynamicimportincjs)。

## 插件 API 更改

重新设计了通用的输出生成流程，参阅[输出生成钩子](../plugin-development/index.md#output-generation-hooks)图表以获取新的插件钩子顺序。最明显的变化可能是[`banner`](../plugin-development/index.md#banner)/[`footer`](../plugin-development/index.md#footer)/[`intro`](../plugin-development/index.md#intro)/[`outro`](../plugin-development/index.md#outro) 不再在开头调用一次，而是按块调用。另一方面，当创建哈希时，[`augmentChunkHash`](../plugin-development/index.md#augmentchunkhash) 现在在 [`renderChunk`](../plugin-development/index.md#renderchunk) 之后执行。

由于文件哈希现在基于 `renderChunk` 之后文件的实际内容，因此在生成哈希之前我们不再知道确切的文件名。相反，运行逻辑现在依赖于形式为 `!~{001}~` 的哈希占位符。这意味着在 `renderChunk` 钩子可用的所有文件名都可能包含占位符，并且可能不对应于最终的文件名。但如果你计划在块内使用这些文件名，Rollup 将在[`generateBundle`](../plugin-development/index.md#generatebundle)运行之前替换所有占位符。

这不一定是一个破坏性的更新，但在 [`renderChunk`](../plugin-development/index.md#renderchunk) 中添加或删除导入的插件应该确保它们也更新传递给此钩子的相应 `chunk` 信息。这将使其他插件能够依赖于准确的块信息，而无需自己解析。有关 `renderChunk` 钩子的更多信息，请参阅[文档](../plugin-development/index.md#renderchunk)。
