(function (PopupPreview) {
	// PopupPreview module start
	// Define module name as constant
	Object.defineProperty(PopupPreview, "name", {
		value: "PopupPreview",
		writable: false
	});

	let isPreviewing = false;
	let popupPdfViewer = null;
	let popupLinkService = null;
	let popupDiv = null;		// Parent div of content to be displayed in popup, this can be moved
	let popupContainer = null;  // Container for the viewer div, this cannot be moved, needs to be {position = "absolute"}
	let popupViewer = null;		// Div of the popup viewer
	let viewerDiv = null;		// main app viewer div.

	// Initializer method
	PopupPreview.initialize = async function () {
		if (Global.isNull(Global.doc)) {
			setTimeout(PopupPreview.initialize, 100);
		} else {
			console.log("Initializing PopupPreview.");

			viewerDiv = document.getElementById("viewer"); // Main non-popup viewer
			popupDiv = document.getElementById("popupView");
			popupContainer = document.getElementById("popupContainer");
			popupViewer = document.getElementById("popupViewer");

			createPopupPreview();
			PopupPreview.togglePreview();
		}
	};

	//Incase we want the option to turn previewing off.
	PopupPreview.togglePreview = function () {
		if (isPreviewing) {
			previewOff();
			isPreviewing = true;
		} else {
			previewOn();
			isPreviewing = false;
		}
	};

	let previewOn = function () {
		//console.log("Popup preview is enabled");
		Global.app.__previewFunc = previewFunc;
		viewerDiv.addEventListener("mouseover", Global.app.__previewFunc);
	};

	let previewOff = function () {
		//console.log("Popup preview is disabled");
		viewerDiv.removeEventListener("mouseover", Global.app.__previewFunc);
		delete Global.app.__previewFunc;
	};

	/**
	 * @param {mouseover} event
	 **/

	let previewFunc = async function (event) {
		//Make sure something is being mouseovered before we try to manipulate it.
		if (event.type != "mouseover" || event.target.hash == undefined) {
			return;
		}

		// event.target		 		gets the full path of the internal link.
		// event.target.hash 		gets the reference ID with a hash prefix i.e. #bib00012 or #fig0001.
		const referenceID = event.target.hash.substring(1); //Removes the # from #fig0001.
		const refParent = event.target.parentElement; //Essentially the area/div containing the reference text i.e [Fig 1]

		/**
		 * ---- ref : basically a JSON array ----
		 * @param refDestination[0] = {{int} num, {int} gen} //Accessed as ref[0].num or ref[0].gen
		 * @param refDestination[1] = {{String} name} //"FitR", "FitV", "XYZ", Accessed as ref[1].name
		 * @param refDestination[2] = {double} x?
		 * @param refDestination[3] = {double} y?
		 * @param refDestination[4] = {double} width?
		 * @param refDestination[5] = {double} height?
		 **/

		//Get the destination(where the reference is pointing to).
		const refDestination = await Global.doc.getDestination(referenceID);

		//Clears out errors caused by non reference hyperlinks.
		if (refDestination == null) {
			return;
		}

		//Goto destination in the popupViewer
		popupPdfViewer.currentScale = 1.0; // We need to reset the scale or or they will be multiplied each mouseover.
		popupLinkService.goToDestination(refDestination);

		//Figure out the size of popup windows based on the viewport of the internal popupViewer viewport
		const pageNum = Global.linker._cachedPageNumber(refDestination[0]);
		popupPdfViewer.pdfDocument.getPage(pageNum).then(function (pdfPage) {
			/**
			 * @param {double} Global.viewer.currentScale 	the Zoom amount inside of the viewer
			 * @param {double} event.clientX	Mouse coordinate X
			 * @param {double} event.clientY	Mouse coordinate Y
			 **/

			const type = referenceID.replaceAll(/[0-9]/g, ""); // fig,tbl,bib,eqn
			if (type == "tbl") {
				//Tables do not seem to match the other reference styles.
				let viewPort = pdfPage.getViewport({ scale: 1.0 });
				let left = event.clientX;
				left -= viewPort.width / popupPdfViewer.currentScale / 2;

				popupDiv.style.top = `${event.clientY + 2}px`;
				popupDiv.style.width = `${refDestination[4] * popupPdfViewer.currentScale}px`;
				popupDiv.style.height = `${viewPort.height * popupPdfViewer.currentScale}px`;
				popupDiv.style.left = `${left}px`;
				popupDiv.style.visibility = "visible";
			} else {
				let viewPort = pdfPage.getViewport({ scale: popupPdfViewer.currentScale });
				popupDiv.style.top = `${event.clientY + 2}px`;
				popupDiv.style.width = `${viewPort.width * popupPdfViewer.currentScale}px`;
				popupDiv.style.height = `${viewPort.height * popupPdfViewer.currentScale}px`;
				popupDiv.style.left = `${event.clientX - (viewPort.width / 2) * popupPdfViewer.currentScale}px`;
				popupDiv.style.visibility = "visible";
			}
		});

		//Add new listener so when we "mouseleave" the reference area the popup div is hidden.
		refParent.addEventListener(
			"mouseleave",
			() => {
				popupDiv.style.visibility = "hidden";
			},
			{ once: true }
		);
	};

	let createPopupPreview = async function () {
		if (Global.isNull(Global.app)) {
			console.error("PDFViewerApplication object is null. Cannot create reference popup preview.");
			return;
		} else if (Global.isNull(Global.app.pdfViewer)) {
			console.error("PDFViewer object is null. Cannot create reference popup preview.");
			return;
		} else if (Global.isNull(viewerDiv)) {
			console.error("HTML div with id 'viewerDiv' is null. Cannot create reference popup preview.");
			return;
		} else if (Global.isNull(popupDiv)) {
			console.error("HTML div with id 'popupDiv' is null. Cannot create reference popup preview.");
			return;
		} else if (Global.isNull(popupContainer)) {
			console.error("HTML div with id 'popupContainer' is null. Cannot create reference popup preview.");
			return;
		} else if (Global.isNull(popupViewer)) {
			console.error("HTML div with id 'popupViewer' is null. Cannot create reference popup preview.");
			return;
		}

		// Get constructors for required objects for PDFViewer
		let eventBusConstructor = Global.app.eventBus.constructor;
		let linkServiceConstructor = Global.app.pdfLinkService.constructor;
		//let findControllerConstructor = Global.app.pdfViewer.findController.constructor;
		let scriptingManagerConstructor = Global.app.pdfViewer._scriptingManager.constructor;
		let scriptingSrc = "../" + Global.app.pdfViewer._scriptingManager._sandboxBundleSrc;
		let viewerConstructor = Global.app.pdfViewer.constructor;

		// Create event bus for reference preview
		const popupEventBus = new eventBusConstructor();

		// Enable hyperlinks within PDF files
		popupLinkService = new linkServiceConstructor({
			eventBus: popupEventBus,
		});

		// (Optionally) enable find controller. (NOTE: no idea what this is nor do we need it)
		//const pdfFindController = new findControllerConstructor({
		//	eventBus,
		//	linkService: popupLinkService,
		//});

		//(Optionally) enable scripting support (NOTE: no idea what this is nor do we need it)
		const pdfScriptingManager = new scriptingManagerConstructor({
			eventBus: popupEventBus,
			sandboxBundleSrc: scriptingSrc,
		});

		// Construct popupViewer for popup preview
		popupPdfViewer = new viewerConstructor({
			container: popupContainer,
			eventBus: popupEventBus,
			linkService: popupLinkService,
			//findController: pdfFindController,
			//scriptingManager: pdfScriptingManager,
			removePageBorders: true,
		});

		popupLinkService.setViewer(popupPdfViewer);
		pdfScriptingManager.setViewer(popupPdfViewer);

		popupEventBus.on("pagesinit", function () {
			// We can use popupViewer now, e.g. let's change default scale.
			popupPdfViewer.currentScaleValue = "page-width";
		});

		// Deep copy the active PDF document from the viewer
		let documentClone = Global.deepCopy(Global.viewer.pdfDocument);
		popupPdfViewer.setDocument(documentClone);
		popupLinkService.setDocument(documentClone, null);

		popupDiv.style.position = "fixed"; //static|absolute|fixed|relative|sticky|initial|inherit
		popupDiv.style.overflow = "hidden";
		popupDiv.style.border = "1px solid black"; //Draw border
		popupDiv.style.zIndex = "99"; //z-depth / layer, higher value = more infront

		return;
	};

	Clippy.addOnLoadEvent(PopupPreview.name, PopupPreview.initialize);
})((window.Clippy.PopupPreview = window.Clippy.PopupPreview || {}));
