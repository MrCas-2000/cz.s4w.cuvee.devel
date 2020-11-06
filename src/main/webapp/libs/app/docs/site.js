(function() {
	"use strict";
	
	var form = $(".need-validation");
	form.on("submit", function(event) {
		event.preventDefault();
		event.stopPropagation();
	}, false);
	$.each($("pre"), function() {
		var pre = $(this);
		pre.prepend($("<button>").addClass("w3-button").attr("title", "Copy").html("<span class='mif-copy'></span>"));
	});
	hljs.initHighlightingOnLoad();
	
	new Clipboard('.copy-button', {
		target: function(trigger) {
			return trigger.nextElementSibling;
		}
	});
    // Metro.utils.cleanPreCode("pre code, textarea");		
	cleanPreCode("pre code, textarea");
	setTimeout(function(){
		var b = $(".adsbygoogle");
		var target = $("main > h1 + .text-leader");
		var div = $("<div>").addClass("example no-border p-0");
		
		//if (Metro.utils.isLocalhost()) {
		if (isLocalhost()) {
			return ;
		}
		if (b.length === 0) {
			// div.html("<div class='bg-red fg-white p-4 text-center h3 text-light'>With your help, I can make Metro 4 even better! Please, disable AdBlock or AdGuard.<br>Thank you for your support!</div>");
			// div.insertAfter(target);
		} else {
			$.each(b, function(){
				var bl = $(this);
				if (bl.height() < 50 || Metro.utils.getStyleOne(bl, 'display') === 'none') {
					// div.html("<div class='bg-red fg-white p-4 text-center h3 text-light'>With your help, I can make Metro 4 even better! Please, disable AdBlock or AdGuard.<br>Thank you for your support!</div>");
					// div.insertAfter(target);
				}
			});
		}
	}, 1000)
}());

function isLocalhost() {
	return window.location.hostname === 'localhost' || 
			window.location.hostname === '[::1]' || 
			window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/);
}

function cleanPreCode(selector) {
	var els = Array.prototype.slice.call(document.querySelectorAll(selector), 0);
	els.forEach(function(el) {
		var txt = el.textContent.replace(/^[\r\n]+/, "") // strip leading newline
		.replace(/\s+$/g, "");
		if (/^\S/gm.test(txt)) {
			el.textContent = txt;
			return;
		}
		var mat, str, re = /^[\t ]+/gm, len, min = 1e3;
		while (mat = re.exec(txt)) {
			len = mat[0].length;

			if (len < min) {
				min = len;
				str = mat[0];
			}
		}
		if (min === 1e3)
			return;

		el.textContent = txt.replace(new RegExp("^" + str, 'gm'), "");
	});
}