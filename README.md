# Clippy PDF.js handbook
This handbook is written as a guide for all team members of the Clippy 
team that wish to code something related to the PDF.js library.
This handbook acts as the collective accumulation of experience working with
the PDF.js library and includes templates, explaination, and guides on how
to modify certain aspects of the PDF.js library.

## Structure
The PDF.js library consists of three parts:
1. Core - layer where PDF in binary format is parsed and interpreted. It is the foundation for the library and it inaccessible to us because we are using the prebuilt version.
2. Display - It is effecitvely the API layer for the core. It contains API calls that are easier to use than their equivalent in the Core layer. It is accessible, but not intended to be modified.
3. Viewer - It is the Viewer object (**GUI**) that displays the PDF to the user. It contains both HTML and Javascript code to modify the HTML. It can be directly modified to change the user interface in order to adapt it to the expanded functionalities. However, direct modification should be avoided if possible.

The only relevant layer for us is the Viewer layer and it can be accessed at ``./web/viewer.js`` (code) and ``./web/viewer.html`` (interface).

## Viewer Objects
There are multiple important objects to take note while working with PDF.js. The developers deemed it best to put the entire Viewer in the innate variable ``window`` of the browser to ensure its global scope. The following is a list of the most relevant viewer objects:
- PDFViewerApplication - It is the main object representing the Viewer application. It has many classes with important methods, some of which we will cover here. Accessed by ``window.PDFViewerApplication``.
- PdfDocument - It is an object of PDFViewerApplication. Its methods pertain to document information and parsing, including the getting of document references with ``getDestinations``. Accessed by ``window.PDFViewerApplication.pdfDocument``.
- PdfSidebar - It is an object of PDFViewerApplication. Its methods pertain to sidebar view manipulation, including opening and closing of any tab. Accessed by ``window.PDFViewerApplication.pdfSidebar``.
- PdfLinkService - It is an object of PDFViewerApplication. Its methods pertain to link (reference) manipulation, including moving the view in the Viewer to the clicked reference. Accessed by ``window.PDFViewerApplication.pdfLinkService``.

## Useful Web Documentation
The documentation for PDF.js is incomplete but the following websites are recommended for analyzing the library and its API:
- [PDF.js Github code comments](https://github.com/mozilla/pdf.js/blob/master/src/display/api.js)
- [Pub.dev autoconstructed documentation](https://pub.dev/documentation/pdfjs/latest/pdfjs/PageReference-class.html)

## Clippy Modules
We currently have 3 modules:
- Global & Clippy (``globalVariables.js``) - **Global** contains variables that should be globally accessible (such as the aforementioned Viewer objects). **Clippy** contains fields and methods for handling other Clippy modules such as onload event queueing.
- ReferenceList (``referenceList.js``) - It is response for parsing and displaying references in the sidebar.
- PopupWindow (``clippyPopup.js``) -  It is responsible for ensuring a popup once a reference is hovered with a cursor.

These and all futures modules should be located at ``./web/modules/``.
## Templates
When writing javascript code, please use keyword ``let`` instead of ``var``, and use the semicolon (``;``) at the end of each line.
### Create a module
To create your own module, create  ``./web/modules/ModuleName.js`` and copy-paste the following:
```js
(function (ModuleName) { // Replace 'ModuleName' with your module name
    // Official name of the module
    Object.defineProperty(ReferenceList, "name", {
        value: "ModuleName", // Replace 'ModuleName' with your module name
        writable: false
    });
    
    // Private Property
    let priv_var = true;
 
    // Public Property
    ModuleName.pub_var = 'Bacon Strips';
 
    // Public const Property
    Object.defineProperty(ModuleName, "const_pub_var", {
        value: "Value",
        writable: false
    });

    // Public Method
    ModuleName.pub_method = function() {
        let inside_scope_var = 10;
        console.log('Outside_scope_var:  ' + ModuleName.pub_var );
    };
 
    // Private Method
    function priv_method(item) {
        if (item !== undefined) {
            console.log(item);
        }
    }

    // Initializer method; Choose any name you want
    ModuleName.initialize = function () {
        console.log("Properly initialized!");
    }
    
    // Execute initialize method after the entire document (its DOM elements) loads
    Clippy.addOnLoadEvent(ModuleName.name, ModuleName.initialize);
}(window.Clippy.ModuleName = window.Clippy.ModuleName || {})); // Replace 'ModuleName' with your module name
```
Replace ``ModuleName`` (best with ``CTRL + H``) with the desired name of your module and remove any elements that you deem unnecessary. 


And also modify ``./web/viewer.html`` and put your script here:
```html
        <script src="./modules/globalVariables.js"></script>
        <script src="./modules/summary.js"></script>
        <script src="./modules/referenceList.js"></script>
        <script src="./modules/popupPreview.js"></script>
        <script src="./modules/ModuleName.js"></script>
```
### Instantiate a PDF.js class
If you wish to instantiate an object belonging to any PDF.js class (this example uses PdfDocument class), your best way is the following:
```js
let constructor = window.PDFViewerApplication.pdfDocument.constructor;
// Alternatively, using our global namespace (constructors are identical)
let constructor_alternative = Global.app.pdfDocument.constructor;
```
Variables ``constructor`` or ``constructor_alternative`` are variables that are in fact functions. Construct an object by doing the following:
```js
let options = {} // Any options for the constructor
const instantiatedObject = new constructor({options});
```
Most if not all classes are avaiable through the main ``PDFViewerApplication`` class.

## Object Classes
We will explain certains classes within PDF.js. If entry has type class, it is an official class. If it has type object, it is not a formal class but an aggregate.
- [PageReference: class](https://pub.dev/documentation/pdfjs/latest/pdfjs/PageReference-class.html) - It represents a page reference.
    - gen: int -
    - num: int - Internal ID for the reference.
- [PageViewport: class](https://pub.dev/documentation/pdfjs/latest/pdfjs/PageViewport-class.html) - It respresents a view port for the PDF.
- [DestinationType: enum](https://pub.dev/documentation/pdfjs/latest/pdfjs/DestinationType.html) - Represents a reference link with coordinates.
    - XYZ: string - Absolute location?
    - Fit: string -
    - FitH: string - Fit horizontal?
    - FitV: string - Fit vertical?
    - FitR: string - 
    - FitBH: string -
    - FitBV: string -
- Reference Id: string - It is a string beginning with '#' followed by a class (ie 'fig') then a number '0001'.
- Destination: object
    - 0: PageReference
    - 1: DestinationType
    - 2: float - value X if destination type is XYZ
    - 3: float - value Y if destination type is XYZ
    - 4: float - value Z if destination type is XYZ
    - 5: float - undefined if destination type is XYZ

## API calls
We will explain certain API calls. We have seperated them by viewer objects.

### PDFViewerApplication
- `pagesCount` - Returns number of pages in PDF document.
    - Argument: None
    - Return: `int`
### PdfDocument
- `getPageIndex` - Returns page number (starts with 0) of given reference.
    - Argument: `PageReference`
    - Returns: `int`
- `getDestination` - Returns Destination of reference for given reference id.
    - Argument: `string`
    - Returns: `Destination`
- `getDestinations` - Returns all Destination of reference in a .
    - Argument: None
    - Returns: `Dict<string, Destination>` where key is Reference Id
### PdfLinkService
- `goToDestination` - Using the Viewer class embedded in the object, it moves the document to the location of the reference and changes the viewing scale.
    - Argument: `string`
    - Returns: None