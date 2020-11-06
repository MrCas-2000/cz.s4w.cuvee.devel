package cz.burios.web;

import javax.inject.Inject;
import javax.servlet.ServletContextEvent;
import javax.servlet.annotation.WebListener;
import javax.servlet.http.HttpSessionEvent;

import org.jboss.weld.environment.servlet.Listener;

@WebListener
public class ApplicationListner extends Listener {
	
	@Inject ApplicationInfo info; 
	
	@Override
	public void contextInitialized(ServletContextEvent event) {
		info.setTitle("Buriosca.cz - Suix");
		System.out.println("ApplicationListener.contextInitialized( " + info.getTitle() + " )");
		super.contextInitialized(event);
		
		String debug = System.getenv("DEBUG");
		ApplicationConfig.DEBUG = (debug != null);
		System.out.println("debug: " + debug + ", DEBUG: " + ApplicationConfig.DEBUG);
	}

	@Override
	public void contextDestroyed(ServletContextEvent event) {
		System.out.println("ApplicationListner.contextDestroyed()");
		super.contextDestroyed(event);
	}
	
	@Override
	public void sessionDestroyed(HttpSessionEvent event) {
		// System.out.println("ApplicationListner.sessionDestroyed()");
		super.sessionDestroyed(event);
	}
	
	@Override
	public void sessionCreated(HttpSessionEvent event) {
		// System.out.println("ApplicationListner.sessionCreated()");
		super.sessionCreated(event);
	}	
}
