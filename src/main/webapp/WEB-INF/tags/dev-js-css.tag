<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<meta charset="UTF-8">

<link rel="stylesheet" href="${user.baseUri}/src/${user.version.id}/build/css/${info.id}.${user.theme.id}.css" />
<style>
body {
	width: 95%;
	height: 90%;
	margin: 20px;
	overflow: auto;
	font: 12px Arial, Helvetica, sans-serif;
}
.box-col ul, .box-col li {
	margin:0;
	padding:0;
	list-style:none;
}

.box-col {
    display: block;
    float: left;
    padding: 0 3em 1.667em 0;
}

.box ul:not(.km-widget) li,
.demo-section .box-col ul:not(.km-widget) li {
    line-height: 3em;
}

.box li:last-child {
    margin-bottom: 0;
}

.box li a {
    font-size: 13px;
}

</style>