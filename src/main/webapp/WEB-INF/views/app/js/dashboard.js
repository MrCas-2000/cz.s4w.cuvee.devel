function openTab(evt, tabId) {
	$(".city").css({display: "none"});
	$("#"+tabId).css({display: "block"});
	$(".tablink").removeClass("w3-light-gray");
	evt.currentTarget.className += " w3-light-gray";
}