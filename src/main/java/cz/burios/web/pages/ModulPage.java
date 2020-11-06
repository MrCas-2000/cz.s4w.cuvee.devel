package cz.burios.web.pages;

import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.UriInfo;

import org.glassfish.jersey.server.mvc.Viewable;

import cz.burios.web.model.Modul;
import cz.burios.web.model.Modules;
import cz.burios.web.model.UserContext;

@RequestScoped
@Path("/modul")
public class ModulPage {

	@Context UriInfo uri;
	
	@Inject UserContext user;
	@Inject Modules modules; 
	
	@GET
	@Path("/{id}")
	@Produces(MediaType.TEXT_HTML)
	public Viewable page(@PathParam("id") String id) {
		Viewable view = null;
		try {
			MultivaluedMap<String, String> params = uri.getQueryParameters();
			if (!params.isEmpty()) {
				
			}
			String tmplPath = getTemplatePath(id);
			System.out.println("ModulPage.page().tmplPath: " + tmplPath);
			view = new Viewable(tmplPath);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return view;
	}
	
	protected String getTemplatePath(String id) {
		String tmplPath = "/main-welcome.jsp";
		Modul md = modules.getRecord(id);
		if (md != null) {
			tmplPath = md.getTemplatePath();
			if (tmplPath == null || tmplPath.isEmpty()) {
				tmplPath = "/main-welcome.jsp";
			} else {
				if (!tmplPath.startsWith("/"))
					tmplPath = "/" + tmplPath;
			}
		}
		return tmplPath;
	}
}
