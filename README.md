<p align="center">
	<a href="https://rollupjs.org/"><img src="https://rollupjs.org/rollup-logo.svg" width="150" /></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/rollup">
    <img src="https://img.shields.io/npm/v/rollup.svg" alt="npm version" >
  </a>
  <a href="https://nodejs.org/en/about/previous-releases">
    <img src="https://img.shields.io/node/v/rollup.svg" alt="node compatibility">
  </a>
  <a href="https://packagephobia.now.sh/result?p=rollup">
    <img src="https://packagephobia.now.sh/badge?p=rollup" alt="install size" >
  </a>
  <a href="https://codecov.io/gh/rollup/rollup">
    <img src="https://codecov.io/gh/rollup/rollup/graph/badge.svg" alt="code coverage" >
  </a>
  <a href="#backers" alt="sponsors on Open Collective">
    <img src="https://opencollective.com/rollup/backers/badge.svg" alt="backers" >
  </a> 
  <a href="#sponsors" alt="Sponsors on Open Collective">
    <img src="https://opencollective.com/rollup/sponsors/badge.svg" alt="sponsors" >
  </a> 
  <a href="https://github.com/rollup/rollup/blob/master/LICENSE.md">
    <img src="https://img.shields.io/npm/l/rollup.svg" alt="license">
  </a>
  <a href='https://rollup-docs-cn.netlify.app'>
    <img src='https://api.netlify.com/api/v1/badges/f1abf685-0ad9-49d6-a16f-02b2ee7ba2a7/deploy-status'>
  </a>
  <a href='https://is.gd/rollup_chat?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge'>
    <img src='https://img.shields.io/discord/466787075518365708?color=778cd1&label=chat' alt='Join the chat at https://is.gd/rollup_chat'>
  </a>
</p>

<h1 align="center">Rollup</h1>

## 简介

本仓库是 Rollup 中文文档翻译的工作仓库，Fork 自 [Rollup 官方仓库](https://github.com/rollup/rollup) 并长期维护更新。

![Alt](https://repobeats.axiom.co/api/embed/c6ea5931407031ccf67ed8e3cd5a1c608d58de26.svg 'Repobeats analytics image')

## Rollup 中文文档贡献者

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/rollup/rollup-docs-cn@master/.github-contributors/rollup_rollup-docs-cn.svg">
    <img src="https://cdn.jsdelivr.net/gh/rollup/rollup-docs-cn@master/.github-contributors/rollup_rollup-docs-cn.svg" />
  </a>
</p>

<<<<<<< HEAD
## Rollup 贡献者
=======
These commands assume the entry point to your application is named main.js, and that you'd like all imports compiled into a single file named bundle.js.

For browsers:

```bash
# compile to a <script> containing a self-executing function
rollup main.js --format iife --name "myBundle" --file bundle.js
```

For Node.js:

```bash
# compile to a CommonJS module
rollup main.js --format cjs --file bundle.js
```

For both browsers and Node.js:

```bash
# UMD format requires a bundle name
rollup main.js --format umd --name "myBundle" --file bundle.js
```

## Why

Developing software is usually easier if you break your project into smaller separate pieces, since that often removes unexpected interactions and dramatically reduces the complexity of the problems you'll need to solve, and simply writing smaller projects in the first place [isn't necessarily the answer](https://medium.com/@Rich_Harris/small-modules-it-s-not-quite-that-simple-3ca532d65de4). Unfortunately, JavaScript has not historically included this capability as a core feature in the language.

This finally changed with ES modules support in JavaScript, which provides a syntax for importing and exporting functions and data so they can be shared between separate scripts. Most browsers and Node.js support ES modules. However, Node.js releases before 12.17 support ES modules only behind the `--experimental-modules` flag, and older browsers like Internet Explorer do not support ES modules at all. Rollup allows you to write your code using ES modules, and run your application even in environments that do not support ES modules natively. For environments that support them, Rollup can output optimized ES modules; for environments that don't, Rollup can compile your code to other formats such as CommonJS modules, AMD modules, and IIFE-style scripts. This means that you get to _write future-proof code_, and you also get the tremendous benefits of...

## Tree Shaking

In addition to enabling the use of ES modules, Rollup also statically analyzes and optimizes the code you are importing, and will exclude anything that isn't actually used. This allows you to build on top of existing tools and modules without adding extra dependencies or bloating the size of your project.

For example, with CommonJS, the _entire tool or library must be imported_.

```js
// import the entire utils object with CommonJS
var utils = require('node:utils');
var query = 'Rollup';
// use the ajax method of the utils object
utils.ajax('https://api.example.com?search=' + query).then(handleResponse);
```

But with ES modules, instead of importing the whole `utils` object, we can just import the one `ajax` function we need:

```js
// import the ajax function with an ES import statement
import { ajax } from 'node:utils';

var query = 'Rollup';
// call the ajax function
ajax('https://api.example.com?search=' + query).then(handleResponse);
```

Because Rollup includes the bare minimum, it results in lighter, faster, and less complicated libraries and applications. Since this approach is based on explicit `import` and `export` statements, it is vastly more effective than simply running an automated minifier to detect unused variables in the compiled output code.

## Compatibility

### Importing CommonJS

Rollup can import existing CommonJS modules [through a plugin](https://github.com/rollup/plugins/tree/master/packages/commonjs).

### Publishing ES Modules

To make sure your ES modules are immediately usable by tools that work with CommonJS such as Node.js and webpack, you can use Rollup to compile to UMD or CommonJS format, and then point to that compiled version with the `main` property in your `package.json` file. If your `package.json` file also has a `module` field, ES-module-aware tools like Rollup and [webpack](https://webpack.js.org/) will [import the ES module version](https://github.com/rollup/rollup/wiki/pkg.module) directly.

## Contributors
>>>>>>> b9051a223aad3349546772e891b89c4e40fe5618

This project exists thanks to all the people who contribute. [[Contribute](CONTRIBUTING.md)]. <a href="https://github.com/rollup/rollup/graphs/contributors"><img src="https://opencollective.com/rollup/contributors.svg?width=890" /></a>. If you want to contribute yourself, head over to the [contribution guidelines](CONTRIBUTING.md).

## Rollup 赞助者

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/rollup#backer)]

<a href="https://opencollective.com/rollup#backers" target="_blank"><img src="https://opencollective.com/rollup/backers.svg?width=890"></a>

## Rollup 赞助商

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/rollup#sponsor)]

<a href="https://opencollective.com/rollup/sponsor/0/website" target="_blank"><img src="https://opencollective.com/rollup/sponsor/0/avatar.svg"></a> <a href="https://opencollective.com/rollup/sponsor/1/website" target="_blank"><img src="https://opencollective.com/rollup/sponsor/1/avatar.svg"></a> <a href="https://opencollective.com/rollup/sponsor/2/website" target="_blank"><img src="https://opencollective.com/rollup/sponsor/2/avatar.svg"></a> <a href="https://opencollective.com/rollup/sponsor/3/website" target="_blank"><img src="https://opencollective.com/rollup/sponsor/3/avatar.svg"></a> <a href="https://opencollective.com/rollup/sponsor/4/website" target="_blank"><img src="https://opencollective.com/rollup/sponsor/4/avatar.svg"></a> <a href="https://opencollective.com/rollup/sponsor/5/website" target="_blank"><img src="https://opencollective.com/rollup/sponsor/5/avatar.svg"></a> <a href="https://opencollective.com/rollup/sponsor/6/website" target="_blank"><img src="https://opencollective.com/rollup/sponsor/6/avatar.svg"></a> <a href="https://opencollective.com/rollup/sponsor/7/website" target="_blank"><img src="https://opencollective.com/rollup/sponsor/7/avatar.svg"></a> <a href="https://opencollective.com/rollup/sponsor/8/website" target="_blank"><img src="https://opencollective.com/rollup/sponsor/8/avatar.svg"></a> <a href="https://opencollective.com/rollup/sponsor/9/website" target="_blank"><img src="https://opencollective.com/rollup/sponsor/9/avatar.svg"></a> <a href="https://opencollective.com/rollup/sponsor/10/website" target="_blank"><img src="https://opencollective.com/rollup/sponsor/10/avatar.svg"></a> <a href="https://opencollective.com/rollup/sponsor/11/website" target="_blank"><img src="https://opencollective.com/rollup/sponsor/11/avatar.svg"></a> <a href="https://opencollective.com/rollup/sponsor/12/website" target="_blank"><img src="https://opencollective.com/rollup/sponsor/12/avatar.svg"></a> <a href="https://opencollective.com/rollup/sponsor/13/website" target="_blank"><img src="https://opencollective.com/rollup/sponsor/13/avatar.svg"></a> <a href="https://opencollective.com/rollup/sponsor/14/website" target="_blank"><img src="https://opencollective.com/rollup/sponsor/14/avatar.svg"></a>

## 特别赞助

<a href="https://www.tngtech.com/en/index.html" target="_blank"><img src="https://www.tngtech.com/fileadmin/Public/Images/Logos/TNG_Logo_medium_400x64.svg" alt="TNG Logo" width="280"/></a>

TNG 自 2017 年以来一直在支持 [Lukas Taegert-Atkinson](https://github.com/lukastaegert) 在 Rollup 上的工作。

## 协议

[MIT](https://github.com/rollup/rollup/blob/master/LICENSE.md)
