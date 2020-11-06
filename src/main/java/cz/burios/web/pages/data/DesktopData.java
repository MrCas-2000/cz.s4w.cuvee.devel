package cz.burios.web.pages.data;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import javax.enterprise.context.RequestScoped;
import javax.enterprise.inject.spi.CDI;
import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import cz.burios.web.model.DesktopMenu;
import cz.burios.web.model.DesktopMenuItem;
import cz.burios.web.model.Modul;
import cz.burios.web.model.Modules;
import cz.burios.web.model.Theme;
import cz.burios.web.model.Themes;
import cz.burios.web.model.Version;
import cz.burios.web.model.Versions;
import cz.burios.web.services.AbstractService;

@RequestScoped
@Path("/app/page/desktop/data")
public class DesktopData extends AbstractService {
	
	@Inject DesktopMenu menu;

	@GET
	@Path("/main-menu")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public Object getDesktopMenuData() {
		return getDesktopMenuData("");
	}

	@GET
	@Path("/main-menu/{id}")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public Object getDesktopMenuData(@PathParam("id") String id) {
		// System.out.println("DesktopData.getDesktopMenuData(id:" + id + ")");
		List<DesktopMenuItem> result = new ArrayList<>();
		try {
			List<DesktopMenuItem> data = menu.getItems();
			
			// item
			DesktopMenuItem item = data.stream().filter(it -> it.getId().equals(id)).findFirst().get();
			
			// parent
			if (!id.isEmpty()) {
				String parentId = item.getParentId();
				DesktopMenuItem patentItem = data.stream().filter(it -> it.getId().equals(parentId)).findFirst().get();
				// DesktopMenuItem it = new DesktopMenuItem(patentItem.getId(), patentItem.getParentId(), item.getLabel(), item.getCssIcon(), (Modul) null, null);    
				patentItem.setType("parent");
				result.add(patentItem);
			}
			// children
			List<DesktopMenuItem> children = data.stream()
				.filter(it -> it.getParentId().equals(id))
				.collect(Collectors.toList());
			
			List<DesktopMenuItem> nodes = new ArrayList<>();
			List<DesktopMenuItem> items = new ArrayList<>();
			
			for (DesktopMenuItem it : children) {
				String parentId = it.getId();
				List<DesktopMenuItem> nexts = data.stream()
					.filter(child -> child.getParentId().equals(parentId))
					.collect(Collectors.toList());
				
				if (nexts != null && !nexts.isEmpty()) {
					it.setType("next");
					nodes.add(it);
				} else {
					it.setType("item");
					items.add(it);
				}				
			}
			result.addAll(nodes);
			result.addAll(items);
			/*

			
			for (DesktopMenuItem it : data) {
				String parentId = it.getId();
				List<DesktopMenuItem> children = items.stream()
					.filter(child -> child.getParentId().equals(parentId))
					.collect(Collectors.toList());
				
				if (children != null && !children.isEmpty()) {
					it.setType("next");
					itemsNodes.add(it);
				} else {
					it.setType("item");
					itemsLeafs.add(it);
				}
			}
			result.addAll(itemsNodes);
			result.addAll(itemsLeafs);
			
			*/
		} catch (Exception e) {
			e.printStackTrace();
		} 
		return result;
	}
	
	@GET
	@Path("/menu-action/{id}")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public Object getDesktopMenuActionData(@PathParam("id") String id) {
		Modul modul = new Modul("", ""); 
		try {
			Modules modules = CDI.current().select(Modules.class).get();
			modul = modules.getRecord(id);
			// System.out.println(id + ", Modul: " + modul);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return modul;
	}

	@GET
	@Path("/themes")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public Object getThemes() {
		Themes t = new Themes();
		if (t.getRecords() != null && t.getRecords().isEmpty()) {
			t.init();
		}
		List<Theme> result = t.getRecords();
		// System.out.println("DesktopData.getThemes(): " + result);
		return result;
	}

	@GET
	@Path("/theme/{id}")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public Object getTheme(@PathParam("id") String id) {
		Theme theme = null;
		try {
			List<Theme> data = new Themes().getRecords();
			theme = data.stream().filter(c -> c.getId().equals(id)).findFirst().get();
			// user.setTheme(version);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return theme;
	}

	@GET
	@Path("/versions")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public Object getLanguages() {
		List<Version> result = new Versions().getRecords();
		// System.out.println("DesktopData.getLanguages().result: " + result);
		return result;
	}

	@GET
	@Path("/version/{id}")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)	
	public Version getLanguage(@PathParam("id") String id) {
		Version version = null;
		try {
			List<Version> data = new Versions().getRecords();
			version = data.stream().filter(v -> v.getId().equals(id)).findFirst().get();
			// user.setVersion(version);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return version;
	}
}
