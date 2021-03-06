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

/* This class defines actions to be taken when a database request is caught via a HTTP POST
* call. This class extracts the request string from the POST request, calls an appropriate
* method in the Database instance and returns the result as a response to the POST request.
*
* This class serves to provide communication with database for graphical querying abilities.
*/ 
public class DataBaseRequest extends HttpServlet
{
   RDFDatabase db = RDFDatabaseSingleton.getInstance();//Get a reference to running Database
	
	//The following code defines the actions taken upon a POST request
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
   {
	   String req = request.getMethod();
      response.setContentType("text/html");
      response.setStatus(HttpServletResponse.SC_OK);

	   //Extract Query string from request
	   String query = request.getReader().readLine();
	
	   //Invoke query method in the database with query as input and save the response
	   String resp = db.jsonQuery(query);

	   //Return resp as response to the POST request 
	   PrintWriter pw = response.getWriter();
	   pw.println(resp);
	   pw.flush();
   }
}
