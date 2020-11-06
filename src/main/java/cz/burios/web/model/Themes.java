package cz.burios.web.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import javax.annotation.PostConstruct;
import javax.enterprise.context.ApplicationScoped;
import javax.inject.Named;

@ApplicationScoped
@Named("themes")
public class Themes implements Serializable {

	private static final long serialVersionUID = -7654797603192925379L;
	
	protected List<Theme> records = new ArrayList<>();

	public Themes() {
		// System.out.println("Themes.Themes()");
	}
	
	@PostConstruct
	public void init() {
		// System.out.println("Themes.init()");
		records = Arrays.asList(
			new Theme("default", "Default - Light"),
			new Theme("black", "Default - Dark")
		);
	}
	
	public List<Theme> getRecords() {
		return records;
	}
	
	public Theme getRecord(String id) {
		return records.stream().filter(r -> id.equals(r.getId())).findAny().orElse(null);
	}

}
