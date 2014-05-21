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

var connectTo = "http://localhost:8888/"; //The address to the server.

/*
Handles refreshing the SPARQL representation.
*/
function getSPARQLInterpretation( responseObject ) {
  if(responseObject===undefined) {
    var message = document.getElementById("databaseOutput").value;
    if(message) {
      requestTextFromDatabaseWithPrefix("db-sparqlinterpretation", message, getSPARQLInterpretation);
    }
  } else {
    updateTextAreaWithSPARQLQuery(responseObject);
  }
}

/*
Handles sending a pure SPARQL request and the subsequent text response.
*/
function sendSPARQLQuery( responseObject ) {
  if(responseObject===undefined) {
    var message = document.getElementById("SPARQLQueryTextArea").value;
    if(message) {
      requestTextFromDatabaseWithPrefix("db-sparql", message, sendSPARQLQuery);
    }
  } else {
    updateTextAreaWithTextResponse(responseObject);
  }
}

/*
Checks and returns the nodes in a format acceptable to vis.js.
Changes here can easily manipulate what is shown by vis.js.
*/
function verifyJSONForVisjsNodes( returnedObject ) {
  var returnedNodes = returnedObject.nodes;
  if(returnedNodes[0]!==null&&(!_.has(returnedNodes[0], "id"))) {
    for(var iterator = 0; iterator<returnedNodes.length; iterator++) {
      returnedNodes[iterator].id = iterator;
      returnedNodes[iterator].label = returnedNodes[iterator].value; //This will write out the nodes label.
      returnedNodes[iterator].title = returnedNodes[iterator].type; //Titles are on mouse-over.
      returnedNodes[iterator].group = returnedNodes[iterator].type;
    }
  }

  return returnedNodes;
}

/*
Checks and returns the edges in a format acceptable to vis.js.
Changes here can easily manipulate what is shown by vis.js.
*/
function verifyJSONForVisjsEdges( returnedObject ) {
  var returnedEdges = returnedObject.links;

  if(returnedEdges[0]!==null&&_.has(returnedEdges[0], "target")) {
    for(var iterator = returnedEdges.length-1; iterator>=0; iterator--) {
      returnedEdges[iterator].label = returnedEdges[iterator].type;	//This sets the label for displaying on the edges in the graph.
      returnedEdges[iterator].from = returnedEdges[iterator].source;
      delete returnedEdges[iterator].source;
      returnedEdges[iterator].to = returnedEdges[iterator].target;
      delete returnedEdges[iterator].target;
    }
  }

  for(var iterator = returnedEdges.length-1; iterator>=0; iterator--) {
    delete returnedEdges[iterator].id;
  }

  return returnedEdges;
}

/*
Prints out a JSON respresentation of the interactively created query, this is the String that will be sent to the server.
*/
function printJSONOutput () {
  var textToTextField="";
  textToTextField += '{"nodes":[';
  /*
  For each node
  */
  for(var iterator = 0; iterator < GraphVisInteraction.nodesInteraction.length; iterator++) {
    var keys = _.keys(GraphVisInteraction.nodesInteraction[iterator]);
    textToTextField += '{';
    /*
    Print out all non-key values.
    */
    for(var key = 0; key < keys.length; key++){
      if(!_.contains(GraphVisInteraction.d3NodeKeyValues, keys[key])) {
        textToTextField += '"'+keys[key]+'":"'+GraphVisInteraction.nodesInteraction[iterator][keys[key]]+'",';
      }
    }
    /*
    Print out all literals.
    */
    textToTextField += '"literals":[';
    var literals = GraphVisInteraction.nodesInteraction[iterator].literals;
    var literalKeys = _.keys(literals);
    for(var literalKey = 0; literalKey< literalKeys.length; literalKey++) {
      textToTextField += '"'+literalKeys[literalKey]+'","'+literals[literalKeys[literalKey]]+'",';
    }
    /*
    Remove the last ',' if it exists.
    */
    if(textToTextField.charAt(textToTextField.length -1)==',') {
      textToTextField = textToTextField.slice(0, -1); //"Removes" last character
    }
    /*
    End the node.
    */
    textToTextField += ']},';
  }
  /*
  Remove the last ',' if it exists.
  */
  if(textToTextField.charAt(textToTextField.length - 1)==',') {
    textToTextField = textToTextField.slice(0, -1); //"Removes" last character
  }
  /*
  Print the links.
  */
  textToTextField += '], "links":[';
  for (var iterator = 0; iterator < GraphVisInteraction.links.length; iterator++) {
    var keys = _.keys(GraphVisInteraction.links[iterator]);
    textToTextField += '{';
    /*
    Print all non-key values.
    */
    for(var key = 0; key < keys.length; key++) {
      if(!_.contains(GraphVisInteraction.d3NodeKeyValues, keys[key])) {
        textToTextField += '"'+keys[key]+'":"'+GraphVisInteraction.links[iterator][keys[key]]+'",';
      }
    }
    /*
    Print from-to.
    */
    textToTextField += '"source":'+GraphVisInteraction.links[iterator]["source"].index+','+
      '"target":'+GraphVisInteraction.links[iterator]["target"].index+'},';
  }
  /*
  Removes any trailing ','.
  */
  if(textToTextField.charAt(textToTextField.length - 1)==',') {
    textToTextField = textToTextField.slice(0, -1); //"Removes" last character
  }
  textToTextField += ']}';
  /*
  Update the DOM-element, note that databaseOutput is the result of a d3-select.
  */
  GraphVisInteraction.databaseOutput[0][0].value = textToTextField;
}

/*
Calls updateVisualization with the returned object.
*/
function sendToDatabase( responseObject ) {
  var requestToDatabase = GraphVisInteraction.databaseOutput[0][0].value;
  /*
  Haven't found any better solutions to verify that the output to the database is JSON.
  */
  if(typeof responseObject === "undefined") {
    try {
      JSON.parse(requestToDatabase);
      requestObjectFromDatabaseWithPrefix( "db/jena", requestToDatabase, sendToDatabase);
    } catch(e) {
      console.log("Could not parse "+requestToDatabase+" to JSON.");
    }
  } else {
    updateVisualization(responseObject);
    updateTextAreaWithTextResponse(responseObject.sparqlResult);
    updateTextAreaWithSPARQLQuery(responseObject.sparqlQuery);
  }
}

/*
Update the TextArea that shows the textual response with the String given as argument.
*/
function updateTextAreaWithTextResponse( textResponse ) {
  var textArea = document.getElementById("SPARQLResponseTextArea");
  /*
  Should satisfy most browsers.
  */
  textArea.value=textResponse;
  textArea.innerHTML = textResponse;
}

/*
Update the TextArea that shows the SPARQL query with the String given as argument.
*/
function updateTextAreaWithSPARQLQuery( SPARQLText ) {
  var textArea = document.getElementById("SPARQLQueryTextArea");
  /*
  Should satisfy most browsers.
  */
  textArea.value = SPARQLText;
  textArea.innerHTML = SPARQLText;
}

/*
Used to request something from the database and call the given function with the result.
*/
function requestObjectFromDatabaseWithPrefix( prefix, message, callingFunction ) {
  var xhr_object = new XMLHttpRequest();
	xhr_object.open("POST", connectTo+prefix);
	xhr_object.setRequestHeader('Accept-Language', 'sv-se');
	xhr_object.setRequestHeader('Accept', 'application/json; charset=UTF-8');
	xhr_object.onreadystatechange = function() {
	if (xhr_object.readyState == 4 && xhr_object.status == 200) {
    var responseObject = JSON.parse(xhr_object.responseText);
		callingFunction(responseObject);
	  }
  };
  xhr_object.send(message);
}

/*
Used to request something from the database and call the given function with the result.
*/
function requestTextFromDatabaseWithPrefix( prefix, message, callingFunction ) {
  var xhr_object = new XMLHttpRequest();
	xhr_object.open("POST", connectTo+prefix);
	xhr_object.setRequestHeader('Accept-Language', 'sv-se');
	xhr_object.setRequestHeader('Accept', 'application/json; charset=UTF-8');
	xhr_object.onreadystatechange = function() {
	if (xhr_object.readyState == 4 && xhr_object.status == 200) {
		callingFunction(xhr_object.responseText);
	  }
  };
  xhr_object.send(message);
}

/*
Request predicates from the server.
*/
function getPredicatesForInteraction( responseObject ) {
  if(responseObject===undefined) {
    requestObjectFromDatabaseWithPrefix("db-predicates", null, getPredicatesForInteraction);
  } else {
    GraphVisInteraction.availablePredicates = responseObject.edgetypes;
    GraphVisInteraction.availablePredicates.sort();
  }
}

/*
Request types from the server.
*/
function getTypesForInteraction( responseObject ) {
  if(responseObject===undefined) {
    requestObjectFromDatabaseWithPrefix("db-types", null, getTypesForInteraction);
  } else {
    GraphVisInteraction.availableTypes = responseObject.types;
    GraphVisInteraction.availableTypes.sort();
  }
}

/*
Request literals from the server.
*/
function getLiteralsForInteraction( responseObject ) {
  if(responseObject===undefined) {
    requestObjectFromDatabaseWithPrefix("db-literals", null, getLiteralsForInteraction);
  } else {
    GraphVisInteraction.availableLiterals = responseObject.literals;
    /*
    Sort the literals.
    */
    var keyValues = _.keys(GraphVisInteraction.availableLiterals);
    for(var iterator = keyValues.length-1; iterator >= 0; iterator--) {
      GraphVisInteraction.availableLiterals[keyValues[iterator]].sort();
    }
  }
}
