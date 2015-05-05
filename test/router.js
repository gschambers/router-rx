import { Observable, Scheduler, Subject } from "rx";
import {
    compileRoutes,
    createRouter,
    getHashPath,
    getURLPath,
    matchRoute,
    observeHashChange,
    observeStateChange,
    redirect,
    shouldUseHistory,
    useHistory } from "../src";

const partial = function(obj, method, ...args) {
    return obj[method].bind(obj, ...args);
};

const testObserveChange = function(test, source) {
    const expected = [
        "/",
        "/foo/123",
        "/bar/123"
    ];

    Observable.from(expected.slice(1))
        .observeOn(Scheduler.timeout)
        .forEach(path => redirect(path, true));

    source
        .take(3)
        .doOnCompleted(() => test.done())
        .forEach(path => test.equal(path, expected.shift()));
};

const testCreateRouter = function(test) {
    const spy = new Subject();

    const expected = [
        undefined,
        123,
        456
    ];

    const done = function() {
        router.dispose();
        test.done();
    };

    spy.take(3)
        .doOnCompleted(done)
        .forEach(val => test.strictEqual(val, expected.shift()));

    const router = createRouter({
        "/": partial(spy, "onNext"),
        "/foo/:id": partial(spy, "onNext"),
        "/bar/:id": partial(spy, "onNext")
    });

    const paths = [
        "/invalid/path",
        "/foo/123",
        "/invalid/path",
        "/bar/456"
    ];

    Observable.from(paths)
        .observeOn(Scheduler.timeout)
        .forEach(path => redirect(path, true));
};

export default {
    tearDown(next) {
        useHistory(false);
        location.hash = "";
        location.href = "/";
        next();
    },

    testGetHashPath(test) {
        location.hash = "#!/foo/123";
        test.equal(getHashPath(), "/foo/123");

        location.hash = "#//bar/123";
        test.equal(getHashPath(), "/bar/123");

        location.hash = "/baz/123";
        test.equal(getHashPath(), "/baz/123");

        location.hash = "#quux/123";
        test.equal(getHashPath(), "/quux/123");

        location.hash = "blah/123";
        test.equal(getHashPath(), "/blah/123");

        test.done();
    },

    testGetURLPath(test) {
        location.href = "/foo/123";
        test.equal(getURLPath(), "/foo/123");
        test.done();
    },

    testObserveHashChange(test) {
        test.strictEqual(shouldUseHistory, false);
        testObserveChange(test, observeHashChange());
    },

    testObserveStateChange(test) {
        useHistory(true);
        test.strictEqual(shouldUseHistory, true);
        testObserveChange(test, observeStateChange());
    },

    testMatchRoute(test) {
        const a = () => {};
        const b = () => {};
        const c = () => {};

        const routes = compileRoutes({
            "/": a,
            "/foo/bar": b,
            "/foo/:id": c
        });

        const paths = [
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

    testCreateRouterWithHashChange(test) {
        test.strictEqual(shouldUseHistory, false);
        testCreateRouter(test);
    },

    testCreateRouterWithHistory(test) {
        useHistory(true);
        test.strictEqual(shouldUseHistory, true);
        testCreateRouter(test);
    },

    testRedirect(test) {
        const spy = new Subject();

        const expected = [
            123,
            456
        ];

        const done = function() {
            router.dispose();
            test.done();
        };

        spy.take(2)
            .doOnCompleted(done)
            .forEach(val => test.strictEqual(val, expected.shift()));

        const router = createRouter({
            "/bar": redirect("/baz/123"),
            "/foo/:id": partial(spy, "onNext"),
            "/baz/:id": id => {
                spy.onNext(id);
                redirect("/foo/456", true);
            }
        });

        redirect("/bar", true);
    }
};
