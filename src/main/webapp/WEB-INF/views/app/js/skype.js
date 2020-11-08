$(document.body).ready(function() {

});

function sentMessage() {
	var msg = $("#fldSypeMessage").val();
	var username = $("#fldSypeMessage").data("username");
	$.ajax({ 
		type : "GET", 
		url : "${uCtx.baseUri}/app/modul/skype/sent/" + username,
		data: { SKYPE_MESSAGE: msg },
		cache : false,
		statusCode: {
			401: function() { alert("Chyba!"); }
		}
	}).done(function(result) {
		$("#messagesList").append(result);
		$("#fldSypeMessage").val("");
	});	
}

function doItemClick(obj) {
	$(".skype-list-item").removeClass("w3-blue");
	$(obj).addClass("w3-blue");
	$.ajax({ 
		type : "GET", 
		url : "${uCtx.baseUri}/app/modul/skype/detail/" + $(obj).data("username"),
		cache : false,
		statusCode: {
			401: function() { alert("Chyba!"); }
		}
	}).done(function(result) {
		$("#skypeDetail").html(result);
	});
}
//$(function () {});