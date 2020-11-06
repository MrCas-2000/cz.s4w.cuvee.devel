(function (f, define) {
    define('suix.drawing', [
        'drawing/util',
        'drawing/suix-drawing',
        'drawing/surface-tooltip',
        'drawing/surface',
        'drawing/html'
    ], f);
}(function () {
    var __meta__ = {
        id: 'drawing',
        name: 'Drawing API',
        category: 'framework',
        description: 'The Suix low-level drawing API',
        depends: [
            'core',
            'color',
            'popup'
        ]
    };
}, typeof define == 'function' && define.amd ? define : function (a1, a2, a3) {
    (a3 || a2)();
}));
(function (f, define) {
    define('drawing/util', ['suix.core'], f);
}(function () {
    (function ($) {
        function createPromise() {
            return $.Deferred();
        }
        function promiseAll(promises) {
            return $.when.apply($, promises);
        }
        suix.drawing.util = suix.drawing.util || {};
        suix.deepExtend(suix.drawing.util, {
            createPromise: createPromise,
            promiseAll: promiseAll
        });
    }(window.suix.jQuery));
    return window.suix;
}, typeof define == 'function' && define.amd ? define : function (a1, a2, a3) {
    (a3 || a2)();
}));
(function (f, define) {
    define('drawing/suix-drawing', [
        'drawing/util',
        'suix.color',
        'util/text-metrics'
    ], f);
}(function () {
    (function ($) {
        window.suix = window.suix || {};
        var suixDrawing = suix.drawing;
        var suixDrawingUtil = suixDrawing.util;
        var Class = suix.Class;
        var suixUtil = suix.util;
        var support = suix.support;
        var supportBrowser = support.browser;
        var createPromise = suixDrawingUtil.createPromise;
        var promiseAll = suixDrawingUtil.promiseAll;
        var ObserversMixin = {
            extend: function (proto) {
                var this$1 = this;
                for (var method in this) {
                    if (method !== 'extend') {
                        proto[method] = this$1[method];
                    }
                }
            },
            observers: function () {
                this._observers = this._observers || [];
                return this._observers;
            },
            addObserver: function (element) {
                if (!this._observers) {
                    this._observers = [element];
                } else {
                    this._observers.push(element);
                }
                return this;
            },
            removeObserver: function (element) {
                var observers = this.observers();
                var index = observers.indexOf(element);
                if (index !== -1) {
                    observers.splice(index, 1);
                }
                return this;
            },
            trigger: function (methodName, event) {
                var observers = this._observers;
                if (observers && !this._suspended) {
                    for (var idx = 0; idx < observers.length; idx++) {
                        var observer = observers[idx];
                        if (observer[methodName]) {
                            observer[methodName](event);
                        }
                    }
                }
                return this;
            },
            optionsChange: function (e) {
                if (e === void 0) {
                    e = {};
                }
                e.element = this;
                this.trigger('optionsChange', e);
            },
            geometryChange: function () {
                this.trigger('geometryChange', { element: this });
            },
            suspend: function () {
                this._suspended = (this._suspended || 0) + 1;
                return this;
            },
            resume: function () {
                this._suspended = Math.max((this._suspended || 0) - 1, 0);
                return this;
            },
            _observerField: function (field, value) {
                if (this[field]) {
                    this[field].removeObserver(this);
                }
                this[field] = value;
                value.addObserver(this);
            }
        };
        function append(first, second) {
            first.push.apply(first, second);
            return first;
        }
        var literals = {
            1: 'i',
            10: 'x',
            100: 'c',
            2: 'ii',
            20: 'xx',
            200: 'cc',
            3: 'iii',
            30: 'xxx',
            300: 'ccc',
            4: 'iv',
            40: 'xl',
            400: 'cd',
            5: 'v',
            50: 'l',
            500: 'd',
            6: 'vi',
            60: 'lx',
            600: 'dc',
            7: 'vii',
            70: 'lxx',
            700: 'dcc',
            8: 'viii',
            80: 'lxxx',
            800: 'dccc',
            9: 'ix',
            90: 'xc',
            900: 'cm',
            1000: 'm'
        };
        function arabicToRoman(n) {
            var values = [
                1000,
                900,
                800,
                700,
                600,
                500,
                400,
                300,
                200,
                100,
                90,
                80,
                70,
                60,
                50,
                40,
                30,
                20,
                10,
                9,
                8,
                7,
                6,
                5,
                4,
                3,
                2,
                1
            ];
            var roman = '';
            while (n > 0) {
                if (n < values[0]) {
                    values.shift();
                } else {
                    roman += literals[values[0]];
                    n -= values[0];
                }
            }
            return roman;
        }
        var UNDEFINED = 'undefined';
        function defined(value) {
            return typeof value !== UNDEFINED;
        }
        var defId = 1;
        function definitionId() {
            return 'kdef' + defId++;
        }
        var DEG_TO_RAD = Math.PI / 180;
        var MAX_NUM = Number.MAX_VALUE;
        var MIN_NUM = -Number.MAX_VALUE;
        function deg(radians) {
            return radians / DEG_TO_RAD;
        }
        var KEY_STR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        var fromCharCode = String.fromCharCode;
        function encodeUTF8(input) {
            var output = '';
            for (var i = 0; i < input.length; i++) {
                var c = input.charCodeAt(i);
                if (c < 128) {
                    output += fromCharCode(c);
                } else if (c < 2048) {
                    output += fromCharCode(192 | c >>> 6);
                    output += fromCharCode(128 | c & 63);
                } else if (c < 65536) {
                    output += fromCharCode(224 | c >>> 12);
                    output += fromCharCode(128 | c >>> 6 & 63);
                    output += fromCharCode(128 | c & 63);
                }
            }
            return output;
        }
        function encodeBase64(input) {
            var output = '';
            var i = 0;
            var utfInput = encodeUTF8(input);
            while (i < utfInput.length) {
                var chr1 = utfInput.charCodeAt(i++);
                var chr2 = utfInput.charCodeAt(i++);
                var chr3 = utfInput.charCodeAt(i++);
                var enc1 = chr1 >> 2;
                var enc2 = (chr1 & 3) << 4 | chr2 >> 4;
                var enc3 = (chr2 & 15) << 2 | chr3 >> 6;
                var enc4 = chr3 & 63;
                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }
                output = output + KEY_STR.charAt(enc1) + KEY_STR.charAt(enc2) + KEY_STR.charAt(enc3) + KEY_STR.charAt(enc4);
            }
            return output;
        }
        function eventCoordinates(e) {
            if (defined((e.x || {}).location)) {
                return {
                    x: e.x.location,
                    y: e.y.location
                };
            }
            return {
                x: e.pageX || e.clientX || 0,
                y: e.pageY || e.clientY || 0
            };
        }
        function eventElement(e) {
            if (e === void 0) {
                e = {};
            }
            return e.touch ? e.touch.initialTouch : e.target;
        }
        function isTransparent(color) {
            return color === '' || color === null || color === 'none' || color === 'transparent' || !defined(color);
        }
        function last(array) {
            if (array) {
                return array[array.length - 1];
            }
        }
        function limitValue(value, min, max) {
            return Math.max(Math.min(value, max), min);
        }
        function mergeSort(a, cmp) {
            if (a.length < 2) {
                return a.slice();
            }
            function merge(a, b) {
                var r = [], ai = 0, bi = 0, i = 0;
                while (ai < a.length && bi < b.length) {
                    if (cmp(a[ai], b[bi]) <= 0) {
                        r[i++] = a[ai++];
                    } else {
                        r[i++] = b[bi++];
                    }
                }
                if (ai < a.length) {
                    r.push.apply(r, a.slice(ai));
                }
                if (bi < b.length) {
                    r.push.apply(r, b.slice(bi));
                }
                return r;
            }
            return function sort(a) {
                if (a.length <= 1) {
                    return a;
                }
                var m = Math.floor(a.length / 2);
                var left = a.slice(0, m);
                var right = a.slice(m);
                left = sort(left);
                right = sort(right);
                return merge(left, right);
            }(a);
        }
        function rad(degrees) {
            return degrees * DEG_TO_RAD;
        }
        function pow(p) {
            if (p) {
                return Math.pow(10, p);
            }
            return 1;
        }
        function round(value, precision) {
            var power = pow(precision);
            return Math.round(value * power) / power;
        }
        function valueOrDefault(value, defaultValue) {
            return defined(value) ? value : defaultValue;
        }
        function bindEvents(element, events) {
            for (var eventName in events) {
                var eventNames = eventName.trim().split(' ');
                for (var idx = 0; idx < eventNames.length; idx++) {
                    element.addEventListener(eventNames[idx], events[eventName], false);
                }
            }
        }
        function elementOffset(element) {
            var box = element.getBoundingClientRect();
            var documentElement = document.documentElement;
            return {
                top: box.top + (window.pageYOffset || documentElement.scrollTop) - (documentElement.clientTop || 0),
                left: box.left + (window.pageXOffset || documentElement.scrollLeft) - (documentElement.clientLeft || 0)
            };
        }
        function elementStyles(element, styles) {
            var result = {};
            var style = window.getComputedStyle(element) || {};
            var stylesArray = Array.isArray(styles) ? styles : [styles];
            for (var idx = 0; idx < stylesArray.length; idx++) {
                var field = stylesArray[idx];
                result[field] = style[field];
            }
            return result;
        }
        function getPixels(value) {
            if (isNaN(value)) {
                return value;
            }
            return value + 'px';
        }
        function elementSize(element, size) {
            if (size) {
                var width = size.width;
                var height = size.height;
                if (defined(width)) {
                    element.style.width = getPixels(width);
                }
                if (defined(height)) {
                    element.style.height = getPixels(height);
                }
            } else {
                var size$1 = elementStyles(element, [
                    'width',
                    'height'
                ]);
                return {
                    width: parseInt(size$1.width, 10),
                    height: parseInt(size$1.height, 10)
                };
            }
        }
        function unbindEvents(element, events) {
            if (events === void 0) {
                events = {};
            }
            for (var name in events) {
                var eventNames = name.trim().split(' ');
                for (var idx = 0; idx < eventNames.length; idx++) {
                    element.removeEventListener(eventNames[idx], events[name], false);
                }
            }
        }
        var util = {
            append: append,
            arabicToRoman: arabicToRoman,
            createPromise: createPromise,
            defined: defined,
            definitionId: definitionId,
            deg: deg,
            encodeBase64: encodeBase64,
            eventCoordinates: eventCoordinates,
            eventElement: eventElement,
            isTransparent: isTransparent,
            last: last,
            limitValue: limitValue,
            mergeSort: mergeSort,
            promiseAll: promiseAll,
            rad: rad,
            round: round,
            valueOrDefault: valueOrDefault,
            bindEvents: bindEvents,
            elementOffset: elementOffset,
            elementSize: elementSize,
            elementStyles: elementStyles,
            unbindEvents: unbindEvents,
            DEG_TO_RAD: DEG_TO_RAD,
            MAX_NUM: MAX_NUM,
            MIN_NUM: MIN_NUM
        };
        var toString = {}.toString;
        var OptionsStore = Class.extend({
            init: function (options, prefix) {
                var this$1 = this;
                if (prefix === void 0) {
                    prefix = '';
                }
                this.prefix = prefix;
                for (var field in options) {
                    var member = options[field];
                    member = this$1._wrap(member, field);
                    this$1[field] = member;
                }
            },
            get: function (field) {
                var parts = field.split('.');
                var result = this;
                while (parts.length && result) {
                    var part = parts.shift();
                    result = result[part];
                }
                return result;
            },
            set: function (field, value) {
                var current = this.get(field);
                if (current !== value) {
                    this._set(field, this._wrap(value, field));
                    this.optionsChange({
                        field: this.prefix + field,
                        value: value
                    });
                }
            },
            _set: function (field, value) {
                var this$1 = this;
                var composite = field.indexOf('.') >= 0;
                var parentObj = this;
                var fieldName = field;
                if (composite) {
                    var parts = fieldName.split('.');
                    var prefix = this.prefix;
                    while (parts.length > 1) {
                        fieldName = parts.shift();
                        prefix += fieldName + '.';
                        var obj = parentObj[fieldName];
                        if (!obj) {
                            obj = new OptionsStore({}, prefix);
                            obj.addObserver(this$1);
                            parentObj[fieldName] = obj;
                        }
                        parentObj = obj;
                    }
                    fieldName = parts[0];
                }
                parentObj._clear(fieldName);
                parentObj[fieldName] = value;
            },
            _clear: function (field) {
                var current = this[field];
                if (current && current.removeObserver) {
                    current.removeObserver(this);
                }
            },
            _wrap: function (object, field) {
                var type = toString.call(object);
                var wrapped = object;
                if (wrapped !== null && defined(wrapped) && type === '[object Object]') {
                    if (!(object instanceof OptionsStore) && !(object instanceof Class)) {
                        wrapped = new OptionsStore(wrapped, this.prefix + field + '.');
                    }
                    wrapped.addObserver(this);
                }
                return wrapped;
            }
        });
        ObserversMixin.extend(OptionsStore.prototype);
        function setAccessor(field) {
            return function (value) {
                if (this[field] !== value) {
                    this[field] = value;
                    this.geometryChange();
                }
                return this;
            };
        }
        function getAccessor(field) {
            return function () {
                return this[field];
            };
        }
        function defineAccessors(fn, fields) {
            for (var i = 0; i < fields.length; i++) {
                var name = fields[i];
                var capitalized = name.charAt(0).toUpperCase() + name.substring(1, name.length);
                fn['set' + capitalized] = setAccessor(name);
                fn['get' + capitalized] = getAccessor(name);
            }
        }
        var Matrix = Class.extend({
            init: function (a, b, c, d, e, f) {
                if (a === void 0) {
                    a = 0;
                }
                if (b === void 0) {
                    b = 0;
                }
                if (c === void 0) {
                    c = 0;
                }
                if (d === void 0) {
                    d = 0;
                }
                if (e === void 0) {
                    e = 0;
                }
                if (f === void 0) {
                    f = 0;
                }
                this.a = a;
                this.b = b;
                this.c = c;
                this.d = d;
                this.e = e;
                this.f = f;
            },
            multiplyCopy: function (matrix) {
                return new Matrix(this.a * matrix.a + this.c * matrix.b, this.b * matrix.a + this.d * matrix.b, this.a * matrix.c + this.c * matrix.d, this.b * matrix.c + this.d * matrix.d, this.a * matrix.e + this.c * matrix.f + this.e, this.b * matrix.e + this.d * matrix.f + this.f);
            },
            invert: function () {
                var ref = this;
                var a = ref.a;
                var b = ref.b;
                var d = ref.c;
                var e = ref.d;
                var g = ref.e;
                var h = ref.f;
                var det = a * e - b * d;
                if (det === 0) {
                    return null;
                }
                return new Matrix(e / det, -b / det, -d / det, a / det, (d * h - e * g) / det, (b * g - a * h) / det);
            },
            clone: function () {
                return new Matrix(this.a, this.b, this.c, this.d, this.e, this.f);
            },
            equals: function (other) {
                if (!other) {
                    return false;
                }
                return this.a === other.a && this.b === other.b && this.c === other.c && this.d === other.d && this.e === other.e && this.f === other.f;
            },
            round: function (precision) {
                this.a = round(this.a, precision);
                this.b = round(this.b, precision);
                this.c = round(this.c, precision);
                this.d = round(this.d, precision);
                this.e = round(this.e, precision);
                this.f = round(this.f, precision);
                return this;
            },
            toArray: function (precision) {
                var result = [
                    this.a,
                    this.b,
                    this.c,
                    this.d,
                    this.e,
                    this.f
                ];
                if (defined(precision)) {
                    for (var i = 0; i < result.length; i++) {
                        result[i] = round(result[i], precision);
                    }
                }
                return result;
            },
            toString: function (precision, separator) {
                if (separator === void 0) {
                    separator = ',';
                }
                return this.toArray(precision).join(separator);
            }
        });
        Matrix.translate = function (x, y) {
            return new Matrix(1, 0, 0, 1, x, y);
        };
        Matrix.unit = function () {
            return new Matrix(1, 0, 0, 1, 0, 0);
        };
        Matrix.rotate = function (angle, x, y) {
            var matrix = new Matrix();
            matrix.a = Math.cos(rad(angle));
            matrix.b = Math.sin(rad(angle));
            matrix.c = -matrix.b;
            matrix.d = matrix.a;
            matrix.e = x - x * matrix.a + y * matrix.b || 0;
            matrix.f = y - y * matrix.a - x * matrix.b || 0;
            return matrix;
        };
        Matrix.scale = function (scaleX, scaleY) {
            return new Matrix(scaleX, 0, 0, scaleY, 0, 0);
        };
        Matrix.IDENTITY = Matrix.unit();
        function toMatrix(transformation) {
            if (transformation && typeof transformation.matrix === 'function') {
                return transformation.matrix();
            }
            return transformation;
        }
        var Point = Class.extend({
            init: function (x, y) {
                this.x = x || 0;
                this.y = y || 0;
            },
            equals: function (other) {
                return other && other.x === this.x && other.y === this.y;
            },
            clone: function () {
                return new Point(this.x, this.y);
            },
            rotate: function (angle, origin) {
                var originPoint = Point.create(origin) || Point.ZERO;
                return this.transform(Matrix.rotate(angle, originPoint.x, originPoint.y));
            },
            translate: function (x, y) {
                this.x += x;
                this.y += y;
                this.geometryChange();
                return this;
            },
            translateWith: function (point) {
                return this.translate(point.x, point.y);
            },
            move: function (x, y) {
                this.x = this.y = 0;
                return this.translate(x, y);
            },
            scale: function (scaleX, scaleY) {
                if (scaleY === void 0) {
                    scaleY = scaleX;
                }
                this.x *= scaleX;
                this.y *= scaleY;
                this.geometryChange();
                return this;
            },
            scaleCopy: function (scaleX, scaleY) {
                return this.clone().scale(scaleX, scaleY);
            },
            transform: function (transformation) {
                var matrix = toMatrix(transformation);
                var ref = this;
                var x = ref.x;
                var y = ref.y;
                this.x = matrix.a * x + matrix.c * y + matrix.e;
                this.y = matrix.b * x + matrix.d * y + matrix.f;
                this.geometryChange();
                return this;
            },
            transformCopy: function (transformation) {
                var point = this.clone();
                if (transformation) {
                    point.transform(transformation);
                }
                return point;
            },
            distanceTo: function (point) {
                var dx = this.x - point.x;
                var dy = this.y - point.y;
                return Math.sqrt(dx * dx + dy * dy);
            },
            round: function (digits) {
                this.x = round(this.x, digits);
                this.y = round(this.y, digits);
                this.geometryChange();
                return this;
            },
            toArray: function (digits) {
                var doRound = defined(digits);
                var x = doRound ? round(this.x, digits) : this.x;
                var y = doRound ? round(this.y, digits) : this.y;
                return [
                    x,
                    y
                ];
            },
            toString: function (digits, separator) {
                if (separator === void 0) {
                    separator = ' ';
                }
                var ref = this;
                var x = ref.x;
                var y = ref.y;
                if (defined(digits)) {
                    x = round(x, digits);
                    y = round(y, digits);
                }
                return x + separator + y;
            }
        });
        Point.create = function (arg0, arg1) {
            if (defined(arg0)) {
                if (arg0 instanceof Point) {
                    return arg0;
                } else if (arguments.length === 1 && arg0.length === 2) {
                    return new Point(arg0[0], arg0[1]);
                }
                return new Point(arg0, arg1);
            }
        };
        Point.min = function () {
            var arguments$1 = arguments;
            var minX = MAX_NUM;
            var minY = MAX_NUM;
            for (var i = 0; i < arguments.length; i++) {
                var point = arguments$1[i];
                minX = Math.min(point.x, minX);
                minY = Math.min(point.y, minY);
            }
            return new Point(minX, minY);
        };
        Point.max = function () {
            var arguments$1 = arguments;
            var maxX = MIN_NUM;
            var maxY = MIN_NUM;
            for (var i = 0; i < arguments.length; i++) {
                var point = arguments$1[i];
                maxX = Math.max(point.x, maxX);
                maxY = Math.max(point.y, maxY);
            }
            return new Point(maxX, maxY);
        };
        Point.minPoint = function () {
            return new Point(MIN_NUM, MIN_NUM);
        };
        Point.maxPoint = function () {
            return new Point(MAX_NUM, MAX_NUM);
        };
        if (Object.defineProperties) {
            Object.defineProperties(Point, {
                ZERO: {
                    get: function () {
                        return new Point(0, 0);
                    }
                }
            });
        }
        defineAccessors(Point.prototype, [
            'x',
            'y'
        ]);
        ObserversMixin.extend(Point.prototype);
        var Size = Class.extend({
            init: function (width, height) {
                this.width = width || 0;
                this.height = height || 0;
            },
            equals: function (other) {
                return other && other.width === this.width && other.height === this.height;
            },
            clone: function () {
                return new Size(this.width, this.height);
            },
            toArray: function (digits) {
                var doRound = defined(digits);
                var width = doRound ? round(this.width, digits) : this.width;
                var height = doRound ? round(this.height, digits) : this.height;
                return [
                    width,
                    height
                ];
            }
        });
        Size.create = function (arg0, arg1) {
            if (defined(arg0)) {
                if (arg0 instanceof Size) {
                    return arg0;
                } else if (arguments.length === 1 && arg0.length === 2) {
                    return new Size(arg0[0], arg0[1]);
                }
                return new Size(arg0, arg1);
            }
        };
        if (Object.defineProperties) {
            Object.defineProperties(Size, {
                ZERO: {
                    get: function () {
                        return new Size(0, 0);
                    }
                }
            });
        }
        defineAccessors(Size.prototype, [
            'width',
            'height'
        ]);
        ObserversMixin.extend(Size.prototype);
        var Rect = Class.extend({
            init: function (origin, size) {
                if (origin === void 0) {
                    origin = new Point();
                }
                if (size === void 0) {
                    size = new Size();
                }
                this.setOrigin(origin);
                this.setSize(size);
            },
            clone: function () {
                return new Rect(this.origin.clone(), this.size.clone());
            },
            equals: function (other) {
                return other && other.origin.equals(this.origin) && other.size.equals(this.size);
            },
            setOrigin: function (value) {
                this._observerField('origin', Point.create(value));
                this.geometryChange();
                return this;
            },
            getOrigin: function () {
                return this.origin;
            },
            setSize: function (value) {
                this._observerField('size', Size.create(value));
                this.geometryChange();
                return this;
            },
            getSize: function () {
                return this.size;
            },
            width: function () {
                return this.size.width;
            },
            height: function () {
                return this.size.height;
            },
            topLeft: function () {
                return this.origin.clone();
            },
            bottomRight: function () {
                return this.origin.clone().translate(this.width(), this.height());
            },
            topRight: function () {
                return this.origin.clone().translate(this.width(), 0);
            },
            bottomLeft: function () {
                return this.origin.clone().translate(0, this.height());
            },
            center: function () {
                return this.origin.clone().translate(this.width() / 2, this.height() / 2);
            },
            bbox: function (matrix) {
                var tl = this.topLeft().transformCopy(matrix);
                var tr = this.topRight().transformCopy(matrix);
                var br = this.bottomRight().transformCopy(matrix);
                var bl = this.bottomLeft().transformCopy(matrix);
                return Rect.fromPoints(tl, tr, br, bl);
            },
            transformCopy: function (m) {
                return Rect.fromPoints(this.topLeft().transform(m), this.bottomRight().transform(m));
            },
            expand: function (x, y) {
                if (y === void 0) {
                    y = x;
                }
                this.size.width += 2 * x;
                this.size.height += 2 * y;
                this.origin.translate(-x, -y);
                return this;
            },
            expandCopy: function (x, y) {
                return this.clone().expand(x, y);
            },
            containsPoint: function (point) {
                var origin = this.origin;
                var bottomRight = this.bottomRight();
                return !(point.x < origin.x || point.y < origin.y || bottomRight.x < point.x || bottomRight.y < point.y);
            },
            _isOnPath: function (point, width) {
                var rectOuter = this.expandCopy(width, width);
                var rectInner = this.expandCopy(-width, -width);
                return rectOuter.containsPoint(point) && !rectInner.containsPoint(point);
            }
        });
        Rect.fromPoints = function () {
            var topLeft = Point.min.apply(null, arguments);
            var bottomRight = Point.max.apply(null, arguments);
            var size = new Size(bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
            return new Rect(topLeft, size);
        };
        Rect.union = function (a, b) {
            return Rect.fromPoints(Point.min(a.topLeft(), b.topLeft()), Point.max(a.bottomRight(), b.bottomRight()));
        };
        Rect.intersect = function (a, b) {
            var rect1 = {
                left: a.topLeft().x,
                top: a.topLeft().y,
                right: a.bottomRight().x,
                bottom: a.bottomRight().y
            };
            var rect2 = {
                left: b.topLeft().x,
                top: b.topLeft().y,
                right: b.bottomRight().x,
                bottom: b.bottomRight().y
            };
            if (rect1.left <= rect2.right && rect2.left <= rect1.right && rect1.top <= rect2.bottom && rect2.top <= rect1.bottom) {
                return Rect.fromPoints(new Point(Math.max(rect1.left, rect2.left), Math.max(rect1.top, rect2.top)), new Point(Math.min(rect1.right, rect2.right), Math.min(rect1.bottom, rect2.bottom)));
            }
        };
        ObserversMixin.extend(Rect.prototype);
        var Transformation = Class.extend({
            init: function (matrix) {
                if (matrix === void 0) {
                    matrix = Matrix.unit();
                }
                this._matrix = matrix;
            },
            clone: function () {
                return new Transformation(this._matrix.clone());
            },
            equals: function (other) {
                return other && other._matrix.equals(this._matrix);
            },
            translate: function (x, y) {
                this._matrix = this._matrix.multiplyCopy(Matrix.translate(x, y));
                this._optionsChange();
                return this;
            },
            scale: function (scaleX, scaleY, origin) {
                if (scaleY === void 0) {
                    scaleY = scaleX;
                }
                if (origin === void 0) {
                    origin = null;
                }
                var originPoint = origin;
                if (originPoint) {
                    originPoint = Point.create(originPoint);
                    this._matrix = this._matrix.multiplyCopy(Matrix.translate(originPoint.x, originPoint.y));
                }
                this._matrix = this._matrix.multiplyCopy(Matrix.scale(scaleX, scaleY));
                if (originPoint) {
                    this._matrix = this._matrix.multiplyCopy(Matrix.translate(-originPoint.x, -originPoint.y));
                }
                this._optionsChange();
                return this;
            },
            rotate: function (angle, origin) {
                var originPoint = Point.create(origin) || Point.ZERO;
                this._matrix = this._matrix.multiplyCopy(Matrix.rotate(angle, originPoint.x, originPoint.y));
                this._optionsChange();
                return this;
            },
            multiply: function (transformation) {
                var matrix = toMatrix(transformation);
                this._matrix = this._matrix.multiplyCopy(matrix);
                this._optionsChange();
                return this;
            },
            matrix: function (value) {
                if (value) {
                    this._matrix = value;
                    this._optionsChange();
                    return this;
                }
                return this._matrix;
            },
            _optionsChange: function () {
                this.optionsChange({
                    field: 'transform',
                    value: this
                });
            }
        });
        ObserversMixin.extend(Transformation.prototype);
        function transform(matrix) {
            if (matrix === null) {
                return null;
            }
            if (matrix instanceof Transformation) {
                return matrix;
            }
            return new Transformation(matrix);
        }
        var Element$1 = Class.extend({
            init: function (options) {
                this._initOptions(options);
            },
            _initOptions: function (options) {
                if (options === void 0) {
                    options = {};
                }
                var clip = options.clip;
                var transform$$1 = options.transform;
                if (transform$$1) {
                    options.transform = transform(transform$$1);
                }
                if (clip && !clip.id) {
                    clip.id = definitionId();
                }
                this.options = new OptionsStore(options);
                this.options.addObserver(this);
            },
            transform: function (value) {
                if (defined(value)) {
                    this.options.set('transform', transform(value));
                } else {
                    return this.options.get('transform');
                }
            },
            parentTransform: function () {
                var element = this;
                var parentMatrix;
                while (element.parent) {
                    element = element.parent;
                    var transformation = element.transform();
                    if (transformation) {
                        parentMatrix = transformation.matrix().multiplyCopy(parentMatrix || Matrix.unit());
                    }
                }
                if (parentMatrix) {
                    return transform(parentMatrix);
                }
            },
            currentTransform: function (parentTransform) {
                if (parentTransform === void 0) {
                    parentTransform = this.parentTransform();
                }
                var elementTransform = this.transform();
                var elementMatrix = toMatrix(elementTransform);
                var parentMatrix = toMatrix(parentTransform);
                var combinedMatrix;
                if (elementMatrix && parentMatrix) {
                    combinedMatrix = parentMatrix.multiplyCopy(elementMatrix);
                } else {
                    combinedMatrix = elementMatrix || parentMatrix;
                }
                if (combinedMatrix) {
                    return transform(combinedMatrix);
                }
            },
            visible: function (value) {
                if (defined(value)) {
                    this.options.set('visible', value);
                    return this;
                }
                return this.options.get('visible') !== false;
            },
            clip: function (value) {
                var options = this.options;
                if (defined(value)) {
                    if (value && !value.id) {
                        value.id = definitionId();
                    }
                    options.set('clip', value);
                    return this;
                }
                return options.get('clip');
            },
            opacity: function (value) {
                if (defined(value)) {
                    this.options.set('opacity', value);
                    return this;
                }
                return valueOrDefault(this.options.get('opacity'), 1);
            },
            clippedBBox: function (transformation) {
                var bbox = this._clippedBBox(transformation);
                if (bbox) {
                    var clip = this.clip();
                    return clip ? Rect.intersect(bbox, clip.bbox(transformation)) : bbox;
                }
            },
            containsPoint: function (point, parentTransform) {
                if (this.visible()) {
                    var transform$$1 = this.currentTransform(parentTransform);
                    var transformedPoint = point;
                    if (transform$$1) {
                        transformedPoint = point.transformCopy(transform$$1.matrix().invert());
                    }
                    return this._hasFill() && this._containsPoint(transformedPoint) || this._isOnPath && this._hasStroke() && this._isOnPath(transformedPoint);
                }
                return false;
            },
            _hasFill: function () {
                var fill = this.options.fill;
                return fill && !isTransparent(fill.color);
            },
            _hasStroke: function () {
                var stroke = this.options.stroke;
                return stroke && stroke.width > 0 && !isTransparent(stroke.color);
            },
            _clippedBBox: function (transformation) {
                return this.bbox(transformation);
            }
        });
        Element$1.prototype.nodeType = 'Element';
        ObserversMixin.extend(Element$1.prototype);
        function ellipseExtremeAngles(center, rx, ry, matrix) {
            var extremeX = 0;
            var extremeY = 0;
            if (matrix) {
                extremeX = Math.atan2(matrix.c * ry, matrix.a * rx);
                if (matrix.b !== 0) {
                    extremeY = Math.atan2(matrix.d * ry, matrix.b * rx);
                }
            }
            return {
                x: extremeX,
                y: extremeY
            };
        }
        var PI_DIV_2 = Math.PI / 2;
        var Circle$2 = Class.extend({
            init: function (center, radius) {
                if (center === void 0) {
                    center = new Point();
                }
                if (radius === void 0) {
                    radius = 0;
                }
                this.setCenter(center);
                this.setRadius(radius);
            },
            setCenter: function (value) {
                this._observerField('center', Point.create(value));
                this.geometryChange();
                return this;
            },
            getCenter: function () {
                return this.center;
            },
            equals: function (other) {
                return other && other.center.equals(this.center) && other.radius === this.radius;
            },
            clone: function () {
                return new Circle$2(this.center.clone(), this.radius);
            },
            pointAt: function (angle) {
                return this._pointAt(rad(angle));
            },
            bbox: function (matrix) {
                var this$1 = this;
                var extremeAngles = ellipseExtremeAngles(this.center, this.radius, this.radius, matrix);
                var minPoint = Point.maxPoint();
                var maxPoint = Point.minPoint();
                for (var i = 0; i < 4; i++) {
                    var currentPointX = this$1._pointAt(extremeAngles.x + i * PI_DIV_2).transformCopy(matrix);
                    var currentPointY = this$1._pointAt(extremeAngles.y + i * PI_DIV_2).transformCopy(matrix);
                    var currentPoint = new Point(currentPointX.x, currentPointY.y);
                    minPoint = Point.min(minPoint, currentPoint);
                    maxPoint = Point.max(maxPoint, currentPoint);
                }
                return Rect.fromPoints(minPoint, maxPoint);
            },
            _pointAt: function (angle) {
                var ref = this;
                var center = ref.center;
                var radius = ref.radius;
                return new Point(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle));
            },
            containsPoint: function (point) {
                var ref = this;
                var center = ref.center;
                var radius = ref.radius;
                var inCircle = Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2) <= Math.pow(radius, 2);
                return inCircle;
            },
            _isOnPath: function (point, width) {
                var ref = this;
                var center = ref.center;
                var radius = ref.radius;
                var pointDistance = center.distanceTo(point);
                return radius - width <= pointDistance && pointDistance <= radius + width;
            }
        });
        defineAccessors(Circle$2.prototype, ['radius']);
        ObserversMixin.extend(Circle$2.prototype);
        var GRADIENT = 'Gradient';
        var Paintable = {
            extend: function (proto) {
                proto.fill = this.fill;
                proto.stroke = this.stroke;
            },
            fill: function (color, opacity) {
                var options = this.options;
                if (defined(color)) {
                    if (color && color.nodeType !== GRADIENT) {
                        var newFill = { color: color };
                        if (defined(opacity)) {
                            newFill.opacity = opacity;
                        }
                        options.set('fill', newFill);
                    } else {
                        options.set('fill', color);
                    }
                    return this;
                }
                return options.get('fill');
            },
            stroke: function (color, width, opacity) {
                if (defined(color)) {
                    this.options.set('stroke.color', color);
                    if (defined(width)) {
                        this.options.set('stroke.width', width);
                    }
                    if (defined(opacity)) {
                        this.options.set('stroke.opacity', opacity);
                    }
                    return this;
                }
                return this.options.get('stroke');
            }
        };
        var IDENTITY_MATRIX_HASH = Matrix.IDENTITY.toString();
        var Measurable = {
            extend: function (proto) {
                proto.bbox = this.bbox;
                proto.geometryChange = this.geometryChange;
            },
            bbox: function (transformation) {
                var combinedMatrix = toMatrix(this.currentTransform(transformation));
                var matrixHash = combinedMatrix ? combinedMatrix.toString() : IDENTITY_MATRIX_HASH;
                var bbox;
                if (this._bboxCache && this._matrixHash === matrixHash) {
                    bbox = this._bboxCache.clone();
                } else {
                    bbox = this._bbox(combinedMatrix);
                    this._bboxCache = bbox ? bbox.clone() : null;
                    this._matrixHash = matrixHash;
                }
                var strokeWidth = this.options.get('stroke.width');
                if (strokeWidth && bbox) {
                    bbox.expand(strokeWidth / 2);
                }
                return bbox;
            },
            geometryChange: function () {
                delete this._bboxCache;
                this.trigger('geometryChange', { element: this });
            }
        };
        function geometryAccessor(name) {
            var fieldName = '_' + name;
            return function (value) {
                if (defined(value)) {
                    this._observerField(fieldName, value);
                    this.geometryChange();
                    return this;
                }
                return this[fieldName];
            };
        }
        function defineGeometryAccessors(fn, names) {
            for (var i = 0; i < names.length; i++) {
                fn[names[i]] = geometryAccessor(names[i]);
            }
        }
        var DEFAULT_STROKE = '#000';
        var Circle = Element$1.extend({
            init: function (geometry, options) {
                if (geometry === void 0) {
                    geometry = new Circle$2();
                }
                if (options === void 0) {
                    options = {};
                }
                Element$1.fn.init.call(this, options);
                this.geometry(geometry);
                if (!defined(this.options.stroke)) {
                    this.stroke(DEFAULT_STROKE);
                }
            },
            rawBBox: function () {
                return this._geometry.bbox();
            },
            _bbox: function (matrix) {
                return this._geometry.bbox(matrix);
            },
            _containsPoint: function (point) {
                return this.geometry().containsPoint(point);
            },
            _isOnPath: function (point) {
                return this.geometry()._isOnPath(point, this.options.stroke.width / 2);
            }
        });
        Circle.prototype.nodeType = 'Circle';
        Paintable.extend(Circle.prototype);
        Measurable.extend(Circle.prototype);
        defineGeometryAccessors(Circle.prototype, ['geometry']);
        var PRECISION = 10;
        function close(a, b, tolerance) {
            if (tolerance === void 0) {
                tolerance = PRECISION;
            }
            return round(Math.abs(a - b), tolerance) === 0;
        }
        function closeOrLess(a, b, tolerance) {
            return a < b || close(a, b, tolerance);
        }
        function lineIntersection(p0, p1, p2, p3) {
            var s1x = p1.x - p0.x;
            var s2x = p3.x - p2.x;
            var s1y = p1.y - p0.y;
            var s2y = p3.y - p2.y;
            var nx = p0.x - p2.x;
            var ny = p0.y - p2.y;
            var d = s1x * s2y - s2x * s1y;
            var s = (s1x * ny - s1y * nx) / d;
            var t = (s2x * ny - s2y * nx) / d;
            if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
                return new Point(p0.x + t * s1x, p0.y + t * s1y);
            }
        }
        var MAX_INTERVAL = 45;
        var pow$1 = Math.pow;
        var Arc$2 = Class.extend({
            init: function (center, options) {
                if (center === void 0) {
                    center = new Point();
                }
                if (options === void 0) {
                    options = {};
                }
                this.setCenter(center);
                this.radiusX = options.radiusX;
                this.radiusY = options.radiusY || options.radiusX;
                this.startAngle = options.startAngle;
                this.endAngle = options.endAngle;
                this.anticlockwise = options.anticlockwise || false;
                this.xRotation = options.xRotation;
            },
            clone: function () {
                return new Arc$2(this.center, {
                    radiusX: this.radiusX,
                    radiusY: this.radiusY,
                    startAngle: this.startAngle,
                    endAngle: this.endAngle,
                    anticlockwise: this.anticlockwise
                });
            },
            setCenter: function (value) {
                this._observerField('center', Point.create(value));
                this.geometryChange();
                return this;
            },
            getCenter: function () {
                return this.center;
            },
            pointAt: function (angle) {
                var center = this.center;
                var radian = rad(angle);
                return new Point(center.x + this.radiusX * Math.cos(radian), center.y + this.radiusY * Math.sin(radian));
            },
            curvePoints: function () {
                var this$1 = this;
                var startAngle = this.startAngle;
                var dir = this.anticlockwise ? -1 : 1;
                var curvePoints = [this.pointAt(startAngle)];
                var interval = this._arcInterval();
                var intervalAngle = interval.endAngle - interval.startAngle;
                var subIntervalsCount = Math.ceil(intervalAngle / MAX_INTERVAL);
                var subIntervalAngle = intervalAngle / subIntervalsCount;
                var currentAngle = startAngle;
                var transformation;
                if (this.xRotation) {
                    transformation = transform().rotate(this.xRotation, this.center);
                }
                for (var i = 1; i <= subIntervalsCount; i++) {
                    var nextAngle = currentAngle + dir * subIntervalAngle;
                    var points = this$1._intervalCurvePoints(currentAngle, nextAngle, transformation);
                    curvePoints.push(points.cp1, points.cp2, points.p2);
                    currentAngle = nextAngle;
                }
                return curvePoints;
            },
            bbox: function (matrix) {
                var this$1 = this;
                var interval = this._arcInterval();
                var startAngle = interval.startAngle;
                var endAngle = interval.endAngle;
                var extremeAngles = ellipseExtremeAngles(this.center, this.radiusX, this.radiusY, matrix);
                var extremeX = deg(extremeAngles.x);
                var extremeY = deg(extremeAngles.y);
                var endPoint = this.pointAt(endAngle).transformCopy(matrix);
                var currentAngleX = bboxStartAngle(extremeX, startAngle);
                var currentAngleY = bboxStartAngle(extremeY, startAngle);
                var currentPoint = this.pointAt(startAngle).transformCopy(matrix);
                var minPoint = Point.min(currentPoint, endPoint);
                var maxPoint = Point.max(currentPoint, endPoint);
                while (currentAngleX < endAngle || currentAngleY < endAngle) {
                    var currentPointX = void 0;
                    if (currentAngleX < endAngle) {
                        currentPointX = this$1.pointAt(currentAngleX).transformCopy(matrix);
                        currentAngleX += 90;
                    }
                    var currentPointY = void 0;
                    if (currentAngleY < endAngle) {
                        currentPointY = this$1.pointAt(currentAngleY).transformCopy(matrix);
                        currentAngleY += 90;
                    }
                    currentPoint = new Point(currentPointX.x, currentPointY.y);
                    minPoint = Point.min(minPoint, currentPoint);
                    maxPoint = Point.max(maxPoint, currentPoint);
                }
                return Rect.fromPoints(minPoint, maxPoint);
            },
            _arcInterval: function () {
                var ref = this;
                var startAngle = ref.startAngle;
                var endAngle = ref.endAngle;
                var anticlockwise = ref.anticlockwise;
                if (anticlockwise) {
                    var oldStart = startAngle;
                    startAngle = endAngle;
                    endAngle = oldStart;
                }
                if (startAngle > endAngle || anticlockwise && startAngle === endAngle) {
                    endAngle += 360;
                }
                return {
                    startAngle: startAngle,
                    endAngle: endAngle
                };
            },
            _intervalCurvePoints: function (startAngle, endAngle, transformation) {
                var p1 = this.pointAt(startAngle);
                var p2 = this.pointAt(endAngle);
                var p1Derivative = this._derivativeAt(startAngle);
                var p2Derivative = this._derivativeAt(endAngle);
                var t = (rad(endAngle) - rad(startAngle)) / 3;
                var cp1 = new Point(p1.x + t * p1Derivative.x, p1.y + t * p1Derivative.y);
                var cp2 = new Point(p2.x - t * p2Derivative.x, p2.y - t * p2Derivative.y);
                if (transformation) {
                    p1.transform(transformation);
                    p2.transform(transformation);
                    cp1.transform(transformation);
                    cp2.transform(transformation);
                }
                return {
                    p1: p1,
                    cp1: cp1,
                    cp2: cp2,
                    p2: p2
                };
            },
            _derivativeAt: function (angle) {
                var radian = rad(angle);
                return new Point(-this.radiusX * Math.sin(radian), this.radiusY * Math.cos(radian));
            },
            containsPoint: function (point) {
                var interval = this._arcInterval();
                var intervalAngle = interval.endAngle - interval.startAngle;
                var ref = this;
                var center = ref.center;
                var radiusX = ref.radiusX;
                var radiusY = ref.radiusY;
                var distance = center.distanceTo(point);
                var angleRad = Math.atan2(point.y - center.y, point.x - center.x);
                var pointRadius = radiusX * radiusY / Math.sqrt(pow$1(radiusX, 2) * pow$1(Math.sin(angleRad), 2) + pow$1(radiusY, 2) * pow$1(Math.cos(angleRad), 2));
                var startPoint = this.pointAt(this.startAngle).round(PRECISION);
                var endPoint = this.pointAt(this.endAngle).round(PRECISION);
                var intersection = lineIntersection(center, point.round(PRECISION), startPoint, endPoint);
                var containsPoint;
                if (intervalAngle < 180) {
                    containsPoint = intersection && closeOrLess(center.distanceTo(intersection), distance) && closeOrLess(distance, pointRadius);
                } else {
                    var angle = calculateAngle(center.x, center.y, radiusX, radiusY, point.x, point.y);
                    if (angle !== 360) {
                        angle = (360 + angle) % 360;
                    }
                    var inAngleRange = interval.startAngle <= angle && angle <= interval.endAngle;
                    containsPoint = inAngleRange && closeOrLess(distance, pointRadius) || !inAngleRange && (!intersection || intersection.equals(point));
                }
                return containsPoint;
            },
            _isOnPath: function (point, width) {
                var interval = this._arcInterval();
                var center = this.center;
                var angle = calculateAngle(center.x, center.y, this.radiusX, this.radiusY, point.x, point.y);
                if (angle !== 360) {
                    angle = (360 + angle) % 360;
                }
                var inAngleRange = interval.startAngle <= angle && angle <= interval.endAngle;
                return inAngleRange && this.pointAt(angle).distanceTo(point) <= width;
            }
        });
        Arc$2.fromPoints = function (start, end, rx, ry, largeArc, swipe, rotation) {
            var arcParameters = normalizeArcParameters({
                x1: start.x,
                y1: start.y,
                x2: end.x,
                y2: end.y,
                rx: rx,
                ry: ry,
                largeArc: largeArc,
                swipe: swipe,
                rotation: rotation
            });
            return new Arc$2(arcParameters.center, {
                startAngle: arcParameters.startAngle,
                endAngle: arcParameters.endAngle,
                radiusX: arcParameters.radiusX,
                radiusY: arcParameters.radiusY,
                xRotation: arcParameters.xRotation,
                anticlockwise: swipe === 0
            });
        };
        defineAccessors(Arc$2.prototype, [
            'radiusX',
            'radiusY',
            'startAngle',
            'endAngle',
            'anticlockwise'
        ]);
        ObserversMixin.extend(Arc$2.prototype);
        function calculateAngle(cx, cy, rx, ry, x, y) {
            var cos = round((x - cx) / rx, 3);
            var sin = round((y - cy) / ry, 3);
            return round(deg(Math.atan2(sin, cos)));
        }
        function normalizeArcParameters(parameters) {
            var x1 = parameters.x1;
            var y1 = parameters.y1;
            var x2 = parameters.x2;
            var y2 = parameters.y2;
            var rx = parameters.rx;
            var ry = parameters.ry;
            var largeArc = parameters.largeArc;
            var swipe = parameters.swipe;
            var rotation = parameters.rotation;
            if (rotation === void 0) {
                rotation = 0;
            }
            var radians = rad(rotation);
            var cosine = Math.cos(radians);
            var sine = Math.sin(radians);
            var xT = cosine * (x1 - x2) / 2 + sine * (y1 - y2) / 2;
            var yT = -sine * (x1 - x2) / 2 + cosine * (y1 - y2) / 2;
            var sign = largeArc !== swipe ? 1 : -1;
            var xt2 = Math.pow(xT, 2);
            var yt2 = Math.pow(yT, 2);
            var rx2 = Math.pow(rx, 2);
            var ry2 = Math.pow(ry, 2);
            var delta = xt2 / rx2 + yt2 / ry2;
            if (delta > 1) {
                delta = Math.sqrt(xt2 / rx2 + yt2 / ry2);
                rx = delta * rx;
                rx2 = Math.pow(rx, 2);
                ry = delta * ry;
                ry2 = Math.pow(ry, 2);
            }
            var constT = sign * Math.sqrt((rx2 * ry2 - rx2 * yt2 - ry2 * xt2) / (rx2 * yt2 + ry2 * xt2));
            if (isNaN(constT)) {
                constT = 0;
            }
            var cxT = constT * (rx * yT) / ry;
            var cyT = -constT * (ry * xT) / rx;
            var cx = cosine * cxT - sine * cyT + (x1 + x2) / 2;
            var cy = sine * cxT + cosine * cyT + (y1 + y2) / 2;
            var uX = (xT - cxT) / rx;
            var uY = (yT - cyT) / ry;
            var vX = -(xT + cxT) / rx;
            var vY = -(yT + cyT) / ry;
            var startAngle = (uY >= 0 ? 1 : -1) * deg(Math.acos(uX / Math.sqrt(uX * uX + uY * uY)));
            var angleCosine = round((uX * vX + uY * vY) / (Math.sqrt(uX * uX + uY * uY) * Math.sqrt(vX * vX + vY * vY)), 10);
            var angle = (uX * vY - uY * vX >= 0 ? 1 : -1) * deg(Math.acos(angleCosine));
            if (!swipe && angle > 0) {
                angle -= 360;
            }
            if (swipe && angle < 0) {
                angle += 360;
            }
            var endAngle = startAngle + angle;
            var signEndAngle = endAngle >= 0 ? 1 : -1;
            endAngle = Math.abs(endAngle) % 360 * signEndAngle;
            return {
                center: new Point(cx, cy),
                startAngle: startAngle,
                endAngle: endAngle,
                radiusX: rx,
                radiusY: ry,
                xRotation: rotation
            };
        }
        function bboxStartAngle(angle, start) {
            var startAngle = angle;
            while (startAngle < start) {
                startAngle += 90;
            }
            return startAngle;
        }
        var push = [].push;
        var pop = [].pop;
        var splice = [].splice;
        var shift = [].shift;
        var slice = [].slice;
        var unshift = [].unshift;
        var ElementsArray = Class.extend({
            init: function (array) {
                if (array === void 0) {
                    array = [];
                }
                this.length = 0;
                this._splice(0, array.length, array);
            },
            elements: function (value) {
                if (value) {
                    this._splice(0, this.length, value);
                    this._change();
                    return this;
                }
                return this.slice(0);
            },
            push: function () {
                var elements = arguments;
                var result = push.apply(this, elements);
                this._add(elements);
                return result;
            },
            slice: function () {
                return slice.call(this);
            },
            pop: function () {
                var length = this.length;
                var result = pop.apply(this);
                if (length) {
                    this._remove([result]);
                }
                return result;
            },
            splice: function (index, howMany) {
                var elements = slice.call(arguments, 2);
                var result = this._splice(index, howMany, elements);
                this._change();
                return result;
            },
            shift: function () {
                var length = this.length;
                var result = shift.apply(this);
                if (length) {
                    this._remove([result]);
                }
                return result;
            },
            unshift: function () {
                var elements = arguments;
                var result = unshift.apply(this, elements);
                this._add(elements);
                return result;
            },
            indexOf: function (element) {
                var this$1 = this;
                var length = this.length;
                for (var idx = 0; idx < length; idx++) {
                    if (this$1[idx] === element) {
                        return idx;
                    }
                }
                return -1;
            },
            _splice: function (index, howMany, elements) {
                var result = splice.apply(this, [
                    index,
                    howMany
                ].concat(elements));
                this._clearObserver(result);
                this._setObserver(elements);
                return result;
            },
            _add: function (elements) {
                this._setObserver(elements);
                this._change();
            },
            _remove: function (elements) {
                this._clearObserver(elements);
                this._change();
            },
            _setObserver: function (elements) {
                var this$1 = this;
                for (var idx = 0; idx < elements.length; idx++) {
                    elements[idx].addObserver(this$1);
                }
            },
            _clearObserver: function (elements) {
                var this$1 = this;
                for (var idx = 0; idx < elements.length; idx++) {
                    elements[idx].removeObserver(this$1);
                }
            },
            _change: function () {
            }
        });
        ObserversMixin.extend(ElementsArray.prototype);
        var GeometryElementsArray = ElementsArray.extend({
            _change: function () {
                this.geometryChange();
            }
        });
        function pointAccessor(name) {
            var fieldName = '_' + name;
            return function (value) {
                if (defined(value)) {
                    this._observerField(fieldName, Point.create(value));
                    this.geometryChange();
                    return this;
                }
                return this[fieldName];
            };
        }
        function definePointAccessors(fn, names) {
            for (var i = 0; i < names.length; i++) {
                fn[names[i]] = pointAccessor(names[i]);
            }
        }
        function isOutOfEndPoint(endPoint, controlPoint, point) {
            var angle = deg(Math.atan2(controlPoint.y - endPoint.y, controlPoint.x - endPoint.x));
            var rotatedPoint = point.transformCopy(transform().rotate(-angle, endPoint));
            return rotatedPoint.x < endPoint.x;
        }
        function calculateCurveAt(t, field, points) {
            var t1 = 1 - t;
            return Math.pow(t1, 3) * points[0][field] + 3 * Math.pow(t1, 2) * t * points[1][field] + 3 * Math.pow(t, 2) * t1 * points[2][field] + Math.pow(t, 3) * points[3][field];
        }
        function toCubicPolynomial(points, field) {
            return [
                -points[0][field] + 3 * points[1][field] - 3 * points[2][field] + points[3][field],
                3 * (points[0][field] - 2 * points[1][field] + points[2][field]),
                3 * (-points[0][field] + points[1][field]),
                points[0][field]
            ];
        }
        var ComplexNumber = Class.extend({
            init: function (real, img) {
                if (real === void 0) {
                    real = 0;
                }
                if (img === void 0) {
                    img = 0;
                }
                this.real = real;
                this.img = img;
            },
            add: function (cNumber) {
                return new ComplexNumber(round(this.real + cNumber.real, PRECISION), round(this.img + cNumber.img, PRECISION));
            },
            addConstant: function (value) {
                return new ComplexNumber(this.real + value, this.img);
            },
            negate: function () {
                return new ComplexNumber(-this.real, -this.img);
            },
            multiply: function (cNumber) {
                return new ComplexNumber(this.real * cNumber.real - this.img * cNumber.img, this.real * cNumber.img + this.img * cNumber.real);
            },
            multiplyConstant: function (value) {
                return new ComplexNumber(this.real * value, this.img * value);
            },
            nthRoot: function (n) {
                var rad$$1 = Math.atan2(this.img, this.real);
                var r = Math.sqrt(Math.pow(this.img, 2) + Math.pow(this.real, 2));
                var nthR = Math.pow(r, 1 / n);
                return new ComplexNumber(nthR * Math.cos(rad$$1 / n), nthR * Math.sin(rad$$1 / n));
            },
            equals: function (cNumber) {
                return this.real === cNumber.real && this.img === cNumber.img;
            },
            isReal: function () {
                return this.img === 0;
            }
        });
        function numberSign(x) {
            return x < 0 ? -1 : 1;
        }
        function solveQuadraticEquation(a, b, c) {
            var squareRoot = Math.sqrt(Math.pow(b, 2) - 4 * a * c);
            return [
                (-b + squareRoot) / (2 * a),
                (-b - squareRoot) / (2 * a)
            ];
        }
        function solveCubicEquation(a, b, c, d) {
            if (a === 0) {
                return solveQuadraticEquation(b, c, d);
            }
            var p = (3 * a * c - Math.pow(b, 2)) / (3 * Math.pow(a, 2));
            var q = (2 * Math.pow(b, 3) - 9 * a * b * c + 27 * Math.pow(a, 2) * d) / (27 * Math.pow(a, 3));
            var Q = Math.pow(p / 3, 3) + Math.pow(q / 2, 2);
            var i = new ComplexNumber(0, 1);
            var b3a = -b / (3 * a);
            var x1, x2, y1, y2, y3, z1, z2;
            if (Q < 0) {
                x1 = new ComplexNumber(-q / 2, Math.sqrt(-Q)).nthRoot(3);
                x2 = new ComplexNumber(-q / 2, -Math.sqrt(-Q)).nthRoot(3);
            } else {
                x1 = -q / 2 + Math.sqrt(Q);
                x1 = new ComplexNumber(numberSign(x1) * Math.pow(Math.abs(x1), 1 / 3));
                x2 = -q / 2 - Math.sqrt(Q);
                x2 = new ComplexNumber(numberSign(x2) * Math.pow(Math.abs(x2), 1 / 3));
            }
            y1 = x1.add(x2);
            z1 = x1.add(x2).multiplyConstant(-1 / 2);
            z2 = x1.add(x2.negate()).multiplyConstant(Math.sqrt(3) / 2);
            y2 = z1.add(i.multiply(z2));
            y3 = z1.add(i.negate().multiply(z2));
            var result = [];
            if (y1.isReal()) {
                result.push(round(y1.real + b3a, PRECISION));
            }
            if (y2.isReal()) {
                result.push(round(y2.real + b3a, PRECISION));
            }
            if (y3.isReal()) {
                result.push(round(y3.real + b3a, PRECISION));
            }
            return result;
        }
        function hasRootsInRange(points, point, field, rootField, range) {
            var polynomial = toCubicPolynomial(points, rootField);
            var roots = solveCubicEquation(polynomial[0], polynomial[1], polynomial[2], polynomial[3] - point[rootField]);
            var intersection;
            for (var idx = 0; idx < roots.length; idx++) {
                if (0 <= roots[idx] && roots[idx] <= 1) {
                    intersection = calculateCurveAt(roots[idx], field, points);
                    if (Math.abs(intersection - point[field]) <= range) {
                        return true;
                    }
                }
            }
        }
        function curveIntersectionsCount(points, point, bbox) {
            var polynomial = toCubicPolynomial(points, 'x');
            var roots = solveCubicEquation(polynomial[0], polynomial[1], polynomial[2], polynomial[3] - point.x);
            var rayIntersection, intersectsRay;
            var count = 0;
            for (var i = 0; i < roots.length; i++) {
                rayIntersection = calculateCurveAt(roots[i], 'y', points);
                intersectsRay = close(rayIntersection, point.y) || rayIntersection > point.y;
                if (intersectsRay && ((roots[i] === 0 || roots[i] === 1) && bbox.bottomRight().x > point.x || 0 < roots[i] && roots[i] < 1)) {
                    count++;
                }
            }
            return count;
        }
        function lineIntersectionsCount(a, b, point) {
            var intersects;
            if (a.x !== b.x) {
                var minX = Math.min(a.x, b.x);
                var maxX = Math.max(a.x, b.x);
                var minY = Math.min(a.y, b.y);
                var maxY = Math.max(a.y, b.y);
                var inRange = minX <= point.x && point.x < maxX;
                if (minY === maxY) {
                    intersects = point.y <= minY && inRange;
                } else {
                    intersects = inRange && (maxY - minY) * ((a.x - b.x) * (a.y - b.y) > 0 ? point.x - minX : maxX - point.x) / (maxX - minX) + minY - point.y >= 0;
                }
            }
            return intersects ? 1 : 0;
        }
        var Segment = Class.extend({
            init: function (anchor, controlIn, controlOut) {
                this.anchor(anchor || new Point());
                this.controlIn(controlIn);
                this.controlOut(controlOut);
            },
            bboxTo: function (toSegment, matrix) {
                var segmentAnchor = this.anchor().transformCopy(matrix);
                var toSegmentAnchor = toSegment.anchor().transformCopy(matrix);
                var rect;
                if (this.controlOut() && toSegment.controlIn()) {
                    rect = this._curveBoundingBox(segmentAnchor, this.controlOut().transformCopy(matrix), toSegment.controlIn().transformCopy(matrix), toSegmentAnchor);
                } else {
                    rect = this._lineBoundingBox(segmentAnchor, toSegmentAnchor);
                }
                return rect;
            },
            _lineBoundingBox: function (p1, p2) {
                return Rect.fromPoints(p1, p2);
            },
            _curveBoundingBox: function (p1, cp1, cp2, p2) {
                var points = [
                    p1,
                    cp1,
                    cp2,
                    p2
                ];
                var extremesX = this._curveExtremesFor(points, 'x');
                var extremesY = this._curveExtremesFor(points, 'y');
                var xLimits = arrayLimits([
                    extremesX.min,
                    extremesX.max,
                    p1.x,
                    p2.x
                ]);
                var yLimits = arrayLimits([
                    extremesY.min,
                    extremesY.max,
                    p1.y,
                    p2.y
                ]);
                return Rect.fromPoints(new Point(xLimits.min, yLimits.min), new Point(xLimits.max, yLimits.max));
            },
            _curveExtremesFor: function (points, field) {
                var extremes = this._curveExtremes(points[0][field], points[1][field], points[2][field], points[3][field]);
                return {
                    min: calculateCurveAt(extremes.min, field, points),
                    max: calculateCurveAt(extremes.max, field, points)
                };
            },
            _curveExtremes: function (x1, x2, x3, x4) {
                var a = x1 - 3 * x2 + 3 * x3 - x4;
                var b = -2 * (x1 - 2 * x2 + x3);
                var c = x1 - x2;
                var sqrt = Math.sqrt(b * b - 4 * a * c);
                var t1 = 0;
                var t2 = 1;
                if (a === 0) {
                    if (b !== 0) {
                        t1 = t2 = -c / b;
                    }
                } else if (!isNaN(sqrt)) {
                    t1 = (-b + sqrt) / (2 * a);
                    t2 = (-b - sqrt) / (2 * a);
                }
                var min = Math.max(Math.min(t1, t2), 0);
                if (min < 0 || min > 1) {
                    min = 0;
                }
                var max = Math.min(Math.max(t1, t2), 1);
                if (max > 1 || max < 0) {
                    max = 1;
                }
                return {
                    min: min,
                    max: max
                };
            },
            _intersectionsTo: function (segment, point) {
                var intersectionsCount;
                if (this.controlOut() && segment.controlIn()) {
                    intersectionsCount = curveIntersectionsCount([
                        this.anchor(),
                        this.controlOut(),
                        segment.controlIn(),
                        segment.anchor()
                    ], point, this.bboxTo(segment));
                } else {
                    intersectionsCount = lineIntersectionsCount(this.anchor(), segment.anchor(), point);
                }
                return intersectionsCount;
            },
            _isOnCurveTo: function (segment, point, width, endSegment) {
                var bbox = this.bboxTo(segment).expand(width, width);
                if (bbox.containsPoint(point)) {
                    var p1 = this.anchor();
                    var p2 = this.controlOut();
                    var p3 = segment.controlIn();
                    var p4 = segment.anchor();
                    if (endSegment === 'start' && p1.distanceTo(point) <= width) {
                        return !isOutOfEndPoint(p1, p2, point);
                    } else if (endSegment === 'end' && p4.distanceTo(point) <= width) {
                        return !isOutOfEndPoint(p4, p3, point);
                    }
                    var points = [
                        p1,
                        p2,
                        p3,
                        p4
                    ];
                    if (hasRootsInRange(points, point, 'x', 'y', width) || hasRootsInRange(points, point, 'y', 'x', width)) {
                        return true;
                    }
                    var rotation = transform().rotate(45, point);
                    var rotatedPoints = [
                        p1.transformCopy(rotation),
                        p2.transformCopy(rotation),
                        p3.transformCopy(rotation),
                        p4.transformCopy(rotation)
                    ];
                    return hasRootsInRange(rotatedPoints, point, 'x', 'y', width) || hasRootsInRange(rotatedPoints, point, 'y', 'x', width);
                }
            },
            _isOnLineTo: function (segment, point, width) {
                var p1 = this.anchor();
                var p2 = segment.anchor();
                var angle = deg(Math.atan2(p2.y - p1.y, p2.x - p1.x));
                var rect = new Rect([
                    p1.x,
                    p1.y - width / 2
                ], [
                    p1.distanceTo(p2),
                    width
                ]);
                return rect.containsPoint(point.transformCopy(transform().rotate(-angle, p1)));
            },
            _isOnPathTo: function (segment, point, width, endSegment) {
                var isOnPath;
                if (this.controlOut() && segment.controlIn()) {
                    isOnPath = this._isOnCurveTo(segment, point, width / 2, endSegment);
                } else {
                    isOnPath = this._isOnLineTo(segment, point, width);
                }
                return isOnPath;
            }
        });
        definePointAccessors(Segment.prototype, [
            'anchor',
            'controlIn',
            'controlOut'
        ]);
        ObserversMixin.extend(Segment.prototype);
        function arrayLimits(arr) {
            var length = arr.length;
            var min = MAX_NUM;
            var max = MIN_NUM;
            for (var i = 0; i < length; i++) {
                max = Math.max(max, arr[i]);
                min = Math.min(min, arr[i]);
            }
            return {
                min: min,
                max: max
            };
        }
        function elementsBoundingBox(elements, applyTransform, transformation) {
            var boundingBox;
            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];
                if (element.visible()) {
                    var elementBoundingBox = applyTransform ? element.bbox(transformation) : element.rawBBox();
                    if (elementBoundingBox) {
                        if (boundingBox) {
                            boundingBox = Rect.union(boundingBox, elementBoundingBox);
                        } else {
                            boundingBox = elementBoundingBox;
                        }
                    }
                }
            }
            return boundingBox;
        }
        function elementsClippedBoundingBox(elements, transformation) {
            var boundingBox;
            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];
                if (element.visible()) {
                    var elementBoundingBox = element.clippedBBox(transformation);
                    if (elementBoundingBox) {
                        if (boundingBox) {
                            boundingBox = Rect.union(boundingBox, elementBoundingBox);
                        } else {
                            boundingBox = elementBoundingBox;
                        }
                    }
                }
            }
            return boundingBox;
        }
        var MultiPath = Element$1.extend({
            init: function (options) {
                Element$1.fn.init.call(this, options);
                this.paths = new GeometryElementsArray();
                this.paths.addObserver(this);
                if (!defined(this.options.stroke)) {
                    this.stroke('#000');
                }
            },
            moveTo: function (x, y) {
                var path = new Path();
                path.moveTo(x, y);
                this.paths.push(path);
                return this;
            },
            lineTo: function (x, y) {
                if (this.paths.length > 0) {
                    last(this.paths).lineTo(x, y);
                }
                return this;
            },
            curveTo: function (controlOut, controlIn, point) {
                if (this.paths.length > 0) {
                    last(this.paths).curveTo(controlOut, controlIn, point);
                }
                return this;
            },
            arc: function (startAngle, endAngle, radiusX, radiusY, anticlockwise) {
                if (this.paths.length > 0) {
                    last(this.paths).arc(startAngle, endAngle, radiusX, radiusY, anticlockwise);
                }
                return this;
            },
            arcTo: function (end, rx, ry, largeArc, swipe, rotation) {
                if (this.paths.length > 0) {
                    last(this.paths).arcTo(end, rx, ry, largeArc, swipe, rotation);
                }
                return this;
            },
            close: function () {
                if (this.paths.length > 0) {
                    last(this.paths).close();
                }
                return this;
            },
            _bbox: function (matrix) {
                return elementsBoundingBox(this.paths, true, matrix);
            },
            rawBBox: function () {
                return elementsBoundingBox(this.paths, false);
            },
            _containsPoint: function (point) {
                var paths = this.paths;
                for (var idx = 0; idx < paths.length; idx++) {
                    if (paths[idx]._containsPoint(point)) {
                        return true;
                    }
                }
                return false;
            },
            _isOnPath: function (point) {
                var paths = this.paths;
                var width = this.options.stroke.width;
                for (var idx = 0; idx < paths.length; idx++) {
                    if (paths[idx]._isOnPath(point, width)) {
                        return true;
                    }
                }
                return false;
            },
            _clippedBBox: function (transformation) {
                return elementsClippedBoundingBox(this.paths, this.currentTransform(transformation));
            }
        });
        MultiPath.prototype.nodeType = 'MultiPath';
        Paintable.extend(MultiPath.prototype);
        Measurable.extend(MultiPath.prototype);
        var ShapeMap = {
            l: function (path, options) {
                var parameters = options.parameters;
                var position = options.position;
                for (var i = 0; i < parameters.length; i += 2) {
                    var point = new Point(parameters[i], parameters[i + 1]);
                    if (options.isRelative) {
                        point.translateWith(position);
                    }
                    path.lineTo(point.x, point.y);
                    position.x = point.x;
                    position.y = point.y;
                }
            },
            c: function (path, options) {
                var parameters = options.parameters;
                var position = options.position;
                for (var i = 0; i < parameters.length; i += 6) {
                    var controlOut = new Point(parameters[i], parameters[i + 1]);
                    var controlIn = new Point(parameters[i + 2], parameters[i + 3]);
                    var point = new Point(parameters[i + 4], parameters[i + 5]);
                    if (options.isRelative) {
                        controlIn.translateWith(position);
                        controlOut.translateWith(position);
                        point.translateWith(position);
                    }
                    path.curveTo(controlOut, controlIn, point);
                    position.x = point.x;
                    position.y = point.y;
                }
            },
            v: function (path, options) {
                var value = options.isRelative ? 0 : options.position.x;
                toLineParamaters(options.parameters, true, value);
                this.l(path, options);
            },
            h: function (path, options) {
                var value = options.isRelative ? 0 : options.position.y;
                toLineParamaters(options.parameters, false, value);
                this.l(path, options);
            },
            a: function (path, options) {
                var parameters = options.parameters;
                var position = options.position;
                for (var i = 0; i < parameters.length; i += 7) {
                    var radiusX = parameters[i];
                    var radiusY = parameters[i + 1];
                    var rotation = parameters[i + 2];
                    var largeArc = parameters[i + 3];
                    var swipe = parameters[i + 4];
                    var endPoint = new Point(parameters[i + 5], parameters[i + 6]);
                    if (options.isRelative) {
                        endPoint.translateWith(position);
                    }
                    if (position.x !== endPoint.x || position.y !== endPoint.y) {
                        path.arcTo(endPoint, radiusX, radiusY, largeArc, swipe, rotation);
                        position.x = endPoint.x;
                        position.y = endPoint.y;
                    }
                }
            },
            s: function (path, options) {
                var parameters = options.parameters;
                var position = options.position;
                var previousCommand = options.previousCommand;
                var lastControlIn;
                if (previousCommand === 's' || previousCommand === 'c') {
                    lastControlIn = last(last(path.paths).segments).controlIn();
                }
                for (var i = 0; i < parameters.length; i += 4) {
                    var controlIn = new Point(parameters[i], parameters[i + 1]);
                    var endPoint = new Point(parameters[i + 2], parameters[i + 3]);
                    var controlOut = void 0;
                    if (options.isRelative) {
                        controlIn.translateWith(position);
                        endPoint.translateWith(position);
                    }
                    if (lastControlIn) {
                        controlOut = reflectionPoint(lastControlIn, position);
                    } else {
                        controlOut = position.clone();
                    }
                    lastControlIn = controlIn;
                    path.curveTo(controlOut, controlIn, endPoint);
                    position.x = endPoint.x;
                    position.y = endPoint.y;
                }
            },
            q: function (path, options) {
                var parameters = options.parameters;
                var position = options.position;
                for (var i = 0; i < parameters.length; i += 4) {
                    var controlPoint = new Point(parameters[i], parameters[i + 1]);
                    var endPoint = new Point(parameters[i + 2], parameters[i + 3]);
                    if (options.isRelative) {
                        controlPoint.translateWith(position);
                        endPoint.translateWith(position);
                    }
                    var cubicControlPoints = quadraticToCubicControlPoints(position, controlPoint, endPoint);
                    path.curveTo(cubicControlPoints.controlOut, cubicControlPoints.controlIn, endPoint);
                    position.x = endPoint.x;
                    position.y = endPoint.y;
                }
            },
            t: function (path, options) {
                var parameters = options.parameters;
                var position = options.position;
                var previousCommand = options.previousCommand;
                var controlPoint;
                if (previousCommand === 'q' || previousCommand === 't') {
                    var lastSegment = last(last(path.paths).segments);
                    controlPoint = lastSegment.controlIn().clone().translateWith(position.scaleCopy(-1 / 3)).scale(3 / 2);
                }
                for (var i = 0; i < parameters.length; i += 2) {
                    var endPoint = new Point(parameters[i], parameters[i + 1]);
                    if (options.isRelative) {
                        endPoint.translateWith(position);
                    }
                    if (controlPoint) {
                        controlPoint = reflectionPoint(controlPoint, position);
                    } else {
                        controlPoint = position.clone();
                    }
                    var cubicControlPoints = quadraticToCubicControlPoints(position, controlPoint, endPoint);
                    path.curveTo(cubicControlPoints.controlOut, cubicControlPoints.controlIn, endPoint);
                    position.x = endPoint.x;
                    position.y = endPoint.y;
                }
            }
        };
        function toLineParamaters(parameters, isVertical, value) {
            var insertPosition = isVertical ? 0 : 1;
            for (var i = 0; i < parameters.length; i += 2) {
                parameters.splice(i + insertPosition, 0, value);
            }
        }
        function reflectionPoint(point, center) {
            if (point && center) {
                return center.scaleCopy(2).translate(-point.x, -point.y);
            }
        }
        var third = 1 / 3;
        function quadraticToCubicControlPoints(position, controlPoint, endPoint) {
            var scaledPoint = controlPoint.clone().scale(2 / 3);
            return {
                controlOut: scaledPoint.clone().translateWith(position.scaleCopy(third)),
                controlIn: scaledPoint.translateWith(endPoint.scaleCopy(third))
            };
        }
        var SEGMENT_REGEX = /([a-df-z]{1})([^a-df-z]*)(z)?/gi;
        var SPLIT_REGEX = /[,\s]?([+\-]?(?:\d*\.\d+|\d+)(?:[eE][+\-]?\d+)?)/g;
        var MOVE = 'm';
        var CLOSE = 'z';
        function parseParameters(str) {
            var parameters = [];
            str.replace(SPLIT_REGEX, function (match, number) {
                parameters.push(parseFloat(number));
            });
            return parameters;
        }
        var PathParser = Class.extend({
            parse: function (str, options) {
                var multiPath = new MultiPath(options);
                var position = new Point();
                var previousCommand;
                str.replace(SEGMENT_REGEX, function (match, element, params, closePath) {
                    var command = element.toLowerCase();
                    var isRelative = command === element;
                    var parameters = parseParameters(params.trim());
                    if (command === MOVE) {
                        if (isRelative) {
                            position.x += parameters[0];
                            position.y += parameters[1];
                        } else {
                            position.x = parameters[0];
                            position.y = parameters[1];
                        }
                        multiPath.moveTo(position.x, position.y);
                        if (parameters.length > 2) {
                            command = 'l';
                            parameters.splice(0, 2);
                        }
                    }
                    if (ShapeMap[command]) {
                        ShapeMap[command](multiPath, {
                            parameters: parameters,
                            position: position,
                            isRelative: isRelative,
                            previousCommand: previousCommand
                        });
                        if (closePath && closePath.toLowerCase() === CLOSE) {
                            multiPath.close();
                        }
                    } else if (command !== MOVE) {
                        throw new Error('Error while parsing SVG path. Unsupported command: ' + command);
                    }
                    previousCommand = command;
                });
                return multiPath;
            }
        });
        PathParser.current = new PathParser();
        var Path = Element$1.extend({
            init: function (options) {
                Element$1.fn.init.call(this, options);
                this.segments = new GeometryElementsArray();
                this.segments.addObserver(this);
                if (!defined(this.options.stroke)) {
                    this.stroke('#000');
                    if (!defined(this.options.stroke.lineJoin)) {
                        this.options.set('stroke.lineJoin', 'miter');
                    }
                }
            },
            moveTo: function (x, y) {
                this.suspend();
                this.segments.elements([]);
                this.resume();
                this.lineTo(x, y);
                return this;
            },
            lineTo: function (x, y) {
                var point = defined(y) ? new Point(x, y) : x;
                var segment = new Segment(point);
                this.segments.push(segment);
                return this;
            },
            curveTo: function (controlOut, controlIn, point) {
                if (this.segments.length > 0) {
                    var lastSegment = last(this.segments);
                    var segment = new Segment(point, controlIn);
                    this.suspend();
                    lastSegment.controlOut(controlOut);
                    this.resume();
                    this.segments.push(segment);
                }
                return this;
            },
            arc: function (startAngle, endAngle, radiusX, radiusY, anticlockwise) {
                if (this.segments.length > 0) {
                    var lastSegment = last(this.segments);
                    var anchor = lastSegment.anchor();
                    var start = rad(startAngle);
                    var center = new Point(anchor.x - radiusX * Math.cos(start), anchor.y - radiusY * Math.sin(start));
                    var arc = new Arc$2(center, {
                        startAngle: startAngle,
                        endAngle: endAngle,
                        radiusX: radiusX,
                        radiusY: radiusY,
                        anticlockwise: anticlockwise
                    });
                    this._addArcSegments(arc);
                }
                return this;
            },
            arcTo: function (end, rx, ry, largeArc, swipe, rotation) {
                if (this.segments.length > 0) {
                    var lastSegment = last(this.segments);
                    var anchor = lastSegment.anchor();
                    var arc = Arc$2.fromPoints(anchor, end, rx, ry, largeArc, swipe, rotation);
                    this._addArcSegments(arc);
                }
                return this;
            },
            _addArcSegments: function (arc) {
                var this$1 = this;
                this.suspend();
                var curvePoints = arc.curvePoints();
                for (var i = 1; i < curvePoints.length; i += 3) {
                    this$1.curveTo(curvePoints[i], curvePoints[i + 1], curvePoints[i + 2]);
                }
                this.resume();
                this.geometryChange();
            },
            close: function () {
                this.options.closed = true;
                this.geometryChange();
                return this;
            },
            rawBBox: function () {
                return this._bbox();
            },
            _containsPoint: function (point) {
                var segments = this.segments;
                var length = segments.length;
                var intersectionsCount = 0;
                var previous, current;
                for (var idx = 1; idx < length; idx++) {
                    previous = segments[idx - 1];
                    current = segments[idx];
                    intersectionsCount += previous._intersectionsTo(current, point);
                }
                if (this.options.closed || !segments[0].anchor().equals(segments[length - 1].anchor())) {
                    intersectionsCount += lineIntersectionsCount(segments[0].anchor(), segments[length - 1].anchor(), point);
                }
                return intersectionsCount % 2 !== 0;
            },
            _isOnPath: function (point, width) {
                var segments = this.segments;
                var length = segments.length;
                var pathWidth = width || this.options.stroke.width;
                if (length > 1) {
                    if (segments[0]._isOnPathTo(segments[1], point, pathWidth, 'start')) {
                        return true;
                    }
                    for (var idx = 2; idx <= length - 2; idx++) {
                        if (segments[idx - 1]._isOnPathTo(segments[idx], point, pathWidth)) {
                            return true;
                        }
                    }
                    if (segments[length - 2]._isOnPathTo(segments[length - 1], point, pathWidth, 'end')) {
                        return true;
                    }
                }
                return false;
            },
            _bbox: function (matrix) {
                var segments = this.segments;
                var length = segments.length;
                var boundingBox;
                if (length === 1) {
                    var anchor = segments[0].anchor().transformCopy(matrix);
                    boundingBox = new Rect(anchor, Size.ZERO);
                } else if (length > 0) {
                    for (var i = 1; i < length; i++) {
                        var segmentBox = segments[i - 1].bboxTo(segments[i], matrix);
                        if (boundingBox) {
                            boundingBox = Rect.union(boundingBox, segmentBox);
                        } else {
                            boundingBox = segmentBox;
                        }
                    }
                }
                return boundingBox;
            }
        });
        Path.fromRect = function (rect, options) {
            return new Path(options).moveTo(rect.topLeft()).lineTo(rect.topRight()).lineTo(rect.bottomRight()).lineTo(rect.bottomLeft()).close();
        };
        Path.fromPoints = function (points, options) {
            if (points) {
                var path = new Path(options);
                for (var i = 0; i < points.length; i++) {
                    var point = Point.create(points[i]);
                    if (point) {
                        if (i === 0) {
                            path.moveTo(point);
                        } else {
                            path.lineTo(point);
                        }
                    }
                }
                return path;
            }
        };
        Path.fromArc = function (arc, options) {
            var path = new Path(options);
            var startAngle = arc.startAngle;
            var start = arc.pointAt(startAngle);
            path.moveTo(start.x, start.y);
            path.arc(startAngle, arc.endAngle, arc.radiusX, arc.radiusY, arc.anticlockwise);
            return path;
        };
        Path.prototype.nodeType = 'Path';
        Paintable.extend(Path.prototype);
        Measurable.extend(Path.prototype);
        Path.parse = function (str, options) {
            return PathParser.current.parse(str, options);
        };
        var DEFAULT_STROKE$1 = '#000';
        var Arc = Element$1.extend({
            init: function (geometry, options) {
                if (geometry === void 0) {
                    geometry = new Arc$2();
                }
                if (options === void 0) {
                    options = {};
                }
                Element$1.fn.init.call(this, options);
                this.geometry(geometry);
                if (!defined(this.options.stroke)) {
                    this.stroke(DEFAULT_STROKE$1);
                }
            },
            _bbox: function (matrix) {
                return this._geometry.bbox(matrix);
            },
            rawBBox: function () {
                return this.geometry().bbox();
            },
            toPath: function () {
                var path = new Path();
                var curvePoints = this.geometry().curvePoints();
                if (curvePoints.length > 0) {
                    path.moveTo(curvePoints[0].x, curvePoints[0].y);
                    for (var i = 1; i < curvePoints.length; i += 3) {
                        path.curveTo(curvePoints[i], curvePoints[i + 1], curvePoints[i + 2]);
                    }
                }
                return path;
            },
            _containsPoint: function (point) {
                return this.geometry().containsPoint(point);
            },
            _isOnPath: function (point) {
                return this.geometry()._isOnPath(point, this.options.stroke.width / 2);
            }
        });
        Arc.prototype.nodeType = 'Arc';
        Paintable.extend(Arc.prototype);
        Measurable.extend(Arc.prototype);
        defineGeometryAccessors(Arc.prototype, ['geometry']);
        var DEFAULT_FONT = '12px sans-serif';
        var DEFAULT_FILL = '#000';
        var Text = Element$1.extend({
            init: function (content, position, options) {
                if (position === void 0) {
                    position = new Point();
                }
                if (options === void 0) {
                    options = {};
                }
                Element$1.fn.init.call(this, options);
                this.content(content);
                this.position(position);
                if (!this.options.font) {
                    this.options.font = DEFAULT_FONT;
                }
                if (!defined(this.options.fill)) {
                    this.fill(DEFAULT_FILL);
                }
            },
            content: function (value) {
                if (defined(value)) {
                    this.options.set('content', value);
                    return this;
                }
                return this.options.get('content');
            },
            measure: function () {
                var metrics = suixUtil.measureText(this.content(), { font: this.options.get('font') });
                return metrics;
            },
            rect: function () {
                var size = this.measure();
                var pos = this.position().clone();
                return new Rect(pos, [
                    size.width,
                    size.height
                ]);
            },
            bbox: function (transformation) {
                var combinedMatrix = toMatrix(this.currentTransform(transformation));
                return this.rect().bbox(combinedMatrix);
            },
            rawBBox: function () {
                return this.rect().bbox();
            },
            _containsPoint: function (point) {
                return this.rect().containsPoint(point);
            }
        });
        Text.prototype.nodeType = 'Text';
        Paintable.extend(Text.prototype);
        definePointAccessors(Text.prototype, ['position']);
        var Image$1 = Element$1.extend({
            init: function (src, rect, options) {
                if (rect === void 0) {
                    rect = new Rect();
                }
                if (options === void 0) {
                    options = {};
                }
                Element$1.fn.init.call(this, options);
                this.src(src);
                this.rect(rect);
            },
            src: function (value) {
                if (defined(value)) {
                    this.options.set('src', value);
                    return this;
                }
                return this.options.get('src');
            },
            bbox: function (transformation) {
                var combinedMatrix = toMatrix(this.currentTransform(transformation));
                return this._rect.bbox(combinedMatrix);
            },
            rawBBox: function () {
                return this._rect.bbox();
            },
            _containsPoint: function (point) {
                return this._rect.containsPoint(point);
            },
            _hasFill: function () {
                return this.src();
            }
        });
        Image$1.prototype.nodeType = 'Image';
        defineGeometryAccessors(Image$1.prototype, ['rect']);
        var Traversable = {
            extend: function (proto, childrenField) {
                proto.traverse = function (callback) {
                    var children = this[childrenField];
                    for (var i = 0; i < children.length; i++) {
                        var child = children[i];
                        if (child.traverse) {
                            child.traverse(callback);
                        } else {
                            callback(child);
                        }
                    }
                    return this;
                };
            }
        };
        var Group = Element$1.extend({
            init: function (options) {
                Element$1.fn.init.call(this, options);
                this.children = [];
            },
            childrenChange: function (action, items, index) {
                this.trigger('childrenChange', {
                    action: action,
                    items: items,
                    index: index
                });
            },
            append: function () {
                append(this.children, arguments);
                this._reparent(arguments, this);
                this.childrenChange('add', arguments);
                return this;
            },
            insert: function (index, element) {
                this.children.splice(index, 0, element);
                element.parent = this;
                this.childrenChange('add', [element], index);
                return this;
            },
            insertAt: function (element, index) {
                return this.insert(index, element);
            },
            remove: function (element) {
                var index = this.children.indexOf(element);
                if (index >= 0) {
                    this.children.splice(index, 1);
                    element.parent = null;
                    this.childrenChange('remove', [element], index);
                }
                return this;
            },
            removeAt: function (index) {
                if (0 <= index && index < this.children.length) {
                    var element = this.children[index];
                    this.children.splice(index, 1);
                    element.parent = null;
                    this.childrenChange('remove', [element], index);
                }
                return this;
            },
            clear: function () {
                var items = this.children;
                this.children = [];
                this._reparent(items, null);
                this.childrenChange('remove', items, 0);
                return this;
            },
            bbox: function (transformation) {
                return elementsBoundingBox(this.children, true, this.currentTransform(transformation));
            },
            rawBBox: function () {
                return elementsBoundingBox(this.children, false);
            },
            _clippedBBox: function (transformation) {
                return elementsClippedBoundingBox(this.children, this.currentTransform(transformation));
            },
            currentTransform: function (transformation) {
                return Element$1.prototype.currentTransform.call(this, transformation) || null;
            },
            containsPoint: function (point, parentTransform) {
                if (this.visible()) {
                    var children = this.children;
                    var transform = this.currentTransform(parentTransform);
                    for (var idx = 0; idx < children.length; idx++) {
                        if (children[idx].containsPoint(point, transform)) {
                            return true;
                        }
                    }
                }
                return false;
            },
            _reparent: function (elements, newParent) {
                var this$1 = this;
                for (var i = 0; i < elements.length; i++) {
                    var child = elements[i];
                    var parent = child.parent;
                    if (parent && parent !== this$1 && parent.remove) {
                        parent.remove(child);
                    }
                    child.parent = newParent;
                }
            }
        });
        Group.prototype.nodeType = 'Group';
        Traversable.extend(Group.prototype, 'children');
        function translateToPoint(point, bbox, element) {
            var transofrm = element.transform() || transform();
            var matrix = transofrm.matrix();
            matrix.e += point.x - bbox.origin.x;
            matrix.f += point.y - bbox.origin.y;
            transofrm.matrix(matrix);
            element.transform(transofrm);
        }
        function alignStart(size, rect, align, axis, sizeField) {
            var start;
            if (align === 'start') {
                start = rect.origin[axis];
            } else if (align === 'end') {
                start = rect.origin[axis] + rect.size[sizeField] - size;
            } else {
                start = rect.origin[axis] + (rect.size[sizeField] - size) / 2;
            }
            return start;
        }
        function alignStartReverse(size, rect, align, axis, sizeField) {
            var start;
            if (align === 'start') {
                start = rect.origin[axis] + rect.size[sizeField] - size;
            } else if (align === 'end') {
                start = rect.origin[axis];
            } else {
                start = rect.origin[axis] + (rect.size[sizeField] - size) / 2;
            }
            return start;
        }
        var DEFAULT_OPTIONS = {
            alignContent: 'start',
            justifyContent: 'start',
            alignItems: 'start',
            spacing: 0,
            orientation: 'horizontal',
            lineSpacing: 0,
            wrap: true,
            revers: false
        };
        var forEach = function (elements, callback) {
            elements.forEach(callback);
        };
        var forEachReverse = function (elements, callback) {
            var length = elements.length;
            for (var idx = length - 1; idx >= 0; idx--) {
                callback(elements[idx], idx);
            }
        };
        var Layout = Group.extend({
            init: function (rect, options) {
                Group.fn.init.call(this, $.extend({}, DEFAULT_OPTIONS, options));
                this._rect = rect;
                this._fieldMap = {};
            },
            rect: function (value) {
                if (value) {
                    this._rect = value;
                    return this;
                }
                return this._rect;
            },
            _initMap: function () {
                var options = this.options;
                var fieldMap = this._fieldMap;
                if (options.orientation === 'horizontal') {
                    fieldMap.sizeField = 'width';
                    fieldMap.groupsSizeField = 'height';
                    fieldMap.groupAxis = 'x';
                    fieldMap.groupsAxis = 'y';
                } else {
                    fieldMap.sizeField = 'height';
                    fieldMap.groupsSizeField = 'width';
                    fieldMap.groupAxis = 'y';
                    fieldMap.groupsAxis = 'x';
                }
                if (options.reverse) {
                    this.forEach = forEachReverse;
                    this.justifyAlign = alignStartReverse;
                } else {
                    this.forEach = forEach;
                    this.justifyAlign = alignStart;
                }
            },
            reflow: function () {
                var this$1 = this;
                if (!this._rect || this.children.length === 0) {
                    return;
                }
                this._initMap();
                if (this.options.transform) {
                    this.transform(null);
                }
                var options = this.options;
                var rect = this._rect;
                var ref = this._initGroups();
                var groups = ref.groups;
                var groupsSize = ref.groupsSize;
                var ref$1 = this._fieldMap;
                var sizeField = ref$1.sizeField;
                var groupsSizeField = ref$1.groupsSizeField;
                var groupAxis = ref$1.groupAxis;
                var groupsAxis = ref$1.groupsAxis;
                var groupOrigin = new Point();
                var elementOrigin = new Point();
                var size = new Size();
                var groupStart = alignStart(groupsSize, rect, options.alignContent, groupsAxis, groupsSizeField);
                var elementStart, group, groupBox;
                var arrangeElements = function (bbox, idx) {
                    var element = group.elements[idx];
                    elementOrigin[groupAxis] = elementStart;
                    elementOrigin[groupsAxis] = alignStart(bbox.size[groupsSizeField], groupBox, options.alignItems, groupsAxis, groupsSizeField);
                    translateToPoint(elementOrigin, bbox, element);
                    elementStart += bbox.size[sizeField] + options.spacing;
                };
                for (var groupIdx = 0; groupIdx < groups.length; groupIdx++) {
                    group = groups[groupIdx];
                    groupOrigin[groupAxis] = elementStart = this$1.justifyAlign(group.size, rect, options.justifyContent, groupAxis, sizeField);
                    groupOrigin[groupsAxis] = groupStart;
                    size[sizeField] = group.size;
                    size[groupsSizeField] = group.lineSize;
                    groupBox = new Rect(groupOrigin, size);
                    this$1.forEach(group.bboxes, arrangeElements);
                    groupStart += group.lineSize + options.lineSpacing;
                }
                if (!options.wrap && group.size > rect.size[sizeField]) {
                    var scale = rect.size[sizeField] / groupBox.size[sizeField];
                    var scaledStart = groupBox.topLeft().scale(scale, scale);
                    var scaledSize = groupBox.size[groupsSizeField] * scale;
                    var newStart = alignStart(scaledSize, rect, options.alignContent, groupsAxis, groupsSizeField);
                    var transform$$1 = transform();
                    if (groupAxis === 'x') {
                        transform$$1.translate(rect.origin.x - scaledStart.x, newStart - scaledStart.y);
                    } else {
                        transform$$1.translate(newStart - scaledStart.x, rect.origin.y - scaledStart.y);
                    }
                    transform$$1.scale(scale, scale);
                    this.transform(transform$$1);
                }
            },
            _initGroups: function () {
                var this$1 = this;
                var ref = this;
                var options = ref.options;
                var children = ref.children;
                var lineSpacing = options.lineSpacing;
                var wrap = options.wrap;
                var spacing = options.spacing;
                var sizeField = this._fieldMap.sizeField;
                var group = this._newGroup();
                var groups = [];
                var addGroup = function () {
                    groups.push(group);
                    groupsSize += group.lineSize + lineSpacing;
                };
                var groupsSize = -lineSpacing;
                for (var idx = 0; idx < children.length; idx++) {
                    var element = children[idx];
                    var bbox = children[idx].clippedBBox();
                    if (element.visible() && bbox) {
                        if (wrap && group.size + bbox.size[sizeField] + spacing > this$1._rect.size[sizeField]) {
                            if (group.bboxes.length === 0) {
                                this$1._addToGroup(group, bbox, element);
                                addGroup();
                                group = this$1._newGroup();
                            } else {
                                addGroup();
                                group = this$1._newGroup();
                                this$1._addToGroup(group, bbox, element);
                            }
                        } else {
                            this$1._addToGroup(group, bbox, element);
                        }
                    }
                }
                if (group.bboxes.length) {
                    addGroup();
                }
                return {
                    groups: groups,
                    groupsSize: groupsSize
                };
            },
            _addToGroup: function (group, bbox, element) {
                group.size += bbox.size[this._fieldMap.sizeField] + this.options.spacing;
                group.lineSize = Math.max(bbox.size[this._fieldMap.groupsSizeField], group.lineSize);
                group.bboxes.push(bbox);
                group.elements.push(element);
            },
            _newGroup: function () {
                return {
                    lineSize: 0,
                    size: -this.options.spacing,
                    bboxes: [],
                    elements: []
                };
            }
        });
        var Rect$2 = Element$1.extend({
            init: function (geometry, options) {
                if (geometry === void 0) {
                    geometry = new Rect();
                }
                if (options === void 0) {
                    options = {};
                }
                Element$1.fn.init.call(this, options);
                this.geometry(geometry);
                if (!defined(this.options.stroke)) {
                    this.stroke('#000');
                }
            },
            _bbox: function (matrix) {
                return this._geometry.bbox(matrix);
            },
            rawBBox: function () {
                return this._geometry.bbox();
            },
            _containsPoint: function (point) {
                return this._geometry.containsPoint(point);
            },
            _isOnPath: function (point) {
                return this.geometry()._isOnPath(point, this.options.stroke.width / 2);
            }
        });
        Rect$2.prototype.nodeType = 'Rect';
        Paintable.extend(Rect$2.prototype);
        Measurable.extend(Rect$2.prototype);
        defineGeometryAccessors(Rect$2.prototype, ['geometry']);
        function alignElements(elements, rect, alignment, axis, sizeField) {
            for (var idx = 0; idx < elements.length; idx++) {
                var bbox = elements[idx].clippedBBox();
                if (bbox) {
                    var point = bbox.origin.clone();
                    point[axis] = alignStart(bbox.size[sizeField], rect, alignment || 'start', axis, sizeField);
                    translateToPoint(point, bbox, elements[idx]);
                }
            }
        }
        function align(elements, rect, alignment) {
            alignElements(elements, rect, alignment, 'x', 'width');
        }
        function vAlign(elements, rect, alignment) {
            alignElements(elements, rect, alignment, 'y', 'height');
        }
        function stackElements(elements, stackAxis, otherAxis, sizeField) {
            if (elements.length > 1) {
                var origin = new Point();
                var previousBBox = elements[0].bbox;
                for (var idx = 1; idx < elements.length; idx++) {
                    var element = elements[idx].element;
                    var bbox = elements[idx].bbox;
                    origin[stackAxis] = previousBBox.origin[stackAxis] + previousBBox.size[sizeField];
                    origin[otherAxis] = bbox.origin[otherAxis];
                    translateToPoint(origin, bbox, element);
                    bbox.origin[stackAxis] = origin[stackAxis];
                    previousBBox = bbox;
                }
            }
        }
        function createStackElements(elements) {
            var stackElements = [];
            for (var idx = 0; idx < elements.length; idx++) {
                var element = elements[idx];
                var bbox = element.clippedBBox();
                if (bbox) {
                    stackElements.push({
                        element: element,
                        bbox: bbox
                    });
                }
            }
            return stackElements;
        }
        function stack(elements) {
            stackElements(createStackElements(elements), 'x', 'y', 'width');
        }
        function vStack(elements) {
            stackElements(createStackElements(elements), 'y', 'x', 'height');
        }
        function getStacks(elements, rect, sizeField) {
            var maxSize = rect.size[sizeField];
            var stacks = [];
            var stack = [];
            var stackSize = 0;
            var element, bbox;
            var addElementToStack = function () {
                stack.push({
                    element: element,
                    bbox: bbox
                });
            };
            for (var idx = 0; idx < elements.length; idx++) {
                element = elements[idx];
                bbox = element.clippedBBox();
                if (bbox) {
                    var size = bbox.size[sizeField];
                    if (stackSize + size > maxSize) {
                        if (stack.length) {
                            stacks.push(stack);
                            stack = [];
                            addElementToStack();
                            stackSize = size;
                        } else {
                            addElementToStack();
                            stacks.push(stack);
                            stack = [];
                            stackSize = 0;
                        }
                    } else {
                        addElementToStack();
                        stackSize += size;
                    }
                }
            }
            if (stack.length) {
                stacks.push(stack);
            }
            return stacks;
        }
        function wrapElements(elements, rect, axis, otherAxis, sizeField) {
            var stacks = getStacks(elements, rect, sizeField);
            var origin = rect.origin.clone();
            var result = [];
            for (var idx = 0; idx < stacks.length; idx++) {
                var stack = stacks[idx];
                var startElement = stack[0];
                origin[otherAxis] = startElement.bbox.origin[otherAxis];
                translateToPoint(origin, startElement.bbox, startElement.element);
                startElement.bbox.origin[axis] = origin[axis];
                stackElements(stack, axis, otherAxis, sizeField);
                result.push([]);
                for (var elementIdx = 0; elementIdx < stack.length; elementIdx++) {
                    result[idx].push(stack[elementIdx].element);
                }
            }
            return result;
        }
        function wrap(elements, rect) {
            return wrapElements(elements, rect, 'x', 'y', 'width');
        }
        function vWrap(elements, rect) {
            return wrapElements(elements, rect, 'y', 'x', 'height');
        }
        function fit(element, rect) {
            var bbox = element.clippedBBox();
            if (bbox) {
                var elementSize = bbox.size;
                var rectSize = rect.size;
                if (rectSize.width < elementSize.width || rectSize.height < elementSize.height) {
                    var scale = Math.min(rectSize.width / elementSize.width, rectSize.height / elementSize.height);
                    var transform$$1 = element.transform() || transform();
                    transform$$1.scale(scale, scale);
                    element.transform(transform$$1);
                }
            }
        }
        var StopsArray = ElementsArray.extend({
            _change: function () {
                this.optionsChange({ field: 'stops' });
            }
        });
        function optionsAccessor(name) {
            return function (value) {
                if (defined(value)) {
                    this.options.set(name, value);
                    return this;
                }
                return this.options.get(name);
            };
        }
        function defineOptionsAccessors(fn, names) {
            for (var i = 0; i < names.length; i++) {
                fn[names[i]] = optionsAccessor(names[i]);
            }
        }
        var GradientStop = Class.extend({
            init: function (offset, color, opacity) {
                this.options = new OptionsStore({
                    offset: offset,
                    color: color,
                    opacity: defined(opacity) ? opacity : 1
                });
                this.options.addObserver(this);
            }
        });
        GradientStop.create = function (arg) {
            if (defined(arg)) {
                var stop;
                if (arg instanceof GradientStop) {
                    stop = arg;
                } else if (arg.length > 1) {
                    stop = new GradientStop(arg[0], arg[1], arg[2]);
                } else {
                    stop = new GradientStop(arg.offset, arg.color, arg.opacity);
                }
                return stop;
            }
        };
        defineOptionsAccessors(GradientStop.prototype, [
            'offset',
            'color',
            'opacity'
        ]);
        ObserversMixin.extend(GradientStop.prototype);
        var Gradient = Class.extend({
            init: function (options) {
                if (options === void 0) {
                    options = {};
                }
                this.stops = new StopsArray(this._createStops(options.stops));
                this.stops.addObserver(this);
                this._userSpace = options.userSpace;
                this.id = definitionId();
            },
            userSpace: function (value) {
                if (defined(value)) {
                    this._userSpace = value;
                    this.optionsChange();
                    return this;
                }
                return this._userSpace;
            },
            _createStops: function (stops) {
                if (stops === void 0) {
                    stops = [];
                }
                var result = [];
                for (var idx = 0; idx < stops.length; idx++) {
                    result.push(GradientStop.create(stops[idx]));
                }
                return result;
            },
            addStop: function (offset, color, opacity) {
                this.stops.push(new GradientStop(offset, color, opacity));
            },
            removeStop: function (stop) {
                var index = this.stops.indexOf(stop);
                if (index >= 0) {
                    this.stops.splice(index, 1);
                }
            }
        });
        Gradient.prototype.nodeType = 'Gradient';
        ObserversMixin.extend(Gradient.prototype);
        $.extend(Gradient.prototype, {
            optionsChange: function (e) {
                this.trigger('optionsChange', {
                    field: 'gradient' + (e ? '.' + e.field : ''),
                    value: this
                });
            },
            geometryChange: function () {
                this.optionsChange();
            }
        });
        var LinearGradient = Gradient.extend({
            init: function (options) {
                if (options === void 0) {
                    options = {};
                }
                Gradient.fn.init.call(this, options);
                this.start(options.start || new Point());
                this.end(options.end || new Point(1, 0));
            }
        });
        definePointAccessors(LinearGradient.prototype, [
            'start',
            'end'
        ]);
        var RadialGradient = Gradient.extend({
            init: function (options) {
                if (options === void 0) {
                    options = {};
                }
                Gradient.fn.init.call(this, options);
                this.center(options.center || new Point());
                this._radius = defined(options.radius) ? options.radius : 1;
                this._fallbackFill = options.fallbackFill;
            },
            radius: function (value) {
                if (defined(value)) {
                    this._radius = value;
                    this.geometryChange();
                    return this;
                }
                return this._radius;
            },
            fallbackFill: function (value) {
                if (defined(value)) {
                    this._fallbackFill = value;
                    this.optionsChange();
                    return this;
                }
                return this._fallbackFill;
            }
        });
        definePointAccessors(RadialGradient.prototype, ['center']);
        function swing(position) {
            return 0.5 - Math.cos(position * Math.PI) / 2;
        }
        function linear(position) {
            return position;
        }
        function easeOutElastic(position, time, start, diff) {
            var s = 1.70158, p = 0, a = diff;
            if (position === 0) {
                return start;
            }
            if (position === 1) {
                return start + diff;
            }
            if (!p) {
                p = 0.5;
            }
            if (a < Math.abs(diff)) {
                a = diff;
                s = p / 4;
            } else {
                s = p / (2 * Math.PI) * Math.asin(diff / a);
            }
            return a * Math.pow(2, -10 * position) * Math.sin((Number(position) - s) * (1.1 * Math.PI) / p) + diff + start;
        }
        var easingFunctions = {
            swing: swing,
            linear: linear,
            easeOutElastic: easeOutElastic
        };
        var AnimationFactory = Class.extend({
            init: function () {
                this._items = [];
            },
            register: function (name, type) {
                this._items.push({
                    name: name,
                    type: type
                });
            },
            create: function (element, options) {
                var items = this._items;
                var match;
                if (options && options.type) {
                    var type = options.type.toLowerCase();
                    for (var i = 0; i < items.length; i++) {
                        if (items[i].name.toLowerCase() === type) {
                            match = items[i];
                            break;
                        }
                    }
                }
                if (match) {
                    return new match.type(element, options);
                }
            }
        });
        AnimationFactory.current = new AnimationFactory();
        var now = Date.now || function () {
            return new Date().getTime();
        };
        var Animation = Class.extend({
            init: function (element, options) {
                this.options = $.extend({}, this.options, options);
                this.element = element;
            },
            setup: function () {
            },
            step: function () {
            },
            play: function () {
                var this$1 = this;
                var options = this.options;
                var duration = options.duration;
                var delay = options.delay;
                if (delay === void 0) {
                    delay = 0;
                }
                var easing = easingFunctions[options.easing];
                var start = now() + delay;
                var finish = start + duration;
                if (duration === 0) {
                    this.step(1);
                    this.abort();
                } else {
                    setTimeout(function () {
                        var loop = function () {
                            if (this$1._stopped) {
                                return;
                            }
                            var wallTime = now();
                            var time = limitValue(wallTime - start, 0, duration);
                            var position = time / duration;
                            var easingPosition = easing(position, time, 0, 1, duration);
                            this$1.step(easingPosition);
                            if (wallTime < finish) {
                                suix.animationFrame(loop);
                            } else {
                                this$1.abort();
                            }
                        };
                        loop();
                    }, delay);
                }
            },
            abort: function () {
                this._stopped = true;
            },
            destroy: function () {
                this.abort();
            }
        });
        Animation.prototype.options = {
            duration: 500,
            easing: 'swing'
        };
        Animation.create = function (type, element, options) {
            return AnimationFactory.current.create(type, element, options);
        };
        var SurfaceFactory = Class.extend({
            init: function () {
                this._items = [];
            },
            register: function (name, type, order) {
                var items = this._items;
                var first = items[0];
                var entry = {
                    name: name,
                    type: type,
                    order: order
                };
                if (!first || order < first.order) {
                    items.unshift(entry);
                } else {
                    items.push(entry);
                }
            },
            create: function (element, options) {
                var items = this._items;
                var match = items[0];
                if (options && options.type) {
                    var preferred = options.type.toLowerCase();
                    for (var i = 0; i < items.length; i++) {
                        if (items[i].name === preferred) {
                            match = items[i];
                            break;
                        }
                    }
                }
                if (match) {
                    return new match.type(element, options);
                }
                suix.logToConsole('Warning: Unable to create Suix Drawing Surface. Possible causes:\n' + '- The browser does not support SVG and Canvas. User agent: ' + navigator.userAgent);
            }
        });
        SurfaceFactory.current = new SurfaceFactory();
        var events = [
            'click',
            'mouseenter',
            'mouseleave',
            'mousemove',
            'resize'
        ];
        var Surface = suix.Observable.extend({
            init: function (element, options) {
                suix.Observable.fn.init.call(this);
                this.options = $.extend({}, options);
                this.element = element;
                this.element._suixExportVisual = this.exportVisual.bind(this);
                this._click = this._handler('click');
                this._mouseenter = this._handler('mouseenter');
                this._mouseleave = this._handler('mouseleave');
                this._mousemove = this._handler('mousemove');
                this._visual = new Group();
                elementSize(element, this.options);
                this.bind(events, this.options);
                this._enableTracking();
            },
            draw: function (element) {
                this._visual.children.push(element);
            },
            clear: function () {
                this._visual.children = [];
            },
            destroy: function () {
                this._visual = null;
                this.element._suixExportVisual = null;
                this.unbind();
            },
            eventTarget: function (e) {
                var this$1 = this;
                var domNode = eventElement(e);
                var node;
                while (!node && domNode) {
                    node = domNode._suixNode;
                    if (domNode === this$1.element) {
                        break;
                    }
                    domNode = domNode.parentElement;
                }
                if (node) {
                    return node.srcElement;
                }
            },
            exportVisual: function () {
                return this._visual;
            },
            getSize: function () {
                return elementSize(this.element);
            },
            currentSize: function (size) {
                if (size) {
                    this._size = size;
                } else {
                    return this._size;
                }
            },
            setSize: function (size) {
                elementSize(this.element, size);
                this.currentSize(size);
                this._resize();
            },
            resize: function (force) {
                var size = this.getSize();
                var currentSize = this.currentSize();
                if (force || (size.width > 0 || size.height > 0) && (!currentSize || size.width !== currentSize.width || size.height !== currentSize.height)) {
                    this.currentSize(size);
                    this._resize(size, force);
                    this.trigger('resize', size);
                }
            },
            size: function (value) {
                if (!value) {
                    return this.getSize();
                }
                this.setSize(value);
            },
            suspendTracking: function () {
                this._suspendedTracking = true;
            },
            resumeTracking: function () {
                this._suspendedTracking = false;
            },
            _enableTracking: function () {
            },
            _resize: function () {
            },
            _handler: function (eventName) {
                var this$1 = this;
                return function (e) {
                    var node = this$1.eventTarget(e);
                    if (node && !this$1._suspendedTracking) {
                        this$1.trigger(eventName, {
                            element: node,
                            originalEvent: e,
                            type: eventName
                        });
                    }
                };
            },
            _elementOffset: function () {
                var element = this.element;
                var ref = elementStyles(element, [
                    'paddingLeft',
                    'paddingTop'
                ]);
                var paddingLeft = ref.paddingLeft;
                var paddingTop = ref.paddingTop;
                var ref$1 = elementOffset(element);
                var left = ref$1.left;
                var top = ref$1.top;
                return {
                    left: left + parseInt(paddingLeft, 10),
                    top: top + parseInt(paddingTop, 10)
                };
            },
            _surfacePoint: function (e) {
                var offset = this._elementOffset();
                var coord = eventCoordinates(e);
                var x = coord.x - offset.left;
                var y = coord.y - offset.top;
                return new Point(x, y);
            }
        });
        Surface.create = function (element, options) {
            return SurfaceFactory.current.create(element, options);
        };
        Surface.support = {};
        var BaseNode = Class.extend({
            init: function (srcElement) {
                this.childNodes = [];
                this.parent = null;
                if (srcElement) {
                    this.srcElement = srcElement;
                    this.observe();
                }
            },
            destroy: function () {
                var this$1 = this;
                if (this.srcElement) {
                    this.srcElement.removeObserver(this);
                }
                var children = this.childNodes;
                for (var i = 0; i < children.length; i++) {
                    this$1.childNodes[i].destroy();
                }
                this.parent = null;
            },
            load: function () {
            },
            observe: function () {
                if (this.srcElement) {
                    this.srcElement.addObserver(this);
                }
            },
            append: function (node) {
                this.childNodes.push(node);
                node.parent = this;
            },
            insertAt: function (node, pos) {
                this.childNodes.splice(pos, 0, node);
                node.parent = this;
            },
            remove: function (index, count) {
                var this$1 = this;
                var end = index + count;
                for (var i = index; i < end; i++) {
                    this$1.childNodes[i].removeSelf();
                }
                this.childNodes.splice(index, count);
            },
            removeSelf: function () {
                this.clear();
                this.destroy();
            },
            clear: function () {
                this.remove(0, this.childNodes.length);
            },
            invalidate: function () {
                if (this.parent) {
                    this.parent.invalidate();
                }
            },
            geometryChange: function () {
                this.invalidate();
            },
            optionsChange: function () {
                this.invalidate();
            },
            childrenChange: function (e) {
                if (e.action === 'add') {
                    this.load(e.items, e.index);
                } else if (e.action === 'remove') {
                    this.remove(e.index, e.items.length);
                }
                this.invalidate();
            }
        });
        function renderAttr(name, value) {
            return defined(value) && value !== null ? ' ' + name + '="' + value + '" ' : '';
        }
        function renderAllAttr(attrs) {
            var output = '';
            for (var i = 0; i < attrs.length; i++) {
                output += renderAttr(attrs[i][0], attrs[i][1]);
            }
            return output;
        }
        function renderStyle(attrs) {
            var output = '';
            for (var i = 0; i < attrs.length; i++) {
                var value = attrs[i][1];
                if (defined(value)) {
                    output += attrs[i][0] + ':' + value + ';';
                }
            }
            if (output !== '') {
                return output;
            }
        }
        var NODE_MAP = {};
        var SVG_NS = 'http://www.w3.org/2000/svg';
        var NONE = 'none';
        var renderSVG = function (container, svg) {
            container.innerHTML = svg;
        };
        if (typeof document !== 'undefined') {
            var testFragment = '<svg xmlns=\'' + SVG_NS + '\'></svg>';
            var testContainer = document.createElement('div');
            var hasParser = typeof DOMParser !== 'undefined';
            testContainer.innerHTML = testFragment;
            if (hasParser && testContainer.firstChild.namespaceURI !== SVG_NS) {
                renderSVG = function (container, svg) {
                    var parser = new DOMParser();
                    var chartDoc = parser.parseFromString(svg, 'text/xml');
                    var importedDoc = document.adoptNode(chartDoc.documentElement);
                    container.innerHTML = '';
                    container.appendChild(importedDoc);
                };
            }
        }
        var renderSVG$1 = renderSVG;
        var TRANSFORM = 'transform';
        var DefinitionMap = {
            clip: 'clip-path',
            fill: 'fill'
        };
        function isDefinition(type, value) {
            return type === 'clip' || type === 'fill' && (!value || value.nodeType === 'Gradient');
        }
        function baseUrl() {
            var base = document.getElementsByTagName('base')[0];
            var href = document.location.href;
            var url = '';
            if (base && !(supportBrowser || {}).msie) {
                var hashIndex = href.indexOf('#');
                if (hashIndex !== -1) {
                    href = href.substring(0, hashIndex);
                }
                url = href;
            }
            return url;
        }
        var Node = BaseNode.extend({
            init: function (srcElement, options) {
                BaseNode.fn.init.call(this, srcElement);
                this.definitions = {};
                this.options = options;
            },
            destroy: function () {
                if (this.element) {
                    this.element._suixNode = null;
                    this.element = null;
                }
                this.clearDefinitions();
                BaseNode.fn.destroy.call(this);
            },
            load: function (elements, pos) {
                var this$1 = this;
                for (var i = 0; i < elements.length; i++) {
                    var srcElement = elements[i];
                    var children = srcElement.children;
                    var childNode = new NODE_MAP[srcElement.nodeType](srcElement, this$1.options);
                    if (defined(pos)) {
                        this$1.insertAt(childNode, pos);
                    } else {
                        this$1.append(childNode);
                    }
                    childNode.createDefinitions();
                    if (children && children.length > 0) {
                        childNode.load(children);
                    }
                    var element = this$1.element;
                    if (element) {
                        childNode.attachTo(element, pos);
                    }
                }
            },
            root: function () {
                var root = this;
                while (root.parent) {
                    root = root.parent;
                }
                return root;
            },
            attachTo: function (domElement, pos) {
                var container = document.createElement('div');
                renderSVG$1(container, '<svg xmlns=\'' + SVG_NS + '\' version=\'1.1\'>' + this.render() + '</svg>');
                var element = container.firstChild.firstChild;
                if (element) {
                    if (defined(pos)) {
                        domElement.insertBefore(element, domElement.childNodes[pos] || null);
                    } else {
                        domElement.appendChild(element);
                    }
                    this.setElement(element);
                }
            },
            setElement: function (element) {
                if (this.element) {
                    this.element._suixNode = null;
                }
                this.element = element;
                this.element._suixNode = this;
                var nodes = this.childNodes;
                for (var i = 0; i < nodes.length; i++) {
                    var childElement = element.childNodes[i];
                    nodes[i].setElement(childElement);
                }
            },
            clear: function () {
                this.clearDefinitions();
                if (this.element) {
                    this.element.innerHTML = '';
                }
                var children = this.childNodes;
                for (var i = 0; i < children.length; i++) {
                    children[i].destroy();
                }
                this.childNodes = [];
            },
            removeSelf: function () {
                if (this.element) {
                    var parentNode = this.element.parentNode;
                    if (parentNode) {
                        parentNode.removeChild(this.element);
                    }
                    this.element = null;
                }
                BaseNode.fn.removeSelf.call(this);
            },
            template: function () {
                return this.renderChildren();
            },
            render: function () {
                return this.template();
            },
            renderChildren: function () {
                var nodes = this.childNodes;
                var output = '';
                for (var i = 0; i < nodes.length; i++) {
                    output += nodes[i].render();
                }
                return output;
            },
            optionsChange: function (e) {
                var field = e.field;
                var value = e.value;
                if (field === 'visible') {
                    this.css('display', value ? '' : NONE);
                } else if (DefinitionMap[field] && isDefinition(field, value)) {
                    this.updateDefinition(field, value);
                } else if (field === 'opacity') {
                    this.attr('opacity', value);
                } else if (field === 'cursor') {
                    this.css('cursor', value);
                } else if (field === 'id') {
                    if (value) {
                        this.attr('id', value);
                    } else {
                        this.removeAttr('id');
                    }
                }
                BaseNode.fn.optionsChange.call(this, e);
            },
            attr: function (name, value) {
                if (this.element) {
                    this.element.setAttribute(name, value);
                }
            },
            allAttr: function (attrs) {
                var this$1 = this;
                for (var i = 0; i < attrs.length; i++) {
                    this$1.attr(attrs[i][0], attrs[i][1]);
                }
            },
            css: function (name, value) {
                if (this.element) {
                    this.element.style[name] = value;
                }
            },
            allCss: function (styles) {
                var this$1 = this;
                for (var i = 0; i < styles.length; i++) {
                    this$1.css(styles[i][0], styles[i][1]);
                }
            },
            removeAttr: function (name) {
                if (this.element) {
                    this.element.removeAttribute(name);
                }
            },
            mapTransform: function (transform) {
                var attrs = [];
                if (transform) {
                    attrs.push([
                        TRANSFORM,
                        'matrix(' + transform.matrix().toString(6) + ')'
                    ]);
                }
                return attrs;
            },
            renderTransform: function () {
                return renderAllAttr(this.mapTransform(this.srcElement.transform()));
            },
            transformChange: function (value) {
                if (value) {
                    this.allAttr(this.mapTransform(value));
                } else {
                    this.removeAttr(TRANSFORM);
                }
            },
            mapStyle: function () {
                var options = this.srcElement.options;
                var style = [[
                        'cursor',
                        options.cursor
                    ]];
                if (options.visible === false) {
                    style.push([
                        'display',
                        NONE
                    ]);
                }
                return style;
            },
            renderStyle: function () {
                return renderAttr('style', renderStyle(this.mapStyle(true)));
            },
            renderOpacity: function () {
                return renderAttr('opacity', this.srcElement.options.opacity);
            },
            renderId: function () {
                return renderAttr('id', this.srcElement.options.id);
            },
            createDefinitions: function () {
                var srcElement = this.srcElement;
                var definitions = this.definitions;
                if (srcElement) {
                    var options = srcElement.options;
                    var hasDefinitions;
                    for (var field in DefinitionMap) {
                        var definition = options.get(field);
                        if (definition && isDefinition(field, definition)) {
                            definitions[field] = definition;
                            hasDefinitions = true;
                        }
                    }
                    if (hasDefinitions) {
                        this.definitionChange({
                            action: 'add',
                            definitions: definitions
                        });
                    }
                }
            },
            definitionChange: function (e) {
                if (this.parent) {
                    this.parent.definitionChange(e);
                }
            },
            updateDefinition: function (type, value) {
                var definitions = this.definitions;
                var current = definitions[type];
                var attr = DefinitionMap[type];
                var definition = {};
                if (current) {
                    definition[type] = current;
                    this.definitionChange({
                        action: 'remove',
                        definitions: definition
                    });
                    delete definitions[type];
                }
                if (!value) {
                    if (current) {
                        this.removeAttr(attr);
                    }
                } else {
                    definition[type] = value;
                    this.definitionChange({
                        action: 'add',
                        definitions: definition
                    });
                    definitions[type] = value;
                    this.attr(attr, this.refUrl(value.id));
                }
            },
            clearDefinitions: function () {
                var definitions = this.definitions;
                this.definitionChange({
                    action: 'remove',
                    definitions: definitions
                });
                this.definitions = {};
            },
            renderDefinitions: function () {
                return renderAllAttr(this.mapDefinitions());
            },
            mapDefinitions: function () {
                var this$1 = this;
                var definitions = this.definitions;
                var attrs = [];
                for (var field in definitions) {
                    attrs.push([
                        DefinitionMap[field],
                        this$1.refUrl(definitions[field].id)
                    ]);
                }
                return attrs;
            },
            refUrl: function (id) {
                var skipBaseHref = (this.options || {}).skipBaseHref;
                var baseHref = this.baseUrl().replace(/'/g, '\\\'');
                var base = skipBaseHref ? '' : baseHref;
                return 'url(' + base + '#' + id + ')';
            },
            baseUrl: function () {
                return baseUrl();
            }
        });
        var GradientStopNode = Node.extend({
            template: function () {
                return '<stop ' + this.renderOffset() + ' ' + this.renderStyle() + ' />';
            },
            renderOffset: function () {
                return renderAttr('offset', this.srcElement.offset());
            },
            mapStyle: function () {
                var srcElement = this.srcElement;
                return [
                    [
                        'stop-color',
                        srcElement.color()
                    ],
                    [
                        'stop-opacity',
                        srcElement.opacity()
                    ]
                ];
            },
            optionsChange: function (e) {
                if (e.field === 'offset') {
                    this.attr(e.field, e.value);
                } else if (e.field === 'color' || e.field === 'opacity') {
                    this.css('stop-' + e.field, e.value);
                }
            }
        });
        var GradientNode = Node.extend({
            init: function (srcElement) {
                Node.fn.init.call(this, srcElement);
                this.id = srcElement.id;
                this.loadStops();
            },
            loadStops: function () {
                var this$1 = this;
                var stops = this.srcElement.stops;
                var element = this.element;
                for (var idx = 0; idx < stops.length; idx++) {
                    var stopNode = new GradientStopNode(stops[idx]);
                    this$1.append(stopNode);
                    if (element) {
                        stopNode.attachTo(element);
                    }
                }
            },
            optionsChange: function (e) {
                if (e.field === 'gradient.stops') {
                    BaseNode.prototype.clear.call(this);
                    this.loadStops();
                } else if (e.field === 'gradient') {
                    this.allAttr(this.mapCoordinates());
                }
            },
            renderCoordinates: function () {
                return renderAllAttr(this.mapCoordinates());
            },
            mapSpace: function () {
                return [
                    'gradientUnits',
                    this.srcElement.userSpace() ? 'userSpaceOnUse' : 'objectBoundingBox'
                ];
            }
        });
        var LinearGradientNode = GradientNode.extend({
            template: function () {
                return '<linearGradient id=\'' + this.id + '\' ' + this.renderCoordinates() + '>' + this.renderChildren() + '</linearGradient>';
            },
            mapCoordinates: function () {
                var srcElement = this.srcElement;
                var start = srcElement.start();
                var end = srcElement.end();
                var attrs = [
                    [
                        'x1',
                        start.x
                    ],
                    [
                        'y1',
                        start.y
                    ],
                    [
                        'x2',
                        end.x
                    ],
                    [
                        'y2',
                        end.y
                    ],
                    this.mapSpace()
                ];
                return attrs;
            }
        });
        var RadialGradientNode = GradientNode.extend({
            template: function () {
                return '<radialGradient id=\'' + this.id + '\' ' + this.renderCoordinates() + '>' + this.renderChildren() + '</radialGradient>';
            },
            mapCoordinates: function () {
                var srcElement = this.srcElement;
                var center = srcElement.center();
                var radius = srcElement.radius();
                var attrs = [
                    [
                        'cx',
                        center.x
                    ],
                    [
                        'cy',
                        center.y
                    ],
                    [
                        'r',
                        radius
                    ],
                    this.mapSpace()
                ];
                return attrs;
            }
        });
        var ClipNode = Node.extend({
            init: function (srcElement) {
                Node.fn.init.call(this);
                this.srcElement = srcElement;
                this.id = srcElement.id;
                this.load([srcElement]);
            },
            template: function () {
                return '<clipPath id=\'' + this.id + '\'>' + this.renderChildren() + '</clipPath>';
            }
        });
        var DefinitionNode = Node.extend({
            init: function () {
                Node.fn.init.call(this);
                this.definitionMap = {};
            },
            attachTo: function (domElement) {
                this.element = domElement;
            },
            template: function () {
                return '<defs>' + this.renderChildren() + '</defs>';
            },
            definitionChange: function (e) {
                var definitions = e.definitions;
                var action = e.action;
                if (action === 'add') {
                    this.addDefinitions(definitions);
                } else if (action === 'remove') {
                    this.removeDefinitions(definitions);
                }
            },
            createDefinition: function (type, item) {
                var nodeType;
                if (type === 'clip') {
                    nodeType = ClipNode;
                } else if (type === 'fill') {
                    if (item instanceof LinearGradient) {
                        nodeType = LinearGradientNode;
                    } else if (item instanceof RadialGradient) {
                        nodeType = RadialGradientNode;
                    }
                }
                return new nodeType(item);
            },
            addDefinitions: function (definitions) {
                var this$1 = this;
                for (var field in definitions) {
                    this$1.addDefinition(field, definitions[field]);
                }
            },
            addDefinition: function (type, srcElement) {
                var ref = this;
                var element = ref.element;
                var definitionMap = ref.definitionMap;
                var id = srcElement.id;
                var mapItem = definitionMap[id];
                if (!mapItem) {
                    var node = this.createDefinition(type, srcElement);
                    definitionMap[id] = {
                        element: node,
                        count: 1
                    };
                    this.append(node);
                    if (element) {
                        node.attachTo(this.element);
                    }
                } else {
                    mapItem.count++;
                }
            },
            removeDefinitions: function (definitions) {
                var this$1 = this;
                for (var field in definitions) {
                    this$1.removeDefinition(definitions[field]);
                }
            },
            removeDefinition: function (srcElement) {
                var definitionMap = this.definitionMap;
                var id = srcElement.id;
                var mapItem = definitionMap[id];
                if (mapItem) {
                    mapItem.count--;
                    if (mapItem.count === 0) {
                        this.remove(this.childNodes.indexOf(mapItem.element), 1);
                        delete definitionMap[id];
                    }
                }
            }
        });
        var RootNode = Node.extend({
            init: function (options) {
                Node.fn.init.call(this);
                this.options = options;
                this.defs = new DefinitionNode();
            },
            attachTo: function (domElement) {
                this.element = domElement;
                this.defs.attachTo(domElement.firstElementChild);
            },
            clear: function () {
                BaseNode.prototype.clear.call(this);
            },
            template: function () {
                return this.defs.render() + this.renderChildren();
            },
            definitionChange: function (e) {
                this.defs.definitionChange(e);
            }
        });
        var RTL = 'rtl';
        function alignToScreen(element) {
            var ctm;
            try {
                ctm = element.getScreenCTM ? element.getScreenCTM() : null;
            } catch (e) {
            }
            if (ctm) {
                var left = -ctm.e % 1;
                var top = -ctm.f % 1;
                var style = element.style;
                if (left !== 0 || top !== 0) {
                    style.left = left + 'px';
                    style.top = top + 'px';
                }
            }
        }
        var Surface$1 = Surface.extend({
            init: function (element, options) {
                Surface.fn.init.call(this, element, options);
                this._root = new RootNode($.extend({ rtl: elementStyles(element, 'direction').direction === RTL }, this.options));
                renderSVG$1(this.element, this._template());
                this._rootElement = this.element.firstElementChild;
                alignToScreen(this._rootElement);
                this._root.attachTo(this._rootElement);
                bindEvents(this.element, {
                    click: this._click,
                    mouseover: this._mouseenter,
                    mouseout: this._mouseleave,
                    mousemove: this._mousemove
                });
                this.resize();
            },
            destroy: function () {
                if (this._root) {
                    this._root.destroy();
                    this._root = null;
                    this._rootElement = null;
                    unbindEvents(this.element, {
                        click: this._click,
                        mouseover: this._mouseenter,
                        mouseout: this._mouseleave,
                        mousemove: this._mousemove
                    });
                }
                Surface.fn.destroy.call(this);
            },
            translate: function (offset) {
                var viewBox = Math.round(offset.x) + ' ' + Math.round(offset.y) + ' ' + this._size.width + ' ' + this._size.height;
                this._offset = offset;
                this._rootElement.setAttribute('viewBox', viewBox);
            },
            draw: function (element) {
                Surface.fn.draw.call(this, element);
                this._root.load([element]);
            },
            clear: function () {
                Surface.fn.clear.call(this);
                this._root.clear();
            },
            svg: function () {
                return '<?xml version=\'1.0\' ?>' + this._template();
            },
            exportVisual: function () {
                var ref = this;
                var visual = ref._visual;
                var offset = ref._offset;
                if (offset) {
                    var wrap = new Group();
                    wrap.children.push(visual);
                    wrap.transform(transform().translate(-offset.x, -offset.y));
                    visual = wrap;
                }
                return visual;
            },
            _resize: function () {
                if (this._offset) {
                    this.translate(this._offset);
                }
            },
            _template: function () {
                return '<svg style=\'width: 100%; height: 100%; overflow: hidden;\' xmlns=\'' + SVG_NS + '\' xmlns:xlink=\'http://www.w3.org/1999/xlink\' version=\'1.1\'>' + this._root.render() + '</svg>';
            }
        });
        Surface$1.prototype.type = 'svg';
        if (typeof document !== 'undefined' && document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1')) {
            Surface.support.svg = true;
            SurfaceFactory.current.register('svg', Surface$1, 10);
        }
        var GroupNode = Node.extend({
            template: function () {
                return '<g' + (this.renderId() + this.renderTransform() + this.renderStyle() + this.renderOpacity() + this.renderDefinitions()) + '>' + this.renderChildren() + '</g>';
            },
            optionsChange: function (e) {
                if (e.field === 'transform') {
                    this.transformChange(e.value);
                }
                Node.fn.optionsChange.call(this, e);
            }
        });
        NODE_MAP.Group = GroupNode;
        var DASH_ARRAYS = {
            dot: [
                1.5,
                3.5
            ],
            dash: [
                4,
                3.5
            ],
            longdash: [
                8,
                3.5
            ],
            dashdot: [
                3.5,
                3.5,
                1.5,
                3.5
            ],
            longdashdot: [
                8,
                3.5,
                1.5,
                3.5
            ],
            longdashdotdot: [
                8,
                3.5,
                1.5,
                3.5,
                1.5,
                3.5
            ]
        };
        var SOLID = 'solid';
        var BUTT = 'butt';
        var ATTRIBUTE_MAP = {
            'fill.opacity': 'fill-opacity',
            'stroke.color': 'stroke',
            'stroke.width': 'stroke-width',
            'stroke.opacity': 'stroke-opacity'
        };
        var SPACE = ' ';
        var PathNode = Node.extend({
            geometryChange: function () {
                this.attr('d', this.renderData());
                this.invalidate();
            },
            optionsChange: function (e) {
                switch (e.field) {
                case 'fill':
                    if (e.value) {
                        this.allAttr(this.mapFill(e.value));
                    } else {
                        this.removeAttr('fill');
                    }
                    break;
                case 'fill.color':
                    this.allAttr(this.mapFill({ color: e.value }));
                    break;
                case 'stroke':
                    if (e.value) {
                        this.allAttr(this.mapStroke(e.value));
                    } else {
                        this.removeAttr('stroke');
                    }
                    break;
                case 'transform':
                    this.transformChange(e.value);
                    break;
                default:
                    var name = ATTRIBUTE_MAP[e.field];
                    if (name) {
                        this.attr(name, e.value);
                    }
                    break;
                }
                Node.fn.optionsChange.call(this, e);
            },
            content: function () {
                if (this.element) {
                    this.element.textContent = this.srcElement.content();
                }
            },
            renderData: function () {
                return this.printPath(this.srcElement);
            },
            printPath: function (path) {
                var this$1 = this;
                var segments = path.segments;
                var length = segments.length;
                if (length > 0) {
                    var parts = [];
                    var output, currentType;
                    for (var i = 1; i < length; i++) {
                        var segmentType = this$1.segmentType(segments[i - 1], segments[i]);
                        if (segmentType !== currentType) {
                            currentType = segmentType;
                            parts.push(segmentType);
                        }
                        if (segmentType === 'L') {
                            parts.push(this$1.printPoints(segments[i].anchor()));
                        } else {
                            parts.push(this$1.printPoints(segments[i - 1].controlOut(), segments[i].controlIn(), segments[i].anchor()));
                        }
                    }
                    output = 'M' + this.printPoints(segments[0].anchor()) + SPACE + parts.join(SPACE);
                    if (path.options.closed) {
                        output += 'Z';
                    }
                    return output;
                }
            },
            printPoints: function () {
                var points = arguments;
                var length = points.length;
                var result = [];
                for (var i = 0; i < length; i++) {
                    result.push(points[i].toString(3));
                }
                return result.join(' ');
            },
            segmentType: function (segmentStart, segmentEnd) {
                return segmentStart.controlOut() && segmentEnd.controlIn() ? 'C' : 'L';
            },
            mapStroke: function (stroke) {
                var attrs = [];
                if (stroke && !isTransparent(stroke.color)) {
                    attrs.push([
                        'stroke',
                        stroke.color
                    ]);
                    attrs.push([
                        'stroke-width',
                        stroke.width
                    ]);
                    attrs.push([
                        'stroke-linecap',
                        this.renderLinecap(stroke)
                    ]);
                    attrs.push([
                        'stroke-linejoin',
                        stroke.lineJoin
                    ]);
                    if (defined(stroke.opacity)) {
                        attrs.push([
                            'stroke-opacity',
                            stroke.opacity
                        ]);
                    }
                    if (defined(stroke.dashType)) {
                        attrs.push([
                            'stroke-dasharray',
                            this.renderDashType(stroke)
                        ]);
                    }
                } else {
                    attrs.push([
                        'stroke',
                        NONE
                    ]);
                }
                return attrs;
            },
            renderStroke: function () {
                return renderAllAttr(this.mapStroke(this.srcElement.options.stroke));
            },
            renderDashType: function (stroke) {
                var dashType = stroke.dashType;
                var width = stroke.width;
                if (width === void 0) {
                    width = 1;
                }
                if (dashType && dashType !== SOLID) {
                    var dashArray = DASH_ARRAYS[dashType.toLowerCase()];
                    var result = [];
                    for (var i = 0; i < dashArray.length; i++) {
                        result.push(dashArray[i] * width);
                    }
                    return result.join(' ');
                }
            },
            renderLinecap: function (stroke) {
                var dashType = stroke.dashType;
                var lineCap = stroke.lineCap;
                return dashType && dashType !== 'solid' ? BUTT : lineCap;
            },
            mapFill: function (fill) {
                var attrs = [];
                if (!(fill && fill.nodeType === 'Gradient')) {
                    if (fill && !isTransparent(fill.color)) {
                        attrs.push([
                            'fill',
                            fill.color
                        ]);
                        if (defined(fill.opacity)) {
                            attrs.push([
                                'fill-opacity',
                                fill.opacity
                            ]);
                        }
                    } else {
                        attrs.push([
                            'fill',
                            NONE
                        ]);
                    }
                }
                return attrs;
            },
            renderFill: function () {
                return renderAllAttr(this.mapFill(this.srcElement.options.fill));
            },
            template: function () {
                return '<path ' + this.renderId() + ' ' + this.renderStyle() + ' ' + this.renderOpacity() + ' ' + renderAttr('d', this.renderData()) + '' + this.renderStroke() + this.renderFill() + this.renderDefinitions() + this.renderTransform() + '></path>';
            }
        });
        NODE_MAP.Path = PathNode;
        var ArcNode = PathNode.extend({
            renderData: function () {
                return this.printPath(this.srcElement.toPath());
            }
        });
        NODE_MAP.Arc = ArcNode;
        var CircleNode = PathNode.extend({
            geometryChange: function () {
                var center = this.center();
                this.attr('cx', center.x);
                this.attr('cy', center.y);
                this.attr('r', this.radius());
                this.invalidate();
            },
            center: function () {
                return this.srcElement.geometry().center;
            },
            radius: function () {
                return this.srcElement.geometry().radius;
            },
            template: function () {
                return '<circle ' + this.renderId() + ' ' + this.renderStyle() + ' ' + this.renderOpacity() + 'cx=\'' + this.center().x + '\' cy=\'' + this.center().y + '\' r=\'' + this.radius() + '\'' + this.renderStroke() + ' ' + this.renderFill() + ' ' + this.renderDefinitions() + this.renderTransform() + ' ></circle>';
            }
        });
        NODE_MAP.Circle = CircleNode;
        var RectNode = PathNode.extend({
            geometryChange: function () {
                var geometry = this.srcElement.geometry();
                this.attr('x', geometry.origin.x);
                this.attr('y', geometry.origin.y);
                this.attr('width', geometry.size.width);
                this.attr('height', geometry.size.height);
                this.invalidate();
            },
            size: function () {
                return this.srcElement.geometry().size;
            },
            origin: function () {
                return this.srcElement.geometry().origin;
            },
            template: function () {
                return '<rect ' + this.renderId() + ' ' + this.renderStyle() + ' ' + this.renderOpacity() + ' x=\'' + this.origin().x + '\' y=\'' + this.origin().y + '\' ' + 'width=\'' + this.size().width + '\' height=\'' + this.size().height + '\' ' + this.renderStroke() + ' ' + this.renderFill() + ' ' + this.renderDefinitions() + ' ' + this.renderTransform() + ' />';
            }
        });
        NODE_MAP.Rect = RectNode;
        var ImageNode = PathNode.extend({
            geometryChange: function () {
                this.allAttr(this.mapPosition());
                this.invalidate();
            },
            optionsChange: function (e) {
                if (e.field === 'src') {
                    this.allAttr(this.mapSource());
                }
                PathNode.fn.optionsChange.call(this, e);
            },
            mapPosition: function () {
                var rect = this.srcElement.rect();
                var tl = rect.topLeft();
                return [
                    [
                        'x',
                        tl.x
                    ],
                    [
                        'y',
                        tl.y
                    ],
                    [
                        'width',
                        rect.width() + 'px'
                    ],
                    [
                        'height',
                        rect.height() + 'px'
                    ]
                ];
            },
            renderPosition: function () {
                return renderAllAttr(this.mapPosition());
            },
            mapSource: function (encode) {
                var src = this.srcElement.src();
                if (encode) {
                    src = suix.htmlEncode(src);
                }
                return [[
                        'xlink:href',
                        src
                    ]];
            },
            renderSource: function () {
                return renderAllAttr(this.mapSource(true));
            },
            template: function () {
                return '<image preserveAspectRatio=\'none\' ' + this.renderId() + ' ' + this.renderStyle() + ' ' + this.renderTransform() + ' ' + this.renderOpacity() + this.renderPosition() + ' ' + this.renderSource() + ' ' + this.renderDefinitions() + '>' + '</image>';
            }
        });
        NODE_MAP.Image = ImageNode;
        var ENTITY_REGEX = /&(?:[a-zA-Z]+|#\d+);/g;
        function decodeEntities(text) {
            if (!text || typeof text !== 'string' || !ENTITY_REGEX.test(text)) {
                return text;
            }
            var element = decodeEntities._element;
            ENTITY_REGEX.lastIndex = 0;
            return text.replace(ENTITY_REGEX, function (match) {
                element.innerHTML = match;
                return element.textContent || element.innerText;
            });
        }
        if (typeof document !== 'undefined') {
            decodeEntities._element = document.createElement('span');
        }
        var TextNode = PathNode.extend({
            geometryChange: function () {
                var pos = this.pos();
                this.attr('x', pos.x);
                this.attr('y', pos.y);
                this.invalidate();
            },
            optionsChange: function (e) {
                if (e.field === 'font') {
                    this.attr('style', renderStyle(this.mapStyle()));
                    this.geometryChange();
                } else if (e.field === 'content') {
                    PathNode.fn.content.call(this, this.srcElement.content());
                }
                PathNode.fn.optionsChange.call(this, e);
            },
            mapStyle: function (encode) {
                var style = PathNode.fn.mapStyle.call(this, encode);
                var font = this.srcElement.options.font;
                if (encode) {
                    font = suix.htmlEncode(font);
                }
                style.push([
                    'font',
                    font
                ], [
                    'white-space',
                    'pre'
                ]);
                return style;
            },
            pos: function () {
                var pos = this.srcElement.position();
                var size = this.srcElement.measure();
                return pos.clone().setY(pos.y + size.baseline);
            },
            renderContent: function () {
                var content = this.srcElement.content();
                content = decodeEntities(content);
                content = suix.htmlEncode(content);
                return suixUtil.normalizeText(content);
            },
            renderTextAnchor: function () {
                var anchor;
                if ((this.options || {}).rtl && !(supportBrowser.msie || supportBrowser.edge)) {
                    anchor = 'end';
                }
                return renderAttr('text-anchor', anchor);
            },
            template: function () {
                return '<text ' + this.renderId() + ' ' + this.renderTextAnchor() + ' ' + this.renderStyle() + ' ' + this.renderOpacity() + 'x=\'' + this.pos().x + '\' y=\'' + this.pos().y + '\' ' + this.renderStroke() + ' ' + this.renderTransform() + ' ' + this.renderDefinitions() + this.renderFill() + '>' + this.renderContent() + '</text>';
            }
        });
        NODE_MAP.Text = TextNode;
        var MultiPathNode = PathNode.extend({
            renderData: function () {
                var this$1 = this;
                var paths = this.srcElement.paths;
                if (paths.length > 0) {
                    var result = [];
                    for (var i = 0; i < paths.length; i++) {
                        result.push(this$1.printPath(paths[i]));
                    }
                    return result.join(' ');
                }
            }
        });
        NODE_MAP.MultiPath = MultiPathNode;
        var geometry = {
            Circle: Circle$2,
            Arc: Arc$2,
            Rect: Rect,
            Point: Point,
            Segment: Segment,
            Matrix: Matrix,
            Size: Size,
            toMatrix: toMatrix,
            Transformation: Transformation,
            transform: transform
        };
        function exportGroup(group) {
            var root = new RootNode({ skipBaseHref: true });
            var bbox = group.clippedBBox();
            var rootGroup = group;
            if (bbox) {
                var origin = bbox.getOrigin();
                var exportRoot = new Group();
                exportRoot.transform(transform().translate(-origin.x, -origin.y));
                exportRoot.children.push(group);
                rootGroup = exportRoot;
            }
            root.load([rootGroup]);
            var svg = '<?xml version=\'1.0\' ?><svg xmlns=\'' + SVG_NS + '\' xmlns:xlink=\'http://www.w3.org/1999/xlink\' version=\'1.1\'>' + root.render() + '</svg>';
            root.destroy();
            return svg;
        }
        var svg = {
            Surface: Surface$1,
            RootNode: RootNode,
            Node: Node,
            GroupNode: GroupNode,
            ArcNode: ArcNode,
            CircleNode: CircleNode,
            RectNode: RectNode,
            ImageNode: ImageNode,
            TextNode: TextNode,
            PathNode: PathNode,
            MultiPathNode: MultiPathNode,
            DefinitionNode: DefinitionNode,
            ClipNode: ClipNode,
            GradientStopNode: GradientStopNode,
            LinearGradientNode: LinearGradientNode,
            RadialGradientNode: RadialGradientNode,
            exportGroup: exportGroup
        };
        var NODE_MAP$2 = {};
        function renderPath(ctx, path) {
            var segments = path.segments;
            if (segments.length === 0) {
                return;
            }
            var segment = segments[0];
            var anchor = segment.anchor();
            ctx.moveTo(anchor.x, anchor.y);
            for (var i = 1; i < segments.length; i++) {
                segment = segments[i];
                anchor = segment.anchor();
                var prevSeg = segments[i - 1];
                var prevOut = prevSeg.controlOut();
                var controlIn = segment.controlIn();
                if (prevOut && controlIn) {
                    ctx.bezierCurveTo(prevOut.x, prevOut.y, controlIn.x, controlIn.y, anchor.x, anchor.y);
                } else {
                    ctx.lineTo(anchor.x, anchor.y);
                }
            }
            if (path.options.closed) {
                ctx.closePath();
            }
        }
        var Node$2 = BaseNode.extend({
            init: function (srcElement) {
                BaseNode.fn.init.call(this, srcElement);
                if (srcElement) {
                    this.initClip();
                }
            },
            initClip: function () {
                var clip = this.srcElement.clip();
                if (clip) {
                    this.clip = clip;
                    clip.addObserver(this);
                }
            },
            clear: function () {
                if (this.srcElement) {
                    this.srcElement.removeObserver(this);
                }
                this.clearClip();
                BaseNode.fn.clear.call(this);
            },
            clearClip: function () {
                if (this.clip) {
                    this.clip.removeObserver(this);
                    delete this.clip;
                }
            },
            setClip: function (ctx) {
                if (this.clip) {
                    ctx.beginPath();
                    renderPath(ctx, this.clip);
                    ctx.clip();
                }
            },
            optionsChange: function (e) {
                if (e.field === 'clip') {
                    this.clearClip();
                    this.initClip();
                }
                BaseNode.fn.optionsChange.call(this, e);
            },
            setTransform: function (ctx) {
                if (this.srcElement) {
                    var transform = this.srcElement.transform();
                    if (transform) {
                        ctx.transform.apply(ctx, transform.matrix().toArray(6));
                    }
                }
            },
            loadElements: function (elements, pos, cors) {
                var this$1 = this;
                for (var i = 0; i < elements.length; i++) {
                    var srcElement = elements[i];
                    var children = srcElement.children;
                    var childNode = new NODE_MAP$2[srcElement.nodeType](srcElement, cors);
                    if (children && children.length > 0) {
                        childNode.load(children, pos, cors);
                    }
                    if (defined(pos)) {
                        this$1.insertAt(childNode, pos);
                    } else {
                        this$1.append(childNode);
                    }
                }
            },
            load: function (elements, pos, cors) {
                this.loadElements(elements, pos, cors);
                this.invalidate();
            },
            setOpacity: function (ctx) {
                if (this.srcElement) {
                    var opacity = this.srcElement.opacity();
                    if (defined(opacity)) {
                        this.globalAlpha(ctx, opacity);
                    }
                }
            },
            globalAlpha: function (ctx, value) {
                var opactity = value;
                if (opactity && ctx.globalAlpha) {
                    opactity *= ctx.globalAlpha;
                }
                ctx.globalAlpha = opactity;
            },
            visible: function () {
                var src = this.srcElement;
                return !src || src && src.options.visible !== false;
            }
        });
        var GroupNode$2 = Node$2.extend({
            renderTo: function (ctx) {
                if (!this.visible()) {
                    return;
                }
                ctx.save();
                this.setTransform(ctx);
                this.setClip(ctx);
                this.setOpacity(ctx);
                var childNodes = this.childNodes;
                for (var i = 0; i < childNodes.length; i++) {
                    var child = childNodes[i];
                    if (child.visible()) {
                        child.renderTo(ctx);
                    }
                }
                ctx.restore();
            }
        });
        Traversable.extend(GroupNode$2.prototype, 'childNodes');
        NODE_MAP$2.Group = GroupNode$2;
        var FRAME_DELAY = 1000 / 60;
        var RootNode$2 = GroupNode$2.extend({
            init: function (canvas, size) {
                GroupNode$2.fn.init.call(this);
                this.canvas = canvas;
                this.size = size;
                this.ctx = canvas.getContext('2d');
                var invalidateHandler = this._invalidate.bind(this);
                this.invalidate = suix.throttle(function () {
                    suix.animationFrame(invalidateHandler);
                }, FRAME_DELAY);
            },
            destroy: function () {
                GroupNode$2.fn.destroy.call(this);
                this.canvas = null;
                this.ctx = null;
            },
            load: function (elements, pos, cors) {
                this.loadElements(elements, pos, cors);
                this._invalidate();
            },
            _rescale: function () {
                var ref = this;
                var canvas = ref.canvas;
                var size = ref.size;
                var scale = 1;
                if (typeof window.devicePixelRatio === 'number') {
                    scale = window.devicePixelRatio;
                }
                canvas.width = size.width * scale;
                canvas.height = size.height * scale;
                this.ctx.scale(scale, scale);
            },
            _invalidate: function () {
                if (!this.ctx) {
                    return;
                }
                this._rescale();
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.renderTo(this.ctx);
            }
        });
        Traversable.extend(RootNode$2.prototype, 'childNodes');
        var QuadRoot = Class.extend({
            init: function () {
                this.shapes = [];
            },
            _add: function (shape, bbox) {
                this.shapes.push({
                    bbox: bbox,
                    shape: shape
                });
                shape._quadNode = this;
            },
            pointShapes: function (point) {
                var shapes = this.shapes;
                var length = shapes.length;
                var result = [];
                for (var idx = 0; idx < length; idx++) {
                    if (shapes[idx].bbox.containsPoint(point)) {
                        result.push(shapes[idx].shape);
                    }
                }
                return result;
            },
            insert: function (shape, bbox) {
                this._add(shape, bbox);
            },
            remove: function (shape) {
                var shapes = this.shapes;
                var length = shapes.length;
                for (var idx = 0; idx < length; idx++) {
                    if (shapes[idx].shape === shape) {
                        shapes.splice(idx, 1);
                        break;
                    }
                }
            }
        });
        var QuadNode = QuadRoot.extend({
            init: function (rect) {
                QuadRoot.fn.init.call(this);
                this.children = [];
                this.rect = rect;
            },
            inBounds: function (rect) {
                var nodeRect = this.rect;
                var nodeBottomRight = nodeRect.bottomRight();
                var bottomRight = rect.bottomRight();
                var inBounds = nodeRect.origin.x <= rect.origin.x && nodeRect.origin.y <= rect.origin.y && bottomRight.x <= nodeBottomRight.x && bottomRight.y <= nodeBottomRight.y;
                return inBounds;
            },
            pointShapes: function (point) {
                var children = this.children;
                var length = children.length;
                var result = QuadRoot.fn.pointShapes.call(this, point);
                for (var idx = 0; idx < length; idx++) {
                    append(result, children[idx].pointShapes(point));
                }
                return result;
            },
            insert: function (shape, bbox) {
                var children = this.children;
                var inserted = false;
                if (this.inBounds(bbox)) {
                    if (this.shapes.length < 4) {
                        this._add(shape, bbox);
                    } else {
                        if (!children.length) {
                            this._initChildren();
                        }
                        for (var idx = 0; idx < children.length; idx++) {
                            if (children[idx].insert(shape, bbox)) {
                                inserted = true;
                                break;
                            }
                        }
                        if (!inserted) {
                            this._add(shape, bbox);
                        }
                    }
                    inserted = true;
                }
                return inserted;
            },
            _initChildren: function () {
                var ref = this;
                var rect = ref.rect;
                var children = ref.children;
                var center = rect.center();
                var halfWidth = rect.width() / 2;
                var halfHeight = rect.height() / 2;
                children.push(new QuadNode(new Rect([
                    rect.origin.x,
                    rect.origin.y
                ], [
                    halfWidth,
                    halfHeight
                ])), new QuadNode(new Rect([
                    center.x,
                    rect.origin.y
                ], [
                    halfWidth,
                    halfHeight
                ])), new QuadNode(new Rect([
                    rect.origin.x,
                    center.y
                ], [
                    halfWidth,
                    halfHeight
                ])), new QuadNode(new Rect([
                    center.x,
                    center.y
                ], [
                    halfWidth,
                    halfHeight
                ])));
            }
        });
        var ROOT_SIZE = 3000;
        var LEVEL_STEP = 10000;
        var MAX_LEVEL = 75;
        var ShapesQuadTree = Class.extend({
            init: function () {
                this.initRoots();
            },
            initRoots: function () {
                this.rootMap = {};
                this.root = new QuadRoot();
                this.rootElements = [];
            },
            clear: function () {
                var this$1 = this;
                var rootElements = this.rootElements;
                for (var idx = 0; idx < rootElements.length; idx++) {
                    this$1.remove(rootElements[idx]);
                }
                this.initRoots();
            },
            pointShape: function (point) {
                var sectorRoot = (this.rootMap[Math.floor(point.x / ROOT_SIZE)] || {})[Math.floor(point.y / ROOT_SIZE)];
                var result = this.root.pointShapes(point);
                if (sectorRoot) {
                    result = result.concat(sectorRoot.pointShapes(point));
                }
                this.assignZindex(result);
                result.sort(zIndexComparer);
                for (var idx = 0; idx < result.length; idx++) {
                    if (result[idx].containsPoint(point)) {
                        return result[idx];
                    }
                }
            },
            assignZindex: function (elements) {
                var this$1 = this;
                for (var idx = 0; idx < elements.length; idx++) {
                    var element = elements[idx];
                    var zIndex = 0;
                    var levelWeight = Math.pow(LEVEL_STEP, MAX_LEVEL);
                    var parents = [];
                    while (element) {
                        parents.push(element);
                        element = element.parent;
                    }
                    while (parents.length) {
                        element = parents.pop();
                        zIndex += ((element.parent ? element.parent.children : this$1.rootElements).indexOf(element) + 1) * levelWeight;
                        levelWeight /= LEVEL_STEP;
                    }
                    elements[idx]._zIndex = zIndex;
                }
            },
            optionsChange: function (e) {
                if (e.field === 'transform' || e.field === 'stroke.width') {
                    this.bboxChange(e.element);
                }
            },
            geometryChange: function (e) {
                this.bboxChange(e.element);
            },
            bboxChange: function (element) {
                var this$1 = this;
                if (element.nodeType === 'Group') {
                    for (var idx = 0; idx < element.children.length; idx++) {
                        this$1.bboxChange(element.children[idx]);
                    }
                } else {
                    if (element._quadNode) {
                        element._quadNode.remove(element);
                    }
                    this._insertShape(element);
                }
            },
            add: function (elements) {
                var elementsArray = Array.isArray(elements) ? elements.slice(0) : [elements];
                append(this.rootElements, elementsArray);
                this._insert(elementsArray);
            },
            childrenChange: function (e) {
                var this$1 = this;
                if (e.action === 'remove') {
                    for (var idx = 0; idx < e.items.length; idx++) {
                        this$1.remove(e.items[idx]);
                    }
                } else {
                    this._insert(Array.prototype.slice.call(e.items, 0));
                }
            },
            _insert: function (elements) {
                var this$1 = this;
                var element;
                while (elements.length > 0) {
                    element = elements.pop();
                    element.addObserver(this$1);
                    if (element.nodeType === 'Group') {
                        append(elements, element.children);
                    } else {
                        this$1._insertShape(element);
                    }
                }
            },
            _insertShape: function (shape) {
                var bbox = shape.bbox();
                if (bbox) {
                    var sectors = this.getSectors(bbox);
                    var x = sectors[0][0];
                    var y = sectors[1][0];
                    if (this.inRoot(sectors)) {
                        this.root.insert(shape, bbox);
                    } else {
                        var rootMap = this.rootMap;
                        if (!rootMap[x]) {
                            rootMap[x] = {};
                        }
                        if (!rootMap[x][y]) {
                            rootMap[x][y] = new QuadNode(new Rect([
                                x * ROOT_SIZE,
                                y * ROOT_SIZE
                            ], [
                                ROOT_SIZE,
                                ROOT_SIZE
                            ]));
                        }
                        rootMap[x][y].insert(shape, bbox);
                    }
                }
            },
            remove: function (element) {
                var this$1 = this;
                element.removeObserver(this);
                if (element.nodeType === 'Group') {
                    var children = element.children;
                    for (var idx = 0; idx < children.length; idx++) {
                        this$1.remove(children[idx]);
                    }
                } else if (element._quadNode) {
                    element._quadNode.remove(element);
                    delete element._quadNode;
                }
            },
            inRoot: function (sectors) {
                return sectors[0].length > 1 || sectors[1].length > 1;
            },
            getSectors: function (rect) {
                var bottomRight = rect.bottomRight();
                var bottomX = Math.floor(bottomRight.x / ROOT_SIZE);
                var bottomY = Math.floor(bottomRight.y / ROOT_SIZE);
                var sectors = [
                    [],
                    []
                ];
                for (var x = Math.floor(rect.origin.x / ROOT_SIZE); x <= bottomX; x++) {
                    sectors[0].push(x);
                }
                for (var y = Math.floor(rect.origin.y / ROOT_SIZE); y <= bottomY; y++) {
                    sectors[1].push(y);
                }
                return sectors;
            }
        });
        function zIndexComparer(x1, x2) {
            if (x1._zIndex < x2._zIndex) {
                return 1;
            }
            if (x1._zIndex > x2._zIndex) {
                return -1;
            }
            return 0;
        }
        var SurfaceCursor = Class.extend({
            init: function (surface) {
                surface.bind('mouseenter', this._mouseenter.bind(this));
                surface.bind('mouseleave', this._mouseleave.bind(this));
                this.element = surface.element;
            },
            clear: function () {
                this._resetCursor();
            },
            destroy: function () {
                this._resetCursor();
                delete this.element;
            },
            _mouseenter: function (e) {
                var cursor = this._shapeCursor(e);
                if (!cursor) {
                    this._resetCursor();
                } else {
                    if (!this._current) {
                        this._defaultCursor = this._getCursor();
                    }
                    this._setCursor(cursor);
                }
            },
            _mouseleave: function () {
                this._resetCursor();
            },
            _shapeCursor: function (e) {
                var shape = e.element;
                while (shape && !defined(shape.options.cursor)) {
                    shape = shape.parent;
                }
                if (shape) {
                    return shape.options.cursor;
                }
            },
            _getCursor: function () {
                if (this.element) {
                    return this.element.style.cursor;
                }
            },
            _setCursor: function (cursor) {
                if (this.element) {
                    this.element.style.cursor = cursor;
                    this._current = cursor;
                }
            },
            _resetCursor: function () {
                if (this._current) {
                    this._setCursor(this._defaultCursor || '');
                    delete this._current;
                }
            }
        });
        var Surface$3 = Surface.extend({
            init: function (element, options) {
                Surface.fn.init.call(this, element, options);
                this.element.innerHTML = this._template(this);
                var canvas = this.element.firstElementChild;
                var size = elementSize(element);
                canvas.width = size.width;
                canvas.height = size.height;
                this._rootElement = canvas;
                this._root = new RootNode$2(canvas, size);
                this._mouseTrackHandler = this._trackMouse.bind(this);
                bindEvents(this.element, {
                    click: this._mouseTrackHandler,
                    mousemove: this._mouseTrackHandler
                });
            },
            destroy: function () {
                Surface.fn.destroy.call(this);
                if (this._root) {
                    this._root.destroy();
                    this._root = null;
                }
                if (this._searchTree) {
                    this._searchTree.clear();
                    delete this._searchTree;
                }
                if (this._cursor) {
                    this._cursor.destroy();
                    delete this._cursor;
                }
                unbindEvents(this.element, {
                    click: this._mouseTrackHandler,
                    mousemove: this._mouseTrackHandler
                });
            },
            draw: function (element) {
                Surface.fn.draw.call(this, element);
                this._root.load([element], undefined, this.options.cors);
                if (this._searchTree) {
                    this._searchTree.add([element]);
                }
            },
            clear: function () {
                Surface.fn.clear.call(this);
                this._root.clear();
                if (this._searchTree) {
                    this._searchTree.clear();
                }
                if (this._cursor) {
                    this._cursor.clear();
                }
            },
            eventTarget: function (e) {
                if (this._searchTree) {
                    var point = this._surfacePoint(e);
                    var shape = this._searchTree.pointShape(point);
                    return shape;
                }
            },
            image: function () {
                var ref = this;
                var root = ref._root;
                var rootElement = ref._rootElement;
                var loadingStates = [];
                root.traverse(function (childNode) {
                    if (childNode.loading) {
                        loadingStates.push(childNode.loading);
                    }
                });
                var promise = createPromise();
                var resolveDataURL = function () {
                    root._invalidate();
                    try {
                        var data = rootElement.toDataURL();
                        promise.resolve(data);
                    } catch (e) {
                        promise.reject(e);
                    }
                };
                promiseAll(loadingStates).then(resolveDataURL, resolveDataURL);
                return promise;
            },
            suspendTracking: function () {
                Surface.fn.suspendTracking.call(this);
                if (this._searchTree) {
                    this._searchTree.clear();
                    delete this._searchTree;
                }
            },
            resumeTracking: function () {
                Surface.fn.resumeTracking.call(this);
                if (!this._searchTree) {
                    this._searchTree = new ShapesQuadTree();
                    var childNodes = this._root.childNodes;
                    var rootElements = [];
                    for (var idx = 0; idx < childNodes.length; idx++) {
                        rootElements.push(childNodes[idx].srcElement);
                    }
                    this._searchTree.add(rootElements);
                }
            },
            _resize: function () {
                this._rootElement.width = this._size.width;
                this._rootElement.height = this._size.height;
                this._root.size = this._size;
                this._root.invalidate();
            },
            _template: function () {
                return '<canvas style=\'width: 100%; height: 100%;\'></canvas>';
            },
            _enableTracking: function () {
                this._searchTree = new ShapesQuadTree();
                this._cursor = new SurfaceCursor(this);
                Surface.fn._enableTracking.call(this);
            },
            _trackMouse: function (e) {
                if (this._suspendedTracking) {
                    return;
                }
                var shape = this.eventTarget(e);
                if (e.type !== 'click') {
                    var currentShape = this._currentShape;
                    if (currentShape && currentShape !== shape) {
                        this.trigger('mouseleave', {
                            element: currentShape,
                            originalEvent: e,
                            type: 'mouseleave'
                        });
                    }
                    if (shape && currentShape !== shape) {
                        this.trigger('mouseenter', {
                            element: shape,
                            originalEvent: e,
                            type: 'mouseenter'
                        });
                    }
                    this.trigger('mousemove', {
                        element: shape,
                        originalEvent: e,
                        type: 'mousemove'
                    });
                    this._currentShape = shape;
                } else if (shape) {
                    this.trigger('click', {
                        element: shape,
                        originalEvent: e,
                        type: 'click'
                    });
                }
            }
        });
        Surface$3.prototype.type = 'canvas';
        if (typeof document !== 'undefined' && document.createElement('canvas').getContext) {
            Surface.support.canvas = true;
            SurfaceFactory.current.register('canvas', Surface$3, 20);
        }
        function addGradientStops(gradient, stops) {
            for (var idx = 0; idx < stops.length; idx++) {
                var stop = stops[idx];
                var color = suix.parseColor(stop.color());
                color.a *= stop.opacity();
                gradient.addColorStop(stop.offset(), color.toCssRgba());
            }
        }
        var PathNode$2 = Node$2.extend({
            renderTo: function (ctx) {
                ctx.save();
                this.setTransform(ctx);
                this.setClip(ctx);
                this.setOpacity(ctx);
                ctx.beginPath();
                this.renderPoints(ctx, this.srcElement);
                this.setLineDash(ctx);
                this.setLineCap(ctx);
                this.setLineJoin(ctx);
                this.setFill(ctx);
                this.setStroke(ctx);
                ctx.restore();
            },
            setFill: function (ctx) {
                var fill = this.srcElement.options.fill;
                var hasFill = false;
                if (fill) {
                    if (fill.nodeType === 'Gradient') {
                        this.setGradientFill(ctx, fill);
                        hasFill = true;
                    } else if (!isTransparent(fill.color)) {
                        ctx.fillStyle = fill.color;
                        ctx.save();
                        this.globalAlpha(ctx, fill.opacity);
                        ctx.fill();
                        ctx.restore();
                        hasFill = true;
                    }
                }
                return hasFill;
            },
            setGradientFill: function (ctx, fill) {
                var bbox = this.srcElement.rawBBox();
                var gradient;
                if (fill instanceof LinearGradient) {
                    var start = fill.start();
                    var end = fill.end();
                    gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
                } else if (fill instanceof RadialGradient) {
                    var center = fill.center();
                    gradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, fill.radius());
                }
                addGradientStops(gradient, fill.stops);
                ctx.save();
                if (!fill.userSpace()) {
                    ctx.transform(bbox.width(), 0, 0, bbox.height(), bbox.origin.x, bbox.origin.y);
                }
                ctx.fillStyle = gradient;
                ctx.fill();
                ctx.restore();
            },
            setStroke: function (ctx) {
                var stroke = this.srcElement.options.stroke;
                if (stroke && !isTransparent(stroke.color) && stroke.width > 0) {
                    ctx.strokeStyle = stroke.color;
                    ctx.lineWidth = valueOrDefault(stroke.width, 1);
                    ctx.save();
                    this.globalAlpha(ctx, stroke.opacity);
                    ctx.stroke();
                    ctx.restore();
                    return true;
                }
            },
            dashType: function () {
                var stroke = this.srcElement.options.stroke;
                if (stroke && stroke.dashType) {
                    return stroke.dashType.toLowerCase();
                }
            },
            setLineDash: function (ctx) {
                var dashType = this.dashType();
                if (dashType && dashType !== SOLID) {
                    var dashArray = DASH_ARRAYS[dashType];
                    if (ctx.setLineDash) {
                        ctx.setLineDash(dashArray);
                    } else {
                        ctx.mozDash = dashArray;
                        ctx.webkitLineDash = dashArray;
                    }
                }
            },
            setLineCap: function (ctx) {
                var dashType = this.dashType();
                var stroke = this.srcElement.options.stroke;
                if (dashType && dashType !== SOLID) {
                    ctx.lineCap = BUTT;
                } else if (stroke && stroke.lineCap) {
                    ctx.lineCap = stroke.lineCap;
                }
            },
            setLineJoin: function (ctx) {
                var stroke = this.srcElement.options.stroke;
                if (stroke && stroke.lineJoin) {
                    ctx.lineJoin = stroke.lineJoin;
                }
            },
            renderPoints: function (ctx, path) {
                renderPath(ctx, path);
            }
        });
        NODE_MAP$2.Path = PathNode$2;
        var ArcNode$2 = PathNode$2.extend({
            renderPoints: function (ctx) {
                var path = this.srcElement.toPath();
                renderPath(ctx, path);
            }
        });
        NODE_MAP$2.Arc = ArcNode$2;
        var CircleNode$2 = PathNode$2.extend({
            renderPoints: function (ctx) {
                var ref = this.srcElement.geometry();
                var center = ref.center;
                var radius = ref.radius;
                ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
            }
        });
        NODE_MAP$2.Circle = CircleNode$2;
        var RectNode$2 = PathNode$2.extend({
            renderPoints: function (ctx) {
                var ref = this.srcElement.geometry();
                var origin = ref.origin;
                var size = ref.size;
                ctx.rect(origin.x, origin.y, size.width, size.height);
            }
        });
        NODE_MAP$2.Rect = RectNode$2;
        var ImageNode$2 = PathNode$2.extend({
            init: function (srcElement, cors) {
                PathNode$2.fn.init.call(this, srcElement);
                this.onLoad = this.onLoad.bind(this);
                this.onError = this.onError.bind(this);
                this.loading = createPromise();
                var img = this.img = new Image();
                if (cors && !/^data:/i.test(srcElement.src())) {
                    img.crossOrigin = cors;
                }
                img.src = srcElement.src();
                if (img.complete) {
                    this.onLoad();
                } else {
                    img.onload = this.onLoad;
                    img.onerror = this.onError;
                }
            },
            renderTo: function (ctx) {
                if (this.loading.state() === 'resolved') {
                    ctx.save();
                    this.setTransform(ctx);
                    this.setClip(ctx);
                    this.drawImage(ctx);
                    ctx.restore();
                }
            },
            optionsChange: function (e) {
                if (e.field === 'src') {
                    this.loading = createPromise();
                    this.img.src = this.srcElement.src();
                } else {
                    PathNode$2.fn.optionsChange.call(this, e);
                }
            },
            onLoad: function () {
                this.loading.resolve();
                this.invalidate();
            },
            onError: function () {
                this.loading.reject(new Error('Unable to load image \'' + this.img.src + '\'. Check for connectivity and verify CORS headers.'));
            },
            drawImage: function (ctx) {
                var rect = this.srcElement.rect();
                var topLeft = rect.topLeft();
                ctx.drawImage(this.img, topLeft.x, topLeft.y, rect.width(), rect.height());
            }
        });
        NODE_MAP$2.Image = ImageNode$2;
        var TextNode$2 = PathNode$2.extend({
            renderTo: function (ctx) {
                var text = this.srcElement;
                var pos = text.position();
                var size = text.measure();
                ctx.save();
                this.setTransform(ctx);
                this.setClip(ctx);
                this.setOpacity(ctx);
                ctx.beginPath();
                ctx.font = text.options.font;
                ctx.textAlign = 'left';
                if (this.setFill(ctx)) {
                    ctx.fillText(text.content(), pos.x, pos.y + size.baseline);
                }
                if (this.setStroke(ctx)) {
                    this.setLineDash(ctx);
                    ctx.strokeText(text.content(), pos.x, pos.y + size.baseline);
                }
                ctx.restore();
            }
        });
        NODE_MAP$2.Text = TextNode$2;
        var MultiPathNode$2 = PathNode$2.extend({
            renderPoints: function (ctx) {
                var paths = this.srcElement.paths;
                for (var i = 0; i < paths.length; i++) {
                    renderPath(ctx, paths[i]);
                }
            }
        });
        NODE_MAP$2.MultiPath = MultiPathNode$2;
        var canvas = {
            Surface: Surface$3,
            RootNode: RootNode$2,
            Node: Node$2,
            GroupNode: GroupNode$2,
            ArcNode: ArcNode$2,
            CircleNode: CircleNode$2,
            RectNode: RectNode$2,
            ImageNode: ImageNode$2,
            TextNode: TextNode$2,
            PathNode: PathNode$2,
            MultiPathNode: MultiPathNode$2
        };
        function exportImage(group, options) {
            var defaults = {
                width: '800px',
                height: '600px',
                cors: 'Anonymous'
            };
            var exportRoot = group;
            var bbox = group.clippedBBox();
            if (bbox) {
                var origin = bbox.getOrigin();
                exportRoot = new Group();
                exportRoot.transform(transform().translate(-origin.x, -origin.y));
                exportRoot.children.push(group);
                var size = bbox.getSize();
                defaults.width = size.width + 'px';
                defaults.height = size.height + 'px';
            }
            var surfaceOptions = $.extend(defaults, options);
            var container = document.createElement('div');
            var style = container.style;
            style.display = 'none';
            style.width = surfaceOptions.width;
            style.height = surfaceOptions.height;
            document.body.appendChild(container);
            var surface = new Surface$3(container, surfaceOptions);
            surface.suspendTracking();
            surface.draw(exportRoot);
            var promise = surface.image();
            var destroy = function () {
                surface.destroy();
                document.body.removeChild(container);
            };
            promise.then(destroy, destroy);
            return promise;
        }
        function exportSVG(group, options) {
            var svg = exportGroup(group);
            if (!options || !options.raw) {
                svg = 'data:image/svg+xml;base64,' + encodeBase64(svg);
            }
            return createPromise().resolve(svg);
        }
        var browser = supportBrowser || {};
        function slice$1(thing) {
            return Array.prototype.slice.call(thing);
        }
        var SUIX_PSEUDO_ELEMENT = 'SUIX-PSEUDO-ELEMENT';
        var IMAGE_CACHE = {};
        var nodeInfo = {};
        nodeInfo._root = nodeInfo;
        var inBrowser = typeof window !== 'undefined';
        var microsoft = inBrowser ? browser.msie || browser.edge : false;
        var TextRect = Text.extend({
            init: function (str, rect, options) {
                Text.fn.init.call(this, str, rect.getOrigin(), options);
                this._pdfRect = rect;
            },
            rect: function () {
                return this._pdfRect;
            },
            rawBBox: function () {
                return this._pdfRect;
            }
        });
        function addClass(el, cls) {
            if (el.classList) {
                el.classList.add(cls);
            } else {
                el.className += ' ' + cls;
            }
        }
        function removeClass(el, cls) {
            if (el.classList) {
                el.classList.remove(cls);
            } else {
                el.className = el.className.split(/\s+/).reduce(function (a, word) {
                    if (word != cls) {
                        a.push(word);
                    }
                    return a;
                }, []).join(' ');
            }
        }
        function setCSS(el, styles) {
            Object.keys(styles).forEach(function (key) {
                el.style[key] = styles[key];
            });
        }
        var matches = typeof Element !== 'undefined' && Element.prototype && function (p) {
            if (p.matches) {
                return function (el, selector) {
                    return el.matches(selector);
                };
            }
            if (p.webkitMatchesSelector) {
                return function (el, selector) {
                    return el.webkitMatchesSelector(selector);
                };
            }
            if (p.mozMatchesSelector) {
                return function (el, selector) {
                    return el.mozMatchesSelector(selector);
                };
            }
            if (p.msMatchesSelector) {
                return function (el, selector) {
                    return el.msMatchesSelector(selector);
                };
            }
            return function (s) {
                return [].indexOf.call(document.querySelectorAll(s), this) !== -1;
            };
        }(Element.prototype);
        function closest(el, selector) {
            if (el.closest) {
                return el.closest(selector);
            }
            while (el && !/^\[object (?:HTML)?Document\]$/.test(String(el))) {
                if (el.nodeType == 1 && matches(el, selector)) {
                    return el;
                }
                el = el.parentNode;
            }
        }
        var cloneNodes = function ($) {
            if ($) {
                return function cloneNodes(el) {
                    var clone = el.cloneNode(false);
                    if (el.nodeType == 1) {
                        var $el = $(el), $clone = $(clone), i;
                        var data = $el.data();
                        for (i in data) {
                            $clone.data(i, data[i]);
                        }
                        if (/^canvas$/i.test(el.tagName)) {
                            clone.getContext('2d').drawImage(el, 0, 0);
                        } else if (/^(?:input|select|textarea|option)$/i.test(el.tagName)) {
                            clone.removeAttribute('id');
                            clone.removeAttribute('name');
                            if (!/^textarea$/i.test(el.tagName)) {
                                clone.value = el.value;
                            }
                            clone.checked = el.checked;
                            clone.selected = el.selected;
                        }
                        for (i = el.firstChild; i; i = i.nextSibling) {
                            clone.appendChild(cloneNodes(i));
                        }
                    }
                    return clone;
                };
            } else {
                return function cloneNodes(el) {
                    var clone = function dive(node) {
                        var clone = node.cloneNode(false);
                        if (node._suixExportVisual) {
                            clone._suixExportVisual = node._suixExportVisual;
                        }
                        for (var i = node.firstChild; i; i = i.nextSibling) {
                            clone.appendChild(dive(i));
                        }
                        return clone;
                    }(el);
                    var canvases = el.querySelectorAll('canvas');
                    if (canvases.length) {
                        slice$1(clone.querySelectorAll('canvas')).forEach(function (canvas$$1, i) {
                            canvas$$1.getContext('2d').drawImage(canvases[i], 0, 0);
                        });
                    }
                    var orig = el.querySelectorAll('input, select, textarea, option');
                    slice$1(clone.querySelectorAll('input, select, textarea, option')).forEach(function (el, i) {
                        el.removeAttribute('id');
                        el.removeAttribute('name');
                        if (!/^textarea$/i.test(el.tagName)) {
                            el.value = orig[i].value;
                        }
                        el.checked = orig[i].checked;
                        el.selected = orig[i].selected;
                    });
                    return clone;
                };
            }
        }(typeof window !== 'undefined' && window.suix && window.suix.jQuery);
        function getXY(thing) {
            if (typeof thing == 'number') {
                return {
                    x: thing,
                    y: thing
                };
            }
            if (Array.isArray(thing)) {
                return {
                    x: thing[0],
                    y: thing[1]
                };
            }
            return {
                x: thing.x,
                y: thing.y
            };
        }
        function drawDOM(element, options) {
            if (!options) {
                options = {};
            }
            var promise = createPromise();
            if (!element) {
                return promise.reject('No element to export');
            }
            if (typeof window.getComputedStyle != 'function') {
                throw new Error('window.getComputedStyle is missing.  You are using an unsupported browser, or running in IE8 compatibility mode.  Drawing HTML is supported in Chrome, Firefox, Safari and IE9+.');
            }
            suix.pdf.defineFont(getFontFaces(element.ownerDocument));
            var scale = getXY(options.scale || 1);
            function doOne(element) {
                var group = new Group();
                var pos = element.getBoundingClientRect();
                setTransform(group, [
                    scale.x,
                    0,
                    0,
                    scale.y,
                    -pos.left * scale.x,
                    -pos.top * scale.y
                ]);
                nodeInfo._clipbox = false;
                nodeInfo._matrix = Matrix.unit();
                nodeInfo._stackingContext = {
                    element: element,
                    group: group
                };
                if (options.avoidLinks === true) {
                    nodeInfo._avoidLinks = 'a';
                } else {
                    nodeInfo._avoidLinks = options.avoidLinks;
                }
                addClass(element, 'k-pdf-export');
                renderElement(element, group);
                removeClass(element, 'k-pdf-export');
                return group;
            }
            cacheImages(element, function () {
                var forceBreak = options && options.forcePageBreak;
                var hasPaperSize = options && options.paperSize && options.paperSize != 'auto';
                var paperOptions = suix.pdf.getPaperOptions(function (key, def) {
                    if (key == 'paperSize') {
                        return hasPaperSize ? options[key] : 'A4';
                    }
                    return key in options ? options[key] : def;
                });
                var pageWidth = hasPaperSize && paperOptions.paperSize[0];
                var pageHeight = hasPaperSize && paperOptions.paperSize[1];
                var margin = options.margin && paperOptions.margin;
                var hasMargin = Boolean(margin);
                if (forceBreak || pageHeight) {
                    if (!margin) {
                        margin = {
                            left: 0,
                            top: 0,
                            right: 0,
                            bottom: 0
                        };
                    }
                    if (pageWidth) {
                        pageWidth /= scale.x;
                    }
                    if (pageHeight) {
                        pageHeight /= scale.y;
                    }
                    margin.left /= scale.x;
                    margin.right /= scale.x;
                    margin.top /= scale.y;
                    margin.bottom /= scale.y;
                    var group = new Group({
                        pdf: {
                            multiPage: true,
                            paperSize: hasPaperSize ? paperOptions.paperSize : 'auto',
                            _ignoreMargin: hasMargin
                        }
                    });
                    handlePageBreaks(function (x) {
                        if (options.progress) {
                            var canceled = false, pageNum = 0;
                            (function next() {
                                if (pageNum < x.pages.length) {
                                    var page = doOne(x.pages[pageNum]);
                                    group.append(page);
                                    options.progress({
                                        page: page,
                                        pageNum: ++pageNum,
                                        totalPages: x.pages.length,
                                        cancel: function () {
                                            canceled = true;
                                        }
                                    });
                                    if (!canceled) {
                                        setTimeout(next);
                                    } else {
                                        x.container.parentNode.removeChild(x.container);
                                    }
                                } else {
                                    x.container.parentNode.removeChild(x.container);
                                    promise.resolve(group);
                                }
                            }());
                        } else {
                            x.pages.forEach(function (page) {
                                group.append(doOne(page));
                            });
                            x.container.parentNode.removeChild(x.container);
                            promise.resolve(group);
                        }
                    }, element, forceBreak, pageWidth ? pageWidth - margin.left - margin.right : null, pageHeight ? pageHeight - margin.top - margin.bottom : null, margin, options);
                } else {
                    promise.resolve(doOne(element));
                }
            });
            function makeTemplate(template$$1) {
                if (template$$1 != null) {
                    if (typeof template$$1 == 'string') {
                        template$$1 = suix.template(template$$1.replace(/^\s+|\s+$/g, ''));
                    }
                    if (typeof template$$1 == 'function') {
                        return function (data) {
                            var el = template$$1(data);
                            if (el && typeof el == 'string') {
                                var div = document.createElement('div');
                                div.innerHTML = el;
                                el = div.firstElementChild;
                            }
                            return el;
                        };
                    }
                    return function () {
                        return template$$1.cloneNode(true);
                    };
                }
            }
            function handlePageBreaks(callback, element, forceBreak, pageWidth, pageHeight, margin, options) {
                var template$$1 = makeTemplate(options.template);
                var doc = element.ownerDocument;
                var pages = [];
                var copy = options._destructive ? element : cloneNodes(element);
                var container = doc.createElement('SUIX-PDF-DOCUMENT');
                var adjust = 0;
                slice$1(copy.querySelectorAll('tfoot')).forEach(function (tfoot) {
                    tfoot.parentNode.appendChild(tfoot);
                });
                slice$1(copy.querySelectorAll('ol')).forEach(function (ol) {
                    slice$1(ol.children).forEach(function (li, index) {
                        li.setAttribute('suix-split-index', index);
                    });
                });
                setCSS(container, {
                    display: 'block',
                    position: 'absolute',
                    boxSizing: 'content-box',
                    left: '-10000px',
                    top: '-10000px'
                });
                if (pageWidth) {
                    setCSS(container, {
                        width: pageWidth + 'px',
                        paddingLeft: margin.left + 'px',
                        paddingRight: margin.right + 'px'
                    });
                    setCSS(copy, { overflow: 'hidden' });
                }
                element.parentNode.insertBefore(container, element);
                container.appendChild(copy);
                if (options.beforePageBreak) {
                    setTimeout(function () {
                        options.beforePageBreak(container, doPageBreak);
                    }, 15);
                } else {
                    setTimeout(doPageBreak, 15);
                }
                function doPageBreak() {
                    if (forceBreak != '-' || pageHeight) {
                        splitElement(copy);
                    }
                    {
                        var page = makePage();
                        copy.parentNode.insertBefore(page, copy);
                        page.appendChild(copy);
                    }
                    if (template$$1) {
                        pages.forEach(function (page, i) {
                            var el = template$$1({
                                element: page,
                                pageNum: i + 1,
                                totalPages: pages.length
                            });
                            if (el) {
                                page.appendChild(el);
                            }
                        });
                    }
                    cacheImages(pages, function () {
                        whenImagesAreActuallyLoaded(pages, function () {
                            callback({
                                pages: pages,
                                container: container
                            });
                        });
                    });
                }
                function keepTogether(el) {
                    if (options.keepTogether && matches(el, options.keepTogether) && el.offsetHeight <= pageHeight - adjust) {
                        return true;
                    }
                    var tag = el.tagName;
                    if (/^h[1-6]$/i.test(tag) && el.offsetHeight >= pageHeight - adjust) {
                        return false;
                    }
                    return el.getAttribute('data-suix-chart') || /^(?:img|tr|thead|th|tfoot|iframe|svg|object|canvas|input|textarea|select|video|h[1-6])/i.test(el.tagName);
                }
                function splitElement(element) {
                    if (element.tagName == 'TABLE') {
                        setCSS(element, { tableLayout: 'fixed' });
                    }
                    if (keepTogether(element)) {
                        return;
                    }
                    var style = getComputedStyle(element);
                    var bottomPadding = parseFloat(getPropertyValue(style, 'padding-bottom'));
                    var bottomBorder = parseFloat(getPropertyValue(style, 'border-bottom-width'));
                    var saveAdjust = adjust;
                    adjust += bottomPadding + bottomBorder;
                    var isFirst = true;
                    for (var el = element.firstChild; el; el = el.nextSibling) {
                        if (el.nodeType == 1) {
                            isFirst = false;
                            if (matches(el, forceBreak)) {
                                breakAtElement(el);
                                continue;
                            }
                            if (!pageHeight) {
                                splitElement(el);
                                continue;
                            }
                            if (!/^(?:static|relative)$/.test(getPropertyValue(getComputedStyle(el), 'position'))) {
                                continue;
                            }
                            var fall = fallsOnMargin(el);
                            if (fall == 1) {
                                breakAtElement(el);
                            } else if (fall) {
                                if (keepTogether(el)) {
                                    breakAtElement(el);
                                } else {
                                    splitElement(el);
                                }
                            } else {
                                splitElement(el);
                            }
                        } else if (el.nodeType == 3 && pageHeight) {
                            splitText(el, isFirst);
                            isFirst = false;
                        }
                    }
                    adjust = saveAdjust;
                }
                function firstInParent(el) {
                    var p = el.parentNode, first = p.firstChild;
                    if (el === first) {
                        return true;
                    }
                    if (el === p.children[0]) {
                        if (first.nodeType == 7 || first.nodeType == 8) {
                            return true;
                        }
                        if (first.nodeType == 3) {
                            return !/\S/.test(first.data);
                        }
                    }
                    return false;
                }
                function breakAtElement(el) {
                    if (el.nodeType == 1 && el !== copy && firstInParent(el)) {
                        return breakAtElement(el.parentNode);
                    }
                    var table, colgroup, thead, grid, gridHead;
                    table = closest(el, 'table');
                    colgroup = table && table.querySelector('colgroup');
                    if (options.repeatHeaders) {
                        thead = table && table.querySelector('thead');
                        grid = closest(el, '.k-grid.k-widget');
                        if (grid && grid.querySelector('.k-auto-scrollable')) {
                            gridHead = grid.querySelector('.k-grid-header');
                        }
                    }
                    var page = makePage();
                    var range = doc.createRange();
                    range.setStartBefore(copy);
                    range.setEndBefore(el);
                    page.appendChild(range.extractContents());
                    copy.parentNode.insertBefore(page, copy);
                    preventBulletOnListItem(el.parentNode);
                    if (table) {
                        table = closest(el, 'table');
                        if (options.repeatHeaders && thead) {
                            table.insertBefore(thead.cloneNode(true), table.firstChild);
                        }
                        if (colgroup) {
                            table.insertBefore(colgroup.cloneNode(true), table.firstChild);
                        }
                    }
                    if (options.repeatHeaders && gridHead) {
                        grid = closest(el, '.k-grid.k-widget');
                        grid.insertBefore(gridHead.cloneNode(true), grid.firstChild);
                    }
                }
                function makePage() {
                    var page = doc.createElement('SUIX-PDF-PAGE');
                    setCSS(page, {
                        display: 'block',
                        boxSizing: 'content-box',
                        width: pageWidth ? pageWidth + 'px' : 'auto',
                        padding: margin.top + 'px ' + margin.right + 'px ' + margin.bottom + 'px ' + margin.left + 'px',
                        position: 'relative',
                        height: pageHeight ? pageHeight + 'px' : 'auto',
                        overflow: pageHeight || pageWidth ? 'hidden' : 'visible',
                        clear: 'both'
                    });
                    if (options && options.pageClassName) {
                        page.className = options.pageClassName;
                    }
                    pages.push(page);
                    return page;
                }
                function fallsOnMargin(thing) {
                    var box = thing.getBoundingClientRect();
                    if (box.width === 0 || box.height === 0) {
                        return 0;
                    }
                    var top = copy.getBoundingClientRect().top;
                    var available = pageHeight - adjust;
                    return box.height > available ? 3 : box.top - top > available ? 1 : box.bottom - top > available ? 2 : 0;
                }
                function splitText(node, isFirst) {
                    if (!/\S/.test(node.data)) {
                        return;
                    }
                    var len = node.data.length;
                    var range = doc.createRange();
                    range.selectNodeContents(node);
                    var fall = fallsOnMargin(range);
                    if (!fall) {
                        return;
                    }
                    var nextnode = node;
                    if (fall == 1) {
                        if (isFirst) {
                            breakAtElement(node.parentNode);
                        } else {
                            breakAtElement(node);
                        }
                    } else {
                        (function findEOP(min, pos, max) {
                            range.setEnd(node, pos);
                            if (min == pos || pos == max) {
                                return pos;
                            }
                            if (fallsOnMargin(range)) {
                                return findEOP(min, min + pos >> 1, pos);
                            } else {
                                return findEOP(pos, pos + max >> 1, max);
                            }
                        }(0, len >> 1, len));
                        if (!/\S/.test(range.toString()) && isFirst) {
                            breakAtElement(node.parentNode);
                        } else {
                            nextnode = node.splitText(range.endOffset);
                            var page = makePage();
                            range.setStartBefore(copy);
                            page.appendChild(range.extractContents());
                            copy.parentNode.insertBefore(page, copy);
                            preventBulletOnListItem(nextnode.parentNode);
                        }
                    }
                    splitText(nextnode);
                }
                function preventBulletOnListItem(el) {
                    var li = closest(el, 'li');
                    if (li) {
                        li.setAttribute('suix-no-bullet', '1');
                        preventBulletOnListItem(li.parentNode);
                    }
                }
            }
            return promise;
        }
        drawDOM.getFontFaces = getFontFaces;
        drawDOM.drawText = function (element) {
            var group = new Group();
            nodeInfo._clipbox = false;
            nodeInfo._matrix = Matrix.unit();
            nodeInfo._stackingContext = {
                element: element,
                group: group
            };
            pushNodeInfo(element, getComputedStyle(element), group);
            if (element.firstChild.nodeType == 3) {
                renderText(element, element.firstChild, group);
            } else {
                _renderElement(element, group);
            }
            popNodeInfo();
            return group;
        };
        var parseBackgroundImage = function () {
            var tok_linear_gradient = /^((-webkit-|-moz-|-o-|-ms-)?linear-gradient\s*)\(/;
            var tok_percent = /^([-0-9.]+%)/;
            var tok_length = /^([-0-9.]+px)/;
            var tok_keyword = /^(left|right|top|bottom|to|center)\W/;
            var tok_angle = /^([-0-9.]+(deg|grad|rad|turn)|0)/;
            var tok_whitespace = /^(\s+)/;
            var tok_popen = /^(\()/;
            var tok_pclose = /^(\))/;
            var tok_comma = /^(,)/;
            var tok_url = /^(url)\(/;
            var tok_content = /^(.*?)\)/;
            var cache1 = {}, cache2 = {};
            function parse(input) {
                var orig = input;
                if (hasOwnProperty(cache1, orig)) {
                    return cache1[orig];
                }
                function skip_ws() {
                    var m = tok_whitespace.exec(input);
                    if (m) {
                        input = input.substr(m[1].length);
                    }
                }
                function read(token) {
                    skip_ws();
                    var m = token.exec(input);
                    if (m) {
                        input = input.substr(m[1].length);
                        return m[1];
                    }
                }
                function read_stop() {
                    var color = suix.parseColor(input, true);
                    var length, percent;
                    if (color) {
                        var match = /^#[0-9a-f]+/i.exec(input) || /^rgba?\(.*?\)/i.exec(input) || /^..*?\b/.exec(input);
                        input = input.substr(match[0].length);
                        color = color.toRGB();
                        if (!(length = read(tok_length))) {
                            percent = read(tok_percent);
                        }
                        return {
                            color: color,
                            length: length,
                            percent: percent
                        };
                    }
                }
                function read_linear_gradient(propName) {
                    var angle;
                    var to1, to2;
                    var stops = [];
                    var reverse = false;
                    if (read(tok_popen)) {
                        angle = read(tok_angle);
                        if (angle == '0') {
                            angle = '0deg';
                        }
                        if (angle) {
                            angle = parseAngle(angle);
                            read(tok_comma);
                        } else {
                            to1 = read(tok_keyword);
                            if (to1 == 'to') {
                                to1 = read(tok_keyword);
                            } else if (to1 && /^-/.test(propName)) {
                                reverse = true;
                            }
                            to2 = read(tok_keyword);
                            read(tok_comma);
                        }
                        if (/-moz-/.test(propName) && angle == null && to1 == null) {
                            var x = read(tok_percent), y = read(tok_percent);
                            reverse = true;
                            if (x == '0%') {
                                to1 = 'left';
                            } else if (x == '100%') {
                                to1 = 'right';
                            }
                            if (y == '0%') {
                                to2 = 'top';
                            } else if (y == '100%') {
                                to2 = 'bottom';
                            }
                            read(tok_comma);
                        }
                        while (input && !read(tok_pclose)) {
                            var stop = read_stop();
                            if (!stop) {
                                break;
                            }
                            stops.push(stop);
                            read(tok_comma);
                        }
                        return {
                            type: 'linear',
                            angle: angle,
                            to: to1 && to2 ? to1 + ' ' + to2 : to1 ? to1 : to2 ? to2 : null,
                            stops: stops,
                            reverse: reverse
                        };
                    }
                }
                function read_url() {
                    if (read(tok_popen)) {
                        var url = read(tok_content);
                        url = url.replace(/^['"]+|["']+$/g, '');
                        read(tok_pclose);
                        return {
                            type: 'url',
                            url: url
                        };
                    }
                }
                var tok;
                if (tok = read(tok_linear_gradient)) {
                    tok = read_linear_gradient(tok);
                } else if (tok = read(tok_url)) {
                    tok = read_url();
                }
                return cache1[orig] = tok || { type: 'none' };
            }
            return function (input) {
                if (hasOwnProperty(cache2, input)) {
                    return cache2[input];
                }
                return cache2[input] = splitProperty(input).map(parse);
            };
        }();
        var splitProperty = function () {
            var cache = {};
            return function (input, separator) {
                if (!separator) {
                    separator = /^\s*,\s*/;
                }
                var cacheKey = input + separator;
                if (hasOwnProperty(cache, cacheKey)) {
                    return cache[cacheKey];
                }
                var ret = [];
                var last$$1 = 0, pos = 0;
                var in_paren = 0;
                var in_string = false;
                var m;
                function looking_at(rx) {
                    return m = rx.exec(input.substr(pos));
                }
                function trim(str) {
                    return str.replace(/^\s+|\s+$/g, '');
                }
                while (pos < input.length) {
                    if (!in_string && looking_at(/^[\(\[\{]/)) {
                        in_paren++;
                        pos++;
                    } else if (!in_string && looking_at(/^[\)\]\}]/)) {
                        in_paren--;
                        pos++;
                    } else if (!in_string && looking_at(/^[\"\']/)) {
                        in_string = m[0];
                        pos++;
                    } else if (in_string == '\'' && looking_at(/^\\\'/)) {
                        pos += 2;
                    } else if (in_string == '"' && looking_at(/^\\\"/)) {
                        pos += 2;
                    } else if (in_string == '\'' && looking_at(/^\'/)) {
                        in_string = false;
                        pos++;
                    } else if (in_string == '"' && looking_at(/^\"/)) {
                        in_string = false;
                        pos++;
                    } else if (looking_at(separator)) {
                        if (!in_string && !in_paren && pos > last$$1) {
                            ret.push(trim(input.substring(last$$1, pos)));
                            last$$1 = pos + m[0].length;
                        }
                        pos += m[0].length;
                    } else {
                        pos++;
                    }
                }
                if (last$$1 < pos) {
                    ret.push(trim(input.substring(last$$1, pos)));
                }
                return cache[cacheKey] = ret;
            };
        }();
        var getFontURL = function (cache) {
            return function (el) {
                var url = cache[el];
                if (!url) {
                    var m;
                    if (m = /url\((['"]?)([^'")]*?)\1\)\s+format\((['"]?)truetype\3\)/.exec(el)) {
                        url = cache[el] = m[2];
                    } else if (m = /url\((['"]?)([^'")]*?\.ttf)\1\)/.exec(el)) {
                        url = cache[el] = m[2];
                    }
                }
                return url;
            };
        }(Object.create ? Object.create(null) : {});
        var getFontHeight = function (cache) {
            return function (font) {
                var height = cache[font];
                if (height == null) {
                    height = cache[font] = suixUtil.measureText('Mapq', { font: font }).height;
                }
                return height;
            };
        }(Object.create ? Object.create(null) : {});
        function getFontFaces(doc) {
            if (doc == null) {
                doc = document;
            }
            var result = {};
            for (var i = 0; i < doc.styleSheets.length; ++i) {
                doStylesheet(doc.styleSheets[i]);
            }
            return result;
            function doStylesheet(ss) {
                if (ss) {
                    var rules = null;
                    try {
                        rules = ss.cssRules;
                    } catch (ex) {
                    }
                    if (rules) {
                        addRules(ss, rules);
                    }
                }
            }
            function findFonts(rule) {
                var src = getPropertyValue(rule.style, 'src');
                if (src) {
                    return splitProperty(src).reduce(function (a, el) {
                        var font = getFontURL(el);
                        if (font) {
                            a.push(font);
                        }
                        return a;
                    }, []);
                } else {
                    var font = getFontURL(rule.cssText);
                    return font ? [font] : [];
                }
            }
            function addRules(styleSheet, rules) {
                for (var i = 0; i < rules.length; ++i) {
                    var r = rules[i];
                    switch (r.type) {
                    case 3:
                        doStylesheet(r.styleSheet);
                        break;
                    case 5:
                        var style = r.style;
                        var family = splitProperty(getPropertyValue(style, 'font-family'));
                        var bold = /^([56789]00|bold)$/i.test(getPropertyValue(style, 'font-weight'));
                        var italic = 'italic' == getPropertyValue(style, 'font-style');
                        var src = findFonts(r);
                        if (src.length > 0) {
                            addRule(styleSheet, family, bold, italic, src[0]);
                        }
                    }
                }
            }
            function addRule(styleSheet, names, bold, italic, url) {
                if (!/^data:/i.test(url)) {
                    if (!(/^[^\/:]+:\/\//.test(url) || /^\//.test(url))) {
                        url = String(styleSheet.href).replace(/[^\/]*$/, '') + url;
                    }
                }
                names.forEach(function (name) {
                    name = name.replace(/^(['"]?)(.*?)\1$/, '$2');
                    if (bold) {
                        name += '|bold';
                    }
                    if (italic) {
                        name += '|italic';
                    }
                    result[name] = url;
                });
            }
        }
        function hasOwnProperty(obj, key) {
            return Object.prototype.hasOwnProperty.call(obj, key);
        }
        function getCounter(name) {
            name = '_counter_' + name;
            return nodeInfo[name];
        }
        function getAllCounters(name) {
            var values = [], p = nodeInfo;
            name = '_counter_' + name;
            while (p) {
                if (hasOwnProperty(p, name)) {
                    values.push(p[name]);
                }
                p = Object.getPrototypeOf(p);
            }
            return values.reverse();
        }
        function incCounter(name, inc) {
            var p = nodeInfo;
            name = '_counter_' + name;
            while (p && !hasOwnProperty(p, name)) {
                p = Object.getPrototypeOf(p);
            }
            if (!p) {
                p = nodeInfo._root;
            }
            p[name] = (p[name] || 0) + (inc == null ? 1 : inc);
        }
        function resetCounter(name, val) {
            name = '_counter_' + name;
            nodeInfo[name] = val == null ? 0 : val;
        }
        function doCounters(a, f, def) {
            for (var i = 0; i < a.length;) {
                var name = a[i++];
                var val = parseFloat(a[i]);
                if (isNaN(val)) {
                    f(name, def);
                } else {
                    f(name, val);
                    ++i;
                }
            }
        }
        function updateCounters(style) {
            var counterReset = getPropertyValue(style, 'counter-reset');
            if (counterReset) {
                doCounters(splitProperty(counterReset, /^\s+/), resetCounter, 0);
            }
            var counterIncrement = getPropertyValue(style, 'counter-increment');
            if (counterIncrement) {
                doCounters(splitProperty(counterIncrement, /^\s+/), incCounter, 1);
            }
        }
        function parseColor$1(str, css) {
            var color = suix.parseColor(str, true);
            if (color) {
                color = color.toRGB();
                if (css) {
                    color = color.toCssRgba();
                } else if (color.a === 0) {
                    color = null;
                }
            }
            return color;
        }
        function whenImagesAreActuallyLoaded(elements, callback) {
            var pending = 0;
            elements.forEach(function (el) {
                var images = el.querySelectorAll('img');
                for (var i = 0; i < images.length; ++i) {
                    var img = images[i];
                    if (!img.complete) {
                        pending++;
                        img.onload = img.onerror = next;
                    }
                }
            });
            if (!pending) {
                next();
            }
            function next() {
                if (--pending <= 0) {
                    callback();
                }
            }
        }
        function cacheImages(element, callback) {
            var urls = [];
            function add(url) {
                if (!IMAGE_CACHE[url]) {
                    IMAGE_CACHE[url] = true;
                    urls.push(url);
                }
            }
            function dive(element) {
                if (/^img$/i.test(element.tagName)) {
                    add(element.src);
                }
                parseBackgroundImage(getPropertyValue(getComputedStyle(element), 'background-image')).forEach(function (bg) {
                    if (bg.type == 'url') {
                        add(bg.url);
                    }
                });
                if (element.children) {
                    slice$1(element.children).forEach(dive);
                }
            }
            if (Array.isArray(element)) {
                element.forEach(dive);
            } else {
                dive(element);
            }
            var count = urls.length;
            function next() {
                if (--count <= 0) {
                    callback();
                }
            }
            if (count === 0) {
                next();
            }
            urls.forEach(function (url) {
                var img = IMAGE_CACHE[url] = new window.Image();
                if (!/^data:/i.test(url)) {
                    img.crossOrigin = 'Anonymous';
                }
                img.src = url;
                if (img.complete) {
                    next();
                } else {
                    img.onload = next;
                    img.onerror = function () {
                        IMAGE_CACHE[url] = null;
                        next();
                    };
                }
            });
        }
        function alphaNumeral(n) {
            var result = '';
            do {
                var r = n % 26;
                result = String.fromCharCode(97 + r) + result;
                n = Math.floor(n / 26);
            } while (n > 0);
            return result;
        }
        function pushNodeInfo(element, style, group) {
            nodeInfo = Object.create(nodeInfo);
            nodeInfo[element.tagName.toLowerCase()] = {
                element: element,
                style: style
            };
            var decoration = getPropertyValue(style, 'text-decoration');
            if (decoration && decoration != 'none') {
                var color = getPropertyValue(style, 'color');
                decoration.split(/\s+/g).forEach(function (name) {
                    if (!nodeInfo[name]) {
                        nodeInfo[name] = color;
                    }
                });
            }
            if (createsStackingContext(style)) {
                nodeInfo._stackingContext = {
                    element: element,
                    group: group
                };
            }
        }
        function popNodeInfo() {
            nodeInfo = Object.getPrototypeOf(nodeInfo);
        }
        function updateClipbox(path) {
            if (nodeInfo._clipbox != null) {
                var box = path.bbox(nodeInfo._matrix);
                if (nodeInfo._clipbox) {
                    nodeInfo._clipbox = Rect.intersect(nodeInfo._clipbox, box);
                } else {
                    nodeInfo._clipbox = box;
                }
            }
        }
        function emptyClipbox() {
            var cb = nodeInfo._clipbox;
            if (cb == null) {
                return true;
            }
            if (cb) {
                return cb.width() === 0 || cb.height() === 0;
            }
        }
        function createsStackingContext(style) {
            function prop(name) {
                return getPropertyValue(style, name);
            }
            if (prop('transform') != 'none' || prop('position') != 'static' || prop('z-index') != 'auto' || prop('opacity') < 1) {
                return true;
            }
        }
        function getComputedStyle(element, pseudoElt) {
            return window.getComputedStyle(element, pseudoElt || null);
        }
        function getPropertyValue(style, prop, defa) {
            var val = style.getPropertyValue(prop);
            if (val == null || val === '') {
                if (browser.webkit) {
                    val = style.getPropertyValue('-webkit-' + prop);
                } else if (browser.mozilla) {
                    val = style.getPropertyValue('-moz-' + prop);
                } else if (browser.opera) {
                    val = style.getPropertyValue('-o-' + prop);
                } else if (microsoft) {
                    val = style.getPropertyValue('-ms-' + prop);
                }
            }
            if (arguments.length > 2 && (val == null || val === '')) {
                return defa;
            } else {
                return val;
            }
        }
        function pleaseSetPropertyValue(style, prop, value, important) {
            style.setProperty(prop, value, important);
            if (browser.webkit) {
                style.setProperty('-webkit-' + prop, value, important);
            } else if (browser.mozilla) {
                style.setProperty('-moz-' + prop, value, important);
            } else if (browser.opera) {
                style.setProperty('-o-' + prop, value, important);
            } else if (microsoft) {
                style.setProperty('-ms-' + prop, value, important);
                prop = 'ms' + prop.replace(/(^|-)([a-z])/g, function (s, p1, p2) {
                    return p1 + p2.toUpperCase();
                });
                style[prop] = value;
            }
        }
        function getBorder(style, side) {
            side = 'border-' + side;
            return {
                width: parseFloat(getPropertyValue(style, side + '-width')),
                style: getPropertyValue(style, side + '-style'),
                color: parseColor$1(getPropertyValue(style, side + '-color'), true)
            };
        }
        function saveStyle(element, func) {
            var prev = element.style.cssText;
            var result = func();
            element.style.cssText = prev;
            return result;
        }
        function getBorderRadius(style, side) {
            var r = getPropertyValue(style, 'border-' + side + '-radius').split(/\s+/g).map(parseFloat);
            if (r.length == 1) {
                r.push(r[0]);
            }
            return sanitizeRadius({
                x: r[0],
                y: r[1]
            });
        }
        function getContentBox(element) {
            var box = element.getBoundingClientRect();
            box = innerBox(box, 'border-*-width', element);
            box = innerBox(box, 'padding-*', element);
            return box;
        }
        function innerBox(box, prop, element) {
            var style, wt, wr, wb, wl;
            if (typeof prop == 'string') {
                style = getComputedStyle(element);
                wt = parseFloat(getPropertyValue(style, prop.replace('*', 'top')));
                wr = parseFloat(getPropertyValue(style, prop.replace('*', 'right')));
                wb = parseFloat(getPropertyValue(style, prop.replace('*', 'bottom')));
                wl = parseFloat(getPropertyValue(style, prop.replace('*', 'left')));
            } else if (typeof prop == 'number') {
                wt = wr = wb = wl = prop;
            }
            return {
                top: box.top + wt,
                right: box.right - wr,
                bottom: box.bottom - wb,
                left: box.left + wl,
                width: box.right - box.left - wr - wl,
                height: box.bottom - box.top - wb - wt
            };
        }
        function getTransform(style) {
            var transform$$1 = getPropertyValue(style, 'transform');
            if (transform$$1 == 'none') {
                return null;
            }
            var matrix = /^\s*matrix\(\s*(.*?)\s*\)\s*$/.exec(transform$$1);
            if (matrix) {
                var origin = getPropertyValue(style, 'transform-origin');
                matrix = matrix[1].split(/\s*,\s*/g).map(parseFloat);
                origin = origin.split(/\s+/g).map(parseFloat);
                return {
                    matrix: matrix,
                    origin: origin
                };
            }
        }
        function radiansToDegrees(radians) {
            return 180 * radians / Math.PI % 360;
        }
        function parseAngle(angle) {
            var num = parseFloat(angle);
            if (/grad$/.test(angle)) {
                return Math.PI * num / 200;
            } else if (/rad$/.test(angle)) {
                return num;
            } else if (/turn$/.test(angle)) {
                return Math.PI * num * 2;
            } else if (/deg$/.test(angle)) {
                return Math.PI * num / 180;
            }
        }
        function setTransform(shape, m) {
            m = new Matrix(m[0], m[1], m[2], m[3], m[4], m[5]);
            shape.transform(m);
            return m;
        }
        function setClipping(shape, clipPath) {
            shape.clip(clipPath);
        }
        function addArcToPath(path, x, y, options) {
            var points = new Arc$2([
                    x,
                    y
                ], options).curvePoints(), i = 1;
            while (i < points.length) {
                path.curveTo(points[i++], points[i++], points[i++]);
            }
        }
        function sanitizeRadius(r) {
            if (r.x <= 0 || r.y <= 0) {
                r.x = r.y = 0;
            }
            return r;
        }
        function adjustBorderRadiusForBox(box, rTL, rTR, rBR, rBL) {
            var tl_x = Math.max(0, rTL.x), tl_y = Math.max(0, rTL.y);
            var tr_x = Math.max(0, rTR.x), tr_y = Math.max(0, rTR.y);
            var br_x = Math.max(0, rBR.x), br_y = Math.max(0, rBR.y);
            var bl_x = Math.max(0, rBL.x), bl_y = Math.max(0, rBL.y);
            var f = Math.min(box.width / (tl_x + tr_x), box.height / (tr_y + br_y), box.width / (br_x + bl_x), box.height / (bl_y + tl_y));
            if (f < 1) {
                tl_x *= f;
                tl_y *= f;
                tr_x *= f;
                tr_y *= f;
                br_x *= f;
                br_y *= f;
                bl_x *= f;
                bl_y *= f;
            }
            return {
                tl: {
                    x: tl_x,
                    y: tl_y
                },
                tr: {
                    x: tr_x,
                    y: tr_y
                },
                br: {
                    x: br_x,
                    y: br_y
                },
                bl: {
                    x: bl_x,
                    y: bl_y
                }
            };
        }
        function elementRoundBox(element, box, type) {
            var style = getComputedStyle(element);
            var rTL = getBorderRadius(style, 'top-left');
            var rTR = getBorderRadius(style, 'top-right');
            var rBL = getBorderRadius(style, 'bottom-left');
            var rBR = getBorderRadius(style, 'bottom-right');
            if (type == 'padding' || type == 'content') {
                var bt = getBorder(style, 'top');
                var br = getBorder(style, 'right');
                var bb = getBorder(style, 'bottom');
                var bl = getBorder(style, 'left');
                rTL.x -= bl.width;
                rTL.y -= bt.width;
                rTR.x -= br.width;
                rTR.y -= bt.width;
                rBR.x -= br.width;
                rBR.y -= bb.width;
                rBL.x -= bl.width;
                rBL.y -= bb.width;
                if (type == 'content') {
                    var pt = parseFloat(getPropertyValue(style, 'padding-top'));
                    var pr = parseFloat(getPropertyValue(style, 'padding-right'));
                    var pb = parseFloat(getPropertyValue(style, 'padding-bottom'));
                    var pl = parseFloat(getPropertyValue(style, 'padding-left'));
                    rTL.x -= pl;
                    rTL.y -= pt;
                    rTR.x -= pr;
                    rTR.y -= pt;
                    rBR.x -= pr;
                    rBR.y -= pb;
                    rBL.x -= pl;
                    rBL.y -= pb;
                }
            }
            if (typeof type == 'number') {
                rTL.x -= type;
                rTL.y -= type;
                rTR.x -= type;
                rTR.y -= type;
                rBR.x -= type;
                rBR.y -= type;
                rBL.x -= type;
                rBL.y -= type;
            }
            return roundBox(box, rTL, rTR, rBR, rBL);
        }
        function roundBox(box, rTL0, rTR0, rBR0, rBL0) {
            var tmp = adjustBorderRadiusForBox(box, rTL0, rTR0, rBR0, rBL0);
            var rTL = tmp.tl;
            var rTR = tmp.tr;
            var rBR = tmp.br;
            var rBL = tmp.bl;
            var path = new Path({
                fill: null,
                stroke: null
            });
            path.moveTo(box.left, box.top + rTL.y);
            if (rTL.x) {
                addArcToPath(path, box.left + rTL.x, box.top + rTL.y, {
                    startAngle: -180,
                    endAngle: -90,
                    radiusX: rTL.x,
                    radiusY: rTL.y
                });
            }
            path.lineTo(box.right - rTR.x, box.top);
            if (rTR.x) {
                addArcToPath(path, box.right - rTR.x, box.top + rTR.y, {
                    startAngle: -90,
                    endAngle: 0,
                    radiusX: rTR.x,
                    radiusY: rTR.y
                });
            }
            path.lineTo(box.right, box.bottom - rBR.y);
            if (rBR.x) {
                addArcToPath(path, box.right - rBR.x, box.bottom - rBR.y, {
                    startAngle: 0,
                    endAngle: 90,
                    radiusX: rBR.x,
                    radiusY: rBR.y
                });
            }
            path.lineTo(box.left + rBL.x, box.bottom);
            if (rBL.x) {
                addArcToPath(path, box.left + rBL.x, box.bottom - rBL.y, {
                    startAngle: 90,
                    endAngle: 180,
                    radiusX: rBL.x,
                    radiusY: rBL.y
                });
            }
            return path.close();
        }
        function formatCounter(val, style) {
            var str = String(parseFloat(val));
            switch (style) {
            case 'decimal-leading-zero':
                if (str.length < 2) {
                    str = '0' + str;
                }
                return str;
            case 'lower-roman':
                return arabicToRoman(val).toLowerCase();
            case 'upper-roman':
                return arabicToRoman(val).toUpperCase();
            case 'lower-latin':
            case 'lower-alpha':
                return alphaNumeral(val - 1);
            case 'upper-latin':
            case 'upper-alpha':
                return alphaNumeral(val - 1).toUpperCase();
            default:
                return str;
            }
        }
        function evalPseudoElementContent(element, content) {
            function displayCounter(name, style, separator) {
                if (!separator) {
                    return formatCounter(getCounter(name) || 0, style);
                }
                separator = separator.replace(/^\s*(["'])(.*)\1\s*$/, '$2');
                return getAllCounters(name).map(function (val) {
                    return formatCounter(val, style);
                }).join(separator);
            }
            var a = splitProperty(content, /^\s+/);
            var result = [], m;
            a.forEach(function (el) {
                var tmp;
                if (m = /^\s*(["'])(.*)\1\s*$/.exec(el)) {
                    result.push(m[2].replace(/\\([0-9a-f]{4})/gi, function (s, p) {
                        return String.fromCharCode(parseInt(p, 16));
                    }));
                } else if (m = /^\s*counter\((.*?)\)\s*$/.exec(el)) {
                    tmp = splitProperty(m[1]);
                    result.push(displayCounter(tmp[0], tmp[1]));
                } else if (m = /^\s*counters\((.*?)\)\s*$/.exec(el)) {
                    tmp = splitProperty(m[1]);
                    result.push(displayCounter(tmp[0], tmp[2], tmp[1]));
                } else if (m = /^\s*attr\((.*?)\)\s*$/.exec(el)) {
                    result.push(element.getAttribute(m[1]) || '');
                } else {
                    result.push(el);
                }
            });
            return result.join('');
        }
        function getCssText(style) {
            if (style.cssText) {
                return style.cssText;
            }
            var result = [];
            for (var i = 0; i < style.length; ++i) {
                result.push(style[i] + ': ' + getPropertyValue(style, style[i]));
            }
            return result.join(';\n');
        }
        function _renderWithPseudoElements(element, group) {
            if (element.tagName == SUIX_PSEUDO_ELEMENT) {
                _renderElement(element, group);
                return;
            }
            var fake = [];
            function pseudo(kind, place) {
                var style = getComputedStyle(element, kind), content = style.content;
                updateCounters(style);
                if (content && content != 'normal' && content != 'none' && style.width != '0px') {
                    var psel = element.ownerDocument.createElement(SUIX_PSEUDO_ELEMENT);
                    psel.style.cssText = getCssText(style);
                    psel.textContent = evalPseudoElementContent(element, content);
                    element.insertBefore(psel, place);
                    fake.push(psel);
                }
            }
            pseudo(':before', element.firstChild);
            pseudo(':after', null);
            if (fake.length > 0) {
                var saveClass = element.className;
                element.className += ' suix-pdf-hide-pseudo-elements';
                _renderElement(element, group);
                element.className = saveClass;
                fake.forEach(function (el) {
                    element.removeChild(el);
                });
            } else {
                _renderElement(element, group);
            }
        }
        function _renderElement(element, group) {
            var style = getComputedStyle(element);
            var top = getBorder(style, 'top');
            var right = getBorder(style, 'right');
            var bottom = getBorder(style, 'bottom');
            var left = getBorder(style, 'left');
            var rTL0 = getBorderRadius(style, 'top-left');
            var rTR0 = getBorderRadius(style, 'top-right');
            var rBL0 = getBorderRadius(style, 'bottom-left');
            var rBR0 = getBorderRadius(style, 'bottom-right');
            var dir = getPropertyValue(style, 'direction');
            var backgroundColor = getPropertyValue(style, 'background-color');
            backgroundColor = parseColor$1(backgroundColor);
            var backgroundImage = parseBackgroundImage(getPropertyValue(style, 'background-image'));
            var backgroundRepeat = splitProperty(getPropertyValue(style, 'background-repeat'));
            var backgroundPosition = splitProperty(getPropertyValue(style, 'background-position'));
            var backgroundOrigin = splitProperty(getPropertyValue(style, 'background-origin'));
            var backgroundSize = splitProperty(getPropertyValue(style, 'background-size'));
            var textOverflow, saveTextOverflow;
            if (microsoft) {
                textOverflow = style.textOverflow;
                if (textOverflow == 'ellipsis') {
                    saveTextOverflow = element.style.textOverflow;
                    element.style.textOverflow = 'clip';
                }
            }
            if (browser.msie && browser.version < 10) {
                backgroundPosition = splitProperty(element.currentStyle.backgroundPosition);
            }
            var innerbox = innerBox(element.getBoundingClientRect(), 'border-*-width', element);
            (function () {
                var clip = getPropertyValue(style, 'clip');
                var m = /^\s*rect\((.*)\)\s*$/.exec(clip);
                if (m) {
                    var a = m[1].split(/[ ,]+/g);
                    var top = a[0] == 'auto' ? innerbox.top : parseFloat(a[0]) + innerbox.top;
                    var right = a[1] == 'auto' ? innerbox.right : parseFloat(a[1]) + innerbox.left;
                    var bottom = a[2] == 'auto' ? innerbox.bottom : parseFloat(a[2]) + innerbox.top;
                    var left = a[3] == 'auto' ? innerbox.left : parseFloat(a[3]) + innerbox.left;
                    var tmp = new Group();
                    var clipPath = new Path().moveTo(left, top).lineTo(right, top).lineTo(right, bottom).lineTo(left, bottom).close();
                    setClipping(tmp, clipPath);
                    group.append(tmp);
                    group = tmp;
                    updateClipbox(clipPath);
                }
            }());
            var boxes, i, cells;
            var display = getPropertyValue(style, 'display');
            if (display == 'table-row') {
                boxes = [];
                for (i = 0, cells = element.children; i < cells.length; ++i) {
                    boxes.push(cells[i].getBoundingClientRect());
                }
            } else {
                boxes = element.getClientRects();
                if (boxes.length == 1) {
                    boxes = [element.getBoundingClientRect()];
                }
            }
            boxes = adjustBoxes(boxes);
            for (i = 0; i < boxes.length; ++i) {
                drawOneBox(boxes[i], i === 0, i == boxes.length - 1);
            }
            if (element.tagName == 'A' && element.href && !/^#?$/.test(element.getAttribute('href'))) {
                if (!nodeInfo._avoidLinks || !matches(element, nodeInfo._avoidLinks)) {
                    var r = document.createRange();
                    r.selectNodeContents(element);
                    slice$1(r.getClientRects()).forEach(function (box) {
                        var g = new Group();
                        g._pdfLink = {
                            url: element.href,
                            top: box.top,
                            right: box.right,
                            bottom: box.bottom,
                            left: box.left
                        };
                        group.append(g);
                    });
                }
            }
            if (boxes.length > 0 && display == 'list-item' && !element.getAttribute('suix-no-bullet')) {
                drawBullet(boxes[0]);
            }
            (function () {
                function clipit() {
                    var clipPath = elementRoundBox(element, innerbox, 'padding');
                    var tmp = new Group();
                    setClipping(tmp, clipPath);
                    group.append(tmp);
                    group = tmp;
                    updateClipbox(clipPath);
                }
                if (isFormField(element)) {
                    clipit();
                } else if (/^(hidden|auto|scroll)/.test(getPropertyValue(style, 'overflow'))) {
                    clipit();
                } else if (/^(hidden|auto|scroll)/.test(getPropertyValue(style, 'overflow-x'))) {
                    clipit();
                } else if (/^(hidden|auto|scroll)/.test(getPropertyValue(style, 'overflow-y'))) {
                    clipit();
                }
            }());
            if (!maybeRenderWidget(element, group)) {
                renderContents(element, group);
            }
            if (microsoft && textOverflow == 'ellipsis') {
                element.style.textOverflow = saveTextOverflow;
            }
            return group;
            function adjustBoxes(boxes) {
                if (/^td$/i.test(element.tagName)) {
                    var table = nodeInfo.table;
                    if (table && getPropertyValue(table.style, 'border-collapse') == 'collapse') {
                        var tableBorderLeft = getBorder(table.style, 'left').width;
                        var tableBorderTop = getBorder(table.style, 'top').width;
                        if (tableBorderLeft === 0 && tableBorderTop === 0) {
                            return boxes;
                        }
                        var tableBox = table.element.getBoundingClientRect();
                        var firstCell = table.element.rows[0].cells[0];
                        var firstCellBox = firstCell.getBoundingClientRect();
                        if (firstCellBox.top == tableBox.top || firstCellBox.left == tableBox.left) {
                            return slice$1(boxes).map(function (box) {
                                return {
                                    left: box.left + tableBorderLeft,
                                    top: box.top + tableBorderTop,
                                    right: box.right + tableBorderLeft,
                                    bottom: box.bottom + tableBorderTop,
                                    height: box.height,
                                    width: box.width
                                };
                            });
                        }
                    }
                }
                return boxes;
            }
            function drawEdge(color, len, Wtop, Wleft, Wright, rl, rr, transform$$1) {
                if (Wtop <= 0) {
                    return;
                }
                var path, edge = new Group();
                setTransform(edge, transform$$1);
                group.append(edge);
                sanitizeRadius(rl);
                sanitizeRadius(rr);
                path = new Path({
                    fill: { color: color },
                    stroke: null
                });
                edge.append(path);
                path.moveTo(rl.x ? Math.max(rl.x, Wleft) : 0, 0).lineTo(len - (rr.x ? Math.max(rr.x, Wright) : 0), 0).lineTo(len - Math.max(rr.x, Wright), Wtop).lineTo(Math.max(rl.x, Wleft), Wtop).close();
                if (rl.x) {
                    drawRoundCorner(Wleft, rl, [
                        -1,
                        0,
                        0,
                        1,
                        rl.x,
                        0
                    ]);
                }
                if (rr.x) {
                    drawRoundCorner(Wright, rr, [
                        1,
                        0,
                        0,
                        1,
                        len - rr.x,
                        0
                    ]);
                }
                function drawRoundCorner(Wright, r, transform$$1) {
                    var angle = Math.PI / 2 * Wright / (Wright + Wtop);
                    var ri = {
                        x: r.x - Wright,
                        y: r.y - Wtop
                    };
                    var path = new Path({
                        fill: { color: color },
                        stroke: null
                    }).moveTo(0, 0);
                    setTransform(path, transform$$1);
                    addArcToPath(path, 0, r.y, {
                        startAngle: -90,
                        endAngle: -radiansToDegrees(angle),
                        radiusX: r.x,
                        radiusY: r.y
                    });
                    if (ri.x > 0 && ri.y > 0) {
                        path.lineTo(ri.x * Math.cos(angle), r.y - ri.y * Math.sin(angle));
                        addArcToPath(path, 0, r.y, {
                            startAngle: -radiansToDegrees(angle),
                            endAngle: -90,
                            radiusX: ri.x,
                            radiusY: ri.y,
                            anticlockwise: true
                        });
                    } else if (ri.x > 0) {
                        path.lineTo(ri.x, Wtop).lineTo(0, Wtop);
                    } else {
                        path.lineTo(ri.x, Wtop).lineTo(ri.x, 0);
                    }
                    edge.append(path.close());
                }
            }
            function drawBackground(box) {
                var background = new Group();
                setClipping(background, roundBox(box, rTL0, rTR0, rBR0, rBL0));
                group.append(background);
                if (backgroundColor) {
                    var path = new Path({
                        fill: { color: backgroundColor.toCssRgba() },
                        stroke: null
                    });
                    path.moveTo(box.left, box.top).lineTo(box.right, box.top).lineTo(box.right, box.bottom).lineTo(box.left, box.bottom).close();
                    background.append(path);
                }
                for (var i = backgroundImage.length; --i >= 0;) {
                    drawOneBackground(background, box, backgroundImage[i], backgroundRepeat[i % backgroundRepeat.length], backgroundPosition[i % backgroundPosition.length], backgroundOrigin[i % backgroundOrigin.length], backgroundSize[i % backgroundSize.length]);
                }
            }
            function drawOneBackground(group, box, background, backgroundRepeat, backgroundPosition, backgroundOrigin, backgroundSize) {
                if (!background || background == 'none') {
                    return;
                }
                if (background.type == 'url') {
                    if (/^url\(\"data:image\/svg/i.test(background.url)) {
                        return;
                    }
                    var img = IMAGE_CACHE[background.url];
                    if (img && img.width > 0 && img.height > 0) {
                        drawBackgroundImage(group, box, img.width, img.height, function (group, rect) {
                            group.append(new Image$1(background.url, rect));
                        });
                    }
                } else if (background.type == 'linear') {
                    drawBackgroundImage(group, box, box.width, box.height, gradientRenderer(background));
                } else {
                    return;
                }
                function drawBackgroundImage(group, box, img_width, img_height, renderBG) {
                    var aspect_ratio = img_width / img_height, f;
                    var orgBox = box;
                    if (backgroundOrigin == 'content-box') {
                        orgBox = innerBox(orgBox, 'border-*-width', element);
                        orgBox = innerBox(orgBox, 'padding-*', element);
                    } else if (backgroundOrigin == 'padding-box') {
                        orgBox = innerBox(orgBox, 'border-*-width', element);
                    }
                    if (!/^\s*auto(\s+auto)?\s*$/.test(backgroundSize)) {
                        if (backgroundSize == 'contain') {
                            f = Math.min(orgBox.width / img_width, orgBox.height / img_height);
                            img_width *= f;
                            img_height *= f;
                        } else if (backgroundSize == 'cover') {
                            f = Math.max(orgBox.width / img_width, orgBox.height / img_height);
                            img_width *= f;
                            img_height *= f;
                        } else {
                            var size = backgroundSize.split(/\s+/g);
                            if (/%$/.test(size[0])) {
                                img_width = orgBox.width * parseFloat(size[0]) / 100;
                            } else {
                                img_width = parseFloat(size[0]);
                            }
                            if (size.length == 1 || size[1] == 'auto') {
                                img_height = img_width / aspect_ratio;
                            } else if (/%$/.test(size[1])) {
                                img_height = orgBox.height * parseFloat(size[1]) / 100;
                            } else {
                                img_height = parseFloat(size[1]);
                            }
                        }
                    }
                    var pos = String(backgroundPosition);
                    switch (pos) {
                    case 'bottom':
                        pos = '50% 100%';
                        break;
                    case 'top':
                        pos = '50% 0';
                        break;
                    case 'left':
                        pos = '0 50%';
                        break;
                    case 'right':
                        pos = '100% 50%';
                        break;
                    case 'center':
                        pos = '50% 50%';
                        break;
                    }
                    pos = pos.split(/\s+/);
                    if (pos.length == 1) {
                        pos[1] = '50%';
                    }
                    if (/%$/.test(pos[0])) {
                        pos[0] = parseFloat(pos[0]) / 100 * (orgBox.width - img_width);
                    } else {
                        pos[0] = parseFloat(pos[0]);
                    }
                    if (/%$/.test(pos[1])) {
                        pos[1] = parseFloat(pos[1]) / 100 * (orgBox.height - img_height);
                    } else {
                        pos[1] = parseFloat(pos[1]);
                    }
                    var rect = new Rect([
                        orgBox.left + pos[0],
                        orgBox.top + pos[1]
                    ], [
                        img_width,
                        img_height
                    ]);
                    function rewX() {
                        while (rect.origin.x > box.left) {
                            rect.origin.x -= img_width;
                        }
                    }
                    function rewY() {
                        while (rect.origin.y > box.top) {
                            rect.origin.y -= img_height;
                        }
                    }
                    function repeatX() {
                        while (rect.origin.x < box.right) {
                            renderBG(group, rect.clone());
                            rect.origin.x += img_width;
                        }
                    }
                    if (backgroundRepeat == 'no-repeat') {
                        renderBG(group, rect);
                    } else if (backgroundRepeat == 'repeat-x') {
                        rewX();
                        repeatX();
                    } else if (backgroundRepeat == 'repeat-y') {
                        rewY();
                        while (rect.origin.y < box.bottom) {
                            renderBG(group, rect.clone());
                            rect.origin.y += img_height;
                        }
                    } else if (backgroundRepeat == 'repeat') {
                        rewX();
                        rewY();
                        var origin = rect.origin.clone();
                        while (rect.origin.y < box.bottom) {
                            rect.origin.x = origin.x;
                            repeatX();
                            rect.origin.y += img_height;
                        }
                    }
                }
            }
            function drawBullet() {
                var listStyleType = getPropertyValue(style, 'list-style-type');
                if (listStyleType == 'none') {
                    return;
                }
                var listStylePosition = getPropertyValue(style, 'list-style-position');
                function _drawBullet(f) {
                    saveStyle(element, function () {
                        element.style.position = 'relative';
                        var bullet = element.ownerDocument.createElement(SUIX_PSEUDO_ELEMENT);
                        bullet.style.position = 'absolute';
                        bullet.style.boxSizing = 'border-box';
                        if (listStylePosition == 'outside') {
                            bullet.style.width = '6em';
                            bullet.style.left = '-6.8em';
                            bullet.style.textAlign = 'right';
                        } else {
                            bullet.style.left = '0px';
                        }
                        f(bullet);
                        element.insertBefore(bullet, element.firstChild);
                        renderElement(bullet, group);
                        element.removeChild(bullet);
                    });
                }
                function elementIndex(f) {
                    var a = element.parentNode.children;
                    var k = element.getAttribute('suix-split-index');
                    if (k != null) {
                        return f(k | 0, a.length);
                    }
                    for (var i = 0; i < a.length; ++i) {
                        if (a[i] === element) {
                            return f(i, a.length);
                        }
                    }
                }
                switch (listStyleType) {
                case 'circle':
                case 'disc':
                case 'square':
                    _drawBullet(function (bullet) {
                        bullet.style.fontSize = '60%';
                        bullet.style.lineHeight = '200%';
                        bullet.style.paddingRight = '0.5em';
                        bullet.style.fontFamily = 'DejaVu Serif';
                        bullet.innerHTML = {
                            'disc': '\u25CF',
                            'circle': '\u25EF',
                            'square': '\u25A0'
                        }[listStyleType];
                    });
                    break;
                case 'decimal':
                case 'decimal-leading-zero':
                    _drawBullet(function (bullet) {
                        elementIndex(function (idx) {
                            ++idx;
                            if (listStyleType == 'decimal-leading-zero' && idx < 10) {
                                idx = '0' + idx;
                            }
                            bullet.innerHTML = idx + '.';
                        });
                    });
                    break;
                case 'lower-roman':
                case 'upper-roman':
                    _drawBullet(function (bullet) {
                        elementIndex(function (idx) {
                            idx = arabicToRoman(idx + 1);
                            if (listStyleType == 'upper-roman') {
                                idx = idx.toUpperCase();
                            }
                            bullet.innerHTML = idx + '.';
                        });
                    });
                    break;
                case 'lower-latin':
                case 'lower-alpha':
                case 'upper-latin':
                case 'upper-alpha':
                    _drawBullet(function (bullet) {
                        elementIndex(function (idx) {
                            idx = alphaNumeral(idx);
                            if (/^upper/i.test(listStyleType)) {
                                idx = idx.toUpperCase();
                            }
                            bullet.innerHTML = idx + '.';
                        });
                    });
                    break;
                }
            }
            function drawOneBox(box, isFirst, isLast) {
                if (box.width === 0 || box.height === 0) {
                    return;
                }
                drawBackground(box);
                var shouldDrawLeft = left.width > 0 && (isFirst && dir == 'ltr' || isLast && dir == 'rtl');
                var shouldDrawRight = right.width > 0 && (isLast && dir == 'ltr' || isFirst && dir == 'rtl');
                if (top.width === 0 && left.width === 0 && right.width === 0 && bottom.width === 0) {
                    return;
                }
                if (top.color == right.color && top.color == bottom.color && top.color == left.color) {
                    if (top.width == right.width && top.width == bottom.width && top.width == left.width) {
                        if (shouldDrawLeft && shouldDrawRight) {
                            box = innerBox(box, top.width / 2);
                            var path = elementRoundBox(element, box, top.width / 2);
                            path.options.stroke = {
                                color: top.color,
                                width: top.width
                            };
                            group.append(path);
                            return;
                        }
                    }
                }
                if (rTL0.x === 0 && rTR0.x === 0 && rBR0.x === 0 && rBL0.x === 0) {
                    if (top.width < 2 && left.width < 2 && right.width < 2 && bottom.width < 2) {
                        if (top.width > 0) {
                            group.append(new Path({
                                stroke: {
                                    width: top.width,
                                    color: top.color
                                }
                            }).moveTo(box.left, box.top + top.width / 2).lineTo(box.right, box.top + top.width / 2));
                        }
                        if (bottom.width > 0) {
                            group.append(new Path({
                                stroke: {
                                    width: bottom.width,
                                    color: bottom.color
                                }
                            }).moveTo(box.left, box.bottom - bottom.width / 2).lineTo(box.right, box.bottom - bottom.width / 2));
                        }
                        if (shouldDrawLeft) {
                            group.append(new Path({
                                stroke: {
                                    width: left.width,
                                    color: left.color
                                }
                            }).moveTo(box.left + left.width / 2, box.top).lineTo(box.left + left.width / 2, box.bottom));
                        }
                        if (shouldDrawRight) {
                            group.append(new Path({
                                stroke: {
                                    width: right.width,
                                    color: right.color
                                }
                            }).moveTo(box.right - right.width / 2, box.top).lineTo(box.right - right.width / 2, box.bottom));
                        }
                        return;
                    }
                }
                var tmp = adjustBorderRadiusForBox(box, rTL0, rTR0, rBR0, rBL0);
                var rTL = tmp.tl;
                var rTR = tmp.tr;
                var rBR = tmp.br;
                var rBL = tmp.bl;
                drawEdge(top.color, box.width, top.width, left.width, right.width, rTL, rTR, [
                    1,
                    0,
                    0,
                    1,
                    box.left,
                    box.top
                ]);
                drawEdge(bottom.color, box.width, bottom.width, right.width, left.width, rBR, rBL, [
                    -1,
                    0,
                    0,
                    -1,
                    box.right,
                    box.bottom
                ]);
                function inv(p) {
                    return {
                        x: p.y,
                        y: p.x
                    };
                }
                drawEdge(left.color, box.height, left.width, bottom.width, top.width, inv(rBL), inv(rTL), [
                    0,
                    -1,
                    1,
                    0,
                    box.left,
                    box.bottom
                ]);
                drawEdge(right.color, box.height, right.width, top.width, bottom.width, inv(rTR), inv(rBR), [
                    0,
                    1,
                    -1,
                    0,
                    box.right,
                    box.top
                ]);
            }
        }
        function gradientRenderer(gradient) {
            return function (group, rect) {
                var width = rect.width(), height = rect.height();
                switch (gradient.type) {
                case 'linear':
                    var angle = gradient.angle != null ? gradient.angle : Math.PI;
                    switch (gradient.to) {
                    case 'top':
                        angle = 0;
                        break;
                    case 'left':
                        angle = -Math.PI / 2;
                        break;
                    case 'bottom':
                        angle = Math.PI;
                        break;
                    case 'right':
                        angle = Math.PI / 2;
                        break;
                    case 'top left':
                    case 'left top':
                        angle = -Math.atan2(height, width);
                        break;
                    case 'top right':
                    case 'right top':
                        angle = Math.atan2(height, width);
                        break;
                    case 'bottom left':
                    case 'left bottom':
                        angle = Math.PI + Math.atan2(height, width);
                        break;
                    case 'bottom right':
                    case 'right bottom':
                        angle = Math.PI - Math.atan2(height, width);
                        break;
                    }
                    if (gradient.reverse) {
                        angle -= Math.PI;
                    }
                    angle %= 2 * Math.PI;
                    if (angle < 0) {
                        angle += 2 * Math.PI;
                    }
                    var pxlen = Math.abs(width * Math.sin(angle)) + Math.abs(height * Math.cos(angle));
                    var scaledAngle = Math.atan(width * Math.tan(angle) / height);
                    var sin = Math.sin(scaledAngle), cos = Math.cos(scaledAngle);
                    var len = Math.abs(sin) + Math.abs(cos);
                    var x = len / 2 * sin;
                    var y = len / 2 * cos;
                    if (angle > Math.PI / 2 && angle <= 3 * Math.PI / 2) {
                        x = -x;
                        y = -y;
                    }
                    var implicit = [], right = 0;
                    var stops = gradient.stops.map(function (s, i) {
                        var offset = s.percent;
                        if (offset) {
                            offset = parseFloat(offset) / 100;
                        } else if (s.length) {
                            offset = parseFloat(s.length) / pxlen;
                        } else if (i === 0) {
                            offset = 0;
                        } else if (i == gradient.stops.length - 1) {
                            offset = 1;
                        }
                        var stop = {
                            color: s.color.toCssRgba(),
                            offset: offset
                        };
                        if (offset != null) {
                            right = offset;
                            implicit.forEach(function (s, i) {
                                var stop = s.stop;
                                stop.offset = s.left + (right - s.left) * (i + 1) / (implicit.length + 1);
                            });
                            implicit = [];
                        } else {
                            implicit.push({
                                left: right,
                                stop: stop
                            });
                        }
                        return stop;
                    });
                    var start = [
                        0.5 - x,
                        0.5 + y
                    ];
                    var end = [
                        0.5 + x,
                        0.5 - y
                    ];
                    group.append(Path.fromRect(rect).stroke(null).fill(new LinearGradient({
                        start: start,
                        end: end,
                        stops: stops,
                        userSpace: false
                    })));
                    break;
                case 'radial':
                    if (window.console && window.console.log) {
                        window.console.log('Radial gradients are not yet supported in HTML renderer');
                    }
                    break;
                }
            };
        }
        function maybeRenderWidget(element, group) {
            var visual;
            if (element._suixExportVisual) {
                visual = element._suixExportVisual();
            } else if (window.suix && window.suix.jQuery && element.getAttribute(window.suix.attr('role'))) {
                var widget = window.suix.widgetInstance(window.suix.jQuery(element));
                if (widget && (widget.exportDOMVisual || widget.exportVisual)) {
                    if (widget.exportDOMVisual) {
                        visual = widget.exportDOMVisual();
                    } else {
                        visual = widget.exportVisual();
                    }
                }
            }
            if (!visual) {
                return false;
            }
            var wrap$$1 = new Group();
            wrap$$1.children.push(visual);
            var bbox = element.getBoundingClientRect();
            wrap$$1.transform(transform().translate(bbox.left, bbox.top));
            group.append(wrap$$1);
            return true;
        }
        function renderImage(element, url, group) {
            var box = getContentBox(element);
            var rect = new Rect([
                box.left,
                box.top
            ], [
                box.width,
                box.height
            ]);
            var image = new Image$1(url, rect);
            setClipping(image, elementRoundBox(element, box, 'content'));
            group.append(image);
        }
        function zIndexSort(a, b) {
            var sa = getComputedStyle(a);
            var sb = getComputedStyle(b);
            var za = parseFloat(getPropertyValue(sa, 'z-index'));
            var zb = parseFloat(getPropertyValue(sb, 'z-index'));
            var pa = getPropertyValue(sa, 'position');
            var pb = getPropertyValue(sb, 'position');
            if (isNaN(za) && isNaN(zb)) {
                if (/static|absolute/.test(pa) && /static|absolute/.test(pb)) {
                    return 0;
                }
                if (pa == 'static') {
                    return -1;
                }
                if (pb == 'static') {
                    return 1;
                }
                return 0;
            }
            if (isNaN(za)) {
                return zb === 0 ? 0 : zb > 0 ? -1 : 1;
            }
            if (isNaN(zb)) {
                return za === 0 ? 0 : za > 0 ? 1 : -1;
            }
            return parseFloat(za) - parseFloat(zb);
        }
        function isFormField(element) {
            return /^(?:textarea|select|input)$/i.test(element.tagName);
        }
        function getSelectedOption(element) {
            if (element.selectedOptions && element.selectedOptions.length > 0) {
                return element.selectedOptions[0];
            }
            return element.options[element.selectedIndex];
        }
        function renderCheckbox(element, group) {
            var style = getComputedStyle(element);
            var color = getPropertyValue(style, 'color');
            var box = element.getBoundingClientRect();
            if (element.type == 'checkbox') {
                group.append(Path.fromRect(new Rect([
                    box.left + 1,
                    box.top + 1
                ], [
                    box.width - 2,
                    box.height - 2
                ])).stroke(color, 1));
                if (element.checked) {
                    group.append(new Path().stroke(color, 1.2).moveTo(box.left + 0.22 * box.width, box.top + 0.55 * box.height).lineTo(box.left + 0.45 * box.width, box.top + 0.75 * box.height).lineTo(box.left + 0.78 * box.width, box.top + 0.22 * box.width));
                }
            } else {
                group.append(new Circle(new Circle$2([
                    (box.left + box.right) / 2,
                    (box.top + box.bottom) / 2
                ], Math.min(box.width - 2, box.height - 2) / 2)).stroke(color, 1));
                if (element.checked) {
                    group.append(new Circle(new Circle$2([
                        (box.left + box.right) / 2,
                        (box.top + box.bottom) / 2
                    ], Math.min(box.width - 8, box.height - 8) / 2)).fill(color).stroke(null));
                }
            }
        }
        function renderFormField(element, group) {
            var tag = element.tagName.toLowerCase();
            if (tag == 'input' && (element.type == 'checkbox' || element.type == 'radio')) {
                return renderCheckbox(element, group);
            }
            var p = element.parentNode;
            var doc = element.ownerDocument;
            var el = doc.createElement(SUIX_PSEUDO_ELEMENT);
            var option;
            el.style.cssText = getCssText(getComputedStyle(element));
            if (tag == 'input') {
                el.style.whiteSpace = 'pre';
            }
            if (tag == 'select' || tag == 'textarea') {
                el.style.overflow = 'auto';
            }
            if (tag == 'select') {
                if (element.multiple) {
                    for (var i = 0; i < element.options.length; ++i) {
                        option = doc.createElement(SUIX_PSEUDO_ELEMENT);
                        option.style.cssText = getCssText(getComputedStyle(element.options[i]));
                        option.style.display = 'block';
                        option.textContent = element.options[i].textContent;
                        el.appendChild(option);
                    }
                } else {
                    option = getSelectedOption(element);
                    if (option) {
                        el.textContent = option.textContent;
                    }
                }
            } else {
                el.textContent = element.value;
            }
            p.insertBefore(el, element);
            el.scrollLeft = element.scrollLeft;
            el.scrollTop = element.scrollTop;
            element.style.display = 'none';
            renderContents(el, group);
            element.style.display = '';
            p.removeChild(el);
        }
        function renderContents(element, group) {
            if (nodeInfo._stackingContext.element === element) {
                nodeInfo._stackingContext.group = group;
            }
            switch (element.tagName.toLowerCase()) {
            case 'img':
                renderImage(element, element.src, group);
                break;
            case 'canvas':
                try {
                    renderImage(element, element.toDataURL('image/png'), group);
                } catch (ex) {
                }
                break;
            case 'textarea':
            case 'input':
            case 'select':
                renderFormField(element, group);
                break;
            default:
                var children = [], floats = [], positioned = [];
                for (var i = element.firstChild; i; i = i.nextSibling) {
                    switch (i.nodeType) {
                    case 3:
                        if (/\S/.test(i.data)) {
                            renderText(element, i, group);
                        }
                        break;
                    case 1:
                        var style = getComputedStyle(i);
                        var floating = getPropertyValue(style, 'float');
                        var position = getPropertyValue(style, 'position');
                        if (position != 'static') {
                            positioned.push(i);
                        } else if (floating != 'none') {
                            floats.push(i);
                        } else {
                            children.push(i);
                        }
                        break;
                    }
                }
                mergeSort(children, zIndexSort).forEach(function (el) {
                    renderElement(el, group);
                });
                mergeSort(floats, zIndexSort).forEach(function (el) {
                    renderElement(el, group);
                });
                mergeSort(positioned, zIndexSort).forEach(function (el) {
                    renderElement(el, group);
                });
            }
        }
        function renderText(element, node, group) {
            if (emptyClipbox()) {
                return;
            }
            var style = getComputedStyle(element);
            if (parseFloat(getPropertyValue(style, 'text-indent')) < -500) {
                return;
            }
            var text = node.data;
            var start = 0;
            var end = text.search(/\S\s*$/) + 1;
            if (!end) {
                return;
            }
            var fontSize = getPropertyValue(style, 'font-size');
            var lineHeight = getPropertyValue(style, 'line-height');
            var font = [
                getPropertyValue(style, 'font-style'),
                getPropertyValue(style, 'font-variant'),
                getPropertyValue(style, 'font-weight'),
                fontSize,
                getPropertyValue(style, 'font-family')
            ].join(' ');
            fontSize = parseFloat(fontSize);
            lineHeight = parseFloat(lineHeight);
            if (fontSize === 0) {
                return;
            }
            var color = getPropertyValue(style, 'color');
            var range = element.ownerDocument.createRange();
            var align$$1 = getPropertyValue(style, 'text-align');
            var isJustified = align$$1 == 'justify';
            var columnCount = getPropertyValue(style, 'column-count', 1);
            var whiteSpace = getPropertyValue(style, 'white-space');
            var textTransform = getPropertyValue(style, 'text-transform');
            var estimateLineLength = element.getBoundingClientRect().width / fontSize * 5;
            if (estimateLineLength === 0) {
                estimateLineLength = 500;
            }
            var prevLineBottom = null;
            var underline = nodeInfo['underline'];
            var lineThrough = nodeInfo['line-through'];
            var overline = nodeInfo['overline'];
            var hasDecoration = underline || lineThrough || overline;
            while (!doChunk()) {
            }
            if (hasDecoration) {
                range.selectNode(node);
                slice$1(range.getClientRects()).forEach(decorate);
            }
            return;
            function actuallyGetRangeBoundingRect(range) {
                if (microsoft || browser.chrome) {
                    var rectangles = range.getClientRects(), box = {
                            top: Infinity,
                            right: -Infinity,
                            bottom: -Infinity,
                            left: Infinity
                        }, done = false;
                    for (var i = 0; i < rectangles.length; ++i) {
                        var b = rectangles[i];
                        if (b.width <= 1 || b.bottom === prevLineBottom) {
                            continue;
                        }
                        box.left = Math.min(b.left, box.left);
                        box.top = Math.min(b.top, box.top);
                        box.right = Math.max(b.right, box.right);
                        box.bottom = Math.max(b.bottom, box.bottom);
                        done = true;
                    }
                    if (!done) {
                        return range.getBoundingClientRect();
                    }
                    box.width = box.right - box.left;
                    box.height = box.bottom - box.top;
                    return box;
                }
                return range.getBoundingClientRect();
            }
            function doChunk() {
                var origStart = start;
                var box, pos = text.substr(start).search(/\S/);
                start += pos;
                if (pos < 0 || start >= end) {
                    return true;
                }
                range.setStart(node, start);
                range.setEnd(node, start + 1);
                box = actuallyGetRangeBoundingRect(range);
                var found = false;
                if (isJustified || columnCount > 1) {
                    pos = text.substr(start).search(/\s/);
                    if (pos >= 0) {
                        range.setEnd(node, start + pos);
                        var r = actuallyGetRangeBoundingRect(range);
                        if (r.bottom == box.bottom) {
                            box = r;
                            found = true;
                            start += pos;
                        }
                    }
                }
                if (!found) {
                    pos = function findEOL(min, eol, max) {
                        range.setEnd(node, eol);
                        var r = actuallyGetRangeBoundingRect(range);
                        if (r.bottom != box.bottom && min < eol) {
                            return findEOL(min, min + eol >> 1, eol);
                        } else if (r.right != box.right) {
                            box = r;
                            if (eol < max) {
                                return findEOL(eol, eol + max >> 1, max);
                            } else {
                                return eol;
                            }
                        } else {
                            return eol;
                        }
                    }(start, Math.min(end, start + estimateLineLength), end);
                    if (pos == start) {
                        return true;
                    }
                    start = pos;
                    pos = range.toString().search(/\s+$/);
                    if (pos === 0) {
                        return false;
                    }
                    if (pos > 0) {
                        range.setEnd(node, range.startOffset + pos);
                        box = actuallyGetRangeBoundingRect(range);
                    }
                }
                if (microsoft) {
                    box = range.getClientRects()[0];
                }
                var str = range.toString();
                if (!/^(?:pre|pre-wrap)$/i.test(whiteSpace)) {
                    str = str.replace(/\s+/g, ' ');
                } else if (/\t/.test(str)) {
                    var cc = 0;
                    for (pos = origStart; pos < range.startOffset; ++pos) {
                        var code = text.charCodeAt(pos);
                        if (code == 9) {
                            cc += 8 - cc % 8;
                        } else if (code == 10 || code == 13) {
                            cc = 0;
                        } else {
                            cc++;
                        }
                    }
                    while ((pos = str.search('\t')) >= 0) {
                        var indent = '        '.substr(0, 8 - (cc + pos) % 8);
                        str = str.substr(0, pos) + indent + str.substr(pos + 1);
                    }
                }
                if (!found) {
                    prevLineBottom = box.bottom;
                }
                drawText(str, box);
            }
            function drawText(str, box) {
                if (microsoft && !isNaN(lineHeight)) {
                    var height = getFontHeight(font);
                    var top = (box.top + box.bottom - height) / 2;
                    box = {
                        top: top,
                        right: box.right,
                        bottom: top + height,
                        left: box.left,
                        height: height,
                        width: box.right - box.left
                    };
                }
                switch (textTransform) {
                case 'uppercase':
                    str = str.toUpperCase();
                    break;
                case 'lowercase':
                    str = str.toLowerCase();
                    break;
                case 'capitalize':
                    str = str.replace(/(?:^|\s)\S/g, function (l) {
                        return l.toUpperCase();
                    });
                    break;
                }
                var text = new TextRect(str, new Rect([
                    box.left,
                    box.top
                ], [
                    box.width,
                    box.height
                ]), {
                    font: font,
                    fill: { color: color }
                });
                group.append(text);
            }
            function decorate(box) {
                line(underline, box.bottom);
                line(lineThrough, box.bottom - box.height / 2.7);
                line(overline, box.top);
                function line(color, ypos) {
                    if (color) {
                        var width = fontSize / 12;
                        var path = new Path({
                            stroke: {
                                width: width,
                                color: color
                            }
                        });
                        ypos -= width;
                        path.moveTo(box.left, ypos).lineTo(box.right, ypos);
                        group.append(path);
                    }
                }
            }
        }
        function groupInStackingContext(element, group, zIndex) {
            var main;
            if (zIndex != 'auto') {
                main = nodeInfo._stackingContext.group;
                zIndex = parseFloat(zIndex);
            } else {
                main = group;
                zIndex = 0;
            }
            var a = main.children;
            for (var i = 0; i < a.length; ++i) {
                if (a[i]._dom_zIndex != null && a[i]._dom_zIndex > zIndex) {
                    break;
                }
            }
            var tmp = new Group();
            main.insert(i, tmp);
            tmp._dom_zIndex = zIndex;
            if (main !== group) {
                if (nodeInfo._clipbox) {
                    var m = nodeInfo._matrix.invert();
                    var r = nodeInfo._clipbox.transformCopy(m);
                    setClipping(tmp, Path.fromRect(r));
                }
            }
            return tmp;
        }
        function renderElement(element, container) {
            var style = getComputedStyle(element);
            updateCounters(style);
            if (/^(style|script|link|meta|iframe|svg|col|colgroup)$/i.test(element.tagName)) {
                return;
            }
            if (nodeInfo._clipbox == null) {
                return;
            }
            var opacity = parseFloat(getPropertyValue(style, 'opacity'));
            var visibility = getPropertyValue(style, 'visibility');
            var display = getPropertyValue(style, 'display');
            if (opacity === 0 || visibility == 'hidden' || display == 'none') {
                return;
            }
            var tr = getTransform(style);
            var group;
            var zIndex = getPropertyValue(style, 'z-index');
            if ((tr || opacity < 1) && zIndex == 'auto') {
                zIndex = 0;
            }
            group = groupInStackingContext(element, container, zIndex);
            if (opacity < 1) {
                group.opacity(opacity * group.opacity());
            }
            pushNodeInfo(element, style, group);
            if (!tr) {
                _renderWithPseudoElements(element, group);
            } else {
                saveStyle(element, function () {
                    pleaseSetPropertyValue(element.style, 'transform', 'none', 'important');
                    pleaseSetPropertyValue(element.style, 'transition', 'none', 'important');
                    if (getPropertyValue(style, 'position') == 'static') {
                        pleaseSetPropertyValue(element.style, 'position', 'relative', 'important');
                    }
                    var bbox = element.getBoundingClientRect();
                    var x = bbox.left + tr.origin[0];
                    var y = bbox.top + tr.origin[1];
                    var m = [
                        1,
                        0,
                        0,
                        1,
                        -x,
                        -y
                    ];
                    m = mmul(m, tr.matrix);
                    m = mmul(m, [
                        1,
                        0,
                        0,
                        1,
                        x,
                        y
                    ]);
                    m = setTransform(group, m);
                    nodeInfo._matrix = nodeInfo._matrix.multiplyCopy(m);
                    _renderWithPseudoElements(element, group);
                });
            }
            popNodeInfo();
        }
        function mmul(a, b) {
            var a1 = a[0], b1 = a[1], c1 = a[2], d1 = a[3], e1 = a[4], f1 = a[5];
            var a2 = b[0], b2 = b[1], c2 = b[2], d2 = b[3], e2 = b[4], f2 = b[5];
            return [
                a1 * a2 + b1 * c2,
                a1 * b2 + b1 * d2,
                c1 * a2 + d1 * c2,
                c1 * b2 + d1 * d2,
                e1 * a2 + f1 * c2 + e2,
                e1 * b2 + f1 * d2 + f2
            ];
        }
        var drawing = {
            svg: svg,
            canvas: canvas,
            util: util,
            PathParser: PathParser,
            Surface: Surface,
            BaseNode: BaseNode,
            SurfaceFactory: SurfaceFactory,
            OptionsStore: OptionsStore,
            exportImage: exportImage,
            exportSVG: exportSVG,
            QuadNode: QuadNode,
            ShapesQuadTree: ShapesQuadTree,
            ObserversMixin: ObserversMixin,
            Element: Element$1,
            Circle: Circle,
            Arc: Arc,
            Path: Path,
            MultiPath: MultiPath,
            Text: Text,
            Image: Image$1,
            Group: Group,
            Layout: Layout,
            Rect: Rect$2,
            align: align,
            vAlign: vAlign,
            stack: stack,
            vStack: vStack,
            wrap: wrap,
            vWrap: vWrap,
            fit: fit,
            LinearGradient: LinearGradient,
            RadialGradient: RadialGradient,
            GradientStop: GradientStop,
            Gradient: Gradient,
            Animation: Animation,
            AnimationFactory: AnimationFactory,
            drawDOM: drawDOM
        };
        suix.deepExtend(suix, {
            drawing: drawing,
            geometry: geometry
        });
        suix.drawing.Segment = suix.geometry.Segment;
        suix.dataviz.drawing = suix.drawing;
        suix.dataviz.geometry = suix.geometry;
        suix.drawing.util.measureText = suix.util.measureText;
        suix.drawing.util.objectKey = suix.util.objectKey;
        suix.drawing.Color = suix.Color;
        suix.util.encodeBase64 = suix.drawing.util.encodeBase64;
    }(window.suix.jQuery));
}, typeof define == 'function' && define.amd ? define : function (a1, a2, a3) {
    (a3 || a2)();
}));
(function (f, define) {
    define('drawing/surface-tooltip', [
        'suix.popup',
        'drawing/suix-drawing'
    ], f);
}(function () {
    (function ($) {
        var NS = '.suix';
        var suix = window.suix;
        var deepExtend = suix.deepExtend;
        var utils = suix.drawing.util;
        var defined = utils.defined;
        var limitValue = utils.limitValue;
        var eventCoordinates = utils.eventCoordinates;
        var outerWidth = suix._outerWidth;
        var outerHeight = suix._outerHeight;
        var proxy = $.proxy;
        var TOOLTIP_TEMPLATE = '<div class="k-tooltip">' + '<div class="k-tooltip-content"></div>' + '</div>';
        var TOOLTIP_CLOSE_TEMPLATE = '<div class="k-tooltip-button"><a href="\\#" class="k-icon k-i-close">close</a></div>';
        var SurfaceTooltip = suix.Class.extend({
            init: function (surface, options) {
                this.element = $(TOOLTIP_TEMPLATE);
                this.content = this.element.children('.k-tooltip-content');
                options = options || {};
                this.options = deepExtend({}, this.options, this._tooltipOptions(options));
                this.popupOptions = {
                    appendTo: options.appendTo,
                    animation: options.animation,
                    copyAnchorStyles: false,
                    collision: 'fit fit'
                };
                this._openPopupHandler = $.proxy(this._openPopup, this);
                this.surface = surface;
                this._bindEvents();
            },
            options: {
                position: 'top',
                showOn: 'mouseenter',
                offset: 7,
                autoHide: true,
                hideDelay: 0,
                showAfter: 100
            },
            _bindEvents: function () {
                this._showHandler = proxy(this._showEvent, this);
                this._surfaceLeaveHandler = proxy(this._surfaceLeave, this);
                this._mouseleaveHandler = proxy(this._mouseleave, this);
                this._mousemoveHandler = proxy(this._mousemove, this);
                this.surface.bind('click', this._showHandler);
                this.surface.bind('mouseenter', this._showHandler);
                this.surface.bind('mouseleave', this._mouseleaveHandler);
                this.surface.bind('mousemove', this._mousemoveHandler);
                this.surface.element.on('mouseleave' + NS, this._surfaceLeaveHandler);
                this.element.on('click' + NS, '.k-tooltip-button', proxy(this._hideClick, this));
                this.element.on('mouseleave' + NS, proxy(this._tooltipLeave, this));
            },
            getPopup: function () {
                if (!this.popup) {
                    this.popup = new suix.ui.Popup(this.element, this.popupOptions);
                }
                return this.popup;
            },
            destroy: function () {
                var popup = this.popup;
                this.surface.unbind('click', this._showHandler);
                this.surface.unbind('mouseenter', this._showHandler);
                this.surface.unbind('mouseleave', this._mouseleaveHandler);
                this.surface.unbind('mousemove', this._mousemoveHandler);
                this.surface.element.off('mouseleave' + NS, this._surfaceLeaveHandler);
                this.element.off('click' + NS);
                this.element.off('mouseleave' + NS);
                if (popup) {
                    popup.destroy();
                    delete this.popup;
                }
                delete this.popupOptions;
                clearTimeout(this._timeout);
                delete this.element;
                delete this.content;
                delete this.surface;
            },
            _tooltipOptions: function (options) {
                options = options || {};
                return {
                    position: options.position,
                    showOn: options.showOn,
                    offset: options.offset,
                    autoHide: options.autoHide,
                    width: options.width,
                    height: options.height,
                    content: options.content,
                    shared: options.shared,
                    hideDelay: options.hideDelay,
                    showAfter: options.showAfter
                };
            },
            _tooltipShape: function (shape) {
                while (shape && !shape.options.tooltip) {
                    shape = shape.parent;
                }
                return shape;
            },
            _updateContent: function (target, shape, options) {
                var content = options.content;
                if (suix.isFunction(content)) {
                    content = content({
                        element: shape,
                        target: target
                    });
                }
                if (content) {
                    this.content.html(content);
                    return true;
                }
            },
            _position: function (shape, options, elementSize, event) {
                var position = options.position;
                var tooltipOffset = options.offset || 0;
                var surface = this.surface;
                var offset = surface._instance._elementOffset();
                var size = surface.getSize();
                var surfaceOffset = surface._instance._offset;
                var bbox = shape.bbox();
                var width = elementSize.width;
                var height = elementSize.height;
                var left = 0, top = 0;
                bbox.origin.translate(offset.left, offset.top);
                if (surfaceOffset) {
                    bbox.origin.translate(-surfaceOffset.x, -surfaceOffset.y);
                }
                if (position == 'cursor' && event) {
                    var coord = eventCoordinates(event);
                    left = coord.x - width / 2;
                    top = coord.y - height - tooltipOffset;
                } else if (position == 'left') {
                    left = bbox.origin.x - width - tooltipOffset;
                    top = bbox.center().y - height / 2;
                } else if (position == 'right') {
                    left = bbox.bottomRight().x + tooltipOffset;
                    top = bbox.center().y - height / 2;
                } else if (position == 'bottom') {
                    left = bbox.center().x - width / 2;
                    top = bbox.bottomRight().y + tooltipOffset;
                } else {
                    left = bbox.center().x - width / 2;
                    top = bbox.origin.y - height - tooltipOffset;
                }
                return {
                    left: limitValue(left, offset.left, offset.left + size.width),
                    top: limitValue(top, offset.top, offset.top + size.height)
                };
            },
            show: function (shape, options) {
                this._show(shape, shape, deepExtend({}, this.options, this._tooltipOptions(shape.options.tooltip), options));
            },
            hide: function () {
                var popup = this.popup;
                var current = this._current;
                delete this._current;
                clearTimeout(this._showTimeout);
                if (popup && popup.visible() && current && !this.surface.trigger('tooltipClose', {
                        element: current.shape,
                        target: current.target,
                        popup: popup
                    })) {
                    popup.close();
                }
            },
            _hideClick: function (e) {
                e.preventDefault();
                this.hide();
            },
            _show: function (target, shape, options, event, delay) {
                var current = this._current;
                clearTimeout(this._timeout);
                if (current && (current.shape === shape && options.shared || current.target === target)) {
                    return;
                }
                clearTimeout(this._showTimeout);
                var popup = this.getPopup();
                if (!this.surface.trigger('tooltipOpen', {
                        element: shape,
                        target: target,
                        popup: popup
                    }) && this._updateContent(target, shape, options)) {
                    this._autoHide(options);
                    var elementSize = this._measure(options);
                    if (popup.visible()) {
                        popup.close(true);
                    }
                    this._current = {
                        options: options,
                        elementSize: elementSize,
                        shape: shape,
                        target: target,
                        position: this._position(options.shared ? shape : target, options, elementSize, event)
                    };
                    if (delay) {
                        this._showTimeout = setTimeout(this._openPopupHandler, options.showAfter || 0);
                    } else {
                        this._openPopup();
                    }
                }
            },
            _openPopup: function () {
                var current = this._current;
                var position = current.position;
                this.getPopup().open(position.left, position.top);
            },
            _autoHide: function (options) {
                if (options.autoHide && this._closeButton) {
                    this.element.removeClass('k-tooltip-closable');
                    this._closeButton.remove();
                    delete this._closeButton;
                }
                if (!options.autoHide && !this._closeButton) {
                    this.element.addClass('k-tooltip-closable');
                    this._closeButton = $(TOOLTIP_CLOSE_TEMPLATE).appendTo(this.element);
                }
            },
            _showEvent: function (e) {
                var shape = this._tooltipShape(e.element);
                if (shape) {
                    var options = deepExtend({}, this.options, this._tooltipOptions(shape.options.tooltip));
                    if (options && options.showOn == e.type) {
                        this._show(e.element, shape, options, e.originalEvent, true);
                    }
                }
            },
            _measure: function (options) {
                var popup = this.getPopup();
                var width, height;
                this.element.css({
                    width: 'auto',
                    height: 'auto'
                });
                var visible = popup.visible();
                if (!visible) {
                    popup.wrapper.show();
                }
                this.element.css({
                    width: defined(options.width) ? options.width : 'auto',
                    height: defined(options.height) ? options.height : 'auto'
                });
                width = outerWidth(this.element);
                height = outerHeight(this.element);
                if (!visible) {
                    popup.wrapper.hide();
                }
                return {
                    width: width,
                    height: height
                };
            },
            _mouseleave: function (e) {
                if (this.popup && !this._popupRelatedTarget(e.originalEvent)) {
                    var tooltip = this;
                    var current = tooltip._current;
                    if (current && current.options.autoHide) {
                        tooltip._timeout = setTimeout(function () {
                            clearTimeout(tooltip._showTimeout);
                            tooltip.hide();
                        }, current.options.hideDelay || 0);
                    }
                }
            },
            _mousemove: function (e) {
                var current = this._current;
                if (current && e.element) {
                    var options = current.options;
                    if (options.position == 'cursor') {
                        var position = this._position(e.element, options, current.elementSize, e.originalEvent);
                        current.position = position;
                        this.getPopup().wrapper.css({
                            left: position.left,
                            top: position.top
                        });
                    }
                }
            },
            _surfaceLeave: function (e) {
                if (this.popup && !this._popupRelatedTarget(e)) {
                    clearTimeout(this._showTimeout);
                    this.hide();
                }
            },
            _popupRelatedTarget: function (e) {
                return e.relatedTarget && $(e.relatedTarget).closest(this.popup.wrapper).length;
            },
            _tooltipLeave: function () {
                var tooltip = this;
                var current = tooltip._current;
                if (current && current.options.autoHide) {
                    tooltip._timeout = setTimeout(function () {
                        tooltip.hide();
                    }, current.options.hideDelay || 0);
                }
            }
        });
        suix.drawing.SurfaceTooltip = SurfaceTooltip;
    }(window.suix.jQuery));
}, typeof define == 'function' && define.amd ? define : function (a1, a2, a3) {
    (a3 || a2)();
}));
(function (f, define) {
    define('drawing/surface', [
        'drawing/suix-drawing',
        'drawing/surface-tooltip'
    ], f);
}(function () {
    (function ($) {
        var suix = window.suix;
        var draw = suix.drawing;
        var DrawingSurface = draw.Surface;
        var Widget = suix.ui.Widget;
        var deepExtend = suix.deepExtend;
        var proxy = $.proxy;
        suix.support.svg = DrawingSurface.support.svg;
        suix.support.canvas = DrawingSurface.support.canvas;
        var Surface = Widget.extend({
            init: function (element, options) {
                Widget.fn.init.call(this, element, {});
                this.options = deepExtend({}, this.options, options);
                this._instance = DrawingSurface.create(this.element[0], options);
                if (this._instance.translate) {
                    this.translate = translate;
                }
                this._triggerInstanceHandler = proxy(this._triggerInstanceEvent, this);
                this._bindHandler('click');
                this._bindHandler('mouseenter');
                this._bindHandler('mouseleave');
                this._bindHandler('mousemove');
                this._enableTracking();
            },
            options: {
                name: 'Surface',
                tooltip: {}
            },
            events: [
                'click',
                'mouseenter',
                'mouseleave',
                'mousemove',
                'resize',
                'tooltipOpen',
                'tooltipClose'
            ],
            _triggerInstanceEvent: function (e) {
                this.trigger(e.type, e);
            },
            _bindHandler: function (event) {
                this._instance.bind(event, this._triggerInstanceHandler);
            },
            draw: function (element) {
                this._instance.draw(element);
            },
            clear: function () {
                if (this._instance) {
                    this._instance.clear();
                }
                this.hideTooltip();
            },
            destroy: function () {
                if (this._instance) {
                    this._instance.destroy();
                    delete this._instance;
                }
                if (this._tooltip) {
                    this._tooltip.destroy();
                    delete this._tooltip;
                }
                Widget.fn.destroy.call(this);
            },
            exportVisual: function () {
                return this._instance.exportVisual();
            },
            eventTarget: function (e) {
                return this._instance.eventTarget(e);
            },
            showTooltip: function (shape, options) {
                if (this._tooltip) {
                    this._tooltip.show(shape, options);
                }
            },
            hideTooltip: function () {
                if (this._tooltip) {
                    this._tooltip.hide();
                }
            },
            suspendTracking: function () {
                this._instance.suspendTracking();
                this.hideTooltip();
            },
            resumeTracking: function () {
                this._instance.resumeTracking();
            },
            getSize: function () {
                return {
                    width: this.element.width(),
                    height: this.element.height()
                };
            },
            setSize: function (size) {
                this.element.css({
                    width: size.width,
                    height: size.height
                });
                this._size = size;
                this._instance.currentSize(size);
                this._resize();
            },
            _resize: function () {
                this._instance.currentSize(this._size);
                this._instance._resize();
            },
            _enableTracking: function () {
                if (suix.ui.Popup) {
                    this._tooltip = new draw.SurfaceTooltip(this, this.options.tooltip || {});
                }
            }
        });
        suix.ui.plugin(Surface);
        Surface.create = function (element, options) {
            return new Surface(element, options);
        };
        suix.drawing.Surface = Surface;
        function translate(offset) {
            this._instance.translate(offset);
        }
    }(window.suix.jQuery));
}, typeof define == 'function' && define.amd ? define : function (a1, a2, a3) {
    (a3 || a2)();
}));
(function (f, define) {
    define('drawing/html', ['drawing/suix-drawing'], f);
}(function () {
    (function ($) {
        var suix = window.suix;
        var drawing = suix.drawing;
        var drawDOM = drawing.drawDOM;
        drawing.drawDOM = function (element, options) {
            return drawDOM($(element)[0], options);
        };
        drawing.drawDOM.drawText = drawDOM.drawText;
        drawing.drawDOM.getFontFaces = drawDOM.getFontFaces;
    }(window.suix.jQuery));
}, typeof define == 'function' && define.amd ? define : function (a1, a2, a3) {
    (a3 || a2)();
}));
(function (f, define) {
    define('suix.dataviz.core', [
        'dataviz/core/suix-core',
        'dataviz/core/core'
    ], f);
}(function () {
    var __meta__ = {
        id: 'dataviz.core',
        name: 'Core',
        description: 'The DataViz core functions',
        category: 'dataviz',
        depends: [
            'core',
            'drawing'
        ],
        hidden: true
    };
}, typeof define == 'function' && define.amd ? define : function (a1, a2, a3) {
    (a3 || a2)();
}));
(function (f, define) {
    define('dataviz/core/suix-core', [
        'suix.core',
        'suix.drawing'
    ], f);
}(function () {
    (function ($) {
        window.suix.dataviz = window.suix.dataviz || {};
        var drawing = suix.drawing;
        var util = drawing.util;
        var Path = drawing.Path;
        var Group = drawing.Group;
        var Class = suix.Class;
        var geometry = suix.geometry;
        var Rect = geometry.Rect;
        var Circle = geometry.Circle;
        var geometryTransform = geometry.transform;
        var Segment = geometry.Segment;
        var dataviz = suix.dataviz;
        var deepExtend = suix.deepExtend;
        var isFunction = suix.isFunction;
        var __common_getter_js = suix.getter;
        var ARC = 'arc';
        var AXIS_LABEL_CLICK = 'axisLabelClick';
        var BLACK = '#000';
        var BOTTOM = 'bottom';
        var CENTER = 'center';
        var CIRCLE = 'circle';
        var COORD_PRECISION = 3;
        var CROSS = 'cross';
        var DATE = 'date';
        var DEFAULT_FONT = '12px sans-serif';
        var DEFAULT_HEIGHT = 400;
        var DEFAULT_PRECISION = 10;
        var DEFAULT_WIDTH = 600;
        var END = 'end';
        var FORMAT_REGEX = /\{\d+:?/;
        var HEIGHT = 'height';
        var HIGHLIGHT_ZINDEX = 100;
        var INSIDE = 'inside';
        var LEFT = 'left';
        var MAX_VALUE = Number.MAX_VALUE;
        var MIN_VALUE = -Number.MAX_VALUE;
        var NONE = 'none';
        var NOTE_CLICK = 'noteClick';
        var NOTE_HOVER = 'noteHover';
        var NOTE_LEAVE = 'noteLeave';
        var OBJECT = 'object';
        var OUTSIDE = 'outside';
        var RIGHT = 'right';
        var START = 'start';
        var STRING = 'string';
        var TOP = 'top';
        var TRIANGLE = 'triangle';
        var VALUE = 'value';
        var WHITE = '#fff';
        var WIDTH = 'width';
        var X = 'x';
        var Y = 'y';
        var constants = {
            ARC: ARC,
            AXIS_LABEL_CLICK: AXIS_LABEL_CLICK,
            BLACK: BLACK,
            BOTTOM: BOTTOM,
            CENTER: CENTER,
            CIRCLE: CIRCLE,
            COORD_PRECISION: COORD_PRECISION,
            CROSS: CROSS,
            DATE: DATE,
            DEFAULT_FONT: DEFAULT_FONT,
            DEFAULT_HEIGHT: DEFAULT_HEIGHT,
            DEFAULT_PRECISION: DEFAULT_PRECISION,
            DEFAULT_WIDTH: DEFAULT_WIDTH,
            END: END,
            FORMAT_REGEX: FORMAT_REGEX,
            HEIGHT: HEIGHT,
            HIGHLIGHT_ZINDEX: HIGHLIGHT_ZINDEX,
            INSIDE: INSIDE,
            LEFT: LEFT,
            MAX_VALUE: MAX_VALUE,
            MIN_VALUE: MIN_VALUE,
            NONE: NONE,
            NOTE_CLICK: NOTE_CLICK,
            NOTE_HOVER: NOTE_HOVER,
            NOTE_LEAVE: NOTE_LEAVE,
            OBJECT: OBJECT,
            OUTSIDE: OUTSIDE,
            RIGHT: RIGHT,
            START: START,
            STRING: STRING,
            TOP: TOP,
            TRIANGLE: TRIANGLE,
            VALUE: VALUE,
            WHITE: WHITE,
            WIDTH: WIDTH,
            X: X,
            Y: Y
        };
        function isArray(value) {
            return Array.isArray(value);
        }
        function addClass(element, classes) {
            var classArray = isArray(classes) ? classes : [classes];
            for (var idx = 0; idx < classArray.length; idx++) {
                var className = classArray[idx];
                if (element.className.indexOf(className) === -1) {
                    element.className += ' ' + className;
                }
            }
        }
        var SPACE_REGEX = /\s+/g;
        function removeClass(element, className) {
            if (element && element.className) {
                element.className = element.className.replace(className, '').replace(SPACE_REGEX, ' ');
            }
        }
        function alignPathToPixel(path) {
            var offset = 0.5;
            if (path.options.stroke && suix.drawing.util.defined(path.options.stroke.width)) {
                if (path.options.stroke.width % 2 === 0) {
                    offset = 0;
                }
            }
            for (var i = 0; i < path.segments.length; i++) {
                path.segments[i].anchor().round(0).translate(offset, offset);
            }
            return path;
        }
        function clockwise(angle1, angle2) {
            return -angle1.x * angle2.y + angle1.y * angle2.x < 0;
        }
        function isNumber(value) {
            return typeof value === 'number' && !isNaN(value);
        }
        function isString(value) {
            return typeof value === STRING;
        }
        function convertableToNumber(value) {
            return isNumber(value) || isString(value) && isFinite(value);
        }
        function isObject(value) {
            return typeof value === 'object';
        }
        function styleValue(value) {
            if (isNumber(value)) {
                return value + 'px';
            }
            return value;
        }
        var SIZE_STYLES_REGEX = /width|height|top|left|bottom|right/i;
        function isSizeField(field) {
            return SIZE_STYLES_REGEX.test(field);
        }
        function elementStyles(element, styles) {
            var stylesArray = isString(styles) ? [styles] : styles;
            if (isArray(stylesArray)) {
                var result = {};
                var style = window.getComputedStyle(element);
                for (var idx = 0; idx < stylesArray.length; idx++) {
                    var field = stylesArray[idx];
                    result[field] = isSizeField(field) ? parseFloat(style[field]) : style[field];
                }
                return result;
            } else if (isObject(styles)) {
                for (var field$1 in styles) {
                    element.style[field$1] = styleValue(styles[field$1]);
                }
            }
        }
        function getSpacing(value, defaultSpacing) {
            if (defaultSpacing === void 0) {
                defaultSpacing = 0;
            }
            var spacing = {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            };
            if (typeof value === 'number') {
                spacing[TOP] = spacing[RIGHT] = spacing[BOTTOM] = spacing[LEFT] = value;
            } else {
                spacing[TOP] = value[TOP] || defaultSpacing;
                spacing[RIGHT] = value[RIGHT] || defaultSpacing;
                spacing[BOTTOM] = value[BOTTOM] || defaultSpacing;
                spacing[LEFT] = value[LEFT] || defaultSpacing;
            }
            return spacing;
        }
        var defaultImplementation = {
            format: function (format, value) {
                return value;
            },
            toString: function (value) {
                return value;
            },
            parseDate: function (value) {
                return new Date(value);
            }
        };
        var current = defaultImplementation;
        var IntlService = Class.extend({});
        IntlService.register = function (userImplementation) {
            current = userImplementation;
        };
        if (Object.defineProperties) {
            Object.defineProperties(IntlService, {
                implementation: {
                    get: function () {
                        return current;
                    }
                }
            });
        }
        var FORMAT_REPLACE_REGEX = /\{(\d+)(:[^\}]+)?\}/g;
        var FormatService = Class.extend({
            init: function (intlService) {
                this._intlService = intlService;
            },
            auto: function (formatString) {
                var values = [], len = arguments.length - 1;
                while (len-- > 0)
                    values[len] = arguments[len + 1];
                var intl = this.intl;
                if (isString(formatString) && formatString.match(FORMAT_REGEX)) {
                    return intl.format.apply(intl, [formatString].concat(values));
                }
                return intl.toString(values[0], formatString);
            },
            localeAuto: function (formatString, values, locale) {
                var intl = this.intl;
                var result;
                if (isString(formatString) && formatString.match(FORMAT_REGEX)) {
                    result = formatString.replace(FORMAT_REPLACE_REGEX, function (match, index, placeholderFormat) {
                        var value = values[parseInt(index, 10)];
                        return intl.toString(value, placeholderFormat ? placeholderFormat.substring(1) : '', locale);
                    });
                } else {
                    result = intl.toString(values[0], formatString, locale);
                }
                return result;
            }
        });
        if (Object.defineProperties) {
            Object.defineProperties(FormatService.fn, {
                intl: {
                    get: function () {
                        return this._intlService || IntlService.implementation;
                    },
                    set: function (value) {
                        this._intlService = value;
                    }
                }
            });
        }
        var ChartService = Class.extend({
            init: function (chart, context) {
                if (context === void 0) {
                    context = {};
                }
                this._intlService = context.intlService;
                this.sender = context.sender || chart;
                this.format = new FormatService(context.intlService);
                this.chart = chart;
                this.rtl = Boolean(context.rtl);
            },
            notify: function (name, args) {
                if (this.chart) {
                    this.chart.trigger(name, args);
                }
            },
            isPannable: function (axis) {
                var pannable = ((this.chart || {}).options || {}).pannable;
                return pannable && pannable.lock !== axis;
            }
        });
        if (Object.defineProperties) {
            Object.defineProperties(ChartService.fn, {
                intl: {
                    get: function () {
                        return this._intlService || IntlService.implementation;
                    },
                    set: function (value) {
                        this._intlService = value;
                        this.format.intl = value;
                    }
                }
            });
        }
        var current$1;
        var DomEventsBuilder = Class.extend({});
        DomEventsBuilder.register = function (userImplementation) {
            current$1 = userImplementation;
        };
        DomEventsBuilder.create = function (element, events) {
            if (current$1) {
                return current$1.create(element, events);
            }
        };
        var current$2 = {
            compile: function (template) {
                return template;
            }
        };
        var TemplateService = Class.extend({});
        TemplateService.register = function (userImplementation) {
            current$2 = userImplementation;
        };
        TemplateService.compile = function (template) {
            return current$2.compile(template);
        };
        var services = {
            ChartService: ChartService,
            DomEventsBuilder: DomEventsBuilder,
            FormatService: FormatService,
            IntlService: IntlService,
            TemplateService: TemplateService
        };
        function getTemplate(options) {
            if (options === void 0) {
                options = {};
            }
            var template;
            if (options.template) {
                options.template = template = TemplateService.compile(options.template);
            } else if (isFunction(options.content)) {
                template = options.content;
            }
            return template;
        }
        function grep(array, callback) {
            var length = array.length;
            var result = [];
            for (var idx = 0; idx < length; idx++) {
                if (callback(array[idx])) {
                    result.push(array[idx]);
                }
            }
            return result;
        }
        function hasClasses(element, classNames) {
            if (element.className) {
                var names = classNames.split(' ');
                for (var idx = 0; idx < names.length; idx++) {
                    if (element.className.indexOf(names[idx]) !== -1) {
                        return true;
                    }
                }
            }
        }
        var HashMap = function HashMap() {
            this._map = {};
        };
        HashMap.prototype.get = function get(name) {
            return this._map[this._key(name)];
        };
        HashMap.prototype.set = function set(name, value) {
            this._map[this._key(name)] = value;
        };
        HashMap.prototype._key = function _key(name) {
            return name instanceof Date ? name.getTime() : name;
        };
        function inArray(value, array) {
            if (array) {
                return array.indexOf(value) !== -1;
            }
        }
        function interpolateValue(start, end, progress) {
            return suix.drawing.util.round(start + (end - start) * progress, COORD_PRECISION);
        }
        var TRIGGER = 'trigger';
        var InstanceObserver = Class.extend({
            init: function (observer, handlers) {
                this.observer = observer;
                this.handlerMap = deepExtend({}, this.handlerMap, handlers);
            },
            trigger: function (name, args) {
                var ref = this;
                var observer = ref.observer;
                var handlerMap = ref.handlerMap;
                var isDefaultPrevented;
                if (handlerMap[name]) {
                    isDefaultPrevented = this.callObserver(handlerMap[name], args);
                } else if (observer[TRIGGER]) {
                    isDefaultPrevented = this.callObserver(TRIGGER, name, args);
                }
                return isDefaultPrevented;
            },
            callObserver: function (fnName) {
                var args = [], len = arguments.length - 1;
                while (len-- > 0)
                    args[len] = arguments[len + 1];
                return this.observer[fnName].apply(this.observer, args);
            },
            requiresHandlers: function (names) {
                var this$1 = this;
                if (this.observer.requiresHandlers) {
                    return this.observer.requiresHandlers(names);
                }
                for (var idx = 0; idx < names.length; idx++) {
                    if (this$1.handlerMap[names[idx]]) {
                        return true;
                    }
                }
            }
        });
        function map(array, callback) {
            var length = array.length;
            var result = [];
            for (var idx = 0; idx < length; idx++) {
                var value = callback(array[idx]);
                if (suix.drawing.util.defined(value)) {
                    result.push(value);
                }
            }
            return result;
        }
        function mousewheelDelta(e) {
            var delta = 0;
            if (e.wheelDelta) {
                delta = -e.wheelDelta / 120;
                delta = delta > 0 ? Math.ceil(delta) : Math.floor(delta);
            }
            if (e.detail) {
                delta = suix.drawing.util.round(e.detail / 3);
            }
            return delta;
        }
        var ref = suix.drawing.util;
        var append = ref.append;
        var bindEvents = ref.bindEvents;
        var defined = ref.defined;
        var deg = ref.deg;
        var elementOffset = ref.elementOffset;
        var elementSize = ref.elementSize;
        var eventElement = ref.eventElement;
        var eventCoordinates = ref.eventCoordinates;
        var last = ref.last;
        var limitValue = ref.limitValue;
        var objectKey = ref.objectKey;
        var rad = ref.rad;
        var round = ref.round;
        var unbindEvents = ref.unbindEvents;
        var valueOrDefault = ref.valueOrDefault;
        var FontLoader = Class.extend({});
        FontLoader.fetchFonts = function (options, fonts, state) {
            if (state === void 0) {
                state = { depth: 0 };
            }
            var MAX_DEPTH = 5;
            if (!options || state.depth > MAX_DEPTH || !document.fonts) {
                return;
            }
            Object.keys(options).forEach(function (key) {
                var value = options[key];
                if (key === 'dataSource' || key[0] === '$' || !value) {
                    return;
                }
                if (key === 'font') {
                    fonts.push(value);
                } else if (typeof value === 'object') {
                    state.depth++;
                    FontLoader.fetchFonts(value, fonts, state);
                    state.depth--;
                }
            });
        };
        FontLoader.loadFonts = function (fonts, callback) {
            var promises = [];
            if (fonts.length > 0 && document.fonts) {
                try {
                    promises = fonts.map(function (font) {
                        return document.fonts.load(font);
                    });
                } catch (e) {
                    suix.logToConsole(e);
                }
                Promise.all(promises).then(callback, callback);
            } else {
                callback();
            }
        };
        FontLoader.preloadFonts = function (options, callback) {
            var fonts = [];
            FontLoader.fetchFonts(options, fonts);
            FontLoader.loadFonts(fonts, callback);
        };
        function setDefaultOptions(type, options) {
            var proto = type.prototype;
            if (proto.options) {
                proto.options = deepExtend({}, proto.options, options);
            } else {
                proto.options = options;
            }
        }
        function sparseArrayLimits(arr) {
            var min = MAX_VALUE;
            var max = MIN_VALUE;
            for (var idx = 0, length = arr.length; idx < length; idx++) {
                var value = arr[idx];
                if (value !== null && isFinite(value)) {
                    min = Math.min(min, value);
                    max = Math.max(max, value);
                }
            }
            return {
                min: min === MAX_VALUE ? undefined : min,
                max: max === MIN_VALUE ? undefined : max
            };
        }
        function find(array, predicate) {
            for (var i = 0; i < array.length; i++) {
                var item = array[i];
                if (predicate(item, i, array)) {
                    return item;
                }
            }
        }
        function autoMajorUnit(min, max) {
            var diff = round(max - min, DEFAULT_PRECISION - 1);
            if (diff === 0) {
                if (max === 0) {
                    return 0.1;
                }
                diff = Math.abs(max);
            }
            var scale = Math.pow(10, Math.floor(Math.log(diff) / Math.log(10)));
            var relativeValue = round(diff / scale, DEFAULT_PRECISION);
            var scaleMultiplier = 1;
            if (relativeValue < 1.904762) {
                scaleMultiplier = 0.2;
            } else if (relativeValue < 4.761904) {
                scaleMultiplier = 0.5;
            } else if (relativeValue < 9.523809) {
                scaleMultiplier = 1;
            } else {
                scaleMultiplier = 2;
            }
            return round(scale * scaleMultiplier, DEFAULT_PRECISION);
        }
        var Point = Class.extend({
            init: function (x, y) {
                this.x = x || 0;
                this.y = y || 0;
            },
            clone: function () {
                return new Point(this.x, this.y);
            },
            equals: function (point) {
                return point && this.x === point.x && this.y === point.y;
            },
            rotate: function (center, degrees) {
                var theta = rad(degrees);
                var cosT = Math.cos(theta);
                var sinT = Math.sin(theta);
                var cx = center.x;
                var cy = center.y;
                var ref = this;
                var x = ref.x;
                var y = ref.y;
                this.x = round(cx + (x - cx) * cosT + (y - cy) * sinT, COORD_PRECISION);
                this.y = round(cy + (y - cy) * cosT - (x - cx) * sinT, COORD_PRECISION);
                return this;
            },
            multiply: function (a) {
                this.x *= a;
                this.y *= a;
                return this;
            },
            distanceTo: function (point) {
                var dx = this.x - point.x;
                var dy = this.y - point.y;
                return Math.sqrt(dx * dx + dy * dy);
            }
        });
        Point.onCircle = function (center, angle, radius) {
            var radians = rad(angle);
            return new Point(center.x - radius * Math.cos(radians), center.y - radius * Math.sin(radians));
        };
        var Box = Class.extend({
            init: function (x1, y1, x2, y2) {
                this.x1 = x1 || 0;
                this.y1 = y1 || 0;
                this.x2 = x2 || 0;
                this.y2 = y2 || 0;
            },
            equals: function (box) {
                return this.x1 === box.x1 && this.x2 === box.x2 && this.y1 === box.y1 && this.y2 === box.y2;
            },
            width: function () {
                return this.x2 - this.x1;
            },
            height: function () {
                return this.y2 - this.y1;
            },
            translate: function (dx, dy) {
                this.x1 += dx;
                this.x2 += dx;
                this.y1 += dy;
                this.y2 += dy;
                return this;
            },
            move: function (x, y) {
                var height = this.height();
                var width = this.width();
                if (defined(x)) {
                    this.x1 = x;
                    this.x2 = this.x1 + width;
                }
                if (defined(y)) {
                    this.y1 = y;
                    this.y2 = this.y1 + height;
                }
                return this;
            },
            wrap: function (targetBox) {
                this.x1 = Math.min(this.x1, targetBox.x1);
                this.y1 = Math.min(this.y1, targetBox.y1);
                this.x2 = Math.max(this.x2, targetBox.x2);
                this.y2 = Math.max(this.y2, targetBox.y2);
                return this;
            },
            wrapPoint: function (point) {
                var arrayPoint = isArray(point);
                var x = arrayPoint ? point[0] : point.x;
                var y = arrayPoint ? point[1] : point.y;
                this.wrap(new Box(x, y, x, y));
                return this;
            },
            snapTo: function (targetBox, axis) {
                if (axis === X || !axis) {
                    this.x1 = targetBox.x1;
                    this.x2 = targetBox.x2;
                }
                if (axis === Y || !axis) {
                    this.y1 = targetBox.y1;
                    this.y2 = targetBox.y2;
                }
                return this;
            },
            alignTo: function (targetBox, anchor) {
                var height = this.height();
                var width = this.width();
                var axis = anchor === TOP || anchor === BOTTOM ? Y : X;
                var offset = axis === Y ? height : width;
                if (anchor === CENTER) {
                    var targetCenter = targetBox.center();
                    var center = this.center();
                    this.x1 += targetCenter.x - center.x;
                    this.y1 += targetCenter.y - center.y;
                } else if (anchor === TOP || anchor === LEFT) {
                    this[axis + 1] = targetBox[axis + 1] - offset;
                } else {
                    this[axis + 1] = targetBox[axis + 2];
                }
                this.x2 = this.x1 + width;
                this.y2 = this.y1 + height;
                return this;
            },
            shrink: function (dw, dh) {
                this.x2 -= dw;
                this.y2 -= dh;
                return this;
            },
            expand: function (dw, dh) {
                this.shrink(-dw, -dh);
                return this;
            },
            pad: function (padding) {
                var spacing = getSpacing(padding);
                this.x1 -= spacing.left;
                this.x2 += spacing.right;
                this.y1 -= spacing.top;
                this.y2 += spacing.bottom;
                return this;
            },
            unpad: function (padding) {
                var spacing = getSpacing(padding);
                spacing.left = -spacing.left;
                spacing.top = -spacing.top;
                spacing.right = -spacing.right;
                spacing.bottom = -spacing.bottom;
                return this.pad(spacing);
            },
            clone: function () {
                return new Box(this.x1, this.y1, this.x2, this.y2);
            },
            center: function () {
                return new Point(this.x1 + this.width() / 2, this.y1 + this.height() / 2);
            },
            containsPoint: function (point) {
                return point.x >= this.x1 && point.x <= this.x2 && point.y >= this.y1 && point.y <= this.y2;
            },
            points: function () {
                return [
                    new Point(this.x1, this.y1),
                    new Point(this.x2, this.y1),
                    new Point(this.x2, this.y2),
                    new Point(this.x1, this.y2)
                ];
            },
            getHash: function () {
                return [
                    this.x1,
                    this.y1,
                    this.x2,
                    this.y2
                ].join(',');
            },
            overlaps: function (box) {
                return !(box.y2 < this.y1 || this.y2 < box.y1 || box.x2 < this.x1 || this.x2 < box.x1);
            },
            rotate: function (rotation) {
                var width = this.width();
                var height = this.height();
                var ref = this.center();
                var cx = ref.x;
                var cy = ref.y;
                var r1 = rotatePoint(0, 0, cx, cy, rotation);
                var r2 = rotatePoint(width, 0, cx, cy, rotation);
                var r3 = rotatePoint(width, height, cx, cy, rotation);
                var r4 = rotatePoint(0, height, cx, cy, rotation);
                width = Math.max(r1.x, r2.x, r3.x, r4.x) - Math.min(r1.x, r2.x, r3.x, r4.x);
                height = Math.max(r1.y, r2.y, r3.y, r4.y) - Math.min(r1.y, r2.y, r3.y, r4.y);
                this.x2 = this.x1 + width;
                this.y2 = this.y1 + height;
                return this;
            },
            toRect: function () {
                return new Rect([
                    this.x1,
                    this.y1
                ], [
                    this.width(),
                    this.height()
                ]);
            },
            hasSize: function () {
                return this.width() !== 0 && this.height() !== 0;
            },
            align: function (targetBox, axis, alignment) {
                var c1 = axis + 1;
                var c2 = axis + 2;
                var sizeFunc = axis === X ? WIDTH : HEIGHT;
                var size = this[sizeFunc]();
                if (inArray(alignment, [
                        LEFT,
                        TOP
                    ])) {
                    this[c1] = targetBox[c1];
                    this[c2] = this[c1] + size;
                } else if (inArray(alignment, [
                        RIGHT,
                        BOTTOM
                    ])) {
                    this[c2] = targetBox[c2];
                    this[c1] = this[c2] - size;
                } else if (alignment === CENTER) {
                    this[c1] = targetBox[c1] + (targetBox[sizeFunc]() - size) / 2;
                    this[c2] = this[c1] + size;
                }
            }
        });
        function rotatePoint(x, y, cx, cy, angle) {
            var theta = rad(angle);
            return new Point(cx + (x - cx) * Math.cos(theta) + (y - cy) * Math.sin(theta), cy - (x - cx) * Math.sin(theta) + (y - cy) * Math.cos(theta));
        }
        var Ring = Class.extend({
            init: function (center, innerRadius, radius, startAngle, angle) {
                this.center = center;
                this.innerRadius = innerRadius;
                this.radius = radius;
                this.startAngle = startAngle;
                this.angle = angle;
            },
            clone: function () {
                return new Ring(this.center, this.innerRadius, this.radius, this.startAngle, this.angle);
            },
            middle: function () {
                return this.startAngle + this.angle / 2;
            },
            setRadius: function (newRadius, innerRadius) {
                if (innerRadius) {
                    this.innerRadius = newRadius;
                } else {
                    this.radius = newRadius;
                }
                return this;
            },
            point: function (angle, innerRadius) {
                var radianAngle = rad(angle);
                var ax = Math.cos(radianAngle);
                var ay = Math.sin(radianAngle);
                var radius = innerRadius ? this.innerRadius : this.radius;
                var x = round(this.center.x - ax * radius, COORD_PRECISION);
                var y = round(this.center.y - ay * radius, COORD_PRECISION);
                return new Point(x, y);
            },
            adjacentBox: function (distance, width, height) {
                var sector = this.clone().expand(distance);
                var midAndle = sector.middle();
                var midPoint = sector.point(midAndle);
                var hw = width / 2;
                var hh = height / 2;
                var sa = Math.sin(rad(midAndle));
                var ca = Math.cos(rad(midAndle));
                var x = midPoint.x - hw;
                var y = midPoint.y - hh;
                if (Math.abs(sa) < 0.9) {
                    x += hw * -ca / Math.abs(ca);
                }
                if (Math.abs(ca) < 0.9) {
                    y += hh * -sa / Math.abs(sa);
                }
                return new Box(x, y, x + width, y + height);
            },
            containsPoint: function (p) {
                var center = this.center;
                var innerRadius = this.innerRadius;
                var radius = this.radius;
                var startAngle = this.startAngle;
                var endAngle = this.startAngle + this.angle;
                var dx = p.x - center.x;
                var dy = p.y - center.y;
                var vector = new Point(dx, dy);
                var startPoint = this.point(startAngle);
                var startVector = new Point(startPoint.x - center.x, startPoint.y - center.y);
                var endPoint = this.point(endAngle);
                var endVector = new Point(endPoint.x - center.x, endPoint.y - center.y);
                var dist = round(dx * dx + dy * dy, COORD_PRECISION);
                return (startVector.equals(vector) || clockwise(startVector, vector)) && !clockwise(endVector, vector) && dist >= innerRadius * innerRadius && dist <= radius * radius;
            },
            getBBox: function () {
                var this$1 = this;
                var box = new Box(MAX_VALUE, MAX_VALUE, MIN_VALUE, MIN_VALUE);
                var startAngle = round(this.startAngle % 360);
                var endAngle = round((startAngle + this.angle) % 360);
                var innerRadius = this.innerRadius;
                var allAngles = [
                    0,
                    90,
                    180,
                    270,
                    startAngle,
                    endAngle
                ].sort(numericComparer);
                var startAngleIndex = allAngles.indexOf(startAngle);
                var endAngleIndex = allAngles.indexOf(endAngle);
                var angles;
                if (startAngle === endAngle) {
                    angles = allAngles;
                } else {
                    if (startAngleIndex < endAngleIndex) {
                        angles = allAngles.slice(startAngleIndex, endAngleIndex + 1);
                    } else {
                        angles = [].concat(allAngles.slice(0, endAngleIndex + 1), allAngles.slice(startAngleIndex, allAngles.length));
                    }
                }
                for (var i = 0; i < angles.length; i++) {
                    var point = this$1.point(angles[i]);
                    box.wrapPoint(point);
                    box.wrapPoint(point, innerRadius);
                }
                if (!innerRadius) {
                    box.wrapPoint(this.center);
                }
                return box;
            },
            expand: function (value) {
                this.radius += value;
                return this;
            }
        });
        function numericComparer(a, b) {
            return a - b;
        }
        var Sector = Ring.extend({
            init: function (center, radius, startAngle, angle) {
                Ring.fn.init.call(this, center, 0, radius, startAngle, angle);
            },
            expand: function (value) {
                return Ring.fn.expand.call(this, value);
            },
            clone: function () {
                return new Sector(this.center, this.radius, this.startAngle, this.angle);
            },
            setRadius: function (newRadius) {
                this.radius = newRadius;
                return this;
            }
        });
        var DIRECTION_ANGLE = 0.001;
        var ShapeBuilder = Class.extend({
            createRing: function (sector, options) {
                var startAngle = sector.startAngle + 180;
                var endAngle = sector.angle + startAngle;
                if (sector.angle > 0 && startAngle === endAngle) {
                    endAngle += DIRECTION_ANGLE;
                }
                var center = new geometry.Point(sector.center.x, sector.center.y);
                var radius = Math.max(sector.radius, 0);
                var innerRadius = Math.max(sector.innerRadius, 0);
                var arc = new geometry.Arc(center, {
                    startAngle: startAngle,
                    endAngle: endAngle,
                    radiusX: radius,
                    radiusY: radius
                });
                var path = Path.fromArc(arc, options).close();
                if (innerRadius) {
                    arc.radiusX = arc.radiusY = innerRadius;
                    var innerEnd = arc.pointAt(endAngle);
                    path.lineTo(innerEnd.x, innerEnd.y);
                    path.arc(endAngle, startAngle, innerRadius, innerRadius, true);
                } else {
                    path.lineTo(center.x, center.y);
                }
                return path;
            }
        });
        ShapeBuilder.current = new ShapeBuilder();
        var ChartElement = Class.extend({
            init: function (options) {
                this.children = [];
                this.options = deepExtend({}, this.options, this.initUserOptions(options));
            },
            initUserOptions: function (options) {
                return options;
            },
            reflow: function (targetBox) {
                var children = this.children;
                var box;
                for (var i = 0; i < children.length; i++) {
                    var currentChild = children[i];
                    currentChild.reflow(targetBox);
                    box = box ? box.wrap(currentChild.box) : currentChild.box.clone();
                }
                this.box = box || targetBox;
            },
            destroy: function () {
                var children = this.children;
                if (this.animation) {
                    this.animation.destroy();
                }
                for (var i = 0; i < children.length; i++) {
                    children[i].destroy();
                }
            },
            getRoot: function () {
                var parent = this.parent;
                return parent ? parent.getRoot() : null;
            },
            getSender: function () {
                var service = this.getService();
                if (service) {
                    return service.sender;
                }
            },
            getService: function () {
                var element = this;
                while (element) {
                    if (element.chartService) {
                        return element.chartService;
                    }
                    element = element.parent;
                }
            },
            translateChildren: function (dx, dy) {
                var children = this.children;
                var childrenCount = children.length;
                for (var i = 0; i < childrenCount; i++) {
                    children[i].box.translate(dx, dy);
                }
            },
            append: function () {
                var arguments$1 = arguments;
                var this$1 = this;
                for (var i = 0; i < arguments.length; i++) {
                    var item = arguments$1[i];
                    this$1.children.push(item);
                    item.parent = this$1;
                }
            },
            renderVisual: function () {
                if (this.options.visible === false) {
                    return;
                }
                this.createVisual();
                this.addVisual();
                this.renderChildren();
                this.createAnimation();
                this.renderComplete();
            },
            addVisual: function () {
                if (this.visual) {
                    this.visual.chartElement = this;
                    if (this.parent) {
                        this.parent.appendVisual(this.visual);
                    }
                }
            },
            renderChildren: function () {
                var children = this.children;
                var length = children.length;
                for (var i = 0; i < length; i++) {
                    children[i].renderVisual();
                }
            },
            createVisual: function () {
                this.visual = new Group({
                    zIndex: this.options.zIndex,
                    visible: valueOrDefault(this.options.visible, true)
                });
            },
            createAnimation: function () {
                if (this.visual && this.options.animation) {
                    this.animation = drawing.Animation.create(this.visual, this.options.animation);
                }
            },
            appendVisual: function (childVisual) {
                if (!childVisual.chartElement) {
                    childVisual.chartElement = this;
                }
                if (childVisual.options.noclip) {
                    this.clipRoot().visual.append(childVisual);
                } else if (defined(childVisual.options.zIndex)) {
                    this.stackRoot().stackVisual(childVisual);
                } else if (this.isStackRoot) {
                    this.stackVisual(childVisual);
                } else if (this.visual) {
                    this.visual.append(childVisual);
                } else {
                    this.parent.appendVisual(childVisual);
                }
            },
            clipRoot: function () {
                if (this.parent) {
                    return this.parent.clipRoot();
                }
                return this;
            },
            stackRoot: function () {
                if (this.parent) {
                    return this.parent.stackRoot();
                }
                return this;
            },
            stackVisual: function (childVisual) {
                var zIndex = childVisual.options.zIndex || 0;
                var visuals = this.visual.children;
                var length = visuals.length;
                var pos;
                for (pos = 0; pos < length; pos++) {
                    var sibling = visuals[pos];
                    var here = valueOrDefault(sibling.options.zIndex, 0);
                    if (here > zIndex) {
                        break;
                    }
                }
                this.visual.insert(pos, childVisual);
            },
            traverse: function (callback) {
                var children = this.children;
                var length = children.length;
                for (var i = 0; i < length; i++) {
                    var child = children[i];
                    callback(child);
                    if (child.traverse) {
                        child.traverse(callback);
                    }
                }
            },
            closest: function (match) {
                var element = this;
                var matched = false;
                while (element && !matched) {
                    matched = match(element);
                    if (!matched) {
                        element = element.parent;
                    }
                }
                if (matched) {
                    return element;
                }
            },
            renderComplete: function () {
            },
            hasHighlight: function () {
                var options = (this.options || {}).highlight;
                return !(!this.createHighlight || options && options.visible === false);
            },
            toggleHighlight: function (show) {
                var this$1 = this;
                var options = (this.options || {}).highlight || {};
                var customVisual = options.visual;
                var highlight = this._highlight;
                if (!highlight) {
                    var highlightOptions = {
                        fill: {
                            color: WHITE,
                            opacity: 0.2
                        },
                        stroke: {
                            color: WHITE,
                            width: 1,
                            opacity: 0.2
                        }
                    };
                    if (customVisual) {
                        highlight = this._highlight = customVisual($.extend(this.highlightVisualArgs(), {
                            createVisual: function () {
                                return this$1.createHighlight(highlightOptions);
                            },
                            sender: this.getSender(),
                            series: this.series,
                            dataItem: this.dataItem,
                            category: this.category,
                            value: this.value,
                            percentage: this.percentage,
                            runningTotal: this.runningTotal,
                            total: this.total
                        }));
                        if (!highlight) {
                            return;
                        }
                    } else {
                        highlight = this._highlight = this.createHighlight(highlightOptions);
                    }
                    if (!defined(highlight.options.zIndex)) {
                        highlight.options.zIndex = valueOrDefault(options.zIndex, this.options.zIndex);
                    }
                    this.appendVisual(highlight);
                }
                highlight.visible(show);
            },
            createGradientOverlay: function (element, options, gradientOptions) {
                var overlay = new Path($.extend({
                    stroke: { color: 'none' },
                    fill: this.createGradient(gradientOptions),
                    closed: element.options.closed
                }, options));
                overlay.segments.elements(element.segments.elements());
                return overlay;
            },
            createGradient: function (options) {
                if (this.parent) {
                    return this.parent.createGradient(options);
                }
            }
        });
        ChartElement.prototype.options = {};
        var BoxElement = ChartElement.extend({
            init: function (options) {
                ChartElement.fn.init.call(this, options);
                this.options.margin = getSpacing(this.options.margin);
                this.options.padding = getSpacing(this.options.padding);
            },
            reflow: function (targetBox) {
                var this$1 = this;
                var options = this.options;
                var width = options.width;
                var height = options.height;
                var shrinkToFit = options.shrinkToFit;
                var hasSetSize = width && height;
                var margin = options.margin;
                var padding = options.padding;
                var borderWidth = options.border.width;
                var box;
                var reflowPaddingBox = function () {
                    this$1.align(targetBox, X, options.align);
                    this$1.align(targetBox, Y, options.vAlign);
                    this$1.paddingBox = box.clone().unpad(margin).unpad(borderWidth);
                };
                var contentBox = targetBox.clone();
                if (hasSetSize) {
                    contentBox.x2 = contentBox.x1 + width;
                    contentBox.y2 = contentBox.y1 + height;
                }
                if (shrinkToFit) {
                    contentBox.unpad(margin).unpad(borderWidth).unpad(padding);
                }
                ChartElement.fn.reflow.call(this, contentBox);
                if (hasSetSize) {
                    box = this.box = new Box(0, 0, width, height);
                } else {
                    box = this.box;
                }
                if (shrinkToFit && hasSetSize) {
                    reflowPaddingBox();
                    contentBox = this.contentBox = this.paddingBox.clone().unpad(padding);
                } else {
                    contentBox = this.contentBox = box.clone();
                    box.pad(padding).pad(borderWidth).pad(margin);
                    reflowPaddingBox();
                }
                this.translateChildren(box.x1 - contentBox.x1 + margin.left + borderWidth + padding.left, box.y1 - contentBox.y1 + margin.top + borderWidth + padding.top);
                var children = this.children;
                for (var i = 0; i < children.length; i++) {
                    var item = children[i];
                    item.reflow(item.box);
                }
            },
            align: function (targetBox, axis, alignment) {
                this.box.align(targetBox, axis, alignment);
            },
            hasBox: function () {
                var options = this.options;
                return options.border.width || options.background;
            },
            createVisual: function () {
                ChartElement.fn.createVisual.call(this);
                var options = this.options;
                if (options.visible && this.hasBox()) {
                    this.visual.append(Path.fromRect(this.paddingBox.toRect(), this.visualStyle()));
                }
            },
            visualStyle: function () {
                var options = this.options;
                var border = options.border || {};
                return {
                    stroke: {
                        width: border.width,
                        color: border.color,
                        opacity: valueOrDefault(border.opacity, options.opacity),
                        dashType: border.dashType
                    },
                    fill: {
                        color: options.background,
                        opacity: options.opacity
                    },
                    cursor: options.cursor
                };
            }
        });
        setDefaultOptions(BoxElement, {
            align: LEFT,
            vAlign: TOP,
            margin: {},
            padding: {},
            border: {
                color: BLACK,
                width: 0
            },
            background: '',
            shrinkToFit: false,
            width: 0,
            height: 0,
            visible: true
        });
        var ShapeElement = BoxElement.extend({
            init: function (options, pointData) {
                BoxElement.fn.init.call(this, options);
                this.pointData = pointData;
            },
            getElement: function () {
                var ref = this;
                var options = ref.options;
                var box = ref.paddingBox;
                var type = options.type;
                var rotation = options.rotation;
                var center = box.center();
                var halfWidth = box.width() / 2;
                if (!options.visible || !this.hasBox()) {
                    return null;
                }
                var style = this.visualStyle();
                var element;
                if (type === CIRCLE) {
                    element = new drawing.Circle(new Circle([
                        round(box.x1 + halfWidth, COORD_PRECISION),
                        round(box.y1 + box.height() / 2, COORD_PRECISION)
                    ], halfWidth), style);
                } else if (type === TRIANGLE) {
                    element = Path.fromPoints([
                        [
                            box.x1 + halfWidth,
                            box.y1
                        ],
                        [
                            box.x1,
                            box.y2
                        ],
                        [
                            box.x2,
                            box.y2
                        ]
                    ], style).close();
                } else if (type === CROSS) {
                    element = new drawing.MultiPath(style);
                    element.moveTo(box.x1, box.y1).lineTo(box.x2, box.y2);
                    element.moveTo(box.x1, box.y2).lineTo(box.x2, box.y1);
                } else {
                    element = Path.fromRect(box.toRect(), style);
                }
                if (rotation) {
                    element.transform(geometryTransform().rotate(-rotation, [
                        center.x,
                        center.y
                    ]));
                }
                element.options.zIndex = options.zIndex;
                return element;
            },
            createElement: function () {
                var this$1 = this;
                var customVisual = this.options.visual;
                var pointData = this.pointData || {};
                var visual;
                if (customVisual) {
                    visual = customVisual({
                        value: pointData.value,
                        dataItem: pointData.dataItem,
                        sender: this.getSender(),
                        series: pointData.series,
                        category: pointData.category,
                        rect: this.paddingBox.toRect(),
                        options: this.visualOptions(),
                        createVisual: function () {
                            return this$1.getElement();
                        }
                    });
                } else {
                    visual = this.getElement();
                }
                return visual;
            },
            visualOptions: function () {
                var options = this.options;
                return {
                    background: options.background,
                    border: options.border,
                    margin: options.margin,
                    padding: options.padding,
                    type: options.type,
                    size: options.width,
                    visible: options.visible
                };
            },
            createVisual: function () {
                this.visual = this.createElement();
            }
        });
        setDefaultOptions(ShapeElement, {
            type: CIRCLE,
            align: CENTER,
            vAlign: CENTER
        });
        var LINEAR = 'linear';
        var RADIAL = 'radial';
        var GRADIENTS = {
            glass: {
                type: LINEAR,
                rotation: 0,
                stops: [
                    {
                        offset: 0,
                        color: WHITE,
                        opacity: 0
                    },
                    {
                        offset: 0.25,
                        color: WHITE,
                        opacity: 0.3
                    },
                    {
                        offset: 1,
                        color: WHITE,
                        opacity: 0
                    }
                ]
            },
            sharpBevel: {
                type: RADIAL,
                stops: [
                    {
                        offset: 0,
                        color: WHITE,
                        opacity: 0.55
                    },
                    {
                        offset: 0.65,
                        color: WHITE,
                        opacity: 0
                    },
                    {
                        offset: 0.95,
                        color: WHITE,
                        opacity: 0.25
                    }
                ]
            },
            roundedBevel: {
                type: RADIAL,
                stops: [
                    {
                        offset: 0.33,
                        color: WHITE,
                        opacity: 0.06
                    },
                    {
                        offset: 0.83,
                        color: WHITE,
                        opacity: 0.2
                    },
                    {
                        offset: 0.95,
                        color: WHITE,
                        opacity: 0
                    }
                ]
            },
            roundedGlass: {
                type: RADIAL,
                supportVML: false,
                stops: [
                    {
                        offset: 0,
                        color: WHITE,
                        opacity: 0
                    },
                    {
                        offset: 0.5,
                        color: WHITE,
                        opacity: 0.3
                    },
                    {
                        offset: 0.99,
                        color: WHITE,
                        opacity: 0
                    }
                ]
            },
            sharpGlass: {
                type: RADIAL,
                supportVML: false,
                stops: [
                    {
                        offset: 0,
                        color: WHITE,
                        opacity: 0.2
                    },
                    {
                        offset: 0.15,
                        color: WHITE,
                        opacity: 0.15
                    },
                    {
                        offset: 0.17,
                        color: WHITE,
                        opacity: 0.35
                    },
                    {
                        offset: 0.85,
                        color: WHITE,
                        opacity: 0.05
                    },
                    {
                        offset: 0.87,
                        color: WHITE,
                        opacity: 0.15
                    },
                    {
                        offset: 0.99,
                        color: WHITE,
                        opacity: 0
                    }
                ]
            },
            bubbleShadow: {
                type: RADIAL,
                center: [
                    0.5,
                    0.5
                ],
                radius: 0.5
            }
        };
        function boxDiff(r, s) {
            if (r.x1 === s.x1 && r.y1 === s.y1 && r.x2 === s.x2 && r.y2 === s.y2) {
                return s;
            }
            var a = Math.min(r.x1, s.x1);
            var b = Math.max(r.x1, s.x1);
            var c = Math.min(r.x2, s.x2);
            var d = Math.max(r.x2, s.x2);
            var e = Math.min(r.y1, s.y1);
            var f = Math.max(r.y1, s.y1);
            var g = Math.min(r.y2, s.y2);
            var h = Math.max(r.y2, s.y2);
            var boxes = [];
            boxes[0] = new Box(b, e, c, f);
            boxes[1] = new Box(a, f, b, g);
            boxes[2] = new Box(c, f, d, g);
            boxes[3] = new Box(b, g, c, h);
            if (r.x1 === a && r.y1 === e || s.x1 === a && s.y1 === e) {
                boxes[4] = new Box(a, e, b, f);
                boxes[5] = new Box(c, g, d, h);
            } else {
                boxes[4] = new Box(c, e, d, f);
                boxes[5] = new Box(a, g, b, h);
            }
            return grep(boxes, function (box) {
                return box.height() > 0 && box.width() > 0;
            })[0];
        }
        var RootElement = ChartElement.extend({
            init: function (options) {
                ChartElement.fn.init.call(this, options);
                var rootOptions = this.options;
                rootOptions.width = parseInt(rootOptions.width, 10);
                rootOptions.height = parseInt(rootOptions.height, 10);
                this.gradients = {};
            },
            reflow: function () {
                var ref = this;
                var options = ref.options;
                var children = ref.children;
                var currentBox = new Box(0, 0, options.width, options.height);
                this.box = currentBox.unpad(options.margin);
                for (var i = 0; i < children.length; i++) {
                    children[i].reflow(currentBox);
                    currentBox = boxDiff(currentBox, children[i].box) || new Box();
                }
            },
            createVisual: function () {
                this.visual = new Group();
                this.createBackground();
            },
            createBackground: function () {
                var options = this.options;
                var border = options.border || {};
                var box = this.box.clone().pad(options.margin).unpad(border.width);
                var background = Path.fromRect(box.toRect(), {
                    stroke: {
                        color: border.width ? border.color : '',
                        width: border.width,
                        dashType: border.dashType
                    },
                    fill: {
                        color: options.background,
                        opacity: options.opacity
                    },
                    zIndex: -10
                });
                this.visual.append(background);
            },
            getRoot: function () {
                return this;
            },
            createGradient: function (options) {
                var gradients = this.gradients;
                var hashCode = objectKey(options);
                var gradient = GRADIENTS[options.gradient];
                var drawingGradient;
                if (gradients[hashCode]) {
                    drawingGradient = gradients[hashCode];
                } else {
                    var gradientOptions = $.extend({}, gradient, options);
                    if (gradient.type === 'linear') {
                        drawingGradient = new drawing.LinearGradient(gradientOptions);
                    } else {
                        if (options.innerRadius) {
                            gradientOptions.stops = innerRadialStops(gradientOptions);
                        }
                        drawingGradient = new drawing.RadialGradient(gradientOptions);
                        drawingGradient.supportVML = gradient.supportVML !== false;
                    }
                    gradients[hashCode] = drawingGradient;
                }
                return drawingGradient;
            },
            cleanGradients: function () {
                var gradients = this.gradients;
                for (var hashCode in gradients) {
                    gradients[hashCode]._observers = [];
                }
            },
            size: function () {
                var options = this.options;
                return new Box(0, 0, options.width, options.height);
            }
        });
        setDefaultOptions(RootElement, {
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
            background: WHITE,
            border: {
                color: BLACK,
                width: 0
            },
            margin: getSpacing(5),
            zIndex: -2
        });
        function innerRadialStops(options) {
            var stops = options.stops;
            var usedSpace = options.innerRadius / options.radius * 100;
            var length = stops.length;
            var currentStops = [];
            for (var i = 0; i < length; i++) {
                var currentStop = $.extend({}, stops[i]);
                currentStop.offset = (currentStop.offset * (100 - usedSpace) + usedSpace) / 100;
                currentStops.push(currentStop);
            }
            return currentStops;
        }
        var FloatElement = ChartElement.extend({
            init: function (options) {
                ChartElement.fn.init.call(this, options);
                this._initDirection();
            },
            _initDirection: function () {
                var options = this.options;
                if (options.vertical) {
                    this.groupAxis = X;
                    this.elementAxis = Y;
                    this.groupSizeField = WIDTH;
                    this.elementSizeField = HEIGHT;
                    this.groupSpacing = options.spacing;
                    this.elementSpacing = options.vSpacing;
                } else {
                    this.groupAxis = Y;
                    this.elementAxis = X;
                    this.groupSizeField = HEIGHT;
                    this.elementSizeField = WIDTH;
                    this.groupSpacing = options.vSpacing;
                    this.elementSpacing = options.spacing;
                }
            },
            reflow: function (targetBox) {
                this.box = targetBox.clone();
                this.reflowChildren();
            },
            reflowChildren: function () {
                var this$1 = this;
                var ref = this;
                var box = ref.box;
                var elementAxis = ref.elementAxis;
                var groupAxis = ref.groupAxis;
                var elementSizeField = ref.elementSizeField;
                var groupSizeField = ref.groupSizeField;
                var ref$1 = this.groupOptions();
                var groups = ref$1.groups;
                var groupsSize = ref$1.groupsSize;
                var maxGroupElementsSize = ref$1.maxGroupElementsSize;
                var groupsCount = groups.length;
                var groupsStart = box[groupAxis + 1] + this.alignStart(groupsSize, box[groupSizeField]());
                if (groupsCount) {
                    var groupStart = groupsStart;
                    for (var groupIdx = 0; groupIdx < groupsCount; groupIdx++) {
                        var group = groups[groupIdx];
                        var groupElements = group.groupElements;
                        var elementStart = box[elementAxis + 1];
                        var groupElementsCount = groupElements.length;
                        for (var idx = 0; idx < groupElementsCount; idx++) {
                            var element = groupElements[idx];
                            var elementSize$$1 = this$1.elementSize(element);
                            var groupElementStart = groupStart + this$1.alignStart(elementSize$$1[groupSizeField], group.groupSize);
                            var elementBox = new Box();
                            elementBox[groupAxis + 1] = groupElementStart;
                            elementBox[groupAxis + 2] = groupElementStart + elementSize$$1[groupSizeField];
                            elementBox[elementAxis + 1] = elementStart;
                            elementBox[elementAxis + 2] = elementStart + elementSize$$1[elementSizeField];
                            element.reflow(elementBox);
                            elementStart += elementSize$$1[elementSizeField] + this$1.elementSpacing;
                        }
                        groupStart += group.groupSize + this$1.groupSpacing;
                    }
                    box[groupAxis + 1] = groupsStart;
                    box[groupAxis + 2] = groupsStart + groupsSize;
                    box[elementAxis + 2] = box[elementAxis + 1] + maxGroupElementsSize;
                }
            },
            alignStart: function (size, maxSize) {
                var start = 0;
                var align = this.options.align;
                if (align === RIGHT || align === BOTTOM) {
                    start = maxSize - size;
                } else if (align === CENTER) {
                    start = (maxSize - size) / 2;
                }
                return start;
            },
            groupOptions: function () {
                var this$1 = this;
                var ref = this;
                var box = ref.box;
                var children = ref.children;
                var elementSizeField = ref.elementSizeField;
                var groupSizeField = ref.groupSizeField;
                var elementSpacing = ref.elementSpacing;
                var groupSpacing = ref.groupSpacing;
                var maxSize = round(box[elementSizeField]());
                var childrenCount = children.length;
                var groups = [];
                var groupSize = 0;
                var groupElementsSize = 0;
                var groupsSize = 0;
                var maxGroupElementsSize = 0;
                var groupElements = [];
                for (var idx = 0; idx < childrenCount; idx++) {
                    var element = children[idx];
                    if (!element.box) {
                        element.reflow(box);
                    }
                    var elementSize$$1 = this$1.elementSize(element);
                    if (this$1.options.wrap && round(groupElementsSize + elementSpacing + elementSize$$1[elementSizeField]) > maxSize) {
                        groups.push({
                            groupElements: groupElements,
                            groupSize: groupSize,
                            groupElementsSize: groupElementsSize
                        });
                        maxGroupElementsSize = Math.max(maxGroupElementsSize, groupElementsSize);
                        groupsSize += groupSpacing + groupSize;
                        groupSize = 0;
                        groupElementsSize = 0;
                        groupElements = [];
                    }
                    groupSize = Math.max(groupSize, elementSize$$1[groupSizeField]);
                    if (groupElementsSize > 0) {
                        groupElementsSize += elementSpacing;
                    }
                    groupElementsSize += elementSize$$1[elementSizeField];
                    groupElements.push(element);
                }
                groups.push({
                    groupElements: groupElements,
                    groupSize: groupSize,
                    groupElementsSize: groupElementsSize
                });
                maxGroupElementsSize = Math.max(maxGroupElementsSize, groupElementsSize);
                groupsSize += groupSize;
                return {
                    groups: groups,
                    groupsSize: groupsSize,
                    maxGroupElementsSize: maxGroupElementsSize
                };
            },
            elementSize: function (element) {
                return {
                    width: element.box.width(),
                    height: element.box.height()
                };
            },
            createVisual: function () {
            }
        });
        setDefaultOptions(FloatElement, {
            vertical: true,
            wrap: true,
            vSpacing: 0,
            spacing: 0
        });
        var DrawingText = drawing.Text;
        var Text = ChartElement.extend({
            init: function (content, options) {
                ChartElement.fn.init.call(this, options);
                this.content = content;
                this.reflow(new Box());
            },
            reflow: function (targetBox) {
                var options = this.options;
                var size = options.size = util.measureText(this.content, { font: options.font });
                this.baseline = size.baseline;
                this.box = new Box(targetBox.x1, targetBox.y1, targetBox.x1 + size.width, targetBox.y1 + size.height);
            },
            createVisual: function () {
                var ref = this.options;
                var font = ref.font;
                var color = ref.color;
                var opacity = ref.opacity;
                var cursor = ref.cursor;
                this.visual = new DrawingText(this.content, this.box.toRect().topLeft(), {
                    font: font,
                    fill: {
                        color: color,
                        opacity: opacity
                    },
                    cursor: cursor
                });
            }
        });
        setDefaultOptions(Text, {
            font: DEFAULT_FONT,
            color: BLACK
        });
        function rectToBox(rect) {
            var origin = rect.origin;
            var bottomRight = rect.bottomRight();
            return new Box(origin.x, origin.y, bottomRight.x, bottomRight.y);
        }
        var ROWS_SPLIT_REGEX = /\n/m;
        var TextBox = BoxElement.extend({
            init: function (content, options, data) {
                BoxElement.fn.init.call(this, options);
                this.content = content;
                this.data = data;
                this._initContainer();
                if (this.options._autoReflow !== false) {
                    this.reflow(new Box());
                }
            },
            _initContainer: function () {
                var options = this.options;
                var rows = String(this.content).split(ROWS_SPLIT_REGEX);
                var floatElement = new FloatElement({
                    vertical: true,
                    align: options.align,
                    wrap: false
                });
                var textOptions = deepExtend({}, options, {
                    opacity: 1,
                    animation: null
                });
                this.container = floatElement;
                this.append(floatElement);
                for (var rowIdx = 0; rowIdx < rows.length; rowIdx++) {
                    var text = new Text(rows[rowIdx].trim(), textOptions);
                    floatElement.append(text);
                }
            },
            reflow: function (targetBox) {
                var options = this.options;
                var visualFn = options.visual;
                this.container.options.align = options.align;
                if (visualFn && !this._boxReflow) {
                    var visualBox = targetBox;
                    if (!visualBox.hasSize()) {
                        this._boxReflow = true;
                        this.reflow(visualBox);
                        this._boxReflow = false;
                        visualBox = this.box;
                    }
                    var visual = this.visual = visualFn(this.visualContext(visualBox));
                    if (visual) {
                        visualBox = rectToBox(visual.clippedBBox() || new Rect());
                        visual.options.zIndex = options.zIndex;
                    }
                    this.box = this.contentBox = this.paddingBox = visualBox;
                } else {
                    BoxElement.fn.reflow.call(this, targetBox);
                    if (options.rotation) {
                        var margin = getSpacing(options.margin);
                        var box = this.box.unpad(margin);
                        this.targetBox = targetBox;
                        this.normalBox = box.clone();
                        box = this.rotate();
                        box.translate(margin.left - margin.right, margin.top - margin.bottom);
                        this.rotatedBox = box.clone();
                        box.pad(margin);
                    }
                }
            },
            createVisual: function () {
                var options = this.options;
                this.visual = new Group({
                    transform: this.rotationTransform(),
                    zIndex: options.zIndex,
                    noclip: options.noclip
                });
                if (this.hasBox()) {
                    var box = Path.fromRect(this.paddingBox.toRect(), this.visualStyle());
                    this.visual.append(box);
                }
            },
            renderVisual: function () {
                if (!this.options.visible) {
                    return;
                }
                if (this.options.visual) {
                    var visual = this.visual;
                    if (visual && !defined(visual.options.noclip)) {
                        visual.options.noclip = this.options.noclip;
                    }
                    this.addVisual();
                    this.createAnimation();
                } else {
                    BoxElement.fn.renderVisual.call(this);
                }
            },
            visualContext: function (targetBox) {
                var this$1 = this;
                var context = {
                    text: this.content,
                    rect: targetBox.toRect(),
                    sender: this.getSender(),
                    options: this.options,
                    createVisual: function () {
                        this$1._boxReflow = true;
                        this$1.reflow(targetBox);
                        this$1._boxReflow = false;
                        return this$1.getDefaultVisual();
                    }
                };
                if (this.data) {
                    $.extend(context, this.data);
                }
                return context;
            },
            getDefaultVisual: function () {
                this.createVisual();
                this.renderChildren();
                var visual = this.visual;
                delete this.visual;
                return visual;
            },
            rotate: function () {
                var options = this.options;
                this.box.rotate(options.rotation);
                this.align(this.targetBox, X, options.align);
                this.align(this.targetBox, Y, options.vAlign);
                return this.box;
            },
            rotationTransform: function () {
                var rotation = this.options.rotation;
                if (!rotation) {
                    return null;
                }
                var ref = this.normalBox.center();
                var cx = ref.x;
                var cy = ref.y;
                var boxCenter = this.rotatedBox.center();
                return geometryTransform().translate(boxCenter.x - cx, boxCenter.y - cy).rotate(rotation, [
                    cx,
                    cy
                ]);
            }
        });
        var Title = ChartElement.extend({
            init: function (options) {
                ChartElement.fn.init.call(this, options);
                this.append(new TextBox(this.options.text, $.extend({}, this.options, { vAlign: this.options.position })));
            },
            reflow: function (targetBox) {
                ChartElement.fn.reflow.call(this, targetBox);
                this.box.snapTo(targetBox, X);
            }
        });
        Title.buildTitle = function (options, parent, defaultOptions) {
            var titleOptions = options;
            if (typeof options === 'string') {
                titleOptions = { text: options };
            }
            titleOptions = $.extend({ visible: true }, defaultOptions, titleOptions);
            var title;
            if (titleOptions && titleOptions.visible && titleOptions.text) {
                title = new Title(titleOptions);
                parent.append(title);
            }
            return title;
        };
        setDefaultOptions(Title, {
            color: BLACK,
            position: TOP,
            align: CENTER,
            margin: getSpacing(5),
            padding: getSpacing(5)
        });
        var AxisLabel = TextBox.extend({
            init: function (value, text, index, dataItem, options) {
                TextBox.fn.init.call(this, text, options);
                this.text = text;
                this.value = value;
                this.index = index;
                this.dataItem = dataItem;
                this.reflow(new Box());
            },
            visualContext: function (targetBox) {
                var context = TextBox.fn.visualContext.call(this, targetBox);
                context.value = this.value;
                context.dataItem = this.dataItem;
                context.format = this.options.format;
                context.culture = this.options.culture;
                return context;
            },
            click: function (widget, e) {
                widget.trigger(AXIS_LABEL_CLICK, {
                    element: eventElement(e),
                    value: this.value,
                    text: this.text,
                    index: this.index,
                    dataItem: this.dataItem,
                    axis: this.parent.options
                });
            },
            rotate: function () {
                if (this.options.alignRotation !== CENTER) {
                    var box = this.normalBox.toRect();
                    var transform = this.rotationTransform();
                    this.box = rectToBox(box.bbox(transform.matrix()));
                } else {
                    TextBox.fn.rotate.call(this);
                }
                return this.box;
            },
            rotationTransform: function () {
                var options = this.options;
                var rotation = options.rotation;
                if (!rotation) {
                    return null;
                }
                if (options.alignRotation === CENTER) {
                    return TextBox.fn.rotationTransform.call(this);
                }
                var rotationMatrix = geometryTransform().rotate(rotation).matrix();
                var box = this.normalBox.toRect();
                var rect = this.targetBox.toRect();
                var rotationOrigin = options.rotationOrigin || TOP;
                var alignAxis = rotationOrigin === TOP || rotationOrigin === BOTTOM ? X : Y;
                var distanceAxis = rotationOrigin === TOP || rotationOrigin === BOTTOM ? Y : X;
                var axisAnchor = rotationOrigin === TOP || rotationOrigin === LEFT ? rect.origin : rect.bottomRight();
                var topLeft = box.topLeft().transformCopy(rotationMatrix);
                var topRight = box.topRight().transformCopy(rotationMatrix);
                var bottomRight = box.bottomRight().transformCopy(rotationMatrix);
                var bottomLeft = box.bottomLeft().transformCopy(rotationMatrix);
                var rotatedBox = Rect.fromPoints(topLeft, topRight, bottomRight, bottomLeft);
                var translate = {};
                translate[distanceAxis] = rect.origin[distanceAxis] - rotatedBox.origin[distanceAxis];
                var distanceLeft = Math.abs(topLeft[distanceAxis] + translate[distanceAxis] - axisAnchor[distanceAxis]);
                var distanceRight = Math.abs(topRight[distanceAxis] + translate[distanceAxis] - axisAnchor[distanceAxis]);
                var alignStart, alignEnd;
                if (round(distanceLeft, DEFAULT_PRECISION) === round(distanceRight, DEFAULT_PRECISION)) {
                    alignStart = topLeft;
                    alignEnd = topRight;
                } else if (distanceRight < distanceLeft) {
                    alignStart = topRight;
                    alignEnd = bottomRight;
                } else {
                    alignStart = topLeft;
                    alignEnd = bottomLeft;
                }
                var alignCenter = alignStart[alignAxis] + (alignEnd[alignAxis] - alignStart[alignAxis]) / 2;
                translate[alignAxis] = rect.center()[alignAxis] - alignCenter;
                return geometryTransform().translate(translate.x, translate.y).rotate(rotation);
            }
        });
        setDefaultOptions(AxisLabel, { _autoReflow: false });
        var DEFAULT_ICON_SIZE = 7;
        var DEFAULT_LABEL_COLOR = '#fff';
        var Note = BoxElement.extend({
            init: function (fields, options, chartService) {
                BoxElement.fn.init.call(this, options);
                this.fields = fields;
                this.chartService = chartService;
                this.render();
            },
            hide: function () {
                this.options.visible = false;
            },
            show: function () {
                this.options.visible = true;
            },
            render: function () {
                var this$1 = this;
                var options = this.options;
                if (options.visible) {
                    var label = options.label;
                    var icon = options.icon;
                    var box = new Box();
                    var childAlias = function () {
                        return this$1;
                    };
                    var size = icon.size;
                    var text = this.fields.text;
                    var width, height;
                    if (defined(label) && label.visible) {
                        var noteTemplate = getTemplate(label);
                        if (noteTemplate) {
                            text = noteTemplate(this.fields);
                        } else if (label.format) {
                            text = this.chartService.format.auto(label.format, text);
                        }
                        if (!label.color) {
                            label.color = label.position === INSIDE ? DEFAULT_LABEL_COLOR : icon.background;
                        }
                        this.label = new TextBox(text, deepExtend({}, label));
                        this.label.aliasFor = childAlias;
                        if (label.position === INSIDE && !defined(size)) {
                            if (icon.type === CIRCLE) {
                                size = Math.max(this.label.box.width(), this.label.box.height());
                            } else {
                                width = this.label.box.width();
                                height = this.label.box.height();
                            }
                            box.wrap(this.label.box);
                        }
                    }
                    icon.width = width || size || DEFAULT_ICON_SIZE;
                    icon.height = height || size || DEFAULT_ICON_SIZE;
                    var marker = new ShapeElement(deepExtend({}, icon));
                    marker.aliasFor = childAlias;
                    this.marker = marker;
                    this.append(marker);
                    if (this.label) {
                        this.append(this.label);
                    }
                    marker.reflow(new Box());
                    this.wrapperBox = box.wrap(marker.box);
                }
            },
            reflow: function (targetBox) {
                var ref = this;
                var options = ref.options;
                var label = ref.label;
                var marker = ref.marker;
                var wrapperBox = ref.wrapperBox;
                var center = targetBox.center();
                var length = options.line.length;
                var position = options.position;
                if (options.visible) {
                    var lineStart, box, contentBox;
                    if (inArray(position, [
                            LEFT,
                            RIGHT
                        ])) {
                        if (position === LEFT) {
                            contentBox = wrapperBox.alignTo(targetBox, position).translate(-length, targetBox.center().y - wrapperBox.center().y);
                            if (options.line.visible) {
                                lineStart = [
                                    targetBox.x1,
                                    center.y
                                ];
                                this.linePoints = [
                                    lineStart,
                                    [
                                        contentBox.x2,
                                        center.y
                                    ]
                                ];
                                box = contentBox.clone().wrapPoint(lineStart);
                            }
                        } else {
                            contentBox = wrapperBox.alignTo(targetBox, position).translate(length, targetBox.center().y - wrapperBox.center().y);
                            if (options.line.visible) {
                                lineStart = [
                                    targetBox.x2,
                                    center.y
                                ];
                                this.linePoints = [
                                    lineStart,
                                    [
                                        contentBox.x1,
                                        center.y
                                    ]
                                ];
                                box = contentBox.clone().wrapPoint(lineStart);
                            }
                        }
                    } else {
                        if (position === BOTTOM) {
                            contentBox = wrapperBox.alignTo(targetBox, position).translate(targetBox.center().x - wrapperBox.center().x, length);
                            if (options.line.visible) {
                                lineStart = [
                                    center.x,
                                    targetBox.y2
                                ];
                                this.linePoints = [
                                    lineStart,
                                    [
                                        center.x,
                                        contentBox.y1
                                    ]
                                ];
                                box = contentBox.clone().wrapPoint(lineStart);
                            }
                        } else {
                            contentBox = wrapperBox.alignTo(targetBox, position).translate(targetBox.center().x - wrapperBox.center().x, -length);
                            if (options.line.visible) {
                                lineStart = [
                                    center.x,
                                    targetBox.y1
                                ];
                                this.linePoints = [
                                    lineStart,
                                    [
                                        center.x,
                                        contentBox.y2
                                    ]
                                ];
                                box = contentBox.clone().wrapPoint(lineStart);
                            }
                        }
                    }
                    if (marker) {
                        marker.reflow(contentBox);
                    }
                    if (label) {
                        label.reflow(contentBox);
                        if (marker) {
                            if (options.label.position === OUTSIDE) {
                                label.box.alignTo(marker.box, position);
                            }
                            label.reflow(label.box);
                        }
                    }
                    this.contentBox = contentBox;
                    this.targetBox = targetBox;
                    this.box = box || contentBox;
                }
            },
            createVisual: function () {
                BoxElement.fn.createVisual.call(this);
                this.visual.options.noclip = this.options.noclip;
                if (this.options.visible) {
                    this.createLine();
                }
            },
            renderVisual: function () {
                var this$1 = this;
                var options = this.options;
                var customVisual = options.visual;
                if (options.visible && customVisual) {
                    this.visual = customVisual($.extend(this.fields, {
                        sender: this.getSender(),
                        rect: this.targetBox.toRect(),
                        options: {
                            background: options.background,
                            border: options.background,
                            icon: options.icon,
                            label: options.label,
                            line: options.line,
                            position: options.position,
                            visible: options.visible
                        },
                        createVisual: function () {
                            this$1.createVisual();
                            this$1.renderChildren();
                            var defaultVisual = this$1.visual;
                            delete this$1.visual;
                            return defaultVisual;
                        }
                    }));
                    this.addVisual();
                } else {
                    BoxElement.fn.renderVisual.call(this);
                }
            },
            createLine: function () {
                var options = this.options.line;
                if (this.linePoints) {
                    var path = Path.fromPoints(this.linePoints, {
                        stroke: {
                            color: options.color,
                            width: options.width,
                            dashType: options.dashType
                        }
                    });
                    alignPathToPixel(path);
                    this.visual.append(path);
                }
            },
            click: function (widget, e) {
                var args = this.eventArgs(e);
                if (!widget.trigger(NOTE_CLICK, args)) {
                    e.preventDefault();
                }
            },
            over: function (widget, e) {
                var args = this.eventArgs(e);
                if (!widget.trigger(NOTE_HOVER, args)) {
                    e.preventDefault();
                }
            },
            out: function (widget, e) {
                var args = this.eventArgs(e);
                widget.trigger(NOTE_LEAVE, args);
            },
            eventArgs: function (e) {
                var options = this.options;
                return $.extend(this.fields, {
                    element: eventElement(e),
                    text: defined(options.label) ? options.label.text : '',
                    visual: this.visual
                });
            }
        });
        setDefaultOptions(Note, {
            icon: {
                visible: true,
                type: CIRCLE
            },
            label: {
                position: INSIDE,
                visible: true,
                align: CENTER,
                vAlign: CENTER
            },
            line: { visible: true },
            visible: true,
            position: TOP,
            zIndex: 2
        });
        function createAxisTick(options, tickOptions) {
            var tickX = options.tickX;
            var tickY = options.tickY;
            var position = options.position;
            var tick = new Path({
                stroke: {
                    width: tickOptions.width,
                    color: tickOptions.color
                }
            });
            if (options.vertical) {
                tick.moveTo(tickX, position).lineTo(tickX + tickOptions.size, position);
            } else {
                tick.moveTo(position, tickY).lineTo(position, tickY + tickOptions.size);
            }
            alignPathToPixel(tick);
            return tick;
        }
        function createAxisGridLine(options, gridLine) {
            var lineStart = options.lineStart;
            var lineEnd = options.lineEnd;
            var position = options.position;
            var line = new Path({
                stroke: {
                    width: gridLine.width,
                    color: gridLine.color,
                    dashType: gridLine.dashType
                }
            });
            if (options.vertical) {
                line.moveTo(lineStart, position).lineTo(lineEnd, position);
            } else {
                line.moveTo(position, lineStart).lineTo(position, lineEnd);
            }
            alignPathToPixel(line);
            return line;
        }
        var Axis = ChartElement.extend({
            init: function (options, chartService) {
                if (chartService === void 0) {
                    chartService = new ChartService();
                }
                ChartElement.fn.init.call(this, options);
                this.chartService = chartService;
                if (!this.options.visible) {
                    this.options = deepExtend({}, this.options, {
                        labels: { visible: false },
                        line: { visible: false },
                        margin: 0,
                        majorTickSize: 0,
                        minorTickSize: 0
                    });
                }
                this.options.minorTicks = deepExtend({}, {
                    color: this.options.line.color,
                    width: this.options.line.width,
                    visible: this.options.minorTickType !== NONE
                }, this.options.minorTicks, {
                    size: this.options.minorTickSize,
                    align: this.options.minorTickType
                });
                this.options.majorTicks = deepExtend({}, {
                    color: this.options.line.color,
                    width: this.options.line.width,
                    visible: this.options.majorTickType !== NONE
                }, this.options.majorTicks, {
                    size: this.options.majorTickSize,
                    align: this.options.majorTickType
                });
                this.initFields();
                if (!this.options._deferLabels) {
                    this.createLabels();
                }
                this.createTitle();
                this.createNotes();
            },
            initFields: function () {
            },
            labelsRange: function () {
                return {
                    min: this.options.labels.skip,
                    max: this.labelsCount()
                };
            },
            createLabels: function () {
                var this$1 = this;
                var options = this.options;
                var align = options.vertical ? RIGHT : CENTER;
                var labelOptions = deepExtend({}, options.labels, {
                    align: align,
                    zIndex: options.zIndex
                });
                var step = Math.max(1, labelOptions.step);
                this.clearLabels();
                if (labelOptions.visible) {
                    var range = this.labelsRange();
                    var rotation = labelOptions.rotation;
                    if (isObject(rotation)) {
                        labelOptions.alignRotation = rotation.align;
                        labelOptions.rotation = rotation.angle;
                    }
                    if (labelOptions.rotation === 'auto') {
                        labelOptions.rotation = 0;
                        options.autoRotateLabels = true;
                    }
                    for (var idx = range.min; idx < range.max; idx += step) {
                        var label = this$1.createAxisLabel(idx, labelOptions);
                        if (label) {
                            this$1.append(label);
                            this$1.labels.push(label);
                        }
                    }
                }
            },
            clearLabels: function () {
                this.children = grep(this.children, function (child) {
                    return !(child instanceof AxisLabel);
                });
                this.labels = [];
            },
            clearTitle: function () {
                var this$1 = this;
                if (this.title) {
                    this.children = grep(this.children, function (child) {
                        return child !== this$1.title;
                    });
                    this.title = undefined;
                }
            },
            clear: function () {
                this.clearLabels();
                this.clearTitle();
            },
            lineBox: function () {
                var ref = this;
                var options = ref.options;
                var box = ref.box;
                var vertical = options.vertical;
                var mirror = options.labels.mirror;
                var axisX = mirror ? box.x1 : box.x2;
                var axisY = mirror ? box.y2 : box.y1;
                var lineWidth = options.line.width || 0;
                return vertical ? new Box(axisX, box.y1, axisX, box.y2 - lineWidth) : new Box(box.x1, axisY, box.x2 - lineWidth, axisY);
            },
            createTitle: function () {
                var options = this.options;
                var titleOptions = deepExtend({
                    rotation: options.vertical ? -90 : 0,
                    text: '',
                    zIndex: 1,
                    visualSize: true
                }, options.title);
                if (titleOptions.visible && titleOptions.text) {
                    var title = new TextBox(titleOptions.text, titleOptions);
                    this.append(title);
                    this.title = title;
                }
            },
            createNotes: function () {
                var this$1 = this;
                var options = this.options;
                var notes = options.notes;
                var items = notes.data || [];
                this.notes = [];
                for (var i = 0; i < items.length; i++) {
                    var item = deepExtend({}, notes, items[i]);
                    item.value = this$1.parseNoteValue(item.value);
                    var note = new Note({
                        value: item.value,
                        text: item.label.text,
                        dataItem: item
                    }, item, this$1.chartService);
                    if (note.options.visible) {
                        if (defined(note.options.position)) {
                            if (options.vertical && !inArray(note.options.position, [
                                    LEFT,
                                    RIGHT
                                ])) {
                                note.options.position = options.reverse ? LEFT : RIGHT;
                            } else if (!options.vertical && !inArray(note.options.position, [
                                    TOP,
                                    BOTTOM
                                ])) {
                                note.options.position = options.reverse ? BOTTOM : TOP;
                            }
                        } else {
                            if (options.vertical) {
                                note.options.position = options.reverse ? LEFT : RIGHT;
                            } else {
                                note.options.position = options.reverse ? BOTTOM : TOP;
                            }
                        }
                        this$1.append(note);
                        this$1.notes.push(note);
                    }
                }
            },
            parseNoteValue: function (value) {
                return value;
            },
            renderVisual: function () {
                ChartElement.fn.renderVisual.call(this);
                this.createPlotBands();
            },
            createVisual: function () {
                ChartElement.fn.createVisual.call(this);
                this.createBackground();
                this.createLine();
            },
            gridLinesVisual: function () {
                var gridLines = this._gridLines;
                if (!gridLines) {
                    gridLines = this._gridLines = new Group({ zIndex: -2 });
                    this.appendVisual(this._gridLines);
                }
                return gridLines;
            },
            createTicks: function (lineGroup) {
                var options = this.options;
                var lineBox = this.lineBox();
                var mirror = options.labels.mirror;
                var majorUnit = options.majorTicks.visible ? options.majorUnit : 0;
                var tickLineOptions = { vertical: options.vertical };
                function render(tickPositions, tickOptions, skipUnit) {
                    var count = tickPositions.length;
                    var step = Math.max(1, tickOptions.step);
                    if (tickOptions.visible) {
                        for (var i = tickOptions.skip; i < count; i += step) {
                            if (defined(skipUnit) && i % skipUnit === 0) {
                                continue;
                            }
                            tickLineOptions.tickX = mirror ? lineBox.x2 : lineBox.x2 - tickOptions.size;
                            tickLineOptions.tickY = mirror ? lineBox.y1 - tickOptions.size : lineBox.y1;
                            tickLineOptions.position = tickPositions[i];
                            lineGroup.append(createAxisTick(tickLineOptions, tickOptions));
                        }
                    }
                }
                render(this.getMajorTickPositions(), options.majorTicks);
                render(this.getMinorTickPositions(), options.minorTicks, majorUnit / options.minorUnit);
            },
            createLine: function () {
                var options = this.options;
                var line = options.line;
                var lineBox = this.lineBox();
                if (line.width > 0 && line.visible) {
                    var path = new Path({
                        stroke: {
                            width: line.width,
                            color: line.color,
                            dashType: line.dashType
                        }
                    });
                    path.moveTo(lineBox.x1, lineBox.y1).lineTo(lineBox.x2, lineBox.y2);
                    if (options._alignLines) {
                        alignPathToPixel(path);
                    }
                    var group = this._lineGroup = new Group();
                    group.append(path);
                    this.visual.append(group);
                    this.createTicks(group);
                }
            },
            getActualTickSize: function () {
                var options = this.options;
                var tickSize = 0;
                if (options.majorTicks.visible && options.minorTicks.visible) {
                    tickSize = Math.max(options.majorTicks.size, options.minorTicks.size);
                } else if (options.majorTicks.visible) {
                    tickSize = options.majorTicks.size;
                } else if (options.minorTicks.visible) {
                    tickSize = options.minorTicks.size;
                }
                return tickSize;
            },
            createBackground: function () {
                var ref = this;
                var options = ref.options;
                var box = ref.box;
                var background = options.background;
                if (background) {
                    this._backgroundPath = Path.fromRect(box.toRect(), {
                        fill: { color: background },
                        stroke: null
                    });
                    this.visual.append(this._backgroundPath);
                }
            },
            createPlotBands: function () {
                var this$1 = this;
                var options = this.options;
                var plotBands = options.plotBands || [];
                var vertical = options.vertical;
                var plotArea = this.plotArea;
                if (plotBands.length === 0) {
                    return;
                }
                var group = this._plotbandGroup = new Group({ zIndex: -1 });
                var altAxis = grep(this.pane.axes, function (axis) {
                    return axis.options.vertical !== this$1.options.vertical;
                })[0];
                for (var idx = 0; idx < plotBands.length; idx++) {
                    var item = plotBands[idx];
                    var slotX = void 0, slotY = void 0;
                    if (vertical) {
                        slotX = (altAxis || plotArea.axisX).lineBox();
                        slotY = this$1.getSlot(item.from, item.to, true);
                    } else {
                        slotX = this$1.getSlot(item.from, item.to, true);
                        slotY = (altAxis || plotArea.axisY).lineBox();
                    }
                    if (slotX.width() !== 0 && slotY.height() !== 0) {
                        var bandRect = new Rect([
                            slotX.x1,
                            slotY.y1
                        ], [
                            slotX.width(),
                            slotY.height()
                        ]);
                        var path = Path.fromRect(bandRect, {
                            fill: {
                                color: item.color,
                                opacity: item.opacity
                            },
                            stroke: null
                        });
                        group.append(path);
                    }
                }
                this.appendVisual(group);
            },
            createGridLines: function (altAxis) {
                var options = this.options;
                var minorGridLines = options.minorGridLines;
                var majorGridLines = options.majorGridLines;
                var minorUnit = options.minorUnit;
                var vertical = options.vertical;
                var axisLineVisible = altAxis.options.line.visible;
                var majorUnit = majorGridLines.visible ? options.majorUnit : 0;
                var lineBox = altAxis.lineBox();
                var linePos = lineBox[vertical ? 'y1' : 'x1'];
                var lineOptions = {
                    lineStart: lineBox[vertical ? 'x1' : 'y1'],
                    lineEnd: lineBox[vertical ? 'x2' : 'y2'],
                    vertical: vertical
                };
                var majorTicks = [];
                var container = this.gridLinesVisual();
                function render(tickPositions, gridLine, skipUnit) {
                    var count = tickPositions.length;
                    var step = Math.max(1, gridLine.step);
                    if (gridLine.visible) {
                        for (var i = gridLine.skip; i < count; i += step) {
                            var pos = round(tickPositions[i]);
                            if (!inArray(pos, majorTicks)) {
                                if (i % skipUnit !== 0 && (!axisLineVisible || linePos !== pos)) {
                                    lineOptions.position = pos;
                                    container.append(createAxisGridLine(lineOptions, gridLine));
                                    majorTicks.push(pos);
                                }
                            }
                        }
                    }
                }
                render(this.getMajorTickPositions(), majorGridLines);
                render(this.getMinorTickPositions(), minorGridLines, majorUnit / minorUnit);
                return container.children;
            },
            reflow: function (box) {
                var ref = this;
                var options = ref.options;
                var labels = ref.labels;
                var title = ref.title;
                var vertical = options.vertical;
                var count = labels.length;
                var sizeFn = vertical ? WIDTH : HEIGHT;
                var titleSize = title ? title.box[sizeFn]() : 0;
                var space = this.getActualTickSize() + options.margin + titleSize;
                var rootBox = (this.getRoot() || {}).box || box;
                var boxSize = rootBox[sizeFn]();
                var maxLabelSize = 0;
                for (var i = 0; i < count; i++) {
                    var labelSize = labels[i].box[sizeFn]();
                    if (labelSize + space <= boxSize) {
                        maxLabelSize = Math.max(maxLabelSize, labelSize);
                    }
                }
                if (vertical) {
                    this.box = new Box(box.x1, box.y1, box.x1 + maxLabelSize + space, box.y2);
                } else {
                    this.box = new Box(box.x1, box.y1, box.x2, box.y1 + maxLabelSize + space);
                }
                this.arrangeTitle();
                this.arrangeLabels();
                this.arrangeNotes();
            },
            getLabelsTickPositions: function () {
                return this.getMajorTickPositions();
            },
            labelTickIndex: function (label) {
                return label.index;
            },
            arrangeLabels: function () {
                var this$1 = this;
                var ref = this;
                var options = ref.options;
                var labels = ref.labels;
                var labelsBetweenTicks = this.labelsBetweenTicks();
                var vertical = options.vertical;
                var lineBox = this.lineBox();
                var mirror = options.labels.mirror;
                var tickPositions = this.getLabelsTickPositions();
                var labelOffset = this.getActualTickSize() + options.margin;
                for (var idx = 0; idx < labels.length; idx++) {
                    var label = labels[idx];
                    var tickIx = this$1.labelTickIndex(label);
                    var labelSize = vertical ? label.box.height() : label.box.width();
                    var labelPos = tickPositions[tickIx] - labelSize / 2;
                    var labelBox = void 0, firstTickPosition = void 0, nextTickPosition = void 0;
                    if (vertical) {
                        if (labelsBetweenTicks) {
                            firstTickPosition = tickPositions[tickIx];
                            nextTickPosition = tickPositions[tickIx + 1];
                            var middle = firstTickPosition + (nextTickPosition - firstTickPosition) / 2;
                            labelPos = middle - labelSize / 2;
                        }
                        var labelX = lineBox.x2;
                        if (mirror) {
                            labelX += labelOffset;
                            label.options.rotationOrigin = LEFT;
                        } else {
                            labelX -= labelOffset + label.box.width();
                            label.options.rotationOrigin = RIGHT;
                        }
                        labelBox = label.box.move(labelX, labelPos);
                    } else {
                        if (labelsBetweenTicks) {
                            firstTickPosition = tickPositions[tickIx];
                            nextTickPosition = tickPositions[tickIx + 1];
                        } else {
                            firstTickPosition = labelPos;
                            nextTickPosition = labelPos + labelSize;
                        }
                        var labelY = lineBox.y1;
                        if (mirror) {
                            labelY -= labelOffset + label.box.height();
                            label.options.rotationOrigin = BOTTOM;
                        } else {
                            labelY += labelOffset;
                            label.options.rotationOrigin = TOP;
                        }
                        labelBox = new Box(firstTickPosition, labelY, nextTickPosition, labelY + label.box.height());
                    }
                    label.reflow(labelBox);
                }
            },
            autoRotateLabels: function () {
                if (this.options.autoRotateLabels && !this.options.vertical) {
                    var tickPositions = this.getMajorTickPositions();
                    var labels = this.labels;
                    var angle;
                    for (var idx = 0; idx < labels.length; idx++) {
                        var width = Math.abs(tickPositions[idx + 1] - tickPositions[idx]);
                        var labelBox = labels[idx].box;
                        if (labelBox.width() > width) {
                            if (labelBox.height() > width) {
                                angle = -90;
                                break;
                            }
                            angle = -45;
                        }
                    }
                    if (angle) {
                        for (var idx$1 = 0; idx$1 < labels.length; idx$1++) {
                            labels[idx$1].options.rotation = angle;
                            labels[idx$1].reflow(new Box());
                        }
                        return true;
                    }
                }
            },
            arrangeTitle: function () {
                var ref = this;
                var options = ref.options;
                var title = ref.title;
                var mirror = options.labels.mirror;
                var vertical = options.vertical;
                if (title) {
                    if (vertical) {
                        title.options.align = mirror ? RIGHT : LEFT;
                        title.options.vAlign = title.options.position;
                    } else {
                        title.options.align = title.options.position;
                        title.options.vAlign = mirror ? TOP : BOTTOM;
                    }
                    title.reflow(this.box);
                }
            },
            arrangeNotes: function () {
                var this$1 = this;
                for (var idx = 0; idx < this.notes.length; idx++) {
                    var item = this$1.notes[idx];
                    var value = item.options.value;
                    var slot = void 0;
                    if (defined(value)) {
                        if (this$1.shouldRenderNote(value)) {
                            item.show();
                        } else {
                            item.hide();
                        }
                        slot = this$1.noteSlot(value);
                    } else {
                        item.hide();
                    }
                    item.reflow(slot || this$1.lineBox());
                }
            },
            noteSlot: function (value) {
                return this.getSlot(value);
            },
            alignTo: function (secondAxis) {
                var lineBox = secondAxis.lineBox();
                var vertical = this.options.vertical;
                var pos = vertical ? Y : X;
                this.box.snapTo(lineBox, pos);
                if (vertical) {
                    this.box.shrink(0, this.lineBox().height() - lineBox.height());
                } else {
                    this.box.shrink(this.lineBox().width() - lineBox.width(), 0);
                }
                this.box[pos + 1] -= this.lineBox()[pos + 1] - lineBox[pos + 1];
                this.box[pos + 2] -= this.lineBox()[pos + 2] - lineBox[pos + 2];
            },
            axisLabelText: function (value, dataItem, options) {
                var tmpl = getTemplate(options);
                var text = value;
                if (tmpl) {
                    text = tmpl({
                        value: value,
                        dataItem: dataItem,
                        format: options.format,
                        culture: options.culture
                    });
                } else if (options.format) {
                    text = this.chartService.format.localeAuto(options.format, [value], options.culture);
                }
                return text;
            },
            slot: function (from, to, limit) {
                var slot = this.getSlot(from, to, limit);
                if (slot) {
                    return slot.toRect();
                }
            },
            contentBox: function () {
                var box = this.box.clone();
                var labels = this.labels;
                if (labels.length) {
                    var axis = this.options.vertical ? Y : X;
                    if (this.chartService.isPannable(axis)) {
                        var offset = this.maxLabelOffset();
                        box[axis + 1] -= offset.start;
                        box[axis + 2] += offset.end;
                    } else {
                        if (labels[0].options.visible) {
                            box.wrap(labels[0].box);
                        }
                        var lastLabel = labels[labels.length - 1];
                        if (lastLabel.options.visible) {
                            box.wrap(lastLabel.box);
                        }
                    }
                }
                return box;
            },
            maxLabelOffset: function () {
                var this$1 = this;
                var ref = this.options;
                var vertical = ref.vertical;
                var reverse = ref.reverse;
                var labelsBetweenTicks = this.labelsBetweenTicks();
                var tickPositions = this.getLabelsTickPositions();
                var offsetField = vertical ? Y : X;
                var labels = this.labels;
                var startPosition = reverse ? 1 : 0;
                var endPosition = reverse ? 0 : 1;
                var maxStartOffset = 0;
                var maxEndOffset = 0;
                for (var idx = 0; idx < labels.length; idx++) {
                    var label = labels[idx];
                    var tickIx = this$1.labelTickIndex(label);
                    var startTick = void 0, endTick = void 0;
                    if (labelsBetweenTicks) {
                        startTick = tickPositions[tickIx + startPosition];
                        endTick = tickPositions[tickIx + endPosition];
                    } else {
                        startTick = endTick = tickPositions[tickIx];
                    }
                    maxStartOffset = Math.max(maxStartOffset, startTick - label.box[offsetField + 1]);
                    maxEndOffset = Math.max(maxEndOffset, label.box[offsetField + 2] - endTick);
                }
                return {
                    start: maxStartOffset,
                    end: maxEndOffset
                };
            },
            limitRange: function (from, to, min, max, offset) {
                var options = this.options;
                if (from < min && offset < 0 && (!defined(options.min) || options.min <= min) || max < to && offset > 0 && (!defined(options.max) || max <= options.max)) {
                    return null;
                }
                if (to < min && offset > 0 || max < from && offset < 0) {
                    return {
                        min: from,
                        max: to
                    };
                }
                var rangeSize = to - from;
                var minValue = from;
                var maxValue = to;
                if (from < min && offset < 0) {
                    minValue = limitValue(from, min, max);
                    maxValue = limitValue(from + rangeSize, min + rangeSize, max);
                } else if (to > max && offset > 0) {
                    maxValue = limitValue(to, min, max);
                    minValue = limitValue(to - rangeSize, min, max - rangeSize);
                }
                return {
                    min: minValue,
                    max: maxValue
                };
            },
            valueRange: function () {
                return {
                    min: this.seriesMin,
                    max: this.seriesMax
                };
            },
            labelsBetweenTicks: function () {
                return !this.options.justified;
            },
            prepareUserOptions: function () {
            }
        });
        setDefaultOptions(Axis, {
            labels: {
                visible: true,
                rotation: 0,
                mirror: false,
                step: 1,
                skip: 0
            },
            line: {
                width: 1,
                color: BLACK,
                visible: true
            },
            title: {
                visible: true,
                position: CENTER
            },
            majorTicks: {
                align: OUTSIDE,
                size: 4,
                skip: 0,
                step: 1
            },
            minorTicks: {
                align: OUTSIDE,
                size: 3,
                skip: 0,
                step: 1
            },
            axisCrossingValue: 0,
            majorTickType: OUTSIDE,
            minorTickType: NONE,
            majorGridLines: {
                skip: 0,
                step: 1
            },
            minorGridLines: {
                visible: false,
                width: 1,
                color: BLACK,
                skip: 0,
                step: 1
            },
            margin: 5,
            visible: true,
            reverse: false,
            justified: true,
            notes: { label: { text: '' } },
            _alignLines: true,
            _deferLabels: false
        });
        var MILLISECONDS = 'milliseconds';
        var SECONDS = 'seconds';
        var MINUTES = 'minutes';
        var HOURS = 'hours';
        var DAYS = 'days';
        var WEEKS = 'weeks';
        var MONTHS = 'months';
        var YEARS = 'years';
        var TIME_PER_MILLISECOND = 1;
        var TIME_PER_SECOND = 1000;
        var TIME_PER_MINUTE = 60 * TIME_PER_SECOND;
        var TIME_PER_HOUR = 60 * TIME_PER_MINUTE;
        var TIME_PER_DAY = 24 * TIME_PER_HOUR;
        var TIME_PER_WEEK = 7 * TIME_PER_DAY;
        var TIME_PER_MONTH = 31 * TIME_PER_DAY;
        var TIME_PER_YEAR = 365 * TIME_PER_DAY;
        var TIME_PER_UNIT = {
            'years': TIME_PER_YEAR,
            'months': TIME_PER_MONTH,
            'weeks': TIME_PER_WEEK,
            'days': TIME_PER_DAY,
            'hours': TIME_PER_HOUR,
            'minutes': TIME_PER_MINUTE,
            'seconds': TIME_PER_SECOND,
            'milliseconds': TIME_PER_MILLISECOND
        };
        function absoluteDateDiff(a, b) {
            var diff = a.getTime() - b;
            var offsetDiff = a.getTimezoneOffset() - b.getTimezoneOffset();
            return diff - offsetDiff * TIME_PER_MINUTE;
        }
        function addTicks(date, ticks) {
            return new Date(date.getTime() + ticks);
        }
        function toDate(value) {
            var result;
            if (value instanceof Date) {
                result = value;
            } else if (value) {
                result = new Date(value);
            }
            return result;
        }
        function startOfWeek(date, weekStartDay) {
            if (weekStartDay === void 0) {
                weekStartDay = 0;
            }
            var daysToSubtract = 0;
            var day = date.getDay();
            if (!isNaN(day)) {
                while (day !== weekStartDay) {
                    if (day === 0) {
                        day = 6;
                    } else {
                        day--;
                    }
                    daysToSubtract++;
                }
            }
            return addTicks(date, -daysToSubtract * TIME_PER_DAY);
        }
        function adjustDST(date, hours) {
            if (hours === 0 && date.getHours() === 23) {
                date.setHours(date.getHours() + 2);
                return true;
            }
            return false;
        }
        function addHours(date, hours) {
            var roundedDate = new Date(date);
            roundedDate.setMinutes(0, 0, 0);
            var tzDiff = (date.getTimezoneOffset() - roundedDate.getTimezoneOffset()) * TIME_PER_MINUTE;
            return addTicks(roundedDate, tzDiff + hours * TIME_PER_HOUR);
        }
        function addDuration(dateValue, value, unit, weekStartDay) {
            var result = dateValue;
            if (dateValue) {
                var date = toDate(dateValue);
                var hours = date.getHours();
                if (unit === YEARS) {
                    result = new Date(date.getFullYear() + value, 0, 1);
                    adjustDST(result, 0);
                } else if (unit === MONTHS) {
                    result = new Date(date.getFullYear(), date.getMonth() + value, 1);
                    adjustDST(result, hours);
                } else if (unit === WEEKS) {
                    result = addDuration(startOfWeek(date, weekStartDay), value * 7, DAYS);
                    adjustDST(result, hours);
                } else if (unit === DAYS) {
                    result = new Date(date.getFullYear(), date.getMonth(), date.getDate() + value);
                    adjustDST(result, hours);
                } else if (unit === HOURS) {
                    result = addHours(date, value);
                } else if (unit === MINUTES) {
                    result = addTicks(date, value * TIME_PER_MINUTE);
                    if (result.getSeconds() > 0) {
                        result.setSeconds(0);
                    }
                } else if (unit === SECONDS) {
                    result = addTicks(date, value * TIME_PER_SECOND);
                } else if (unit === MILLISECONDS) {
                    result = addTicks(date, value);
                }
                if (unit !== MILLISECONDS && result.getMilliseconds() > 0) {
                    result.setMilliseconds(0);
                }
            }
            return result;
        }
        function floorDate(date, unit, weekStartDay) {
            return addDuration(toDate(date), 0, unit, weekStartDay);
        }
        function ceilDate(dateValue, unit, weekStartDay) {
            var date = toDate(dateValue);
            if (date && floorDate(date, unit, weekStartDay).getTime() === date.getTime()) {
                return date;
            }
            return addDuration(date, 1, unit, weekStartDay);
        }
        function dateComparer(a, b) {
            if (a && b) {
                return a.getTime() - b.getTime();
            }
            return -1;
        }
        function dateDiff(a, b) {
            return a.getTime() - b;
        }
        function toTime(value) {
            if (isArray(value)) {
                var result = [];
                for (var idx = 0; idx < value.length; idx++) {
                    result.push(toTime(value[idx]));
                }
                return result;
            } else if (value) {
                return toDate(value).getTime();
            }
        }
        function dateEquals(a, b) {
            if (a && b) {
                return toTime(a) === toTime(b);
            }
            return a === b;
        }
        function timeIndex(date, start, baseUnit) {
            return absoluteDateDiff(date, start) / TIME_PER_UNIT[baseUnit];
        }
        function dateIndex(value, start, baseUnit, baseUnitStep) {
            var date = toDate(value);
            var startDate = toDate(start);
            var index;
            if (baseUnit === MONTHS) {
                index = date.getMonth() - startDate.getMonth() + (date.getFullYear() - startDate.getFullYear()) * 12 + timeIndex(date, new Date(date.getFullYear(), date.getMonth()), DAYS) / new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
            } else if (baseUnit === YEARS) {
                index = date.getFullYear() - startDate.getFullYear() + dateIndex(date, new Date(date.getFullYear(), 0), MONTHS, 1) / 12;
            } else if (baseUnit === DAYS || baseUnit === WEEKS) {
                index = timeIndex(date, startDate, baseUnit);
            } else {
                index = dateDiff(date, start) / TIME_PER_UNIT[baseUnit];
            }
            return index / baseUnitStep;
        }
        function duration(a, b, unit) {
            var diff;
            if (unit === YEARS) {
                diff = b.getFullYear() - a.getFullYear();
            } else if (unit === MONTHS) {
                diff = duration(a, b, YEARS) * 12 + b.getMonth() - a.getMonth();
            } else if (unit === DAYS) {
                diff = Math.floor(dateDiff(b, a) / TIME_PER_DAY);
            } else {
                diff = Math.floor(dateDiff(b, a) / TIME_PER_UNIT[unit]);
            }
            return diff;
        }
        function lteDateIndex(date, sortedDates) {
            var low = 0;
            var high = sortedDates.length - 1;
            var index;
            while (low <= high) {
                index = Math.floor((low + high) / 2);
                var currentDate = sortedDates[index];
                if (currentDate < date) {
                    low = index + 1;
                    continue;
                }
                if (currentDate > date) {
                    high = index - 1;
                    continue;
                }
                while (dateEquals(sortedDates[index - 1], date)) {
                    index--;
                }
                return index;
            }
            if (sortedDates[index] <= date) {
                return index;
            }
            return index - 1;
        }
        function parseDate(intlService, date) {
            var result;
            if (isString(date)) {
                result = intlService.parseDate(date) || toDate(date);
            } else {
                result = toDate(date);
            }
            return result;
        }
        function parseDates(intlService, dates) {
            if (isArray(dates)) {
                var result = [];
                for (var idx = 0; idx < dates.length; idx++) {
                    result.push(parseDate(intlService, dates[idx]));
                }
                return result;
            }
            return parseDate(intlService, dates);
        }
        var MIN_CATEGORY_POINTS_RANGE = 0.01;
        function indexOf(value, arr) {
            if (value instanceof Date) {
                var length = arr.length;
                for (var idx = 0; idx < length; idx++) {
                    if (dateEquals(arr[idx], value)) {
                        return idx;
                    }
                }
                return -1;
            }
            return arr.indexOf(value);
        }
        var CategoryAxis = Axis.extend({
            initFields: function () {
                this._ticks = {};
            },
            categoriesHash: function () {
                return '';
            },
            clone: function () {
                var copy = new CategoryAxis($.extend({}, this.options, { categories: this.options.srcCategories }), this.chartService);
                copy.createLabels();
                return copy;
            },
            initUserOptions: function (options) {
                var categories = options.categories || [];
                var definedMin = defined(options.min);
                var definedMax = defined(options.max);
                options.srcCategories = options.categories = categories;
                if ((definedMin || definedMax) && categories.length) {
                    var min = definedMin ? Math.floor(options.min) : 0;
                    var max;
                    if (definedMax) {
                        max = options.justified ? Math.floor(options.max) + 1 : Math.ceil(options.max);
                    } else {
                        max = categories.length;
                    }
                    options.categories = options.categories.slice(min, max);
                }
                return options;
            },
            rangeIndices: function () {
                var options = this.options;
                var length = options.categories.length || 1;
                var min = isNumber(options.min) ? options.min % 1 : 0;
                var max;
                if (isNumber(options.max) && options.max % 1 !== 0 && options.max < this.totalRange().max) {
                    max = length - (1 - options.max % 1);
                } else {
                    max = length - (options.justified ? 1 : 0);
                }
                return {
                    min: min,
                    max: max
                };
            },
            totalRangeIndices: function (limit) {
                var options = this.options;
                var min = isNumber(options.min) ? options.min : 0;
                var max;
                if (isNumber(options.max)) {
                    max = options.max;
                } else if (isNumber(options.min)) {
                    max = min + options.categories.length;
                } else {
                    max = this.totalRange().max || 1;
                }
                if (limit) {
                    var totalRange = this.totalRange();
                    min = limitValue(min, 0, totalRange.max);
                    max = limitValue(max, 0, totalRange.max);
                }
                return {
                    min: min,
                    max: max
                };
            },
            range: function () {
                var options = this.options;
                var min = isNumber(options.min) ? options.min : 0;
                var max = isNumber(options.max) ? options.max : this.totalRange().max;
                return {
                    min: min,
                    max: max
                };
            },
            roundedRange: function () {
                return this.range();
            },
            totalRange: function () {
                var options = this.options;
                return {
                    min: 0,
                    max: Math.max(this._seriesMax || 0, options.srcCategories.length) - (options.justified ? 1 : 0)
                };
            },
            scaleOptions: function () {
                var ref = this.rangeIndices();
                var min = ref.min;
                var max = ref.max;
                var lineBox = this.lineBox();
                var size = this.options.vertical ? lineBox.height() : lineBox.width();
                var scale = size / (max - min || 1);
                return {
                    scale: scale * (this.options.reverse ? -1 : 1),
                    box: lineBox,
                    min: min,
                    max: max
                };
            },
            arrangeLabels: function () {
                Axis.fn.arrangeLabels.call(this);
                this.hideOutOfRangeLabels();
            },
            hideOutOfRangeLabels: function () {
                var ref = this;
                var box = ref.box;
                var labels = ref.labels;
                if (labels.length) {
                    var valueAxis = this.options.vertical ? Y : X;
                    var start = box[valueAxis + 1];
                    var end = box[valueAxis + 2];
                    var firstLabel = labels[0];
                    var lastLabel = last(labels);
                    if (firstLabel.box[valueAxis + 1] > end || firstLabel.box[valueAxis + 2] < start) {
                        firstLabel.options.visible = false;
                    }
                    if (lastLabel.box[valueAxis + 1] > end || lastLabel.box[valueAxis + 2] < start) {
                        lastLabel.options.visible = false;
                    }
                }
            },
            getMajorTickPositions: function () {
                return this.getTicks().majorTicks;
            },
            getMinorTickPositions: function () {
                return this.getTicks().minorTicks;
            },
            getLabelsTickPositions: function () {
                return this.getTicks().labelTicks;
            },
            tickIndices: function (stepSize) {
                var ref = this.rangeIndices();
                var min = ref.min;
                var max = ref.max;
                var limit = Math.ceil(max);
                var current = Math.floor(min);
                var indices = [];
                while (current <= limit) {
                    indices.push(current);
                    current += stepSize;
                }
                return indices;
            },
            getTickPositions: function (stepSize) {
                var ref = this.options;
                var vertical = ref.vertical;
                var reverse = ref.reverse;
                var ref$1 = this.scaleOptions();
                var scale = ref$1.scale;
                var box = ref$1.box;
                var min = ref$1.min;
                var pos = box[(vertical ? Y : X) + (reverse ? 2 : 1)];
                var indices = this.tickIndices(stepSize);
                var positions = [];
                for (var idx = 0; idx < indices.length; idx++) {
                    positions.push(pos + round(scale * (indices[idx] - min), COORD_PRECISION));
                }
                return positions;
            },
            getTicks: function () {
                var options = this.options;
                var cache = this._ticks;
                var range = this.rangeIndices();
                var lineBox = this.lineBox();
                var hash = lineBox.getHash() + range.min + ',' + range.max + options.reverse + options.justified;
                if (cache._hash !== hash) {
                    var hasMinor = options.minorTicks.visible || options.minorGridLines.visible;
                    cache._hash = hash;
                    cache.labelTicks = this.getTickPositions(1);
                    cache.majorTicks = this.filterOutOfRangePositions(cache.labelTicks, lineBox);
                    cache.minorTicks = hasMinor ? this.filterOutOfRangePositions(this.getTickPositions(0.5), lineBox) : [];
                }
                return cache;
            },
            filterOutOfRangePositions: function (positions, lineBox) {
                if (!positions.length) {
                    return positions;
                }
                var axis = this.options.vertical ? Y : X;
                var inRange = function (position) {
                    return lineBox[axis + 1] <= position && position <= lineBox[axis + 2];
                };
                var end = positions.length - 1;
                var startIndex = 0;
                while (!inRange(positions[startIndex]) && startIndex <= end) {
                    startIndex++;
                }
                var endIndex = end;
                while (!inRange(positions[endIndex]) && endIndex >= 0) {
                    endIndex--;
                }
                return positions.slice(startIndex, endIndex + 1);
            },
            getSlot: function (from, to, limit) {
                var options = this.options;
                var reverse = options.reverse;
                var justified = options.justified;
                var vertical = options.vertical;
                var ref = this.scaleOptions();
                var scale = ref.scale;
                var box = ref.box;
                var min = ref.min;
                var valueAxis = vertical ? Y : X;
                var lineStart = box[valueAxis + (reverse ? 2 : 1)];
                var slotBox = box.clone();
                var singleSlot = !defined(to);
                var start = valueOrDefault(from, 0);
                var end = valueOrDefault(to, start);
                end = Math.max(end - 1, start);
                end = Math.max(start, end);
                var p1 = lineStart + (start - min) * scale;
                var p2 = lineStart + (end + 1 - min) * scale;
                if (singleSlot && justified) {
                    p2 = p1;
                }
                if (limit) {
                    p1 = limitValue(p1, box[valueAxis + 1], box[valueAxis + 2]);
                    p2 = limitValue(p2, box[valueAxis + 1], box[valueAxis + 2]);
                }
                slotBox[valueAxis + 1] = reverse ? p2 : p1;
                slotBox[valueAxis + 2] = reverse ? p1 : p2;
                return slotBox;
            },
            limitSlot: function (slot) {
                var vertical = this.options.vertical;
                var valueAxis = vertical ? Y : X;
                var lineBox = this.lineBox();
                var limittedSlot = slot.clone();
                limittedSlot[valueAxis + 1] = limitValue(slot[valueAxis + 1], lineBox[valueAxis + 1], lineBox[valueAxis + 2]);
                limittedSlot[valueAxis + 2] = limitValue(slot[valueAxis + 2], lineBox[valueAxis + 1], lineBox[valueAxis + 2]);
                return limittedSlot;
            },
            slot: function (from, to, limit) {
                var min = Math.floor(this.options.min || 0);
                var start = from;
                var end = to;
                if (typeof start === 'string') {
                    start = this.categoryIndex(start);
                } else if (isNumber(start)) {
                    start -= min;
                }
                if (typeof end === 'string') {
                    end = this.categoryIndex(end);
                } else if (isNumber(end)) {
                    end -= min;
                }
                return Axis.fn.slot.call(this, start, end, limit);
            },
            pointCategoryIndex: function (point) {
                var ref = this.options;
                var reverse = ref.reverse;
                var justified = ref.justified;
                var vertical = ref.vertical;
                var valueAxis = vertical ? Y : X;
                var ref$1 = this.scaleOptions();
                var scale = ref$1.scale;
                var box = ref$1.box;
                var min = ref$1.min;
                var max = ref$1.max;
                var startValue = reverse ? max : min;
                var lineStart = box[valueAxis + 1];
                var lineEnd = box[valueAxis + 2];
                var pos = point[valueAxis];
                if (pos < lineStart || pos > lineEnd) {
                    return null;
                }
                var value = startValue + (pos - lineStart) / scale;
                var diff = value % 1;
                if (justified) {
                    value = Math.round(value);
                } else if (diff === 0 && value > 0) {
                    value--;
                }
                return Math.floor(value);
            },
            getCategory: function (point) {
                var index = this.pointCategoryIndex(point);
                if (index === null) {
                    return null;
                }
                return this.options.categories[index];
            },
            categoryIndex: function (value) {
                return this.totalIndex(value) - Math.floor(this.options.min || 0);
            },
            categoryAt: function (index, total) {
                var options = this.options;
                return (total ? options.srcCategories : options.categories)[index];
            },
            categoriesCount: function () {
                return (this.options.categories || []).length;
            },
            translateRange: function (delta) {
                var options = this.options;
                var lineBox = this.lineBox();
                var size = options.vertical ? lineBox.height() : lineBox.width();
                var range = options.categories.length;
                var scale = size / range;
                var offset = round(delta / scale, DEFAULT_PRECISION);
                return {
                    min: offset,
                    max: range + offset
                };
            },
            zoomRange: function (rate) {
                var rangeIndices = this.totalRangeIndices();
                var ref = this.totalRange();
                var totalMin = ref.min;
                var totalMax = ref.max;
                var min = limitValue(rangeIndices.min + rate, totalMin, totalMax);
                var max = limitValue(rangeIndices.max - rate, totalMin, totalMax);
                if (max - min > 0) {
                    return {
                        min: min,
                        max: max
                    };
                }
            },
            scaleRange: function (scale) {
                var range = this.options.categories.length;
                var delta = scale * range;
                return {
                    min: -delta,
                    max: range + delta
                };
            },
            labelsCount: function () {
                var labelsRange = this.labelsRange();
                return labelsRange.max - labelsRange.min;
            },
            labelsRange: function () {
                var options = this.options;
                var justified = options.justified;
                var labelOptions = options.labels;
                var ref = this.totalRangeIndices(true);
                var min = ref.min;
                var max = ref.max;
                var start = Math.floor(min);
                if (!justified) {
                    min = Math.floor(min);
                    max = Math.ceil(max);
                } else {
                    min = Math.ceil(min);
                    max = Math.floor(max);
                }
                var skip;
                if (min > labelOptions.skip) {
                    skip = labelOptions.skip + labelOptions.step * Math.ceil((min - labelOptions.skip) / labelOptions.step);
                } else {
                    skip = labelOptions.skip;
                }
                return {
                    min: skip - start,
                    max: (options.categories.length ? max + (justified ? 1 : 0) : 0) - start
                };
            },
            createAxisLabel: function (index, labelOptions) {
                var options = this.options;
                var dataItem = options.dataItems ? options.dataItems[index] : null;
                var category = valueOrDefault(options.categories[index], '');
                var text = this.axisLabelText(category, dataItem, labelOptions);
                return new AxisLabel(category, text, index, dataItem, labelOptions);
            },
            shouldRenderNote: function (value) {
                var range = this.totalRangeIndices();
                return Math.floor(range.min) <= value && value <= Math.ceil(range.max);
            },
            noteSlot: function (value) {
                var options = this.options;
                var index = value - Math.floor(options.min || 0);
                return this.getSlot(index);
            },
            arrangeNotes: function () {
                Axis.fn.arrangeNotes.call(this);
                this.hideOutOfRangeNotes();
            },
            hideOutOfRangeNotes: function () {
                var ref = this;
                var notes = ref.notes;
                var box = ref.box;
                if (notes && notes.length) {
                    var valueAxis = this.options.vertical ? Y : X;
                    var start = box[valueAxis + 1];
                    var end = box[valueAxis + 2];
                    for (var idx = 0; idx < notes.length; idx++) {
                        var note = notes[idx];
                        if (note.box && (end < note.box[valueAxis + 1] || note.box[valueAxis + 2] < start)) {
                            note.hide();
                        }
                    }
                }
            },
            pan: function (delta) {
                var range = this.totalRangeIndices(true);
                var ref = this.scaleOptions();
                var scale = ref.scale;
                var offset = round(delta / scale, DEFAULT_PRECISION);
                var totalRange = this.totalRange();
                var min = range.min + offset;
                var max = range.max + offset;
                return this.limitRange(min, max, 0, totalRange.max, offset);
            },
            pointsRange: function (start, end) {
                var ref = this.options;
                var reverse = ref.reverse;
                var vertical = ref.vertical;
                var valueAxis = vertical ? Y : X;
                var range = this.totalRangeIndices(true);
                var ref$1 = this.scaleOptions();
                var scale = ref$1.scale;
                var box = ref$1.box;
                var lineStart = box[valueAxis + (reverse ? 2 : 1)];
                var diffStart = start[valueAxis] - lineStart;
                var diffEnd = end[valueAxis] - lineStart;
                var min = range.min + diffStart / scale;
                var max = range.min + diffEnd / scale;
                var rangeMin = Math.min(min, max);
                var rangeMax = Math.max(min, max);
                if (rangeMax - rangeMin >= MIN_CATEGORY_POINTS_RANGE) {
                    return {
                        min: rangeMin,
                        max: rangeMax
                    };
                }
            },
            valueRange: function () {
                return this.range();
            },
            totalIndex: function (value) {
                var options = this.options;
                var index = this._categoriesMap ? this._categoriesMap.get(value) : indexOf(value, options.srcCategories);
                return index;
            },
            currentRangeIndices: function () {
                var options = this.options;
                var min = 0;
                if (isNumber(options.min)) {
                    min = Math.floor(options.min);
                }
                var max;
                if (isNumber(options.max)) {
                    max = options.justified ? Math.floor(options.max) : Math.ceil(options.max) - 1;
                } else {
                    max = this.totalCount() - 1;
                }
                return {
                    min: min,
                    max: max
                };
            },
            mapCategories: function () {
                if (!this._categoriesMap) {
                    var map$$1 = this._categoriesMap = new HashMap();
                    var srcCategories = this.options.srcCategories;
                    for (var idx = 0; idx < srcCategories.length; idx++) {
                        map$$1.set(srcCategories[idx], idx);
                    }
                }
            },
            totalCount: function () {
                return Math.max(this.options.srcCategories.length, this._seriesMax || 0);
            }
        });
        setDefaultOptions(CategoryAxis, {
            type: 'category',
            vertical: false,
            majorGridLines: {
                visible: false,
                width: 1,
                color: BLACK
            },
            labels: { zIndex: 1 },
            justified: false,
            _deferLabels: true
        });
        var COORDINATE_LIMIT = 300000;
        var DateLabelFormats = {
            milliseconds: 'HH:mm:ss.fff',
            seconds: 'HH:mm:ss',
            minutes: 'HH:mm',
            hours: 'HH:mm',
            days: 'M/d',
            weeks: 'M/d',
            months: 'MMM \'yy',
            years: 'yyyy'
        };
        var ZERO_THRESHOLD = 0.2;
        var AUTO = 'auto';
        var BASE_UNITS = [
            MILLISECONDS,
            SECONDS,
            MINUTES,
            HOURS,
            DAYS,
            WEEKS,
            MONTHS,
            YEARS
        ];
        var FIT = 'fit';
        function categoryRange(categories) {
            var range = categories._range;
            if (!range) {
                range = categories._range = sparseArrayLimits(categories);
                range.min = toDate(range.min);
                range.max = toDate(range.max);
            }
            return range;
        }
        var EmptyDateRange = Class.extend({
            init: function (options) {
                this.options = options;
            },
            displayIndices: function () {
                return {
                    min: 0,
                    max: 1
                };
            },
            displayRange: function () {
                return {};
            },
            total: function () {
                return {};
            },
            valueRange: function () {
                return {};
            },
            valueIndex: function () {
                return -1;
            },
            values: function () {
                return [];
            },
            totalIndex: function () {
                return -1;
            },
            valuesCount: function () {
                return 0;
            },
            totalCount: function () {
                return 0;
            },
            dateAt: function () {
                return null;
            }
        });
        var DateRange = Class.extend({
            init: function (start, end, options) {
                this.options = options;
                options.baseUnitStep = options.baseUnitStep || 1;
                var roundToBaseUnit = options.roundToBaseUnit;
                var justified = options.justified;
                this.start = addDuration(start, 0, options.baseUnit, options.weekStartDay);
                var lowerEnd = this.roundToTotalStep(end);
                var expandEnd = !justified && dateEquals(end, lowerEnd) && !options.justifyEnd;
                this.end = this.roundToTotalStep(end, !justified, expandEnd ? 1 : 0);
                var min = options.min || start;
                this.valueStart = this.roundToTotalStep(min);
                this.displayStart = roundToBaseUnit ? this.valueStart : min;
                var max = options.max;
                if (!max) {
                    this.valueEnd = lowerEnd;
                    this.displayEnd = roundToBaseUnit || expandEnd ? this.end : end;
                } else {
                    this.valueEnd = this.roundToTotalStep(max, false, !justified && dateEquals(max, this.roundToTotalStep(max)) ? -1 : 0);
                    this.displayEnd = roundToBaseUnit ? this.roundToTotalStep(max, !justified) : options.max;
                }
                if (this.valueEnd < this.valueStart) {
                    this.valueEnd = this.valueStart;
                }
                if (this.displayEnd <= this.displayStart) {
                    this.displayEnd = this.roundToTotalStep(this.displayStart, false, 1);
                }
            },
            displayRange: function () {
                return {
                    min: this.displayStart,
                    max: this.displayEnd
                };
            },
            displayIndices: function () {
                if (!this._indices) {
                    var options = this.options;
                    var baseUnit = options.baseUnit;
                    var baseUnitStep = options.baseUnitStep;
                    var minIdx = dateIndex(this.displayStart, this.valueStart, baseUnit, baseUnitStep);
                    var maxIdx = dateIndex(this.displayEnd, this.valueStart, baseUnit, baseUnitStep);
                    this._indices = {
                        min: minIdx,
                        max: maxIdx
                    };
                }
                return this._indices;
            },
            total: function () {
                return {
                    min: this.start,
                    max: this.end
                };
            },
            totalCount: function () {
                var last$$1 = this.totalIndex(this.end);
                return last$$1 + (this.options.justified ? 1 : 0);
            },
            valueRange: function () {
                return {
                    min: this.valueStart,
                    max: this.valueEnd
                };
            },
            valueIndex: function (value) {
                var options = this.options;
                return Math.floor(dateIndex(value, this.valueStart, options.baseUnit, options.baseUnitStep));
            },
            totalIndex: function (value) {
                var options = this.options;
                return Math.floor(dateIndex(value, this.start, options.baseUnit, options.baseUnitStep));
            },
            dateIndex: function (value) {
                var options = this.options;
                return dateIndex(value, this.valueStart, options.baseUnit, options.baseUnitStep);
            },
            valuesCount: function () {
                var maxIdx = this.valueIndex(this.valueEnd);
                return maxIdx + 1;
            },
            values: function () {
                var values = this._values;
                if (!values) {
                    var options = this.options;
                    var range = this.valueRange();
                    this._values = values = [];
                    for (var date = range.min; date <= range.max;) {
                        values.push(date);
                        date = addDuration(date, options.baseUnitStep, options.baseUnit, options.weekStartDay);
                    }
                }
                return values;
            },
            dateAt: function (index, total) {
                var options = this.options;
                return addDuration(total ? this.start : this.valueStart, options.baseUnitStep * index, options.baseUnit, options.weekStartDay);
            },
            roundToTotalStep: function (value, upper, next) {
                var ref = this.options;
                var baseUnit = ref.baseUnit;
                var baseUnitStep = ref.baseUnitStep;
                var weekStartDay = ref.weekStartDay;
                var start = this.start;
                var step = dateIndex(value, start, baseUnit, baseUnitStep);
                var roundedStep = upper ? Math.ceil(step) : Math.floor(step);
                if (next) {
                    roundedStep += next;
                }
                return addDuration(start, roundedStep * baseUnitStep, baseUnit, weekStartDay);
            }
        });
        function autoBaseUnit(options, startUnit, startStep) {
            var categoryLimits = categoryRange(options.categories);
            var span = (options.max || categoryLimits.max) - (options.min || categoryLimits.min);
            var autoBaseUnitSteps = options.autoBaseUnitSteps;
            var maxDateGroups = options.maxDateGroups;
            var autoUnit = options.baseUnit === FIT;
            var autoUnitIx = startUnit ? BASE_UNITS.indexOf(startUnit) : 0;
            var baseUnit = autoUnit ? BASE_UNITS[autoUnitIx++] : options.baseUnit;
            var units = span / TIME_PER_UNIT[baseUnit];
            var totalUnits = units;
            var unitSteps, step, nextStep;
            while (!step || units >= maxDateGroups) {
                unitSteps = unitSteps || autoBaseUnitSteps[baseUnit].slice(0);
                do {
                    nextStep = unitSteps.shift();
                } while (nextStep && startUnit === baseUnit && nextStep < startStep);
                if (nextStep) {
                    step = nextStep;
                    units = totalUnits / step;
                } else if (baseUnit === last(BASE_UNITS)) {
                    step = Math.ceil(totalUnits / maxDateGroups);
                    break;
                } else if (autoUnit) {
                    baseUnit = BASE_UNITS[autoUnitIx++] || last(BASE_UNITS);
                    totalUnits = span / TIME_PER_UNIT[baseUnit];
                    unitSteps = null;
                } else {
                    if (units > maxDateGroups) {
                        step = Math.ceil(totalUnits / maxDateGroups);
                    }
                    break;
                }
            }
            options.baseUnitStep = step;
            options.baseUnit = baseUnit;
        }
        function defaultBaseUnit(options) {
            var categories = options.categories;
            var count = defined(categories) ? categories.length : 0;
            var minDiff = MAX_VALUE;
            var lastCategory, unit;
            for (var categoryIx = 0; categoryIx < count; categoryIx++) {
                var category = categories[categoryIx];
                if (category && lastCategory) {
                    var diff = absoluteDateDiff(category, lastCategory);
                    if (diff > 0) {
                        minDiff = Math.min(minDiff, diff);
                        if (minDiff >= TIME_PER_YEAR) {
                            unit = YEARS;
                        } else if (minDiff >= TIME_PER_MONTH - TIME_PER_DAY * 3) {
                            unit = MONTHS;
                        } else if (minDiff >= TIME_PER_WEEK) {
                            unit = WEEKS;
                        } else if (minDiff >= TIME_PER_DAY) {
                            unit = DAYS;
                        } else if (minDiff >= TIME_PER_HOUR) {
                            unit = HOURS;
                        } else if (minDiff >= TIME_PER_MINUTE) {
                            unit = MINUTES;
                        } else {
                            unit = SECONDS;
                        }
                    }
                }
                lastCategory = category;
            }
            options.baseUnit = unit || DAYS;
        }
        function initUnit(options) {
            var baseUnit = (options.baseUnit || '').toLowerCase();
            var useDefault = baseUnit !== FIT && !inArray(baseUnit, BASE_UNITS);
            if (useDefault) {
                defaultBaseUnit(options);
            }
            if (baseUnit === FIT || options.baseUnitStep === AUTO) {
                autoBaseUnit(options);
            }
            return options;
        }
        var DateCategoryAxis = CategoryAxis.extend({
            clone: function () {
                var copy = new DateCategoryAxis($.extend({}, this.options), this.chartService);
                copy.createLabels();
                return copy;
            },
            categoriesHash: function () {
                var start = this.dataRange.total().min;
                return this.options.baseUnit + this.options.baseUnitStep + start;
            },
            initUserOptions: function (options) {
                return options;
            },
            initFields: function () {
                CategoryAxis.fn.initFields.call(this);
                var chartService = this.chartService;
                var intlService = chartService.intl;
                var options = this.options;
                var categories = options.categories || [];
                if (!categories._parsed) {
                    categories = parseDates(intlService, categories);
                    categories._parsed = true;
                }
                options = deepExtend({ roundToBaseUnit: true }, options, {
                    categories: categories,
                    min: parseDate(intlService, options.min),
                    max: parseDate(intlService, options.max)
                });
                if (chartService.panning && chartService.isPannable(options.vertical ? Y : X)) {
                    options.roundToBaseUnit = false;
                }
                options.userSetBaseUnit = options.userSetBaseUnit || options.baseUnit;
                options.userSetBaseUnitStep = options.userSetBaseUnitStep || options.baseUnitStep;
                this.options = options;
                options.srcCategories = categories;
                if (categories.length > 0) {
                    var range = categoryRange(categories);
                    var maxDivisions = options.maxDivisions;
                    this.dataRange = new DateRange(range.min, range.max, initUnit(options));
                    if (maxDivisions) {
                        var dataRange = this.dataRange.displayRange();
                        var divisionOptions = $.extend({}, options, {
                            justified: true,
                            roundToBaseUnit: false,
                            baseUnit: 'fit',
                            min: dataRange.min,
                            max: dataRange.max,
                            maxDateGroups: maxDivisions
                        });
                        var dataRangeOptions = this.dataRange.options;
                        autoBaseUnit(divisionOptions, dataRangeOptions.baseUnit, dataRangeOptions.baseUnitStep);
                        this.divisionRange = new DateRange(range.min, range.max, divisionOptions);
                    } else {
                        this.divisionRange = this.dataRange;
                    }
                } else {
                    options.baseUnit = options.baseUnit || DAYS;
                    this.dataRange = this.divisionRange = new EmptyDateRange(options);
                }
            },
            tickIndices: function (stepSize) {
                var ref = this;
                var dataRange = ref.dataRange;
                var divisionRange = ref.divisionRange;
                var valuesCount = divisionRange.valuesCount();
                if (!this.options.maxDivisions || !valuesCount) {
                    return CategoryAxis.fn.tickIndices.call(this, stepSize);
                }
                var indices = [];
                var values = divisionRange.values();
                var offset = 0;
                if (!this.options.justified) {
                    values = values.concat(divisionRange.dateAt(valuesCount));
                    offset = 0.5;
                }
                for (var idx = 0; idx < values.length; idx++) {
                    indices.push(dataRange.dateIndex(values[idx]) + offset);
                    if (stepSize !== 1 && idx >= 1) {
                        var last$$1 = indices.length - 1;
                        indices.splice(idx, 0, indices[last$$1 - 1] + (indices[last$$1] - indices[last$$1 - 1]) * stepSize);
                    }
                }
                return indices;
            },
            shouldRenderNote: function (value) {
                var range = this.range();
                var categories = this.options.categories || [];
                return dateComparer(value, range.min) >= 0 && dateComparer(value, range.max) <= 0 && categories.length;
            },
            parseNoteValue: function (value) {
                return parseDate(this.chartService.intl, value);
            },
            noteSlot: function (value) {
                return this.getSlot(value);
            },
            translateRange: function (delta) {
                var options = this.options;
                var baseUnit = options.baseUnit;
                var weekStartDay = options.weekStartDay;
                var vertical = options.vertical;
                var lineBox = this.lineBox();
                var size = vertical ? lineBox.height() : lineBox.width();
                var range = this.range();
                var scale = size / (range.max - range.min);
                var offset = round(delta / scale, DEFAULT_PRECISION);
                if (range.min && range.max) {
                    var from = addTicks(options.min || range.min, offset);
                    var to = addTicks(options.max || range.max, offset);
                    range = {
                        min: addDuration(from, 0, baseUnit, weekStartDay),
                        max: addDuration(to, 0, baseUnit, weekStartDay)
                    };
                }
                return range;
            },
            scaleRange: function (delta) {
                var rounds = Math.abs(delta);
                var result = this.range();
                var from = result.min;
                var to = result.max;
                if (from && to) {
                    while (rounds--) {
                        var range = dateDiff(from, to);
                        var step = Math.round(range * 0.1);
                        if (delta < 0) {
                            from = addTicks(from, step);
                            to = addTicks(to, -step);
                        } else {
                            from = addTicks(from, -step);
                            to = addTicks(to, step);
                        }
                    }
                    result = {
                        min: from,
                        max: to
                    };
                }
                return result;
            },
            labelsRange: function () {
                return {
                    min: this.options.labels.skip,
                    max: this.divisionRange.valuesCount()
                };
            },
            pan: function (delta) {
                if (this.isEmpty()) {
                    return null;
                }
                var options = this.options;
                var lineBox = this.lineBox();
                var size = options.vertical ? lineBox.height() : lineBox.width();
                var ref = this.dataRange.displayRange();
                var min = ref.min;
                var max = ref.max;
                var totalLimits = this.dataRange.total();
                var scale = size / (max - min);
                var offset = round(delta / scale, DEFAULT_PRECISION) * (options.reverse ? -1 : 1);
                var from = addTicks(min, offset);
                var to = addTicks(max, offset);
                var panRange = this.limitRange(toTime(from), toTime(to), toTime(totalLimits.min), toTime(totalLimits.max), offset);
                if (panRange) {
                    panRange.min = toDate(panRange.min);
                    panRange.max = toDate(panRange.max);
                    panRange.baseUnit = options.baseUnit;
                    panRange.baseUnitStep = options.baseUnitStep || 1;
                    panRange.userSetBaseUnit = options.userSetBaseUnit;
                    panRange.userSetBaseUnitStep = options.userSetBaseUnitStep;
                    return panRange;
                }
            },
            pointsRange: function (start, end) {
                if (this.isEmpty()) {
                    return null;
                }
                var pointsRange = CategoryAxis.fn.pointsRange.call(this, start, end);
                var datesRange = this.dataRange.displayRange();
                var indicesRange = this.dataRange.displayIndices();
                var scale = dateDiff(datesRange.max, datesRange.min) / (indicesRange.max - indicesRange.min);
                var options = this.options;
                var min = addTicks(datesRange.min, pointsRange.min * scale);
                var max = addTicks(datesRange.min, pointsRange.max * scale);
                return {
                    min: min,
                    max: max,
                    baseUnit: options.userSetBaseUnit || options.baseUnit,
                    baseUnitStep: options.userSetBaseUnitStep || options.baseUnitStep
                };
            },
            zoomRange: function (delta) {
                if (this.isEmpty()) {
                    return null;
                }
                var options = this.options;
                var fit = options.userSetBaseUnit === FIT;
                var totalLimits = this.dataRange.total();
                var ref = this.dataRange.displayRange();
                var rangeMin = ref.min;
                var rangeMax = ref.max;
                var ref$1 = this.dataRange.options;
                var weekStartDay = ref$1.weekStartDay;
                var baseUnit = ref$1.baseUnit;
                var baseUnitStep = ref$1.baseUnitStep;
                var min = addDuration(rangeMin, delta * baseUnitStep, baseUnit, weekStartDay);
                var max = addDuration(rangeMax, -delta * baseUnitStep, baseUnit, weekStartDay);
                if (fit) {
                    var autoBaseUnitSteps = options.autoBaseUnitSteps;
                    var maxDateGroups = options.maxDateGroups;
                    var maxDiff = last(autoBaseUnitSteps[baseUnit]) * maxDateGroups * TIME_PER_UNIT[baseUnit];
                    var rangeDiff = dateDiff(rangeMax, rangeMin);
                    var diff = dateDiff(max, min);
                    var baseUnitIndex = BASE_UNITS.indexOf(baseUnit);
                    var autoBaseUnitStep, ticks;
                    if (diff < TIME_PER_UNIT[baseUnit] && baseUnit !== MILLISECONDS) {
                        baseUnit = BASE_UNITS[baseUnitIndex - 1];
                        autoBaseUnitStep = last(autoBaseUnitSteps[baseUnit]);
                        ticks = (rangeDiff - (maxDateGroups - 1) * autoBaseUnitStep * TIME_PER_UNIT[baseUnit]) / 2;
                        min = addTicks(rangeMin, ticks);
                        max = addTicks(rangeMax, -ticks);
                    } else if (diff > maxDiff && baseUnit !== YEARS) {
                        var stepIndex = 0;
                        do {
                            baseUnitIndex++;
                            baseUnit = BASE_UNITS[baseUnitIndex];
                            stepIndex = 0;
                            ticks = 2 * TIME_PER_UNIT[baseUnit];
                            do {
                                autoBaseUnitStep = autoBaseUnitSteps[baseUnit][stepIndex];
                                stepIndex++;
                            } while (stepIndex < autoBaseUnitSteps[baseUnit].length && ticks * autoBaseUnitStep < rangeDiff);
                        } while (baseUnit !== YEARS && ticks * autoBaseUnitStep < rangeDiff);
                        ticks = (ticks * autoBaseUnitStep - rangeDiff) / 2;
                        if (ticks > 0) {
                            min = addTicks(rangeMin, -ticks);
                            max = addTicks(rangeMax, ticks);
                            min = addTicks(min, limitValue(max, totalLimits.min, totalLimits.max) - max);
                            max = addTicks(max, limitValue(min, totalLimits.min, totalLimits.max) - min);
                        }
                    }
                }
                if (min < totalLimits.min) {
                    min = totalLimits.min;
                }
                if (max > totalLimits.max) {
                    max = totalLimits.max;
                }
                if (min && max && dateDiff(max, min) > 0) {
                    return {
                        min: min,
                        max: max,
                        baseUnit: options.userSetBaseUnit || options.baseUnit,
                        baseUnitStep: options.userSetBaseUnitStep || options.baseUnitStep
                    };
                }
            },
            range: function () {
                return this.dataRange.displayRange();
            },
            createAxisLabel: function (index, labelOptions) {
                var options = this.options;
                var dataItem = options.dataItems && !options.maxDivisions ? options.dataItems[index] : null;
                var date = this.divisionRange.dateAt(index);
                var unitFormat = labelOptions.dateFormats[this.divisionRange.options.baseUnit];
                labelOptions.format = labelOptions.format || unitFormat;
                var text = this.axisLabelText(date, dataItem, labelOptions);
                if (text) {
                    return new AxisLabel(date, text, index, dataItem, labelOptions);
                }
            },
            categoryIndex: function (value) {
                return this.dataRange.valueIndex(value);
            },
            slot: function (from, to, limit) {
                var dateRange = this.dataRange;
                var start = from;
                var end = to;
                if (start instanceof Date) {
                    start = dateRange.dateIndex(start);
                }
                if (end instanceof Date) {
                    end = dateRange.dateIndex(end);
                }
                var slot = this.getSlot(start, end, limit);
                if (slot) {
                    return slot.toRect();
                }
            },
            getSlot: function (a, b, limit) {
                var start = a;
                var end = b;
                if (typeof start === OBJECT) {
                    start = this.categoryIndex(start);
                }
                if (typeof end === OBJECT) {
                    end = this.categoryIndex(end);
                }
                return CategoryAxis.fn.getSlot.call(this, start, end, limit);
            },
            valueRange: function () {
                var options = this.options;
                var range = categoryRange(options.srcCategories);
                return {
                    min: toDate(range.min),
                    max: toDate(range.max)
                };
            },
            categoryAt: function (index, total) {
                return this.dataRange.dateAt(index, total);
            },
            categoriesCount: function () {
                return this.dataRange.valuesCount();
            },
            rangeIndices: function () {
                return this.dataRange.displayIndices();
            },
            labelsBetweenTicks: function () {
                return !this.divisionRange.options.justified;
            },
            prepareUserOptions: function () {
                if (this.isEmpty()) {
                    return;
                }
                this.options.categories = this.dataRange.values();
            },
            getCategory: function (point) {
                var index = this.pointCategoryIndex(point);
                if (index === null) {
                    return null;
                }
                return this.dataRange.dateAt(index);
            },
            totalIndex: function (value) {
                return this.dataRange.totalIndex(value);
            },
            currentRangeIndices: function () {
                var range = this.dataRange.valueRange();
                return {
                    min: this.dataRange.totalIndex(range.min),
                    max: this.dataRange.totalIndex(range.max)
                };
            },
            totalRange: function () {
                return this.dataRange.total();
            },
            totalCount: function () {
                return this.dataRange.totalCount();
            },
            isEmpty: function () {
                return !this.options.srcCategories.length;
            },
            roundedRange: function () {
                if (this.options.roundToBaseUnit !== false || this.isEmpty()) {
                    return this.range();
                }
                var options = this.options;
                var datesRange = categoryRange(options.srcCategories);
                var dateRange = new DateRange(datesRange.min, datesRange.max, $.extend({}, options, {
                    justified: false,
                    roundToBaseUnit: true,
                    justifyEnd: options.justified
                }));
                return dateRange.displayRange();
            }
        });
        setDefaultOptions(DateCategoryAxis, {
            type: DATE,
            labels: { dateFormats: DateLabelFormats },
            autoBaseUnitSteps: {
                milliseconds: [
                    1,
                    10,
                    100
                ],
                seconds: [
                    1,
                    2,
                    5,
                    15,
                    30
                ],
                minutes: [
                    1,
                    2,
                    5,
                    15,
                    30
                ],
                hours: [
                    1,
                    2,
                    3
                ],
                days: [
                    1,
                    2,
                    3
                ],
                weeks: [
                    1,
                    2
                ],
                months: [
                    1,
                    2,
                    3,
                    6
                ],
                years: [
                    1,
                    2,
                    3,
                    5,
                    10,
                    25,
                    50
                ]
            },
            maxDateGroups: 10
        });
        function autoAxisMin(min, max, narrow) {
            if (!min && !max) {
                return 0;
            }
            var axisMin;
            if (min >= 0 && max >= 0) {
                var minValue = min === max ? 0 : min;
                var diff = (max - minValue) / max;
                if (narrow === false || !narrow && diff > ZERO_THRESHOLD) {
                    return 0;
                }
                axisMin = Math.max(0, minValue - (max - minValue) / 2);
            } else {
                axisMin = min;
            }
            return axisMin;
        }
        function autoAxisMax(min, max, narrow) {
            if (!min && !max) {
                return 1;
            }
            var axisMax;
            if (min <= 0 && max <= 0) {
                var maxValue = min === max ? 0 : max;
                var diff = Math.abs((maxValue - min) / maxValue);
                if (narrow === false || !narrow && diff > ZERO_THRESHOLD) {
                    return 0;
                }
                axisMax = Math.min(0, maxValue - (min - maxValue) / 2);
            } else {
                axisMax = max;
            }
            return axisMax;
        }
        function floor(value, step) {
            return round(Math.floor(value / step) * step, DEFAULT_PRECISION);
        }
        function ceil(value, step) {
            return round(Math.ceil(value / step) * step, DEFAULT_PRECISION);
        }
        function limitCoordinate(value) {
            return Math.max(Math.min(value, COORDINATE_LIMIT), -COORDINATE_LIMIT);
        }
        var MIN_VALUE_RANGE = Math.pow(10, -DEFAULT_PRECISION + 1);
        var NumericAxis = Axis.extend({
            init: function (seriesMin, seriesMax, options, chartService) {
                Axis.fn.init.call(this, $.extend({}, options, {
                    seriesMin: seriesMin,
                    seriesMax: seriesMax
                }), chartService);
            },
            initUserOptions: function (options) {
                var autoOptions = autoAxisOptions(options.seriesMin, options.seriesMax, options);
                this.totalOptions = totalAxisOptions(autoOptions, options);
                return axisOptions(autoOptions, options);
            },
            initFields: function () {
                this.totalMin = this.totalOptions.min;
                this.totalMax = this.totalOptions.max;
                this.totalMajorUnit = this.totalOptions.majorUnit;
                this.seriesMin = this.options.seriesMin;
                this.seriesMax = this.options.seriesMax;
            },
            clone: function () {
                return new NumericAxis(this.seriesMin, this.seriesMax, $.extend({}, this.options), this.chartService);
            },
            startValue: function () {
                return 0;
            },
            range: function () {
                var options = this.options;
                return {
                    min: options.min,
                    max: options.max
                };
            },
            getDivisions: function (stepValue) {
                if (stepValue === 0) {
                    return 1;
                }
                var options = this.options;
                var range = options.max - options.min;
                return Math.floor(round(range / stepValue, COORD_PRECISION)) + 1;
            },
            getTickPositions: function (unit, skipUnit) {
                var options = this.options;
                var vertical = options.vertical;
                var reverse = options.reverse;
                var lineBox = this.lineBox();
                var lineSize = vertical ? lineBox.height() : lineBox.width();
                var range = options.max - options.min;
                var scale = lineSize / range;
                var step = unit * scale;
                var divisions = this.getDivisions(unit);
                var dir = (vertical ? -1 : 1) * (reverse ? -1 : 1);
                var startEdge = dir === 1 ? 1 : 2;
                var positions = [];
                var pos = lineBox[(vertical ? Y : X) + startEdge];
                var skipStep = 0;
                if (skipUnit) {
                    skipStep = skipUnit / unit;
                }
                for (var idx = 0; idx < divisions; idx++) {
                    if (idx % skipStep !== 0) {
                        positions.push(round(pos, COORD_PRECISION));
                    }
                    pos = pos + step * dir;
                }
                return positions;
            },
            getMajorTickPositions: function () {
                return this.getTickPositions(this.options.majorUnit);
            },
            getMinorTickPositions: function () {
                return this.getTickPositions(this.options.minorUnit);
            },
            getSlot: function (a, b, limit) {
                if (limit === void 0) {
                    limit = false;
                }
                var options = this.options;
                var vertical = options.vertical;
                var reverse = options.reverse;
                var valueAxis = vertical ? Y : X;
                var lineBox = this.lineBox();
                var lineStart = lineBox[valueAxis + (reverse ? 2 : 1)];
                var lineSize = vertical ? lineBox.height() : lineBox.width();
                var dir = reverse ? -1 : 1;
                var step = dir * (lineSize / (options.max - options.min));
                var slotBox = new Box(lineBox.x1, lineBox.y1, lineBox.x1, lineBox.y1);
                var start = a;
                var end = b;
                if (!defined(start)) {
                    start = end || 0;
                }
                if (!defined(end)) {
                    end = start || 0;
                }
                if (limit) {
                    start = Math.max(Math.min(start, options.max), options.min);
                    end = Math.max(Math.min(end, options.max), options.min);
                }
                var p1, p2;
                if (vertical) {
                    p1 = options.max - Math.max(start, end);
                    p2 = options.max - Math.min(start, end);
                } else {
                    p1 = Math.min(start, end) - options.min;
                    p2 = Math.max(start, end) - options.min;
                }
                slotBox[valueAxis + 1] = limitCoordinate(lineStart + step * (reverse ? p2 : p1));
                slotBox[valueAxis + 2] = limitCoordinate(lineStart + step * (reverse ? p1 : p2));
                return slotBox;
            },
            getValue: function (point) {
                var options = this.options;
                var vertical = options.vertical;
                var reverse = options.reverse;
                var max = Number(options.max);
                var min = Number(options.min);
                var valueAxis = vertical ? Y : X;
                var lineBox = this.lineBox();
                var lineStart = lineBox[valueAxis + (reverse ? 2 : 1)];
                var lineSize = vertical ? lineBox.height() : lineBox.width();
                var dir = reverse ? -1 : 1;
                var offset = dir * (point[valueAxis] - lineStart);
                var step = (max - min) / lineSize;
                var valueOffset = offset * step;
                if (offset < 0 || offset > lineSize) {
                    return null;
                }
                var value = vertical ? max - valueOffset : min + valueOffset;
                return round(value, DEFAULT_PRECISION);
            },
            translateRange: function (delta) {
                var options = this.options;
                var vertical = options.vertical;
                var reverse = options.reverse;
                var max = options.max;
                var min = options.min;
                var lineBox = this.lineBox();
                var size = vertical ? lineBox.height() : lineBox.width();
                var range = max - min;
                var scale = size / range;
                var offset = round(delta / scale, DEFAULT_PRECISION);
                if ((vertical || reverse) && !(vertical && reverse)) {
                    offset = -offset;
                }
                return {
                    min: min + offset,
                    max: max + offset,
                    offset: offset
                };
            },
            scaleRange: function (delta) {
                var options = this.options;
                var offset = -delta * options.majorUnit;
                return {
                    min: options.min - offset,
                    max: options.max + offset
                };
            },
            labelsCount: function () {
                return this.getDivisions(this.options.majorUnit);
            },
            createAxisLabel: function (index, labelOptions) {
                var options = this.options;
                var value = round(options.min + index * options.majorUnit, DEFAULT_PRECISION);
                var text = this.axisLabelText(value, null, labelOptions);
                return new AxisLabel(value, text, index, null, labelOptions);
            },
            shouldRenderNote: function (value) {
                var range = this.range();
                return range.min <= value && value <= range.max;
            },
            pan: function (delta) {
                var range = this.translateRange(delta);
                return this.limitRange(range.min, range.max, this.totalMin, this.totalMax, range.offset);
            },
            pointsRange: function (start, end) {
                var startValue = this.getValue(start);
                var endValue = this.getValue(end);
                var min = Math.min(startValue, endValue);
                var max = Math.max(startValue, endValue);
                if (this.isValidRange(min, max)) {
                    return {
                        min: min,
                        max: max
                    };
                }
            },
            zoomRange: function (delta) {
                var ref = this;
                var totalMin = ref.totalMin;
                var totalMax = ref.totalMax;
                var newRange = this.scaleRange(delta);
                var min = limitValue(newRange.min, totalMin, totalMax);
                var max = limitValue(newRange.max, totalMin, totalMax);
                if (this.isValidRange(min, max)) {
                    return {
                        min: min,
                        max: max
                    };
                }
            },
            isValidRange: function (min, max) {
                return max - min > MIN_VALUE_RANGE;
            }
        });
        function autoAxisOptions(seriesMin, seriesMax, options) {
            var narrowRange = options.narrowRange;
            var autoMin = autoAxisMin(seriesMin, seriesMax, narrowRange);
            var autoMax = autoAxisMax(seriesMin, seriesMax, narrowRange);
            var majorUnit = autoMajorUnit(autoMin, autoMax);
            var autoOptions = { majorUnit: majorUnit };
            if (options.roundToMajorUnit !== false) {
                if (autoMin < 0 && remainderClose(autoMin, majorUnit, 1 / 3)) {
                    autoMin -= majorUnit;
                }
                if (autoMax > 0 && remainderClose(autoMax, majorUnit, 1 / 3)) {
                    autoMax += majorUnit;
                }
            }
            autoOptions.min = floor(autoMin, majorUnit);
            autoOptions.max = ceil(autoMax, majorUnit);
            return autoOptions;
        }
        function totalAxisOptions(autoOptions, options) {
            return {
                min: defined(options.min) ? Math.min(autoOptions.min, options.min) : autoOptions.min,
                max: defined(options.max) ? Math.max(autoOptions.max, options.max) : autoOptions.max,
                majorUnit: autoOptions.majorUnit
            };
        }
        function clearNullValues(options, fields) {
            for (var idx = 0; idx < fields.length; idx++) {
                var field = fields[idx];
                if (options[field] === null) {
                    options[field] = undefined;
                }
            }
        }
        function axisOptions(autoOptions, userOptions) {
            var options = userOptions;
            var userSetMin, userSetMax;
            if (userOptions) {
                clearNullValues(userOptions, [
                    'min',
                    'max'
                ]);
                userSetMin = defined(userOptions.min);
                userSetMax = defined(userOptions.max);
                var userSetLimits = userSetMin || userSetMax;
                if (userSetLimits) {
                    if (userOptions.min === userOptions.max) {
                        if (userOptions.min > 0) {
                            userOptions.min = 0;
                        } else {
                            userOptions.max = 1;
                        }
                    }
                }
                if (userOptions.majorUnit) {
                    autoOptions.min = floor(autoOptions.min, userOptions.majorUnit);
                    autoOptions.max = ceil(autoOptions.max, userOptions.majorUnit);
                } else if (userSetLimits) {
                    options = deepExtend(autoOptions, userOptions);
                    autoOptions.majorUnit = autoMajorUnit(options.min, options.max);
                }
            }
            autoOptions.minorUnit = (options.majorUnit || autoOptions.majorUnit) / 5;
            var result = deepExtend(autoOptions, options);
            if (result.min >= result.max) {
                if (userSetMin && !userSetMax) {
                    result.max = result.min + result.majorUnit;
                } else if (!userSetMin && userSetMax) {
                    result.min = result.max - result.majorUnit;
                }
            }
            return result;
        }
        function remainderClose(value, divisor, ratio) {
            var remainder = round(Math.abs(value % divisor), DEFAULT_PRECISION);
            var threshold = divisor * (1 - ratio);
            return remainder === 0 || remainder > threshold;
        }
        setDefaultOptions(NumericAxis, {
            type: 'numeric',
            min: 0,
            max: 1,
            vertical: true,
            majorGridLines: {
                visible: true,
                width: 1,
                color: BLACK
            },
            labels: { format: '#.####################' },
            zIndex: 1
        });
        var DateValueAxis = Axis.extend({
            init: function (seriesMin, seriesMax, axisOptions, chartService) {
                var min = toDate(seriesMin);
                var max = toDate(seriesMax);
                var intlService = chartService.intl;
                var options = axisOptions || {};
                options = deepExtend(options || {}, {
                    min: parseDate(intlService, options.min),
                    max: parseDate(intlService, options.max),
                    axisCrossingValue: parseDates(intlService, options.axisCrossingValues || options.axisCrossingValue)
                });
                options = applyDefaults(min, max, options);
                Axis.fn.init.call(this, options, chartService);
                this.intlService = intlService;
                this.seriesMin = min;
                this.seriesMax = max;
                var weekStartDay = options.weekStartDay || 0;
                this.totalMin = toTime(floorDate(toTime(min) - 1, options.baseUnit, weekStartDay));
                this.totalMax = toTime(ceilDate(toTime(max) + 1, options.baseUnit, weekStartDay));
            },
            clone: function () {
                return new DateValueAxis(this.seriesMin, this.seriesMax, $.extend({}, this.options), this.chartService);
            },
            range: function () {
                var options = this.options;
                return {
                    min: options.min,
                    max: options.max
                };
            },
            getDivisions: function (stepValue) {
                var options = this.options;
                return Math.floor(duration(options.min, options.max, options.baseUnit) / stepValue + 1);
            },
            getTickPositions: function (step) {
                var options = this.options;
                var vertical = options.vertical;
                var lineBox = this.lineBox();
                var dir = (vertical ? -1 : 1) * (options.reverse ? -1 : 1);
                var startEdge = dir === 1 ? 1 : 2;
                var start = lineBox[(vertical ? Y : X) + startEdge];
                var divisions = this.getDivisions(step);
                var timeRange = dateDiff(options.max, options.min);
                var lineSize = vertical ? lineBox.height() : lineBox.width();
                var scale = lineSize / timeRange;
                var weekStartDay = options.weekStartDay || 0;
                var positions = [start];
                for (var i = 1; i < divisions; i++) {
                    var date = addDuration(options.min, i * step, options.baseUnit, weekStartDay);
                    var pos = start + dateDiff(date, options.min) * scale * dir;
                    positions.push(round(pos, COORD_PRECISION));
                }
                return positions;
            },
            getMajorTickPositions: function () {
                return this.getTickPositions(this.options.majorUnit);
            },
            getMinorTickPositions: function () {
                return this.getTickPositions(this.options.minorUnit);
            },
            getSlot: function (a, b, limit) {
                return NumericAxis.prototype.getSlot.call(this, parseDate(this.intlService, a), parseDate(this.intlService, b), limit);
            },
            getValue: function (point) {
                var value = NumericAxis.prototype.getValue.call(this, point);
                return value !== null ? toDate(value) : null;
            },
            labelsCount: function () {
                return this.getDivisions(this.options.majorUnit);
            },
            createAxisLabel: function (index, labelOptions) {
                var options = this.options;
                var offset = index * options.majorUnit;
                var weekStartDay = options.weekStartDay || 0;
                var date = options.min;
                if (offset > 0) {
                    date = addDuration(date, offset, options.baseUnit, weekStartDay);
                }
                var unitFormat = labelOptions.dateFormats[options.baseUnit];
                labelOptions.format = labelOptions.format || unitFormat;
                var text = this.axisLabelText(date, null, labelOptions);
                return new AxisLabel(date, text, index, null, labelOptions);
            },
            translateRange: function (delta, exact) {
                var options = this.options;
                var baseUnit = options.baseUnit;
                var weekStartDay = options.weekStartDay || 0;
                var lineBox = this.lineBox();
                var size = options.vertical ? lineBox.height() : lineBox.width();
                var range = this.range();
                var scale = size / dateDiff(range.max, range.min);
                var offset = round(delta / scale, DEFAULT_PRECISION) * (options.reverse ? -1 : 1);
                var from = addTicks(options.min, offset);
                var to = addTicks(options.max, offset);
                if (!exact) {
                    from = addDuration(from, 0, baseUnit, weekStartDay);
                    to = addDuration(to, 0, baseUnit, weekStartDay);
                }
                return {
                    min: from,
                    max: to,
                    offset: offset
                };
            },
            scaleRange: function (delta) {
                var ref = this.options;
                var from = ref.min;
                var to = ref.max;
                var rounds = Math.abs(delta);
                while (rounds--) {
                    var range = dateDiff(from, to);
                    var step = Math.round(range * 0.1);
                    if (delta < 0) {
                        from = addTicks(from, step);
                        to = addTicks(to, -step);
                    } else {
                        from = addTicks(from, -step);
                        to = addTicks(to, step);
                    }
                }
                return {
                    min: from,
                    max: to
                };
            },
            shouldRenderNote: function (value) {
                var range = this.range();
                return dateComparer(value, range.min) >= 0 && dateComparer(value, range.max) <= 0;
            },
            pan: function (delta) {
                var range = this.translateRange(delta, true);
                var limittedRange = this.limitRange(toTime(range.min), toTime(range.max), this.totalMin, this.totalMax, range.offset);
                if (limittedRange) {
                    return {
                        min: toDate(limittedRange.min),
                        max: toDate(limittedRange.max)
                    };
                }
            },
            pointsRange: function (start, end) {
                var startValue = this.getValue(start);
                var endValue = this.getValue(end);
                var min = Math.min(startValue, endValue);
                var max = Math.max(startValue, endValue);
                return {
                    min: toDate(min),
                    max: toDate(max)
                };
            },
            zoomRange: function (delta) {
                var range = this.scaleRange(delta);
                var min = toDate(limitValue(toTime(range.min), this.totalMin, this.totalMax));
                var max = toDate(limitValue(toTime(range.max), this.totalMin, this.totalMax));
                return {
                    min: min,
                    max: max
                };
            }
        });
        function timeUnits(delta) {
            var unit = HOURS;
            if (delta >= TIME_PER_YEAR) {
                unit = YEARS;
            } else if (delta >= TIME_PER_MONTH) {
                unit = MONTHS;
            } else if (delta >= TIME_PER_WEEK) {
                unit = WEEKS;
            } else if (delta >= TIME_PER_DAY) {
                unit = DAYS;
            }
            return unit;
        }
        function applyDefaults(seriesMin, seriesMax, options) {
            var min = options.min || seriesMin;
            var max = options.max || seriesMax;
            var baseUnit = options.baseUnit || (max && min ? timeUnits(absoluteDateDiff(max, min)) : HOURS);
            var baseUnitTime = TIME_PER_UNIT[baseUnit];
            var weekStartDay = options.weekStartDay || 0;
            var autoMin = floorDate(toTime(min) - 1, baseUnit, weekStartDay) || toDate(max);
            var autoMax = ceilDate(toTime(max) + 1, baseUnit, weekStartDay);
            var userMajorUnit = options.majorUnit ? options.majorUnit : undefined;
            var majorUnit = userMajorUnit || ceil(autoMajorUnit(autoMin.getTime(), autoMax.getTime()), baseUnitTime) / baseUnitTime;
            var actualUnits = duration(autoMin, autoMax, baseUnit);
            var totalUnits = ceil(actualUnits, majorUnit);
            var unitsToAdd = totalUnits - actualUnits;
            var head = Math.floor(unitsToAdd / 2);
            var tail = unitsToAdd - head;
            if (!options.baseUnit) {
                delete options.baseUnit;
            }
            options.baseUnit = options.baseUnit || baseUnit;
            options.min = options.min || addDuration(autoMin, -head, baseUnit, weekStartDay);
            options.max = options.max || addDuration(autoMax, tail, baseUnit, weekStartDay);
            options.minorUnit = options.minorUnit || majorUnit / 5;
            options.majorUnit = majorUnit;
            return options;
        }
        setDefaultOptions(DateValueAxis, {
            type: DATE,
            majorGridLines: {
                visible: true,
                width: 1,
                color: BLACK
            },
            labels: { dateFormats: DateLabelFormats }
        });
        var DEFAULT_MAJOR_UNIT = 10;
        var LogarithmicAxis = Axis.extend({
            init: function (seriesMin, seriesMax, options, chartService) {
                var axisOptions = deepExtend({
                    majorUnit: DEFAULT_MAJOR_UNIT,
                    min: seriesMin,
                    max: seriesMax
                }, options);
                var base = axisOptions.majorUnit;
                var autoMax = autoAxisMax$1(seriesMax, base);
                var autoMin = autoAxisMin$1(seriesMin, seriesMax, axisOptions);
                var range = initRange(autoMin, autoMax, axisOptions, options);
                axisOptions.max = range.max;
                axisOptions.min = range.min;
                axisOptions.minorUnit = options.minorUnit || round(base - 1, DEFAULT_PRECISION);
                Axis.fn.init.call(this, axisOptions, chartService);
                this.totalMin = defined(options.min) ? Math.min(autoMin, options.min) : autoMin;
                this.totalMax = defined(options.max) ? Math.max(autoMax, options.max) : autoMax;
                this.logMin = round(log(range.min, base), DEFAULT_PRECISION);
                this.logMax = round(log(range.max, base), DEFAULT_PRECISION);
                this.seriesMin = seriesMin;
                this.seriesMax = seriesMax;
                this.createLabels();
            },
            clone: function () {
                return new LogarithmicAxis(this.seriesMin, this.seriesMax, $.extend({}, this.options), this.chartService);
            },
            startValue: function () {
                return this.options.min;
            },
            getSlot: function (a, b, limit) {
                var ref = this;
                var options = ref.options;
                var logMin = ref.logMin;
                var logMax = ref.logMax;
                var reverse = options.reverse;
                var vertical = options.vertical;
                var base = options.majorUnit;
                var valueAxis = vertical ? Y : X;
                var lineBox = this.lineBox();
                var lineStart = lineBox[valueAxis + (reverse ? 2 : 1)];
                var lineSize = vertical ? lineBox.height() : lineBox.width();
                var dir = reverse ? -1 : 1;
                var step = dir * (lineSize / (logMax - logMin));
                var slotBox = new Box(lineBox.x1, lineBox.y1, lineBox.x1, lineBox.y1);
                var start = a;
                var end = b;
                if (!defined(start)) {
                    start = end || 1;
                }
                if (!defined(end)) {
                    end = start || 1;
                }
                if (start <= 0 || end <= 0) {
                    return null;
                }
                if (limit) {
                    start = Math.max(Math.min(start, options.max), options.min);
                    end = Math.max(Math.min(end, options.max), options.min);
                }
                start = log(start, base);
                end = log(end, base);
                var p1, p2;
                if (vertical) {
                    p1 = logMax - Math.max(start, end);
                    p2 = logMax - Math.min(start, end);
                } else {
                    p1 = Math.min(start, end) - logMin;
                    p2 = Math.max(start, end) - logMin;
                }
                slotBox[valueAxis + 1] = limitCoordinate(lineStart + step * (reverse ? p2 : p1));
                slotBox[valueAxis + 2] = limitCoordinate(lineStart + step * (reverse ? p1 : p2));
                return slotBox;
            },
            getValue: function (point) {
                var ref = this;
                var options = ref.options;
                var logMin = ref.logMin;
                var logMax = ref.logMax;
                var reverse = options.reverse;
                var vertical = options.vertical;
                var base = options.majorUnit;
                var lineBox = this.lineBox();
                var dir = vertical === reverse ? 1 : -1;
                var startEdge = dir === 1 ? 1 : 2;
                var lineSize = vertical ? lineBox.height() : lineBox.width();
                var step = (logMax - logMin) / lineSize;
                var valueAxis = vertical ? Y : X;
                var lineStart = lineBox[valueAxis + startEdge];
                var offset = dir * (point[valueAxis] - lineStart);
                var valueOffset = offset * step;
                if (offset < 0 || offset > lineSize) {
                    return null;
                }
                var value = logMin + valueOffset;
                return round(Math.pow(base, value), DEFAULT_PRECISION);
            },
            range: function () {
                var options = this.options;
                return {
                    min: options.min,
                    max: options.max
                };
            },
            scaleRange: function (delta) {
                var base = this.options.majorUnit;
                var offset = -delta;
                return {
                    min: Math.pow(base, this.logMin - offset),
                    max: Math.pow(base, this.logMax + offset)
                };
            },
            translateRange: function (delta) {
                var ref = this;
                var options = ref.options;
                var logMin = ref.logMin;
                var logMax = ref.logMax;
                var reverse = options.reverse;
                var vertical = options.vertical;
                var base = options.majorUnit;
                var lineBox = this.lineBox();
                var size = vertical ? lineBox.height() : lineBox.width();
                var scale = size / (logMax - logMin);
                var offset = round(delta / scale, DEFAULT_PRECISION);
                if ((vertical || reverse) && !(vertical && reverse)) {
                    offset = -offset;
                }
                return {
                    min: Math.pow(base, logMin + offset),
                    max: Math.pow(base, logMax + offset),
                    offset: offset
                };
            },
            labelsCount: function () {
                var floorMax = Math.floor(this.logMax);
                var count = Math.floor(floorMax - this.logMin) + 1;
                return count;
            },
            getMajorTickPositions: function () {
                var ticks = [];
                this.traverseMajorTicksPositions(function (position) {
                    ticks.push(position);
                }, {
                    step: 1,
                    skip: 0
                });
                return ticks;
            },
            createTicks: function (lineGroup) {
                var options = this.options;
                var majorTicks = options.majorTicks;
                var minorTicks = options.minorTicks;
                var vertical = options.vertical;
                var mirror = options.labels.mirror;
                var lineBox = this.lineBox();
                var ticks = [];
                var tickLineOptions = { vertical: vertical };
                function render(tickPosition, tickOptions) {
                    tickLineOptions.tickX = mirror ? lineBox.x2 : lineBox.x2 - tickOptions.size;
                    tickLineOptions.tickY = mirror ? lineBox.y1 - tickOptions.size : lineBox.y1;
                    tickLineOptions.position = tickPosition;
                    lineGroup.append(createAxisTick(tickLineOptions, tickOptions));
                }
                if (majorTicks.visible) {
                    this.traverseMajorTicksPositions(render, majorTicks);
                }
                if (minorTicks.visible) {
                    this.traverseMinorTicksPositions(render, minorTicks);
                }
                return ticks;
            },
            createGridLines: function (altAxis) {
                var options = this.options;
                var minorGridLines = options.minorGridLines;
                var majorGridLines = options.majorGridLines;
                var vertical = options.vertical;
                var lineBox = altAxis.lineBox();
                var lineOptions = {
                    lineStart: lineBox[vertical ? 'x1' : 'y1'],
                    lineEnd: lineBox[vertical ? 'x2' : 'y2'],
                    vertical: vertical
                };
                var majorTicks = [];
                var container = this.gridLinesVisual();
                function render(tickPosition, gridLine) {
                    if (!inArray(tickPosition, majorTicks)) {
                        lineOptions.position = tickPosition;
                        container.append(createAxisGridLine(lineOptions, gridLine));
                        majorTicks.push(tickPosition);
                    }
                }
                if (majorGridLines.visible) {
                    this.traverseMajorTicksPositions(render, majorGridLines);
                }
                if (minorGridLines.visible) {
                    this.traverseMinorTicksPositions(render, minorGridLines);
                }
                return container.children;
            },
            traverseMajorTicksPositions: function (callback, tickOptions) {
                var ref = this._lineOptions();
                var lineStart = ref.lineStart;
                var step = ref.step;
                var ref$1 = this;
                var logMin = ref$1.logMin;
                var logMax = ref$1.logMax;
                for (var power = Math.ceil(logMin) + tickOptions.skip; power <= logMax; power += tickOptions.step) {
                    var position = round(lineStart + step * (power - logMin), DEFAULT_PRECISION);
                    callback(position, tickOptions);
                }
            },
            traverseMinorTicksPositions: function (callback, tickOptions) {
                var this$1 = this;
                var ref = this.options;
                var min = ref.min;
                var max = ref.max;
                var minorUnit = ref.minorUnit;
                var base = ref.majorUnit;
                var ref$1 = this._lineOptions();
                var lineStart = ref$1.lineStart;
                var step = ref$1.step;
                var ref$2 = this;
                var logMin = ref$2.logMin;
                var logMax = ref$2.logMax;
                var start = Math.floor(logMin);
                for (var power = start; power < logMax; power++) {
                    var minorOptions = this$1._minorIntervalOptions(power);
                    for (var idx = tickOptions.skip; idx < minorUnit; idx += tickOptions.step) {
                        var value = minorOptions.value + idx * minorOptions.minorStep;
                        if (value > max) {
                            break;
                        }
                        if (value >= min) {
                            var position = round(lineStart + step * (log(value, base) - logMin), DEFAULT_PRECISION);
                            callback(position, tickOptions);
                        }
                    }
                }
            },
            createAxisLabel: function (index, labelOptions) {
                var power = Math.ceil(this.logMin + index);
                var value = Math.pow(this.options.majorUnit, power);
                var text = this.axisLabelText(value, null, labelOptions);
                return new AxisLabel(value, text, index, null, labelOptions);
            },
            shouldRenderNote: function (value) {
                var range = this.range();
                return range.min <= value && value <= range.max;
            },
            pan: function (delta) {
                var range = this.translateRange(delta);
                return this.limitRange(range.min, range.max, this.totalMin, this.totalMax, range.offset);
            },
            pointsRange: function (start, end) {
                var startValue = this.getValue(start);
                var endValue = this.getValue(end);
                var min = Math.min(startValue, endValue);
                var max = Math.max(startValue, endValue);
                return {
                    min: min,
                    max: max
                };
            },
            zoomRange: function (delta) {
                var ref = this;
                var options = ref.options;
                var totalMin = ref.totalMin;
                var totalMax = ref.totalMax;
                var newRange = this.scaleRange(delta);
                var min = limitValue(newRange.min, totalMin, totalMax);
                var max = limitValue(newRange.max, totalMin, totalMax);
                var base = options.majorUnit;
                var acceptOptionsRange = max > min && options.min && options.max && round(log(options.max, base) - log(options.min, base), DEFAULT_PRECISION) < 1;
                var acceptNewRange = !(options.min === totalMin && options.max === totalMax) && round(log(max, base) - log(min, base), DEFAULT_PRECISION) >= 1;
                if (acceptOptionsRange || acceptNewRange) {
                    return {
                        min: min,
                        max: max
                    };
                }
            },
            _minorIntervalOptions: function (power) {
                var ref = this.options;
                var minorUnit = ref.minorUnit;
                var base = ref.majorUnit;
                var value = Math.pow(base, power);
                var nextValue = Math.pow(base, power + 1);
                var difference = nextValue - value;
                var minorStep = difference / minorUnit;
                return {
                    value: value,
                    minorStep: minorStep
                };
            },
            _lineOptions: function () {
                var ref = this.options;
                var reverse = ref.reverse;
                var vertical = ref.vertical;
                var valueAxis = vertical ? Y : X;
                var lineBox = this.lineBox();
                var dir = vertical === reverse ? 1 : -1;
                var startEdge = dir === 1 ? 1 : 2;
                var lineSize = vertical ? lineBox.height() : lineBox.width();
                var step = dir * (lineSize / (this.logMax - this.logMin));
                var lineStart = lineBox[valueAxis + startEdge];
                return {
                    step: step,
                    lineStart: lineStart,
                    lineBox: lineBox
                };
            }
        });
        function initRange(autoMin, autoMax, axisOptions, options) {
            var min = axisOptions.min;
            var max = axisOptions.max;
            if (defined(axisOptions.axisCrossingValue) && axisOptions.axisCrossingValue <= 0) {
                throwNegativeValuesError();
            }
            if (!defined(options.max)) {
                max = autoMax;
            } else if (options.max <= 0) {
                throwNegativeValuesError();
            }
            if (!defined(options.min)) {
                min = autoMin;
            } else if (options.min <= 0) {
                throwNegativeValuesError();
            }
            return {
                min: min,
                max: max
            };
        }
        function autoAxisMin$1(min, max, options) {
            var base = options.majorUnit;
            var autoMin = min;
            if (min <= 0) {
                autoMin = max <= 1 ? Math.pow(base, -2) : 1;
            } else if (!options.narrowRange) {
                autoMin = Math.pow(base, Math.floor(log(min, base)));
            }
            return autoMin;
        }
        function autoAxisMax$1(max, base) {
            var logMaxRemainder = round(log(max, base), DEFAULT_PRECISION) % 1;
            var autoMax;
            if (max <= 0) {
                autoMax = base;
            } else if (logMaxRemainder !== 0 && (logMaxRemainder < 0.3 || logMaxRemainder > 0.9)) {
                autoMax = Math.pow(base, log(max, base) + 0.2);
            } else {
                autoMax = Math.pow(base, Math.ceil(log(max, base)));
            }
            return autoMax;
        }
        function throwNegativeValuesError() {
            throw new Error('Non positive values cannot be used for a logarithmic axis');
        }
        function log(y, x) {
            return Math.log(y) / Math.log(x);
        }
        setDefaultOptions(LogarithmicAxis, {
            type: 'log',
            majorUnit: DEFAULT_MAJOR_UNIT,
            minorUnit: 1,
            axisCrossingValue: 1,
            vertical: true,
            majorGridLines: {
                visible: true,
                width: 1,
                color: BLACK
            },
            zIndex: 1,
            _deferLabels: true
        });
        var GridLinesMixin = {
            createGridLines: function (altAxis) {
                var options = this.options;
                var radius = Math.abs(this.box.center().y - altAxis.lineBox().y1);
                var gridLines = [];
                var skipMajor = false;
                var majorAngles, minorAngles;
                if (options.majorGridLines.visible) {
                    majorAngles = this.majorGridLineAngles(altAxis);
                    skipMajor = true;
                    gridLines = this.renderMajorGridLines(majorAngles, radius, options.majorGridLines);
                }
                if (options.minorGridLines.visible) {
                    minorAngles = this.minorGridLineAngles(altAxis, skipMajor);
                    append(gridLines, this.renderMinorGridLines(minorAngles, radius, options.minorGridLines, altAxis, skipMajor));
                }
                return gridLines;
            },
            renderMajorGridLines: function (angles, radius, options) {
                return this.renderGridLines(angles, radius, options);
            },
            renderMinorGridLines: function (angles, radius, options, altAxis, skipMajor) {
                var radiusCallback = this.radiusCallback && this.radiusCallback(radius, altAxis, skipMajor);
                return this.renderGridLines(angles, radius, options, radiusCallback);
            },
            renderGridLines: function (angles, radius, options, radiusCallback) {
                var style = {
                    stroke: {
                        width: options.width,
                        color: options.color,
                        dashType: options.dashType
                    }
                };
                var center = this.box.center();
                var circle = new Circle([
                    center.x,
                    center.y
                ], radius);
                var container = this.gridLinesVisual();
                for (var i = 0; i < angles.length; i++) {
                    var line = new Path(style);
                    if (radiusCallback) {
                        circle.radius = radiusCallback(angles[i]);
                    }
                    line.moveTo(circle.center).lineTo(circle.pointAt(angles[i] + 180));
                    container.append(line);
                }
                return container.children;
            },
            gridLineAngles: function (altAxis, size, skip, step, skipAngles) {
                var this$1 = this;
                var divs = this.intervals(size, skip, step, skipAngles);
                var options = altAxis.options;
                var altAxisVisible = options.visible && (options.line || {}).visible !== false;
                return map(divs, function (d) {
                    var alpha = this$1.intervalAngle(d);
                    if (!altAxisVisible || alpha !== 90) {
                        return alpha;
                    }
                });
            }
        };
        var RadarCategoryAxis = CategoryAxis.extend({
            range: function () {
                return {
                    min: 0,
                    max: this.options.categories.length
                };
            },
            reflow: function (box) {
                this.box = box;
                this.reflowLabels();
            },
            lineBox: function () {
                return this.box;
            },
            reflowLabels: function () {
                var this$1 = this;
                var ref = this;
                var labels = ref.labels;
                var labelOptions = ref.options.labels;
                var skip = labelOptions.skip || 0;
                var step = labelOptions.step || 1;
                var measureBox = new Box();
                for (var i = 0; i < labels.length; i++) {
                    labels[i].reflow(measureBox);
                    var labelBox = labels[i].box;
                    labels[i].reflow(this$1.getSlot(skip + i * step).adjacentBox(0, labelBox.width(), labelBox.height()));
                }
            },
            intervals: function (size, skipOption, stepOption, skipAngles) {
                if (skipAngles === void 0) {
                    skipAngles = false;
                }
                var options = this.options;
                var categories = options.categories.length;
                var divCount = categories / size || 1;
                var divAngle = 360 / divCount;
                var skip = skipOption || 0;
                var step = stepOption || 1;
                var divs = [];
                var angle = 0;
                for (var i = skip; i < divCount; i += step) {
                    if (options.reverse) {
                        angle = 360 - i * divAngle;
                    } else {
                        angle = i * divAngle;
                    }
                    angle = round(angle, COORD_PRECISION) % 360;
                    if (!(skipAngles && inArray(angle, skipAngles))) {
                        divs.push(angle);
                    }
                }
                return divs;
            },
            majorIntervals: function () {
                return this.intervals(1);
            },
            minorIntervals: function () {
                return this.intervals(0.5);
            },
            intervalAngle: function (interval) {
                return (360 + interval + this.options.startAngle) % 360;
            },
            majorAngles: function () {
                var this$1 = this;
                return map(this.majorIntervals(), function (interval) {
                    return this$1.intervalAngle(interval);
                });
            },
            createLine: function () {
                return [];
            },
            majorGridLineAngles: function (altAxis) {
                var majorGridLines = this.options.majorGridLines;
                return this.gridLineAngles(altAxis, 1, majorGridLines.skip, majorGridLines.step);
            },
            minorGridLineAngles: function (altAxis, skipMajor) {
                var ref = this.options;
                var minorGridLines = ref.minorGridLines;
                var majorGridLines = ref.majorGridLines;
                var majorGridLineAngles = skipMajor ? this.intervals(1, majorGridLines.skip, majorGridLines.step) : null;
                return this.gridLineAngles(altAxis, 0.5, minorGridLines.skip, minorGridLines.step, majorGridLineAngles);
            },
            radiusCallback: function (radius, altAxis, skipMajor) {
                if (altAxis.options.type !== ARC) {
                    var minorAngle = rad(360 / (this.options.categories.length * 2));
                    var minorRadius = Math.cos(minorAngle) * radius;
                    var majorAngles = this.majorAngles();
                    var radiusCallback = function (angle) {
                        if (!skipMajor && inArray(angle, majorAngles)) {
                            return radius;
                        }
                        return minorRadius;
                    };
                    return radiusCallback;
                }
            },
            createPlotBands: function () {
                var this$1 = this;
                var plotBands = this.options.plotBands || [];
                var group = this._plotbandGroup = new Group({ zIndex: -1 });
                for (var i = 0; i < plotBands.length; i++) {
                    var band = plotBands[i];
                    var slot = this$1.plotBandSlot(band);
                    var singleSlot = this$1.getSlot(band.from);
                    var head = band.from - Math.floor(band.from);
                    slot.startAngle += head * singleSlot.angle;
                    var tail = Math.ceil(band.to) - band.to;
                    slot.angle -= (tail + head) * singleSlot.angle;
                    var ring = ShapeBuilder.current.createRing(slot, {
                        fill: {
                            color: band.color,
                            opacity: band.opacity
                        },
                        stroke: { opacity: band.opacity }
                    });
                    group.append(ring);
                }
                this.appendVisual(group);
            },
            plotBandSlot: function (band) {
                return this.getSlot(band.from, band.to - 1);
            },
            getSlot: function (from, to) {
                var options = this.options;
                var justified = options.justified;
                var box = this.box;
                var divs = this.majorAngles();
                var totalDivs = divs.length;
                var slotAngle = 360 / totalDivs;
                var fromValue = from;
                if (options.reverse && !justified) {
                    fromValue = (fromValue + 1) % totalDivs;
                }
                fromValue = limitValue(Math.floor(fromValue), 0, totalDivs - 1);
                var slotStart = divs[fromValue];
                if (justified) {
                    slotStart = slotStart - slotAngle / 2;
                    if (slotStart < 0) {
                        slotStart += 360;
                    }
                }
                var toValue = limitValue(Math.ceil(to || fromValue), fromValue, totalDivs - 1);
                var slots = toValue - fromValue + 1;
                var angle = slotAngle * slots;
                return new Ring(box.center(), 0, box.height() / 2, slotStart, angle);
            },
            slot: function (from, to) {
                var slot = this.getSlot(from, to);
                var startAngle = slot.startAngle + 180;
                var endAngle = startAngle + slot.angle;
                return new geometry.Arc([
                    slot.center.x,
                    slot.center.y
                ], {
                    startAngle: startAngle,
                    endAngle: endAngle,
                    radiusX: slot.radius,
                    radiusY: slot.radius
                });
            },
            pointCategoryIndex: function (point) {
                var this$1 = this;
                var length = this.options.categories.length;
                var index = null;
                for (var i = 0; i < length; i++) {
                    var slot = this$1.getSlot(i);
                    if (slot.containsPoint(point)) {
                        index = i;
                        break;
                    }
                }
                return index;
            }
        });
        setDefaultOptions(RadarCategoryAxis, {
            startAngle: 90,
            labels: { margin: getSpacing(10) },
            majorGridLines: { visible: true },
            justified: true
        });
        deepExtend(RadarCategoryAxis.prototype, GridLinesMixin);
        var PolarAxis = Axis.extend({
            init: function (options, chartService) {
                Axis.fn.init.call(this, options, chartService);
                var instanceOptions = this.options;
                instanceOptions.minorUnit = instanceOptions.minorUnit || instanceOptions.majorUnit / 2;
            },
            getDivisions: function (stepValue) {
                return NumericAxis.prototype.getDivisions.call(this, stepValue) - 1;
            },
            reflow: function (box) {
                this.box = box;
                this.reflowLabels();
            },
            reflowLabels: function () {
                var this$1 = this;
                var ref = this;
                var options = ref.options;
                var labels = ref.labels;
                var labelOptions = ref.options.labels;
                var skip = labelOptions.skip || 0;
                var step = labelOptions.step || 1;
                var measureBox = new Box();
                var divs = this.intervals(options.majorUnit, skip, step);
                for (var i = 0; i < labels.length; i++) {
                    labels[i].reflow(measureBox);
                    var labelBox = labels[i].box;
                    labels[i].reflow(this$1.getSlot(divs[i]).adjacentBox(0, labelBox.width(), labelBox.height()));
                }
            },
            lineBox: function () {
                return this.box;
            },
            intervals: function (size, skipOption, stepOption, skipAngles) {
                if (skipAngles === void 0) {
                    skipAngles = false;
                }
                var min = this.options.min;
                var divisions = this.getDivisions(size);
                var divs = [];
                var skip = skipOption || 0;
                var step = stepOption || 1;
                for (var i = skip; i < divisions; i += step) {
                    var current = (360 + min + i * size) % 360;
                    if (!(skipAngles && inArray(current, skipAngles))) {
                        divs.push(current);
                    }
                }
                return divs;
            },
            majorIntervals: function () {
                return this.intervals(this.options.majorUnit);
            },
            minorIntervals: function () {
                return this.intervals(this.options.minorUnit);
            },
            intervalAngle: function (i) {
                return (540 - i - this.options.startAngle) % 360;
            },
            createLine: function () {
                return [];
            },
            majorGridLineAngles: function (altAxis) {
                var majorGridLines = this.options.majorGridLines;
                return this.gridLineAngles(altAxis, this.options.majorUnit, majorGridLines.skip, majorGridLines.step);
            },
            minorGridLineAngles: function (altAxis, skipMajor) {
                var options = this.options;
                var minorGridLines = options.minorGridLines;
                var majorGridLines = options.majorGridLines;
                var majorGridLineAngles = skipMajor ? this.intervals(options.majorUnit, majorGridLines.skip, majorGridLines.step) : null;
                return this.gridLineAngles(altAxis, options.minorUnit, minorGridLines.skip, minorGridLines.step, majorGridLineAngles);
            },
            plotBandSlot: function (band) {
                return this.getSlot(band.from, band.to);
            },
            getSlot: function (a, b) {
                var ref = this;
                var options = ref.options;
                var box = ref.box;
                var startAngle = options.startAngle;
                var start = limitValue(a, options.min, options.max);
                var end = limitValue(b || start, start, options.max);
                if (options.reverse) {
                    start *= -1;
                    end *= -1;
                }
                start = (540 - start - startAngle) % 360;
                end = (540 - end - startAngle) % 360;
                if (end < start) {
                    var tmp = start;
                    start = end;
                    end = tmp;
                }
                return new Ring(box.center(), 0, box.height() / 2, start, end - start);
            },
            slot: function (from, to) {
                if (to === void 0) {
                    to = from;
                }
                var options = this.options;
                var start = 360 - options.startAngle;
                var slot = this.getSlot(from, to);
                var min = Math.min(from, to);
                var max = Math.max(from, to);
                var startAngle, endAngle;
                if (options.reverse) {
                    startAngle = min;
                    endAngle = max;
                } else {
                    startAngle = 360 - max;
                    endAngle = 360 - min;
                }
                startAngle = (startAngle + start) % 360;
                endAngle = (endAngle + start) % 360;
                return new geometry.Arc([
                    slot.center.x,
                    slot.center.y
                ], {
                    startAngle: startAngle,
                    endAngle: endAngle,
                    radiusX: slot.radius,
                    radiusY: slot.radius
                });
            },
            getValue: function (point) {
                var options = this.options;
                var center = this.box.center();
                var dx = point.x - center.x;
                var dy = point.y - center.y;
                var theta = Math.round(deg(Math.atan2(dy, dx)));
                var start = options.startAngle;
                if (!options.reverse) {
                    theta *= -1;
                    start *= -1;
                }
                return (theta + start + 360) % 360;
            },
            valueRange: function () {
                return {
                    min: 0,
                    max: Math.PI * 2
                };
            }
        });
        setDefaultOptions(PolarAxis, {
            type: 'polar',
            startAngle: 0,
            reverse: false,
            majorUnit: 60,
            min: 0,
            max: 360,
            labels: { margin: getSpacing(10) },
            majorGridLines: {
                color: BLACK,
                visible: true,
                width: 1
            },
            minorGridLines: { color: '#aaa' }
        });
        deepExtend(PolarAxis.prototype, GridLinesMixin, {
            createPlotBands: RadarCategoryAxis.prototype.createPlotBands,
            majorAngles: RadarCategoryAxis.prototype.majorAngles,
            range: NumericAxis.prototype.range,
            labelsCount: NumericAxis.prototype.labelsCount,
            createAxisLabel: NumericAxis.prototype.createAxisLabel
        });
        var RadarNumericAxisMixin = {
            options: { majorGridLines: { visible: true } },
            createPlotBands: function () {
                var this$1 = this;
                var ref = this.options;
                var type = ref.majorGridLines.type;
                var plotBands = ref.plotBands;
                if (plotBands === void 0) {
                    plotBands = [];
                }
                var altAxis = this.plotArea.polarAxis;
                var majorAngles = altAxis.majorAngles();
                var center = altAxis.box.center();
                var group = this._plotbandGroup = new Group({ zIndex: -1 });
                for (var i = 0; i < plotBands.length; i++) {
                    var band = plotBands[i];
                    var bandStyle = {
                        fill: {
                            color: band.color,
                            opacity: band.opacity
                        },
                        stroke: { opacity: band.opacity }
                    };
                    var slot = this$1.getSlot(band.from, band.to, true);
                    var ring = new Ring(center, center.y - slot.y2, center.y - slot.y1, 0, 360);
                    var shape = void 0;
                    if (type === ARC) {
                        shape = ShapeBuilder.current.createRing(ring, bandStyle);
                    } else {
                        shape = Path.fromPoints(this$1.plotBandPoints(ring, majorAngles), bandStyle).close();
                    }
                    group.append(shape);
                }
                this.appendVisual(group);
            },
            plotBandPoints: function (ring, angles) {
                var innerPoints = [];
                var outerPoints = [];
                var center = [
                    ring.center.x,
                    ring.center.y
                ];
                var innerCircle = new Circle(center, ring.innerRadius);
                var outerCircle = new Circle(center, ring.radius);
                for (var i = 0; i < angles.length; i++) {
                    innerPoints.push(innerCircle.pointAt(angles[i] + 180));
                    outerPoints.push(outerCircle.pointAt(angles[i] + 180));
                }
                innerPoints.reverse();
                innerPoints.push(innerPoints[0]);
                outerPoints.push(outerPoints[0]);
                return outerPoints.concat(innerPoints);
            },
            createGridLines: function (altAxis) {
                var options = this.options;
                var majorTicks = this.radarMajorGridLinePositions();
                var majorAngles = altAxis.majorAngles();
                var center = altAxis.box.center();
                var gridLines = [];
                if (options.majorGridLines.visible) {
                    gridLines = this.renderGridLines(center, majorTicks, majorAngles, options.majorGridLines);
                }
                if (options.minorGridLines.visible) {
                    var minorTicks = this.radarMinorGridLinePositions();
                    append(gridLines, this.renderGridLines(center, minorTicks, majorAngles, options.minorGridLines));
                }
                return gridLines;
            },
            renderGridLines: function (center, ticks, angles, options) {
                var style = {
                    stroke: {
                        width: options.width,
                        color: options.color,
                        dashType: options.dashType
                    }
                };
                var skip = options.skip;
                if (skip === void 0) {
                    skip = 0;
                }
                var step = options.step;
                if (step === void 0) {
                    step = 0;
                }
                var container = this.gridLinesVisual();
                for (var tickIx = skip; tickIx < ticks.length; tickIx += step) {
                    var tickRadius = center.y - ticks[tickIx];
                    if (tickRadius > 0) {
                        var circle = new Circle([
                            center.x,
                            center.y
                        ], tickRadius);
                        if (options.type === ARC) {
                            container.append(new drawing.Circle(circle, style));
                        } else {
                            var line = new Path(style);
                            for (var angleIx = 0; angleIx < angles.length; angleIx++) {
                                line.lineTo(circle.pointAt(angles[angleIx] + 180));
                            }
                            line.close();
                            container.append(line);
                        }
                    }
                }
                return container.children;
            },
            getValue: function (point) {
                var lineBox = this.lineBox();
                var altAxis = this.plotArea.polarAxis;
                var majorAngles = altAxis.majorAngles();
                var center = altAxis.box.center();
                var radius = point.distanceTo(center);
                var distance = radius;
                if (this.options.majorGridLines.type !== ARC && majorAngles.length > 1) {
                    var dx = point.x - center.x;
                    var dy = point.y - center.y;
                    var theta = (deg(Math.atan2(dy, dx)) + 540) % 360;
                    majorAngles.sort(function (a, b) {
                        return angularDistance(a, theta) - angularDistance(b, theta);
                    });
                    var midAngle = angularDistance(majorAngles[0], majorAngles[1]) / 2;
                    var alpha = angularDistance(theta, majorAngles[0]);
                    var gamma = 90 - midAngle;
                    var beta = 180 - alpha - gamma;
                    distance = radius * (Math.sin(rad(beta)) / Math.sin(rad(gamma)));
                }
                return this.axisType().prototype.getValue.call(this, new Point(lineBox.x1, lineBox.y2 - distance));
            }
        };
        function angularDistance(a, b) {
            return 180 - Math.abs(Math.abs(a - b) - 180);
        }
        var RadarNumericAxis = NumericAxis.extend({
            radarMajorGridLinePositions: function () {
                return this.getTickPositions(this.options.majorUnit);
            },
            radarMinorGridLinePositions: function () {
                var options = this.options;
                var minorSkipStep = 0;
                if (options.majorGridLines.visible) {
                    minorSkipStep = options.majorUnit;
                }
                return this.getTickPositions(options.minorUnit, minorSkipStep);
            },
            axisType: function () {
                return NumericAxis;
            }
        });
        deepExtend(RadarNumericAxis.prototype, RadarNumericAxisMixin);
        var RadarLogarithmicAxis = LogarithmicAxis.extend({
            radarMajorGridLinePositions: function () {
                var positions = [];
                this.traverseMajorTicksPositions(function (position) {
                    positions.push(position);
                }, this.options.majorGridLines);
                return positions;
            },
            radarMinorGridLinePositions: function () {
                var positions = [];
                this.traverseMinorTicksPositions(function (position) {
                    positions.push(position);
                }, this.options.minorGridLines);
                return positions;
            },
            axisType: function () {
                return LogarithmicAxis;
            }
        });
        deepExtend(RadarLogarithmicAxis.prototype, RadarNumericAxisMixin);
        var WEIGHT = 0.333;
        var EXTREMUM_ALLOWED_DEVIATION = 0.01;
        var CurveProcessor = Class.extend({
            init: function (closed) {
                this.closed = closed;
            },
            process: function (dataPoints) {
                var this$1 = this;
                var points = dataPoints.slice(0);
                var segments = [];
                var closed = this.closed;
                var length = points.length;
                if (length > 2) {
                    this.removeDuplicates(0, points);
                    length = points.length;
                }
                if (length < 2 || length === 2 && points[0].equals(points[1])) {
                    return segments;
                }
                var p0 = points[0];
                var p1 = points[1];
                var p2 = points[2];
                segments.push(new Segment(p0));
                while (p0.equals(points[length - 1])) {
                    closed = true;
                    points.pop();
                    length--;
                }
                if (length === 2) {
                    var tangent = this.tangent(p0, p1, X, Y);
                    last(segments).controlOut(this.firstControlPoint(tangent, p0, p1, X, Y));
                    segments.push(new Segment(p1, this.secondControlPoint(tangent, p0, p1, X, Y)));
                    return segments;
                }
                var initialControlPoint, lastControlPoint;
                if (closed) {
                    p0 = points[length - 1];
                    p1 = points[0];
                    p2 = points[1];
                    var controlPoints = this.controlPoints(p0, p1, p2);
                    initialControlPoint = controlPoints[1];
                    lastControlPoint = controlPoints[0];
                } else {
                    var tangent$1 = this.tangent(p0, p1, X, Y);
                    initialControlPoint = this.firstControlPoint(tangent$1, p0, p1, X, Y);
                }
                var cp0 = initialControlPoint;
                for (var idx = 0; idx <= length - 3; idx++) {
                    this$1.removeDuplicates(idx, points);
                    length = points.length;
                    if (idx + 3 <= length) {
                        p0 = points[idx];
                        p1 = points[idx + 1];
                        p2 = points[idx + 2];
                        var controlPoints$1 = this$1.controlPoints(p0, p1, p2);
                        last(segments).controlOut(cp0);
                        cp0 = controlPoints$1[1];
                        var cp1 = controlPoints$1[0];
                        segments.push(new Segment(p1, cp1));
                    }
                }
                if (closed) {
                    p0 = points[length - 2];
                    p1 = points[length - 1];
                    p2 = points[0];
                    var controlPoints$2 = this.controlPoints(p0, p1, p2);
                    last(segments).controlOut(cp0);
                    segments.push(new Segment(p1, controlPoints$2[0]));
                    last(segments).controlOut(controlPoints$2[1]);
                    segments.push(new Segment(p2, lastControlPoint));
                } else {
                    var tangent$2 = this.tangent(p1, p2, X, Y);
                    last(segments).controlOut(cp0);
                    segments.push(new Segment(p2, this.secondControlPoint(tangent$2, p1, p2, X, Y)));
                }
                return segments;
            },
            removeDuplicates: function (idx, points) {
                while (points[idx + 1] && (points[idx].equals(points[idx + 1]) || points[idx + 1].equals(points[idx + 2]))) {
                    points.splice(idx + 1, 1);
                }
            },
            invertAxis: function (p0, p1, p2) {
                var invertAxis = false;
                if (p0.x === p1.x) {
                    invertAxis = true;
                } else if (p1.x === p2.x) {
                    if (p1.y < p2.y && p0.y <= p1.y || p2.y < p1.y && p1.y <= p0.y) {
                        invertAxis = true;
                    }
                } else {
                    var fn = this.lineFunction(p0, p1);
                    var y2 = this.calculateFunction(fn, p2.x);
                    if (!(p0.y <= p1.y && p2.y <= y2) && !(p1.y <= p0.y && p2.y >= y2)) {
                        invertAxis = true;
                    }
                }
                return invertAxis;
            },
            isLine: function (p0, p1, p2) {
                var fn = this.lineFunction(p0, p1);
                var y2 = this.calculateFunction(fn, p2.x);
                return p0.x === p1.x && p1.x === p2.x || round(y2, 1) === round(p2.y, 1);
            },
            lineFunction: function (p1, p2) {
                var a = (p2.y - p1.y) / (p2.x - p1.x);
                var b = p1.y - a * p1.x;
                return [
                    b,
                    a
                ];
            },
            controlPoints: function (p0, p1, p2) {
                var xField = X;
                var yField = Y;
                var restrict = false;
                var switchOrientation = false;
                var tangent;
                if (this.isLine(p0, p1, p2)) {
                    tangent = this.tangent(p0, p1, X, Y);
                } else {
                    var monotonic = {
                        x: this.isMonotonicByField(p0, p1, p2, X),
                        y: this.isMonotonicByField(p0, p1, p2, Y)
                    };
                    if (monotonic.x && monotonic.y) {
                        tangent = this.tangent(p0, p2, X, Y);
                        restrict = true;
                    } else {
                        if (this.invertAxis(p0, p1, p2)) {
                            xField = Y;
                            yField = X;
                        }
                        if (monotonic[xField]) {
                            tangent = 0;
                        } else {
                            var sign;
                            if (p2[yField] < p0[yField] && p0[yField] <= p1[yField] || p0[yField] < p2[yField] && p1[yField] <= p0[yField]) {
                                sign = numberSign((p2[yField] - p0[yField]) * (p1[xField] - p0[xField]));
                            } else {
                                sign = -numberSign((p2[xField] - p0[xField]) * (p1[yField] - p0[yField]));
                            }
                            tangent = EXTREMUM_ALLOWED_DEVIATION * sign;
                            switchOrientation = true;
                        }
                    }
                }
                var secondControlPoint = this.secondControlPoint(tangent, p0, p1, xField, yField);
                if (switchOrientation) {
                    var oldXField = xField;
                    xField = yField;
                    yField = oldXField;
                }
                var firstControlPoint = this.firstControlPoint(tangent, p1, p2, xField, yField);
                if (restrict) {
                    this.restrictControlPoint(p0, p1, secondControlPoint, tangent);
                    this.restrictControlPoint(p1, p2, firstControlPoint, tangent);
                }
                return [
                    secondControlPoint,
                    firstControlPoint
                ];
            },
            restrictControlPoint: function (p1, p2, cp, tangent) {
                if (p1.y < p2.y) {
                    if (p2.y < cp.y) {
                        cp.x = p1.x + (p2.y - p1.y) / tangent;
                        cp.y = p2.y;
                    } else if (cp.y < p1.y) {
                        cp.x = p2.x - (p2.y - p1.y) / tangent;
                        cp.y = p1.y;
                    }
                } else {
                    if (cp.y < p2.y) {
                        cp.x = p1.x - (p1.y - p2.y) / tangent;
                        cp.y = p2.y;
                    } else if (p1.y < cp.y) {
                        cp.x = p2.x + (p1.y - p2.y) / tangent;
                        cp.y = p1.y;
                    }
                }
            },
            tangent: function (p0, p1, xField, yField) {
                var x = p1[xField] - p0[xField];
                var y = p1[yField] - p0[yField];
                var tangent;
                if (x === 0) {
                    tangent = 0;
                } else {
                    tangent = y / x;
                }
                return tangent;
            },
            isMonotonicByField: function (p0, p1, p2, field) {
                return p2[field] > p1[field] && p1[field] > p0[field] || p2[field] < p1[field] && p1[field] < p0[field];
            },
            firstControlPoint: function (tangent, p0, p3, xField, yField) {
                var t1 = p0[xField];
                var t2 = p3[xField];
                var distance = (t2 - t1) * WEIGHT;
                return this.point(t1 + distance, p0[yField] + distance * tangent, xField, yField);
            },
            secondControlPoint: function (tangent, p0, p3, xField, yField) {
                var t1 = p0[xField];
                var t2 = p3[xField];
                var distance = (t2 - t1) * WEIGHT;
                return this.point(t2 - distance, p3[yField] - distance * tangent, xField, yField);
            },
            point: function (xValue, yValue, xField, yField) {
                var controlPoint = new geometry.Point();
                controlPoint[xField] = xValue;
                controlPoint[yField] = yValue;
                return controlPoint;
            },
            calculateFunction: function (fn, x) {
                var length = fn.length;
                var result = 0;
                for (var i = 0; i < length; i++) {
                    result += Math.pow(x, i) * fn[i];
                }
                return result;
            }
        });
        function numberSign(value) {
            return value <= 0 ? -1 : 1;
        }
        dataviz.Gradients = GRADIENTS;
        suix.deepExtend(suix.dataviz, {
            constants: constants,
            services: services,
            autoMajorUnit: autoMajorUnit,
            Point: Point,
            Box: Box,
            Ring: Ring,
            Sector: Sector,
            ShapeBuilder: ShapeBuilder,
            ShapeElement: ShapeElement,
            ChartElement: ChartElement,
            BoxElement: BoxElement,
            RootElement: RootElement,
            FloatElement: FloatElement,
            Text: Text,
            TextBox: TextBox,
            Title: Title,
            AxisLabel: AxisLabel,
            Axis: Axis,
            Note: Note,
            CategoryAxis: CategoryAxis,
            DateCategoryAxis: DateCategoryAxis,
            DateValueAxis: DateValueAxis,
            NumericAxis: NumericAxis,
            LogarithmicAxis: LogarithmicAxis,
            PolarAxis: PolarAxis,
            RadarCategoryAxis: RadarCategoryAxis,
            RadarNumericAxis: RadarNumericAxis,
            RadarLogarithmicAxis: RadarLogarithmicAxis,
            CurveProcessor: CurveProcessor,
            rectToBox: rectToBox,
            addClass: addClass,
            removeClass: removeClass,
            alignPathToPixel: alignPathToPixel,
            clockwise: clockwise,
            convertableToNumber: convertableToNumber,
            deepExtend: deepExtend,
            elementStyles: elementStyles,
            getSpacing: getSpacing,
            getTemplate: getTemplate,
            getter: __common_getter_js,
            grep: grep,
            hasClasses: hasClasses,
            HashMap: HashMap,
            inArray: inArray,
            interpolateValue: interpolateValue,
            InstanceObserver: InstanceObserver,
            isArray: isArray,
            isFunction: isFunction,
            isNumber: isNumber,
            isObject: isObject,
            isString: isString,
            map: map,
            mousewheelDelta: mousewheelDelta,
            FontLoader: FontLoader,
            setDefaultOptions: setDefaultOptions,
            sparseArrayLimits: sparseArrayLimits,
            styleValue: styleValue,
            find: find,
            append: append,
            bindEvents: bindEvents,
            Class: Class,
            defined: defined,
            deg: deg,
            elementOffset: elementOffset,
            elementSize: elementSize,
            eventElement: eventElement,
            eventCoordinates: eventCoordinates,
            last: last,
            limitValue: limitValue,
            logToConsole: suix.logToConsole,
            objectKey: objectKey,
            rad: rad,
            round: round,
            unbindEvents: unbindEvents,
            valueOrDefault: valueOrDefault,
            absoluteDateDiff: absoluteDateDiff,
            addDuration: addDuration,
            addTicks: addTicks,
            ceilDate: ceilDate,
            dateComparer: dateComparer,
            dateDiff: dateDiff,
            dateEquals: dateEquals,
            dateIndex: dateIndex,
            duration: duration,
            floorDate: floorDate,
            lteDateIndex: lteDateIndex,
            startOfWeek: startOfWeek,
            toDate: toDate,
            parseDate: parseDate,
            parseDates: parseDates,
            toTime: toTime
        });
    }(window.suix.jQuery));
}, typeof define == 'function' && define.amd ? define : function (a1, a2, a3) {
    (a3 || a2)();
}));
(function (f, define) {
    define('dataviz/core/core', ['dataviz/core/suix-core'], f);
}(function () {
    (function ($) {
        var dataviz = suix.dataviz;
        var services = dataviz.services;
        var draw = suix.drawing;
        dataviz.SASS_THEMES = [
            'sass',
            'default-v2',
            'bootstrap-v4',
            'material-v2'
        ];
        dataviz.ExportMixin = {
            extend: function (proto, skipLegacy) {
                if (!proto.exportVisual) {
                    throw new Error('Mixin target has no exportVisual method defined.');
                }
                proto.exportSVG = this.exportSVG;
                proto.exportImage = this.exportImage;
                proto.exportPDF = this.exportPDF;
                if (!skipLegacy) {
                    proto.svg = this.svg;
                    proto.imageDataURL = this.imageDataURL;
                }
            },
            exportSVG: function (options) {
                return draw.exportSVG(this.exportVisual(), options);
            },
            exportImage: function (options) {
                return draw.exportImage(this.exportVisual(options), options);
            },
            exportPDF: function (options) {
                return draw.exportPDF(this.exportVisual(), options);
            },
            svg: function () {
                if (draw.svg.Surface) {
                    return draw.svg.exportGroup(this.exportVisual());
                } else {
                    throw new Error('SVG Export failed. Unable to export instantiate suix.drawing.svg.Surface');
                }
            },
            imageDataURL: function () {
                if (!suix.support.canvas) {
                    return null;
                }
                if (draw.canvas.Surface) {
                    var container = $('<div />').css({
                        display: 'none',
                        width: this.element.width(),
                        height: this.element.height()
                    }).appendTo(document.body);
                    var surface = new draw.canvas.Surface(container[0]);
                    surface.draw(this.exportVisual());
                    var image = surface._rootElement.toDataURL();
                    surface.destroy();
                    container.remove();
                    return image;
                } else {
                    throw new Error('Image Export failed. Unable to export instantiate suix.drawing.canvas.Surface');
                }
            }
        };
        services.IntlService.register({
            format: function (format) {
                return suix.format.apply(null, [format].concat(Array.prototype.slice.call(arguments, 1)));
            },
            toString: suix.toString,
            parseDate: suix.parseDate
        });
        services.TemplateService.register({ compile: suix.template });
        dataviz.Point2D = dataviz.Point;
        dataviz.Box2D = dataviz.Box;
        dataviz.mwDelta = function (e) {
            return dataviz.mousewheelDelta(e.originalEvent);
        };
    }(window.suix.jQuery));
}, typeof define == 'function' && define.amd ? define : function (a1, a2, a3) {
    (a3 || a2)();
}));
(function (f, define) {
    define('suix.dataviz.barcode', [
        'suix.dataviz.core',
        'suix.drawing'
    ], f);
}(function () {
    var __meta__ = {
        id: 'dataviz.barcode',
        name: 'Barcode',
        category: 'dataviz',
        description: 'Barcode widget',
        depends: ['dataviz.core']
    };
    (function ($, undefined) {
        var suix = window.suix, Widget = suix.ui.Widget, extend = $.extend, deepExtend = suix.deepExtend, inArray = $.inArray, isPlainObject = $.isPlainObject, draw = suix.drawing, geom = suix.geometry, util = suix.drawing.util, defined = util.defined, dataviz = suix.dataviz, Box2D = dataviz.Box2D, TextBox = dataviz.TextBox, DEFAULT_WIDTH = 300, DEFAULT_HEIGHT = 100, DEFAULT_QUIETZONE_LENGTH = 10, numberRegex = /^\d+$/, alphanumericRegex = /^[a-z0-9]+$/i, InvalidCharacterErrorTemplate = 'Character \'{0}\' is not valid for symbology {1}';
        function getNext(value, index, count) {
            return value.substring(index, index + count);
        }
        var Encoding = suix.Class.extend({
            init: function (options) {
                this.setOptions(options);
            },
            setOptions: function (options) {
                var that = this;
                that.options = extend({}, that.options, options);
                that.quietZoneLength = that.options.addQuietZone ? 2 * that.options.quietZoneLength : 0;
            },
            encode: function (value, width, height) {
                var that = this;
                if (defined(value)) {
                    value += '';
                }
                that.initValue(value, width, height);
                if (that.options.addQuietZone) {
                    that.addQuietZone();
                }
                that.addData();
                if (that.options.addQuietZone) {
                    that.addQuietZone();
                }
                return {
                    baseUnit: that.baseUnit,
                    pattern: that.pattern
                };
            },
            options: {
                quietZoneLength: DEFAULT_QUIETZONE_LENGTH,
                addQuietZone: true,
                addCheckSum: true
            },
            initValue: function () {
            },
            addQuietZone: function () {
                this.pattern.push(this.options.quietZoneLength || DEFAULT_QUIETZONE_LENGTH);
            },
            addData: function () {
            },
            invalidCharacterError: function (character) {
                throw new Error(suix.format(InvalidCharacterErrorTemplate, character, this.name));
            }
        });
        var encodings = {};
        var code39Base = Encoding.extend({
            minBaseUnitLength: 0.7,
            addData: function () {
                var that = this, value = that.value;
                that.addStart();
                for (var idx = 0; idx < value.length; idx++) {
                    that.addCharacter(value.charAt(idx));
                }
                if (that.options.addCheckSum) {
                    that.pushCheckSum();
                }
                that.addStop();
                that.prepareValues();
            },
            addCharacter: function (character) {
                var that = this, charData = that.characterMap[character];
                if (!charData) {
                    that.invalidCharacterError(character);
                }
                that.addBase(charData);
            },
            addBase: function () {
            }
        });
        var code39ExtendedBase = {
            addCharacter: function (character) {
                var that = this;
                if (that.characterMap[character]) {
                    that.addBase(that.characterMap[character]);
                } else if (character.charCodeAt(0) > 127) {
                    that.invalidCharacterError(character);
                } else {
                    that.addExtended(character.charCodeAt(0));
                }
            },
            addExtended: function (code) {
                var that = this, patterns;
                for (var i = 0; i < that.extendedMappings.length; i++) {
                    if (patterns = that.extendedMappings[i].call(that, code)) {
                        for (var j = 0; j < patterns.length; j++) {
                            that.addBase(patterns[j]);
                        }
                        that.dataLength += patterns.length - 1;
                        return;
                    }
                }
            },
            extendedMappings: [
                function (code) {
                    if (97 <= code && code <= 122) {
                        var that = this;
                        return [
                            that.characterMap[that.shiftCharacters[0]],
                            that.characterMap[String.fromCharCode(code - 32)]
                        ];
                    }
                },
                function (code) {
                    if (33 <= code && code <= 58) {
                        var that = this;
                        return [
                            that.characterMap[that.shiftCharacters[1]],
                            that.characterMap[String.fromCharCode(code + 32)]
                        ];
                    }
                },
                function (code) {
                    if (1 <= code && code <= 26) {
                        var that = this;
                        return [
                            that.characterMap[that.shiftCharacters[2]],
                            that.characterMap[String.fromCharCode(code + 64)]
                        ];
                    }
                },
                function (code) {
                    var that = this, result, dataCharacter;
                    if (!that.specialAsciiCodes[code]) {
                        dataCharacter = Math.floor(code / 32) * 6 + (code - 27) % 32 + 64;
                        result = [
                            that.characterMap[that.shiftCharacters[3]],
                            that.characterMap[String.fromCharCode(dataCharacter)]
                        ];
                    } else {
                        result = [];
                        for (var i = 0; i < that.specialAsciiCodes[code].length; i++) {
                            result.push(that.characterMap[that.shiftCharacters[3]]);
                            result.push(that.characterMap[that.specialAsciiCodes[code][i]]);
                        }
                    }
                    return result;
                }
            ],
            specialAsciiCodes: {
                '0': ['U'],
                '64': ['V'],
                '96': ['W'],
                '127': [
                    'T',
                    'X',
                    'Y',
                    'Z'
                ]
            },
            shiftValuesAsciiCodes: {
                '39': 36,
                '40': 47,
                '41': 43,
                '42': 37
            },
            characterMap: {
                '+': false,
                '/': false,
                '$': false,
                '%': false
            },
            shiftCharacters: [
                'SHIFT0',
                'SHIFT1',
                'SHIFT2',
                'SHIFT3'
            ]
        };
        encodings.code39 = code39Base.extend({
            name: 'Code 39',
            checkSumMod: 43,
            minRatio: 2.5,
            maxRatio: 3,
            gapWidth: 1,
            splitCharacter: '|',
            initValue: function (value, width, height) {
                var that = this;
                that.width = width;
                that.height = height;
                that.value = value;
                that.dataLength = value.length;
                that.pattern = [];
                that.patternString = '';
            },
            prepareValues: function () {
                var that = this, baseUnit, minBaseUnit = that.minBaseUnitLength, ratio = that.maxRatio, minRatio = that.minRatio, minHeight = Math.max(0.15 * that.width, 24);
                if (that.height < minHeight) {
                    throw new Error('Insufficient Height. The minimum height for value: ' + that.value + ' is: ' + minHeight);
                }
                while ((baseUnit = that.getBaseUnit(ratio)) < minBaseUnit && ratio > minRatio) {
                    ratio = parseFloat((ratio - 0.1).toFixed(1));
                }
                if (baseUnit < minBaseUnit) {
                    var minWidth = Math.ceil(that.getBaseWidth(minRatio) * minBaseUnit);
                    throw new Error('Insufficient width. The minimum width for value: ' + that.value + ' is: ' + minWidth);
                }
                that.ratio = ratio;
                that.baseUnit = baseUnit;
                that.patternString = that.patternString.substring(0, that.patternString.length - 1);
                that.pattern = that.pattern.concat(that.patternString.replace(/ratio/g, ratio).split(that.splitCharacter));
            },
            getBaseUnit: function (ratio) {
                return this.width / this.getBaseWidth(ratio);
            },
            getBaseWidth: function (ratio) {
                var that = this, characterLength = 3 * (ratio + 2);
                return that.quietZoneLength + characterLength * (that.dataLength + 2) + that.gapWidth * (that.dataLength + 1);
            },
            addStart: function () {
                var that = this;
                that.addPattern(that.characterMap.START.pattern);
                that.addCharacterGap();
            },
            addBase: function (character) {
                this.addPattern(character.pattern);
                this.addCharacterGap();
            },
            addStop: function () {
                this.addPattern(this.characterMap.START.pattern);
            },
            addPattern: function (pattern) {
                for (var i = 0; i < pattern.length; i++) {
                    this.patternString += this.patternMappings[pattern.charAt(i)];
                }
            },
            addCharacterGap: function () {
                var that = this;
                that.patternString += that.gapWidth + that.splitCharacter;
            },
            patternMappings: {
                'b': '1|',
                'w': '1|',
                'B': 'ratio|',
                'W': 'ratio|'
            },
            characterMap: {
                '0': {
                    'pattern': 'bwbWBwBwb',
                    'value': 0
                },
                '1': {
                    'pattern': 'BwbWbwbwB',
                    'value': 1
                },
                '2': {
                    'pattern': 'bwBWbwbwB',
                    'value': 2
                },
                '3': {
                    'pattern': 'BwBWbwbwb',
                    'value': 3
                },
                '4': {
                    'pattern': 'bwbWBwbwB',
                    'value': 4
                },
                '5': {
                    'pattern': 'BwbWBwbwb',
                    'value': 5
                },
                '6': {
                    'pattern': 'bwBWBwbwb',
                    'value': 6
                },
                '7': {
                    'pattern': 'bwbWbwBwB',
                    'value': 7
                },
                '8': {
                    'pattern': 'BwbWbwBwb',
                    'value': 8
                },
                '9': {
                    'pattern': 'bwBWbwBwb',
                    'value': 9
                },
                'A': {
                    'pattern': 'BwbwbWbwB',
                    'value': 10
                },
                'B': {
                    'pattern': 'bwBwbWbwB',
                    'value': 11
                },
                'C': {
                    'pattern': 'BwBwbWbwb',
                    'value': 12
                },
                'D': {
                    'pattern': 'bwbwBWbwB',
                    'value': 13
                },
                'E': {
                    'pattern': 'BwbwBWbwb',
                    'value': 14
                },
                'F': {
                    'pattern': 'bwBwBWbwb',
                    'value': 15
                },
                'G': {
                    'pattern': 'bwbwbWBwB',
                    'value': 16
                },
                'H': {
                    'pattern': 'BwbwbWBwb',
                    'value': 17
                },
                'I': {
                    'pattern': 'bwBwbWBwb',
                    'value': 18
                },
                'J': {
                    'pattern': 'bwbwBWBwb',
                    'value': 19
                },
                'K': {
                    'pattern': 'BwbwbwbWB',
                    'value': 20
                },
                'L': {
                    'pattern': 'bwBwbwbWB',
                    'value': 21
                },
                'M': {
                    'pattern': 'BwBwbwbWb',
                    'value': 22
                },
                'N': {
                    'pattern': 'bwbwBwbWB',
                    'value': 23
                },
                'O': {
                    'pattern': 'BwbwBwbWb',
                    'value': 24
                },
                'P': {
                    'pattern': 'bwBwBwbWb',
                    'value': 25
                },
                'Q': {
                    'pattern': 'bwbwbwBWB',
                    'value': 26
                },
                'R': {
                    'pattern': 'BwbwbwBWb',
                    'value': 27
                },
                'S': {
                    'pattern': 'bwBwbwBWb',
                    'value': 28
                },
                'T': {
                    'pattern': 'bwbwBwBWb',
                    'value': 29
                },
                'U': {
                    'pattern': 'BWbwbwbwB',
                    'value': 30
                },
                'V': {
                    'pattern': 'bWBwbwbwB',
                    'value': 31
                },
                'W': {
                    'pattern': 'BWBwbwbwb',
                    'value': 32
                },
                'X': {
                    'pattern': 'bWbwBwbwB',
                    'value': 33
                },
                'Y': {
                    'pattern': 'BWbwBwbwb',
                    'value': 34
                },
                'Z': {
                    'pattern': 'bWBwBwbwb',
                    'value': 35
                },
                '-': {
                    'pattern': 'bWbwbwBwB',
                    'value': 36
                },
                '.': {
                    'pattern': 'BWbwbwBwb',
                    'value': 37
                },
                ' ': {
                    'pattern': 'bWBwbwBwb',
                    'value': 38
                },
                '$': {
                    'pattern': 'bWbWbWbwb',
                    'value': 39
                },
                '/': {
                    'pattern': 'bWbWbwbWb',
                    'value': 40
                },
                '+': {
                    'pattern': 'bWbwbWbWb',
                    'value': 41
                },
                '%': {
                    'pattern': 'bwbWbWbWb',
                    'value': 42
                },
                START: { pattern: 'bWbwBwBwb' }
            },
            options: { addCheckSum: false }
        });
        encodings.code39extended = encodings.code39.extend(deepExtend({}, code39ExtendedBase, {
            name: 'Code 39 extended',
            characterMap: {
                SHIFT0: {
                    'pattern': 'bWbwbWbWb',
                    'value': 41
                },
                SHIFT1: {
                    'pattern': 'bWbWbwbWb',
                    'value': 40
                },
                SHIFT2: {
                    'pattern': 'bWbWbWbwb',
                    'value': 39
                },
                SHIFT3: {
                    'pattern': 'bwbWbWbWb',
                    'value': 42
                }
            }
        }));
        encodings.code93 = code39Base.extend({
            name: 'Code 93',
            cCheckSumTotal: 20,
            kCheckSumTotal: 15,
            checkSumMod: 47,
            initValue: function (value, width, height) {
                var that = this;
                that.value = value;
                that.width = width;
                that.height = height;
                that.pattern = [];
                that.values = [];
                that.dataLength = value.length;
            },
            prepareValues: function () {
                var that = this, minHeight = Math.max(0.15 * that.width, 24);
                if (that.height < minHeight) {
                    throw new Error('Insufficient Height');
                }
                that.setBaseUnit();
                if (that.baseUnit < that.minBaseUnitLength) {
                    throw new Error('Insufficient Width');
                }
            },
            setBaseUnit: function () {
                var that = this, checkSumLength = 2;
                that.baseUnit = that.width / (9 * (that.dataLength + 2 + checkSumLength) + that.quietZoneLength + 1);
            },
            addStart: function () {
                var pattern = this.characterMap.START.pattern;
                this.addPattern(pattern);
            },
            addStop: function () {
                var that = this;
                that.addStart();
                that.pattern.push(that.characterMap.TERMINATION_BAR);
            },
            addBase: function (charData) {
                this.addPattern(charData.pattern);
                this.values.push(charData.value);
            },
            pushCheckSum: function () {
                var that = this, checkValues = that._getCheckValues(), charData;
                that.checksum = checkValues.join('');
                for (var i = 0; i < checkValues.length; i++) {
                    charData = that.characterMap[that._findCharacterByValue(checkValues[i])];
                    that.addPattern(charData.pattern);
                }
            },
            _getCheckValues: function () {
                var that = this, values = that.values, length = values.length, wightedSum = 0, cValue, kValue, idx;
                for (idx = length - 1; idx >= 0; idx--) {
                    wightedSum += that.weightedValue(values[idx], length - idx, that.cCheckSumTotal);
                }
                cValue = wightedSum % that.checkSumMod;
                wightedSum = that.weightedValue(cValue, 1, that.kCheckSumTotal);
                for (idx = length - 1; idx >= 0; idx--) {
                    wightedSum += that.weightedValue(values[idx], length - idx + 1, that.kCheckSumTotal);
                }
                kValue = wightedSum % that.checkSumMod;
                return [
                    cValue,
                    kValue
                ];
            },
            _findCharacterByValue: function (value) {
                for (var character in this.characterMap) {
                    if (this.characterMap[character].value === value) {
                        return character;
                    }
                }
            },
            weightedValue: function (value, index, total) {
                return (index % total || total) * value;
            },
            addPattern: function (pattern) {
                var value;
                for (var i = 0; i < pattern.length; i++) {
                    value = parseInt(pattern.charAt(i), 10);
                    this.pattern.push(value);
                }
            },
            characterMap: {
                '0': {
                    'pattern': '131112',
                    'value': 0
                },
                '1': {
                    'pattern': '111213',
                    'value': 1
                },
                '2': {
                    'pattern': '111312',
                    'value': 2
                },
                '3': {
                    'pattern': '111411',
                    'value': 3
                },
                '4': {
                    'pattern': '121113',
                    'value': 4
                },
                '5': {
                    'pattern': '121212',
                    'value': 5
                },
                '6': {
                    'pattern': '121311',
                    'value': 6
                },
                '7': {
                    'pattern': '111114',
                    'value': 7
                },
                '8': {
                    'pattern': '131211',
                    'value': 8
                },
                '9': {
                    'pattern': '141111',
                    'value': 9
                },
                'A': {
                    'pattern': '211113',
                    'value': 10
                },
                'B': {
                    'pattern': '211212',
                    'value': 11
                },
                'C': {
                    'pattern': '211311',
                    'value': 12
                },
                'D': {
                    'pattern': '221112',
                    'value': 13
                },
                'E': {
                    'pattern': '221211',
                    'value': 14
                },
                'F': {
                    'pattern': '231111',
                    'value': 15
                },
                'G': {
                    'pattern': '112113',
                    'value': 16
                },
                'H': {
                    'pattern': '112212',
                    'value': 17
                },
                'I': {
                    'pattern': '112311',
                    'value': 18
                },
                'J': {
                    'pattern': '122112',
                    'value': 19
                },
                'K': {
                    'pattern': '132111',
                    'value': 20
                },
                'L': {
                    'pattern': '111123',
                    'value': 21
                },
                'M': {
                    'pattern': '111222',
                    'value': 22
                },
                'N': {
                    'pattern': '111321',
                    'value': 23
                },
                'O': {
                    'pattern': '121122',
                    'value': 24
                },
                'P': {
                    'pattern': '131121',
                    'value': 25
                },
                'Q': {
                    'pattern': '212112',
                    'value': 26
                },
                'R': {
                    'pattern': '212211',
                    'value': 27
                },
                'S': {
                    'pattern': '211122',
                    'value': 28
                },
                'T': {
                    'pattern': '211221',
                    'value': 29
                },
                'U': {
                    'pattern': '221121',
                    'value': 30
                },
                'V': {
                    'pattern': '222111',
                    'value': 31
                },
                'W': {
                    'pattern': '112122',
                    'value': 32
                },
                'X': {
                    'pattern': '112221',
                    'value': 33
                },
                'Y': {
                    'pattern': '122121',
                    'value': 34
                },
                'Z': {
                    'pattern': '123111',
                    'value': 35
                },
                '-': {
                    'pattern': '121131',
                    'value': 36
                },
                '.': {
                    'pattern': '311112',
                    'value': 37
                },
                ' ': {
                    'pattern': '311211',
                    'value': 38
                },
                '$': {
                    'pattern': '321111',
                    'value': 39
                },
                '/': {
                    'pattern': '112131',
                    'value': 40
                },
                '+': {
                    'pattern': '113121',
                    'value': 41
                },
                '%': {
                    'pattern': '211131',
                    'value': 42
                },
                SHIFT0: {
                    'pattern': '122211',
                    'value': 46
                },
                SHIFT1: {
                    'pattern': '311121',
                    'value': 45
                },
                SHIFT2: {
                    'pattern': '121221',
                    'value': 43
                },
                SHIFT3: {
                    'pattern': '312111',
                    'value': 44
                },
                START: { 'pattern': '111141' },
                TERMINATION_BAR: '1'
            }
        });
        encodings.code93extended = encodings.code93.extend(deepExtend({}, code39ExtendedBase, {
            name: 'Code 93 extended',
            pushCheckSum: function () {
                var that = this, checkValues = that._getCheckValues(), value;
                that.checksum = checkValues.join('');
                for (var i = 0; i < checkValues.length; i++) {
                    value = checkValues[i];
                    if (that.shiftValuesAsciiCodes[value]) {
                        that.addExtended(that.shiftValuesAsciiCodes[value]);
                    } else {
                        that.addPattern(that.characterMap[that._findCharacterByValue(value)].pattern);
                    }
                }
            }
        }));
        var state128 = suix.Class.extend({
            init: function (encoding) {
                this.encoding = encoding;
            },
            addStart: function () {
            },
            is: function () {
            },
            move: function () {
            },
            pushState: function () {
            }
        });
        var state128AB = state128.extend({
            FNC4: 'FNC4',
            init: function (encoding, states) {
                var that = this;
                that.encoding = encoding;
                that.states = states;
                that._initMoves(states);
            },
            addStart: function () {
                this.encoding.addPattern(this.START);
            },
            is: function (value, index) {
                var code = value.charCodeAt(index);
                return this.isCode(code);
            },
            move: function (encodingState) {
                var that = this, idx = 0;
                while (!that._moves[idx].call(that, encodingState) && idx < that._moves.length) {
                    idx++;
                }
            },
            pushState: function (encodingState) {
                var that = this, states = that.states, value = encodingState.value, maxLength = value.length, code;
                if (inArray('C', states) >= 0) {
                    var numberMatch = value.substr(encodingState.index).match(/\d{4,}/g);
                    if (numberMatch) {
                        maxLength = value.indexOf(numberMatch[0], encodingState.index);
                    }
                }
                while ((code = encodingState.value.charCodeAt(encodingState.index)) >= 0 && that.isCode(code) && encodingState.index < maxLength) {
                    that.encoding.addPattern(that.getValue(code));
                    encodingState.index++;
                }
            },
            _initMoves: function (states) {
                var that = this;
                that._moves = [];
                if (inArray(that.FNC4, states) >= 0) {
                    that._moves.push(that._moveFNC);
                }
                if (inArray(that.shiftKey, states) >= 0) {
                    that._moves.push(that._shiftState);
                }
                that._moves.push(that._moveState);
            },
            _moveFNC: function (encodingState) {
                if (encodingState.fnc) {
                    encodingState.fnc = false;
                    return encodingState.previousState == this.key;
                }
            },
            _shiftState: function (encodingState) {
                var that = this;
                if (encodingState.previousState == that.shiftKey && (encodingState.index + 1 >= encodingState.value.length || that.encoding[that.shiftKey].is(encodingState.value, encodingState.index + 1))) {
                    that.encoding.addPattern(that.SHIFT);
                    encodingState.shifted = true;
                    return true;
                }
            },
            _moveState: function () {
                this.encoding.addPattern(this.MOVE);
                return true;
            },
            SHIFT: 98
        });
        var states128 = {};
        states128.A = state128AB.extend({
            key: 'A',
            shiftKey: 'B',
            isCode: function (code) {
                return 0 <= code && code < 96;
            },
            getValue: function (code) {
                if (code < 32) {
                    return code + 64;
                }
                return code - 32;
            },
            MOVE: 101,
            START: 103
        });
        states128.B = state128AB.extend({
            key: 'B',
            shiftKey: 'A',
            isCode: function (code) {
                return 32 <= code && code < 128;
            },
            getValue: function (code) {
                return code - 32;
            },
            MOVE: 100,
            START: 104
        });
        states128.C = state128.extend({
            key: 'C',
            addStart: function () {
                this.encoding.addPattern(this.START);
            },
            is: function (value, index) {
                var next4 = getNext(value, index, 4);
                return (index + 4 <= value.length || value.length == 2) && numberRegex.test(next4);
            },
            move: function () {
                this.encoding.addPattern(this.MOVE);
            },
            pushState: function (encodingState) {
                var code;
                while ((code = getNext(encodingState.value, encodingState.index, 2)) && numberRegex.test(code) && code.length == 2) {
                    this.encoding.addPattern(parseInt(code, 10));
                    encodingState.index += 2;
                }
            },
            getValue: function (code) {
                return code;
            },
            MOVE: 99,
            START: 105
        });
        states128.FNC4 = state128.extend({
            key: 'FNC4',
            dependentStates: [
                'A',
                'B'
            ],
            init: function (encoding, states) {
                this.encoding = encoding;
                this._initSubStates(states);
            },
            addStart: function (encodingState) {
                var code = encodingState.value.charCodeAt(0) - 128, subState = this._getSubState(code);
                this.encoding[subState].addStart();
            },
            is: function (value, index) {
                var code = value.charCodeAt(index);
                return this.isCode(code);
            },
            isCode: function (code) {
                return 128 <= code && code < 256;
            },
            pushState: function (encodingState) {
                var that = this, subState = that._initSubState(encodingState), encoding = that.encoding, length = subState.value.length;
                encodingState.index += length;
                if (length < 3) {
                    var code;
                    for (; subState.index < length; subState.index++) {
                        code = subState.value.charCodeAt(subState.index);
                        subState.state = that._getSubState(code);
                        if (subState.previousState != subState.state) {
                            subState.previousState = subState.state;
                            encoding[subState.state].move(subState);
                        }
                        encoding.addPattern(encoding[subState.state].MOVE);
                        encoding.addPattern(encoding[subState.state].getValue(code));
                    }
                } else {
                    if (subState.state != subState.previousState) {
                        encoding[subState.state].move(subState);
                    }
                    that._pushStart(subState);
                    encoding.pushData(subState, that.subStates);
                    if (encodingState.index < encodingState.value.length) {
                        that._pushStart(subState);
                    }
                }
                encodingState.fnc = true;
                encodingState.state = subState.state;
            },
            _pushStart: function (subState) {
                var that = this;
                that.encoding.addPattern(that.encoding[subState.state].MOVE);
                that.encoding.addPattern(that.encoding[subState.state].MOVE);
            },
            _initSubState: function (encodingState) {
                var that = this, subState = {
                        value: that._getAll(encodingState.value, encodingState.index),
                        index: 0
                    };
                subState.state = that._getSubState(subState.value.charCodeAt(0));
                subState.previousState = encodingState.previousState == that.key ? subState.state : encodingState.previousState;
                return subState;
            },
            _initSubStates: function (states) {
                var that = this;
                that.subStates = [];
                for (var i = 0; i < states.length; i++) {
                    if (inArray(states[i], that.dependentStates) >= 0) {
                        that.subStates.push(states[i]);
                    }
                }
            },
            _getSubState: function (code) {
                var that = this;
                for (var i = 0; i < that.subStates.length; i++) {
                    if (that.encoding[that.subStates[i]].isCode(code)) {
                        return that.subStates[i];
                    }
                }
            },
            _getAll: function (value, index) {
                var code, result = '';
                while ((code = value.charCodeAt(index++)) && this.isCode(code)) {
                    result += String.fromCharCode(code - 128);
                }
                return result;
            }
        });
        states128.FNC1 = state128.extend({
            key: 'FNC1',
            startState: 'C',
            dependentStates: [
                'C',
                'B'
            ],
            startAI: '(',
            endAI: ')',
            init: function (encoding, states) {
                this.encoding = encoding;
                this.states = states;
            },
            addStart: function () {
                this.encoding[this.startState].addStart();
            },
            is: function () {
                return inArray(this.key, this.states) >= 0;
            },
            pushState: function (encodingState) {
                var that = this, encoding = that.encoding, value = encodingState.value.replace(/\s/g, ''), regexSeparators = new RegExp('[' + that.startAI + that.endAI + ']', 'g'), index = encodingState.index, subState = { state: that.startState }, current, nextStart, separatorLength;
                encoding.addPattern(that.START);
                while (true) {
                    subState.index = 0;
                    separatorLength = value.charAt(index) === that.startAI ? 2 : 0;
                    current = separatorLength > 0 ? that.getBySeparator(value, index) : that.getByLength(value, index);
                    if (current.ai.length) {
                        nextStart = index + separatorLength + current.id.length + current.ai.length;
                    } else {
                        nextStart = value.indexOf(that.startAI, index + 1);
                        if (nextStart < 0) {
                            if (index + current.ai.max + current.id.length + separatorLength < value.length) {
                                throw new Error('Separators are required after variable length identifiers');
                            }
                            nextStart = value.length;
                        }
                    }
                    subState.value = value.substring(index, nextStart).replace(regexSeparators, '');
                    that.validate(current, subState.value);
                    encoding.pushData(subState, that.dependentStates);
                    if (nextStart >= value.length) {
                        break;
                    }
                    index = nextStart;
                    if (subState.state != that.startState) {
                        encoding[that.startState].move(subState);
                        subState.state = that.startState;
                    }
                    if (!current.ai.length) {
                        encoding.addPattern(that.START);
                    }
                }
                encodingState.index = encodingState.value.length;
            },
            validate: function (current, value) {
                var code = value.substr(current.id.length), ai = current.ai;
                if (!ai.type && !numberRegex.test(code)) {
                    throw new Error('Application identifier ' + current.id + ' is numeric only but contains non numeric character(s).');
                }
                if (ai.type == 'alphanumeric' && !alphanumericRegex.test(code)) {
                    throw new Error('Application identifier ' + current.id + ' is alphanumeric only but contains non alphanumeric character(s).');
                }
                if (ai.length && ai.length !== code.length) {
                    throw new Error('Application identifier ' + current.id + ' must be ' + ai.length + ' characters long.');
                }
                if (ai.min && ai.min > code.length) {
                    throw new Error('Application identifier ' + current.id + ' must be at least ' + ai.min + ' characters long.');
                }
                if (ai.max && ai.max < code.length) {
                    throw new Error('Application identifier ' + current.id + ' must be at most ' + ai.max + ' characters long.');
                }
            },
            getByLength: function (value, index) {
                var that = this, id, ai;
                for (var i = 2; i <= 4; i++) {
                    id = getNext(value, index, i);
                    ai = that.getAI(id) || that.getAI(id.substring(0, id.length - 1));
                    if (ai) {
                        return {
                            id: id,
                            ai: ai
                        };
                    }
                }
                that.unsupportedAIError(id);
            },
            unsupportedAIError: function (id) {
                throw new Error(suix.format('\'{0}\' is not a supported Application Identifier'), id);
            },
            getBySeparator: function (value, index) {
                var that = this, start = value.indexOf(that.startAI, index), end = value.indexOf(that.endAI, start), id = value.substring(start + 1, end), ai = that.getAI(id) || that.getAI(id.substr(id.length - 1));
                if (!ai) {
                    that.unsupportedAIError(id);
                }
                return {
                    ai: ai,
                    id: id
                };
            },
            getAI: function (id) {
                var ai = this.applicationIdentifiers, multiKey = ai.multiKey;
                if (ai[id]) {
                    return ai[id];
                }
                for (var i = 0; i < multiKey.length; i++) {
                    if (multiKey[i].ids && inArray(id, multiKey[i].ids) >= 0) {
                        return multiKey[i].type;
                    } else if (multiKey[i].ranges) {
                        var ranges = multiKey[i].ranges;
                        for (var j = 0; j < ranges.length; j++) {
                            if (ranges[j][0] <= id && id <= ranges[j][1]) {
                                return multiKey[i].type;
                            }
                        }
                    }
                }
            },
            applicationIdentifiers: {
                '22': {
                    max: 29,
                    type: 'alphanumeric'
                },
                '402': { length: 17 },
                '7004': {
                    max: 4,
                    type: 'alphanumeric'
                },
                '242': {
                    max: 6,
                    type: 'alphanumeric'
                },
                '8020': {
                    max: 25,
                    type: 'alphanumeric'
                },
                '703': {
                    min: 3,
                    max: 30,
                    type: 'alphanumeric'
                },
                '8008': {
                    min: 8,
                    max: 12,
                    type: 'alphanumeric'
                },
                '253': {
                    min: 13,
                    max: 17,
                    type: 'alphanumeric'
                },
                '8003': {
                    min: 14,
                    max: 30,
                    type: 'alphanumeric'
                },
                multiKey: [
                    {
                        ids: [
                            '15',
                            '17',
                            '8005',
                            '8100'
                        ],
                        ranges: [
                            [
                                11,
                                13
                            ],
                            [
                                310,
                                316
                            ],
                            [
                                320,
                                336
                            ],
                            [
                                340,
                                369
                            ]
                        ],
                        type: { length: 6 }
                    },
                    {
                        ids: [
                            '240',
                            '241',
                            '250',
                            '251',
                            '400',
                            '401',
                            '403',
                            '7002',
                            '8004',
                            '8007',
                            '8110'
                        ],
                        ranges: [[90 - 99]],
                        type: {
                            max: 30,
                            type: 'alphanumeric'
                        }
                    },
                    {
                        ids: ['7001'],
                        ranges: [[
                                410,
                                414
                            ]],
                        type: { length: 13 }
                    },
                    {
                        ids: [
                            '10',
                            '21',
                            '254',
                            '420',
                            '8002'
                        ],
                        type: {
                            max: 20,
                            type: 'alphanumeric'
                        }
                    },
                    {
                        ids: [
                            '00',
                            '8006',
                            '8017',
                            '8018'
                        ],
                        type: { length: 18 }
                    },
                    {
                        ids: [
                            '01',
                            '02',
                            '8001'
                        ],
                        type: { length: 14 }
                    },
                    {
                        ids: ['422'],
                        ranges: [[
                                424,
                                426
                            ]],
                        type: { length: 3 }
                    },
                    {
                        ids: [
                            '20',
                            '8102'
                        ],
                        type: { length: 2 }
                    },
                    {
                        ids: [
                            '30',
                            '37'
                        ],
                        type: {
                            max: 8,
                            type: 'alphanumeric'
                        }
                    },
                    {
                        ids: [
                            '390',
                            '392'
                        ],
                        type: {
                            max: 15,
                            type: 'alphanumeric'
                        }
                    },
                    {
                        ids: [
                            '421',
                            '423'
                        ],
                        type: {
                            min: 3,
                            max: 15,
                            type: 'alphanumeric'
                        }
                    },
                    {
                        ids: [
                            '391',
                            '393'
                        ],
                        type: {
                            min: 3,
                            max: 18,
                            type: 'alphanumeric'
                        }
                    },
                    {
                        ids: [
                            '7003',
                            '8101'
                        ],
                        type: { length: 10 }
                    }
                ]
            },
            START: 102
        });
        var code128Base = Encoding.extend({
            init: function (options) {
                Encoding.fn.init.call(this, options);
                this._initStates();
            },
            _initStates: function () {
                var that = this;
                for (var i = 0; i < that.states.length; i++) {
                    that[that.states[i]] = new states128[that.states[i]](that, that.states);
                }
            },
            initValue: function (value, width, height) {
                var that = this;
                that.pattern = [];
                that.value = value;
                that.width = width;
                that.height = height;
                that.checkSum = 0;
                that.totalUnits = 0;
                that.index = 0;
                that.position = 1;
            },
            addData: function () {
                var that = this, encodingState = {
                        value: that.value,
                        index: 0,
                        state: ''
                    };
                if (that.value.length === 0) {
                    return;
                }
                encodingState.state = encodingState.previousState = that.getNextState(encodingState, that.states);
                that.addStart(encodingState);
                that.pushData(encodingState, that.states);
                that.addCheckSum();
                that.addStop();
                that.setBaseUnit();
            },
            pushData: function (encodingState, states) {
                var that = this;
                while (true) {
                    that[encodingState.state].pushState(encodingState);
                    if (encodingState.index >= encodingState.value.length) {
                        break;
                    }
                    if (!encodingState.shifted) {
                        encodingState.previousState = encodingState.state;
                        encodingState.state = that.getNextState(encodingState, states);
                        that[encodingState.state].move(encodingState);
                    } else {
                        var temp = encodingState.state;
                        encodingState.state = encodingState.previousState;
                        encodingState.previousState = temp;
                        encodingState.shifted = false;
                    }
                }
            },
            addStart: function (encodingState) {
                this[encodingState.state].addStart(encodingState);
                this.position = 1;
            },
            addCheckSum: function () {
                var that = this;
                that.checksum = that.checkSum % 103;
                that.addPattern(that.checksum);
            },
            addStop: function () {
                this.addPattern(this.STOP);
            },
            setBaseUnit: function () {
                var that = this;
                that.baseUnit = that.width / (that.totalUnits + that.quietZoneLength);
            },
            addPattern: function (code) {
                var that = this, pattern = that.characterMap[code].toString(), value;
                for (var i = 0; i < pattern.length; i++) {
                    value = parseInt(pattern.charAt(i), 10);
                    that.pattern.push(value);
                    that.totalUnits += value;
                }
                that.checkSum += code * that.position++;
            },
            getNextState: function (encodingState, states) {
                for (var i = 0; i < states.length; i++) {
                    if (this[states[i]].is(encodingState.value, encodingState.index)) {
                        return states[i];
                    }
                }
                this.invalidCharacterError(encodingState.value.charAt(encodingState.index));
            },
            characterMap: [
                212222,
                222122,
                222221,
                121223,
                121322,
                131222,
                122213,
                122312,
                132212,
                221213,
                221312,
                231212,
                112232,
                122132,
                122231,
                113222,
                123122,
                123221,
                223211,
                221132,
                221231,
                213212,
                223112,
                312131,
                311222,
                321122,
                321221,
                312212,
                322112,
                322211,
                212123,
                212321,
                232121,
                111323,
                131123,
                131321,
                112313,
                132113,
                132311,
                211313,
                231113,
                231311,
                112133,
                112331,
                132131,
                113123,
                113321,
                133121,
                313121,
                211331,
                231131,
                213113,
                213311,
                213131,
                311123,
                311321,
                331121,
                312113,
                312311,
                332111,
                314111,
                221411,
                431111,
                111224,
                111422,
                121124,
                121421,
                141122,
                141221,
                112214,
                112412,
                122114,
                122411,
                142112,
                142211,
                241211,
                221114,
                413111,
                241112,
                134111,
                111242,
                121142,
                121241,
                114212,
                124112,
                124211,
                411212,
                421112,
                421211,
                212141,
                214121,
                412121,
                111143,
                111341,
                131141,
                114113,
                114311,
                411113,
                411311,
                113141,
                114131,
                311141,
                411131,
                211412,
                211214,
                211232,
                2331112
            ],
            STOP: 106
        });
        encodings.code128a = code128Base.extend({
            name: 'Code 128 A',
            states: ['A']
        });
        encodings.code128b = code128Base.extend({
            name: 'Code 128 B',
            states: ['B']
        });
        encodings.code128c = code128Base.extend({
            name: 'Code 128 C',
            states: ['C']
        });
        encodings.code128 = code128Base.extend({
            name: 'Code 128',
            states: [
                'C',
                'B',
                'A',
                'FNC4'
            ]
        });
        encodings['gs1-128'] = code128Base.extend({
            name: 'Code GS1-128',
            states: [
                'FNC1',
                'C',
                'B'
            ]
        });
        var msiBase = Encoding.extend({
            initValue: function (value, width) {
                var that = this;
                that.pattern = [];
                that.value = value;
                that.checkSumLength = 0;
                that.width = width;
            },
            setBaseUnit: function () {
                var that = this, startStopLength = 7;
                that.baseUnit = that.width / (12 * (that.value.length + that.checkSumLength) + that.quietZoneLength + startStopLength);
            },
            addData: function () {
                var that = this, value = that.value;
                that.addPattern(that.START);
                for (var i = 0; i < value.length; i++) {
                    that.addCharacter(value.charAt(i));
                }
                if (that.options.addCheckSum) {
                    that.addCheckSum();
                }
                that.addPattern(that.STOP);
                that.setBaseUnit();
            },
            addCharacter: function (character) {
                var that = this, pattern = that.characterMap[character];
                if (!pattern) {
                    that.invalidCharacterError(character);
                }
                that.addPattern(pattern);
            },
            addPattern: function (pattern) {
                for (var i = 0; i < pattern.length; i++) {
                    this.pattern.push(parseInt(pattern.charAt(i), 10));
                }
            },
            addCheckSum: function () {
                var that = this, checkSumFunction = that.checkSums[that.checkSumType], checkValues;
                checkValues = checkSumFunction.call(that.checkSums, that.value);
                that.checksum = checkValues.join('');
                for (var i = 0; i < checkValues.length; i++) {
                    that.checkSumLength++;
                    that.addPattern(that.characterMap[checkValues[i]]);
                }
            },
            checkSums: {
                Modulo10: function (value) {
                    var checkValues = [
                            0,
                            ''
                        ], odd = value.length % 2, idx, evenSum, oddSum;
                    for (idx = 0; idx < value.length; idx++) {
                        checkValues[(idx + odd) % 2] += parseInt(value.charAt(idx), 10);
                    }
                    oddSum = checkValues[0];
                    evenSum = (checkValues[1] * 2).toString();
                    for (idx = 0; idx < evenSum.length; idx++) {
                        oddSum += parseInt(evenSum.charAt(idx), 10);
                    }
                    return [(10 - oddSum % 10) % 10];
                },
                Modulo11: function (value) {
                    var weightedSum = 0, mod = 11, length = value.length, weight, checkValue;
                    for (var i = 0; i < length; i++) {
                        weight = ((length - i) % 6 || 6) + 1;
                        weightedSum += weight * value.charAt(i);
                    }
                    checkValue = (mod - weightedSum % mod) % mod;
                    if (checkValue != 10) {
                        return [checkValue];
                    }
                    return [
                        1,
                        0
                    ];
                },
                Modulo11Modulo10: function (value) {
                    var checkValues = this.Modulo11(value), mod11Value;
                    mod11Value = value + checkValues[0];
                    return checkValues.concat(this.Modulo10(mod11Value));
                },
                Modulo10Modulo10: function (value) {
                    var checkValues = this.Modulo10(value), mod10Value;
                    mod10Value = value + checkValues[0];
                    return checkValues.concat(this.Modulo10(mod10Value));
                }
            },
            characterMap: [
                '12121212',
                '12121221',
                '12122112',
                '12122121',
                '12211212',
                '12211221',
                '12212112',
                '12212121',
                '21121212',
                '21121221'
            ],
            START: '21',
            STOP: '121',
            checkSumType: ''
        });
        encodings.msimod10 = msiBase.extend({
            name: 'MSI Modulo10',
            checkSumType: 'Modulo10'
        });
        encodings.msimod11 = msiBase.extend({
            name: 'MSI Modulo11',
            checkSumType: 'Modulo11'
        });
        encodings.msimod1110 = msiBase.extend({
            name: 'MSI Modulo11 Modulo10',
            checkSumType: 'Modulo11Modulo10'
        });
        encodings.msimod1010 = msiBase.extend({
            name: 'MSI Modulo10 Modulo10',
            checkSumType: 'Modulo10Modulo10'
        });
        encodings.code11 = Encoding.extend({
            name: 'Code 11',
            cCheckSumTotal: 10,
            kCheckSumTotal: 9,
            kCheckSumMinLength: 10,
            checkSumMod: 11,
            DASH_VALUE: 10,
            DASH: '-',
            START: '112211',
            STOP: '11221',
            initValue: function (value, width) {
                var that = this;
                that.pattern = [];
                that.value = value;
                that.width = width;
                that.totalUnits = 0;
            },
            addData: function () {
                var that = this;
                var value = that.value;
                that.addPattern(that.START);
                for (var i = 0; i < value.length; i++) {
                    that.addCharacter(value.charAt(i));
                }
                if (that.options.addCheckSum) {
                    that.addCheckSum();
                }
                that.addPattern(that.STOP);
                that.setBaseUnit();
            },
            setBaseUnit: function () {
                var that = this;
                that.baseUnit = that.width / (that.totalUnits + that.quietZoneLength);
            },
            addCheckSum: function () {
                var that = this, value = that.value, length = value.length, cValue;
                cValue = that.getWeightedSum(value, length, that.cCheckSumTotal) % that.checkSumMod;
                that.checksum = cValue + '';
                that.addPattern(that.characterMap[cValue]);
                length++;
                if (length >= that.kCheckSumMinLength) {
                    var kValue = (cValue + that.getWeightedSum(value, length, that.kCheckSumTotal)) % that.checkSumMod;
                    that.checksum += kValue;
                    that.addPattern(that.characterMap[kValue]);
                }
            },
            getWeightedSum: function (value, length, total) {
                var weightedSum = 0;
                for (var i = 0; i < value.length; i++) {
                    weightedSum += this.weightedValue(this.getValue(value.charAt(i)), length, i, total);
                }
                return weightedSum;
            },
            weightedValue: function (value, length, index, total) {
                var weight = (length - index) % total || total;
                return weight * value;
            },
            getValue: function (character) {
                var that = this;
                if (!isNaN(character)) {
                    return parseInt(character, 10);
                } else if (character !== that.DASH) {
                    that.invalidCharacterError(character);
                }
                return that.DASH_VALUE;
            },
            addCharacter: function (character) {
                var that = this, value = that.getValue(character), pattern = that.characterMap[value];
                that.addPattern(pattern);
            },
            addPattern: function (pattern) {
                var value;
                for (var i = 0; i < pattern.length; i++) {
                    value = parseInt(pattern.charAt(i), 10);
                    this.pattern.push(value);
                    this.totalUnits += value;
                }
            },
            characterMap: [
                '111121',
                '211121',
                '121121',
                '221111',
                '112121',
                '212111',
                '122111',
                '111221',
                '211211',
                '211111',
                '112111'
            ],
            options: { addCheckSum: true }
        });
        encodings.postnet = Encoding.extend({
            name: 'Postnet',
            START: '2',
            VALID_CODE_LENGTHS: [
                5,
                9,
                11
            ],
            DIGIT_SEPARATOR: '-',
            initValue: function (value, width, height) {
                var that = this;
                that.height = height;
                that.width = width;
                that.baseHeight = height / 2;
                that.value = value.replace(new RegExp(that.DIGIT_SEPARATOR, 'g'), '');
                that.pattern = [];
                that.validate(that.value);
                that.checkSum = 0;
                that.setBaseUnit();
            },
            addData: function () {
                var that = this, value = that.value;
                that.addPattern(that.START);
                for (var i = 0; i < value.length; i++) {
                    that.addCharacter(value.charAt(i));
                }
                if (that.options.addCheckSum) {
                    that.addCheckSum();
                }
                that.addPattern(that.START);
                that.pattern.pop();
            },
            addCharacter: function (character) {
                var that = this, pattern = that.characterMap[character];
                that.checkSum += parseInt(character, 10);
                that.addPattern(pattern);
            },
            addCheckSum: function () {
                var that = this;
                that.checksum = (10 - that.checkSum % 10) % 10;
                that.addCharacter(that.checksum);
            },
            setBaseUnit: function () {
                var that = this, startStopLength = 3;
                that.baseUnit = that.width / ((that.value.length + 1) * 10 + startStopLength + that.quietZoneLength);
            },
            validate: function (value) {
                var that = this;
                if (!numberRegex.test(value)) {
                    that.invalidCharacterError(value.match(/[^0-9]/)[0]);
                }
                if (inArray(value.length, that.VALID_CODE_LENGTHS) < 0) {
                    throw new Error('Invalid value length. Valid lengths for the Postnet symbology are ' + that.VALID_CODE_LENGTHS.join(','));
                }
            },
            addPattern: function (pattern) {
                var that = this, y1;
                for (var i = 0; i < pattern.length; i++) {
                    y1 = that.height - that.baseHeight * pattern.charAt(i);
                    that.pattern.push({
                        width: 1,
                        y1: y1,
                        y2: that.height
                    });
                    that.pattern.push(1);
                }
            },
            characterMap: [
                '22111',
                '11122',
                '11212',
                '11221',
                '12112',
                '12121',
                '12211',
                '21112',
                '21121',
                '21211'
            ]
        });
        encodings.ean13 = Encoding.extend({
            initValue: function (value, width, height) {
                value += '';
                if (value.length != 12 || /\D/.test(value)) {
                    throw new Error('The value of the "EAN13" encoding should be 12 symbols');
                }
                var that = this;
                that.pattern = [];
                that.options.height = height;
                that.baseUnit = width / (95 + that.quietZoneLength);
                that.value = value;
                that.checksum = that.calculateChecksum();
                that.leftKey = value[0];
                that.leftPart = value.substr(1, 6);
                that.rightPart = value.substr(7) + that.checksum;
            },
            addData: function () {
                var that = this;
                that.addPieces(that.characterMap.start);
                that.addSide(that.leftPart, that.leftKey);
                that.addPieces(that.characterMap.middle);
                that.addSide(that.rightPart);
                that.addPieces(that.characterMap.start);
            },
            addSide: function (leftPart, key) {
                var that = this;
                for (var i = 0; i < leftPart.length; i++) {
                    if (key && parseInt(that.keyTable[key].charAt(i), 10)) {
                        that.addPieces(Array.prototype.slice.call(that.characterMap.digits[leftPart.charAt(i)]).reverse(), true);
                    } else {
                        that.addPieces(that.characterMap.digits[leftPart.charAt(i)], true);
                    }
                }
            },
            addPieces: function (arrToAdd, limitedHeight) {
                var that = this;
                for (var i = 0; i < arrToAdd.length; i++) {
                    if (limitedHeight) {
                        that.pattern.push({
                            y1: 0,
                            y2: that.options.height * 0.95,
                            width: arrToAdd[i]
                        });
                    } else {
                        that.pattern.push(arrToAdd[i]);
                    }
                }
            },
            calculateChecksum: function () {
                var odd = 0, even = 0, value = this.value.split('').reverse().join('');
                for (var i = 0; i < value.length; i++) {
                    if (i % 2) {
                        even += parseInt(value.charAt(i), 10);
                    } else {
                        odd += parseInt(value.charAt(i), 10);
                    }
                }
                var checksum = (10 - (3 * odd + even) % 10) % 10;
                return checksum;
            },
            keyTable: [
                '000000',
                '001011',
                '001101',
                '001110',
                '010011',
                '011001',
                '011100',
                '010101',
                '010110',
                '011010'
            ],
            characterMap: {
                digits: [
                    [
                        3,
                        2,
                        1,
                        1
                    ],
                    [
                        2,
                        2,
                        2,
                        1
                    ],
                    [
                        2,
                        1,
                        2,
                        2
                    ],
                    [
                        1,
                        4,
                        1,
                        1
                    ],
                    [
                        1,
                        1,
                        3,
                        2
                    ],
                    [
                        1,
                        2,
                        3,
                        1
                    ],
                    [
                        1,
                        1,
                        1,
                        4
                    ],
                    [
                        1,
                        3,
                        1,
                        2
                    ],
                    [
                        1,
                        2,
                        1,
                        3
                    ],
                    [
                        3,
                        1,
                        1,
                        2
                    ]
                ],
                start: [
                    1,
                    1,
                    1
                ],
                middle: [
                    1,
                    1,
                    1,
                    1,
                    1
                ]
            }
        });
        encodings.ean8 = encodings.ean13.extend({
            initValue: function (value, width, height) {
                var that = this;
                if (value.length != 7 || /\D/.test(value)) {
                    throw new Error('Invalid value provided');
                }
                that.value = value;
                that.options.height = height;
                that.checksum = that.calculateChecksum(that.value);
                that.leftPart = that.value.substr(0, 4);
                that.rightPart = that.value.substr(4) + that.checksum;
                that.pattern = [];
                that.baseUnit = width / (67 + that.quietZoneLength);
            }
        });
        var Barcode = Widget.extend({
            init: function (element, options) {
                var that = this;
                Widget.fn.init.call(that, element, options);
                that.element = $(element);
                that.wrapper = that.element;
                that.element.addClass('k-barcode').css('display', 'block');
                that.surfaceWrap = $('<div />').css('position', 'relative').appendTo(this.element);
                that.surface = draw.Surface.create(that.surfaceWrap, { type: that.options.renderAs });
                that._setOptions(options);
                if (options && defined(options.value)) {
                    that.redraw();
                }
            },
            setOptions: function (options) {
                this._setOptions(options);
                this.redraw();
            },
            redraw: function () {
                var size = this._getSize();
                this.surface.clear();
                this.surface.setSize({
                    width: size.width,
                    height: size.height
                });
                this.createVisual();
                this.surface.draw(this.visual);
            },
            getSize: function () {
                return suix.dimensions(this.element);
            },
            _resize: function () {
                this.redraw();
            },
            createVisual: function () {
                this.visual = this._render();
            },
            _render: function () {
                var that = this, options = that.options, value = options.value, textOptions = options.text, textMargin = dataviz.getSpacing(textOptions.margin), size = that._getSize(), border = options.border || {}, encoding = that.encoding, contentBox = new Box2D(0, 0, size.width, size.height).unpad(border.width).unpad(options.padding), barHeight = contentBox.height(), result, textToDisplay, textHeight;
                var visual = new draw.Group();
                that.contentBox = contentBox;
                visual.append(that._getBackground(size));
                if (textOptions.visible) {
                    textHeight = draw.util.measureText(value, { font: textOptions.font }).height;
                    barHeight -= textHeight + textMargin.top + textMargin.bottom;
                }
                result = encoding.encode(value, contentBox.width(), barHeight);
                if (textOptions.visible) {
                    textToDisplay = value;
                    if (options.checksum && defined(encoding.checksum)) {
                        textToDisplay += ' ' + encoding.checksum;
                    }
                    visual.append(that._getText(textToDisplay));
                }
                that.barHeight = barHeight;
                this._bandsGroup = this._getBands(result.pattern, result.baseUnit);
                visual.append(this._bandsGroup);
                return visual;
            },
            exportVisual: function () {
                return this._render();
            },
            _getSize: function () {
                var that = this, element = that.element, size = new geom.Size(DEFAULT_WIDTH, DEFAULT_HEIGHT);
                if (element.width() > 0) {
                    size.width = element.width();
                }
                if (element.height() > 0) {
                    size.height = element.height();
                }
                if (that.options.width) {
                    size.width = that.options.width;
                }
                if (that.options.height) {
                    size.height = that.options.height;
                }
                return size;
            },
            value: function (value) {
                var that = this;
                if (!defined(value)) {
                    return that.options.value;
                }
                that.options.value = value + '';
                that.redraw();
            },
            _getBands: function (pattern, baseUnit) {
                var that = this, contentBox = that.contentBox, position = contentBox.x1, step, item;
                var group = new draw.Group();
                for (var i = 0; i < pattern.length; i++) {
                    item = isPlainObject(pattern[i]) ? pattern[i] : {
                        width: pattern[i],
                        y1: 0,
                        y2: that.barHeight
                    };
                    step = item.width * baseUnit;
                    if (i % 2) {
                        var rect = geom.Rect.fromPoints(new geom.Point(position, item.y1 + contentBox.y1), new geom.Point(position + step, item.y2 + contentBox.y1));
                        var path = draw.Path.fromRect(rect, {
                            fill: { color: that.options.color },
                            stroke: null
                        });
                        group.append(path);
                    }
                    position += step;
                }
                return group;
            },
            _getBackground: function (size) {
                var that = this, options = that.options, border = options.border || {};
                var box = new Box2D(0, 0, size.width, size.height).unpad(border.width / 2);
                var path = draw.Path.fromRect(box.toRect(), {
                    fill: { color: options.background },
                    stroke: {
                        color: border.width ? border.color : '',
                        width: border.width,
                        dashType: border.dashType
                    }
                });
                return path;
            },
            _getText: function (value) {
                var that = this, textOptions = that.options.text, text = that._textbox = new TextBox(value, {
                        font: textOptions.font,
                        color: textOptions.color,
                        align: 'center',
                        vAlign: 'bottom',
                        margin: textOptions.margin
                    });
                text.reflow(that.contentBox);
                text.renderVisual();
                return text.visual;
            },
            _setOptions: function (options) {
                var that = this;
                that.type = (options.type || that.options.type).toLowerCase();
                if (that.type == 'upca') {
                    that.type = 'ean13';
                    options.value = '0' + options.value;
                }
                if (that.type == 'upce') {
                    that.type = 'ean8';
                    options.value = '0' + options.value;
                }
                if (!encodings[that.type]) {
                    throw new Error('Encoding ' + that.type + 'is not supported.');
                }
                that.encoding = new encodings[that.type]();
                that.options = extend(true, that.options, options);
            },
            options: {
                name: 'Barcode',
                renderAs: 'svg',
                value: '',
                type: 'code39',
                checksum: false,
                width: 0,
                height: 0,
                color: 'black',
                background: 'white',
                text: {
                    visible: true,
                    font: '16px Consolas, Monaco, Sans Mono, monospace, sans-serif',
                    color: 'black',
                    margin: {
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0
                    }
                },
                border: {
                    width: 0,
                    dashType: 'solid',
                    color: 'black'
                },
                padding: {
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0
                }
            }
        });
        dataviz.ExportMixin.extend(Barcode.fn);
        dataviz.ui.plugin(Barcode);
        suix.deepExtend(dataviz, {
            encodings: encodings,
            Encoding: Encoding
        });
    }(window.suix.jQuery));
    return window.suix;
}, typeof define == 'function' && define.amd ? define : function (a1, a2, a3) {
    (a3 || a2)();
}));
(function (f, define) {
    define('suix.dataviz.qrcode', [
        'suix.dataviz.core',
        'suix.drawing'
    ], f);
}(function () {
    var __meta__ = {
        id: 'dataviz.qrcode',
        name: 'QRCode',
        category: 'dataviz',
        description: 'QRCode widget.',
        depends: [
            'dataviz.core',
            'drawing'
        ]
    };
    (function ($, undefined) {
        var suix = window.suix, extend = $.extend, draw = suix.drawing, dataviz = suix.dataviz, Widget = suix.ui.Widget, Box2D = dataviz.Box2D, terminator = '0000', NUMERIC = 'numeric', ALPHA_NUMERIC = 'alphanumeric', BYTE = 'byte', powersOfTwo = { '1': 0 }, powersOfTwoResult = { '0': 1 }, generatorPolynomials = [
                [
                    1,
                    0
                ],
                [
                    1,
                    25,
                    0
                ]
            ], irregularAlignmentPatternsStartDistance = {
                15: 20,
                16: 20,
                18: 24,
                19: 24,
                22: 20,
                24: 22,
                26: 24,
                28: 20,
                30: 20,
                31: 24,
                32: 28,
                33: 24,
                36: 18,
                37: 22,
                39: 20,
                40: 24
            }, versionsCodewordsInformation = [
                {
                    L: {
                        groups: [[
                                1,
                                19
                            ]],
                        totalDataCodewords: 19,
                        errorCodewordsPerBlock: 7
                    },
                    M: {
                        groups: [[
                                1,
                                16
                            ]],
                        totalDataCodewords: 16,
                        errorCodewordsPerBlock: 10
                    },
                    Q: {
                        groups: [[
                                1,
                                13
                            ]],
                        totalDataCodewords: 13,
                        errorCodewordsPerBlock: 13
                    },
                    H: {
                        groups: [[
                                1,
                                9
                            ]],
                        totalDataCodewords: 9,
                        errorCodewordsPerBlock: 17
                    }
                },
                {
                    L: {
                        groups: [[
                                1,
                                34
                            ]],
                        totalDataCodewords: 34,
                        errorCodewordsPerBlock: 10
                    },
                    M: {
                        groups: [[
                                1,
                                28
                            ]],
                        totalDataCodewords: 28,
                        errorCodewordsPerBlock: 16
                    },
                    Q: {
                        groups: [[
                                1,
                                22
                            ]],
                        totalDataCodewords: 22,
                        errorCodewordsPerBlock: 22
                    },
                    H: {
                        groups: [[
                                1,
                                16
                            ]],
                        totalDataCodewords: 16,
                        errorCodewordsPerBlock: 28
                    }
                },
                {
                    L: {
                        groups: [[
                                1,
                                55
                            ]],
                        totalDataCodewords: 55,
                        errorCodewordsPerBlock: 15
                    },
                    M: {
                        groups: [[
                                1,
                                44
                            ]],
                        totalDataCodewords: 44,
                        errorCodewordsPerBlock: 26
                    },
                    Q: {
                        groups: [[
                                2,
                                17
                            ]],
                        totalDataCodewords: 34,
                        errorCodewordsPerBlock: 18
                    },
                    H: {
                        groups: [[
                                2,
                                13
                            ]],
                        totalDataCodewords: 26,
                        errorCodewordsPerBlock: 22
                    }
                },
                {
                    L: {
                        groups: [[
                                1,
                                80
                            ]],
                        totalDataCodewords: 80,
                        errorCodewordsPerBlock: 20
                    },
                    M: {
                        groups: [[
                                2,
                                32
                            ]],
                        totalDataCodewords: 64,
                        errorCodewordsPerBlock: 18
                    },
                    Q: {
                        groups: [[
                                2,
                                24
                            ]],
                        totalDataCodewords: 48,
                        errorCodewordsPerBlock: 26
                    },
                    H: {
                        groups: [[
                                4,
                                9
                            ]],
                        totalDataCodewords: 36,
                        errorCodewordsPerBlock: 16
                    }
                },
                {
                    L: {
                        groups: [[
                                1,
                                108
                            ]],
                        totalDataCodewords: 108,
                        errorCodewordsPerBlock: 26
                    },
                    M: {
                        groups: [[
                                2,
                                43
                            ]],
                        totalDataCodewords: 86,
                        errorCodewordsPerBlock: 24
                    },
                    Q: {
                        groups: [
                            [
                                2,
                                15
                            ],
                            [
                                2,
                                16
                            ]
                        ],
                        totalDataCodewords: 62,
                        errorCodewordsPerBlock: 18
                    },
                    H: {
                        groups: [
                            [
                                2,
                                11
                            ],
                            [
                                2,
                                12
                            ]
                        ],
                        totalDataCodewords: 46,
                        errorCodewordsPerBlock: 22
                    }
                },
                {
                    L: {
                        groups: [[
                                2,
                                68
                            ]],
                        totalDataCodewords: 136,
                        errorCodewordsPerBlock: 18
                    },
                    M: {
                        groups: [[
                                4,
                                27
                            ]],
                        totalDataCodewords: 108,
                        errorCodewordsPerBlock: 16
                    },
                    Q: {
                        groups: [[
                                4,
                                19
                            ]],
                        totalDataCodewords: 76,
                        errorCodewordsPerBlock: 24
                    },
                    H: {
                        groups: [[
                                4,
                                15
                            ]],
                        totalDataCodewords: 60,
                        errorCodewordsPerBlock: 28
                    }
                },
                {
                    L: {
                        groups: [[
                                2,
                                78
                            ]],
                        totalDataCodewords: 156,
                        errorCodewordsPerBlock: 20
                    },
                    M: {
                        groups: [[
                                4,
                                31
                            ]],
                        totalDataCodewords: 124,
                        errorCodewordsPerBlock: 18
                    },
                    Q: {
                        groups: [
                            [
                                2,
                                14
                            ],
                            [
                                4,
                                15
                            ]
                        ],
                        totalDataCodewords: 88,
                        errorCodewordsPerBlock: 18
                    },
                    H: {
                        groups: [
                            [
                                4,
                                13
                            ],
                            [
                                1,
                                14
                            ]
                        ],
                        totalDataCodewords: 66,
                        errorCodewordsPerBlock: 26
                    }
                },
                {
                    L: {
                        groups: [[
                                2,
                                97
                            ]],
                        totalDataCodewords: 194,
                        errorCodewordsPerBlock: 24
                    },
                    M: {
                        groups: [
                            [
                                2,
                                38
                            ],
                            [
                                2,
                                39
                            ]
                        ],
                        totalDataCodewords: 154,
                        errorCodewordsPerBlock: 22
                    },
                    Q: {
                        groups: [
                            [
                                4,
                                18
                            ],
                            [
                                2,
                                19
                            ]
                        ],
                        totalDataCodewords: 110,
                        errorCodewordsPerBlock: 22
                    },
                    H: {
                        groups: [
                            [
                                4,
                                14
                            ],
                            [
                                2,
                                15
                            ]
                        ],
                        totalDataCodewords: 86,
                        errorCodewordsPerBlock: 26
                    }
                },
                {
                    L: {
                        groups: [[
                                2,
                                116
                            ]],
                        totalDataCodewords: 232,
                        errorCodewordsPerBlock: 30
                    },
                    M: {
                        groups: [
                            [
                                3,
                                36
                            ],
                            [
                                2,
                                37
                            ]
                        ],
                        totalDataCodewords: 182,
                        errorCodewordsPerBlock: 22
                    },
                    Q: {
                        groups: [
                            [
                                4,
                                16
                            ],
                            [
                                4,
                                17
                            ]
                        ],
                        totalDataCodewords: 132,
                        errorCodewordsPerBlock: 20
                    },
                    H: {
                        groups: [
                            [
                                4,
                                12
                            ],
                            [
                                4,
                                13
                            ]
                        ],
                        totalDataCodewords: 100,
                        errorCodewordsPerBlock: 24
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                2,
                                68
                            ],
                            [
                                2,
                                69
                            ]
                        ],
                        totalDataCodewords: 274,
                        errorCodewordsPerBlock: 18
                    },
                    M: {
                        groups: [
                            [
                                4,
                                43
                            ],
                            [
                                1,
                                44
                            ]
                        ],
                        totalDataCodewords: 216,
                        errorCodewordsPerBlock: 26
                    },
                    Q: {
                        groups: [
                            [
                                6,
                                19
                            ],
                            [
                                2,
                                20
                            ]
                        ],
                        totalDataCodewords: 154,
                        errorCodewordsPerBlock: 24
                    },
                    H: {
                        groups: [
                            [
                                6,
                                15
                            ],
                            [
                                2,
                                16
                            ]
                        ],
                        totalDataCodewords: 122,
                        errorCodewordsPerBlock: 28
                    }
                },
                {
                    L: {
                        groups: [[
                                4,
                                81
                            ]],
                        totalDataCodewords: 324,
                        errorCodewordsPerBlock: 20
                    },
                    M: {
                        groups: [
                            [
                                1,
                                50
                            ],
                            [
                                4,
                                51
                            ]
                        ],
                        totalDataCodewords: 254,
                        errorCodewordsPerBlock: 30
                    },
                    Q: {
                        groups: [
                            [
                                4,
                                22
                            ],
                            [
                                4,
                                23
                            ]
                        ],
                        totalDataCodewords: 180,
                        errorCodewordsPerBlock: 28
                    },
                    H: {
                        groups: [
                            [
                                3,
                                12
                            ],
                            [
                                8,
                                13
                            ]
                        ],
                        totalDataCodewords: 140,
                        errorCodewordsPerBlock: 24
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                2,
                                92
                            ],
                            [
                                2,
                                93
                            ]
                        ],
                        totalDataCodewords: 370,
                        errorCodewordsPerBlock: 24
                    },
                    M: {
                        groups: [
                            [
                                6,
                                36
                            ],
                            [
                                2,
                                37
                            ]
                        ],
                        totalDataCodewords: 290,
                        errorCodewordsPerBlock: 22
                    },
                    Q: {
                        groups: [
                            [
                                4,
                                20
                            ],
                            [
                                6,
                                21
                            ]
                        ],
                        totalDataCodewords: 206,
                        errorCodewordsPerBlock: 26
                    },
                    H: {
                        groups: [
                            [
                                7,
                                14
                            ],
                            [
                                4,
                                15
                            ]
                        ],
                        totalDataCodewords: 158,
                        errorCodewordsPerBlock: 28
                    }
                },
                {
                    L: {
                        groups: [[
                                4,
                                107
                            ]],
                        totalDataCodewords: 428,
                        errorCodewordsPerBlock: 26
                    },
                    M: {
                        groups: [
                            [
                                8,
                                37
                            ],
                            [
                                1,
                                38
                            ]
                        ],
                        totalDataCodewords: 334,
                        errorCodewordsPerBlock: 22
                    },
                    Q: {
                        groups: [
                            [
                                8,
                                20
                            ],
                            [
                                4,
                                21
                            ]
                        ],
                        totalDataCodewords: 244,
                        errorCodewordsPerBlock: 24
                    },
                    H: {
                        groups: [
                            [
                                12,
                                11
                            ],
                            [
                                4,
                                12
                            ]
                        ],
                        totalDataCodewords: 180,
                        errorCodewordsPerBlock: 22
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                3,
                                115
                            ],
                            [
                                1,
                                116
                            ]
                        ],
                        totalDataCodewords: 461,
                        errorCodewordsPerBlock: 30
                    },
                    M: {
                        groups: [
                            [
                                4,
                                40
                            ],
                            [
                                5,
                                41
                            ]
                        ],
                        totalDataCodewords: 365,
                        errorCodewordsPerBlock: 24
                    },
                    Q: {
                        groups: [
                            [
                                11,
                                16
                            ],
                            [
                                5,
                                17
                            ]
                        ],
                        totalDataCodewords: 261,
                        errorCodewordsPerBlock: 20
                    },
                    H: {
                        groups: [
                            [
                                11,
                                12
                            ],
                            [
                                5,
                                13
                            ]
                        ],
                        totalDataCodewords: 197,
                        errorCodewordsPerBlock: 24
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                5,
                                87
                            ],
                            [
                                1,
                                88
                            ]
                        ],
                        totalDataCodewords: 523,
                        errorCodewordsPerBlock: 22
                    },
                    M: {
                        groups: [
                            [
                                5,
                                41
                            ],
                            [
                                5,
                                42
                            ]
                        ],
                        totalDataCodewords: 415,
                        errorCodewordsPerBlock: 24
                    },
                    Q: {
                        groups: [
                            [
                                5,
                                24
                            ],
                            [
                                7,
                                25
                            ]
                        ],
                        totalDataCodewords: 295,
                        errorCodewordsPerBlock: 30
                    },
                    H: {
                        groups: [
                            [
                                11,
                                12
                            ],
                            [
                                7,
                                13
                            ]
                        ],
                        totalDataCodewords: 223,
                        errorCodewordsPerBlock: 24
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                5,
                                98
                            ],
                            [
                                1,
                                99
                            ]
                        ],
                        totalDataCodewords: 589,
                        errorCodewordsPerBlock: 24
                    },
                    M: {
                        groups: [
                            [
                                7,
                                45
                            ],
                            [
                                3,
                                46
                            ]
                        ],
                        totalDataCodewords: 453,
                        errorCodewordsPerBlock: 28
                    },
                    Q: {
                        groups: [
                            [
                                15,
                                19
                            ],
                            [
                                2,
                                20
                            ]
                        ],
                        totalDataCodewords: 325,
                        errorCodewordsPerBlock: 24
                    },
                    H: {
                        groups: [
                            [
                                3,
                                15
                            ],
                            [
                                13,
                                16
                            ]
                        ],
                        totalDataCodewords: 253,
                        errorCodewordsPerBlock: 30
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                1,
                                107
                            ],
                            [
                                5,
                                108
                            ]
                        ],
                        totalDataCodewords: 647,
                        errorCodewordsPerBlock: 28
                    },
                    M: {
                        groups: [
                            [
                                10,
                                46
                            ],
                            [
                                1,
                                47
                            ]
                        ],
                        totalDataCodewords: 507,
                        errorCodewordsPerBlock: 28
                    },
                    Q: {
                        groups: [
                            [
                                1,
                                22
                            ],
                            [
                                15,
                                23
                            ]
                        ],
                        totalDataCodewords: 367,
                        errorCodewordsPerBlock: 28
                    },
                    H: {
                        groups: [
                            [
                                2,
                                14
                            ],
                            [
                                17,
                                15
                            ]
                        ],
                        totalDataCodewords: 283,
                        errorCodewordsPerBlock: 28
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                5,
                                120
                            ],
                            [
                                1,
                                121
                            ]
                        ],
                        totalDataCodewords: 721,
                        errorCodewordsPerBlock: 30
                    },
                    M: {
                        groups: [
                            [
                                9,
                                43
                            ],
                            [
                                4,
                                44
                            ]
                        ],
                        totalDataCodewords: 563,
                        errorCodewordsPerBlock: 26
                    },
                    Q: {
                        groups: [
                            [
                                17,
                                22
                            ],
                            [
                                1,
                                23
                            ]
                        ],
                        totalDataCodewords: 397,
                        errorCodewordsPerBlock: 28
                    },
                    H: {
                        groups: [
                            [
                                2,
                                14
                            ],
                            [
                                19,
                                15
                            ]
                        ],
                        totalDataCodewords: 313,
                        errorCodewordsPerBlock: 28
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                3,
                                113
                            ],
                            [
                                4,
                                114
                            ]
                        ],
                        totalDataCodewords: 795,
                        errorCodewordsPerBlock: 28
                    },
                    M: {
                        groups: [
                            [
                                3,
                                44
                            ],
                            [
                                11,
                                45
                            ]
                        ],
                        totalDataCodewords: 627,
                        errorCodewordsPerBlock: 26
                    },
                    Q: {
                        groups: [
                            [
                                17,
                                21
                            ],
                            [
                                4,
                                22
                            ]
                        ],
                        totalDataCodewords: 445,
                        errorCodewordsPerBlock: 26
                    },
                    H: {
                        groups: [
                            [
                                9,
                                13
                            ],
                            [
                                16,
                                14
                            ]
                        ],
                        totalDataCodewords: 341,
                        errorCodewordsPerBlock: 26
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                3,
                                107
                            ],
                            [
                                5,
                                108
                            ]
                        ],
                        totalDataCodewords: 861,
                        errorCodewordsPerBlock: 28
                    },
                    M: {
                        groups: [
                            [
                                3,
                                41
                            ],
                            [
                                13,
                                42
                            ]
                        ],
                        totalDataCodewords: 669,
                        errorCodewordsPerBlock: 26
                    },
                    Q: {
                        groups: [
                            [
                                15,
                                24
                            ],
                            [
                                5,
                                25
                            ]
                        ],
                        totalDataCodewords: 485,
                        errorCodewordsPerBlock: 30
                    },
                    H: {
                        groups: [
                            [
                                15,
                                15
                            ],
                            [
                                10,
                                16
                            ]
                        ],
                        totalDataCodewords: 385,
                        errorCodewordsPerBlock: 28
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                4,
                                116
                            ],
                            [
                                4,
                                117
                            ]
                        ],
                        totalDataCodewords: 932,
                        errorCodewordsPerBlock: 28
                    },
                    M: {
                        groups: [[
                                17,
                                42
                            ]],
                        totalDataCodewords: 714,
                        errorCodewordsPerBlock: 26
                    },
                    Q: {
                        groups: [
                            [
                                17,
                                22
                            ],
                            [
                                6,
                                23
                            ]
                        ],
                        totalDataCodewords: 512,
                        errorCodewordsPerBlock: 28
                    },
                    H: {
                        groups: [
                            [
                                19,
                                16
                            ],
                            [
                                6,
                                17
                            ]
                        ],
                        totalDataCodewords: 406,
                        errorCodewordsPerBlock: 30
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                2,
                                111
                            ],
                            [
                                7,
                                112
                            ]
                        ],
                        totalDataCodewords: 1006,
                        errorCodewordsPerBlock: 28
                    },
                    M: {
                        groups: [[
                                17,
                                46
                            ]],
                        totalDataCodewords: 782,
                        errorCodewordsPerBlock: 28
                    },
                    Q: {
                        groups: [
                            [
                                7,
                                24
                            ],
                            [
                                16,
                                25
                            ]
                        ],
                        totalDataCodewords: 568,
                        errorCodewordsPerBlock: 30
                    },
                    H: {
                        groups: [[
                                34,
                                13
                            ]],
                        totalDataCodewords: 442,
                        errorCodewordsPerBlock: 24
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                4,
                                121
                            ],
                            [
                                5,
                                122
                            ]
                        ],
                        totalDataCodewords: 1094,
                        errorCodewordsPerBlock: 30
                    },
                    M: {
                        groups: [
                            [
                                4,
                                47
                            ],
                            [
                                14,
                                48
                            ]
                        ],
                        totalDataCodewords: 860,
                        errorCodewordsPerBlock: 28
                    },
                    Q: {
                        groups: [
                            [
                                11,
                                24
                            ],
                            [
                                14,
                                25
                            ]
                        ],
                        totalDataCodewords: 614,
                        errorCodewordsPerBlock: 30
                    },
                    H: {
                        groups: [
                            [
                                16,
                                15
                            ],
                            [
                                14,
                                16
                            ]
                        ],
                        totalDataCodewords: 464,
                        errorCodewordsPerBlock: 30
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                6,
                                117
                            ],
                            [
                                4,
                                118
                            ]
                        ],
                        totalDataCodewords: 1174,
                        errorCodewordsPerBlock: 30
                    },
                    M: {
                        groups: [
                            [
                                6,
                                45
                            ],
                            [
                                14,
                                46
                            ]
                        ],
                        totalDataCodewords: 914,
                        errorCodewordsPerBlock: 28
                    },
                    Q: {
                        groups: [
                            [
                                11,
                                24
                            ],
                            [
                                16,
                                25
                            ]
                        ],
                        totalDataCodewords: 664,
                        errorCodewordsPerBlock: 30
                    },
                    H: {
                        groups: [
                            [
                                30,
                                16
                            ],
                            [
                                2,
                                17
                            ]
                        ],
                        totalDataCodewords: 514,
                        errorCodewordsPerBlock: 30
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                8,
                                106
                            ],
                            [
                                4,
                                107
                            ]
                        ],
                        totalDataCodewords: 1276,
                        errorCodewordsPerBlock: 26
                    },
                    M: {
                        groups: [
                            [
                                8,
                                47
                            ],
                            [
                                13,
                                48
                            ]
                        ],
                        totalDataCodewords: 1000,
                        errorCodewordsPerBlock: 28
                    },
                    Q: {
                        groups: [
                            [
                                7,
                                24
                            ],
                            [
                                22,
                                25
                            ]
                        ],
                        totalDataCodewords: 718,
                        errorCodewordsPerBlock: 30
                    },
                    H: {
                        groups: [
                            [
                                22,
                                15
                            ],
                            [
                                13,
                                16
                            ]
                        ],
                        totalDataCodewords: 538,
                        errorCodewordsPerBlock: 30
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                10,
                                114
                            ],
                            [
                                2,
                                115
                            ]
                        ],
                        totalDataCodewords: 1370,
                        errorCodewordsPerBlock: 28
                    },
                    M: {
                        groups: [
                            [
                                19,
                                46
                            ],
                            [
                                4,
                                47
                            ]
                        ],
                        totalDataCodewords: 1062,
                        errorCodewordsPerBlock: 28
                    },
                    Q: {
                        groups: [
                            [
                                28,
                                22
                            ],
                            [
                                6,
                                23
                            ]
                        ],
                        totalDataCodewords: 754,
                        errorCodewordsPerBlock: 28
                    },
                    H: {
                        groups: [
                            [
                                33,
                                16
                            ],
                            [
                                4,
                                17
                            ]
                        ],
                        totalDataCodewords: 596,
                        errorCodewordsPerBlock: 30
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                8,
                                122
                            ],
                            [
                                4,
                                123
                            ]
                        ],
                        totalDataCodewords: 1468,
                        errorCodewordsPerBlock: 30
                    },
                    M: {
                        groups: [
                            [
                                22,
                                45
                            ],
                            [
                                3,
                                46
                            ]
                        ],
                        totalDataCodewords: 1128,
                        errorCodewordsPerBlock: 28
                    },
                    Q: {
                        groups: [
                            [
                                8,
                                23
                            ],
                            [
                                26,
                                24
                            ]
                        ],
                        totalDataCodewords: 808,
                        errorCodewordsPerBlock: 30
                    },
                    H: {
                        groups: [
                            [
                                12,
                                15
                            ],
                            [
                                28,
                                16
                            ]
                        ],
                        totalDataCodewords: 628,
                        errorCodewordsPerBlock: 30
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                3,
                                117
                            ],
                            [
                                10,
                                118
                            ]
                        ],
                        totalDataCodewords: 1531,
                        errorCodewordsPerBlock: 30
                    },
                    M: {
                        groups: [
                            [
                                3,
                                45
                            ],
                            [
                                23,
                                46
                            ]
                        ],
                        totalDataCodewords: 1193,
                        errorCodewordsPerBlock: 28
                    },
                    Q: {
                        groups: [
                            [
                                4,
                                24
                            ],
                            [
                                31,
                                25
                            ]
                        ],
                        totalDataCodewords: 871,
                        errorCodewordsPerBlock: 30
                    },
                    H: {
                        groups: [
                            [
                                11,
                                15
                            ],
                            [
                                31,
                                16
                            ]
                        ],
                        totalDataCodewords: 661,
                        errorCodewordsPerBlock: 30
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                7,
                                116
                            ],
                            [
                                7,
                                117
                            ]
                        ],
                        totalDataCodewords: 1631,
                        errorCodewordsPerBlock: 30
                    },
                    M: {
                        groups: [
                            [
                                21,
                                45
                            ],
                            [
                                7,
                                46
                            ]
                        ],
                        totalDataCodewords: 1267,
                        errorCodewordsPerBlock: 28
                    },
                    Q: {
                        groups: [
                            [
                                1,
                                23
                            ],
                            [
                                37,
                                24
                            ]
                        ],
                        totalDataCodewords: 911,
                        errorCodewordsPerBlock: 30
                    },
                    H: {
                        groups: [
                            [
                                19,
                                15
                            ],
                            [
                                26,
                                16
                            ]
                        ],
                        totalDataCodewords: 701,
                        errorCodewordsPerBlock: 30
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                5,
                                115
                            ],
                            [
                                10,
                                116
                            ]
                        ],
                        totalDataCodewords: 1735,
                        errorCodewordsPerBlock: 30
                    },
                    M: {
                        groups: [
                            [
                                19,
                                47
                            ],
                            [
                                10,
                                48
                            ]
                        ],
                        totalDataCodewords: 1373,
                        errorCodewordsPerBlock: 28
                    },
                    Q: {
                        groups: [
                            [
                                15,
                                24
                            ],
                            [
                                25,
                                25
                            ]
                        ],
                        totalDataCodewords: 985,
                        errorCodewordsPerBlock: 30
                    },
                    H: {
                        groups: [
                            [
                                23,
                                15
                            ],
                            [
                                25,
                                16
                            ]
                        ],
                        totalDataCodewords: 745,
                        errorCodewordsPerBlock: 30
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                13,
                                115
                            ],
                            [
                                3,
                                116
                            ]
                        ],
                        totalDataCodewords: 1843,
                        errorCodewordsPerBlock: 30
                    },
                    M: {
                        groups: [
                            [
                                2,
                                46
                            ],
                            [
                                29,
                                47
                            ]
                        ],
                        totalDataCodewords: 1455,
                        errorCodewordsPerBlock: 28
                    },
                    Q: {
                        groups: [
                            [
                                42,
                                24
                            ],
                            [
                                1,
                                25
                            ]
                        ],
                        totalDataCodewords: 1033,
                        errorCodewordsPerBlock: 30
                    },
                    H: {
                        groups: [
                            [
                                23,
                                15
                            ],
                            [
                                28,
                                16
                            ]
                        ],
                        totalDataCodewords: 793,
                        errorCodewordsPerBlock: 30
                    }
                },
                {
                    L: {
                        groups: [[
                                17,
                                115
                            ]],
                        totalDataCodewords: 1955,
                        errorCodewordsPerBlock: 30
                    },
                    M: {
                        groups: [
                            [
                                10,
                                46
                            ],
                            [
                                23,
                                47
                            ]
                        ],
                        totalDataCodewords: 1541,
                        errorCodewordsPerBlock: 28
                    },
                    Q: {
                        groups: [
                            [
                                10,
                                24
                            ],
                            [
                                35,
                                25
                            ]
                        ],
                        totalDataCodewords: 1115,
                        errorCodewordsPerBlock: 30
                    },
                    H: {
                        groups: [
                            [
                                19,
                                15
                            ],
                            [
                                35,
                                16
                            ]
                        ],
                        totalDataCodewords: 845,
                        errorCodewordsPerBlock: 30
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                17,
                                115
                            ],
                            [
                                1,
                                116
                            ]
                        ],
                        totalDataCodewords: 2071,
                        errorCodewordsPerBlock: 30
                    },
                    M: {
                        groups: [
                            [
                                14,
                                46
                            ],
                            [
                                21,
                                47
                            ]
                        ],
                        totalDataCodewords: 1631,
                        errorCodewordsPerBlock: 28
                    },
                    Q: {
                        groups: [
                            [
                                29,
                                24
                            ],
                            [
                                19,
                                25
                            ]
                        ],
                        totalDataCodewords: 1171,
                        errorCodewordsPerBlock: 30
                    },
                    H: {
                        groups: [
                            [
                                11,
                                15
                            ],
                            [
                                46,
                                16
                            ]
                        ],
                        totalDataCodewords: 901,
                        errorCodewordsPerBlock: 30
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                13,
                                115
                            ],
                            [
                                6,
                                116
                            ]
                        ],
                        totalDataCodewords: 2191,
                        errorCodewordsPerBlock: 30
                    },
                    M: {
                        groups: [
                            [
                                14,
                                46
                            ],
                            [
                                23,
                                47
                            ]
                        ],
                        totalDataCodewords: 1725,
                        errorCodewordsPerBlock: 28
                    },
                    Q: {
                        groups: [
                            [
                                44,
                                24
                            ],
                            [
                                7,
                                25
                            ]
                        ],
                        totalDataCodewords: 1231,
                        errorCodewordsPerBlock: 30
                    },
                    H: {
                        groups: [
                            [
                                59,
                                16
                            ],
                            [
                                1,
                                17
                            ]
                        ],
                        totalDataCodewords: 961,
                        errorCodewordsPerBlock: 30
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                12,
                                121
                            ],
                            [
                                7,
                                122
                            ]
                        ],
                        totalDataCodewords: 2306,
                        errorCodewordsPerBlock: 30
                    },
                    M: {
                        groups: [
                            [
                                12,
                                47
                            ],
                            [
                                26,
                                48
                            ]
                        ],
                        totalDataCodewords: 1812,
                        errorCodewordsPerBlock: 28
                    },
                    Q: {
                        groups: [
                            [
                                39,
                                24
                            ],
                            [
                                14,
                                25
                            ]
                        ],
                        totalDataCodewords: 1286,
                        errorCodewordsPerBlock: 30
                    },
                    H: {
                        groups: [
                            [
                                22,
                                15
                            ],
                            [
                                41,
                                16
                            ]
                        ],
                        totalDataCodewords: 986,
                        errorCodewordsPerBlock: 30
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                6,
                                121
                            ],
                            [
                                14,
                                122
                            ]
                        ],
                        totalDataCodewords: 2434,
                        errorCodewordsPerBlock: 30
                    },
                    M: {
                        groups: [
                            [
                                6,
                                47
                            ],
                            [
                                34,
                                48
                            ]
                        ],
                        totalDataCodewords: 1914,
                        errorCodewordsPerBlock: 28
                    },
                    Q: {
                        groups: [
                            [
                                46,
                                24
                            ],
                            [
                                10,
                                25
                            ]
                        ],
                        totalDataCodewords: 1354,
                        errorCodewordsPerBlock: 30
                    },
                    H: {
                        groups: [
                            [
                                2,
                                15
                            ],
                            [
                                64,
                                16
                            ]
                        ],
                        totalDataCodewords: 1054,
                        errorCodewordsPerBlock: 30
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                17,
                                122
                            ],
                            [
                                4,
                                123
                            ]
                        ],
                        totalDataCodewords: 2566,
                        errorCodewordsPerBlock: 30
                    },
                    M: {
                        groups: [
                            [
                                29,
                                46
                            ],
                            [
                                14,
                                47
                            ]
                        ],
                        totalDataCodewords: 1992,
                        errorCodewordsPerBlock: 28
                    },
                    Q: {
                        groups: [
                            [
                                49,
                                24
                            ],
                            [
                                10,
                                25
                            ]
                        ],
                        totalDataCodewords: 1426,
                        errorCodewordsPerBlock: 30
                    },
                    H: {
                        groups: [
                            [
                                24,
                                15
                            ],
                            [
                                46,
                                16
                            ]
                        ],
                        totalDataCodewords: 1096,
                        errorCodewordsPerBlock: 30
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                4,
                                122
                            ],
                            [
                                18,
                                123
                            ]
                        ],
                        totalDataCodewords: 2702,
                        errorCodewordsPerBlock: 30
                    },
                    M: {
                        groups: [
                            [
                                13,
                                46
                            ],
                            [
                                32,
                                47
                            ]
                        ],
                        totalDataCodewords: 2102,
                        errorCodewordsPerBlock: 28
                    },
                    Q: {
                        groups: [
                            [
                                48,
                                24
                            ],
                            [
                                14,
                                25
                            ]
                        ],
                        totalDataCodewords: 1502,
                        errorCodewordsPerBlock: 30
                    },
                    H: {
                        groups: [
                            [
                                42,
                                15
                            ],
                            [
                                32,
                                16
                            ]
                        ],
                        totalDataCodewords: 1142,
                        errorCodewordsPerBlock: 30
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                20,
                                117
                            ],
                            [
                                4,
                                118
                            ]
                        ],
                        totalDataCodewords: 2812,
                        errorCodewordsPerBlock: 30
                    },
                    M: {
                        groups: [
                            [
                                40,
                                47
                            ],
                            [
                                7,
                                48
                            ]
                        ],
                        totalDataCodewords: 2216,
                        errorCodewordsPerBlock: 28
                    },
                    Q: {
                        groups: [
                            [
                                43,
                                24
                            ],
                            [
                                22,
                                25
                            ]
                        ],
                        totalDataCodewords: 1582,
                        errorCodewordsPerBlock: 30
                    },
                    H: {
                        groups: [
                            [
                                10,
                                15
                            ],
                            [
                                67,
                                16
                            ]
                        ],
                        totalDataCodewords: 1222,
                        errorCodewordsPerBlock: 30
                    }
                },
                {
                    L: {
                        groups: [
                            [
                                19,
                                118
                            ],
                            [
                                6,
                                119
                            ]
                        ],
                        totalDataCodewords: 2956,
                        errorCodewordsPerBlock: 30
                    },
                    M: {
                        groups: [
                            [
                                18,
                                47
                            ],
                            [
                                31,
                                48
                            ]
                        ],
                        totalDataCodewords: 2334,
                        errorCodewordsPerBlock: 28
                    },
                    Q: {
                        groups: [
                            [
                                34,
                                24
                            ],
                            [
                                34,
                                25
                            ]
                        ],
                        totalDataCodewords: 1666,
                        errorCodewordsPerBlock: 30
                    },
                    H: {
                        groups: [
                            [
                                20,
                                15
                            ],
                            [
                                61,
                                16
                            ]
                        ],
                        totalDataCodewords: 1276,
                        errorCodewordsPerBlock: 30
                    }
                }
            ], finderPattern = [
                1,
                0,
                1,
                1,
                1
            ], alignmentPattern = [
                1,
                0,
                1
            ], errorCorrectionPatterns = {
                L: '01',
                M: '00',
                Q: '11',
                H: '10'
            }, formatMaskPattern = '101010000010010', formatGeneratorPolynomial = '10100110111', versionGeneratorPolynomial = '1111100100101', paddingCodewords = [
                '11101100',
                '00010001'
            ], finderPatternValue = 93, maskPatternConditions = [
                function (row, column) {
                    return (row + column) % 2 === 0;
                },
                function (row) {
                    return row % 2 === 0;
                },
                function (row, column) {
                    return column % 3 === 0;
                },
                function (row, column) {
                    return (row + column) % 3 === 0;
                },
                function (row, column) {
                    return (Math.floor(row / 2) + Math.floor(column / 3)) % 2 === 0;
                },
                function (row, column) {
                    return row * column % 2 + row * column % 3 === 0;
                },
                function (row, column) {
                    return (row * column % 2 + row * column % 3) % 2 === 0;
                },
                function (row, column) {
                    return ((row + column) % 2 + row * column % 3) % 2 === 0;
                }
            ], numberRegex = /^\d+/, alphaPattern = 'A-Z0-9 $%*+./:-', alphaExclusiveSet = 'A-Z $%*+./:-', alphaRegex = new RegExp('^[' + alphaExclusiveSet + ']+'), alphaNumericRegex = new RegExp('^[' + alphaPattern + ']+'), byteRegex = new RegExp('^[^' + alphaPattern + ']+'), initMinNumericBeforeAlpha = 8, initMinNumericBeforeByte = 5, initMinAlphaBeforeByte = 8, minNumericBeforeAlpha = 17, minNumericBeforeByte = 9, minAlphaBeforeByte = 16, round = Math.round;
        function toDecimal(value) {
            return parseInt(value, 2);
        }
        function toBitsString(value, length) {
            var result = Number(value).toString(2);
            if (result.length < length) {
                result = new Array(length - result.length + 1).join(0) + result;
            }
            return result;
        }
        function splitInto(str, n) {
            var result = [], idx = 0;
            while (idx < str.length) {
                result.push(str.substring(idx, idx + n));
                idx += n;
            }
            return result;
        }
        var QRDataMode = suix.Class.extend({
            getVersionIndex: function (version) {
                if (version < 10) {
                    return 0;
                } else if (version > 26) {
                    return 2;
                }
                return 1;
            },
            getBitsCharacterCount: function (version) {
                var mode = this;
                return mode.bitsInCharacterCount[mode.getVersionIndex(version || 40)];
            },
            getModeCountString: function (length, version) {
                var mode = this;
                return mode.modeIndicator + toBitsString(length, mode.getBitsCharacterCount(version));
            },
            encode: function () {
            },
            getStringBitsLength: function () {
            },
            getValue: function () {
            },
            modeIndicator: '',
            bitsInCharacterCount: []
        });
        var modes = {};
        modes[NUMERIC] = QRDataMode.extend({
            bitsInCharacterCount: [
                10,
                12,
                14
            ],
            modeIndicator: '0001',
            getValue: function (character) {
                return parseInt(character, 10);
            },
            encode: function (str, version) {
                var mode = this, parts = splitInto(str, 3), result = mode.getModeCountString(str.length, version);
                for (var i = 0; i < parts.length - 1; i++) {
                    result += toBitsString(parts[i], 10);
                }
                return result + toBitsString(parts[i], 1 + 3 * parts[i].length);
            },
            getStringBitsLength: function (inputLength, version) {
                var mod3 = inputLength % 3;
                return 4 + this.getBitsCharacterCount(version) + 10 * Math.floor(inputLength / 3) + 3 * mod3 + (mod3 === 0 ? 0 : 1);
            }
        });
        modes[ALPHA_NUMERIC] = QRDataMode.extend({
            characters: {
                '0': 0,
                '1': 1,
                '2': 2,
                '3': 3,
                '4': 4,
                '5': 5,
                '6': 6,
                '7': 7,
                '8': 8,
                '9': 9,
                'A': 10,
                'B': 11,
                'C': 12,
                'D': 13,
                'E': 14,
                'F': 15,
                'G': 16,
                'H': 17,
                'I': 18,
                'J': 19,
                'K': 20,
                'L': 21,
                'M': 22,
                'N': 23,
                'O': 24,
                'P': 25,
                'Q': 26,
                'R': 27,
                'S': 28,
                'T': 29,
                'U': 30,
                'V': 31,
                'W': 32,
                'X': 33,
                'Y': 34,
                'Z': 35,
                ' ': 36,
                '$': 37,
                '%': 38,
                '*': 39,
                '+': 40,
                '-': 41,
                '.': 42,
                '/': 43,
                ':': 44
            },
            bitsInCharacterCount: [
                9,
                11,
                13
            ],
            modeIndicator: '0010',
            getValue: function (character) {
                return this.characters[character];
            },
            encode: function (str, version) {
                var mode = this, parts = splitInto(str, 2), result = mode.getModeCountString(str.length, version), value;
                for (var i = 0; i < parts.length - 1; i++) {
                    value = 45 * mode.getValue(parts[i].charAt(0)) + mode.getValue(parts[i].charAt(1));
                    result += toBitsString(value, 11);
                }
                value = parts[i].length == 2 ? 45 * mode.getValue(parts[i].charAt(0)) + mode.getValue(parts[i].charAt(1)) : mode.getValue(parts[i].charAt(0));
                return result + toBitsString(value, 1 + 5 * parts[i].length);
            },
            getStringBitsLength: function (inputLength, version) {
                return 4 + this.getBitsCharacterCount(version) + 11 * Math.floor(inputLength / 2) + 6 * (inputLength % 2);
            }
        });
        modes[BYTE] = QRDataMode.extend({
            bitsInCharacterCount: [
                8,
                16,
                16
            ],
            modeIndicator: '0100',
            getValue: function (character) {
                var code = character.charCodeAt(0);
                if (code <= 127 || 160 <= code && code <= 255) {
                    return code;
                } else {
                    throw new Error('Unsupported character: ' + character);
                }
            },
            encode: function (str, version) {
                var mode = this, result = mode.getModeCountString(str.length, version);
                for (var i = 0; i < str.length; i++) {
                    result += toBitsString(mode.getValue(str.charAt(i)), 8);
                }
                return result;
            },
            getStringBitsLength: function (inputLength, version) {
                return 4 + this.getBitsCharacterCount(version) + 8 * inputLength;
            }
        });
        var modeInstances = {};
        for (var mode in modes) {
            modeInstances[mode] = new modes[mode]();
        }
        var FreeCellVisitor = function (matrix) {
            var that = this, row = matrix.length - 1, column = matrix.length - 1, startColumn = column, dir = -1, c = 0;
            that.move = function () {
                row += dir * c;
                c ^= 1;
                column = startColumn - c;
            };
            that.getNextCell = function () {
                while (matrix[row][column] !== undefined) {
                    that.move();
                    if (row < 0 || row >= matrix.length) {
                        dir = -dir;
                        startColumn -= startColumn != 8 ? 2 : 3;
                        column = startColumn;
                        row = dir < 0 ? matrix.length - 1 : 0;
                    }
                }
                return {
                    row: row,
                    column: column
                };
            };
            that.getNextRemainderCell = function () {
                that.move();
                if (matrix[row][column] === undefined) {
                    return {
                        row: row,
                        column: column
                    };
                }
            };
        };
        function fillFunctionCell(matrices, bit, x, y) {
            for (var i = 0; i < matrices.length; i++) {
                matrices[i][x][y] = bit;
            }
        }
        function fillDataCell(matrices, bit, x, y) {
            for (var i = 0; i < maskPatternConditions.length; i++) {
                matrices[i][x][y] = maskPatternConditions[i](x, y) ? bit ^ 1 : parseInt(bit, 10);
            }
        }
        var fillData = function (matrices, blocks) {
            var cellVisitor = new FreeCellVisitor(matrices[0]), block, codewordIdx, cell;
            for (var blockIdx = 0; blockIdx < blocks.length; blockIdx++) {
                block = blocks[blockIdx];
                codewordIdx = 0;
                while (block.length > 0) {
                    for (var i = 0; i < block.length; i++) {
                        for (var j = 0; j < 8; j++) {
                            cell = cellVisitor.getNextCell();
                            fillDataCell(matrices, block[i][codewordIdx].charAt(j), cell.row, cell.column);
                        }
                    }
                    codewordIdx++;
                    while (block[0] && codewordIdx == block[0].length) {
                        block.splice(0, 1);
                    }
                }
            }
            while (cell = cellVisitor.getNextRemainderCell()) {
                fillDataCell(matrices, 0, cell.row, cell.column);
            }
        };
        var padDataString = function (dataString, totalDataCodewords) {
            var dataBitsCount = totalDataCodewords * 8, terminatorIndex = 0, paddingCodewordIndex = 0;
            while (dataString.length < dataBitsCount && terminatorIndex < terminator.length) {
                dataString += terminator.charAt(terminatorIndex++);
            }
            if (dataString.length % 8 !== 0) {
                dataString += new Array(9 - dataString.length % 8).join('0');
            }
            while (dataString.length < dataBitsCount) {
                dataString += paddingCodewords[paddingCodewordIndex];
                paddingCodewordIndex ^= 1;
            }
            return dataString;
        };
        function generatePowersOfTwo() {
            var result;
            for (var power = 1; power < 255; power++) {
                result = powersOfTwoResult[power - 1] * 2;
                if (result > 255) {
                    result = result ^ 285;
                }
                powersOfTwoResult[power] = result;
                powersOfTwo[result] = power;
            }
            result = powersOfTwoResult[power - 1] * 2 ^ 285;
            powersOfTwoResult[power] = result;
            powersOfTwoResult[-1] = 0;
        }
        var xorPolynomials = function (x, y) {
            var result = [], idx = x.length - 2;
            for (var i = idx; i >= 0; i--) {
                result[i] = x[i] ^ y[i];
            }
            return result;
        };
        var multiplyPolynomials = function (x, y) {
            var result = [];
            for (var i = 0; i < x.length; i++) {
                for (var j = 0; j < y.length; j++) {
                    if (result[i + j] === undefined) {
                        result[i + j] = (x[i] + (y[j] >= 0 ? y[j] : 0)) % 255;
                    } else {
                        result[i + j] = powersOfTwo[powersOfTwoResult[result[i + j]] ^ powersOfTwoResult[(x[i] + y[j]) % 255]];
                    }
                }
            }
            return result;
        };
        function generateGeneratorPolynomials() {
            var maxErrorCorrectionCodeWordsCount = 68;
            for (var idx = 2; idx <= maxErrorCorrectionCodeWordsCount; idx++) {
                var firstPolynomial = generatorPolynomials[idx - 1], secondPolynomial = [
                        idx,
                        0
                    ];
                generatorPolynomials[idx] = multiplyPolynomials(firstPolynomial, secondPolynomial);
            }
        }
        generatePowersOfTwo();
        generateGeneratorPolynomials();
        function multiplyByConstant(polynomial, power) {
            var result = [], idx = polynomial.length - 1;
            do {
                result[idx] = powersOfTwoResult[(polynomial[idx] + power) % 255];
                idx--;
            } while (polynomial[idx] !== undefined);
            return result;
        }
        var generateErrorCodewords = function (data, errorCodewordsCount) {
            var generator = generatorPolynomials[errorCodewordsCount - 1], result = new Array(errorCodewordsCount).concat(data), generatorPolynomial = new Array(result.length - generator.length).concat(generator), steps = data.length, errorCodewords = [], divisor, idx;
            for (idx = 0; idx < steps; idx++) {
                divisor = multiplyByConstant(generatorPolynomial, powersOfTwo[result[result.length - 1]]);
                generatorPolynomial.splice(0, 1);
                result = xorPolynomials(divisor, result);
            }
            for (idx = result.length - 1; idx >= 0; idx--) {
                errorCodewords[errorCodewordsCount - 1 - idx] = toBitsString(result[idx], 8);
            }
            return errorCodewords;
        };
        var getBlocks = function (dataStream, versionCodewordsInformation) {
            var codewordStart = 0, dataBlocks = [], errorBlocks = [], dataBlock, versionGroups = versionCodewordsInformation.groups, blockCodewordsCount, groupBlocksCount, messagePolynomial, codeword;
            for (var groupIdx = 0; groupIdx < versionGroups.length; groupIdx++) {
                groupBlocksCount = versionGroups[groupIdx][0];
                for (var blockIdx = 0; blockIdx < groupBlocksCount; blockIdx++) {
                    blockCodewordsCount = versionGroups[groupIdx][1];
                    dataBlock = [];
                    messagePolynomial = [];
                    for (var codewordIdx = 1; codewordIdx <= blockCodewordsCount; codewordIdx++) {
                        codeword = dataStream.substring(codewordStart, codewordStart + 8);
                        dataBlock.push(codeword);
                        messagePolynomial[blockCodewordsCount - codewordIdx] = toDecimal(codeword);
                        codewordStart += 8;
                    }
                    dataBlocks.push(dataBlock);
                    errorBlocks.push(generateErrorCodewords(messagePolynomial, versionCodewordsInformation.errorCodewordsPerBlock));
                }
            }
            return [
                dataBlocks,
                errorBlocks
            ];
        };
        var chooseMode = function (str, minNumericBeforeAlpha, minNumericBeforeByte, minAlphaBeforeByte, previousMode) {
            var numeric = numberRegex.exec(str), numericMatch = numeric ? numeric[0] : '', alpha = alphaRegex.exec(str), alphaMatch = alpha ? alpha[0] : '', alphaNumeric = alphaNumericRegex.exec(str), alphaNumericMatch = alphaNumeric ? alphaNumeric[0] : '', mode, modeString;
            if (numericMatch && (numericMatch.length >= minNumericBeforeAlpha || str.length == numericMatch.length || numericMatch.length >= minNumericBeforeByte && !alphaNumericRegex.test(str.charAt(numericMatch.length)))) {
                mode = NUMERIC;
                modeString = numericMatch;
            } else if (alphaNumericMatch && (str.length == alphaNumericMatch.length || alphaNumericMatch.length >= minAlphaBeforeByte || previousMode == ALPHA_NUMERIC)) {
                mode = ALPHA_NUMERIC;
                modeString = numericMatch || alphaMatch;
            } else {
                mode = BYTE;
                if (alphaNumericMatch) {
                    modeString = alphaNumericMatch + byteRegex.exec(str.substring(alphaNumericMatch.length))[0];
                } else {
                    modeString = byteRegex.exec(str)[0];
                }
            }
            return {
                mode: mode,
                modeString: modeString
            };
        };
        var getModes = function (str) {
            var modes = [], previousMode, idx = 0;
            modes.push(chooseMode(str, initMinNumericBeforeAlpha, initMinNumericBeforeByte, initMinAlphaBeforeByte, previousMode));
            previousMode = modes[0].mode;
            str = str.substr(modes[0].modeString.length);
            while (str.length > 0) {
                var nextMode = chooseMode(str, minNumericBeforeAlpha, minNumericBeforeByte, minAlphaBeforeByte, previousMode);
                if (nextMode.mode != previousMode) {
                    previousMode = nextMode.mode;
                    modes.push(nextMode);
                    idx++;
                } else {
                    modes[idx].modeString += nextMode.modeString;
                }
                str = str.substr(nextMode.modeString.length);
            }
            return modes;
        };
        var getDataCodewordsCount = function (modes) {
            var length = 0, mode;
            for (var i = 0; i < modes.length; i++) {
                mode = modeInstances[modes[i].mode];
                length += mode.getStringBitsLength(modes[i].modeString.length);
            }
            return Math.ceil(length / 8);
        };
        var getVersion = function (dataCodewordsCount, errorCorrectionLevel) {
            var x = 0, y = versionsCodewordsInformation.length - 1, version = Math.floor(versionsCodewordsInformation.length / 2);
            do {
                if (dataCodewordsCount < versionsCodewordsInformation[version][errorCorrectionLevel].totalDataCodewords) {
                    y = version;
                } else {
                    x = version;
                }
                version = x + Math.floor((y - x) / 2);
            } while (y - x > 1);
            if (dataCodewordsCount <= versionsCodewordsInformation[x][errorCorrectionLevel].totalDataCodewords) {
                return version + 1;
            }
            return y + 1;
        };
        var getDataString = function (modes, version) {
            var dataString = '', mode;
            for (var i = 0; i < modes.length; i++) {
                mode = modeInstances[modes[i].mode];
                dataString += mode.encode(modes[i].modeString, version);
            }
            return dataString;
        };
        var encodeFormatInformation = function (format) {
            var formatNumber = toDecimal(format), encodedString, result = '';
            if (formatNumber === 0) {
                return '101010000010010';
            } else {
                encodedString = encodeBCH(toDecimal(format), formatGeneratorPolynomial, 15);
            }
            for (var i = 0; i < encodedString.length; i++) {
                result += encodedString.charAt(i) ^ formatMaskPattern.charAt(i);
            }
            return result;
        };
        var encodeBCH = function (value, generatorPolynomial, codeLength) {
            var generatorNumber = toDecimal(generatorPolynomial), polynomialLength = generatorPolynomial.length - 1, valueNumber = value << polynomialLength, length = codeLength - polynomialLength, valueString = toBitsString(value, length), result = dividePolynomials(valueNumber, generatorNumber);
            result = valueString + toBitsString(result, polynomialLength);
            return result;
        };
        var dividePolynomials = function (numberX, numberY) {
            var yLength = numberY.toString(2).length, xLength = numberX.toString(2).length;
            do {
                numberX ^= numberY << xLength - yLength;
                xLength = numberX.toString(2).length;
            } while (xLength >= yLength);
            return numberX;
        };
        function getNumberAt(str, idx) {
            return parseInt(str.charAt(idx), 10);
        }
        var initMatrices = function (version) {
            var matrices = [], modules = 17 + 4 * version;
            for (var i = 0; i < maskPatternConditions.length; i++) {
                matrices[i] = new Array(modules);
                for (var j = 0; j < modules; j++) {
                    matrices[i][j] = new Array(modules);
                }
            }
            return matrices;
        };
        var addFormatInformation = function (matrices, formatString) {
            var matrix = matrices[0], x, y, idx = 0, length = formatString.length;
            for (x = 0, y = 8; x <= 8; x++) {
                if (x !== 6) {
                    fillFunctionCell(matrices, getNumberAt(formatString, length - 1 - idx++), x, y);
                }
            }
            for (x = 8, y = 7; y >= 0; y--) {
                if (y !== 6) {
                    fillFunctionCell(matrices, getNumberAt(formatString, length - 1 - idx++), x, y);
                }
            }
            idx = 0;
            for (y = matrix.length - 1, x = 8; y >= matrix.length - 8; y--) {
                fillFunctionCell(matrices, getNumberAt(formatString, length - 1 - idx++), x, y);
            }
            fillFunctionCell(matrices, 1, matrix.length - 8, 8);
            for (x = matrix.length - 7, y = 8; x < matrix.length; x++) {
                fillFunctionCell(matrices, getNumberAt(formatString, length - 1 - idx++), x, y);
            }
        };
        var encodeVersionInformation = function (version) {
            return encodeBCH(version, versionGeneratorPolynomial, 18);
        };
        var addVersionInformation = function (matrices, dataString) {
            var matrix = matrices[0], modules = matrix.length, x1 = 0, y1 = modules - 11, x2 = modules - 11, y2 = 0, quotient, mod, value;
            for (var idx = 0; idx < dataString.length; idx++) {
                quotient = Math.floor(idx / 3);
                mod = idx % 3;
                value = getNumberAt(dataString, dataString.length - idx - 1);
                fillFunctionCell(matrices, value, x1 + quotient, y1 + mod);
                fillFunctionCell(matrices, value, x2 + mod, y2 + quotient);
            }
        };
        var addCentricPattern = function (matrices, pattern, x, y) {
            var size = pattern.length + 2, length = pattern.length + 1, value;
            for (var i = 0; i < pattern.length; i++) {
                for (var j = i; j < size - i; j++) {
                    value = pattern[i];
                    fillFunctionCell(matrices, value, x + j, y + i);
                    fillFunctionCell(matrices, value, x + i, y + j);
                    fillFunctionCell(matrices, value, x + length - j, y + length - i);
                    fillFunctionCell(matrices, value, x + length - i, y + length - j);
                }
            }
        };
        var addFinderSeparator = function (matrices, direction, x, y) {
            var nextX = x, nextY = y, matrix = matrices[0];
            do {
                fillFunctionCell(matrices, 0, nextX, y);
                fillFunctionCell(matrices, 0, x, nextY);
                nextX += direction[0];
                nextY += direction[1];
            } while (nextX >= 0 && nextX < matrix.length);
        };
        var addFinderPatterns = function (matrices) {
            var modules = matrices[0].length;
            addCentricPattern(matrices, finderPattern, 0, 0);
            addFinderSeparator(matrices, [
                -1,
                -1
            ], 7, 7);
            addCentricPattern(matrices, finderPattern, modules - 7, 0);
            addFinderSeparator(matrices, [
                1,
                -1
            ], modules - 8, 7);
            addCentricPattern(matrices, finderPattern, 0, modules - 7);
            addFinderSeparator(matrices, [
                -1,
                1
            ], 7, modules - 8);
        };
        var addAlignmentPatterns = function (matrices, version) {
            if (version < 2) {
                return;
            }
            var matrix = matrices[0], modules = matrix.length, pointsCount = Math.floor(version / 7), points = [6], startDistance, distance, idx = 0;
            if (startDistance = irregularAlignmentPatternsStartDistance[version]) {
                distance = (modules - 13 - startDistance) / pointsCount;
            } else {
                startDistance = distance = (modules - 13) / (pointsCount + 1);
            }
            points.push(points[idx++] + startDistance);
            while (points[idx] + distance < modules) {
                points.push(points[idx++] + distance);
            }
            for (var i = 0; i < points.length; i++) {
                for (var j = 0; j < points.length; j++) {
                    if (matrix[points[i]][points[j]] === undefined) {
                        addCentricPattern(matrices, alignmentPattern, points[i] - 2, points[j] - 2);
                    }
                }
            }
        };
        var addTimingFunctions = function (matrices) {
            var row = 6, column = 6, value = 1, modules = matrices[0].length;
            for (var i = 8; i < modules - 8; i++) {
                fillFunctionCell(matrices, value, row, i);
                fillFunctionCell(matrices, value, i, column);
                value ^= 1;
            }
        };
        var scoreMaskMatrixes = function (matrices) {
            var scores = [], previousBits = [], darkModules = [], patterns = [], adjacentSameBits = [], matrix, i, row = 0, column = 1, modules = matrices[0].length;
            for (i = 0; i < matrices.length; i++) {
                scores[i] = 0;
                darkModules[i] = 0;
                adjacentSameBits[i] = [
                    0,
                    0
                ];
                patterns[i] = [
                    0,
                    0
                ];
                previousBits[i] = [];
            }
            for (i = 0; i < modules; i++) {
                for (var j = 0; j < modules; j++) {
                    for (var k = 0; k < matrices.length; k++) {
                        matrix = matrices[k];
                        darkModules[k] += parseInt(matrix[i][j], 10);
                        if (previousBits[k][row] === matrix[i][j] && i + 1 < modules && j - 1 >= 0 && matrix[i + 1][j] == previousBits[k][row] && matrix[i + 1][j - 1] == previousBits[k][row]) {
                            scores[k] += 3;
                        }
                        scoreFinderPatternOccurance(k, patterns, scores, row, matrix[i][j]);
                        scoreFinderPatternOccurance(k, patterns, scores, column, matrix[j][i]);
                        scoreAdjacentSameBits(k, scores, previousBits, matrix[i][j], adjacentSameBits, row);
                        scoreAdjacentSameBits(k, scores, previousBits, matrix[j][i], adjacentSameBits, column);
                    }
                }
            }
            var total = modules * modules, minIdx, min = Number.MAX_VALUE;
            for (i = 0; i < scores.length; i++) {
                scores[i] += calculateDarkModulesRatioScore(darkModules[i], total);
                if (scores[i] < min) {
                    min = scores[i];
                    minIdx = i;
                }
            }
            return minIdx;
        };
        function scoreFinderPatternOccurance(idx, patterns, scores, rowColumn, bit) {
            patterns[idx][rowColumn] = (patterns[idx][rowColumn] << 1 ^ bit) % 128;
            if (patterns[idx][rowColumn] == finderPatternValue) {
                scores[idx] += 40;
            }
        }
        function scoreAdjacentSameBits(idx, scores, previousBits, bit, adjacentBits, rowColumn) {
            if (previousBits[idx][rowColumn] == bit) {
                adjacentBits[idx][rowColumn]++;
            } else {
                previousBits[idx][rowColumn] = bit;
                if (adjacentBits[idx][rowColumn] >= 5) {
                    scores[idx] += 3 + adjacentBits[idx][rowColumn] - 5;
                }
                adjacentBits[idx][rowColumn] = 1;
            }
        }
        function calculateDarkModulesRatioScore(darkModules, total) {
            var percent = Math.floor(darkModules / total * 100), mod5 = percent % 5, previous = Math.abs(percent - mod5 - 50), next = Math.abs(percent + 5 - mod5 - 50), score = 10 * Math.min(previous / 5, next / 5);
            return score;
        }
        var EncodingResult = function (dataString, version) {
            this.dataString = dataString;
            this.version = version;
        };
        var IsoEncoder = function () {
            this.getEncodingResult = function (inputString, errorCorrectionLevel) {
                var modes = getModes(inputString), dataCodewordsCount = getDataCodewordsCount(modes), version = getVersion(dataCodewordsCount, errorCorrectionLevel), dataString = getDataString(modes, version);
                return new EncodingResult(dataString, version);
            };
        };
        var UTF8Encoder = function () {
            this.mode = modeInstances[this.encodingMode];
        };
        UTF8Encoder.fn = UTF8Encoder.prototype = {
            encodingMode: BYTE,
            utfBOM: '111011111011101110111111',
            initialModeCountStringLength: 20,
            getEncodingResult: function (inputString, errorCorrectionLevel) {
                var that = this, data = that.encode(inputString), dataCodewordsCount = that.getDataCodewordsCount(data), version = getVersion(dataCodewordsCount, errorCorrectionLevel), dataString = that.mode.getModeCountString(data.length / 8, version) + data;
                return new EncodingResult(dataString, version);
            },
            getDataCodewordsCount: function (data) {
                var that = this, dataLength = data.length, dataCodewordsCount = Math.ceil((that.initialModeCountStringLength + dataLength) / 8);
                return dataCodewordsCount;
            },
            encode: function (str) {
                var that = this, result = that.utfBOM;
                for (var i = 0; i < str.length; i++) {
                    result += that.encodeCharacter(str.charCodeAt(i));
                }
                return result;
            },
            encodeCharacter: function (code) {
                var bytesCount = this.getBytesCount(code), bc = bytesCount - 1, result = '';
                if (bytesCount == 1) {
                    result = toBitsString(code, 8);
                } else {
                    var significantOnes = 8 - bytesCount;
                    for (var i = 0; i < bc; i++) {
                        result = toBitsString(code >> i * 6 & 63 | 128, 8) + result;
                    }
                    result = (code >> bc * 6 | 255 >> significantOnes << significantOnes).toString(2) + result;
                }
                return result;
            },
            getBytesCount: function (code) {
                var ranges = this.ranges;
                for (var i = 0; i < ranges.length; i++) {
                    if (code < ranges[i]) {
                        return i + 1;
                    }
                }
            },
            ranges: [
                128,
                2048,
                65536,
                2097152,
                67108864
            ]
        };
        var QRCodeDataEncoder = function (encoding) {
            if (encoding && encoding.toLowerCase().indexOf('utf_8') >= 0) {
                return new UTF8Encoder();
            } else {
                return new IsoEncoder();
            }
        };
        var encodeData = function (inputString, errorCorrectionLevel, encoding) {
            var encoder = new QRCodeDataEncoder(encoding), encodingResult = encoder.getEncodingResult(inputString, errorCorrectionLevel), version = encodingResult.version, versionInformation = versionsCodewordsInformation[version - 1][errorCorrectionLevel], dataString = padDataString(encodingResult.dataString, versionInformation.totalDataCodewords), blocks = getBlocks(dataString, versionInformation), matrices = initMatrices(version);
            addFinderPatterns(matrices);
            addAlignmentPatterns(matrices, version);
            addTimingFunctions(matrices);
            if (version >= 7) {
                addVersionInformation(matrices, toBitsString(0, 18));
            }
            addFormatInformation(matrices, toBitsString(0, 15));
            fillData(matrices, blocks);
            var minIdx = scoreMaskMatrixes(matrices), optimalMatrix = matrices[minIdx];
            if (version >= 7) {
                addVersionInformation([optimalMatrix], encodeVersionInformation(version));
            }
            var formatString = errorCorrectionPatterns[errorCorrectionLevel] + toBitsString(minIdx, 3);
            addFormatInformation([optimalMatrix], encodeFormatInformation(formatString));
            return optimalMatrix;
        };
        var QRCodeDefaults = {
            DEFAULT_SIZE: 200,
            QUIET_ZONE_LENGTH: 4,
            DEFAULT_ERROR_CORRECTION_LEVEL: 'L',
            DEFAULT_BACKGROUND: '#fff',
            DEFAULT_DARK_MODULE_COLOR: '#000',
            MIN_BASE_UNIT_SIZE: 1
        };
        var QRCode = Widget.extend({
            init: function (element, options) {
                var that = this;
                Widget.fn.init.call(that, element, options);
                that.element = $(element);
                that.wrapper = that.element;
                that.element.addClass('k-qrcode');
                that.surfaceWrap = $('<div />').css('position', 'relative').appendTo(this.element);
                that.surface = draw.Surface.create(that.surfaceWrap, { type: that.options.renderAs });
                that.setOptions(options);
            },
            redraw: function () {
                var size = this._getSize();
                this.surfaceWrap.css({
                    width: size,
                    height: size
                });
                this.surface.clear();
                this.surface.resize();
                this.createVisual();
                this.surface.draw(this.visual);
            },
            getSize: function () {
                return suix.dimensions(this.element);
            },
            _resize: function () {
                this.redraw();
            },
            createVisual: function () {
                this.visual = this._render();
            },
            exportVisual: function () {
                return this._render();
            },
            _render: function () {
                var that = this, value = that._value, baseUnit, border = that.options.border || {}, padding = that.options.padding || 0, borderWidth = border.width || 0, quietZoneSize, matrix, size, dataSize, contentSize;
                border.width = borderWidth;
                var visual = new draw.Group();
                if (value) {
                    matrix = encodeData(value, that.options.errorCorrection, that.options.encoding);
                    size = that._getSize();
                    contentSize = size - 2 * (borderWidth + padding);
                    baseUnit = that._calculateBaseUnit(contentSize, matrix.length);
                    dataSize = matrix.length * baseUnit;
                    quietZoneSize = borderWidth + padding + (contentSize - dataSize) / 2;
                    visual.append(that._renderBackground(size, border));
                    visual.append(that._renderMatrix(matrix, baseUnit, quietZoneSize));
                }
                return visual;
            },
            _getSize: function () {
                var that = this, size;
                if (that.options.size) {
                    size = parseInt(that.options.size, 10);
                } else {
                    var element = that.element, min = Math.min(element.width(), element.height());
                    if (min > 0) {
                        size = min;
                    } else {
                        size = QRCodeDefaults.DEFAULT_SIZE;
                    }
                }
                return size;
            },
            _calculateBaseUnit: function (size, matrixSize) {
                var baseUnit = Math.floor(size / matrixSize);
                if (baseUnit < QRCodeDefaults.MIN_BASE_UNIT_SIZE) {
                    throw new Error('Insufficient size.');
                }
                if (baseUnit * matrixSize >= size && baseUnit - 1 >= QRCodeDefaults.MIN_BASE_UNIT_SIZE) {
                    baseUnit--;
                }
                return baseUnit;
            },
            _renderMatrix: function (matrix, baseUnit, quietZoneSize) {
                var path = new draw.MultiPath({
                    fill: { color: this.options.color },
                    stroke: null
                });
                for (var row = 0; row < matrix.length; row++) {
                    var y = quietZoneSize + row * baseUnit;
                    var column = 0;
                    while (column < matrix.length) {
                        while (matrix[row][column] === 0 && column < matrix.length) {
                            column++;
                        }
                        if (column < matrix.length) {
                            var x = column;
                            while (matrix[row][column] == 1) {
                                column++;
                            }
                            var x1 = round(quietZoneSize + x * baseUnit);
                            var y1 = round(y);
                            var x2 = round(quietZoneSize + column * baseUnit);
                            var y2 = round(y + baseUnit);
                            path.moveTo(x1, y1).lineTo(x1, y2).lineTo(x2, y2).lineTo(x2, y1).close();
                        }
                    }
                }
                return path;
            },
            _renderBackground: function (size, border) {
                var box = new Box2D(0, 0, size, size).unpad(border.width / 2);
                return draw.Path.fromRect(box.toRect(), {
                    fill: { color: this.options.background },
                    stroke: {
                        color: border.color,
                        width: border.width
                    }
                });
            },
            setOptions: function (options) {
                var that = this;
                options = options || {};
                that.options = extend(that.options, options);
                if (options.value !== undefined) {
                    that._value = that.options.value + '';
                }
                that.redraw();
            },
            value: function (value) {
                var that = this;
                if (value === undefined) {
                    return that._value;
                }
                that._value = value + '';
                that.redraw();
            },
            options: {
                name: 'QRCode',
                renderAs: 'svg',
                encoding: 'ISO_8859_1',
                value: '',
                errorCorrection: QRCodeDefaults.DEFAULT_ERROR_CORRECTION_LEVEL,
                background: QRCodeDefaults.DEFAULT_BACKGROUND,
                color: QRCodeDefaults.DEFAULT_DARK_MODULE_COLOR,
                size: '',
                padding: 0,
                border: {
                    color: '',
                    width: 0
                }
            }
        });
        dataviz.ExportMixin.extend(QRCode.fn);
        dataviz.ui.plugin(QRCode);
        suix.deepExtend(dataviz, {
            QRCode: QRCode,
            QRCodeDefaults: QRCodeDefaults,
            QRCodeFunctions: {
                FreeCellVisitor: FreeCellVisitor,
                fillData: fillData,
                padDataString: padDataString,
                generateErrorCodewords: generateErrorCodewords,
                xorPolynomials: xorPolynomials,
                getBlocks: getBlocks,
                multiplyPolynomials: multiplyPolynomials,
                chooseMode: chooseMode,
                getModes: getModes,
                getDataCodewordsCount: getDataCodewordsCount,
                getVersion: getVersion,
                getDataString: getDataString,
                encodeFormatInformation: encodeFormatInformation,
                encodeBCH: encodeBCH,
                dividePolynomials: dividePolynomials,
                initMatrices: initMatrices,
                addFormatInformation: addFormatInformation,
                encodeVersionInformation: encodeVersionInformation,
                addVersionInformation: addVersionInformation,
                addCentricPattern: addCentricPattern,
                addFinderSeparator: addFinderSeparator,
                addFinderPatterns: addFinderPatterns,
                addAlignmentPatterns: addAlignmentPatterns,
                addTimingFunctions: addTimingFunctions,
                scoreMaskMatrixes: scoreMaskMatrixes,
                encodeData: encodeData,
                UTF8Encoder: UTF8Encoder
            },
            QRCodeFields: {
                modes: modeInstances,
                powersOfTwo: powersOfTwo,
                powersOfTwoResult: powersOfTwoResult,
                generatorPolynomials: generatorPolynomials
            }
        });
    }(window.suix.jQuery));
    return window.suix;
}, typeof define == 'function' && define.amd ? define : function (a1, a2, a3) {
    (a3 || a2)();
}));
