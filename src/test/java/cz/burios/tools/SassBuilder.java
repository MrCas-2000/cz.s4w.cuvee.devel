package cz.burios.tools;

import java.io.File;
import java.net.URI;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.Map;

import org.apache.commons.io.FileUtils;

import io.bit3.jsass.Options;
import io.bit3.jsass.Output;
import io.bit3.jsass.Compiler;

public class SassBuilder {

	private static String version = "2020.3";
	private static String projectRootDir = Paths.get("").toAbsolutePath().toString();
	
	private static String rootDir = projectRootDir + "/src/main/webapp";

	private static String sassDirUri = "/src/" + version + "/styles/sass";
	private static String cssDistDirUri = "/src/" + version + "/build/css";

	public static void main(String[] args) {
		try {
			String prefix = "default";
			String theme = "light";
			
			SassBuilder inst = new SassBuilder();
			// inst.compileColors();
			// inst.compileIcons();
			// inst.compileLayouts();
			inst.compileAllThemes();
			
			/*
			prefix = "bootstrap";
			// theme = "dark";
			
			if (prefix.equals("bootstrap")) {
				inst.compileBootstrapTheme(theme);
			} else {
				inst.compileDefaultTheme(theme);
			}
			 */
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public void compileAllThemes() {
		Map<String, String[]> themes = new LinkedHashMap<>();
		
		themes.put("default", new String[] {"light" });
		//themes.put("default", new String[] {"light", "dark", "teallight", "tealdark", "fiori", "office365" });
		//themes.put("bootstrap", new String[] {"light", "dark", "teallight", "tealdark", "urban" });
		// themes.put("bootstrap", new String[] {"light", "dark" });
		
		for (Map.Entry<String, String[]> e : themes.entrySet()) {
			String prefix = e.getKey();
			if (prefix.equals("bootstrap")) {
				String[] val = e.getValue();
				for (int i = 0; i < val.length; i++) {
					String theme = val[i];
					compileBootstrapTheme(theme);
				}
			} else if (prefix.equals("default")) {
				String[] val = e.getValue();
				for (int i = 0; i < val.length; i++) {
					String theme = val[i];
					compileDefaultTheme(theme);
				}
			}
		}
	}
	
	public void compileBootstrapTheme(String theme) {
		try {
			/*
			 * /v2-suix/src/main/webapp/src/2019.2/styles/sass/bootstrap/light/scss/all.scss
			 * 
			 * /v2-suix/src/main/webapp/src/2019.3/styles/sass/bootstrap/tealdark/scss/all.scss
			 */
			String srcRootDir = rootDir + sassDirUri+ "/bootstrap/" + theme + "/scss";
			String distRootDir = rootDir + cssDistDirUri;
			String distFileName = "/suix.bootstrap-" + theme + ".css";
			
			URI inputFile = new File(srcRootDir + "/all.scss").toURI();
			URI outputFile = new File(distRootDir + "/" + distFileName).toURI();
			System.out.println("outputFile: " + outputFile);
			
			Compiler compiler = new Compiler();
			Options options = new Options();
			options.setOutputStyle(io.bit3.jsass.OutputStyle.EXPANDED);
			options.setSourceMapRoot(new File(distRootDir + "/maps/").toURI()); 
			options.setSourceMapEmbed(false);
			
			Output output = compiler.compileFile(inputFile, outputFile, options);
			System.out.println("Compiled successfully");
			
			File destFile = new File(distRootDir + distFileName);
			FileUtils.write(destFile, output.getCss(), "UTF-8");
			
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public void compileDefaultTheme(String theme) {
		try {
			/*
			 * /v2-suix/src/main/webapp/src/2019.2/styles/sass/default/light/scss/all.scss
			 */
			String srcRootDir = rootDir + sassDirUri+ "/default/" + theme + "/scss";
			String distRootDir = rootDir + cssDistDirUri;
			String distFileName = "/suix.default-" + theme + ".css";
			
			URI inputFile = new File(srcRootDir + "/all.scss").toURI();
			URI outputFile = new File(distRootDir + "/" + distFileName).toURI();
			System.out.println("outputFile: " + outputFile);
			
			Compiler compiler = new Compiler();
			Options options = new Options();
			options.setOutputStyle(io.bit3.jsass.OutputStyle.EXPANDED);
			options.setSourceMapRoot(new File(distRootDir + "/maps/").toURI()); 
			options.setSourceMapEmbed(false);
			
			Output output = compiler.compileFile(inputFile, outputFile, options);
			System.out.println("Compiled successfully");
			
			File destFile = new File(distRootDir + distFileName);
			FileUtils.write(destFile, output.getCss(), "UTF-8");
			
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public void compileColors() {
		try {
			String srcRootDir = rootDir + sassDirUri+ "/layout";
			String distRootDir = rootDir + cssDistDirUri;
			String distFileName = "/suix.core.colors.css";
			
			URI inputFile = new File(srcRootDir + "/suix-colors.scss").toURI();
			URI outputFile = new File(distRootDir + "/" + distFileName).toURI();
			System.out.println("outputFile: " + outputFile);
			
			Compiler compiler = new Compiler();
			Options options = new Options();
			options.setOutputStyle(io.bit3.jsass.OutputStyle.EXPANDED);
			options.setSourceMapRoot(new File(distRootDir + "/maps/").toURI()); 
			options.setSourceMapEmbed(false);
			
			Output output = compiler.compileFile(inputFile, outputFile, options);
			System.out.println("Compiled successfully");
			//System.out.println(output.getCss());
			
			File destFile = new File(distRootDir + distFileName);
			FileUtils.write(destFile, output.getCss(), "UTF-8");
			
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public void compileLayouts() {
		try {
			String srcRootDir = rootDir + sassDirUri+ "/layout";
			String distRootDir = rootDir + cssDistDirUri;
			String distFileName = "/suix.core.layout.css";
			
			URI inputFile = new File(srcRootDir + "/suix-layout.scss").toURI();
			URI outputFile = new File(distRootDir + "/" + distFileName).toURI();
			System.out.println("outputFile: " + outputFile);
			
			Compiler compiler = new Compiler();
			Options options = new Options();
			options.setOutputStyle(io.bit3.jsass.OutputStyle.EXPANDED);
			options.setSourceMapRoot(new File(distRootDir + "/maps/").toURI()); 
			options.setSourceMapEmbed(false);
			
			Output output = compiler.compileFile(inputFile, outputFile, options);
			System.out.println("Compiled successfully");
			//System.out.println(output.getCss());
			
			File destFile = new File(distRootDir + distFileName);
			FileUtils.write(destFile, output.getCss(), "UTF-8");
			
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public void compileIcons() {
		try {
			String srcRootDir = rootDir + sassDirUri+ "/layout";
			String distRootDir = rootDir + cssDistDirUri;
			String distFileName = "/suix.core.icons.css";
			
			URI inputFile = new File(srcRootDir + "/suix-icons.scss").toURI();
			URI outputFile = new File(distRootDir + "/" + distFileName).toURI();
			System.out.println("outputFile: " + outputFile);
			
			Compiler compiler = new Compiler();
			Options options = new Options();
			options.setOutputStyle(io.bit3.jsass.OutputStyle.EXPANDED);
			options.setSourceMapRoot(new File(distRootDir + "/maps/").toURI()); 
			options.setSourceMapEmbed(false);
			
			Output output = compiler.compileFile(inputFile, outputFile, options);
			System.out.println("Compiled successfully");
			//System.out.println(output.getCss());
			
			File destFile = new File(distRootDir + distFileName);
			FileUtils.write(destFile, output.getCss(), "UTF-8");
			
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}
