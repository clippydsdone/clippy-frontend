(function (Graph) {
    // Summary module start
    // Define module name as constant
    Object.defineProperty(Graph, "name", {
        value: "Graph",
        writable: false
    });


    // Initializer method
    Graph.initialize = async function () {
        if (Global.isNull(Global.app) || Global.isNull(Global.doc) || Global.isNull(Global.data)) {
            setTimeout(Graph.initialize, 100);
            return;
        }
        else if (Global.isNull(Global.data)) {
            setTimeout(Graph.initialize, 100);
            return;
        }
        else if (Global.isNull(Global.data)) {
            setTimeout(Graph.initialize, 100);
            return;
        }
        console.log("Initializing Graph.");
        await drawD3();
    }



    let drawD3 = async function () {
        let graph = Global.data.references;
        if (graph == undefined) {
            graph = { links: [], nodes: [] };
        }

        const height = 800;
        const width = 1000;

        var zoom = d3.zoom()
            .scaleExtent([0.1, 8])
            .on("zoom", zoomed);

        const svg = d3.select("#knowledgegraphViewer").append("svg")
            .attr("width", width)
            .attr("height", height)
            .call(zoom)
            .append("g")
            .attr("id", "allZ")

        var tooltip = d3.select("#knowledgegraphViewer")
            .append("div")
              .style("width", "250px")
              .style("position", "absolute")
              .style("visibility", "hidden");
        
        // initial zoom level and call zoom manually
        zoom.scaleTo(d3.select("svg"), 2);
        zoom.translateTo(d3.select("svg"), 700, 400);


        // If zoom hits limit the mousewheel events revert to scrolling the page.
        window.onwheel = function () { return false; }

        const simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(function (d) { return d.id; }).distance(150))
            .force("charge", d3.forceManyBody())
            .force("collision", d3.forceCollide(5))
            .force("center", d3.forceCenter(width / 2, height / 2));

        const link = svg.append("g")
            .attr("class", "links")
            .call(d3.zoomTransform)
            .selectAll("line")
            .data(graph.links)
            .enter().append("line")
            .classed("link", true)
            .each(function (d) {
                d3.select(this).classed("group" + d.group, true);
            });

        let node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(graph.nodes)
            .enter().append("g").attr("class", "node")
            .each(function (d) {
                d3.select(this).classed("group" + d.group, true);
            })
            .on('mousedown', function () { d3.event.stopPropagation(); })
            .on('mouseover', function(e, d){
                return tooltip.style('visibility', 'visible')
                    .style("top", (d3.event.offsetY - 55)+"px")
                    .style('background', 'white')
                    .style('border-radius', '5px')
                    .style('padding', '5px')
                    .style("left",(d3.event.offsetX)+"px")
                    .text(e.title);
                })
            .on("mousemove", function(e, d){
                return tooltip.style('visibility', 'visible')
                    .style("top", (d3.event.offsetY - 55)+"px")
                    .style('background', 'white')
                    .style('border-radius', '5px')
                    .style('padding', '5px')
                    .style("left",(d3.event.offsetX)+"px")
                    .text(e.title);
                })            
            .on('mouseout', function()  { return tooltip.style('visibility', 'hidden')})
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))

        node.append("circle")
            .attr("r", 10);

        node.append("rect");
        
        node.append("text")
            .attr("dy", ".3em")
            .style("text-anchor", "left")
            .style("font-size", "5px")
            .text(function (d) {
                console.log(d);
                return d.index;
        });

        /*node.append("text")
            .attr("dy", "1.3em")
            .style("text-anchor", "left")
            .style("font-size", "5px")
            .text(function (d) {
                return d.title;
        });*/

        simulation
            .nodes(graph.nodes)
            .on("tick", ticked)

        simulation.force("link")
            .links(graph.links);

        function ticked() {
            link
                .attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });

            node.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });

            if (simulation.alpha() < 0.015) {
                simulation.stop();
                simulation.force("fixed", setFixed(node));
            }
        }

        function dragstarted(d) {
            d3.event.sourceEvent.stopPropagation();
            d3.select(this).classed("dragging", true);
            d.fixed = false;
        }

        function dragged(d) {
            d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
            ticked();
        }

        function dragended(d) {
            d3.select(this).classed("dragging", false);
            d.fixed = true;
        }

        function setFixed(node) {
            node.classed('fixed', true);
            node.each(function (d) {
                d.fixed = true;
            });
        }

        function zoomed() {
            var allZ = d3.select("#allZ");
            allZ.attr("transform", "translate(" + d3.event.transform.x + "," + d3.event.transform.y + ")scale(" + d3.event.transform.k + ")");
        }
    }

    // Execute initialize method after the document loads
    Clippy.addOnLoadEvent(Graph.name, Graph.initialize);
}(window.Clippy.Graph = window.Clippy.Graph || {}));
