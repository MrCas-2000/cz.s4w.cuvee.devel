package cz.burios.web;

import org.glassfish.jersey.jackson.JacksonFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.server.mvc.jsp.JspMvcFeature;
import org.glassfish.jersey.servlet.ServletProperties;

public class ApplicationConfig extends ResourceConfig {

	public static boolean DEBUG = false;
	
	public ApplicationConfig() {
		System.out.println("ApplicatinConfig.ApplicatinConfig()");
		
		packages(ApplicationConfig.class.getPackage().getName());
		
		property(ServletProperties.FILTER_FORWARD_ON_404, "true");
		property(ServletProperties.FILTER_STATIC_CONTENT_REGEX,  "(/(libs)/?.*)|(/favicon\\.png)");
		register(JacksonFeature.class);
		
		register(JspMvcFeature.class);
		property(JspMvcFeature.TEMPLATE_BASE_PATH, "/WEB-INF/views/");
	}	
}
