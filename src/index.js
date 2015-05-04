import {
    CompositeDisposable,
    Observable,
    SerialDisposable } from "rx";

const SUPPORTS_HISTORY_API = window.history && "pushState" in window.history;

const PARAM = /:[^\/]+/g;
const TRAILING_SLASHES = /\/*$/;
const EMPTY = /^$/;

const HASH_PREFIX = /^#!?\/*/;
const PATH_PREFIX = /^\/*/;

/**
 * @internal
 * @type {Boolean}
 */
export let shouldUseHistory = false;

/** @param {Boolean} value */
export const useHistory = function(value) {
    if (SUPPORTS_HISTORY_API) {
        shouldUseHistory = value;
    }
};

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
export const getHashPath = function() {
    return location.hash
        .replace(HASH_PREFIX, "/")
        .replace(EMPTY, "/");
};

/**
 * @internal
 * @return {Rx.Observable}
 */
export const observeHashChange = function() {
    return Observable.fromEvent(window, "hashchange")
        .map(getHashPath)
        .startWith(getHashPath());
};

/**
 * @internal
 * @return {String}
 */
export const getURLPath = function() {
    return location.pathname.replace(PATH_PREFIX, "/");
};

/**
 * @internal
 * @return {Rx.Observable}
 */
export const observeStateChange = function() {
    return Observable.merge(
        Observable.fromEvent(window, "popstate"),
        Observable.fromEvent(window, "pushstate"))
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

    const source = shouldUseHistory ?
        observeStateChange() :
        observeHashChange();

    const subscription =
        source
            .distinctUntilChanged()
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

/**
 * @param {String} path
 * @param {Boolean} invoke
 */
export const redirect = function(path, invoke=false) {
    const controller = function() {
        if (shouldUseHistory) {
            if (path !== getURLPath()) {
                history.pushState(null, null, path);
                const evt = document.createEvent("Event");
                evt.initEvent("pushstate", true, true);
                window.dispatchEvent(evt);
            }
        } else {
            location.hash = path;
        }
    };

    if (!invoke) {
        return controller;
    }

    controller();
};
