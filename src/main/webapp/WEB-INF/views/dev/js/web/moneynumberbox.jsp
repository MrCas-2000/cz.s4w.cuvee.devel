<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix = "c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="w" tagdir="/WEB-INF/tags"%>

<!DOCTYPE html>
<html>
<head>
	<w:dev-page-init/>
	<script src="${user.baseUri}/src/1.5.5/build/js/jquery.moneynumberbox.js"></script>
</head>
<body>
	<h2 style="color: red;">MoneyNumberBox - Basic usage</h2>
	<div>
		<h4>MoneyNumberBox</h4>
		<input id="nn1" value="10.0" >
		<script>
			$("#nn1").moneynumberbox({ 
				precision:2
			});		
		</script>
    </div>
</body>
</html>
