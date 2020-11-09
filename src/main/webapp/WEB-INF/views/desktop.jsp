<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib prefix="w" tagdir="/WEB-INF/tags"%>
<!DOCTYPE html>
	<w:main-page-init/>
	
	<link href="/cuvee/libs/awesome/css/font-awesome.min.css" rel="stylesheet"/>
	<link href="/cuvee/libs/app/desktop.css" rel="stylesheet"/>
	<link href="/cuvee/libs/app/desktop-menu.css" rel="stylesheet"/>
	<script src="/cuvee/libs/app/desktop.js"></script>
	<script src="/cuvee/libs/app/desktop-menu.js"></script>
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
					<ul class="menu">
						<li>
							<a class="caret" href="javascript:void(0);">Devel</a>
							<ul class="nested">
								<li>
									<a class="caret" href="javascript:void(0);">Base</a>
									<ul class="nested">
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_PARSER')" id="MN_DEV_PARSER">parser</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_EASYLOADER')" id="MN_DEV_EASYLOADER">easyloader</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_DRAGGABLE')" id="MN_DEV_DRAGGABLE">draggable</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_DROPPABLE')" id="MN_DEV_DROPPABLE">droppable</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_RESIZABLE')" id="MN_DEV_RESIZABLE">resizable</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_PAGINATION')" id="MN_DEV_PAGINATION">pagination</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_SEARCHBOX')" id="MN_DEV_SEARCHBOX">searchbox</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_PROGRESSBAR')" id="MN_DEV_PROGRESSBAR">progressbar</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_TOOLTIP')" id="MN_DEV_TOOLTIP">tooltip</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_MOBILE')" id="MN_DEV_MOBILE">mobile</a></li>
									</ul>
								</li>
								<li>
									<a class="caret" href="javascript:void(0);">Form</a>
									<ul class="nested">
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_FORM')" id="MN_DEV_FORM">form</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_VALIDATEBOX')" id="MN_DEV_VALIDATEBOX">validatebox</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_TEXTBOX')" id="MN_DEV_TEXTBOX">textbox</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_PASSWORDBOX')" id="MN_DEV_PASSWORDBOX">passwordbox</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_MASKEDBOX')" id="MN_DEV_MASKEDBOX">maskedbox</a></li>
 										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_COMBO')" id="MN_DEV_COMBO">combo</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_COMBOBOX')" id="MN_DEV_COMBOBOX">combobox</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_COMBOTREE')" id="MN_DEV_COMBOTREE">combotree</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_COMBOGRID')" id="MN_DEV_COMBOGRID">combogrid</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_COMBOTREEGRID')" id="MN_DEV_COMBOTREEGRID">combotreegrid</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_TAGBOX')" id="MN_DEV_TAGBOX">tagbox</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_NUMBERBOX')" id="MN_DEV_NUMBERBOX">numberbox</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_DATEBOX')" id="MN_DEV_DATEBOX">datebox</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_DATETIMEBOX')" id="MN_DEV_DATETIMEBOX">datetimebox</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_DATETIMESPINNER')" id="MN_DEV_DATETIMESPINNER">datetimespinner</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_CALENDAR')" id="MN_DEV_CALENDAR">calendar</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_SPINNER')" id="MN_DEV_SPINNER">spinner</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_NUMBERSPINNER')" id="MN_DEV_NUMBERSPINNER">numberspinner</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_TIMESPINNER')" id="MN_DEV_TIMESPINNER">timespinner</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_TIMEPICKER')" id="MN_DEV_TIMEPICKER">timepicker</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_SLIDER')" id="MN_DEV_SLIDER">slider</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_FILEBOX')" id="MN_DEV_FILEBOX">filebox</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_CHECKBOX')" id="MN_DEV_CHECKBOX">checkbox</a></li>
										<li><a href="javascript:Desktop.mainMenuClick('MN_DEV_RADIOBUTTON')" id="MN_DEV_RADIOBUTTON">radiobutton</a></li>
									</ul>
								</li>
							</ul>
						</li>
					</ul>	
				</div>
			</nav>
			<div id="modulContainer" class="col-md-9 col-lg-10 m-0 p-0" style="background-color: #fff; position: fixed; top: 3.5em; bottom: 0; right: 0;">
				<iframe id="ifrModulContainer" src="" style="width: 99.8%; height: 99.8%;" frameborder="0"></iframe>
			</div>
		</div>	
	</div>
</body>
</html>