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


public class RDFDatabaseSingleton {
	private static RDFDatabase instance = null;
	protected RDFDatabaseSingleton() {}
	
	public synchronized static RDFDatabase getInstance() {
		if(instance==null) {
			instance = new RDFDatabase("ont_student_inf.rdf");
		}
		return instance;
	}
}
