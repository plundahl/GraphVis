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
  private Map<String, Integer> nodeMap = new HashMap<String, Integer>();

  Graph()
  {
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
