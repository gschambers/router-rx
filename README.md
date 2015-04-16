# router-rx

A simple application router built around reactive principles.

_**Note:** router-rx currently only implements browser routing via hashChange. History API (pushState) and Node.js routing to follow._

## Installation

`npm install router-rx`

## Usage

```javascript
import { createRouter } from "router-rx";
import { Disposable } from "rx";

var handler = function() {
    // ...

    // Optional. Disposed on route change or tear down
    return Disposable.create(function() {
        // ...
    });
};

var router = createRouter({
    "/": handler
});

// Tear down when finished
router.dispose();
```

## API

`Disposable createRouter( Object<String, Function> );`

Create a new router, mapping path strings to handler functions. Handler functions can optionally return an instance of `Rx.Disposable`, which will be automatically disposed when the route is changed or the containing router is disposed.

## License

MIT
