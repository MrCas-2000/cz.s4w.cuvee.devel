<%@ tag language="java" pageEncoding="UTF-8"%>

	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="description" content="">
	<meta name="author" content="">
	
	<title>${info.title}</title>
	<link rel="icon" href="${user.baseUri}/favicon.png">
	
	<link rel="stylesheet" href="${user.baseUri}/src/1.5.5/build/themes/metro/easyui.css" media="all"/>
	<link rel="stylesheet" href="${user.baseUri}/libs/app/docs/site.css">
	<link rel="stylesheet" href="${user.baseUri}/libs/app/docs/docsearch.min.css">
	<link rel="stylesheet" href="${user.baseUri}/libs/app/docs/highlight/styles/github.css">

	<style> 
	html, body {
		font-family: Arial, Helvetica, sans-serif; 
		font-size: 12px;
		width: 95%;
		height: 90%;
		margin: 8px; 
		overflow: auto;
	}
	
	.w3-code, .w3-codespan {
		font-family: Consolas, "courier new";
		font-size: 16px
	}
	
	.w3-code {
		width: auto;
		background-color: #fff;
		padding: 8px 12px;
		border-left: 4px solid #4CAF50;
		word-wrap: break-word
	}
	
	</style>

	<script src="${user.baseUri}/libs/jquery/jquery-3.3.1.js"></script>
	<script src="${user.baseUri}/src/1.5.5/build/js/jquery.easyui.js"></script>
	<script>
		var appBaseUri = "${user.baseUri}";
	</script>
