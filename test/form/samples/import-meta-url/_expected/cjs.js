'use strict';

function log(url) {
	if (typeof document === 'undefined') {
		console.log(url);
	} else {
		document.body.innerText = url;
	}
}

log((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (document.currentScript && document.currentScript.src || new URL('cjs.js', document.baseURI).href)));
