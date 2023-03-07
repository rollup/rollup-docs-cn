---
title: 故障排除
---

# {{ $frontmatter.title }}

[[toc]]

如果您遇到困难，请尝试在 [Rollup Discord](https://is.gd/rollup_chat) 上讨论该问题或将问题发布到 [Stackoverflow](https://stackoverflow.com/questions/tagged/rollupjs). 如果您发现了 bug， 或者 Rollup 不能满足你的需求， 可以尝试提 [issue](https://github.com/rollup/rollup/issues)。最后，您可以尝试在 Twitter 上联系 [@RollupJS](https://twitter.com/RollupJS) 。

## 避免使用 `eval` {#avoiding-eval}

您可能已经了解到在某些人看来“`eval` 是邪恶的”。但它对 Rollup 尤其有害，因为它的工作方式——不像其他将每个模块包装在函数中的模块打包器，Rollup 将所有代码放在同一个作用域内。

虽然这样效率更高，但这意味着在您使用 eval 时共享作用域将被“污染”，而使用其他打包器时，未使用 eval 的模块不会被污染。压缩工具不能破坏污染代码中的变量名，因为它不能保证要评估的代码不引用这些变量名。

此外，**它还会带来安全风险**，因为恶意模块可能通过 `eval('SUPER_SEKRIT')` 访问另一个模块的私有变量。

幸运的是，除非你真的希望被执行的代码能够访问局部变量（这种情况下，你应该是错了什么！），否则可以通过以下两种方式实现相同的效果：

### eval2 = eval {#eval2-eval}

简单地“复制” `eval`，你的确可以得到一个可以完成相同事情的函数，但是它运行在全局作用域而不是局部作用域：

```js
var eval2 = eval;

(function () {
	var foo = 42;
	eval('console.log("with eval:",foo)'); // 打印 'with eval: 42'
	eval2('console.log("with eval2:",foo)'); // 抛出 ReferenceError
})();
```

### `new Function` {#new-function}

使用 [Function 构造函数](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function) 可以根据提供的字符串生成一个函数。同样，它运行在全局作用域中。如果需要重复调用函数，这要比使用`eval`快得多得多。

## 除屑优化（Tree-Shaking）似乎不能正常工作 {#tree-shaking-does-not-seem-to-be-working}

有时，你会在打包文件中发现一些看起来不应该存在的代码。例如，如果你从 `lodash-es` 导入一个实用函数，你可能希望得到该实用函数工作所需的最低限度的代码。

但是 Rollup 必须对它删除的代码保持保守，以确保最终结果将正确运行。如果导入的模块有副作用，无论是对你正在使用的模块中的某些部分还是对全局环境，Rollup 都会平安无事地处理这些副作用。

因为在像 JavaScript 这样的动态语言中进行静态分析是困难的，所以偶尔会有误报。Lodash 就是一个很好的例子，它看起来有很多副作用，即使在没有副作用的地方。你通常可以通过导入子模块（例如:`import map from 'lodash-es/map'`而不是`import {map} from 'lodash-es'`）。

Rollup 的静态分析将随着时间的推移而改进，但它永远不会在所有情况下都是完美的——这就是 JavaScript。

## Error: "[name] is not exported by [module]" {#error-name-is-not-exported-by-module}

偶尔你会看见这样一条错误信息：

> 'foo' is not exported by bar.js (imported by baz.js)

导入声明必须在被导入的模块中有相应的导出声明。例如，如果你在一个模块中有 `import a from './a.js'`，而 a.js 没有 `export default` 声明，或者 `import {foo} from './b.js'`，而 b.js 没有导出 `foo`，那么 Rollup 就不能打包这些代码。

此错误经常发生在由 [rollup-plugin-commonjs](https://github.com/rollup/rollup-plugin-commonjs) 转换的 CommonJS 模块中，此包已被弃用，且不再维护，请使用 [@rollup/plugin-commonjs](https://github.com/rollup/plugins/tree/master/packages/commonjs#custom-named-exports)。

## Error: "this is undefined" {#error-this-is-undefined}

在 JavaScript 模块中，`this` 在顶层（即函数外部）是 `undefined`。因此，Rollup 将重写任何对 `undefined` 的 `this` 引用，以便产生的行为与原生支持模块时发生的行为相匹配。

偶尔也有正当的理由让 `this` 有别的意思。如果你在你的包中遇到错误，你可以使用 `options.context` 和 `options.moduleContext` 来改变这种行为。

## Warning: "Sourcemap is likely to be incorrect" {#warning-sourcemap-is-likely-to-be-incorrect}

如果你为你的包（`sourcemap: true`或`sourcemap: 'inline'`）生成了一个 sourcemap，但你使用了一个或多个转换代码的插件，而没有生成转换所需的 sourcemap，你会看到这个警告。

通常，只有当插件（而不是打包器）配置了 `sourcemap: false` 时，插件才会省略 sourcemap——所以你所需要做的就是更改它。如果插件没有生成 sourcemap，请考虑向插件作者提出问题。

## Warning: "Treating [module] as external dependency" {#warning-treating-module-as-external-dependency}

默认情况下，Rollup 只解析相对模块。这意味着像这样的 import 语句

```js
import moment from 'moment';
```

不会导致 `moment` 被打包到你的包中——相反，它将是运行时需要的外部依赖项。如果这就是你想要的，你可以用 `external` 选项消除这个警告，这会让你的意图更加明确:

```js
// rollup.config.js
export default {
	entry: 'src/index.js',
	dest: 'bundle.js',
	format: 'cjs',
	external: ['moment'] // <-- 消除这个警告
};
```

如果你确实想在打包后的代码中包含这个模块，需要告诉 Rollup 如何找到它。大多数情况下，你可以使用 [@rollup/plugin-node-resolve](https://github.com/rollup/plugins/tree/master/packages/node-resolve)

有些模块，如 `events` 或 `util`，是内置在 Node.js 中的。如果你想要包含它们（例如，让你的包在浏览器中运行），你可能需要使用 [rollup-plugin-polyfill-node](https://github.com/FredKSchott/rollup-plugin-polyfill-node)

## Error: "EMFILE: too many open files" {#error-emfile-too-many-open-files}

对于大型项目，在 macOS 上以监视模式运行 Rollup 时可能会遇到 EMFILE 错误。如果你遇到这种情况，禁用 FSEvents 可能会消除问题：

```js
// rollup.config.js
export default {
  ...,
  watch: {
    chokidar: {
      useFsEvents: false
    }
  }
};
```

## Error: JavaScript heap out of memory {#error:-javascript-heap-out-of-memory}

由于 Rollup 需要同时将所有模块信息保存在内存中，以便分析除屑优化（Tree-Shaking）的相关副作用，因此打包大型项目可能会达到 Node 的内存限制。如果发生这种情况，你可以通过这种方式运行 Rollup 以提高这个限制

```shell
node --max-old-space-size=8192 node_modules/rollup/dist/bin/rollup -c
```

按需增加 `--max-old-space-size` 。请注意，这个数字可以安全地超过你的可用物理内存。在这种情况下，Node 会根据需要将内存分页到磁盘上。

你可以通过使用动态导入引入代码分割、只导入特定的模块而不是整个依赖、禁用 sourcemap，或者增加交换空间的大小来减少内存压力。

## Error: Node tried to load your configuration file as CommonJS even though it is likely an ES module {#error-node-tried-to-load-your-configuration-file-as-commonjs-even-though-it-is-likely-an-es-module}

默认情况下，Rollup 会使用 Node 原生的模块机制来加载你的 Rollup 配置。这意味着如果你在配置中使用 ES imports 和 exports，你要么需要在 `package. js` 中定义 `"type": "module"`，或者为你的配置文件使用 `.mjs` 后缀。更多信息请参见 [配置文件](../command-line-interface/index.md#configuration-files) 和 [使用原生 Node ES 模块时的注意事项](../command-line-interface/index.md#caveats-when-using-native-node-es-modules)。
