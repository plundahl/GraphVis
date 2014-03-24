package g1.database;

import java.io.*;

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
  private static Model model;
  private QueryExecution qexec;
  private String prefix = 
      "PREFIX foo:<http://www.franz.com/lesmis#> " +
      "PREFIX dc:<http://purl.org/dc/elements/1.1/>" +
      "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>" +
      "PREFIX rdfns:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>";

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
    System.out.println(">> THIS IS A TEST ENVIRONMENT, THE RESULTING GRAPH IS A STATIC GRAPH lesmis.rdf <<");
    //System.out.println(getLiterals());
    //System.out.println(getTypes());
  }

  //Old function, use jsonQuery
  public String queryDB(String queryString)
  {
    //Size of the graph that will be returned in the test-environment.
    //Change here for diffrent size of graphs.
    //Graph g = new Graph(100);
    //queryString = g.toJson();
    //System.out.println(queryString);

    //if(true)
    //return queryString;

    System.out.println(queryString);
    //System.out.println(jsonQuery(queryString));
    if(true)
      return jsonQuery(queryString);
    /*Gson gson = new Gson();
    Graph obj = gson.fromJson(queryString, Graph.class);

    String json = gson.toJson(obj);
    System.out.println(json);*/

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
  }

  public synchronized String jsonQuery(String jsonString)
  {
    Gson gson = new Gson();
    Graph queryGraph = gson.fromJson(jsonString, Graph.class);
    String test = buildQuery(queryGraph);

    ResultSet results = runQuery(test);
    Graph resultGraph = buildAnswer(results, queryGraph);

    closeQuery();

    String json = gson.toJson(resultGraph);
    System.out.println(resultGraph.links.size());
    return json;
  }

  private Graph buildAnswer(ResultSet results, Graph queryGraph)
  {
    Graph result = new Graph();
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
    return result;
  }

  private String buildQuery(Graph queryGraph)
  {
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
    query += "}";
    return query;
  }

  //Used for running querys
  private ResultSet runQuery(String queryString)
  {
    queryString = prefix + queryString;
    Query query = QueryFactory.create(queryString) ;
    qexec = QueryExecutionFactory.create(query, model) ;
    ResultSet results;
    //try {
    results = qexec.execSelect() ;
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
    String queryString =
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


  //Returns all the Literals in the RDF-data as a JSON array.
  public synchronized String getLiterals()
  {
    String queryString = 
      "SELECT DISTINCT ?lit {?s ?p ?lit  filter(isLiteral(?lit)) }";
    ResultSet results = runQuery(queryString);

    String resultStr = "{\"literals\":[";
    for(int i = 0; results.hasNext(); i++)
    {
      if (i>0)
        resultStr += ",";
      QuerySolution soln = results.nextSolution() ;
      RDFNode lit = soln.get("lit");
      resultStr += "\"" + lit.toString() + "\"";

    }
    resultStr += "]}";
    closeQuery();
    return resultStr;
  }
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
      System.out.println(test.getNameSpace());
      System.out.println(test.getLocalName());
      resultStr += "\"" + lit.toString() + "\"";

    }
    resultStr += "]}";
    closeQuery();
    return resultStr;
  }
}
