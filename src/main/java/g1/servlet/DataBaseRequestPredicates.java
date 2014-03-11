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
 
public class DataBaseRequestPredicates extends HttpServlet
{
    RDFDatabase db = new RDFDatabase("lesmis.rdf");

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
    {
	String req = request.getMethod();
        response.setContentType("text/html");
        response.setStatus(HttpServletResponse.SC_OK);
	//response.getWriter().println("Request: " + req);

	//Get Query from request
	String query = request.getReader().readLine();
	
	//SEND query TO DB & GET resp
	String resp = db.getPredicates();

	//Return resp as response 
	PrintWriter pw = response.getWriter();
	pw.println(resp);
	pw.flush();
    }
}
