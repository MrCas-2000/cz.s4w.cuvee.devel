package cz.burios.tools;

import java.util.ArrayList;
import java.util.List;

public class ClassDefs {
	
	String name = "";
	List<FieldDefs> fields = new ArrayList<>();
	
	ClassDefs(String name) {
		this.name = name;
	}
	
	public void add(FieldDefs fld) {
		this.fields.add(fld);
	}
	
	// -----  -------------------------------------------------------------
	
	public String getName() {
		return name;
	}
	
	public void setName(String name) {
		this.name = name;
	}
	
	public List<FieldDefs> getFields() {
		return fields;
	}
	
	public void setFields(List<FieldDefs> fields) {
		this.fields = fields;
	}
}