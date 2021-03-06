package cz.burios.web.pages;

import java.util.HashMap;
import java.util.Map;

import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import org.glassfish.jersey.server.mvc.Viewable;

import cz.burios.web.model.UserContext;

@RequestScoped
@Path("/docs/main")
public class DocumentationPage {

	@Inject UserContext user;
		
	@GET
	@Produces(MediaType.TEXT_XML)	
	public Viewable page() {
		Viewable view = null;
		try {
			Map<String, Object> model = new HashMap<>();
			view = new Viewable("/app/docs/v1/main.jsp", model);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return view;
	}
}
