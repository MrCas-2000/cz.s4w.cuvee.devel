(function($) {
	function fixValue(target) {
		var state = $.data(target, "numberbox");
		var opts = state.options;
		$(target).addClass("numberbox-f").textbox(opts);
		$(target).textbox("textbox").css({ imeMode: "disabled" });
		$(target).attr("numberboxName", $(target).attr("textboxName"));
		state.numberbox = $(target).next();
		state.numberbox.addClass("numberbox");
		var val = opts.parser.call(target, opts.value);
		var formattedValue = opts.formatter.call(target, val);
		$(target).numberbox("initValue", val).numberbox("setText", formattedValue);
	};
	function formatValue(target, value) {
		var state = $.data(target, "numberbox");
		var opts = state.options;
		opts.value = parseFloat(value);
		var value = opts.parser.call(target, value);
		var formattedValue = opts.formatter.call(target, value);
		opts.value = value;
		$(target).textbox("setText", formattedValue).textbox("setValue", value);
		formattedValue = opts.formatter.call(target, $(target).textbox("getValue"));
		$(target).textbox("setText", formattedValue);
	};
	$.fn.numberbox = function(options, param) {
		if (typeof options == "string") {
			var method = $.fn.numberbox.methods[options];
			if (method) {
				return method(this, param);
			} else {
				return this.textbox(options, param);
			}
		}
		options = options || {};
		return this.each(function() {
			var state = $.data(this, "numberbox");
			if (state) {
				$.extend(state.options, options);
			} else {
				state = $.data(this, "numberbox", { options: $.extend({}, $.fn.numberbox.defaults, $.fn.numberbox.parseOptions(this), options) });
			}
			fixValue(this);
		});
	};
	$.fn.numberbox.methods = {
		options: function(jq) {
			var opts = jq.data("textbox") ? jq.textbox("options") : {};
			return $.extend($.data(jq[0], "numberbox").options, { width: opts.width, originalValue: opts.originalValue, disabled: opts.disabled, readonly: opts.readonly });
		}, cloneFrom: function(jq, target) {
			return jq.each(function() {
				$(this).textbox("cloneFrom", target);
				$.data(this, "numberbox", { options: $.extend(true, {}, $(target).numberbox("options")) });
				$(this).addClass("numberbox-f");
			});
		}, fix: function(jq) {
			return jq.each(function() {
				var opts = $(this).numberbox("options");
				opts.value = null;
				var value = opts.parser.call(this, $(this).numberbox("getText"));
				$(this).numberbox("setValue", value);
			});
		}, setValue: function(jq, value) {
			return jq.each(function() {
				formatValue(this, value);
			});
		}, clear: function(jq) {
			return jq.each(function() {
				$(this).textbox("clear");
				$(this).numberbox("options").value = "";
			});
		}, reset: function(jq) {
			return jq.each(function() {
				$(this).textbox("reset");
				$(this).numberbox("setValue", $(this).numberbox("getValue"));
			});
		}
	};
	$.fn.numberbox.parseOptions = function(target) {
		var t = $(target);
		return $.extend({}, $.fn.textbox.parseOptions(target), $.parser.parseOptions(target, ["decimalSeparator", "groupSeparator", "suffix", { min: "number", max: "number", precision: "number" }]), { prefix: (t.attr("prefix") ? t.attr("prefix") : undefined) });
	};
	$.fn.numberbox.defaults = $.extend({}, $.fn.textbox.defaults, {
		inputEvents: {
			keypress: function(e) {
				var target = e.data.target;
				var opts = $(target).numberbox("options");
				return opts.filter.call(target, e);
			}, blur: function(e) {
				$(e.data.target).numberbox("fix");
			}, keydown: function(e) {
				if (e.keyCode == 13) {
					$(e.data.target).numberbox("fix");
				}
			}
		}, 
		min: null, 
		max: null, 
		precision: 0, 
		decimalSeparator: ".", 
		groupSeparator: "", 
		prefix: "", 
		suffix: "", 
		filter: function(e) {
			var opts = $(this).numberbox("options");
			var s = $(this).numberbox("getText");
			if (e.metaKey || e.ctrlKey) {
				return true;
			}
			if ($.inArray(String(e.which), ["46", "8", "13", "0"]) >= 0) {
				return true;
			}
			var tmp = $("<span></span>");
			tmp.html(String.fromCharCode(e.which));
			var c = tmp.text();
			tmp.remove();
			if (!c) {
				return true;
			}
			if (c == "-" || c == opts.decimalSeparator) {
				return (s.indexOf(c) == -1) ? true : false;
			} else {
				if (c == opts.groupSeparator) {
					return true;
				} else {
					if ("0123456789".indexOf(c) >= 0) {
						return true;
					} else {
						return false;
					}
				}
			}
		}, formatter: function(value) {
			if (!value) {
				return value;
			}
			value = value + "";
			var opts = $(this).numberbox("options");
			var s1 = value, s2 = "";
			var dpos = value.indexOf(".");
			if (dpos >= 0) {
				s1 = value.substring(0, dpos);
				s2 = value.substring(dpos + 1, value.length);
			}
			if (opts.groupSeparator) {
				var p = /(\d+)(\d{3})/;
				while (p.test(s1)) {
					s1 = s1.replace(p, "$1" + opts.groupSeparator + "$2");
				}
			}
			if (s2) {
				return opts.prefix + s1 + opts.decimalSeparator + s2 + opts.suffix;
			} else {
				return opts.prefix + s1 + opts.suffix;
			}
		}, parser: function(s) {
			s = s + "";
			var opts = $(this).numberbox("options");
			if (opts.prefix) {
				s = $.trim(s.replace(new RegExp("\\" + $.trim(opts.prefix), "g"), ""));
			}
			if (opts.suffix) {
				s = $.trim(s.replace(new RegExp("\\" + $.trim(opts.suffix), "g"), ""));
			}
			if (parseFloat(s) != opts.value) {
				if (opts.groupSeparator) {
					s = $.trim(s.replace(new RegExp("\\" + opts.groupSeparator, "g"), ""));
				}
				if (opts.decimalSeparator) {
					s = $.trim(s.replace(new RegExp("\\" + opts.decimalSeparator, "g"), "."));
				}
				s = s.replace(/\s/g, "");
			}
			var val = parseFloat(s).toFixed(opts.precision);
			if (isNaN(val)) {
				val = "";
			} else {
				if (typeof (opts.min) == "number" && val < opts.min) {
					val = opts.min.toFixed(opts.precision);
				} else {
					if (typeof (opts.max) == "number" && val > opts.max) {
						val = opts.max.toFixed(opts.precision);
					}
				}
			}
			return val;
		}
	});
})(jQuery);

