System.register([], (function (exports) {
	'use strict';
	return {
		execute: (function () {

			function _mergeNamespaces(n, m) {
				m.forEach(function (e) {
					e && typeof e !== 'string' && !Array.isArray(e) && Object.keys(e).forEach(function (k) {
						if (k !== 'default' && !(k in n)) {
							var d = Object.getOwnPropertyDescriptor(e, k);
							Object.defineProperty(n, k, d.get ? d : {
								enumerable: true,
								get: function () { return e[k]; }
							});
						}
					});
				});
				return Object.freeze(n);
			}

			const __moduleExports = { foo: 'bar' };
			var lib = exports('default', 'baz');

			var lib$1 = /*#__PURE__*/_mergeNamespaces({
				__proto__: null,
				default: lib
			}, [__moduleExports]);
			exports("l", lib$1);

		})
	};
}));
