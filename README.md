# redhioy-express

A small set of abstractions that will help you quickly build an Express.js app that consumes the Redhio API.

:exclamation: **This project is currently in alpha status**. This means that the API could change at any time. It also means that your feedback will have a big impact on how the project evolves, so please feel free to [open issues](https://github.com/redhio/redhio-express/issues) if there is something you would like to see added.


## Example

```javascript
const express = require('express');
const shopifyExpress = require('@redhio/redhio-express');
const session = require('express-session');

const app = express();

const {
  REDHIO_APP_KEY,
  REDHIO_APP_HOST,
  REDHIO_APP_SECRET,
  NODE_ENV,
} = process.env;

// session is necessary for api proxy and auth verification
app.use(session({secret: REDHIO_APP_SECRET}));

const {routes, withShop} = redhioExpress({
  host: REDHIO_APP_HOST,
  apiKey: REDHIO_APP_KEY,
  secret: REDHIO_APP_SECRET,
  scope: ['write_orders, write_products'],
  accessMode: 'offline',
  afterAuth(request, response) {
    const { session: { accessToken, shop } } = request;
    // install webhooks or hook into your own app here
    return response.redirect('/');
  },
});

// mounts '/auth' and '/api' off of '/redhio'
app.use('/redhio', routes);

// shields myAppMiddleware from being accessed without session
app.use('/myApp', withShop({authBaseUrl: '/redhio'}), myAppMiddleware)
```

## Redhio routes

```javascript
  const {routes} = redhioExpress(config);
  app.use('/', routes);
```

Provides mountable routes for authentication and API proxying. The authentication endpoint also handles shop session storage using a configurable storage strategy (defaults to SQLite).

### `/auth/redhio`

Serves a login endpoint so merchants can access your app with a shop session.

### `/api`

Proxies requests to the api for the currently logged in shop. Useful to securely use api
endpoints from a client application without having to worry about CORS.

## shopStore

`redhioExpress`'s config takes an optional `shopStore` key, You can use this to define a strategy for how the module will store your persistent data for user sessions.

### Strategies

By default the package comes with `MemoryStrategy`, `RedisStrategy`, and `SqliteStrategy`. If none are specified, the default is `MemoryStrategy`.

#### MemoryStrategy

Simple javascript object based memory store for development purposes. Do not use this in production!

```javascript
const redhioExpress = require('@redhio/redhio-express');
const {MemoryStrategy} = require('@redhio/redhio-express/strategies');

const redhio = redhioExpress({
  shopStore: new MemoryStrategy(redisConfig),
  ...restOfConfig,
});
```

#### RedisStrategy

Uses [redis](https://www.npmjs.com/package/redis) under the hood, so you can pass it any configuration that's valid for the library.

```javascript
const redhioExpress = require('@redhio/redhio-express');
const {RedisStrategy} = require('@redhio/redhio-express/strategies');

const redisConfig = {
  // your config here
};

const redhio = redhioExpress({
  shopStore: new RedisStrategy(redisConfig),
  ...restOfConfig,
});
```

#### SQLStrategy

Uses [knex](https://www.npmjs.com/package/knex) under the hood, so you can pass it any configuration that's valid for the library. By default it uses `sqlite3` so you'll need to run `yarn add sqlite3` to use it. Knex also supports `postgreSQL` and `mySQL`.

```javascript
const redhioExpress = require('@redhio/redhio-express');
const {SQLStrategy} = require('@redhio/redhio-express/strategies');

// uses sqlite3 if no settings are specified
const knexConfig = {
  // your config here
};

const redhio = redhioExpress({
  shopStore: new SQLStrategy(knexConfig),
  ...restOfConfig,
});
```

SQLStrategy expects a table named `shops` with a primary key `id`, and `string` fields for `redhio_domain` and `access_token`. It's recommended you index `redhio_domain` since it is used to look up tokens.

If you do not have a table already created for your store, you can generate one with `new SQLStrategy(myConfig).initialize()`. This returns a promise so you can finish setting up your app after it if you like, but we suggest you make a separate db initialization script, or keep track of your schema yourself.

#### Custom Strategy

`redhioExpress` accepts any javascript class matching the following interface:

```javascript
  class Strategy {
    // shop refers to the shop's domain name
    getShop({ shop }): Promise<{accessToken: string}>
    // shop refers to the shop's domain name
    storeShop({ shop, accessToken }): Promise<{accessToken: string}>
  }
```

## Helper middleware

`const {middleware: {withShop, withWebhook}} = redhioExpress(config);`

### `withShop`

`app.use('/someProtectedPath', withShop({authBaseUrl: '/redhio'}), someHandler);`

Express middleware that validates the presence of your shop session. The parameter you pass to it should match the base URL for where you've mounted the shopify routes.

### `withWebhook`

`app.use('/someProtectedPath', withWebhook, someHandler);`

Express middleware that validates the presence of a valid HMAC signature to allow webhook requests from shopify to your app.

## Example app

You can look at [redhio-node-app](https://github.com/redhio/redhio-node-app) for a complete working example.

## Gotchas

### Install route
For the moment the app expects you to mount your install route at `/install`. See [redhio-node-app](https://github.com/redhio/redhio-node-app) for details.

### Express Session
This library expects [express-session](https://www.npmjs.com/package/express-session) or a compatible library to be installed and set up for much of it's functionality. Api Proxy and auth verification functions won't work without something putting a `session` key on `request`.

It is possible to use auth without a session key on your request, but not recommended.

### Body Parser
This library handles body parsing on it's own for webhooks. If you're using webhooks you should make sure to follow express best-practices by only adding your body parsing middleware to specific routes that need it.

**Good**
```javascript
  app.use('/some-route', bodyParser.json(), myHandler);

  app.use('/webhook', withWebhook(myWebhookHandler));
  app.use('/', redhioExpress.routes);
```

**Bad**
```javascript
  app.use(bodyParser.json());
  app.use('/some-route', myHandler);

  app.use('/webhook', withWebhook(myWebhookHandler));
  app.use('/', redhioExpress.routes);
```


## Contributing

Contributions are welcome. Please refer to the [contributing guide](https://github.com/redhIO/redhio-express/blob/master/CONTRIBUTING.md) for more details.
