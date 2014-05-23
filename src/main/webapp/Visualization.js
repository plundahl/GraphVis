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

var filteredNodes;
var nodeGroup = [];
var nodes;
var edges;
var graph;
var GraphVisVisualization = {};

/*
Updates the visualization once new information has arrived.
*/
function updateVisualization( returnedObject ) {

  var node = verifyJSONForVisjsNodes( returnedObject );
  var edge = verifyJSONForVisjsEdges( returnedObject );

  // create a graph
  var container = document.getElementById('mygraph');

	nodes = new vis.DataSet();
	nodes.add(node);
	edges = new vis.DataSet();
	edges.add(edge);

	filteredNodes = new vis.DataSet();
	data = {
    nodes: nodes,
    edges: edges
  };
  options = {
	nodes: {},
	edges:{style:'arrow'},
    clustering: {enabled: false},
    stabilize: false,
    physics:
      {barnesHut:
        {enabled:true}}
  };

  graph = new vis.Graph(container, data, options);

  var selection = graph.getSelection();
  graph.on('doubleClick', removeNodes);
  graph.on('click', click);

}

/* Function for removing nodes.*/
function removeNodes(d){
	nodes.remove(d.nodes[0]);
	graph.redraw();
}

/* Prints out the selected name in the console, for debugging purpose. */
function click(d){
	var nameOfNode = nodes.get(d.nodes[0]).label;
	console.log(nameOfNode);
}

/* A function used for filtering out same nodes as the selected one and implodes the nodes to one node. Several bugs still. */
function doubleClick(d) {
	var clickedNode = nodes.get(d.nodes[0]);
	for(var i = 0; i<nodeGroup.length;i++){
		if(clickedNode.type == nodeGroup[i]){
			nodes.add(filteredNodes.get());
			filteredNodes.clear();
			nodeGroup.splice(i,0);
			graph.redraw();
			return;
			}
	}
	var items = nodes.get({
	  filter: function (item) {
		if(item.id != clickedNode.id){
		return item.type == nodes.get(d.nodes[0]).type;}
		}
	});
	items = _.difference(items, clickedNode);
	filteredNodes.add(items);
	nodeGroup.push(clickedNode.type);
	nodes.remove(items);
	graph.redraw();
}

