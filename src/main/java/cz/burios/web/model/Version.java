package cz.burios.web.model;

import java.io.Serializable;

public class Version implements Serializable {

	private static final long serialVersionUID = 7752543774222805563L;
	
	protected String id;
	protected String title;
	
	public Version() {
		
	}

	public Version(String id, String title) {
		super();
		this.id = id;
		this.title = title;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}
	
}
