package cz.burios.tools;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.mozilla.javascript.ErrorReporter;
import org.mozilla.javascript.EvaluatorException;

import com.yahoo.platform.yui.compressor.JavaScriptCompressor;

public class Builder {

	private static String version = "1.5.5";
	private static String projectRootDir = Paths.get("").toAbsolutePath().toString();
	
	private static String rootDir = projectRootDir + "/src/main/webapp";

	private static String jsSrcDirUri = "/src/"+version+"/js";
	private static String jsDistDirUri = "/src/"+version+"/build/js";
	
	public static void main(String... args) {
		try {
			List<String> versions = Arrays.asList(new String[] {"2020.3"});
			if (args.length > 0) {
				System.out.println("args[0]: " + args[0]);
				if (!args[0].equals("0")) {
					projectRootDir = args[0];
					rootDir = projectRootDir + "/src/main/webapp/src/" + version + "/";
				}
			}
			if (args.length > 1) {
				if (versions.contains(args[1])) {
					version = args[1];
					
					rootDir = projectRootDir + "/src/main/webapp";
					
					jsSrcDirUri = "/src/" + version + "/js";
					jsDistDirUri = "/src/" + version + "/build/js";
				}
			}

			Builder builder = new Builder();
			builder.concatJs();
			// builder.compressJs();
			// builder.complette();
			
		} catch (Exception e) {
			e.printStackTrace();
		}
		System.out.println("DONE...");
	}

	public void concatJs() {
		System.out.println("concat-js");
		String srcRootDir = rootDir + jsSrcDirUri;
		try {
			System.out.println("srcRootDir: " + srcRootDir);
			
			File destRootDir = new File(rootDir + jsDistDirUri);
			if (!destRootDir.exists()) {
				System.out.println("destRootDir.: " + destRootDir);
				destRootDir.mkdirs();
			}
			
			
			File[] fa = new File[] {	
				new File(srcRootDir + "/jquery.parser.js"),
				new File(srcRootDir + "/jquery.draggable.js"),
				new File(srcRootDir + "/jquery.droppable.js"),
				new File(srcRootDir + "/jquery.resizable.js"),
				
				new File(srcRootDir + "/jquery.linkbutton.js"),
				new File(srcRootDir + "/jquery.pagination.js"),
				new File(srcRootDir + "/jquery.tree.js"),
				new File(srcRootDir + "/jquery.progressbar.js"),
				new File(srcRootDir + "/jquery.tooltip.js"),
				new File(srcRootDir + "/jquery.panel.js"),
				new File(srcRootDir + "/jquery.window.js"),
				new File(srcRootDir + "/jquery.dialog.js"),
				new File(srcRootDir + "/jquery.messager.js"),
				new File(srcRootDir + "/jquery.accordion.js"),
				new File(srcRootDir + "/jquery.tabs.js"),
				new File(srcRootDir + "/jquery.layout.js"),
				new File(srcRootDir + "/jquery.menu.js"),
				new File(srcRootDir + "/jquery.sidemenu.js"),
				new File(srcRootDir + "/jquery.menubutton.js"),
				new File(srcRootDir + "/jquery.splitbutton.js"),
				new File(srcRootDir + "/jquery.switchbutton.js"),
				new File(srcRootDir + "/jquery.radiobutton.js"),
				new File(srcRootDir + "/jquery.checkbox.js"),
				new File(srcRootDir + "/jquery.validatebox.js"),
				new File(srcRootDir + "/jquery.textbox.js"),
				new File(srcRootDir + "/jquery.passwordbox.js"),
				new File(srcRootDir + "/jquery.maskedbox.js"),
				new File(srcRootDir + "/jquery.filebox.js"),
				new File(srcRootDir + "/jquery.searchbox.js"),
				new File(srcRootDir + "/jquery.form.js"),
				new File(srcRootDir + "/jquery.numberbox.js"),
				new File(srcRootDir + "/jquery.calendar.js"),
				new File(srcRootDir + "/jquery.spinner.js"),
				new File(srcRootDir + "/jquery.numberspinner.js"),
				new File(srcRootDir + "/jquery.timespinner.js"),
				new File(srcRootDir + "/jquery.datetimespinner.js"),
				new File(srcRootDir + "/jquery.datagrid.js"),
				new File(srcRootDir + "/jquery.propertygrid.js"),
				new File(srcRootDir + "/jquery.treegrid.js"),
				new File(srcRootDir + "/jquery.datalist.js"),
				new File(srcRootDir + "/jquery.combo.js"),
				new File(srcRootDir + "/jquery.combobox.js"),
				new File(srcRootDir + "/jquery.combotree.js"),
				new File(srcRootDir + "/jquery.combogrid.js"),
				new File(srcRootDir + "/jquery.combotreegrid.js"),
				new File(srcRootDir + "/jquery.tagbox.js"),
				new File(srcRootDir + "/jquery.datebox.js"),
				new File(srcRootDir + "/jquery.datetimebox.js"),
				new File(srcRootDir + "/jquery.slider.js"),

				// new File(srcRootDir + "/jquery.mobile.js"),
			};
			File destFile = new File(rootDir + jsDistDirUri + File.separator + "jquery.easyui.js");
			if (destFile.exists()) {
				destFile.delete();
			}
			joinFiles(destFile, fa);


		} catch (Exception e) {
			e.printStackTrace();
		}
		
	}

	public void joinFiles(File destination, File[] sources) throws IOException {
		OutputStream output = null;
		try {
			output = createAppendableStream(destination);
			for (File source : sources) {
				appendFile(output, source);
			}
		} finally {
			IOUtils.closeQuietly(output);
		}
	}
	/*
	public void compressCss() {
		System.out.println("css-min");
		try {
			String srcRootDir = rootDir + cssDistDirUri;
			Collection<File> files = FileUtils.listFiles(new File(srcRootDir), new String[] { "css" }, true);
			for (File srcFile : files) {
				try (InputStream is = FileUtils.openInputStream(srcFile)) {
					try (Reader in = new InputStreamReader(is)) {
						String destPath = srcFile.getParent() + File.separator
								+ FilenameUtils.getBaseName(srcFile.getName()) + ".min.css";
						try (Writer out = new OutputStreamWriter(FileUtils.openOutputStream(new File(destPath)))) {
							YuiCssCompressor compressor = new YuiCssCompressor(in);
							compressor.compress(out, Short.SIZE);
						}
					}
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	*/

	// -----  ----------------------------------------------------------------
	
	private static BufferedOutputStream createAppendableStream(File destination) throws FileNotFoundException {
		return new BufferedOutputStream(new FileOutputStream(destination, true));
	}
	
	private static void appendFile(OutputStream output, File source) throws IOException {
		InputStream input = null;
		try {
			input = new BufferedInputStream(new FileInputStream(source));
			IOUtils.copy(input, output);
		} finally {
			IOUtils.closeQuietly(input);
		}
	}
	
	public void compressJs() {
		try {
			FileReader reader = new FileReader(new File(rootDir + jsDistDirUri + File.separator + "suix.core.all.js")); 
			JavaScriptCompressor compressor = new JavaScriptCompressor(reader, new YuiCompressorErrorReporter()); 
			FileWriter writer = new FileWriter(new File(rootDir + jsDistDirUri + File.separator + "suix.core.all.min.js"));
			compressor.compress(writer, 65536, true, true, true, true);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	private static class YuiCompressorErrorReporter implements ErrorReporter {
		public void warning(String message, String sourceName, int line, String lineSource, int lineOffset) {
			if (line < 0) {
				//logger.log(Level.WARNING, message);
				System.out.println(message);
			} else {
				//logger.log(Level.WARNING, line + ':' + lineOffset + ':' + message);
				System.out.println(line + ':' + lineOffset + ':' + message);
			}
		}

		public void error(String message, String sourceName, int line, String lineSource, int lineOffset) {
			if (line < 0) {
				System.out.println(message);
			} else {
				System.out.println(line + ':' + lineOffset + ':' + message);
			}
		}
	 
	    public EvaluatorException runtimeError(String message, String sourceName, int line, String lineSource, int lineOffset) {
	        error(message, sourceName, line, lineSource, lineOffset);
	        return new EvaluatorException(message);
	    }
	}	
}
