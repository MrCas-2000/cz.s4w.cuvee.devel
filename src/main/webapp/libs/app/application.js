$(document.body).ready(function() {
	$("#toolMenu").suixToolBar({
		items: [{
			overflow: "always",
			template: "<label class='fg-white'>Verze:</label>",
			overflowTemplate: "<label class='fg-lightBlack p-3'>Verze:</label>"
		}, {
			overflow: "always",
			template: "<input id='versionDropdown' style='width: 100px; background-color: transparent;' />",
			overflowTemplate: "<input id='versionDropdown' class='mx-4 my-2' style='width: 150px;' />"
		}, { 
			overflow: "always",
			template: "<label class='fg-white'>Skin:</label>",
			overflowTemplate: "<label class='fg-lightBlack p-3' style='padding: 10px;'>Skin:</label>"
		}, { 
			overflow: "always",
			template: "<input id='themeDropdown' style='width: 150px;' />",
			overflowTemplate: "<input id='themeDropdown' class='mx-4 my-2' style='width: 150px;' />"
		}]
	});
	
	$("#versionDropdown").suixDropDownList({
		dataTextField: "title",
		dataValueField: "id",
		autoWidth: true,
		select: Desktop.changeVersion,
		dataSource: {
			transport: {
				read: {
					url: appBaseUri + "/app/page/desktop/data/versions",
					dataType: "json"
				}
			}
		}
	}).data("suixDropDownList").enable(true);

	$("#themeDropdown").suixDropDownList({
		dataTextField: "title",
		dataValueField: "id",
		autoWidth: true,
		select: Desktop.changeTheme,
		dataSource: {
			transport: {
				read: {
					url: appBaseUri + "/app/page/desktop/data/themes",
					dataType: "json"
				}
			}
		}
	}).data("suixDropDownList").enable(true);
	
	$("#desktopMenu").suixListView({
		selectable: true,
		scrollable: true,
		template: suix.template($("#desktopMenuTemplate").html()),
		change: Desktop.menuOnClick,
		// select: Desktop.menuOnClick, 
		dataSource: {
			transport: {
				read: {
					url: appBaseUri + "/app/page/desktop/data/main-menu",
					dataType: "json"
				}
			}
		},
		dataBound: function() {}
	});
});
