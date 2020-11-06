package cz.burios.web.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class DesktopMenuItem implements Serializable {

	private static final long serialVersionUID = 2094278899682201095L;

	protected String id = "";
	protected String parentId = "";
	protected String label = "";
	protected String cssIcon = "k-icon k-i-file";
	protected String href = "";
	protected String type = "";
	protected Integer priority = 0;
	// protected String css = "desktop-menu-item";
	
	protected Modul modul;
	
	protected List<DesktopMenuItem> items;

	public DesktopMenuItem() {
		super();
	}
		
	public DesktopMenuItem(String parentId, String id, String label, String cssIcon, Modul modul, List<DesktopMenuItem> items) {
		super();
		this.parentId = parentId;
		this.id = id;
		this.label = label;
		this.cssIcon = cssIcon;
		this.modul = modul;
		this.items = items;
	}

	public DesktopMenuItem(String parentId, String id, String label, String cssIcon, String href, List<DesktopMenuItem> items) {
		super();
		this.parentId = parentId;
		this.id = id;
		this.label = label;
		this.cssIcon = cssIcon;
		this.href = href;
		this.items = items;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getParentId() {
		return parentId;
	}
	
	public void setParentId(String parentId) {
		this.parentId = parentId;
	}
	
	public String getLabel() {
		return label;
	}

	public void setLabel(String label) {
		this.label = label;
	}

	public String getCssIcon() {
		return cssIcon;
	}
	
	public void setCssIcon(String cssIcon) {
		this.cssIcon = cssIcon;
	}
	
	public String getHref() {
		return href;
	}

	public void setHref(String href) {
		this.href = href;
	}
	
	public String getType() {
		return type;
	}
	
	public void setType(String type) {
		this.type = type;
	}
	
	public Integer getPriority() {
		return priority;
	}
	
	public void setPriority(Integer priority) {
		this.priority = priority;
	}

	public List<DesktopMenuItem> getItems() {
		return items;
	}

	public void setItems(List<DesktopMenuItem> items) {
		this.items = items;
	}

	public DesktopMenuItem addItems(DesktopMenuItem item) {
		if (this.items == null) {
			this.items = new ArrayList<>();
		}
		this.items.add(item);
		return this;
	}
	@Override
	public String toString() {
		return "DesktopMenuItem [id=" + id + ", parentId=" + parentId + ", label=" + label + ", items=" + items + "]";
	}

	public Modul getModul() {
		return modul;
	}

	public void setModul(Modul modul) {
		this.modul = modul;
	}

}
