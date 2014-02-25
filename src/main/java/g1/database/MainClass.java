package g1.database;
import java.io.*;

public class MainClass {
	private static RDFDatabase rdf;
    public static void main (String args[]) {
    	rdf = new RDFDatabase("lesmis.rdf");
    	String queryString = "SELECT ?x ?y WHERE {?x ?y \"1\"}";
    	String s = rdf.queryDB(queryString);
    	System.out.println(s);
    	queryString = "SELECT ?x ?y WHERE {?x ?y \"2\"}";
    	s = rdf.queryDB(queryString);
    	System.out.println(s);
    }
}
