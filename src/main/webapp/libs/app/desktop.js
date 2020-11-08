var Desktop = {
	mainMenuClick: function(id) {
		console.log(id);
	}
}
function onClick_MainMenu(event, node) {
	if (node.action) {
		var actionId = node.action.id;
		if (actionId) {
			if (actionId === "MN-A-0100000001" || 
				actionId === "MN-A-0100000002" ||
				actionId === "MN-A-0200000001" ||
				actionId === "MN-A-0200000002" ||
				actionId === "MN-A-0200000003" || 
				actionId === "MN-A-0200000004") {

				var modul = "familychart";
				var page = "main";
				if (actionId === "MN-A-0100000001") {
					var modul = "project";
					var page = "main";
				} else if (actionId === "MN-A-0100000002") {
					var modul = "familychart";
					var page = "main";
				}					
				if (actionId === "MN-A-0200000001") {
					var modul = "people";
					var page = "main";
				} else if (actionId === "MN-A-0200000002") {
					var modul = "people";
					var page = "main";
				} else if (actionId === "MN-A-0200000003") {
					var modul = "people";
					var page = "main.jsp";
				} else if (actionId === "MN-A-0200000004") {
					var modul = "people";
					var page = "main";						
				}
				var url = baseUri + "/app/page/" + modul + "/" + page;
				$("#ifrModulContainer").attr("src", "" + url);
			} 
		}
	}
}
