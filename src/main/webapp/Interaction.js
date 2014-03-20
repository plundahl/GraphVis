//Heavily inspired by http://bl.ocks.org/mbostock/929623
/*
Static variables
*/
var width = 1000;
var height = 250;

var anchorAttributes = ["x", "y","fixed","labels","node"];
var d3NodeKeyValues = ["x","y","source","target","index","py","px","weight"]; //D3js values that should be ignored

var developing = false;
var labelsAreEnabledThroughForceLayout = false;

var nodesAreSelectabel = true; //This currently does not work.
var nodeSelected = null; //Reference to the node that has been selected
var onClickAddLinkState = [null, null]; //This should be removed at some point
var linksAreSelectabel = true; //Currently working on this.
var linkThatIsSelected = null;


var nodeThatMouseIsOver = null;
var nodeThatIsBeingDragged = null;
var pathFromNodeToMouse = null;
var selectedNode = null;

var defaultLinkColor = "black";

var onSelectShowTextFieldAttribute = true; //Will show a small html textfield where name of attributes can be changed.


if(developing) {
  height=200;
  width=600;
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

var force = d3
	.layout
	.force()
	.size([width, height])
	.nodes([])
	.linkDistance(90)
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
    .append("textarea")
    .attr("rows", 6)
    .attr("columns", 20)
    ;
}

var databaseOutput = d3
	.select("body")
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
        node = {x: point[0], y: point[1], name:""},
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
		.attr("r", 10)
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
  if(developing) {
    console.log("deselectAll");
    console.log("\tselectedNode="+selectedNode);
    console.log("\tlinkThatIsSelected="+linkThatIsSelected);
    console.log("\t"+textFieldShowingAttributes[0][0].value);
  }

  if(selectedNode!=null) {
    selectedNode.__data__.name = textFieldShowingAttributes[0][0].value;
  }
  if(linkThatIsSelected!=null) {
    linkThatIsSelected.__data__.type = textFieldShowingAttributes[0][0].value;
  }

  textFieldShowingAttributes[0][0].value = "";
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
    deselectAll();
    linkThatIsSelected = this;
    textFieldShowingAttributes[0][0]
      .value = this.__data__.type;
    d3.event.stopPropagation();
  }
}

//See http://bl.ocks.org/mbostock/1153292
function linkArc(d) {
	var dx = d.target.x - d.source.x,
		dy = d.target.y-d.source.y,
		dr = Math.sqrt(dx * dx + dy*dy);
	return "M"+d.source.x+","+d.source.y+"A"+dr+","+dr+" 0 0,1 "+d.target.x+","+d.target.y;
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
      links.push({source: onClickAddLinkState[0], target: datum, type:""});
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
