function desktop_onMenuClick(id) {
	$.ajax({ 
		type : "GET", 
		url : baseUri + "/app/data/desktop/menu/action/" + id,
		dataType: 'json',
		cache : false,
	}).done(function(data, textStatus, jqXHR) {
		if (data && data.type == "MODUL_PAGE") {
			desktop_loadModul(data.path);	
		} else if (data && data.type == "MODUL_LIST") {
			desktop_appendModul(data);
		}
	}).fail(function() {
		alert("Chyba !!!")
	});
}

function desktop_loadModul(path) {
	$("#ifrModulContainer").attr("src", baseUri + path);
}

function desktop_appendModul(data) {
	var path = data.path;
	$.ajax({ 
		type : "GET", 
		url : baseUri + path,
		cache : false,
	}).done(function(data, textStatus, jqXHR) {
		$("#modulContainer").html(data);
		//window.console && console.log("" + data);
	}).fail(function() {
		alert("Chyba !!!")
	});	
}