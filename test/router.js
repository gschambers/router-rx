import { jsdom } from "jsdom";
import { Observable, Scheduler, Subject } from "rx";
import {
    compileRoutes,
    createRouter,
    getURLPath,
    matchRoute,
    observeHashChange } from "../src";

global.window = jsdom("<html><body></body></html>").defaultView;
global.document = window.document;
global.location = window.location;

var partial = function(obj, method, ...args) {
    return obj[method].bind(obj, ...args);
};

export default {
    tearDown(next) {
        location.hash = "";
        next();
    },

    testGetURLPath(test) {
        location.hash = "#!/foo/123";
        test.equal(getURLPath(), "/foo/123");

        location.hash = "#//bar/123";
        test.equal(getURLPath(), "/bar/123");

        location.hash = "/baz/123";
        test.equal(getURLPath(), "/baz/123");

        location.hash = "#quux/123";
        test.equal(getURLPath(), "/quux/123");

        location.hash = "blah/123";
        test.equal(getURLPath(), "/blah/123");

        test.done();
    },

    testObserveHashChange(test) {
        var expected = [
            "/",
            "/foo/123",
            "/bar/123"
        ];

        Observable.from(expected.slice(1))
            .observeOn(Scheduler.timeout)
            .forEach(path => location.hash = path);

        observeHashChange()
            .take(3)
            .doOnCompleted(() => test.done())
            .forEach(path => test.equal(path, expected.shift()));
    },

    testMatchRoute(test) {
        var a = () => {};
        var b = () => {};
        var c = () => {};

        var routes = compileRoutes({
            "/": a,
            "/foo/bar": b,
            "/foo/:id": c
        });

        var paths = [
            { value: "/", expected: a },
            { value: "/foo/bar", expected: b },
            { value: "/foo/quux", expected: c },
            { value: "/bar", expected: undefined },
            { value: "/foo/?!$+^/", expected: c }
        ];

        while (paths.length) {
            let path = paths.shift();
            let handler = matchRoute(routes, path.value);
            test.equal(path.expected, handler && handler[0]);
        }

        test.done();
    },

    testCreateRouter(test) {
        var spy = new Subject();

        var expected = [
            undefined,
            "123",
            "456"
        ];

        var done = function() {
            router.dispose();
            test.done();
        };

        spy.take(3)
            .doOnCompleted(done)
            .forEach(val => test.equal(val, expected.shift()));

        var router = createRouter({
            "/": partial(spy, "onNext"),
            "/foo/:id": partial(spy, "onNext"),
            "/bar/:id": partial(spy, "onNext")
        });

        var paths = [
            "/invalid/path",
            "/foo/123",
            "/invalid/path",
            "/bar/456"
        ];

        Observable.from(paths)
            .observeOn(Scheduler.timeout)
            .forEach(path => location.hash = path);
    }
};
