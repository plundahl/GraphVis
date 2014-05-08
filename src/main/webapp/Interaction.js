/*
* Copyright (c) 2014, Jonatan Asketorp, Jasmin Suljkic, Petter Lundahl, Johan Carlsson
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
*
* 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

//Heavily inspired by http://bl.ocks.org/mbostock/929623
/*
Static variables
*/

var GraphVisInteraction = {};

//d3.select(window).on("resize", GraphVisInteraction.resize);

GraphVisInteraction.resize = function() {
  GraphVisInteraction.width = svg[0][0].parentElement.clientWidth;
  GraphVisInteraction.height = svg[0][0].parentElement.clientHeight;
  //console.log(GraphVisInteraction.width);
  //console.log(GraphVisInteraction.height);
  GraphVisInteraction.force.size([GraphVisInteraction.width, GraphVisInteraction.height]).resume();
}

GraphVisInteraction.width = 1000;
GraphVisInteraction.height = 300;
GraphVisInteraction.anchorAttributes = ["x", "y", "fixed", "labels", "node"];
GraphVisInteraction.d3NodeKeyValues = ["x", "y", "source", "target", "index", "py", "px", "weight", "literals"]; //D3js values that should be ignored, note literals is not D3 and this variable should be renamed at appropriate opportunity.

GraphVisInteraction.availableTypes = null;
GraphVisInteraction.availablePredicates = null;
GraphVisInteraction.availableLiterals = null;
GraphVisInteraction.linkThatMouseIsOver = null;

var developing = false;
var labelsAreEnabledThroughForceLayout = false;

var onClickAddLinkState = [null, null]; //This should be removed at some point
GraphVisInteraction.linksAreSelectabel = true;
GraphVisInteraction.linkThatIsSelected = null;

GraphVisInteraction.nodeThatMouseIsOver = null;
var nodeThatIsBeingDragged = null;
var pathFromNodeToMouse = null;
GraphVisInteraction.selectedNode = null;

var onSelectShowTextFieldAttribute = true;

if(developing) {
  GraphVisInteraction.height=200;
  GraphVisInteraction.width=600;
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
  .size([GraphVisInteraction.width, GraphVisInteraction.height])
  .gravity(0)
  ;
  labelLayoutForce.start();
}

var svg = d3
/*
	.select("body")
	.append("div")
	.attr("class", "background")
  .attr("title", "Double-click on a empty spot to create a new node.")
  */
  .select("#backgroundForInteraction")
	.append("svg")
  //.attr("title", "TEST!")
	//.attr("width", GraphVisInteraction.width)
	//.attr("height", GraphVisInteraction.height)
  .attr("class", "mainSVG")
	.on("dblclick", onClickAddNode)
	.on("click", deselectAllInteraction)
	;

GraphVisInteraction.force = d3
	.layout
	.force()
	.size([GraphVisInteraction.width, GraphVisInteraction.height])
	.nodes([])
	.linkDistance(90)
	.charge(-100)
	.gravity(0.05)
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

//Markers!?
svg
	.append("defs")
	.append("marker")
	.attr("id", "end")
	.attr("viewBox", "0 -5 10 10")
	.attr("refX", 14.3)
	.attr("refY", -0.5)
	.attr("markerWidth", 4)
	.attr("markerHeight", 3)
	.attr("orient", "auto")
	.append("path")
	.attr("d", "M0, -5L10, 0L0,5")
	;

var nodesInteraction = GraphVisInteraction.force.nodes(),
	links = GraphVisInteraction.force.links(),
  linkLabels = svg.selectAll(".linkLabels"),
	node = svg.selectAll(".node"),
  nodeLabels = svg.selectAll(".nodeLabels"),
	link = svg.selectAll(".link"),
	anchorLink = svg.selectAll(".anchorLink"),
  anchorNode = svg.selectAll("g.anchorNode")
	;


var databaseOutput = d3
	//.select("body")
	//.append("textarea")
  .select("#databaseOutput")
	.attr("rows", 6)
	.attr("columns",20)
  .attr("title", "This shows what will be sent to the server.")
	;
console.log(databaseOutput);




function onClickAddNode() {
	//The if statement is to prevent non-char values.
	//if(nodesInteraction.length<=25) {
		var point = d3.mouse(this),
        node = {x: point[0], y: point[1], type:"?", literals:{}},
			n = nodesInteraction.push(node);


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
	//}
}

var updateNode = function() {
	this.attr("transform", function(d) {
		return "translate(" + d.x + "," + d.y + ")";
	});
};

function onClickInteractiveLink (datum) {
  //console.log("A link was clicked");
  if(GraphVisInteraction.linksAreSelectabel) {
    deselectAllInteraction();
    GraphVisInteraction.linkThatIsSelected = this;
    d3.select(this).attr("class", "linkSelected");
    GraphVisInteraction.updateSelectorWithPredicates( datum.type );
    d3.event.stopPropagation();
  }
}

//See http://bl.ocks.org/mbostock/1153292
function linkArc(d) {
  var dx = d.target.x - d.source.x,
      dy = d.target.y-d.source.y,
      dr = Math.sqrt(dx * dx + dy*dy),
      x = d.target.x,
      y = d.target.y,
      close = "",
      large_arc_flag = 0,
      large_sweep_flag = 1;
  if(dr==0) {
    x += 0.1;
    close = " Z";
    dr = 15;
    large_arc_flag=1;
    large_sweep_flag=0;
  }

	return "M"+d.source.x+","+d.source.y+"A"+dr+","+dr+" 0 "+large_arc_flag+","+large_sweep_flag+" "+x+","+y+close;
}

function onClickAddLink(datum) {
	if(d3.event.defaultPrevented) return;
  /*
  This is when a node gets selected...
  */
	if(onClickAddLinkState[0]===null) { //If the start node is not selected
		onClickAddLinkState[0]=datum;
		GraphVisInteraction.selectedNode = this;
		d3
			.select(GraphVisInteraction.selectedNode)
			.style("fill", "green")
			;
    //GraphVisInteraction.updateSelectorWithLiterals(datum.type);
    GraphVisInteraction.updateSelectorWithNodeSelectors(datum);
	} else { //If a starting node has already been selected
		//if (onClickAddLinkState[0]!=datum) {
      links.push({source: onClickAddLinkState[0], target: datum, type:"?"});
			restart();
			d3
				.select(GraphVisInteraction.selectedNode)
				.style("fill", "black")
				;
			GraphVisInteraction.selectedNode = null;
			onClickAddLinkState[0]=null;
      deselectAllInteraction();
		//}
	}
  /*textFieldShowingAttributes[0][0]
    .value = datum.type
    ;
    */
  //setSelectTypeToValue(datum.type);
	d3.event.stopPropagation();
}


function onMouseOverNode (datum) {
	d3.event.stopPropagation(); //2 nodes really shouldn't be on top of eachother but w/e
	GraphVisInteraction.nodeThatMouseIsOver = this;
	d3.select(this)
		.style("fill", "green")
		;
}

function onMouseExitNode (datum) {
	d3.event.stopPropagation();
	GraphVisInteraction.nodeThatMouseIsOver = null;
	if(this==GraphVisInteraction.selectedNode) return;
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
	//d3.select();
	d3.event.sourceEvent.stopPropagation(); //Should never be propagated
}

function onDragEnd (datum) {
	d3.event.sourceEvent.stopPropagation(); //Should never be propagated
	nodeThatIsBeingDragged = null;
	if (GraphVisInteraction.nodeThatMouseIsOver===null) return;
}


/*
function setSelectTypeToValue( value ) {
  var typeSelector = document.getElementById("typeSelector");
  for(var i = typeSelector.childNodes.length-1; i>=0; i--) {
    var currentText = typeSelector.childNodes[i].text;
    if(currentText==value) {
      typeSelector.selectedIndex = i;
      break;
    }
  }
}
*/

/*
Should be run each time something new is added to interaction
*/
function restart() {
	link = svg.selectAll(".link").data(links);
  linkLabels = linkLabels.data(links);

  link
  .exit()
  .remove()
  ;

  linkLabels
  .exit()
  .remove()
  ;

	link
  .enter()
  .insert("path", ".node")
  .attr("class", "link")
  .attr("marker-end", "url(#end)")
  .attr("id", function(d,i) {return 'linkpath'+i;})
  .attr("internalInteractionID", function(d,i) {return i;})
  .on("click", onClickInteractiveLink)
  .on("dblclick", function() {d3.event.stopPropagation();}) //Double clicking on a link should not create a new node
  .on("mouseover", function() {
    d3.select(this).attr("class", "linkHovered");
    GraphVisInteraction.linkThatMouseIsOver=this;
  })
  .on("mouseout", function() {
    if(GraphVisInteraction.linkThatIsSelected==GraphVisInteraction.linkThatMouseIsOver) return;
    d3.select(this).attr("class", "link");
  })
  ;

  linkLabels
  .enter()
  .append("text")
  .attr("class", "unselectableTextLabel")
  .attr("fill", "YELLOW")
    /*
    Serves no purpose to set x and/or y outside of tick
    */
  .text(function(d,i) {return String(d.type);})
  ;

	node = node.data(nodesInteraction);

  nodeLabels = nodeLabels.data(nodesInteraction);

  node
    .exit()
    .remove()
    ;

  nodeLabels
    .exit()
    .remove()
    ;

	node
		.enter()
		.insert("circle", ".cursor") //Hm ... ?
		.attr("class", "node")
		.attr("r", 10)
    .attr("internalInteractionID", function(d,i) {return i;})
		.on("click", onClickAddLink)
		.on("dblclick", function() {d3.event.stopPropagation();})
		.on("mouseover", onMouseOverNode)
		.on("mouseout", onMouseExitNode)
		.call(dragHandler)
		;

  nodeLabels
  .enter()
  .append("text")
  .attr("class", "unselectableTextLabel")
  .attr("fill", "BLUE")
  .text(function(d) {return d.type;})
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

	GraphVisInteraction.force.start();
}

/*
What happens on each tick of the force-layout
*/
function tick() {

	link
		.attr("d", linkArc);

  linkLabels
    .attr("x", function(d, i) {
      var minX = Math.min(d.target.x, d.source.x);
      var maxX = Math.max(d.target.x, d.source.x);
      return minX + (maxX-minX)/2;
    })
    .attr("y", function(d) {
      var minY = Math.min(d.target.y, d.source.y);
      var maxY = Math.max(d.target.y, d.source.y);
      return minY + (maxY-minY)/2;
    })
  //.text(function(d) {return d.type;})
    ;

  /*
  The update to node is from http://bl.ocks.org/mbostock/1129492
  */
	node
		.attr("cx", function(d) {return d.x = Math.max(10, Math.min(GraphVisInteraction.width - 10, d.x));})
		.attr("cy", function(d) {return d.y = Math.max(10, Math.min(GraphVisInteraction.height - 10, d.y));})
		;

  nodeLabels
    .attr("x", function(d) {return d.x+10;})
    .attr("y", function(d) {return d.y+10;})
    ;

  if(labelsAreEnabledThroughForceLayout) {
    labelLayoutForce.start();
    anchorNode.each(function(d,i) {
      if(_.has(d, "labels")) { //If it is a anchor node (it should just keep upp with the node it is being anchored to)
        d.x = d.node.x;
        d.y = d.node.y;
      } else { //If it isn't a anchor node
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

GraphVisInteraction.saveAllSelectorValues = function() {
  var typeSelector = document.getElementById("typeSelector");

  if(GraphVisInteraction.selectedNode!==null) {
    var selectedNode = GraphVisInteraction.selectedNode;
    GraphVisInteraction.updateNodeWithSelectedValues(selectedNode.__data__);
    var index = d3.select(GraphVisInteraction.selectedNode).attr("internalInteractionID");
    nodeLabels[0][index].childNodes[0].data = GraphVisInteraction.selectedNode.__data__.type;
  }
  if(GraphVisInteraction.linkThatIsSelected!==null) {
    var predicateSelector = document.getElementById("literalOrPredicateSelector");
    GraphVisInteraction.linkThatIsSelected.__data__.type = predicateSelector.options[predicateSelector.selectedIndex].text;
    var index = d3.select(GraphVisInteraction.linkThatIsSelected).attr("internalInteractionID");
    linkLabels[0][index].childNodes[0].data = GraphVisInteraction.linkThatIsSelected.__data__.type;
    d3.select(GraphVisInteraction.linkThatIsSelected).attr("class", "link");
  }
  printJSONOutput();
}

function deselectAllInteraction() {
  /*
  Attempting to save attribute values
  */
  if(developing) {
    console.log("deselectAll");
    console.log("\tselectedNode="+GraphVisInteraction.selectedNode);
    console.log("\tlinkThatIsSelected="+GraphVisInteraction.linkThatIsSelected);
    //console.log("\t"+textFieldShowingAttributes[0][0].value);
    //TODO add typeSelector
  }

  var typeSelector = document.getElementById("typeSelector");
  //var selectionOfLiteralsOrPredicate = document.getElementById("literalOrPredicateSelector");

  GraphVisInteraction.saveAllSelectorValues();

  //TODO, make typeSelector text show nothing or null or whatever is deemed appropriate
  //textFieldShowingAttributes[0][0].value = "";
  GraphVisInteraction.linkThatIsSelected=null;
  onClickAddLinkState[0]=null;
  if(GraphVisInteraction.selectedNode!==null) {
    d3
			.select(GraphVisInteraction.selectedNode)
			.style("fill", "black")
			;
  }
	GraphVisInteraction.selectedNode=null;
  GraphVisInteraction.updateSelectorWithDeselect();
  printJSONOutput(); //Update
}



/*
This function should be called when the node options should appear.
*/
GraphVisInteraction.updateSelectorWithNodeSelectors = function ( currentDatum ) {
  //console.log("Attempting to update with selectors for "+currentDatum);
  var selector = document.getElementById("selectionForInteractive");
  /*
  Update the type selector.
  */
  var selectorInnerHTML = "<div id='typeSelectorDiv' onchange='GraphVisInteraction.saveAllSelectorValues()'>"+
      "Select type: <select id='typeSelector'>"+
      "<option value='?'>?</option>";
  for(var iterator=0; iterator < GraphVisInteraction.availableTypes.length; iterator++) {
    selectorInnerHTML += "<option value='"+GraphVisInteraction.availableTypes[iterator]+"'>"+
      GraphVisInteraction.availableTypes[iterator] + "</option>";
  }
  selectorInnerHTML += "</select></div>";
  selector.innerHTML = selectorInnerHTML;
  /*
  This is for updating the literals section.
  It would benefit from using a different structure later.
  */

  var literals = _.keys(currentDatum.literals);
  //console.log("Attempting to update with "+literals.length+" literal(s).");
  for(var iterator=0; iterator<literals.length; iterator++) {
    var key = literals[iterator];
    GraphVisInteraction.updateSelectorWithLiterals( key, currentDatum.literals[key], iterator);
    GraphVisInteraction.updateSelectorWithLiteralValues( String(iterator), key );
  }
  /*
  Create an empty spot to add new literals...
  */
  GraphVisInteraction.updateSelectorWithLiterals( " ", " ", literals.length);
  GraphVisInteraction.selectorIterator= literals.length+1;

  selector.innerHTML += "<button class='deleteButton' onClick='GraphVisInteraction.deleteSelectedNode()'>Delete</button>";

  //GraphVisInteraction.updateSelectorWithEmptyLiterals( literals.length ); //There is a need to be able to change not only the literals that are already decided
  /*
  I am unsure why these needs to be here to work ...
  */
  GraphVisInteraction.setSelectorTo( document.getElementById("typeSelector"), currentDatum.type);

  for(var iterator=literals.length-1; iterator>=0; iterator--) {
    var key = literals[iterator];
    GraphVisInteraction.setSelectorTo( document.getElementById("literalSelector"+String(iterator)), literals[iterator]);
  }

  for(var iterator=literals.length-1; iterator>=0; iterator--) {
    GraphVisInteraction.setSelectorTo( document.getElementById("literalValueSelector"+String(iterator)), currentDatum.literals[literals[iterator]]);
  }
  //GraphVisInteraction.setSelectorTo( document.getElementById("literalSelector0"), key);
};

GraphVisInteraction.updateSelectorWithLiterals = function( currentLiteral, literalValue, iterator ) {
  var selector = document.getElementById("selectionForInteractive");
  /*
  Update the literal section.
  */
  if(iterator===undefined) {
    iterator=GraphVisInteraction.selectorIterator;
    GraphVisInteraction.selectorIterator++;
  }
  var selectorInnerHTML = "<div>";
  selectorInnerHTML += "Select literal: <select id='literalSelector"+String(iterator)+"' onchange='GraphVisInteraction.updateSelectorWithLiteralValues("+String(iterator)+")'>";
  selectorInnerHTML += "<option value=''></option>";
  var availableLiterals = _.keys(GraphVisInteraction.availableLiterals);
  for(var innerIterator=0; innerIterator < availableLiterals.length; innerIterator++) {
    selectorInnerHTML += "<option value='"+availableLiterals[innerIterator]+"'>"+
    availableLiterals[innerIterator] + "</option>";
  }
  selectorInnerHTML += "</select><select id='literalValueSelector"+String(iterator)+"' onchange='GraphVisInteraction.saveAllSelectorValues()' ><option value=''></selector></div>";
  selector.innerHTML += selectorInnerHTML;
  //var literalSelector = document.getElementById("literalSelector"+String(iterator));
  //GraphVisInteraction.setSelectorTo( literalSelector, String(currentLiteral) );

  //GraphVisInteraction.updateSelectorWithLiteralValues( iterator );

  //console.log("literalSelector"+iterator);

  /*
  This section should probable be moved up in the call hierarchy.
  */
  //var literalValueSelector = document.getElementById("literalValueSelector"+String(iterator));
  //GraphVisInteraction.setSelectorTo( literalValueSelector, literalValue );
};

/*
Convenience function that might not be all that convenient.
*/
GraphVisInteraction.createSelectorWithIDAndValues = function( id, values ) {
  var innerHTML = "<selector id='"+id+"'>";
  for(var iterator = 0; iterator<values.length; iterator++) {
    innerHTML += "<option value='"+values[iterator]+"'>"+values[iterator]+"</option>";
  }
  return innerHTML;
};

GraphVisInteraction.updateSelectorWithLiteralValues = function( iterator, literal ) {
  var innerSelector = document.getElementById("literalValueSelector"+String(iterator));
  if(literal===undefined) {
    var outerSelector = document.getElementById("literalSelector"+String(iterator));
    literal = outerSelector.options[outerSelector.selectedIndex].text;
  }
  var innerElements = GraphVisInteraction.availableLiterals[literal];

  var innerHTML = "<option value=''></option>";
  for(var iterator=0; iterator<innerElements.length; iterator++) {
    innerHTML += "<option value='"+innerElements[iterator]+"'>"+
      innerElements[iterator]+
      "</option>";
  }
  innerSelector.innerHTML = innerHTML;
};

GraphVisInteraction.setSelectorTo = function( selector, value ) {
  //var options = selector.childNodes;
  selector.value=value;
  /*for(var iterator = options.length-1; iterator>=0; iterator--) {
    //console.log("\t"+options[iterator].text);
    if( value==options[iterator].text ) {
      //console.log(selector.selectedIndex);
      selector.selectedIndex = iterator;
      //console.log(selector.selectedIndex);
      //console.log("Found at index "+iterator);
      break;
    }
  }*/
};

GraphVisInteraction.updateSelectorWithPredicates = function( currentPredicate ) {
  var selector = document.getElementById("selectionForInteractive");
  var selectorInnerHTML = "Select predicate: <select id='literalOrPredicateSelector' onchange='GraphVisInteraction.saveAllSelectorValues()'>";
  selectorInnerHTML += "<option value='?'>?</option>";
  for(var iterator=0; iterator < GraphVisInteraction.availablePredicates.length; iterator++) {
    selectorInnerHTML += "<option value='"+GraphVisInteraction.availablePredicates[iterator]+"'>"+
      GraphVisInteraction.availablePredicates[iterator] + "</option>";
  }
  selectorInnerHTML += "</select><div><button class='deleteButton' onClick='GraphVisInteraction.deleteSelectedLink()'>Delete</button></div>";
  selector.innerHTML = selectorInnerHTML;

  var typeSelector = document.getElementById("literalOrPredicateSelector");

  for(var i = typeSelector.childNodes.length-1; i>=0; i--) {
    var currentText = typeSelector.childNodes[i].text;
    if(currentText==currentPredicate) {
      typeSelector.selectedIndex = i;
      break;
    }
  }
};

GraphVisInteraction.deleteSelectedNode = function() {
  var node = GraphVisInteraction.selectedNode.__data__;
  for(var iterator = links.length-1; iterator>=0; iterator--) {
    var link = links[iterator];
    console.log(link);
    if(link.source===node||link.target===node) {
      links.splice(iterator, 1);
    }
  }
  nodesInteraction.splice(GraphVisInteraction.selectedNode.__data__.index, 1);
  deselectAllInteraction();
  restart();
};

GraphVisInteraction.deleteSelectedLink = function() {
  var link = GraphVisInteraction.linkThatIsSelected.__data__;
  console.log(link);
  var index = _.indexOf(links, link);
  links.splice(index, 1);
  deselectAllInteraction();
  restart();
}

GraphVisInteraction.updateSelectorWithDeselect = function() {
  var selectionForInteractive = document.getElementById("selectionForInteractive");
  var innerHTML = "Select a node or link to update this section.";
  selectionForInteractive.innerHTML = innerHTML;
  /*
  var selectionOfLiteralsOrPredicate = document.getElementById("selectionOfLiteralsOrPredicate");
  var selectorInnerHTML = "Select a node or link for options: <select id='literalOrPredicateSelector'><option value='none'>-</option></select>";
  selectionOfLiteralsOrPredicate.innerHTML = selectorInnerHTML;
  */
};

GraphVisInteraction.updateNodeWithSelectedValues = function ( datum ) {
  var selectables = document.getElementById("selectionForInteractive").childNodes;
  datum.literals = new Object();
  for(var iterator = selectables.length-2; iterator>0; iterator--) {
    var literalHTML = selectables[iterator].childNodes;
    var potentialKey = literalHTML[1][literalHTML[1].selectedIndex].text;
    var potentialValue = literalHTML[2][literalHTML[2].selectedIndex].text;
    if(potentialKey.length!==0&&potentialValue.length!==0) { //If they have a value
      datum.literals[potentialKey] = potentialValue;
    }
  }

  var typeSelector = selectables[0].childNodes[1];
  datum.type = typeSelector[typeSelector.selectedIndex].text;
};
