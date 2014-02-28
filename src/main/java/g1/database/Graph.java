package g1.database;
import java.io.*;
import java.util.ArrayList;
import java.util.List;

public class Graph {
  public List nodes = new ArrayList();
  public List links = new ArrayList();
  Graph()
  {
    Node n = new Node();
    nodes.add(n);
  }
}
