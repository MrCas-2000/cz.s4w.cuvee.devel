package cz.burios.web.model.data;

import java.io.Serializable;
import java.sql.Date;

public class Contact implements Serializable {

	private static final long serialVersionUID = -5086792265992597296L;
	
	protected String id;
	protected String givenName;
	protected String surname;
	protected java.sql.Date birthDate;
	
	public Contact(String id, String givenName, String surname, Date birthDate) {
		super();
		this.id = id;
		this.givenName = givenName;
		this.surname = surname;
		this.birthDate = birthDate;
	}
	
	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	public String getGivenName() {
		return givenName;
	}
	public void setGivenName(String givenName) {
		this.givenName = givenName;
	}
	public String getSurname() {
		return surname;
	}
	public void setSurname(String surname) {
		this.surname = surname;
	}
	public java.sql.Date getBirthDate() {
		return birthDate;
	}
	public void setBirthDate(java.sql.Date birthDate) {
		this.birthDate = birthDate;
	}
	
}
