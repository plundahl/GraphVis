//Heavily inspired by http://bl.ocks.org/mbostock/929623
/*
Static variables
*/
var width = 1000;
var height = 250;
var heightVisualization = 250;

var anchorAttributes = ["x", "y","fixed","labels","node"];
var d3NodeKeyValues = ["x","y","source","target","index","py","px","weight"]; //D3js values that should be ignored

var developing = false;
var labelsAreEnabledThroughForceLayout = false;

var nodesAreSelectabel = true; //This currently does not work.
var nodeSelected = null; //Reference to the node that has been selected
var onClickAddLinkState = [null, null]; //This should be removed at some point
var linksAreSelectabel = true; //Currently working on this.
var linkThatIsSelected = null;

var defaultLinkColor = "black";

var onSelectShowTextFieldAttribute = true; //Will show a small html textfield where name of attributes can be changed.


if(developing) {
  height=200;
  width=600;
  heightVisualization=100;
}

/*
Contains variables used when labels to show node attributes are enabled through force-layout
*/

var labelLayoutLinks = [];
//var labelLayoutAnchors = []; //In the case where anchor is used.
var labelLayoutNodes = [];

/*
The following part handles the force-directed label placements
This is based on http://bl.ocks.org/MoritzStefaner/1377729 .
*/
var labelLayoutForce = null;
if(labelsAreEnabledThroughForceLayout) {
  /*
  Specific variables
  */
  var labelLinkDistanceInInteraction = 20/5; //20 is default.

  labelLayoutForce = d3.layout.force()
    .nodes(labelLayoutNodes)
    .links(labelLayoutLinks)
    .charge(-120)
    .linkStrength(5)
	  .linkDistance(labelLinkDistanceInInteraction)
	  .size([width, height])
	  .gravity(0)
	  ;
  labelLayoutForce.start();
}


var svgVisualization = d3
	.select("body")
	.append("svg")
	.attr("width", width)
	.attr("height", heightVisualization)
	;

var visualizationForce = d3
	.layout.force()
	.charge(-120)
	.linkDistance(30)
	.size([width, heightVisualization])
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

var svg = d3
	.select("body")
	.append("div")
	.attr("class", "background")
	.append("svg")
	.attr("width", width)
	.attr("height", height)
	.on("dblclick", onClickAddNode)
	.on("click", deselectAll)
	;

d3.select("body").select("div").append("div");
var textFieldShowingAttributes = null;
if(onSelectShowTextFieldAttribute) {
  textFieldShowingAttributes = d3
    .select("body")
    .select("div")
    .select("div")
    .append("textarea")
    .attr("rows", 6)
    .attr("columns", 20)
    ;
}

var databaseOutput = d3
	.select("body")
	.select("div")
  .select("div")
	.append("textarea")
	.attr("rows", 6)
	.attr("columns",20)
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
	anchorLink = svg.selectAll(".anchorLink"),
  anchorNode = svg.selectAll("g.anchorNode")
	;



function onClickAddNode() {
	//The if statement is to prevent non-char values.
	if(nodes.length<=25) {
		var point = d3.mouse(this),
        node = {x: point[0], y: point[1], name:"null"},
			n = nodes.push(node);


    if(labelsAreEnabledThroughForceLayout) {
      console.log("Attempting to create labels...");
      /*
      fixed just means that the force layout should ignore it
      node keeps a reference to the node this should be a anchor for.
      */
      var anchor = {x:point[0], y:point[1], fixed:true, labels:[], node:node, text:""};
      /*
      Here should add parts to take care of the amounts of labels
      */
      var label = {x:point[0], y:point[1], text:"test", node:node}; //Just a random label for test purposes
      anchor.labels.push(label);
      var labelLayoutPosition = labelLayoutNodes.length;

      /*
      for(var iterator = labelLayoutPosition; iterator < anchor.labels.length+labelLayoutPosition; iterator++) {
        var link = {source:labelLayoutPosition, target:iterator};
        labelLayoutLinks.push(link);
      }
      */

      labelLayoutNodes.push(anchor);
      labelLayoutNodes.push(label);
      labelLayoutLinks.push({source:label, target:anchor});
    }


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

  if(labelsAreEnabledThroughForceLayout) {
    labelLayoutForce.start();
    anchorNode.each(function(d,i) {
      if(_.has(d, "labels")) { //If it is a anchor node (it should just keep upp with the node it is being anchored to)
        d.x = d.node.x;
        d.y = d.node.y;
      } else { //If it isn't a anchor node
        /*console.log("Fel här");
        console.log("This");
        console.log(this);
        console.log("Datum");
        console.log(d);
        */
        var b = this.childNodes[0].getBBox();

				var diffX = d.x - d.node.x;
				var diffY = d.y - d.node.y;

				var dist = Math.sqrt(diffX * diffX + diffY * diffY);

				var shiftX = b.width * (diffX - dist) / (dist * 2);
				shiftX = Math.max(-b.width, Math.min(0, shiftX));
				var shiftY = 5;
				this.childNodes[0].setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
      }
    });
    anchorLink
	  	.attr("x1", function(d) {return d.source.x; })
		  .attr("y1", function(d) {return d.source.y; })
	  	.attr("x2", function(d) {return d.target.x; })
	  	.attr("y2", function(d) {return d.target.y; })
		  ;
    anchorNode.call(updateNode);
  }
}

var updateNode = function() {
	this.attr("transform", function(d) {
		return "translate(" + d.x + "," + d.y + ")";
	});
}

/*
Should be run each time something new is added to interaction
*/
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
    .on("click", onClickInteractiveLink)
    .on("dblclick", function() {d3.event.stopPropagation}) //Double clicking on a link should not create a new node
		;

	node = node.data(nodes);

  node
    .exit()
    .remove()
    ;

	node
		.enter()
		.insert("circle", ".cursor") //Hm ... ?
		.attr("class", "node")
		.attr("r", 5)
		.on("click", onClickAddLink)
		.on("dblclick", function() {d3.event.stopPropagation();})
		.on("mouseover", onMouseOverNode)
		.on("mouseout", onMouseExitNode)
		.call(dragHandler)
		;

  if(labelsAreEnabledThroughForceLayout) {
    anchorLink = anchorLink.data(labelLayoutLinks);

    anchorNode = anchorNode.data(labelLayoutNodes)
      ;

    anchorNode
      .enter()
      .append("svg:g")
      .append("svg:text")
      .text(function(d) {
      return d.text;
      })
      ;
  }

  printJSONOutput();

	force.start();
}

function deselectAll() {
  /*
  Attempting to save attribute values
  */
  if(selectedNode!=null) {
    var thisNode = d3
      .select(selectedNode)
      ;
    /*thisNode.each(function (datum) {
      datum.name = text();
                  });
    */
    selectedNode.__data__.name = textFieldShowingAttributes[0][0].value;
  } else if(linkThatIsSelected!=null) {
    var thisLink = d3
      .select(linkThatIsSelected)
      ;
    linkThatIsSelected.__data__.name = textFieldShowingAttributes[0][0].value;
  }

  textFieldShowingAttributes[0][0].value = "";
  console.log("Selection unmarked");
  linkThatIsSelected=null;
  onClickAddLinkState[0]=null;
  if(selectedNode!=null) {
    d3
			.select(selectedNode)
			.style("fill", "black")
			;
  }
	selectedNode=null;
  printJSONOutput(); //Update
};
function onClickInteractiveLink (datum) {
  console.log("A link was clicked");
  if(linksAreSelectabel) {
    deselectAll(); //Should remove all other selections, not implemented yet
    linkThatIsSelected = this;
    textFieldShowingAttributes
      .value = datum.type;
  }
}

/*
Can be done shorter and easier but meh, serves it purpose, prints out a JSON presentation of the links and nodes ignoring d3js unique values.
*/
function printJSONOutput () {
  console.log("Attempting to create JSON output");
  var textToTextField="";
  textToTextField += '{"nodes":[';

     for(var iterator = 0; iterator < nodes.length; iterator++) {
       var keys = _.keys(nodes[iterator]);
       textToTextField += '{';
       for(var key = 0; key < keys.length; key++){
         if(!_.contains(d3NodeKeyValues, keys[key])) {
           textToTextField += '"'+keys[key]+'":'+nodes[iterator][keys[key]]+',';
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
  if(developing) {
    console.log(textToTextField);
  }

  databaseOutput[0][0].value = textToTextField;
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
		var requestToDatabase = databaseOutput[0][0].value;

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
      links.push({source: onClickAddLinkState[0], target: datum, type:"null"});
			restart();
			d3
				.select(selectedNode)
				.style("fill", "black")
				;
			selectedNode = null;
			onClickAddLinkState[0]=null;
      deselectAll();
		}
	}
  textFieldShowingAttributes[0][0]
    .value = datum.name
    ;
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
