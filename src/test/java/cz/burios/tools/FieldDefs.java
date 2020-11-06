package cz.burios.tools;

import java.util.ArrayList;
import java.util.List;

public class FieldDefs {
	
	String id = "";
	String parentId = "";
	String name = "";
	String comment = "";
	
	List<FieldDefs> items = new ArrayList<>();
	
	FieldDefs(String name) {
		this.name = name;
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

	public String getName() {
		return name;
	}
	
	public void setName(String name) {
		this.name = name;
	}
	
	public String getComment() {
		return comment;
	}
	
	public void setComment(String comment) {
		this.comment = comment;
	}

	public List<FieldDefs> getItems() {
		return items;
	}
	
	public void setItems(List<FieldDefs> items) {
		this.items = items;
	}

	@Override
	public String toString() {
		return "FieldDefs [name=" + name + ", parentId=" + parentId + "]";
	}
	
	public void add(FieldDefs fld) {
		this.items.add(fld);
	}	
}
