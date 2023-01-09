(function (Global) {
	// Global variables start
	Global.preventMainViewerLinkerFlag = false;

	let setProperties = function () {
		// TODO: fix this terribleness
		if (Global.isNull(window.PDFViewerApplication)
			|| Global.isNull(window.PDFViewerApplication.pdfDocument)
			|| Global.isNull(window.PDFViewerApplication.pdfViewer)
			|| Global.isNull(window.PDFViewerApplication.pdfLinkService)) {
			setTimeout(setProperties, 1);
			return;
		}

		// Public const variable named "app"
		Object.defineProperty(Global, "app", {
			value: window.PDFViewerApplication,
			writable: false,
		});

		// Public const variable named "doc"
		Object.defineProperty(Global, "doc", {
			value: window.PDFViewerApplication.pdfDocument,
			writable: false,
		});

		// Public const variable named "viewer"
		Object.defineProperty(Global, "viewer", {
			value: window.PDFViewerApplication.pdfViewer,
			writable: false,
		});

		// Public const variable named "viewer"
		Object.defineProperty(Global, "linker", {
			value: window.PDFViewerApplication.pdfLinkService,
			writable: false,
		});
	};

	Global.isNull = function (variable) {
		return variable === null || typeof variable === 'undefined';
	} 

	Global.deepCopy = function(variable) {
		return Object.assign(Object.create(Object.getPrototypeOf(variable)), variable)
	}

	setProperties();
})((window.Global = window.Global || {}));

// Module namespace
(function (Clippy) {
	// Clippy modules namespace start
	let OnLoadEvents = {};

	// Public method for listing active modules
	Clippy.listActiveModules = function () {
		let keys = Object.keys(this);
		let modules = {};

		for (let i = 0; i < keys.length; i++) {
			if (typeof this[keys[i]] === "object") {
				modules[keys[i]] = this[keys[i]];
			}
		}

		return modules;
	};

	// ModuleName in case somebody else wants to remove
	Clippy.addOnLoadEvent = function (moduleName, fun) {
		OnLoadEvents[moduleName] = fun;

		if (window.addEventListener) {
			// W3C standard
			window.addEventListener("load", fun, false);
		} else if (window.attachEvent) {
			// Microsoft
			window.attachEvent("onload", fun);
		}
	};

	Clippy.removeOnLoadEvent = function (moduleName) {
		if (window.addEventListener) {
			// W3C standard
			window.removeEventListener("load", fun, false);
		} else if (window.attachEvent) {
			// Microsoft
			window.detachEvent("onload", fun);
		}

		delete OnLoadEvents[moduleName];
	};

	Clippy.spinnerOptions = {
		lines: 10, // The number of lines to draw
		length: 38, // The length of each line
		width: 17, // The line thickness
		radius: 45, // The radius of the inner circle
		scale: 0.25, // Scales overall size of the spinner
		corners: 1, // Corner roundness (0..1)
		speed: 1, // Rounds per second
		rotate: 0, // The rotation offset
		animation: 'spinner-line-fade-quick', // The CSS animation name for the lines
		direction: 1, // 1: clockwise, -1: counterclockwise
		fadeColor: 'transparent', // CSS color or array of colors
		color: getComputedStyle(document.documentElement).getPropertyValue('--main-color'),
		top: '150%', // Top position relative to parent
		left: '20%', // Left position relative to parent
		shadow: '0 0 1px transparent', // Box-shadow for the lines
		zIndex: 2000000000, // The z-index (defaults to 2e9)
		className: 'spinner', // The CSS class to assign to the spinner
		position: 'absolute', // Element positioning
	  };
	Clippy.graphSpinnerOptions = JSON.parse(JSON.stringify(Clippy.spinnerOptions));

})((window.Clippy = window.Clippy || {}));
