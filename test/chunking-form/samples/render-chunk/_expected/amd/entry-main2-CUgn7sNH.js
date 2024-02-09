define(['require', './chunk-dep2-ughyJKkd'], (function (require, dep2) { 'use strict';

	var num = 3;
	console.log('referenced asset', new URL(require.toUrl('./asset-test-C4X7hChn'), document.baseURI).href);

	console.log(dep2.num + num);
	console.log('referenced asset', new URL(require.toUrl('./asset-test-C4X7hChn'), document.baseURI).href);

}));
console.log({
  "exports": [],
  "facadeModuleId": "**/main2.js",
  "isDynamicEntry": false,
  "isEntry": true,
  "isImplicitEntry": false,
  "moduleIds": [
    "**/dep3.js",
    "**/main2.js"
  ],
  "name": "main2",
  "type": "chunk",
  "dynamicImports": [],
  "fileName": "entry-main2-CUgn7sNH.js",
  "implicitlyLoadedBefore": [],
  "importedBindings": {
    "chunk-dep2-ughyJKkd.js": [
      "num"
    ]
  },
  "imports": [
    "chunk-dep2-ughyJKkd.js"
  ],
  "modules": {
    "**/dep3.js": {
      "code": "\tvar num = 3;\n\tconsole.log('referenced asset', new URL(require.toUrl('./asset-test-C4X7hChn'), document.baseURI).href);",
      "originalLength": 19,
      "removedExports": [],
      "renderedExports": [
        "num"
      ],
      "renderedLength": 117
    },
    "**/main2.js": {
      "code": "\tconsole.log(dep2.num + num);\n\tconsole.log('referenced asset', new URL(require.toUrl('./asset-test-C4X7hChn'), document.baseURI).href);",
      "originalLength": 102,
      "removedExports": [],
      "renderedExports": [],
      "renderedLength": 133
    }
  },
  "referencedFiles": [
    "asset-test-C4X7hChn"
  ]
});
console.log('all chunks', ["entry-main1-utR7jRA-.js","entry-main2-CUgn7sNH.js","chunk-dep2-ughyJKkd.js"])
console.log('referenced asset in renderChunk', 'asset-test-C4X7hChn');
