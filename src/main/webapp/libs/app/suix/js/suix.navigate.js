(function (f, define) {
    define('suix.treeview', [
        'suix.data',
        'suix.treeview.draganddrop'
    ], f);
}(function () {
    var __meta__ = {
        id: 'treeview',
        name: 'TreeView',
        category: 'web',
        description: 'The TreeView widget displays hierarchical data in a traditional tree structure,with support for interactive drag-and-drop operations.',
        depends: ['data'],
        features: [{
                id: 'treeview-dragging',
                name: 'Drag & Drop',
                description: 'Support for drag & drop',
                depends: ['treeview.draganddrop']
            }]
    };
    (function ($, undefined) {
        var suix = window.suix, ui = suix.ui, data = suix.data, extend = $.extend, template = suix.template, isArray = $.isArray, Widget = ui.Widget, HierarchicalDataSource = data.HierarchicalDataSource, proxy = $.proxy, keys = suix.keys, NS = '.suixTreeView', TEMP_NS = '.suixTreeViewTemp', SELECT = 'select', CHECK = 'check', NAVIGATE = 'navigate', EXPAND = 'expand', CHANGE = 'change', ERROR = 'error', CHECKED = 'checked', INDETERMINATE = 'indeterminate', COLLAPSE = 'collapse', DRAGSTART = 'dragstart', DRAG = 'drag', DROP = 'drop', DRAGEND = 'dragend', DATABOUND = 'dataBound', CLICK = 'click', UNDEFINED = 'undefined', KSTATEHOVER = 'k-state-hover', KTREEVIEW = 'k-treeview', VISIBLE = ':visible', NODE = '.k-item', STRING = 'string', ARIACHECKED = 'aria-checked', ARIASELECTED = 'aria-selected', ARIADISABLED = 'aria-disabled', ARIAEXPANDED = 'aria-expanded', DISABLED = 'k-state-disabled', TreeView, subGroup, nodeContents, nodeIcon, spriteRe, bindings = {
                text: 'dataTextField',
                url: 'dataUrlField',
                spriteCssClass: 'dataSpriteCssClassField',
                imageUrl: 'dataImageUrlField'
            }, isJQueryInstance = function (obj) {
                return obj instanceof suix.jQuery || window.jQuery && obj instanceof window.jQuery;
            }, isDomElement = function (o) {
                return typeof HTMLElement === 'object' ? o instanceof HTMLElement : o && typeof o === 'object' && o.nodeType === 1 && typeof o.nodeName === STRING;
            };
        function contentChild(filter) {
            return function (node) {
                var result = node.children('.k-animation-container');
                if (!result.length) {
                    result = node;
                }
                return result.children(filter);
            };
        }
        function templateNoWith(code) {
            return suix.template(code, { useWithBlock: false });
        }
        subGroup = contentChild('.k-group');
        nodeContents = contentChild('.k-group,.k-content');
        nodeIcon = function (node) {
            return node.children('div').children('.k-icon');
        };
        function checkboxes(node) {
            return node.find('.k-checkbox-wrapper:first input[type=checkbox]');
        }
        function insertAction(indexOffset) {
            return function (nodeData, referenceNode) {
                referenceNode = referenceNode.closest(NODE);
                var group = referenceNode.parent(), parentNode;
                if (group.parent().is('li')) {
                    parentNode = group.parent();
                }
                return this._dataSourceMove(nodeData, group, parentNode, function (dataSource, model) {
                    var referenceItem = this.dataItem(referenceNode);
                    var referenceNodeIndex = referenceItem ? referenceItem.parent().indexOf(referenceItem) : referenceNode.index();
                    return this._insert(dataSource.data(), model, referenceNodeIndex + indexOffset);
                });
            };
        }
        spriteRe = /k-sprite/;
        function moveContents(node, container) {
            var tmp;
            while (node && node.nodeName.toLowerCase() != 'ul') {
                tmp = node;
                node = node.nextSibling;
                if (tmp.nodeType == 3) {
                    tmp.nodeValue = suix.trim(tmp.nodeValue);
                }
                if (spriteRe.test(tmp.className)) {
                    container.insertBefore(tmp, container.firstChild);
                } else {
                    container.appendChild(tmp);
                }
            }
        }
        function updateNodeHtml(node) {
            var wrapper = node.children('div'), group = node.children('ul'), toggleButton = wrapper.children('.k-icon'), checkbox = node.children('input[type=checkbox]'), innerWrapper = wrapper.children('.k-in');
            if (node.hasClass('k-treeview')) {
                return;
            }
            if (!wrapper.length) {
                wrapper = $('<div />').prependTo(node);
            }
            if (!toggleButton.length && group.length) {
                toggleButton = $('<span class=\'k-icon\' />').prependTo(wrapper);
            } else if (!group.length || !group.children().length) {
                toggleButton.remove();
                group.remove();
            }
            if (checkbox.length) {
                $('<span class=\'k-checkbox-wrapper\' />').appendTo(wrapper).append(checkbox);
            }
            if (!innerWrapper.length) {
                innerWrapper = node.children('a').eq(0).addClass('k-in k-link');
                if (!innerWrapper.length) {
                    innerWrapper = $('<span class=\'k-in\' />');
                }
                innerWrapper.appendTo(wrapper);
                if (wrapper.length) {
                    moveContents(wrapper[0].nextSibling, innerWrapper[0]);
                }
            }
        }
        TreeView = suix.ui.DataBoundWidget.extend({
            init: function (element, options) {
                var that = this, inferred = false, hasDataSource = options && !!options.dataSource, list;
                if (isArray(options)) {
                    options = { dataSource: options };
                }
                if (options && typeof options.loadOnDemand == UNDEFINED && isArray(options.dataSource)) {
                    options.loadOnDemand = false;
                }
                Widget.prototype.init.call(that, element, options);
                element = that.element;
                options = that.options;
                that._dataSourceUids = {};
                list = element.is('ul') && element || element.hasClass(KTREEVIEW) && element.children('ul');
                inferred = !hasDataSource && list.length;
                if (inferred) {
                    options.dataSource.list = list;
                }
                that._animation();
                that._accessors();
                that._templates();
                if (!element.hasClass(KTREEVIEW)) {
                    that._wrapper();
                    if (list) {
                        that.root = element;
                        that._group(that.wrapper);
                    }
                } else {
                    that.wrapper = element;
                    that.root = element.children('ul').eq(0);
                }
                that._tabindex();
                that.wrapper.attr('role', 'tree');
                that._dataSource(inferred);
                that._attachEvents();
                that._dragging();
                if (!inferred) {
                    if (options.autoBind) {
                        that._progress(true);
                        that.dataSource.fetch();
                    }
                } else {
                    that._syncHtmlAndDataSource();
                }
                if (options.checkboxes && options.checkboxes.checkChildren) {
                    that.updateIndeterminate();
                }
                if (that.element[0].id) {
                    that._ariaId = suix.format('{0}_tv_active', that.element[0].id);
                }
                suix.notify(that);
            },
            _attachEvents: function () {
                var that = this, clickableItems = '.k-in:not(.k-state-selected,.k-state-disabled)', MOUSEENTER = 'mouseenter';
                that.wrapper.on(MOUSEENTER + NS, '.k-in.k-state-selected', function (e) {
                    e.preventDefault();
                }).on(MOUSEENTER + NS, clickableItems, function () {
                    $(this).addClass(KSTATEHOVER);
                }).on('mouseleave' + NS, clickableItems, function () {
                    $(this).removeClass(KSTATEHOVER);
                }).on(CLICK + NS, clickableItems, proxy(that._click, that)).on('dblclick' + NS, '.k-in:not(.k-state-disabled)', proxy(that._toggleButtonClick, that)).on(CLICK + NS, '.k-i-expand,.k-i-collapse', proxy(that._toggleButtonClick, that)).on('keydown' + NS, proxy(that._keydown, that)).on('keypress' + NS, proxy(that._keypress, that)).on('focus' + NS, proxy(that._focus, that)).on('blur' + NS, proxy(that._blur, that)).on('mousedown' + NS, '.k-in,.k-checkbox-wrapper :checkbox,.k-i-expand,.k-i-collapse', proxy(that._mousedown, that)).on('change' + NS, '.k-checkbox-wrapper :checkbox', proxy(that._checkboxChange, that)).on('click' + NS, '.checkbox-span', proxy(that._checkboxLabelClick, that)).on('click' + NS, '.k-request-retry', proxy(that._retryRequest, that)).on('click' + NS, '.k-link.k-state-disabled', function (e) {
                    e.preventDefault();
                }).on('click' + NS, function (e) {
                    var target = $(e.target);
                    if (!target.is(':suixFocusable') && !target.find('input,select,textarea,button,object').is(':suixFocusable')) {
                        that.focus();
                    }
                });
            },
            _checkboxLabelClick: function (e) {
                var checkbox = $(e.target.previousSibling);
                if (checkbox.is('[disabled]')) {
                    return;
                }
                checkbox.prop('checked', !checkbox.prop('checked'));
                checkbox.trigger('change');
            },
            _syncHtmlAndDataSource: function (root, dataSource) {
                root = root || this.root;
                dataSource = dataSource || this.dataSource;
                var data = dataSource.view(), uidAttr = suix.attr('uid'), expandedAttr = suix.attr('expanded'), checkboxesEnabled = this.options.checkboxes, items = root.children('li'), i, item, dataItem, uid, itemCheckbox;
                for (i = 0; i < items.length; i++) {
                    dataItem = data[i];
                    uid = dataItem.uid;
                    item = items.eq(i);
                    item.attr('role', 'treeitem').attr(uidAttr, uid).attr(ARIASELECTED, item.hasClass('k-state-selected'));
                    dataItem.expanded = item.attr(expandedAttr) === 'true';
                    if (checkboxesEnabled) {
                        itemCheckbox = checkboxes(item);
                        dataItem.checked = itemCheckbox.prop(CHECKED);
                        itemCheckbox.attr('id', '_' + uid);
                        itemCheckbox.next('.k-checkbox-label').attr('for', '_' + uid);
                    }
                    this._syncHtmlAndDataSource(item.children('ul'), dataItem.children);
                }
            },
            _animation: function () {
                var options = this.options, animationOptions = options.animation, hasCollapseAnimation = animationOptions.collapse && 'effects' in animationOptions.collapse, collapse = extend({}, animationOptions.expand, animationOptions.collapse);
                if (!hasCollapseAnimation) {
                    collapse = extend(collapse, { reverse: true });
                }
                if (animationOptions === false) {
                    animationOptions = {
                        expand: { effects: {} },
                        collapse: {
                            hide: true,
                            effects: {}
                        }
                    };
                }
                animationOptions.collapse = extend(collapse, { hide: true });
                options.animation = animationOptions;
            },
            _dragging: function () {
                var enabled = this.options.dragAndDrop;
                var dragging = this.dragging;
                if (enabled && !dragging) {
                    var widget = this;
                    this.dragging = new ui.HierarchicalDragAndDrop(this.element, {
                        reorderable: true,
                        $angular: this.options.$angular,
                        autoScroll: this.options.autoScroll,
                        filter: 'div:not(.k-state-disabled) .k-in',
                        allowedContainers: '.k-treeview',
                        itemSelector: '.k-treeview .k-item',
                        hintText: proxy(this._hintText, this),
                        contains: function (source, destination) {
                            return $.contains(source, destination);
                        },
                        dropHintContainer: function (item) {
                            return item;
                        },
                        itemFromTarget: function (target) {
                            var item = target.closest('.k-top,.k-mid,.k-bot');
                            return {
                                item: item,
                                content: target.closest('.k-in'),
                                first: item.hasClass('k-top'),
                                last: item.hasClass('k-bot')
                            };
                        },
                        dropPositionFrom: function (dropHint) {
                            return dropHint.prevAll('.k-in').length > 0 ? 'after' : 'before';
                        },
                        dragstart: function (source) {
                            return widget.trigger(DRAGSTART, { sourceNode: source[0] });
                        },
                        drag: function (options) {
                            widget.trigger(DRAG, {
                                originalEvent: options.originalEvent,
                                sourceNode: options.source[0],
                                dropTarget: options.target[0],
                                pageY: options.pageY,
                                pageX: options.pageX,
                                statusClass: options.status,
                                setStatusClass: options.setStatus
                            });
                        },
                        drop: function (options) {
                            var dropTarget = $(options.dropTarget);
                            var navigationTarget = dropTarget.closest('a');
                            if (navigationTarget && navigationTarget.attr('href')) {
                                widget._tempPreventNavigation(navigationTarget);
                            }
                            return widget.trigger(DROP, {
                                originalEvent: options.originalEvent,
                                sourceNode: options.source,
                                destinationNode: options.destination,
                                valid: options.valid,
                                setValid: function (state) {
                                    this.valid = state;
                                    options.setValid(state);
                                },
                                dropTarget: options.dropTarget,
                                dropPosition: options.position
                            });
                        },
                        dragend: function (options) {
                            var source = options.source;
                            var destination = options.destination;
                            var position = options.position;
                            function triggerDragEnd(source) {
                                if (widget.options.checkboxes && widget.options.checkboxes.checkChildren) {
                                    widget.updateIndeterminate();
                                }
                                widget.trigger(DRAGEND, {
                                    originalEvent: options.originalEvent,
                                    sourceNode: source && source[0],
                                    destinationNode: destination[0],
                                    dropPosition: position
                                });
                            }
                            if (position == 'over') {
                                widget.append(source, destination, triggerDragEnd);
                            } else {
                                if (position == 'before') {
                                    source = widget.insertBefore(source, destination);
                                } else if (position == 'after') {
                                    source = widget.insertAfter(source, destination);
                                }
                                triggerDragEnd(source);
                            }
                        }
                    });
                } else if (!enabled && dragging) {
                    dragging.destroy();
                    this.dragging = null;
                }
            },
            _tempPreventNavigation: function (node) {
                node.on(CLICK + NS + TEMP_NS, function (ev) {
                    ev.preventDefault();
                    node.off(CLICK + NS + TEMP_NS);
                });
            },
            _hintText: function (node) {
                return this.templates.dragClue({
                    item: this.dataItem(node),
                    treeview: this.options
                });
            },
            _templates: function () {
                var that = this, options = that.options, fieldAccessor = proxy(that._fieldAccessor, that);
                if (options.template && typeof options.template == STRING) {
                    options.template = template(options.template);
                } else if (!options.template) {
                    options.template = templateNoWith('# var text = ' + fieldAccessor('text') + '(data.item); #' + '# if (typeof data.item.encoded != \'undefined\' && data.item.encoded === false) {#' + '#= text #' + '# } else { #' + '#: text #' + '# } #');
                }
                that._checkboxes();
                that.templates = {
                    setAttributes: function (item) {
                        var result = '';
                        var attributes = item.attr || {};
                        for (var attr in attributes) {
                            if (attributes.hasOwnProperty(attr) && attr !== 'class') {
                                result += attr + '="' + attributes[attr] + '" ';
                            }
                        }
                        return result;
                    },
                    wrapperCssClass: function (group, item) {
                        var result = 'k-item', index = item.index;
                        if (group.firstLevel && index === 0) {
                            result += ' k-first';
                        }
                        if (index == group.length - 1) {
                            result += ' k-last';
                        }
                        return result;
                    },
                    cssClass: function (group, item) {
                        var result = '', index = item.index, groupLength = group.length - 1;
                        if (group.firstLevel && index === 0) {
                            result += 'k-top ';
                        }
                        if (index === 0 && index != groupLength) {
                            result += 'k-top';
                        } else if (index == groupLength) {
                            result += 'k-bot';
                        } else {
                            result += 'k-mid';
                        }
                        return result;
                    },
                    textClass: function (item, isLink) {
                        var result = 'k-in';
                        if (isLink) {
                            result += ' k-link';
                        }
                        if (item.enabled === false) {
                            result += ' k-state-disabled';
                        }
                        if (item.selected === true) {
                            result += ' k-state-selected';
                        }
                        return result;
                    },
                    toggleButtonClass: function (item) {
                        var result = 'k-icon';
                        if (item.expanded !== true) {
                            result += ' k-i-expand';
                        } else {
                            result += ' k-i-collapse';
                        }
                        return result;
                    },
                    groupAttributes: function (group) {
                        var attributes = '';
                        if (!group.firstLevel) {
                            attributes = 'role=\'group\'';
                        }
                        return attributes + (group.expanded !== true ? ' style=\'display:none\'' : '');
                    },
                    groupCssClass: function (group) {
                        var cssClass = 'k-group';
                        if (group.firstLevel) {
                            cssClass += ' k-treeview-lines';
                        }
                        return cssClass;
                    },
                    dragClue: templateNoWith('#= data.treeview.template(data) #'),
                    group: templateNoWith('<ul class=\'#= data.r.groupCssClass(data.group) #\'#= data.r.groupAttributes(data.group) #>' + '#= data.renderItems(data) #' + '</ul>'),
                    itemContent: templateNoWith('# var imageUrl = ' + fieldAccessor('imageUrl') + '(data.item); #' + '# var spriteCssClass = ' + fieldAccessor('spriteCssClass') + '(data.item); #' + '# if (imageUrl) { #' + '<img class=\'k-image\' alt=\'\' src=\'#= imageUrl #\'>' + '# } #' + '# if (spriteCssClass) { #' + '<span class=\'k-sprite #= spriteCssClass #\'></span>' + '# } #' + '#= data.treeview.template(data) #'),
                    itemElement: templateNoWith('# var item = data.item, r = data.r; #' + '# var url = ' + fieldAccessor('url') + '(item); #' + '<div class=\'#= r.cssClass(data.group, item) #\'>' + '# if (item.hasChildren) { #' + '<span class=\'#= r.toggleButtonClass(item) #\'></span>' + '# } #' + '# if (data.treeview.checkboxes) { #' + '<span class=\'k-checkbox-wrapper\' role=\'presentation\'>' + '#= data.treeview.checkboxes.template(data) #' + '</span>' + '# } #' + '# var tag = url ? \'a\' : \'span\'; #' + '# var textAttr = url ? \' href=\\\'\' + url + \'\\\'\' : \'\'; #' + '<#=tag# class=\'#= r.textClass(item, !!url) #\'#= textAttr #>' + '#= r.itemContent(data) #' + '</#=tag#>' + '</div>'),
                    item: templateNoWith('# var item = data.item, r = data.r; #' + '<li role=\'treeitem\' class=\'#= r.wrapperCssClass(data.group, item) #\'' + suix.attr('uid') + '=\'#= item.uid #\' ' + '#= r.setAttributes(item.toJSON ? item.toJSON() : item) # ' + '# if (data.treeview.checkboxes) { #' + 'aria-checked=\'#= item.checked ? "true" : "false" #\' ' + '# } #' + 'aria-selected=\'#= item.selected ? "true" : "false" #\' ' + '#=item.enabled === false ? "aria-disabled=\'true\'" : \'\'#' + 'aria-expanded=\'#= item.expanded ? "true" : "false" #\' ' + 'data-expanded=\'#= item.expanded ? "true" : "false" #\' ' + '>' + '#= r.itemElement(data) #' + '</li>'),
                    loading: templateNoWith('<div class=\'k-icon k-i-loading\'></div> #: data.messages.loading #'),
                    retry: templateNoWith('#: data.messages.requestFailed # ' + '<button class=\'k-button k-request-retry\'>#: data.messages.retry #</button>')
                };
            },
            items: function () {
                return this.element.find('.k-item > div:first-child');
            },
            setDataSource: function (dataSource) {
                var options = this.options;
                options.dataSource = dataSource;
                this._dataSourceUids = {};
                this._dataSource();
                if (options.checkboxes && options.checkboxes.checkChildren) {
                    this.dataSource.one('change', $.proxy(this.updateIndeterminate, this, null));
                }
                if (this.options.autoBind) {
                    this.dataSource.fetch();
                }
            },
            _bindDataSource: function () {
                this._refreshHandler = proxy(this.refresh, this);
                this._errorHandler = proxy(this._error, this);
                this.dataSource.bind(CHANGE, this._refreshHandler);
                this.dataSource.bind(ERROR, this._errorHandler);
            },
            _unbindDataSource: function () {
                var dataSource = this.dataSource;
                if (dataSource) {
                    dataSource.unbind(CHANGE, this._refreshHandler);
                    dataSource.unbind(ERROR, this._errorHandler);
                }
            },
            _dataSource: function (silentRead) {
                var that = this, options = that.options, dataSource = options.dataSource;
                function recursiveRead(data) {
                    for (var i = 0; i < data.length; i++) {
                        data[i]._initChildren();
                        data[i].children.fetch();
                        recursiveRead(data[i].children.view());
                    }
                }
                dataSource = isArray(dataSource) ? { data: dataSource } : dataSource;
                that._unbindDataSource();
                if (!dataSource.fields) {
                    dataSource.fields = [
                        { field: 'text' },
                        { field: 'url' },
                        { field: 'spriteCssClass' },
                        { field: 'imageUrl' }
                    ];
                }
                that.dataSource = dataSource = HierarchicalDataSource.create(dataSource);
                if (silentRead) {
                    dataSource.fetch();
                    recursiveRead(dataSource.view());
                }
                that._bindDataSource();
            },
            events: [
                DRAGSTART,
                DRAG,
                DROP,
                DRAGEND,
                DATABOUND,
                EXPAND,
                COLLAPSE,
                SELECT,
                CHANGE,
                NAVIGATE,
                CHECK
            ],
            options: {
                name: 'TreeView',
                dataSource: {},
                animation: {
                    expand: {
                        effects: 'expand:vertical',
                        duration: 200
                    },
                    collapse: { duration: 100 }
                },
                messages: {
                    loading: 'Loading...',
                    requestFailed: 'Request failed.',
                    retry: 'Retry'
                },
                dragAndDrop: false,
                checkboxes: false,
                autoBind: true,
                autoScroll: false,
                loadOnDemand: true,
                template: '',
                dataTextField: null
            },
            _accessors: function () {
                var that = this, options = that.options, i, field, textField, element = that.element;
                for (i in bindings) {
                    field = options[bindings[i]];
                    textField = element.attr(suix.attr(i + '-field'));
                    if (!field && textField) {
                        field = textField;
                    }
                    if (!field) {
                        field = i;
                    }
                    if (!isArray(field)) {
                        field = [field];
                    }
                    options[bindings[i]] = field;
                }
            },
            _fieldAccessor: function (fieldName) {
                var fieldBindings = this.options[bindings[fieldName]], count = fieldBindings.length, result = '(function(item) {';
                if (count === 0) {
                    result += 'return item[\'' + fieldName + '\'];';
                } else {
                    result += 'var levels = [' + $.map(fieldBindings, function (x) {
                        return 'function(d){ return ' + suix.expr(x) + '}';
                    }).join(',') + '];';
                    result += 'return levels[Math.min(item.level(), ' + count + '-1)](item)';
                }
                result += '})';
                return result;
            },
            setOptions: function (options) {
                Widget.fn.setOptions.call(this, options);
                this._animation();
                this._dragging();
                this._templates();
            },
            _trigger: function (eventName, node) {
                return this.trigger(eventName, { node: node.closest(NODE)[0] });
            },
            _setChecked: function (datasource, value) {
                if (!datasource || !$.isFunction(datasource.view)) {
                    return;
                }
                for (var i = 0, nodes = datasource.view(); i < nodes.length; i++) {
                    if (nodes[i].enabled !== false) {
                        this._setCheckedValue(nodes[i], value);
                    }
                    if (nodes[i].children) {
                        this._setChecked(nodes[i].children, value);
                    }
                }
            },
            _setCheckedValue: function (node, value) {
                node[CHECKED] = value;
            },
            _setIndeterminate: function (node) {
                var group = subGroup(node), siblings, length, all = true, i;
                if (!group.length) {
                    return;
                }
                siblings = checkboxes(group.children());
                length = siblings.length;
                if (!length) {
                    return;
                } else if (length > 1) {
                    for (i = 1; i < length; i++) {
                        if (siblings[i].checked != siblings[i - 1].checked || siblings[i].indeterminate || siblings[i - 1].indeterminate) {
                            all = false;
                            break;
                        }
                    }
                } else {
                    all = !siblings[0].indeterminate;
                }
                node.attr(ARIACHECKED, all ? siblings[0].checked : 'mixed');
                return checkboxes(node).data(INDETERMINATE, !all).prop(INDETERMINATE, !all).prop(CHECKED, all && siblings[0].checked);
            },
            updateIndeterminate: function (node) {
                node = node || this.wrapper;
                var subnodes = subGroup(node).children();
                var i;
                var checkbox;
                var dataItem;
                if (subnodes.length) {
                    for (i = 0; i < subnodes.length; i++) {
                        this.updateIndeterminate(subnodes.eq(i));
                    }
                    if (node.is('.k-treeview')) {
                        return;
                    }
                    checkbox = this._setIndeterminate(node);
                    dataItem = this.dataItem(node);
                    if (checkbox && checkbox.prop(CHECKED)) {
                        dataItem.checked = true;
                    } else {
                        if (dataItem) {
                            delete dataItem.checked;
                        }
                    }
                }
            },
            _bubbleIndeterminate: function (node, skipDownward) {
                if (!node.length) {
                    return;
                }
                if (!skipDownward) {
                    this.updateIndeterminate(node);
                }
                var parentNode = this.parent(node), checkbox;
                if (parentNode.length) {
                    this._setIndeterminate(parentNode);
                    checkbox = parentNode.children('div').find('.k-checkbox-wrapper input[type=checkbox]');
                    this._skip = true;
                    if (checkbox.prop(INDETERMINATE) === false) {
                        this.dataItem(parentNode).set(CHECKED, checkbox.prop(CHECKED));
                    } else {
                        this.dataItem(parentNode).set(CHECKED, false);
                    }
                    this._skip = false;
                    this._bubbleIndeterminate(parentNode, true);
                }
            },
            _checkboxChange: function (e) {
                var that = this;
                var checkbox = $(e.target);
                var isChecked = checkbox.prop(CHECKED);
                var node = checkbox.closest(NODE);
                var dataItem = this.dataItem(node);
                if (this._preventChange) {
                    return;
                }
                if (dataItem.checked != isChecked) {
                    dataItem.set(CHECKED, isChecked);
                    node.attr(ARIACHECKED, isChecked);
                    this._trigger(CHECK, node);
                }
                if (checkbox.is(':focus')) {
                    that._trigger(NAVIGATE, node);
                    that.focus();
                }
            },
            _toggleButtonClick: function (e) {
                var node = $(e.currentTarget).closest(NODE);
                if (node.is('[aria-disabled=\'true\']')) {
                    return;
                }
                this.toggle(node);
            },
            _mousedown: function (e) {
                var that = this;
                var currentTarget = $(e.currentTarget);
                var node = $(e.currentTarget).closest(NODE);
                var browser = suix.support.browser;
                if (node.is('[aria-disabled=\'true\']')) {
                    return;
                }
                if ((browser.msie || browser.edge) && currentTarget.is(':checkbox')) {
                    if (currentTarget.prop(INDETERMINATE)) {
                        that._preventChange = false;
                        currentTarget.prop(CHECKED, !currentTarget.prop(CHECKED));
                        currentTarget.trigger(CHANGE);
                        currentTarget.on(CLICK + NS, function (e) {
                            e.preventDefault();
                        });
                        that._preventChange = true;
                    } else {
                        currentTarget.off(CLICK + NS);
                        that._preventChange = false;
                    }
                }
                that._clickTarget = node;
                that.current(node);
            },
            _focusable: function (node) {
                return node && node.length && node.is(':visible') && !node.find('.k-in:first').hasClass(DISABLED);
            },
            _focus: function () {
                var current = this.select(), clickTarget = this._clickTarget;
                if (suix.support.touch) {
                    return;
                }
                if (clickTarget && clickTarget.length) {
                    current = clickTarget;
                }
                if (!this._focusable(current)) {
                    current = this.current();
                }
                if (!this._focusable(current)) {
                    current = this._nextVisible($());
                }
                this.current(current);
            },
            focus: function () {
                var wrapper = this.wrapper, scrollContainer = wrapper[0], containers = [], offsets = [], documentElement = document.documentElement, i;
                do {
                    scrollContainer = scrollContainer.parentNode;
                    if (scrollContainer.scrollHeight > scrollContainer.clientHeight) {
                        containers.push(scrollContainer);
                        offsets.push(scrollContainer.scrollTop);
                    }
                } while (scrollContainer != documentElement);
                suix.focusElement(wrapper);
                for (i = 0; i < containers.length; i++) {
                    containers[i].scrollTop = offsets[i];
                }
            },
            _blur: function () {
                this.current().find('.k-in:first').removeClass('k-state-focused');
            },
            _enabled: function (node) {
                return !node.children('div').children('.k-in').hasClass(DISABLED);
            },
            parent: function (node) {
                var wrapperRe = /\bk-treeview\b/, itemRe = /\bk-item\b/, result, skipSelf;
                if (typeof node == STRING) {
                    node = this.element.find(node);
                }
                if (!isDomElement(node)) {
                    node = node[0];
                }
                skipSelf = itemRe.test(node.className);
                do {
                    node = node.parentNode;
                    if (itemRe.test(node.className)) {
                        if (skipSelf) {
                            result = node;
                        } else {
                            skipSelf = true;
                        }
                    }
                } while (!wrapperRe.test(node.className) && !result);
                return $(result);
            },
            _nextVisible: function (node) {
                var that = this, expanded = that._expanded(node), result;
                function nextParent(node) {
                    while (node.length && !node.next().length) {
                        node = that.parent(node);
                    }
                    if (node.next().length) {
                        return node.next();
                    } else {
                        return node;
                    }
                }
                if (!node.length || !node.is(':visible')) {
                    result = that.root.children().eq(0);
                } else if (expanded) {
                    result = subGroup(node).children().first();
                    if (!result.length) {
                        result = nextParent(node);
                    }
                } else {
                    result = nextParent(node);
                }
                return result;
            },
            _previousVisible: function (node) {
                var that = this, lastChild, result;
                if (!node.length || node.prev().length) {
                    if (node.length) {
                        result = node.prev();
                    } else {
                        result = that.root.children().last();
                    }
                    while (that._expanded(result)) {
                        lastChild = subGroup(result).children().last();
                        if (!lastChild.length) {
                            break;
                        }
                        result = lastChild;
                    }
                } else {
                    result = that.parent(node) || node;
                }
                return result;
            },
            _keydown: function (e) {
                var that = this, key = e.keyCode, target, focused = that.current(), expanded = that._expanded(focused), checkbox = focused.find('.k-checkbox-wrapper:first :checkbox'), rtl = suix.support.isRtl(that.element);
                if (e.target != e.currentTarget) {
                    return;
                }
                if (!rtl && key == keys.RIGHT || rtl && key == keys.LEFT) {
                    if (expanded) {
                        target = that._nextVisible(focused);
                    } else if (!focused.find('.k-in:first').hasClass(DISABLED)) {
                        that.expand(focused);
                    }
                } else if (!rtl && key == keys.LEFT || rtl && key == keys.RIGHT) {
                    if (expanded && !focused.find('.k-in:first').hasClass(DISABLED)) {
                        that.collapse(focused);
                    } else {
                        target = that.parent(focused);
                        if (!that._enabled(target)) {
                            target = undefined;
                        }
                    }
                } else if (key == keys.DOWN) {
                    target = that._nextVisible(focused);
                } else if (key == keys.UP) {
                    target = that._previousVisible(focused);
                } else if (key == keys.HOME) {
                    target = that._nextVisible($());
                } else if (key == keys.END) {
                    target = that._previousVisible($());
                } else if (key == keys.ENTER && !focused.find('.k-in:first').hasClass(DISABLED)) {
                    if (!focused.find('.k-in:first').hasClass('k-state-selected')) {
                        if (!that._trigger(SELECT, focused)) {
                            that.select(focused);
                        }
                    }
                } else if (key == keys.SPACEBAR && checkbox.length) {
                    if (!focused.find('.k-in:first').hasClass(DISABLED)) {
                        checkbox.prop(CHECKED, !checkbox.prop(CHECKED)).data(INDETERMINATE, false).prop(INDETERMINATE, false);
                        that._checkboxChange({ target: checkbox });
                    }
                    target = focused;
                }
                if (target) {
                    e.preventDefault();
                    if (focused[0] != target[0]) {
                        that._trigger(NAVIGATE, target);
                        that.current(target);
                    }
                }
            },
            _keypress: function (e) {
                var that = this;
                var delay = 300;
                var focusedNode = that.current().get(0);
                var matchToFocus;
                var key = e.key;
                var isPrintable = key.length === 1;
                if (!isPrintable) {
                    return;
                }
                if (!that._match) {
                    that._match = '';
                }
                that._match += key;
                clearTimeout(that._matchTimer);
                that._matchTimer = setTimeout(function () {
                    that._match = '';
                }, delay);
                matchToFocus = focusedNode && that._matchNextByText(Array.prototype.indexOf.call(that.element.find('.k-item'), focusedNode), that._match);
                if (!matchToFocus.length) {
                    matchToFocus = that._matchNextByText(-1, that._match);
                }
                if (matchToFocus.get(0) && matchToFocus.get(0) !== focusedNode) {
                    that._trigger(NAVIGATE, matchToFocus);
                    that.current(matchToFocus);
                }
            },
            _matchNextByText: function (startIndex, text) {
                var element = this.element;
                var textNodes = element.find('.k-in').filter(function (i, element) {
                    return i > startIndex && $(element).is(':visible') && $(element).text().toLowerCase().indexOf(text) === 0;
                });
                return textNodes.eq(0).closest(NODE);
            },
            _click: function (e) {
                var that = this, node = $(e.currentTarget), contents = nodeContents(node.closest(NODE)), href = node.attr('href'), shouldNavigate;
                if (href) {
                    shouldNavigate = href == '#' || href.indexOf('#' + this.element.id + '-') >= 0;
                } else {
                    shouldNavigate = contents.length && !contents.children().length;
                }
                if (shouldNavigate) {
                    e.preventDefault();
                }
                if (!node.hasClass('.k-state-selected') && !that._trigger(SELECT, node)) {
                    that.select(node);
                }
            },
            _wrapper: function () {
                var that = this, element = that.element, wrapper, root, wrapperClasses = 'k-widget k-treeview';
                if (element.is('ul')) {
                    wrapper = element.wrap('<div />').parent();
                    root = element;
                } else {
                    wrapper = element;
                    root = wrapper.children('ul').eq(0);
                }
                that.wrapper = wrapper.addClass(wrapperClasses);
                that.root = root;
            },
            _getSelectedNode: function () {
                return this.element.find('.k-state-selected').closest(NODE);
            },
            _group: function (item) {
                var that = this, firstLevel = item.hasClass(KTREEVIEW), group = {
                        firstLevel: firstLevel,
                        expanded: firstLevel || that._expanded(item)
                    }, groupElement = item.children('ul');
                groupElement.addClass(that.templates.groupCssClass(group)).css('display', group.expanded ? '' : 'none');
                if (!firstLevel) {
                    groupElement.attr('role', 'group');
                }
                that._nodes(groupElement, group);
            },
            _nodes: function (groupElement, groupData) {
                var that = this, nodes = groupElement.children('li'), nodeData;
                groupData = extend({ length: nodes.length }, groupData);
                nodes.each(function (i, node) {
                    node = $(node);
                    nodeData = {
                        index: i,
                        expanded: that._expanded(node)
                    };
                    updateNodeHtml(node);
                    that._updateNodeClasses(node, groupData, nodeData);
                    that._group(node);
                });
            },
            _checkboxes: function () {
                var options = this.options;
                var checkboxes = options.checkboxes;
                var defaultTemplate;
                if (checkboxes) {
                    defaultTemplate = '<input type=\'checkbox\' tabindex=\'-1\' #= (item.enabled === false) ? \'disabled\' : \'\' # #= item.checked ? \'checked\' : \'\' #';
                    if (checkboxes.name) {
                        defaultTemplate += ' name=\'' + checkboxes.name + '\'';
                    }
                    defaultTemplate += ' id=\'_#= item.uid #\' class=\'k-checkbox\' /><span class=\'k-checkbox-label checkbox-span\'></span>';
                    checkboxes = extend({ template: defaultTemplate }, options.checkboxes);
                    if (typeof checkboxes.template == STRING) {
                        checkboxes.template = template(checkboxes.template);
                    }
                    options.checkboxes = checkboxes;
                }
            },
            _updateNodeClasses: function (node, groupData, nodeData) {
                var wrapper = node.children('div'), group = node.children('ul'), templates = this.templates;
                if (node.hasClass('k-treeview')) {
                    return;
                }
                nodeData = nodeData || {};
                nodeData.expanded = typeof nodeData.expanded != UNDEFINED ? nodeData.expanded : this._expanded(node);
                nodeData.index = typeof nodeData.index != UNDEFINED ? nodeData.index : node.index();
                nodeData.enabled = typeof nodeData.enabled != UNDEFINED ? nodeData.enabled : !wrapper.children('.k-in').hasClass('k-state-disabled');
                groupData = groupData || {};
                groupData.firstLevel = typeof groupData.firstLevel != UNDEFINED ? groupData.firstLevel : node.parent().parent().hasClass(KTREEVIEW);
                groupData.length = typeof groupData.length != UNDEFINED ? groupData.length : node.parent().children().length;
                node.removeClass('k-first k-last').addClass(templates.wrapperCssClass(groupData, nodeData));
                wrapper.removeClass('k-top k-mid k-bot').addClass(templates.cssClass(groupData, nodeData));
                var textWrap = wrapper.children('.k-in');
                var isLink = textWrap[0] && textWrap[0].nodeName.toLowerCase() == 'a';
                textWrap.removeClass('k-in k-link k-state-default k-state-disabled').addClass(templates.textClass(nodeData, isLink));
                if (group.length || node.attr('data-hasChildren') == 'true') {
                    wrapper.children('.k-icon').removeClass('k-i-expand k-i-collapse').addClass(templates.toggleButtonClass(nodeData));
                    group.addClass('k-group');
                }
            },
            _processNodes: function (nodes, callback) {
                var that = this;
                var items = that.element.find(nodes);
                for (var i = 0; i < items.length; i++) {
                    callback.call(that, i, $(items[i]).closest(NODE));
                }
            },
            dataItem: function (node) {
                var uid = $(node).closest(NODE).attr(suix.attr('uid')), dataSource = this.dataSource;
                return dataSource && dataSource.getByUid(uid);
            },
            _dataItem: function (node) {
                var uid = $(node).closest(NODE).attr(suix.attr('uid')), dataSource = this.dataSource;
                return dataSource && this._dataSourceUids[uid];
            },
            _insertNode: function (nodeData, index, parentNode, insertCallback, collapsed) {
                var that = this, group = subGroup(parentNode), updatedGroupLength = group.children().length + 1, childrenData, groupData = {
                        firstLevel: parentNode.hasClass(KTREEVIEW),
                        expanded: !collapsed,
                        length: updatedGroupLength
                    }, node, i, item, nodeHtml = '', firstChild, lastChild, append = function (item, group) {
                        item.appendTo(group);
                    };
                for (i = 0; i < nodeData.length; i++) {
                    item = nodeData[i];
                    item.index = index + i;
                    nodeHtml += that._renderItem({
                        group: groupData,
                        item: item
                    });
                }
                node = $(nodeHtml);
                if (!node.length) {
                    return;
                }
                that.angular('compile', function () {
                    return {
                        elements: node.get(),
                        data: nodeData.map(function (item) {
                            return { dataItem: item };
                        })
                    };
                });
                if (!group.length) {
                    group = $(that._renderGroup({ group: groupData })).appendTo(parentNode);
                }
                insertCallback(node, group);
                if (parentNode.hasClass('k-item')) {
                    updateNodeHtml(parentNode);
                    that._updateNodeClasses(parentNode, groupData, { expanded: !collapsed });
                }
                firstChild = node.prev().first();
                lastChild = node.next().last();
                that._updateNodeClasses(firstChild, {}, { expanded: firstChild.attr(suix.attr('expanded')) == 'true' });
                that._updateNodeClasses(lastChild, {}, { expanded: lastChild.attr(suix.attr('expanded')) == 'true' });
                for (i = 0; i < nodeData.length; i++) {
                    item = nodeData[i];
                    if (item.hasChildren) {
                        childrenData = item.children.data();
                        if (childrenData.length) {
                            that._insertNode(childrenData, item.index, node.eq(i), append, !item.expanded);
                        }
                    }
                }
                return node;
            },
            _updateNodes: function (items, field) {
                var that = this;
                var i, node, nodeWrapper, item, isChecked, isCollapsed;
                var context = {
                    treeview: that.options,
                    item: item
                };
                var render = field != 'expanded' && field != 'checked';
                function setCheckedState(root, state) {
                    if (root.is('.k-group')) {
                        root.find('.k-item:not([aria-disabled])').attr(ARIACHECKED, state);
                    }
                    root.find('.k-checkbox-wrapper input[type=checkbox]:not([disabled])').prop(CHECKED, state).data(INDETERMINATE, false).prop(INDETERMINATE, false);
                }
                if (field == 'selected') {
                    item = items[0];
                    node = that.findByUid(item.uid).find('.k-in:first').removeClass('k-state-hover').toggleClass('k-state-selected', item[field]).end();
                    if (item[field]) {
                        that.current(node);
                    }
                    node.attr(ARIASELECTED, !!item[field]);
                } else {
                    var elements = $.map(items, function (item) {
                        return that.findByUid(item.uid).children('div');
                    });
                    if (render) {
                        that.angular('cleanup', function () {
                            return { elements: elements };
                        });
                    }
                    for (i = 0; i < items.length; i++) {
                        context.item = item = items[i];
                        nodeWrapper = elements[i];
                        node = nodeWrapper.parent();
                        if (render) {
                            nodeWrapper.children('.k-in').html(that.templates.itemContent(context));
                        }
                        if (field == CHECKED) {
                            isChecked = item[field];
                            setCheckedState(nodeWrapper, isChecked);
                            node.attr(ARIACHECKED, isChecked);
                            if (that.options.checkboxes.checkChildren) {
                                setCheckedState(node.children('.k-group'), isChecked);
                                that._setChecked(item.children, isChecked);
                                that._bubbleIndeterminate(node);
                            }
                        } else if (field == 'expanded') {
                            that._toggle(node, item, item[field]);
                        } else if (field == 'enabled') {
                            node.find('.k-checkbox-wrapper input[type=checkbox]').prop('disabled', !item[field]);
                            isCollapsed = !nodeContents(node).is(VISIBLE);
                            node.removeAttr(ARIADISABLED);
                            if (!item[field]) {
                                if (item.selected) {
                                    item.set('selected', false);
                                }
                                if (item.expanded) {
                                    item.set('expanded', false);
                                }
                                isCollapsed = true;
                                node.attr(ARIASELECTED, false).attr(ARIADISABLED, true);
                            }
                            that._updateNodeClasses(node, {}, {
                                enabled: item[field],
                                expanded: !isCollapsed
                            });
                        }
                        if (nodeWrapper.length) {
                            if (item._events && item._events.change) {
                                item._events.change.splice(1);
                            }
                            this.trigger('itemChange', {
                                item: nodeWrapper,
                                data: item,
                                ns: ui
                            });
                        }
                    }
                    if (render) {
                        that.angular('compile', function () {
                            return {
                                elements: elements,
                                data: $.map(items, function (item) {
                                    return [{ dataItem: item }];
                                })
                            };
                        });
                    }
                }
            },
            _appendItems: function (index, items, parentNode) {
                var group = subGroup(parentNode);
                var children = group.children();
                var collapsed = !this._expanded(parentNode);
                if (this.element === parentNode) {
                    var dataItems = this.dataSource.data();
                    var viewItems = this.dataSource.view();
                    var rootItems = viewItems.length < dataItems.length ? viewItems : dataItems;
                    index = rootItems.indexOf(items[0]);
                } else if (items.length) {
                    index = items[0].parent().indexOf(items[0]);
                }
                if (typeof index == UNDEFINED) {
                    index = children.length;
                }
                this._insertNode(items, index, parentNode, function (item, group) {
                    if (index >= children.length) {
                        item.appendTo(group);
                    } else {
                        item.insertBefore(children.eq(index));
                    }
                }, collapsed);
                if (!collapsed) {
                    this._updateNodeClasses(parentNode, {}, { expanded: !collapsed });
                    subGroup(parentNode).css('display', 'block');
                }
            },
            _refreshChildren: function (parentNode, items, index) {
                var i, children, child;
                var options = this.options;
                var loadOnDemand = options.loadOnDemand;
                var checkChildren = options.checkboxes && options.checkboxes.checkChildren;
                subGroup(parentNode).empty();
                if (!items.length) {
                    updateNodeHtml(parentNode);
                } else {
                    this._appendItems(index, items, parentNode);
                    children = subGroup(parentNode).children();
                    if (loadOnDemand && checkChildren) {
                        this._bubbleIndeterminate(children.last());
                    }
                    for (i = 0; i < children.length; i++) {
                        child = children.eq(i);
                        this.trigger('itemChange', {
                            item: child.children('div'),
                            data: items[i],
                            ns: ui
                        });
                    }
                }
            },
            _refreshRoot: function (items) {
                var groupHtml = this._renderGroup({
                    items: items,
                    group: {
                        firstLevel: true,
                        expanded: true
                    }
                });
                if (this.root.length) {
                    this._angularItems('cleanup');
                    var group = $(groupHtml);
                    this.root.attr('class', group.attr('class')).html(group.html());
                } else {
                    this.root = this.wrapper.html(groupHtml).children('ul');
                }
                var elements = this.root.children('.k-item');
                for (var i = 0; i < items.length; i++) {
                    this.trigger('itemChange', {
                        item: elements.eq(i),
                        data: items[i],
                        ns: ui
                    });
                }
                this._angularItems('compile');
            },
            refresh: function (e) {
                var node = e.node;
                var action = e.action;
                var items = e.items;
                var parentNode = this.wrapper;
                var options = this.options;
                var loadOnDemand = options.loadOnDemand;
                var checkChildren = options.checkboxes && options.checkboxes.checkChildren;
                var i;
                if (this._skip) {
                    return;
                }
                for (i = 0; i < items.length; i++) {
                    this._dataSourceUids[items[i].uid] = items[i];
                }
                if (e.field) {
                    if (!items[0] || !items[0].level) {
                        return;
                    }
                    return this._updateNodes(items, e.field);
                }
                if (node) {
                    parentNode = this.findByUid(node.uid);
                    this._progress(parentNode, false);
                }
                if (checkChildren && action != 'remove') {
                    var bubble = false;
                    for (i = 0; i < items.length; i++) {
                        if ('checked' in items[i]) {
                            bubble = true;
                            break;
                        }
                    }
                    if (!bubble && node && node.checked) {
                        for (i = 0; i < items.length; i++) {
                            items[i].checked = true;
                        }
                    }
                }
                if (action == 'add') {
                    this._appendItems(e.index, items, parentNode);
                } else if (action == 'remove') {
                    this._remove(this.findByUid(items[0].uid), false);
                } else if (action == 'itemchange') {
                    this._updateNodes(items);
                } else if (action == 'itemloaded') {
                    this._refreshChildren(parentNode, items, e.index);
                } else {
                    this._refreshRoot(items);
                }
                if (action != 'remove') {
                    for (i = 0; i < items.length; i++) {
                        if (!loadOnDemand || items[i].expanded || items[i]._loaded) {
                            items[i].load();
                        }
                    }
                }
                this.trigger(DATABOUND, { node: node ? parentNode : undefined });
                if (this.dataSource.filter() && this.options.checkboxes.checkChildren) {
                    this.updateIndeterminate(parentNode);
                }
            },
            _error: function (e) {
                var node = e.node && this.findByUid(e.node.uid);
                var retryHtml = this.templates.retry({ messages: this.options.messages });
                if (node) {
                    this._progress(node, false);
                    this._expanded(node, false);
                    nodeIcon(node).addClass('k-i-reload');
                    e.node.loaded(false);
                } else {
                    this._progress(false);
                    this.element.html(retryHtml);
                }
            },
            _retryRequest: function (e) {
                e.preventDefault();
                this.dataSource.fetch();
            },
            expand: function (nodes) {
                this._processNodes(nodes, function (index, item) {
                    this.toggle(item, true);
                });
            },
            collapse: function (nodes) {
                this._processNodes(nodes, function (index, item) {
                    this.toggle(item, false);
                });
            },
            enable: function (nodes, enable) {
                if (typeof nodes === 'boolean') {
                    enable = nodes;
                    nodes = this.items();
                } else {
                    enable = arguments.length == 2 ? !!enable : true;
                }
                this._processNodes(nodes, function (index, item) {
                    this.dataItem(item).set('enabled', enable);
                });
            },
            current: function (node) {
                var that = this, current = that._current, element = that.element, id = that._ariaId;
                if (arguments.length > 0 && node && node.length) {
                    if (current) {
                        if (current[0].id === id) {
                            current.removeAttr('id');
                        }
                        current.find('.k-in:first').removeClass('k-state-focused');
                    }
                    current = that._current = $(node, element).closest(NODE);
                    current.find('.k-in:first').addClass('k-state-focused');
                    id = current[0].id || id;
                    if (id) {
                        that.wrapper.removeAttr('aria-activedescendant');
                        current.attr('id', id);
                        that.wrapper.attr('aria-activedescendant', id);
                    }
                    return;
                }
                if (!current) {
                    current = that._nextVisible($());
                }
                return current;
            },
            select: function (node) {
                var that = this, element = that.element;
                if (!arguments.length) {
                    return element.find('.k-state-selected').closest(NODE);
                }
                node = $(node, element).closest(NODE);
                element.find('.k-state-selected').each(function () {
                    var dataItem = that.dataItem(this);
                    if (dataItem) {
                        dataItem.set('selected', false);
                        delete dataItem.selected;
                    } else {
                        $(this).removeClass('k-state-selected');
                    }
                });
                if (node.length) {
                    that.dataItem(node).set('selected', true);
                    that._clickTarget = node;
                }
                that.trigger(CHANGE);
            },
            _toggle: function (node, dataItem, expand) {
                var options = this.options;
                var contents = nodeContents(node);
                var direction = expand ? 'expand' : 'collapse';
                var loaded;
                if (contents.data('animating')) {
                    return;
                }
                loaded = dataItem && dataItem.loaded();
                if (expand && !loaded) {
                    if (options.loadOnDemand) {
                        this._progress(node, true);
                    }
                    contents.remove();
                    dataItem.load();
                } else {
                    this._updateNodeClasses(node, {}, { expanded: expand });
                    if (!expand) {
                        contents.css('height', contents.height()).css('height');
                    }
                    contents.suixStop(true, true).suixAnimate(extend({ reset: true }, options.animation[direction], {
                        complete: function () {
                            if (expand) {
                                contents.css('height', '');
                            }
                        }
                    }));
                }
            },
            toggle: function (node, expand) {
                node = $(node);
                if (!nodeIcon(node).is('.k-i-expand, .k-i-collapse')) {
                    return;
                }
                if (arguments.length == 1) {
                    expand = !this._expanded(node);
                }
                this._expanded(node, expand);
            },
            destroy: function () {
                var that = this;
                Widget.fn.destroy.call(that);
                that.wrapper.off(NS);
                that.wrapper.find('.k-checkbox-wrapper :checkbox').off(NS);
                that._unbindDataSource();
                if (that.dragging) {
                    that.dragging.destroy();
                }
                that._dataSourceUids = {};
                suix.destroy(that.element);
                that.root = that.wrapper = that.element = null;
            },
            _expanded: function (node, value, force) {
                var expandedAttr = suix.attr('expanded');
                var dataItem;
                var expanded = value;
                var direction = expanded ? 'expand' : 'collapse';
                if (arguments.length == 1) {
                    dataItem = this._dataItem(node);
                    return node.attr(expandedAttr) === 'true' || dataItem && dataItem.expanded;
                }
                dataItem = this.dataItem(node);
                if (nodeContents(node).data('animating')) {
                    return;
                }
                if (force || !this._trigger(direction, node)) {
                    if (expanded) {
                        node.attr(expandedAttr, 'true');
                        node.attr(ARIAEXPANDED, 'true');
                    } else {
                        node.removeAttr(expandedAttr);
                        node.attr(ARIAEXPANDED, 'false');
                    }
                    if (dataItem) {
                        dataItem.set('expanded', expanded);
                        expanded = dataItem.expanded;
                    }
                }
            },
            _progress: function (node, showProgress) {
                var element = this.element;
                var loadingText = this.templates.loading({ messages: this.options.messages });
                if (arguments.length == 1) {
                    showProgress = node;
                    if (showProgress) {
                        element.html(loadingText);
                    } else {
                        element.empty();
                    }
                } else {
                    nodeIcon(node).toggleClass('k-i-loading', showProgress).removeClass('k-i-reload');
                }
            },
            text: function (node, text) {
                var dataItem = this.dataItem(node), fieldBindings = this.options[bindings.text], level = dataItem.level(), length = fieldBindings.length, field = fieldBindings[Math.min(level, length - 1)];
                if (text) {
                    dataItem.set(field, text);
                } else {
                    return dataItem[field];
                }
            },
            _objectOrSelf: function (node) {
                return $(node).closest('[data-role=treeview]').data('suixTreeView') || this;
            },
            _dataSourceMove: function (nodeData, group, parentNode, callback) {
                var referenceDataItem, destTreeview = this._objectOrSelf(parentNode || group), destDataSource = destTreeview.dataSource;
                var loadPromise = $.Deferred().resolve().promise();
                if (parentNode && parentNode[0] != destTreeview.element[0]) {
                    referenceDataItem = destTreeview.dataItem(parentNode);
                    if (!referenceDataItem.loaded()) {
                        destTreeview._progress(parentNode, true);
                        loadPromise = referenceDataItem.load();
                    }
                    if (parentNode != this.root) {
                        destDataSource = referenceDataItem.children;
                        if (!destDataSource || !(destDataSource instanceof HierarchicalDataSource)) {
                            referenceDataItem._initChildren();
                            referenceDataItem.loaded(true);
                            destDataSource = referenceDataItem.children;
                        }
                    }
                }
                nodeData = this._toObservableData(nodeData);
                return callback.call(destTreeview, destDataSource, nodeData, loadPromise);
            },
            _toObservableData: function (node) {
                var dataItem = node, dataSource, uid;
                if (isJQueryInstance(node) || isDomElement(node)) {
                    dataSource = this._objectOrSelf(node).dataSource;
                    uid = $(node).attr(suix.attr('uid'));
                    dataItem = dataSource.getByUid(uid);
                    if (dataItem) {
                        dataItem = dataSource.remove(dataItem);
                    }
                }
                return dataItem;
            },
            _insert: function (data, model, index) {
                if (!(model instanceof suix.data.ObservableArray)) {
                    if (!isArray(model)) {
                        model = [model];
                    }
                } else {
                    model = model.toJSON();
                }
                var parentNode = data.parent();
                if (parentNode && parentNode._initChildren) {
                    parentNode.hasChildren = true;
                    parentNode._initChildren();
                }
                data.splice.apply(data, [
                    index,
                    0
                ].concat(model));
                return this.findByUid(data[index].uid);
            },
            insertAfter: insertAction(1),
            insertBefore: insertAction(0),
            append: function (nodeData, parentNode, success) {
                var group = this.root;
                if (parentNode && nodeData instanceof jQuery && parentNode[0] === nodeData[0]) {
                    return;
                }
                parentNode = parentNode && parentNode.length ? parentNode : null;
                if (parentNode) {
                    group = subGroup(parentNode);
                }
                return this._dataSourceMove(nodeData, group, parentNode, function (dataSource, model, loadModel) {
                    var inserted;
                    var that = this;
                    function add() {
                        if (parentNode) {
                            that._expanded(parentNode, true, true);
                        }
                        var data = dataSource.data(), index = Math.max(data.length, 0);
                        return that._insert(data, model, index);
                    }
                    loadModel.done(function () {
                        inserted = add();
                        success = success || $.noop;
                        success(inserted);
                    });
                    return inserted || null;
                });
            },
            _remove: function (node, keepData) {
                var that = this, parentNode, prevSibling, nextSibling;
                node = $(node, that.element);
                this.angular('cleanup', function () {
                    return { elements: node.get() };
                });
                parentNode = node.parent().parent();
                prevSibling = node.prev();
                nextSibling = node.next();
                node[keepData ? 'detach' : 'remove']();
                if (parentNode.hasClass('k-item')) {
                    updateNodeHtml(parentNode);
                    that._updateNodeClasses(parentNode);
                }
                that._updateNodeClasses(prevSibling);
                that._updateNodeClasses(nextSibling);
                return node;
            },
            remove: function (node) {
                var dataItem = this.dataItem(node);
                if (dataItem) {
                    this.dataSource.remove(dataItem);
                }
            },
            detach: function (node) {
                return this._remove(node, true);
            },
            findByText: function (text) {
                return $(this.element).find('.k-in').filter(function (i, element) {
                    return $(element).text() == text;
                }).closest(NODE);
            },
            findByUid: function (uid) {
                var items = this.element.find('.k-item');
                var uidAttr = suix.attr('uid');
                var result;
                for (var i = 0; i < items.length; i++) {
                    if (items[i].getAttribute(uidAttr) == uid) {
                        result = items[i];
                        break;
                    }
                }
                return $(result);
            },
            expandPath: function (path, complete) {
                var treeview = this;
                var nodeIds = path.slice(0);
                var callback = complete || $.noop;
                function proceed() {
                    nodeIds.shift();
                    if (nodeIds.length) {
                        expand(nodeIds[0]).then(proceed);
                    } else {
                        callback.call(treeview);
                    }
                }
                function expand(id) {
                    var result = $.Deferred();
                    var node = treeview.dataSource.get(id);
                    var expandedAttr = suix.attr('expanded');
                    var nodeElement;
                    if (node) {
                        nodeElement = treeview.findByUid(node.uid);
                        if (node.loaded()) {
                            node.set('expanded', true);
                            nodeElement.attr(expandedAttr, true);
                            nodeElement.attr(ARIAEXPANDED, true);
                            result.resolve();
                        } else {
                            treeview._progress(nodeElement, true);
                            node.load().then(function () {
                                node.set('expanded', true);
                                nodeElement.attr(expandedAttr, true);
                                nodeElement.attr(ARIAEXPANDED, true);
                                result.resolve();
                            });
                        }
                    } else {
                        result.resolve();
                    }
                    return result.promise();
                }
                expand(nodeIds[0]).then(proceed);
            },
            _parentIds: function (node) {
                var parent = node && node.parentNode();
                var parents = [];
                while (parent && parent.parentNode) {
                    parents.unshift(parent.id);
                    parent = parent.parentNode();
                }
                return parents;
            },
            expandTo: function (node) {
                if (!(node instanceof suix.data.Node)) {
                    node = this.dataSource.get(node);
                }
                var parents = this._parentIds(node);
                this.expandPath(parents);
            },
            _renderItem: function (options) {
                if (!options.group) {
                    options.group = {};
                }
                options.treeview = this.options;
                options.r = this.templates;
                return this.templates.item(options);
            },
            _renderGroup: function (options) {
                var that = this;
                options.renderItems = function (options) {
                    var html = '', i = 0, items = options.items, len = items ? items.length : 0, group = options.group;
                    group.length = len;
                    for (; i < len; i++) {
                        options.group = group;
                        options.item = items[i];
                        options.item.index = i;
                        html += that._renderItem(options);
                    }
                    return html;
                };
                options.r = that.templates;
                return that.templates.group(options);
            }
        });
        ui.plugin(TreeView);
    }(window.suix.jQuery));
    return window.suix;
}, typeof define == 'function' && define.amd ? define : function (a1, a2, a3) {
    (a3 || a2)();
}));
(function (f, define) {
    define('suix.treeview.draganddrop', [
        'suix.data',
        'suix.draganddrop'
    ], f);
}(function () {
    var __meta__ = {
        id: 'treeview.draganddrop',
        name: 'Hierarchical Drag & Drop',
        category: 'framework',
        depends: [
            'core',
            'draganddrop'
        ],
        advanced: true
    };
    (function ($, undefined) {
        var suix = window.suix;
        var ui = suix.ui;
        var proxy = $.proxy;
        var extend = $.extend;
        var VISIBILITY = 'visibility';
        var KSTATEHOVER = 'k-state-hover';
        var INPUTSELECTOR = 'input,a:not(.k-in),textarea,.k-multiselect-wrap,select,button,a.k-button>.k-icon,button.k-button>.k-icon,span.k-icon.k-i-arrow-60-right,span.k-icon.k-i-arrow-45-down-right';
        ui.HierarchicalDragAndDrop = suix.Class.extend({
            init: function (element, options) {
                this.element = element;
                this.hovered = element;
                this.options = extend({
                    dragstart: $.noop,
                    drag: $.noop,
                    drop: $.noop,
                    dragend: $.noop
                }, options);
                this._draggable = new ui.Draggable(element, {
                    ignore: INPUTSELECTOR,
                    filter: options.filter,
                    autoScroll: options.autoScroll,
                    cursorOffset: {
                        left: 10,
                        top: suix.support.mobileOS ? -40 / suix.support.zoomLevel() : 10
                    },
                    hint: proxy(this._hint, this),
                    dragstart: proxy(this.dragstart, this),
                    dragcancel: proxy(this.dragcancel, this),
                    drag: proxy(this.drag, this),
                    dragend: proxy(this.dragend, this),
                    $angular: options.$angular
                });
            },
            _hint: function (element) {
                return '<div class=\'k-header k-drag-clue\'>' + '<span class=\'k-icon k-drag-status\'></span>' + this.options.hintText(element) + '</div>';
            },
            _removeTouchHover: function () {
                if (suix.support.touch && this.hovered) {
                    this.hovered.find('.' + KSTATEHOVER).removeClass(KSTATEHOVER);
                    this.hovered = false;
                }
            },
            _hintStatus: function (newStatus) {
                var statusElement = this._draggable.hint.find('.k-drag-status')[0];
                if (newStatus) {
                    statusElement.className = 'k-icon k-drag-status ' + newStatus;
                } else {
                    return suix.trim(statusElement.className.replace(/(p|k)-(icon|drag-status)/g, ''));
                }
            },
            dragstart: function (e) {
                this.source = e.currentTarget.closest(this.options.itemSelector);
                if (this.options.dragstart(this.source)) {
                    e.preventDefault();
                }
                if (this.options.reorderable) {
                    this.dropHint = $('<div class=\'k-icon k-i-drag-and-drop\' />').css(VISIBILITY, 'hidden').appendTo(this.element);
                } else {
                    this.dropHint = $();
                }
            },
            drag: function (e) {
                var options = this.options;
                var source = this.source;
                var target = this.dropTarget = $(suix.eventTarget(e));
                var container = target.closest(options.allowedContainers);
                var hoveredItem, itemHeight, itemTop, itemContent, delta;
                var insertOnTop, insertOnBottom, addChild;
                var itemData, position, status;
                if (!container.length) {
                    status = 'k-i-cancel';
                    this._removeTouchHover();
                } else if (source[0] == target[0] || options.contains(source[0], target[0])) {
                    status = 'k-i-cancel';
                } else {
                    status = 'k-i-insert-middle';
                    itemData = options.itemFromTarget(target);
                    hoveredItem = itemData.item;
                    if (hoveredItem.length) {
                        this._removeTouchHover();
                        itemHeight = suix._outerHeight(hoveredItem);
                        itemContent = itemData.content;
                        if (options.reorderable) {
                            delta = itemHeight / (itemContent.length > 0 ? 4 : 2);
                            itemTop = suix.getOffset(hoveredItem).top;
                            insertOnTop = e.y.location < itemTop + delta;
                            insertOnBottom = itemTop + itemHeight - delta < e.y.location;
                            addChild = itemContent.length && !insertOnTop && !insertOnBottom;
                        } else {
                            addChild = true;
                            insertOnTop = false;
                            insertOnBottom = false;
                        }
                        this.hovered = addChild ? container : false;
                        this.dropHint.css(VISIBILITY, addChild ? 'hidden' : 'visible');
                        if (this._lastHover && this._lastHover[0] != itemContent[0]) {
                            this._lastHover.removeClass(KSTATEHOVER);
                        }
                        this._lastHover = itemContent.toggleClass(KSTATEHOVER, addChild);
                        if (addChild) {
                            status = 'k-i-plus';
                        } else {
                            position = hoveredItem.position();
                            position.top += insertOnTop ? 0 : itemHeight;
                            this.dropHint.css(position)[insertOnTop ? 'prependTo' : 'appendTo'](options.dropHintContainer(hoveredItem));
                            if (insertOnTop && itemData.first) {
                                status = 'k-i-insert-up';
                            }
                            if (insertOnBottom && itemData.last) {
                                status = 'k-i-insert-down';
                            }
                        }
                    } else if (target[0] != this.dropHint[0]) {
                        if (this._lastHover) {
                            this._lastHover.removeClass(KSTATEHOVER);
                        }
                        if (!$.contains(this.element[0], container[0])) {
                            status = 'k-i-plus';
                        } else {
                            status = 'k-i-cancel';
                        }
                    }
                }
                this.options.drag({
                    originalEvent: e.originalEvent,
                    source: source,
                    target: target,
                    pageY: e.y.location,
                    pageX: e.x.location,
                    status: status.substring(2),
                    setStatus: function (value) {
                        status = value;
                    }
                });
                if (status.indexOf('k-i-insert') !== 0) {
                    this.dropHint.css(VISIBILITY, 'hidden');
                }
                this._hintStatus(status);
            },
            dragcancel: function () {
                this.dropHint.remove();
            },
            dragend: function (e) {
                var position = 'over', source = this.source, destination, dropHint = this.dropHint, dropTarget = this.dropTarget, eventArgs, dropPrevented;
                if (dropHint.css(VISIBILITY) == 'visible') {
                    position = this.options.dropPositionFrom(dropHint);
                    destination = dropHint.closest(this.options.itemSelector);
                } else if (dropTarget) {
                    destination = dropTarget.closest(this.options.itemSelector);
                    if (!destination.length) {
                        destination = dropTarget.closest(this.options.allowedContainers);
                    }
                }
                eventArgs = {
                    originalEvent: e.originalEvent,
                    source: source[0],
                    destination: destination[0],
                    valid: this._hintStatus() != 'k-i-cancel',
                    setValid: function (newValid) {
                        this.valid = newValid;
                    },
                    dropTarget: dropTarget[0],
                    position: position
                };
                dropPrevented = this.options.drop(eventArgs);
                dropHint.remove();
                this._removeTouchHover();
                if (this._lastHover) {
                    this._lastHover.removeClass(KSTATEHOVER);
                }
                if (!eventArgs.valid || dropPrevented) {
                    this._draggable.dropped = eventArgs.valid;
                    return;
                }
                this._draggable.dropped = true;
                this.options.dragend({
                    originalEvent: e.originalEvent,
                    source: source,
                    destination: destination,
                    position: position
                });
            },
            destroy: function () {
                this._lastHover = this.hovered = null;
                this._draggable.destroy();
            }
        });
    }(window.suix.jQuery));
    return window.suix;
}, typeof define == 'function' && define.amd ? define : function (a1, a2, a3) {
    (a3 || a2)();
}));
(function (f, define) {
    define('suix.dropdowntree', [
        'dropdowntree/treeview',
        'suix.popup'
    ], f);
}(function () {
    var __meta__ = {
        id: 'dropdowntree',
        name: 'DropDownTree',
        category: 'web',
        description: 'The DropDownTree widget displays a hierarchy of items and allows the selection of single or multiple items.',
        depends: [
            'treeview',
            'popup'
        ]
    };
    (function ($, undefined) {
        var suix = window.suix, ui = suix.ui, Widget = ui.Widget, TreeView = ui._dropdowntree, ObservableArray = suix.data.ObservableArray, ObservableObject = suix.data.ObservableObject, extend = $.extend, activeElement = suix._activeElement, ns = '.suixDropDownTree', keys = suix.keys, support = suix.support, HIDDENCLASS = 'k-hidden', WIDTH = 'width', browser = support.browser, outerWidth = suix._outerWidth, DOT = '.', DISABLED = 'disabled', READONLY = 'readonly', STATEDISABLED = 'k-state-disabled', ARIA_DISABLED = 'aria-disabled', HOVER = 'k-state-hover', FOCUSED = 'k-state-focused', HOVEREVENTS = 'mouseenter' + ns + ' mouseleave' + ns, TABINDEX = 'tabindex', CLICK = 'click', OPEN = 'open', CLOSE = 'close', CHANGE = 'change', quotRegExp = /"/g, proxy = $.proxy;
        var DropDownTree = suix.ui.Widget.extend({
            init: function (element, options) {
                this.ns = ns;
                suix.ui.Widget.fn.init.call(this, element, options);
                this._selection = this._getSelection();
                this._focusInputHandler = $.proxy(this._focusInput, this);
                this._initial = this.element.val();
                this._values = [];
                var value = this.options.value;
                if (value === null || !value.length) {
                    this._noInitialValue = true;
                }
                if (!this._isNullorUndefined(value)) {
                    this._valueMethodCalled = true;
                    this._values = $.isArray(value) ? value.slice(0) : [value];
                }
                this._inputTemplate();
                this._accessors();
                this._setTreeViewOptions(this.options);
                this._dataSource();
                this._selection._initWrapper();
                this._placeholder(true);
                this._tabindex();
                this.wrapper.data(TABINDEX, this.wrapper.attr(TABINDEX));
                this.tree = $('<div/>').attr({
                    tabIndex: -1,
                    'aria-hidden': true
                });
                this.list = $('<div class=\'k-list-container\'/>').append(this.tree);
                this._header();
                this._noData();
                this._footer();
                this._reset();
                this._popup();
                this.popup.one('open', proxy(this._popupOpen, this));
                this._clearButton();
                this._filterHeader();
                this._treeview();
                this._renderFooter();
                this._checkAll();
                this._enable();
                this._toggleCloseVisibility();
                if (!this.options.autoBind) {
                    var text = options.text || '';
                    if (!this._isNullorUndefined(options.value)) {
                        this._preselect(options.value);
                    } else if (text) {
                        this._textAccessor(text);
                    } else if (options.placeholder) {
                        this._placeholder(true);
                    }
                }
                var disabled = $(this.element).parents('fieldset').is(':disabled');
                if (disabled) {
                    this.enable(false);
                }
                this._valueMethodCalled = false;
                suix.notify(this);
            },
            _preselect: function (data, value) {
                this._selection._preselect(data, value);
            },
            _setTreeViewOptions: function (options) {
                var treeviewOptions = {
                    autoBind: options.autoBind,
                    checkboxes: options.checkboxes,
                    dataImageUrlField: options.dataImageUrlField,
                    dataSpriteCssClassField: options.dataSpriteCssClassField,
                    dataTextField: options.dataTextField,
                    dataUrlField: options.dataUrlField,
                    loadOnDemand: options.loadOnDemand
                };
                this.options.treeview = $.extend({}, treeviewOptions, this.options.treeview);
                if (options.template) {
                    this.options.treeview.template = options.template;
                }
            },
            _dataSource: function () {
                var rootDataSource = this.options.dataSource;
                this.dataSource = suix.data.HierarchicalDataSource.create(rootDataSource);
                if (rootDataSource) {
                    $.extend(this.options.treeview, { dataSource: this.dataSource });
                }
            },
            _popupOpen: function () {
                var popup = this.popup;
                popup.wrapper = suix.wrap(popup.element);
            },
            _getSelection: function () {
                if (this._isMultipleSelection()) {
                    return new ui.DropDownTree.MultipleSelection(this);
                } else {
                    return new ui.DropDownTree.SingleSelection(this);
                }
            },
            setDataSource: function (dataSource) {
                this._isDataSourceSet = true;
                if (this._tags) {
                    this._noInitialValue = true;
                    this.setValue([]);
                    this._tags.empty();
                    this.span.show();
                    this._multipleTags.empty();
                }
                this.dataSource = dataSource;
                this.treeview.setDataSource(dataSource);
                this._isDataSourceSet = false;
            },
            _isMultipleSelection: function () {
                return this.options && (this.options.treeview.checkboxes || this.options.checkboxes);
            },
            options: {
                name: 'DropDownTree',
                animation: {},
                autoBind: true,
                autoClose: true,
                autoWidth: false,
                clearButton: true,
                dataTextField: '',
                dataValueField: '',
                dataImageUrlField: '',
                dataSpriteCssClassField: '',
                dataUrlField: '',
                delay: 500,
                enabled: true,
                enforceMinLength: false,
                filter: 'none',
                height: 200,
                ignoreCase: true,
                index: 0,
                loadOnDemand: false,
                messages: {
                    'singleTag': 'item(s) selected',
                    'clear': 'clear',
                    'deleteTag': 'delete',
                    'noData': 'No data found.'
                },
                minLength: 1,
                checkboxes: false,
                noDataTemplate: true,
                placeholder: '',
                checkAll: false,
                checkAllTemplate: 'Check all',
                tagMode: 'multiple',
                template: null,
                text: null,
                treeview: {},
                valuePrimitive: false,
                footerTemplate: '',
                headerTemplate: '',
                value: null,
                valueTemplate: null,
                popup: null
            },
            events: [
                'open',
                'close',
                'dataBound',
                CHANGE,
                'select',
                'filtering'
            ],
            focus: function () {
                this.wrapper.focus();
            },
            dataItem: function (node) {
                return this.treeview.dataItem(node);
            },
            readonly: function (readonly) {
                this._editable({
                    readonly: readonly === undefined ? true : readonly,
                    disable: false
                });
                this._toggleCloseVisibility();
            },
            enable: function (enable) {
                this._editable({
                    readonly: false,
                    disable: !(enable = enable === undefined ? true : enable)
                });
                this._toggleCloseVisibility();
            },
            toggle: function (open) {
                this._toggle(open);
            },
            open: function () {
                var popup = this.popup;
                if (!this.options.autoBind && !this.dataSource.data().length) {
                    this.treeview._progress(true);
                    if (this._isFilterEnabled()) {
                        this._search();
                    } else {
                        this.dataSource.fetch();
                    }
                }
                if (popup.visible() || !this._allowOpening()) {
                    return;
                }
                if (this._isMultipleSelection()) {
                    popup.element.addClass('k-multiple-selection');
                }
                popup.element.addClass('k-popup-dropdowntree');
                popup.one('activate', this._focusInputHandler);
                popup._hovered = true;
                popup.open();
            },
            close: function () {
                this.popup.close();
            },
            search: function (word) {
                var options = this.options;
                var filter;
                clearTimeout(this._typingTimeout);
                if (!options.enforceMinLength && !word.length || word.length >= options.minLength) {
                    filter = this._getFilter(word);
                    if (this.trigger('filtering', { filter: filter }) || $.isArray(this.options.dataTextField)) {
                        return;
                    }
                    this._filtering = true;
                    this.treeview.dataSource.filter(filter);
                }
            },
            _getFilter: function (word) {
                return {
                    field: this.options.dataTextField,
                    operator: this.options.filter,
                    value: word,
                    ignoreCase: this.options.ignoreCase
                };
            },
            refresh: function () {
                var data = this.treeview.dataSource.flatView();
                this._renderFooter();
                this._renderNoData();
                if (this.filterInput && this.checkAll) {
                    this.checkAll.toggle(!this.filterInput.val().length);
                }
                this.tree.toggle(!!data.length);
                $(this.noData).toggle(!data.length);
            },
            setOptions: function (options) {
                Widget.fn.setOptions.call(this, options);
                this._setTreeViewOptions(options);
                this._dataSource();
                if (this.options.treeview) {
                    this.treeview.setOptions(this.options.treeview);
                }
                if (options.height && this.tree) {
                    this.tree.css('max-height', options.height);
                }
                this._header();
                this._noData();
                this._footer();
                this._renderFooter();
                this._renderNoData();
                if (this.span && (this._isMultipleSelection() || this.span.hasClass('k-readonly'))) {
                    this._placeholder(true);
                }
                this._inputTemplate();
                this._accessors();
                this._filterHeader();
                this._checkAll();
                this._enable();
                if (options && (options.enable || options.enabled)) {
                    this.enable(true);
                }
                this._clearButton();
            },
            destroy: function () {
                suix.ui.Widget.fn.destroy.call(this);
                if (this.treeview) {
                    this.treeview.destroy();
                }
                this.popup.destroy();
                this.wrapper.off(ns);
                this._clear.off(ns);
                this._inputWrapper.off(ns);
                if (this.filterInput) {
                    this.filterInput.off(ns);
                }
                if (this.tagList) {
                    this.tagList.off(ns);
                }
                suix.unbind(this.tagList);
                if (this.options.checkAll && this.checkAll) {
                    this.checkAll.off(ns);
                }
                if (this._form) {
                    this._form.off('reset', this._resetHandler);
                }
            },
            setValue: function (value) {
                value = $.isArray(value) || value instanceof ObservableArray ? value.slice(0) : [value];
                this._values = value;
            },
            items: function () {
                return this.treeview.items();
            },
            value: function (value) {
                var that = this;
                if (value) {
                    if (that.filterInput && that.dataSource._filter) {
                        that._filtering = true;
                        that.dataSource.filter({});
                    } else if (!that.dataSource.data().length || !that.treeview.dataSource.data().length) {
                        that.dataSource.fetch(function () {
                            if (that.options.loadOnDemand) {
                                that._selection._setValue(value);
                            } else {
                                that.one('allNodesAreLoaded', function () {
                                    that._selection._setValue(value);
                                });
                            }
                        });
                        return;
                    }
                }
                return that._selection._setValue(value);
            },
            text: function (text) {
                var loweredText;
                var ignoreCase = this.options.ignoreCase;
                text = text === null ? '' : text;
                if (text !== undefined && !this._isMultipleSelection()) {
                    if (typeof text !== 'string') {
                        this._textAccessor(text);
                        return;
                    }
                    loweredText = ignoreCase ? text : text.toLowerCase();
                    this._selectItemByText(loweredText);
                    this._textAccessor(loweredText);
                } else {
                    return this._textAccessor();
                }
            },
            _header: function () {
                var list = this;
                var header = $(list.header);
                var template = list.options.headerTemplate;
                this._angularElement(header, 'cleanup');
                suix.destroy(header);
                header.remove();
                if (!template) {
                    list.header = null;
                    return;
                }
                var headerTemplate = typeof template !== 'function' ? suix.template(template) : template;
                header = $(headerTemplate({}));
                list.header = header[0] ? header : null;
                list.list.prepend(header);
                this._angularElement(list.header, 'compile');
            },
            _noData: function () {
                var list = this;
                var noData = $(list.noData);
                var template = list.options.noDataTemplate === true ? list.options.messages.noData : list.options.noDataTemplate;
                list.angular('cleanup', function () {
                    return { elements: noData };
                });
                suix.destroy(noData);
                noData.remove();
                if (!template) {
                    list.noData = null;
                    return;
                }
                list.noData = $('<div class="k-nodata" style="display:none"><div></div></div>').appendTo(list.list);
                list.noDataTemplate = typeof template !== 'function' ? suix.template(template) : template;
            },
            _renderNoData: function () {
                var list = this;
                var noData = list.noData;
                if (!noData) {
                    return;
                }
                this._angularElement(noData, 'cleanup');
                noData.children(':first').html(list.noDataTemplate({ instance: list }));
                this._angularElement(noData, 'compile');
            },
            _footer: function () {
                var list = this;
                var footer = $(list.footer);
                var template = list.options.footerTemplate;
                this._angularElement(footer, 'cleanup');
                suix.destroy(footer);
                footer.remove();
                if (!template) {
                    list.footer = null;
                    return;
                }
                list.footer = $('<div class="k-footer"></div>').appendTo(list.list);
                list.footerTemplate = typeof template !== 'function' ? suix.template(template) : template;
            },
            _renderFooter: function () {
                var list = this;
                var footer = list.footer;
                if (!footer) {
                    return;
                }
                this._angularElement(footer, 'cleanup');
                footer.html(list.footerTemplate({ instance: list }));
                this._angularElement(footer, 'compile');
            },
            _enable: function () {
                var that = this, options = that.options, disabled = that.element.is('[disabled]');
                if (options.enable !== undefined) {
                    options.enabled = options.enable;
                }
                if (!options.enabled || disabled) {
                    that.enable(false);
                } else {
                    that.readonly(that.element.is('[readonly]'));
                }
            },
            _adjustListWidth: function () {
                var that = this, list = that.list, width = list[0].style.width, wrapper = that.wrapper, computedStyle, computedWidth;
                if (!list.data(WIDTH) && width) {
                    return;
                }
                computedStyle = window.getComputedStyle ? window.getComputedStyle(wrapper[0], null) : 0;
                computedWidth = parseFloat(computedStyle && computedStyle.width) || outerWidth(wrapper);
                if (computedStyle && browser.msie) {
                    computedWidth += parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight) + parseFloat(computedStyle.borderLeftWidth) + parseFloat(computedStyle.borderRightWidth);
                }
                if (list.css('box-sizing') !== 'border-box') {
                    width = computedWidth - (outerWidth(list) - list.width());
                } else {
                    width = computedWidth;
                }
                list.css({
                    fontFamily: wrapper.css('font-family'),
                    width: that.options.autoWidth ? 'auto' : width,
                    minWidth: width,
                    whiteSpace: that.options.autoWidth ? 'nowrap' : 'normal'
                }).data(WIDTH, width);
                return true;
            },
            _reset: function () {
                var that = this, element = that.element, formId = element.attr('form'), form = formId ? $('#' + formId) : element.closest('form');
                if (form[0]) {
                    that._resetHandler = function () {
                        setTimeout(function () {
                            that.value(that._initial);
                        });
                    };
                    that._form = form.on('reset', that._resetHandler);
                }
            },
            _popup: function () {
                var list = this;
                list.popup = new ui.Popup(list.list, extend({}, list.options.popup, {
                    anchor: list.wrapper,
                    open: proxy(list._openHandler, list),
                    close: proxy(list._closeHandler, list),
                    animation: list.options.animation,
                    isRtl: support.isRtl(list.wrapper),
                    autosize: list.options.autoWidth
                }));
            },
            _angularElement: function (element, action) {
                if (!element) {
                    return;
                }
                this.angular(action, function () {
                    return { elements: element };
                });
            },
            _allowOpening: function () {
                return this.options.noDataTemplate || this.treeview.dataSource.flatView().length;
            },
            _placeholder: function (show) {
                if (this.span) {
                    this.span.toggleClass('k-readonly', show).text(show ? this.options.placeholder : '');
                }
            },
            _currentValue: function (dataItem) {
                var currentValue = this._value(dataItem);
                if (!currentValue && currentValue !== 0) {
                    currentValue = dataItem;
                }
                return currentValue;
            },
            _checkValue: function (dataItem) {
                var value = '';
                var indexOfValue = -1;
                var currentValue = this.value();
                var isMultiple = this.options.tagMode === 'multiple';
                if (dataItem || dataItem === 0) {
                    if (dataItem.level) {
                        dataItem._level = dataItem.level();
                    }
                    value = this._currentValue(dataItem);
                    indexOfValue = currentValue.indexOf(value);
                }
                if (dataItem.checked) {
                    var alreadyAddedTag = $.grep(this._tags, function (item) {
                        return item.uid === dataItem._tagUid;
                    });
                    if (alreadyAddedTag.length) {
                        return;
                    }
                    var itemToAdd = new ObservableObject(dataItem.toJSON());
                    dataItem._tagUid = itemToAdd.uid;
                    this._tags.push(itemToAdd);
                    if (this._tags.length === 1) {
                        this.span.hide();
                        if (!isMultiple) {
                            this._multipleTags.push(itemToAdd);
                        }
                    }
                    if (indexOfValue === -1) {
                        currentValue.push(value);
                        this.setValue(currentValue);
                    }
                } else {
                    var itemToRemove = this._tags.find(function (item) {
                        return item.uid === dataItem._tagUid;
                    });
                    var idx = this._tags.indexOf(itemToRemove);
                    if (idx !== -1) {
                        this._tags.splice(idx, 1);
                    } else {
                        this._treeViewCheckAllCheck(dataItem);
                        return;
                    }
                    if (this._tags.length === 0) {
                        this.span.show();
                        if (!isMultiple) {
                            this._multipleTags.splice(0, 1);
                        }
                    }
                    if (indexOfValue !== -1) {
                        currentValue.splice(indexOfValue, 1);
                        this.setValue(currentValue);
                    }
                }
                this._treeViewCheckAllCheck(dataItem);
                if (!this._preventChangeTrigger && !this._valueMethodCalled && !this._noInitialValue) {
                    this.trigger(CHANGE);
                }
                if (this.options.autoClose && this.popup.visible()) {
                    this.close();
                    this.wrapper.focus();
                }
                this.popup.position();
                this._toggleCloseVisibility();
                this._updateSelectedOptions();
            },
            _updateSelectedOptions: function () {
                if (this.element[0].tagName.toLowerCase() !== 'select') {
                    return;
                }
                var selectedItems = this._tags;
                var options = '';
                var dataItem = null;
                var value = null;
                if (selectedItems.length) {
                    for (var idx = 0; idx < selectedItems.length; idx++) {
                        dataItem = selectedItems[idx];
                        value = this._value(dataItem);
                        options += this._option(value, this._text(dataItem), true);
                    }
                }
                this.element.html(options);
            },
            _option: function (dataValue, dataText, selected) {
                var option = '<option';
                if (dataValue !== undefined) {
                    dataValue += '';
                    if (dataValue.indexOf('"') !== -1) {
                        dataValue = dataValue.replace(quotRegExp, '&quot;');
                    }
                    option += ' value="' + dataValue + '"';
                }
                if (selected) {
                    option += ' selected';
                }
                option += '>';
                if (dataText !== undefined) {
                    option += suix.htmlEncode(dataText);
                }
                return option += '</option>';
            },
            _selectValue: function (dataItem) {
                var value = '';
                var text = '';
                if (dataItem || dataItem === 0) {
                    if (dataItem.level) {
                        dataItem._level = dataItem.level();
                    }
                    text = this._text(dataItem) || dataItem;
                    value = this._currentValue(dataItem);
                }
                if (value === null) {
                    value = '';
                }
                this.setValue(value);
                this._textAccessor(text, dataItem);
                this._accessor(value);
                if (!this._preventChangeTrigger && !this._valueMethodCalled) {
                    this.trigger(CHANGE);
                }
                this._valueMethodCalled = false;
                if (this.options.autoClose && this.popup.visible()) {
                    this.close();
                    this.wrapper.focus();
                }
                this.popup.position();
                this._toggleCloseVisibility();
            },
            _clearClick: function (e) {
                e.stopPropagation();
                this.wrapper.focus();
                this._clearTextAndValue();
            },
            _clearTextAndValue: function () {
                this.setValue([]);
                this._clearInput();
                this._clearText();
                this._selection._clearValue();
                this.popup.position();
                this._toggleCloseVisibility();
            },
            _clearText: function () {
                if (this.options.placeholder) {
                    this._placeholder(true);
                } else {
                    if (this.span) {
                        this.span.html('');
                    }
                }
            },
            _inputTemplate: function () {
                var template = this.options.valueTemplate;
                if (!template) {
                    template = $.proxy(suix.template('#:this._text(data)#', { useWithBlock: false }), this);
                } else {
                    template = suix.template(template);
                }
                this.valueTemplate = template;
            },
            _assignInstance: function (text, value) {
                var dataTextField = this.options.dataTextField;
                var dataItem = {};
                if (dataTextField) {
                    assign(dataItem, dataTextField.split(DOT), text);
                    assign(dataItem, this.options.dataValueField.split(DOT), value);
                    dataItem = new ObservableObject(dataItem);
                } else {
                    dataItem = text;
                }
                return dataItem;
            },
            _textAccessor: function (text, dataItem) {
                var valueTemplate = this.valueTemplate;
                var span = this.span;
                if (text === undefined) {
                    return span.text();
                }
                span.removeClass('k-readonly');
                if (!dataItem && ($.isPlainObject(text) || text instanceof ObservableObject)) {
                    dataItem = text;
                }
                if (!dataItem) {
                    dataItem = this._assignInstance(text, this._accessor());
                }
                var getElements = function () {
                    return {
                        elements: span.get(),
                        data: [{ dataItem: dataItem }]
                    };
                };
                this.angular('cleanup', getElements);
                try {
                    span.html(valueTemplate(dataItem));
                } catch (e) {
                    if (span) {
                        span.html('');
                    }
                }
                this.angular('compile', getElements);
            },
            _accessors: function () {
                var element = this.element;
                var options = this.options;
                var getter = suix.getter;
                var textField = element.attr(suix.attr('text-field'));
                var valueField = element.attr(suix.attr('value-field'));
                var getterFunction = function (field) {
                    if ($.isArray(field)) {
                        var count = field.length;
                        var levels = $.map(field, function (x) {
                            return function (d) {
                                return d[x];
                            };
                        });
                        return function (dataItem) {
                            var level = dataItem._level;
                            if (!level && level !== 0) {
                                return;
                            }
                            return levels[Math.min(level, count - 1)](dataItem);
                        };
                    } else {
                        return getter(field);
                    }
                };
                if (!options.dataTextField && textField) {
                    options.dataTextField = textField;
                }
                if (!options.dataValueField && valueField) {
                    options.dataValueField = valueField;
                }
                options.dataTextField = options.dataTextField || 'text';
                options.dataValueField = options.dataValueField || 'value';
                this._text = getterFunction(options.dataTextField);
                this._value = getterFunction(options.dataValueField);
            },
            _accessor: function (value, idx) {
                return this._accessorInput(value, idx);
            },
            _accessorInput: function (value) {
                var element = this.element[0];
                if (value === undefined) {
                    return element.value;
                } else {
                    if (value === null) {
                        value = '';
                    }
                    element.value = value;
                }
            },
            _clearInput: function () {
                var element = this.element[0];
                element.value = '';
            },
            _clearButton: function () {
                var clearTitle = this.options.messages.clear;
                if (!this._clear) {
                    this._clear = $('<span unselectable="on" class="k-icon k-clear-value k-i-close" title="' + clearTitle + '"></span>').attr({
                        'role': 'button',
                        'tabIndex': -1
                    });
                }
                if (this.options.clearButton) {
                    this._clear.insertAfter(this.span);
                    this.wrapper.addClass('k-dropdowntree-clearable');
                } else {
                    if (!this.options.clearButton) {
                        this._clear.remove();
                    }
                }
            },
            _toggleCloseVisibility: function () {
                var isReadOnly = this.element.attr(READONLY);
                var hasValue = this.value() && !this._isMultipleSelection() || this.value().length;
                var valueDoesNotEqualPlaceHolder = this.element.val() && this.element.val() !== this.options.placeholder;
                if (!isReadOnly && (hasValue || valueDoesNotEqualPlaceHolder)) {
                    this._showClear();
                } else {
                    this._hideClear();
                }
            },
            _showClear: function () {
                if (this._clear) {
                    this._clear.removeClass(HIDDENCLASS);
                }
            },
            _hideClear: function () {
                if (this._clear) {
                    this._clear.addClass(HIDDENCLASS);
                }
            },
            _openHandler: function (e) {
                this._adjustListWidth();
                if (this.trigger(OPEN)) {
                    e.preventDefault();
                } else {
                    this.wrapper.attr('aria-expanded', true);
                    this.tree.attr('aria-hidden', false).attr('role', 'tree');
                }
            },
            _closeHandler: function (e) {
                if (this.trigger(CLOSE)) {
                    e.preventDefault();
                } else {
                    this.wrapper.attr('aria-expanded', false);
                    this.tree.attr('aria-hidden', true);
                }
            },
            _treeview: function () {
                var that = this;
                if (that.options.height) {
                    that.tree.css('max-height', that.options.height);
                }
                that.tree.attr('id', suix.guid());
                that.treeview = new TreeView(that.tree, extend({}, that.options.treeview), that);
                that.dataSource = that.treeview.dataSource;
                that.treeview.bind('select', function (e) {
                    that.trigger('select', e);
                });
            },
            _treeViewDataBound: function (e) {
                if (e.node && this._prev && this._prev.length) {
                    e.sender.expand(e.node);
                }
                if (this._filtering) {
                    if (!e.node) {
                        this._filtering = false;
                    }
                    if (!this._isMultipleSelection()) {
                        this._deselectItem(e);
                    }
                    return;
                }
                if (!this.treeview) {
                    this.treeview = e.sender;
                }
                if (!e.node) {
                    var rootItems = e.sender.dataSource.data();
                    this._checkLoadedItems(rootItems);
                    if (this._noInitialValue) {
                        this._noInitialValue = false;
                    }
                } else {
                    var rootItem = e.sender.dataItem(e.node);
                    if (rootItem) {
                        var subItems = rootItem.children.data();
                        this._checkLoadedItems(subItems);
                    }
                }
                this.trigger('dataBound', e);
            },
            _deselectItem: function (e) {
                var items = [];
                if (!e.node) {
                    items = e.sender.dataSource.data();
                } else {
                    var rootItem = e.sender.dataItem(e.node);
                    if (rootItem) {
                        items = rootItem.children.data();
                    }
                }
                for (var i = 0; i < items.length; i++) {
                    if (items[i].selected && !this._valueComparer(items[i], this.value())) {
                        items[i].set('selected', false);
                    }
                }
            },
            _checkLoadedItems: function (items) {
                var value = this.value();
                if (!items) {
                    return;
                }
                for (var idx = 0; idx < items.length; idx++) {
                    this._selection._checkLoadedItem(items[idx], value);
                }
            },
            _treeViewCheckAllCheck: function (dataItem) {
                if (this.options.checkAll && this.checkAll) {
                    this._getAllChecked();
                    if (dataItem.checked) {
                        this._checkCheckAll();
                    } else {
                        this._uncheckCheckAll();
                    }
                }
            },
            _checkCheckAll: function () {
                var checkAllCheckbox = this.checkAll.find('.k-checkbox');
                if (this._allItemsAreChecked) {
                    checkAllCheckbox.prop('checked', true).prop('indeterminate', false);
                } else {
                    checkAllCheckbox.prop('indeterminate', true);
                }
            },
            _uncheckCheckAll: function () {
                var checkAllCheckbox = this.checkAll.find('.k-checkbox');
                if (this._allItemsAreUnchecked) {
                    checkAllCheckbox.prop('checked', false).prop('indeterminate', false);
                } else {
                    checkAllCheckbox.prop('indeterminate', true);
                }
            },
            _filterHeader: function () {
                var icon;
                if (this.filterInput) {
                    this.filterInput.off(ns).parent().remove();
                    this.filterInput = null;
                }
                if (this._isFilterEnabled()) {
                    this._disableCheckChildren();
                    icon = '<span class="k-icon k-i-zoom"></span>';
                    this.filterInput = $('<input class="k-textbox"/>').attr({
                        placeholder: this.element.attr('placeholder'),
                        title: this.element.attr('title'),
                        role: 'listbox',
                        'aria-haspopup': true,
                        'aria-expanded': false
                    });
                    this.filterInput.on('input', proxy(this._filterChange, this));
                    $('<span class="k-list-filter" />').insertBefore(this.tree).append(this.filterInput.add(icon));
                }
            },
            _filterChange: function () {
                if (this.filterInput) {
                    this._search();
                }
            },
            _disableCheckChildren: function () {
                if (this._isMultipleSelection() && this.options.treeview.checkboxes && this.options.treeview.checkboxes.checkChildren) {
                    this.options.treeview.checkboxes.checkChildren = false;
                }
            },
            _checkAll: function () {
                if (this.checkAll) {
                    this.checkAll.find('.k-checkbox-label, .k-checkbox').off(ns);
                    this.checkAll.remove();
                    this.checkAll = null;
                }
                if (this._isMultipleSelection() && this.options.checkAll) {
                    this.checkAll = $('<div class="k-check-all"><input type="checkbox" class="k-checkbox"/><span class="k-checkbox-label">Check All</span></div>').insertBefore(this.tree);
                    this.checkAll.find('.k-checkbox-label').html(suix.template(this.options.checkAllTemplate)({ instance: this }));
                    this.checkAll.find('.k-checkbox-label').on(CLICK + ns, proxy(this._clickCheckAll, this));
                    this.checkAll.find('.k-checkbox').on('change' + ns, proxy(this._changeCheckAll, this)).on('keydown' + ns, proxy(this._keydownCheckAll, this));
                    this._disabledCheckedItems = [];
                    this._disabledUnCheckedItems = [];
                    this._getAllChecked();
                    if (!this._allItemsAreUnchecked) {
                        this._checkCheckAll();
                    }
                }
            },
            _changeCheckAll: function () {
                var checkAllCheckbox = this.checkAll.find('.k-checkbox');
                var isChecked = checkAllCheckbox.prop('checked');
                this._updateCheckAll(isChecked);
            },
            _updateCheckAll: function (isChecked) {
                var checkAllCheckbox = this.checkAll.find('.k-checkbox');
                this._toggleCheckAllItems(isChecked);
                checkAllCheckbox.prop('checked', isChecked);
                if (this._disabledCheckedItems.length && this._disabledUnCheckedItems.length) {
                    checkAllCheckbox.prop('indeterminate', true);
                } else if (this._disabledCheckedItems.length) {
                    checkAllCheckbox.prop('indeterminate', !isChecked);
                } else if (this._disabledUnCheckedItems.length) {
                    checkAllCheckbox.prop('indeterminate', isChecked);
                } else {
                    checkAllCheckbox.prop('indeterminate', false);
                }
                this._disabledCheckedItems = [];
                this._disabledUnCheckedItems = [];
            },
            _keydownCheckAll: function (e) {
                var key = e.keyCode;
                var altKey = e.altKey;
                if (altKey && key === keys.UP || key === keys.ESC || key === keys.TAB) {
                    this.close();
                    this.wrapper.focus();
                    e.preventDefault();
                    return;
                }
                if (key === keys.UP) {
                    if (this.filterInput) {
                        this.filterInput.focus();
                    } else {
                        this.wrapper.focus();
                    }
                    e.preventDefault();
                }
                if (key === keys.DOWN) {
                    if (this.tree && this.tree.is(':visible')) {
                        this.tree.focus();
                    }
                    e.preventDefault();
                }
                if (key === keys.SPACEBAR && (browser.msie || browser.edge)) {
                    this._clickCheckAll();
                    e.preventDefault();
                }
            },
            _clickCheckAll: function () {
                var checkAllCheckbox = this.checkAll.find('.k-checkbox');
                var isChecked = checkAllCheckbox.prop('checked');
                this._updateCheckAll(!isChecked);
                checkAllCheckbox.focus();
            },
            _dfs: function (items, action, prop) {
                for (var idx = 0; idx < items.length; idx++) {
                    if (!this[action](items[idx], prop)) {
                        break;
                    }
                    this._traverceChildren(items[idx], action, prop);
                }
            },
            _uncheckItemByUid: function (uid) {
                this._dfs(this.dataSource.data(), '_uncheckItemEqualsUid', uid);
            },
            _uncheckItemEqualsUid: function (item, uid) {
                if (item.enabled !== false && item._tagUid == uid) {
                    item.set('checked', false);
                    return false;
                }
                return true;
            },
            _selectItemByText: function (text) {
                this._dfs(this.dataSource.data(), '_itemEqualsText', text);
            },
            _itemEqualsText: function (item, text) {
                if (item.enabled !== false && this._text(item) === text) {
                    this.treeview.select(this.treeview.findByUid(item.uid));
                    this._selectValue(item);
                    return false;
                }
                return true;
            },
            _selectItemByValue: function (value) {
                this._dfs(this.dataSource.data(), '_itemEqualsValue', value);
            },
            _itemEqualsValue: function (item, value) {
                if (item.enabled !== false && this._valueComparer(item, value)) {
                    this.treeview.select(this.treeview.findByUid(item.uid));
                    return false;
                }
                return true;
            },
            _checkItemByValue: function (value) {
                var items = this.treeview.dataItems();
                for (var idx = 0; idx < value.length; idx++) {
                    this._dfs(items, '_checkItemEqualsValue', value[idx]);
                }
            },
            _checkItemEqualsValue: function (item, value) {
                if (item.enabled !== false && this._valueComparer(item, value)) {
                    item.set('checked', true);
                    return false;
                }
                return true;
            },
            _valueComparer: function (item, value) {
                var itemValue = this._value(item);
                var itemText;
                if (!this._isNullorUndefined(itemValue)) {
                    if (this._isNullorUndefined(value)) {
                        return false;
                    }
                    var newValue = this._value(value);
                    if (newValue) {
                        return itemValue == newValue;
                    } else {
                        return itemValue == value;
                    }
                }
                itemText = this._text(item);
                if (itemText) {
                    if (this._text(value)) {
                        return itemText == this._text(value);
                    } else {
                        return itemText == value;
                    }
                }
                return false;
            },
            _isNullorUndefined: function (value) {
                return value === undefined || value === null;
            },
            _getAllChecked: function () {
                this._allCheckedItems = [];
                this._allItemsAreChecked = true;
                this._allItemsAreUnchecked = true;
                this._dfs(this.dataSource.data(), '_getAllCheckedItems');
                return this._allCheckedItems;
            },
            _getAllCheckedItems: function (item) {
                if (this._allItemsAreChecked) {
                    this._allItemsAreChecked = item.checked;
                }
                if (this._allItemsAreUnchecked) {
                    this._allItemsAreUnchecked = !item.checked;
                }
                if (item.checked) {
                    this._allCheckedItems.push(item);
                }
                return true;
            },
            _traverceChildren: function (item, action, prop) {
                var childrenField = item._childrenOptions && item._childrenOptions.schema ? item._childrenOptions.schema.data : null;
                var subItems = item[childrenField] || item.items || item.children;
                if (!subItems) {
                    return;
                }
                this._dfs(subItems, action, prop);
            },
            _toggleCheckAllItems: function (checked) {
                this._dfs(this.dataSource.data(), '_checkAllCheckItem', checked);
            },
            _checkAllCheckItem: function (item, checked) {
                if (item.enabled === false) {
                    if (item.checked) {
                        this._disabledCheckedItems.push(item);
                    } else {
                        this._disabledUnCheckedItems.push(item);
                    }
                } else {
                    item.set('checked', checked);
                }
                return true;
            },
            _isFilterEnabled: function () {
                var filter = this.options.filter;
                return filter && filter !== 'none';
            },
            _editable: function (options) {
                var that = this;
                var element = that.element;
                var disable = options.disable;
                var readonly = options.readonly;
                var wrapper = that.wrapper.add(that.filterInput).off(ns);
                var dropDownWrapper = that._inputWrapper.off(HOVEREVENTS);
                if (that._isMultipleSelection()) {
                    that.tagList.off(CLICK + ns);
                }
                if (!readonly && !disable) {
                    element.removeAttr(DISABLED).removeAttr(READONLY);
                    dropDownWrapper.removeClass(STATEDISABLED).on(HOVEREVENTS, that._toggleHover);
                    that._clear.on('click' + ns, proxy(that._clearClick, that));
                    wrapper.attr(TABINDEX, wrapper.data(TABINDEX)).attr(ARIA_DISABLED, false).on('keydown' + ns, proxy(that._keydown, that)).on('focusin' + ns, proxy(that._focusinHandler, that)).on('focusout' + ns, proxy(that._focusoutHandler, that));
                    that.wrapper.on(CLICK + ns, proxy(that._wrapperClick, that));
                    if (this._isMultipleSelection()) {
                        that.tagList.on(CLICK + ns, 'li.k-button', function (e) {
                            $(e.currentTarget).addClass(FOCUSED);
                        });
                        that.tagList.on(CLICK + ns, '.k-select', function (e) {
                            that._removeTagClick(e);
                        });
                    }
                } else if (disable) {
                    wrapper.removeAttr(TABINDEX);
                    dropDownWrapper.addClass(STATEDISABLED);
                } else {
                    wrapper.attr(TABINDEX, wrapper.data(TABINDEX));
                    dropDownWrapper.removeClass(STATEDISABLED);
                    wrapper.on('focusin' + ns, proxy(that._focusinHandler, that)).on('focusout' + ns, proxy(that._focusoutHandler, that));
                }
                element.attr(DISABLED, disable).attr(READONLY, readonly);
                wrapper.attr(ARIA_DISABLED, disable);
            },
            _focusinHandler: function () {
                this._inputWrapper.addClass(FOCUSED);
                this._prevent = false;
            },
            _focusoutHandler: function () {
                var that = this;
                if (this._isMultipleSelection()) {
                    this.tagList.find(DOT + FOCUSED).removeClass(FOCUSED);
                }
                if (!that._prevent) {
                    this._inputWrapper.removeClass(FOCUSED);
                    that._prevent = true;
                    that.element.blur();
                }
            },
            _toggle: function (open) {
                open = open !== undefined ? open : !this.popup.visible();
                this[open ? OPEN : CLOSE]();
            },
            _wrapperClick: function (e) {
                e.preventDefault();
                this.popup.unbind('activate', this._focusInputHandler);
                this._focused = this.wrapper;
                this._prevent = false;
                this._toggle();
            },
            _toggleHover: function (e) {
                $(e.currentTarget).toggleClass(HOVER, e.type === 'mouseenter');
            },
            _focusInput: function () {
                if (this.filterInput) {
                    this.filterInput.focus();
                } else if (this.checkAll) {
                    this.checkAll.find('.k-checkbox').focus();
                } else if (this.tree.is(':visible')) {
                    this.tree.focus();
                }
            },
            _keydown: function (e) {
                var key = e.keyCode;
                var altKey = e.altKey;
                var isFilterInputActive;
                var isWrapperActive;
                var focused, tagItem;
                var isPopupVisible = this.popup.visible();
                if (this.filterInput) {
                    isFilterInputActive = this.filterInput[0] === activeElement();
                }
                if (this.wrapper) {
                    isWrapperActive = this.wrapper[0] === activeElement();
                }
                if (isWrapperActive) {
                    if (key === keys.ESC) {
                        this._clearTextAndValue();
                        e.preventDefault();
                        return;
                    }
                    if (this._isMultipleSelection()) {
                        if (key === keys.LEFT) {
                            this._focusPrevTag();
                            e.preventDefault();
                            return;
                        }
                        if (key === keys.RIGHT) {
                            this._focusNextTag();
                            e.preventDefault();
                            return;
                        }
                        if (key === keys.HOME) {
                            this._focusFirstTag();
                            e.preventDefault();
                            return;
                        }
                        if (key === keys.END) {
                            this._focusLastTag();
                            e.preventDefault();
                            return;
                        }
                        if (key === keys.DELETE) {
                            focused = this.tagList.find(DOT + FOCUSED).first();
                            if (focused.length) {
                                tagItem = this._tags[focused.index()];
                                this._removeTag(tagItem);
                            }
                            e.preventDefault();
                            return;
                        }
                        if (key === keys.BACKSPACE) {
                            focused = this.tagList.find(DOT + FOCUSED).first();
                            if (focused.length) {
                                tagItem = this._tags[focused.index()];
                                this._removeTag(tagItem);
                            } else {
                                focused = this._focusLastTag();
                                if (focused.length) {
                                    tagItem = this._tags[focused.index()];
                                    this._removeTag(tagItem);
                                }
                            }
                            e.preventDefault();
                            return;
                        }
                    }
                }
                if (isFilterInputActive) {
                    if (key === keys.ESC) {
                        this._clearFilter();
                    }
                    if (key === keys.UP && !altKey) {
                        this.wrapper.focus();
                        e.preventDefault();
                    }
                    if (browser.msie && browser.version < 10) {
                        if (key === keys.BACKSPACE || key === keys.DELETE) {
                            this._search();
                        }
                    }
                    if (key === keys.TAB) {
                        this.close();
                        this.wrapper.focus();
                        e.preventDefault();
                        return;
                    }
                }
                if (altKey && key === keys.UP || key === keys.ESC) {
                    this.close();
                    this.wrapper.focus();
                    e.preventDefault();
                    return;
                }
                if (key === keys.ENTER && this._typingTimeout && this.filterInput && isPopupVisible) {
                    e.preventDefault();
                    return;
                }
                if (key === keys.SPACEBAR && !isFilterInputActive) {
                    this._toggle(!isPopupVisible);
                    e.preventDefault();
                }
                if (altKey && key === keys.DOWN && !isPopupVisible) {
                    this.open();
                    e.preventDefault();
                }
                if (key === keys.DOWN && isPopupVisible) {
                    if (this.filterInput && !isFilterInputActive) {
                        this.filterInput.focus();
                    } else if (this.checkAll && this.checkAll.is(':visible')) {
                        this.checkAll.find('input').focus();
                    } else if (this.tree.is(':visible')) {
                        this.tree.focus();
                    }
                    e.preventDefault();
                }
                if (key === keys.TAB && isPopupVisible) {
                    this.close();
                    this.wrapper.focus();
                    e.preventDefault();
                }
            },
            _focusPrevTag: function () {
                var focused = this.tagList.find(DOT + FOCUSED);
                if (focused.length) {
                    var activedescendant = this.wrapper.attr('aria-activedescendant');
                    focused.first().removeClass(FOCUSED).removeAttr('id').prev().addClass(FOCUSED).attr('id', activedescendant);
                    this.wrapper.attr('aria-activedescendant', activedescendant);
                } else {
                    this._focusLastTag();
                }
            },
            _focusNextTag: function () {
                var focused = this.tagList.find(DOT + FOCUSED);
                if (focused.length) {
                    var activedescendant = this.wrapper.attr('aria-activedescendant');
                    focused.first().removeClass(FOCUSED).removeAttr('id').next().addClass(FOCUSED).attr('id', activedescendant);
                    this.wrapper.attr('aria-activedescendant', activedescendant);
                } else {
                    this._focusFirstTag();
                }
            },
            _focusFirstTag: function () {
                var activedescendant = this.wrapper.attr('aria-activedescendant');
                this._clearDisabledTag();
                var firstTag = this.tagList.children('li').first().addClass(FOCUSED).attr('id', activedescendant);
                this.wrapper.attr('aria-activedescendant', activedescendant);
                return firstTag;
            },
            _focusLastTag: function () {
                var activedescendant = this.wrapper.attr('aria-activedescendant');
                this._clearDisabledTag();
                var lastTag = this.tagList.children('li').last().addClass(FOCUSED).attr('id', activedescendant);
                this.wrapper.attr('aria-activedescendant', activedescendant);
                return lastTag;
            },
            _clearDisabledTag: function () {
                this.tagList.find(DOT + FOCUSED).removeClass(FOCUSED).removeAttr('id');
            },
            _search: function () {
                var that = this;
                clearTimeout(that._typingTimeout);
                that._typingTimeout = setTimeout(function () {
                    var value = that.filterInput.val();
                    if (that._prev !== value) {
                        that._prev = value;
                        that.search(value);
                    }
                    that._typingTimeout = null;
                }, that.options.delay);
            },
            _clearFilter: function () {
                if (this.filterInput.val().length) {
                    this.filterInput.val('');
                    this._prev = '';
                    this._filtering = true;
                    this.treeview.dataSource.filter({});
                }
            },
            _removeTagClick: function (e) {
                e.stopPropagation();
                var tagItem = this._tags[$(e.currentTarget.parentElement).index()];
                this._removeTag(tagItem);
            },
            _removeTag: function (tagItem) {
                if (!tagItem) {
                    return;
                }
                var uid = tagItem.uid;
                this._uncheckItemByUid(uid);
            }
        });
        function assign(instance, fields, value) {
            var idx = 0, lastIndex = fields.length - 1, field;
            for (; idx < lastIndex; ++idx) {
                field = fields[idx];
                if (!(field in instance)) {
                    instance[field] = {};
                }
                instance = instance[field];
            }
            instance[fields[lastIndex]] = value;
        }
        ui.plugin(DropDownTree);
        var SingleSelection = suix.Class.extend({
            init: function (view) {
                this._dropdowntree = view;
            },
            _initWrapper: function () {
                this._wrapper();
                this._span();
            },
            _preselect: function (data) {
                var dropdowntree = this._dropdowntree;
                dropdowntree._selectValue(data);
            },
            _wrapper: function () {
                var dropdowntree = this._dropdowntree, element = dropdowntree.element, DOMelement = element[0], wrapper;
                wrapper = element.parent();
                if (!wrapper.is('span.k-widget')) {
                    wrapper = element.wrap('<span />').parent();
                    wrapper[0].style.cssText = DOMelement.style.cssText;
                    wrapper[0].title = DOMelement.title;
                }
                dropdowntree._focused = dropdowntree.wrapper = wrapper.addClass('k-widget k-dropdowntree').addClass(DOMelement.className).removeClass('input-validation-error').css('display', '').attr({
                    accesskey: element.attr('accesskey'),
                    unselectable: 'on',
                    role: 'listbox',
                    'aria-haspopup': true,
                    'aria-expanded': false
                });
                element.hide().removeAttr('accesskey');
            },
            _span: function () {
                var dropdowntree = this._dropdowntree, wrapper = dropdowntree.wrapper, SELECTOR = 'span.k-input', span;
                span = wrapper.find(SELECTOR);
                if (!span[0]) {
                    wrapper.append('<span unselectable="on" class="k-dropdown-wrap k-state-default"><span unselectable="on" class="k-input">&nbsp;</span><span unselectable="on" class="k-select" aria-label="select"><span class="k-icon k-i-arrow-60-down"></span></span></span>').append(dropdowntree.element);
                    span = wrapper.find(SELECTOR);
                }
                dropdowntree.span = span;
                dropdowntree._inputWrapper = $(wrapper[0].firstChild);
                dropdowntree._arrow = wrapper.find('.k-select');
                dropdowntree._arrowIcon = dropdowntree._arrow.find('.k-icon');
            },
            _setValue: function (value) {
                var dropdowntree = this._dropdowntree;
                var currentValue;
                if (value === undefined || value === null) {
                    currentValue = dropdowntree._values.slice()[0];
                    value = typeof currentValue === 'object' ? currentValue : dropdowntree._accessor() || currentValue;
                    return value === undefined || value === null ? '' : value;
                }
                dropdowntree._valueMethodCalled = true;
                if (value.length === 0) {
                    dropdowntree._clearTextAndValue();
                    dropdowntree._valueMethodCalled = false;
                    return;
                }
                dropdowntree._selectItemByValue(value);
                dropdowntree._toggleCloseVisibility();
            },
            _clearValue: function () {
                var dropdowntree = this._dropdowntree;
                var selectedNode = dropdowntree.treeview.select();
                if (dropdowntree.treeview.dataItem(selectedNode)) {
                    dropdowntree.treeview.dataItem(selectedNode).set('selected', false);
                    if (!dropdowntree._valueMethodCalled) {
                        dropdowntree.trigger(CHANGE);
                    }
                }
            },
            _checkLoadedItem: function (tempItem, value) {
                var dropdowntree = this._dropdowntree;
                if (!dropdowntree._isNullorUndefined(value) && value !== '') {
                    if (dropdowntree._valueComparer(tempItem, value)) {
                        dropdowntree._preventChangeTrigger = true;
                        tempItem.set('selected', true);
                        dropdowntree._preventChangeTrigger = false;
                    } else if (tempItem.selected) {
                        dropdowntree.treeview.select(dropdowntree.treeview.findByUid(tempItem.uid));
                    }
                } else if (!value && tempItem.selected) {
                    dropdowntree.treeview.select(dropdowntree.treeview.findByUid(tempItem.uid));
                }
            }
        });
        var MultipleSelection = suix.Class.extend({
            init: function (view) {
                this._dropdowntree = view;
            },
            _initWrapper: function () {
                var dropdowntree = this._dropdowntree;
                this._tagTemplate();
                dropdowntree.element.attr('multiple', 'multiple').hide();
                this._wrapper();
                dropdowntree._tags = new ObservableArray([]);
                dropdowntree._multipleTags = new ObservableArray([]);
                this._tagList();
                dropdowntree.span = $('<span unselectable="on" class="k-input">&nbsp;</span>').insertAfter(dropdowntree.tagList);
                dropdowntree._inputWrapper = $(dropdowntree.wrapper[0].firstChild);
            },
            _preselect: function (data, value) {
                var dropdowntree = this._dropdowntree;
                var valueToSelect = value || dropdowntree.options.value;
                if (!$.isArray(data) && !(data instanceof suix.data.ObservableArray)) {
                    data = [data];
                }
                if ($.isPlainObject(data[0]) || data[0] instanceof suix.data.ObservableObject || !dropdowntree.options.dataValueField) {
                    dropdowntree.dataSource.data(data);
                    dropdowntree.value(valueToSelect);
                }
            },
            _tagTemplate: function () {
                var dropdowntree = this._dropdowntree;
                var options = dropdowntree.options;
                var tagTemplate = options.valueTemplate;
                var isMultiple = options.tagMode === 'multiple';
                var singleTag = options.messages.singleTag;
                tagTemplate = tagTemplate ? suix.template(tagTemplate) : dropdowntree.valueTemplate;
                dropdowntree.valueTemplate = function (data) {
                    if (isMultiple) {
                        return '<li class="k-button ' + (data.enabled === false ? 'k-state-disabled' : '') + '" unselectable="on" role="option" ' + (data.enabled === false ? 'aria-disabled="true"' : '') + '>' + '<span unselectable="on">' + tagTemplate(data) + '</span>' + '<span title="' + dropdowntree.options.messages.deleteTag + '" aria-label="' + dropdowntree.options.messages.deleteTag + '" class="k-select">' + '<span class="k-icon k-i-close"></span>' + '</span>' + '</li>';
                    }
                    return '<li class="k-button" unselectable="on" role="option">' + '<span unselectable="on" data-bind="text: tags.length"></span>' + '<span unselectable="on">&nbsp;' + singleTag + '</span>' + '</li>';
                };
            },
            _wrapper: function () {
                var dropdowntree = this._dropdowntree, element = dropdowntree.element, wrapper = element.parent('span.k-dropdowntree');
                if (!wrapper[0]) {
                    wrapper = element.wrap('<div class="k-widget k-dropdowntree" unselectable="on" />').parent();
                    wrapper[0].style.cssText = element[0].style.cssText;
                    wrapper[0].title = element[0].title;
                    $('<div class="k-multiselect-wrap k-floatwrap" unselectable="on" />').insertBefore(element);
                }
                dropdowntree.wrapper = wrapper.addClass(element[0].className).css('display', '').attr({
                    role: 'listbox',
                    'aria-activedescendant': suix.guid(),
                    'aria-haspopup': true,
                    'aria-expanded': false
                });
                dropdowntree._innerWrapper = $(wrapper[0].firstChild);
            },
            _tagList: function () {
                var dropdowntree = this._dropdowntree, tagList = dropdowntree._innerWrapper.children('ul');
                if (!tagList[0]) {
                    var isMultiple = dropdowntree.options.tagMode === 'multiple';
                    var tagCollection = isMultiple ? 'tags' : 'multipleTag';
                    tagList = $('<ul role="listbox" unselectable="on" data-template="tagTemplate" data-bind="source: ' + tagCollection + '" class="k-reset"/>').appendTo(dropdowntree._innerWrapper);
                }
                dropdowntree.tagList = tagList;
                dropdowntree.tagList.attr('id', suix.guid() + '_tagList');
                dropdowntree.wrapper.attr('aria-owns', dropdowntree.tagList.attr('id'));
                var viewModel = suix.observable({
                    multipleTag: dropdowntree._multipleTags,
                    tags: dropdowntree._tags,
                    tagTemplate: dropdowntree.valueTemplate
                });
                suix.bind(dropdowntree.tagList, viewModel);
                dropdowntree.tagList.attr('data-stop', true);
            },
            _setValue: function (value) {
                var dropdowntree = this._dropdowntree;
                var oldValues = dropdowntree._values;
                if (value === undefined || value === null) {
                    return dropdowntree._values.slice();
                }
                dropdowntree.setValue(value);
                dropdowntree._valueMethodCalled = true;
                if (value.length) {
                    this._removeValues(oldValues, value);
                    dropdowntree._checkItemByValue(value);
                } else {
                    dropdowntree._clearTextAndValue();
                }
                dropdowntree._valueMethodCalled = false;
                dropdowntree._toggleCloseVisibility();
            },
            _removeValues: function (oldValues, value) {
                var dropdowntree = this._dropdowntree;
                var removedValues = this._getNewValues(oldValues, value);
                for (var idx = 0; idx < removedValues.length; idx++) {
                    for (var j = 0; j < dropdowntree._tags.length; j++) {
                        if (dropdowntree._valueComparer(dropdowntree._tags[j], removedValues[idx])) {
                            dropdowntree._uncheckItemByUid(dropdowntree._tags[j].uid);
                        }
                    }
                }
            },
            _getNewValues: function (oldValues, value) {
                var removedValues = [];
                for (var idx = 0; idx < oldValues.length; idx++) {
                    if (value.indexOf(oldValues[idx]) === -1) {
                        removedValues.push(oldValues[idx]);
                    }
                }
                return removedValues;
            },
            _clearValue: function () {
                var dropdowntree = this._dropdowntree;
                var tagsArray = dropdowntree._tags.slice();
                for (var idx = 0; idx < tagsArray.length; idx++) {
                    var uid = tagsArray[idx].uid;
                    dropdowntree._preventChangeTrigger = true;
                    dropdowntree._uncheckItemByUid(uid);
                }
                if (tagsArray.length) {
                    dropdowntree._preventChangeTrigger = false;
                    if (!dropdowntree._valueMethodCalled) {
                        dropdowntree.trigger(CHANGE);
                    }
                }
            },
            _checkLoadedItem: function (tempItem, value) {
                var dropdowntree = this._dropdowntree;
                if (dropdowntree._noInitialValue && tempItem.checked) {
                    dropdowntree._checkValue(tempItem);
                    return;
                }
                if ((value.length || this._isDataSourceSet) && (value.indexOf(dropdowntree._currentValue(tempItem)) !== -1 || value.indexOf(tempItem)) !== -1 && !this._findTag(dropdowntree._currentValue(tempItem))) {
                    if (tempItem.checked) {
                        dropdowntree._checkValue(tempItem);
                    } else {
                        dropdowntree._preventChangeTrigger = true;
                        tempItem.set('checked', true);
                        dropdowntree._preventChangeTrigger = false;
                    }
                }
            },
            _findTag: function (tempItemValue) {
                var dropdowntree = this._dropdowntree;
                return dropdowntree._tags.find(function (item) {
                    return dropdowntree._valueComparer(item, tempItemValue);
                });
            }
        });
        suix.ui.DropDownTree.SingleSelection = SingleSelection;
        suix.ui.DropDownTree.MultipleSelection = MultipleSelection;
    }(window.suix.jQuery));
    return window.suix;
}, typeof define == 'function' && define.amd ? define : function (a1, a2, a3) {
    (a3 || a2)();
}));
(function (f, define) {
    define('suix.drawer', ['suix.userevents'], f);
}(function () {
    var __meta__ = {
        id: 'drawer',
        name: 'Drawer',
        category: 'web',
        description: 'The Suix Drawer widget provides slide to reveal sidebar',
        depends: ['userevents']
    };
    (function ($, undefined) {
        var suix = window.suix, ui = suix.ui, Widget = ui.Widget, SHOW = 'show', HIDE = 'hide', ITEMCLICK = 'itemClick', PUSH = 'push', OVERLAY = 'overlay', LEFT = 'left', RIGHT = 'right';
        var Drawer = suix.ui.Widget.extend({
            init: function (element, options) {
                var that = this;
                var userEvents;
                Widget.fn.init.call(this, element, options);
                options = that.options;
                that._element(element);
                that._wrapper(element);
                that.position();
                that._mode();
                if (options.mini) {
                    that._miniMode();
                }
                that._initDrawerItems();
                if (options.mini && options.mode != PUSH) {
                    that._setBodyOffset();
                }
                userEvents = this.userEvents = new suix.UserEvents(options.mode != PUSH ? $(document.body) : this.drawerContainer, {
                    fastTap: true,
                    allowSelection: true
                });
                var tap = function (e) {
                    if ($.contains(that.drawerItemsWrapper[0], e.event.target)) {
                        that._itemClick(e);
                    }
                    if (that.visible && !that.trigger('hide', { sender: this })) {
                        that.hide();
                        e.preventDefault();
                    }
                };
                if (this.options.swipeToOpen) {
                    userEvents.bind('start', function (e) {
                        that._start(e);
                    });
                    userEvents.bind('move', function (e) {
                        that._update(e);
                    });
                    userEvents.bind('end', function (e) {
                        that._end(e);
                    });
                    userEvents.bind('tap', tap);
                } else {
                    userEvents.bind('press', tap);
                }
                if (options.minHeight && options.mode == PUSH) {
                    that.drawerContainer.css('min-height', options.minHeight);
                }
            },
            _element: function () {
                var that = this;
                var element = that.element;
                var options = that.options;
                var contentElement = that.contentElement = element.children().first();
                that.drawerElement = $(options.template);
                contentElement.addClass('k-drawer-content');
                element.addClass('k-widget k-drawer');
            },
            _wrapper: function () {
                var options = this.options;
                var drawerElement = this.drawerElement;
                var element = this.element;
                var contentElement = this.contentElement;
                var drawerItemsWrapper = this.drawerItemsWrapper = drawerElement.wrap('<div class=\'k-drawer-items\'></div>').parent();
                var drawerWrapper = this.drawerWrapper = drawerItemsWrapper.wrap('<div class=\'k-drawer-wrapper\'></div>').parent();
                var drawerContainer = this.drawerContainer = element.wrap('<div class=\'k-drawer-container\'></div>').parent();
                if (options.mini) {
                    if (options.mini.width) {
                        drawerWrapper.width(options.mini.width);
                    }
                } else {
                    drawerWrapper.width(0);
                }
                if (options.mode === PUSH) {
                    drawerContainer.append(contentElement);
                } else if (options.mode === OVERLAY) {
                    drawerContainer.after(contentElement);
                    $(document.body).prepend(drawerContainer);
                }
                element.append(drawerWrapper);
            },
            _setBodyOffset: function () {
                var overlayMiniOffset = this.element.outerWidth();
                if (this.leftPositioned) {
                    $(document.body).css('padding-left', overlayMiniOffset);
                } else {
                    $(document.body).css('padding-right', overlayMiniOffset);
                }
            },
            _initDrawerItems: function () {
                var drawerItemsWrapper = this.drawerItemsWrapper;
                var drawerItems = drawerItemsWrapper.find('[data-role=\'drawer-item\']');
                var separatorItems = drawerItemsWrapper.find('[data-role=\'drawer-separator\']');
                drawerItems.addClass('k-drawer-item');
                separatorItems.addClass('k-drawer-item k-drawer-separator');
                if (this._selectedItemIndex >= 0) {
                    drawerItems.removeClass('k-state-selected');
                    drawerItems.eq(this._selectedItemIndex).addClass('k-state-selected');
                }
            },
            _mode: function () {
                var options = this.options;
                var drawerContainer = this.drawerContainer;
                var overlayContainer;
                if (options.mode == PUSH) {
                    drawerContainer.addClass('k-drawer-' + PUSH);
                } else {
                    drawerContainer.addClass('k-drawer-' + OVERLAY);
                    overlayContainer = this.overlayContainer = $('<div class="k-overlay"></div>');
                    overlayContainer.hide();
                    drawerContainer.prepend(overlayContainer);
                }
            },
            _miniMode: function () {
                var options = this.options;
                var drawerContainer = this.drawerContainer;
                var miniWidth = options.mini.width;
                var miniTemplate = this._miniTemplate = options.mini.template && $(options.mini.template);
                var drawerItemsWrapper = this.drawerItemsWrapper;
                var drawerWrapper = this.drawerWrapper;
                drawerContainer.addClass('k-drawer-mini');
                if (miniTemplate) {
                    drawerItemsWrapper.html(miniTemplate);
                }
                if (miniWidth) {
                    drawerWrapper.width(miniWidth);
                }
                this.minWidth = options.mini.width || this.drawerWrapper.width();
            },
            show: function () {
                var drawerWrapper = this.drawerWrapper;
                var drawerContainer = this.drawerContainer;
                var options = this.options;
                var isExpanded = drawerContainer.hasClass('k-drawer-expanded');
                var miniTemplate = this._miniTemplate;
                var drawerElement = this.drawerElement;
                var drawerItemsWrapper = this.drawerItemsWrapper;
                if (!isExpanded) {
                    drawerContainer.addClass('k-drawer-expanded');
                    this.visible = true;
                }
                if (miniTemplate) {
                    drawerItemsWrapper.html(drawerElement);
                    this._initDrawerItems();
                    this._selectItem();
                }
                drawerWrapper.width(options.width);
                if (options.mode === OVERLAY) {
                    this.overlayContainer.show();
                    this.visible = true;
                }
            },
            hide: function () {
                var that = this;
                var drawerWrapper = that.drawerWrapper;
                var drawerContainer = that.drawerContainer;
                var options = this.options;
                var drawerItemsWrapper = this.drawerItemsWrapper;
                var miniTemplate = this._miniTemplate;
                var miniWidth = options.mini && options.mini.width;
                if (this._miniTemplate) {
                    drawerItemsWrapper.html(miniTemplate);
                    that._initDrawerItems();
                    this._selectItem();
                }
                if (options.mini) {
                    if (miniWidth) {
                        drawerWrapper.width(miniWidth);
                    } else {
                        drawerWrapper.width('');
                    }
                } else {
                    drawerWrapper.width(0);
                }
                if (this.visible) {
                    drawerContainer.removeClass('k-drawer-expanded');
                    this.visible = false;
                }
                if (options.mode === OVERLAY) {
                    this.overlayContainer.hide();
                }
            },
            position: function (value) {
                var that = this;
                var options = that.options;
                var position = value || options.position;
                var drawerContainer = that.drawerContainer;
                if (position == RIGHT) {
                    drawerContainer.removeClass('k-drawer-' + LEFT);
                    drawerContainer.addClass('k-drawer-' + RIGHT);
                } else {
                    drawerContainer.removeClass('k-drawer-' + RIGHT);
                    drawerContainer.addClass('k-drawer-' + LEFT);
                }
                this.leftPositioned = position === LEFT;
            },
            _start: function (e) {
                var that = this;
                var options = this.options;
                var drawerWrapper = this.drawerWrapper;
                var drawerItemsWrapper = this.drawerItemsWrapper;
                var userEvents = e.sender;
                if (Math.abs(e.x.velocity) < Math.abs(e.y.velocity) || suix.triggeredByInput(e.event)) {
                    userEvents.cancel();
                    return;
                }
                if (this.drawerMini) {
                    drawerItemsWrapper.html(that.drawerElement);
                }
                drawerWrapper.css('transition', 'none');
                if (options.mode != PUSH) {
                    this.overlayContainer.show();
                }
            },
            _update: function (e) {
                var options = this.options;
                var mode = options.mode;
                if (mode == PUSH) {
                    this._push(e);
                } else {
                    this._overlay(e);
                }
            },
            _end: function (e) {
                var velocity = e.x.velocity;
                var options = this.options;
                var drawerWrapper = this.drawerWrapper;
                var elementWidth = drawerWrapper.width();
                var pastHalf = elementWidth > options.width / 2;
                var velocityThreshold = 0.8;
                var shouldShow;
                drawerWrapper.css('transition', 'all .3s ease-out');
                if (this.leftPositioned) {
                    shouldShow = velocity > -velocityThreshold && (velocity > velocityThreshold || pastHalf);
                } else {
                    shouldShow = velocity < velocityThreshold && (velocity < -velocityThreshold || pastHalf);
                }
                if (shouldShow) {
                    if (this.trigger('show', { sender: this })) {
                        e.preventDefault();
                        this.hide();
                    } else {
                        this.show();
                    }
                } else {
                    if (this.trigger('hide', { sender: this })) {
                        e.preventDefault();
                        this.show();
                    } else {
                        this.hide();
                    }
                }
            },
            _overlay: function (moveEventArgs) {
                var options = this.options;
                var minWidth = options.mini && options.mini.width || this.minWidth || 0;
                var drawerWrapper = this.drawerWrapper;
                var elementWidth = drawerWrapper.width();
                var limitedPosition;
                var updatedPosition;
                updatedPosition = elementWidth + (this.leftPositioned ? moveEventArgs.x.delta : -moveEventArgs.x.delta);
                limitedPosition = Math.min(Math.max(updatedPosition, minWidth), options.width);
                moveEventArgs.event.preventDefault();
                moveEventArgs.event.stopPropagation();
                drawerWrapper.width(limitedPosition);
            },
            _push: function (moveEventArgs) {
                var options = this.options;
                var minWidth = options.mini && options.mini.width || this.minWidth || 0;
                var drawerWrapper = this.drawerWrapper;
                var elementWidth = drawerWrapper.width();
                var limitedPosition;
                var updatedPosition;
                updatedPosition = elementWidth + (this.leftPositioned ? moveEventArgs.x.delta : -moveEventArgs.x.delta);
                limitedPosition = Math.min(Math.max(updatedPosition, minWidth), options.width);
                moveEventArgs.event.preventDefault();
                moveEventArgs.event.stopPropagation();
                drawerWrapper.width(limitedPosition);
            },
            _selectItem: function (item) {
                var selectedItemIndex;
                if (item) {
                    item.addClass('k-state-selected');
                    this.trigger('itemClick', {
                        item: item,
                        sender: this
                    });
                    this._selectedItemIndex = item.index();
                    return;
                }
                selectedItemIndex = this._selectedItemIndex;
                if (selectedItemIndex) {
                    this.drawerItemsWrapper.find('[data-role=\'drawer-item\']').eq(selectedItemIndex).addClass('k-state-selected');
                }
            },
            _itemClick: function (e) {
                var that = this;
                var item;
                if ($(e.event.target).find('.k-drawer-item').length > 0) {
                    item = $(e.event.target).find('.k-drawer-item');
                } else if ($(e.event.target).closest('.k-drawer-item').length > 0) {
                    item = $(e.event.target).closest('.k-drawer-item');
                } else if ($(e.event.target).hasClass('.k-drawer-item')) {
                    item = $(e.event.target);
                }
                that.drawerItemsWrapper.find('.k-drawer-item').removeClass('k-state-selected');
                that._selectItem(item);
            },
            destroy: function () {
                var options = this.options;
                if (options.mode != PUSH) {
                    if (this.leftPositioned) {
                        $(document.body).css('padding-left', 0);
                    } else {
                        $(document.body).css('padding-right', 0);
                    }
                }
                Widget.fn.destroy.call(this);
                this.userEvents.destroy();
                suix.destroy(this.element);
                this.element = this.drawerWrapper = this.drawerElement = this.drawerContainer = this.drawerItemsWrapper = this._miniTemplate = null;
            },
            options: {
                name: 'Drawer',
                position: LEFT,
                mode: 'overlay',
                swipeToOpen: true,
                width: 280,
                mini: false,
                template: ''
            },
            events: [
                HIDE,
                SHOW,
                ITEMCLICK
            ]
        });
        suix.ui.plugin(Drawer);
    }(window.suix.jQuery));
    return window.suix;
}, typeof define == 'function' && define.amd ? define : function (a1, a2, a3) {
    (a3 || a2)();
}));
(function(f, define) {
    define([ "./suix.core" ], f);
})(function() {
	
(function ($, undefined) {
	var suix = window.suix,
		Widget = suix.ui.Widget,
		proxy = $.proxy,
		keys = suix.keys,
		LOADING_LAYOUT = '<div class="loadingscreen"><div>Fetching content...</div></div>'
		menuzindex = 1000;
	
	function flattenuls($mainul, cloneulBol, callback, finalcall) {
		var callback = callback || function() {};
		var finalcall = finalcall || function() {};
		var $headers = $mainul.find("ul").parent();
		var $mainulcopy = cloneulBol? $mainul.clone() : $mainul;
		var $flattened = jQuery(document.createDocumentFragment());
		var $headers = $mainulcopy.find("ul").parent();
		for (var i = $headers.length - 1; i >= 0; i--) {
			var $header = $headers.eq(i);
			var $subul = $header.find(">ul").prependTo($flattened);
			callback(i, $header, $subul);
		}
		$mainulcopy.prependTo($flattened);
		finalcall($mainulcopy);
		return $flattened;
	}

	var ListMenu = Widget.extend({
		init: function(element, options) {
			var that = this;
			Widget.fn.init.call(that, element, options);
			
			element = that.wrapper = that.element;
			options = that.options;
			
			that.buildcount = 0;
			that.$loadingscreen = $(options.loadingLayout).appendTo(that.wrapper);
			that.loadmenu(null, options.menucontent);

			suix.notify(that);
		},
		destroy: function() {
			var that = this;
			that.wrapper.off(NS);
			Widget.fn.destroy.call(that);
		},
		events: [
			
		],
		options: {
			name: "ListMenu",
			selectedul: 0,
			loadingLayout: LOADING_LAYOUT, //'<div class="loadingscreen"><div>Fetching content...</div></div>',
			rightArrow: '<span class="right mif-chevron-right"></span>',
			backArrow: '<span class="left mif-chevron-left"></span>',
			slideduration: 0
		},
		loadmenu: function($target, menucontent) {
			var that = this;
			var $anchor = null;
			var $reverseanchor = null;

			function preparebuildmenu($anchor, $rootul, cloneulBol, $reverseanchor) {
				that.buildmenu($anchor, $rootul, cloneulBol, $reverseanchor);
				if ($anchor) {
					$anchor.trigger('click.showsubmenu');
				} else if ($reverseanchor){
					$reverseanchor.trigger('click');
				} else{
					that.selectMenu(that.options.selectedul);
				}
			}

			if (menucontent && (!$target || !$target.data('fetchstate') || $target.data('fetchstate') == 'error')) {
				// if $target defined, meaning lazy load of Ajax content assoc with it
				if ($target){
					// indicate Ajax content is being fetched, to prevent multiple fetches
					$target.data('fetchstate', 'starting');
				}
				$.ajax({
					url: menucontent,
					dataType: 'html',
					error:function(ajaxrequest) {
						that.$loadingscreen.css({visibility: 'hidden'});
						if ($target) {
							// indicate Ajax content assoc with this target not loaded due to error
							$target.data('fetchstate', 'error')
						}
						alert('Error fetching content.<br />Server Response: ' + ajaxrequest.responseText);
					},
					success:function(content) {
						var $rootul = $(content);
						// if $target param is not null, meaning content fetched via lazy loading
						if ($target) {
							// remove lazy load/fetch menu click action, as content is already fetched now
							$target.off('click.lazyload');
							// indicate Ajax content assoc with this target has loaded
							$target.data('fetchstate', 'finished');
							if ($target.prop('tagName') == 'LI')
								$anchor = $target;
							// tagName assumed to be breadcrumb DIV to fetch reverse parent menu
							else 
								$reverseanchor = $target;
						}
						preparebuildmenu($anchor, $rootul, false, $reverseanchor);
					}
				})
			} else{
				var $rootul = that.wrapper.find('>ul');
				preparebuildmenu($anchor, $rootul, true, $reverseanchor);
			}
		},
		buildmenu: function($anchor, $ul, cloneulBol, $reverseanchor) {
			var that = this;
			var $headers = $();
			var $reversebreadcrumb = null;
			var cloneulBol = (typeof cloneulBol == 'undefined')? false: cloneulBol;
			var $flattened = flattenuls($ul, cloneulBol,
				function(i, $header, $subul) {
					$headers = $headers.add($header)
					$header.addClass('header header' + that.buildcount).find('a:eq(0)').append(that.options.rightArrow);
					var $submenu = $subul.wrap('<div class="drawer"/>').parent().addClass('submenu submenu' + that.buildcount);
					$header.data('$dest', $submenu);
					$submenu.data('$parent', $header);
					if ($subul.data('selected') == 1) {
						that.options.selectedul = $subul;
					}
					that.buildcount++;
					$('<div class="breadcrumb">' + $header.text() + '</div>').prepend(that.options.backArrow).prependTo($submenu);
				},
				function($mainul) {
					$mainul.wrap('<div class="drawer"/>')
					if ($anchor != null) {
						var $header = $anchor;
						$headers = $headers.add($header)
						var headerbuildnum = $header.prop('className').match(/header(\d+)/i)[1];
						var $submenu = $mainul.parent();
						$submenu.addClass('submenu submenu' + headerbuildnum);
						$header.data('$dest', $submenu);
						$submenu.data('$parent', $header);
						$('<div class="breadcrumb">' + $header.text() + '</div>').prepend(that.options.backArrow).prependTo($submenu);
					} else {
						// if "data-lazyload" and data-reverseheader="#reverseheaderid, header title" defined inside top most UL
						if ($mainul.data('lazyload')) {
							var headerinfo = $mainul.data('reverseheader').split(/,\s*/);
							// add reverse breadcrumb to main UL
							$reversebreadcrumb = $('<div class="breadcrumb">' + headerinfo[1] + '</div>').prepend(that.options.backArrow).prependTo($mainul);
							// inside reverse breadcrumb store info about parent menu to fetch when clicked on
							$reversebreadcrumb.data('lazyload', $mainul.data('lazyload'));
							$reversebreadcrumb.data('headerid', headerinfo[0].substr(1));
						}
					}
					if ($mainul.data('selected') == 1) {
						that.options.selectedul = $mainul;
					}
				}
			)
			if ($anchor == null && cloneulBol) {
				$ul.before($flattened);
				$ul.remove();
			} else{
				that.wrapper.append($flattened);
			}
			if ($reverseanchor) {
				that.buildcount++;
				var $dynamicheader = $('#' + $reverseanchor.data('headerid'));
				if ($dynamicheader.length == 1) {
					$dynamicheader.addClass('header header' + that.buildcount).find('a:eq(0)').append(that.options.rightArrow) 
					var $submenu =  $reverseanchor.parent().parent('div.drawer').addClass('submenu submenu' + that.buildcount);
					$dynamicheader.data('$dest', $submenu);
					$submenu.data('$parent', $dynamicheader);
					$headers = $headers.add($dynamicheader);
				}
			}
			$headers.each(function(i) {
				var $header = $(this);
				var $headermenu = $header.parents('div.drawer:eq(0)');
				var $submenu = $header.data('$dest');
				var $breadcrumb = $submenu.find('div.breadcrumb');
				$header.on('click.showsubmenu', function(e) {
					$headermenu.css({zIndex: menuzindex++}).animate({left: '-100%'}, that.options.slideduration, that.options.easing);
					$submenu.css({zIndex: menuzindex++ , left: '100%'}).animate({left: 0}, that.options.slideduration, that.options.easing);
					e.preventDefault();
				})
				$breadcrumb.on('click', function(e) {
					$headermenu.css({zIndex: menuzindex++, left: '-100%'}).animate({left: 0}, that.options.slideduration, that.options.easing);
					$submenu.animate({left: '100%'}, that.options.slideduration, that.options.easing);
				})
			})
			var $lazyheaders= that.wrapper.find('li[data-lazyload]');
			// console.log($lazyheaders.length);
			$lazyheaders.each(function() {
				var $header = $(this);
				$header.addClass('header header' + that.buildcount++);
				$header.data('lazyload', $header.data('lazyload'));
				$header.removeAttr('data-lazyload');
			})
			$lazyheaders.find('a:eq(0)').append(that.options.rightArrow);
			if ($reversebreadcrumb) {
				$lazyheaders = $lazyheaders.add($reversebreadcrumb);
			}
			$lazyheaders.on('click.lazyload', function(e) {
				that.$loadingscreen.css({visibility: 'visible'});
				var $header = $(this);
				that.loadmenu($header, $header.data('lazyload'));
				$header.removeAttr('data-lazyload');
				e.preventDefault();
			})
			this.$loadingscreen.css({visibility: 'hidden'});
		},
		selectMenu: function(selector) {
			var that = this;
			var $targetmenu;
			if (typeof selector == "number") {
				$targetmenu = that.wrapper.find('div.drawer').eq(selector);
			} else{
				$targetmenu = $(selector).parent('div.drawer');
			}
			if ($targetmenu.length == 0) {
				$targetmenu = that.wrapper.find('div.drawer').eq(0);
			}
			$targetmenu.css({left:0, zIndex: menuzindex++});
		}		
	});
	suix.ui.plugin(ListMenu);

})(window.suix.jQuery);

return window.suix;

}, typeof define == 'function' && define.amd ? define : function(a1, a2, a3){ (a3 || a2)(); });