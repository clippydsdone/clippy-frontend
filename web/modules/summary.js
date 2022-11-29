(function (Summary) {
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

        getPaperInfo();
    }

    let getPaperInfo = async function () {
        if (Global.isNull(Global.doc)) {
            console.error("PdfDocument object is null. Cannot get pdf data.");
            return;
        }

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
        .then((response) => result = response.data)
        .catch((err) => {
            console.log(err);
            result.status = err.response.status;
            result.data = err.message;
        });

        // HTML building
        const newContent = document.createElement("p");
        if (result && result.tldr && result.tldr.text) {
            newContent.appendChild(document.createTextNode(result.tldr.text));
        } else {
            newContent.appendChild(document.createTextNode("No summary found."));
        }
        newContent.style.color = "white";
        content.appendChild(newContent);
        return;
    }

    // Execute initialize method after the document loads
    Clippy.addOnLoadEvent(Summary.name, Summary.initialize);
}(window.Clippy.Summary = window.Clippy.Summary || {}));
