package cz.burios.web.pages;

import java.util.HashMap;
import java.util.Map;

import javax.enterprise.context.RequestScoped;

import javax.inject.Inject;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.UriInfo;

import org.glassfish.jersey.server.mvc.Viewable;

import cz.burios.web.model.UserContext;

@Path("/devel")
@RequestScoped
public class DevelPage {

	@Context UriInfo uri;
	
	@Inject UserContext user;
	
	@GET
	@Produces(MediaType.TEXT_HTML)
	public Viewable page() {
		Map<String, Object> model = new HashMap<>();
		if (!user.hasBaseUri()) {
			user.setBaseUri(getBaseUri());
		}
		//return new Viewable("/devel.jsp", model);
		return new Viewable("/dev/slide-menu.jsp", model);
	}
	
	protected String getBaseUri() {
		String s = ("" + uri.getBaseUri());
		if (s.endsWith("/")) s = s.substring(0, s.length()-1);
		return s;
	}
}
