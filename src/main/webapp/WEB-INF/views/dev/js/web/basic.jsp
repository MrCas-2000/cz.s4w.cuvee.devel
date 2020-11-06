<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix = "c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="w" tagdir="/WEB-INF/tags"%>

<!DOCTYPE html>
<html>
<head>
	<w:demo-page-css/>
	<w:demo-page-jscore/>
		
	<script src="/${info.id}/src/${user.version.id}/js/${info.id}.button.js"></script>
</head>
<body>
	<h2 style="color: red;">Button - Basic usage</h2>
    <div>
        <h4>Basic Button</h4>
        <p>
            <button id="primaryTextButton" class="k-primary">Primary Button</button>
            <button id="textButton">Button</button>
        </p>
    </div>
	
	<script>
	$(document).ready(function() {
		$("#primaryTextButton").suixButton();
	    $("#textButton").suixButton();
	});
	</script>

</body>
</html>
