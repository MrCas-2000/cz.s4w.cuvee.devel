package cz.burios.web.pages;

import java.util.HashMap;
import java.util.Map;

import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import cz.burios.web.model.Theme;
import cz.burios.web.model.Themes;
import cz.burios.web.model.UserContext;
import cz.burios.web.model.Version;
import cz.burios.web.model.Versions;

@Path("/main/actions")
@RequestScoped
public class MainPageActions {

	@Inject UserContext user;
	@Inject Versions versions;
	@Inject Themes themes;
	
	@GET
	@Path("/changeVersion/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response changeVersion(@PathParam("id") String id) {
		Version version = null;
		try {
			version = versions.getRecord(id);
			user.setVersion(version);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return Response.ok().entity(version).build();
	}

	@GET
	@Path("/changeTheme/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response changeTheme(@PathParam("id") String id) {
		Theme theme = null;
		try {
			theme = themes.getRecord(id);
			user.setTheme(theme);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return Response.ok().entity(theme).build();
	}
}
