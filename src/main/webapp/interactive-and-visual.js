//Heavily inspired by http://bl.ocks.org/mbostock/929623
var width = 1000;
var height = 250;

var nodeSelected = null; //Reference to the node that has been selected

var svgVisualization = d3
	.select("body")
	.append("svg")
	.attr("width", width)
	.attr("height", height*2)
	;

var visualizationForce = d3
	.layout.force()
	.charge(-120)
	.linkDistance(30)
	.size([width, height])
	.gravity(0.5);
	;

visualizationForce.on("tick", function() {
	visualizationLink.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    visualizationNode.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
});

var visualizationNodes = [];
var visualizationLinks = [];
var visualizationMap = new Object();

var visualizationLink = svgVisualization.selectAll(".visualizationLink")
	.data(visualizationLinks)
	.enter()
	.append("line")
	.attr("class", "link")
	.style("stroke-width", 2)
	;

var visualizationNode = svgVisualization.selectAll(".visualizationNode")
	.data(visualizationNodes)
	.enter()
	.append("circle")
	.attr("class", "node")
	.attr("r", 5)
	.style("fill", "yellow")
	.call(visualizationForce.drag);

/*
Updates the visualization once new information has arrived.
*/
function updateVisualization( returnedObject ) {
	visualizationNodes = [];
	visualizationLinks = [];
	visualizationMap = new Object();

  orderJSONinOneGraph( returnedObject );

	visualizationForce
		.nodes(visualizationNodes)
		.links(visualizationLinks)
		.start()
		;

	visualizationLink = svgVisualization.selectAll(".visualizationLink")
		.data(visualizationLinks)
		.enter()
		.append("line")
		.attr("class", "link")
		.style("stroke-width", 2)
		;

	visualizationNode = svgVisualization.selectAll(".visualizationNode")
		.data(visualizationNodes)
		.enter()
		.append("circle")
		.attr("class", "node")
		.attr("r", 5)
		.style("fill", "yellow")
		.call(visualizationForce.drag);
}

/*
Gets the JSON structured in the same manner as http://bl.ocks.org/mbostock/4062045 .
*/
function orderJSONinOneGraph( returnedObject ) {
  visualizationNodes = returnedObject.nodes;
  visualizationLinks = returnedObject.links;
}

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

var databaseOutput = d3
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
	//The if statement is to prevent non-char values.
	if(nodes.length<=25) {
		var point = d3.mouse(this),
			node = {x: point[0], y: point[1]},
			n = nodes.push(node);

		restart();
	}
}

/*
What happens on each tick of the force-layout
*/
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
    .exit()
    .remove()
    ;

	link
		.enter()
		.insert("path", ".node")
		.attr("class", "link")
		.attr("marker-end", "url(#end)")
		;

	node = node.data(nodes);

  node
    .exit()
    .remove()
    ;

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

  printJSONOutput();

	force.start();
}

/*
Can be done shorter and easier but meh, serves it purpose, prints out a JSON presentation of the links and nodes ignoring d3js unique values.
*/
var d3NodeKeyValues = ["x","y","source","target","index","py","px","weight"]; //D3js values that should be ignored
function printJSONOutput () {
  console.log("Attempting to create JSON output");
  var textToTextField="";
  textToTextField += '{"nodes":[';

     for(var iterator = 0; iterator < nodes.length; iterator++) {
       var keys = _.keys(nodes[iterator]);
       textToTextField += '{';
       for(var key = 0; key < keys.length; key++){
         if(!_.contains(d3NodeKeyValues, keys[key])) {
           textToTextField += +'"'+keys[key]+'":'+nodes[iterator][keys[key]]+',';
         }
       }
       if(textToTextField.charAt(textToTextField.length -1)==',') {
         textToTextField = textToTextField.slice(0, -1); //"Removes" last character
       }
       textToTextField += '},';
     }
  if(textToTextField.charAt(textToTextField.length - 1)==',') {
    textToTextField = textToTextField.slice(0, -1); //"Removes" last character
  }
  textToTextField += '], "links":[';
  for (var iterator = 0; iterator < links.length; iterator++) {
    var keys = _.keys(links[iterator]);
    textToTextField += '{';
    for(var key = 0; key < keys.length; key++) {
      if(!_.contains(d3NodeKeyValues, keys[key])) {
        textToTextField += '"'+keys[key]+'":'+links[iterator][keys[key]]+',';
      }
    }
    textToTextField+= '"source":'+links[iterator]["source"].index+','
    +'"target":'+links[iterator]["target"].index+'},';
  }
  if(textToTextField.charAt(textToTextField.length - 1)==',') {
    textToTextField = textToTextField.slice(0, -1); //"Removes" last character
  }
  textToTextField += ']}';
  console.log(textToTextField);
  databaseOutput
    .text(textToTextField);
}

//See http://bl.ocks.org/mbostock/1153292
function linkArc(d) {
	var dx = d.target.x - d.source.x,
		dy = d.target.y-d.source.y,
		dr = Math.sqrt(dx * dx + dy*dy);
	return "M"+d.source.x+","+d.source.y+"A"+dr+","+dr+" 0 0,1 "+d.target.x+","+d.target.y;
}

var buttons = ["Node", "Link", "Description", "Send"];

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

	} else if (d == buttons[3]) {
		var xhr_object = null;

		var xhr_object = new XMLHttpRequest();
		xhr_object.open("POST", "http://localhost:8888/db/jena");
		xhr_object.setRequestHeader('Accept-Language', 'sv-se');
		xhr_object.setRequestHeader('Accept', 'application/json; charset=UTF-8');
		xhr_object.onreadystatechange = function() {
			if (xhr_object.readyState == 4 && xhr_object.status == 200) {
				updateVisualization(JSON.parse(xhr_object.responseText));
			}
		}
		var requestToDatabase = databaseOutput.text();

		console.log(requestToDatabase);
		xhr_object.send(requestToDatabase);
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
