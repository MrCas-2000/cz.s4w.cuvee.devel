package cz.burios.tools;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileSystem;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.RandomStringUtils;
import org.apache.commons.lang3.StringUtils;
import org.commonmark.node.Node;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;

import com.google.gson.Gson;

import cz.burios.web.model.DesktopMenuItem;
import cz.burios.web.model.Modul;

public class KendoDocumentationBuilder {

	private static final String CRLF = "\r\n";
	
	private static String version = "2020.3";
	private static String projectRootDir = Paths.get("").toAbsolutePath().toString();

	private static String start = 
		"<%@ page language=\"java\" contentType=\"text/html; charset=UTF-8\" pageEncoding=\"UTF-8\"%>\r\n" + 
		"<%@ taglib prefix=\"c\" uri=\"http://java.sun.com/jsp/jstl/core\" %>\r\n" + 
		"<%@ taglib prefix=\"w\" tagdir=\"/WEB-INF/tags\"%>\r\n" + 
		"<!DOCTYPE html>\r\n" + 
		"<html>\r\n" + 
		"<head>\r\n" + 
		"	<meta charset=\"UTF-8\">\r\n" + 
		"	<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\r\n" + 
		"	<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\r\n" + 
		"	<meta name=\"description\" content=\"\">\r\n" + 
		"	<meta name=\"author\" content=\"\">\r\n" + 
		"\r\n" + 
		"	<w:docs-page-css/>\r\n" + 
		"	<link rel=\"stylesheet\" href=\"/${info.id}/libs/app/w3.css\" media=\"all\">\r\n" + 
		"</head>\r\n" + 
		"<body>\r\n" + 
		"	<div class=\"w3-container w3-padding-16\">\r\n" + 
		"";
	
	private static String end = "	</div>\r\n" + "	<w:dev-layout-jscore/>\r\n" + "</body>";
	
	public static void main(String[] args) {
		try {
			KendoDocumentationBuilder inst = new KendoDocumentationBuilder();
			inst.exec();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public void exec() {
		
		String srcDirPath =  projectRootDir + "/repo/build/" + version + "/doc-src";
		File srcDir = new File(srcDirPath);
		if (!srcDir.exists())
			srcDir.mkdirs();
		
		String destDirPath =  projectRootDir + "/repo/build/" + version + "/doc-dest";
		File destDir = new File(destDirPath);
		if (!destDir.exists())
			destDir.mkdirs();
		
		/*
		String suffix = "api";
		String suffixName = "API";
		 */
		String suffix = "controls";
		String suffixName = "Controls";
		
		String jspDirPath = projectRootDir + "/src/main/webapp/WEB-INF/views/app/docs/" + version;
		
		try {
			/*
			FileSystem fileSystem = FileSystems.getDefault();
			String srcFilePath = projectRootDir + "/repo/orig/" + version + "/kendo-ui-core-" + version + ".zip";
			unzipSource(srcFilePath, srcDirPath, suffix);
			 */
			
			FileUtils.deleteDirectory(new File(destDirPath));
			List<String> files = filesTreeList(srcDir);
			for (String srcPath : files) {
				// System.out.println(name);
				String s = (srcPath.substring(srcPath.indexOf("doc-src") + 7));
				s = s.replace(".md", ".jsp");
				String destPath = destDirPath + "" + s;
				// System.out.println("" + destPath);
				File destFile = new File(destPath);
				if (destFile.isDirectory() || !destPath.endsWith("jsp")) {
					System.out.println(destFile.getPath());
					//destFile.mkdirs();
				} else {
					md2html(new File(srcPath), destFile);
				}
			}
			
			
			// Kopírování vytvořené nápovědy z builderu do adresáře nápovědy
			
			File jspDir = new File(jspDirPath);
			File[] fs = new File(destDirPath + "/docs").listFiles();
			for (int i = 0; i < fs.length; i++) {
				System.out.println(fs[i]);
				FileUtils.copyDirectoryToDirectory(fs[i], jspDir);
			}
			/*
			*/
			
			// Vytvoří menu JSON ze stromu nápovědných jsp později volaných jako moduly nápovědy
			
			Map<String, String> index = new TreeMap<>();
			Map<String, DesktopMenuItem> items = new LinkedHashMap<>();
			List<Modul> modules = new ArrayList<>();
			
			DesktopMenuItem root = new DesktopMenuItem("", "MN_X_DOCS", "Documentation", "", (Modul) null, null);
			items.put("MN_X_DOCS", root);
			
			List<String> docfiles = filesTreeList(jspDir);
			for (String path : docfiles) {
				path = path.replace('\\', '/');
				// System.out.println(path);
				int pos = path.indexOf(suffix);
				// int pos = path.indexOf("controls");
				if (pos > -1) {
					path = path.substring(pos);
					System.out.println("> " + path);
					int p = path.lastIndexOf('/');
					String parent = "";
					if (p > -1) {
						String id = index.get(path);
						if (id == null) {
							id = "MN_X_" + RandomStringUtils.random(8, "0123456789ABCDEF");
							index.put(path, id);
						}
						parent = StringUtils.left(path, p);
						String parentId = (String) index.get(parent);
						System.out.println(parent + ", " + parentId);
						if (parentId != null) {
							DesktopMenuItem item = items.get(id);
							if (item == null) {
								String fileName = path.substring(p + 1);
								String label = fileName.replace(".jsp", ""); 
								Modul modul = null;
								if (fileName.endsWith("jsp")) {
									modul = new Modul(id, "/app/docs/" + version + "/" + path);
									modules.add(modul);
								}
								item = new DesktopMenuItem(parentId, id, label, "", modul, null);
								if (modul != null) {
									item.setHref("javascript:Desktop.changeModulView('" + id + "');");
								} else {
									item.setHref("javascript:void(0);");
								}
								items.put(id, item);
								// System.out.println("");
							}
							DesktopMenuItem parentItem = items.get(parentId);
							if (parentItem != null) {
								// System.out.println(parent +  " >>> " + parentItem);
								parentItem.addItems(item);
							}
						}
					} else {
						System.out.println("---- ROOT -----");
						String id = ("MN_X_DOCS_" + suffix).toUpperCase();
						index.put(path, id);
						items.put(id, new DesktopMenuItem("MN_X_DOCS", id, suffixName, "", (Modul) null, null));
					}
				}
			}
			items.remove("MN_X_DOCS");
			System.out.println("----- ITEMS ---------------------------------");
			/*
			items.forEach((k,v)->{
				System.out.println("key: " + k + ", value: " + v);
				if (v.getItems() != null && !v.getItems().isEmpty()) {
					v.setType("next");
				} else {
					v.setType("item");
				}
				v.setItems(null);
				
			});
			*/
			List<DesktopMenuItem> data = new ArrayList<>(items.values());
			for (int i = 0; i < data.size(); i++) {
				DesktopMenuItem v = data.get(i);
				if (v.getItems() != null && !v.getItems().isEmpty()) {
					v.setType("next");
				} else {
					v.setType("item");
				}
				v.setPriority(i);
				v.setItems(null);				
			}
			String json = new Gson().toJson(items.values());
			FileUtils.write(new File(projectRootDir + "/src/main/resources/cz/burios/web/model/" + version + "/desktop-menu-docs-" + suffix + ".json"), json, StandardCharsets.UTF_8);
			String json2 = new Gson().toJson(modules);
			FileUtils.write(new File(projectRootDir + "/src/main/resources/cz/burios/web/model/" + version + "/modules-" + suffix + ".json"), json2, StandardCharsets.UTF_8);
			
			// FileUtils.moveDirectory(new File(""), new File(""));
			File destDocsDir = new File(destDirPath + "/docs");
			FileUtils.deleteDirectory(destDocsDir);
			/*
			 */
			
		} catch (Exception e) {
			e.printStackTrace();
		}
		System.out.println("KendoDocumentationBuilder.main( DONE )");
	}
	
	public static List<String> filesTreeList(File dir) throws Exception {
		Path start = Paths.get(dir.getPath());
		try (Stream<Path> stream = Files.walk(start, Integer.MAX_VALUE)) {
			List<String> collect = stream.map(String::valueOf).sorted().collect(Collectors.toList());
			return collect; 
		}
	}
	
	public static void md2html(File srcFile, File destFile) {
		System.out.println("+ " + srcFile);
		try {
			String content = new String(Files.readAllBytes(Paths.get(srcFile.getPath())));
			
			Parser parser = Parser.builder().build();
			Node document = parser.parse(content);
			HtmlRenderer renderer = HtmlRenderer.builder().build();
			
			String html = renderer.render(document);
			
			html = html.replaceAll("KENDO", "SUIX");
			html = html.replaceAll("Kendo UI", "Suix");
			html = html.replaceAll("Kendo", "Suix");
			html = html.replaceAll("kendo", "suix");
			html = html.replaceAll("<pre><code>", "<pre class=\"w3-code\"><code class=\"html\">"+CRLF);
			html = html.replace("<h2>title:", "<h2 style='display: none;'>title:");
			
			html = start + CRLF + html + CRLF + end; 
			
			// System.out.println(html);
			FileUtils.write(destFile, html, StandardCharsets.UTF_8);
			/*
			*/
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	protected void unzipSource(String srcFilePath, String destDirPath, String suffix) throws Exception {
		FileSystem fileSystem = FileSystems.getDefault();
		FileUtils.deleteDirectory(new File(destDirPath));
		try (ZipFile zip = new ZipFile(srcFilePath)) {
			Enumeration<? extends ZipEntry> entries = zip.entries();
			while (entries.hasMoreElements()) {
				ZipEntry entry = entries.nextElement();
				if (entry.isDirectory()) {
					String name = entry.getName();
					name = name.substring(name.indexOf('/'));
					if (name.startsWith("/docs/" + suffix)) {
						System.out.println("Creating Directory: " + name);
						Files.createDirectories(fileSystem.getPath(destDirPath + name));
					}
				} else {
					String name = entry.getName();
					name = name.substring(name.indexOf('/'));
					if (name.startsWith("/docs/" + suffix) && name.endsWith("md")) {
						InputStream is = zip.getInputStream(entry);
						BufferedInputStream bis = new BufferedInputStream(is);
						Path filePath = fileSystem.getPath(destDirPath + name);
						
						System.out.println("file: " + name);
						
						Files.createFile(filePath);
						FileOutputStream fileOutput = new FileOutputStream(destDirPath + name);
						while (bis.available() > 0) {
							fileOutput.write(bis.read());
						}
						fileOutput.close();
					}
				}
			}
		}			
	}
}
