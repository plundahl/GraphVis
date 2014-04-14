package g1.database;

import java.io.*;
import java.io.File;
import java.io.FilenameFilter;
import java.lang.Override;
import java.lang.String;

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


public class RDFDatabaseSingleton {
	private static RDFDatabase instance = null;
	protected RDFDatabaseSingleton() {}
	
	public synchronized static RDFDatabase getInstance() {
		if(instance==null) {
			File rdfs[] = new File("./rdf").listFiles(new FilenameFilter() {
                @Override
                public boolean accept(File dir, String name) {
                    if(name.endsWith(".rdf")) return true;
                    return false;
                }
            });
            if(rdfs.length>0) {
                System.out.println("Attempting to load "+rdfs[0].getName());
                instance = new RDFDatabase(rdfs[0].getAbsolutePath());
            } else {
                System.err.println("No file with suffix .rdf could be found.");
                System.exit(1);
            }
			//instance = new RDFDatabase("ont_student_inf.rdf");
		}
		return instance;
	}
}
