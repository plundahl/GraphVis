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
 * This class is used for representing nodes in our java-graph.
 * It is also used for converting from/to json
 */

package g1.database;
import java.io.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

public class Node {
  public String type;
  public String value;
  public List<String> literals = new ArrayList<String>();
  transient public String sparqlID = null;

  Node(String tmp)
  {
    value = tmp;
  }

  /* 
   * Returns true if the node has a type,
   * used when creating a sparql-query from a graph.
   */
  public boolean hasType()
  {
    return !type.equals("?");
  }

  /*
   * Same as hasType() but for literals
   */
  public boolean hasLit()
  {
    return !literals.isEmpty();
  }

  /*
   * Returns the number of literals this node has
   */
  public int nrLit()
  {
    return literals.size()/2;
  }

  /*
   * Returns the i:th literal.
   */
  public String getLit(int i)
  {
    return literals.get(i*2+1);
  } 
  
  /*
   * Returns the type of the i:th literal.
   */
  public String getLitDomain(int i)
  {
    return literals.get(i*2);
  } 
}
