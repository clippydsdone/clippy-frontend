var isPreviewing = false;
const app = window.PDFViewerApplication; // API.
var viewerDiv; // HTML viewer div where we want to add the popup canvas.

function clippyPopupOnLoad() {
	viewerDiv = document.getElementById("viewer");
	togglePreview();
}

//Incase we want the option to turn previewing off.
function togglePreview() {
	if (isPreviewing) {
		previewOff();
		isPreviewing = true;
	} else {
		previewOn();
		isPreviewing = false;
	}
}

function previewOn() {
	app.__previewFunc = previewFunc;
	viewerDiv.addEventListener("mouseover", app.__previewFunc);
}

function previewOff() {
	viewerDiv.removeEventListener("mouseover", app.__previewFunc);
	delete app.__previewFunc;
}

/**
 * @param {mouseover} event
 **/
async function previewFunc(event) {
	//Make sure something is being mouseovered before we try to manipulate it.
	if (event.target.hash == undefined) {
		return;
	}

	//Create new canvas for the popup
	const popupCanvas = document.createElement("canvas");

	// event.target		 		gets the full path of the internal link.
	// event.target.hash 		gets the reference ID with a hash prefix i.e. #bib00012 or #fig0001.
	const referenceID = event.target.hash.substring(1); //Removes the # from #fig0001.
	const refParent = event.target.parentElement; //Essentially the area/div containing the reference text i.e [Fig 1]

	/**
	 * ---- ref : basically a JSON array ----
	 * @param ref[0] = {{int} num, {int} gen} //Accessed as ref[0].num or ref[0].gen
	 * @param ref[1] = {{String} name} //"FitR", "FitV", "XYZ", Accessed as ref[1].name
	 * @param ref[2] = {double}
	 * @param ref[3] = {double}
	 * @param ref[4] = {double}
	 * @param ref[5] = {double}
	 **/
	const ref = await app.pdfDocument.getDestination(referenceID);
	//console.log(referenceID + " = " + JSON.stringify(ref));

	//Get page number of where the reference is pointing.
	const pageNum = app.pdfLinkService._cachedPageNumber(ref[0]);

	app.pdfDocument.getPage(pageNum).then(function (pdfPage) {
		/* TODO Figure out how all of this comes together:
		 * Viewports, Cavas, Canvas.style, Contexts, and the ref doubles
		 * or some alternative way of grabbing a resource and injecting it to the popup canvas
		 */

		const viewprt = pdfPage.getViewport({ scale: 1.0 });
		popupCanvas.width = viewprt.width;
		popupCanvas.height = viewprt.height;

		/**
		 * Mouse Coordinates
		 * @param {double} event.clientX
		 * @param {double} event.clientY
		 **/

		//Set canvas style, since it changes dynamically I don't think CSS will work.
		popupCanvas.style.width = `${(ref[4] - ref[2]) * app.pdfViewer.currentScale}px`;
		popupCanvas.style.height = `${viewprt.height * app.pdfViewer.currentScale}px`;
		popupCanvas.style.top = `${event.clientY + 2}px`;
		popupCanvas.style.left = `${event.clientX - viewprt.width / 2}px`;
		popupCanvas.style.border = "1px solid black";
		popupCanvas.style.position = "fixed";
		popupCanvas.style.zIndex = "99";

		//Render popup.
		pdfPage.render({ canvasContext: popupCanvas.getContext("2d"), viewport: viewprt });
	});

	//Add popupCanvas to the viewer html
	viewerDiv.prepend(popupCanvas);

	//Add new listener everytime a new popup is created so when we "mouseleave" the reference area the popup is removed.
	refParent.addEventListener(
		"mouseleave",
		() => {
			popupCanvas.remove();
		},
		{ once: true }
	);
}
