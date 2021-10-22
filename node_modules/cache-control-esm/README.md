# cache-control

> Format and parse HTTP Cache-Control header

:warning: This is a fork of the original [`@tusbar/cache-control`](https://github.com/tusbar/cache-control) package.

This package uses `export default` instead of `module.exports` to expose the code and was specifically modified to be
bundled by [`axios-cache-adapter`](https://github.com/rascarlito/axios-cache-adapter).

## Getting started

```bash
$ npm install @rascarlito/cache-control
```

## API

This library exposes a `CacheControl` class and two shortcut methods: `parse()` and `format()`.

### `parse(header)`

```js
import { parse } from '@rascarlito/cache-control'
```

`parse()` takes `Cache-Control` HTTP header value and returns a `CacheControl` instance.

For example, `parse('max-age=31536000, public')` will return

```js
CacheControl {
  maxAge: 31536000,
  sharedMaxAge: null,
  maxStale: false,
  maxStaleDuration: null,
  minFresh: null,
  immutable: false,
  mustRevalidate: false,
  noCache: false,
  noStore: false,
  noTransform: false,
  onlyIfCached: false,
  private: false,
  proxyRevalidate: false,
  public: true
}
```

### `format(cacheControl)`

```js
import { format } from '@rascarlito/cache-control'
```

`format()` takes a `CacheControl` instance (or similar object) and returns a `Cache-Control` HTTP header value.

For example, `format({maxAge: 31536000, public: true})` will return

```js
max-age=31536000, public
```

## Example usage

```js
res.setHeader('Cache-Control', format({
  public: true,
  immutable: true
}))
```

## FAQ

**Why another cache-control library?**

None of the existing libraries focus on just parsing the `Cache-Control` headers. There are some that expose Express (or connect-like) middlewares, and some unmaintained other ones that do rudimentary parsing of the header. The idea of this module is to parse the header according to the RFC with no further analysis or integration.


## See also

- [`cachecontrol`](https://github.com/pquerna/cachecontrol): Golang HTTP Cache-Control Parser and Interpretation


## License

MIT


## Miscellaneous

```
    ╚⊙ ⊙╝
  ╚═(███)═╝
 ╚═(███)═╝
╚═(███)═╝
 ╚═(███)═╝
  ╚═(███)═╝
   ╚═(███)═╝
```
