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

public class RDFDatabase {
  private static Model model;

  public RDFDatabase(String inputFile)
  {        
    // create an empty model
    model = ModelFactory.createDefaultModel();

    // use the FileManager to find the input file
    InputStream in = FileManager.get().open(inputFile);
    if (in == null) {
      throw new IllegalArgumentException( "File: " + inputFile + " not found");
    }

    // read the RDF/XML file
    model.read( in, "" );

    System.out.println("RDFCreated and Waiting");
    System.out.println(">> THIS IS A TEST ENVIRONMENT, THE RESULTING GRAPH IS A STATIC GRAPH lesmis.rdf <<");
  }

  public String queryDB(String queryString)
  {
    //Size of the graph that will be returned in the test-environment.
    //Change here for diffrent size of graphs.
    //Graph g = new Graph(100);
    //queryString = g.toJson();
    //System.out.println(queryString);

    //if(true)
    //return queryString;
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

      return resGraph.toJson();
    } finally { qexec.close() ; }
  }

  //Returns all the predicates in the RDF-data as a JSON array.
  public String getPredicates()
  {
    return "{\"predicates\":[\"tmp\"]}";
  }
}
