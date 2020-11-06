<%@ tag language="java" pageEncoding="UTF-8"%>
<nav id="desktop_topbar" class="sx-theme fixed-top d-flex flex-justify-between flex-align-center">
	<span id="desktop_menu_button" class="px-2" style="width: 40px;" onclick="Desktop.toggleMainMenu(event);">
		<span class="k-icon k-i-menu"></span>
	</span>
	<div class="px-0 d-flex flex-align-center">
		<img alt="" src="${user.baseUri}/favicon.png" width="24px" height="24px">
		<a href="${user.baseUri}" class="sx-theme" style="text-decoration: none;">
			<b style="margin-left: 8px;">Buriosca.cz - Suix</b>
        </a>
	</div>
	<div  class="tool-menu tool-menu-md m-0 p-0 no-border " >
		<div id="toolMenu" class="w-100" style="background-color: transparent; border: none; height: 40px; min-height: 40px; max-height: 40px;"></div>
	</div>
</nav>