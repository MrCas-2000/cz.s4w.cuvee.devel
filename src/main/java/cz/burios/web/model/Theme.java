package cz.burios.web.model;

import java.io.Serializable;

public class Theme implements Serializable {
	
	private static final long serialVersionUID = 6637985109213122600L;
	
	protected String id;
	protected String title;

	public Theme() {}
	
	public Theme(String id, String title) {
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
