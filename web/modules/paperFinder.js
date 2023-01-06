(function (PaperFinder) { 
    // Official name of the module
    Object.defineProperty(PaperFinder, "name", {
        value: "PaperFinder",
        writable: false
    });

    // Class variables
    let opened = false;         // Whether the panel for searching is open or not
    let findByIdMode = false;   // Flag for finding papers by ID
    let loadingFlag = false;    // Flag indicating that loading an external pdf is in progress

    // HTML elements
    let findButton = null;       // Button to open the bar  
    let findBar = null;          // Container for the bar
    let findTextInput = null;    // Text input for the paper title/ID
    let findByIdInput = null;    // Checkbox input whether title or ID is used
    let findSubmitButton = null; // Submit button to start the API call
    let spinnerDiv = null;       // Div that contains the loading spinner
    let messageDiv = null;       // Div that contains the messages during loading
    let successMessage = null;   // Label for success message for loading pdf
    let errorMessage = null;     // Label for error message for loading pdf

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
        spinnerDiv = document.getElementById('paperFinderSpinner');
        messageDiv = document.getElementById('paperFinderMsg');
        successMessage = document.getElementById('paperFinderSuccessMsg');
        errorMessage = document.getElementById('paperFinderErrorMsg');
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
        } else if (Global.isNull(spinnerDiv)) {
            console.error("HTML div with id 'paperFinderSpinner' is null. Cannot assign event listeners.");
            return;
        } else if (Global.isNull(messageDiv)) {
            console.error("HTML div with id 'paperFinderMsg' is null. Cannot assign event listeners.");
            return;
        } else if (Global.isNull(successMessage)) {
            console.error("HTML div with id 'paperFinderSuccessMsg' is null. Cannot assign event listeners.");
            return;
        } else if (Global.isNull(errorMessage)) {
            console.error("HTML div with id 'paperFinderErrorMsg' is null. Cannot assign event listeners.");
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
                findTextInput.placeholder = "Find paper on Semantic Scholar by ID...";
            } else {
                findByIdMode = false;
                findTextInput.placeholder = "Find paper on Semantic Scholar by title...";
            }
        });

        // Add submit functionality
        findSubmitButton.addEventListener("click", function () {
            if (!loadingFlag) {
                find();
            }
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

    
    let loading = function (loading, status) {
        loadingFlag = loading;
        messageDiv.classList.remove("hidden");

        if (loading) { // If the paper is loading
            spinnerDiv.classList.remove("hidden");
        } else {       // Paper is not loading; providing results instead
            spinnerDiv.classList.add("hidden");
            if (status) {
                successMessage.classList.remove("hidden");
            } else {
                errorMessage.classList.remove("hidden");
            }

            // Delete message after 5 seconds
            setTimeout(function () {
                messageDiv.classList.add("hidden");
                successMessage.classList.add("hidden");
                errorMessage.classList.add("hidden");
            }, 5000);
        }
    }

    let find = async function () {
        if (findByIdMode) { // Find paper by ID
            let paperID = findTextInput.value;
            
            loading(true, null);
            await axios({
                method: 'GET',
                url: 'https://clippyapidev.herokuapp.com/semantic/paper/base64/id/' + paperID,
                headers: { 'Content-Type': 'application/json' },
            })
            .then((response) => {
                loading(false, true);
                if (Global.isNull(response?.data?.data)) {
                    loading(false, false);
                    return;
                }

                let base64data = response.data.data;
                try {
                    localStorage.setItem("lastOpenedFile", response.data.data);
                    location.reload();
                } catch (e) {
                    loading(false, false);
                }
            })
            .catch((err) => {
                loading(false, false);
                if (Global.isNull(err?.response?.status) || err.response.status != 404) {
                    console.error(err)
                }
            });

        } else { // Find paper by title
            let paperTitle = findTextInput.value;

            loading(true, null);
            await axios({
                method: 'POST',
                url: 'https://clippyapidev.herokuapp.com/semantic/paper/base64',
                data: {
                    query: paperTitle
                },
                headers: { 'Content-Type': 'application/json' },
            })
            .then((response) => {
                loading(false, true);
                if (Global.isNull(response?.data?.data)) {
                    loading(false, false);
                    return;
                }

                let base64data = response.data.data;
                try {
                    localStorage.setItem("lastOpenedFile", response.data.data);
                    location.reload();
                } catch (e) {
                    successMessage.innerText = "File too large to load from external source."
                    setTimeout(function () {
                        successMessage.innerText = "Paper found, please wait...";
                    }, 5000);
                }
            })
            .catch((err) => {
                loading(false, false);
                if (Global.isNull(err?.response?.status) || err.response.status != 404) {
                    console.error(err);
                }
            });
        } 
    }

    Clippy.addOnLoadEvent(PaperFinder.name, PaperFinder.initialize);
}(window.Clippy.PaperFinder = window.Clippy.PaperFinder || {}));