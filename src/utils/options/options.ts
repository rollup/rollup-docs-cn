import type {
	InputOptions,
	InputPluginOption,
	LogHandler,
	LogLevelOption,
	NormalizedGeneratedCodeOptions,
	NormalizedInputOptions,
	NormalizedOutputOptions,
	NormalizedTreeshakingOptions,
	OutputOptions,
	OutputPlugin,
	OutputPluginOption,
	Plugin,
	RollupLog,
	WarningHandlerWithDefault
} from '../../rollup/types';
import { asyncFlatten } from '../asyncFlatten';
import { EMPTY_ARRAY } from '../blank';
import { LOGLEVEL_DEBUG, LOGLEVEL_ERROR, LOGLEVEL_WARN, logLevelPriority } from '../logging';
import { error, logInvalidOption, logUnknownOption } from '../logs';
import { printQuotedStringList } from '../printStringList';
import relativeId from '../relativeId';

export interface GenericConfigObject {
	[key: string]: unknown;
}

export const getOnLog = (
	config: InputOptions,
	logLevel: LogLevelOption,
	printLog = defaultPrintLog
): NormalizedInputOptions['onLog'] => {
	const { onwarn, onLog } = config;
	const defaultOnLog = getDefaultOnLog(printLog, onwarn);
	if (onLog) {
		const minimalPriority = logLevelPriority[logLevel];
		return (level, log) =>
			onLog(level, addLogToString(log), (level, handledLog) => {
				if (level === LOGLEVEL_ERROR) {
					return error(normalizeLog(handledLog));
				}
				if (logLevelPriority[level] >= minimalPriority) {
					defaultOnLog(level, normalizeLog(handledLog));
				}
			});
	}
	return defaultOnLog;
};

const getDefaultOnLog = (printLog: LogHandler, onwarn?: WarningHandlerWithDefault): LogHandler =>
	onwarn
		? (level, log) => {
				if (level === LOGLEVEL_WARN) {
					onwarn(addLogToString(log), warning => printLog(LOGLEVEL_WARN, normalizeLog(warning)));
				} else {
					printLog(level, log);
				}
			}
		: printLog;

const addLogToString = (log: RollupLog): RollupLog => {
	Object.defineProperty(log, 'toString', {
		value: () => getExtendedLogMessage(log),
		writable: true
	});
	return log;
};

export const normalizeLog = (log: RollupLog | string | (() => RollupLog | string)): RollupLog =>
	typeof log === 'string'
		? { message: log }
		: typeof log === 'function'
			? normalizeLog(log())
			: log;

const getExtendedLogMessage = (log: RollupLog): string => {
	let prefix = '';

	if (log.plugin) {
		prefix += `(${log.plugin} plugin) `;
	}
	if (log.loc) {
		prefix += `${relativeId(log.loc.file!)} (${log.loc.line}:${log.loc.column}) `;
	}

	return prefix + log.message;
};

const defaultPrintLog: LogHandler = (level, log) => {
	const message = getExtendedLogMessage(log);
	switch (level) {
		case LOGLEVEL_WARN: {
			return console.warn(message);
		}
		case LOGLEVEL_DEBUG: {
			return console.debug(message);
		}
		default: {
			return console.info(message);
		}
	}
};

export function warnUnknownOptions(
	passedOptions: object,
	validOptions: readonly string[],
	optionType: string,
	log: LogHandler,
	ignoredKeys = /$./
): void {
	const validOptionSet = new Set(validOptions);
	const unknownOptions = Object.keys(passedOptions).filter(
		key => !(validOptionSet.has(key) || ignoredKeys.test(key))
	);
	if (unknownOptions.length > 0) {
		log(LOGLEVEL_WARN, logUnknownOption(optionType, unknownOptions, [...validOptionSet].sort()));
	}
}

type ObjectValue<Base> = Base extends Record<string, any> ? Base : never;

export const treeshakePresets: {
	[key in NonNullable<
		ObjectValue<InputOptions['treeshake']>['preset']
	>]: NormalizedTreeshakingOptions;
} = {
	recommended: {
		annotations: true,
		correctVarValueBeforeDeclaration: false,
		manualPureFunctions: EMPTY_ARRAY,
		moduleSideEffects: () => true,
		propertyReadSideEffects: true,
		tryCatchDeoptimization: true,
		unknownGlobalSideEffects: false
	},
	safest: {
		annotations: true,
		correctVarValueBeforeDeclaration: true,
		manualPureFunctions: EMPTY_ARRAY,
		moduleSideEffects: () => true,
		propertyReadSideEffects: true,
		tryCatchDeoptimization: true,
		unknownGlobalSideEffects: true
	},
	smallest: {
		annotations: true,
		correctVarValueBeforeDeclaration: false,
		manualPureFunctions: EMPTY_ARRAY,
		moduleSideEffects: () => false,
		propertyReadSideEffects: false,
		tryCatchDeoptimization: false,
		unknownGlobalSideEffects: false
	}
};

export const generatedCodePresets: {
	[key in NonNullable<
		ObjectValue<OutputOptions['generatedCode']>['preset']
	>]: NormalizedOutputOptions['generatedCode'];
} = {
	es2015: {
		arrowFunctions: true,
		constBindings: true,
		objectShorthand: true,
		reservedNamesAsProps: true,
		symbols: true
	},
	es5: {
		arrowFunctions: false,
		constBindings: false,
		objectShorthand: false,
		reservedNamesAsProps: true,
		symbols: false
	}
};

type ObjectOptionWithPresets =
	| Partial<NormalizedTreeshakingOptions>
	| Partial<NormalizedGeneratedCodeOptions>;

export const objectifyOption = (value: unknown): Record<string, unknown> =>
	value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

export const objectifyOptionWithPresets =
	<T extends ObjectOptionWithPresets>(
		presets: Record<string, T>,
		optionName: string,
		urlSnippet: string,
		additionalValues: string
	) =>
	(value: unknown): Record<string, unknown> => {
		if (typeof value === 'string') {
			const preset = presets[value];
			if (preset) {
				return preset;
			}
			error(
				logInvalidOption(
					optionName,
					urlSnippet,
					`valid values are ${additionalValues}${printQuotedStringList(
						Object.keys(presets)
					)}. You can also supply an object for more fine-grained control`,
					value
				)
			);
		}
		return objectifyOption(value);
	};

export const getOptionWithPreset = <T extends ObjectOptionWithPresets>(
	value: unknown,
	presets: Record<string, T>,
	optionName: string,
	urlSnippet: string,
	additionalValues: string
): Record<string, unknown> => {
	const presetName: string | undefined = (value as any)?.preset;
	if (presetName) {
		const preset = presets[presetName];
		if (preset) {
			return { ...preset, ...(value as Record<string, unknown>) };
		} else {
			error(
				logInvalidOption(
					`${optionName}.preset`,
					urlSnippet,
					`valid values are ${printQuotedStringList(Object.keys(presets))}`,
					presetName
				)
			);
		}
	}
	return objectifyOptionWithPresets(presets, optionName, urlSnippet, additionalValues)(value);
};

export const normalizePluginOption: {
	(plugins: InputPluginOption): Promise<Plugin[]>;
	(plugins: OutputPluginOption): Promise<OutputPlugin[]>;
	(plugins: unknown): Promise<any[]>;
} = async (plugins: any) => (await asyncFlatten([plugins])).filter(Boolean);
