(function (ReferenceList) {
    // ReferenceList module start
    // Public const variable named "name"
    Object.defineProperty(ReferenceList, "name", {
        value: "ReferenceList",
        writable: false
    });

    var button = null;     // Button in sidebar
    var content = null;    // Parent div of content to be displayed in sidebar

    // Initializator method
    ReferenceList.initialize = async function () {
        if (Global.app !== 'undefined') {
            console.log("Global variable loaded.");
        }

        // Both are null because we need to wait for the document to load before we can access DOM elements
        button = document.getElementById('viewReferences');
        content = document.getElementById('referencesView');

        button.addEventListener("click", toggleVisibility);
    }

    var toggleVisibility = function (evt) {
        if (evnt !== 'undefined') {
            console.log(evt)
        }        
    }

    // Execute initialize method after the document loads
    Clippy.addOnLoadEvent(ReferenceList.name, ReferenceList.initialize);
}(window.Clippy.ReferenceList = window.Clippy.ReferenceList || {}));
