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
    let referenceFilterButton = null;
    let referencesNotFoundText = null;

    // Reference List elements
    let allReferencesList = [];
    let validReferences = [
        /*
        "aff": "AFF"
        "para": "Paragraph",
        "sec": "Section",
        "crf": "CRF",
        */
        {
            fullName: "Bibliography",
            fullNames: "Bibliographies",
            tags: ["bib", "B"],
            referenceList: [],
            counter: 0
        },
        {
            fullName: "Citation",
            fullNames: "Citations",
            tags: ["cite"],
            referenceList: [],
            counter: 0
        },
        {
            fullName: "Corresponding Author",
            fullNames: "Corresponding Authors",
            tags: ["cor"],
            referenceList: [],
            counter: 0
        },        
        {
            fullName: "Equation",
            fullNames: "Equations",
            tags: ["eqn", "equation"],
            referenceList: [],
            counter: 0
        },
        {
            fullName: "Figure",
            fullNames: "Figures",
            tags: ["fig", "figure"],
            referenceList: [],
            counter: 0
        },
        {
            fullName: "Table",
            fullNames: "Tables",
            tags: ["tbl", "table"],
            referenceList: [],
            counter: 0
        },
        {
            fullName: "Inequation",
            fullNames: "Inequations",
            tags: ["ueqn", "B"],
            referenceList: [],
            counter: 0
        },
        {
            fullName: "Reference",
            fullNames: "Unsorted",
            tags: [],
            referenceList: [],
            counter: 0
        }
    ];

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
        referenceFilterButton = document.getElementById('referenceFilters');
        referencesNotFoundText = document.getElementById('referencesNotFoundText');

        referenceFilter.hidden = true;

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
        container.style.overflow = 'auto';
        setSize();

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
        } else if (Global.isNull(referencesNotFoundText)) {
            console.error("HTML div with id 'referencesNotFoundText' is null. Cannot create reference preview.");
            return;
        }

        // HTML Building of reference filter
        for (let i = 0; i < validReferences.length; i++) {
            let key = validReferences[i].tags[0];
            let referenceName = validReferences[i].fullNames;
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
            let labelTextNode = document.createTextNode(referenceName);
            label.appendChild(labelTextNode);

            referenceFilter.appendChild(input);
            referenceFilter.appendChild(label);
        }

        // Add event listener to open/close the filter
        referenceFilterButton.addEventListener("click", function () {
            if (referenceFilter.hidden) { // Now the filter is visible
                // Change coordinates of the filter
                let coordinates = referenceFilterButton.getBoundingClientRect();
                referenceFilter.style.left = coordinates.left + 32 + 'px';
                referenceFilter.style.top = coordinates.top - 5 + 'px';

                referenceFilter.hidden = false;
                referenceFilterButton.setAttribute("aria-checked", true);
            } else { // The filter is no longer visible
                referenceFilter.hidden = true;
                referenceFilterButton.setAttribute("aria-checked", false);
            }
        })

        // Get a list of all references in the PDF and create Clippy objects from these references
        destinations = await Global.doc.getDestinations();
        let keys = Object.keys(destinations);
        if (keys.length === 0) {
            referencesNotFoundText.classList.remove('hidden')
            return;
        }
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i]; // fig0001
            let tag = key.split(/[0-9]/)[0]; // fig
            validReference = isValidReference(tag); // Get validReference object
            if (validReference == null) // Check if it is an invalid reference
                continue;

            // Build reference if it is a valid reference
            let reference = {};
            reference.key = key;                        // fig0001
            reference.tag = tag;                        // fig
            reference.num = validReference.counter;     // 0001
            reference.tagName = validReference.fullName;   // Figure
            reference.fullName = reference.tagName + " " + Number(reference.num); // Figure 1
            validReference.referenceList.push(reference);
            allReferencesList.push(reference);
        }
        if (allReferencesList.length === 0) {
            referencesNotFoundText.classList.remove('hidden')
            return;
        }

        // Annotations that are links
        

        // HTML building of list of references
        // We will create a tree structure of depth 2
        referenceListContainer.classList.add("treeWithDeepNesting");
        for (let i = 0; i < validReferences.length; i++) {
            if (validReferences[i].referenceList.length == 0)
                continue;

            let key = validReferences[i].tags[0];
            let referenceName = validReferences[i].fullNames;
            let id = key + "Group";

            // Top level div of reference
            let referenceGroupDiv = document.createElement("div");
            referenceGroupDiv.classList.add('treeItem');
            referenceGroupDiv.classList.add(key);
            referenceGroupDiv.id = id;

            let linkGroup = document.createElement('a');
            let linkGroupText = document.createTextNode(referenceName);
            linkGroup.appendChild(linkGroupText);
            linkGroup.addEventListener("click", function (evt) {
                toggler.classList.toggle("treeItemsHidden");
            })
            
            // Toggler div is used to enable/disable the display of canvas
            let toggler = document.createElement('div');
            toggler.classList.add('treeItemToggler')
            toggler.classList.add('treeItemsHidden')
            toggler.addEventListener("click", function (evt) {
                toggler.classList.toggle("treeItemsHidden");
            })

            let referencesDiv = document.createElement("div");
            referencesDiv.classList.add('treeItems');
            for (let j = 0; j < validReferences[i].referenceList.length; j++) {
                let reference = validReferences[i].referenceList[j];

                // Top level div of reference
                let referenceDiv = document.createElement("div");
                referenceDiv.classList.add('treeItem');
                referenceDiv.classList.add(key)

                // Link to go to the page when clicking the reference
                let link = document.createElement('a');
                let linkText = document.createTextNode(reference.fullName);
                link.appendChild(linkText);
                link.href = "#" + reference.key;
                link.addEventListener("click", function (evt) {
                    Global.preventMainViewerLinkerFlag = true;  // TODO: find a better solution
                    if (evt.target !== null) {
                        referenceLinkService.goToDestination(evt.target.hash.substring(1))

                        // Scroll up to Preview when reference is clicked
                        $(document.getElementById('sidebarContent')).scrollTop(0);
                    }
                });

                // Text field for renaming reference
                let renameTextField = document.createElement("input");
                renameTextField.type = "text";
                renameTextField.classList.add('toolbarField');
                renameTextField.value = link.innerText;
                renameTextField.hidden = true;

                // Rename reference button
                let renameButton = document.createElement('button');
                renameButton.classList.add('toolbarButton')
                renameButton.classList.add('renameButton')
                renameButton.addEventListener("click", function () {
                    if (link.hidden) {
                        link.innerText = renameTextField.value;
                        link.hidden = false;
                        renameTextField.hidden = true;
                    } else {
                        link.hidden = true;
                        renameTextField.hidden = false;
                    }
                });
                
                referenceDiv.appendChild(link);
                referenceDiv.appendChild(renameTextField)
                referenceDiv.appendChild(renameButton);

                referencesDiv.appendChild(referenceDiv);
            }

            referenceGroupDiv.appendChild(toggler);
            referenceGroupDiv.appendChild(linkGroup);
            referenceGroupDiv.appendChild(referencesDiv);

            referenceListContainer.appendChild(referenceGroupDiv);
        } 

        return;
    }

    let setSize = function() {
        $("#referencesContainer").height($("#sidebarContent").innerHeight() * 0.40);
        $("#referencesContainer").width($("#sidebarContent").innerWidth() - 50);

        // If it is not hidden
        if (!referenceFilter.hidden) {
            referenceFilter.hidden = true;
            referenceFilterButton.setAttribute("aria-checked", false);
        }
    }

    let isValidReference = function (tag) {
        let validTags = [];

        for (let i = 0; i < validReferences.length; i++) {
            for (let j = 0; j < validReferences[i].tags.length; j++) {
                if (tag.startsWith(validReferences[i].tags[j])) {
                    validReferences[i].counter++;
                    return validReferences[i];
                }  
            }
        }
       
        return null;
    }

    // Execute initialize method after the document loads
    Clippy.addOnLoadEvent(ReferenceList.name, ReferenceList.initialize);
}(window.Clippy.ReferenceList = window.Clippy.ReferenceList || {}));
