//Heavily inspired by http://bl.ocks.org/mbostock/929623
var width = 1000;
var height = 250;

var nodeSelected = null; //Reference to the node that has been selected

var force = d3
	.layout
	.force()
	.size([width, height])
	.nodes([])
	.linkDistance(30)
	.charge(-300)
	.gravity(0.1)
	.on("tick", tick)
	;
	
var dragHandler = d3
	.behavior
	.drag()
	.origin(Object)
	.on("drag", onDrag)
	.on("dragstart", onDragStart)
	.on("dragend", onDragEnd)
	;

var onClickAddLinkState = [null, null];

var svg = d3
	.select("body")
	.append("div")
	.attr("class", "background")
	.append("svg")
	.attr("width", width)
	.attr("height", height)
	.on("dblclick", click)
	.on("click", function() {
		onClickAddLinkState[0]=null;
		d3
			.select(selectedNode)
			.style("fill", "black")
			;
		selectedNode=null;
	})
	;

var cypherOutput = d3
	.select("body")
	.select("div")
	.append("textarea")
	.attr("rows", 16)
	.attr("columns", 40) 
	;


//Markers!?
svg
	.append("defs")
	.append("marker")
	.attr("id", "end")
	.attr("viewBox", "0 -5 10 10")
	.attr("refX", 15)
	.attr("refY", -1.5)
	.attr("markerWidth", 6)
	.attr("markerHeight", 6)
	.attr("orient", "auto")
	.append("path")
	.attr("d", "M0, -5L10, 0L0,5")
	;

var nodes = force.nodes(),
	links = force.links(),
	node = svg.selectAll(".node"),
	link = svg.selectAll(".link")
	;

function click() {
	var point = d3.mouse(this),
		node = {x: point[0], y: point[1]},
		n = nodes.push(node);

	restart();
}

function tick() {
	/*link
		.attr("x1", function(d) {return d.source.x; })
		.attr("y1", function(d) {return d.source.y; })
		.attr("x2", function(d) {return d.target.x; })
		.attr("y2", function(d) {return d.target.y; })
		;
	       */
	
	link
		.attr("d", linkArc);

	node
		.attr("cx", function(d) {return d.x;})
		.attr("cy", function(d) {return d.y;})
		;
}

function restart() {
	link = link.data(links);

	link
		.enter()
		.insert("path", ".node")
		.attr("class", "link")
		.attr("marker-end", "url(#end)")
		;

	node = node.data(nodes);

	node
		.enter()
		.insert("circle", ".cursor")
		.attr("class", "node")
		.attr("r", 5)
		.on("click", onClickAddLink)
		.on("dblclick", function() {d3.event.stopPropagation();})
		.on("mouseover", onMouseOverNode)
		.on("mouseout", onMouseExitNode)
		.call(dragHandler)
		;
	
	
	printCypherOutput();

	force.start();
}

function printCypherOutput () {
	var textToTextField="";
	links.forEach(function(link) {
		textToTextField += "("+link.source.index+")-->("+link.target.index+")\n";
	});
	
	cypherOutput
		.text(textToTextField);
}

function temporaryConsoleOutputHelpFunction (link) {
	console.log(link);
	console.log("("+link.source.index+")-->("+link.target.index+")");
}

//See http://bl.ocks.org/mbostock/1153292
function linkArc(d) {
	var dx = d.target.x - d.source.x,
		dy = d.target.y-d.source.y,
		dr = Math.sqrt(dx * dx + dy*dy);
	return "M"+d.source.x+","+d.source.y+"A"+dr+","+dr+" 0 0,1 "+d.target.x+","+d.target.y;
}

var buttons = ["Node", "Link", "Description"];

d3
	.selectAll("button")
	.data(buttons)
	.enter()
	.append("button")
	.text(function (d) {return d;})
	.on("click", buttonEvent)
	;

function buttonEvent (d) {
	buttonState = d;
	console.log(buttonState);
	if(d===buttons[1]) { //If "link" button is pressed
	       var node = svg.selectAll(".node");
	       node.forEach(console.log);
		console.log("Link button has been clicked");
			console.log(node.length);
	} else if (d===buttons[0]) { //If "node" button is pressed
		d3
			.selectAll("node")
			.on("click", null)
			;
	} else if (d === buttons[2]) {

	}
}

function onClickAddLink (datum) {
	if(d3.event.defaultPrevented) return;	
	if(onClickAddLinkState[0]===null) { //If the start node is not selected
		onClickAddLinkState[0]=datum;
		selectedNode = this;
		d3
			.select(selectedNode)
			.style("fill", "green")
			;
	} else { //If a starting node has already been selected
		if (onClickAddLinkState[0]!=datum) {	
			links.push({source: onClickAddLinkState[0], target: datum});
			restart();
			d3
				.select(selectedNode)
				.style("fill", "black")
				;
			selectedNode = null;
			onClickAddLinkState[0]=null;
		}
	}
	d3.event.stopPropagation();
}

var nodeThatMouseIsOver = null;
var nodeThatIsBeingDragged = null;
var pathFromNodeToMouse = null;
var selectedNode = null;

function onMouseOverNode (datum) {
	d3.event.stopPropagation(); //2 nodes really shouldn't be on top of eachother but w/e
	nodeThatMouseIsOver = this;
	d3.select(this)
		.style("fill", "green")
		;
}

function onMouseExitNode (datum) {
	d3.event.stopPropagation();
	nodeThatMouseIsOver = null;
	if(this==selectedNode) return;
	d3.select(this)
		.style("fill", "black")
		;	
}

function onDrag (datum) { //Datum will retain the starting object
	d3.event.sourceEvent.stopPropagation();
	
}

function onDragStart (datum) {
	/*d3.select(this)
		.style("fill", "orange")
		;
	*/	
	nodeThatIsBeingDragged = this;
	d3.select()
	d3.event.sourceEvent.stopPropagation(); //Should never be propagated
}

function onDragEnd (datum) {
	d3.event.sourceEvent.stopPropagation(); //Should never be propagated
	nodeThatIsBeingDragged = null;
	if (nodeThatMouseIsOver==null) return;

}
