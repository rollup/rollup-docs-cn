const assert = require('node:assert');
const { debug, info, warn } = console;
const logs = [];
const pluginLogs = [];

module.exports = defineTest({
	description: 'prints logs from plugins via input options if there are no handlers',
	before() {
		console.debug = (...log) => logs.push(['debug', ...log]);
		console.info = (...log) => logs.push(['info', ...log]);
		console.warn = (...log) => logs.push(['warn', ...log]);
	},
	after() {
		Object.assign(console, { debug, info, warn });
		assert.deepStrictEqual(logs, [
			['warn', 'warnLog'],
			['info', 'infoLog'],
			['debug', 'debugLog'],
			['warn', 'warnWarn']
		]);
		assert.deepStrictEqual(pluginLogs, [
			['warn', { message: 'warnLog' }],
			['info', { message: 'infoLog' }],
			['debug', { message: 'debugLog' }],
			['warn', { message: 'warnWarn' }]
		]);
	},
	options: {
		logLevel: 'debug',
		onwarn: null,
		onLog: null,
		plugins: [
			{
				name: 'test',
				buildStart(options) {
					options.onLog('warn', { message: 'warnLog' });
					options.onLog('info', { message: 'infoLog' });
					options.onLog('debug', { message: 'debugLog' });
					options.onwarn({ message: 'warnWarn' });
				},
				onLog(level, log) {
					pluginLogs.push([level, log]);
				}
			}
		]
	}
});
