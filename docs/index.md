---
layout: home

hero:
  name: rollup.js
  text: JavaScript 打包器
  tagline: 将点滴代码编织成错综复杂的程序。
  image: /rollup-logo.svg
  actions:
    - theme: brand
      text: 现在开始
      link: /introduction/
    - theme: alt
      text: 在 GitHub 上查看
      link: https://github.com/rollup/rollup
features:
  - icon: 🌍
    title: 面向 Web 和 Node …
    details: 'Rollup支持许多输出格式：ES模块、CommonJS、UMD、SystemJS等等。不仅可以为Web打包，还可以为许多其他平台打包。'
    link: /configuration-options/#output-format
    linkText: 查看所有支持的格式
  - icon: 🌳
    title: 除屑优化（Tree-shaking）
    details: 基于深度执行路径分析的冗余代码消除，将除屑优化引入 JavaScript。
    link: /faqs/#what-is-tree-shaking
    linkText: 了解关于除屑优化的更多详情
  - icon: 🗡️
    title: 无额外开销的代码分割
    details: 根据不同的入口点和动态导入将代码拆分，只需使用输出格式的导入机制，无需使用自定义加载器代码。
    link: /tutorial/#code-splitting
    linkText: 如何使用代码分割
  - icon: 🔌
    title: 强大的插件机制
    details: 易于学习的插件 API，只需少量代码即可实现强大的代码注入和转换。被 Vite 和 WMR 采用。
    link: /plugin-development/#plugins-overview
    linkText: 了解如何编写插件
  - icon: 🛠️
    title: 应需而变，量身定制。
    details: Rollup 并不持有偏见，丰富的插件接口和多样的配置选项使其成为定制构建流程和高级工具链的理想打包工具。
    link: /configuration-options/
    linkText: 查看所有选项
  - icon:
      src: /vitejs-logo.svg
    title: Vite 依赖的打包器
    details: 正在开发 Web？Vite 为您预配置 Rollup，提供合理的默认设置和强大的插件，同时为您提供极速的开发服务器。
    link: https://vitejs.dev/
    linkText: 查看 Vite
---
