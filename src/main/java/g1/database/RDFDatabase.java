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

  private int TIMEOUT = 2000;

  private static Model model;
  private QueryExecution qexec;
  private String prefix = 
    "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> "+
    "PREFIX owl: <http://www.w3.org/2002/07/owl#> "+
    "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> "+
    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> "+
    "PREFIX KS: <http://www.foi.se/2007/KSOne.owl#> ";


  /*
   * This is how you creat a database interface, inputFile should be the location of your .rdf file.
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
    //System.out.println(jsonToSPARQLResult(jsonString));
    resultGraph.sparqlResult = jsonToSPARQLResult(jsonString);

    //Has to be called to close the query.
    closeQuery(); 

    String json = gson.toJson(resultGraph);
    System.out.println("Nr of links in result: " + resultGraph.links.size());
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
    System.out.println("Worked");
    return result;
  }


  //Takes a resultset and turns it into a graph.
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
        RDFNode p = soln.get("l"+i) ;
        RDFNode o = soln.get("n"+l.target) ;
        if (true || o.isURIResource())
        {
          //TODO: only allow edges between diffrent nodes
          if(! s.toString().equals(o.toString()))
            result.addTripplet(s.toString() , p.toString() , o.toString());
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

  //Takes a graph and builds the corresponding sparqleQuery
  private String buildQuery(Graph queryGraph)
  {

    //TODO: Add literals, type, etc...

    String query = "SELECT ";
    for(int i = 0; i<queryGraph.nodes.size(); i++)
    {
      query += "?n"+i+" ";
    }
    for(int i = 0; i<queryGraph.links.size(); i++)
    {
      query += "?l"+i+" ";
    }
    query += "WHERE { ";
    for(int i = 0; i<queryGraph.links.size(); i++)
    {
      Link l = queryGraph.links.get(i);
      query += "?n" + l.source + " ?l" + i + " ?n" + l.target + ". ";
    }


    query += "FILTER ( ";
    //"SELECT distinct ?p { ?s ?p ?o filter(!isLiteral(?o))}";
    for(int i = 0; i<queryGraph.nodes.size(); i++)
    {
      if( i > 0)
        query += " && ";
      query += "!isLiteral(?n"+i+")";
    }
    query += " ) }";
    return query;
  }

  //Used for running querys
  private ResultSet runQuery(String queryString)
  {
    ResultSet results = null;
    try{
    queryString = prefix + queryString;
    Query query = QueryFactory.create(queryString) ;
    qexec = QueryExecutionFactory.create(query, model) ;
    qexec.setTimeout(TIMEOUT);
    //try {
    results = qexec.execSelect() ;
    }catch (QueryCancelledException e)
    {
      results = null;
    }
    return results;
    //} finally { qexec.close() ; }
  }
  //Must be used after runQuery;
  private void closeQuery()
  {
    qexec.close();
  }

  //Returns all the possible 'edges' in the graph.
  public synchronized String getPredicates()
  {
    String queryString = prefix +
      "SELECT distinct ?p { ?s ?p ?o filter(!isLiteral(?o))}";
    ResultSet results = runQuery(queryString);

    String resultStr = "{\"edgetypes\":[";
    for(int i = 0; results.hasNext(); i++)
    {
      if (i>0)
        resultStr += ",";
      QuerySolution soln = results.nextSolution() ;
      RDFNode lit = soln.get("p");
      Resource test = soln.getResource("p");
      System.out.println(test.getNameSpace());
      System.out.println(test.getLocalName());
      resultStr += "\"" + lit.toString() + "\"";

    }
    resultStr += "]}";
    closeQuery();
    return resultStr;
  }


  //Returns all the Literals in the RDF-data as a JSON map.
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

  //Returns all rdf:type that is possible for every node to have in the graph.
  public synchronized String getTypes()
  {
    String queryString =
      "SELECT distinct ?type { ?s a ?type }";
    ResultSet results = runQuery(queryString);

    String resultStr = "{\"types\":[";
    for(int i = 0; results.hasNext(); i++)
    {
      if (i>0)
        resultStr += ",";
      QuerySolution soln = results.nextSolution() ;
      RDFNode lit = soln.get("type");
      Resource test = soln.getResource("type");
      //System.out.println(test.getNameSpace());
      //System.out.println(test.getLocalName());
      resultStr += "\"" + lit.toString() + "\"";

    }
    resultStr += "]}";
    closeQuery();
    return resultStr;
  }
}









  //Old function, use jsonQuery
/*  public String queryDB(String queryString)
  {
    //Size of the graph that will be returned in the test-environment.
    //Change here for diffrent size of graphs.
    //Graph g = new Graph(100);
    //queryString = g.toJson();
    //System.out.println(queryString);


    //System.out.println(jsonQuery(queryString));
    if(true)
      return jsonQuery(queryString);

    queryString = 
      "PREFIX foo:<http://www.franz.com/lesmis#> " +
      "PREFIX dc:<http://purl.org/dc/elements/1.1/>" +
      "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>" +
      "PREFIX rdfns:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
      "SELECT ?x ?y ?z WHERE {?x ?y ?z}";

    Graph resGraph = new Graph();
    Query query = QueryFactory.create(queryString) ;
    QueryExecution qexec = QueryExecutionFactory.create(query, model) ;
    try {
      ResultSet results = qexec.execSelect() ;
      for ( ; results.hasNext() ; )
      {
        QuerySolution soln = results.nextSolution() ;
        RDFNode x = soln.get("x") ;
        RDFNode y = soln.get("y") ;
        RDFNode z = soln.get("z") ;
        if (z.isURIResource())
        {
          //System.out.println(x.toString() + y.toString() + z.toString());
          resGraph.addTripplet(x.toString() , y.toString() , z.toString());
        }
      }

      //return "";
      return resGraph.toJson();
    } finally { qexec.close() ; }
  }*/
