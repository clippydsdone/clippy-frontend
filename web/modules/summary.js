(function async (Summary) {
    // Summary module start
    // Define module name as constant
    Object.defineProperty(Summary, "name", {
        value: "Summary",
        writable: false
    });

    let content = null;     // Parent div of content to be displayed in sidebar
    let container = null;   // Container for the viewer
    let viewer = null;      // Div of the viewer
    let details = null;     // Div containing details about paper

    let huggingFaceSummaryContainer = null;
    let semanticScholarContainer = null;

    // Initializer method
    Summary.initialize = async function () {
        // TODO: fix this terribleness
        if (Global.isNull(Global.app)) {
            setTimeout(Summary.initialize, 100);
            return;
        } else if (Global.isNull(Global.doc)) {
            setTimeout(Summary.initialize, 100);
            return;
        } else if (Global.isNull(Global.app.documentInfo)) {
            setTimeout(Summary.initialize, 100);
            return;
        }
        console.log("Initializing Summary.");

        // Both are null because we need to wait for the document to load before we can access DOM elements
        content = document.getElementById('summaryView');
        container = document.getElementById('summaryContainer');
        viewer = document.getElementById('summaryViewer');
        details = document.getElementById('paperDetails');

        await getPaperInfo();
        printPaperDetails();
    }

    let getPdfFullText = async function (){
        let doc = window.PDFViewerApplication.pdfDocument;
		let pageTexts = Array.from({length: doc.numPages}, async (v,i) => {
			return (await (await doc.getPage(i+1)).getTextContent()).items.map(token => token.str).join('');
		});
		let text = (await Promise.all(pageTexts)).join(' ');
		return text;
    }

    let getPaperInfo = async function () {
        if (Global.isNull(Global.doc)) {
            console.error("PdfDocument object is null. Cannot get pdf data.");
            return;
        }

        const loadingBar = document.getElementById("summaryLoadingGif");
        const summaryText = document.getElementById("summaryContainerText");
        
        Clippy.spinnerOptions.color = getComputedStyle(document.documentElement).getPropertyValue('--main-color')
        const spinner = new Spin.Spinner(Clippy.spinnerOptions).spin(loadingBar);

        let paperTitle = Global.app.documentInfo.Title;
        let result = {};

        let semanticScholarContainer = document.createElement("div");
        summaryText.append(semanticScholarContainer);

        let semanticScholarTitle = document.createElement("h3");
        semanticScholarTitle.innerText = "Semantic Scholar Summary";
        semanticScholarContainer.append(semanticScholarTitle);

        await axios({
            method: 'POST',
            url: 'https://clippyapidev.herokuapp.com/semantic/paper/search',
            data: {
                query: paperTitle
            },
            headers: { 'Content-Type': 'application/json' },
        })
        .then((response) => { 
            spinner.stop();
            Global.data = response.data
            Summary.semanticScholarSummaryHTML()
        })
        .catch((err) => {
            spinner.stop();
            loadingBar.hidden = true;
            semanticScholarContainer.append(document.createTextNode("Paper with title '" +  paperTitle + "' could not be found on Semantic Scholar."));
            result.status = err.response.status;
            result.data = err.message;
            Global.data = {};

            Clippy.PaperFinder.noTitleFound();
        });


        huggingFaceSummaryContainer = document.createElement("div");
        summaryText.append(huggingFaceSummaryContainer);

        let huggingfaceTitle = document.createElement("h3");
        huggingfaceTitle.innerText = "HuggingFace Summary";
        huggingFaceSummaryContainer.append(huggingfaceTitle);        


        let huggingfaceSummaryButton = document.createElement("button");
        huggingfaceSummaryButton.textContent = "Generate"
        huggingfaceSummaryButton.onclick = async function() {
            try {
                huggingfaceSummaryButton.setAttribute("disabled", true);
                let paperContent = await getPdfFullText();
                
                await axios({
                    method: 'POST',
                    url: 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
                    data: {
                        inputs: paperContent,
                        parameters: {
                            min_length: 150,
                            max_length: 400,
                        }
                    },
                    headers: { 'Content-Type': 'application/json' },
                })
                .then((response) => {
                    spinner.stop();
                    Global.data = response.data
                    Summary.huggingFaceSummaryHTML()
                })
                .catch((err) => {
                    spinner.stop();
                    loadingBar.hidden = true;
                    huggingFaceSummaryContainer.append(document.createTextNode("Paper with title '" +  paperTitle + "' could not be found on Semantic Scholar."));
                    result.status = err.response.status;
                    result.data = err.message;
                    Global.data = {};
                }).finally(() => {
                    huggingFaceSummaryContainer.removeChild(huggingfaceSummaryButton);
                });
            }catch(e){
                huggingFaceSummaryContainer.append(document.createTextNode("Error while parsing PDF text."));
            }            
        }
        huggingFaceSummaryContainer.append(huggingfaceSummaryButton);
                     
        return;
    }

    Summary.printPaperDetails = function() {
        let detailKeys = Global.data;
        if (Object.keys(detailKeys).length == 0) {
            let msg = document.createElement("div");
            msg.id = "NoTitleFoundMsg"
            msg.appendChild(document.createTextNode("No metadata or details found for this PDF. You can search for metadata and details manually by using the paper finder tool."))
            details.appendChild(msg)
            return;
        }

        for(const data in detailKeys){
            let container = document.createElement("div");
            let topic = document.createElement("div");
            
            container.id = "details";
            topic.id = "topics";

            switch(data){
                case "abstract":
                    if(Global.data.abstract != null){
                        container.appendChild(topic);
                        topic.innerHTML = "<b>Abstract</b>";
                        let abstract = document.createElement("div");
                        abstract.id = "values";
                        abstract.innerText = Global.data.abstract;
                        container.appendChild(abstract);
                    }
                    break;
                case "authors":
                    if(Global.data.authors){
                        container.appendChild(topic);
                        let authors = Global.data.authors.map((author) => author.name).join(', ');
                        topic.innerHTML = "<b>Authors</b>: " + authors;
                    }
                    break;
                case "citationCount":
                    if(Global.data.citationCount >= 0){
                        container.appendChild(topic);
                        topic.innerHTML = "<b>Citation Count</b>: " + Global.data.citationCount;
                    }
                    break;
                case "externalIds":
                    if(Global.data.externalIds){
                        container.appendChild(topic);
                        topic.innerHTML = "<b>External Ids</b>";
                        let ids = document.createElement("div");
                        ids.id = "values";
                        for(const id in Global.data.externalIds){
                            let externalId = document.createElement("div");
                            externalId.innerText = id + ": " + Global.data.externalIds[id];
                            ids.appendChild(externalId);
                        }
                        container.appendChild(ids);
                    }
                    break;
                case "fieldsOfStudy":
                    if(Global.data.fieldsOfStudy){
                        container.appendChild(topic);
                        let fields = Global.data.fieldsOfStudy.join(', ');
                        topic.innerHTML = "<b>Fields of Study</b>: " + fields;
                    }
                    break;
                case "journal":
                    if(Global.data.journal){
                        container.appendChild(topic);
                        topic.innerHTML = "<b>Journal</b>";
                        let ids = document.createElement("div");
                        ids.id = "values";
                        for(const id in Global.data.journal){
                            let externalId = document.createElement("div");
                            externalId.innerText = id + ": " + Global.data.journal[id];
                            ids.appendChild(externalId);
                        }
                        container.appendChild(ids);
                    }
                    break;
                case "paperId":
                    if(Global.data.paperId){
                        container.appendChild(topic);
                        topic.innerHTML = "<b>Paper Id</b>: " + Global.data.paperId;
                    }
                    break;
                case "publicationDate":
                    if(Global.data.publicationDate){
                        container.appendChild(topic);
                        topic.innerHTML = "<b>Publication Date</b>: " + Global.data.publicationDate;
                    }
                    break;
                case "publicationTypes":
                    if(Global.data.publicationTypes){
                        container.appendChild(topic);
                        let types = Global.data.publicationTypes.join(', ');
                        topic.innerHTML = "<b>Publication Types</b>: " + types;
                    }
                    break;
                case "referenceCount":
                    if(Global.data.referenceCount >= 0){
                        container.appendChild(topic);
                        topic.innerHTML = "<b>Reference Count</b>: " + Global.data.referenceCount;
                    }
                    break;
                case "title":
                    if(Global.data.title){
                        container.appendChild(topic);
                        topic.innerHTML = "<b>Title</b>: " + Global.data.title;
                    }
                    break;
                case "url":
                    if(Global.data.url){
                        container.appendChild(topic);
                        topic.innerHTML = "<b>Url</b>: <a href=\"" + Global.data.url + "\" target=\"_blank\">" + Global.data.url + "</a>";
                    }
                    break;
                case "venue":
                    if(Global.data.venue){
                        container.appendChild(topic);
                        topic.innerHTML = "<b>Venue</b>: " + Global.data.venue;
                    }
                    break;
                case "year":
                    if(Global.data.year){
                        container.appendChild(topic);
                        topic.innerHTML = "<b>Year</b>: " + Global.data.year;
                    }
                    break;
            }
            if(container.childNodes.length > 0){
                details.appendChild(container);
            }
        }
    }

    Summary.semanticScholarSummaryHTML = function () {
        result = Global.data;
        if (result && result.tldr && result.tldr.text) {
            semanticScholarContainer.append(document.createTextNode(result.tldr.text));

            semanticScholarContainer.append(document.createElement("br"));
            let semanticScholarDisclaimer = document.createElement("i");
            semanticScholarDisclaimer.innerText = "Disclaimer: This summary was generated by Semantic Scholar."
            semanticScholarContainer.append(semanticScholarDisclaimer);
        } else {
            semanticScholarContainer.append(document.createTextNode("No summary found."));
        }
        Global.data = result;
    }

    Summary.huggingFaceSummaryHTML = function () {
        result = Global.data
        loadingBar.hidden = true;
        if (result && result[0] && result[0]["summary_text"]) {
            huggingFaceSummaryContainer.append(document.createTextNode(result[0]["summary_text"]));

            huggingFaceSummaryContainer.append(document.createElement("br"));
            let huggingFaceDisclaimer = document.createElement("i");
            huggingFaceDisclaimer.innerText = "Disclaimer: This summary was generated by HuggingFace model bart-large-cnn."
            huggingFaceSummaryContainer.append(huggingFaceDisclaimer);
        } else {
            huggingFaceSummaryContainer.append(document.createTextNode("No summary found."));
        }
    }

    Summary.ClearData = function () {
        details.innerHTML = '';
        semanticScholarContainer.innerHTML = '';


        let semanticScholarTitle = document.createElement("h3");
        semanticScholarTitle.innerText = "Semantic Scholar Summary";
        semanticScholarContainer.append(semanticScholarTitle);
    }

    // Execute initialize method after the document loads
    Clippy.addOnLoadEvent(Summary.name, Summary.initialize);
}(window.Clippy.Summary = window.Clippy.Summary || {}));
