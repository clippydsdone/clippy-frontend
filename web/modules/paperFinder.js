(function (PaperFinder) { 
    // Official name of the module
    Object.defineProperty(PaperFinder, "name", {
        value: "PaperFinder",
        writable: false
    });

    // Class variables
    opened = false;
    findByIdMode = false;

    // HTML elements
    let findButton = null;       // Button to open the bar  
    let findBar = null;          // Container for the bar
    let findTextInput = null;    // Text input for the paper title/ID
    let findByIdInput = null;    // Checkbox input whether title or ID is used
    let findSubmitButton = null; // Submit button to start the API call

    // PDF.js objects
    let textFindBar = null;      // PDFFindBar object used to search text in PDF

    PaperFinder.initialize = function () {
        if (Global.isNull(Global.app)) {
            setTimeout(PaperFinder.initialize, 100);
            return;
        } else if (Global.isNull(Global.app.findBar)) {
            setTimeout(PaperFinder.initialize, 100);
            return;
        }
        console.log("Initializing PaperFinder.");

        findButton = document.getElementById('viewPaperFinder');
        findBar = document.getElementById('paperFinderBar');
        findTextInput = document.getElementById('paperFinderInput');
        findByIdInput = document.getElementById('paperFinderById');
        findSubmitButton = document.getElementById('paperFindSubmit');
        textFindBar = Global.app.findBar;

        assignListeners();
    }

    let assignListeners = function () {
        if (Global.isNull(findButton)) {
            console.error("HTML div with id 'viewPaperFinder' is null. Cannot assign event listeners.");
            return;
        } else if (Global.isNull(findBar)) {
            console.error("HTML div with id 'paperFinderBar' is null. Cannot assign event listeners.");
            return;
        } else if (Global.isNull(findTextInput)) {
            console.error("HTML div with id 'paperFinderInput' is null. Cannot assign event listeners.");
            return;
        } else if (Global.isNull(findByIdInput)) {
            console.error("HTML div with id 'paperFinderById' is null. Cannot assign event listeners.");
            return;
        } else if (Global.isNull(findSubmitButton)) {
            console.error("HTML div with id 'paperFindSubmit' is null. Cannot assign event listeners.");
            return;
        } else if (Global.isNull(textFindBar)) {
            console.error("findBar object is null. Cannot assign event listeners.");
            return;
        }

        // Add event listener to open/close the paper finder bar
        findButton.addEventListener("click", function () {
            if (textFindBar.opened) {
                textFindBar.close();
            }

            if (opened) {
                close();
            } else {
                open();
            }
        });

        // Add event listener to close the text finder bar when paper finder is open
        textFindBar.toggleButton.addEventListener("click", function () {
            if (textFindBar.opened && opened) {
                close();
            }
        });

        // Add event listener for setting search mode (title or ID)
        findTextInput.value = "";
        findByIdInput.checked = false;
        findByIdInput.addEventListener("click", function () {
            // Check is already toggled by the time this event fires
            if (findByIdInput.checked) {
                findByIdMode = true;
                findTextInput.placeholder = "Find on Semantic Scholar by ID...";
            } else {
                findByIdMode = false;
                findTextInput.placeholder = "Find on Semantic Scholar by title...";
            }
        });

        // Add submit functionality
        findSubmitButton.addEventListener("click", function () {
            find();
        });
    }

    let open = function () {
        if (opened) {
            return;
        }
        opened = true;
        findButton.classList.add("toggled");
        findButton.setAttribute("aria-expanded", "true");
        findBar.classList.remove("hidden");
    }

    let close = function () {
        if (!opened) {
            return;
        }
        opened = false;
        findButton.classList.remove("toggled");
        findButton.setAttribute("aria-expanded", "false");
        findBar.classList.add("hidden");
    }

    let find = async function () {
        if (findByIdMode) {
            console.log("Finding by Id: " + findTextInput.value);
            let paperID = findTextInput.value;

            await axios({
                method: 'GET',
                url: 'https://clippyapidev.herokuapp.com/semantic/paper/id/' + paperID,
                headers: { 'Content-Type': 'application/json' },
            })
                .then((response) => {
                    result = response.data
                    if (Global.isNull(result.openAccessPdf.url)) {
                        return; // TODO
                    }
                    console.log(result)
                    openFile(result.openAccessPdf.url);
                })
                .catch((err) => {
                    console.error(err)
                });

        } else {
            console.log("Finding by title: " + findTextInput.value);
            let paperTitle = findTextInput.value;
            
            await axios({
                method: 'POST',
                url: 'https://clippyapidev.herokuapp.com/semantic/paper/base64',
                data: {
                    query: paperTitle
                },
                headers: { 'Content-Type': 'application/json' },
            })
            .then((response) => { 
                console.log(response.data);
                localStorage.setItem("lastOpenedFile", "data:application/pdf;base64," + response.data);
                location.reload();
                //Global.app.open(response.data);
            })
            .catch((err) => {
                console.error(err)
            });
        } 
    }

    Clippy.addOnLoadEvent(PaperFinder.name, PaperFinder.initialize);
}(window.Clippy.PaperFinder = window.Clippy.PaperFinder || {}));