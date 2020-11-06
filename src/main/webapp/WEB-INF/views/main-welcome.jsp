<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>

<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<!DOCTYPE html>
<html>
<head>
	<meta charset='utf-8'>
	<meta http-equiv='X-UA-Compatible' content='IE=edge'>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

	<link rel="stylesheet" href="${user.baseUri}/libs/app/${info.id}/css/${info.id}.core.layout.css">
	
	<style type="text/css"></style>
	<script></script>
</head>
<body class="k-content h-vh-100">
	<div style="text-align: center;">
		<div class="text-center">
			<h1>&nbsp;</h1>
			<h3 style="color: coral;">${info.title}</h3>
			<p class="k-content">${info.subtitle}</p>
			<img alt="Welcome" src="${user.baseUri}/res/icons/cross-browser.png" width="512px" height="256px" style="margin: 20px;">
			<h1>&nbsp;</h1>
		</div>				
	</div>	
</body>
</html>