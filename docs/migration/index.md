---
<<<<<<< HEAD
title: 迁移到 Rollup 3
=======
title: Migrating to Rollup 4
>>>>>>> e2f947f28ef921568ae03af9b9e868b9e7c712fa
---

# {{ $frontmatter.title }}

[[toc]]

<<<<<<< HEAD
这里列举了一些在迁移 Rollup 3 时可能遇到的重要问题。有关所有破坏性更新的完整列表，我们建议你查阅
=======
This is a list of the most important topics you may encounter when migrating from Rollup 3 to Rollup 4. For a full list of breaking changes, we advise you to consult the

- [Rollup 4 changelog](https://github.com/rollup/rollup/blob/master/CHANGELOG.md#400)

For how to migrate from earlier versions, [see below](#migrating-to-rollup-3).

## Prerequisites

Make sure you run at least Node 18.0.0 and update all your Rollup plugins to their latest versions.

For larger configs, it can make sense to update to `rollup@3.29.4` first, add the [`strictDeprecations`](../configuration-options/index.md#strictdeprecations) option to your config and resolve any errors that pop up. That way you can make sure you do not rely on features that may have been removed in Rollup 4. If you have errors in your plugins, please contact the plugin author.

## General Changes

Rollup now includes native code that is automatically installed (and removed) as an [optional npm dependency](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#optionaldependencies) if your platform and architecture is supported. More precisely, Rollup has a list of `optionalDependencies`, each of which only install on a specific [`os`](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#os) and [`cpu`](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#cpu). If your system is not supported, you will receive an error message when starting Rollup that will tell you about your platform and architecture and gives you a list of supported ones. In that case, you can instead use `@rollup/wasm-node` as a platform-independent drop-in replacement.

Otherwise, an obvious change is that Rollup now uses url-safe base64 hashes in file names instead of the older base16 hashes. This provides more hash safety but means that hash length is now limited to at most 22 characters for technical reasons.

When bundling CLI apps, Rollup will now automatically preserve shebang comments in entry files if the output [`format`](../configuration-options/index.md#output-format) is `es` or `cjs`. Previously, you would have needed to add the comment via a plugin.

Last, you may see some new warnings about invalid annotation positions. Rollup will now warn if it finds a [`@__PURE__`](../configuration-options/index.md#pure) or [`@__NO_SIDE_EFFECTS__`](../configuration-options/index.md#no-side-effects) comment that it cannot interpret as it is in an invalid location. These warnings are meant to help debugging. To silence them, the [`--filter-logs`](../command-line-interface/index.md#filterlogs-filter) CLI option can help you.

## Configuration Changes

While some options that were already deprecated in Rollup 3 have been removed, the only major change here is that we no longer have the `acorn` and `acornInjectPlugin` options available. This means, unfortunately, that you can no longer add plugins for unsupported syntax. Depending on demand, we consider supporting JSX syntax again as the SWC parser would support that.

## Changes to the Plugin API

An important change is that [`this.resolve()`](../plugin-development/index.md#this-resolve) will now by default add `skipSelf: true`. That means when calling `this.resolve()` from a [`resolveId`](../plugin-development/index.md#resolveid) hook, this hook will not be called again by this or further nested `this.resolve()` calls from other plugins unless they use a different `source` or `importer`. We found that this is a reasonable default for most plugins that prevents unintended infinite loops. To get the old behaviour, you can manually add `skipSelf: false`.

Another important change is that Rollup watch mode will no longer watch ids of files that have been loaded via a plugin [`load`](../plugin-development/index.md#load) hook. So this mainly affects "virtual" files, where it really does not make sense to watch a hard drive location for changes. Instead, it is now up to plugins that use a `load` hook to manually call [`this.addWatchFile()`](../plugin-development/index.md#this-addwatchfile) for all the files they depend on to handle the `load` hook.

If your plugin handles import assertions, note that in the [`resolveId`](../plugin-development/index.md#resolveid) hook and other places, `assertions` have been replaced with `attributes` as the JavaScript feature was also renamed. Also, the abstract syntax tree representation of import attributes now follows the [ESTree spec](https://github.com/estree/estree/blob/7a0c8fb02a33a69fa16dbe3ca35beeaa8f58f1e3/experimental/import-attributes.md) again.

If you want to emit warnings from your plugin, you can no longer call `options.onwarn()` in the [`buildStart`](../plugin-development/index.md#buildstart) hook. Instead, either use [`this.warn()`](../plugin-development/index.md#load) or [`options.onLog()`](../configuration-options/index.md#onlog).

## Migrating to Rollup 3

This is a list of the most important topics you may encounter when migrating from Rollup 2 to Rollup 3. For a full list of breaking changes, we advise you to consult the
>>>>>>> e2f947f28ef921568ae03af9b9e868b9e7c712fa

- [Rollup 3 更新日志](https://github.com/rollup/rollup/blob/master/CHANGELOG.md#300)

从 Rollup 1 或更早版本迁移时，请参阅

- [Rollup 2 更新日志](https://github.com/rollup/rollup/blob/master/CHANGELOG.md#200)
- [Rollup 1 更新日志](https://github.com/rollup/rollup/blob/master/CHANGELOG.md#100)

<<<<<<< HEAD
## 前置要求 {#prerequisites}
=======
### Prerequisites
>>>>>>> e2f947f28ef921568ae03af9b9e868b9e7c712fa

请确保你的 Node 版本至少为 14.18.0，并更新所有 Rollup 插件到最新版本。

对于较大的配置，请首先更新到 `rollup@2.79.1` ，将 [`strictDeprecations`](../configuration-options/index.md#strictdeprecations) 选项添加到你的配置中，并解决弹出的所有错误。这样，你可以确保你不依赖可能在 Rollup 3 中被删除的功能。如果你的插件有错误，请联系插件作者。

<<<<<<< HEAD
## 配置文件使用 {#using-configuration-files}
=======
### Using Configuration Files
>>>>>>> e2f947f28ef921568ae03af9b9e868b9e7c712fa

如果你是使用 ES 模块作为配置文件，即使用 `import` 和 `export` 语法，那么你需要确保 Node 能够以 ES 模块形式加载你的配置。

最简单的方法是将文件扩展名更改为 `.mjs`，详情请参阅 [配置文件](../command-line-interface/index.md#configuration-files)。

当你使用 Node ES 模块时，有一些额外的注意事项，最重要的是

- 你不能直接地导入你的 `package.json` 文件
- 你不能使用 `__dirname` 来获取当前目录

参阅 [使用原生 Node ES 模块时的注意事项](../command-line-interface/index.md#caveats-when-using-native-node-es-modules) 将为你提供一些处理这些问题的替代方法。

或者你可以传递 [`--bundleConfigAsCjs`](../command-line-interface/index.md#bundleconfigascjs) 选项来强制使用旧的加载行为。

如果你使用了 [`--configPlugin`](../command-line-interface/index.md#configplugin-plugin) 选项，Rollup 将在运行配置文件之前将其作为 ES 模块进行打包，而不是 CommonJS。这允许你可以轻松地从你的配置文件中导入 ES 模块，但是有一些与使用原生 ES 模块相同的问题，例如 `__dirname` 将不再起作用。同样，你可以传递 [`--bundleConfigAsCjs`](../command-line-interface/index.md#bundleconfigascjs) 选项来强制使用旧的加载行为。

<<<<<<< HEAD
## 默认值更改 {#changed-defaults}
=======
### Changed Defaults
>>>>>>> e2f947f28ef921568ae03af9b9e868b9e7c712fa

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

<<<<<<< HEAD
## 其他选项更改 {#more-changed-options}
=======
### More Changed Options
>>>>>>> e2f947f28ef921568ae03af9b9e868b9e7c712fa

- [`output.banner/footer`](../configuration-options/index.md#output-banner-output-footer)[`/intro/outro`](../configuration-options/index.md#output-intro-output-outro) 现在按块调用，因此不应该执行任何严重影响性能的操作。
- [`entryFileNames`](../configuration-options/index.md#output-entryfilenames) 和 [`chunkFileNames`](../configuration-options/index.md#output-chunkfilenames) 函数不再通过 `modules` 访问呈现的模块信息，而只能访问包含的 `moduleIds `列表。
- 当使用 [`output.preserveModules`](../configuration-options/index.md#output-preservemodules) 和 `entryFileNames`, 你不能再使用 `[ext]`, `[extName]` 和 `[assetExtName]` 文件名占位符. 此外，模块的路径不再自动添加到文件名前缀，而是包含在 `[name]` 占位符中。

<<<<<<< HEAD
## 从 CommonJS 输出中的动态导入 {#dynamic-import-in-commonjs-output}
=======
### Dynamic Import in CommonJS Output
>>>>>>> e2f947f28ef921568ae03af9b9e868b9e7c712fa

默认情况下，当使用 `cjs` 作为输出时，Rollup 现在会将任何外部的（即非打包的）动态导入作为输出中的 `import(…)` 表达式。在 Node 14 及以上的所有版本中都支持从生成的 CommonJS 输出中加载 CommonJS 和 ES 模块。如果你需要支持旧的 Node 版本，你可以传递参数 [`output.dynamicImportInCjs: false`](../configuration-options/index.md#output-dynamicimportincjs)。

<<<<<<< HEAD
## 插件 API 更改 {#changes-to-the-plugin-api}
=======
### Changes to the Plugin API
>>>>>>> e2f947f28ef921568ae03af9b9e868b9e7c712fa

重新设计了通用的输出生成流程，参阅 [输出生成钩子](../plugin-development/index.md#output-generation-hooks) 图表以获取新的插件钩子顺序。最明显的变化可能是 [`banner`](../plugin-development/index.md#banner)/[`footer`](../plugin-development/index.md#footer)/[`intro`](../plugin-development/index.md#intro)/[`outro`](../plugin-development/index.md#outro) 不再在开头调用一次，而是按块调用。另一方面，当创建哈希时，[`augmentChunkHash`](../plugin-development/index.md#augmentchunkhash) 现在在 [`renderChunk`](../plugin-development/index.md#renderchunk) 之后执行。

由于文件哈希现在基于 `renderChunk` 之后文件的实际内容，因此在生成哈希之前我们不再知道确切的文件名。相反，运行逻辑现在依赖于形式为 `!~{001}~` 的哈希占位符。这意味着在 `renderChunk` 钩子可用的所有文件名都可能包含占位符，并且可能不对应于最终的文件名。但如果你计划在块内使用这些文件名，Rollup 将在 [`generateBundle`](../plugin-development/index.md#generatebundle) 运行之前替换所有占位符。

这不一定是一个破坏性的更新，但在 [`renderChunk`](../plugin-development/index.md#renderchunk) 中添加或删除导入的插件应该确保它们也更新传递给此钩子的相应 `chunk` 信息。这将使其他插件能够依赖于准确的块信息，而无需自己解析。有关 `renderChunk` 钩子的更多信息，请参阅 [相关内容的文档](../plugin-development/index.md#renderchunk)。
