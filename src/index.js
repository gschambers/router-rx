import {
    CompositeDisposable,
    Observable,
    SerialDisposable } from "rx";

const PARAM = /:[^\/]+/g;
const TRAILING_SLASHES = /\/*$/;

/**
 * @internal
 * @param {Object<String, Function>} routes
 * @return {Array<[RegExp, Function]>}
 */
export var compileRoutes = function(routes) {
    return Object.keys(routes).map(path => {
        var handler = routes[path];

        path = path
            .replace(PARAM, "([^/]+)")
            .replace(TRAILING_SLASHES, "/*");

        var pattern = new RegExp(`^${path}$`);

        return [pattern, handler];
    });
};

/**
 * @internal
 * @return {String}
 */
export var getURLPath = function() {
    return location.hash.replace(/^#!?\/*/, "/");
};

/**
 * @internal
 * @return {Rx.Observable}
 */
export var observeHashChange = function() {
    return Observable.fromEvent(window, "hashchange")
        .map(getURLPath)
        .startWith(getURLPath());
};

/**
 * @internal
 * @param {[RegExp, Function]} routes
 * @param {String}
 * @return {Array}
 */
export var matchRoute = function(routes, path) {
    var i = 0;
    var len = routes.length;

    while (i < len) {
        let [ pattern, fn ] = routes[i];
        let match = pattern.exec(path);

        if (match) {
            return [fn].concat(match.slice(1));
        }

        i++;
    }
};

/**
 * @param {Array} handler
 * @return {Boolean}
 */
var isValidHandler = function(handler) {
    return Array.isArray(handler) &&
        typeof handler[0] === "function";
};

/**
 * @param {Object<String, Function>} routes
 * @return {Rx.Disposable}
 */
export var createRouter = function(routes) {
    var active = new SerialDisposable();

    routes = compileRoutes(routes);

    var subscription =
        observeHashChange()
            .map(path => matchRoute(routes, path))
            .filter(isValidHandler)
            .forEach(handler => {
                var [ fn, ...args ] = handler;
                active.setDisposable(fn(...args));
            });

    return new CompositeDisposable(
        subscription,
        active
    );
};
