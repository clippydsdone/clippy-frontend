(function (referenceList) {
    // referenceList module start

    // Constructor method
    referenceList.initialize = async function () {
        if (Global.app !== 'undefined') {
            console.log("Global variable loaded.");
        }
    }
}(window.Clippy.referenceList = window.Clippy.referenceList || {}));
