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
            .replace(PARAM, "[^/]+")
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
 * @return {Function?}
 */
export var matchRoute = function(routes, path) {
    var route = routes.find(route => {
        return route[0].test(path);
    });

    if (route) {
        return route[1];
    }
};

/**
 * @param {Function} handler
 * @return {Boolean}
 */
var isValidHandler = function(handler) {
    return typeof handler === "function";
};

/**
 * @param {[RegExp, Function]} routes
 * @return {Rx.Disposable}
 */
export var createRouter = function(routes) {
    var route = new SerialDisposable();

    routes = compileRoutes(routes);

    var subscription =
        observeHashChange()
            .map(path => matchRoute(routes, path))
            .filter(isValidHandler)
            .forEach(handler => {
                route.setDisposable(handler());
            });

    return new CompositeDisposable(
        subscription,
        route
    );
};
