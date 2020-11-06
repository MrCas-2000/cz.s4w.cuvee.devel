package cz.burios.web.services;

import javax.enterprise.inject.spi.CDI;
import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.UriInfo;

import cz.burios.web.model.UserContext;

public abstract class AbstractService {

	@Context protected UriInfo uri;
	@Context protected ServletContext scx;
	@Context protected HttpServletRequest request;
	@Context protected HttpServletResponse response;

	protected UserContext user;
	
	public AbstractService() {
		user = CDI.current().select(UserContext.class).get();
	}

	/**
	 * 
	 * @param user
	 */
	public void setUser(UserContext user) {
		this.user = user;
	}
	
	/**
	 * 
	 * @return
	 */
	public UserContext getUser() {
		return this.user();
	}

	/**
	 * 
	 * @return
	 */
	public UserContext user() {
		return this.user;
	}

}
