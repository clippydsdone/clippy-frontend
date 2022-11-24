(function (ReferenceList) {
    // ReferenceList module start
    // Public const letiable named "name"
    Object.defineProperty(ReferenceList, "name", {
        value: "ReferenceList",
        writable: false
    });

    let button = null;     // Button in sidebar
    let content = null;    // Parent div of content to be displayed in sidebar
    let otherTabs = null;  // List of all tabs on sidebar
    let referenceList = null;

    // Initializer method
    ReferenceList.initialize = async function () {
        // TODO: fix this terribleness
        if (Global.app === 'undefined') {
            setTimeout(ReferenceList.initialize, 1);
            return;
        } else if (typeof Global.doc === 'undefined') {
            setTimeout(ReferenceList.initialize, 1);
            return;
        }
        console.log("Global letiable loaded.");

        // Both are null because we need to wait for the document to load before we can access DOM elements
        button = document.getElementById('viewReferences');
        content = document.getElementById('referencesView');
        otherTabs = document.getElementById('sidebarContent').children;

        createReferencePreview();
        //buildReferenceList();
    }

    let createReferencePreview = function () {
        if (Global.app === null) {
            console.error("PDFViewerApplication object is null. Cannot create reference preview.");
            return;
        } else if (Global.app.pdfViewer === null) {
            console.error("PDFViewer object is null. Cannot create reference preview.");
            return;
        }

        // Get constructors for required objects for PDFViewer
        let eventBusConstructor = Global.app.eventBus.constructor
        let linkServiceConstructor = Global.app.pdfLinkService.constructor
        let findControllerConstructor = Global.app.pdfViewer.findController.constructor
        let scriptingManagerConstructor = Global.app.pdfViewer._scriptingManager.constructor
        let scriptingSrc = "../" + Global.app.pdfViewer._scriptingManager._sandboxBundleSrc
        let viewerConstructor = Global.app.pdfViewer.constructor

        // Select the container that will contain the reference preview
        let container = document.getElementById('referencesContainer');

        // Create event bus for reference preview
        const eventBus = new eventBusConstructor();

        // Enable hyperlinks within PDF files
        const pdfLinkService = new linkServiceConstructor({
            eventBus
        });

        // (Optionally) enable find controller. (NOTE: no idea what this is nor do we need it)
        const pdfFindController = new findControllerConstructor({
            eventBus,
            linkService: pdfLinkService
        });

        // (Optionally) enable scripting support (NOTE: no idea what this is nor do we need it)
        const pdfScriptingManager = new scriptingManagerConstructor({
            eventBus,
            sandboxBundleSrc: scriptingSrc
        });

        // Construct PDFViewer for reference preview
        const pdfViewer = new viewerConstructor({
            container,
            eventBus,
            linkService: pdfLinkService,
            findController: pdfFindController,
            scriptingManager: pdfScriptingManager,
            //removePageBorders: false
        });
        pdfLinkService.setViewer(pdfViewer);
        pdfScriptingManager.setViewer(pdfViewer);

        eventBus.on("pagesinit", function () {
            // We can use pdfViewer now, e.g. let's change default scale.
            console.log(pdfViewer)
            pdfViewer.currentScaleValue = "page-width";


        });

        // Deep copy the active PDF document from the viewer
        let documentClone = Object.assign(Object.create(Object.getPrototypeOf(Global.viewer.pdfDocument)), Global.viewer.pdfDocument)
        pdfViewer.setDocument(documentClone);
        pdfLinkService.setDocument(documentClone, null);

        return;
    }

    let buildReferenceList = async function () {
        if (Global.doc === null) {
            console.error("pdfDocument object is null. Cannot build reference list.");
            return;
        }

        


        // Get a list of all references in the PDF
        referenceList = await Global.doc.getDestinations();

        // HTML building
        // Add a two-depth tree structure
        content.classList.add("treeWithDeepNesting");

        const popupCanvas = document.createElement("canvas");
        content.appendChild(popupCanvas);   

        let keys = Object.keys(referenceList)
        for (let i = 0; i < keys.length; i++) {
            let div = document.createElement("div");
            div.classList.add('treeItem')

            // Toggler to enable/disable the display of canvas
            let toggler = document.createElement('div');
            toggler.classList.add('treeItemToggler')
            toggler.classList.add('treeItemsHidden')

            // Link to go to the page when clicking the reference
            let link = document.createElement('a');
            link.href = "#" + keys[i];
            let linkText = document.createTextNode("placeholder"); // TODO: Get actual name of reference instead of "placeholder"
            link.appendChild(linkText);


            div.appendChild(toggler);
            div.appendChild(link);
            content.appendChild(div);
        }
    }

    // Execute initialize method after the document loads
    Clippy.addOnLoadEvent(ReferenceList.name, ReferenceList.initialize);
}(window.Clippy.ReferenceList = window.Clippy.ReferenceList || {}));
