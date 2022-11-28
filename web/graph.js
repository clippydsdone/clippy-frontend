function setSize(){
    $("#knowledgegraph").height(window.innerHeight - ($("#toolbarContainer").height() + $("#toolbarSidebar").height() + 10));
    $("#knowledgegraph").width($("#sidebarContent").innerWidth() - 5);
}

function addGraph(){
    var graph = document.createElement("iframe");
    graph.setAttribute("src", "k_g.html");
    graph.setAttribute("id", "knowledgegraph");
    $(document).ready(function() {
        $("#knowledgegraphView").append(graph);
        setSize();
    })
}

$(window).mousedown( function() {
    $(document).mousemove(function() {
        setSize();
    });

    $(document).mouseup(function() {
        $(this).unbind();
    });
});

addGraph();