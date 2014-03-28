/*
* Copyright (c) <YEAR>, <OWNER>
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


/*
Updates the visualization once new information has arrived.
*/
function updateVisualization( returnedObject ) {
  var node = verifyJSONForVisjsNodes( returnedObject );
  //console.log(node);
  var edge = verifyJSONForVisjsEdges( returnedObject );
  //console.log(edge);

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
    nodes: {shape:'circle'},
    edges: {length : 80},
    clustering: {enabled: false},
    stabilize: false,
    physics:
      {barnesHut:
        {enabled:true}}
  };

  graph = new vis.Graph(container, data, options);

  var selection = graph.getSelection();
	graph.on('doubleClick', doubleClick); //Byt ut removeNodes till doubleClick för att testa gruppfiltrering
  graph.on('click', click);

}

/* Funktion för dubbelklick, används just nu för att ta bort enstaka noder.*/
function removeNodes(d){
	/*
	console.log(d.data);
	var item1 = nodes.get(1);
	console.log('item1', item1);
	*/
	nodes.remove(d.nodes[0]);
	graph.redraw();
}

/* Skriver ut namnet på nod. */
function click(d){
	var nameOfNode = nodes.get(d.nodes[0]).labelHidden;
	console.log(nameOfNode);
}

/* Tar bort den grupp som objektet som dubbelklickas på tillhör. Klicka igen och noderna återställs. BUGGIGT*/
function doubleClick(d) {
	var clickedNode = nodes.get(d.nodes[0]);
	for(var i = 0; i<nodeGroup.length;i++){
		if(clickedNode.group == nodeGroup[i]){
			console.log('funkar');
			nodes.add(filteredNodes.get());
			filteredNodes.clear();
			nodeGroup.splice(i,0);
			graph.redraw();
			return;
			}
	}
	console.log('nytt test');
	var items = nodes.get({
	  filter: function (item) {
		if(item.labelHidden != clickedNode.labelHidden){ //Vill spara noden som klickades på
		return item.group == nodes.get(d.nodes[0]).group;} //Kan såklart bytas mot annan egenskap.
	}
	});
	//console.log('filtered items', items);
	items = _.difference(items, clickedNode);
	filteredNodes.add(items);
	nodeGroup.push(clickedNode.group);
	nodes.remove(items);
	graph.redraw();
}

/* Används inte just nu.
function implodeNodes(array,origin){
	array = _.difference(array,origin); //Tar bort noden som klickades på.
	nodes = _.difference(nodes, array); //Tar bort alla grannar till noden i miserables.
}*/
