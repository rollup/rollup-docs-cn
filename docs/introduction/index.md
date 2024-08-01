---
title: 简介
---

# {{ $frontmatter.title }}

[[toc]]

## 概括 {#overview}

Rollup 是一个用于 JavaScript 的模块打包工具，它将小的代码片段编译成更大、更复杂的代码，例如库或应用程序。它使用 JavaScript 的 ES6 版本中包含的新标准化代码模块格式，而不是以前的 CommonJS 和 AMD 等特殊解决方案。ES 模块允许你自由无缝地组合你最喜欢的库中最有用的个别函数。这在未来将在所有场景原生支持，但 Rollup 让你今天就可以开始这样做。

## 安装 {#installation}

```shell
npm install --global rollup
```

这将使 Rollup 可以作为全局命令行工具使用。你也可以在本地安装它，请参阅 [在本地安装 Rollup](../tutorial/index.md#installing-rollup-locally)。

## 快速开始 {#quick-start}

可以通过带有可选配置文件的 [命令行界面](../command-line-interface/index.md) 或 [JavaScript API](../javascript-api/index.md) 来使用 Rollup。运行`rollup --help`以查看可用选项和参数。

> 参见 [rollup-starter-lib](https://github.com/rollup/rollup-starter-lib) 和 [rollup-starter-app](https://github.com/rollup/rollup-starter-app)，以查看使用 Rollup 的示例库和应用程序项目。

这些命令假定你的应用程序入口点命名为 `main.js`，并且希望将所有导入编译到一个名为 `bundle.js` 的单个文件中。

::: code-group

```shell [浏览器：]
# 编译为包含自执行函数（'iife'）的 <script>。
$ rollup main.js --file bundle.js --format iife
```

```shell [Node.js：]
# 编译为一个 CommonJS 模块 ('cjs')
$ rollup main.js --file bundle.js --format cjs
```

```shell [浏览器和 Node.js：]
# UMD 格式需要一个包名
$ rollup main.js --file bundle.js --format umd --name "myBundle"
```

:::

## 背景 {#the-why}

将项目分解为较小的独立部分通常可以使软件开发更加容易，因为这通常可以消除意外的交互，并大大减少你需要解决的问题的复杂性，而仅仅是首先编写较小的项目 [并不一定是最好的方式](https://medium.com/@Rich_Harris/small-modules-it-s-not-quite-that-simple-3ca532d65de4)。不幸的是，JavaScript 在历史上并没有将这种能力作为语言的核心特性之一。这在 ES6 版本的 JavaScript 中得到了改变，该版本包括一种语法，用于导入和导出函数和数据，以便它们可以在单独的脚本之间共享。

该规范现在已经稳定，但仅在现代浏览器中实现，并未在 Node.js 中完全落地。Rollup 允许你使用新的模块系统编写代码，然后将其编译回现有的支持格式，例如 CommonJS 模块、AMD 模块和 IIFE 样式脚本。这意味着你可以编写 _对未来兼容_ 的代码，并且还可以获得以下几点收益……

## 除屑优化（Tree-Shaking） {#tree-shaking}

除了可以使用 ES 模块之外，Rollup 还可以静态分析你导入的代码，并将排除任何实际上没有使用的内容。这使你可以在现有的工具和模块的基础上构建，而不需要添加额外的依赖项或使项目的大小变得臃肿。

例如，使用 CommonJS _必须导入整个工具或库_。

```js
// 使用 CommonJS 导入整个 utils 对象
const utils = require('./utils');
const query = 'Rollup';
// 使用 utils 对象的 ajax 方法。
utils.ajax(`https://api.example.com?search=${query}`).then(handleResponse);
```

使用 ES 模块，我们不需要导入整个 `utils` 对象，而只需导入我们需要的一个 `ajax` 函数：

```js
// 使用 ES6 的 import 语句导入 ajax 函数。
import { ajax } from './utils';
const query = 'Rollup';
// 调用 ajax 函数
ajax(`https://api.example.com?search=${query}`).then(handleResponse);
```

因为 Rollup 只包含最少的内容，因此它生成的库和应用程序更轻、更快、更简单。由于这种方法可以利用显式的 `import` 和 `export` 语句，因此它比仅运行最小化混淆工具更能有效检测出已编译输出代码中的未使用变量。

## 兼容性 {#compatibility}

### 导入 CommonJS {#importing-commonjs}

Rollup 可以通过插件 [导入现有的 CommonJS 模块](https://github.com/rollup/plugins/tree/master/packages/commonjs)。

### 发布 ES 模块 {#publishing-es-modules}

为了确保你的 ES 模块可以立即被处理 CommonJS 的工具使用，例如 Node.js 和 webpack，你可以使用 Rollup 编译成 UMD 或 CommonJS 格式，然后在 `package.json` 文件中使用 `main` 属性指向编译后的版本。如果你的 `package.json` 文件还有一个 `module` 字段，那么像 Rollup 和 [webpack 2+](https://webpack.js.org/) 这样的可感知 ES 模块的工具将直接 [导入 ES 模块版本](https://github.com/rollup/rollup/wiki/pkg.module)。
