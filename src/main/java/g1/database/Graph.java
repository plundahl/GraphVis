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

  public void addTripplet(String first, String link, String last)
  {
    String linkKey = first+link+last;
    if(!linkMap.containsKey(linkKey))
    {
      if(!nodeMap.containsKey(first))
      {
        addNode(first);
      }
      if(!nodeMap.containsKey(last))
      {
        addNode(last);
      }
      linkMap.put(linkKey,nrOfNodes);
      addLink(nodeMap.get(first),nodeMap.get(last), link); 
    }
  }

  //Sets the type of a node, if that node exists
  public void setType(String node, String type)
  {
    if(nodeMap.containsKey(node))
    {
      int nodePos = nodeMap.get(node);
      nodes.get(nodePos).type = type;
    }
  }
  
  private void addLink(int first, int last)
  {
    Link l = new Link();
    l.source = first;
    l.target =last;
    links.add(l);
  }

  private void addLink(int first, int last, String type)
  {
    Link l = new Link();
    l.source = first;
    l.target =last;
    l.type = type;
    links.add(l);
  }

  void addNode(String tmp)
  {
    Node n = new Node();
    nodes.add(n);
    nodeMap.put(tmp,nrOfNodes);
    nrOfNodes++;
  }

  //TODO
  //This is used for testing graph outputs.
  //It creates a random graph of size test.
  Graph(int test)
  {

    for(int i = 0; i < test; i++)
    {
      Node n = new Node();
      nodes.add(n);
      for(int j = 0; j<3; j++)
      {
        Link l = new Link();
        l.source = (int)(Math.random()*test);
        l.target =(int)(Math.random()*test);
        links.add(l);
      }
    }
  }

  //Function for converting the graph to JSON output.
  String toJson()
  {
    String result = "{\"nodes\":[";
    //add all nodes:
    for(int i = 0; i < nodes.size(); i++)
    {
      if(i>0)
        result+=",";
      result+="{}";
    }

    result += "],\"links\":[";
    //add all links:
    for(int i = 0; i < links.size(); i++)
    {
      Link l = (Link)links.get(i);
      if(i>0)
        result+=",";
      result+="{\"source\":";
      result+=l.source;
      result+=",\"target\":";
      result+=l.target;
      result+="}";
    }

    result += "]}";
    return result;
  }
}
