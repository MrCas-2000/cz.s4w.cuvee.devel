package cz.burios.web.model;

import java.io.InputStream;
import java.io.Serializable;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import javax.enterprise.context.RequestScoped;
import javax.enterprise.context.SessionScoped;
import javax.inject.Named;

import org.apache.commons.io.IOUtils;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

@SessionScoped
@Named("menu")
public class DesktopMenu implements Serializable {

	private static final long serialVersionUID = 5544487424723692951L;

	protected List<DesktopMenuItem> items = new ArrayList<>();
	
	public DesktopMenu() {
		String version = "2020.3";
		this.items = reloadRecords(version);
	}

	/**
	 * 
	 * @return
	 */
	public List<DesktopMenuItem> getItems() {
		return items;
	}

	/**
	 * 
	 * @param items
	 */
	public void setItems(List<DesktopMenuItem> items) {
		this.items = items;
	}
	
	private static final String CRLF = "\r\n";

	public String rendering() {
		StringBuilder sb = new StringBuilder();
		sb.append("<ul>").append(CRLF);
		for (DesktopMenuItem item : items) {
			sb.append(renderItem(item));
		}
		sb.append("</ul>");
		// System.out.println(sb.toString());
		return sb.toString();
	}
	
	private String renderItem(DesktopMenuItem item) {
		StringBuilder sb = new StringBuilder();
		String href = item.getHref();
		Modul md = item.getModul();
		if ((href == null || href.isEmpty()) && md != null) {
			href = "javascript:changeModulView('" + md.getId() + "');";
		}
		sb.append("<li><a href=\"" + href + "\">" + item.getLabel() + "</a>").append(CRLF);
		if (item.getItems() != null && !item.getItems().isEmpty()) {
			sb.append("<ul>").append(CRLF);
			for (DesktopMenuItem subitem : item.getItems()) {
				sb.append(renderItem(subitem));
			} 
			sb.append("</ul>").append(CRLF);
		}
		sb.append("</li>").append(CRLF);
		return sb.toString();
	}

	// -----  -----------------------------------------------------------------

	protected List<DesktopMenuItem> reloadRecords(String version) {
		System.out.println("DesktopMenu.reloadRecords(version " + version + ")");
		List<DesktopMenuItem> result = null;
		try {
			InputStream	is = this.getClass().getResourceAsStream(
				"/cz/burios/web/model/" + version + "/desktop-menu-docs-api.json");
			String json = IOUtils.toString(is, StandardCharsets.UTF_8);
			result = new Gson().fromJson(json, new TypeToken<List<DesktopMenuItem>>(){}.getType());

			is = this.getClass().getResourceAsStream(
					"/cz/burios/web/model/" + version + "/desktop-menu-docs-controls.json");
			json = IOUtils.toString(is, StandardCharsets.UTF_8);
			result.addAll(new Gson().fromJson(json, new TypeToken<List<DesktopMenuItem>>(){}.getType()));

			is = this.getClass().getResourceAsStream(
					"/cz/burios/web/model/" + version + "/desktop-menu-docs-styles.json");
			json = IOUtils.toString(is, StandardCharsets.UTF_8);
			result.addAll(new Gson().fromJson(json, new TypeToken<List<DesktopMenuItem>>(){}.getType()));

			result.add(0, new DesktopMenuItem("", "MN_X_DOCS", "Documentation", "", (Modul) null, null));
			
			is = this.getClass().getResourceAsStream(
					"/cz/burios/web/model/" + version + "/desktop-menu-demos.json");
			json = IOUtils.toString(is, StandardCharsets.UTF_8);
			result.addAll(new Gson().fromJson(json, new TypeToken<List<DesktopMenuItem>>(){}.getType()));
			
			is = this.getClass().getResourceAsStream(
					"/cz/burios/web/model/" + version + "/desktop-menu-dev.json");
			json = IOUtils.toString(is, StandardCharsets.UTF_8);
			result.addAll(new Gson().fromJson(json, new TypeToken<List<DesktopMenuItem>>(){}.getType()));

			result.add(new DesktopMenuItem("", "MN_GET_STARTED", "Get started", "", 
					new Modul("MN_GET_STARTED", "/app/docs/" + version +"/get-started.jsp") , null));

			result.add(0, new DesktopMenuItem("ROOT", "", "", "k-icon k-i-home", (Modul) null, null));

		} catch (Exception e) {
			e.printStackTrace();
		}
		return result;
	}

}
