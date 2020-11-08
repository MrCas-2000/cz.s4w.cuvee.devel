<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<nav class="navbar navbar-dark sticky-top flex-md-nowrap p-0 navbar-expand-md" style="background-color: red;">
	<div class="navbar-brand d-flex align-items-center justify-content-between col-12 col-md-2 mr-0">
		<a class="text-light" href="${user.baseUri}/">
			<img src="${user.baseUri}/favicon.png" width="24px" height="24px" style="margin-top: 0px;">
			<b style="font-size: 16px; padding: 0 5px;">Buriosca.cz - Ortus</b>			
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
					<i class="fa fa-ellipsis-v"></i>
				</a>
			</li>
		</ul>
	</div>
</nav>