<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="w" tagdir="/WEB-INF/tags" %>
<%@ attribute name="href"%>
<%@ attribute name="label"%>
<%@ attribute name="items" rtexprvalue="true" type="java.util.List" %>
<li><a href="${href}">${label}</a>
<c:forEach items="${items}" var="node">
<c:if test="${not empty items}">
<ul>
<c:forEach items="${items}" var="node">
	<w:desktop-menu-item label="${node.label}" href="${node.href}" items="${node.items}"/>
</c:forEach>
</ul>
</c:if>	
</c:forEach>
