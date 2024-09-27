'use strict';

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

exports.getDefaultExportFromCjs = getDefaultExportFromCjs;
