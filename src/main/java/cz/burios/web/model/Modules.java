package cz.burios.web.model;

import java.io.InputStream;
import java.io.Serializable;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import javax.enterprise.context.RequestScoped;
import javax.inject.Named;

import org.apache.commons.io.IOUtils;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

@RequestScoped
@Named("modules")
public class Modules implements Serializable {

	private static final long serialVersionUID = -3880965654475017634L;

	protected List<Modul> records = new ArrayList<>();
	protected String versionId = "2020.3";

	public Modules() {
		// System.out.println("Modules.versionId: " + versionId);
		reloadRecords(versionId);
	}

	public List<Modul> reloadRecords(String version) {
		this.versionId = version;
		try {
			InputStream	is = this.getClass().getResourceAsStream("/cz/burios/web/model/1.7.6/modules-dev.json");
			String json = IOUtils.toString(is, StandardCharsets.UTF_8);
			records = new Gson().fromJson(json, new TypeToken<List<Modul>>(){}.getType());
			
			records.add(new Modul("", "/main-welcome.jsp"));

		} catch (Exception e) {
			e.printStackTrace();
		}
		return records;
	}
	
	/**
	 * 
	 * @return
	 */
	public List<Modul> getRecords() {
		return records;
	}
	
	/**
	 * 
	 * @param id
	 * @return
	 */
	public Modul getRecord(String id) {
		Modul record = records.stream().filter(r -> id.equals(r.getId())).findAny().orElse(null);
		System.out.println("Modul.getRecord(" + id + ").record = " + record);
		return record;
	}

	/**
	 * 
	 * @return
	 */
	public String getVersionId() {
		return versionId;
	}

	/**
	 * 
	 * @param versionId
	 */
	public void setVersionId(String versionId) {
		this.versionId = versionId;
	}

}
