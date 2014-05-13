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

var GraphVisInteraction = {}; //Container object for functions and variables.

/*
Called to resize the interaction area, the size of the SVG parentElement will be used to decide height and width.
*/
GraphVisInteraction.resize = function() {
  /*
  Get height and width
  */
  GraphVisInteraction.width = GraphVisInteraction.svg[0][0].parentElement.clientWidth;
  GraphVisInteraction.height = GraphVisInteraction.svg[0][0].parentElement.clientHeight;
  /*
  Update height and width and restart the physics engine using the new values.
  */
  GraphVisInteraction.force.size([GraphVisInteraction.width, GraphVisInteraction.height]).resume();
}

/*
If the interaction area is resizeable these variables are only used for initialization and will be overriden after body is loaded.
*/
GraphVisInteraction.width = 1000;
GraphVisInteraction.height = 300;

/*
Lists that should get populated in the first contact with the server.
*/
GraphVisInteraction.availableTypes = null;
GraphVisInteraction.availablePredicates = null;
GraphVisInteraction.availableLiterals = null;

/*
References that are used to keep track of which nodes or edges that are the source of an interaction event.
*/
GraphVisInteraction.linkThatMouseIsOver = null;
GraphVisInteraction.onClickAddLinkState = null;
GraphVisInteraction.linkThatIsSelected = null;
GraphVisInteraction.nodeThatMouseIsOver = null;
GraphVisInteraction.selectedNode = null;

/*
The key-values that are being used and should therefore not be sent to the server.
*/
GraphVisInteraction.d3NodeKeyValues = ["x", "y", "source", "target", "index", "py", "px", "weight", "literals"]; //D3js values that should be ignored, note literals is not D3 and this variable should be renamed at appropriate opportunity.

/*
D3 reference to the SVG element that contains all the nodes and edges in the interaction.
*/
GraphVisInteraction.svg = d3
  .select("#backgroundForInteraction")
	.append("svg")
  .attr("class", "mainSVG")
	;

/*
Function for adding a node on a click-event.
*/
GraphVisInteraction.onClickAddNode = function() {
  var point = d3.mouse(this),
      node = {x: point[0], y: point[1], type:"?", literals:{}},
      n = GraphVisInteraction.nodesInteraction.push(node);
  GraphVisInteraction.restart();
}
GraphVisInteraction.svg.on("dblclick", GraphVisInteraction.onClickAddNode); //Makes the SVG respond to double-click events by adding a node.

/*
The D3 force-layout used to render edges and nodes.
*/
GraphVisInteraction.force = d3
	.layout
	.force()
	.size([GraphVisInteraction.width, GraphVisInteraction.height])
	.nodes([])
	.linkDistance(90)
	.charge(-100)
	.gravity(0.05)
	;

/*
Creates the marker used as the pointed end of the edges thus lending them the appearance of an arrow.
*/
GraphVisInteraction.svg
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

/*
Creates references to commonly used variables for managing nodes, edges and their labels.
*/
GraphVisInteraction.nodesInteraction = GraphVisInteraction.force.nodes(),
	GraphVisInteraction.links = GraphVisInteraction.force.links(),
  GraphVisInteraction.linkLabels = GraphVisInteraction.svg.selectAll(".linkLabels"),
  GraphVisInteraction.link = GraphVisInteraction.svg.selectAll(".link"),
  GraphVisInteraction.node = GraphVisInteraction.svg.selectAll(".node"),
  GraphVisInteraction.nodeLabels = GraphVisInteraction.svg.selectAll(".nodeLabels");

/*
Creates a D3 reference to the TextArea that will show what is being sent to the server.
*/
GraphVisInteraction.databaseOutput = d3
  .select("#databaseOutput")
	.attr("rows", 6)//With the current setup this value will be overriden by the .css file.
	.attr("columns",20)//With the current setup this value will be overriden by the .css file.
  .attr("title", "This shows what will be sent to the server.")
	;

/*
Function that creates the graphical links between different nodes through the path-element.
Inspiration from http://bl.ocks.org/mbostock/1153292
*/
GraphVisInteraction.linkArc = function(d) {
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

/*
Handles mouse-over events for nodes.
*/
GraphVisInteraction.onMouseOverNode = function (datum) {
	d3.event.stopPropagation();
	GraphVisInteraction.nodeThatMouseIsOver = this;
	d3.select(this)
		.style("fill", "green")
		;
}

/*
Handles mouse-exit events for nodes.
*/
GraphVisInteraction.onMouseExitNode = function (datum) {
	d3.event.stopPropagation();
	GraphVisInteraction.nodeThatMouseIsOver = null;
	if(this==GraphVisInteraction.selectedNode) return; //If the node is the selected node there is no need to change node-color.
	d3.select(this)
		.style("fill", "black")
		;
}

/*
Should be run each time something new is added to interaction. Manages all changes to links and edges and their labels.
*/
GraphVisInteraction.restart = function() {
	GraphVisInteraction.link = GraphVisInteraction.svg.selectAll(".link").data(GraphVisInteraction.links);
  GraphVisInteraction.linkLabels = GraphVisInteraction.linkLabels.data(GraphVisInteraction.links);
  /*
  Makes sure that deleted links are removed.
  */
  GraphVisInteraction.link
  .exit()
  .remove()
  ;

  GraphVisInteraction.linkLabels
  .exit()
  .remove()
  ;
  /*
  Makes sure that new links are added.
  */
	GraphVisInteraction.link
  .enter()
  .insert("path", ".node")
  .attr("class", "link")
  .attr("marker-end", "url(#end)")
  .attr("id", function(d,i) {return 'linkpath'+i;})
  .attr("internalInteractionID", function(d,i) {return i;})
  .on("click", GraphVisInteraction.onClickInteractiveLink)
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

  GraphVisInteraction.linkLabels
  .enter()
  .append("text")
  .attr("class", "unselectableTextLabel")
  .attr("fill", "YELLOW")
  .text(function(d,i) {return String(d.type);})//Sets the text to the link-type, e.g. the predicate.
  ;

	GraphVisInteraction.node = GraphVisInteraction.node.data(GraphVisInteraction.nodesInteraction);

  GraphVisInteraction.nodeLabels = GraphVisInteraction.nodeLabels.data(GraphVisInteraction.nodesInteraction);
  /*
  Makes sure that deleted nodes are removed.
  */
  GraphVisInteraction.node
    .exit()
    .remove()
    ;

  GraphVisInteraction.nodeLabels
    .exit()
    .remove()
    ;
  /*
  Makes sure that new nodes are added.
  */
	GraphVisInteraction.node
		.enter()
		.insert("circle", ".cursor") //Hm ... ?
		.attr("class", "node")
		.attr("r", 10)
    .attr("internalInteractionID", function(d,i) {return i;})
		.on("click", GraphVisInteraction.onClickAddLink)
		.on("dblclick", function() {d3.event.stopPropagation();})
		.on("mouseover", GraphVisInteraction.onMouseOverNode)
		.on("mouseout", GraphVisInteraction.onMouseExitNode)
		;

  GraphVisInteraction.nodeLabels
  .enter()
  .append("text")
  .attr("class", "unselectableTextLabel")
  .attr("fill", "BLUE")
  .text(function(d) {return d.type;})
  ;

  printJSONOutput(); //Updates the TextArea containing what will be sent to the server.

	GraphVisInteraction.force.start(); //Restarts the physics engine.
}

/*
The function that are being called on each tick of the force-layout.
*/
GraphVisInteraction.tick = function () {
  /*
  Update links with their new values.
  */
	GraphVisInteraction.link
		.attr("d", GraphVisInteraction.linkArc);
  /*
  Update the link labels with their new values.
  */
  GraphVisInteraction.linkLabels
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
    ;
  /*
  The "algorithm" to update nodes is from http://bl.ocks.org/mbostock/1129492
  */
	GraphVisInteraction.node
		.attr("cx", function(d) {return d.x = Math.max(10, Math.min(GraphVisInteraction.width - 10, d.x));})
		.attr("cy", function(d) {return d.y = Math.max(10, Math.min(GraphVisInteraction.height - 10, d.y));})
		;
  GraphVisInteraction.nodeLabels
    .attr("x", function(d) {return d.x+10;})
    .attr("y", function(d) {return d.y+10;})
    ;
}
GraphVisInteraction.force.on("tick", GraphVisInteraction.tick); //Add the tick to the force-layout.

/*
"Saves" all valules that are currently stored in selectors on the rendered webpage. This is to allow data to be updated and stored as soon as the user makes a selection.
*/
GraphVisInteraction.saveAllSelectorValues = function() {
  if(GraphVisInteraction.selectedNode!==null) {
    /*
    If a node is selected save data related to that node.
    */
    var selectedNode = GraphVisInteraction.selectedNode;
    GraphVisInteraction.updateNodeWithSelectedValues(selectedNode.__data__);
    var index = d3.select(GraphVisInteraction.selectedNode).attr("internalInteractionID");
    GraphVisInteraction.nodeLabels[0][index].childNodes[0].data = GraphVisInteraction.selectedNode.__data__.type;
    GraphVisInteraction.updateSelectorWithNodeSelectors(GraphVisInteraction.onClickAddLinkState); //This is to add a new selector.
  }
  if(GraphVisInteraction.linkThatIsSelected!==null) {
    /*
    If a edge is selected save data related to that edge.
    */
    var predicateSelector = document.getElementById("literalOrPredicateSelector"); //Fetch the predicate selector.
    GraphVisInteraction.linkThatIsSelected.__data__.type = predicateSelector.options[predicateSelector.selectedIndex].text;
    var index = d3.select(GraphVisInteraction.linkThatIsSelected).attr("internalInteractionID");
    GraphVisInteraction.linkLabels[0][index].childNodes[0].data = GraphVisInteraction.linkThatIsSelected.__data__.type;
    d3.select(GraphVisInteraction.linkThatIsSelected).attr("class", "link");
  }
  printJSONOutput(); //Update the TextArea that contains what can be sent to the server.
}

/*
This function should be called to remove all the elements related to selecting values for nodes or edges.
*/
GraphVisInteraction.deselectAllInteraction = function() {
  /*
  Attempting to save attribute values
  */
  GraphVisInteraction.saveAllSelectorValues();

  GraphVisInteraction.linkThatIsSelected=null;
  GraphVisInteraction.onClickAddLinkState=null;
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
GraphVisInteraction.svg.on("click", GraphVisInteraction.deselectAllInteraction);

GraphVisInteraction.onClickAddLink = function (datum) {
	if(d3.event.defaultPrevented) return;
  /*
  This is when a node gets selected...
  */
	if(GraphVisInteraction.onClickAddLinkState===null) { //If the start node is not selected
    GraphVisInteraction.deselectAllInteraction();
		GraphVisInteraction.onClickAddLinkState=datum;
		GraphVisInteraction.selectedNode = this;
		d3
			.select(GraphVisInteraction.selectedNode)
			.style("fill", "green")
			;
    GraphVisInteraction.updateSelectorWithNodeSelectors(datum);
	} else { //If a starting node has already been selected
      GraphVisInteraction.links.push({source: GraphVisInteraction.onClickAddLinkState, target: datum, type:"?"});
			GraphVisInteraction.restart();
			d3
				.select(GraphVisInteraction.selectedNode)
				.style("fill", "black")
				;
			GraphVisInteraction.selectedNode = null;
			GraphVisInteraction.onClickAddLinkState=null;
      GraphVisInteraction.deselectAllInteraction();
	}
	d3.event.stopPropagation();
}

GraphVisInteraction.onClickInteractiveLink = function (datum) {
  GraphVisInteraction.deselectAllInteraction();
  GraphVisInteraction.linkThatIsSelected = this;
  d3.select(this).attr("class", "linkSelected");
  GraphVisInteraction.updateSelectorWithPredicates( datum.type );
  d3.event.stopPropagation();
}

/*
This function should be called when the node options should appear.
*/
GraphVisInteraction.updateSelectorWithNodeSelectors = function ( currentDatum ) {
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

  /*
  I am unsure why these needs to be here to work ...
  */
  GraphVisInteraction.setSelectorTo( document.getElementById("typeSelector"), currentDatum.type);

  for(var iterator=0; iterator<literals.length; iterator++) {
    var key = literals[iterator];
    GraphVisInteraction.setSelectorTo( document.getElementById("literalSelector"+String(iterator)), literals[iterator]);
  }

  for(var iterator=literals.length-1; iterator>=0; iterator--) {
    GraphVisInteraction.setSelectorTo( document.getElementById("literalValueSelector"+String(iterator)), currentDatum.literals[literals[iterator]]);
  }
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
  selector.value=value;
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

/*
Removes the currently selected node, e.g. GraphVisInteraction.selectedNode.
Will additionally remove all links that targets the node or has it source in the node.
*/
GraphVisInteraction.deleteSelectedNode = function() {
  var node = GraphVisInteraction.selectedNode.__data__;
  /*
  Remove links connected to the node.
  */
  for(var iterator = GraphVisInteraction.links.length-1; iterator>=0; iterator--) {
    var link = GraphVisInteraction.links[iterator];
    if(link.source===node||link.target===node) { //If the link has its source or target to the node that is being deleted.
      GraphVisInteraction.links.splice(iterator, 1); //Delete it.
    }
  }
  GraphVisInteraction.nodesInteraction.splice(GraphVisInteraction.selectedNode.__data__.index, 1); //Delete the node
  GraphVisInteraction.deselectAllInteraction(); //Deselect all elements
  GraphVisInteraction.restart(); //Restart the rendering of the interaction
};

/*
Removes the link that is currently selected, i.e. GraphVisInteraction.linkThatIsSelected.
*/
GraphVisInteraction.deleteSelectedLink = function() {
  var link = GraphVisInteraction.linkThatIsSelected.__data__;
  var index = _.indexOf(GraphVisInteraction.links, link);
  GraphVisInteraction.links.splice(index, 1); //Removes the selected link
  GraphVisInteraction.deselectAllInteraction(); //Deselect all elements
  GraphVisInteraction.restart(); //Restarts interaction rendering
}

/*
Resests the selector area to the default, i.e. removes all selectors and replaces them with a short text.
*/
GraphVisInteraction.updateSelectorWithDeselect = function() {
  var selectionForInteractive = document.getElementById("selectionForInteractive");
  var innerHTML = "Select a node or link to update this section.";
  selectionForInteractive.innerHTML = innerHTML;
};

/*
Updates the node given as argument with values taken from the currently rendered elements.
*/
GraphVisInteraction.updateNodeWithSelectedValues = function ( datum ) {
  var selectables = document.getElementById("selectionForInteractive").childNodes;
  datum.literals = new Object(); //"Remove" any previous values
  for(var iterator = selectables.length-2; iterator>0; iterator--) { //Check all selectors that is not typeSelector
    var literalHTML = selectables[iterator].childNodes;
    var potentialKey = literalHTML[1][literalHTML[1].selectedIndex].text; //Get the key of the seöector
    var potentialValue = literalHTML[2][literalHTML[2].selectedIndex].text; //Get the value of the selector
    if(potentialKey.length!==0&&potentialValue.length!==0) { //If they have a value
      datum.literals[potentialKey] = potentialValue; //Update the node with the found literal.
    }
  }

  /*
  Get the type of the node
  */
  var typeSelector = selectables[0].childNodes[1];
  datum.type = typeSelector[typeSelector.selectedIndex].text;
};
