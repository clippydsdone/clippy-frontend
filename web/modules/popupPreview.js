(function (PopupPreview) {
	// PopupPreview module start
	// Define module name as constant
	Object.defineProperty(PopupPreview, "name", {
		value: "PopupPreview",
		writable: false,
	});

	class PopupViewer {
		constructor(viewerIndex) {
			//Identifiers
			this.id = `popupViewer${viewerIndex}`;
			this.viewerIndex = viewerIndex;

			//Vars
			this.mouseovered = false;
			this.pinned = false;
			this.position = { x: 0.0, y: 0.0 };
			this.offset = { x: 0.0, y: 0.0 };

			//Load checking vars
			window[`pdfViewer${viewerIndex}Ready`] = false;
			window[`linkService${viewerIndex}Ready`] = false;

			this.popupWrapper = document.createElement("div");
			this.popupWrapper.setAttribute("id", `popupWrapper${viewerIndex}`);
			this.popupWrapper.setAttribute("class", `popupWrapper${viewerIndex}`);
			this.popupWrapper.style.position = "absolute"; //static|absolute|fixed|relative|sticky|initial|inherit
			this.popupWrapper.style.overflow = "hidden";
			this.popupWrapper.style.border = `${POPUP_BORDER_SIZE}px solid black`; //Draw border
			this.popupWrapper.style.backgroundColor = "#FFF";
			this.popupWrapper.style.zIndex = `${zIndex}`;
			this.popupWrapper.style.top = `${0}px`;

			this.zoomBar = document.createElement("div");
			this.zoomBar.setAttribute("id", `zoomBar${viewerIndex}`);
			this.zoomBar.style.position = "absolute";
			this.zoomBar.style.overflow = "hidden";
			this.zoomBar.style.backgroundColor = "#BBB";
			this.zoomBar.style.width = `22px`;
			this.zoomBar.style.height = `46px`;
			this.zoomBar.style.zIndex = `${zIndex}`;
			this.zoomBar.style.visibility = "hidden";
			this.zoomBar.style.top = `${0}px`;

			this.zoomInButton = document.createElement("BUTTON");
			this.zoomInButton.setAttribute("id", `zoomInButton${viewerIndex}`);
			this.zoomInButton.style.width = `22px`;
			this.zoomInButton.style.height = `22px`;
			this.zoomInButton.style.backgroundImage = "url(images/toolbarButton-zoomInPreview.svg)";
			this.zoomInButton.style.backgroundPosition = "2px center";
			this.zoomBar.appendChild(this.zoomInButton);

			this.zoomOutButton = document.createElement("BUTTON");
			this.zoomOutButton.setAttribute("id", `zoomOutButton${viewerIndex}`);
			this.zoomOutButton.style.width = `22px`;
			this.zoomOutButton.style.height = `22px`;
			this.zoomOutButton.style.backgroundImage = "url(images/toolbarButton-zoomOutPreview.svg)";
			this.zoomOutButton.style.backgroundPosition = "2px center";
			this.zoomBar.appendChild(this.zoomOutButton);

			this.popupDiv = document.createElement("div");
			this.popupDiv.setAttribute("id", `popupDiv${viewerIndex}`);
			this.popupDiv.style.position = "absolute"; //static|absolute|fixed|relative|sticky|initial|inherit
			this.popupDiv.style.overflow = "scroll";
			this.popupDiv.style.width = "100%";
			this.popupDiv.style.height = "100%";
			this.popupDiv.style.zoom = 1.0;

			this.popupContainerDiv = document.createElement("div");
			this.popupContainerDiv.setAttribute("id", `popupContainer${viewerIndex}`);
			this.popupContainerDiv.setAttribute("style", "position:absolute");

			this.popupViewerDiv = document.createElement("div");
			this.popupViewerDiv.setAttribute("id", `popupViewer${viewerIndex}`);
			this.popupViewerDiv.setAttribute("class", "pdfViewer");

			document.body.appendChild(this.popupWrapper);
			this.popupWrapper.appendChild(this.popupDiv);
			this.popupDiv.appendChild(this.popupContainerDiv);
			this.popupContainerDiv.appendChild(this.popupViewerDiv);
			document.body.appendChild(this.zoomBar);

			//JQuery resize & drag functions
			$(`#popupWrapper${this.viewerIndex}`)
				.resizable({
					handles: "all",
					resize: function (event, ui) {
						document.getElementById(`zoomBar${viewerIndex}`).style.left = `${ui.position.left - 22}px`;
						document.getElementById(`zoomBar${viewerIndex}`).style.top = `${ui.position.top}px`;
					},
				})
				.draggable({
					drag: function (event, ui) {
						document.getElementById(`zoomBar${viewerIndex}`).style.left = `${ui.position.left - 22}px`;
						document.getElementById(`zoomBar${viewerIndex}`).style.top = `${ui.position.top}px`;
					},
				});

			//Event Listeners
			this.popupWrapper.addEventListener("mouseover", (event) => {
				currentlyMouseoverdPinnedPopup = this.id;
				if (!this.pinned) {
					this.hide();
				}
			});
			this.popupWrapper.addEventListener("mouseleave", (event) => {
				currentlyMouseoverdPinnedPopup = null;
			});
			//If we have multiple popup open if we click one then it should
			//be rendered infront
			this.popupWrapper.addEventListener("mousedown", (event) => {
				this.popupWrapper.style.zIndex = `${++zIndex}`;
				this.zoomBar.style.zIndex = `${zIndex}`;
			});

			this.zoomInButton.addEventListener("click", function () {
				let index = this.id.replace("zoomInButton", "");
				let newZoom = parseFloat(document.getElementById(`popupDiv${index}`).style.zoom) + 0.1;
				document.getElementById(`popupDiv${index}`).style.zoom = newZoom;
			});

			this.zoomOutButton.addEventListener("click", function () {
				let index = this.id.replace("zoomOutButton", "");
				let newZoom = parseFloat(document.getElementById(`popupDiv${index}`).style.zoom) - 0.1;
				document.getElementById(`popupDiv${index}`).style.zoom = newZoom;
			});

			//PDFJS elements
			const eventBus = new Global.app.eventBus.constructor();
			const pdfScriptingManager = new Global.app.pdfViewer._scriptingManager.constructor({
				eventBus: eventBus,
				sandboxBundleSrc: "../" + Global.app.pdfViewer._scriptingManager._sandboxBundleSrc,
			});

			window["linkService_" + viewerIndex] = new Global.app.pdfLinkService.constructor({
				eventBus: eventBus,
			});

			window["pdfViewer_" + viewerIndex] = new Global.app.pdfViewer.constructor({
				container: this.popupContainerDiv,
				eventBus: eventBus,
				linkService: window["linkService_" + viewerIndex],
				scriptingManager: pdfScriptingManager,
				removePageBorders: true,
			});

			window["linkService_" + viewerIndex].setViewer(window["pdfViewer_" + viewerIndex]);
			pdfScriptingManager.setViewer(window["pdfViewer_" + viewerIndex]);

			eventBus.on("pagesinit", function () {
				//We can use popupViewer now, e.g. let's change default scale.
				window["pdfViewer_" + viewerIndex].currentScaleValue = "page-width";
			});

			//thrown from then end of pdfViewer.setDocument() in viewer.js on line 8439 by
			//this.eventBus.dispatch("pdfViewerReady", { source: this });
			eventBus.on("pdfViewerReady", function () {
				window[`pdfViewer${viewerIndex}Ready`] = true;
			});
			//thrown from then end of PDFLinkService.setDocument() in viewer.js on line 898 by
			//this.eventBus.dispatch("linkServiceReady", { source: this });
			eventBus.on("linkServiceReady", function () {
				window[`linkService${viewerIndex}Ready`] = true;
			});

			//Deep copy the active PDF document from the viewer
			let documentClone = Global.deepCopy(Global.viewer.pdfDocument);
			window["linkService_" + viewerIndex].setDocument(documentClone, null);
			window["pdfViewer_" + viewerIndex].setDocument(documentClone);
		}

		//Functions
		isBeingMouseovered() {
			return this.mouseovered;
		}

		pin() {
			this.popupWrapper.style.border = `${POPUP_PINNED_BORDER_SIZE}px solid black`;
			this.pinned = true;
		}

		getID() {
			return this.id;
		}

		show() {
			this.popupWrapper.style.visibility = "visible";
			this.zoomBar.style.visibility = "visible";
		}

		hide() {
			this.popupWrapper.style.visibility = "hidden";
			this.zoomBar.style.visibility = "hidden";
		}

		isHidden() {
			return this.popupWrapper.style.visibility == "hidden";
		}

		setSize(width, height) {
			this.popupWrapper.style.width = `${width}px`;
			this.popupWrapper.style.height = `${height}px`;
		}

		setZoom(zoomAmt) {
			this.popupDiv.style.zoom = zoomAmt;
		}

		setPosition(x, y) {
			this.position.x = x;
			this.position.y = y;
			this.popupWrapper.style.left = `${this.position.x + this.offset.x}px`;
			this.popupWrapper.style.top = `${this.position.y + this.offset.y}px`;
			this.zoomBar.style.left = `${this.position.x + this.offset.x - 22}px`;
			this.zoomBar.style.top = `${this.position.y + this.offset.y}px`;
		}

		setOffset(offX, offY) {
			this.offset.x = offX;
			this.offset.y = offY;
			this.popupWrapper.style.left = `${this.position.x + this.offset.x}px`;
			this.popupWrapper.style.top = `${this.position.y + this.offset.y}px`;
			this.zoomBar.style.left = `${this.position.x + this.offset.x - 22}px`;
			this.zoomBar.style.top = `${this.position.y + this.offset.y}px`;
		}

		setCurrentScale(scale) {
			window["pdfViewer_" + this.viewerIndex].currentScale = scale;
		}

		scalePopupWindow(scale) {
			this.popupDiv.style.zoom = scale;
			this.popupDiv.style.transform = `scale(${scale})`;
		}

		getCurrentScale() {
			return window["pdfViewer_" + this.viewerIndex].currentScale;
		}

		async goToDestination(refDest) {
			return await window["linkService_" + this.viewerIndex].goToDestination(refDest);
		}

		async getPage(pageNum) {
			return await window["pdfViewer_" + this.viewerIndex].pdfDocument.getPage(pageNum);
		}

		isLoaded() {
			return window[`pdfViewer${this.viewerIndex}Ready`] && window[`linkService${this.viewerIndex}Ready`];
		}

		destroy() {
			//Remove viewers from variables
			window["pdfViewer_" + this.viewerIndex] = null;
			window["linkService_" + this.viewerIndex] = null;
			window[`pdfViewer${this.viewerIndex}Ready`] = null;
			window[`linkService${this.viewerIndex}Ready`] = null;

			//Remove divs
			document.getElementById(`popupWrapper${this.viewerIndex}`).remove();
			document.getElementById(`zoomBar${this.viewerIndex}`).remove();
		}
	}

	let isPreviewing = false;
	let viewerDiv = null; // main app viewer div.
	const keyUsedToPinPopup = "e";
	const popupRefDict = {};
	let currentViewerIndex = 1;
	let currentViewer = null;
	let currentlyMouseoverdPinnedPopup = null;
	let zIndex = 10;
	const POPUP_INIT_SCALE = 0.7;
	const POPUP_BORDER_SIZE = 4;
	const POPUP_PINNED_BORDER_SIZE = 6;
	let popupTooltipDiv;

	// Initializer method
	PopupPreview.initialize = async function () {
		if (Global.isNull(Global.doc)) {
			setTimeout(PopupPreview.initialize, 100);
		} else {
			console.log("Initializing PopupPreview.");

			viewerDiv = document.getElementById("viewer"); // Main non-popup viewer
			currentViewer = new PopupViewer(currentViewerIndex);
			PopupPreview.togglePreview();
			initPopupTooltipDiv();
		}
	};

	let initPopupTooltipDiv = function () {
		popupTooltipDiv = document.createElement("div");
		popupTooltipDiv.setAttribute("id", `popupTooltipDiv1`);
		popupTooltipDiv.style.position = "absolute"; //static|absolute|fixed|relative|sticky|initial|inherit
		popupTooltipDiv.style.backgroundColor = "#f5dd9a";
		popupTooltipDiv.style.borderStyle = "dashed";
		popupTooltipDiv.innerHTML = `Press "${keyUsedToPinPopup}" to pin/unpin popup window`;
		popupTooltipDiv.style.visibility = "hidden";
		popupTooltipDiv.style.zIndex = "999";
		popupTooltipDiv.style.top = `${0}px`;
		document.body.appendChild(popupTooltipDiv);
	};

	let showPopupTooltipDiv = function (x, y) {
		let p = document.getElementById("popupTooltipDiv1");
		p.style.visibility = "visible";
		p.style.left = `${x + 25}px`;
		p.style.top = `${y - 25}px`;
	};

	let hidePopupTooltipDiv = function () {
		popupTooltipDiv.style.visibility = "hidden";
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
		Global.app.__onMouseOver = onMouseOver;
		viewerDiv.addEventListener("mouseover", Global.app.__onMouseOver);

		Global.app.__onKeyDown = onKeyDown;
		document.addEventListener("keydown", Global.app.__onKeyDown);
	};

	let previewOff = function () {
		viewerDiv.removeEventListener("mouseover", Global.app.__onMouseOver);
		delete Global.app.__onMouseOver;

		document.removeEventListener("keydown", Global.app.__onKeyDown);
		delete Global.app.__onKeyDown;
	};

	let onMouseOver = async function (event) {
		currentViewer.hide();

		//Filter pdfjs reference links, yes it is "A" by default
		if (event.target.nodeName == "A") {
			if (event.target.hash != undefined) {
				currentViewer.show();
				await previewFunc(event);
			}
		}
	};

	let pinCurrentViewer = function () {
		currentViewer.pin();
		popupRefDict[currentViewer.getID()] = currentViewer;
		currentViewerIndex++;
		currentViewer = new PopupViewer(currentViewerIndex);
	};

	let unpinViewer = function (referenceID) {
		currentlyMouseoverdPinnedPopup = null;
		if (popupRefDict[referenceID] != null && popupRefDict[referenceID] != undefined) {
			popupRefDict[referenceID].destroy();
			popupRefDict[referenceID] = null;
			delete popupRefDict[referenceID];
		}
	};

	let onKeyDown = async function (event) {
		if (event.key == keyUsedToPinPopup) {
			event.stopPropagation();

			//If we are mouseovering a pinned popup window
			if (currentlyMouseoverdPinnedPopup != null) {
				unpinViewer(currentlyMouseoverdPinnedPopup);
			}
			//If we are mouseovering a popup that is currently being shown
			//(because we preload the viewer and keep hidden until something is mouseovered)
			else if (!currentViewer.isHidden()) {
				pinCurrentViewer();
			}
		}
	};

	/**
	 * @param {mouseover} event
	 **/
	let previewFunc = async function (event) {
		//event.target		 		gets the full path of the internal link.
		//event.target.hash 		gets the reference ID with a hash prefix i.e. #bib00012 or #fig0001.
		const referenceID = event.target.hash.substring(1); //Removes the # from #fig0001.

		showPopupTooltipDiv(event.clientX, event.clientY);

		//Hyperlink Parent
		const refParent = event.target.parentElement;
		let refBoundingRect = refParent.getBoundingClientRect();

		refParent.addEventListener("mouseleave", function () {
			hidePopupTooltipDiv();
		});

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

		//Clears out errors caused by mouseover'ing non reference hyperlinks.
		if (refDestination == null) {
			return;
		}

		//wait until viewer is fully loaded. If you are really fast you can mouseover a reference
		//before the viewer is fully loaded which causes the viewer do display incorrectly
		while (!currentViewer.isLoaded()) {
			await new Promise((r) => setTimeout(r, 50));
		}

		//We need to reset the scale or or they will be multiplied time we call goToDestination().
		currentViewer.setCurrentScale(1.0);
		//Goto destination in the popupViewer
		await currentViewer.goToDestination(refDestination);

		//Estimate the size of popup windows based on the viewport of the internal popupViewer viewport
		const pageNum = Global.linker._cachedPageNumber(refDestination[0]);
		currentViewer.getPage(pageNum).then(function (pdfPage) {
			/**
			 * @param {double} Global.viewer.currentScale 	the Zoom amount inside of the viewer
			 * @param {double} event.clientX	Mouse coordinate X
			 * @param {double} event.clientY	Mouse coordinate Y
			 **/

			let maxHeight;

			//Scale content of popup by zooming to appropriate level
			currentViewer.setZoom(POPUP_INIT_SCALE);

			const type = referenceID.replaceAll(/[0-9]/g, ""); // fig,tbl,bib,eqn
			if (type == "tbl") {
				let viewPort = pdfPage.getViewport({ scale: POPUP_INIT_SCALE });
				maxHeight = viewPort.height * currentViewer.getCurrentScale() < pdfPage.view[3] * 0.5 ? viewPort.height * currentViewer.getCurrentScale() : pdfPage.view[3] * 0.5;
				currentViewer.setSize(refDestination[4] * currentViewer.getCurrentScale(), maxHeight);

				let x = refBoundingRect.x + refBoundingRect.width / 2;
				let y = refBoundingRect.y + refBoundingRect.height / 2;

				currentViewer.setPosition(x, y);

				if (event.clientY > screen.height / 2) {
					currentViewer.setOffset(-((viewPort.width / 2) * currentViewer.getCurrentScale()), -(refBoundingRect.height + maxHeight + POPUP_PINNED_BORDER_SIZE));
				} else {
					currentViewer.setOffset(-((viewPort.width / 2) * currentViewer.getCurrentScale()), refBoundingRect.height);
				}
			} else {
				let viewPort = pdfPage.getViewport({ scale: currentViewer.getCurrentScale() * POPUP_INIT_SCALE });
				maxHeight = viewPort.height * currentViewer.getCurrentScale() < pdfPage.view[3] * 0.5 ? viewPort.height * currentViewer.getCurrentScale() : pdfPage.view[3] * 0.5;
				currentViewer.setSize(viewPort.width * currentViewer.getCurrentScale(), maxHeight);

				let x = refBoundingRect.x + refBoundingRect.width / 2;
				let y = refBoundingRect.y + refBoundingRect.height / 2;

				currentViewer.setPosition(x, y);

				if (event.clientY > screen.height / 2) {
					currentViewer.setOffset(-((viewPort.width / 2) * currentViewer.getCurrentScale()), -(refBoundingRect.height + maxHeight + POPUP_PINNED_BORDER_SIZE));
				} else {
					currentViewer.setOffset(-((viewPort.width / 2) * currentViewer.getCurrentScale()), refBoundingRect.height);
				}
			}
		});
	};

	Clippy.addOnLoadEvent(PopupPreview.name, PopupPreview.initialize);
})((window.Clippy.PopupPreview = window.Clippy.PopupPreview || {}));
