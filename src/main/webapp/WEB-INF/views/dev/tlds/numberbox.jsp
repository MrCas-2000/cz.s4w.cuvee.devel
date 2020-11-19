<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix = "c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix = "easyui" uri="http://cz.smart4web.easyui/tlds"%>
<%@ taglib prefix="w" tagdir="/WEB-INF/tags"%>

<!DOCTYPE html>
<html>
<head>
	<w:dev-page-init/>
</head>
<body>
	<h2 style="color: red;">NumberBox - Basic usage</h2>
	<div>
		<h4>NumberBox</h4>
		<div>
			<input id="PRICE" name=""PRICE"" value="12345.6789" >
			<script>
				$("#PRICE").numberbox({ 
					precision:2
				});		
			</script>
		</div>
		<div>
			<easyui:numberbox name="PRICE_RATE" id="PRICE_RATE" value="123.56"/>
		</div>
	</div>
</body>
</html>
