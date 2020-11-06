package cz.burios.web;

import javax.servlet.annotation.WebFilter;
import javax.servlet.annotation.WebInitParam;

import org.glassfish.jersey.servlet.ServletContainer;

@WebFilter(urlPatterns="/*", initParams = { @WebInitParam(name = "javax.ws.rs.Application", value = "cz.burios.web.ApplicationConfig") })
public class ApplicatinFilter extends ServletContainer {
	private static final long serialVersionUID = -191003322586335134L;
}
