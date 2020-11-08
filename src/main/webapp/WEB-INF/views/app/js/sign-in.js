$(function () {
	$("#signInBtn").shieldButton({
		events: {
		click: function (event) {
			doLogin();
		}}
	});
});
function doSignIn() {
	var username = $("#fldUserName").val();
	var password = $("#fldPassword").val();
	$.ajax({ 
		type : "POST", 
		url : "${appBaseUri}authentication/login",
		data : JSON.stringify({ userName: username, password: password }),
		contentType: "application/json; charset=utf-8",
		dataType: 'json',
		cache : false,
		statusCode: {
			401: function() {
				$("#loginAlert").css({ "display": "block" });
				$("#fldUserName").focus();
			}
		}
	}).done(function() {
		window.location.href = "${appBaseUri}app/dashboard.jsp";
	});
}
