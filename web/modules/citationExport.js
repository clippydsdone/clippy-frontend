(function (CitationExport) {
	// CitationExport module start
	// Define module name as constant

	Object.defineProperty(CitationExport, "name", {
		value: "CitationExport",
		writable: false,
	});

	const Cite = require("citation-js"); //Citation.js library (using CDN, can be found in viewer.html)
	const FILENAME = "citations";
	const CACHEFILE_NAME = "cachedCitations";
	const CITATION_STYLES = { CSL: "CSL", bibtex: "bibtex", bibtxt: "bibtxt", citationApa: "citation-apa", citationVancouver: "citation-vancouver", citationHarvard1: "citation-harvard1" };
	var citationStyle;
	const storedCitations = {};

	CitationExport.initialize = async function () {
		console.log("Initializing CitationExport.");

		//Set the desired citation style of the bibliography
		citationStyle = CITATION_STYLES.bibtex;

		//Fetch any citations stored in cache
		cacheCitations = JSON.parse(localStorage.getItem(CACHEFILE_NAME));

		//Add cached citations to locally stored citations
		for (var citation in cacheCitations) {
			storedCitations[citation] = cacheCitations[citation];
		}
	};

	/**
	 * @param {string} citationRef
	 * Whatever reference form you've got: wikidata, DOI, Bibtex, JSON eg: addCitation("Q30000000") or addCitation("10.5281/zenodo.1005176")
	 * Citation.js will try and fetch it or format it.
	 * List of input types: https://citation.js.org/api/0.3/tutorial-input_formats.html
	 * How to use the Cite() function: https://citation.js.org/api/0.3/tutorial-cite_.html
	 **/
	let addCitation = async function (citationRef) {
		//Fetch the citation using Citation.js
		let newCitation = new Cite(citationRef);

		//Reformat the citation to our desired format
		newCitation = newCitation.format(citationStyle);

		//Store citation locally
		storedCitations[citationRef] = newCitation;

		//Update cached citations
		localStorage.setItem(CACHEFILE_NAME, JSON.stringify(storedCitations));
	};

	let removeCitation = function (citationRef) {
		//Delete citation locally
		delete storedCitations[citationRef];

		//Update cached citations
		localStorage.setItem(CACHEFILE_NAME, JSON.stringify(storedCitations));
	};

	let removeAllCitations = function () {
		for (var citation in storedCitations) {
			delete storedCitations[citation];
		}

		localStorage.setItem(CACHEFILE_NAME, "{}");
	};

	let getCitationsAsJSON = function () {
		return storedCitations;
	};

	let getCitationsAsArray = function () {
		const arr = [];

		for (var citation in storedCitations) {
			arr.push(storedCitations[citation]);
		}

		return arr;
	};

	//Downloads the stored citations as a file
	let saveFile = function () {
		let data = "";

		//Grab all citations
		for (var citation in storedCitations) {
			data += storedCitations[citation];
		}

		//Create fake link
		const link = document.createElement("a");

		//Create a file from our citation data
		const file = new Blob([data], { type: "text/plain" });

		//Add file to link
		link.href = URL.createObjectURL(file);

		//Set file name and, Prevent file from loading in browser window / force it to download
		link.download = FILENAME + (citationStyle == CITATION_STYLES.bibtex || citationStyle == CITATION_STYLES.bibtxt ? ".bib" : ".txt");

		//Auto click link to start the download
		link.click();

		//Cleanup
		URL.revokeObjectURL(link.href);
	};

	Clippy.addOnLoadEvent(CitationExport.name, CitationExport.initialize);
})((window.Clippy.CitationExport = window.Clippy.CitationExport || {}));
