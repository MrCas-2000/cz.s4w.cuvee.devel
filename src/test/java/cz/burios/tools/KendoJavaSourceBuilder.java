package cz.burios.tools;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.InputStream;
import java.nio.file.FileSystem;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Enumeration;
// import java.util.Formatter;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.TreeMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

import org.apache.commons.io.FileUtils;
import org.apache.velocity.Template;
import org.apache.velocity.VelocityContext;
import org.apache.velocity.app.VelocityEngine;

public class KendoJavaSourceBuilder {

	private static final String TAB = "\t";
	private static final String CRLF = "\r\n";
	private static final String BR = "<br>";
	private static final String LT = "&lt;";
	private static final String GT = "&gt;";
	
	private static String version = "2020.1";
	private static String projectRootDir = Paths.get("").toAbsolutePath().toString();

	protected Map<String, String> index = new TreeMap<>();

	public static void main(String[] args) {
		try {
			KendoJavaSourceBuilder inst = new KendoJavaSourceBuilder();
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
		
		String destDirPath =  projectRootDir + "/repo/build/" + version + "/classes";
		File destDir = new File(destDirPath);
		if (!destDir.exists())
			destDir.mkdirs();
		
		try {
			/*
			String srcFilePath = projectRootDir + "/repo/orig/" + version + "/kendo-ui-core-" + version + ".zip";
			unzipSource(srcFilePath, srcDirPath);
			*/
			FileUtils.deleteDirectory(new File(destDirPath));
			List<String> files = filesTreeList(srcDir);
			for (String srcPath : files) {
				// System.out.println(name);
				String s = (srcPath.substring(srcPath.indexOf("doc-src") + 7));
				s = s.replace(".md", ".txt");
				String destPath = destDirPath + "" + s;
				File destFile = new File(destPath);
				if (destFile.isDirectory() || !destPath.endsWith("txt")) {
					destFile.mkdirs();
				} else {
					md2class(new File(srcPath), destFile);
				}
			}
			/*
			for (Map.Entry<String, String> en : index.entrySet()) {
				System.out.println("public static final String " + en.getKey() + " = \"" + en.getValue() + "\";");
			}
			*/
			
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	public static List<String> filesTreeList(File dir) throws Exception {
		Path start = Paths.get(dir.getPath());
		try (Stream<Path> stream = Files.walk(start, Integer.MAX_VALUE)) {
			List<String> collect = stream.map(String::valueOf).sorted().collect(Collectors.toList());
			return collect; 
		}
	}
	
	public void md2class(File srcFile, File destFile) {
		// System.out.println("+ " + srcFile);
		try {
			
			// System.out.println("parent: " + destFile.getParent());
			if (destFile.getParent().endsWith("ui")) {
				// Vygenerovat přes Velocity šablonu.
				ClassDefs c = null;
				List<String> lines = Files.readAllLines(Paths.get(srcFile.getPath()));
				boolean start = false;
				FieldDefs fld = null;
				Map<String, FieldDefs> reg = new TreeMap<>();
				String comment = "";
				for (String line : lines) {
					if (line.startsWith("# ")) {
						String className = line.replaceAll("# kendo.ui.", "");
						if (!className.isEmpty()) {
							c = new ClassDefs(className);
						}
					}
					
					if (line.startsWith("## Configuration")) {
						start = true;
					}
					if (line.startsWith("## Fields")) {
						start = false;
					}
					if (line.startsWith("## Methods")) {
						start = false;
					}
					if (line.startsWith("## Events")) {
						start = true;
					}
					
					if (start) {
						if (line.startsWith("### ")) {
							if (fld != null) {
								if (comment.contains("Example")) {
									String[] as = comment.split("Example");
									comment = as[0] + "Example" + CRLF + TAB + " * <pre>";
									comment += TAB + "" + as[1].replaceAll("<br>", "");
									comment += TAB + " * </pre>";
									// comment = comment.replaceFirst("Example", "Example " + CRLF + "<pre>") + "</pre>";
								}
								fld.setComment(comment);
								comment = "";
							}
							//first = true;
							String fldName = line.replaceAll("### ", "");
							fldName = fldName.split(" ")[0];
							fld = new FieldDefs(fldName);
							fld.setId(fldName);
							List<String> p = Arrays.asList(fldName.split("\\."));
							if (p.size() > 1) {
								String key = fldName.substring(0, fldName.lastIndexOf('.'));
								String value = p.get(p.size() - 1);
								index.put(value, value);
								fld.setParentId(key);
								fld.setName(value);
								reg.put(fld.getId(), fld);
							} else {
								fldName = p.get(p.size() - 1);
								// System.out.println(fldName + " > ");
								index.put(fldName, fldName);
								fld.setParentId("");
								reg.put(fld.getId(), fld);
								c.add(fld);
							}
						} else {
							if (fld != null) {
								line = line.replaceAll("<", LT);
								line = line.replaceAll(">", GT);
								line = line.replaceAll("#### ", "");
								line = line.replaceAll("KENDO", "SUIX");
								line = line.replaceAll("Kendo UI", "Suix");
								line = line.replaceAll("Kendo", "Suix");
								line = line.replaceAll("kendo", "suix");
								line = line.replaceAll("    ", "&#9;");

								comment += TAB + " * " + line + BR + CRLF;
							}
						}
					}
				}
				if (c != null) {
					System.out.println("----- " + c.getName() + " -----");
					// reg.forEach((k, v) -> System.out.println((k + ": " + v)));
					for (Map.Entry<String, FieldDefs> entry : reg.entrySet()) {
						FieldDefs f = entry.getValue();
						if (!f.getParentId().isEmpty()) {
							FieldDefs pf = reg.get(f.getParentId());
							// System.out.println(f.getParentId() + " > " + pf);
							pf.add(f);
						}
 					} 
					
					String encoding = "UTF-8";
					Properties properties = new Properties();
					properties.setProperty("file.resource.loader.path", projectRootDir + "/src/test/java/cz/burios/tools/");
					
					VelocityEngine ve = new VelocityEngine(properties);
					VelocityContext context = new VelocityContext();
					context.put("md", c);
					
					// System.out.println(c.getFields());
					
					if (destFile.exists())
						destFile.delete();
					destFile.createNewFile();
					
					try (FileWriter fis = new FileWriter(destFile)) {
						Template tmpl = ve.getTemplate("suix-widget-class.vtl", encoding);
						tmpl.merge(context, fis);
					} catch (Exception e) {
						e.printStackTrace();
					}
					// destFile.getName();
					if (!c.getName().startsWith("# ")) {
						File javaFile = new File(destFile.getParent() + "/" + c.getName() + ".java");
						// String source = FileUtils.readFileToString(destFile, StandardCharsets.UTF_8);
						// FileUtils.write(javaFile, new Formatter().formatSource(source), StandardCharsets.UTF_8);
						FileUtils.moveFile(destFile, javaFile);
					}
				}
			} else {
				return;
			}
			/*
			*/
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	protected void unzipSource(String srcFilePath, String destDirPath) throws Exception {
		FileSystem fileSystem = FileSystems.getDefault();
		FileUtils.deleteDirectory(new File(destDirPath));
		try (ZipFile zip = new ZipFile(srcFilePath)) {
			Enumeration<? extends ZipEntry> entries = zip.entries();
			while (entries.hasMoreElements()) {
				ZipEntry entry = entries.nextElement();
				if (entry.isDirectory()) {
					String name = entry.getName();
					name = name.substring(name.indexOf('/'));
					if (name.startsWith("/docs/api/javascript/ui")) {
						System.out.println("Creating Directory: " + name);
						Files.createDirectories(fileSystem.getPath(destDirPath + name));
					}
				} else {
					String name = entry.getName();
					name = name.substring(name.indexOf('/'));
					if (name.startsWith("/docs/api/javascript/ui") && name.endsWith("md")) {
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
