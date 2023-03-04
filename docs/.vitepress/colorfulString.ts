/* eslint-disable sort-keys */
export type ColorfulOptions =
	| 'bold'
	| 'italic'
	| 'underline'
	| 'inverse'
	| 'strikethrough'
	| 'white'
	| 'grey'
	| 'black'
	| 'blue'
	| 'cyan'
	| 'green'
	| 'magenta'
	| 'red'
	| 'yellow'
	| 'bgWhite'
	| 'bgGrey'
	| 'bgBlack'
	| 'bgBlue'
	| 'bgCyan'
	| 'bgGreen'
	| 'bgMagenta'
	| 'bgRed'
	| 'bgYellow';

const colorMap: Record<ColorfulOptions, string> = {
	bold: '1',
	italic: '3',
	underline: '4',
	inverse: '7',
	strikethrough: '9',
	white: '37',
	grey: '90',
	black: '30',
	blue: '34',
	cyan: '36',
	green: '32',
	magenta: '35',
	red: '31',
	yellow: '33',
	bgWhite: '47',
	bgGrey: '49',
	bgBlack: '40',
	bgBlue: '44',
	bgCyan: '46',
	bgGreen: '42',
	bgMagenta: '45',
	bgRed: '41',
	bgYellow: '43'
};

/**
 * Transform a string to ascii colorful string.
 *
 * @param str String to be colored.
 * @param options Colorful options.
 * @returns Ascii colorful string.
 */
export function colorful(string_: string, options: ColorfulOptions[] = []) {
	const colors = options.map(option => colorMap[option]).join(';');

	return `\u001B[${colors}m${string_}\u001B[0m`;
}

export const yellowBold = (string_: string) => colorful(string_, ['yellow', 'bold']);
export const redBold = (string_: string) => colorful(string_, ['red', 'bold']);
export const greenBold = (string_: string) => colorful(string_, ['green', 'bold']);
