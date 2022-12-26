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

    // Initializer method
    Summary.initialize = async function () {
        // TODO: fix this terribleness
        if (Global.isNull(Global.app)) {
            setTimeout(Summary.initialize, 100);
            return;
        } else if (Global.isNull(Global.doc)) {
            setTimeout(Summary.initialize, 100);
            return;
        }
        console.log("Initializing Summary.");

        // Both are null because we need to wait for the document to load before we can access DOM elements
        content = document.getElementById('summaryView');
        container = document.getElementById('summaryContainer');
        viewer = document.getElementById('summaryViewer');

        await getPaperInfo();
    }

    let getPaperInfo = async function () {
        if (Global.isNull(Global.doc)) {
            console.error("PdfDocument object is null. Cannot get pdf data.");
            return;
        }

        const detailsText = document.getElementById("detailsContainerText");
        const loadingBar = document.getElementById("summaryLoadingGif");
        const summaryText = document.getElementById("summaryContainerText");

        let paperTitle = Global.app._title.split(' - ')[0];
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

            delete result.references;
            delete result.tldr;

            for(var objKey in result){ // this will loop through all the keys in the object

                //create a table row element and two column elements:
                var row = document.createElement('tr'),
                    td1 = document.createElement('td'),
                    td2 = document.createElement('td');
     
                //assign object key to first column and value to second column:
                td1.innerHTML = objKey;
                td2.innerHTML = result[objKey];
     
                //append the columns to the row, and the row to the tbody element:
                row.appendChild(td1).appendChild(td2);
                detailsText.appendChild(row);          
     
           }
        })
        .catch((err) => {
            console.log(err);
            result.status = err.response.status;
            result.data = err.message;
        });

        return;
    }

    // Execute initialize method after the document loads
    Clippy.addOnLoadEvent(Summary.name, Summary.initialize);
}(window.Clippy.Summary = window.Clippy.Summary || {}));
