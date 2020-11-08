<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib prefix="w" tagdir="/WEB-INF/tags"%>
<!DOCTYPE html>
	<w:main-page-init/>
	
	<link  href="/cuvee/libs/bootstrap/bootstrap-treeview.css" rel="stylesheet"/>
	<script src="/cuvee/libs/bootstrap/bootstrap-treeview.js"></script>
	<link  href="/cuvee/libs/app/desktop.css"rel="stylesheet" rel="stylesheet"/>
	<script src="/cuvee/libs/app/desktop.js"></script>
	<script>
		var baseUri = "${user.baseUri}";	
	</script>
</head>
<body>
	<nav class="navbar navbar-dark sticky-top flex-md-nowrap p-0 navbar-expand-md" style="background-color: #336699;">
		<div class="navbar-brand d-flex align-items-center justify-content-between col-12 col-md-3 col-lg-2 mr-0">
			<button type="button" class="navbar-toggler" data-toggle="collapse" data-target="#sidenav">
				<span class="fa fa-bars"></span>
			</button>
			<a class="text-light" href="${user.baseUri}/">
				<img src="${user.baseUri}/favicon.png" width="24px" height="24px" style="margin-top: 0px;">
				<b style="font-size: 16px; padding: 0 5px;">${ info.title }</b>			
			</a>
			<button type="button" class="navbar-toggler" data-toggle="collapse" data-target="#topnav">
				<span class="fa fa-ellipsis-v"></span>
			</button>
		</div>
		<div class="navbar-collapse collapse" id="topnav">
			<ul class="navbar-nav"></ul>
			<ul class="navbar-nav ml-auto px-3 py-2">
				<li class="nav-item text-nowrap">
					<a class="nav-link" href="javascript:void(0);">
						<i class="fa fa-user-circle-o"></i>
					</a>
				</li>
			</ul>
		</div>
	</nav>
	<div class="container-fluid">
		<div class="row navbar-expand-md">
			<nav class="col-md-3 col-lg-2 navbar-collapse collapse sidebar" id="sidenav">
				<div id="menu" class="sidebar sidebar-sticky flex-column m-0 p-0" style="background-color: #e4e7eb;">
					<div id="treeMenu" style="min-width: 200px;"></div>				
					<script type="text/javascript">
					$("#treeMenu").treeview({
						data: [{
							text: "Form",
							nodes: [{
								href: "javascript:Desktop.mainMenuClick('MN_DEV_NUMBERBOX')",
								text: "numberbox"
							}, {
								href: "javascript:Desktop.mainMenuClick('MN_DEV_CURRENCYBOX')",
								text: "currencybox"
							}]
						}]
					});
					</script>
				</div>
			</nav>
			<div id="modulContainer" class="col-md-9 col-lg-10 m-0 p-0" style="background-color: #fff; position: fixed; top: 3.5em; bottom: 0; right: 0;">
				<iframe id="ifrModulContainer" src="" style="width: 99.8%; height: 99.8%;" frameborder="0"></iframe>
			</div>
		</div>	
	</div>
</body>
</html>