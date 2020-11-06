var Desktop = {
	options: {
		modulId: "",
		version: {
			id: "2020.3", 
			title: "Version 2020.3"
		},
		theme: {
			id: "default-dark",
			title: "Default - Dark"
		}
	},
	autoResize: function() {
		var wh = $(document.body).width();
		var sb = $("#desktop_sidebar");
		var ct = $("#desktopContent");
		if (wh >= 786) {
			ct.css({"left":"250px"});
			sb.css({"width":"250px"});
			sb.addClass("expanded");
		} else {
			ct.css({"left":"0"});
			sb.css({"width":"0"});
			sb.removeClass("expanded");
		}		
	},
	toggleMainMenu: function(e) {
		var sb = $("#desktop_sidebar");
		var wh = $(document.body).width();
		if (wh >= 786) {
			if (!sb.hasClass("expanded")) {
				sb.addClass("expanded");
				sb.css({"width": "250px"});
				$("#desktopContent").css({"left":"250px"});
			} else {
				sb.removeClass("expanded");
				sb.css({"width": "0"});
				$("#desktopContent").css({"left":"0"});
			}
		} else {
			if (!sb.hasClass("expanded")) {
				sb.addClass("expanded");
				sb.css({"width": "250px"});
				$("#desktopContent").css({"left":"0"});
			} else {
				sb.removeClass("expanded");
				sb.css({"width": "0"});
				$("#desktopContent").css({"left":"0"});
			}
		}
	},
	menuOnClick: function(e) {
		var element = $(this.select());
		if (element.hasClass("next")) {
			var id = element.attr("id");
			var dataSource = new suix.data.DataSource({
				transport: {
					read: {
						url: appBaseUri + "/app/page/desktop/data/main-menu/" + id,
						dataType: "json",
						cache: true
					}
				}
			});
			var list = $("#desktopMenu").data("suixListView");
			list.setDataSource(dataSource);
		} else if (element.hasClass("parent")) {
			console.log("Selected element is Parent...");
			console.log("Selected element is Next...");
			var id = element.attr("id");
			var dataSource = new suix.data.DataSource({
				transport: {
					read: {
						url: appBaseUri + "/app/page/desktop/data/main-menu/" + id,
						dataType: "json",
						cache: true
					}
				}
			});
			var list = $("#desktopMenu").data("suixListView");
			list.setDataSource(dataSource);			
		} else {
			var selectedRow = e.sender.dataItem(this.select());
			$("#modules_view").attr("src", baseUri + "/modul/" + selectedRow.id);
			/*
			$.ajax({ 
				type : "GET", 
				url: appBaseUri + "/app/page/desktop/data/menu-action/" + id,
				dataType: 'json',
			}).done(function(result, jqXHR, textStatus) {
				// console.info("result: ", result);
			}).fail(function(jqXHR, textStatus, errorThrown) {
				window.console && console.log("onClick_RestAccount.error: jqXHR(" + jqXHR + "), textStatus(" + textStatus + "), errorThrown(" + errorThrown + ")");
			});
			*/
		}
		// sem dopnit naplneni breadcrumb 
	},
	changeModulView: function(id) {
		window.console && console.log("changeModulView(" + id + ")"); 
	}, 
	changeVersion: function(e) {
		// console.info("changeVersion.e: ", e);
		var id = e.dataItem.id;
		$.ajax({ 
			type : "GET", 
			url: appBaseUri + "/app/page/desktop/actions/changeVersion/" + id,
			contentType: "application/json; charset=utf-8",
			dataType: 'json',
		}).done(function(result, jqXHR, textStatus) {
			// console.info("changeVersion.result: ", result)
			if (result) {
				Desktop.options.version = result;
				console.info("Desktop.options: ", Desktop.options);
			}
		}).fail(function(jqXHR, textStatus, errorThrown) {
			window.console && console.info("changeVersion.error: jqXHR(", jqXHR, "), textStatus(", textStatus, "), errorThrown(", errorThrown, ")");
		});
	},
	changeTheme: function(e) {
		var id = e.dataItem.id; 
		$.ajax({ 
			type : "GET", 
			url: appBaseUri + "/app/page/desktop/actions/changeTheme/" + id,
			contentType: "application/json; charset=utf-8",
			dataType: 'json',
		}).done(function(result, jqXHR, textStatus) {
			// console.info("changeTheme.result: ", result)
			if (result) {
				Desktop.options.theme = result;
				// console.info("Desktop.options: ", Desktop.options);
				$("#desktop-theme-link").attr("href", appBaseUri + "/libs/app/suix/css/suix." + Desktop.options.theme.id + ".css");
			}
		}).fail(function(jqXHR, textStatus, errorThrown) {
			window.console && console.info("changeTheme.error: jqXHR(", jqXHR, "), textStatus(", textStatus, "), errorThrown(", errorThrown, ")");
		});	
	}
}

$(document.body).ready(function() {
	$("#desktop_sidebar").addClass("expanded");
	$(window).on("resize", function(e) {
		Desktop.autoResize();
	});
	Desktop.autoResize();
});