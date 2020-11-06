package cz.burios.test;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.io.IOUtils;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import cz.burios.web.model.DesktopMenu;
import cz.burios.web.model.DesktopMenuItem;
import cz.burios.web.model.Modul;
import cz.burios.web.model.Modules;

public class Tester {

	public static void main(String[] args) {
		try {
			Tester inst = new Tester();
			inst.makeModulesJson();
			
			System.out.println("DONE...");
		} catch (Exception e) {
			e.printStackTrace();
		}

	}

	public void makeModulesJson() {
		try {
			Modules modules = new Modules();
			
			List<Modul> records = new ArrayList<>();
			//
			records.addAll(modules.getRecords());
			
			InputStream	is = Tester.class.getResourceAsStream("/cz/burios/suix/model/desktop-menu.2019.2.json");
			String json = IOUtils.toString(is, StandardCharsets.UTF_8);
			List<DesktopMenuItem> list = new Gson().fromJson(json, new TypeToken<List<DesktopMenuItem>>(){}.getType());
			for (DesktopMenuItem item : list) {
				//System.out.println(item);
				chechModul(item, records, modules);
			}
			// records.forEach(r -> System.out.println(r));
			String json2 = new Gson().toJson(records, new TypeToken<List<Modul>>(){}.getType());
			System.out.println(json2);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	public void chechModul(DesktopMenuItem item, List<Modul> records, Modules modules) {
		Modul md = item.getModul();
		if (md != null) {
			Modul md2 = modules.getRecord(md.getId());
			if (md2 == null) {
				records.add(new Modul(md.getId(), md.getTemplatePath()));
			}
		}
		if (item.getItems() != null && !item.getItems().isEmpty()) {
			for (DesktopMenuItem subitem : item.getItems()) {
				chechModul(subitem, records, modules);
			}
		}
	}

	public void makeDesktopMenuTester() {
		try {
			/*
			DesktopMenu menu = new DesktopMenu();
			String json = new Gson().toJson(menu.getItems());
			System.out.println(json);
			 */
			
			// String xml = menu.rendering();
			// System.out.println(xml);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
}
