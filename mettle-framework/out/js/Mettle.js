/*!
 * Copyright 2014 Manish Shanker
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*!
 * @author Manish Shanker
 * @buildTimestamp 12042014074040
 */
(function (Mettle, window) {
    "use strict";

    window.Mettle = Mettle || {};
    window.Mettle_Template_LOAD_BY_URL_DEFAULT_PATH = window.Mettle_Template_LOAD_BY_URL_DEFAULT_PATH || "";
    window.Mettle_Template_LOAD_BY_URL_DEFAULT_EXTENSION = window.Mettle_Template_LOAD_BY_URL_DEFAULT_EXTENSION || ".hbs";
    window.Mettle_moduleLevelMessaging = true;

}(window.Mettle, window));
(function (Mettle, $) {
    "use strict";

    function MettleDOM(selector) {
        return new MettleDOMElement($(selector));
    }

    MettleDOM.get = function () {
        return $.get.apply(this, arguments);
    };

    MettleDOM.grep = function () {
        return $.grep.apply(this, arguments);
    };

    var MettleDOMElement = function ($item) {
        this.$item = $item;
    };

    MettleDOMElement.prototype = {
        on: function () {
            this.$item.on.apply(this.$item, arguments);
            return this;
        },
        trigger: function () {
            this.$item.trigger.apply(this.$item, arguments);
            return this;
        },
        off: function () {
            this.$item.off.apply(this.$item, arguments);
            return this;
        },
        html: function (text) {
            if (text) {
                this.$item.html(text);
                return this;
            }
            return this.$item.html();
        },
        attr: function (attribute, value) {
            if (value) {
                this.$item.attr(attribute, value);
                return this;
            }
            return this.$item.attr(attribute);
        },
        each: function () {
            this.$item.each.apply(this.$item, arguments);
            return this;
        },
        addClass: function (className) {
            this.$item.addClass(className);
            return this;
        },
        removeClass: function (className) {
            this.$item.removeClass(className);
            return this;
        },
        empty: function () {
            this.$item.empty();
            return this;
        },
        remove: function () {
            this.$item.remove();
        },
        append: function(html) {
            this.$item.append(html);
        }
    };

    Mettle.DOM = MettleDOM;

}(Mettle,  (window.Zepto || window.jQuery)));
(function(Mettle, $) {
    "use strict";

    var loaded_modules = {};

    Mettle.init = function (appNameSpace, locale, logLevel) {
        Mettle.i18nT = locale;
        Mettle.ModuleNameSpace = appNameSpace || {};
        Mettle.LOG_LEVEL.CURRENT = logLevel || Mettle.LOG_LEVEL.WARN;
        return Mettle;
    };

    Mettle.modules = function(modules) {
        Mettle.each(modules, function (ModuleClass, moduleName) {
            loaded_modules[moduleName] = new ModuleClass();
            loaded_modules[moduleName].load();
        });
        return Mettle;
    };

    Mettle.managedModules = function(modules) {
        var content = {};
        var destroyedModule = {};
        Mettle.each(modules, function (ModuleClass, moduleName) {

            var $moduleContainer = $("#" + moduleName);
            $moduleContainer.attr("data-keep-state", "false");
            var module = new ModuleClass();
            content[moduleName] = content[moduleName] || $moduleContainer.html();
            loaded_modules[moduleName] = module;

            Mettle.messageBus.subscribe(module.controlMessages.hide, function () {
                Mettle.logInfo("destroying module:" + moduleName);
                module.destroy();
                $moduleContainer.empty();
                loaded_modules[moduleName] = null;
                delete loaded_modules[moduleName];
                module = null;
                destroyedModule[moduleName] = true;
            });

            Mettle.messageBus.subscribe(module.controlMessages.show, function (data) {
                if (destroyedModule[moduleName]) {
                    Mettle.logInfo("loading destroyed module:" + moduleName);
                    $moduleContainer.html(content[moduleName]);
                    module = new ModuleClass();
                    loaded_modules[moduleName] = module;
                } else {
                    Mettle.logInfo("loading module:" + moduleName);
                }
                module.load();
                module.show(data);
                destroyedModule[moduleName] = false;
            });
        });
        return Mettle;
    };

    Mettle.getModule = function(moduleName) {
        return loaded_modules[moduleName];
    };

    Mettle.start = function(defaultPage) {
        Mettle.navigation.load(defaultPage);
        return Mettle;
    };

}(Mettle, Mettle.DOM));
(function () {
    "use strict";

    var Class = function () {
    };
    var isFn = function (fn) {
        return typeof fn === "function";
    };
    Class.extend = function (proto) {
        var k = function (param) {
            if (param !== isFn && isFn(this.init)) {
                this.init.apply(this, arguments);
            }
        };
        k.prototype = new this(isFn);
        var makeSuper = function (fn, sfn) {
            return function () {
                //noinspection JSPotentiallyInvalidUsageOfThis
                this._super = sfn;
                return fn.apply(this, arguments);
            };
        };
        var key;
        for (key in proto) {
            if (proto.hasOwnProperty(key)) {
                var fn = proto[key], sfn = k.prototype[key];
                k.prototype[key] = !isFn(fn) || !isFn(sfn) ? fn : makeSuper(fn, sfn); // add _super method
            }
        }
        k.prototype.constructor = k;
        k.extend = this.extend;
        return k;
    };

    window.Class = Class;
}());
(function (Mettle) {
    "use strict";

    Mettle.noop = noop;
    Mettle.each = each;
    Mettle.currentLocation = function() {
        return location.href;
    };

    Mettle.LOG_LEVEL = {
        ERROR: 1,
        WARN: 2,
        INFO: 4,
        LOG: 8,
        ALL: 16,
        OFF: -1,
        CURRENT: 1
    };

    function getLogger(type) {
        return (window.console && window.console.log && function () {
            if (Mettle.LOG_LEVEL.CURRENT >= Mettle.LOG_LEVEL[type.toUpperCase()]) {
                if (console.log.apply) {
                    (console[type]?console[type]:console.log).apply(console, arguments);
                } else {
                    (console[type]?console[type]:console.log)(arguments);
                }
            }
        }) || Mettle.noop;
    }

    Mettle.logInfo = getLogger("info");
    Mettle.log = getLogger("log");
    Mettle.logError = getLogger("error");
    Mettle.logWarn = getLogger("warn");


    function each(data, callback) {
        if (data) {
            if (data instanceof Array) {
                loopArray(data, callback);
            } else {
                loopObject(data, callback);
            }
        }
    }

    function loopObject(data, callback) {
        var d;
        if (data) {
            for (d in data) {
                if (data.hasOwnProperty(d)) {
                    callback(data[d], d);
                }
            }
        }
    }

    function loopArray(data, callback) {
        var i, l;
        if (data) {
            for (i = 0, l = data.length; i < l; i++) {
                callback(data[i], i);
            }
        }
    }

    function noop() {
    }

}(Mettle));
(function (Mettle, $) {
    "use strict";

    var Messaging = function () {
        this.guid = guid();
        this.localMessageBus = $({});
        Mettle.logInfo("messageBus._____create", this.guid);
    };

    Messaging.prototype = {
        publish: function (subject, message) {
            Mettle.logInfo("messageBus.____publish", this.guid, subject, message);
            this.localMessageBus.trigger(subject, [message]);
        },
        subscribe: function (scope, subjects, fn) {
            if (typeof scope === "string") {
                fn = subjects;
                subjects = scope;
                scope = window;
            }
            Mettle.logInfo("messageBus.__subscribe", this.guid, subjects);
            var that = this;
            if (typeof subjects === "string") {
                return getSubscriber(that, fn, scope, subjects);
            }
            if (arguments.length===1) {
                subjects = scope;
            }
            var subscriberFNs = {};
            Mettle.each(subjects, function (fn, subject) {
                subscriberFNs[subject] = getSubscriber(that, fn, scope, subject);
            });
            return subscriberFNs;
        },
        unsubscribe: function (subjects, fn) {
            Mettle.logInfo("messageBus.unsubscribe", this.guid, subjects);
            var that = this;
            if (typeof subjects === "string") {
                that.localMessageBus.off(subjects, fn);
            } else {
                Mettle.each(subjects, function (fn, subject) {
                    that.localMessageBus.off(subject, fn);
                });
            }
        }
    };

    function getSubscriber(ctx, fn, scope, subject) {
        var unsubscribeMethod = function (e, message) {
            Mettle.logInfo("messageBus.___received", subject, message);
            fn.call(scope, message);
        };
        ctx.localMessageBus.on(subject, unsubscribeMethod);
        return unsubscribeMethod;
    }

    function guid() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    Mettle.messageBus = new Messaging();
    Mettle.Messaging = Messaging;

}(Mettle, Mettle.DOM));
(function (Mettle) {
    "use strict";

    Mettle.Base = Class.extend({
        messageBus: Mettle.messageBus,
        injector: null,
        guid: null,
        init: function() {
            this.guid = guid();
        },
        injectDependencies: function (dependencies) {
            Mettle.dependencyInjector(this, dependencies);
        }
    });

    function guid() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

}(Mettle));
(function (Mettle) {
    "use strict";

    Mettle.Controller = Mettle.Base.extend({
        autoWire: false,
        autoDestroy: false,
        autoShowHide: false,
        autoLoadControls: false,
        autoLayout: false,
        messages: null,
        injectLocalMessageBus: false,
        inject: null,
        routes: {},
        serviceUpdate: {},
        messageBus: Mettle.messageBus,
        localMessageBus: null,
        init: function (dependencies) {
            this.injectDependencies(dependencies);
        },
        views: null,
        templates: null,
        controls: null,
        services: null,
        shownAndLoaded: false,
        layoutChange: function () {
            if (this.autoLayout) {
                loopMethods(this.controls, "layoutChange");
                loopMethods(this.views, "layoutChange");
            }
        },
        load: function () {
            subscribeToMessages(this);
            autoLoadControls(this);
        },
        loadOnce: function () {
            if (!this._loaded) {
                this.load();
                this._loaded = true
            }
        },
        unload: function () {
            destroyMessages(this);
            unloadControls(this);
        },
        update: function (data) {
            autoRenderTemplates(this, data);
        },
        onUpdateReceive: function (data, item) {
            onUpdateReceive(this, data, item);
        },
        destroy: function () {
            destroy(this);
        },
        onRouteChange: function () {
            return this.routes;
        },
        onServiceUpdate: function () {
            return this.serviceUpdate;
        },
        hide: function (data) {
            autoStopServices(this);
            if (!(data && data.keepPreviousState)) {
                autoShowHide(this, false, arguments);
                autoDestroy(this);
            }
        },
        show: function (data) {
            if (!this.shownAndLoaded) {
                autoShowAndInitServices(this, arguments);
                this.shownAndLoaded = true;
            } else if (data && data.keepPreviousState) {
                autoStartServices(this);
            } else {
                autoShowAndStartServices(this, arguments);
            }
        }
    });

    function autoShowAndInitServices(ctx, args) {
        autoShowHide(ctx, true, args);
        autoInitServices(ctx);
    }

    function autoShowAndStartServices(ctx, args) {
        autoShowHide(ctx, true, args);
        autoStartServices(ctx);
    }

    function unloadControls(ctx) {
        loopMethods(ctx.controls, "unload");
    }

    function autoLoadControls(ctx) {
        if (ctx.autoLoadControls) {
            loopMethods(ctx.controls, "load");
        }
    }

    function autoInitServices(ctx) {
        if (!ctx._exist && ctx.autoWire) {
            initServices(ctx.services, ctx);
        }
        ctx._exist = true;
    }

    function autoDestroy(ctx) {
        if (ctx.autoDestroy) {
            ctx.destroy();
        }
    }

    function autoStartServices(ctx) {
        if (ctx.autoWire) {
            loopMethods(ctx.services, "start");
        }
    }

    function autoStopServices(ctx) {
        if (ctx.autoWire) {
            loopMethods(ctx.services, "stop");
        }
    }

    function onUpdateReceive(ctx, data, item) {
        ctx.controls[item].update(data);
        if (ctx.lastStateData && ctx.onServiceUpdate()[item]) {
            ctx.onServiceUpdate()[item].call(ctx, ctx.controls[item], ctx.lastStateData);
        }
    }

    function autoRenderTemplates(ctx, data) {
        if (ctx.autoWire) {
            renderTemplates(ctx, data);
        }
    }

    function destroy(ctx) {
        destroyControlMessages(ctx);
        destroyMessages(ctx);
        loopMethods(ctx.views, "destroy");
        loopMethods(ctx.controls, "destroy");
        loopMethods(ctx.services, "destroy");
        loopMethods(ctx.templates, "destroy");
        ctx.services = null;
        ctx.views = null;
        ctx.lastStateData = null;
        ctx.templates = null;
        ctx.options = null;
        ctx.controls = null;
        ctx._exist = false;
        ctx._loaded = false;
        ctx.shownAndLoaded = false;
    }

    function destroyControlMessages(ctx) {
        if (ctx._controlMessagesFn) {
            var controlMessages = ctx.controlMessages;
            var controlMessagesFn = ctx._controlMessagesFn;
            Mettle.each(["show", "hide", "stateChange"], function(item) {
                Mettle.messageBus.unsubscribe(controlMessages[item], controlMessagesFn[item]);
            });
        }
    }

    function destroyMessages(ctx) {
        if (ctx._messagesFn) {
            Mettle.each(ctx.messages, function (item, key) {
                Mettle.messageBus.unsubscribe(item, ctx._messagesFn(key));
            });
        }
    }

    function renderTemplates(ctx, data) {
        Mettle.each(ctx.templates, function (template, key) {
            template.load(function () {
                if (ctx.views[key]) {
                    ctx.views[key].render(template.process(data));
                }
            });
        });
    }

    function loopMethods(collection, method, args) {
        args = args || [];
        Mettle.each(collection, function (item) {
            item[method].apply(item, args);
        });
    }

    function initServices(services, that) {
        Mettle.each(services, function (service, key) {
            service.onUpdate(getFunction(that, key));
            service.fetch();
        });
    }

    function getFunction(scope, service) {
        return function (data) {
            scope.onUpdateReceive(data, service);
        };
    }

    function subscribeToMessages(ctx) {
        if (!(ctx.messages || ctx.controlMessages)) {
            return;
        }
        destroyControlMessages(ctx);
        var messages = ctx.controlMessages;
        ctx._controlMessagesFn = {};
        ctx._controlMessagesFn.show = Mettle.messageBus.subscribe(ctx, messages.show, ctx.show);
        ctx._controlMessagesFn.hide = Mettle.messageBus.subscribe(ctx, messages.hide, ctx.hide);
        ctx._controlMessagesFn.stateChange = Mettle.messageBus.subscribe(ctx, messages.stateChange, function (stateData) {
            ctx.lastStateData = stateData;
            Mettle.each(ctx.onRouteChange(stateData), function (item, key) {
                Mettle.navigation.route(ctx, key, item);
            });
        });
        destroyMessages(ctx);
        ctx._messagesFn = {};
        Mettle.each(ctx.messages, function (message, key) {
            ctx._messagesFn[key] = Mettle.messageBus.subscribe(ctx, key, message);
        });
    }

    function autoShowHide(that, isShow, args) {
        if (that.autoShowHide) {
            loopMethods(that.views, isShow ? "show" : "hide", args);
            loopMethods(that.controls, isShow ? "show" : "hide", args);
        }
    }

}(Mettle));
(function (Mettle, $) {
    "use strict";

    var privateVar = {};

    Mettle.Service = Mettle.Base.extend({
        dataURL: null,
        init: function () {
            this._super();
            privateVar[this.guid] = {};
            privateVar[this.guid].updateCallBack = [];
        },
        fetch: function () {
            $.get(this.dataURL, function (data) {
                this.updated(data);
            });
        },
        update: Mettle.noop,
        get: Mettle.noop,
        lastResult: function () {
            return privateVar[this.guid].lastResult;
        },
        onUpdate: function (callback) {
            privateVar[this.guid].updateCallBack.push(callback);
        },
        updated: function (data) {
            var n, l;
            var localPrivateVar = privateVar[this.guid];
            localPrivateVar.lastResult = data;
            if (localPrivateVar) {
                for (n = 0, l = localPrivateVar.updateCallBack.length; n < l; n++) {
                    localPrivateVar.updateCallBack[n](data);
                }
            }
        },
        destroy: function () {
            delete privateVar[this.guid];
        },
        stop: Mettle.noop,
        start: Mettle.noop
    });

}(Mettle, Mettle.DOM));
(function (Mettle, window) {
    "use strict";

    var templateCache = {};

    Mettle.TemplateByString = function (string) {
        return new Mettle.Template(string, Mettle.Template.LOAD.BY_STRING);
    };

    Mettle.TemplateByID = function (string) {
        return new Mettle.Template(string, Mettle.Template.LOAD.BY_ID);
    };

    Mettle.TemplateByURL = function (string) {
        return new Mettle.Template(string, Mettle.Template.LOAD.BY_URL);
    };

    Mettle.TemplateSafeString = function (template) {
        return new Mettle.templateEngine.safeString(template);
    };

    Mettle.Template = Mettle.Base.extend({
        init: function (path, loadType) {
            this._super();
            this.path = path;
            this.loadBy = loadType || Mettle.Template.LOAD.DEFAULT;
        },
        process: function (data) {
            if (this.path === undefined) {
                return "";
            }
            if (!templateCache[this.guid]) {
                console.log("Template param: ", this.path, this.loadBy);
                throw new Error("Template not in cache!!");
            }
            return Mettle.templateEngine.process(templateCache[this.guid], data);
        },
        load: function (onSuccess) {
            var that = this;
            if (that.path === undefined || templateCache[that.guid]) {
                onSuccess.call(that, that);
            } else {
                if (that.loadBy === Mettle.Template.LOAD.BY_URL) {
                    var path = addExtension(addForwardSlash(Mettle.Template.LOAD.BY_URL_DEFAULT_PATH) + that.path);
                    Mettle.templateEngine.getByURL(path, function (template) {
                        templateCache[that.guid] = template;
                        onSuccess.call(that, that);
                    });
                } else if (this.loadBy === Mettle.Template.LOAD.BY_ID) {
                    templateCache[this.guid] = Mettle.templateEngine.getById(this.path);
                    Mettle.templateEngine.remove(this.path);
                    setTimeout(function () {
                        onSuccess.call(that, that);
                    }, 5);
                } else {
                    templateCache[this.guid] = Mettle.templateEngine.getByString(this.path);
                    setTimeout(function () {
                        onSuccess.call(that, that);
                    }, 5);
                }
            }
        },
        destroy: function () {
            delete templateCache[this.guid];
        }
    });

    function addExtension(path) {
        return path + (/\.[a-z]{3,4}$/.test(path) ? "" : Mettle.Template.LOAD.BY_URL_DEFAULT_EXTENSION);
    }

    function addForwardSlash(path) {
        return path + (/\/$/.test(path) ? "" : "/");
    }

    Mettle.Template.LOAD = {
        BY_ID: "APP_TEMPLATE_BY_ID",
        BY_URL: "APP_TEMPLATE_BY_URL",
        BY_STRING: "APP_TEMPLATE_BY_STRING",
        DEFAULT: "APP_TEMPLATE_BY_ID",
        BY_URL_DEFAULT_PATH: window.Mettle_Template_LOAD_BY_URL_DEFAULT_PATH || "",
        BY_URL_DEFAULT_EXTENSION: window.Mettle_Template_LOAD_BY_URL_DEFAULT_EXTENSION || ".hbs"
    };

}(Mettle, window));
(function (Mettle, $) {
    "use strict";

    Mettle.View = Mettle.Base.extend({
        autoManageEventBind: false,
        autoLayout: false,
        appendViewTo: null,
        init: function (dependencies) {
            this._super();
            this.injectDependencies(dependencies);
            if (!this.appendViewTo) {
                initialise.call(this);
            }
        },
        container: null,
        $container: null,
        bindings: null,
        layoutChange: Mettle.noop,
        bind: function () {
            loopBindings(this, false);
        },
        unbind: function () {
            loopBindings(this, true);
        },
        $el: null,
        render: function (html) {
            if (this.appendViewTo) {
                $(this.appendViewTo === true ? "body" : this.appendViewTo).append(html);
                initialise.call(this);
            } else {
                this.$container.html(html);
            }
        },
        destroy: function () {
            var that = this;
            removeAutoLayoutHandler(that);
            that.unbind();
            that.$container.empty();
        },
        hide: function () {
            var that = this;
            that.$el.removeClass("show").addClass("hide");
            autoUnbindEvents(that);
            removeAutoLayoutHandler(that);
        },
        show: function () {
            var that = this;
            that.$el.removeClass("hide").addClass("show");
            autoBindEvents(that);
            addAutoLayoutHandler(that);
        }
    });

    function initialise() {
        this.$container = $(this.container);
        this.$el = this.$container.$item;
        if (!this.autoManageEventBind) {
            this.bind();
        }
        addAutoLayoutHandler(this);
    }

    function getBindings(ctx) {
        return typeof ctx.bindings === "function" ? ctx.bindings() : ctx.bindings;
    }

    function loopBindings(ctx, unBind) {
        var bindings = getBindings(ctx);
        var method = unBind ? unBindEvent : bindEvent;
        Mettle.each(bindings, function (fn, key) {
            var keyParts = /([a-zA-Z]+)\s([a-zA-Z0-9\-\.\(\)>]+)/.exec(key);
            method(keyParts, ctx.$container, key, ctx, fn);
        });
    }

    function bindEvent(keyParts, $container, eventName, ctx, fn) {
        if (keyParts) {
            $container.on(keyParts[1], keyParts[2], function (e) {
                return fn.call(ctx, e, this);
            });
        } else {
            $container.on(eventName, function (e) {
                return fn.call(ctx, e, this);
            });
        }
    }

    function unBindEvent(parts, $container, eventName) {
        if (parts) {
            $container.off(parts[1], parts[2]);
        } else {
            $container.off(eventName);
        }
    }

    function addAutoLayoutHandler(that) {
        if (that.autoLayout) {
            $(window).off("resize." + that.guid).on(("resize." + that.guid), function () {
                that.layoutChange();
            });
        }
    }

    function removeAutoLayoutHandler(that) {
        if (that.autoLayout) {
            $(window).off("resize." + that.guid);
        }
    }

    function autoUnbindEvents(that) {
        if (that.autoManageEventBind) {
            that.unbind();
        }
    }

    function autoBindEvents(that) {
        if (that.autoManageEventBind) {
            that.bind();
        }
    }

}(Mettle, Mettle.DOM));
(function (Mettle) {
    "use strict";

    var INJECT_TYPES = {
        "tmpl!" : function(ctx, name) {
            return Mettle.TemplateByURL(name);
        }
    };

    Mettle.dependencyInjector = injectDependencies;

    Mettle.dependencyInjector.define = function(type, fn) {
        INJECT_TYPES[type] = fn;
    };

    Mettle.dependencyInjector.define("controller!", function(ctx, name) {
        return new Mettle.ModuleNameSpace.controller[name](ctx.injectLocalMessageBus ? ctx.localMessageBus : ctx.messageBus);

    });

    Mettle.dependencyInjector.define("template!", function(ctx, name) {
        return new Mettle.ModuleNameSpace.template[name](ctx.injectLocalMessageBus ? ctx.localMessageBus : ctx.messageBus);
    });

    Mettle.dependencyInjector.define("service!", function(ctx, name) {
        return new Mettle.ModuleNameSpace.service[name](ctx.injectLocalMessageBus ? ctx.localMessageBus : ctx.messageBus);
    });

    Mettle.dependencyInjector.define("view!", function(ctx, name) {
        return new Mettle.ModuleNameSpace.view[name](ctx.injectLocalMessageBus ? ctx.localMessageBus : ctx.messageBus);
    });

    var TYPES = {
        "views": "view",
        "templates": "template",
        "services": "service",
        "controls": "controller"
    };

    function injectDependencies(ctx, dependencies) {
        if (window.Mettle_moduleLevelMessaging) {
            if (Mettle.Messaging && (dependencies instanceof Mettle.Messaging)) {
                ctx.messageBus = dependencies;
            }
            if (ctx.injectLocalMessageBus) {
                ctx.localMessageBus = (dependencies && dependencies.inject && dependencies.inject.localMessageBus) || new Mettle.Messaging();
            }
        } else {
            ctx.messageBus = new Mettle.Messaging();
        }

        var injectedDependencies = (dependencies && dependencies.inject) || (ctx.inject && (isFunction(ctx.inject) ? ctx.inject() : ctx.inject));

        injectedDependencies = injectDepUsingShorthand(injectedDependencies);

        Mettle.each(injectedDependencies, function (dependency, key) {
            var depType = /^controls$|^templates$|^views$|^services$/.exec(key);
            if (depType) {
                if (dependency instanceof Array) {
                    injectFromArray(dependency, ctx, key);
                } else if (isFunction(dependency)) {
                    ctx[key] = dependency.call(ctx, ctx);
                } else {
                    Mettle.each(dependency, function (dep, subSubKey) {
                        ctx[key] = ctx[key] || {};
                        ctx[key][subSubKey] = ctx[key][subSubKey] = {};
                        injectInCtx(ctx[key], subSubKey, getDep(dep, ctx, key));
                    });
                }
            } else {
                ctx[key] = getDep(dependency, ctx, key);
            }
        });
    }

    function injectFromArray(dependency, ctx, key) {
        Mettle.each(dependency, function (subDependency) {
            ctx[key] = ctx[key] || {};
            if (isString(subDependency)) {
                ctx[key][subDependency] = ctx[subDependency] || {};
                injectInCtx(ctx[key], subDependency, getDependencyInstance(ctx, key, subDependency));
            } else {
                Mettle.each(subDependency, function (dep, subSubKey) {
                    injectInCtx(ctx[key], subSubKey, getDep(dep, ctx, key));
                });
            }
        });
    }

    function getDep(dependency, ctx, key) {
        return isString(dependency) ? getDependencyInstance(ctx, key, dependency) : (isFunction(dependency) ? dependency() : dependency);
    }

    function injectInCtx(ctx, dependency, depInstance) {
        ctx[dependency] = depInstance;
    }

    function getDependencyInstance(ctx, key, dependency) {
        if (ctx.injector) {
            Mettle.ModuleNameSpace.dependency = Mettle.ModuleNameSpace.dependency || {};
            var depInjector = Mettle.ModuleNameSpace.dependency[ctx.injector];
            if (depInjector) {
                if (depInjector[key][dependency]) {
                    return depInjector[key][dependency](ctx);
                }
            }
        }
        return defaultInjector(ctx, key, dependency);
    }

    function capitalise(string) {
        return string.substr(0, 1).toUpperCase() + string.substr(1);
    }

    function defaultInjector(ctx, type, dependency) {
        if (dependency.indexOf(".")>0) {
            try {
                return getClassInstance(dependency, ctx.injectLocalMessageBus ? ctx.localMessageBus : ctx.messageBus);
            } catch(e) {
                Mettle.logError(e);
                throw new Error("Direct dependency instance creation error: (" + type + "," + dependency + " | " + (capitalise(dependency)) + ")");
            }
        }
        if (dependency.indexOf("!")>0) {
            try {
                var parts = /([\w\W]+?!)([\w\W]*)/.exec(dependency);
                return INJECT_TYPES[parts[1]](ctx, parts[2]);
            } catch(e) {
                Mettle.logError(e);
                throw new Error("Defined dependency instance creation error: (" + type + "," + dependency + " | " + (capitalise(dependency)) + ")");
            }
        }

        var moduleNameSpace = TYPES[type];
        Mettle.ModuleNameSpace[moduleNameSpace] = Mettle.ModuleNameSpace[moduleNameSpace] || {};
        if (type === "templates") {
            if (Mettle.ModuleNameSpace.template[capitalise(dependency)]) {
                return new Mettle.ModuleNameSpace.template[capitalise(dependency)]();
            }
            if (Mettle.ModuleNameSpace.template[dependency]) {
                return Mettle.ModuleNameSpace.template[dependency];
            }
            return Mettle.TemplateByID("tmpl" + capitalise(dependency));
        }
        try {
            return new Mettle.ModuleNameSpace[moduleNameSpace][capitalise(dependency)](ctx.injectLocalMessageBus ? ctx.localMessageBus : ctx.messageBus);
        } catch (e) {
            Mettle.logError(e);
            throw new Error("Dependency instance creation error: (" + type + "," + dependency + " | " + moduleNameSpace + "." + (capitalise(dependency)) + ")");
        }
    }


    function getClassInstance(dependency, param) {
        var Clazz = window;
        Mettle.each(dependency.split("."), function(dep) {
            Clazz = Clazz[dep]
        });
        return new Clazz(param);
    }

    function injectDepUsingShorthand(injectedDependencies) {
        if (isString(injectedDependencies)) {
            var dep = {};
            var parts = injectedDependencies.split(":");
            var classObjectName = parts[1];
            var types = parts[0];
            Mettle.each({
                "templates": /T/,
                "views": /V/,
                "services": /S/
            }, function (type, ns) {
                if (type.test(types)) {
                    dep[ns] = [classObjectName];
                }
            });
            injectedDependencies = dep;
        }
        return injectedDependencies;
    }

    function isFunction(dependency) {
        return typeof dependency === "function";
    }

    function isString(subDependency) {
        return typeof subDependency === "string";
    }

}(Mettle));
(function (HB) {
    "use strict";

    HB.registerHelper('list', function (items, className, options) {
        var out, i, l, listCSSClass = "", listItemCSSClass = "";
        if (typeof className === "string") {
            listCSSClass = " class='" + className + "' ";
            listItemCSSClass = " class='" + className + "-item' ";
        } else {
            options = className;
        }
        out = "<ul" + listCSSClass + ">";
        if (items && items.length) {
            for (i = 0, l = items.length; i < l; i++) {
                out += "<li" + listItemCSSClass + ">" + options.fn(items[i]) + "</li>";
            }
        }
        return out + "</ul>";
    });

}(Handlebars));
/*i18n Handlebar helper*/
(function (Mettle) {
    "use strict";

    Handlebars.registerHelper('i18n', function (i18n_key, alias_key) {
        alias_key = typeof alias_key === "object" ? null : alias_key;
        return new Handlebars.SafeString(Mettle.i18n(i18n_key, alias_key));
    });
}(Mettle));
(function (Mettle) {
    "use strict";

    Mettle.i18n = function (actualText, alias_key) {
        if (!Mettle.i18nT) {
            throw new Error("No resource bundle included for i18n!!");
        }
        if (actualText === null) {
            return "";
        }
        var i18n_key;
        if (alias_key) {
            i18n_key = alias_key;
        } else {
            i18n_key = actualText.toLowerCase().replace(/ ([a-z])/g, function (m, w) {
                return w.toUpperCase();
            }).replace(/ /g, "");
            i18n_key = i18n_key.charAt(0).toLowerCase() + i18n_key.substring(1);
        }
//        console.log("\"" + i18n_key + "\": \"" + actualText + "\",");
//        if (!Mettle.i18nT[i18n_key]) {
//            console.log("\"" + i18n_key + "\": \"" + actualText + "\",");
//        }
        return Mettle.i18nT[i18n_key] || "!!!" + actualText + "!!!";
    };

}(Mettle));
(function (Mettle, $) {
    "use strict";

    var currentView;
    var currentPath;
    var viewState = {};
    var dView = "#/home";

    var Navigation = function () {

        function load(defaultView) {
            dView = defaultView;
            $(window).on("hashchange", onLocationChange);
            if (location.hash) {
                onLocationChange();
            } else {
                location.href = "#/" + dView;
            }
        }

        function onLocationChange() {
            currentPath = location.hash;
            var redirect = false;
            var appStateData = parseLocationData(currentPath);
            if (!appStateData) {
                location.href = "#/" + dView;
                return;
            }
            if (appStateData.page !== currentView) {
                hidePage(currentView, appStateData);
                currentView = appStateData.page;
                redirect = showPage(currentView, appStateData);
                if (redirect) {
                    return;
                }
            }
            var newAppStateData = parseLocationData(location.hash);
            currentView = newAppStateData.page;

            if (!isKeepOldState(currentView) || isNotSameState(newAppStateData)) {
                publishStateUpdate(newAppStateData);
                viewState[currentView] = appStateData;
            }
        }

        function isNotSameState(newAppStateData) {
            return (!viewState[currentView] || (newAppStateData.pageData !== viewState[newAppStateData.page].pageData));
        }

        function publishStateUpdate(appStateData) {
            Mettle.messageBus.publish("navigationStateChange:" + currentView, appStateData);
            Mettle.messageBus.publish("navigationStateChange", appStateData);
        }

        function hidePage(page, appStateData) {
            if (page) {
                $("a[href$='#/" + page + "']").removeClass("selected");
                $("#" + page).removeClass("page-visible");
                Mettle.messageBus.publish("navigationChangedFrom:" + page, appStateData);
            }
        }

        function showPage(page, appStateData) {
            $("#" + page).addClass("page-visible");
            var $link = getPageLink(page);
            $link.addClass("selected");
            var cachedViewState = viewState[page];
            var redirecting = false;
            if (cachedViewState && (cachedViewState.pageData !== appStateData.pageData)) {
                if (cachedViewState.pageData) {
                    Mettle.logInfo("redirecting to restore state of " + currentView);
                    location.replace("#/" + page + "/" + cachedViewState.pageData);
                    redirecting = true;
                }
            }
            Mettle.messageBus.publish("navigationChangedTo:" + currentView, appStateData);
            return redirecting;
        }

        function isKeepOldState(page) {
            var keepState = getPageContainer(page).attr("data-keep-state");
            return !(keepState === false || keepState === "false");
        }

        function getPageContainer(page) {
            return $("#" + page);
        }


        function getPageLink(page) {
            return $("a[href$='#/" + page + "']");
        }

        function parseLocationData(locationData) {
            var a = /#\/([a-zA-Z0-9_\$\-]+)(\/([\w\W]+))?/.exec(locationData);
            if (!a) {
                return null;
            }
            return {
                path: locationData,
                page: a[1],
                pageData: a[3],
                keepPreviousState: isKeepOldState(a[1])
            };
        }

        function setRoute(route) {
            currentPath = route;
            location.hash = route;
            if (window.hasOwnProperty("onhashchange")) {
                onLocationChange();
            }
        }

        function route(context, pattern, callback, callbackFailure) {
            var items = new RegExp(("^" + pattern + "$").replace("?", ".").replace(/:[a-zA-Z0-9-_]+/g, function (a) {
                return "([a-zA-Z0-9-_]+)";
            })).exec(currentPath.substring(1).replace(/[\/]?$/, ""));
            if (items) {
                items.splice(0, 1);
                callback.apply(context, items);
            } else {
                if (callbackFailure) {
                    callbackFailure.call(context);
                }
            }
        }

        return {
            load: load,
            route: route,
            setRoute: setRoute
        };
    };

    Mettle.navigation = new Navigation();
}(Mettle, Mettle.DOM));
(function (Mettle, $) {
    "use strict";

    Mettle.templateEngine = {
        getById: getById,
        getByCSSSelector: getByCSSSelector,
        getByURL: getByURL,
        getByString: getByString,
        process: process,
        safeString: safeString,
        remove: remove
    };

    function getByURL(url, onSuccess) {
        $.get(url, function (templateHTML) {
            onSuccess(getCompiledTemplate(templateHTML));
        });
    }

    function safeString(template) {
        return new Handlebars.SafeString(template);
    }

    function getCompiledTemplate(template) {
        return Handlebars.compile(template);
    }

    function remove(id) {
        var $el = $("#" + id);
        $el.remove();
    }

    function getByString(string) {
        return getCompiledTemplate(string);
    }

    function getById(id) {
        var $el = $("#" + id);
        var template = $el.html();
        $el.remove();
        if (!template) {
            throw new Error("Template id: " + id + ", not found!!");
        } else {
            return getCompiledTemplate(template);
        }
    }

    function getByCSSSelector(cssSelector) {
        var template = $(cssSelector).html();
        if (!template) {
            throw new Error("Template selector: " + cssSelector + ", not matched any!!");
        } else {
            return getCompiledTemplate(template);
        }
    }

    function process(template, templateData) {
        return template(templateData);
    }

}(Mettle, Mettle.DOM));
