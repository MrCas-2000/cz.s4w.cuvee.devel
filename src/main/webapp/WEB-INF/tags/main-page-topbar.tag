<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%--
#48d1cc;
#cce6ff;
navbar-expand-md 
 --%>
<nav class="navbar navbar-light flex-row" style="background-color: #cce6ff; height: 40px">
	<a class="navbar-brand" href="${it.baseUri}">
		<img src="${it.baseUri}/favicon.svg" width="24" height="24" class="d-inline-block" alt="">
		<b>Buriosca.cz - Cancel 2018</b>
	</a>
	<c:set var="authorized" value="${ it.loginId != null && not empty it.loginId }"/>
	<div class="container">
		<c:if test="${ authorized }">
			<ul id="menu" style="background: transparent;"></ul>
			<script>
				var baseUri = "${it.baseUri}";
				$("#menu").suixMenu({
					dataSource: ${it.mainMenuData}
				});
			</script>
		</c:if>
	</div>		
	<ul class="navbar-nav flex-row mr-lg-0">
		<c:choose>
			<c:when test="${ authorized }">
				<li class="nav-item">
					<a class="nav-link pr-2"><i class="fa fa-at"></i></a>
				</li>
				<li class="nav-item">
					<a class="nav-link pr-2"><i class="fa fa-skype"></i></a>
				</li>
				<li class="nav-item dropdown">
					<a class="nav-link dropdown-toggle mr-3 mr-lg-0" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
						<i class="fa fa-cog"></i><span class="caret"></span>
					</a>
					<div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdownMenuLink">
						<a class="dropdown-item" href="">Nastavení</a>
					</div>
				</li>
				<li class="nav-item dropdown">
					<a class="nav-link dropdown-toggle mr-3 mr-lg-0" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
						<i class="fa fa-user"></i><span class="caret"></span>
					</a>
					<div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdownMenuLink">
						<a class="dropdown-item" href="">User</a>
						<a class="dropdown-item" href="">Logout</a>
					</div>
				</li>
			</c:when>
			<c:otherwise>
				<li class="nav-item dropdown">
					<a class="nav-link dropdown-toggle mr-3 mr-lg-0" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
						<i class="fa fa-cog"></i><span class="caret"></span>
					</a>
					<div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdownMenuLink">
						<a class="dropdown-item" href="">Nastavení</a>
					</div>
				</li>		
			</c:otherwise>		
		</c:choose>
	</ul>
	<%--
	<button class="navbar-toggler ml-lg-0" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
		<span class="navbar-toggler-icon"></span>
	</button>
	--%>
</nav>

<%--
<nav class="navbar navbar-dark bg-info fixed-top">
	<a class="navbar-brand" href="javascript:void(0)">
		<img src="${it.baseUri}/favicon.svg" width="24" height="24" class="d-inline-block" alt="">
		Buriosca.cz - Cancel 2018
	</a>
</nav>
<div class="wx-top-bar wx-teal" style="">
	<div class="wx-topbar-logopart">
		<img src="${it.baseUri}/favicon.png" width="32px" height="32px" style="margin-top: 2px;">
		<b style="font-size: 16px; padding: 0 5px;">Buriosca.cz - Ortus 2018</b>
	</div>
	<div id="topbarMenuPart" class="wx-topbar-menupart">
		<c:if test="${not empty it.mainMenuData}">
			<div id="mainMenuBar" style="width: 100%; height: 100%; padding-top: 8px;">
				<ul id="menu" style="background: transparent;"></ul>
				<script>
				var baseUri = "${it.baseUri}";
				$("#menu").suixMenu({
					dataSource: ${it.mainMenuData}
				});
				</script>
			</div>		
		</c:if>
	</div>		
</div>
--%>