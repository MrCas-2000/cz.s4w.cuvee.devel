<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>

<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<!DOCTYPE html>
<html>
<head>
	<meta charset='UTF-8'>
	<meta http-equiv='X-UA-Compatible' content='IE=edge'>
	<meta name='viewport' content='width=device-width, initial-scale=1'>
	<meta name='description' content=''>
	<meta name='author' content=''>
	
	<link rel='icon' href='${uCtx.baseUri}/favicon.png'>

	<title>${it.appTitle}</title>
	
	<link rel='stylesheet' type='text/css' href='${uCtx.baseUri}/libs/awesome/css/font-awesome.min.css' media='all'>
	<link id='themecss' rel='stylesheet' type='text/css' href='${uCtx.baseUri}/libs/shieldui-lite/css/light/all.min.css' />
	<link rel='stylesheet' type='text/css' href='${uCtx.baseUri}/libs/w3-css/w3.css' media='all'>
	<style type='text/css'>
	html, body {
		width: 100%;
		height: 100%;
		padding: 0;
		margin: 0;
		overflow: hidden;
	}
	</style>	
	
	<script type='text/javascript' src='${uCtx.baseUri}/libs/jquery/jquery-3.2.1.min.js'></script>
	<script type='text/javascript' src='${uCtx.baseUri}/libs/shieldui-lite/js/shieldui-lite-all.min.js'></script>
</head>
<body>
	<div class='w3-cell-row' style='height:100%;'>
		<div class='w3-container w3-cell' style='width:40%; padding: 0;'>
			<div class='w3-bar w3-border w3-light-grey'>
				<a href='javascript:doInsert();' class='w3-bar-item w3-button'>Nový</a>
				<a href='javascript:doDelete();' class='w3-bar-item w3-button'>Smazat</a>
			</div>			
			<select id='recordList' style='width: 100%;' data-source='${it.authors}'></select>
		</div>
		<div class='w3-container w3-green w3-cell w3-cell-middle'>
			<div id='recordTable' style='' data-source='${it.authors}' data-columns='[{"field": "FULL_NAME", "title": "Autor"}, {"field": "GIVEN_NAME", "title": "Jméno"}, {"field": "SURNAME", "title":"Příjmení", "width": "270px"}]'></div>
		</div>
	</div>
	<script type='text/javascript' src='${uCtx.baseUri}/libs/app/js/authors.js'></script>
</body>
</html>