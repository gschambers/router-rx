import {
    CompositeDisposable,
    Observable,
    SerialDisposable } from "rx";

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

/** @return {Rx.Disposable} */
export var createRouter = function(routes) {
    var route = new SerialDisposable();

    var subscription =
        observeHashChange()
            .filter(path => routes.hasOwnProperty(path))
            .forEach(path => {
                route.setDisposable(routes[path]());
            });

    return new CompositeDisposable(
        subscription,
        route
    );
};
