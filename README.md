# router-rx [![Build Status](https://travis-ci.org/lipsmack/router-rx.svg?branch=master)](https://travis-ci.org/lipsmack/router-rx) [![Dependencies Status](https://david-dm.org/lipsmack/router-rx.svg)](https://david-dm.org/lipsmack/router-rx) [![npm version](https://badge.fury.io/js/router-rx.svg)](http://badge.fury.io/js/router-rx)

A simple application router built around reactive principles.

_**Note:** router-rx currently only implements browser routing via hashChange. History API (pushState) and Node.js routing to follow._

## Installation

`npm install router-rx`

## Usage

```javascript
import { createRouter, redirect } from "router-rx";
import { Disposable } from "rx";

const handler = function(id) {
    // Do something

    // Optional. Disposed on route change or tear down
    return Disposable.create(function() {
        // ...
    });
};

const router = createRouter({
    "/": redirect("/foo"),
    "/foo": handler,
    "/foo/:id": handler
});

// Tear down when finished
router.dispose();
```

## API

`Disposable createRouter( Object<String, Function> );`

Create a new router, mapping path strings to handler functions. Handler functions can optionally return an instance of `Rx.Disposable`, which will be automatically disposed when the route is changed or the containing router is disposed.

`Function redirect( String path, Boolean invoke );`

Create a handler function that redirects to a specified `path`. If `invoke` is true, the handler is called immediately.

## TODO

* History API
* Node.js routing

## License

MIT
