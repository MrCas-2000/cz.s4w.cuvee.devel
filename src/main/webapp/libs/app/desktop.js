var Desktop = {
	mainMenuClick: function(id) {
		console.log("id: ", id);
		$(".menu").find("a").removeClass("menu-selected" );
		$("#"+id).addClass("menu-selected");
		// console.log(">> ", $("#"+id));
		var path =  baseUri + "/app/page/desktop/data/menu-action/" + id;
		$.ajax({ 
			type: "GET", url: baseUri + "/app/page/desktop/data/menu-action/" + id, data: {}, dataType: "json"
		}).done(function(result, jqXHR, textStatus) {
			console.log("result: ", result);
			
			$("#ifrModulContainer").attr("src", baseUri + "/modul/" + id);
		}).fail(function(jqXHR, textStatus, errorThrown) {
			if (jqXHR.status == 401) {
				// alert("Zřejmě jste byl(a) odhlášen(a).\nPo uzavření tohoto okna se prosím přehlaste znovu.");
			} else {
				// $("#placeDescriptDialog").append("textStatus(" + textStatus + "), errorThrown(" + errorThrown + ")");
			}
		});	

	}
}