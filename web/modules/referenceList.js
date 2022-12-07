(function (ReferenceList) {
    // ReferenceList module start
    // Define module name as constant
    Object.defineProperty(ReferenceList, "name", {
        value: "ReferenceList",
        writable: false
    });

    // HTML elements
    let content = null;     // Parent div of content to be displayed in sidebar
    let container = null;   // Container for the viewer
    let viewer = null;      // Div of the viewer
    let zoomInButton = null;
    let zoomOutButton = null;
    let referenceFilter = null;
    let referenceListContainer = null;

    // Reference List elements
    let referenceList = [];
    let validReferences = {
        /*
        "aff": "AFF"
        "para": "Paragraph",
        "sec": "Section",
        "crf": "CRF",
        */
        "bib": "Bibliography",
        "cor": "Corresponding Author",        
        "eqn": "Equation",
        "fig": "Figure",
        "tbl": "Table",
        "ueqn": "Inequation"
    };

    // Preview (PDFViewer) elements
    let referenceViewer = null;
    let referenceLinkService = null;

    // Initializer method
    ReferenceList.initialize = async function () {
        // TODO: fix this terribleness
        if (Global.isNull(Global.app)) {
            setTimeout(ReferenceList.initialize, 100);
            return;
        } else if (Global.isNull(Global.doc)) {
            setTimeout(ReferenceList.initialize, 100);
            return;
        }
        console.log("Initializing ReferenceList.");

        // Both are null because we need to wait for the document to load before we can access DOM elements
        content = document.getElementById('referencesView');
        container = document.getElementById('referencesContainer');
        viewer = document.getElementById('referencesViewer');
        zoomInButton = document.getElementById('zoomInPreview');
        zoomOutButton = document.getElementById('zoomOutPreview');
        referenceFilter = document.getElementById('referenceFilterContainer');
        referenceListContainer = document.getElementById('referenceListContainer');

        $(window).on("resize", function () {
            setSize();
        })

        $("#sidebarResizer").mousedown(function () {
            $(document).mousemove(function () {
                setSize();
            });

            $(document).mouseup(function () {
                $(this).unbind();
            });
        });

        createReferencePreview();
        buildReferenceList();
    }

    let createReferencePreview = function () {
        if (Global.isNull(Global.app)) {
            console.error("PDFViewerApplication object is null. Cannot create reference preview.");
            return;
        } else if (Global.isNull(Global.app.pdfViewer)) {
            console.error("PDFViewer object is null. Cannot create reference preview.");
            return;
        } else if (Global.isNull(container)) {
            console.error("HTML div with id 'referencesContainer' is null. Cannot create reference preview.");
            return;
        } else if (Global.isNull(viewer)) {
            console.error("HTML div with id 'referencesViewer' is null. Cannot create reference preview.");
            return;
        }

        // Get constructors for required objects for PDFViewer
        let eventBusConstructor = Global.app.eventBus.constructor
        let linkServiceConstructor = Global.app.pdfLinkService.constructor
        let findControllerConstructor = Global.app.pdfViewer.findController.constructor
        let scriptingManagerConstructor = Global.app.pdfViewer._scriptingManager.constructor
        let scriptingSrc = "../" + Global.app.pdfViewer._scriptingManager._sandboxBundleSrc
        let viewerConstructor = Global.app.pdfViewer.constructor

        // Create event bus for reference preview
        const eventBus = new eventBusConstructor();

        // Enable hyperlinks within PDF files
        referenceLinkService = new linkServiceConstructor({
            eventBus
        });

        // (Optionally) enable find controller. (NOTE: no idea what this is nor do we need it)
        const pdfFindController = new findControllerConstructor({
            eventBus,
            linkService: referenceLinkService
        });

        // (Optionally) enable scripting support (NOTE: no idea what this is nor do we need it)
        const pdfScriptingManager = new scriptingManagerConstructor({
            eventBus,
            sandboxBundleSrc: scriptingSrc
        });

        // Construct PDFViewer for reference preview
        referenceViewer = new viewerConstructor({
            container,
            eventBus,
            linkService: referenceLinkService,
            findController: pdfFindController,
            scriptingManager: pdfScriptingManager,
            removePageBorders: true
        });
        referenceLinkService.setViewer(referenceViewer);
        pdfScriptingManager.setViewer(referenceViewer);

        eventBus.on("pagesinit", function () {
            // We can use referenceViewer now, e.g. let's change default scale.
            referenceViewer.currentScaleValue = "page-actual";

            zoomInButton.addEventListener("click", function () {
                if (referenceViewer.currentScale <= 9.8) {
                    referenceViewer.currentScale += 0.2;
                }
                
            });

            zoomOutButton.addEventListener("click", function () {
                if (referenceViewer.currentScale >= 0.3) {
                    referenceViewer.currentScale -= 0.2;
                }
            });
        });

        // Deep copy the active PDF document from the viewer
        let documentClone = Global.deepCopy(Global.viewer.pdfDocument);
        referenceViewer.setDocument(documentClone);
        referenceLinkService.setDocument(documentClone, null);

        // TODO: these are only temporary CSS adjustments; a better and more permanent solution is required
        container.style.position = 'relative';
        container.style.height = '150px';
        container.style.width = '240px';
        container.style.overflow = 'auto';

        return;
    }

    let buildReferenceList = async function () {
        if (Global.doc === null) {
            console.error("pdfDocument object is null. Cannot build reference list.");
            return;
        } else if (Global.isNull(zoomInButton)) {
            console.error("HTML div with id 'zoomInPreview' is null. Cannot create reference preview.");
            return;
        } else if (Global.isNull(zoomOutButton)) {
            console.error("HTML div with id 'zoomOutPreview' is null. Cannot create reference preview.");
            return;
        } else if (Global.isNull(referenceFilter)) {
            console.error("HTML div with id 'referenceFilterContainer' is null. Cannot create reference preview.");
            return;
        } else if (Global.isNull(referenceListContainer)) {
            console.error("HTML div with id 'referenceListContainer' is null. Cannot create reference preview.");
            return;
        }

        /*
        <input type="checkbox" id="findHighlightAll" class="toolbarField" tabindex="94">
        <label for="findHighlightAll" class="toolbarLabel" data-l10n-id="find_highlight">Highlight All</label>
                    
        */

        let keys = Object.keys(validReferences);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let referenceName = validReferences[key];
            let id = key + "Filter";

            let input = document.createElement("input");
            input.id = id
            input.type = "checkbox";
            input.classList.add('toolbarField');
            input.checked = true;
            input.addEventListener("click", function () {
                // Check is already toggled by the time this event fires
                if (input.checked) {
                    let checkboxes = referenceListContainer.getElementsByClassName(key);
                    for (let i = 0; i < checkboxes.length; i++) {
                        checkboxes[i].hidden = false;
                    }
                } else {
                    let checkboxes = referenceListContainer.getElementsByClassName(key);
                    for (let i = 0; i < checkboxes.length; i++) {
                        checkboxes[i].hidden = true;
                    }
                }
            });

            let label = document.createElement("label");
            label.htmlFor = id;
            label.classList.add('toolbarLabel')
            let labelTextNode = document.createTextNode(referenceName + "s");
            label.appendChild(labelTextNode);

            referenceFilter.appendChild(input);
            referenceFilter.appendChild(label);
        }

        // Get a list of all references in the PDF
        destinations = await Global.doc.getDestinations();
        keys = Object.keys(destinations);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i]; // fig0001
            let tag = key.split(/[0-9]/)[0]; // fig
            if (Global.isNull(validReferences[tag])) // Check if it is a valid reference
                continue;

            // Build reference if it is a valid reference
            let reference = {};
            reference.key = key;                        // fig0001
            reference.tag = tag;                        // fig
            reference.num = key.substring(tag.length);  // 0001
            reference.tagName = validReferences[tag];   // Figure
            reference.fullName = reference.tagName + " " + Number(reference.num); // Figure 1
            referenceList.push(reference);
        }

        // HTML building
        // We will create a tree structure of depth 2
        referenceListContainer.classList.add("treeWithDeepNesting");

        for (let i = 0; i < referenceList.length; i++) {
            // Top level div of reference
            let div = document.createElement("div");
            div.classList.add('treeItem')
            div.classList.add(referenceList[i].tag)

            // Toggler div is used to enable/disable the display of canvas
            let toggler = document.createElement('div');
            toggler.classList.add('treeItemToggler')
            toggler.classList.add('treeItemsHidden')

            // Link to go to the page when clicking the reference
            let link = document.createElement('a');
            let linkText = document.createTextNode(referenceList[i].fullName);
            link.appendChild(linkText);
            link.href = "#" + referenceList[i].key;
            link.addEventListener("click", function (evt) {
                if (evt.target !== null) { // TODO: implement this better
                    referenceLinkService.goToDestination(evt.target.hash.substring(1))
                }
            });

            div.appendChild(toggler);
            div.appendChild(link);
            referenceListContainer.appendChild(div);
        }

        return;
    }

    let setSize = function() {
        $("#referencesContainer").height($("#sidebarContent").innerHeight() * 0.4);
        $("#referencesContainer").width($("#sidebarContent").innerWidth() - 50);
    }

    // Execute initialize method after the document loads
    Clippy.addOnLoadEvent(ReferenceList.name, ReferenceList.initialize);
}(window.Clippy.ReferenceList = window.Clippy.ReferenceList || {}));
