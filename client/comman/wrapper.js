this.collopseTree = function (param) {
    var collopseTreeWrapper = {
        mainDiv: param.mainDiv,
        margin: param.margin,
        width: param.width,
        data: param.Data,
        height: param.height,
        duration: param.duration,
        tooltip: param.tooltip,
        tooltipTemplate: param.tooltipTemplate,
        rootNodePosition: param.rootNodePosition,
        init: function () {
            var self = this;
            //Settings for set height,width...!!!
            self.width = self.width - self.margin.right - self.margin.left;
            self.height = self.height - self.margin.top - self.margin.bottom;

            /*
            ======Check for rootNodePosition======
            1.If rootNodePosition is given or pass it blank - default "top"
            2.If rootNodePosition given wrong value then - default "top"
            3.Case Insensitive rootNodePosition value
            */
            var rootposition = self.rootNodePosition || "top";
            self.rootNodePosition = rootposition;
            var maintainrootNodePosition = ["top", "left", "right", "bottom"];
            if (maintainrootNodePosition.indexOf(self.rootNodePosition.toLowerCase()) == -1) {
                self.rootNodePosition = "top";
            }

            /*
                Made Tree based on rootNodePosition position (top,left,right,bottom).
            */
            self.tree = d3.layout.tree().size([self.height, self.width]);
            self.diagonal = d3.svg.diagonal().projection(function (d) {
                if (self.rootNodePosition.toLowerCase() == "top") {
                    return [d.x, d.y];
                }
                else if (self.rootNodePosition.toLowerCase() == "left") {
                    return [d.y, d.x];
                }
                else if (self.rootNodePosition.toLowerCase() == "right") {
                    return [-d.y, d.x];
                }
                else if (self.rootNodePosition.toLowerCase() == "bottom") {
                    return [d.x, -d.y];
                }
            });
            self.i = 0;
            self.initChart();
        },
        initChart: function () {
            var self = this;

            //Translate SVG based on rootNode position (top,left,right,bottom)...!!!
            var posx;
            var posy;
            if (self.rootNodePosition.toLowerCase() == "right") {
                posx = self.width;
                posy = self.margin.top;
            }
            else if (self.rootNodePosition.toLowerCase() == "left") {
                posx = self.margin.left;
                posy = self.margin.top;
            }
            else if (self.rootNodePosition.toLowerCase() == "top") {
                posx = self.margin.left;
                posy = self.margin.top;
            }
            else if (self.rootNodePosition.toLowerCase() == "bottom") {
                posx = self.margin.left - self.margin.bottom;
                posy = self.height;
            }

            //Create SVG for tree...!!!
            // Define the zoom function for the zoomable tree
            function zoom() {
                svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            }
            // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
            var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);
            var svg = d3.select(self.mainDiv).append("svg")
                    .attr("width", self.width + self.margin.right + self.margin.left)
                    .attr("height", self.height + self.margin.top + self.margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + posx + "," + posy + ")")
                    .call(zoomListener);

            var svgGroup = svg.append("g");
            
            //Manipulate the data...!!!
            self.root = self.data;
            self.root.x0 = self.height / 2;
            self.root.y0 = 0;

            function collapse(d) {
                if (d.children) {
                    d._children = d.children;
                    d._children.forEach(collapse);
                    d.children = null;
                }
            }

            self.root.children.forEach(collapse);
            //For Show Tooltip configuration...!!!
            if (self.tooltip) {
                self.tip = d3.tip().attr('class', 'd3-tip').offset([-10, 0]).html(function (d) {
                    return Template.toHtml(self.tooltipTemplate, d);
                })
                svg.call(self.tip);
            }
            update(self.root);

            function update(source) {

                // Compute the new tree layout.
                self.nodes = self.tree.nodes(self.root).reverse(),
                    links = self.tree.links(self.nodes);

                // Normalize for fixed-depth.
                self.nodes.forEach(function (d) { d.y = d.depth * 180; });

                // Update the nodes…
                var node = svg.selectAll("g.node")
                    .data(self.nodes, function (d) { return d.id || (d.id = ++self.i); });

                // Enter any new nodes at the parent's previous position.
                var nodeEnter = node.enter().append("g")
                    .attr("class", "node")
                    .attr("transform", function (d) {
                        return "translate(" + source.y0 + "," + source.x0 + ")";
                    })
                    .on("click", click);

                if (self.tooltip) {
                    nodeEnter.append("circle")
                        .attr("r", 1e-6)
                        .style("fill", function (d) { return d._children ? "lightsteelblue" : "#fff"; })
                        .on('mouseover', self.tip.show)
                        .on('mouseout', self.tip.hide)
                        .on('click',function(d){alert(d.name)});
                }
                else {
                    nodeEnter.append("circle")
                        .attr("r", 1e-6)
                        .style("fill", function (d) { return d._children ? "lightsteelblue" : "#fff"; });
                }
                if (self.rootNodePosition.toLowerCase() == "top" || self.rootNodePosition.toLowerCase() == "bottom") {
                    nodeEnter.append("text")
                    .attr("dy", ".35em")
                    .attr("text-anchor", "middle")
                    .text(function (d) { return d.name; })
                    .style("fill-opacity", 1e-10)
                    .call(textrotate("rotate(" + '90' + ")translate(0,10)"));
                }
                else if (self.rootNodePosition.toLowerCase() == "right") {
                    nodeEnter.append("text")
                        .attr("x", function (d) { return d.children || d._children ? -10 : 10; })
                        .attr("dy", ".35em")
                        .attr("text-anchor", function (d) { return d.children || d._children ? "end" : "start"; })
                        .text(function (d) { return d.name; })
                        .style("fill-opacity", 1e-10)
                        .attr("transform", "rotate(" + '360' + ")");
                }
                else {
                    nodeEnter.append("text")
                       .attr("x", function (d) { return d.children || d._children ? -10 : 10; })
                       .attr("dy", ".35em")
                       .attr("text-anchor", function (d) { return d.children || d._children ? "end" : "start"; })
                       .text(function (d) { return d.name; })
                       .style("fill-opacity", 1e-10);
                }
                // Transition nodes to their new position.
                var nodeUpdate = node.transition()
                    .duration(self.duration)
                    .attr("transform", function (d) {
                        if (self.rootNodePosition.toLowerCase() == "top") {
                            return "translate(" + d.x + "," + d.y + ")";
                        }
                        else if (self.rootNodePosition.toLowerCase() == "left") {
                            return "translate(" + d.y + "," + d.x + ")";
                        }
                        else if (self.rootNodePosition.toLowerCase() == "right") {
                            return "translate(" + -d.y + "," + d.x + ")";
                        }
                        else if (self.rootNodePosition.toLowerCase() == "bottom") {
                            return "translate(" + d.x + "," + -d.y + ")";
                        }
                    });

                nodeUpdate.select("circle")
                    .attr("r", 4.5)
                    .style("fill", function (d) { return d._children ? "lightsteelblue" : "#fff"; });
                nodeUpdate.select("text")
                    .style("fill-opacity", 1);
                // Transition exiting nodes to the parent's new position.
                var nodeExit = node.exit().transition()
                    .duration(self.duration)
                    .attr("transform", function (d) { return "translate(" + source.x + "," + source.y + ")"; })
                    .remove();

                nodeExit.select("circle")
                    .attr("r", 1e-6);

                nodeExit.select("text")
                    .style("fill-opacity", 1e-10);

                // Update the links…
                var link = svg.selectAll("path.link")
                    .data(links, function (d) { return d.target.id; });

                // Enter any new links at the parent's previous position.
                link.enter().insert("path", "g")
                    .attr("class", "link")
                    .attr("d", function (d) {
                        var o = { x: source.x0, y: source.y0 };
                        return self.diagonal({ source: o, target: o });
                    });

                // Transition links to their new position.
                link.transition()
                    .duration(self.duration)
                    .attr("d", self.diagonal);

                // Transition exiting nodes to the parent's new position.
                link.exit().transition()
                    .duration(self.duration)
                    .attr("d", function (d) {
                        var o = { x: source.x, y: source.y };
                        return self.diagonal({ source: o, target: o });
                    })
                    .remove();

                // Stash the old positions for transition.
                self.nodes.forEach(function (d) {
                    d.x0 = d.x;
                    d.y0 = d.y;
                });
            }

            function textrotate(transform) {
                return function (node) {
                    for (var i = 0; i < node.length; i++) {
                        node.each(function () {
                            var t = d3.transform(d3.functor(transform).apply(this, arguments));
                            node.attr("alignment-baseline", "central");
                            node.style("dominant-baseline", "central");
                            if (t.rotate <= 90 && t.rotate >= -90) {
                                node.attr("text-anchor", "begin");
                                node.attr("transform", t.toString());
                            } else {
                                node.attr("text-anchor", "end");
                                t.rotate = (t.rotate > 0 ? -1 : 1) * (180 - Math.abs(t.rotate));
                                node.attr("transform", t.toString());
                            }
                        });
                    }
                }
            }

            // Toggle children on click.
            function click(d) {
                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                } else {
                    if (self.rootNodePosition.toLowerCase() == "top" || self.rootNodePosition.toLowerCase() == "bottom") {
                        closeSiblings(d);
                    }
                    d.children = d._children;
                    d._children = null;
                }
                update(d);
            }
            //Close all siblings function ...!!!
            function closeSiblings(d) {
                if (!d.parent) return; // root case
                d.parent.children.forEach(function (d1) {
                    if (d1 === d || !d1.children) return;
                    d1._children = d1.children;
                    d1.children = null;
                });
            }

            function f(rot) {
                svg.select("text").call(textrotate("rotate(" + rot + ")translate(-20,0)"));
            }

            //Sort the tree incase JSON is not sorted
            function sortTree() {
                self.tree.sort(function (a, b) {
                    return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
                });
            }
            sortTree();


            //For Drag and Drop...!!!
            // variables for drag/drop
            var selectedNode = null;
            var draggingNode = null;

            // panning variables
            var panSpeed = 200;
            var panBoundary = 20;
            //Intiate Drag and drop Functionality...!!!
            function initiateDrag(d, domNode) {
                draggingNode = d;
                d3.select(domNode).select('.ghostCircle').attr('pointer-events', 'none');
                d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
                d3.select(domNode).attr('class', 'node activeDrag');

                svg.selectAll("g.node").sort(function (a, b) { // select the parent and sort the path's
                    if (a.id != draggingNode.id) return 1; // a is not the hovered element, send "a" to the back
                    else return -1; // a is the hovered element, bring "a" to the front
                });
                // if nodes has children, remove the links and nodes
                if (self.nodes.length > 1) {
                    // remove link paths
                    links = self.tree.links(self.nodes);
                    nodePaths = svg.selectAll("path.link")
                        .data(links, function (d) {
                            return d.target.id;
                        }).remove();
                    // remove child nodes
                    nodesExit = svgGroup.selectAll("g.node")
                        .data(self.nodes, function (d) {
                            return d.id;
                        }).filter(function (d, i) {
                            if (d.id == draggingNode.id) {
                                return false;
                            }
                            return true;
                        }).remove();
                }

                // remove parent link
                parentLink = tree.links(self.tree.nodes(draggingNode.parent));
                svg.selectAll('path.link').filter(function (d, i) {
                    if (d.target.id == draggingNode.id) {
                        return true;
                    }
                    return false;
                }).remove();

                dragStarted = null;
            }

            d3.select(self.frameElement).style("height", "800px");
        }
    }
    collopseTreeWrapper.init();
    return new function () {
        return collopseTreeWrapper;
    };
}