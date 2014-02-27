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

	//orderNeo4jGraphInOneGraph( returnedObject );
	//orderNeo4jGraphInMultipleGraphs( returnedObject );
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
  console.log("Ordering JSON in one graph");
  visualizationNodes = returnedObject.nodes;
  visualizationLinks = returnedObject.links;
}

/*
Order the data returned from Neo4j (SELECT * RETURN *.name) as multiple tables shown as graphs.
*/
function orderNeo4jGraphInMultipleGraphs( returnedObject ) {
	/*
	Note, this function needs to be changed for large graphs since it will take unnecessarily long time.
	*/
	console.log("Ordering in multiple graphs");
	var numberOfInternalIterations = returnedObject.columns.length;
	console.log("Number of nodes in each graph is "+numberOfInternalIterations/2);
	for(var i = returnedObject.data.length-1; i>=0; i--) {
		var nodesInSubgraph = [];
		for(var j = numberOfInternalIterations-1; j>=0; j--) {
			var handledNode = returnedObject.data[i][j];
			if(nodesInSubgraph.indexOf(returnedObject.data[i][j])<0) { //If does not exist in the subgraph already
				nodesInSubgraph.push(returnedObject.data[i][j]);
			}
		}

		var offsetInVisualizationNodes = visualizationNodes.length;
		for(var k = nodesInSubgraph.length-1; k>=0; k--) {
			visualizationNodes.push({name: nodesInSubgraph[k]});
		}

		for(var j = numberOfInternalIterations-2; j>=0; j-=2) {
			var firstNode = returnedObject.data[i][j];
			var secondNode = returnedObject.data[i][j+1];
			visualizationLinks.push({source: (nodesInSubgraph.indexOf(firstNode)+offsetInVisualizationNodes), target: (nodesInSubgraph.indexOf(secondNode)+offsetInVisualizationNodes)});
		}
	}
}

/*
Order the data returned from Neo4j (SELECT * RETURN *.name) as one graph.
Note, at this stage this function has not been tested.
*/
function orderNeo4jGraphInOneGraph( meh ) {
	var columnLength = meh.columns.length;
	var numberOfInternalIterations = columnLength/2;
	for(var i = meh.data.length-1; i>=0; i--) {
		for(var j = numberOfInternalIterations-2; j >= 0; j -= 2) {
			var firstNode = meh.data[i][j];
			var secondNode = meh.data[i][j+1];
			//console.log(firstNode);
			//console.log(visualizationMap[firstNode]);
			if(typeof visualizationMap[firstNode] == 'undefined') {
				visualizationMap[firstNode] = visualizationNodes.length;
				visualizationNodes.push(firstNode);
			}
			if(typeof visualizationMap[secondNode] == 'undefined') {
				visualizationMap[secondNode] = visualizationNodes.length;
				visualizationNodes.push(secondNode);
			}

			var firstNodeIndex = visualizationMap[firstNode];
			var secondNodeIndex = visualizationMap[secondNode];

			var newLink = {source:firstNodeIndex, target:secondNodeIndex};
			visualizationLinks.push(newLink);
		}
	}
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


	//printCypherOutput();
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
           textToTextField += keys[key]+':'+nodes[iterator][keys[key]]+',';
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
        textToTextField += keys[key]+':'+links[iterator][keys[key]]+',';
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
  cypherOutput
    .text(textToTextField);
}

function printCypherOutput () {
	var textToTextField="";
	textToTextField += '{"query":"MATCH ';
	if(links.length>0) {
		if(links.length>1) {
			for(var i = links.length-1; i>0; i--) {
				textToTextField += "("+String.fromCharCode(links[i].source.index+65)+")-[]->("+String.fromCharCode(links[i].target.index+65)+"), ";
			}
		}
		textToTextField += "("+String.fromCharCode(links[0].source.index+65)+")-[]->("+String.fromCharCode(links[0].target.index+65)+")";
		textToTextField += " RETURN ";
		if(links.length>1) {
			for(var i = links.length-1; i>0; i--) {
				textToTextField += String.fromCharCode(links[i].source.index+65)+".name, "+String.fromCharCode(links[i].target.index+65)+".name, ";
			}
		}
		textToTextField += String.fromCharCode(links[0].source.index+65)+".name, "+String.fromCharCode(links[0].target.index+65)+".name";

		textToTextField += '","params":{}}';
	}

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
		xhr_object.open("POST", "http://localhost:8888/db/data/cypher");
		xhr_object.setRequestHeader('Accept-Language', 'sv-se');
		xhr_object.setRequestHeader('Accept', 'application/json; charset=UTF-8');
		xhr_object.onreadystatechange = function() {
			if (xhr_object.readyState == 4 && xhr_object.status == 200) {
				updateVisualization(JSON.parse(xhr_object.responseText));
			}
		}
		//var cypherRequest = '{"query":"MATCH (n)-[]->(m) RETURN n.name, m.name LIMIT 5","params":{}}';
		var cypherRequest2 = cypherOutput.text();

		//console.log(cypherRequest);
		console.log(cypherRequest2);
		xhr_object.send(cypherRequest2);
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
