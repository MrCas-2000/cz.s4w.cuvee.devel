<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>

<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="description" content="">
	<meta name="author" content="">
	
	<link rel="icon" href="${uCtx.baseUri}/favicon.png">

	<title>${it.appTitle}</title>
	
	<link rel="stylesheet" type="text/css" href="${uCtx.baseUri}/libs/awesome/css/font-awesome.min.css" media="all">
	<link rel="stylesheet" type="text/css" href="${uCtx.baseUri}/libs/w3-css/w3.css" media="all">
	<style type="text/css">
	html, body {
		width: 100%;
		height: 100%;
		padding: 0;
		margin: 0;
		overflow: hidden;
	}
	.contactListBox {
		border: node;
		height: 100%;
		width: 100%;
	}
	</style>	
	
	<script type="text/javascript" src="${uCtx.baseUri}/libs/jquery/jquery-3.2.1.min.js"></script>
</head>
<body>
	<div class="w3-cell-row" style="height:100%;">
		<div class="w3-container w3-red w3-cell" style="width:25%;">			
			<p>Knihy - List</p>
		</div>
		<div class="w3-container w3-green w3-cell w3-cell-middle">
			<p>Detail</p>
		</div>
	</div>
	<script type="text/javascript" src="${uCtx.baseUri}/libs/app/js/books.js"></script>
</body>
</html>