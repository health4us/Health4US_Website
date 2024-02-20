! function(e, t) {
    "object" == typeof exports && "object" == typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define([], t) : "object" == typeof exports ? exports.wixCodeViewerUtils = t() : e.wixCodeViewerUtils = t()
}("undefined" != typeof self ? self : this, function() {
    return function(e) {
        var t = {};

        function r(n) {
            if (t[n]) return t[n].exports;
            var o = t[n] = {
                i: n,
                l: !1,
                exports: {}
            };
            return e[n].call(o.exports, o, o.exports, r), o.l = !0, o.exports
        }
        return r.m = e, r.c = t, r.d = function(e, t, n) {
            r.o(e, t) || Object.defineProperty(e, t, {
                enumerable: !0,
                get: n
            })
        }, r.r = function(e) {
            "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
                value: "Module"
            }), Object.defineProperty(e, "__esModule", {
                value: !0
            })
        }, r.t = function(e, t) {
            if (1 & t && (e = r(e)), 8 & t) return e;
            if (4 & t && "object" == typeof e && e && e.__esModule) return e;
            var n = Object.create(null);
            if (r.r(n), Object.defineProperty(n, "default", {
                    enumerable: !0,
                    value: e
                }), 2 & t && "string" != typeof e)
                for (var o in e) r.d(n, o, function(t) {
                    return e[t]
                }.bind(null, o));
            return n
        }, r.n = function(e) {
            var t = e && e.__esModule ? function() {
                return e.default
            } : function() {
                return e
            };
            return r.d(t, "a", t), t
        }, r.o = function(e, t) {
            return Object.prototype.hasOwnProperty.call(e, t)
        }, r.p = "", r(r.s = 1)
    }([function(e, t, r) {
        "use strict";
        var n = {
            "wix-users": "user",
            "wix-events": "wixEvents"
        };
        e.exports.namespaceToSdk = function(e) {
            return n[e] || e.replace("wix-", "").replace(/-frontend$/, "")
        }, e.exports.sdkToNamespace = function(e) {
            return Object.keys(n).find(function(t) {
                return n[t] === e
            }) || "wix-".concat(e)
        }
    }, function(e, t, r) {
        "use strict";
        var n = r(2).buildNamespacesMap,
            o = r(0).namespaceToSdk;
        e.exports = {
            buildNamespacesMap: n,
            namespaceToSdk: o
        }
    }, function(e, t, r) {
        "use strict";
        var n = r(3).createWixFetch,
            o = r(0).sdkToNamespace;
        e.exports = {
            buildNamespacesMap: function(e, t) {
                var r = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : function(e) {
                    return e
                };
                return Object.keys(e).reduce(function(t, n) {
                    var i = e[n];
                    switch (n) {
                        case "events":
                            break;
                        default:
                            var u = o(n);
                            t[u] = r(i), t["".concat(u, "-frontend")] = r(i)
                    }
                    return t
                }, {
                    "wix-fetch": r(n(t))
                })
            }
        }
    }, function(e, t, r) {
        "use strict";

        function n(e) {
            "@babel/helpers - typeof";
            return (n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e) {
                return typeof e
            } : function(e) {
                return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
            })(e)
        }

        function o(e, t) {
            var r = Object.keys(e);
            if (Object.getOwnPropertySymbols) {
                var n = Object.getOwnPropertySymbols(e);
                t && (n = n.filter(function(t) {
                    return Object.getOwnPropertyDescriptor(e, t).enumerable
                })), r.push.apply(r, n)
            }
            return r
        }

        function i(e) {
            for (var t = 1; t < arguments.length; t++) {
                var r = null != arguments[t] ? arguments[t] : {};
                t % 2 ? o(Object(r), !0).forEach(function(t) {
                    u(e, t, r[t])
                }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : o(Object(r)).forEach(function(t) {
                    Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(r, t))
                })
            }
            return e
        }

        function u(e, t, r) {
            return (t = function(e) {
                var t = function(e, t) {
                    if ("object" != n(e) || !e) return e;
                    var r = e[Symbol.toPrimitive];
                    if (void 0 !== r) {
                        var o = r.call(e, t || "default");
                        if ("object" != n(o)) return o;
                        throw new TypeError("@@toPrimitive must return a primitive value.")
                    }
                    return ("string" === t ? String : Number)(e)
                }(e, "string");
                return "symbol" == n(t) ? t : String(t)
            }(t)) in e ? Object.defineProperty(e, t, {
                value: r,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = r, e
        }
        e.exports = {
            createWixFetch: function(e) {
                return {
                    fetch: e,
                    getJSON: function(t) {
                        var r = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
                            n = i(i({}, r), {}, {
                                method: "GET",
                                headers: i({
                                    Accept: "application/json"
                                }, r.headers)
                            });
                        return e(t, n).then(function(e) {
                            return e.json()
                        })
                    }
                }
            }
        }
    }])
});