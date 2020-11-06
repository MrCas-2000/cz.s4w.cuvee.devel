package cz.burios.web.pages.actions;

import javax.enterprise.context.RequestScoped;
import javax.enterprise.inject.spi.CDI;
import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.google.gson.Gson;

import cz.burios.web.model.Theme;
import cz.burios.web.model.Themes;
import cz.burios.web.model.UserContext;
import cz.burios.web.model.Version;
import cz.burios.web.model.Versions;

@Path("/app/page/desktop/actions")
@RequestScoped
public class DesktopPageActions {

	private @Inject UserContext user;
	
	@GET
	@Path("/changeTheme/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response changeTheme(@PathParam("id") String id) {
		System.out.println("DesktopPageActions.changeTheme(" + id + ")");
		Theme theme = null;
		try {
			Themes themes = CDI.current().select(Themes.class).get();
			theme = themes.getRecord(id);
			System.out.println("DesktopPageActions.changeTheme(" + id + ").theme: " + new Gson().toJson(theme));
			user.setTheme(theme);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return Response.ok().entity(new Gson().toJson(theme)).build();
	}
	
	
	@GET
	@Path("/changeVersion/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response changeVersion(@PathParam("id") String id) {
		System.out.println("DesktopPageActions.changeVersion(" + id + ")");
		Version version = null;
		try {
			Versions versions = CDI.current().select(Versions.class).get();
			version = versions.getRecord(id);
			System.out.println("DesktopPageActions.changeVersion(" + id + ").version:" + new Gson().toJson(version));
			user.setVersion(version);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return Response.ok().entity(new Gson().toJson(version)).build();
	}
}
