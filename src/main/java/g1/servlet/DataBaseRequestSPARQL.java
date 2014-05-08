package g1.servlet;
 
import java.io.IOException;
import java.util.*;
import java.io.BufferedReader;
import java.io.PrintWriter;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import g1.database.RDFDatabase;
import g1.database.RDFDatabaseSingleton;
 
public class DataBaseRequestSPARQL extends HttpServlet
{
    RDFDatabase db = RDFDatabaseSingleton.getInstance();

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
    {
        response.setContentType("text/html");
        response.setStatus(HttpServletResponse.SC_OK);
        
       	String query = request.getReader().readLine();
		
        String resp = db.SPARQLToText(query);
      	
		PrintWriter pw = response.getWriter();
		pw.println(resp);
		pw.flush();
    }
}
