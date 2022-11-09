(function (Global) {
    // Global variables start
    const app = window.PDFViewerApplication

    // Public variables
    Global.app = app;
}(window.Global = window.Global || {}));

// Module namespace
(function (Clippy) {
    // Clippy module namespace start

    // Public method for listing active modules
    Clippy.listActiveModules = function () {
        var keys = Object.keys(this)
        var modules = {}

        for (var i = 0; i < keys.length; i++) {
            if (typeof this[keys[i]] === 'object') {
                modules[keys[i]] = this[keys[i]]
            }
        }

        return modules;
    }
}(window.Clippy = window.Clippy || {}));