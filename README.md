# feathers-auth-test

> 

## About

This project is prepared to test feathers authentication using REST and socket.io.

## What's inside

Server is configured to have 2 protected endpoints in users service:

1. FIND: `users:find` protected by `@feathersjs/authentication.hooks.authenticate('jwt')`
2. GET: `users:get` protected by `feathers-authentication-hooks.restrictToAuthenticated()` 

and specs to run against two transports (REST and socket.io) to test authorization:

`test/auth.test.js`:
1. should reject unauthorized access
    - When not logged in - both endpoints should reject requests
2. should login correctly
    - Perform login routine that result in generating `accessToken`
3. should find all users (authenticate:jwt)
    - Requested FIND endpoint should be fulfilled after login
4. should get one user (restrictToAuthenticated)
    - Requested GET endpoint should be fulfilled after login
5. authtoken should be expired now
    - Wait for `authToken` to expire 
6. should reject to find users (authenticate:jwt)
    - Requested FIND endpoint should be rejected after `authToken` expiration
7. should reject to get user (restrictToAuthenticated)  
    - Requested GET endpoint should be rejected after `authToken` expiration

## How to run

Run npm scipt: `npm run mocha:auth`

## Test results

Response messages are either misleading or not consistent in comparison to other transports. Therefore it breaks transport agnosticism rule.  

### Socket.io failed tests:

#### 6. should reject to find users (authenticate:jwt)
```
    Socket.io tests
        6. should reject to find users (authenticate:jwt):
            AssertionError: expected promise to be rejected with an error including 'jwt expired' but it was fulfilled with { Object (total, limit, ...) }
```

I expect that after the token expires, I should get `jwt expired` error message, but `authenticate('jwt')` method is fulfilling the request regardless of token expiration time. REST transport passes that test responding with `jwt expired`.

  
#### 7. should reject to get user (restrictToAuthenticated)
```
    Socket.io tests
        7. should reject to get user (restrictToAuthenticated):
            AssertionError: expected promise to be rejected with an error including 'You are not authenticated' but it was fulfilled with { Object (email, _id) }
```

I expect that after the token expires, I should get `jwt expired` error message, but `restrictToAuthenticated()` method is fulfilling the request regardless of token expiration time. REST transport passes that test responding with `jwt expired`. 

### REST failed tests:

#### 4. should get one user (restrictToAuthenticated)
```
   REST tests
        4. should get one user (restrictToAuthenticated):
            NotAuthenticated: You are not authenticated.
             at new NotAuthenticated (node_modules\@feathersjs\client\dist\feathers.js:508:17)
             at convert (node_modules\@feathersjs\client\dist\feathers.js:653:32)
             at toError (node_modules\@feathersjs\client\dist\feathers.js:94:9)
             at <anonymous>
             at process._tickCallback (internal/process/next_tick.js:188:7)
```

I expect that when passing valid access token, `restrictToAuthenticated()` method should parse token from request like `authenticate('jwt')` does, but it looks like it doesn't. Socket.io transport passes that test and fulfill the request. What's the purpose of having either `authenticate('jwt')` and `restrictToAuthenticated()` methods that produce different behavior and make authorization less predictable?  
