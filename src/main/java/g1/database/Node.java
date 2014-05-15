package g1.database;
import java.io.*;
import java.util.ArrayList;
import java.util.List;

public class Node {
  public String type;
  public String value;

  Node(String tmp)
  {
    value = tmp;
  }

  public boolean hasType()
  {
    return !type.equals("?");
  }
}
