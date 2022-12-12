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
			this.mouseDown = false;
			this.position = { x: 0.0, y: 0.0 };
			this.offset = { x: 0.0, y: 0.0 };
			this.viewerDrag_MouseStartPosition = { x: 0.0, y: 0.0 };
			this.viewerDrag_ViewerStartPosition = { x: 0.0, y: 0.0 };

			//Load checking vars
			window[`pdfViewer${viewerIndex}Ready`] = false;
			window[`linkService${viewerIndex}Ready`] = false;

			//HTML div stucts
			this.popupDiv = document.createElement("div");
			this.popupDiv.setAttribute("id", `popupDiv${viewerIndex}`);
			this.popupDiv.style.position = "fixed"; //static|absolute|fixed|relative|sticky|initial|inherit
			this.popupDiv.style.overflow = "hidden";
			this.popupDiv.style.border = "1px solid black"; //Draw border
			this.popupDiv.style.zIndex = `${zIndex}`; //z-depth / layer, higher value = more infront
			this.popupDiv.style.zoom = POPUP_WINDOW_SCALE;

			this.popupContainerDiv = document.createElement("div");
			this.popupContainerDiv.setAttribute("id", `popupContainer${viewerIndex}`);
			this.popupContainerDiv.setAttribute("style", "position:absolute");

			this.popupViewerDiv = document.createElement("div");
			this.popupViewerDiv.setAttribute("id", `popupViewer${viewerIndex}`);
			this.popupViewerDiv.setAttribute("class", "pdfViewer");

			document.body.appendChild(this.popupDiv);
			this.popupDiv.appendChild(this.popupContainerDiv);
			this.popupContainerDiv.appendChild(this.popupViewerDiv);

			//Event Listeners
			this.popupDiv.addEventListener("mouseover", (event) => {
				currentlyMouseoverdPinnedPopup = this.id;
				if (!this.pinned) {
					this.hide();
				}
			});
			this.popupDiv.addEventListener("mouseleave", (event) => {
				currentlyMouseoverdPinnedPopup = null;
			});

			this.popupDiv.addEventListener("mousedown", (event) => {
				this.viewerDrag_ViewerStartPosition.x = this.position.x;
				this.viewerDrag_ViewerStartPosition.y = this.position.y;
				this.viewerDrag_MouseStartPosition.x = event.clientX;
				this.viewerDrag_MouseStartPosition.y = event.clientY;
				this.popupDiv.style.zIndex = `${++zIndex}`;
				this.mouseDown = true;
			});
			this.popupDiv.addEventListener("mouseup", (event) => {
				this.mouseDown = false;
			});
			this.popupDiv.addEventListener("mousemove", (event) => {
				if (this.mouseDown) {
					let newX = this.viewerDrag_ViewerStartPosition.x + (event.clientX - this.viewerDrag_MouseStartPosition.x) * (1.0 / POPUP_WINDOW_SCALE);
					let newY = this.viewerDrag_ViewerStartPosition.y + (event.clientY - this.viewerDrag_MouseStartPosition.y) * (1.0 / POPUP_WINDOW_SCALE);
					this.setPosition(newX, newY);
				}
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
				removePageBorders: true,
			});

			window["linkService_" + viewerIndex].setViewer(window["pdfViewer_" + viewerIndex]);
			pdfScriptingManager.setViewer(window["pdfViewer_" + viewerIndex]);

			eventBus.on("pagesinit", function () {
				//We can use popupViewer now, e.g. let's change default scale.
				window["pdfViewer_" + viewerIndex].currentScaleValue = "page-width";
			});

			//thrown from then end of pdfViewer.setDocument() and linkService.setDocument() in viewer.js
			eventBus.on("pdfViewerReady", function () {
				window[`pdfViewer${viewerIndex}Ready`] = true;
			});
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
			this.popupDiv.style.border = "3px solid black";
			this.popupDiv.style.overflow = "scroll";
			this.pinned = true;
		}

		getID() {
			return this.id;
		}

		show() {
			this.popupDiv.style.visibility = "visible";
		}

		hide() {
			this.popupDiv.style.visibility = "hidden";
		}

		isHidden() {
			return this.popupDiv.style.visibility == "hidden";
		}

		setSize(width, height) {
			this.popupDiv.style.width = `${width}px`;
			this.popupDiv.style.height = `${height}px`;
		}

		setPosition(x, y) {
			this.position.x = x;
			this.position.y = y;
			this.popupDiv.style.left = `${this.position.x + this.offset.x}px`;
			this.popupDiv.style.top = `${this.position.y + this.offset.y}px`;
		}

		setOffset(offX, offY) {
			this.offset.x = offX;
			this.offset.y = offY;
			this.popupDiv.style.left = `${this.position.x + this.offset.x}px`;
			this.popupDiv.style.top = `${this.position.y + this.offset.y}px`;
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
			this.popupViewerDiv.remove();
			this.popupContainerDiv.remove();
			this.popupDiv.remove();
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
	const POPUP_WINDOW_SCALE = 0.6;

	// Initializer method
	PopupPreview.initialize = async function () {
		if (Global.isNull(Global.doc)) {
			setTimeout(PopupPreview.initialize, 100);
		} else {
			console.log("Initializing PopupPreview.");

			viewerDiv = document.getElementById("viewer"); // Main non-popup viewer
			currentViewer = new PopupViewer(currentViewerIndex);
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

			//If currentViewer is showing(i.e. some reference is being hovered) then pin the current viewer.
			if (!currentViewer.isHidden()) {
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

			const type = referenceID.replaceAll(/[0-9]/g, ""); // fig,tbl,bib,eqn
			if (type == "tbl") {
				//Tables do not seem to match the other reference styles.
				let viewPort = pdfPage.getViewport({ scale: 1.0 });

				let maxHeight = viewPort.height * currentViewer.getCurrentScale() > screen.height ? viewPort.height * currentViewer.getCurrentScale() * POPUP_WINDOW_SCALE : screen.height * POPUP_WINDOW_SCALE;

				currentViewer.setSize(refDestination[4] * currentViewer.getCurrentScale(), maxHeight);

				//Is the reference being hovered at the top or bottom half of the page
				if (event.clientY < screen.height * 0.5) {
					currentViewer.setPosition(event.clientX * (1.0 / POPUP_WINDOW_SCALE), event.clientY * (1.0 / POPUP_WINDOW_SCALE));
					currentViewer.setOffset(-((viewPort.width / 2) * currentViewer.getCurrentScale()), 3);
				} else {
					currentViewer.setPosition(event.clientX * (1.0 / POPUP_WINDOW_SCALE), event.clientY * (1.0 / POPUP_WINDOW_SCALE) - viewPort.height * POPUP_WINDOW_SCALE * currentViewer.getCurrentScale());
					currentViewer.setOffset(-((viewPort.width / 2) * currentViewer.getCurrentScale()), -3);
				}
			} else {
				let viewPort = pdfPage.getViewport({ scale: currentViewer.getCurrentScale() });

				let maxHeight = viewPort.height * currentViewer.getCurrentScale() > screen.height ? viewPort.height * currentViewer.getCurrentScale() * POPUP_WINDOW_SCALE : screen.height * POPUP_WINDOW_SCALE;

				currentViewer.setSize(viewPort.width * currentViewer.getCurrentScale(), maxHeight);

				//Is the reference being hovered at the top or bottom half of the page
				if (event.clientY < screen.height * 0.5) {
					currentViewer.setPosition(event.clientX * (1.0 / POPUP_WINDOW_SCALE), event.clientY * (1.0 / POPUP_WINDOW_SCALE));
					currentViewer.setOffset(-((viewPort.width / 2) * currentViewer.getCurrentScale()), 3);
				} else {
					currentViewer.setPosition(event.clientX * (1.0 / POPUP_WINDOW_SCALE), event.clientY * (1.0 / POPUP_WINDOW_SCALE) - viewPort.height * POPUP_WINDOW_SCALE * currentViewer.getCurrentScale());
					currentViewer.setOffset(-((viewPort.width / 2) * currentViewer.getCurrentScale()), -3);
				}
			}
		});
	};

	Clippy.addOnLoadEvent(PopupPreview.name, PopupPreview.initialize);
})((window.Clippy.PopupPreview = window.Clippy.PopupPreview || {}));
