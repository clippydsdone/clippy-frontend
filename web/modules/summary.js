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
            
            container.id = "data: " + data;
            topic.id = "topics";
            container.appendChild(topic);

            switch(data){
                case "abstract":
                    if(Global.data.abstract != null){
                        topic.innerText = "Abstract";
                        let abstract = document.createElement("div");
                        abstract.id = "values";
                        abstract.innerText = Global.data.abstract;
                        container.appendChild(abstract);
                    }
                    break;
                case "authors":
                    if(Global.data.authors){
                        topic.innerText = "Authors";
                        let authors = document.createElement("div");
                        authors.id = "values";
                        for(const author of Global.data.authors){
                            let authorName = document.createElement("div");
                            authorName.innerText = author.name;
                            authors.appendChild(authorName);
                        }
                        container.appendChild(authors);
                    }
                    break;
                case "citationCount":
                    if(Global.data.citationCount >= 0){
                        topic.innerText = "Citation Count";
                        let counter = document.createElement("div");
                        counter.id = "values";
                        counter.innerText = Global.data.citationCount;
                        container.appendChild(counter);
                    }
                    break;
                case "externalIds":
                    if(Global.data.externalIds){
                        topic.innerText = "ExternalIds";
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
                        topic.innerText = "Fields of Study";
                        let fields = document.createElement("div");
                        fields.id = "values";
                        for(const filed of Global.data.fieldsOfStudy){
                            let fieldName = document.createElement("div");
                            fieldName.innerText = filed;
                            fields.appendChild(fieldName);
                        }
                        container.appendChild(fields);
                    }
                    break;
                case "influentialCitationCount":
                    if(Global.data.influentialCitationCount >= 0){
                        topic.innerText = "Influential Citation Count";
                        let counter = document.createElement("div");
                        counter.id = "values";
                        counter.innerText = Global.data.influentialCitationCount;
                        container.appendChild(counter);
                    }
                    break;
                case "journal":
                    if(Global.data.journal){
                        topic.innerText = "Journal";
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
                        topic.innerText = "Paper Id";
                        let paperId = document.createElement("div");
                        paperId.id = "values";
                        paperId.innerText = Global.data.paperId;
                        container.appendChild(paperId);
                    }
                    break;
                case "publicationDate":
                    if(Global.data.publicationDate){
                        topic.innerText = "Publication Date";
                        let publication = document.createElement("div");
                        publication.id = "values";
                        publication.innerText = Global.data.publicationDate;
                        container.appendChild(publication);
                    }
                    break;
                case "publicationTypes":
                    if(Global.data.publicationTypes){
                        topic.innerText = "Publication Types";
                        let types = document.createElement("div");
                        types.id = "values";
                        for(const type of Global.data.publicationTypes){
                            let publicationType = document.createElement("div");
                            publicationType.innerText = type;
                            types.appendChild(publicationType);
                        }
                        container.appendChild(types);
                    }
                    break;
                case "referenceCount":
                    if(Global.data.referenceCount >= 0){
                        topic.innerText = "Reference Count";
                        let counter = document.createElement("div");
                        counter.id = "values";
                        counter.innerText = Global.data.referenceCount;
                        container.appendChild(counter);
                    }
                    break;
                case "title":
                    if(Global.data.title){
                        topic.innerText = "Title";
                        let title = document.createElement("div");
                        title.id = "values";
                        title.innerText = Global.data.title;
                        container.appendChild(title);
                    }
                    break;
                case "url":
                    if(Global.data.url){
                        topic.innerText = "Url";
                        let url = document.createElement("a");
                        url.href = Global.data.url;
                        url.id = "values"
                        url.innerText = Global.data.url;
                        container.appendChild(url);
                    }
                    break;
                case "venue":
                    if(Global.data.venue){
                        topic.innerText = "Venue";
                        let vanue = document.createElement("div");
                        vanue.id = "values";
                        vanue.innerText = Global.data.venue;
                        container.appendChild(vanue);
                    }
                    break;
                case "year":
                    if(Global.data.year){
                        topic.innerText = "Year";
                        let year = document.createElement("div");
                        year.id = "values";
                        year.innerText = Global.data.year;
                        container.appendChild(year);
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
