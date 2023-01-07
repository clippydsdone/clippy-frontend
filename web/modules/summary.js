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

    let getPaperInfo = async function () {
        if (Global.isNull(Global.doc)) {
            console.error("PdfDocument object is null. Cannot get pdf data.");
            return;
        }

        const detailsText = document.getElementById("detailsContainerText");
        const loadingBar = document.getElementById("summaryLoadingGif");
        const summaryText = document.getElementById("summaryContainerText");

        let paperTitle = Global.app.documentInfo.Title;
        let result = {};

        await axios({
            method: 'POST',
            url: 'https://clippyapidev.herokuapp.com/semantic/paper/search',
            data: {
                query: paperTitle
            },
            headers: { 'Content-Type': 'application/json' },
        })
        .then((response) => { 
            result = response.data
            loadingBar.hidden = true;
            if (result && result.tldr && result.tldr.text) {
                summaryText.innerHTML = result.tldr.text;
            } else {
                summaryText.innerHTML = "No summary found.";
            }
            Global.data = result;
        })
        .catch((err) => {
            loadingBar.hidden = true;
            summaryText.innerHTML = "Paper with title " +  paperTitle + " couldn't be found on Semantic Scholar.";
            result.status = err.response.status;
            result.data = err.message;
            Global.data = {};
        });

        return;
    }

    let printPaperDetails = function() {
        let detailKeys = Global.data;
        for(const data in detailKeys){
            let container = document.createElement("div");
            let topic = document.createElement("div");
            
            container.id = "details";
            topic.id = "topics";
            //container.appendChild(topic);

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
                        authors = Global.data.authors.map((author) => author.name).join(', ');
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
                        fields = Global.data.fieldsOfStudy.join(', ');
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
                        types = Global.data.publicationTypes.join(', ');
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

    // Execute initialize method after the document loads
    Clippy.addOnLoadEvent(Summary.name, Summary.initialize);
}(window.Clippy.Summary = window.Clippy.Summary || {}));
