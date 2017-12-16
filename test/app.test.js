const assert = require('assert');
const rp = require('request-promise');
const url = require('url');
const app = require('../src/app');
const feathersClient = require('@feathersjs/client');
const socketio = require('socket.io-client');
const chai = require('chai');
const { expect } = chai;
const chaiAsPromised = require("chai-as-promised");
const jwtDecode = require('jwt-decode');
chai.use(chaiAsPromised);

const port = app.get('port') || 3030;
const getUrl = pathname => url.format({
  hostname: app.get('host') || 'localhost',
  protocol: 'http',
  port,
  pathname
});

const credentials = {
  email: 'test@example.com',
  password: 'opensesame',
}

describe('Feathers application tests', () => {
  before(function(done) {
    this.server = app.listen(port);
    this.server.once('listening', () => done());
  });

  after(function() {
    // socket.io is blocking this
    // this.server.close(done);
  });

  it('starts and shows the index page', () => {
    return rp(getUrl()).then(body =>
      assert.ok(body.indexOf('<html>') !== -1)
    );
  });

  describe('404', function() {
    it('shows a 404 HTML page', () => {
      return rp({
        url: getUrl('path/to/nowhere'),
        headers: {
          'Accept': 'text/html'
        }
      }).catch(res => {
        assert.equal(res.statusCode, 404);
        assert.ok(res.error.indexOf('<html>') !== -1);
      });
    });

    it('shows a 404 JSON error without stack trace', () => {
      return rp({
        url: getUrl('path/to/nowhere'),
        json: true
      }).catch(res => {
        assert.equal(res.statusCode, 404);
        assert.equal(res.error.code, 404);
        assert.equal(res.error.message, 'Page not found');
        assert.equal(res.error.name, 'NotFound');
      });
    });
  });

  describe.only('Authentication tests', () => {
    describe('REST tests', function () {

    })

    describe('Socket.io tests', function () {
      before(async () => {
        this.socket = socketio(getUrl());

        this.client = feathersClient()
          .configure(feathersClient.socketio(this.socket))

        this.userService = this.client.service('/users');

        const registered = await this.userService.create(credentials)

        expect(registered).to.have.property('email', credentials.email);
        expect(registered).to.have.property('_id')

        this.userId = registered._id;
        this.expectedUserObject = {
          email: credentials.email,
          _id: this.userId,
        }
      });

      after(async () => {
        if (this.userId) {
          await this.userService.remove(this.userId)
        }
      });

      it('should reject unauthorized access', () => {
        return Promise.all([
          expect(this.userService.find({})).to.be.rejectedWith('No auth token'),
          expect(this.userService.get(this.userId)).to.be.rejectedWith('You are not authenticated'),
        ])
      })

      it('should login correctly', (done) => {
        const suite = this;

        this.socket.emit('authenticate', {
          strategy: 'local',
          ...credentials
        }, function (message, data) {
          console.log('m', message)
          console.log('d', data)

          expect(message).to.be.null;
          expect(data).to.have.property('accessToken').to.be.a('string')

          suite.accessToken = data.accessToken;

          done();
        });
      })

      it('should find all users (authenticate:jwt)', async () => {
        const users = await this.userService.find({});

        expect(users).to.be.an('object').that.has.all.keys(['total', 'limit', 'skip', 'data'])
        expect(users.data).to.be.an('array')
          .and.have.lengthOf(1)

        expect(users.data[0]).to.eql(this.expectedUserObject)
      })

      it('should get one user (restrictToAuthenticated)', async () => {
        const user = await this.userService.get(this.userId);

        expect(user).to.deep.equal(this.expectedUserObject)
      })

      it('authtoken should be expired now', (done) => {
        const decoded = jwtDecode(this.accessToken)

        console.log(decoded);

        expect(decoded).be.an('object')
          .and.have.all.keys(["aud", "exp", "iat", "iss", "jti", "sub", "userId"])

        expect(decoded.userId).to.equal(this.userId)
        const exp = decoded.exp * 1000;
        const now = new Date().getTime();

        let remaining = exp - now;
        if (remaining < 0) {
          // already expired
          remaining = 0;
        }

        console.log('waiting for expiration', remaining / 1000, 's')
        setTimeout(() => {
          const now = new Date().getTime();
          expect(now).to.be.above(exp)
          done()
        }, remaining + 200)
      })
    })
  })
});
