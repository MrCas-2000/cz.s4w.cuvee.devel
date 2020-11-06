package cz.burios.tools;

import java.io.File;
import java.nio.file.Paths;
import java.util.List;

import org.apache.commons.io.FileUtils;

public class KendoSourceBuilder {
	
	private static final String CRLF = "\r\n";
	
	private static String version = "2020.3";
	private static String projectRootDir = Paths.get("").toAbsolutePath().toString();
	
	public static void main(String[] args) {
		String destDirPath =  projectRootDir + "/repo/build/" + version + "/js";
		try {
			File destDir = new File(destDirPath);
			if (destDir.exists()) {
				destDir.delete();
			}
			destDir.mkdirs();
			
			File srcFile = new File(projectRootDir + "/repo/orig/" + version + "/kendo.all.js");
			
			File destFile = new File(destDirPath + "/suix.000.js");
			List<String> lines = FileUtils.readLines(srcFile, "UTF-8");
			StringBuilder s = new StringBuilder("");
			String s2 = "";
			
			for (String line : lines) {
				line = line.replaceAll("KENDO", "SUIX");
				line = line.replaceAll("Kendo UI", "Suix");
				line = line.replaceAll("Kendo", "Suix");
				line = line.replaceAll("kendo", "suix");
				
				if (line.startsWith("(function (f, define) {")) {
					s2 = s.toString();
					s = new StringBuilder("");
					FileUtils.writeStringToFile(destFile, s2, "UTF-8", true);
				}
				if (line.contains("define('")) {
					// System.out.println(line);
					int pos1 = line.indexOf("define('") + 8;
					int pos2 = line.indexOf("', ");
					String name = line.substring(pos1, pos2);
					System.out.println("name: " + name);
					
					String path = "/";
					String fileName = "";
					pos1 = name.lastIndexOf('/');
					if (pos1 > -1) {
						path = path + name.substring(0, pos1 + 1);
						File dir = new File(destDirPath + path);
						dir.mkdir();
						name = name.substring(pos1 + 1) + ".js";
					} else {
						name = name + ".js";
					}
					System.out.println("path: " + path +  ", name: " + name);
					destFile = new File(destDirPath + path + name);
					System.out.println(destFile.getPath());
					System.out.println("--------------------");
				}
				s.append(line + CRLF);
			}
			System.out.println();
			
			String toDirPath = projectRootDir + "/src/main/webapp/src/"+version+"/js";
			File toDir = new File(toDirPath);
			
			System.out.println("Move from (destDir): " + destDir.getPath());
			System.out.println("Move to (toDir):     " + toDir.getPath());
			
			FileUtils.deleteDirectory(toDir);
			FileUtils.moveDirectory(destDir, toDir);
			
			System.out.println();
			System.out.println("KendoSourceBuilder.main( DONE )");
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}
