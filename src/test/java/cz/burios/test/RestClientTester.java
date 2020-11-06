package cz.burios.test;

import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import cz.burios.web.model.Version;

/**
 * 
 * @author Buriosca.cz
 *
 */
public class RestClientTester {

	private static String BASE_URI = "http://localhost:9281/suix";
	
	public static void main(String[] args) {
		try {			
			Client client = ClientBuilder.newClient();
			
			// changeVesion(client);
			changeModul(client);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	

	public static void loadModul(Client client) {
		try {
			WebTarget target = client.target(BASE_URI);
			
			Response response = target
				.path("/modul/welcome")
				.request(MediaType.TEXT_XML)
				.get();
			
			System.out.println(response);
			System.out.println(response.getStatus());
			if (response.getStatus() == 200) {
				System.out.println("Entity: " + response.getEntity());
				System.out.println("Result: ");
				String result = response.readEntity(String.class);
				System.out.println(result);
				/*

				Version result = response.readEntity(Version.class);
				System.out.println(result);
				System.out.println(result.getId());
				System.out.println(result.getTitle());
				*/
			}
		} catch (Exception e) {
			e.printStackTrace();
		}	
	}

	public static void changeModul(Client client) {
		try {
			WebTarget target = client.target(BASE_URI);
			
			Response response = target
				.path("/demo/main")
				.request(MediaType.TEXT_XML)
				.get();
			
			System.out.println(response);
			System.out.println(response.getStatus());
			if (response.getStatus() == 200) {
				System.out.println("Entity: " + response.getEntity());
				System.out.println("Result: ");
				String result = response.readEntity(String.class);
				System.out.println(result);
				/*

				Version result = response.readEntity(Version.class);
				System.out.println(result);
				System.out.println(result.getId());
				System.out.println(result.getTitle());
				*/
			}
		} catch (Exception e) {
			e.printStackTrace();
		}	
	}

	public static void changeVesion(Client client) {
		try {
			WebTarget target = client.target(BASE_URI);
			
			//String id = "CY-R-0000000203";
			String modul = "MD-X-COUNTRY";
			Response response = target
					.path("/main/actions/changeVersion/v1")
					.request(MediaType.APPLICATION_JSON)
					.get();
			
			System.out.println(response);
			System.out.println(response.getStatus());
			if (response.getStatus() == 200) {
				System.out.println("Entity: " + response.getEntity());
				System.out.println("Result: ");

				Version result = response.readEntity(Version.class);
				System.out.println(result);
				System.out.println(result.getId());
				System.out.println(result.getTitle());
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	public static void getModulAllRecords(Client client) {
		try {
			WebTarget target = client.target(BASE_URI);
			
			//String id = "CY-R-0000000203";
			String modul = "MD-X-COUNTRY";
			Response response = target
				.path("/app/data/modul").path(modul)
				.queryParam("from", "0")
				.queryParam("to", "20")
				.request(MediaType.APPLICATION_JSON)
				.get();

			System.out.println(response);
			System.out.println(response.getStatus());
			if (response.getStatus() == 200) {
				System.out.println("Entity: " + response.getEntity());
				System.out.println("Result: ");
				/*
				Country result = response.readEntity(Country.class);
				System.out.println(result);
				System.out.println(result.getId());
				*/
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public static void getModulRecord(Client client) {
		try {
			/*
			WebTarget target = client.target(BASE_URI);
			
			String id = "CY-R-0000000203";
			String modul = "MD-X-COUNTRY";
			Response response = target
				.path("/app/data/modul").path(modul).path(id)
				.request(MediaType.APPLICATION_JSON)
				.get();
			System.out.println(response);
			System.out.println(response.getStatus());
			if (response.getStatus() == 200) {
				System.out.println("Entity: " + response.getEntity());
				System.out.println("Result: ");
				
				Country result = response.readEntity(Country.class);
				System.out.println(result);
				System.out.println(result.getId());
			}
			*/
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	// -----  ----------------------------------------------------------------
	
	public static void userAccount_getRecord(Client client) {
		try {
			/* 
			WebTarget target = client.target(BASE_URI);
			
			UserCredentials uc = new UserCredentials();
			uc.setUserName("fandyta");
			uc.setPassword("f@nyCz68");

			Response response = target.path("/authentication")
				.request(MediaType.APPLICATION_JSON).post(Entity.entity(uc, MediaType.APPLICATION_JSON));

			System.out.println(response.getStatus());
			if (response.getStatus() == 200) {
				System.out.println(response.getEntity());
				System.out.println("Result: ");

				UserCredentials result = response.readEntity(UserCredentials.class);
				UserAccount account = result.getUserAccount();
				String userId = account.getId();
				System.out.println(userId);
				
				response = target.path("/app/data/modul/MX_USER_ACCOUNT/" + userId).request(MediaType.APPLICATION_JSON).get();
				System.out.println(response);
				UserCredentials object = response.readEntity(UserCredentials.class);
				
				System.out.println("----- /user.getRecord --------------------");
				System.out.println(object);				
			}
			*/
			
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public static void userRegistration(Client client) {
		try {
			/*
			UserCredentials uc = new UserCredentials();
			uc.setUserName("buriosca");
			uc.setPassword("iosc+.Cz68");
			
			UserAccount account = new UserAccount();
			account.setGivenName("Josef");
			account.setSurname("Burian");
			account.setEmailAdderss("buriosca@email.cz");
			
			uc.setUserAccount(account); 
			
			boolean verify = false;
			if (!verify) {
				String url = BASE_URI + "/registration/verifyPassword/"+uc.getPassword();
				WebTarget target = client.target(url);
				Response response = target.request(MediaType.APPLICATION_JSON).get();
				if (response.getStatus() == 200) {
					Integer result = response.readEntity(Integer.class);
					verify = (result > 3) ? true : false;
				}
				if (!verify) {
					System.out.println("Heslo je příloš slabé !!!");
					return;
				}
				verify = false;
			}			
			if (!verify) {
				String url = BASE_URI + "/registration/verifyUserName/"+uc.getUserName();
				WebTarget target = client.target(url);
				Response response = target.request(MediaType.APPLICATION_JSON).get();
				if (response.getStatus() == 200) {
					Integer result = response.readEntity(Integer.class);
					verify = (result == 0) ? true : false;
				}
				if (!verify) {
					System.out.println("Uživatelské jméno už existuje !!!");
					return;
				}
			}
			String url = BASE_URI + "/registration";
			System.out.println(url);
			WebTarget target = client.target(url);
			Response response = target.request(MediaType.APPLICATION_JSON).post(Entity.entity(uc, MediaType.APPLICATION_JSON));
			
			System.out.println("----- /registration --------------------");
			
			System.out.println(response);
			System.out.println(response.getStatus());

			System.out.println("----------------------------------------------");
			if (response.getStatus() == 201) {
				System.out.println(response.getEntity());
				System.out.println("Result: ");
				
				UserCredentials result = response.readEntity(UserCredentials.class);
				System.out.println(result);
				System.out.println(result.getId());
				System.out.println(result.getUserName());
				System.out.println(result.getPassword());
				System.out.println(result.getUserAccountId());
				
				System.out.println("----- UserAccount -----");
				
				account = result.getUserAccount();
				System.out.println(account.getId());
				System.out.println(account.getGivenName());
				System.out.println(account.getSurname());
				System.out.println(account.getEmailAdderss());
				System.out.println(account.formatFullName());
				
			} else {
				throw new RuntimeException("HTTP request failed with error code: " + response.getStatus());
			}
			*/
		} catch (Exception e) {
			e.printStackTrace();
		}
	}


}
