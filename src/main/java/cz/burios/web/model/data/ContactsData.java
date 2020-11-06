package cz.burios.web.model.data;

import java.util.Arrays;
import java.util.List;

import javax.enterprise.context.RequestScoped;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

@RequestScoped
@Path("/app/data")
public class ContactsData {

	@GET
	@Path("/{modul}")
	@Produces(MediaType.APPLICATION_JSON)
	public List<Contact> getRecords(@PathParam("modul") String id) throws Exception {
		List<Contact> records = Arrays.asList(
			new Contact("C_0001", "Josef", "Novák", java.sql.Date.valueOf("1975-12-03")),
			new Contact("C_0002", "Anna", "Nováková", java.sql.Date.valueOf("1977-02-19")),
			new Contact("C_0003", "Marie", "Richtrová", java.sql.Date.valueOf("1973-06-03"))
		);
		return records;
	}
}
