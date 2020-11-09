<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix = "c" uri="http://java.sun.com/jsp/jstl/core"%>
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
        <input type="text" class="easyui-numberbox" value="100" data-options="min:0,precision:2">
    </div>
	<script></script>
</body>
</html>
