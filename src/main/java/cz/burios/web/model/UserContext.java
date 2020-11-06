package cz.burios.web.model;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.PostConstruct;
import javax.enterprise.context.SessionScoped;
import javax.inject.Named;

@Named("user")
@SessionScoped
public class UserContext implements Serializable {

	private static final long serialVersionUID = 9184709836481412199L;

	protected boolean logged = true;
	
	protected String baseUri = "";
	
	protected Map<String, Object> ext = new HashMap<>();
	protected Version version = new Version("2020.3", "Version 2020.3"); 
	protected Theme theme = new Theme("default-light", "Default - Light");
	protected Modul modul = new Modul("", "/main-welcome.jsp"); 
	
	public UserContext() {}
	
	@PostConstruct
	public void init() {
		version = new Version("2020.3", "Version 2020.3"); 
		theme = new Theme("default-light", "Default - Light");
	}
	
	public boolean isLogged() {
		return logged;
	}
	
	public void setLogged(boolean logged) {
		this.logged = logged;
	}

	public String getBaseUri() {
		return baseUri;
	}

	public void setBaseUri(String baseUri) {
		this.baseUri = baseUri;
	}
	
	public boolean hasBaseUri() {
		return baseUri != null && !baseUri.isEmpty() ;
	}

	public Map<String, Object> getExt() {
		return ext;
	}

	public void setExt(Map<String, Object> ext) {
		this.ext = ext;
	}
	
	public Version getVersion() {
		return version;
	}
	
	public void setVersion(Version version) {
		this.version = version;
	}
	
	public Theme getTheme() {
		return theme;
	}
	
	public void setTheme(Theme theme) {
		this.theme = theme;
	}

	@Override
	public String toString() {
		return "UserContext ["
				+ "logged=" + logged + ", "
				+ "baseUri=" + baseUri + ", "
				+ "version=" + version + ", "
				+ "theme=" + theme + ", "
				+ "ext=" + ext + 
				"]";
	}
	
	
}