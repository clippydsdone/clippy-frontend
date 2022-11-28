(function (Summary) {
    // Summary module start
    // Public const letiable named "name"
    Object.defineProperty(Summary, "summaryName", {
        value: "Summary",
        writable: false
    });

    let content = null;    // Parent div of content to be displayed in sidebar
    let container = null;    // Container for the viewer
    let viewer = null;    // Div of the viewer

    // Initializer method
    Summary.initialize = async function () {
        // TODO: fix this terribleness
        if (Global.app === 'undefined') {
            setTimeout(Summary.initialize, 1);
            return;
        } else if (typeof Global.doc === 'undefined') {
            setTimeout(Summary.initialize, 1);
            return;
        }
        console.log("Sumamry global letiable loaded.");

        // Both are null because we need to wait for the document to load before we can access DOM elements
        content = document.getElementById('summaryView');
        container = document.getElementById('summaryContainer');
        viewer = document.getElementById('summaryViewer');

        getPaperInfo();
    }

    let getPaperInfo = async function () {
        if (Global.doc === null) {
            console.error("pdfDocument object is null. Cannot build reference list.");
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
        // We will create a tree structure of depth 2
        const newContent = document.createElement("p");
        console.log(result.tldr.text);
        newContent.appendChild(document.createTextNode(result.tldr.text));
        newContent.style.color = "white";
        content.appendChild(newContent);
        return;
    }

    // Execute initialize method after the document loads
    //Clippy.addOnLoadEvent(Summary.name, Summary.initialize);
}(window.Clippy.ReferenceList = window.Clippy.ReferenceList || {}));
