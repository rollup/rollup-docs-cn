---
title: 教程
---

# {{ $frontmatter.title }}

[[toc]]

## 创建你的第一个 Bundle {#creating-your-first-bundle}

_在开始之前，你需要安装 [Node.js](https://nodejs.org) 以便使用 [NPM](https://npmjs.com)。你还需要知道如何在你的机器上访问 [命令行](https://www.codecademy.com/learn/learn-the-command-line)。_

目前使用 Rollup 最简单的方法是通过命令行界面（CLI）操作。现在，我们将全局安装它（稍后我们将学习如何将它安装到你的项目中，以便你的构建过程具有可移植性，但暂时不用担心这个）。在命令行中输入以下内容：

```shell
npm install rollup --global
# or `npm i rollup -g` for short
```

你可以运行 `rollup` 命令. 试一试吧!

```shell
rollup
```

因为没有传入参数，Rollup 会打印出使用说明。这和运行 `rollup --help`，或者 `rollup -h` 相同。

让我们创建一个简单的项目:

```shell
mkdir -p my-rollup-project/src
cd my-rollup-project
```

首先，我们需要一个入口。将这段代码复制到一个名为 `src/main.js` 的新文件中:

```js
// src/main.js
import foo from './foo.js';
export default function () {
	console.log(foo);
}
```

接下来，让我们创建一个名为 `foo.js` 的模块，它在入口文件中被导入:

```js
// src/foo.js
export default 'hello world!';
```

现在我们已经准备好去创建一个 bundle:

```shell
rollup src/main.js -f cjs
```

`-f` 选项 (是 `--format` 的缩写) 指定了我们要创建的 bundle 的类型 — 在本例中是 CommonJS (可以在 Node.js 中运行)。 因为我们没有指定输出文件，所以它将直接打印到 `stdout`:

```js
'use strict';

const foo = 'hello world!';

const main = function () {
	console.log(foo);
};

module.exports = main;
```

你也可以像这样将 bundle 保存为文件:

```shell
rollup src/main.js -o bundle.js -f cjs
```

(你也可以使用 `rollup src/main.js -f cjs > bundle.js`，但是后面我们会看到，如果你需要生成 sourcemaps 的话，这种方式的灵活性会更低。)

尝试运行这段代码:

```
node
> var myBundle = require('./bundle.js');
> myBundle();
'hello world!'
```

恭喜! 你已经使用 Rollup 创建了你的第一个 bundle.

## 使用配置文件 {#using-config-files}

到目前为止，一切都很好，但随着我们添加更多选项，输入命令会变得有点烦人。

为了避免重复输入，我们可以创建一个包含所有必要选项的配置文件。配置文件是用 JavaScript 编写的，比原始的 CLI 更加灵活。

在项目根目录中创建一个名为 `rollup.config.js` 的文件，并添加以下代码:

```js
// rollup.config.js
export default {
	input: 'src/main.js',
	output: {
		file: 'bundle.js',
		format: 'cjs'
	}
};
```

(你也可以使用 CJS 模块，例如 `module.exports = {/* config */}`)

使用配置文件, 我们使用 `--config` 或者 `-c` :

```shell
rm bundle.js # 删除它我们可以检查命令是否正常!
rollup -c
```

你可以使用等效的命令行选项覆盖配置文件中的任何选项:

```shell
rollup -c -o bundle-2.js # `-o` 等价于 `--file`（曾用名为 "output"）
```

_注意: Rollup 本身会处理配置文件，这就是为什么我们可以使用 `export default` 语法的原因 –  代码没有被 Babel 或任何类似的工具转换，因此你只能使用在你当前使用的 Node 版本中支持的 ES2015 功能。_

你也可以选择指定不同于默认的 `rollup.config.js` 的配置文件:

```shell
rollup --config rollup.config.dev.js
rollup --config rollup.config.prod.js
```

## 本地安装 Rollup {#installing-rollup-locally}

在团队或分布式环境中工作时，将 Rollup 添加为 _本地_ 依赖可能是明智的选择。本地安装 Rollup 可以避免多个贡献者单独安装 Rollup 的额外步骤，并确保所有贡献者使用相同版本的 Rollup。.

用 NPM 安装 Rollup 到本地:

```shell
npm install rollup --save-dev
```

或者使用 Yarn:

```shell
yarn -D add rollup
```

安装完成后, Rollup 可以在项目的根目录中运行:

```shell
npx rollup --config
```

或者使用 Yarn:

```shell
yarn rollup --config
```

安装完成后，通常会在 `package.json` 中添加一个单一的构建脚本，为所有贡献者提供方便的命令。例如:

```json
{
	"scripts": {
		"build": "rollup --config"
	}
}
```

_注意: 一旦本地安装完成，当运行脚本命令时，不管是 NPM 还是 Yarn 都可以找到 Rollup 的可执行文件并执行。_

## 使用插件 {#using-plugins}

到目前为止，我们已经用入口文件和通过相对路径导入的模块创建了一个简单的 bundle。随着你构建更复杂的包，你通常需要更多的灵活性，例如导入使用 NPM 安装的模块、使用 Babel 编译代码、处理 JSON 文件等等。

为此，我们使用 _插件_，在捆绑过程的关键点更改 Rollup 的行为。一个很棒的插件列表保存在 [the Rollup Awesome List](https://github.com/rollup/awesome)。

在本教程中，我们将使用 [@rollup/plugin-json](https://github.com/rollup/plugins/tree/master/packages/json)，它允许 Rollup 从 JSON 文件中导入数据。

在项目根目录中创建一个名为 `package.json` 的文件，并添加以下内容:

```json
{
	"name": "rollup-tutorial",
	"version": "1.0.0",
	"scripts": {
		"build": "rollup -c"
	}
}
```

将 @rollup/plugin-json 安装到开发依赖中:

```shell
npm install --save-dev @rollup/plugin-json
```

(我们使用 `--save-dev` 而不是 `--save`，因为我们的代码在运行时实际上不依赖于插件，只有在构建 bundle 时才需要。)

更新你的 `src/main.js` 文件，使其从 `package.json` 导入而不是 `src/foo.js`:

```js
// src/main.js
import { version } from '../package.json';

export default function () {
	console.log('version ' + version);
}
```

在 `rollup.config.js` 文件中加入 JSON plugin:

```js
// rollup.config.js
import json from '@rollup/plugin-json';

export default {
	input: 'src/main.js',
	output: {
		file: 'bundle.js',
		format: 'cjs'
	},
	plugins: [json()]
};
```

使用 `npm run build` 运行 Rollup。结果应该如下所示:

```js
'use strict';

var version = '1.0.0';

function main() {
	console.log('version ' + version);
}

module.exports = main;
```

_注意: 结果中只导入了我们实际需要的数据 ——`name`、`devDependencies` 和 `package.json` 中其他内容都被忽略了。这就是 **tree-shaking** 的作用。_

## 使用输出插件 {#using-output-plugins}

某些插件也可以专门应用于某些输出. 有关特定输出插件可以做什么的详细信息，请参见 [plugin hooks](../plugin-development/index.md#build-hooks)。简而言之，这些插件只能在 Rollup 的主要分析完成后修改代码。如果使用不兼容的插件作为特定输出插件，Rollup 将会发出警告。一个可能的用例是压缩 bundle 以在浏览器中使用。

让我们扩展上一个示例，提供一个最小化的构建和一个非最小化的构建。为此，我们需要安装 `@rollup/plugin-terser`:

```shell
npm install --save-dev @rollup/plugin-terser
```

编辑你的 `rollup.config.js` 文件，添加第二个最小化输出。我们选择 `iife` 作为格式。该格式会将代码封装起来，以便可以通过浏览器中的 `script` 标签使用，同时避免与其他代码产生不必要的交互。由于我们有一个导出，因此我们需要提供一个全局变量的名称，该变量将由我们的 bundle 创建，以便其他代码可以通过此变量访问我们的导出。.

```js
// rollup.config.js
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

export default {
	input: 'src/main.js',
	output: [
		{
			file: 'bundle.js',
			format: 'cjs'
		},
		{
			file: 'bundle.min.js',
			format: 'iife',
			name: 'version',
			plugins: [terser()]
		}
	],
	plugins: [json()]
};
```

除了 `bundle.js`，Rollup 现在还将创建第二个文件 `bundle.min.js`:

```js
var version = (function () {
	'use strict';
	var n = '1.0.0';
	return function () {
		console.log('version ' + n);
	};
})();
```

## 代码切割 {#code-splitting}

对于代码切割，有些情况下 Rollup 会自动将代码拆分成块，例如动态加载或多个入口点，还有一种方法可以显式地告诉 Rollup 将哪些模块拆分成单独的块，这是通过 [`output.manualChunks`](../configuration-options/index.md#output-manualchunks) 选项实现的。

要使用代码切割功能实现惰性动态加载（其中某些导入的模块仅在执行函数后加载），我们返回到原始示例，并修改 `src/main.js`，以动态加载 `src/foo.js` 而不是静态加载:

```js
// src/main.js
export default function () {
	import('./foo.js').then(({ default: foo }) => console.log(foo));
}
```

Rollup 将使用动态导入创建一个仅在需要时加载的单独块。为了让 Rollup 知道在哪里放置第二个块，我们不使用 `--file` 选项，而是使用 `--dir` 选项设置一个输出文件夹:

```shell
rollup src/main.js -f cjs -d dist
```

这将创建一个名为 `dist` 的文件夹，其中包含两个文件，`main.js` 和 `chunk-[hash].js`, 其中 `[hash]` 是基于内容的哈希字符串。您可以通过指定 [`output.chunkFileNames`](../configuration-options/index.md#output-chunkfilenames) 和 [`output.entryFileNames`](../configuration-options/index.md#output-entryfilenames) 选项来提供自己的命名模式。

您仍然可以像以前一样运行您的代码，并且具有相同的输出，尽管会慢一些，因为加载和解析 `./foo.js` 仅在我们第一次调用导出的函数时才开始。

```shell
node -e "require('./dist/main.js')()"
```

如果我们不使用 `--dir` 选项，Rollup 将再次将块打印到 `stdout`，并添加注释以突出显示块的边界:

```js
//→ main.js:
'use strict';

function main() {
	Promise.resolve(require('./chunk-b8774ea3.js')).then(({ default: foo }) =>
		console.log(foo)
	);
}

module.exports = main;

//→ chunk-b8774ea3.js:
('use strict');

var foo = 'hello world!';

exports.default = foo;
```

如果您想要在使用昂贵特性之前仅加载和解析它们一次，则此方法非常有用。

代码切割的另一个用途是能够指定共享一些依赖项的多个入口点。我们再次扩展我们的示例，添加一个名为 `src/main2.js` 的第二个入口点，它静态导入 `src/foo.js`，就像我们在原始示例中所做的那样：

```js
// src/main2.js
import foo from './foo.js';
export default function () {
	console.log(foo);
}
```

如果我们给 Rollup 提供了两个入口，那么会创建三个块:

```shell
rollup src/main.js src/main2.js -f cjs
```

输出为

```js
//→ main.js:
'use strict';

function main() {
	Promise.resolve(require('./chunk-b8774ea3.js')).then(({ default: foo }) =>
		console.log(foo)
	);
}

module.exports = main;

//→ main2.js:
('use strict');

var foo_js = require('./chunk-b8774ea3.js');

function main2() {
	console.log(foo_js.default);
}

module.exports = main2;

//→ chunk-b8774ea3.js:
('use strict');

var foo = 'hello world!';

exports.default = foo;
```

请注意两个入口点都导入了相同的共享块。Rollup 永远不会复制代码，而是创建额外的块，仅加载必要的最少量。同样，通过传递 `--dir` 选项，将文件写入磁盘。

你可以通过原生的 ES 模块、AMD 加载器或 SystemJS，为浏览器构建相同的代码。

例如，使用 `-f es` 选项进行原生模块构建:

```shell
rollup src/main.js src/main2.js -f es -d dist
```

```html
<!DOCTYPE html>
<script type="module">
	import main2 from './dist/main2.js';
	main2();
</script>
```

或者，使用 `-f system` 选项进行 SystemJS 构建:

```shell
rollup src/main.js src/main2.js -f system -d dist
```

通过以下方式安装 SystemJS

```shell
npm install --save-dev systemjs
```

然后根据需要在 HTML 页面中加载一个或两个入口点:

```html
<!DOCTYPE html>
<script src="node_modules/systemjs/dist/s.min.js"></script>
<script>
	System.import('./dist/main2.js').then(({ default: main }) => main());
</script>
```

请参考 [rollup-starter-code-splitting](https://github.com/rollup/rollup-starter-code-splitting) 示例，了解如何在支持原生 ES 模块的浏览器上设置使用它们的 Web 应用程序，并在必要时回退到 SystemJS。
