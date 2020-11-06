package cz.burios.web.model;

import java.io.Serializable;

public class Modul implements Serializable {

	private static final long serialVersionUID = -356559656821349444L;

	protected String id;
	protected String templatePath;

	public Modul() {
	}

	public Modul(String id, String pagePath) {
		super();
		this.id = id;
		this.templatePath = pagePath;
	}

	// ----- Getter & setter -----

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getTemplatePath() {
		return templatePath;
	}

	public void setTemplatePath(String pagePath) {
		this.templatePath = pagePath;
	}

	@Override
	public String toString() {
		return "Modul [id=" + id + ", templatePath=" + templatePath + "]";
	}
}
