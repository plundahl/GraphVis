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

/* A very basic function for assigning a group to a node. Future improvements might add a list with different groups and which nodes that belongs to which group. */
function setGroup(returnedNodes){
	if(returnedNodes.value == 'character70'){
		return 'NamedCharacter70';
	}
	if(returnedNodes.value == 'character34'){
		return 'NamedCharacter34';
	}
	return //This is the default group.
}

/*Here the colors are set, it is based upon which group the nodes are belonging too. In this example there is two groups: Character and Othertype.*/
var colorOptions = {
			NamedCharacter34: {	//Character is the group here, but can be altered to something else.
            // defaults for nodes in this group
            radius: 15,
            color: 'orange',
            fontColor: 'black',
            fontSize: 18,
            fontFace: 'courier',
            shape: 'rect'
          },
		  NamedCharacter70: {	//Character is the group here, but can be altered to something else.
            // defaults for nodes in this group
            radius: 15,
            color: 'blue',
            fontColor: 'black',
            fontSize: 18,
            fontFace: 'courier',
            shape: 'rect'
          },
          Othertype: {
            color: {
              border: 'black',
              background: 'gray',
              highlight: {
                border: 'black',
                background: 'lightgray'
              }
            },
            fontSize: 18,
            fontFace: 'arial',
            shape: 'circle'
          }
		  }
		  
var groupOptions = {}