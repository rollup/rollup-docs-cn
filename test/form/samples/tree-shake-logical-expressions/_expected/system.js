System.register([], (function () {
	'use strict';
	return {
		execute: (function () {

			function getStringA() {
				return 'A';
			}

			console.log(getStringA());

			console.log(false);

			console.log(true);

			function getStringD() {
				return 'D';
			}

			console.log(getStringD());

		})
	};
}));
