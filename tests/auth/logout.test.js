process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const session = require('supertest-session');
const myApp = require('../../app');
const { pool } = require('../../dbConfig');

const testAccount = { email:  'loginTestUser@gmail.com', password: '123456' }

const loginUrl = '/users/login',
    successfulLogoutRedirect = '/users/login',
    failedLogoutRedirect = '/users/login';

const logoutUrl = '/users/logout';

const successfulLoginRedirect = '/users/dashboard';

let basicSession = null;
 
beforeEach(() => {
    basicSession = session(myApp);
});

afterAll(async () => {
    pool.end();
});

describe('Authentication: Logout | GET /users/logout', () => {
    describe('Given the user is Authenticated', () => {
        // Authenticate User
        beforeEach((done) => {
            basicSession.post(loginUrl).type('form')
            .send(testAccount)
            .expect(302) 
            .expect('Location', successfulLoginRedirect)
            .end(function (err) {
                if (err) return done(err);
                authenticatedSession = basicSession; // save the session
                return done();
            });
        });

        // HAPPY
        test(`should redirect to ${successfulLogoutRedirect} if logout SUCCEEDED`, async () => {
            const loggedInResponse = await authenticatedSession.get(logoutUrl);
            expect(loggedInResponse.statusCode).toEqual(302);
            expect(loggedInResponse.headers.location).toEqual(successfulLogoutRedirect);
        });
    });

    describe('Given the user is NOT Authenticated', () => {
        // SAD - user manually inputs the url in the browser or something like postman while not being authenticated
        test(`should redirect to ${failedLogoutRedirect} if ${loginUrl} route failed`, async () => {
            const loggedInResponse = await basicSession.get(logoutUrl);
            expect(loggedInResponse.statusCode).toEqual(302);
            expect(loggedInResponse.headers.location).toEqual(failedLogoutRedirect);
        });
    });
});