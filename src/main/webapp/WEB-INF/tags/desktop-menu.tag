<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="w" tagdir="/WEB-INF/tags" %>
<ul class="desktop-slide-menu">
	<%--
	<c:forEach items="${menu.items}" var="node">
		<w:desktop-menu-item label="${node.label}" href="${node.href}" items="${node.items}"/>
	</c:forEach>
	--%>
	<li><a href="javascript:changeModulView('');">Get Started</a>
	<li><a href="javascript:void(0);">Demo</a>
	<ul>
		<li><a href="javascript:void(0);">Autocomplete</a>
		<ul>
			<li><a href="javascript:changeModulView('MN_AUTOCOMPLETE_01');">Basic</a>
		</ul>
		<li><a href="javascript:void(0);">Button</a>
		<ul>
			<li><a href="javascript:changeModulView('MN_BUTTON_01');">Basic</a>
			<li><a href="javascript:changeModulView('MN_BUTTON_99');">Basic All</a>
		</ul>
	</ul>
	<li><a href="javascript:void(0);">Documentation</a>
	<ul>
		<li><a href="javascript:changeModulView('MN_DOCS_AUTOCOMPLETE');">Autocomplete</a>
		<li><a href="javascript:changeModulView('MN_DOCS_BUTTON');">Button</a>
	</ul>
	<li><a href="javascript:void(0);">Devel</a>
	<ul>
		<li><a href="javascript:changeModulView('');">Autocomplete</a>
		<li><a href="javascript:changeModulView('');">Button</a>
	</ul>		

	<li><a href="javascript:changeModulView('welcome');">Contacts</a>
	
	<%--
	<li><a href="javascript:changeModulView('');">Get Started</a></li>
	<li><a href="javascript:void(0);">Demo</a></li>
	<ul>
		<li><a href="">Web</a></li>
		<li><a href="">DataViz</a></li>
	</ul>
	<li><a href="javascript:void(0);">Documentation</a></li>
	<li><a href="javascript:changeModulView('welcome');">Contacts</a></li>	
	--%>
</ul>
