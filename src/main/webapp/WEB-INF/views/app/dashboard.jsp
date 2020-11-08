<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>

<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<%@ taglib prefix="w" tagdir="/WEB-INF/tags"%>

<!DOCTYPE html>
<html>
<head>
	<w:main-page-init/>
</head>
<body>
	<w:main-page-topbar/>
	<p>uCtx: ${it.uCtx}</p>
</body>
</html>