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
 
public class DataBaseRequestLiterals extends HttpServlet
{
	RDFDatabase db = RDFDatabaseSingleton.getInstance();
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
    {
        response.setContentType("text/html");
        response.setStatus(HttpServletResponse.SC_OK);
		//SEND query TO DB & GET resp
		String resp = db.getLiterals();
		//Return resp as response 
		PrintWriter pw = response.getWriter();
		pw.println(resp);
		pw.flush();
    }
}
