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
export const compileRoutes = function(routes) {
    return Object.keys(routes).map(path => {
        const handler = routes[path];

        path = path
            .replace(PARAM, "([^/]+)")
            .replace(TRAILING_SLASHES, "/*");

        const pattern = new RegExp(`^${path}$`);

        return [pattern, handler];
    });
};

/**
 * @internal
 * @return {String}
 */
export const getURLPath = function() {
    return location.hash.replace(/^#!?\/*/, "/");
};

/**
 * @internal
 * @return {Rx.Observable}
 */
export const observeHashChange = function() {
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
export const matchRoute = function(routes, path) {
    let i = 0;
    const len = routes.length;

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
const isValidHandler = function(handler) {
    return Array.isArray(handler) &&
        typeof handler[0] === "function";
};

/**
 * @param {Object<String, Function>} routes
 * @return {Rx.Disposable}
 */
export const createRouter = function(routes) {
    const active = new SerialDisposable();

    routes = compileRoutes(routes);

    const subscription =
        observeHashChange()
            .map(path => matchRoute(routes, path))
            .filter(isValidHandler)
            .forEach(handler => {
                const [ fn, ...args ] = handler;
                active.setDisposable(fn(...args));
            });

    return new CompositeDisposable(
        subscription,
        active
    );
};
