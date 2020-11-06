<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>

<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="w" tagdir="/WEB-INF/tags"%>

<!DOCTYPE html>
<html>
<head>
	<w:main-page-init></w:main-page-init>
	
	<link rel="stylesheet" href="${user.baseUri}/libs/app/${info.id}/css/${info.id}.core.layout.css" type="text/css" media="all" />			
	<link rel="stylesheet" href="${user.baseUri}/libs/app/application.css" type="text/css" media="all" />
	<link rel="stylesheet" href="${user.baseUri}/libs/app/desktop.css" type="text/css" media="all" />
	
	<script src="${user.baseUri}/libs/app/${info.id}/js/${info.id}.navigate.js"></script>
	
	<script src="${user.baseUri}/libs/app/application.js"></script>
	<script src="${user.baseUri}/libs/app/desktop.js"></script>
</head>
<body class="k-content h-vh-100 no-overflow-md m-0 p-0">
	<w:desktop-topbar/>
	<div id="desktop_sidebar" class="sidebar">
		<div id="desktopMenu" style=" height: 100%;">

		</div>
		<script type="text/x-suix-template" id="desktopMenuTemplate">
			<div id="#:id#" class="desktop-menu-item #:type#">
				<span class="desktop-menu-item-icon #:cssIcon#"></span><span >#:label#</span>
			</div>
		</script>
		<%--  --%>
	</div>
	<div id="desktopContent" style="position: fixed; left: 0; right: 0; top: 40px; bottom: 2px; height: calc(100% - 43px); overflow: hidden;">
		<div id="desktop_breadcrumb" style="height: 28px; border-bottom: 1px solid #e9e9e9;"></div>
		<script>
		$(function(){
			$("#desktop_breadcrumb").suixBreadcrumb({
				items: [{
					type: "rootitem",
					href: "",
					text: "",
					showText: true,
					icon: "home",
					showIcon: true
				}]			
			});
		});
		</script>
		<div style="position: absolute; top: 32px; bottom: 0; left: 0; right: 0; overflow: hidden;">
			<iframe id="modules_view" src="" width="100%" height="99.8%" frameborder="0"></iframe>
		</div>
	</div>
	<script>
		var baseUri = "${user.baseUri}";
		$(function(){
			$("#modules_view").attr("src", baseUri + "/modul/HOME");
		});
	</script>
</body>
</html>