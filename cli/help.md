rollup version __VERSION__
=====================================

Usage: rollup [options] <entry file>

Basic options:

<<<<<<< HEAD
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
--no-externalImportAssertions 在 "es" 输出中省略导入断言
--no-externalLiveBindings   不生成支持实时绑定的代码
--failAfterWarnings         如果生成的构建产生警告，则退出并显示错误
--footer <text>             在产物底部插入的代码（位于包装器之外）
--no-freeze                 不冻结命名空间对象
--generatedCode <preset>    使用哪些代码特性（es5/es2015）
--generatedCode.arrowFunctions 在生成的代码中使用箭头函数
--generatedCode.constBindings 在生成的代码中使用 "const"
--generatedCode.objectShorthand 在生成的代码中使用简写属性
--no-generatedCode.reservedNamesAsProps 始终引用保留名称作为 props
--generatedCode.symbols     在生成的代码中使用符号
--no-hoistTransitiveImports 不将中转导入提升到入口块中
--no-indent                 不缩进结果
--inlineDynamicImports      使用动态导入时创建单次打包
--no-interop                不包括交互操作块
--intro <text>              在产物顶部插入的代码（位于包装器内部）
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
--no-sanitizeFileName       不要替换文件名中的无效字符
--shimMissingExports        为丢失的导出创建卡扣变量
--silent                    不打印警告
--sourcemapBaseUrl <url>    使用给定的基本 URL 发出绝对源映射 URL
--sourcemapExcludeSources   在源映射中不包括源代码
--sourcemapFile <file>      指定源映射的包位置
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
=======
-c, --config <filename>     Use this config file (if argument is used but value
                              is unspecified, defaults to rollup.config.js)
-d, --dir <dirname>         Directory for chunks (if absent, prints to stdout)
-e, --external <ids>        Comma-separate list of module IDs to exclude
-f, --format <format>       Type of output (amd, cjs, es, iife, umd, system)
-g, --globals <pairs>       Comma-separate list of `moduleID:Global` pairs
-h, --help                  Show this help message
-i, --input <filename>      Input (alternative to <entry file>)
-m, --sourcemap             Generate sourcemap (`-m inline` for inline map)
-n, --name <name>           Name for UMD export
-o, --file <output>         Single output file (if absent, prints to stdout)
-p, --plugin <plugin>       Use the plugin specified (may be repeated)
-v, --version               Show version number
-w, --watch                 Watch files in bundle and rebuild on changes
--amd.autoId                Generate the AMD ID based off the chunk name
--amd.basePath <prefix>     Path to prepend to auto generated AMD ID
--amd.define <name>         Function to use in place of `define`
--amd.forceJsExtensionForImports Use `.js` extension in AMD imports
--amd.id <id>               ID for AMD module (default is anonymous)
--assetFileNames <pattern>  Name pattern for emitted assets
--banner <text>             Code to insert at top of bundle (outside wrapper)
--chunkFileNames <pattern>  Name pattern for emitted secondary chunks
--compact                   Minify wrapper code
--context <variable>        Specify top-level `this` value
--no-dynamicImportInCjs     Write external dynamic CommonJS imports as require
--entryFileNames <pattern>  Name pattern for emitted entry chunks
--environment <values>      Settings passed to config file (see example)
--no-esModule               Do not add __esModule property
--exports <mode>            Specify export mode (auto, default, named, none)
--extend                    Extend global variable defined by --name
--no-externalImportAssertions Omit import assertions in "es" output
--no-externalLiveBindings   Do not generate code to support live bindings
--failAfterWarnings         Exit with an error if the build produced warnings
--footer <text>             Code to insert at end of bundle (outside wrapper)
--no-freeze                 Do not freeze namespace objects
--generatedCode <preset>    Which code features to use (es5/es2015)
--generatedCode.arrowFunctions Use arrow functions in generated code
--generatedCode.constBindings Use "const" in generated code
--generatedCode.objectShorthand Use shorthand properties in generated code
--no-generatedCode.reservedNamesAsProps Always quote reserved names as props
--generatedCode.symbols     Use symbols in generated code
--no-hoistTransitiveImports Do not hoist transitive imports into entry chunks
--no-indent                 Don't indent result
--inlineDynamicImports      Create single bundle when using dynamic imports
--no-interop                Do not include interop block
--intro <text>              Code to insert at top of bundle (inside wrapper)
--logLevel <level>          Which kind of logs to display
--no-makeAbsoluteExternalsRelative Prevent normalization of external imports
--maxParallelFileOps <value> How many files to read in parallel
--minifyInternalExports     Force or disable minification of internal exports
--noConflict                Generate a noConflict method for UMD globals
--outro <text>              Code to insert at end of bundle (inside wrapper)
--perf                      Display performance timings
--no-preserveEntrySignatures Avoid facade chunks for entry points
--preserveModules           Preserve module structure
--preserveModulesRoot       Put preserved modules under this path at root level
--preserveSymlinks          Do not follow symlinks when resolving files
--no-sanitizeFileName       Do not replace invalid characters in file names
--shimMissingExports        Create shim variables for missing exports
--silent                    Don't print warnings
--sourcemapBaseUrl <url>    Emit absolute sourcemap URLs with given base
--sourcemapExcludeSources   Do not include source code in source maps
--sourcemapFile <file>      Specify bundle position for source maps
--stdin=ext                 Specify file extension used for stdin input
--no-stdin                  Do not read "-" from stdin
--no-strict                 Don't emit `"use strict";` in the generated modules
--strictDeprecations        Throw errors for deprecated features
--no-systemNullSetters      Do not replace empty SystemJS setters with `null`
--no-treeshake              Disable tree-shaking optimisations
--no-treeshake.annotations  Ignore pure call annotations
--treeshake.correctVarValueBeforeDeclaration Deoptimize variables until declared
--treeshake.manualPureFunctions <names> Manually declare functions as pure
--no-treeshake.moduleSideEffects Assume modules have no side effects
--no-treeshake.propertyReadSideEffects Ignore property access side effects
--no-treeshake.tryCatchDeoptimization Do not turn off try-catch-tree-shaking
--no-treeshake.unknownGlobalSideEffects Assume unknown globals do not throw
--validate                  Validate output
--waitForBundleInput        Wait for bundle input files
--watch.buildDelay <number> Throttle watch rebuilds
--no-watch.clearScreen      Do not clear the screen when rebuilding
--watch.exclude <files>     Exclude files from being watched
--watch.include <files>     Limit watching to specified files
--watch.onBundleEnd <cmd>   Shell command to run on `"BUNDLE_END"` event
--watch.onBundleStart <cmd> Shell command to run on `"BUNDLE_START"` event
--watch.onEnd <cmd>         Shell command to run on `"END"` event
--watch.onError <cmd>       Shell command to run on `"ERROR"` event
--watch.onStart <cmd>       Shell command to run on `"START"` event
--watch.skipWrite           Do not write files to disk when watching
>>>>>>> 63b712596b42c471d882b4de058d4647d3b9a55c

Examples:

# use settings in config file
rollup -c

# in config file, process.env.INCLUDE_DEPS === 'true'
# and process.env.BUILD === 'production'
rollup -c --environment INCLUDE_DEPS,BUILD:production

# create CommonJS bundle.js from src/main.js
rollup --format=cjs --file=bundle.js -- src/main.js

# create self-executing IIFE using `window.jQuery`
# and `window._` as external globals
rollup -f iife --globals jquery:jQuery,lodash:_ \
  -i src/app.js -o build/app.js -m build/app.js.map

Notes:

* When piping to stdout, only inline sourcemaps are permitted

For more information visit https://rollupjs.org
