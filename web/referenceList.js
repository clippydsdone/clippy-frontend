(function (ReferenceList) {
    // ReferenceList module start
    // Public const variable named "name"
    Object.defineProperty(ReferenceList, "name", {
        value: "ReferenceList",
        writable: false
    });

    var button = null;     // Button in sidebar
    var content = null;    // Parent div of content to be displayed in sidebar
    var otherTabs = null;  // List of all tabs on sidebar
    var referenceList = null;

    // Initializator method
    ReferenceList.initialize = async function () {
        // TODO: fix this terribleness
        if (Global.app === 'undefined') {
            setTimeout(ReferenceList.initialize, 1);
            return;
        } else if (typeof Global.doc === 'undefined') {
            setTimeout(ReferenceList.initialize, 1);
            return;
        }
        console.log("Global variable loaded.");

        // Both are null because we need to wait for the document to load before we can access DOM elements
        button = document.getElementById('viewReferences');
        content = document.getElementById('referencesView');
        otherTabs = document.getElementById('sidebarContent').children;

        button.addEventListener("click", toggleVisibility);
        buildReferenceList();
    }

    var buildReferenceList = async function () {
        if (Global.doc === null) {
            console.error("pdfDocument object is null. Cannot build reference list.");
            return;
        }

        // Get a list of all references in the PDF
        referenceList = await Global.doc.getDestinations();
        console.log(referenceList)

        // HTML building
        // Add a two-depth tree structure

        // TODO: add event listeners for select, treeItemsHidden

        content.classList.add("treeWithDeepNesting");
        var keys = Object.keys(referenceList)
        console.log(keys)
        console.log(keys.length)
        for (var i = 0; i < keys.length; i++) {
            var div = document.createElement("div");
            div.classList.add('treeItem')

            // Toggler to enable/disable the display of canvas
            var toggler = document.createElement('div');
            toggler.classList.add('treeItemToggler')
            toggler.classList.add('treeItemsHidden')

            // Link to go to the page when clicking the reference
            var link = document.createElement('a');
            link.href = "#" + keys[i];
            var linkText = document.createTextNode("placeholder"); // TODO: Get actual name of reference instead of "placeholder"
            link.appendChild(linkText);

            // Preview of reference
            var preview = document.createElement('canvas'); // TODO: insert page preview here
            //preview.style.display = 'none';  // TODO: This one or the one below?
            preview.classList.add('hidden');


            div.appendChild(toggler);
            div.appendChild(link);
            div.appendChild(preview);
            content.appendChild(div);
        }
    }

    var toggleVisibility = async function (evt) {
        if (evt !== 'undefined') {
            console.log(evt)
        }
        if (referenceList === null) {
            buildReferenceList();
        }

        var openTab = null;

        for (var i = 0; i < otherTabs.length; i++) {
            if (!otherTabs[i].classList.contains('hidden')) {
                openTab = otherTabs[i]
                break;
            }
        }

        if (openTab.id === 'referencesView') { // Close if open
            content.classList.add("hidden")
        } else {
            content.classList.remove("hidden")
        }
    }

    // Execute initialize method after the document loads
    Clippy.addOnLoadEvent(ReferenceList.name, ReferenceList.initialize);
}(window.Clippy.ReferenceList = window.Clippy.ReferenceList || {}));
