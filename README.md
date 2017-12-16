# feathers-auth-test

> 

## About

This project is prepared to test feathers authentication using REST and socket.io.

## What's inside

Server is configured to have 2 protected endpoints in users service:

1. FIND: `users:find` protected by `@feathersjs/authentication.hooks.authenticate('jwt')`
2. GET: `users:get` protected by `feathers-authentication-hooks.restrictToAuthenticated()` 

and test spec for testing feathers REST and socket.io authorization

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

## Testing

Run npm scipt: `npm run mocha:auth`

## Test results

### All test spec pass except the following:

```
1) Feathers authorization
       Transports
         Socket.io tests
           should reject to find users (authenticate:jwt):

      AssertionError: expected promise to be rejected with an error including 'jwt expired' but got 'No auth token'
      + expected - actual

      -No auth token
      +jwt expired
```
  
```
  2) Feathers authorization
       Transports
         Socket.io tests
           should reject to get user (restrictToAuthenticated):
     AssertionError: expected promise to be rejected with an error including 'You are not authenticated' but it was fulfilled with { Object (email, _id) }
```


```
  3) Feathers authorization
       Transports
         REST tests
           should get one user (restrictToAuthenticated):
     NotAuthenticated: You are not authenticated.
      at new NotAuthenticated (node_modules\@feathersjs\client\dist\feathers.js:508:17)
      at convert (node_modules\@feathersjs\client\dist\feathers.js:653:32)
      at toError (node_modules\@feathersjs\client\dist\feathers.js:94:9)
      at <anonymous>
      at process._tickCallback (internal/process/next_tick.js:188:7)
```
