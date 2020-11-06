package cz.burios.web;

import java.io.Serializable;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Named;

@Named("info")
@ApplicationScoped
public class ApplicationInfo implements Serializable {

	private static final long serialVersionUID = 3235027076873856335L;

	protected String id = "cuvee";
	protected String name = "Cuvee";
	protected String version = "1.7.6";
	protected String title = "Smart4Web.cz - Cuvee";
	protected String subtitle = "JQuery UI Framework";
	protected String jqVer = "1.8.3";
	
	public String getId() {
		return id;
	}
	
	public void setId(String id) {
		this.id = id;
	}
	
	public String getName() {
		return name;
	}
	
	public void setName(String name) {
		this.name = name;
	}
	
	public String getVersion() {
		return version;
	}
	
	public void setVersion(String version) {
		this.version = version;
	}
	
	public String getTitle() {
		return title;
	}
	
	public void setTitle(String title) {
		this.title = title;
	}
	
	public String getSubtitle() {
		return subtitle;
	}
	
	public void setSubtitle(String subtitle) {
		this.subtitle = subtitle;
	}
	
	public String getJqVer() {
		return jqVer;
	}
	
	public void setJqVer(String jqVer) {
		this.jqVer = jqVer;
	}
}