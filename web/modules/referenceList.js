(function (ReferenceList) {
    // ReferenceList module start
    // Define module name as constant
    Object.defineProperty(ReferenceList, "name", {
        value: "ReferenceList",
        writable: false
    });

    let content = null;     // Parent div of content to be displayed in sidebar
    let container = null;   // Container for the viewer
    let viewer = null;      // Div of the viewer
    let referenceList = [];

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
            referenceViewer.currentScaleValue = "page-width";
        });

        // Deep copy the active PDF document from the viewer
        let documentClone = Global.deepCopy(Global.viewer.pdfDocument);
        referenceViewer.setDocument(documentClone);
        referenceLinkService.setDocument(documentClone, null);

        // TODO: these are only temporary CSS adjustments; a better and more pernament solution is required
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
        }

        // Get a list of all references in the PDF
        destinations = await Global.doc.getDestinations();
        let keys = Object.keys(destinations);
        for (let i = 0; i < keys.length; i++) {
            let reference = {};
            let key = keys[i];
            if (!key.startsWith('mk')) { // If key does not start with 'mk'
                let tag = key.split(/[0-9]/)[0];
                let numeric = key.substring(tag.length);

                reference.key = key;
                reference.tag = tag;
                reference.num = numeric;
                switch (reference.tag) {
                    case "aff":
                        reference.tagName = "AFF";
                        break;
                    case "bib":
                        reference.tagName = "Bibliography";
                        break;
                    case "cor":
                        reference.tagName = "Corresponding Author";
                        break;
                    case "crf":
                        reference.tagName = "CRF";
                        break;
                    case "eqn":
                        reference.tagName = "Equation";
                        break;
                    case "fig":
                        reference.tagName = "Figure";
                        break;
                    case "para":
                        reference.tagName = "Paragraph";
                        break;
                    case "sec":
                        reference.tagName = "Section";
                        break;
                    case "tbl":
                        reference.tagName = "Table";
                        break;
                    case "ueqn":
                        reference.tagName = "Inequation";
                        break;
                    default:
                        reference.tagName = reference.tag.toUpperCase()
                };
                reference.fullName = reference.tagName + " " + Number(reference.num);
                referenceList.push(reference);
            } else {
                // mk:H3_5
                let strSplit = (key.split(':')[1]).split('_');
                let type = strSplit[0]; // H3
                let numeric = strSplit[1]; // 5

                reference.key = key; // mk:H3_5
                reference.tag = key.split('_')[0]; // mk:H3
                reference.num = (typeof (numeric) === 'undefined' ? null : numeric); // 5

                reference.fullName = "";
                let name = type;
                if (name.startsWith("H")) {
                    for (let j = 0; j < type.length; j++) {
                        if (name[0] === 'H') {
                            reference.fullName += "Header ";
                            name = name.substring(1);
                        } else {
                            reference.fullName += ("Size " + name + " Number ");
                        }
                    }
                    reference.fullName += Number(reference.num);
                } else {
                    if (name === "title") {
                        reference.fullName = "Title";
                    }
                }
                referenceList.push(reference);
            }
        }

        // HTML building
        // We will create a tree structure of depth 2
        content.classList.add("treeWithDeepNesting");

        for (let i = 0; i < referenceList.length; i++) {
            let div = document.createElement("div");
            div.classList.add('treeItem')

            // Toggler to enable/disable the display of canvas
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
            content.appendChild(div);
        }

        return;
    }

    // Execute initialize method after the document loads
    Clippy.addOnLoadEvent(ReferenceList.name, ReferenceList.initialize);
}(window.Clippy.ReferenceList = window.Clippy.ReferenceList || {}));

function setSize(){
    $("#referencesContainer").height($("#sidebarContent").innerHeight() * 0.4);
    $("#referencesContainer").width($("#sidebarContent").innerWidth() - 50);
}

$(window).on("resize", function(){
    setSize();
})

$("#sidebarResizer").mousedown( function() {
    $(document).mousemove(function() {
        setSize();
    });
    
    $(document).mouseup(function() {
        $(this).unbind();
    });
});