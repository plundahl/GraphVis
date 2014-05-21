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
 * Main class for querying and handeling the database.
 */

package g1.database;

import java.io.*;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

import com.hp.hpl.jena.query.Query;
import com.hp.hpl.jena.query.QueryExecution;
import com.hp.hpl.jena.query.QueryExecutionFactory;
import com.hp.hpl.jena.query.QueryFactory;
import com.hp.hpl.jena.query.ResultSet;
import com.hp.hpl.jena.query.ResultSetFormatter;
import com.hp.hpl.jena.rdf.model.Model;
import com.hp.hpl.jena.rdf.model.ModelFactory;
import com.hp.hpl.jena.util.FileManager;
import com.hp.hpl.jena.query.*;
import com.hp.hpl.jena.rdf.model.*;
import com.hp.hpl.jena.shared.PrefixMapping;

import com.google.gson.Gson;


public class RDFDatabase {

  //TODO: Change static timeout to a dynamic timout.
  private int TIMEOUT = 2000;

  private static Model model;
  private QueryExecution qexec;

  //TODO: Make this dynamic and load it from a config file.
  private String prefix = 
    "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> "+
    "PREFIX owl: <http://www.w3.org/2002/07/owl#> "+
    "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> "+
    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> "+
    "PREFIX KS: <http://www.foi.se/2007/KSOne.owl#> ";


  /*
   * This is how you start the database interface, inputFile should be the location of your .rdf file.
   */
  public RDFDatabase(String inputFile)
  {        
    // create an empty model
    model = ModelFactory.createDefaultModel();
    model.setNsPrefixes(PrefixMapping.Standard);

    // use the FileManager to find the input file
    InputStream in = FileManager.get().open(inputFile);
    if (in == null) {
      throw new IllegalArgumentException( "File: " + inputFile + " not found");
    }

    // read the RDF/XML file
    model.read( in, "" );

    System.out.println("RDFCreated and Waiting");
  }


  /*
   * Takes a json-graph as input and returns a json-graph as output.
   * The input will creat a sparql-query and the output graph will 
   * be the sparql-result represented as a graph.
   */
  public synchronized String jsonQuery(String jsonString)
  {
    //From json- to java-object.
    Gson gson = new Gson();
    Graph queryGraph = gson.fromJson(jsonString, Graph.class);
    //From graph to sparql-query
    String sparqlString = buildQuery(queryGraph);
    //Run the query and create the resulting graph.
    ResultSet results = runQuery(sparqlString);
    Graph resultGraph = buildAnswer(results, queryGraph);
    resultGraph.sparqlQuery = sparqlString;
    closeQuery();

    setLiterals(resultGraph);

    resultGraph.sparqlResult = jsonToSPARQLResult(jsonString);

    //Has to be called to close the query.
    closeQuery();

    //Set the types in the graph
    setTypes(resultGraph); 

    String json = gson.toJson(resultGraph);
    return json;
  }

  /*
   * Take a json-graph and return the sparql-request.
   */
  public String jsonToSPARQL(String jsonString)
  {
    Gson gson = new Gson();
    Graph queryGraph = gson.fromJson(jsonString, Graph.class);
    String sparqlString = buildQuery(queryGraph);
    return sparqlString;
  }

  /*
   * Get the sparql-result as text not as a graph.
   */
  public String jsonToSPARQLResult(String jsonString)
  {
    String result = "";
    try{
      //Create the sparql-query
      Gson gson = new Gson();
      Graph queryGraph = gson.fromJson(jsonString, Graph.class);
      String sparqlString = buildQuery(queryGraph);

      sparqlString = prefix + sparqlString;

      Query query = QueryFactory.create(sparqlString) ;

      //Run the query
      ResultSet results = runQuery(sparqlString);

      //Output the result to a string.
      ByteArrayOutputStream out = new ByteArrayOutputStream();
      //TODO: Choose a good format.
      ResultSetFormatter.out(out, results, query);
      result = new String(out.toString());
      //Close this query. 
      closeQuery();
    }catch (QueryCancelledException e )
    {
      System.out.println("Timed out");
      return "Query timed out";
    }
    return result;
  }

  /*
   * Query as a normal sparql query.
   * Returns the result as a text.
   */
  public String SPARQLToText(String sparqlString)
  {
    String result = "";
    try{

      sparqlString = prefix + sparqlString;

      Query query = QueryFactory.create(sparqlString) ;

      //Run the query
      ResultSet results = runQuery(sparqlString);

      //Output the result to a string.
      ByteArrayOutputStream out = new ByteArrayOutputStream();
      //TODO: Choose a good format.
      //ResultSetFormatter.outputAsRDF(out, "RDFJSON", results);
      ResultSetFormatter.out(out, results, query);
      result = new String(out.toString());
      //Close this query. 
      closeQuery();
    }catch (QueryCancelledException e )
    {
      System.out.println("Timed out");
      return "Query timed out";
    }
    return result;
  }



  /*
   * Takes a resultset and the coresponding graphQuery and turns it into a result-graph.
   */
  private Graph buildAnswer(ResultSet results, Graph queryGraph)
  {
    Graph result = new Graph();
    //TODO If it's null it means the query timed out.
    try{
      for ( ; results.hasNext() ; )
      {
        QuerySolution soln = results.nextSolution() ;
        for(int i = 0; i<queryGraph.links.size(); i++)
        {
          Link l = queryGraph.links.get(i);
          RDFNode s = soln.get("n"+l.source) ;
          RDFNode p = null;
          if(!l.hasType())
            p = soln.get("l"+i) ;
          RDFNode o = soln.get("n"+l.target) ;
          if (o.isURIResource())
          {
            //TODO: only allow edges between diffrent nodes
            if(l.hasType())
              result.addTripplet(s.asResource().getLocalName() , l.type , 
                  o.asResource().getLocalName());
            else  
              result.addTripplet(s.asResource().getLocalName() , 
                  p.asResource().getLocalName(), 
                  o.asResource().getLocalName());

            result.addID(s.asResource().getLocalName(),s.toString());
            result.addID(o.asResource().getLocalName(),o.toString());
          }
          else
          {
            //TODO: Add the value to the node, not as a edge
          }

        }
      }
    }catch (QueryCancelledException e )
    {
      result = new Graph();
    }
    return result;
  }

  /*
   * Add literals to a result-graph.
   * TODO: Do this in the search, not after. This is bad for preformace.
   */
  private void setLiterals(Graph g)
  {
    //Run this query for every node in the graph, and add all literals to that node.
    for(int i = 0; i < g.nodes.size(); i++)
    {
      Node n = g.nodes.get(i);
      String sparqlString = "SELECT ?node ?link WHERE { <" +n.sparqlID + "> ?link ?node. FILTER ( isLiteral(?node) ) }";
      ResultSet results = runQuery(sparqlString);
      try{
        for ( ; results.hasNext() ; )
        {
          QuerySolution soln = results.nextSolution() ;
          RDFNode node = soln.get("node") ;
          RDFNode link = soln.get("link") ;

          n.literals.add(link.toString());
          n.literals.add(node.toString());
        }

      }catch (QueryCancelledException e )
      {
      }

    }
    closeQuery();
  }

  /*
   * Takes a java graph and builds the corresponding sparqleQuery
   */
  private String buildQuery(Graph queryGraph)
  {

    //TODO: Add literals, type, etc...

    String query = "SELECT ";

    //TODO: Decide what to do with empty querys.
    if(queryGraph.nodes.size() == 0)
      query += "?empty ";

    //Loops through all nodes in the graph and adds them to the query.
    for(int i = 0; i<queryGraph.nodes.size(); i++)
    {
      query += "?n"+i+" ";
    }
    //Loops through all edges in the graph and adds them to the query.
    for(int i = 0; i<queryGraph.links.size(); i++)
    {
      if(!queryGraph.links.get(i).hasType())
        query += "?l"+i+" ";
    }
    query += "WHERE { ";

    //Loops through all nodes in the graph and adds the literal values specified in the search.
    for(int i = 0; i<queryGraph.nodes.size(); i++)
    {
      Node n = queryGraph.nodes.get(i);
      if(n.hasType())
        query += "?n" + i + " a <" + n.type + "> . ";
      if(n.hasLit())
        for(int j = 0; j < n.nrLit(); j++)
        {
          query += "?n" + i + " <" + n.getLitDomain(j) + "> \"" + n.getLit(j) + "\" .";
        }
    }

    //Creats the WHERE part of the query, and eighter makes a row with unknown edge-type,
    //or with the edge-type specified in the search.
    for(int i = 0; i<queryGraph.links.size(); i++)
    {
      Link l = queryGraph.links.get(i);
      if(l.hasType())
        query += "?n" + l.source + " <" + l.type +"> ?n" + l.target + ". ";
      else
        query += "?n" + l.source + " ?l" + i + " ?n" + l.target + ". ";
    }


    query += "FILTER ( ";

    //TODO: added to deal with empty querys
    if(queryGraph.nodes.size() == 0)
      query += "!isLiteral(?empty)";

    //TODO: This makes sure there will be no literals in the search result,
    //but a better way would be to save them and use them directly.
    for(int i = 0; i<queryGraph.nodes.size(); i++)
    {
      if( i > 0)
        query += " && ";
      query += "!isLiteral(?n"+i+")";
    }
    query += " ) }";
    return query;
  }

  /*
   * This function is running a sparql-query, and returns the ResultSet.
   */
  private ResultSet runQuery(String queryString)
  {
    ResultSet results = null;
    try{
      queryString = prefix + queryString;
      Query query = QueryFactory.create(queryString) ;
      qexec = QueryExecutionFactory.create(query, model) ;
      qexec.setTimeout(TIMEOUT);
      results = qexec.execSelect() ;
    }catch (QueryCancelledException e)
    {
      results = null;
    }
    return results;
  }

  //TODO: This must be used after runQuery
  //try to build this into runQuery instead of calling it afterwards.
  private void closeQuery()
  {
    qexec.close();
  }

  /*
   * Returns all the possible 'edges' in the graph.
   * this is used for the dropdown menu in the GUI.
   */
  public synchronized String getPredicates()
  {
    String queryString = prefix +
      "SELECT distinct ?p { ?s ?p ?o filter(!isLiteral(?o))} ORDER BY ?p";
    ResultSet results = runQuery(queryString);

    String resultStr = "{\"edgetypes\":[";
    for(int i = 0; results.hasNext(); i++)
    {
      if (i>0)
        resultStr += ",";
      QuerySolution soln = results.nextSolution() ;
      RDFNode lit = soln.get("p");
      Resource test = soln.getResource("p");
      resultStr += "\"" + lit.toString() + "\"";

    }
    resultStr += "]}";
    closeQuery();
    return resultStr;
  }


  /*
   * Returns all the Literals in the RDF-data as a JSON map.
   * This is used for one of the dropdown menus in the GUI.
   */
  public synchronized String getLiterals()
  {
    Map<String, List<String>> literals = new HashMap<String, List<String>>();
    Gson gson = new Gson();
    String queryString = prefix + 
      "SELECT ?p ?lit {?s ?p ?lit  filter(isLiteral(?lit)) }";
    ResultSet results = runQuery(queryString);

    for(int i = 0; results.hasNext(); i++)
    {
      QuerySolution soln = results.nextSolution() ;
      RDFNode p = soln.get("p");
      RDFNode lit = soln.get("lit");
      if(!literals.containsKey(p.toString()))
      {
        List<String> list = new ArrayList<String>();
        literals.put(p.toString(),list);
      }
      List<String> list = literals.get(p.toString());
      list.add(lit.toString());

    }
    String json = "{ \"literals\" : " + gson.toJson(literals) + "}";

    closeQuery();
    return json;
  }

  /*
   * Returns all rdf:type that is possible for every node to have in the graph.
   * This is used for one of the dropdown menus in the GUI.
   */
  public synchronized String getTypes()
  {
    String queryString =
      "SELECT distinct ?type { ?s a ?type } ORDER BY ?type";
    ResultSet results = runQuery(queryString);

    String resultStr = "{\"types\":[";
    for(int i = 0; results.hasNext(); i++)
    {
      if (i>0)
        resultStr += ",";
      QuerySolution soln = results.nextSolution() ;
      RDFNode lit = soln.get("type");
      resultStr += "\"" + lit.toString() + "\"";

    }
    resultStr += "]}";
    closeQuery();
    return resultStr;
  }


  /*
   * Takes a result-graph and adds a type to every node that has one.
   * TODO: Allow more then one type per node.
   * TODO: Do this when you run a query, not afterwards.
   */
  private void setTypes(Graph g)
  {
    String queryString =
      "SELECT ?node ?type { ?node a ?type }";
    ResultSet results = runQuery(queryString);

    for(int i = 0; results.hasNext(); i++)
    {
      QuerySolution soln = results.nextSolution() ;
      RDFNode lit = soln.get("type");
      RDFNode node = soln.get("node");
      g.setType(node.asResource().getLocalName(), lit.asResource().getLocalName());
    }
    closeQuery();
  }
}
