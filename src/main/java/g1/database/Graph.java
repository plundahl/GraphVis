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


/*
 * This class is used for representing the graph as a java-object 
 * and used when converting from/to json
 */

package g1.database;
import java.io.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.lang.Math;

public class Graph {
  public List<Node> nodes = new ArrayList<Node>();
  public List<Link> links = new ArrayList<Link>();
  transient private Map<String, Integer> nodeMap = new HashMap<String, Integer>(); 
  transient private Map<String, Integer> linkMap = new HashMap<String, Integer>();
  transient private int nrOfNodes = 0;

  public String sparqlQuery;
  public String sparqlResult;

  Graph()
  {
  }

  /* 
   * Adds rdf/graph triplets to the graph, node - edge - node
   */
  public void addTripplet(String first, String link, String last)
  {
    String linkKey = first+link+last;
    //If the path is already in the graph, dont add it.
    if(!linkMap.containsKey(linkKey))
    {
      //Check if the nodes are new, if not dont add them.
      if(!nodeMap.containsKey(first))
      {
        addNode(first);
      }
      if(!nodeMap.containsKey(last))
      {
        addNode(last);
      }
      //Connect the nodes with the specified edge.
      linkMap.put(linkKey,nrOfNodes);
      addLink(nodeMap.get(first),nodeMap.get(last), link); 
    }
  }


  /*
   * Sets the type of a node, if that node exists.
   * TODO: Allow each node to have more then one type.
   */
  public void setType(String node, String type)
  {
    if(nodeMap.containsKey(node))
    {
      int nodePos = nodeMap.get(node);
      nodes.get(nodePos).type = type;
    }
  }
  
  /*
   * Adds a edge to the graph.
   */
  private void addLink(int first, int last)
  {
    Link l = new Link();
    l.source = first;
    l.target =last;
    links.add(l);
  }

  /*
   * Adds a link with it's type to the graph.
   */
  private void addLink(int first, int last, String type)
  {
    Link l = new Link();
    l.source = first;
    l.target =last;
    l.type = type;
    links.add(l);
  }

  /*
   * Adds a node to the graph.
   */
  void addNode(String tmp)
  {
    Node n = new Node(tmp);
    nodes.add(n);
    nodeMap.put(tmp,nrOfNodes);
    nrOfNodes++;
  }
  
  /*
   * Ths function is used to save the whole rdf-path for the node.
   */
  public void addID(String node, String id)
  {
    if(nodeMap.containsKey(node))
    {
      int i = nodeMap.get(node);
      nodes.get(i).sparqlID = id;
    }
  }

}
