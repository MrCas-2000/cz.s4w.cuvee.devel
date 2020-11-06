package cz.burios.web.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Named;

@ApplicationScoped
@Named("versions")
public class Versions implements Serializable {

	private static final long serialVersionUID = 7666809616462897985L;
	
	protected List<Version> records = new ArrayList<>();
	
	public Versions() {
		records = Arrays.asList(
			new Version("1.7.6", "Version 1.7.6"),
			new Version("1.5.5", "Version 1.5.5")
		);
	}
	
	public List<Version> getRecords() {
		return records;
	}
	
	public Version getRecord(String id) {
		Version record = records.stream().filter(r -> id.equals(r.getId())).findAny().orElse(null);
		return record;
	}
}
