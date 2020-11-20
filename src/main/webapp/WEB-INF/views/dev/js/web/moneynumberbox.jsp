<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix = "c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="w" tagdir="/WEB-INF/tags"%>

<!DOCTYPE html>
<html>
<head>
	<w:dev-page-init/>
	<script src="${user.baseUri}/src/1.5.5/build/js/jquery.moneynumberbox.js"></script>
	<script type="text/javascript">
		function afterChangePrice(e) {
			window.console && console.log("afterChangePrice.e: ", e);
			// window.console && console.log("afterChangePrice(0).PRICE: ", $("#PRICE").val());
			var price = $("#PRICE").val();
			window.console && console.log("afterChangePrice(1).price: ", price);
			var price2 = $("#PRICE").moneynumberbox("getValue");
			window.console && console.log("afterChangePrice(1).price2: ", price2);
		}
	</script>
</head>
<body>
	<h2 style="color: red;">MoneyNumberBox</h2>
	<div>
		<h4>MoneyNumberBox</h4>
		<input id="PRICE" value="10.0" >
		<script>
		$(function() {
			$("#PRICE").moneynumberbox({
				editorOnChange: afterChangePrice,
				editorOnFocus: function(e) {
					$(e.currentTarget).select();
				},
				precision:2
			});
		});
		</script>
	</div>
	
	<div style="margin-top: 25px;">
		<pre class="w3-code">
			<code class="html">
&lt;input id=&quot;PRICE&quot; value=&quot;10.0&quot; &gt;
&lt;script&gt;
$(function() {
	$(&quot;#PRICE&quot;).moneynumberbox({
		editorOnChange: afterChangePrice,
		editorOnFocus: function(e) {
			$(e.currentTarget).select();
		},
		precision:2
	});
});
&lt;/script&gt;
			</code>
		</pre>
	</div>
</body>
</html>
