import { g as getDefaultExportFromCjs } from './_commonjsHelpers-5342acfa.js';

var browser$2;
var hasRequiredBrowser;

function requireBrowser () {
	if (hasRequiredBrowser) return browser$2;
	hasRequiredBrowser = 1;

	/* eslint-env browser */
	browser$2 = typeof self === 'object' ? self.FormData : window.FormData;
	return browser$2;
}

var browserExports = requireBrowser();
var browser = /*@__PURE__*/getDefaultExportFromCjs(browserExports);

var browser$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	default: browser
});

export { browser$1 as b };
//# sourceMappingURL=browser-f194dfc5.js.map
