const assert = require('node:assert');
const path = require('node:path');

const { debug, info, warn } = console;
const ID_MAIN = path.join(__dirname, 'main.js');
const logs = [];
let onLogHookTriggered = false;
let onLogOptionTriggered = false;

module.exports = defineTest({
	description: 'shows all logs for logLevel:debug',
	before() {
		console.debug = (...log) => logs.push(['console-debug', ...log]);
		console.info = (...log) => logs.push(['console-info', ...log]);
		console.warn = (...log) => logs.push(['console-warn', ...log]);
	},
	after() {
		Object.assign(console, { debug, info, warn });
		assert.deepEqual(logs, [
			['debug', { message: 'onLog-debug' }],
			['console-debug', 'onLogOption-debug'],
			['console-info', 'onLogOption-info'],
			['console-warn', 'onLogOption-warn'],
			['info', { message: 'onLog-info' }],
			['warn', { message: 'onLog-warn' }],
			['debug', { message: '[plugin test] options-debug', code: 'PLUGIN_LOG', plugin: 'test' }],
			['info', { message: '[plugin test] options-info', code: 'PLUGIN_LOG', plugin: 'test' }],
			['warn', { message: '[plugin test] options-warn', code: 'PLUGIN_WARNING', plugin: 'test' }],
			['debug', { message: '[plugin test] buildStart-debug', code: 'PLUGIN_LOG', plugin: 'test' }],
			['info', { message: '[plugin test] buildStart-info', code: 'PLUGIN_LOG', plugin: 'test' }],
			[
				'warn',
				{ message: '[plugin test] buildStart-warn', code: 'PLUGIN_WARNING', plugin: 'test' }
			],
			['debug', { message: 'buildStart-options-debug' }],
			['info', { message: 'buildStart-options-info' }],
			['warn', { message: 'buildStart-options-warn' }],
			[
				'debug',
				{
					message: '[plugin test] main.js: transform-debug',
					id: ID_MAIN,
					hook: 'transform',
					code: 'PLUGIN_LOG',
					plugin: 'test'
				}
			],
			[
				'info',
				{
					message: '[plugin test] main.js: transform-info',
					id: ID_MAIN,
					hook: 'transform',
					code: 'PLUGIN_LOG',
					plugin: 'test'
				}
			],
			[
				'warn',
				{
					message: '[plugin test] main.js: transform-warn',
					id: ID_MAIN,
					hook: 'transform',
					code: 'PLUGIN_WARNING',
					plugin: 'test'
				}
			],
			[
				'warn',
				{
					code: 'EVAL',
					id: ID_MAIN,
					message:
						'main.js (1:0): Use of eval in "main.js" is strongly discouraged as it poses security risks and may cause issues with minification.',
					url: 'https://rollupjs.org/troubleshooting/#avoiding-eval',
					pos: 0,
					loc: {
						column: 0,
						file: ID_MAIN,
						line: 1
					},
					frame: "1: eval('true');\n   ^"
				}
			]
		]);
	},
	options: {
		logLevel: 'debug',
		onLog(level, log, handler) {
			logs.push([level, log]);
			if (!onLogOptionTriggered) {
				onLogOptionTriggered = true;
				handler('debug', 'onLogOption-debug');
				handler('info', 'onLogOption-info');
				handler('warn', 'onLogOption-warn');
			}
		},
		plugins: [
			{
				name: 'test',
				buildStart(options) {
					let triggered = '';
					this.debug(() => {
						triggered += 'debug';
						return 'buildStart-debug';
					});
					this.info(() => {
						triggered += 'info';
						return 'buildStart-info';
					});
					this.warn(() => {
						triggered += 'warn';
						return 'buildStart-warn';
					});
					assert.strictEqual(triggered, 'debuginfowarn');
					options.onLog('debug', { message: 'buildStart-options-debug' });
					options.onLog('info', { message: 'buildStart-options-info' });
					options.onLog('warn', { message: 'buildStart-options-warn' });
				},
				onLog() {
					if (!onLogHookTriggered) {
						onLogHookTriggered = true;
						this.debug('onLog-debug');
						this.info('onLog-info');
						this.warn('onLog-warn');
					}
				},
				options() {
					this.debug('options-debug');
					this.info('options-info');
					this.warn('options-warn');
				},
				transform() {
					this.debug('transform-debug');
					this.info('transform-info');
					this.warn('transform-warn');
				}
			}
		]
	}
});
